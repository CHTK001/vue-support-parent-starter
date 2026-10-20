import { o as __toESM, t as __commonJSMin } from "./rolldown-runtime-CEgmsyvS.js";
import { t as echarts_compat_default } from "./echarts-compat-C1tiQKE2.js";
import { $ as createOrUpdateFromFlatCoordinates, B as clamp, C as disableCoordinateWarning, D as get$1, E as fromUserExtent, F as add, G as toRadians, H as modulo, I as equals, J as containsExtent, K as clone, L as rotate$1, M as toUserExtent, N as transform, O as getTransform, P as warn, Q as createOrUpdateFromCoordinate, R as scale$1, T as fromUserCoordinate, U as squaredDistance, V as lerp, W as squaredSegmentDistance, X as createEmpty, Y as containsXY, Z as createOrUpdateEmpty, _ as Disposable, a as EventType_default$2, at as getHeight, c as TRUE, ct as intersects, d as toPromise, dt as returnOrUpdate, et as equals$2, f as ascending, g as BaseEvent, gt as METERS_PER_UNIT, h as linearFindNearest, i as unlistenByKey, it as getForViewAndSize, j as toUserCoordinate, k as getUserProjection, l as VOID, lt as intersectsSegment, m as extend, mt as isEmpty, n as unByKey, nt as forEachCorner, o as Target, ot as getIntersection, p as equals$1, pt as clear, q as closestSquaredDistanceXY, r as listen, rt as getCenter, s as FALSE, st as getWidth, t as Observable, tt as extendFlatCoordinates, u as memoizeOne, ut as isEmpty$1, x as createProjection, z as wrapX } from "./Observable-B4Z7HGwF.js";
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/ObjectEventType.js
/**
* @module ol/ObjectEventType
*/
/**
* @enum {string}
*/
var ObjectEventType_default = { 
/**
* Triggered when a property is changed.
* @event module:ol/Object.ObjectEvent#propertychange
* @api
*/
PROPERTYCHANGE: "propertychange" };
/**
* @typedef {'propertychange'} Types
*/
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/util.js
/**
* @module ol/util
*/
/**
* @return {never} Any return.
*/
function abstract() {
	throw new Error("Unimplemented abstract method.");
}
/**
* Counter for getUid.
* @type {number}
* @private
*/
var uidCounter_ = 0;
/**
* Gets a unique ID for an object. This mutates the object so that further calls
* with the same object as a parameter returns the same value. Unique IDs are generated
* as a strictly increasing sequence. Adapted from goog.getUid.
*
* @param {Object} obj The object to get the unique ID for.
* @return {string} The unique ID for the object.
* @api
*/
function getUid(obj) {
	return obj.ol_uid || (obj.ol_uid = String(++uidCounter_));
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/Object.js
/**
* @module ol/Object
*/
/**
* @classdesc
* Events emitted by {@link module:ol/Object~BaseObject} instances are instances of this type.
*/
var ObjectEvent = class extends BaseEvent {
	/**
	* @param {string} type The event type.
	* @param {string} key The property name.
	* @param {*} oldValue The old value for `key`.
	*/
	constructor(type, key, oldValue) {
		super(type);
		/**
		* The name of the property whose value is changing.
		* @type {string}
		* @api
		*/
		this.key = key;
		/**
		* The old value. To get the new value use `e.target.get(e.key)` where
		* `e` is the event object.
		* @type {*}
		* @api
		*/
		this.oldValue = oldValue;
	}
};
/***
* @template Return
* @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
*    import("./Observable").OnSignature<import("./ObjectEventType").Types, ObjectEvent, Return> &
*    import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|import("./ObjectEventType").Types, Return>} ObjectOnSignature
*/
/**
* @classdesc
* Abstract base class; normally only used for creating subclasses and not
* instantiated in apps.
* Most non-trivial classes inherit from this.
*
* This extends {@link module:ol/Observable~Observable} with observable
* properties, where each property is observable as well as the object as a
* whole.
*
* Classes that inherit from this have pre-defined properties, to which you can
* add your owns. The pre-defined properties are listed in this documentation as
* 'Observable Properties', and have their own accessors; for example,
* {@link module:ol/Map~Map} has a `target` property, accessed with
* `getTarget()` and changed with `setTarget()`. Not all properties are however
* settable. There are also general-purpose accessors `get()` and `set()`. For
* example, `get('target')` is equivalent to `getTarget()`.
*
* The `set` accessors trigger a change event, and you can monitor this by
* registering a listener. For example, {@link module:ol/View~View} has a
* `center` property, so `view.on('change:center', function(evt) {...});` would
* call the function whenever the value of the center property changes. Within
* the function, `evt.target` would be the view, so `evt.target.getCenter()`
* would return the new center.
*
* You can add your own observable properties with
* `object.set('prop', 'value')`, and retrieve that with `object.get('prop')`.
* You can listen for changes on that property value with
* `object.on('change:prop', listener)`. You can get a list of all
* properties with {@link module:ol/Object~BaseObject#getProperties}.
*
* Note that the observable properties are separate from standard JS properties.
* You can, for example, give your map object a title with
* `map.title='New title'` and with `map.set('title', 'Another title')`. The
* first will be a `hasOwnProperty`; the second will appear in
* `getProperties()`. Only the second is observable.
*
* Properties can be deleted by using the unset method. E.g.
* object.unset('foo').
*
* @fires ObjectEvent
* @api
*/
var BaseObject = class extends Observable {
	/**
	* @param {Object<string, *>} [values] An object with key-value pairs.
	*/
	constructor(values) {
		super();
		/***
		* @type {ObjectOnSignature<import("./events").EventsKey>}
		*/
		this.on;
		/***
		* @type {ObjectOnSignature<import("./events").EventsKey>}
		*/
		this.once;
		/***
		* @type {ObjectOnSignature<void>}
		*/
		this.un;
		getUid(this);
		/**
		* @private
		* @type {Object<string, *>|null}
		*/
		this.values_ = null;
		if (values !== void 0) this.setProperties(values);
	}
	/**
	* Gets a value.
	* @param {string} key Key name.
	* @return {*} Value.
	* @api
	*/
	get(key) {
		let value;
		if (this.values_ && this.values_.hasOwnProperty(key)) value = this.values_[key];
		return value;
	}
	/**
	* Get a list of object property names.
	* @return {Array<string>} List of property names.
	* @api
	*/
	getKeys() {
		return this.values_ && Object.keys(this.values_) || [];
	}
	/**
	* Get an object of all property names and values.
	* @return {Object<string, *>} Object.
	* @api
	*/
	getProperties() {
		return this.values_ && Object.assign({}, this.values_) || {};
	}
	/**
	* Get an object of all property names and values.
	* @return {Object<string, *>?} Object.
	*/
	getPropertiesInternal() {
		return this.values_;
	}
	/**
	* @return {boolean} The object has properties.
	*/
	hasProperties() {
		return !!this.values_;
	}
	/**
	* @param {string} key Key name.
	* @param {*} oldValue Old value.
	*/
	notify(key, oldValue) {
		let eventType;
		eventType = `change:${key}`;
		if (this.hasListener(eventType)) this.dispatchEvent(new ObjectEvent(eventType, key, oldValue));
		eventType = ObjectEventType_default.PROPERTYCHANGE;
		if (this.hasListener(eventType)) this.dispatchEvent(new ObjectEvent(eventType, key, oldValue));
	}
	/**
	* @param {string} key Key name.
	* @param {import("./events.js").Listener} listener Listener.
	*/
	addChangeListener(key, listener) {
		this.addEventListener(`change:${key}`, listener);
	}
	/**
	* @param {string} key Key name.
	* @param {import("./events.js").Listener} listener Listener.
	*/
	removeChangeListener(key, listener) {
		this.removeEventListener(`change:${key}`, listener);
	}
	/**
	* Sets a value.
	* @param {string} key Key name.
	* @param {*} value Value.
	* @param {boolean} [silent] Update without triggering an event.
	* @api
	*/
	set(key, value, silent) {
		const values = this.values_ || (this.values_ = {});
		if (silent) values[key] = value;
		else {
			const oldValue = values[key];
			values[key] = value;
			if (oldValue !== value) this.notify(key, oldValue);
		}
	}
	/**
	* Sets a collection of key-value pairs.  Note that this changes any existing
	* properties and adds new ones (it does not remove any existing properties).
	* @param {Object<string, *>} values Values.
	* @param {boolean} [silent] Update without triggering an event.
	* @api
	*/
	setProperties(values, silent) {
		for (const key in values) this.set(key, values[key], silent);
	}
	/**
	* Apply any properties from another object without triggering events.
	* @param {BaseObject} source The source object.
	* @protected
	*/
	applyProperties(source) {
		if (!source.values_) return;
		Object.assign(this.values_ || (this.values_ = {}), source.values_);
	}
	/**
	* Unsets a property.
	* @param {string} key Key name.
	* @param {boolean} [silent] Unset without triggering an event.
	* @api
	*/
	unset(key, silent) {
		if (this.values_ && key in this.values_) {
			const oldValue = this.values_[key];
			delete this.values_[key];
			if (isEmpty(this.values_)) this.values_ = null;
			if (!silent) this.notify(key, oldValue);
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/CollectionEventType.js
/**
* @module ol/CollectionEventType
*/
/**
* @enum {string}
*/
var CollectionEventType_default = {
	/**
	* Triggered when an item is added to the collection.
	* @event module:ol/Collection.CollectionEvent#add
	* @api
	*/
	ADD: "add",
	/**
	* Triggered when an item is removed from the collection.
	* @event module:ol/Collection.CollectionEvent#remove
	* @api
	*/
	REMOVE: "remove"
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/Collection.js
/**
* @module ol/Collection
*/
/**
* @enum {string}
* @private
*/
var Property$2 = { LENGTH: "length" };
/**
* @classdesc
* Events emitted by {@link module:ol/Collection~Collection} instances are instances of this
* type.
* @template T
*/
var CollectionEvent = class extends BaseEvent {
	/**
	* @param {import("./CollectionEventType.js").default} type Type.
	* @param {T} element Element.
	* @param {number} index The index of the added or removed element.
	*/
	constructor(type, element, index) {
		super(type);
		/**
		* The element that is added to or removed from the collection.
		* @type {T}
		* @api
		*/
		this.element = element;
		/**
		* The index of the added or removed element.
		* @type {number}
		* @api
		*/
		this.index = index;
	}
};
/***
* @template T
* @template Return
* @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
*   import("./Observable").OnSignature<import("./ObjectEventType").Types|'change:length', import("./Object").ObjectEvent, Return> &
*   import("./Observable").OnSignature<'add'|'remove', CollectionEvent<T>, Return> &
*   import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|import("./ObjectEventType").Types|
*     'change:length'|'add'|'remove',Return>} CollectionOnSignature
*/
/**
* @typedef {Object} Options
* @property {boolean} [unique=false] Disallow the same item from being added to
* the collection twice.
*/
/**
* @classdesc
* An expanded version of standard JS Array, adding convenience methods for
* manipulation. Add and remove changes to the Collection trigger a Collection
* event. Note that this does not cover changes to the objects _within_ the
* Collection; they trigger events on the appropriate object, not on the
* Collection as a whole.
*
* @fires CollectionEvent
*
* @template T
* @api
*/
var Collection = class extends BaseObject {
	/**
	* @param {Array<T>} [array] Array.
	* @param {Options} [options] Collection options.
	*/
	constructor(array, options) {
		super();
		/***
		* @type {CollectionOnSignature<T, import("./events").EventsKey>}
		*/
		this.on;
		/***
		* @type {CollectionOnSignature<T, import("./events").EventsKey>}
		*/
		this.once;
		/***
		* @type {CollectionOnSignature<T, void>}
		*/
		this.un;
		options = options || {};
		/**
		* @private
		* @type {boolean}
		*/
		this.unique_ = !!options.unique;
		/**
		* @private
		* @type {!Array<T>}
		*/
		this.array_ = array ? array : [];
		if (this.unique_) for (let i = 0, ii = this.array_.length; i < ii; ++i) this.assertUnique_(this.array_[i], i);
		this.updateLength_();
	}
	/**
	* Remove all elements from the collection.
	* @api
	*/
	clear() {
		while (this.getLength() > 0) this.pop();
	}
	/**
	* Add elements to the collection.  This pushes each item in the provided array
	* to the end of the collection.
	* @param {!Array<T>} arr Array.
	* @return {Collection<T>} This collection.
	* @api
	*/
	extend(arr) {
		for (let i = 0, ii = arr.length; i < ii; ++i) this.push(arr[i]);
		return this;
	}
	/**
	* Iterate over each element, calling the provided callback.
	* @param {function(T, number, Array<T>): *} f The function to call
	*     for every element. This function takes 3 arguments (the element, the
	*     index and the array). The return value is ignored.
	* @api
	*/
	forEach(f) {
		const array = this.array_;
		for (let i = 0, ii = array.length; i < ii; ++i) f(array[i], i, array);
	}
	/**
	* Get a reference to the underlying Array object. Warning: if the array
	* is mutated, no events will be dispatched by the collection, and the
	* collection's "length" property won't be in sync with the actual length
	* of the array.
	* @return {!Array<T>} Array.
	* @api
	*/
	getArray() {
		return this.array_;
	}
	/**
	* Get the element at the provided index.
	* @param {number} index Index.
	* @return {T} Element.
	* @api
	*/
	item(index) {
		return this.array_[index];
	}
	/**
	* Get the length of this collection.
	* @return {number} The length of the array.
	* @observable
	* @api
	*/
	getLength() {
		return this.get(Property$2.LENGTH);
	}
	/**
	* Insert an element at the provided index.
	* @param {number} index Index.
	* @param {T} elem Element.
	* @api
	*/
	insertAt(index, elem) {
		if (index < 0 || index > this.getLength()) throw new Error("Index out of bounds: " + index);
		if (this.unique_) this.assertUnique_(elem);
		this.array_.splice(index, 0, elem);
		this.updateLength_();
		this.dispatchEvent(new CollectionEvent(CollectionEventType_default.ADD, elem, index));
	}
	/**
	* Remove the last element of the collection and return it.
	* Return `undefined` if the collection is empty.
	* @return {T|undefined} Element.
	* @api
	*/
	pop() {
		return this.removeAt(this.getLength() - 1);
	}
	/**
	* Insert the provided element at the end of the collection.
	* @param {T} elem Element.
	* @return {number} New length of the collection.
	* @api
	*/
	push(elem) {
		if (this.unique_) this.assertUnique_(elem);
		const n = this.getLength();
		this.insertAt(n, elem);
		return this.getLength();
	}
	/**
	* Remove the first occurrence of an element from the collection.
	* @param {T} elem Element.
	* @return {T|undefined} The removed element or undefined if none found.
	* @api
	*/
	remove(elem) {
		const arr = this.array_;
		for (let i = 0, ii = arr.length; i < ii; ++i) if (arr[i] === elem) return this.removeAt(i);
	}
	/**
	* Remove the element at the provided index and return it.
	* Return `undefined` if the collection does not contain this index.
	* @param {number} index Index.
	* @return {T|undefined} Value.
	* @api
	*/
	removeAt(index) {
		if (index < 0 || index >= this.getLength()) return;
		const prev = this.array_[index];
		this.array_.splice(index, 1);
		this.updateLength_();
		this.dispatchEvent(new CollectionEvent(CollectionEventType_default.REMOVE, prev, index));
		return prev;
	}
	/**
	* Set the element at the provided index.
	* @param {number} index Index.
	* @param {T} elem Element.
	* @api
	*/
	setAt(index, elem) {
		if (index >= this.getLength()) {
			this.insertAt(index, elem);
			return;
		}
		if (index < 0) throw new Error("Index out of bounds: " + index);
		if (this.unique_) this.assertUnique_(elem, index);
		const prev = this.array_[index];
		this.array_[index] = elem;
		this.dispatchEvent(new CollectionEvent(CollectionEventType_default.REMOVE, prev, index));
		this.dispatchEvent(new CollectionEvent(CollectionEventType_default.ADD, elem, index));
	}
	/**
	* @private
	*/
	updateLength_() {
		this.set(Property$2.LENGTH, this.array_.length);
	}
	/**
	* @private
	* @param {T} elem Element.
	* @param {number} [except] Optional index to ignore.
	*/
	assertUnique_(elem, except) {
		for (let i = 0, ii = this.array_.length; i < ii; ++i) if (this.array_[i] === elem && i !== except) throw new Error("Duplicate item added to a unique collection");
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/asserts.js
/**
* @module ol/asserts
*/
/**
* @param {*} assertion Assertion we expected to be truthy.
* @param {string} errorMessage Error message.
*/
function assert(assertion, errorMessage) {
	if (!assertion) throw new Error(errorMessage);
}
new Array(6);
/**
* Create an identity transform.
* @return {!Transform} Identity transform.
*/
function create() {
	return [
		1,
		0,
		0,
		1,
		0,
		0
	];
}
/**
* Transforms the given coordinate with the given transform returning the
* resulting, transformed coordinate. The coordinate will be modified in-place.
*
* @param {Transform} transform The transformation.
* @param {import("./coordinate.js").Coordinate|import("./pixel.js").Pixel} coordinate The coordinate to transform.
* @return {import("./coordinate.js").Coordinate|import("./pixel.js").Pixel} return coordinate so that operations can be
*     chained together.
*/
function apply(transform, coordinate) {
	const x = coordinate[0];
	const y = coordinate[1];
	coordinate[0] = transform[0] * x + transform[2] * y + transform[4];
	coordinate[1] = transform[1] * x + transform[3] * y + transform[5];
	return coordinate;
}
/**
* Creates a composite transform given an initial translation, scale, rotation, and
* final translation (in that order only, not commutative).
* @param {!Transform} transform The transform (will be modified in place).
* @param {number} dx1 Initial translation x.
* @param {number} dy1 Initial translation y.
* @param {number} sx Scale factor x.
* @param {number} sy Scale factor y.
* @param {number} angle Rotation (in counter-clockwise radians).
* @param {number} dx2 Final translation x.
* @param {number} dy2 Final translation y.
* @return {!Transform} The composite transform.
*/
function compose(transform, dx1, dy1, sx, sy, angle, dx2, dy2) {
	const sin = Math.sin(angle);
	const cos = Math.cos(angle);
	transform[0] = sx * cos;
	transform[1] = sy * sin;
	transform[2] = -sx * sin;
	transform[3] = sy * cos;
	transform[4] = dx2 * sx * cos - dy2 * sx * sin + dx1;
	transform[5] = dx2 * sy * sin + dy2 * sy * cos + dy1;
	return transform;
}
/**
* Invert the given transform.
* @param {!Transform} target Transform to be set as the inverse of
*     the source transform.
* @param {!Transform} source The source transform to invert.
* @return {!Transform} The inverted (target) transform.
*/
function makeInverse(target, source) {
	const det = determinant(source);
	assert(det !== 0, "Transformation matrix cannot be inverted");
	const a = source[0];
	const b = source[1];
	const c = source[2];
	const d = source[3];
	const e = source[4];
	const f = source[5];
	target[0] = d / det;
	target[1] = -b / det;
	target[2] = -c / det;
	target[3] = a / det;
	target[4] = (c * f - d * e) / det;
	target[5] = -(a * f - b * e) / det;
	return target;
}
/**
* Returns the determinant of the given matrix.
* @param {!Transform} mat Matrix.
* @return {number} Determinant.
*/
function determinant(mat) {
	return mat[0] * mat[3] - mat[1] * mat[2];
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/flat/transform.js
/**
* @module ol/geom/flat/transform
*/
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {import("../../transform.js").Transform} transform Transform.
* @param {Array<number>} [dest] Destination.
* @return {Array<number>} Transformed coordinates.
*/
function transform2D(flatCoordinates, offset, end, stride, transform, dest) {
	dest = dest ? dest : [];
	let i = 0;
	for (let j = offset; j < end; j += stride) {
		const x = flatCoordinates[j];
		const y = flatCoordinates[j + 1];
		dest[i++] = transform[0] * x + transform[2] * y + transform[4];
		dest[i++] = transform[1] * x + transform[3] * y + transform[5];
	}
	if (dest && dest.length != i) dest.length = i;
	return dest;
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {number} angle Angle.
* @param {Array<number>} anchor Rotation anchor point.
* @param {Array<number>} [dest] Destination.
* @return {Array<number>} Transformed coordinates.
*/
function rotate(flatCoordinates, offset, end, stride, angle, anchor, dest) {
	dest = dest ? dest : [];
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	const anchorX = anchor[0];
	const anchorY = anchor[1];
	let i = 0;
	for (let j = offset; j < end; j += stride) {
		const deltaX = flatCoordinates[j] - anchorX;
		const deltaY = flatCoordinates[j + 1] - anchorY;
		dest[i++] = anchorX + deltaX * cos - deltaY * sin;
		dest[i++] = anchorY + deltaX * sin + deltaY * cos;
		for (let k = j + 2; k < j + stride; ++k) dest[i++] = flatCoordinates[k];
	}
	if (dest && dest.length != i) dest.length = i;
	return dest;
}
/**
* Scale the coordinates.
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {number} sx Scale factor in the x-direction.
* @param {number} sy Scale factor in the y-direction.
* @param {Array<number>} anchor Scale anchor point.
* @param {Array<number>} [dest] Destination.
* @return {Array<number>} Transformed coordinates.
*/
function scale(flatCoordinates, offset, end, stride, sx, sy, anchor, dest) {
	dest = dest ? dest : [];
	const anchorX = anchor[0];
	const anchorY = anchor[1];
	let i = 0;
	for (let j = offset; j < end; j += stride) {
		const deltaX = flatCoordinates[j] - anchorX;
		const deltaY = flatCoordinates[j + 1] - anchorY;
		dest[i++] = anchorX + sx * deltaX;
		dest[i++] = anchorY + sy * deltaY;
		for (let k = j + 2; k < j + stride; ++k) dest[i++] = flatCoordinates[k];
	}
	if (dest && dest.length != i) dest.length = i;
	return dest;
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {number} deltaX Delta X.
* @param {number} deltaY Delta Y.
* @param {Array<number>} [dest] Destination.
* @return {Array<number>} Transformed coordinates.
*/
function translate(flatCoordinates, offset, end, stride, deltaX, deltaY, dest) {
	dest = dest ? dest : [];
	let i = 0;
	for (let j = offset; j < end; j += stride) {
		dest[i++] = flatCoordinates[j] + deltaX;
		dest[i++] = flatCoordinates[j + 1] + deltaY;
		for (let k = j + 2; k < j + stride; ++k) dest[i++] = flatCoordinates[k];
	}
	if (dest && dest.length != i) dest.length = i;
	return dest;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/Geometry.js
/**
* @module ol/geom/Geometry
*/
/**
* @typedef {'XY' | 'XYZ' | 'XYM' | 'XYZM'} GeometryLayout
* The coordinate layout for geometries, indicating whether a 3rd or 4th z ('Z')
* or measure ('M') coordinate is available.
*/
/**
* @typedef {'Point' | 'LineString' | 'LinearRing' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'GeometryCollection' | 'Circle'} Type
* The geometry type.  One of `'Point'`, `'LineString'`, `'LinearRing'`,
* `'Polygon'`, `'MultiPoint'`, `'MultiLineString'`, `'MultiPolygon'`,
* `'GeometryCollection'`, or `'Circle'`.
*/
/**
* @type {import("../transform.js").Transform}
*/
var tmpTransform = create();
/**
* @classdesc
* Abstract base class; normally only used for creating subclasses and not
* instantiated in apps.
* Base class for vector geometries.
*
* To get notified of changes to the geometry, register a listener for the
* generic `change` event on your geometry instance.
*
* @abstract
* @api
*/
var Geometry = class extends BaseObject {
	constructor() {
		super();
		/**
		* @private
		* @type {import("../extent.js").Extent}
		*/
		this.extent_ = createEmpty();
		/**
		* @private
		* @type {number}
		*/
		this.extentRevision_ = -1;
		/**
		* @protected
		* @type {number}
		*/
		this.simplifiedGeometryMaxMinSquaredTolerance = 0;
		/**
		* @protected
		* @type {number}
		*/
		this.simplifiedGeometryRevision = 0;
		/**
		* Get a transformed and simplified version of the geometry.
		* @abstract
		* @param {number} revision The geometry revision.
		* @param {number} squaredTolerance Squared tolerance.
		* @param {import("../proj.js").TransformFunction} [transform] Optional transform function.
		* @return {Geometry} Simplified geometry.
		*/
		this.simplifyTransformedInternal = memoizeOne((revision, squaredTolerance, transform) => {
			if (!transform) return this.getSimplifiedGeometry(squaredTolerance);
			const clone = this.clone();
			clone.applyTransform(transform);
			return clone.getSimplifiedGeometry(squaredTolerance);
		});
	}
	/**
	* Get a transformed and simplified version of the geometry.
	* @abstract
	* @param {number} squaredTolerance Squared tolerance.
	* @param {import("../proj.js").TransformFunction} [transform] Optional transform function.
	* @return {Geometry} Simplified geometry.
	*/
	simplifyTransformed(squaredTolerance, transform) {
		return this.simplifyTransformedInternal(this.getRevision(), squaredTolerance, transform);
	}
	/**
	* Make a complete copy of the geometry.
	* @abstract
	* @return {!Geometry} Clone.
	*/
	clone() {
		return abstract();
	}
	/**
	* @abstract
	* @param {number} x X.
	* @param {number} y Y.
	* @param {import("../coordinate.js").Coordinate} closestPoint Closest point.
	* @param {number} minSquaredDistance Minimum squared distance.
	* @return {number} Minimum squared distance.
	*/
	closestPointXY(x, y, closestPoint, minSquaredDistance) {
		return abstract();
	}
	/**
	* @param {number} x X.
	* @param {number} y Y.
	* @return {boolean} Contains (x, y).
	*/
	containsXY(x, y) {
		const coord = this.getClosestPoint([x, y]);
		return coord[0] === x && coord[1] === y;
	}
	/**
	* Return the closest point of the geometry to the passed point as
	* {@link module:ol/coordinate~Coordinate coordinate}.
	* @param {import("../coordinate.js").Coordinate} point Point.
	* @param {import("../coordinate.js").Coordinate} [closestPoint] Closest point.
	* @return {import("../coordinate.js").Coordinate} Closest point.
	* @api
	*/
	getClosestPoint(point, closestPoint) {
		closestPoint = closestPoint ? closestPoint : [NaN, NaN];
		this.closestPointXY(point[0], point[1], closestPoint, Infinity);
		return closestPoint;
	}
	/**
	* Returns true if this geometry includes the specified coordinate. If the
	* coordinate is on the boundary of the geometry, returns false.
	* @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
	* @return {boolean} Contains coordinate.
	* @api
	*/
	intersectsCoordinate(coordinate) {
		return this.containsXY(coordinate[0], coordinate[1]);
	}
	/**
	* @abstract
	* @param {import("../extent.js").Extent} extent Extent.
	* @protected
	* @return {import("../extent.js").Extent} extent Extent.
	*/
	computeExtent(extent) {
		return abstract();
	}
	/**
	* Get the extent of the geometry.
	* @param {import("../extent.js").Extent} [extent] Extent.
	* @return {import("../extent.js").Extent} extent Extent.
	* @api
	*/
	getExtent(extent) {
		if (this.extentRevision_ != this.getRevision()) {
			const extent = this.computeExtent(this.extent_);
			if (isNaN(extent[0]) || isNaN(extent[1])) createOrUpdateEmpty(extent);
			this.extentRevision_ = this.getRevision();
		}
		return returnOrUpdate(this.extent_, extent);
	}
	/**
	* Rotate the geometry around a given coordinate. This modifies the geometry
	* coordinates in place.
	* @abstract
	* @param {number} angle Rotation angle in radians.
	* @param {import("../coordinate.js").Coordinate} anchor The rotation center.
	* @api
	*/
	rotate(angle, anchor) {
		abstract();
	}
	/**
	* Scale the geometry (with an optional origin).  This modifies the geometry
	* coordinates in place.
	* @abstract
	* @param {number} sx The scaling factor in the x-direction.
	* @param {number} [sy] The scaling factor in the y-direction (defaults to sx).
	* @param {import("../coordinate.js").Coordinate} [anchor] The scale origin (defaults to the center
	*     of the geometry extent).
	* @api
	*/
	scale(sx, sy, anchor) {
		abstract();
	}
	/**
	* Create a simplified version of this geometry.  For linestrings, this uses
	* the [Douglas Peucker](https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm)
	* algorithm.  For polygons, a quantization-based
	* simplification is used to preserve topology.
	* @param {number} tolerance The tolerance distance for simplification.
	* @return {Geometry} A new, simplified version of the original geometry.
	* @api
	*/
	simplify(tolerance) {
		return this.getSimplifiedGeometry(tolerance * tolerance);
	}
	/**
	* Create a simplified version of this geometry using the Douglas Peucker
	* algorithm.
	* See https://en.wikipedia.org/wiki/Ramer-Douglas-Peucker_algorithm.
	* @abstract
	* @param {number} squaredTolerance Squared tolerance.
	* @return {Geometry} Simplified geometry.
	*/
	getSimplifiedGeometry(squaredTolerance) {
		return abstract();
	}
	/**
	* Get the type of this geometry.
	* @abstract
	* @return {Type} Geometry type.
	*/
	getType() {
		return abstract();
	}
	/**
	* Apply a transform function to the coordinates of the geometry.
	* The geometry is modified in place.
	* If you do not want the geometry modified in place, first `clone()` it and
	* then use this function on the clone.
	* @abstract
	* @param {import("../proj.js").TransformFunction} transformFn Transform function.
	* Called with a flat array of geometry coordinates.
	*/
	applyTransform(transformFn) {
		abstract();
	}
	/**
	* Test if the geometry and the passed extent intersect.
	* @abstract
	* @param {import("../extent.js").Extent} extent Extent.
	* @return {boolean} `true` if the geometry and the extent intersect.
	*/
	intersectsExtent(extent) {
		return abstract();
	}
	/**
	* Translate the geometry.  This modifies the geometry coordinates in place.  If
	* instead you want a new geometry, first `clone()` this geometry.
	* @abstract
	* @param {number} deltaX Delta X.
	* @param {number} deltaY Delta Y.
	* @api
	*/
	translate(deltaX, deltaY) {
		abstract();
	}
	/**
	* Transform each coordinate of the geometry from one coordinate reference
	* system to another. The geometry is modified in place.
	* For example, a line will be transformed to a line and a circle to a circle.
	* If you do not want the geometry modified in place, first `clone()` it and
	* then use this function on the clone.
	*
	* @param {import("../proj.js").ProjectionLike} source The current projection.  Can be a
	*     string identifier or a {@link module:ol/proj/Projection~Projection} object.
	* @param {import("../proj.js").ProjectionLike} destination The desired projection.  Can be a
	*     string identifier or a {@link module:ol/proj/Projection~Projection} object.
	* @return {this} This geometry.  Note that original geometry is
	*     modified in place.
	* @api
	*/
	transform(source, destination) {
		/** @type {import("../proj/Projection.js").default} */
		const sourceProj = get$1(source);
		const transformFn = sourceProj.getUnits() == "tile-pixels" ? function(inCoordinates, outCoordinates, stride) {
			const pixelExtent = sourceProj.getExtent();
			const projectedExtent = sourceProj.getWorldExtent();
			const scale = getHeight(projectedExtent) / getHeight(pixelExtent);
			compose(tmpTransform, projectedExtent[0], projectedExtent[3], scale, -scale, 0, 0, 0);
			transform2D(inCoordinates, 0, inCoordinates.length, stride, tmpTransform, outCoordinates);
			return getTransform(sourceProj, destination)(inCoordinates, outCoordinates, stride);
		} : getTransform(sourceProj, destination);
		this.applyTransform(transformFn);
		return this;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/SimpleGeometry.js
/**
* @module ol/geom/SimpleGeometry
*/
/**
* @classdesc
* Abstract base class; only used for creating subclasses; do not instantiate
* in apps, as cannot be rendered.
*
* @abstract
* @api
*/
var SimpleGeometry = class extends Geometry {
	constructor() {
		super();
		/**
		* @protected
		* @type {import("./Geometry.js").GeometryLayout}
		*/
		this.layout = "XY";
		/**
		* @protected
		* @type {number}
		*/
		this.stride = 2;
		/**
		* @protected
		* @type {Array<number>}
		*/
		this.flatCoordinates;
	}
	/**
	* @param {import("../extent.js").Extent} extent Extent.
	* @protected
	* @return {import("../extent.js").Extent} extent Extent.
	*/
	computeExtent(extent) {
		return createOrUpdateFromFlatCoordinates(this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, extent);
	}
	/**
	* @abstract
	* @return {Array<*> | null} Coordinates.
	*/
	getCoordinates() {
		return abstract();
	}
	/**
	* Return the first coordinate of the geometry.
	* @return {import("../coordinate.js").Coordinate} First coordinate.
	* @api
	*/
	getFirstCoordinate() {
		return this.flatCoordinates.slice(0, this.stride);
	}
	/**
	* @return {Array<number>} Flat coordinates.
	*/
	getFlatCoordinates() {
		return this.flatCoordinates;
	}
	/**
	* Return the last coordinate of the geometry.
	* @return {import("../coordinate.js").Coordinate} Last point.
	* @api
	*/
	getLastCoordinate() {
		return this.flatCoordinates.slice(this.flatCoordinates.length - this.stride);
	}
	/**
	* Return the {@link import("./Geometry.js").GeometryLayout layout} of the geometry.
	* @return {import("./Geometry.js").GeometryLayout} Layout.
	* @api
	*/
	getLayout() {
		return this.layout;
	}
	/**
	* Create a simplified version of this geometry using the Douglas Peucker algorithm.
	* @param {number} squaredTolerance Squared tolerance.
	* @return {SimpleGeometry} Simplified geometry.
	*/
	getSimplifiedGeometry(squaredTolerance) {
		if (this.simplifiedGeometryRevision !== this.getRevision()) {
			this.simplifiedGeometryMaxMinSquaredTolerance = 0;
			this.simplifiedGeometryRevision = this.getRevision();
		}
		if (squaredTolerance < 0 || this.simplifiedGeometryMaxMinSquaredTolerance !== 0 && squaredTolerance <= this.simplifiedGeometryMaxMinSquaredTolerance) return this;
		const simplifiedGeometry = this.getSimplifiedGeometryInternal(squaredTolerance);
		if (simplifiedGeometry.getFlatCoordinates().length < this.flatCoordinates.length) return simplifiedGeometry;
		this.simplifiedGeometryMaxMinSquaredTolerance = squaredTolerance;
		return this;
	}
	/**
	* @param {number} squaredTolerance Squared tolerance.
	* @return {SimpleGeometry} Simplified geometry.
	* @protected
	*/
	getSimplifiedGeometryInternal(squaredTolerance) {
		return this;
	}
	/**
	* @return {number} Stride.
	*/
	getStride() {
		return this.stride;
	}
	/**
	* @param {import("./Geometry.js").GeometryLayout} layout Layout.
	* @param {Array<number>} flatCoordinates Flat coordinates.
	*/
	setFlatCoordinates(layout, flatCoordinates) {
		this.stride = getStrideForLayout(layout);
		this.layout = layout;
		this.flatCoordinates = flatCoordinates;
	}
	/**
	* @abstract
	* @param {!Array<*>} coordinates Coordinates.
	* @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
	*/
	setCoordinates(coordinates, layout) {
		abstract();
	}
	/**
	* @param {import("./Geometry.js").GeometryLayout|undefined} layout Layout.
	* @param {Array<*>} coordinates Coordinates.
	* @param {number} nesting Nesting.
	* @protected
	*/
	setLayout(layout, coordinates, nesting) {
		let stride;
		if (layout) stride = getStrideForLayout(layout);
		else {
			for (let i = 0; i < nesting; ++i) {
				if (coordinates.length === 0) {
					this.layout = "XY";
					this.stride = 2;
					return;
				}
				coordinates = coordinates[0];
			}
			stride = coordinates.length;
			layout = getLayoutForStride(stride);
		}
		this.layout = layout;
		this.stride = stride;
	}
	/**
	* Apply a transform function to the coordinates of the geometry.
	* The geometry is modified in place.
	* If you do not want the geometry modified in place, first `clone()` it and
	* then use this function on the clone.
	* @param {import("../proj.js").TransformFunction} transformFn Transform function.
	* Called with a flat array of geometry coordinates.
	* @api
	*/
	applyTransform(transformFn) {
		if (this.flatCoordinates) {
			transformFn(this.flatCoordinates, this.flatCoordinates, this.stride);
			this.changed();
		}
	}
	/**
	* Rotate the geometry around a given coordinate. This modifies the geometry
	* coordinates in place.
	* @param {number} angle Rotation angle in counter-clockwise radians.
	* @param {import("../coordinate.js").Coordinate} anchor The rotation center.
	* @api
	*/
	rotate(angle, anchor) {
		const flatCoordinates = this.getFlatCoordinates();
		if (flatCoordinates) {
			const stride = this.getStride();
			rotate(flatCoordinates, 0, flatCoordinates.length, stride, angle, anchor, flatCoordinates);
			this.changed();
		}
	}
	/**
	* Scale the geometry (with an optional origin).  This modifies the geometry
	* coordinates in place.
	* @param {number} sx The scaling factor in the x-direction.
	* @param {number} [sy] The scaling factor in the y-direction (defaults to sx).
	* @param {import("../coordinate.js").Coordinate} [anchor] The scale origin (defaults to the center
	*     of the geometry extent).
	* @api
	*/
	scale(sx, sy, anchor) {
		if (sy === void 0) sy = sx;
		if (!anchor) anchor = getCenter(this.getExtent());
		const flatCoordinates = this.getFlatCoordinates();
		if (flatCoordinates) {
			const stride = this.getStride();
			scale(flatCoordinates, 0, flatCoordinates.length, stride, sx, sy, anchor, flatCoordinates);
			this.changed();
		}
	}
	/**
	* Translate the geometry.  This modifies the geometry coordinates in place.  If
	* instead you want a new geometry, first `clone()` this geometry.
	* @param {number} deltaX Delta X.
	* @param {number} deltaY Delta Y.
	* @api
	*/
	translate(deltaX, deltaY) {
		const flatCoordinates = this.getFlatCoordinates();
		if (flatCoordinates) {
			const stride = this.getStride();
			translate(flatCoordinates, 0, flatCoordinates.length, stride, deltaX, deltaY, flatCoordinates);
			this.changed();
		}
	}
};
/**
* @param {number} stride Stride.
* @return {import("./Geometry.js").GeometryLayout} layout Layout.
*/
function getLayoutForStride(stride) {
	let layout;
	if (stride == 2) layout = "XY";
	else if (stride == 3) layout = "XYZ";
	else if (stride == 4) layout = "XYZM";
	return layout;
}
/**
* @param {import("./Geometry.js").GeometryLayout} layout Layout.
* @return {number} Stride.
*/
function getStrideForLayout(layout) {
	let stride;
	if (layout == "XY") stride = 2;
	else if (layout == "XYZ" || layout == "XYM") stride = 3;
	else if (layout == "XYZM") stride = 4;
	return stride;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/flat/closest.js
/**
* @module ol/geom/flat/closest
*/
/**
* Returns the point on the 2D line segment flatCoordinates[offset1] to
* flatCoordinates[offset2] that is closest to the point (x, y).  Extra
* dimensions are linearly interpolated.
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset1 Offset 1.
* @param {number} offset2 Offset 2.
* @param {number} stride Stride.
* @param {number} x X.
* @param {number} y Y.
* @param {Array<number>} closestPoint Closest point.
*/
function assignClosest(flatCoordinates, offset1, offset2, stride, x, y, closestPoint) {
	const x1 = flatCoordinates[offset1];
	const y1 = flatCoordinates[offset1 + 1];
	const dx = flatCoordinates[offset2] - x1;
	const dy = flatCoordinates[offset2 + 1] - y1;
	let offset;
	if (dx === 0 && dy === 0) offset = offset1;
	else {
		const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
		if (t > 1) offset = offset2;
		else if (t > 0) {
			for (let i = 0; i < stride; ++i) closestPoint[i] = lerp(flatCoordinates[offset1 + i], flatCoordinates[offset2 + i], t);
			closestPoint.length = stride;
			return;
		} else offset = offset1;
	}
	for (let i = 0; i < stride; ++i) closestPoint[i] = flatCoordinates[offset + i];
	closestPoint.length = stride;
}
/**
* Return the squared of the largest distance between any pair of consecutive
* coordinates.
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {number} max Max squared delta.
* @return {number} Max squared delta.
*/
function maxSquaredDelta(flatCoordinates, offset, end, stride, max) {
	let x1 = flatCoordinates[offset];
	let y1 = flatCoordinates[offset + 1];
	for (offset += stride; offset < end; offset += stride) {
		const x2 = flatCoordinates[offset];
		const y2 = flatCoordinates[offset + 1];
		const squaredDelta = squaredDistance(x1, y1, x2, y2);
		if (squaredDelta > max) max = squaredDelta;
		x1 = x2;
		y1 = y2;
	}
	return max;
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {Array<number>} ends Ends.
* @param {number} stride Stride.
* @param {number} max Max squared delta.
* @return {number} Max squared delta.
*/
function arrayMaxSquaredDelta(flatCoordinates, offset, ends, stride, max) {
	for (let i = 0, ii = ends.length; i < ii; ++i) {
		const end = ends[i];
		max = maxSquaredDelta(flatCoordinates, offset, end, stride, max);
		offset = end;
	}
	return max;
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {number} maxDelta Max delta.
* @param {boolean} isRing Is ring.
* @param {number} x X.
* @param {number} y Y.
* @param {Array<number>} closestPoint Closest point.
* @param {number} minSquaredDistance Minimum squared distance.
* @param {Array<number>} [tmpPoint] Temporary point object.
* @return {number} Minimum squared distance.
*/
function assignClosestPoint(flatCoordinates, offset, end, stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance, tmpPoint) {
	if (offset == end) return minSquaredDistance;
	let i, squaredDistance$2;
	if (maxDelta === 0) {
		squaredDistance$2 = squaredDistance(x, y, flatCoordinates[offset], flatCoordinates[offset + 1]);
		if (squaredDistance$2 < minSquaredDistance) {
			for (i = 0; i < stride; ++i) closestPoint[i] = flatCoordinates[offset + i];
			closestPoint.length = stride;
			return squaredDistance$2;
		}
		return minSquaredDistance;
	}
	tmpPoint = tmpPoint ? tmpPoint : [NaN, NaN];
	let index = offset + stride;
	while (index < end) {
		assignClosest(flatCoordinates, index - stride, index, stride, x, y, tmpPoint);
		squaredDistance$2 = squaredDistance(x, y, tmpPoint[0], tmpPoint[1]);
		if (squaredDistance$2 < minSquaredDistance) {
			minSquaredDistance = squaredDistance$2;
			for (i = 0; i < stride; ++i) closestPoint[i] = tmpPoint[i];
			closestPoint.length = stride;
			index += stride;
		} else index += stride * Math.max((Math.sqrt(squaredDistance$2) - Math.sqrt(minSquaredDistance)) / maxDelta | 0, 1);
	}
	if (isRing) {
		assignClosest(flatCoordinates, end - stride, offset, stride, x, y, tmpPoint);
		squaredDistance$2 = squaredDistance(x, y, tmpPoint[0], tmpPoint[1]);
		if (squaredDistance$2 < minSquaredDistance) {
			minSquaredDistance = squaredDistance$2;
			for (i = 0; i < stride; ++i) closestPoint[i] = tmpPoint[i];
			closestPoint.length = stride;
		}
	}
	return minSquaredDistance;
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {Array<number>} ends Ends.
* @param {number} stride Stride.
* @param {number} maxDelta Max delta.
* @param {boolean} isRing Is ring.
* @param {number} x X.
* @param {number} y Y.
* @param {Array<number>} closestPoint Closest point.
* @param {number} minSquaredDistance Minimum squared distance.
* @param {Array<number>} [tmpPoint] Temporary point object.
* @return {number} Minimum squared distance.
*/
function assignClosestArrayPoint(flatCoordinates, offset, ends, stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance, tmpPoint) {
	tmpPoint = tmpPoint ? tmpPoint : [NaN, NaN];
	for (let i = 0, ii = ends.length; i < ii; ++i) {
		const end = ends[i];
		minSquaredDistance = assignClosestPoint(flatCoordinates, offset, end, stride, maxDelta, isRing, x, y, closestPoint, minSquaredDistance, tmpPoint);
		offset = end;
	}
	return minSquaredDistance;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/flat/deflate.js
/**
* @module ol/geom/flat/deflate
*/
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
* @param {number} stride Stride.
* @return {number} offset Offset.
*/
function deflateCoordinate(flatCoordinates, offset, coordinate, stride) {
	for (let i = 0, ii = coordinate.length; i < ii; ++i) flatCoordinates[offset++] = coordinate[i];
	return offset;
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {Array<import("../../coordinate.js").Coordinate>} coordinates Coordinates.
* @param {number} stride Stride.
* @return {number} offset Offset.
*/
function deflateCoordinates(flatCoordinates, offset, coordinates, stride) {
	for (let i = 0, ii = coordinates.length; i < ii; ++i) {
		const coordinate = coordinates[i];
		for (let j = 0; j < stride; ++j) flatCoordinates[offset++] = coordinate[j];
	}
	return offset;
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {Array<Array<import("../../coordinate.js").Coordinate>>} coordinatess Coordinatess.
* @param {number} stride Stride.
* @param {Array<number>} [ends] Ends.
* @return {Array<number>} Ends.
*/
function deflateCoordinatesArray(flatCoordinates, offset, coordinatess, stride, ends) {
	ends = ends ? ends : [];
	let i = 0;
	for (let j = 0, jj = coordinatess.length; j < jj; ++j) {
		const end = deflateCoordinates(flatCoordinates, offset, coordinatess[j], stride);
		ends[i++] = end;
		offset = end;
	}
	ends.length = i;
	return ends;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/flat/simplify.js
/**
* @module ol/geom/flat/simplify
*/
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {number} squaredTolerance Squared tolerance.
* @param {Array<number>} simplifiedFlatCoordinates Simplified flat
*     coordinates.
* @param {number} simplifiedOffset Simplified offset.
* @return {number} Simplified offset.
*/
function douglasPeucker(flatCoordinates, offset, end, stride, squaredTolerance, simplifiedFlatCoordinates, simplifiedOffset) {
	const n = (end - offset) / stride;
	if (n < 3) {
		for (; offset < end; offset += stride) {
			simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset];
			simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset + 1];
		}
		return simplifiedOffset;
	}
	/** @type {Array<number>} */
	const markers = new Array(n);
	markers[0] = 1;
	markers[n - 1] = 1;
	/** @type {Array<number>} */
	const stack = [offset, end - stride];
	let index = 0;
	while (stack.length > 0) {
		const last = stack.pop();
		const first = stack.pop();
		let maxSquaredDistance = 0;
		const x1 = flatCoordinates[first];
		const y1 = flatCoordinates[first + 1];
		const x2 = flatCoordinates[last];
		const y2 = flatCoordinates[last + 1];
		for (let i = first + stride; i < last; i += stride) {
			const x = flatCoordinates[i];
			const y = flatCoordinates[i + 1];
			const squaredDistance = squaredSegmentDistance(x, y, x1, y1, x2, y2);
			if (squaredDistance > maxSquaredDistance) {
				index = i;
				maxSquaredDistance = squaredDistance;
			}
		}
		if (maxSquaredDistance > squaredTolerance) {
			markers[(index - offset) / stride] = 1;
			if (first + stride < index) stack.push(first, index);
			if (index + stride < last) stack.push(index, last);
		}
	}
	for (let i = 0; i < n; ++i) if (markers[i]) {
		simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset + i * stride];
		simplifiedFlatCoordinates[simplifiedOffset++] = flatCoordinates[offset + i * stride + 1];
	}
	return simplifiedOffset;
}
/**
* @param {number} value Value.
* @param {number} tolerance Tolerance.
* @return {number} Rounded value.
*/
function snap(value, tolerance) {
	return tolerance * Math.round(value / tolerance);
}
/**
* Simplifies a line string using an algorithm designed by Tim Schaub.
* Coordinates are snapped to the nearest value in a virtual grid and
* consecutive duplicate coordinates are discarded.  This effectively preserves
* topology as the simplification of any subsection of a line string is
* independent of the rest of the line string.  This means that, for examples,
* the common edge between two polygons will be simplified to the same line
* string independently in both polygons.  This implementation uses a single
* pass over the coordinates and eliminates intermediate collinear points.
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {number} tolerance Tolerance.
* @param {Array<number>} simplifiedFlatCoordinates Simplified flat
*     coordinates.
* @param {number} simplifiedOffset Simplified offset.
* @return {number} Simplified offset.
*/
function quantize(flatCoordinates, offset, end, stride, tolerance, simplifiedFlatCoordinates, simplifiedOffset) {
	if (offset == end) return simplifiedOffset;
	let x1 = snap(flatCoordinates[offset], tolerance);
	let y1 = snap(flatCoordinates[offset + 1], tolerance);
	offset += stride;
	simplifiedFlatCoordinates[simplifiedOffset++] = x1;
	simplifiedFlatCoordinates[simplifiedOffset++] = y1;
	let x2, y2;
	do {
		x2 = snap(flatCoordinates[offset], tolerance);
		y2 = snap(flatCoordinates[offset + 1], tolerance);
		offset += stride;
		if (offset == end) {
			simplifiedFlatCoordinates[simplifiedOffset++] = x2;
			simplifiedFlatCoordinates[simplifiedOffset++] = y2;
			return simplifiedOffset;
		}
	} while (x2 == x1 && y2 == y1);
	while (offset < end) {
		const x3 = snap(flatCoordinates[offset], tolerance);
		const y3 = snap(flatCoordinates[offset + 1], tolerance);
		offset += stride;
		if (x3 == x2 && y3 == y2) continue;
		const dx1 = x2 - x1;
		const dy1 = y2 - y1;
		const dx2 = x3 - x1;
		const dy2 = y3 - y1;
		if (dx1 * dy2 == dy1 * dx2 && (dx1 < 0 && dx2 < dx1 || dx1 == dx2 || dx1 > 0 && dx2 > dx1) && (dy1 < 0 && dy2 < dy1 || dy1 == dy2 || dy1 > 0 && dy2 > dy1)) {
			x2 = x3;
			y2 = y3;
			continue;
		}
		simplifiedFlatCoordinates[simplifiedOffset++] = x2;
		simplifiedFlatCoordinates[simplifiedOffset++] = y2;
		x1 = x2;
		y1 = y2;
		x2 = x3;
		y2 = y3;
	}
	simplifiedFlatCoordinates[simplifiedOffset++] = x2;
	simplifiedFlatCoordinates[simplifiedOffset++] = y2;
	return simplifiedOffset;
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {Array<number>} ends Ends.
* @param {number} stride Stride.
* @param {number} tolerance Tolerance.
* @param {Array<number>} simplifiedFlatCoordinates Simplified flat
*     coordinates.
* @param {number} simplifiedOffset Simplified offset.
* @param {Array<number>} simplifiedEnds Simplified ends.
* @return {number} Simplified offset.
*/
function quantizeArray(flatCoordinates, offset, ends, stride, tolerance, simplifiedFlatCoordinates, simplifiedOffset, simplifiedEnds) {
	for (let i = 0, ii = ends.length; i < ii; ++i) {
		const end = ends[i];
		simplifiedOffset = quantize(flatCoordinates, offset, end, stride, tolerance, simplifiedFlatCoordinates, simplifiedOffset);
		simplifiedEnds.push(simplifiedOffset);
		offset = end;
	}
	return simplifiedOffset;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/flat/inflate.js
/**
* @module ol/geom/flat/inflate
*/
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {Array<import("../../coordinate.js").Coordinate>} [coordinates] Coordinates.
* @return {Array<import("../../coordinate.js").Coordinate>} Coordinates.
*/
function inflateCoordinates(flatCoordinates, offset, end, stride, coordinates) {
	coordinates = coordinates !== void 0 ? coordinates : [];
	let i = 0;
	for (let j = offset; j < end; j += stride) coordinates[i++] = flatCoordinates.slice(j, j + stride);
	coordinates.length = i;
	return coordinates;
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {Array<number>} ends Ends.
* @param {number} stride Stride.
* @param {Array<Array<import("../../coordinate.js").Coordinate>>} [coordinatess] Coordinatess.
* @return {Array<Array<import("../../coordinate.js").Coordinate>>} Coordinatess.
*/
function inflateCoordinatesArray(flatCoordinates, offset, ends, stride, coordinatess) {
	coordinatess = coordinatess !== void 0 ? coordinatess : [];
	let i = 0;
	for (let j = 0, jj = ends.length; j < jj; ++j) {
		const end = ends[j];
		coordinatess[i++] = inflateCoordinates(flatCoordinates, offset, end, stride, coordinatess[i]);
		offset = end;
	}
	coordinatess.length = i;
	return coordinatess;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/flat/area.js
/**
* @module ol/geom/flat/area
*/
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @return {number} Area.
*/
function linearRing(flatCoordinates, offset, end, stride) {
	let twiceArea = 0;
	let x1 = flatCoordinates[end - stride];
	let y1 = flatCoordinates[end - stride + 1];
	for (; offset < end; offset += stride) {
		const x2 = flatCoordinates[offset];
		const y2 = flatCoordinates[offset + 1];
		twiceArea += y1 * x2 - x1 * y2;
		x1 = x2;
		y1 = y2;
	}
	return twiceArea / 2;
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {Array<number>} ends Ends.
* @param {number} stride Stride.
* @return {number} Area.
*/
function linearRings(flatCoordinates, offset, ends, stride) {
	let area = 0;
	for (let i = 0, ii = ends.length; i < ii; ++i) {
		const end = ends[i];
		area += linearRing(flatCoordinates, offset, end, stride);
		offset = end;
	}
	return area;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/LinearRing.js
/**
* @module ol/geom/LinearRing
*/
/**
* @classdesc
* Linear ring geometry. Only used as part of polygon; cannot be rendered
* on its own.
*
* @api
*/
var LinearRing = class LinearRing extends SimpleGeometry {
	/**
	* @param {Array<import("../coordinate.js").Coordinate>|Array<number>} coordinates Coordinates.
	*     For internal use, flat coordinates in combination with `layout` are also accepted.
	* @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
	*/
	constructor(coordinates, layout) {
		super();
		/**
		* @private
		* @type {number}
		*/
		this.maxDelta_ = -1;
		/**
		* @private
		* @type {number}
		*/
		this.maxDeltaRevision_ = -1;
		if (layout !== void 0 && !Array.isArray(coordinates[0])) this.setFlatCoordinates(layout, coordinates);
		else this.setCoordinates(coordinates, layout);
	}
	/**
	* Make a complete copy of the geometry.
	* @return {!LinearRing} Clone.
	* @api
	*/
	clone() {
		return new LinearRing(this.flatCoordinates.slice(), this.layout);
	}
	/**
	* @param {number} x X.
	* @param {number} y Y.
	* @param {import("../coordinate.js").Coordinate} closestPoint Closest point.
	* @param {number} minSquaredDistance Minimum squared distance.
	* @return {number} Minimum squared distance.
	*/
	closestPointXY(x, y, closestPoint, minSquaredDistance) {
		if (minSquaredDistance < closestSquaredDistanceXY(this.getExtent(), x, y)) return minSquaredDistance;
		if (this.maxDeltaRevision_ != this.getRevision()) {
			this.maxDelta_ = Math.sqrt(maxSquaredDelta(this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, 0));
			this.maxDeltaRevision_ = this.getRevision();
		}
		return assignClosestPoint(this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
	}
	/**
	* Return the area of the linear ring on projected plane.
	* @return {number} Area (on projected plane).
	* @api
	*/
	getArea() {
		return linearRing(this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
	}
	/**
	* Return the coordinates of the linear ring.
	* @return {Array<import("../coordinate.js").Coordinate>} Coordinates.
	* @api
	*/
	getCoordinates() {
		return inflateCoordinates(this.flatCoordinates, 0, this.flatCoordinates.length, this.stride);
	}
	/**
	* @param {number} squaredTolerance Squared tolerance.
	* @return {LinearRing} Simplified LinearRing.
	* @protected
	*/
	getSimplifiedGeometryInternal(squaredTolerance) {
		/** @type {Array<number>} */
		const simplifiedFlatCoordinates = [];
		simplifiedFlatCoordinates.length = douglasPeucker(this.flatCoordinates, 0, this.flatCoordinates.length, this.stride, squaredTolerance, simplifiedFlatCoordinates, 0);
		return new LinearRing(simplifiedFlatCoordinates, "XY");
	}
	/**
	* Get the type of this geometry.
	* @return {import("./Geometry.js").Type} Geometry type.
	* @api
	*/
	getType() {
		return "LinearRing";
	}
	/**
	* Test if the geometry and the passed extent intersect.
	* @param {import("../extent.js").Extent} extent Extent.
	* @return {boolean} `true` if the geometry and the extent intersect.
	* @api
	*/
	intersectsExtent(extent) {
		return false;
	}
	/**
	* Set the coordinates of the linear ring.
	* @param {!Array<import("../coordinate.js").Coordinate>} coordinates Coordinates.
	* @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
	* @api
	*/
	setCoordinates(coordinates, layout) {
		this.setLayout(layout, coordinates, 1);
		if (!this.flatCoordinates) this.flatCoordinates = [];
		this.flatCoordinates.length = deflateCoordinates(this.flatCoordinates, 0, coordinates, this.stride);
		this.changed();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/Point.js
/**
* @module ol/geom/Point
*/
/**
* @classdesc
* Point geometry.
*
* @api
*/
var Point = class Point extends SimpleGeometry {
	/**
	* @param {import("../coordinate.js").Coordinate} coordinates Coordinates.
	* @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
	*/
	constructor(coordinates, layout) {
		super();
		this.setCoordinates(coordinates, layout);
	}
	/**
	* Make a complete copy of the geometry.
	* @return {!Point} Clone.
	* @api
	*/
	clone() {
		const point = new Point(this.flatCoordinates.slice(), this.layout);
		point.applyProperties(this);
		return point;
	}
	/**
	* @param {number} x X.
	* @param {number} y Y.
	* @param {import("../coordinate.js").Coordinate} closestPoint Closest point.
	* @param {number} minSquaredDistance Minimum squared distance.
	* @return {number} Minimum squared distance.
	*/
	closestPointXY(x, y, closestPoint, minSquaredDistance) {
		const flatCoordinates = this.flatCoordinates;
		const squaredDistance$1 = squaredDistance(x, y, flatCoordinates[0], flatCoordinates[1]);
		if (squaredDistance$1 < minSquaredDistance) {
			const stride = this.stride;
			for (let i = 0; i < stride; ++i) closestPoint[i] = flatCoordinates[i];
			closestPoint.length = stride;
			return squaredDistance$1;
		}
		return minSquaredDistance;
	}
	/**
	* Return the coordinate of the point.
	* @return {import("../coordinate.js").Coordinate} Coordinates.
	* @api
	*/
	getCoordinates() {
		return this.flatCoordinates.slice();
	}
	/**
	* @param {import("../extent.js").Extent} extent Extent.
	* @protected
	* @return {import("../extent.js").Extent} extent Extent.
	*/
	computeExtent(extent) {
		return createOrUpdateFromCoordinate(this.flatCoordinates, extent);
	}
	/**
	* Get the type of this geometry.
	* @return {import("./Geometry.js").Type} Geometry type.
	* @api
	*/
	getType() {
		return "Point";
	}
	/**
	* Test if the geometry and the passed extent intersect.
	* @param {import("../extent.js").Extent} extent Extent.
	* @return {boolean} `true` if the geometry and the extent intersect.
	* @api
	*/
	intersectsExtent(extent) {
		return containsXY(extent, this.flatCoordinates[0], this.flatCoordinates[1]);
	}
	/**
	* @param {!Array<*>} coordinates Coordinates.
	* @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
	* @api
	*/
	setCoordinates(coordinates, layout) {
		this.setLayout(layout, coordinates, 0);
		if (!this.flatCoordinates) this.flatCoordinates = [];
		this.flatCoordinates.length = deflateCoordinate(this.flatCoordinates, 0, coordinates, this.stride);
		this.changed();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/flat/contains.js
/**
* @module ol/geom/flat/contains
*/
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {import("../../extent.js").Extent} extent Extent.
* @return {boolean} Contains extent.
*/
function linearRingContainsExtent(flatCoordinates, offset, end, stride, extent) {
	return !forEachCorner(
		extent,
		/**
		* @param {import("../../coordinate.js").Coordinate} coordinate Coordinate.
		* @return {boolean} Contains (x, y).
		*/
		function(coordinate) {
			return !linearRingContainsXY(flatCoordinates, offset, end, stride, coordinate[0], coordinate[1]);
		}
	);
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {number} x X.
* @param {number} y Y.
* @return {boolean} Contains (x, y).
*/
function linearRingContainsXY(flatCoordinates, offset, end, stride, x, y) {
	let wn = 0;
	let x1 = flatCoordinates[end - stride];
	let y1 = flatCoordinates[end - stride + 1];
	for (; offset < end; offset += stride) {
		const x2 = flatCoordinates[offset];
		const y2 = flatCoordinates[offset + 1];
		if (y1 <= y) {
			if (y2 > y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) > 0) wn++;
		} else if (y2 <= y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) < 0) wn--;
		x1 = x2;
		y1 = y2;
	}
	return wn !== 0;
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {Array<number>} ends Ends.
* @param {number} stride Stride.
* @param {number} x X.
* @param {number} y Y.
* @return {boolean} Contains (x, y).
*/
function linearRingsContainsXY(flatCoordinates, offset, ends, stride, x, y) {
	if (ends.length === 0) return false;
	if (!linearRingContainsXY(flatCoordinates, offset, ends[0], stride, x, y)) return false;
	for (let i = 1, ii = ends.length; i < ii; ++i) if (linearRingContainsXY(flatCoordinates, ends[i - 1], ends[i], stride, x, y)) return false;
	return true;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/flat/interiorpoint.js
/**
* @module ol/geom/flat/interiorpoint
*/
/**
* Calculates a point that is likely to lie in the interior of the linear rings.
* Inspired by JTS's com.vividsolutions.jts.geom.Geometry#getInteriorPoint.
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {Array<number>} ends Ends.
* @param {number} stride Stride.
* @param {Array<number>} flatCenters Flat centers.
* @param {number} flatCentersOffset Flat center offset.
* @param {Array<number>} [dest] Destination.
* @return {Array<number>} Destination point as XYM coordinate, where M is the
* length of the horizontal intersection that the point belongs to.
*/
function getInteriorPointOfArray(flatCoordinates, offset, ends, stride, flatCenters, flatCentersOffset, dest) {
	let i, ii, x, x1, x2, y1, y2;
	const y = flatCenters[flatCentersOffset + 1];
	/** @type {Array<number>} */
	const intersections = [];
	for (let r = 0, rr = ends.length; r < rr; ++r) {
		const end = ends[r];
		x1 = flatCoordinates[end - stride];
		y1 = flatCoordinates[end - stride + 1];
		for (i = offset; i < end; i += stride) {
			x2 = flatCoordinates[i];
			y2 = flatCoordinates[i + 1];
			if (y <= y1 && y2 <= y || y1 <= y && y <= y2) {
				x = (y - y1) / (y2 - y1) * (x2 - x1) + x1;
				intersections.push(x);
			}
			x1 = x2;
			y1 = y2;
		}
	}
	let pointX = NaN;
	let maxSegmentLength = -Infinity;
	intersections.sort(ascending);
	x1 = intersections[0];
	for (i = 1, ii = intersections.length; i < ii; ++i) {
		x2 = intersections[i];
		const segmentLength = Math.abs(x2 - x1);
		if (segmentLength > maxSegmentLength) {
			x = (x1 + x2) / 2;
			if (linearRingsContainsXY(flatCoordinates, offset, ends, stride, x, y)) {
				pointX = x;
				maxSegmentLength = segmentLength;
			}
		}
		x1 = x2;
	}
	if (isNaN(pointX)) pointX = flatCenters[flatCentersOffset];
	if (dest) {
		dest.push(pointX, y, maxSegmentLength);
		return dest;
	}
	return [
		pointX,
		y,
		maxSegmentLength
	];
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/flat/segments.js
/**
* @module ol/geom/flat/segments
*/
/**
* This function calls `callback` for each segment of the flat coordinates
* array. If the callback returns a truthy value the function returns that
* value immediately. Otherwise the function returns `false`.
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {function(import("../../coordinate.js").Coordinate, import("../../coordinate.js").Coordinate): T} callback Function
*     called for each segment.
* @return {T|boolean} Value.
* @template T
*/
function forEach(flatCoordinates, offset, end, stride, callback) {
	let ret;
	offset += stride;
	for (; offset < end; offset += stride) {
		ret = callback(flatCoordinates.slice(offset - stride, offset), flatCoordinates.slice(offset, offset + stride));
		if (ret) return ret;
	}
	return false;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/flat/intersectsextent.js
/**
* @module ol/geom/flat/intersectsextent
*/
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {import("../../extent.js").Extent} extent Extent.
* @return {boolean} True if the geometry and the extent intersect.
*/
function intersectsLineString(flatCoordinates, offset, end, stride, extent) {
	const coordinatesExtent = extendFlatCoordinates(createEmpty(), flatCoordinates, offset, end, stride);
	if (!intersects(extent, coordinatesExtent)) return false;
	if (containsExtent(extent, coordinatesExtent)) return true;
	if (coordinatesExtent[0] >= extent[0] && coordinatesExtent[2] <= extent[2]) return true;
	if (coordinatesExtent[1] >= extent[1] && coordinatesExtent[3] <= extent[3]) return true;
	return forEach(
		flatCoordinates,
		offset,
		end,
		stride,
		/**
		* @param {import("../../coordinate.js").Coordinate} point1 Start point.
		* @param {import("../../coordinate.js").Coordinate} point2 End point.
		* @return {boolean} `true` if the segment and the extent intersect,
		*     `false` otherwise.
		*/
		function(point1, point2) {
			return intersectsSegment(extent, point1, point2);
		}
	);
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {import("../../extent.js").Extent} extent Extent.
* @return {boolean} True if the geometry and the extent intersect.
*/
function intersectsLinearRing(flatCoordinates, offset, end, stride, extent) {
	if (intersectsLineString(flatCoordinates, offset, end, stride, extent)) return true;
	if (linearRingContainsXY(flatCoordinates, offset, end, stride, extent[0], extent[1])) return true;
	if (linearRingContainsXY(flatCoordinates, offset, end, stride, extent[0], extent[3])) return true;
	if (linearRingContainsXY(flatCoordinates, offset, end, stride, extent[2], extent[1])) return true;
	if (linearRingContainsXY(flatCoordinates, offset, end, stride, extent[2], extent[3])) return true;
	return false;
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {Array<number>} ends Ends.
* @param {number} stride Stride.
* @param {import("../../extent.js").Extent} extent Extent.
* @return {boolean} True if the geometry and the extent intersect.
*/
function intersectsLinearRingArray(flatCoordinates, offset, ends, stride, extent) {
	if (!intersectsLinearRing(flatCoordinates, offset, ends[0], stride, extent)) return false;
	if (ends.length === 1) return true;
	for (let i = 1, ii = ends.length; i < ii; ++i) if (linearRingContainsExtent(flatCoordinates, ends[i - 1], ends[i], stride, extent)) {
		if (!intersectsLineString(flatCoordinates, ends[i - 1], ends[i], stride, extent)) return false;
	}
	return true;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/flat/reverse.js
/**
* @module ol/geom/flat/reverse
*/
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
*/
function coordinates(flatCoordinates, offset, end, stride) {
	while (offset < end - stride) {
		for (let i = 0; i < stride; ++i) {
			const tmp = flatCoordinates[offset + i];
			flatCoordinates[offset + i] = flatCoordinates[end - stride + i];
			flatCoordinates[end - stride + i] = tmp;
		}
		offset += stride;
		end -= stride;
	}
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/flat/orient.js
/**
* @module ol/geom/flat/orient
*/
/**
* Is the linear ring oriented clockwise in a coordinate system with a bottom-left
* coordinate origin? For a coordinate system with a top-left coordinate origin,
* the ring's orientation is clockwise when this function returns false.
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @return {boolean|undefined} Is clockwise.
*/
function linearRingIsClockwise(flatCoordinates, offset, end, stride) {
	let edge = 0;
	let x1 = flatCoordinates[end - stride];
	let y1 = flatCoordinates[end - stride + 1];
	for (; offset < end; offset += stride) {
		const x2 = flatCoordinates[offset];
		const y2 = flatCoordinates[offset + 1];
		edge += (x2 - x1) * (y2 + y1);
		x1 = x2;
		y1 = y2;
	}
	return edge === 0 ? void 0 : edge > 0;
}
/**
* Determines if linear rings are oriented.  By default, left-hand orientation
* is tested (first ring must be clockwise, remaining rings counter-clockwise).
* To test for right-hand orientation, use the `right` argument.
*
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {Array<number>} ends Array of end indexes.
* @param {number} stride Stride.
* @param {boolean} [right] Test for right-hand orientation
*     (counter-clockwise exterior ring and clockwise interior rings).
* @return {boolean} Rings are correctly oriented.
*/
function linearRingsAreOriented(flatCoordinates, offset, ends, stride, right) {
	right = right !== void 0 ? right : false;
	for (let i = 0, ii = ends.length; i < ii; ++i) {
		const end = ends[i];
		const isClockwise = linearRingIsClockwise(flatCoordinates, offset, end, stride);
		if (i === 0) {
			if (right && isClockwise || !right && !isClockwise) return false;
		} else if (right && !isClockwise || !right && isClockwise) return false;
		offset = end;
	}
	return true;
}
/**
* Orient coordinates in a flat array of linear rings.  By default, rings
* are oriented following the left-hand rule (clockwise for exterior and
* counter-clockwise for interior rings).  To orient according to the
* right-hand rule, use the `right` argument.
*
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {Array<number>} ends Ends.
* @param {number} stride Stride.
* @param {boolean} [right] Follow the right-hand rule for orientation.
* @return {number} End.
*/
function orientLinearRings(flatCoordinates, offset, ends, stride, right) {
	right = right !== void 0 ? right : false;
	for (let i = 0, ii = ends.length; i < ii; ++i) {
		const end = ends[i];
		const isClockwise = linearRingIsClockwise(flatCoordinates, offset, end, stride);
		if (i === 0 ? right && isClockwise || !right && !isClockwise : right && !isClockwise || !right && isClockwise) coordinates(flatCoordinates, offset, end, stride);
		offset = end;
	}
	return offset;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/geom/Polygon.js
/**
* @module ol/geom/Polygon
*/
/**
* @classdesc
* Polygon geometry.
*
* @api
*/
var Polygon = class Polygon extends SimpleGeometry {
	/**
	* @param {!Array<Array<import("../coordinate.js").Coordinate>>|!Array<number>} coordinates
	*     Array of linear rings that define the polygon. The first linear ring of the
	*     array defines the outer-boundary or surface of the polygon. Each subsequent
	*     linear ring defines a hole in the surface of the polygon. A linear ring is
	*     an array of vertices' coordinates where the first coordinate and the last are
	*     equivalent. (For internal use, flat coordinates in combination with
	*     `layout` and `ends` are also accepted.)
	* @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
	* @param {Array<number>} [ends] Ends (for internal use with flat coordinates).
	*/
	constructor(coordinates, layout, ends) {
		super();
		/**
		* @type {Array<number>}
		* @private
		*/
		this.ends_ = [];
		/**
		* @private
		* @type {number}
		*/
		this.flatInteriorPointRevision_ = -1;
		/**
		* @private
		* @type {import("../coordinate.js").Coordinate|null}
		*/
		this.flatInteriorPoint_ = null;
		/**
		* @private
		* @type {number}
		*/
		this.maxDelta_ = -1;
		/**
		* @private
		* @type {number}
		*/
		this.maxDeltaRevision_ = -1;
		/**
		* @private
		* @type {number}
		*/
		this.orientedRevision_ = -1;
		/**
		* @private
		* @type {Array<number>|null}
		*/
		this.orientedFlatCoordinates_ = null;
		if (layout !== void 0 && ends) {
			this.setFlatCoordinates(layout, coordinates);
			this.ends_ = ends;
		} else this.setCoordinates(coordinates, layout);
	}
	/**
	* Append the passed linear ring to this polygon.
	* @param {LinearRing} linearRing Linear ring.
	* @api
	*/
	appendLinearRing(linearRing) {
		if (!this.flatCoordinates) this.flatCoordinates = linearRing.getFlatCoordinates().slice();
		else extend(this.flatCoordinates, linearRing.getFlatCoordinates());
		this.ends_.push(this.flatCoordinates.length);
		this.changed();
	}
	/**
	* Make a complete copy of the geometry.
	* @return {!Polygon} Clone.
	* @api
	*/
	clone() {
		const polygon = new Polygon(this.flatCoordinates.slice(), this.layout, this.ends_.slice());
		polygon.applyProperties(this);
		return polygon;
	}
	/**
	* @param {number} x X.
	* @param {number} y Y.
	* @param {import("../coordinate.js").Coordinate} closestPoint Closest point.
	* @param {number} minSquaredDistance Minimum squared distance.
	* @return {number} Minimum squared distance.
	*/
	closestPointXY(x, y, closestPoint, minSquaredDistance) {
		if (minSquaredDistance < closestSquaredDistanceXY(this.getExtent(), x, y)) return minSquaredDistance;
		if (this.maxDeltaRevision_ != this.getRevision()) {
			this.maxDelta_ = Math.sqrt(arrayMaxSquaredDelta(this.flatCoordinates, 0, this.ends_, this.stride, 0));
			this.maxDeltaRevision_ = this.getRevision();
		}
		return assignClosestArrayPoint(this.flatCoordinates, 0, this.ends_, this.stride, this.maxDelta_, true, x, y, closestPoint, minSquaredDistance);
	}
	/**
	* @param {number} x X.
	* @param {number} y Y.
	* @return {boolean} Contains (x, y).
	*/
	containsXY(x, y) {
		return linearRingsContainsXY(this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride, x, y);
	}
	/**
	* Return the area of the polygon on projected plane.
	* @return {number} Area (on projected plane).
	* @api
	*/
	getArea() {
		return linearRings(this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride);
	}
	/**
	* Get the coordinate array for this geometry.  This array has the structure
	* of a GeoJSON coordinate array for polygons.
	*
	* @param {boolean} [right] Orient coordinates according to the right-hand
	*     rule (counter-clockwise for exterior and clockwise for interior rings).
	*     If `false`, coordinates will be oriented according to the left-hand rule
	*     (clockwise for exterior and counter-clockwise for interior rings).
	*     By default, coordinate orientation will depend on how the geometry was
	*     constructed.
	* @return {Array<Array<import("../coordinate.js").Coordinate>>} Coordinates.
	* @api
	*/
	getCoordinates(right) {
		let flatCoordinates;
		if (right !== void 0) {
			flatCoordinates = this.getOrientedFlatCoordinates().slice();
			orientLinearRings(flatCoordinates, 0, this.ends_, this.stride, right);
		} else flatCoordinates = this.flatCoordinates;
		return inflateCoordinatesArray(flatCoordinates, 0, this.ends_, this.stride);
	}
	/**
	* @return {Array<number>} Ends.
	*/
	getEnds() {
		return this.ends_;
	}
	/**
	* @return {Array<number>} Interior point.
	*/
	getFlatInteriorPoint() {
		if (this.flatInteriorPointRevision_ != this.getRevision()) {
			const flatCenter = getCenter(this.getExtent());
			this.flatInteriorPoint_ = getInteriorPointOfArray(this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride, flatCenter, 0);
			this.flatInteriorPointRevision_ = this.getRevision();
		}
		return this.flatInteriorPoint_;
	}
	/**
	* Return an interior point of the polygon.
	* @return {Point} Interior point as XYM coordinate, where M is the
	* length of the horizontal intersection that the point belongs to.
	* @api
	*/
	getInteriorPoint() {
		return new Point(this.getFlatInteriorPoint(), "XYM");
	}
	/**
	* Return the number of rings of the polygon,  this includes the exterior
	* ring and any interior rings.
	*
	* @return {number} Number of rings.
	* @api
	*/
	getLinearRingCount() {
		return this.ends_.length;
	}
	/**
	* Return the Nth linear ring of the polygon geometry. Return `null` if the
	* given index is out of range.
	* The exterior linear ring is available at index `0` and the interior rings
	* at index `1` and beyond.
	*
	* @param {number} index Index.
	* @return {LinearRing|null} Linear ring.
	* @api
	*/
	getLinearRing(index) {
		if (index < 0 || this.ends_.length <= index) return null;
		return new LinearRing(this.flatCoordinates.slice(index === 0 ? 0 : this.ends_[index - 1], this.ends_[index]), this.layout);
	}
	/**
	* Return the linear rings of the polygon.
	* @return {Array<LinearRing>} Linear rings.
	* @api
	*/
	getLinearRings() {
		const layout = this.layout;
		const flatCoordinates = this.flatCoordinates;
		const ends = this.ends_;
		const linearRings = [];
		let offset = 0;
		for (let i = 0, ii = ends.length; i < ii; ++i) {
			const end = ends[i];
			const linearRing = new LinearRing(flatCoordinates.slice(offset, end), layout);
			linearRings.push(linearRing);
			offset = end;
		}
		return linearRings;
	}
	/**
	* @return {Array<number>} Oriented flat coordinates.
	*/
	getOrientedFlatCoordinates() {
		if (this.orientedRevision_ != this.getRevision()) {
			const flatCoordinates = this.flatCoordinates;
			if (linearRingsAreOriented(flatCoordinates, 0, this.ends_, this.stride)) this.orientedFlatCoordinates_ = flatCoordinates;
			else {
				this.orientedFlatCoordinates_ = flatCoordinates.slice();
				this.orientedFlatCoordinates_.length = orientLinearRings(this.orientedFlatCoordinates_, 0, this.ends_, this.stride);
			}
			this.orientedRevision_ = this.getRevision();
		}
		return this.orientedFlatCoordinates_;
	}
	/**
	* @param {number} squaredTolerance Squared tolerance.
	* @return {Polygon} Simplified Polygon.
	* @protected
	*/
	getSimplifiedGeometryInternal(squaredTolerance) {
		/** @type {Array<number>} */
		const simplifiedFlatCoordinates = [];
		/** @type {Array<number>} */
		const simplifiedEnds = [];
		simplifiedFlatCoordinates.length = quantizeArray(this.flatCoordinates, 0, this.ends_, this.stride, Math.sqrt(squaredTolerance), simplifiedFlatCoordinates, 0, simplifiedEnds);
		return new Polygon(simplifiedFlatCoordinates, "XY", simplifiedEnds);
	}
	/**
	* Get the type of this geometry.
	* @return {import("./Geometry.js").Type} Geometry type.
	* @api
	*/
	getType() {
		return "Polygon";
	}
	/**
	* Test if the geometry and the passed extent intersect.
	* @param {import("../extent.js").Extent} extent Extent.
	* @return {boolean} `true` if the geometry and the extent intersect.
	* @api
	*/
	intersectsExtent(extent) {
		return intersectsLinearRingArray(this.getOrientedFlatCoordinates(), 0, this.ends_, this.stride, extent);
	}
	/**
	* Set the coordinates of the polygon.
	* @param {!Array<Array<import("../coordinate.js").Coordinate>>} coordinates Coordinates.
	* @param {import("./Geometry.js").GeometryLayout} [layout] Layout.
	* @api
	*/
	setCoordinates(coordinates, layout) {
		this.setLayout(layout, coordinates, 2);
		if (!this.flatCoordinates) this.flatCoordinates = [];
		const ends = deflateCoordinatesArray(this.flatCoordinates, 0, coordinates, this.stride, this.ends_);
		this.flatCoordinates.length = ends.length === 0 ? 0 : ends[ends.length - 1];
		this.changed();
	}
};
/**
* Create a polygon from an extent. The layout used is `XY`.
* @param {import("../extent.js").Extent} extent The extent.
* @return {Polygon} The polygon.
* @api
*/
function fromExtent(extent) {
	if (isEmpty$1(extent)) throw new Error("Cannot create polygon from empty extent");
	const minX = extent[0];
	const minY = extent[1];
	const maxX = extent[2];
	const maxY = extent[3];
	const flatCoordinates = [
		minX,
		minY,
		minX,
		maxY,
		maxX,
		maxY,
		maxX,
		minY,
		minX,
		minY
	];
	return new Polygon(flatCoordinates, "XY", [flatCoordinates.length]);
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/render/EventType.js
/**
* @module ol/render/EventType
*/
/**
* @enum {string}
*/
var EventType_default$1 = {
	/**
	* Triggered before a layer is rendered.
	* @event module:ol/render/Event~RenderEvent#prerender
	* @api
	*/
	PRERENDER: "prerender",
	/**
	* Triggered after a layer is rendered.
	* @event module:ol/render/Event~RenderEvent#postrender
	* @api
	*/
	POSTRENDER: "postrender",
	/**
	* Triggered before layers are composed.  When dispatched by the map, the event object will not have
	* a `context` set.  When dispatched by a layer, the event object will have a `context` set.  Only
	* WebGL layers currently dispatch this event.
	* @event module:ol/render/Event~RenderEvent#precompose
	* @api
	*/
	PRECOMPOSE: "precompose",
	/**
	* Triggered after layers are composed.  When dispatched by the map, the event object will not have
	* a `context` set.  When dispatched by a layer, the event object will have a `context` set.  Only
	* WebGL layers currently dispatch this event.
	* @event module:ol/render/Event~RenderEvent#postcompose
	* @api
	*/
	POSTCOMPOSE: "postcompose",
	/**
	* Triggered when rendering is complete, i.e. all sources and tiles have
	* finished loading for the current viewport, and all tiles are faded in.
	* The event object will not have a `context` set.
	* @event module:ol/render/Event~RenderEvent#rendercomplete
	* @api
	*/
	RENDERCOMPLETE: "rendercomplete"
};
/**
* @typedef {'postrender'|'precompose'|'postcompose'|'rendercomplete'} MapRenderEventTypes
*/
/**
* @typedef {'postrender'|'prerender'} LayerRenderEventTypes
*/
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/ImageState.js
/**
* @module ol/ImageState
*/
/**
* @enum {number}
*/
var ImageState_default = {
	IDLE: 0,
	LOADING: 1,
	LOADED: 2,
	ERROR: 3,
	EMPTY: 4
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@2.3.2/node_modules/color-space/rgb.js
/**
* RGB space.
*
* @module  color-space/rgb
*/
var rgb$1 = {
	name: "rgb",
	min: [
		0,
		0,
		0
	],
	max: [
		255,
		255,
		255
	],
	channel: [
		"red",
		"green",
		"blue"
	],
	alias: ["RGB"]
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@2.3.2/node_modules/color-space/xyz.js
/**
* CIE XYZ
*
* @module  color-space/xyz
*/
var xyz$1 = {
	name: "xyz",
	min: [
		0,
		0,
		0
	],
	channel: [
		"X",
		"Y",
		"Z"
	],
	alias: [
		"XYZ",
		"ciexyz",
		"cie1931"
	],
	whitepoint: {
		2: {
			A: [
				109.85,
				100,
				35.585
			],
			C: [
				98.074,
				100,
				118.232
			],
			D50: [
				96.422,
				100,
				82.521
			],
			D55: [
				95.682,
				100,
				92.149
			],
			D65: [
				95.045592705167,
				100,
				108.9057750759878
			],
			D75: [
				94.972,
				100,
				122.638
			],
			F2: [
				99.187,
				100,
				67.395
			],
			F7: [
				95.044,
				100,
				108.755
			],
			F11: [
				100.966,
				100,
				64.37
			],
			E: [
				100,
				100,
				100
			]
		},
		10: {
			A: [
				111.144,
				100,
				35.2
			],
			C: [
				97.285,
				100,
				116.145
			],
			D50: [
				96.72,
				100,
				81.427
			],
			D55: [
				95.799,
				100,
				90.926
			],
			D65: [
				94.811,
				100,
				107.304
			],
			D75: [
				94.416,
				100,
				120.641
			],
			F2: [
				103.28,
				100,
				69.026
			],
			F7: [
				95.792,
				100,
				107.687
			],
			F11: [
				103.866,
				100,
				65.627
			],
			E: [
				100,
				100,
				100
			]
		}
	}
};
/**
* Top values are the whitepoint’s top values, default are D65
*/
xyz$1.max = xyz$1.whitepoint[2].D65;
/**
* Transform xyz to rgb
*
* @param {Array<number>} _xyz Array of xyz values
* @param {Array<number>} white Whitepoint reference
* @return {Array<number>} RGB values
*/
xyz$1.rgb = function(_xyz, white) {
	white = white || xyz$1.whitepoint[2].E;
	var x = _xyz[0] / white[0], y = _xyz[1] / white[1], z = _xyz[2] / white[2], r = x * 3.240969941904521 + y * -1.537383177570093 + z * -.498610760293, g = x * -.96924363628087 + y * 1.87596750150772 + z * .041555057407175, b = x * .055630079696993 + y * -.20397695888897 + z * 1.056971514242878;
	r = r > .0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - .055 : r = r * 12.92;
	g = g > .0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - .055 : g = g * 12.92;
	b = b > .0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - .055 : b = b * 12.92;
	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);
	return [
		r * 255,
		g * 255,
		b * 255
	];
};
/**
* RGB to XYZ
*
* @param {Array<number>} rgb RGB channels
*
* @return {Array<number>} XYZ channels
*/
rgb$1.xyz = function(rgb, white) {
	var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
	r = r > .04045 ? Math.pow((r + .055) / 1.055, 2.4) : r / 12.92;
	g = g > .04045 ? Math.pow((g + .055) / 1.055, 2.4) : g / 12.92;
	b = b > .04045 ? Math.pow((b + .055) / 1.055, 2.4) : b / 12.92;
	var x = r * .41239079926595 + g * .35758433938387 + b * .18048078840183;
	var y = r * .21263900587151 + g * .71516867876775 + b * .072192315360733;
	var z = r * .019330818715591 + g * .11919477979462 + b * .95053215224966;
	white = white || xyz$1.whitepoint[2].E;
	return [
		x * white[0],
		y * white[1],
		z * white[2]
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@2.3.2/node_modules/color-space/luv.js
/**
* CIE LUV (C'est la vie)
*
* @module color-space/luv
*/
var luv$1 = {
	name: "luv",
	min: [
		0,
		-134,
		-140
	],
	max: [
		100,
		224,
		122
	],
	channel: [
		"lightness",
		"u",
		"v"
	],
	alias: [
		"LUV",
		"cieluv",
		"cie1976"
	],
	xyz: function(arg, i, o) {
		var _u, _v, l = arg[0], u = arg[1], v = arg[2], x, y, z, xn, yn, zn, un, vn;
		if (l === 0) return [
			0,
			0,
			0
		];
		var k = .0011070564598794539;
		i = i || "D65";
		o = o || 2;
		xn = xyz$1.whitepoint[o][i][0];
		yn = xyz$1.whitepoint[o][i][1];
		zn = xyz$1.whitepoint[o][i][2];
		un = 4 * xn / (xn + 15 * yn + 3 * zn);
		vn = 9 * yn / (xn + 15 * yn + 3 * zn);
		_u = u / (13 * l) + un || 0;
		_v = v / (13 * l) + vn || 0;
		y = l > 8 ? yn * Math.pow((l + 16) / 116, 3) : yn * l * k;
		x = y * 9 * _u / (4 * _v) || 0;
		z = y * (12 - 3 * _u - 20 * _v) / (4 * _v) || 0;
		return [
			x,
			y,
			z
		];
	}
};
xyz$1.luv = function(arg, i, o) {
	var _u, _v, l, u, v, x, y, z, xn, yn, zn, un, vn;
	var e = .008856451679035631;
	var k = 903.2962962962961;
	i = i || "D65";
	o = o || 2;
	xn = xyz$1.whitepoint[o][i][0];
	yn = xyz$1.whitepoint[o][i][1];
	zn = xyz$1.whitepoint[o][i][2];
	un = 4 * xn / (xn + 15 * yn + 3 * zn);
	vn = 9 * yn / (xn + 15 * yn + 3 * zn);
	x = arg[0], y = arg[1], z = arg[2];
	_u = 4 * x / (x + 15 * y + 3 * z) || 0;
	_v = 9 * y / (x + 15 * y + 3 * z) || 0;
	var yr = y / yn;
	l = yr <= e ? k * yr : 116 * Math.pow(yr, 1 / 3) - 16;
	u = 13 * l * (_u - un);
	v = 13 * l * (_v - vn);
	return [
		l,
		u,
		v
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@2.3.2/node_modules/color-space/lchuv.js
/**
* Cylindrical CIE LUV
*
* @module color-space/lchuv
*/
var lchuv$1 = {
	name: "lchuv",
	channel: [
		"lightness",
		"chroma",
		"hue"
	],
	alias: ["LCHuv", "cielchuv"],
	min: [
		0,
		0,
		0
	],
	max: [
		100,
		100,
		360
	],
	luv: function(luv) {
		var l = luv[0], c = luv[1], h = luv[2], u, v, hr = h / 360 * 2 * Math.PI;
		u = c * Math.cos(hr);
		v = c * Math.sin(hr);
		return [
			l,
			u,
			v
		];
	},
	xyz: function(arg) {
		return luv$1.xyz(lchuv$1.luv(arg));
	}
};
luv$1.lchuv = function(luv) {
	var l = luv[0], u = luv[1], v = luv[2];
	var c = Math.sqrt(u * u + v * v);
	var h = Math.atan2(v, u) * 360 / 2 / Math.PI;
	if (h < 0) h += 360;
	return [
		l,
		c,
		h
	];
};
xyz$1.lchuv = function(arg) {
	return luv$1.lchuv(xyz$1.luv(arg));
};
//#endregion
//#region ../../node_modules/.pnpm/color-name@2.1.1/node_modules/color-name/index.js
var colors = {
	aliceblue: [
		240,
		248,
		255
	],
	antiquewhite: [
		250,
		235,
		215
	],
	aqua: [
		0,
		255,
		255
	],
	aquamarine: [
		127,
		255,
		212
	],
	azure: [
		240,
		255,
		255
	],
	beige: [
		245,
		245,
		220
	],
	bisque: [
		255,
		228,
		196
	],
	black: [
		0,
		0,
		0
	],
	blanchedalmond: [
		255,
		235,
		205
	],
	blue: [
		0,
		0,
		255
	],
	blueviolet: [
		138,
		43,
		226
	],
	brown: [
		165,
		42,
		42
	],
	burlywood: [
		222,
		184,
		135
	],
	cadetblue: [
		95,
		158,
		160
	],
	chartreuse: [
		127,
		255,
		0
	],
	chocolate: [
		210,
		105,
		30
	],
	coral: [
		255,
		127,
		80
	],
	cornflowerblue: [
		100,
		149,
		237
	],
	cornsilk: [
		255,
		248,
		220
	],
	crimson: [
		220,
		20,
		60
	],
	cyan: [
		0,
		255,
		255
	],
	darkblue: [
		0,
		0,
		139
	],
	darkcyan: [
		0,
		139,
		139
	],
	darkgoldenrod: [
		184,
		134,
		11
	],
	darkgray: [
		169,
		169,
		169
	],
	darkgreen: [
		0,
		100,
		0
	],
	darkgrey: [
		169,
		169,
		169
	],
	darkkhaki: [
		189,
		183,
		107
	],
	darkmagenta: [
		139,
		0,
		139
	],
	darkolivegreen: [
		85,
		107,
		47
	],
	darkorange: [
		255,
		140,
		0
	],
	darkorchid: [
		153,
		50,
		204
	],
	darkred: [
		139,
		0,
		0
	],
	darksalmon: [
		233,
		150,
		122
	],
	darkseagreen: [
		143,
		188,
		143
	],
	darkslateblue: [
		72,
		61,
		139
	],
	darkslategray: [
		47,
		79,
		79
	],
	darkslategrey: [
		47,
		79,
		79
	],
	darkturquoise: [
		0,
		206,
		209
	],
	darkviolet: [
		148,
		0,
		211
	],
	deeppink: [
		255,
		20,
		147
	],
	deepskyblue: [
		0,
		191,
		255
	],
	dimgray: [
		105,
		105,
		105
	],
	dimgrey: [
		105,
		105,
		105
	],
	dodgerblue: [
		30,
		144,
		255
	],
	firebrick: [
		178,
		34,
		34
	],
	floralwhite: [
		255,
		250,
		240
	],
	forestgreen: [
		34,
		139,
		34
	],
	fuchsia: [
		255,
		0,
		255
	],
	gainsboro: [
		220,
		220,
		220
	],
	ghostwhite: [
		248,
		248,
		255
	],
	gold: [
		255,
		215,
		0
	],
	goldenrod: [
		218,
		165,
		32
	],
	gray: [
		128,
		128,
		128
	],
	green: [
		0,
		128,
		0
	],
	greenyellow: [
		173,
		255,
		47
	],
	grey: [
		128,
		128,
		128
	],
	honeydew: [
		240,
		255,
		240
	],
	hotpink: [
		255,
		105,
		180
	],
	indianred: [
		205,
		92,
		92
	],
	indigo: [
		75,
		0,
		130
	],
	ivory: [
		255,
		255,
		240
	],
	khaki: [
		240,
		230,
		140
	],
	lavender: [
		230,
		230,
		250
	],
	lavenderblush: [
		255,
		240,
		245
	],
	lawngreen: [
		124,
		252,
		0
	],
	lemonchiffon: [
		255,
		250,
		205
	],
	lightblue: [
		173,
		216,
		230
	],
	lightcoral: [
		240,
		128,
		128
	],
	lightcyan: [
		224,
		255,
		255
	],
	lightgoldenrodyellow: [
		250,
		250,
		210
	],
	lightgray: [
		211,
		211,
		211
	],
	lightgreen: [
		144,
		238,
		144
	],
	lightgrey: [
		211,
		211,
		211
	],
	lightpink: [
		255,
		182,
		193
	],
	lightsalmon: [
		255,
		160,
		122
	],
	lightseagreen: [
		32,
		178,
		170
	],
	lightskyblue: [
		135,
		206,
		250
	],
	lightslategray: [
		119,
		136,
		153
	],
	lightslategrey: [
		119,
		136,
		153
	],
	lightsteelblue: [
		176,
		196,
		222
	],
	lightyellow: [
		255,
		255,
		224
	],
	lime: [
		0,
		255,
		0
	],
	limegreen: [
		50,
		205,
		50
	],
	linen: [
		250,
		240,
		230
	],
	magenta: [
		255,
		0,
		255
	],
	maroon: [
		128,
		0,
		0
	],
	mediumaquamarine: [
		102,
		205,
		170
	],
	mediumblue: [
		0,
		0,
		205
	],
	mediumorchid: [
		186,
		85,
		211
	],
	mediumpurple: [
		147,
		112,
		219
	],
	mediumseagreen: [
		60,
		179,
		113
	],
	mediumslateblue: [
		123,
		104,
		238
	],
	mediumspringgreen: [
		0,
		250,
		154
	],
	mediumturquoise: [
		72,
		209,
		204
	],
	mediumvioletred: [
		199,
		21,
		133
	],
	midnightblue: [
		25,
		25,
		112
	],
	mintcream: [
		245,
		255,
		250
	],
	mistyrose: [
		255,
		228,
		225
	],
	moccasin: [
		255,
		228,
		181
	],
	navajowhite: [
		255,
		222,
		173
	],
	navy: [
		0,
		0,
		128
	],
	oldlace: [
		253,
		245,
		230
	],
	olive: [
		128,
		128,
		0
	],
	olivedrab: [
		107,
		142,
		35
	],
	orange: [
		255,
		165,
		0
	],
	orangered: [
		255,
		69,
		0
	],
	orchid: [
		218,
		112,
		214
	],
	palegoldenrod: [
		238,
		232,
		170
	],
	palegreen: [
		152,
		251,
		152
	],
	paleturquoise: [
		175,
		238,
		238
	],
	palevioletred: [
		219,
		112,
		147
	],
	papayawhip: [
		255,
		239,
		213
	],
	peachpuff: [
		255,
		218,
		185
	],
	peru: [
		205,
		133,
		63
	],
	pink: [
		255,
		192,
		203
	],
	plum: [
		221,
		160,
		221
	],
	powderblue: [
		176,
		224,
		230
	],
	purple: [
		128,
		0,
		128
	],
	rebeccapurple: [
		102,
		51,
		153
	],
	red: [
		255,
		0,
		0
	],
	rosybrown: [
		188,
		143,
		143
	],
	royalblue: [
		65,
		105,
		225
	],
	saddlebrown: [
		139,
		69,
		19
	],
	salmon: [
		250,
		128,
		114
	],
	sandybrown: [
		244,
		164,
		96
	],
	seagreen: [
		46,
		139,
		87
	],
	seashell: [
		255,
		245,
		238
	],
	sienna: [
		160,
		82,
		45
	],
	silver: [
		192,
		192,
		192
	],
	skyblue: [
		135,
		206,
		235
	],
	slateblue: [
		106,
		90,
		205
	],
	slategray: [
		112,
		128,
		144
	],
	slategrey: [
		112,
		128,
		144
	],
	snow: [
		255,
		250,
		250
	],
	springgreen: [
		0,
		255,
		127
	],
	steelblue: [
		70,
		130,
		180
	],
	tan: [
		210,
		180,
		140
	],
	teal: [
		0,
		128,
		128
	],
	thistle: [
		216,
		191,
		216
	],
	tomato: [
		255,
		99,
		71
	],
	turquoise: [
		64,
		224,
		208
	],
	violet: [
		238,
		130,
		238
	],
	wheat: [
		245,
		222,
		179
	],
	white: [
		255,
		255,
		255
	],
	whitesmoke: [
		245,
		245,
		245
	],
	yellow: [
		255,
		255,
		0
	],
	yellowgreen: [
		154,
		205,
		50
	]
};
for (const key in colors) Object.freeze(colors[key]);
var color_name_default = Object.freeze(colors);
//#endregion
//#region ../../node_modules/.pnpm/color-parse@2.1.2/node_modules/color-parse/index.js
/**
* @module color-parse
*/
var color_parse_default = parse$1;
/**
* Base hues
* http://dev.w3.org/csswg/css-color/#typedef-named-hue
*/
var baseHues = {
	red: 0,
	orange: 60,
	yellow: 120,
	green: 180,
	blue: 240,
	purple: 300
};
/**
* Parse color from the string passed
*
* @return {Object} A space indicator `space`, an array `values` and `alpha`
*/
function parse$1(cstr) {
	var m, parts = [], alpha = 1, space;
	if (typeof cstr === "number") return {
		space: "rgb",
		values: [
			cstr >>> 16,
			(cstr & 65280) >>> 8,
			cstr & 255
		],
		alpha: 1
	};
	cstr = String(cstr).toLowerCase();
	if (color_name_default[cstr]) {
		parts = color_name_default[cstr].slice();
		space = "rgb";
	} else if (cstr === "transparent") {
		alpha = 0;
		space = "rgb";
		parts = [
			0,
			0,
			0
		];
	} else if (cstr[0] === "#") {
		var base = cstr.slice(1);
		var size = base.length;
		if (/^[0-9a-f]{3,8}$/.test(base) && size !== 5 && size !== 7) {
			var isShort = size <= 4;
			alpha = 1;
			if (isShort) {
				parts = [
					parseInt(base[0] + base[0], 16),
					parseInt(base[1] + base[1], 16),
					parseInt(base[2] + base[2], 16)
				];
				if (size === 4) alpha = parseInt(base[3] + base[3], 16) / 255;
			} else {
				parts = [
					parseInt(base[0] + base[1], 16),
					parseInt(base[2] + base[3], 16),
					parseInt(base[4] + base[5], 16)
				];
				if (size === 8) alpha = parseInt(base[6] + base[7], 16) / 255;
			}
			space = "rgb";
		}
	} else if (m = /^((?:rgba?|hs[lvb]a?|hwba?|cmyk?|xy[zy]|gray|lab|lchu?v?|[ly]uv|lms|oklch|oklab|color))\s*\(([^\)]*)\)/.exec(cstr)) {
		space = m[1].replace(/a$/, "");
		var dims = space === "cmyk" ? 4 : space === "gray" ? 1 : 3;
		parts = m[2].trim().split(/\s*[,\/]\s*|\s+/);
		if (space === "color") space = parts.shift();
		parts = parts.map(function(x, i) {
			if (x[x.length - 1] === "%") {
				x = parseFloat(x) / 100;
				if (i === 3) return x;
				if (space === "rgb") return x * 255;
				if (space[0] === "h") return x * 100;
				if (space[0] === "l" && !i) return x * 100;
				if (space === "lab") return x * 125;
				if (space === "lch") return i < 2 ? x * 150 : x * 360;
				if (space[0] === "o" && !i) return x;
				if (space === "oklab") return x * .4;
				if (space === "oklch") return i < 2 ? x * .4 : x * 360;
				return x;
			}
			if (space[i] === "h" || i === 2 && space[space.length - 1] === "h") {
				if (baseHues[x] !== void 0) return baseHues[x];
				if (x.endsWith("deg")) return parseFloat(x);
				if (x.endsWith("turn")) return parseFloat(x) * 360;
				if (x.endsWith("grad")) return parseFloat(x) * 360 / 400;
				if (x.endsWith("rad")) return parseFloat(x) * 180 / Math.PI;
			}
			if (x === "none") return 0;
			return parseFloat(x);
		});
		alpha = parts.length > dims ? parts.pop() : 1;
	} else if (!/^[a-z][a-z0-9-]*\s*\(/.test(cstr) && /[0-9](?:\s|\/|,)/.test(cstr)) {
		parts = cstr.match(/-?[0-9]*\.?[0-9]+/g).map(Number);
		space = cstr.replace(/grad|deg|rad|turn/g, "").match(/([a-z])/gi)?.join("")?.toLowerCase() || "rgb";
		if (space.length > 3 && space[space.length - 1] === "a" && space.length === parts.length) {
			space = space.slice(0, -1);
			alpha = parts.pop();
		} else if (space === "rgb" && parts.length === 4) alpha = parts.pop();
	}
	return {
		space,
		values: parts,
		alpha
	};
}
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/rgb.js
/**
* sRGB — the standard RGB color space created by HP and Microsoft in 1996 and later
* standardized as IEC 61966-2-1. It defines a D65 white point and a piecewise
* gamma-like transfer curve tuned to typical display response. It became the default
* color space of the web and of untagged digital images, and remains the assumed
* gamut for ordinary displays, browsers and image formats today.
*
* @see {@link https://www.w3.org/TR/css-color-4/#numeric-srgb}
* @wiki {@link https://en.wikipedia.org/wiki/SRGB}
* @year 1996
* @by HP & Microsoft
* @use Default RGB space of the web and untagged images (sRGB); current, dominant consumer-display standard.
* @channel {R} 0 255 Red
* @channel {G} 0 255 Green
* @channel {B} 0 255 Blue
* @method transfer
* @encoding gamma
* @gamut srgb
* @illuminant D65
* @referred display
* @dynamic sdr
*/
var rgb = {
	name: "rgb",
	range: [
		[0, 255],
		[0, 255],
		[0, 255]
	]
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/hsl.js
/**
* HSL — Hue, Saturation, Lightness, a cylindrical remapping of RGB devised by Alvy
* Ray Smith in 1978. Hue is the angle around a color wheel, saturation measures
* colorfulness relative to gray at that lightness, and lightness runs from black
* through the pure hue up to white. It offers a far more intuitive way to pick and
* adjust colors than raw RGB, and underlies the `hsl()` notation in CSS and countless
* color-picker interfaces.
*
* @see {@link https://www.w3.org/TR/css-color-4/#the-hsl-notation}
* @wiki {@link https://en.wikipedia.org/wiki/HSL_and_HSV}
* @year 1978
* @by Alvy Ray Smith
* @use Intuitive hue/saturation/lightness color picking; current, standardized as CSS's hsl().
* @channel {H} 0 360 Hue angle in degrees
* @channel {S} 0 100 Saturation percentage
* @channel {L} 0 100 Lightness percentage
* @method cylindrical
* @encoding gamma
* @referred display
* @dynamic sdr
*/
var hsl = {
	name: "hsl",
	range: [
		[0, 360],
		[0, 100],
		[0, 100]
	],
	rgb: function(h, s, l) {
		h = h / 360;
		s = s / 100;
		l = l / 100;
		var t1, t2, t3, rgb, val, i = 0;
		if (s === 0) return val = l * 255, [
			val,
			val,
			val
		];
		t2 = l < .5 ? l * (1 + s) : l + s - l * s;
		t1 = 2 * l - t2;
		rgb = [
			0,
			0,
			0
		];
		for (; i < 3;) {
			t3 = h + 1 / 3 * -(i - 1);
			t3 < 0 ? t3++ : t3 > 1 && t3--;
			val = 6 * t3 < 1 ? t1 + (t2 - t1) * 6 * t3 : 2 * t3 < 1 ? t2 : 3 * t3 < 2 ? t1 + (t2 - t1) * (2 / 3 - t3) * 6 : t1;
			rgb[i++] = val * 255;
		}
		return rgb;
	}
};
rgb.hsl = function(r, g, b) {
	r = r / 255;
	g = g / 255;
	b = b / 255;
	var min = Math.min(r, g, b), max = Math.max(r, g, b), delta = max - min, h = 0, s, l;
	if (max === min) h = 0;
	else if (r === max) h = (g - b) / delta;
	else if (g === max) h = 2 + (b - r) / delta;
	else if (b === max) h = 4 + (r - g) / delta;
	h = Math.min(h / 6, 1);
	if (h < 0) h += 1;
	l = (min + max) / 2;
	if (max === min) s = 0;
	else if (l <= .5) s = delta / (max + min);
	else s = delta / (2 - max - min);
	return [
		h * 360,
		s * 100,
		l * 100
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/hsv.js
/**
* HSV — Hue, Saturation, Value (also called HSB, for Brightness), another
* cylindrical remapping of RGB from Alvy Ray Smith's 1978 paper. It shares HSL's hue
* angle but replaces lightness with value, the brightness of the most intense color
* channel, so pure hues stay fully saturated across the whole brightness range
* instead of washing out toward white. It is the model behind most color-picker
* "wheel plus square" interfaces.
*
* @wiki {@link https://en.wikipedia.org/wiki/HSL_and_HSV}
* @year 1978
* @by Alvy Ray Smith
* @use Hue/saturation/value color picking with pure hues at full brightness; current, the standard 'wheel plus square' picker model.
* @channel {H} 0 360 Hue angle in degrees
* @channel {S} 0 100 Saturation percentage
* @channel {V} 0 100 Value percentage
* @method cylindrical
* @encoding gamma
* @referred display
* @dynamic sdr
*/
var hsv = {
	name: "hsv",
	range: [
		[0, 360],
		[0, 100],
		[0, 100]
	],
	rgb: function(h, s, v) {
		h = h / 360 * 6;
		s = s / 100;
		v = v / 100;
		var hi = Math.floor(h) % 6;
		var f = h - Math.floor(h), p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f));
		var result;
		switch (hi) {
			case 0:
				result = [
					v,
					t,
					p
				];
				break;
			case 1:
				result = [
					q,
					v,
					p
				];
				break;
			case 2:
				result = [
					p,
					v,
					t
				];
				break;
			case 3:
				result = [
					p,
					q,
					v
				];
				break;
			case 4:
				result = [
					t,
					p,
					v
				];
				break;
			case 5: result = [
				v,
				p,
				q
			];
		}
		return [
			result[0] * 255,
			result[1] * 255,
			result[2] * 255
		];
	},
	hsl: function(h, s, v) {
		s = s / 100;
		v = v / 100;
		var sl, l = (2 - s) * v;
		sl = s * v;
		sl /= l <= 1 ? l : 2 - l;
		sl = sl || 0;
		l /= 2;
		return [
			h,
			sl * 100,
			l * 100
		];
	}
};
rgb.hsv = function(r, g, b) {
	r = r / 255;
	g = g / 255;
	b = b / 255;
	var min = Math.min(r, g, b), max = Math.max(r, g, b), delta = max - min, h = 0, s, v;
	if (max === 0) s = 0;
	else s = delta / max;
	if (max === min) h = 0;
	else if (r === max) h = (g - b) / delta;
	else if (g === max) h = 2 + (b - r) / delta;
	else if (b === max) h = 4 + (r - g) / delta;
	h = Math.min(h / 6, 1);
	if (h < 0) h += 1;
	v = max;
	return [
		h * 360,
		s * 100,
		v * 100
	];
};
hsl.hsv = function(h, s, l) {
	s = s / 100;
	l = l / 100;
	var l2 = l * 2;
	var s2 = s * (l2 <= 1 ? l2 : 2 - l2);
	var v = (l2 + s2) / 2;
	return [
		h,
		2 * s2 / (l2 + s2) * 100,
		v * 100
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/hwb.js
/**
* HWB — Hue, Whiteness, Blackness, devised by Alvy Ray Smith in 1996 as an even more
* intuitive alternative to HSV for humans mixing colors by hand. Instead of
* saturation and value, it describes a color as a pure hue diluted with some amount
* of white and some amount of black, mirroring how painters think about tinting and
* shading a pigment. It is standardized in CSS Color 4 as the `hwb()` notation.
*
* @see {@link https://www.w3.org/TR/css-color-4/#the-hwb-notation}
* @wiki {@link https://en.wikipedia.org/wiki/HWB_color_model}
* @year 1996
* @by Alvy Ray Smith
* @use Intuitive tint/shade color picking; current, standardized as CSS Color 4's hwb().
* @channel {H} 0 360 Hue angle in degrees
* @channel {W} 0 100 Whiteness percentage
* @channel {B} 0 100 Blackness percentage
* @method cylindrical
* @encoding gamma
* @referred display
* @dynamic sdr
*/
var hwb = {
	name: "hwb",
	range: [
		[0, 360],
		[0, 100],
		[0, 100]
	],
	rgb: function(h, wh, bl) {
		h = h / 360;
		wh = wh / 100;
		bl = bl / 100;
		var ratio = wh + bl, i, v, f, n;
		var r, g, b;
		if (ratio >= 1) {
			var gray = wh / ratio * 255;
			return [
				gray,
				gray,
				gray
			];
		}
		i = Math.floor(6 * h);
		v = 1 - bl;
		f = 6 * h - i;
		if ((i & 1) !== 0) f = 1 - f;
		n = wh + f * (v - wh);
		switch (i) {
			default:
			case 6:
			case 0:
				r = v;
				g = n;
				b = wh;
				break;
			case 1:
				r = n;
				g = v;
				b = wh;
				break;
			case 2:
				r = wh;
				g = v;
				b = n;
				break;
			case 3:
				r = wh;
				g = n;
				b = v;
				break;
			case 4:
				r = n;
				g = wh;
				b = v;
				break;
			case 5:
				r = v;
				g = wh;
				b = n;
		}
		return [
			r * 255,
			g * 255,
			b * 255
		];
	},
	hsv: function(h, w, b) {
		w = w / 100;
		b = b / 100;
		var s, v;
		if (w + b >= 1) {
			s = 0;
			v = w / (w + b);
		} else {
			s = 1 - w / (1 - b);
			v = 1 - b;
		}
		return [
			h,
			s * 100,
			v * 100
		];
	},
	hsl: function(h, w, b) {
		return hsv.hsl(...hwb.hsv(h, w, b));
	}
};
rgb.hwb = function(r, g, b) {
	r = r / 255;
	g = g / 255;
	b = b / 255;
	var h = rgb.hsl(r * 255, g * 255, b * 255)[0], w = Math.min(r, Math.min(g, b));
	b = 1 - Math.max(r, Math.max(g, b));
	return [
		h,
		w * 100,
		b * 100
	];
};
hsv.hwb = function(h, s, v) {
	s = s / 100;
	v = v / 100;
	return [
		h,
		(v === 0 ? 0 : v * (1 - s)) * 100,
		(1 - v) * 100
	];
};
hsl.hwb = function(h, s, l) {
	return hsv.hwb(...hsl.hsv(h, s, l));
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/cmyk.js
/**
* CMYK is the subtractive color model used throughout offset and digital printing,
* built from cyan, magenta and yellow inks plus a separate black channel (K, for
* "key"). Mixing cyan, magenta and yellow absorbs light rather than emitting it, the
* opposite of how RGB displays add colored light, so in principle their combination
* alone produces black — but real inks are impure, so a dedicated black channel keeps
* dark tones neutral, saves ink, and gives text and fine detail a cleaner edge. It
* remains the standard color model for prepress and printed output across the
* industry.
*
* @see {@link https://www.w3.org/TR/css-color-4/#device-cmyk}
* @wiki {@link https://en.wikipedia.org/wiki/CMYK_color_model}
* @year 1906
* @by four-colour process (Eagle Printing Ink Co.)
* @use Subtractive four-ink model for offset / digital printing; the current prepress standard.
* @channel {C} 0 100 Cyan percentage
* @channel {M} 0 100 Magenta percentage
* @channel {Y} 0 100 Yellow percentage
* @channel {K} 0 100 Black percentage
* @method matrix
* @encoding gamma
* @referred display
* @loss projective The naive device equation: many CMYK values map to one RGB (max-K convention on the way back).
* @dynamic sdr
*/
var cmyk = {
	name: "cmyk",
	range: [
		[0, 100],
		[0, 100],
		[0, 100],
		[0, 100]
	]
};
cmyk.rgb = (c, m, y, k) => {
	c = c / 100;
	m = m / 100;
	y = y / 100;
	k = k / 100;
	return [
		(1 - Math.min(1, c * (1 - k) + k)) * 255,
		(1 - Math.min(1, m * (1 - k) + k)) * 255,
		(1 - Math.min(1, y * (1 - k) + k)) * 255
	];
};
rgb.cmyk = (r, g, b) => {
	r = r / 255;
	g = g / 255;
	b = b / 255;
	let c, m, y, k;
	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;
	return [
		c * 100,
		m * 100,
		y * 100,
		k * 100
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/transfers.js
/**
* Standard opto-electronic transfer functions (gamma / OETF-EOTF curves), shared
* by the RGB working spaces that encode with the same curve. Each is sign-extended
* (odd-symmetric) so out-of-gamut negatives survive a round-trip. The matrices and
* primaries stay in the per-space files; only the 1-D transfer lives here.
*/
var sgn = (v) => v < 0 ? -1 : 1;
/**
* sRGB / IEC 61966-2-1 (also used by Display-P3). Linear ⇄ encoded.
* @see {@link https://www.w3.org/TR/css-color-4/#valdef-color-srgb}
*/
var srgbToLinear = (v) => {
	const a = Math.abs(v);
	return sgn(v) * (a > .04045 ? Math.pow((a + .055) / 1.055, 2.4) : a / 12.92);
};
var linearToSrgb = (v) => {
	const a = Math.abs(v);
	return sgn(v) * (a > .0031308 ? 1.055 * Math.pow(a, 1 / 2.4) - .055 : a * 12.92);
};
/**
* ITU-R BT.2020 OETF (Table 4, full-precision constants). Linear ⇄ signal.
* @see {@link https://www.itu.int/rec/R-REC-BT.2020}
*/
var bt2020Encode = (v) => {
	const A2020 = 1.09929682680944, B2020 = .018053968510807;
	const a = Math.abs(v);
	return sgn(v) * (a < B2020 ? 4.5 * a : A2020 * Math.pow(a, .45) - .09929682680944008);
};
var bt2020Decode = (v) => {
	const A2020 = 1.09929682680944, B2020 = .018053968510807;
	const a = Math.abs(v);
	return sgn(v) * (a < B2020 * 4.5 ? a / 4.5 : Math.pow((a + .09929682680944008) / A2020, 1 / .45));
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/lrgb.js
/**
* Linear-light sRGB — the same D65 white point and primaries as sRGB, but with the
* gamma-like transfer curve removed so that channel values sit directly proportional
* to light intensity. It is not a space displays use directly; instead it is the
* physically meaningful intermediate for color math such as mixing, blending and
* colorimetric conversions, where operating on gamma-encoded values would give wrong
* results.
*
* @see {@link https://www.w3.org/TR/css-color-4/#predefined-sRGB-linear}
* @year 1996
* @by HP & Microsoft (sRGB)
* @use Physically linear intermediate for color mixing, blending, and colorimetric conversion; current, foundational in color-managed rendering.
* @channel {R} 0 1 Red
* @channel {G} 0 1 Green
* @channel {B} 0 1 Blue
* @method transfer
* @encoding linear
* @gamut srgb
* @referred display
* @dynamic sdr
*/
var lrgb = {
	name: "lrgb",
	range: [
		[0, 1],
		[0, 1],
		[0, 1]
	]
};
rgb.lrgb = (r, g, b) => [
	srgbToLinear(r / 255),
	srgbToLinear(g / 255),
	srgbToLinear(b / 255)
];
lrgb.rgb = (r, g, b) => [
	255 * linearToSrgb(r),
	255 * linearToSrgb(g),
	255 * linearToSrgb(b)
];
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/util.js
/**
* Shared numeric helpers (no color semantics).
*/
/**
* 3×3 matrix (row-major, 9 elements) times a 3-vector.
* @param {number[]} m row-major [m00,m01,m02, m10,m11,m12, m20,m21,m22]
* @returns {[number,number,number]}
*/
var mat3 = (m, x, y, z) => [
	x * m[0] + y * m[1] + z * m[2],
	x * m[3] + y * m[4] + z * m[5],
	x * m[6] + y * m[7] + z * m[8]
];
/**
* Inverse of a 3×3 matrix (row-major). Lets a color space declare one forward
* matrix as the single source of truth and derive its exact inverse, so the
* round-trip is bit-exact (no transcription drift from a separately-rounded inverse).
* @param {number[]} m row-major 9-element matrix
* @returns {number[]} row-major inverse
*/
/**
* Product of two 3×3 row-major matrices — A·B applies B first, then A.
* Lets a space pre-combine a fixed pipeline of linear steps into one matrix.
* @param {number[]} A row-major 3×3
* @param {number[]} B row-major 3×3
* @returns {number[]} row-major 3×3
*/
var mul3 = (A, B) => [
	A[0] * B[0] + A[1] * B[3] + A[2] * B[6],
	A[0] * B[1] + A[1] * B[4] + A[2] * B[7],
	A[0] * B[2] + A[1] * B[5] + A[2] * B[8],
	A[3] * B[0] + A[4] * B[3] + A[5] * B[6],
	A[3] * B[1] + A[4] * B[4] + A[5] * B[7],
	A[3] * B[2] + A[4] * B[5] + A[5] * B[8],
	A[6] * B[0] + A[7] * B[3] + A[8] * B[6],
	A[6] * B[1] + A[7] * B[4] + A[8] * B[7],
	A[6] * B[2] + A[7] * B[5] + A[8] * B[8]
];
var inv3 = (m) => {
	const [a, b, c, d, e, f, g, h, i] = m;
	const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g;
	const det = a * A + b * B + c * C;
	return [
		A / det,
		(c * h - b * i) / det,
		(b * f - c * e) / det,
		B / det,
		(a * i - c * g) / det,
		(c * d - a * f) / det,
		C / det,
		(b * g - a * h) / det,
		(a * e - b * d) / det
	];
};
/**
* Signed power: keeps the sign, raises the magnitude. The standard way every
* appearance model / gamma curve extends a fractional exponent to negative
* (out-of-gamut) inputs without producing NaN.
* @returns {number} sign(a)·|a|^b
*/
var spow = (a, b) => Math.sign(a) * Math.abs(a) ** b;
/**
* Cartesian opponent pair (a,b) -> cylindrical (chroma, hue°). The lightness L
* passes straight through. Below `t` the colour is achromatic and the hue is
* undefined → 0 (avoids a ghost hue from float-noise residuals, and atan2(-0,-0)).
* @returns {[number,number,number]} [l, c, h] with h in [0,360)
*/
var cartToPolar = (l, a, b, t = 1e-8) => {
	const c = Math.sqrt(a * a + b * b);
	const h = c < t ? 0 : Math.atan2(b, a) * 180 / Math.PI;
	return [
		l,
		c,
		h < 0 ? h + 360 : h
	];
};
/**
* Cylindrical (chroma, hue°) -> Cartesian opponent pair (a,b); inverse of
* {@link cartToPolar}. Lightness L passes through.
* @returns {[number,number,number]} [l, a, b]
*/
var polarToCart = (l, c, h) => {
	const hr = h * Math.PI / 180;
	return [
		l,
		c * Math.cos(hr),
		c * Math.sin(hr)
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/xyz.js
/**
* CIE XYZ — the foundation of modern colorimetry, defined by the CIE in 1931 from the
* color-matching functions of the standard observer. X, Y and Z are not themselves
* perceptual attributes; they're engineered so Y alone carries luminance while X and Z
* carry chromaticity, letting any visible color be written as a weighted sum of three
* fixed imaginary primaries. It serves as the device-independent reference that RGB,
* Lab and other working spaces are ultimately defined against.
*
* @see {@link https://www.w3.org/TR/css-color-4/#cie-xyz}
* @wiki {@link https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_XYZ_color_space}
* @year 1931
* @by CIE
* @use Foundational device-independent color space underlying all colorimetry; current universal reference.
* @channel {X} 0 95.05 X
* @channel {Y} 0 100 Y
* @channel {Z} 0 108.91 Z
* @method matrix
* @encoding linear
* @illuminant D65
* @observer 2
* @referred display
* @dynamic sdr
*/
/**
* Bradford chromatic adaptation between D50 and D65 (CSS Color 4, full precision).
* Shared so the D50-referred spaces (xyz-d50, lab-d50, prophoto) don't each carry
* their own truncated copy.
*/
var bradford = {
	D50_D65: [
		.9554734527042182,
		-.023098536874261423,
		.0632593086610217,
		-.028369706963208136,
		1.0099954580058226,
		.021041398966943008,
		.012314001688319899,
		-.020507696433477912,
		1.3303659366080753
	],
	D65_D50: [
		1.0479298208405488,
		.022946793341019088,
		-.05019222954313557,
		.029627815688159344,
		.990434484573249,
		-.01707382502938514,
		-.009243058152591178,
		.015055144896577895,
		.7518742899580008
	]
};
var xyz = {
	name: "xyz",
	range: [
		[0, 95.05],
		[0, 100],
		[0, 108.91]
	]
};
var M_LRGB = [
	.41239079926595,
	.35758433938387,
	.18048078840183,
	.21263900587151,
	.71516867876775,
	.072192315360733,
	.019330818715591,
	.11919477979462,
	.95053215224966
];
var M_LRGB_INV = inv3(M_LRGB);
xyz.lrgb = (x, y, z) => mat3(M_LRGB_INV, x / 100, y / 100, z / 100);
lrgb.xyz = (r, g, b) => {
	const v = mat3(M_LRGB, r, g, b);
	v[0] *= 100;
	v[1] *= 100;
	v[2] *= 100;
	return v;
};
rgb.xyz = (r, g, b) => {
	const v = rgb.lrgb(r, g, b);
	return lrgb.xyz(v[0], v[1], v[2]);
};
xyz.rgb = (x, y, z) => {
	const v = xyz.lrgb(x, y, z);
	return lrgb.rgb(v[0], v[1], v[2]);
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/xyz-d50.js
/**
* CIE XYZ referred to the D50 illuminant instead of D65. D50 is the profile connection
* space ICC color-management profiles convert through, a convention inherited from
* graphic arts and print viewing standards, so this variant is the one to reach for when
* reading or writing ICC-based workflows. It relates to D65 XYZ by Bradford chromatic
* adaptation.
*
* @see {@link https://www.w3.org/TR/css-color-4/#predefined-xyz}
* @year 1994
* @by ICC
* @use CIE XYZ under D50, the ICC profile-connection space for print/graphic-arts color management; current standard.
* @channel {X} 0 96.42 X
* @channel {Y} 0 100 Y
* @channel {Z} 0 82.51 Z
* @method matrix
* @encoding linear
* @illuminant D50
* @observer 2
* @referred display
* @dynamic sdr
*/
var xyzD50 = {
	name: "xyz-d50",
	range: [
		[0, 96.42],
		[0, 100],
		[0, 82.51]
	]
};
xyzD50.xyz = (x, y, z) => mat3(bradford.D50_D65, x, y, z);
xyz[xyzD50.name] = (x, y, z) => mat3(bradford.D65_D50, x, y, z);
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/whitepoints.js
/**
* Whitepoint reference values — CIE standard illuminants (A, B, C, D50-D75, F1-F12,
* E) for both the 1931 2° and 1964 10° observers, XYZ scaled to Y = 100. Split out
* of xyz.js so that spaces which never touch the table (most of the library) don't
* carry it in tree-shaken bundles — import it only when you need an illuminant.
*
*     import whitepoint from 'color-space/whitepoints.js'
*     whitepoint[2].D50   // → [96.422, 100, 82.521]
*
* @see {@link https://en.wikipedia.org/wiki/Standard_illuminant}
*/
var whitepoint = {
	2: {
		A: [
			109.85,
			100,
			35.585
		],
		B: [
			99.0927,
			100,
			85.313
		],
		C: [
			98.074,
			100,
			118.232
		],
		D50: [
			96.422,
			100,
			82.521
		],
		D55: [
			95.682,
			100,
			92.149
		],
		D65: [
			95.04559270516717,
			100,
			108.90577507598783
		],
		D75: [
			94.972,
			100,
			122.638
		],
		F1: [
			92.834,
			100,
			103.665
		],
		F2: [
			99.187,
			100,
			67.395
		],
		F3: [
			103.913,
			100,
			65.71
		],
		F4: [
			109.147,
			100,
			38.813
		],
		F5: [
			90.872,
			100,
			98.723
		],
		F6: [
			97.309,
			100,
			60.191
		],
		F7: [
			95.044,
			100,
			108.755
		],
		F8: [
			96.413,
			100,
			82.333
		],
		F9: [
			100.365,
			100,
			67.868
		],
		F10: [
			96.174,
			100,
			81.712
		],
		F11: [
			100.966,
			100,
			64.37
		],
		F12: [
			108.046,
			100,
			39.228
		],
		E: [
			100,
			100,
			100
		]
	},
	10: {
		A: [
			111.144,
			100,
			35.2
		],
		B: [
			99.178,
			100,
			84.349
		],
		C: [
			97.285,
			100,
			116.145
		],
		D50: [
			96.72,
			100,
			81.427
		],
		D55: [
			95.799,
			100,
			90.926
		],
		D65: [
			94.811,
			100,
			107.304
		],
		D75: [
			94.416,
			100,
			120.641
		],
		F1: [
			94.791,
			100,
			103.191
		],
		F2: [
			103.28,
			100,
			69.026
		],
		F3: [
			108.968,
			100,
			66.5
		],
		F4: [
			114.961,
			100,
			40.963
		],
		F5: [
			93.369,
			100,
			98.636
		],
		F6: [
			102.148,
			100,
			62.074
		],
		F7: [
			95.792,
			100,
			107.687
		],
		F8: [
			97.115,
			100,
			81.135
		],
		F9: [
			102.116,
			100,
			67.826
		],
		F10: [
			99.001,
			100,
			83.134
		],
		F11: [
			103.866,
			100,
			65.627
		],
		F12: [
			111.428,
			100,
			40.353
		],
		E: [
			100,
			100,
			100
		]
	}
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/xyy.js
/**
* xyY — a reformulation of CIE XYZ that separates a color's chromaticity (x, y) from its
* luminance (Y), so hue and saturation can be studied independently of brightness.
* Plotting x against y produces the familiar horseshoe-shaped chromaticity diagram used
* to visualize gamuts, specify white points, and compare how much of the visible
* spectrum a display or printer can reproduce.
*
* @see {@link http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_xyY.html}
* @wiki {@link https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_xyY_color_space}
* @year 1931
* @by CIE
* @use Chromaticity reformulation of CIE XYZ for visualizing gamuts and white points; current standard tool.
* @channel {x} 0 1 Red chromaticity
* @channel {y} 0 1 Green chromaticity
* @channel {Y} 0 100 Luminance
* @method chromaticity
* @encoding chromaticity
* @referred display
* @dynamic sdr
*/
var xyy = {
	name: "xyy",
	range: [
		[0, 1],
		[0, 1],
		[0, 100]
	]
};
xyy.xyz = function(x, y, Y) {
	var X, Z;
	if (y === 0) return [
		0,
		0,
		0
	];
	X = x * Y / y;
	Z = (1 - x - y) * Y / y;
	return [
		X,
		Y,
		Z
	];
};
var [Xw, Yw, Zw] = whitepoint[2].D65;
var wx = Xw / (Xw + Yw + Zw);
var wy = Yw / (Xw + Yw + Zw);
xyz.xyy = function(X, Y, Z) {
	var sum = X + Y + Z;
	if (sum === 0) return [
		wx,
		wy,
		Y
	];
	return [
		X / sum,
		Y / sum,
		Y
	];
};
var κ = 24389 / 27;
/** Forward companding f(t): normalised tristimulus ratio → lightness space. */
var labF = (t) => t > .008856451679035631 ? Math.cbrt(t) : (κ * t + 16) / 116;
/** Inverse companding f⁻¹(ft): lightness space → normalised tristimulus ratio. */
var labFInv = (ft) => ft > .20689655172413793 ? ft ** 3 : (116 * ft - 16) / κ;
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/lab.js
/**
* CIELAB is the CIE's 1976 perceptual color space, the first widely adopted
* attempt to make Euclidean distance between coordinates track perceived color
* difference. It splits color into lightness and two opponent axes — red versus
* green and yellow versus blue — echoing how the visual system encodes color
* beyond the retina. Color-managed workflows conventionally anchor Lab to the D50
* illuminant, which is why it serves as the ICC profile connection space and the
* reference form of CSS Color 4's lab() function, rather than tying it to any
* particular display's white point.
*
* @see {@link https://www.w3.org/TR/css-color-4/#lab-colors}
* @wiki {@link https://en.wikipedia.org/wiki/CIELAB_color_space}
* @year 1976
* @by CIE
* @use Device-independent perceptual color specification; current ICC profile connection space and CSS Color 4's lab().
* @channel {L} 0 100 Lightness
* @channel {a} -125 125 Green-Red axis
* @channel {b} -125 125 Blue-Yellow axis
* @method opponent
* @encoding perceptual
* @illuminant D50
* @observer 2
* @referred display
* @dynamic sdr
*/
var lab = {
	name: "lab",
	range: [
		[0, 100],
		[-125, 125],
		[-125, 125]
	]
};
var whiteD50 = [
	.9642956764295677,
	1,
	.8251046025104602
];
lab.xyz = (l, a, b) => {
	const fy = (l + 16) / 116;
	const fx = a / 500 + fy;
	const fz = fy - b / 200;
	const v = mat3(bradford.D50_D65, labFInv(fx) * whiteD50[0], labFInv(fy) * whiteD50[1], labFInv(fz) * whiteD50[2]);
	v[0] *= 100;
	v[1] *= 100;
	v[2] *= 100;
	return v;
};
xyz.lab = (x, y, z) => {
	const v = mat3(bradford.D65_D50, x / 100, y / 100, z / 100);
	const fx = labF(v[0] / whiteD50[0]);
	const fy = labF(v[1] / whiteD50[1]);
	const fz = labF(v[2] / whiteD50[2]);
	return [
		116 * fy - 16,
		500 * (fx - fy),
		200 * (fy - fz)
	];
};
var M_LABXYZ_LRGB = mul3(M_LRGB_INV, bradford.D50_D65);
var M_LRGB_LABXYZ = inv3(M_LABXYZ_LRGB);
lab.rgb = (l, a, b) => {
	const fy = (l + 16) / 116;
	const fx = a / 500 + fy;
	const fz = fy - b / 200;
	const v = mat3(M_LABXYZ_LRGB, labFInv(fx) * whiteD50[0], labFInv(fy) * whiteD50[1], labFInv(fz) * whiteD50[2]);
	return [
		255 * linearToSrgb(v[0]),
		255 * linearToSrgb(v[1]),
		255 * linearToSrgb(v[2])
	];
};
rgb.lab = (r, g, b) => {
	const v = mat3(M_LRGB_LABXYZ, srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255));
	const fx = labF(v[0] / whiteD50[0]);
	const fy = labF(v[1] / whiteD50[1]);
	const fz = labF(v[2] / whiteD50[2]);
	return [
		116 * fy - 16,
		500 * (fx - fy),
		200 * (fy - fz)
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/lchab.js
/**
* LCh(ab) is the cylindrical form of CIELAB, the CIE's 1976 perceptual space,
* converting its rectangular a/b axes into chroma and hue so color can be adjusted
* the way people actually think about it — how saturated, and what hue — rather
* than as red-green and yellow-blue offsets. Lightness carries over unchanged from
* Lab, so the two share the same perceptual uniformity; only the color-axis
* representation differs. It underlies CSS Color 4's lch() function and is a
* common choice for building perceptually even saturation or hue controls.
*
* @see {@link https://www.w3.org/TR/css-color-4/#cie-lab}
* @wiki {@link https://en.wikipedia.org/wiki/CIELAB_color_space#Cylindrical_model}
* @year 1976
* @by CIE
* @use Intuitive saturation/hue adjustment; current, underlies CSS Color 4's lch().
* @channel {L} 0 100 Lightness
* @channel {C} 0 150 Chroma
* @channel {H} 0 360 Hue angle in degrees
* @method cylindrical
* @encoding perceptual
* @illuminant D65
* @observer 2
* @referred display
* @dynamic sdr
*/
var lchab = {
	name: "lchab",
	range: [
		[0, 100],
		[0, 150],
		[0, 360]
	],
	lab: (l, c, h) => polarToCart(l, c, h)
};
lab.lchab = (l, a, b) => cartToPolar(l, a, b);
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/luv.js
/**
* CIE L*u*v* (CIELUV) is the CIE's 1976 companion to CIELAB, an alternative
* attempt at perceptual uniformity built from a projected version of the CIE
* chromaticity diagram rather than Lab's opponent differencing. Its defining
* property is additivity: the position of a mixture of two lights falls on the
* straight line between the two lights' own coordinates, something Lab cannot do.
* That has made LUV the traditional choice for additive-color contexts like
* displays and stage lighting, while Lab remains dominant for reflective and print
* color.
*
* @wiki {@link https://en.wikipedia.org/wiki/CIELUV}
* @year 1976
* @by CIE
* @use Additive-mixture-accurate perceptual space for displays and stage lighting; still used, less common than CIELAB.
* @channel {L} 0 100 Lightness
* @channel {U} -215 215 U chrominance
* @channel {V} -215 215 V chrominance
* @method opponent
* @encoding perceptual
* @illuminant D65
* @observer 2
* @referred display
* @dynamic sdr
*/
var luv = {
	name: "luv",
	range: [
		[0, 100],
		[-215, 215],
		[-215, 215]
	],
	xyz: function(l, u, v, i, o) {
		var _u, _v, x, y, z, xn, yn, zn, un, vn;
		if (l === 0) return [
			0,
			0,
			0
		];
		i = i || "D65";
		o = o || 2;
		xn = whitepoint[o][i][0];
		yn = whitepoint[o][i][1];
		zn = whitepoint[o][i][2];
		un = 4 * xn / (xn + 15 * yn + 3 * zn);
		vn = 9 * yn / (xn + 15 * yn + 3 * zn);
		_u = u / (13 * l) + un || 0;
		_v = v / (13 * l) + vn || 0;
		y = yn * labFInv((l + 16) / 116);
		x = y * 9 * _u / (4 * _v) || 0;
		z = y * (12 - 3 * _u - 20 * _v) / (4 * _v) || 0;
		return [
			x,
			y,
			z
		];
	}
};
xyz.luv = function(x, y, z, i, o) {
	var _u, _v, l, u, v, xn, yn, zn, un, vn;
	i = i || "D65";
	o = o || 2;
	xn = whitepoint[o][i][0];
	yn = whitepoint[o][i][1];
	zn = whitepoint[o][i][2];
	un = 4 * xn / (xn + 15 * yn + 3 * zn);
	vn = 9 * yn / (xn + 15 * yn + 3 * zn);
	_u = 4 * x / (x + 15 * y + 3 * z) || 0;
	_v = 9 * y / (x + 15 * y + 3 * z) || 0;
	l = 116 * labF(y / yn) - 16;
	u = 13 * l * (_u - un);
	v = 13 * l * (_v - vn);
	return [
		l,
		u,
		v
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/lchuv.js
/**
* LCh(uv) is the cylindrical form of CIELUV, the CIE's 1976 companion to CIELAB,
* converting its rectangular u/v axes into chroma and hue much as LCh(ab) does for
* Lab. It inherits LUV's defining additivity — mixtures of lights move predictably
* through the space — while giving a more intuitive saturation-and-hue handle for
* adjusting or comparing colors. It's also the basis for HSLuv and HPLuv, which
* rescale its chroma to fit the sRGB gamut.
*
* @wiki {@link https://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation_(CIELCh)}
* @year 1976
* @by CIE
* @use Saturation/hue adjustment in additive-mixture contexts; current, basis for HSLuv/HPLuv.
* @channel {L} 0 100 Lightness
* @channel {C} 0 220 Chroma
* @channel {H} 0 360 Hue angle in degrees
* @method cylindrical
* @encoding perceptual
* @illuminant D65
* @observer 2
* @referred display
* @dynamic sdr
*/
var lchuv = {
	name: "lchuv",
	range: [
		[0, 100],
		[0, 220],
		[0, 360]
	],
	luv: (l, c, h) => polarToCart(l, c, h),
	xyz: function(l, c, h) {
		return luv.xyz(...lchuv.luv(l, c, h));
	}
};
luv.lchuv = (l, u, v) => cartToPolar(l, u, v);
xyz.lchuv = function(x, y, z) {
	return luv.lchuv(...xyz.luv(x, y, z));
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/oklab.js
/**
* Oklab is Björn Ottosson's 2020 perceptual color space, created as a practical
* replacement for CIELAB in graphics and design work. It models color starting from
* how the eye's cone cells respond to light, then reshapes that signal so equal
* numeric steps correspond to equal perceived change in lightness, hue and chroma.
* That uniformity avoids the hue drift and desaturation that CIELAB and HSL produce
* when interpolating between colors, which is why Oklab now underlies CSS Color 4's
* oklab() and oklch() functions and much of the tooling built for gradients and
* palette generation.
*
* @see {@link https://bottosson.github.io/posts/oklab/}
* @wiki {@link https://en.wikipedia.org/wiki/Oklab_color_space}
* @year 2020
* @by Björn Ottosson
* @use Perceptual color space for gradients and design tooling; current, underlies CSS Color 4's oklab()/oklch().
* @channel {L} 0 1 Lightness
* @channel {a} -0.4 0.4 Green-Red axis
* @channel {b} -0.4 0.4 Blue-Yellow axis
* @method opponent
* @encoding perceptual
* @referred display
* @dynamic sdr
*/
var oklab = {
	name: "oklab",
	range: [
		[0, 1],
		[-.4, .4],
		[-.4, .4]
	]
};
oklab.rgb = (l, a, b) => {
	const l_ = l + .3963377774 * a + .2158037573 * b;
	const m_ = l - .1055613458 * a - .0638541728 * b;
	const s_ = l - .0894841775 * a - 1.291485548 * b;
	const l3 = l_ ** 3;
	const m3 = m_ ** 3;
	const s3 = s_ ** 3;
	return lrgb.rgb(4.0767416621 * l3 - 3.307711591 * m3 + .2309699292 * s3, -1.2684380046 * l3 + 2.6097574011 * m3 - .3413193965 * s3, -.0041960863 * l3 - .7034186147 * m3 + 1.707614701 * s3);
};
rgb.oklab = (r, g, b) => {
	const [lr, lg, lb] = rgb.lrgb(r, g, b);
	const l = .4122214708 * lr + .5363325363 * lg + .0514459929 * lb;
	const m = .2119034982 * lr + .6806995451 * lg + .1073969566 * lb;
	const s = .0883024619 * lr + .2817188376 * lg + .6299787005 * lb;
	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);
	return [
		.2104542553 * l_ + .793617785 * m_ - .0040720468 * s_,
		1.9779984951 * l_ - 2.428592205 * m_ + .4505937099 * s_,
		.0259040371 * l_ + .7827717662 * m_ - .808675766 * s_
	];
};
oklab.xyz = (l, a, b) => {
	const l_ = l + .3963377774 * a + .2158037573 * b;
	const m_ = l - .1055613458 * a - .0638541728 * b;
	const s_ = l - .0894841775 * a - 1.291485548 * b;
	const l3 = l_ * l_ * l_;
	const m3 = m_ * m_ * m_;
	const s3 = s_ * s_ * s_;
	return [
		1.2270138511 * l3 - .5577999807 * m3 + .281256149 * s3,
		-.0405801784 * l3 + 1.1122568696 * m3 - .0716766787 * s3,
		-.0763812845 * l3 - .4214819784 * m3 + 1.5861632204 * s3
	].map((v) => v * 100);
};
xyz.oklab = (x, y, z) => {
	x = x / 100;
	y = y / 100;
	z = z / 100;
	const L = Math.cbrt(.8189330101 * x + .3618667424 * y - .1288597137 * z);
	const M = Math.cbrt(.0329845436 * x + .9293118715 * y + .0361456387 * z);
	const S = Math.cbrt(.0482003018 * x + .2643662691 * y + .633851707 * z);
	return [
		.2104542553 * L + .793617785 * M - .0040720468 * S,
		1.9779984951 * L - 2.428592205 * M + .4505937099 * S,
		.0259040371 * L + .7827717662 * M - .808675766 * S
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/oklch.js
/**
* OKLCH is the cylindrical form of Björn Ottosson's 2020 OKLab, with perceptual
* lightness, chroma and hue. Designed so equal numeric steps look equal to the eye,
* it fixes CIELAB's blue-shift and is now the workhorse of modern CSS: `oklch()` is
* the recommended way to define design-token palettes on the web.
*
* @see {@link https://www.w3.org/TR/css-color-4/#ok-lab}
* @wiki {@link https://en.wikipedia.org/wiki/Oklab_color_space}
* @year 2020
* @by Björn Ottosson
* @use Design-token palettes and modern CSS color authoring; current, the recommended CSS form.
* @channel {L} 0 1 Lightness
* @channel {C} 0 0.4 Chroma
* @channel {H} 0 360 Hue angle in degrees
* @method cylindrical
* @encoding perceptual
* @referred display
* @dynamic sdr
*/
var oklch = {
	name: "oklch",
	range: [
		[0, 1],
		[0, .4],
		[0, 360]
	]
};
oklch.oklab = (l, c, h) => polarToCart(l, c, h);
oklab.oklch = (l, a, b) => cartToPolar(l, a, b);
oklch.rgb = (l, c, h) => {
	const v = oklch.oklab(l, c, h);
	return oklab.rgb(v[0], v[1], v[2]);
};
rgb.oklch = (r, g, b) => {
	const v = rgb.oklab(r, g, b);
	return oklab.oklch(v[0], v[1], v[2]);
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/p3-linear.js
/**
* Linear-light Display P3 — the gamma-free counterpart to Apple's Display P3,
* sharing its wide DCI-P3-derived primaries and D65 white point but with channel
* values directly proportional to light intensity. It serves as the intermediate
* space for accurate color math and image processing, before results are re-encoded
* with the Display P3 transfer curve for output.
*
* @see {@link https://www.w3.org/TR/css-color-4/#predefined-display-p3}
* @wiki {@link https://en.wikipedia.org/wiki/DCI-P3#P3-D65_(Display_P3)}
* @year 2015
* @by Apple
* @use Linear intermediate for Apple Display P3; current, feeds P3 color math before re-encoding.
* @channel {R} 0 1 Red
* @channel {G} 0 1 Green
* @channel {B} 0 1 Blue
* @method matrix
* @encoding linear
* @gamut display-p3
* @illuminant D65
* @observer 2
* @referred display
* @dynamic sdr
*/
var p3Linear = {
	name: "p3-linear",
	range: [
		[0, 1],
		[0, 1],
		[0, 1]
	]
};
var M$2 = [
	.4865709486482162,
	.26566769316909306,
	.1982172852343625,
	.2289745640697488,
	.6917385218365064,
	.079286914093745,
	0,
	.04511338185890264,
	1.043944368900976
];
var MI$2 = inv3(M$2);
p3Linear.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M$2, r, g, b);
	return [
		x * 100,
		y * 100,
		z * 100
	];
};
xyz[p3Linear.name] = (x, y, z) => mat3(MI$2, x / 100, y / 100, z / 100);
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/p3.js
/**
* Display P3 — Apple's wide-gamut display space, introduced with the 2015 iMac and
* standardized into CSS Color 4 as `display-p3`. It keeps sRGB's transfer curve and
* D65 white but adopts the wider DCI-P3 film primaries, covering about 25% more
* colors — the default canvas of modern iPhones, iPads and Macs.
*
* @see {@link https://www.w3.org/TR/css-color-4/#predefined-display-p3}
* @wiki {@link https://en.wikipedia.org/wiki/DCI-P3#P3-D65_(Display_P3)}
* @year 2015
* @by Apple
* @use Wide-gamut display space for Apple devices; current default on iPhone/iPad/Mac, standardized in CSS Color 4.
* @channel {R} 0 1 Red
* @channel {G} 0 1 Green
* @channel {B} 0 1 Blue
* @method transfer
* @encoding gamma
* @gamut display-p3
* @illuminant D65
* @observer 2
* @referred display
* @dynamic sdr
*/
var p3 = {
	name: "p3",
	range: [
		[0, 1],
		[0, 1],
		[0, 1]
	]
};
p3.xyz = (r, g, b) => p3Linear.xyz(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
xyz.p3 = (x, y, z) => {
	const [lr, lg, lb] = xyz["p3-linear"](x, y, z);
	return [
		linearToSrgb(lr),
		linearToSrgb(lg),
		linearToSrgb(lb)
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/a98rgb-linear.js
/**
* Linear-light Adobe RGB — the gamma-free counterpart to Adobe RGB 1998, sharing its
* wider-than-sRGB primaries and D65 white point but with channel values directly
* proportional to light intensity. It serves as the intermediate space for accurate
* color math, before results are re-encoded with Adobe RGB's transfer curve.
*
* @wiki {@link https://en.wikipedia.org/wiki/Adobe_RGB_color_space}
* @year 1998
* @by Adobe Systems
* @use Intermediate linear-light space for Adobe RGB color math; current, used before re-encoding to Adobe RGB's gamma curve.
* @channel {R} 0 1 Red
* @channel {G} 0 1 Green
* @channel {B} 0 1 Blue
* @method matrix
* @encoding linear
* @gamut adobe-rgb
* @illuminant D65
* @observer 2
* @referred display
* @dynamic sdr
*/
var a98Linear = {
	name: "a98rgb-linear",
	range: [
		[0, 1],
		[0, 1],
		[0, 1]
	]
};
var M$1 = [
	.5766690429101305,
	.1855582379065463,
	.1882286462349947,
	.29734497525053605,
	.6273635662554661,
	.07529145849399788,
	.02703136138641234,
	.07068885253582723,
	.9913375368376388
];
var MI$1 = inv3(M$1);
a98Linear.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M$1, r, g, b);
	return [
		x * 100,
		y * 100,
		z * 100
	];
};
xyz[a98Linear.name] = (x, y, z) => mat3(MI$1, x / 100, y / 100, z / 100);
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/a98rgb.js
/**
* Adobe RGB — introduced by Adobe in 1998 as a wider-gamut alternative to sRGB,
* designed to reproduce more of the cyans and greens achievable in CMYK printing.
* It keeps sRGB's D65 white point but uses different primaries and a slightly
* different gamma, making it a longstanding standard working space in photography
* and print production, where sRGB's narrower gamut would clip too much color.
*
* @wiki {@link https://en.wikipedia.org/wiki/Adobe_RGB_color_space}
* @year 1998
* @by Adobe Systems
* @use Wide-gamut photography and print working space; still common where sRGB's gamut clips CMYK-reproducible colors.
* @channel {R} 0 1 Red
* @channel {G} 0 1 Green
* @channel {B} 0 1 Blue
* @method transfer
* @encoding gamma
* @gamut adobe-rgb
* @illuminant D65
* @observer 2
* @referred display
* @dynamic sdr
*/
var a98rgb = {
	name: "a98rgb",
	range: [
		[0, 1],
		[0, 1],
		[0, 1]
	]
};
var gamma = 563 / 256;
var invGamma = 256 / 563;
a98rgb.xyz = (r, g, b) => a98Linear.xyz(spow(r, gamma), spow(g, gamma), spow(b, gamma));
xyz.a98rgb = (x, y, z) => {
	const [lr, lg, lb] = xyz["a98rgb-linear"](x, y, z);
	return [
		spow(lr, invGamma),
		spow(lg, invGamma),
		spow(lb, invGamma)
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/prophoto-linear.js
/**
* Linear-light ProPhoto RGB — the gamma-free counterpart to Kodak's ProPhoto (ROMM)
* RGB, sharing its very wide primaries and D50 white point but with channel values
* directly proportional to light intensity. It serves as the intermediate space for
* color math on ProPhoto-referenced images, such as raw photo processing, before
* results are re-encoded with ProPhoto's transfer curve.
*
* @see {@link https://www.color.org/ROMMRGB.pdf}
* @wiki {@link https://en.wikipedia.org/wiki/ProPhoto_RGB_color_space}
* @year 1999
* @by Kodak
* @use Linear intermediate for Kodak ProPhoto (ROMM) RGB; current, used in raw-photo color-math pipelines.
* @channel {R} 0 1 Red
* @channel {G} 0 1 Green
* @channel {B} 0 1 Blue
* @method matrix
* @encoding linear
* @gamut prophoto
* @illuminant D50
* @observer 2
* @referred display
* @dynamic sdr
*/
var prophotoLinear = {
	name: "prophoto-linear",
	range: [
		[0, 1],
		[0, 1],
		[0, 1]
	]
};
var M_PP_XYZ50 = [
	.7977666449006423,
	.13518129740053308,
	.0313477341283922,
	.2880748288194013,
	.711835234241873,
	8993693872564e-17,
	0,
	0,
	.8251046025104602
];
var M_XYZ50_PP = [
	1.3457868816471583,
	-.25557208737979464,
	-.05110186497554526,
	-.5446307051249019,
	1.5082477428451468,
	.02052744743642139,
	0,
	0,
	1.2119675456389452
];
prophotoLinear.xyz = (r, g, b) => {
	const [x50, y50, z50] = mat3(M_PP_XYZ50, r, g, b);
	return mat3(bradford.D50_D65, x50, y50, z50).map((v) => v * 100);
};
xyz[prophotoLinear.name] = (x, y, z) => {
	const [x50, y50, z50] = mat3(bradford.D65_D50, x / 100, y / 100, z / 100);
	return mat3(M_XYZ50_PP, x50, y50, z50);
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/prophoto.js
/**
* ProPhoto RGB — also known as ROMM RGB, developed by Kodak as a working space for
* high-end digital photography. Its primaries extend beyond the range of human
* vision, giving it one of the largest gamuts of any standard RGB space, though this
* means colors must be stored at higher bit depths to avoid visible banding. It is a
* common working space in raw photo processing, referenced to the D50 white point.
*
* @see {@link https://www.color.org/ROMMRGB.pdf}
* @wiki {@link https://en.wikipedia.org/wiki/ProPhoto_RGB_color_space}
* @year 1999
* @by Kodak
* @use Ultra-wide-gamut RGB for high-end digital photography/raw processing; current common working space.
* @channel {R} 0 1 Red
* @channel {G} 0 1 Green
* @channel {B} 0 1 Blue
* @method transfer
* @encoding gamma
* @gamut prophoto
* @illuminant D50
* @observer 2
* @referred display
* @dynamic sdr
*/
var prophoto = {
	name: "prophoto",
	range: [
		[0, 1],
		[0, 1],
		[0, 1]
	]
};
var Et = 1 / 512;
var Et2 = 16 / 512;
function toLinear(val) {
	const sign = val < 0 ? -1 : 1;
	const abs = Math.abs(val);
	if (abs < Et2) return val / 16;
	return sign * Math.pow(abs, 1.8);
}
function fromLinear(val) {
	const sign = val < 0 ? -1 : 1;
	const abs = Math.abs(val);
	if (abs >= Et) return sign * Math.pow(abs, 1 / 1.8);
	return 16 * val;
}
prophoto.xyz = (r, g, b) => {
	return prophotoLinear.xyz(toLinear(r), toLinear(g), toLinear(b));
};
xyz.prophoto = (x, y, z) => {
	const [lr, lg, lb] = xyz["prophoto-linear"](x, y, z);
	return [
		fromLinear(lr),
		fromLinear(lg),
		fromLinear(lb)
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/rec2020-linear.js
/**
* Linear-light Rec. 2020 — the gamma-free counterpart to the ITU-R BT.2020 UHDTV
* standard, sharing its extremely wide primaries and D65 white point but with
* channel values directly proportional to light intensity. It is the working space
* for accurate color math, compositing and grading of UHD/HDR content, before
* results are re-encoded with the Rec. 2020 transfer function for delivery.
*
* @see {@link https://www.itu.int/rec/R-REC-BT.2020}
* @wiki {@link https://en.wikipedia.org/wiki/Rec._2020}
* @year 2012
* @by ITU-R
* @use Linear intermediate for Rec. 2020 UHDTV primaries; current UHD/HDR grading working space.
* @channel {R} 0 1 Red
* @channel {G} 0 1 Green
* @channel {B} 0 1 Blue
* @method matrix
* @encoding linear
* @gamut rec2020
* @illuminant D65
* @observer 2
* @referred display
* @dynamic sdr
*/
var rec2020Linear = {
	name: "rec2020-linear",
	range: [
		[0, 1],
		[0, 1],
		[0, 1]
	]
};
var M = [
	.6369580483012914,
	.14461690358620832,
	.1688809751641721,
	.2627002120112671,
	.6779980715188708,
	.05930171646986196,
	0,
	.028072693049087428,
	1.060985057710791
];
var MI = inv3(M);
rec2020Linear.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M, r, g, b);
	return [
		x * 100,
		y * 100,
		z * 100
	];
};
xyz[rec2020Linear.name] = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);
//#endregion
//#region ../../node_modules/.pnpm/color-space@3.1.0/node_modules/color-space/spaces/rec2020.js
/**
* Rec. 2020 — the ITU-R BT.2020 standard defining the color gamut and transfer
* characteristics for ultra-high-definition television. It uses a transfer function
* with the same piecewise shape as Rec. 709, but spans a dramatically wider set of
* primaries that approach the outer limits of human color perception — the target
* gamut for 4K and 8K UHD broadcast, streaming and HDR displays.
*
* @see {@link https://www.itu.int/rec/R-REC-BT.2020}
* @wiki {@link https://en.wikipedia.org/wiki/Rec._2020}
* @year 2012
* @by ITU-R
* @use Wide-gamut color space for UHDTV 4K/8K broadcast and HDR; current standard.
* @channel {R} 0 1 Red
* @channel {G} 0 1 Green
* @channel {B} 0 1 Blue
* @method transfer
* @encoding gamma
* @gamut rec2020
* @illuminant D65
* @observer 2
* @referred display
* @dynamic sdr
*/
var rec2020 = {
	name: "rec2020",
	range: [
		[0, 1],
		[0, 1],
		[0, 1]
	]
};
rec2020.xyz = (r, g, b) => rec2020Linear.xyz(bt2020Decode(r), bt2020Decode(g), bt2020Decode(b));
xyz.rec2020 = (x, y, z) => {
	const [lr, lg, lb] = xyz["rec2020-linear"](x, y, z);
	return [
		bt2020Encode(lr),
		bt2020Encode(lg),
		bt2020Encode(lb)
	];
};
//#endregion
//#region ../../node_modules/.pnpm/color-rgba@3.1.1/node_modules/color-rgba/index.js
/** @module  color-rgba */
var spaces = {
	rgb: [rgb.range, (v) => v],
	hsl: [hsl.range, (v) => hsl.rgb(...v)],
	hsv: [hsv.range, (v) => hsv.rgb(...v)],
	hsb: [hsv.range, (v) => hsv.rgb(...v)],
	hwb: [hwb.range, (v) => hwb.rgb(...v)],
	cmyk: [cmyk.range, (v) => cmyk.rgb(...v)],
	xyz: [xyz.range, (v) => xyz.rgb(...v)],
	xyy: [xyy.range, (v) => xyz.rgb(...xyy.xyz(...v))],
	lab: [lab.range, (v) => lab.rgb(...v)],
	lch: [lchab.range, (v) => lab.rgb(...lchab.lab(...v))],
	luv: [luv.range, (v) => xyz.rgb(...luv.xyz(...v))],
	lchuv: [lchuv.range, (v) => xyz.rgb(...lchuv.xyz(...v))],
	oklab: [oklab.range, (v) => oklab.rgb(...v)],
	oklch: [oklch.range, (v) => oklch.rgb(...v)],
	srgb: [
		rgb.range,
		(v) => v,
		255
	],
	"srgb-linear": [lrgb.range, (v) => lrgb.rgb(...v)],
	"display-p3": [p3.range, (v) => xyz.rgb(...p3.xyz(...v))],
	"a98-rgb": [a98rgb.range, (v) => xyz.rgb(...a98rgb.xyz(...v))],
	"prophoto-rgb": [prophoto.range, (v) => xyz.rgb(...prophoto.xyz(...v))],
	rec2020: [rec2020.range, (v) => xyz.rgb(...rec2020.xyz(...v))],
	"xyz-d65": [
		xyz.range,
		(v) => xyz.rgb(...v),
		100
	],
	"xyz-d50": [
		xyzD50.range,
		(v) => xyz.rgb(...xyzD50.xyz(...v)),
		100
	]
};
var bound = (x, [lo, hi]) => hi === 360 ? (x % 360 + 360) % 360 : Math.min(Math.max(x, lo), hi);
function rgba(color) {
	if (Array.isArray(color) && color.raw) color = String.raw(...arguments);
	if (color instanceof Number) color = +color;
	const parsed = color_parse_default(color);
	if (!parsed.space) return [];
	const [range, torgb, scale = 1] = spaces[parsed.space] || [];
	if (!range || parsed.values.length < range.length) return [];
	let values = torgb(range.map((r, i) => bound(parsed.values[i] * scale, r)));
	values = [...values].map((x) => Math.min(Math.max(x, 0), 255));
	values.push(Math.min(Math.max(parsed.alpha, 0), 1));
	return values;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/color.js
/**
* @module ol/color
*/
/**
* A color represented as a short array [red, green, blue, alpha].
* red, green, and blue should be integers in the range 0..255 inclusive.
* alpha should be a float in the range 0..1 inclusive. If no alpha value is
* given then `1` will be used.
* @typedef {Array<number>} Color
* @api
*/
/**
* Return the color as an rgba string.
* @param {Color|string} color Color.
* @return {string} Rgba string.
* @api
*/
function asString(color) {
	if (typeof color === "string") return color;
	return toString(color);
}
/**
* @type {number}
*/
var MAX_CACHE_SIZE = 1024;
/**
* We maintain a small cache of parsed strings.  Whenever the cache grows too large,
* we delete an arbitrary set of the entries.
*
* @type {Object<string, Color>}
*/
var cache = {};
/**
* @type {number}
*/
var cacheSize = 0;
/**
* @param {Color} color A color that may or may not have an alpha channel.
* @return {Color} The input color with an alpha channel.  If the input color has
* an alpha channel, the input color will be returned unchanged.  Otherwise, a new
* array will be returned with the input color and an alpha channel of 1.
*/
function withAlpha(color) {
	if (color.length === 4) return color;
	const output = color.slice();
	output[3] = 1;
	return output;
}
/**
* @param {Color} color RGBA color.
* @return {Color} LCHuv color with alpha.
*/
function rgbaToLcha(color) {
	const output = xyz$1.lchuv(rgb$1.xyz(color));
	output[3] = color[3];
	return output;
}
/**
* @param {Color} color LCHuv color with alpha.
* @return {Color} RGBA color.
*/
function lchaToRgba(color) {
	const output = xyz$1.rgb(lchuv$1.xyz(color));
	output[3] = color[3];
	return output;
}
/**
* @param {string} s String.
* @return {Color} Color.
*/
function fromString(s) {
	if (cache.hasOwnProperty(s)) return cache[s];
	if (cacheSize >= MAX_CACHE_SIZE) {
		let i = 0;
		for (const key in cache) if ((i++ & 3) === 0) {
			delete cache[key];
			--cacheSize;
		}
	}
	const color = rgba(s);
	if (color.length !== 4) throw new Error("Failed to parse \"" + s + "\" as color");
	for (const c of color) if (isNaN(c)) throw new Error("Failed to parse \"" + s + "\" as color");
	normalize(color);
	cache[s] = color;
	++cacheSize;
	return color;
}
/**
* Return the color as an array. This function maintains a cache of calculated
* arrays which means the result should not be modified.
* @param {Color|string} color Color.
* @return {Color} Color.
* @api
*/
function asArray(color) {
	if (Array.isArray(color)) return color;
	return fromString(color);
}
/**
* Exported for the tests.
* @param {Color} color Color.
* @return {Color} Clamped color.
*/
function normalize(color) {
	color[0] = clamp(color[0] + .5 | 0, 0, 255);
	color[1] = clamp(color[1] + .5 | 0, 0, 255);
	color[2] = clamp(color[2] + .5 | 0, 0, 255);
	color[3] = clamp(color[3], 0, 1);
	return color;
}
/**
* @param {Color} color Color.
* @return {string} String.
*/
function toString(color) {
	let r = color[0];
	if (r != (r | 0)) r = r + .5 | 0;
	let g = color[1];
	if (g != (g | 0)) g = g + .5 | 0;
	let b = color[2];
	if (b != (b | 0)) b = b + .5 | 0;
	const a = color[3] === void 0 ? 1 : Math.round(color[3] * 1e3) / 1e3;
	return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}
/**
* @param {string} s String.
* @return {boolean} Whether the string is actually a valid color
*/
function isStringColor(s) {
	try {
		fromString(s);
		return true;
	} catch (_) {
		return false;
	}
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/has.js
/**
* @module ol/has
*/
var ua = typeof navigator !== "undefined" && typeof navigator.userAgent !== "undefined" ? navigator.userAgent.toLowerCase() : "";
/**
* User agent string says we are dealing with Firefox as browser.
* @type {boolean}
*/
var FIREFOX = ua.includes("firefox");
ua.includes("safari") && !ua.includes("chrom") && (ua.includes("version/15.4") || /cpu (os|iphone os) 15_4 like mac os x/.test(ua));
/**
* User agent string says we are dealing with a WebKit engine.
* @type {boolean}
*/
var WEBKIT = ua.includes("webkit") && !ua.includes("edge");
/**
* User agent string says we are dealing with a Mac as platform.
* @type {boolean}
*/
var MAC = ua.includes("macintosh");
/**
* The ratio between physical pixels and device-independent pixels
* (dips) on the device (`window.devicePixelRatio`).
* @const
* @type {number}
* @api
*/
var DEVICE_PIXEL_RATIO = typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1;
/**
* The execution context is a worker with OffscreenCanvas available.
* @const
* @type {boolean}
*/
var WORKER_OFFSCREEN_CANVAS = typeof WorkerGlobalScope !== "undefined" && typeof OffscreenCanvas !== "undefined" && self instanceof WorkerGlobalScope;
/**
* Image.prototype.decode() is supported.
* @type {boolean}
*/
var IMAGE_DECODE = typeof Image !== "undefined" && Image.prototype.decode;
/**
* @type {boolean}
*/
var PASSIVE_EVENT_LISTENERS = (function() {
	let passive = false;
	try {
		const options = Object.defineProperty({}, "passive", { get: function() {
			passive = true;
		} });
		window.addEventListener("_", null, options);
		window.removeEventListener("_", null, options);
	} catch (error) {}
	return passive;
})();
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/dom.js
/**
* @module ol/dom
*/
/**
* Create an html canvas element and returns its 2d context.
* @param {number} [width] Canvas width.
* @param {number} [height] Canvas height.
* @param {Array<HTMLCanvasElement>} [canvasPool] Canvas pool to take existing canvas from.
* @param {CanvasRenderingContext2DSettings} [settings] CanvasRenderingContext2DSettings
* @return {CanvasRenderingContext2D} The context.
*/
function createCanvasContext2D(width, height, canvasPool, settings) {
	/** @type {HTMLCanvasElement|OffscreenCanvas} */
	let canvas;
	if (canvasPool && canvasPool.length) canvas = canvasPool.shift();
	else if (WORKER_OFFSCREEN_CANVAS) canvas = new OffscreenCanvas(width || 300, height || 300);
	else canvas = document.createElement("canvas");
	if (width) canvas.width = width;
	if (height) canvas.height = height;
	return canvas.getContext("2d", settings);
}
/** @type {CanvasRenderingContext2D} */
var sharedCanvasContext;
/**
* @return {CanvasRenderingContext2D} Shared canvas context.
*/
function getSharedCanvasContext2D() {
	if (!sharedCanvasContext) sharedCanvasContext = createCanvasContext2D(1, 1);
	return sharedCanvasContext;
}
/**
* @param {Node} newNode Node to replace old node
* @param {Node} oldNode The node to be replaced
*/
function replaceNode(newNode, oldNode) {
	const parent = oldNode.parentNode;
	if (parent) parent.replaceChild(newNode, oldNode);
}
/**
* @param {Node} node The node to remove.
* @return {Node|null} The node that was removed or null.
*/
function removeNode(node) {
	return node && node.parentNode ? node.parentNode.removeChild(node) : null;
}
/**
* @param {Node} node The node to remove the children from.
*/
function removeChildren(node) {
	while (node.lastChild) node.removeChild(node.lastChild);
}
/**
* Transform the children of a parent node so they match the
* provided list of children.  This function aims to efficiently
* remove, add, and reorder child nodes while maintaining a simple
* implementation (it is not guaranteed to minimize DOM operations).
* @param {Node} node The parent node whose children need reworking.
* @param {Array<Node>} children The desired children.
*/
function replaceChildren(node, children) {
	const oldChildren = node.childNodes;
	for (let i = 0;; ++i) {
		const oldChild = oldChildren[i];
		const newChild = children[i];
		if (!oldChild && !newChild) break;
		if (oldChild === newChild) continue;
		if (!oldChild) {
			node.appendChild(newChild);
			continue;
		}
		if (!newChild) {
			node.removeChild(oldChild);
			--i;
			continue;
		}
		node.insertBefore(newChild, oldChild);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/Image.js
/**
* Loads an image.
* @param {HTMLImageElement} image Image, not yet loaded.
* @param {string} [src] `src` attribute of the image. Optional, not required if already present.
* @return {Promise<HTMLImageElement>} Promise resolving to an `HTMLImageElement`.
* @api
*/
function load(image, src) {
	return new Promise((resolve, reject) => {
		function handleLoad() {
			unlisten();
			resolve(image);
		}
		function handleError() {
			unlisten();
			reject(/* @__PURE__ */ new Error("Image load error"));
		}
		function unlisten() {
			image.removeEventListener("load", handleLoad);
			image.removeEventListener("error", handleError);
		}
		image.addEventListener("load", handleLoad);
		image.addEventListener("error", handleError);
		if (src) image.src = src;
	});
}
/**
* @param {HTMLImageElement} image Image, not yet loaded.
* @param {string} [src] `src` attribute of the image. Optional, not required if already present.
* @return {Promise<HTMLImageElement>} Promise resolving to an `HTMLImageElement`.
*/
function decodeFallback(image, src) {
	if (src) image.src = src;
	return image.src && IMAGE_DECODE ? new Promise((resolve, reject) => image.decode().then(() => resolve(image)).catch((e) => image.complete && image.width ? resolve(image) : reject(e))) : load(image);
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/style/IconImageCache.js
/**
* @module ol/style/IconImageCache
*/
/**
* @classdesc
* Singleton class. Available through {@link module:ol/style/IconImageCache.shared}.
*/
var IconImageCache = class {
	constructor() {
		/**
		* @type {!Object<string, import("./IconImage.js").default>}
		* @private
		*/
		this.cache_ = {};
		/**
		* @type {!Object<string, CanvasPattern>}
		* @private
		*/
		this.patternCache_ = {};
		/**
		* @type {number}
		* @private
		*/
		this.cacheSize_ = 0;
		/**
		* @type {number}
		* @private
		*/
		this.maxCacheSize_ = 32;
	}
	/**
	* FIXME empty description for jsdoc
	*/
	clear() {
		this.cache_ = {};
		this.patternCache_ = {};
		this.cacheSize_ = 0;
	}
	/**
	* @return {boolean} Can expire cache.
	*/
	canExpireCache() {
		return this.cacheSize_ > this.maxCacheSize_;
	}
	/**
	* FIXME empty description for jsdoc
	*/
	expire() {
		if (this.canExpireCache()) {
			let i = 0;
			for (const key in this.cache_) {
				const iconImage = this.cache_[key];
				if ((i++ & 3) === 0 && !iconImage.hasListener()) {
					delete this.cache_[key];
					delete this.patternCache_[key];
					--this.cacheSize_;
				}
			}
		}
	}
	/**
	* @param {string} src Src.
	* @param {?string} crossOrigin Cross origin.
	* @param {import("../color.js").Color|string|null} color Color.
	* @return {import("./IconImage.js").default} Icon image.
	*/
	get(src, crossOrigin, color) {
		const key = getCacheKey(src, crossOrigin, color);
		return key in this.cache_ ? this.cache_[key] : null;
	}
	/**
	* @param {string} src Src.
	* @param {?string} crossOrigin Cross origin.
	* @param {import("../color.js").Color|string|null} color Color.
	* @return {CanvasPattern} Icon image.
	*/
	getPattern(src, crossOrigin, color) {
		const key = getCacheKey(src, crossOrigin, color);
		return key in this.patternCache_ ? this.patternCache_[key] : null;
	}
	/**
	* @param {string} src Src.
	* @param {?string} crossOrigin Cross origin.
	* @param {import("../color.js").Color|string|null} color Color.
	* @param {import("./IconImage.js").default|null} iconImage Icon image.
	* @param {boolean} [pattern] Also cache a `'repeat'` pattern with this `iconImage`.
	*/
	set(src, crossOrigin, color, iconImage, pattern) {
		const key = getCacheKey(src, crossOrigin, color);
		const update = key in this.cache_;
		this.cache_[key] = iconImage;
		if (pattern) {
			if (iconImage.getImageState() === ImageState_default.IDLE) iconImage.load();
			if (iconImage.getImageState() === ImageState_default.LOADING) iconImage.ready().then(() => {
				this.patternCache_[key] = getSharedCanvasContext2D().createPattern(iconImage.getImage(1), "repeat");
			});
			else this.patternCache_[key] = getSharedCanvasContext2D().createPattern(iconImage.getImage(1), "repeat");
		}
		if (!update) ++this.cacheSize_;
	}
	/**
	* Set the cache size of the icon cache. Default is `32`. Change this value when
	* your map uses more than 32 different icon images and you are not caching icon
	* styles on the application level.
	* @param {number} maxCacheSize Cache max size.
	* @api
	*/
	setSize(maxCacheSize) {
		this.maxCacheSize_ = maxCacheSize;
		this.expire();
	}
};
/**
* @param {string} src Src.
* @param {?string} crossOrigin Cross origin.
* @param {import("../color.js").Color|string|null} color Color.
* @return {string} Cache key.
*/
function getCacheKey(src, crossOrigin, color) {
	const colorString = color ? asArray(color) : "null";
	return crossOrigin + ":" + src + ":" + colorString;
}
/**
* The {@link module:ol/style/IconImageCache~IconImageCache} for
* {@link module:ol/style/Icon~Icon} images.
* @api
*/
var shared = new IconImageCache();
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/style/IconImage.js
/**
* @module ol/style/IconImage
*/
/**
* @type {CanvasRenderingContext2D}
*/
var taintedTestContext = null;
var IconImage = class extends Target {
	/**
	* @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap|null} image Image.
	* @param {string|undefined} src Src.
	* @param {?string} crossOrigin Cross origin.
	* @param {import("../ImageState.js").default|undefined} imageState Image state.
	* @param {import("../color.js").Color|string|null} color Color.
	*/
	constructor(image, src, crossOrigin, imageState, color) {
		super();
		/**
		* @private
		* @type {HTMLImageElement|HTMLCanvasElement|ImageBitmap}
		*/
		this.hitDetectionImage_ = null;
		/**
		* @private
		* @type {HTMLImageElement|HTMLCanvasElement|ImageBitmap|null}
		*/
		this.image_ = image;
		/**
		* @private
		* @type {string|null}
		*/
		this.crossOrigin_ = crossOrigin;
		/**
		* @private
		* @type {Object<number, HTMLCanvasElement>}
		*/
		this.canvas_ = {};
		/**
		* @private
		* @type {import("../color.js").Color|string|null}
		*/
		this.color_ = color;
		/**
		* @private
		* @type {import("../ImageState.js").default}
		*/
		this.imageState_ = imageState === void 0 ? ImageState_default.IDLE : imageState;
		/**
		* @private
		* @type {import("../size.js").Size|null}
		*/
		this.size_ = image && image.width && image.height ? [image.width, image.height] : null;
		/**
		* @private
		* @type {string|undefined}
		*/
		this.src_ = src;
		/**
		* @private
		*/
		this.tainted_;
		/**
		* @private
		* @type {Promise<void>|null}
		*/
		this.ready_ = null;
	}
	/**
	* @private
	*/
	initializeImage_() {
		this.image_ = new Image();
		if (this.crossOrigin_ !== null) this.image_.crossOrigin = this.crossOrigin_;
	}
	/**
	* @private
	* @return {boolean} The image canvas is tainted.
	*/
	isTainted_() {
		if (this.tainted_ === void 0 && this.imageState_ === ImageState_default.LOADED) {
			if (!taintedTestContext) taintedTestContext = createCanvasContext2D(1, 1, void 0, { willReadFrequently: true });
			taintedTestContext.drawImage(this.image_, 0, 0);
			try {
				taintedTestContext.getImageData(0, 0, 1, 1);
				this.tainted_ = false;
			} catch (e) {
				taintedTestContext = null;
				this.tainted_ = true;
			}
		}
		return this.tainted_ === true;
	}
	/**
	* @private
	*/
	dispatchChangeEvent_() {
		this.dispatchEvent(EventType_default$2.CHANGE);
	}
	/**
	* @private
	*/
	handleImageError_() {
		this.imageState_ = ImageState_default.ERROR;
		this.dispatchChangeEvent_();
	}
	/**
	* @private
	*/
	handleImageLoad_() {
		this.imageState_ = ImageState_default.LOADED;
		this.size_ = [this.image_.width, this.image_.height];
		this.dispatchChangeEvent_();
	}
	/**
	* @param {number} pixelRatio Pixel ratio.
	* @return {HTMLImageElement|HTMLCanvasElement|ImageBitmap} Image or Canvas element or image bitmap.
	*/
	getImage(pixelRatio) {
		if (!this.image_) this.initializeImage_();
		this.replaceColor_(pixelRatio);
		return this.canvas_[pixelRatio] ? this.canvas_[pixelRatio] : this.image_;
	}
	/**
	* @param {number} pixelRatio Pixel ratio.
	* @return {number} Image or Canvas element.
	*/
	getPixelRatio(pixelRatio) {
		this.replaceColor_(pixelRatio);
		return this.canvas_[pixelRatio] ? pixelRatio : 1;
	}
	/**
	* @return {import("../ImageState.js").default} Image state.
	*/
	getImageState() {
		return this.imageState_;
	}
	/**
	* @return {HTMLImageElement|HTMLCanvasElement|ImageBitmap} Image element.
	*/
	getHitDetectionImage() {
		if (!this.image_) this.initializeImage_();
		if (!this.hitDetectionImage_) if (this.isTainted_()) {
			const width = this.size_[0];
			const height = this.size_[1];
			const context = createCanvasContext2D(width, height);
			context.fillRect(0, 0, width, height);
			this.hitDetectionImage_ = context.canvas;
		} else this.hitDetectionImage_ = this.image_;
		return this.hitDetectionImage_;
	}
	/**
	* Get the size of the icon (in pixels).
	* @return {import("../size.js").Size} Image size.
	*/
	getSize() {
		return this.size_;
	}
	/**
	* @return {string|undefined} Image src.
	*/
	getSrc() {
		return this.src_;
	}
	/**
	* Load not yet loaded URI.
	*/
	load() {
		if (this.imageState_ !== ImageState_default.IDLE) return;
		if (!this.image_) this.initializeImage_();
		this.imageState_ = ImageState_default.LOADING;
		try {
			if (this.src_ !== void 0)
 /** @type {HTMLImageElement} */ this.image_.src = this.src_;
		} catch (e) {
			this.handleImageError_();
		}
		if (this.image_ instanceof HTMLImageElement) decodeFallback(this.image_, this.src_).then((image) => {
			this.image_ = image;
			this.handleImageLoad_();
		}).catch(this.handleImageError_.bind(this));
	}
	/**
	* @param {number} pixelRatio Pixel ratio.
	* @private
	*/
	replaceColor_(pixelRatio) {
		if (!this.color_ || this.canvas_[pixelRatio] || this.imageState_ !== ImageState_default.LOADED) return;
		const image = this.image_;
		const canvas = document.createElement("canvas");
		canvas.width = Math.ceil(image.width * pixelRatio);
		canvas.height = Math.ceil(image.height * pixelRatio);
		const ctx = canvas.getContext("2d");
		ctx.scale(pixelRatio, pixelRatio);
		ctx.drawImage(image, 0, 0);
		ctx.globalCompositeOperation = "multiply";
		ctx.fillStyle = asString(this.color_);
		ctx.fillRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);
		ctx.globalCompositeOperation = "destination-in";
		ctx.drawImage(image, 0, 0);
		this.canvas_[pixelRatio] = canvas;
	}
	/**
	* @return {Promise<void>} Promise that resolves when the image is loaded.
	*/
	ready() {
		if (!this.ready_) this.ready_ = new Promise((resolve) => {
			if (this.imageState_ === ImageState_default.LOADED || this.imageState_ === ImageState_default.ERROR) resolve();
			else this.addEventListener(EventType_default$2.CHANGE, function onChange() {
				if (this.imageState_ === ImageState_default.LOADED || this.imageState_ === ImageState_default.ERROR) {
					this.removeEventListener(EventType_default$2.CHANGE, onChange);
					resolve();
				}
			});
		});
		return this.ready_;
	}
};
/**
* @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap|null} image Image.
* @param {string|undefined} cacheKey Src.
* @param {?string} crossOrigin Cross origin.
* @param {import("../ImageState.js").default|undefined} imageState Image state.
* @param {import("../color.js").Color|string|null} color Color.
* @param {boolean} [pattern] Also cache a `repeat` pattern with the icon image.
* @return {IconImage} Icon image.
*/
function get(image, cacheKey, crossOrigin, imageState, color, pattern) {
	let iconImage = cacheKey === void 0 ? void 0 : shared.get(cacheKey, crossOrigin, color);
	if (!iconImage) {
		iconImage = new IconImage(image, image && "src" in image ? image.src || void 0 : cacheKey, crossOrigin, imageState, color);
		shared.set(cacheKey, crossOrigin, color, iconImage, pattern);
	}
	if (pattern && iconImage && !shared.getPattern(cacheKey, crossOrigin, color)) shared.set(cacheKey, crossOrigin, color, iconImage, pattern);
	return iconImage;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/style/Fill.js
/**
* @module ol/style/Fill
*/
/**
* @typedef {Object} Options
* @property {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null} [color=null] A color,
* gradient or pattern.
* See {@link module:ol/color~Color} and {@link module:ol/colorlike~ColorLike} for possible formats. For polygon fills (not for {@link import("./RegularShape.js").default} fills),
* a pattern can also be provided as {@link module:ol/colorlike~PatternDescriptor}.
* Default null; if null, the Canvas/renderer default black will be used.
*/
/**
* @classdesc
* Set fill style for vector features.
* @api
*/
var Fill = class Fill {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		options = options || {};
		/**
		* @private
		* @type {import("./IconImage.js").default|null}
		*/
		this.patternImage_ = null;
		/**
		* @private
		* @type {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null}
		*/
		this.color_ = null;
		if (options.color !== void 0) this.setColor(options.color);
	}
	/**
	* Clones the style. The color is not cloned if it is an {@link module:ol/colorlike~ColorLike}.
	* @return {Fill} The cloned style.
	* @api
	*/
	clone() {
		const color = this.getColor();
		return new Fill({ color: Array.isArray(color) ? color.slice() : color || void 0 });
	}
	/**
	* Get the fill color.
	* @return {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null} Color.
	* @api
	*/
	getColor() {
		return this.color_;
	}
	/**
	* Set the color.
	*
	* @param {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null} color Color.
	* @api
	*/
	setColor(color) {
		if (color !== null && typeof color === "object" && "src" in color) {
			const patternImage = get(null, color.src, "anonymous", void 0, color.offset ? null : color.color ? color.color : null, !(color.offset && color.size));
			patternImage.ready().then(() => {
				this.patternImage_ = null;
			});
			if (patternImage.getImageState() === ImageState_default.IDLE) patternImage.load();
			if (patternImage.getImageState() === ImageState_default.LOADING) this.patternImage_ = patternImage;
		}
		this.color_ = color;
	}
	/**
	* @return {boolean} The fill style is loading an image pattern.
	*/
	loading() {
		return !!this.patternImage_;
	}
	/**
	* @return {Promise<void>} `false` or a promise that resolves when the style is ready to use.
	*/
	ready() {
		return this.patternImage_ ? this.patternImage_.ready() : Promise.resolve();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/style/Stroke.js
/**
* @module ol/style/Stroke
*/
/**
* @typedef {Object} Options
* @property {import("../color.js").Color|import("../colorlike.js").ColorLike} [color] A color, gradient or pattern.
* See {@link module:ol/color~Color} and {@link module:ol/colorlike~ColorLike} for possible formats.
* Default null; if null, the Canvas/renderer default black will be used.
* @property {CanvasLineCap} [lineCap='round'] Line cap style: `butt`, `round`, or `square`.
* @property {CanvasLineJoin} [lineJoin='round'] Line join style: `bevel`, `round`, or `miter`.
* @property {Array<number>} [lineDash] Line dash pattern. Default is `null` (no dash).
* @property {number} [lineDashOffset=0] Line dash offset.
* @property {number} [miterLimit=10] Miter limit.
* @property {number} [width] Width.
*/
/**
* @classdesc
* Set stroke style for vector features.
* Note that the defaults given are the Canvas defaults, which will be used if
* option is not defined. The `get` functions return whatever was entered in
* the options; they will not return the default.
* @api
*/
var Stroke = class Stroke {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		options = options || {};
		/**
		* @private
		* @type {import("../color.js").Color|import("../colorlike.js").ColorLike}
		*/
		this.color_ = options.color !== void 0 ? options.color : null;
		/**
		* @private
		* @type {CanvasLineCap|undefined}
		*/
		this.lineCap_ = options.lineCap;
		/**
		* @private
		* @type {Array<number>|null}
		*/
		this.lineDash_ = options.lineDash !== void 0 ? options.lineDash : null;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.lineDashOffset_ = options.lineDashOffset;
		/**
		* @private
		* @type {CanvasLineJoin|undefined}
		*/
		this.lineJoin_ = options.lineJoin;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.miterLimit_ = options.miterLimit;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.width_ = options.width;
	}
	/**
	* Clones the style.
	* @return {Stroke} The cloned style.
	* @api
	*/
	clone() {
		const color = this.getColor();
		return new Stroke({
			color: Array.isArray(color) ? color.slice() : color || void 0,
			lineCap: this.getLineCap(),
			lineDash: this.getLineDash() ? this.getLineDash().slice() : void 0,
			lineDashOffset: this.getLineDashOffset(),
			lineJoin: this.getLineJoin(),
			miterLimit: this.getMiterLimit(),
			width: this.getWidth()
		});
	}
	/**
	* Get the stroke color.
	* @return {import("../color.js").Color|import("../colorlike.js").ColorLike} Color.
	* @api
	*/
	getColor() {
		return this.color_;
	}
	/**
	* Get the line cap type for the stroke.
	* @return {CanvasLineCap|undefined} Line cap.
	* @api
	*/
	getLineCap() {
		return this.lineCap_;
	}
	/**
	* Get the line dash style for the stroke.
	* @return {Array<number>|null} Line dash.
	* @api
	*/
	getLineDash() {
		return this.lineDash_;
	}
	/**
	* Get the line dash offset for the stroke.
	* @return {number|undefined} Line dash offset.
	* @api
	*/
	getLineDashOffset() {
		return this.lineDashOffset_;
	}
	/**
	* Get the line join type for the stroke.
	* @return {CanvasLineJoin|undefined} Line join.
	* @api
	*/
	getLineJoin() {
		return this.lineJoin_;
	}
	/**
	* Get the miter limit for the stroke.
	* @return {number|undefined} Miter limit.
	* @api
	*/
	getMiterLimit() {
		return this.miterLimit_;
	}
	/**
	* Get the stroke width.
	* @return {number|undefined} Width.
	* @api
	*/
	getWidth() {
		return this.width_;
	}
	/**
	* Set the color.
	*
	* @param {import("../color.js").Color|import("../colorlike.js").ColorLike} color Color.
	* @api
	*/
	setColor(color) {
		this.color_ = color;
	}
	/**
	* Set the line cap.
	*
	* @param {CanvasLineCap|undefined} lineCap Line cap.
	* @api
	*/
	setLineCap(lineCap) {
		this.lineCap_ = lineCap;
	}
	/**
	* Set the line dash.
	*
	* @param {Array<number>|null} lineDash Line dash.
	* @api
	*/
	setLineDash(lineDash) {
		this.lineDash_ = lineDash;
	}
	/**
	* Set the line dash offset.
	*
	* @param {number|undefined} lineDashOffset Line dash offset.
	* @api
	*/
	setLineDashOffset(lineDashOffset) {
		this.lineDashOffset_ = lineDashOffset;
	}
	/**
	* Set the line join.
	*
	* @param {CanvasLineJoin|undefined} lineJoin Line join.
	* @api
	*/
	setLineJoin(lineJoin) {
		this.lineJoin_ = lineJoin;
	}
	/**
	* Set the miter limit.
	*
	* @param {number|undefined} miterLimit Miter limit.
	* @api
	*/
	setMiterLimit(miterLimit) {
		this.miterLimit_ = miterLimit;
	}
	/**
	* Set the width.
	*
	* @param {number|undefined} width Width.
	* @api
	*/
	setWidth(width) {
		this.width_ = width;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/size.js
/**
* Determines if a size has a positive area.
* @param {Size} size The size to test.
* @return {boolean} The size has a positive area.
*/
function hasArea(size) {
	return size[0] > 0 && size[1] > 0;
}
/**
* Returns an `Size` array for the passed in number (meaning: square) or
* `Size` array.
* (meaning: non-square),
* @param {number|Size} size Width and height.
* @param {Size} [dest] Optional reusable size array.
* @return {Size} Size.
* @api
*/
function toSize(size, dest) {
	if (Array.isArray(size)) return size;
	if (dest === void 0) dest = [size, size];
	else {
		dest[0] = size;
		dest[1] = size;
	}
	return dest;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/style/Image.js
/**
* @module ol/style/Image
*/
/**
* @typedef {Object} Options
* @property {number} opacity Opacity.
* @property {boolean} rotateWithView If the image should get rotated with the view.
* @property {number} rotation Rotation.
* @property {number|import("../size.js").Size} scale Scale.
* @property {Array<number>} displacement Displacement.
* @property {import('../style/Style.js').DeclutterMode} declutterMode Declutter mode: `declutter`, `obstacle`, `none`.
*/
/**
* @classdesc
* A base class used for creating subclasses and not instantiated in
* apps. Base class for {@link module:ol/style/Icon~Icon}, {@link module:ol/style/Circle~CircleStyle} and
* {@link module:ol/style/RegularShape~RegularShape}.
* @abstract
* @api
*/
var ImageStyle = class ImageStyle {
	/**
	* @param {Options} options Options.
	*/
	constructor(options) {
		/**
		* @private
		* @type {number}
		*/
		this.opacity_ = options.opacity;
		/**
		* @private
		* @type {boolean}
		*/
		this.rotateWithView_ = options.rotateWithView;
		/**
		* @private
		* @type {number}
		*/
		this.rotation_ = options.rotation;
		/**
		* @private
		* @type {number|import("../size.js").Size}
		*/
		this.scale_ = options.scale;
		/**
		* @private
		* @type {import("../size.js").Size}
		*/
		this.scaleArray_ = toSize(options.scale);
		/**
		* @private
		* @type {Array<number>}
		*/
		this.displacement_ = options.displacement;
		/**
		* @private
		* @type {import('../style/Style.js').DeclutterMode}
		*/
		this.declutterMode_ = options.declutterMode;
	}
	/**
	* Clones the style.
	* @return {ImageStyle} The cloned style.
	* @api
	*/
	clone() {
		const scale = this.getScale();
		return new ImageStyle({
			opacity: this.getOpacity(),
			scale: Array.isArray(scale) ? scale.slice() : scale,
			rotation: this.getRotation(),
			rotateWithView: this.getRotateWithView(),
			displacement: this.getDisplacement().slice(),
			declutterMode: this.getDeclutterMode()
		});
	}
	/**
	* Get the symbolizer opacity.
	* @return {number} Opacity.
	* @api
	*/
	getOpacity() {
		return this.opacity_;
	}
	/**
	* Determine whether the symbolizer rotates with the map.
	* @return {boolean} Rotate with map.
	* @api
	*/
	getRotateWithView() {
		return this.rotateWithView_;
	}
	/**
	* Get the symoblizer rotation.
	* @return {number} Rotation.
	* @api
	*/
	getRotation() {
		return this.rotation_;
	}
	/**
	* Get the symbolizer scale.
	* @return {number|import("../size.js").Size} Scale.
	* @api
	*/
	getScale() {
		return this.scale_;
	}
	/**
	* Get the symbolizer scale array.
	* @return {import("../size.js").Size} Scale array.
	*/
	getScaleArray() {
		return this.scaleArray_;
	}
	/**
	* Get the displacement of the shape
	* @return {Array<number>} Shape's center displacement
	* @api
	*/
	getDisplacement() {
		return this.displacement_;
	}
	/**
	* Get the declutter mode of the shape
	* @return {import("./Style.js").DeclutterMode} Shape's declutter mode
	* @api
	*/
	getDeclutterMode() {
		return this.declutterMode_;
	}
	/**
	* Get the anchor point in pixels. The anchor determines the center point for the
	* symbolizer.
	* @abstract
	* @return {Array<number>} Anchor.
	*/
	getAnchor() {
		return abstract();
	}
	/**
	* Get the image element for the symbolizer.
	* @abstract
	* @param {number} pixelRatio Pixel ratio.
	* @return {import('../DataTile.js').ImageLike} Image element.
	*/
	getImage(pixelRatio) {
		return abstract();
	}
	/**
	* @abstract
	* @return {import('../DataTile.js').ImageLike} Image element.
	*/
	getHitDetectionImage() {
		return abstract();
	}
	/**
	* Get the image pixel ratio.
	* @param {number} pixelRatio Pixel ratio.
	* @return {number} Pixel ratio.
	*/
	getPixelRatio(pixelRatio) {
		return 1;
	}
	/**
	* @abstract
	* @return {import("../ImageState.js").default} Image state.
	*/
	getImageState() {
		return abstract();
	}
	/**
	* @abstract
	* @return {import("../size.js").Size} Image size.
	*/
	getImageSize() {
		return abstract();
	}
	/**
	* Get the origin of the symbolizer.
	* @abstract
	* @return {Array<number>} Origin.
	*/
	getOrigin() {
		return abstract();
	}
	/**
	* Get the size of the symbolizer (in pixels).
	* @abstract
	* @return {import("../size.js").Size} Size.
	*/
	getSize() {
		return abstract();
	}
	/**
	* Set the displacement.
	*
	* @param {Array<number>} displacement Displacement.
	* @api
	*/
	setDisplacement(displacement) {
		this.displacement_ = displacement;
	}
	/**
	* Set the opacity.
	*
	* @param {number} opacity Opacity.
	* @api
	*/
	setOpacity(opacity) {
		this.opacity_ = opacity;
	}
	/**
	* Set whether to rotate the style with the view.
	*
	* @param {boolean} rotateWithView Rotate with map.
	* @api
	*/
	setRotateWithView(rotateWithView) {
		this.rotateWithView_ = rotateWithView;
	}
	/**
	* Set the rotation.
	*
	* @param {number} rotation Rotation.
	* @api
	*/
	setRotation(rotation) {
		this.rotation_ = rotation;
	}
	/**
	* Set the scale.
	*
	* @param {number|import("../size.js").Size} scale Scale.
	* @api
	*/
	setScale(scale) {
		this.scale_ = scale;
		this.scaleArray_ = toSize(scale);
	}
	/**
	* @abstract
	* @param {function(import("../events/Event.js").default): void} listener Listener function.
	*/
	listenImageChange(listener) {
		abstract();
	}
	/**
	* Load not yet loaded URI.
	* @abstract
	*/
	load() {
		abstract();
	}
	/**
	* @abstract
	* @param {function(import("../events/Event.js").default): void} listener Listener function.
	*/
	unlistenImageChange(listener) {
		abstract();
	}
	/**
	* @return {Promise<void>} `false` or Promise that resolves when the style is ready to use.
	*/
	ready() {
		return Promise.resolve();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/colorlike.js
/**
* @module ol/colorlike
*/
/**
* @typedef {Object} PatternDescriptor
* @property {string} src Pattern image URL
* @property {import("./color.js").Color|string} [color] Color to tint the pattern with.
* @property {import("./size.js").Size} [size] Size of the desired slice from the pattern image.
* Use this together with `offset` when the pattern image is a sprite sheet.
* @property {import("./size.js").Size} [offset] Offset of the desired slice from the pattern image.
* Use this together with `size` when the pattern image is a sprite sheet.
*/
/**
* A type accepted by CanvasRenderingContext2D.fillStyle
* or CanvasRenderingContext2D.strokeStyle.
* Represents a color, [CanvasPattern](https://developer.mozilla.org/en-US/docs/Web/API/CanvasPattern),
* or [CanvasGradient](https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient). The origin for
* patterns and gradients as fill style is an increment of 512 css pixels from map coordinate
* `[0, 0]`. For seamless repeat patterns, width and height of the pattern image
* must be a factor of two (2, 4, 8, ..., 512).
*
* @typedef {string|CanvasPattern|CanvasGradient} ColorLike
* @api
*/
/**
* @param {import("./color.js").Color|ColorLike|PatternDescriptor|null} color Color.
* @return {ColorLike|null} The color as an {@link ol/colorlike~ColorLike}.
* @api
*/
function asColorLike(color) {
	if (!color) return null;
	if (Array.isArray(color)) return toString(color);
	if (typeof color === "object" && "src" in color) return asCanvasPattern(color);
	return color;
}
/**
* @param {PatternDescriptor} pattern Pattern descriptor.
* @return {CanvasPattern|null} Canvas pattern or null if the pattern referenced in the
* PatternDescriptor was not found in the icon image cache.
*/
function asCanvasPattern(pattern) {
	if (!pattern.offset || !pattern.size) return shared.getPattern(pattern.src, "anonymous", pattern.color);
	const cacheKey = pattern.src + ":" + pattern.offset;
	const canvasPattern = shared.getPattern(cacheKey, void 0, pattern.color);
	if (canvasPattern) return canvasPattern;
	const iconImage = shared.get(pattern.src, "anonymous", null);
	if (iconImage.getImageState() !== ImageState_default.LOADED) return null;
	const patternCanvasContext = createCanvasContext2D(pattern.size[0], pattern.size[1]);
	patternCanvasContext.drawImage(iconImage.getImage(1), pattern.offset[0], pattern.offset[1], pattern.size[0], pattern.size[1], 0, 0, pattern.size[0], pattern.size[1]);
	get(patternCanvasContext.canvas, cacheKey, void 0, ImageState_default.LOADED, pattern.color, true);
	return shared.getPattern(cacheKey, void 0, pattern.color);
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/css.js
/**
* @module ol/css
*/
/**
* @typedef {Object} FontParameters
* @property {string} style Style.
* @property {string} variant Variant.
* @property {string} weight Weight.
* @property {string} size Size.
* @property {string} lineHeight LineHeight.
* @property {string} family Family.
* @property {Array<string>} families Families.
*/
/**
* The CSS class for hidden feature.
*
* @const
* @type {string}
*/
var CLASS_HIDDEN = "ol-hidden";
/**
* The CSS class that we'll give the DOM elements to have them unselectable.
*
* @const
* @type {string}
*/
var CLASS_UNSELECTABLE = "ol-unselectable";
/**
* The CSS class for controls.
*
* @const
* @type {string}
*/
var CLASS_CONTROL = "ol-control";
/**
* The CSS class that we'll give the DOM elements that are collapsed, i.e.
* to those elements which usually can be expanded.
*
* @const
* @type {string}
*/
var CLASS_COLLAPSED = "ol-collapsed";
/**
* From https://stackoverflow.com/questions/10135697/regex-to-parse-any-css-font
* @type {RegExp}
*/
var fontRegEx = new RegExp([
	"^\\s*(?=(?:(?:[-a-z]+\\s*){0,2}(italic|oblique))?)",
	"(?=(?:(?:[-a-z]+\\s*){0,2}(small-caps))?)",
	"(?=(?:(?:[-a-z]+\\s*){0,2}(bold(?:er)?|lighter|[1-9]00 ))?)",
	"(?:(?:normal|\\1|\\2|\\3)\\s*){0,3}((?:xx?-)?",
	"(?:small|large)|medium|smaller|larger|[\\.\\d]+(?:\\%|in|[cem]m|ex|p[ctx]))",
	"(?:\\s*\\/\\s*(normal|[\\.\\d]+(?:\\%|in|[cem]m|ex|p[ctx])?))",
	"?\\s*([-,\\\"\\'\\sa-z]+?)\\s*$"
].join(""), "i");
/** @type {Array<'style'|'variant'|'weight'|'size'|'lineHeight'|'family'>} */
var fontRegExMatchIndex = [
	"style",
	"variant",
	"weight",
	"size",
	"lineHeight",
	"family"
];
/**
* Get the list of font families from a font spec.  Note that this doesn't work
* for font families that have commas in them.
* @param {string} fontSpec The CSS font property.
* @return {FontParameters|null} The font parameters (or null if the input spec is invalid).
*/
var getFontParameters = function(fontSpec) {
	const match = fontSpec.match(fontRegEx);
	if (!match) return null;
	const style = {
		lineHeight: "normal",
		size: "1.2em",
		style: "normal",
		weight: "normal",
		variant: "normal"
	};
	for (let i = 0, ii = fontRegExMatchIndex.length; i < ii; ++i) {
		const value = match[i + 1];
		if (value !== void 0) style[fontRegExMatchIndex[i]] = value;
	}
	style.families = style.family.split(/,\s?/);
	return style;
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/render/canvas.js
/**
* @module ol/render/canvas
*/
/**
* @const
* @type {string}
*/
var defaultFillStyle = "#000";
/**
* @const
* @type {CanvasLineCap}
*/
var defaultLineCap = "round";
/**
* @const
* @type {CanvasLineJoin}
*/
var defaultLineJoin = "round";
/**
* @type {BaseObject}
*/
var checkedFonts = new BaseObject();
/**
* @type {CanvasRenderingContext2D}
*/
var measureContext = null;
/**
* @type {string}
*/
var measureFont;
/**
* @type {!Object<string, number>}
*/
var textHeights = {};
(function() {
	const retries = 100;
	const referenceFonts = ["monospace", "serif"];
	const len = referenceFonts.length;
	const text = "wmytzilWMYTZIL@#/&?$%10";
	let interval, referenceWidth;
	/**
	* @param {string} fontStyle Css font-style
	* @param {string} fontWeight Css font-weight
	* @param {*} fontFamily Css font-family
	* @return {boolean} Font with style and weight is available
	*/
	function isAvailable(fontStyle, fontWeight, fontFamily) {
		let available = true;
		for (let i = 0; i < len; ++i) {
			const referenceFont = referenceFonts[i];
			referenceWidth = measureTextWidth(fontStyle + " " + fontWeight + " 32px " + referenceFont, text);
			if (fontFamily != referenceFont) {
				const width = measureTextWidth(fontStyle + " " + fontWeight + " 32px " + fontFamily + "," + referenceFont, text);
				available = available && width != referenceWidth;
			}
		}
		if (available) return true;
		return false;
	}
	function check() {
		let done = true;
		const fonts = checkedFonts.getKeys();
		for (let i = 0, ii = fonts.length; i < ii; ++i) {
			const font = fonts[i];
			if (checkedFonts.get(font) < retries) if (isAvailable.apply(this, font.split("\n"))) {
				clear(textHeights);
				measureContext = null;
				measureFont = void 0;
				checkedFonts.set(font, retries);
			} else {
				checkedFonts.set(font, checkedFonts.get(font) + 1, true);
				done = false;
			}
		}
		if (done) {
			clearInterval(interval);
			interval = void 0;
		}
	}
	return function(fontSpec) {
		const font = getFontParameters(fontSpec);
		if (!font) return;
		const families = font.families;
		for (let i = 0, ii = families.length; i < ii; ++i) {
			const family = families[i];
			const key = font.style + "\n" + font.weight + "\n" + family;
			if (checkedFonts.get(key) === void 0) {
				checkedFonts.set(key, retries, true);
				if (!isAvailable(font.style, font.weight, family)) {
					checkedFonts.set(key, 0, true);
					if (interval === void 0) interval = setInterval(check, 32);
				}
			}
		}
	};
})();
/**
* @param {string} font Font.
* @param {string} text Text.
* @return {TextMetrics} Text metrics.
*/
function measureText(font, text) {
	if (!measureContext) measureContext = createCanvasContext2D(1, 1);
	if (font != measureFont) {
		measureContext.font = font;
		measureFont = measureContext.font;
	}
	return measureContext.measureText(text);
}
/**
* @param {string} font Font.
* @param {string} text Text.
* @return {number} Width.
*/
function measureTextWidth(font, text) {
	return measureText(font, text).width;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/style/RegularShape.js
/**
* @module ol/style/RegularShape
*/
/**
* Specify radius for regular polygons, or both radius and radius2 for stars.
* @typedef {Object} Options
* @property {import("./Fill.js").default} [fill] Fill style.
* @property {number} points Number of points for stars and regular polygons. In case of a polygon, the number of points
* is the number of sides.
* @property {number} radius Radius of a regular polygon.
* @property {number} [radius2] Second radius to make a star instead of a regular polygon.
* @property {number} [angle=0] Shape's angle in radians. A value of 0 will have one of the shape's points facing up.
* @property {Array<number>} [displacement=[0, 0]] Displacement of the shape in pixels.
* Positive values will shift the shape right and up.
* @property {import("./Stroke.js").default} [stroke] Stroke style.
* @property {number} [rotation=0] Rotation in radians (positive rotation clockwise).
* @property {boolean} [rotateWithView=false] Whether to rotate the shape with the view.
* @property {number|import("../size.js").Size} [scale=1] Scale. Unless two dimensional scaling is required a better
* result may be obtained with appropriate settings for `radius` and `radius2`.
* @property {import('./Style.js').DeclutterMode} [declutterMode] Declutter mode.
*/
/**
* @typedef {Object} RenderOptions
* @property {import("../colorlike.js").ColorLike|undefined} strokeStyle StrokeStyle.
* @property {number} strokeWidth StrokeWidth.
* @property {number} size Size.
* @property {CanvasLineCap} lineCap LineCap.
* @property {Array<number>|null} lineDash LineDash.
* @property {number} lineDashOffset LineDashOffset.
* @property {CanvasLineJoin} lineJoin LineJoin.
* @property {number} miterLimit MiterLimit.
*/
/**
* @classdesc
* Set regular shape style for vector features. The resulting shape will be
* a regular polygon when `radius` is provided, or a star when both `radius` and
* `radius2` are provided.
* @api
*/
var RegularShape = class RegularShape extends ImageStyle {
	/**
	* @param {Options} options Options.
	*/
	constructor(options) {
		super({
			opacity: 1,
			rotateWithView: options.rotateWithView !== void 0 ? options.rotateWithView : false,
			rotation: options.rotation !== void 0 ? options.rotation : 0,
			scale: options.scale !== void 0 ? options.scale : 1,
			displacement: options.displacement !== void 0 ? options.displacement : [0, 0],
			declutterMode: options.declutterMode
		});
		/**
		* @private
		* @type {Object<number, HTMLCanvasElement>}
		*/
		this.canvases_;
		/**
		* @private
		* @type {HTMLCanvasElement|null}
		*/
		this.hitDetectionCanvas_ = null;
		/**
		* @private
		* @type {import("./Fill.js").default|null}
		*/
		this.fill_ = options.fill !== void 0 ? options.fill : null;
		/**
		* @private
		* @type {Array<number>}
		*/
		this.origin_ = [0, 0];
		/**
		* @private
		* @type {number}
		*/
		this.points_ = options.points;
		/**
		* @protected
		* @type {number}
		*/
		this.radius_ = options.radius;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.radius2_ = options.radius2;
		/**
		* @private
		* @type {number}
		*/
		this.angle_ = options.angle !== void 0 ? options.angle : 0;
		/**
		* @private
		* @type {import("./Stroke.js").default|null}
		*/
		this.stroke_ = options.stroke !== void 0 ? options.stroke : null;
		/**
		* @private
		* @type {import("../size.js").Size}
		*/
		this.size_;
		/**
		* @private
		* @type {RenderOptions}
		*/
		this.renderOptions_;
		this.imageState_ = this.fill_ && this.fill_.loading() ? ImageState_default.LOADING : ImageState_default.LOADED;
		if (this.imageState_ === ImageState_default.LOADING) this.ready().then(() => this.imageState_ = ImageState_default.LOADED);
		this.render();
	}
	/**
	* Clones the style.
	* @return {RegularShape} The cloned style.
	* @api
	*/
	clone() {
		const scale = this.getScale();
		const style = new RegularShape({
			fill: this.getFill() ? this.getFill().clone() : void 0,
			points: this.getPoints(),
			radius: this.getRadius(),
			radius2: this.getRadius2(),
			angle: this.getAngle(),
			stroke: this.getStroke() ? this.getStroke().clone() : void 0,
			rotation: this.getRotation(),
			rotateWithView: this.getRotateWithView(),
			scale: Array.isArray(scale) ? scale.slice() : scale,
			displacement: this.getDisplacement().slice(),
			declutterMode: this.getDeclutterMode()
		});
		style.setOpacity(this.getOpacity());
		return style;
	}
	/**
	* Get the anchor point in pixels. The anchor determines the center point for the
	* symbolizer.
	* @return {Array<number>} Anchor.
	* @api
	*/
	getAnchor() {
		const size = this.size_;
		const displacement = this.getDisplacement();
		const scale = this.getScaleArray();
		return [size[0] / 2 - displacement[0] / scale[0], size[1] / 2 + displacement[1] / scale[1]];
	}
	/**
	* Get the angle used in generating the shape.
	* @return {number} Shape's rotation in radians.
	* @api
	*/
	getAngle() {
		return this.angle_;
	}
	/**
	* Get the fill style for the shape.
	* @return {import("./Fill.js").default|null} Fill style.
	* @api
	*/
	getFill() {
		return this.fill_;
	}
	/**
	* Set the fill style.
	* @param {import("./Fill.js").default|null} fill Fill style.
	* @api
	*/
	setFill(fill) {
		this.fill_ = fill;
		this.render();
	}
	/**
	* @return {HTMLCanvasElement} Image element.
	*/
	getHitDetectionImage() {
		if (!this.hitDetectionCanvas_) this.hitDetectionCanvas_ = this.createHitDetectionCanvas_(this.renderOptions_);
		return this.hitDetectionCanvas_;
	}
	/**
	* Get the image icon.
	* @param {number} pixelRatio Pixel ratio.
	* @return {HTMLCanvasElement} Image or Canvas element.
	* @api
	*/
	getImage(pixelRatio) {
		let image = this.canvases_[pixelRatio];
		if (!image) {
			const renderOptions = this.renderOptions_;
			const context = createCanvasContext2D(renderOptions.size * pixelRatio, renderOptions.size * pixelRatio);
			this.draw_(renderOptions, context, pixelRatio);
			image = context.canvas;
			this.canvases_[pixelRatio] = image;
		}
		return image;
	}
	/**
	* Get the image pixel ratio.
	* @param {number} pixelRatio Pixel ratio.
	* @return {number} Pixel ratio.
	*/
	getPixelRatio(pixelRatio) {
		return pixelRatio;
	}
	/**
	* @return {import("../size.js").Size} Image size.
	*/
	getImageSize() {
		return this.size_;
	}
	/**
	* @return {import("../ImageState.js").default} Image state.
	*/
	getImageState() {
		return this.imageState_;
	}
	/**
	* Get the origin of the symbolizer.
	* @return {Array<number>} Origin.
	* @api
	*/
	getOrigin() {
		return this.origin_;
	}
	/**
	* Get the number of points for generating the shape.
	* @return {number} Number of points for stars and regular polygons.
	* @api
	*/
	getPoints() {
		return this.points_;
	}
	/**
	* Get the (primary) radius for the shape.
	* @return {number} Radius.
	* @api
	*/
	getRadius() {
		return this.radius_;
	}
	/**
	* Get the secondary radius for the shape.
	* @return {number|undefined} Radius2.
	* @api
	*/
	getRadius2() {
		return this.radius2_;
	}
	/**
	* Get the size of the symbolizer (in pixels).
	* @return {import("../size.js").Size} Size.
	* @api
	*/
	getSize() {
		return this.size_;
	}
	/**
	* Get the stroke style for the shape.
	* @return {import("./Stroke.js").default|null} Stroke style.
	* @api
	*/
	getStroke() {
		return this.stroke_;
	}
	/**
	* Set the stroke style.
	* @param {import("./Stroke.js").default|null} stroke Stroke style.
	* @api
	*/
	setStroke(stroke) {
		this.stroke_ = stroke;
		this.render();
	}
	/**
	* @param {function(import("../events/Event.js").default): void} listener Listener function.
	*/
	listenImageChange(listener) {}
	/**
	* Load not yet loaded URI.
	*/
	load() {}
	/**
	* @param {function(import("../events/Event.js").default): void} listener Listener function.
	*/
	unlistenImageChange(listener) {}
	/**
	* Calculate additional canvas size needed for the miter.
	* @param {string} lineJoin Line join
	* @param {number} strokeWidth Stroke width
	* @param {number} miterLimit Miter limit
	* @return {number} Additional canvas size needed
	* @private
	*/
	calculateLineJoinSize_(lineJoin, strokeWidth, miterLimit) {
		if (strokeWidth === 0 || this.points_ === Infinity || lineJoin !== "bevel" && lineJoin !== "miter") return strokeWidth;
		let r1 = this.radius_;
		let r2 = this.radius2_ === void 0 ? r1 : this.radius2_;
		if (r1 < r2) {
			const tmp = r1;
			r1 = r2;
			r2 = tmp;
		}
		const points = this.radius2_ === void 0 ? this.points_ : this.points_ * 2;
		const alpha = 2 * Math.PI / points;
		const a = r2 * Math.sin(alpha);
		const b = Math.sqrt(r2 * r2 - a * a);
		const d = r1 - b;
		const e = Math.sqrt(a * a + d * d);
		const miterRatio = e / a;
		if (lineJoin === "miter" && miterRatio <= miterLimit) return miterRatio * strokeWidth;
		const k = strokeWidth / 2 / miterRatio;
		const l = strokeWidth / 2 * (d / e);
		const bevelAdd = Math.sqrt((r1 + k) * (r1 + k) + l * l) - r1;
		if (this.radius2_ === void 0 || lineJoin === "bevel") return bevelAdd * 2;
		const aa = r1 * Math.sin(alpha);
		const bb = Math.sqrt(r1 * r1 - aa * aa);
		const dd = r2 - bb;
		const innerMiterRatio = Math.sqrt(aa * aa + dd * dd) / aa;
		if (innerMiterRatio <= miterLimit) {
			const innerLength = innerMiterRatio * strokeWidth / 2 - r2 - r1;
			return 2 * Math.max(bevelAdd, innerLength);
		}
		return bevelAdd * 2;
	}
	/**
	* @return {RenderOptions}  The render options
	* @protected
	*/
	createRenderOptions() {
		let lineCap = defaultLineCap;
		let lineJoin = defaultLineJoin;
		let miterLimit = 0;
		let lineDash = null;
		let lineDashOffset = 0;
		let strokeStyle;
		let strokeWidth = 0;
		if (this.stroke_) {
			strokeStyle = asColorLike(this.stroke_.getColor() ?? "#000");
			strokeWidth = this.stroke_.getWidth() ?? 1;
			lineDash = this.stroke_.getLineDash();
			lineDashOffset = this.stroke_.getLineDashOffset() ?? 0;
			lineJoin = this.stroke_.getLineJoin() ?? "round";
			lineCap = this.stroke_.getLineCap() ?? "round";
			miterLimit = this.stroke_.getMiterLimit() ?? 10;
		}
		const add = this.calculateLineJoinSize_(lineJoin, strokeWidth, miterLimit);
		const maxRadius = Math.max(this.radius_, this.radius2_ || 0);
		const size = Math.ceil(2 * maxRadius + add);
		return {
			strokeStyle,
			strokeWidth,
			size,
			lineCap,
			lineDash,
			lineDashOffset,
			lineJoin,
			miterLimit
		};
	}
	/**
	* @protected
	*/
	render() {
		this.renderOptions_ = this.createRenderOptions();
		const size = this.renderOptions_.size;
		this.canvases_ = {};
		this.hitDetectionCanvas_ = null;
		this.size_ = [size, size];
	}
	/**
	* @private
	* @param {RenderOptions} renderOptions Render options.
	* @param {CanvasRenderingContext2D} context The rendering context.
	* @param {number} pixelRatio The pixel ratio.
	*/
	draw_(renderOptions, context, pixelRatio) {
		context.scale(pixelRatio, pixelRatio);
		context.translate(renderOptions.size / 2, renderOptions.size / 2);
		this.createPath_(context);
		if (this.fill_) {
			let color = this.fill_.getColor();
			if (color === null) color = defaultFillStyle;
			context.fillStyle = asColorLike(color);
			context.fill();
		}
		if (renderOptions.strokeStyle) {
			context.strokeStyle = renderOptions.strokeStyle;
			context.lineWidth = renderOptions.strokeWidth;
			if (renderOptions.lineDash) {
				context.setLineDash(renderOptions.lineDash);
				context.lineDashOffset = renderOptions.lineDashOffset;
			}
			context.lineCap = renderOptions.lineCap;
			context.lineJoin = renderOptions.lineJoin;
			context.miterLimit = renderOptions.miterLimit;
			context.stroke();
		}
	}
	/**
	* @private
	* @param {RenderOptions} renderOptions Render options.
	* @return {HTMLCanvasElement} Canvas containing the icon
	*/
	createHitDetectionCanvas_(renderOptions) {
		let context;
		if (this.fill_) {
			let color = this.fill_.getColor();
			let opacity = 0;
			if (typeof color === "string") color = asArray(color);
			if (color === null) opacity = 1;
			else if (Array.isArray(color)) opacity = color.length === 4 ? color[3] : 1;
			if (opacity === 0) {
				context = createCanvasContext2D(renderOptions.size, renderOptions.size);
				this.drawHitDetectionCanvas_(renderOptions, context);
			}
		}
		return context ? context.canvas : this.getImage(1);
	}
	/**
	* @private
	* @param {CanvasRenderingContext2D} context The context to draw in.
	*/
	createPath_(context) {
		let points = this.points_;
		const radius = this.radius_;
		if (points === Infinity) context.arc(0, 0, radius, 0, 2 * Math.PI);
		else {
			const radius2 = this.radius2_ === void 0 ? radius : this.radius2_;
			if (this.radius2_ !== void 0) points *= 2;
			const startAngle = this.angle_ - Math.PI / 2;
			const step = 2 * Math.PI / points;
			for (let i = 0; i < points; i++) {
				const angle0 = startAngle + i * step;
				const radiusC = i % 2 === 0 ? radius : radius2;
				context.lineTo(radiusC * Math.cos(angle0), radiusC * Math.sin(angle0));
			}
			context.closePath();
		}
	}
	/**
	* @private
	* @param {RenderOptions} renderOptions Render options.
	* @param {CanvasRenderingContext2D} context The context.
	*/
	drawHitDetectionCanvas_(renderOptions, context) {
		context.translate(renderOptions.size / 2, renderOptions.size / 2);
		this.createPath_(context);
		context.fillStyle = defaultFillStyle;
		context.fill();
		if (renderOptions.strokeStyle) {
			context.strokeStyle = renderOptions.strokeStyle;
			context.lineWidth = renderOptions.strokeWidth;
			if (renderOptions.lineDash) {
				context.setLineDash(renderOptions.lineDash);
				context.lineDashOffset = renderOptions.lineDashOffset;
			}
			context.lineJoin = renderOptions.lineJoin;
			context.miterLimit = renderOptions.miterLimit;
			context.stroke();
		}
	}
	ready() {
		return this.fill_ ? this.fill_.ready() : Promise.resolve();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/style/Circle.js
/**
* @module ol/style/Circle
*/
/**
* @typedef {Object} Options
* @property {import("./Fill.js").default} [fill] Fill style.
* @property {number} radius Circle radius.
* @property {import("./Stroke.js").default} [stroke] Stroke style.
* @property {Array<number>} [displacement=[0,0]] displacement
* @property {number|import("../size.js").Size} [scale=1] Scale. A two dimensional scale will produce an ellipse.
* Unless two dimensional scaling is required a better result may be obtained with an appropriate setting for `radius`.
* @property {number} [rotation=0] Rotation in radians
* (positive rotation clockwise, meaningful only when used in conjunction with a two dimensional scale).
* @property {boolean} [rotateWithView=false] Whether to rotate the shape with the view
* (meaningful only when used in conjunction with a two dimensional scale).
* @property {import('./Style.js').DeclutterMode} [declutterMode] Declutter mode
*/
/**
* @classdesc
* Set circle style for vector features.
* @api
*/
var CircleStyle = class CircleStyle extends RegularShape {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		options = options ? options : { radius: 5 };
		super({
			points: Infinity,
			fill: options.fill,
			radius: options.radius,
			stroke: options.stroke,
			scale: options.scale !== void 0 ? options.scale : 1,
			rotation: options.rotation !== void 0 ? options.rotation : 0,
			rotateWithView: options.rotateWithView !== void 0 ? options.rotateWithView : false,
			displacement: options.displacement !== void 0 ? options.displacement : [0, 0],
			declutterMode: options.declutterMode
		});
	}
	/**
	* Clones the style.
	* @return {CircleStyle} The cloned style.
	* @api
	*/
	clone() {
		const scale = this.getScale();
		const style = new CircleStyle({
			fill: this.getFill() ? this.getFill().clone() : void 0,
			stroke: this.getStroke() ? this.getStroke().clone() : void 0,
			radius: this.getRadius(),
			scale: Array.isArray(scale) ? scale.slice() : scale,
			rotation: this.getRotation(),
			rotateWithView: this.getRotateWithView(),
			displacement: this.getDisplacement().slice(),
			declutterMode: this.getDeclutterMode()
		});
		style.setOpacity(this.getOpacity());
		return style;
	}
	/**
	* Set the circle radius.
	*
	* @param {number} radius Circle radius.
	* @api
	*/
	setRadius(radius) {
		this.radius_ = radius;
		this.render();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/style/Style.js
/**
* @module ol/style/Style
*/
/**
* Defines how symbols and text are decluttered on layers ith `declutter` set to `true`
* * **declutter**: Overlapping symbols and text are decluttered.
* * **obstacle**: Symbols and text are rendered, but serve as obstacle for subsequent attempts
*   to place a symbol or text at the same location.
* * **none**: No decluttering is done.
*
* @typedef {"declutter"|"obstacle"|"none"} DeclutterMode
*/
/**
* A function that takes an {@link module:ol/Feature~Feature} and a `{number}`
* representing the view's resolution. The function should return a
* {@link module:ol/style/Style~Style} or an array of them. This way e.g. a
* vector layer can be styled. If the function returns `undefined`, the
* feature will not be rendered.
*
* @typedef {function(import("../Feature.js").FeatureLike, number):(Style|Array<Style>|void)} StyleFunction
*/
/**
* A {@link Style}, an array of {@link Style}, or a {@link StyleFunction}.
* @typedef {Style|Array<Style>|StyleFunction} StyleLike
*/
/**
* A function that takes an {@link module:ol/Feature~Feature} as argument and returns an
* {@link module:ol/geom/Geometry~Geometry} that will be rendered and styled for the feature.
*
* @typedef {function(import("../Feature.js").FeatureLike):
*     (import("../geom/Geometry.js").default|import("../render/Feature.js").default|undefined)} GeometryFunction
*/
/**
* Custom renderer function. Takes two arguments:
*
* 1. The pixel coordinates of the geometry in GeoJSON notation.
* 2. The {@link module:ol/render~State} of the layer renderer.
*
* @typedef {function((import("../coordinate.js").Coordinate|Array<import("../coordinate.js").Coordinate>|Array<Array<import("../coordinate.js").Coordinate>>|Array<Array<Array<import("../coordinate.js").Coordinate>>>),import("../render.js").State): void} RenderFunction
*/
/**
* @typedef {Object} Options
* @property {string|import("../geom/Geometry.js").default|GeometryFunction} [geometry] Feature property or geometry
* or function returning a geometry to render for this style.
* @property {import("./Fill.js").default} [fill] Fill style.
* @property {import("./Image.js").default} [image] Image style.
* @property {RenderFunction} [renderer] Custom renderer. When configured, `fill`, `stroke` and `image` will be
* ignored, and the provided function will be called with each render frame for each geometry.
* @property {RenderFunction} [hitDetectionRenderer] Custom renderer for hit detection. If provided will be used
* in hit detection rendering.
* @property {import("./Stroke.js").default} [stroke] Stroke style.
* @property {import("./Text.js").default} [text] Text style.
* @property {number} [zIndex] Z index.
*/
/**
* @classdesc
* Container for vector feature rendering styles. Any changes made to the style
* or its children through `set*()` methods will not take effect until the
* feature or layer that uses the style is re-rendered.
*
* ## Feature styles
*
* If no style is defined, the following default style is used:
* ```js
*  import {Circle, Fill, Stroke, Style} from 'ol/style.js';
*
*  const fill = new Fill({
*    color: 'rgba(255,255,255,0.4)',
*  });
*  const stroke = new Stroke({
*    color: '#3399CC',
*    width: 1.25,
*  });
*  const styles = [
*    new Style({
*      image: new Circle({
*        fill: fill,
*        stroke: stroke,
*        radius: 5,
*      }),
*      fill: fill,
*      stroke: stroke,
*    }),
*  ];
* ```
*
* A separate editing style has the following defaults:
* ```js
*  import {Circle, Fill, Stroke, Style} from 'ol/style.js';
*
*  const styles = {};
*  const white = [255, 255, 255, 1];
*  const blue = [0, 153, 255, 1];
*  const width = 3;
*  styles['Polygon'] = [
*    new Style({
*      fill: new Fill({
*        color: [255, 255, 255, 0.5],
*      }),
*    }),
*  ];
*  styles['MultiPolygon'] =
*      styles['Polygon'];
*  styles['LineString'] = [
*    new Style({
*      stroke: new Stroke({
*        color: white,
*        width: width + 2,
*      }),
*    }),
*    new Style({
*      stroke: new Stroke({
*        color: blue,
*        width: width,
*      }),
*    }),
*  ];
*  styles['MultiLineString'] = styles['LineString'];
*
*  styles['Circle'] = styles['Polygon'].concat(
*    styles['LineString']
*  );
*
*  styles['Point'] = [
*    new Style({
*      image: new Circle({
*        radius: width * 2,
*        fill: new Fill({
*          color: blue,
*        }),
*        stroke: new Stroke({
*          color: white,
*          width: width / 2,
*        }),
*      }),
*      zIndex: Infinity,
*    }),
*  ];
*  styles['MultiPoint'] =
*      styles['Point'];
*  styles['GeometryCollection'] =
*      styles['Polygon'].concat(
*          styles['LineString'],
*          styles['Point']
*      );
* ```
*
* @api
*/
var Style = class Style {
	/**
	* @param {Options} [options] Style options.
	*/
	constructor(options) {
		options = options || {};
		/**
		* @private
		* @type {string|import("../geom/Geometry.js").default|GeometryFunction|null}
		*/
		this.geometry_ = null;
		/**
		* @private
		* @type {!GeometryFunction}
		*/
		this.geometryFunction_ = defaultGeometryFunction;
		if (options.geometry !== void 0) this.setGeometry(options.geometry);
		/**
		* @private
		* @type {import("./Fill.js").default|null}
		*/
		this.fill_ = options.fill !== void 0 ? options.fill : null;
		/**
		* @private
		* @type {import("./Image.js").default|null}
		*/
		this.image_ = options.image !== void 0 ? options.image : null;
		/**
		* @private
		* @type {RenderFunction|null}
		*/
		this.renderer_ = options.renderer !== void 0 ? options.renderer : null;
		/**
		* @private
		* @type {RenderFunction|null}
		*/
		this.hitDetectionRenderer_ = options.hitDetectionRenderer !== void 0 ? options.hitDetectionRenderer : null;
		/**
		* @private
		* @type {import("./Stroke.js").default|null}
		*/
		this.stroke_ = options.stroke !== void 0 ? options.stroke : null;
		/**
		* @private
		* @type {import("./Text.js").default|null}
		*/
		this.text_ = options.text !== void 0 ? options.text : null;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.zIndex_ = options.zIndex;
	}
	/**
	* Clones the style.
	* @return {Style} The cloned style.
	* @api
	*/
	clone() {
		let geometry = this.getGeometry();
		if (geometry && typeof geometry === "object") geometry = geometry.clone();
		return new Style({
			geometry: geometry ?? void 0,
			fill: this.getFill() ? this.getFill().clone() : void 0,
			image: this.getImage() ? this.getImage().clone() : void 0,
			renderer: this.getRenderer() ?? void 0,
			stroke: this.getStroke() ? this.getStroke().clone() : void 0,
			text: this.getText() ? this.getText().clone() : void 0,
			zIndex: this.getZIndex()
		});
	}
	/**
	* Get the custom renderer function that was configured with
	* {@link #setRenderer} or the `renderer` constructor option.
	* @return {RenderFunction|null} Custom renderer function.
	* @api
	*/
	getRenderer() {
		return this.renderer_;
	}
	/**
	* Sets a custom renderer function for this style. When set, `fill`, `stroke`
	* and `image` options of the style will be ignored.
	* @param {RenderFunction|null} renderer Custom renderer function.
	* @api
	*/
	setRenderer(renderer) {
		this.renderer_ = renderer;
	}
	/**
	* Sets a custom renderer function for this style used
	* in hit detection.
	* @param {RenderFunction|null} renderer Custom renderer function.
	* @api
	*/
	setHitDetectionRenderer(renderer) {
		this.hitDetectionRenderer_ = renderer;
	}
	/**
	* Get the custom renderer function that was configured with
	* {@link #setHitDetectionRenderer} or the `hitDetectionRenderer` constructor option.
	* @return {RenderFunction|null} Custom renderer function.
	* @api
	*/
	getHitDetectionRenderer() {
		return this.hitDetectionRenderer_;
	}
	/**
	* Get the geometry to be rendered.
	* @return {string|import("../geom/Geometry.js").default|GeometryFunction|null}
	* Feature property or geometry or function that returns the geometry that will
	* be rendered with this style.
	* @api
	*/
	getGeometry() {
		return this.geometry_;
	}
	/**
	* Get the function used to generate a geometry for rendering.
	* @return {!GeometryFunction} Function that is called with a feature
	* and returns the geometry to render instead of the feature's geometry.
	* @api
	*/
	getGeometryFunction() {
		return this.geometryFunction_;
	}
	/**
	* Get the fill style.
	* @return {import("./Fill.js").default|null} Fill style.
	* @api
	*/
	getFill() {
		return this.fill_;
	}
	/**
	* Set the fill style.
	* @param {import("./Fill.js").default|null} fill Fill style.
	* @api
	*/
	setFill(fill) {
		this.fill_ = fill;
	}
	/**
	* Get the image style.
	* @return {import("./Image.js").default|null} Image style.
	* @api
	*/
	getImage() {
		return this.image_;
	}
	/**
	* Set the image style.
	* @param {import("./Image.js").default} image Image style.
	* @api
	*/
	setImage(image) {
		this.image_ = image;
	}
	/**
	* Get the stroke style.
	* @return {import("./Stroke.js").default|null} Stroke style.
	* @api
	*/
	getStroke() {
		return this.stroke_;
	}
	/**
	* Set the stroke style.
	* @param {import("./Stroke.js").default|null} stroke Stroke style.
	* @api
	*/
	setStroke(stroke) {
		this.stroke_ = stroke;
	}
	/**
	* Get the text style.
	* @return {import("./Text.js").default|null} Text style.
	* @api
	*/
	getText() {
		return this.text_;
	}
	/**
	* Set the text style.
	* @param {import("./Text.js").default} text Text style.
	* @api
	*/
	setText(text) {
		this.text_ = text;
	}
	/**
	* Get the z-index for the style.
	* @return {number|undefined} ZIndex.
	* @api
	*/
	getZIndex() {
		return this.zIndex_;
	}
	/**
	* Set a geometry that is rendered instead of the feature's geometry.
	*
	* @param {string|import("../geom/Geometry.js").default|GeometryFunction} geometry
	*     Feature property or geometry or function returning a geometry to render
	*     for this style.
	* @api
	*/
	setGeometry(geometry) {
		if (typeof geometry === "function") this.geometryFunction_ = geometry;
		else if (typeof geometry === "string") this.geometryFunction_ = function(feature) {
			return feature.get(geometry);
		};
		else if (!geometry) this.geometryFunction_ = defaultGeometryFunction;
		else if (geometry !== void 0) this.geometryFunction_ = function() {
			return geometry;
		};
		this.geometry_ = geometry;
	}
	/**
	* Set the z-index.
	*
	* @param {number|undefined} zIndex ZIndex.
	* @api
	*/
	setZIndex(zIndex) {
		this.zIndex_ = zIndex;
	}
};
/**
* Convert the provided object into a style function.  Functions passed through
* unchanged.  Arrays of Style or single style objects wrapped in a
* new style function.
* @param {StyleFunction|Array<Style>|Style} obj
*     A style function, a single style, or an array of styles.
* @return {StyleFunction} A style function.
*/
function toFunction(obj) {
	let styleFunction;
	if (typeof obj === "function") styleFunction = obj;
	else {
		/**
		* @type {Array<Style>}
		*/
		let styles;
		if (Array.isArray(obj)) styles = obj;
		else {
			assert(typeof obj.getZIndex === "function", "Expected an `Style` or an array of `Style`");
			styles = [obj];
		}
		styleFunction = function() {
			return styles;
		};
	}
	return styleFunction;
}
/**
* @type {Array<Style>|null}
*/
var defaultStyles = null;
/**
* @param {import("../Feature.js").FeatureLike} feature Feature.
* @param {number} resolution Resolution.
* @return {Array<Style>} Style.
*/
function createDefaultStyle(feature, resolution) {
	if (!defaultStyles) {
		const fill = new Fill({ color: "rgba(255,255,255,0.4)" });
		const stroke = new Stroke({
			color: "#3399CC",
			width: 1.25
		});
		defaultStyles = [new Style({
			image: new CircleStyle({
				fill,
				stroke,
				radius: 5
			}),
			fill,
			stroke
		})];
	}
	return defaultStyles;
}
/**
* Function that is called with a feature and returns its default geometry.
* @param {import("../Feature.js").FeatureLike} feature Feature to get the geometry for.
* @return {import("../geom/Geometry.js").default|import("../render/Feature.js").default|undefined} Geometry to render.
*/
function defaultGeometryFunction(feature) {
	return feature.getGeometry();
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/style/Text.js
/**
* @module ol/style/Text
*/
/**
* @typedef {'point' | 'line'} TextPlacement
* Default text placement is `'point'`. Note that
* `'line'` requires the underlying geometry to be a {@link module:ol/geom/LineString~LineString},
* {@link module:ol/geom/Polygon~Polygon}, {@link module:ol/geom/MultiLineString~MultiLineString} or
* {@link module:ol/geom/MultiPolygon~MultiPolygon}.
*/
/**
* @typedef {'left' | 'center' | 'right'} TextJustify
*/
/**
* The default fill color to use if no fill was set at construction time; a
* blackish `#333`.
*
* @const {string}
*/
var DEFAULT_FILL_COLOR = "#333";
/**
* @typedef {Object} Options
* @property {string} [font] Font style as CSS `font` value, see:
* https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font. Default is `'10px sans-serif'`
* @property {number} [maxAngle=Math.PI/4] When `placement` is set to `'line'`, allow a maximum angle between adjacent characters.
* The expected value is in radians, and the default is 45° (`Math.PI / 4`).
* @property {number} [offsetX=0] Horizontal text offset in pixels. A positive will shift the text right.
* @property {number} [offsetY=0] Vertical text offset in pixels. A positive will shift the text down.
* @property {boolean} [overflow=false] For polygon labels or when `placement` is set to `'line'`, allow text to exceed
* the width of the polygon at the label position or the length of the path that it follows.
* @property {TextPlacement} [placement='point'] Text placement.
* @property {number} [repeat] Repeat interval. When set, the text will be repeated at this interval, which specifies
* the distance between two text anchors in pixels. Only available when `placement` is set to `'line'`. Overrides 'textAlign'.
* @property {number|import("../size.js").Size} [scale] Scale.
* @property {boolean} [rotateWithView=false] Whether to rotate the text with the view.
* @property {number} [rotation=0] Rotation in radians (positive rotation clockwise).
* @property {string|Array<string>} [text] Text content or rich text content. For plain text provide a string, which can
* contain line breaks (`\n`). For rich text provide an array of text/font tuples. A tuple consists of the text to
* render and the font to use (or `''` to use the text style's font). A line break has to be a separate tuple (i.e. `'\n', ''`).
* **Example:** `['foo', 'bold 10px sans-serif', ' bar', 'italic 10px sans-serif', ' baz', '']` will yield "**foo** *bar* baz".
* **Note:** Rich text is not supported for `placement: 'line'` or the immediate rendering API.
* @property {CanvasTextAlign} [textAlign] Text alignment. Possible values: `'left'`, `'right'`, `'center'`, `'end'` or `'start'`.
* Default is `'center'` for `placement: 'point'`. For `placement: 'line'`, the default is to let the renderer choose a
* placement where `maxAngle` is not exceeded.
* @property {TextJustify} [justify] Text justification within the text box.
* If not set, text is justified towards the `textAlign` anchor.
* Otherwise, use options `'left'`, `'center'`, or `'right'` to justify the text within the text box.
* **Note:** `justify` is ignored for immediate rendering and also for `placement: 'line'`.
* @property {CanvasTextBaseline} [textBaseline='middle'] Text base line. Possible values: `'bottom'`, `'top'`, `'middle'`, `'alphabetic'`,
* `'hanging'`, `'ideographic'`.
* @property {import("./Fill.js").default|null} [fill] Fill style. If none is provided, we'll use a dark fill-style (#333). Specify `null` for no fill.
* @property {import("./Stroke.js").default} [stroke] Stroke style.
* @property {import("./Fill.js").default} [backgroundFill] Fill style for the text background when `placement` is
* `'point'`. Default is no fill.
* @property {import("./Stroke.js").default} [backgroundStroke] Stroke style for the text background  when `placement`
* is `'point'`. Default is no stroke.
* @property {Array<number>} [padding=[0, 0, 0, 0]] Padding in pixels around the text for decluttering and background. The order of
* values in the array is `[top, right, bottom, left]`.
* @property {import('../style/Style.js').DeclutterMode} [declutterMode] Declutter mode: `declutter`, `obstacle`, `none`
*/
/**
* @classdesc
* Set text style for vector features.
* @api
*/
var Text = class Text {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		options = options || {};
		/**
		* @private
		* @type {string|undefined}
		*/
		this.font_ = options.font;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.rotation_ = options.rotation;
		/**
		* @private
		* @type {boolean|undefined}
		*/
		this.rotateWithView_ = options.rotateWithView;
		/**
		* @private
		* @type {number|import("../size.js").Size|undefined}
		*/
		this.scale_ = options.scale;
		/**
		* @private
		* @type {import("../size.js").Size}
		*/
		this.scaleArray_ = toSize(options.scale !== void 0 ? options.scale : 1);
		/**
		* @private
		* @type {string|Array<string>|undefined}
		*/
		this.text_ = options.text;
		/**
		* @private
		* @type {CanvasTextAlign|undefined}
		*/
		this.textAlign_ = options.textAlign;
		/**
		* @private
		* @type {TextJustify|undefined}
		*/
		this.justify_ = options.justify;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.repeat_ = options.repeat;
		/**
		* @private
		* @type {CanvasTextBaseline|undefined}
		*/
		this.textBaseline_ = options.textBaseline;
		/**
		* @private
		* @type {import("./Fill.js").default|null}
		*/
		this.fill_ = options.fill !== void 0 ? options.fill : new Fill({ color: DEFAULT_FILL_COLOR });
		/**
		* @private
		* @type {number}
		*/
		this.maxAngle_ = options.maxAngle !== void 0 ? options.maxAngle : Math.PI / 4;
		/**
		* @private
		* @type {TextPlacement}
		*/
		this.placement_ = options.placement !== void 0 ? options.placement : "point";
		/**
		* @private
		* @type {boolean}
		*/
		this.overflow_ = !!options.overflow;
		/**
		* @private
		* @type {import("./Stroke.js").default|null}
		*/
		this.stroke_ = options.stroke !== void 0 ? options.stroke : null;
		/**
		* @private
		* @type {number}
		*/
		this.offsetX_ = options.offsetX !== void 0 ? options.offsetX : 0;
		/**
		* @private
		* @type {number}
		*/
		this.offsetY_ = options.offsetY !== void 0 ? options.offsetY : 0;
		/**
		* @private
		* @type {import("./Fill.js").default|null}
		*/
		this.backgroundFill_ = options.backgroundFill ? options.backgroundFill : null;
		/**
		* @private
		* @type {import("./Stroke.js").default|null}
		*/
		this.backgroundStroke_ = options.backgroundStroke ? options.backgroundStroke : null;
		/**
		* @private
		* @type {Array<number>|null}
		*/
		this.padding_ = options.padding === void 0 ? null : options.padding;
		/**
		* @private
		* @type {import('../style/Style.js').DeclutterMode}
		*/
		this.declutterMode_ = options.declutterMode;
	}
	/**
	* Clones the style.
	* @return {Text} The cloned style.
	* @api
	*/
	clone() {
		const scale = this.getScale();
		return new Text({
			font: this.getFont(),
			placement: this.getPlacement(),
			repeat: this.getRepeat(),
			maxAngle: this.getMaxAngle(),
			overflow: this.getOverflow(),
			rotation: this.getRotation(),
			rotateWithView: this.getRotateWithView(),
			scale: Array.isArray(scale) ? scale.slice() : scale,
			text: this.getText(),
			textAlign: this.getTextAlign(),
			justify: this.getJustify(),
			textBaseline: this.getTextBaseline(),
			fill: this.getFill() ? this.getFill().clone() : void 0,
			stroke: this.getStroke() ? this.getStroke().clone() : void 0,
			offsetX: this.getOffsetX(),
			offsetY: this.getOffsetY(),
			backgroundFill: this.getBackgroundFill() ? this.getBackgroundFill().clone() : void 0,
			backgroundStroke: this.getBackgroundStroke() ? this.getBackgroundStroke().clone() : void 0,
			padding: this.getPadding() || void 0,
			declutterMode: this.getDeclutterMode()
		});
	}
	/**
	* Get the `overflow` configuration.
	* @return {boolean} Let text overflow the length of the path they follow.
	* @api
	*/
	getOverflow() {
		return this.overflow_;
	}
	/**
	* Get the font name.
	* @return {string|undefined} Font.
	* @api
	*/
	getFont() {
		return this.font_;
	}
	/**
	* Get the maximum angle between adjacent characters.
	* @return {number} Angle in radians.
	* @api
	*/
	getMaxAngle() {
		return this.maxAngle_;
	}
	/**
	* Get the label placement.
	* @return {TextPlacement} Text placement.
	* @api
	*/
	getPlacement() {
		return this.placement_;
	}
	/**
	* Get the repeat interval of the text.
	* @return {number|undefined} Repeat interval in pixels.
	* @api
	*/
	getRepeat() {
		return this.repeat_;
	}
	/**
	* Get the x-offset for the text.
	* @return {number} Horizontal text offset.
	* @api
	*/
	getOffsetX() {
		return this.offsetX_;
	}
	/**
	* Get the y-offset for the text.
	* @return {number} Vertical text offset.
	* @api
	*/
	getOffsetY() {
		return this.offsetY_;
	}
	/**
	* Get the fill style for the text.
	* @return {import("./Fill.js").default|null} Fill style.
	* @api
	*/
	getFill() {
		return this.fill_;
	}
	/**
	* Determine whether the text rotates with the map.
	* @return {boolean|undefined} Rotate with map.
	* @api
	*/
	getRotateWithView() {
		return this.rotateWithView_;
	}
	/**
	* Get the text rotation.
	* @return {number|undefined} Rotation.
	* @api
	*/
	getRotation() {
		return this.rotation_;
	}
	/**
	* Get the text scale.
	* @return {number|import("../size.js").Size|undefined} Scale.
	* @api
	*/
	getScale() {
		return this.scale_;
	}
	/**
	* Get the symbolizer scale array.
	* @return {import("../size.js").Size} Scale array.
	*/
	getScaleArray() {
		return this.scaleArray_;
	}
	/**
	* Get the stroke style for the text.
	* @return {import("./Stroke.js").default|null} Stroke style.
	* @api
	*/
	getStroke() {
		return this.stroke_;
	}
	/**
	* Get the text to be rendered.
	* @return {string|Array<string>|undefined} Text.
	* @api
	*/
	getText() {
		return this.text_;
	}
	/**
	* Get the text alignment.
	* @return {CanvasTextAlign|undefined} Text align.
	* @api
	*/
	getTextAlign() {
		return this.textAlign_;
	}
	/**
	* Get the justification.
	* @return {TextJustify|undefined} Justification.
	* @api
	*/
	getJustify() {
		return this.justify_;
	}
	/**
	* Get the text baseline.
	* @return {CanvasTextBaseline|undefined} Text baseline.
	* @api
	*/
	getTextBaseline() {
		return this.textBaseline_;
	}
	/**
	* Get the background fill style for the text.
	* @return {import("./Fill.js").default|null} Fill style.
	* @api
	*/
	getBackgroundFill() {
		return this.backgroundFill_;
	}
	/**
	* Get the background stroke style for the text.
	* @return {import("./Stroke.js").default|null} Stroke style.
	* @api
	*/
	getBackgroundStroke() {
		return this.backgroundStroke_;
	}
	/**
	* Get the padding for the text.
	* @return {Array<number>|null} Padding.
	* @api
	*/
	getPadding() {
		return this.padding_;
	}
	/**
	* Get the declutter mode of the shape
	* @return {import("./Style.js").DeclutterMode} Shape's declutter mode
	* @api
	*/
	getDeclutterMode() {
		return this.declutterMode_;
	}
	/**
	* Set the `overflow` property.
	*
	* @param {boolean} overflow Let text overflow the path that it follows.
	* @api
	*/
	setOverflow(overflow) {
		this.overflow_ = overflow;
	}
	/**
	* Set the font.
	*
	* @param {string|undefined} font Font.
	* @api
	*/
	setFont(font) {
		this.font_ = font;
	}
	/**
	* Set the maximum angle between adjacent characters.
	*
	* @param {number} maxAngle Angle in radians.
	* @api
	*/
	setMaxAngle(maxAngle) {
		this.maxAngle_ = maxAngle;
	}
	/**
	* Set the x offset.
	*
	* @param {number} offsetX Horizontal text offset.
	* @api
	*/
	setOffsetX(offsetX) {
		this.offsetX_ = offsetX;
	}
	/**
	* Set the y offset.
	*
	* @param {number} offsetY Vertical text offset.
	* @api
	*/
	setOffsetY(offsetY) {
		this.offsetY_ = offsetY;
	}
	/**
	* Set the text placement.
	*
	* @param {TextPlacement} placement Placement.
	* @api
	*/
	setPlacement(placement) {
		this.placement_ = placement;
	}
	/**
	* Set the repeat interval of the text.
	* @param {number|undefined} [repeat] Repeat interval in pixels.
	* @api
	*/
	setRepeat(repeat) {
		this.repeat_ = repeat;
	}
	/**
	* Set whether to rotate the text with the view.
	*
	* @param {boolean} rotateWithView Rotate with map.
	* @api
	*/
	setRotateWithView(rotateWithView) {
		this.rotateWithView_ = rotateWithView;
	}
	/**
	* Set the fill.
	*
	* @param {import("./Fill.js").default|null} fill Fill style.
	* @api
	*/
	setFill(fill) {
		this.fill_ = fill;
	}
	/**
	* Set the rotation.
	*
	* @param {number|undefined} rotation Rotation.
	* @api
	*/
	setRotation(rotation) {
		this.rotation_ = rotation;
	}
	/**
	* Set the scale.
	*
	* @param {number|import("../size.js").Size|undefined} scale Scale.
	* @api
	*/
	setScale(scale) {
		this.scale_ = scale;
		this.scaleArray_ = toSize(scale !== void 0 ? scale : 1);
	}
	/**
	* Set the stroke.
	*
	* @param {import("./Stroke.js").default|null} stroke Stroke style.
	* @api
	*/
	setStroke(stroke) {
		this.stroke_ = stroke;
	}
	/**
	* Set the text.
	*
	* @param {string|Array<string>|undefined} text Text.
	* @api
	*/
	setText(text) {
		this.text_ = text;
	}
	/**
	* Set the text alignment.
	*
	* @param {CanvasTextAlign|undefined} textAlign Text align.
	* @api
	*/
	setTextAlign(textAlign) {
		this.textAlign_ = textAlign;
	}
	/**
	* Set the justification.
	*
	* @param {TextJustify|undefined} justify Justification.
	* @api
	*/
	setJustify(justify) {
		this.justify_ = justify;
	}
	/**
	* Set the text baseline.
	*
	* @param {CanvasTextBaseline|undefined} textBaseline Text baseline.
	* @api
	*/
	setTextBaseline(textBaseline) {
		this.textBaseline_ = textBaseline;
	}
	/**
	* Set the background fill.
	*
	* @param {import("./Fill.js").default|null} fill Fill style.
	* @api
	*/
	setBackgroundFill(fill) {
		this.backgroundFill_ = fill;
	}
	/**
	* Set the background stroke.
	*
	* @param {import("./Stroke.js").default|null} stroke Stroke style.
	* @api
	*/
	setBackgroundStroke(stroke) {
		this.backgroundStroke_ = stroke;
	}
	/**
	* Set the padding (`[top, right, bottom, left]`).
	*
	* @param {Array<number>|null} padding Padding.
	* @api
	*/
	setPadding(padding) {
		this.padding_ = padding;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/layer/Property.js
/**
* @module ol/layer/Property
*/
/**
* @enum {string}
*/
var Property_default$1 = {
	OPACITY: "opacity",
	VISIBLE: "visible",
	EXTENT: "extent",
	Z_INDEX: "zIndex",
	MAX_RESOLUTION: "maxResolution",
	MIN_RESOLUTION: "minResolution",
	MAX_ZOOM: "maxZoom",
	MIN_ZOOM: "minZoom",
	SOURCE: "source",
	MAP: "map"
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/layer/Base.js
/**
* @module ol/layer/Base
*/
/**
* A css color, or a function called with a view resolution returning a css color.
*
* @typedef {string|function(number):string} BackgroundColor
* @api
*/
/**
* @typedef {import("../ObjectEventType").Types|'change:extent'|'change:maxResolution'|'change:maxZoom'|
*    'change:minResolution'|'change:minZoom'|'change:opacity'|'change:visible'|'change:zIndex'} BaseLayerObjectEventTypes
*/
/***
* @template Return
* @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
*   import("../Observable").OnSignature<BaseLayerObjectEventTypes, import("../Object").ObjectEvent, Return> &
*   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|BaseLayerObjectEventTypes, Return>} BaseLayerOnSignature
*/
/**
* @typedef {Object} Options
* @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
* @property {number} [opacity=1] Opacity (0, 1).
* @property {boolean} [visible=true] Visibility.
* @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
* rendered outside of this extent.
* @property {number | undefined} [zIndex] The z-index for layer rendering.  At rendering time, the layers
* will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
* for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
* method was used.
* @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
* visible.
* @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
* be visible.
* @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
* visible.
* @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
* be visible.
* @property {BackgroundColor} [background] Background color for the layer. If not specified, no background
* will be rendered.
* @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
*/
/**
* @classdesc
* Abstract base class; normally only used for creating subclasses and not
* instantiated in apps.
* Note that with {@link module:ol/layer/Base~BaseLayer} and all its subclasses, any property set in
* the options is set as a {@link module:ol/Object~BaseObject} property on the layer object, so
* is observable, and has get/set accessors.
*
* @api
*/
var BaseLayer = class extends BaseObject {
	/**
	* @param {Options} options Layer options.
	*/
	constructor(options) {
		super();
		/***
		* @type {BaseLayerOnSignature<import("../events").EventsKey>}
		*/
		this.on;
		/***
		* @type {BaseLayerOnSignature<import("../events").EventsKey>}
		*/
		this.once;
		/***
		* @type {BaseLayerOnSignature<void>}
		*/
		this.un;
		/**
		* @type {BackgroundColor|false}
		* @private
		*/
		this.background_ = options.background;
		/**
		* @type {Object<string, *>}
		*/
		const properties = Object.assign({}, options);
		if (typeof options.properties === "object") {
			delete properties.properties;
			Object.assign(properties, options.properties);
		}
		properties[Property_default$1.OPACITY] = options.opacity !== void 0 ? options.opacity : 1;
		assert(typeof properties[Property_default$1.OPACITY] === "number", "Layer opacity must be a number");
		properties[Property_default$1.VISIBLE] = options.visible !== void 0 ? options.visible : true;
		properties[Property_default$1.Z_INDEX] = options.zIndex;
		properties[Property_default$1.MAX_RESOLUTION] = options.maxResolution !== void 0 ? options.maxResolution : Infinity;
		properties[Property_default$1.MIN_RESOLUTION] = options.minResolution !== void 0 ? options.minResolution : 0;
		properties[Property_default$1.MIN_ZOOM] = options.minZoom !== void 0 ? options.minZoom : -Infinity;
		properties[Property_default$1.MAX_ZOOM] = options.maxZoom !== void 0 ? options.maxZoom : Infinity;
		/**
		* @type {string}
		* @private
		*/
		this.className_ = properties.className !== void 0 ? properties.className : "ol-layer";
		delete properties.className;
		this.setProperties(properties);
		/**
		* @type {import("./Layer.js").State}
		* @private
		*/
		this.state_ = null;
	}
	/**
	* Get the background for this layer.
	* @return {BackgroundColor|false} Layer background.
	*/
	getBackground() {
		return this.background_;
	}
	/**
	* @return {string} CSS class name.
	*/
	getClassName() {
		return this.className_;
	}
	/**
	* This method is not meant to be called by layers or layer renderers because the state
	* is incorrect if the layer is included in a layer group.
	*
	* @param {boolean} [managed] Layer is managed.
	* @return {import("./Layer.js").State} Layer state.
	*/
	getLayerState(managed) {
		/** @type {import("./Layer.js").State} */
		const state = this.state_ || {
			layer: this,
			managed: managed === void 0 ? true : managed
		};
		const zIndex = this.getZIndex();
		state.opacity = clamp(Math.round(this.getOpacity() * 100) / 100, 0, 1);
		state.visible = this.getVisible();
		state.extent = this.getExtent();
		state.zIndex = zIndex === void 0 && !state.managed ? Infinity : zIndex;
		state.maxResolution = this.getMaxResolution();
		state.minResolution = Math.max(this.getMinResolution(), 0);
		state.minZoom = this.getMinZoom();
		state.maxZoom = this.getMaxZoom();
		this.state_ = state;
		return state;
	}
	/**
	* @abstract
	* @param {Array<import("./Layer.js").default>} [array] Array of layers (to be
	*     modified in place).
	* @return {Array<import("./Layer.js").default>} Array of layers.
	*/
	getLayersArray(array) {
		return abstract();
	}
	/**
	* @abstract
	* @param {Array<import("./Layer.js").State>} [states] Optional list of layer
	*     states (to be modified in place).
	* @return {Array<import("./Layer.js").State>} List of layer states.
	*/
	getLayerStatesArray(states) {
		return abstract();
	}
	/**
	* Return the {@link module:ol/extent~Extent extent} of the layer or `undefined` if it
	* will be visible regardless of extent.
	* @return {import("../extent.js").Extent|undefined} The layer extent.
	* @observable
	* @api
	*/
	getExtent() {
		return this.get(Property_default$1.EXTENT);
	}
	/**
	* Return the maximum resolution of the layer. Returns Infinity if
	* the layer has no maximum resolution set.
	* @return {number} The maximum resolution of the layer.
	* @observable
	* @api
	*/
	getMaxResolution() {
		return this.get(Property_default$1.MAX_RESOLUTION);
	}
	/**
	* Return the minimum resolution of the layer. Returns 0 if
	* the layer has no minimum resolution set.
	* @return {number} The minimum resolution of the layer.
	* @observable
	* @api
	*/
	getMinResolution() {
		return this.get(Property_default$1.MIN_RESOLUTION);
	}
	/**
	* Return the minimum zoom level of the layer. Returns -Infinity if
	* the layer has no minimum zoom set.
	* @return {number} The minimum zoom level of the layer.
	* @observable
	* @api
	*/
	getMinZoom() {
		return this.get(Property_default$1.MIN_ZOOM);
	}
	/**
	* Return the maximum zoom level of the layer. Returns Infinity if
	* the layer has no maximum zoom set.
	* @return {number} The maximum zoom level of the layer.
	* @observable
	* @api
	*/
	getMaxZoom() {
		return this.get(Property_default$1.MAX_ZOOM);
	}
	/**
	* Return the opacity of the layer (between 0 and 1).
	* @return {number} The opacity of the layer.
	* @observable
	* @api
	*/
	getOpacity() {
		return this.get(Property_default$1.OPACITY);
	}
	/**
	* @abstract
	* @return {import("../source/Source.js").State} Source state.
	*/
	getSourceState() {
		return abstract();
	}
	/**
	* Return the value of this layer's `visible` property. To find out whether the layer
	* is visible on a map, use `isVisible()` instead.
	* @return {boolean} The value of the `visible` property of the layer.
	* @observable
	* @api
	*/
	getVisible() {
		return this.get(Property_default$1.VISIBLE);
	}
	/**
	* Return the Z-index of the layer, which is used to order layers before
	* rendering. Returns undefined if the layer is unmanaged.
	* @return {number|undefined} The Z-index of the layer.
	* @observable
	* @api
	*/
	getZIndex() {
		return this.get(Property_default$1.Z_INDEX);
	}
	/**
	* Sets the background color.
	* @param {BackgroundColor} [background] Background color.
	*/
	setBackground(background) {
		this.background_ = background;
		this.changed();
	}
	/**
	* Set the extent at which the layer is visible.  If `undefined`, the layer
	* will be visible at all extents.
	* @param {import("../extent.js").Extent|undefined} extent The extent of the layer.
	* @observable
	* @api
	*/
	setExtent(extent) {
		this.set(Property_default$1.EXTENT, extent);
	}
	/**
	* Set the maximum resolution at which the layer is visible.
	* @param {number} maxResolution The maximum resolution of the layer.
	* @observable
	* @api
	*/
	setMaxResolution(maxResolution) {
		this.set(Property_default$1.MAX_RESOLUTION, maxResolution);
	}
	/**
	* Set the minimum resolution at which the layer is visible.
	* @param {number} minResolution The minimum resolution of the layer.
	* @observable
	* @api
	*/
	setMinResolution(minResolution) {
		this.set(Property_default$1.MIN_RESOLUTION, minResolution);
	}
	/**
	* Set the maximum zoom (exclusive) at which the layer is visible.
	* Note that the zoom levels for layer visibility are based on the
	* view zoom level, which may be different from a tile source zoom level.
	* @param {number} maxZoom The maximum zoom of the layer.
	* @observable
	* @api
	*/
	setMaxZoom(maxZoom) {
		this.set(Property_default$1.MAX_ZOOM, maxZoom);
	}
	/**
	* Set the minimum zoom (inclusive) at which the layer is visible.
	* Note that the zoom levels for layer visibility are based on the
	* view zoom level, which may be different from a tile source zoom level.
	* @param {number} minZoom The minimum zoom of the layer.
	* @observable
	* @api
	*/
	setMinZoom(minZoom) {
		this.set(Property_default$1.MIN_ZOOM, minZoom);
	}
	/**
	* Set the opacity of the layer, allowed values range from 0 to 1.
	* @param {number} opacity The opacity of the layer.
	* @observable
	* @api
	*/
	setOpacity(opacity) {
		assert(typeof opacity === "number", "Layer opacity must be a number");
		this.set(Property_default$1.OPACITY, opacity);
	}
	/**
	* Set the visibility of the layer (`true` or `false`).
	* @param {boolean} visible The visibility of the layer.
	* @observable
	* @api
	*/
	setVisible(visible) {
		this.set(Property_default$1.VISIBLE, visible);
	}
	/**
	* Set Z-index of the layer, which is used to order layers before rendering.
	* The default Z-index is 0.
	* @param {number} zindex The z-index of the layer.
	* @observable
	* @api
	*/
	setZIndex(zindex) {
		this.set(Property_default$1.Z_INDEX, zindex);
	}
	/**
	* Clean up.
	*/
	disposeInternal() {
		if (this.state_) {
			this.state_.layer = null;
			this.state_ = null;
		}
		super.disposeInternal();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/ViewHint.js
/**
* @module ol/ViewHint
*/
/**
* @enum {number}
*/
var ViewHint_default = {
	ANIMATING: 0,
	INTERACTING: 1
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/ViewProperty.js
/**
* @module ol/ViewProperty
*/
/**
* @enum {string}
*/
var ViewProperty_default = {
	CENTER: "center",
	RESOLUTION: "resolution",
	ROTATION: "rotation"
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/centerconstraint.js
/**
* @module ol/centerconstraint
*/
/**
* @typedef {function((import("./coordinate.js").Coordinate|undefined), number, import("./size.js").Size, boolean=, Array<number>=): (import("./coordinate.js").Coordinate|undefined)} Type
*/
/**
* @param {import("./extent.js").Extent} extent Extent.
* @param {boolean} onlyCenter If true, the constraint will only apply to the view center.
* @param {boolean} smooth If true, the view will be able to go slightly out of the given extent
* (only during interaction and animation).
* @return {Type} The constraint.
*/
function createExtent(extent, onlyCenter, smooth) {
	return (
	/**
	* @param {import("./coordinate.js").Coordinate|undefined} center Center.
	* @param {number|undefined} resolution Resolution.
	* @param {import("./size.js").Size} size Viewport size; unused if `onlyCenter` was specified.
	* @param {boolean} [isMoving] True if an interaction or animation is in progress.
	* @param {Array<number>} [centerShift] Shift between map center and viewport center.
	* @return {import("./coordinate.js").Coordinate|undefined} Center.
	*/
	function(center, resolution, size, isMoving, centerShift) {
		if (!center) return;
		if (!resolution && !onlyCenter) return center;
		const viewWidth = onlyCenter ? 0 : size[0] * resolution;
		const viewHeight = onlyCenter ? 0 : size[1] * resolution;
		const shiftX = centerShift ? centerShift[0] : 0;
		const shiftY = centerShift ? centerShift[1] : 0;
		let minX = extent[0] + viewWidth / 2 + shiftX;
		let maxX = extent[2] - viewWidth / 2 + shiftX;
		let minY = extent[1] + viewHeight / 2 + shiftY;
		let maxY = extent[3] - viewHeight / 2 + shiftY;
		if (minX > maxX) {
			minX = (maxX + minX) / 2;
			maxX = minX;
		}
		if (minY > maxY) {
			minY = (maxY + minY) / 2;
			maxY = minY;
		}
		let x = clamp(center[0], minX, maxX);
		let y = clamp(center[1], minY, maxY);
		if (isMoving && smooth && resolution) {
			const ratio = 30 * resolution;
			x += -ratio * Math.log(1 + Math.max(0, minX - center[0]) / ratio) + ratio * Math.log(1 + Math.max(0, center[0] - maxX) / ratio);
			y += -ratio * Math.log(1 + Math.max(0, minY - center[1]) / ratio) + ratio * Math.log(1 + Math.max(0, center[1] - maxY) / ratio);
		}
		return [x, y];
	});
}
/**
* @param {import("./coordinate.js").Coordinate} [center] Center.
* @return {import("./coordinate.js").Coordinate|undefined} Center.
*/
function none$1(center) {
	return center;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/resolutionconstraint.js
/**
* @module ol/resolutionconstraint
*/
/**
* @typedef {function((number|undefined), number, import("./size.js").Size, boolean=): (number|undefined)} Type
*/
/**
* Returns a modified resolution taking into account the viewport size and maximum
* allowed extent.
* @param {number} resolution Resolution
* @param {import("./extent.js").Extent} maxExtent Maximum allowed extent.
* @param {import("./size.js").Size} viewportSize Viewport size.
* @param {boolean} showFullExtent Whether to show the full extent.
* @return {number} Capped resolution.
*/
function getViewportClampedResolution(resolution, maxExtent, viewportSize, showFullExtent) {
	const xResolution = getWidth(maxExtent) / viewportSize[0];
	const yResolution = getHeight(maxExtent) / viewportSize[1];
	if (showFullExtent) return Math.min(resolution, Math.max(xResolution, yResolution));
	return Math.min(resolution, Math.min(xResolution, yResolution));
}
/**
* Returns a modified resolution to be between maxResolution and minResolution while
* still allowing the value to be slightly out of bounds.
* Note: the computation is based on the logarithm function (ln):
*  - at 1, ln(x) is 0
*  - above 1, ln(x) keeps increasing but at a much slower pace than x
* The final result is clamped to prevent getting too far away from bounds.
* @param {number} resolution Resolution.
* @param {number} maxResolution Max resolution.
* @param {number} minResolution Min resolution.
* @return {number} Smoothed resolution.
*/
function getSmoothClampedResolution(resolution, maxResolution, minResolution) {
	let result = Math.min(resolution, maxResolution);
	const ratio = 50;
	result *= Math.log(1 + ratio * Math.max(0, resolution / maxResolution - 1)) / ratio + 1;
	if (minResolution) {
		result = Math.max(result, minResolution);
		result /= Math.log(1 + ratio * Math.max(0, minResolution / resolution - 1)) / ratio + 1;
	}
	return clamp(result, minResolution / 2, maxResolution * 2);
}
/**
* @param {Array<number>} resolutions Resolutions.
* @param {boolean} [smooth] If true, the view will be able to slightly exceed resolution limits. Default: true.
* @param {import("./extent.js").Extent} [maxExtent] Maximum allowed extent.
* @param {boolean} [showFullExtent] If true, allows us to show the full extent. Default: false.
* @return {Type} Zoom function.
*/
function createSnapToResolutions(resolutions, smooth, maxExtent, showFullExtent) {
	smooth = smooth !== void 0 ? smooth : true;
	return (
	/**
	* @param {number|undefined} resolution Resolution.
	* @param {number} direction Direction.
	* @param {import("./size.js").Size} size Viewport size.
	* @param {boolean} [isMoving] True if an interaction or animation is in progress.
	* @return {number|undefined} Resolution.
	*/
	function(resolution, direction, size, isMoving) {
		if (resolution !== void 0) {
			const maxResolution = resolutions[0];
			const minResolution = resolutions[resolutions.length - 1];
			const cappedMaxRes = maxExtent ? getViewportClampedResolution(maxResolution, maxExtent, size, showFullExtent) : maxResolution;
			if (isMoving) {
				if (!smooth) return clamp(resolution, minResolution, cappedMaxRes);
				return getSmoothClampedResolution(resolution, cappedMaxRes, minResolution);
			}
			const z = Math.floor(linearFindNearest(resolutions, Math.min(cappedMaxRes, resolution), direction));
			if (resolutions[z] > cappedMaxRes && z < resolutions.length - 1) return resolutions[z + 1];
			return resolutions[z];
		}
	});
}
/**
* @param {number} power Power.
* @param {number} maxResolution Maximum resolution.
* @param {number} [minResolution] Minimum resolution.
* @param {boolean} [smooth] If true, the view will be able to slightly exceed resolution limits. Default: true.
* @param {import("./extent.js").Extent} [maxExtent] Maximum allowed extent.
* @param {boolean} [showFullExtent] If true, allows us to show the full extent. Default: false.
* @return {Type} Zoom function.
*/
function createSnapToPower(power, maxResolution, minResolution, smooth, maxExtent, showFullExtent) {
	smooth = smooth !== void 0 ? smooth : true;
	minResolution = minResolution !== void 0 ? minResolution : 0;
	return (
	/**
	* @param {number|undefined} resolution Resolution.
	* @param {number} direction Direction.
	* @param {import("./size.js").Size} size Viewport size.
	* @param {boolean} [isMoving] True if an interaction or animation is in progress.
	* @return {number|undefined} Resolution.
	*/
	function(resolution, direction, size, isMoving) {
		if (resolution !== void 0) {
			const cappedMaxRes = maxExtent ? getViewportClampedResolution(maxResolution, maxExtent, size, showFullExtent) : maxResolution;
			if (isMoving) {
				if (!smooth) return clamp(resolution, minResolution, cappedMaxRes);
				return getSmoothClampedResolution(resolution, cappedMaxRes, minResolution);
			}
			const minZoomLevel = Math.ceil(Math.log(maxResolution / cappedMaxRes) / Math.log(power) - 1e-9);
			const offset = -direction * .499999999 + .5;
			const cappedZoomLevel = Math.floor(Math.log(maxResolution / Math.min(cappedMaxRes, resolution)) / Math.log(power) + offset);
			const newResolution = maxResolution / Math.pow(power, Math.max(minZoomLevel, cappedZoomLevel));
			return clamp(newResolution, minResolution, cappedMaxRes);
		}
	});
}
/**
* @param {number} maxResolution Max resolution.
* @param {number} minResolution Min resolution.
* @param {boolean} [smooth] If true, the view will be able to slightly exceed resolution limits. Default: true.
* @param {import("./extent.js").Extent} [maxExtent] Maximum allowed extent.
* @param {boolean} [showFullExtent] If true, allows us to show the full extent. Default: false.
* @return {Type} Zoom function.
*/
function createMinMaxResolution(maxResolution, minResolution, smooth, maxExtent, showFullExtent) {
	smooth = smooth !== void 0 ? smooth : true;
	return (
	/**
	* @param {number|undefined} resolution Resolution.
	* @param {number} direction Direction.
	* @param {import("./size.js").Size} size Viewport size.
	* @param {boolean} [isMoving] True if an interaction or animation is in progress.
	* @return {number|undefined} Resolution.
	*/
	function(resolution, direction, size, isMoving) {
		if (resolution !== void 0) {
			const cappedMaxRes = maxExtent ? getViewportClampedResolution(maxResolution, maxExtent, size, showFullExtent) : maxResolution;
			if (!smooth || !isMoving) return clamp(resolution, minResolution, cappedMaxRes);
			return getSmoothClampedResolution(resolution, cappedMaxRes, minResolution);
		}
	});
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/rotationconstraint.js
/**
* @module ol/rotationconstraint
*/
/**
* @typedef {function((number|undefined), boolean=): (number|undefined)} Type
*/
/**
* @param {number|undefined} rotation Rotation.
* @return {number|undefined} Rotation.
*/
function disable(rotation) {
	if (rotation !== void 0) return 0;
}
/**
* @param {number|undefined} rotation Rotation.
* @return {number|undefined} Rotation.
*/
function none(rotation) {
	if (rotation !== void 0) return rotation;
}
/**
* @param {number} n N.
* @return {Type} Rotation constraint.
*/
function createSnapToN(n) {
	const theta = 2 * Math.PI / n;
	return (
	/**
	* @param {number|undefined} rotation Rotation.
	* @param {boolean} [isMoving] True if an interaction or animation is in progress.
	* @return {number|undefined} Rotation.
	*/
	function(rotation, isMoving) {
		if (isMoving) return rotation;
		if (rotation !== void 0) {
			rotation = Math.floor(rotation / theta + .5) * theta;
			return rotation;
		}
	});
}
/**
* @param {number} [tolerance] Tolerance.
* @return {Type} Rotation constraint.
*/
function createSnapToZero(tolerance) {
	const t = tolerance === void 0 ? toRadians(5) : tolerance;
	return (
	/**
	* @param {number|undefined} rotation Rotation.
	* @param {boolean} [isMoving] True if an interaction or animation is in progress.
	* @return {number|undefined} Rotation.
	*/
	function(rotation, isMoving) {
		if (isMoving || rotation === void 0) return rotation;
		if (Math.abs(rotation) <= t) return 0;
		return rotation;
	});
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/easing.js
/**
* @module ol/easing
*/
/**
* Start slow and speed up.
* @param {number} t Input between 0 and 1.
* @return {number} Output between 0 and 1.
* @api
*/
function easeIn(t) {
	return Math.pow(t, 3);
}
/**
* Start fast and slow down.
* @param {number} t Input between 0 and 1.
* @return {number} Output between 0 and 1.
* @api
*/
function easeOut(t) {
	return 1 - easeIn(1 - t);
}
/**
* Start slow, speed up, and then slow down again.
* @param {number} t Input between 0 and 1.
* @return {number} Output between 0 and 1.
* @api
*/
function inAndOut(t) {
	return 3 * t * t - 2 * t * t * t;
}
/**
* Maintain a constant speed over time.
* @param {number} t Input between 0 and 1.
* @return {number} Output between 0 and 1.
* @api
*/
function linear(t) {
	return t;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/View.js
/**
* @module ol/View
*/
/**
* An animation configuration
*
* @typedef {Object} Animation
* @property {import("./coordinate.js").Coordinate} [sourceCenter] Source center.
* @property {import("./coordinate.js").Coordinate} [targetCenter] Target center.
* @property {number} [sourceResolution] Source resolution.
* @property {number} [targetResolution] Target resolution.
* @property {number} [sourceRotation] Source rotation.
* @property {number} [targetRotation] Target rotation.
* @property {import("./coordinate.js").Coordinate} [anchor] Anchor.
* @property {number} start Start.
* @property {number} duration Duration.
* @property {boolean} complete Complete.
* @property {function(number):number} easing Easing.
* @property {function(boolean):void} callback Callback.
*/
/**
* @typedef {Object} Constraints
* @property {import("./centerconstraint.js").Type} center Center.
* @property {import("./resolutionconstraint.js").Type} resolution Resolution.
* @property {import("./rotationconstraint.js").Type} rotation Rotation.
*/
/**
* @typedef {Object} FitOptions
* @property {import("./size.js").Size} [size] The size in pixels of the box to
* fit the extent into. Defaults to the size of the map the view is associated with.
* If no map or multiple maps are connected to the view, provide the desired box size
* (e.g. `map.getSize()`).
* @property {!Array<number>} [padding=[0, 0, 0, 0]] Padding (in pixels) to be
* cleared inside the view. Values in the array are top, right, bottom and left
* padding.
* @property {boolean} [nearest=false] If the view `constrainResolution` option is `true`,
* get the nearest extent instead of the closest that actually fits the view.
* @property {number} [minResolution=0] Minimum resolution that we zoom to.
* @property {number} [maxZoom] Maximum zoom level that we zoom to. If
* `minResolution` is given, this property is ignored.
* @property {number} [duration] The duration of the animation in milliseconds.
* By default, there is no animation to the target extent.
* @property {function(number):number} [easing] The easing function used during
* the animation (defaults to {@link module:ol/easing.inAndOut}).
* The function will be called for each frame with a number representing a
* fraction of the animation's duration.  The function should return a number
* between 0 and 1 representing the progress toward the destination state.
* @property {function(boolean):void} [callback] Function called when the view is in
* its final position. The callback will be called with `true` if the animation
* series completed on its own or `false` if it was cancelled.
*/
/**
* @typedef {Object} ViewOptions
* @property {import("./coordinate.js").Coordinate} [center] The initial center for
* the view. If a user projection is not set, the coordinate system for the center is
* specified with the `projection` option. Layer sources will not be fetched if this
* is not set, but the center can be set later with {@link #setCenter}.
* @property {boolean|number} [constrainRotation=true] Rotation constraint.
* `false` means no constraint. `true` means no constraint, but snap to zero
* near zero. A number constrains the rotation to that number of values. For
* example, `4` will constrain the rotation to 0, 90, 180, and 270 degrees.
* @property {boolean} [enableRotation=true] Enable rotation.
* If `false`, a rotation constraint that always sets the rotation to zero is
* used. The `constrainRotation` option has no effect if `enableRotation` is
* `false`.
* @property {import("./extent.js").Extent} [extent] The extent that constrains the
* view, in other words, nothing outside of this extent can be visible on the map.
* @property {boolean} [constrainOnlyCenter=false] If true, the extent
* constraint will only apply to the view center and not the whole extent.
* @property {boolean} [smoothExtentConstraint=true] If true, the extent
* constraint will be applied smoothly, i.e. allow the view to go slightly outside
* of the given `extent`.
* @property {number} [maxResolution] The maximum resolution used to determine
* the resolution constraint. It is used together with `minResolution` (or
* `maxZoom`) and `zoomFactor`. If unspecified it is calculated in such a way
* that the projection's validity extent fits in a 256x256 px tile. If the
* projection is Spherical Mercator (the default) then `maxResolution` defaults
* to `40075016.68557849 / 256 = 156543.03392804097`.
* @property {number} [minResolution] The minimum resolution used to determine
* the resolution constraint.  It is used together with `maxResolution` (or
* `minZoom`) and `zoomFactor`.  If unspecified it is calculated assuming 29
* zoom levels (with a factor of 2). If the projection is Spherical Mercator
* (the default) then `minResolution` defaults to
* `40075016.68557849 / 256 / Math.pow(2, 28) = 0.0005831682455839253`.
* @property {number} [maxZoom=28] The maximum zoom level used to determine the
* resolution constraint. It is used together with `minZoom` (or
* `maxResolution`) and `zoomFactor`.  Note that if `minResolution` is also
* provided, it is given precedence over `maxZoom`.
* @property {number} [minZoom=0] The minimum zoom level used to determine the
* resolution constraint. It is used together with `maxZoom` (or
* `minResolution`) and `zoomFactor`.  Note that if `maxResolution` is also
* provided, it is given precedence over `minZoom`.
* @property {boolean} [multiWorld=false] If `false` the view is constrained so
* only one world is visible, and you cannot pan off the edge.  If `true` the map
* may show multiple worlds at low zoom levels.  Only used if the `projection` is
* global.  Note that if `extent` is also provided it is given precedence.
* @property {boolean} [constrainResolution=false] If true, the view will always
* animate to the closest zoom level after an interaction; false means
* intermediary zoom levels are allowed.
* @property {boolean} [smoothResolutionConstraint=true] If true, the resolution
* min/max values will be applied smoothly, i. e. allow the view to exceed slightly
* the given resolution or zoom bounds.
* @property {boolean} [showFullExtent=false] Allow the view to be zoomed out to
* show the full configured extent. By default, when a view is configured with an
* extent, users will not be able to zoom out so the viewport exceeds the extent in
* either dimension. This means the full extent may not be visible if the viewport
* is taller or wider than the aspect ratio of the configured extent. If
* showFullExtent is true, the user will be able to zoom out so that the viewport
* exceeds the height or width of the configured extent, but not both, allowing the
* full extent to be shown.
* @property {import("./proj.js").ProjectionLike} [projection='EPSG:3857'] The
* projection. The default is Spherical Mercator.
* @property {number} [resolution] The initial resolution for the view. The
* units are `projection` units per pixel (e.g. meters per pixel). An
* alternative to setting this is to set `zoom`. Layer sources will not be
* fetched if neither this nor `zoom` are defined, but they can be set later
* with {@link #setZoom} or {@link #setResolution}.
* @property {Array<number>} [resolutions] Resolutions that determine the
* zoom levels if specified. The index in the array corresponds to the zoom level,
* therefore the resolution values have to be in descending order. It also constrains
* the resolution by the minimum and maximum value. If set the `maxResolution`,
* `minResolution`, `minZoom`, `maxZoom`, and `zoomFactor` options are ignored.
* @property {number} [rotation=0] The initial rotation for the view in radians
* (positive rotation clockwise, 0 means North).
* @property {number} [zoom] Only used if `resolution` is not defined. Zoom
* level used to calculate the initial resolution for the view.
* @property {number} [zoomFactor=2] The zoom factor used to compute the
* corresponding resolution.
* @property {!Array<number>} [padding=[0, 0, 0, 0]] Padding (in css pixels).
* If the map viewport is partially covered with other content (overlays) along
* its edges, this setting allows to shift the center of the viewport away from
* that content. The order of the values is top, right, bottom, left.
*/
/**
* @typedef {Object} AnimationOptions
* @property {import("./coordinate.js").Coordinate} [center] The center of the view at the end of
* the animation.
* @property {number} [zoom] The zoom level of the view at the end of the
* animation. This takes precedence over `resolution`.
* @property {number} [resolution] The resolution of the view at the end
* of the animation.  If `zoom` is also provided, this option will be ignored.
* @property {number} [rotation] The rotation of the view at the end of
* the animation.
* @property {import("./coordinate.js").Coordinate} [anchor] Optional anchor to remain fixed
* during a rotation or resolution animation.
* @property {number} [duration=1000] The duration of the animation in milliseconds.
* @property {function(number):number} [easing] The easing function used
* during the animation (defaults to {@link module:ol/easing.inAndOut}).
* The function will be called for each frame with a number representing a
* fraction of the animation's duration.  The function should return a number
* between 0 and 1 representing the progress toward the destination state.
*/
/**
* @typedef {Object} State
* @property {import("./coordinate.js").Coordinate} center Center (in view projection coordinates).
* @property {import("./proj/Projection.js").default} projection Projection.
* @property {number} resolution Resolution.
* @property {import("./coordinate.js").Coordinate} [nextCenter] The next center during an animation series.
* @property {number} [nextResolution] The next resolution during an animation series.
* @property {number} [nextRotation] The next rotation during an animation series.
* @property {number} rotation Rotation.
* @property {number} zoom Zoom.
*/
/**
* Like {@link import("./Map.js").FrameState}, but just `viewState` and `extent`.
* @typedef {Object} ViewStateLayerStateExtent
* @property {State} viewState View state.
* @property {import("./extent.js").Extent} extent Extent (in user projection coordinates).
* @property {Array<import("./layer/Layer.js").State>} [layerStatesArray] Layer states.
*/
/**
* Default min zoom level for the map view.
* @type {number}
*/
var DEFAULT_MIN_ZOOM = 0;
/**
* @typedef {import("./ObjectEventType").Types|'change:center'|'change:resolution'|'change:rotation'} ViewObjectEventTypes
*/
/***
* @template Return
* @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
*   import("./Observable").OnSignature<ViewObjectEventTypes, import("./Object").ObjectEvent, Return> &
*   import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|ViewObjectEventTypes, Return>} ViewOnSignature
*/
/**
* @classdesc
* A View object represents a simple 2D view of the map.
*
* This is the object to act upon to change the center, resolution,
* and rotation of the map.
*
* A View has a `projection`. The projection determines the
* coordinate system of the center, and its units determine the units of the
* resolution (projection units per pixel). The default projection is
* Web Mercator (EPSG:3857).
*
* ### The view states
*
* A View is determined by three states: `center`, `resolution`,
* and `rotation`. Each state has a corresponding getter and setter, e.g.
* `getCenter` and `setCenter` for the `center` state.
*
* The `zoom` state is actually not saved on the view: all computations
* internally use the `resolution` state. Still, the `setZoom` and `getZoom`
* methods are available, as well as `getResolutionForZoom` and
* `getZoomForResolution` to switch from one system to the other.
*
* ### The constraints
*
* `setCenter`, `setResolution` and `setRotation` can be used to change the
* states of the view, but any constraint defined in the constructor will
* be applied along the way.
*
* A View object can have a *resolution constraint*, a *rotation constraint*
* and a *center constraint*.
*
* The *resolution constraint* typically restricts min/max values and
* snaps to specific resolutions. It is determined by the following
* options: `resolutions`, `maxResolution`, `maxZoom` and `zoomFactor`.
* If `resolutions` is set, the other three options are ignored. See
* documentation for each option for more information. By default, the view
* only has a min/max restriction and allow intermediary zoom levels when
* pinch-zooming for example.
*
* The *rotation constraint* snaps to specific angles. It is determined
* by the following options: `enableRotation` and `constrainRotation`.
* By default rotation is allowed and its value is snapped to zero when approaching the
* horizontal.
*
* The *center constraint* is determined by the `extent` option. By
* default the view center is not constrained at all.
*
* ### Changing the view state
*
* It is important to note that `setZoom`, `setResolution`, `setCenter` and
* `setRotation` are subject to the above mentioned constraints. As such, it
* may sometimes not be possible to know in advance the resulting state of the
* View. For example, calling `setResolution(10)` does not guarantee that
* `getResolution()` will return `10`.
*
* A consequence of this is that, when applying a delta on the view state, one
* should use `adjustCenter`, `adjustRotation`, `adjustZoom` and `adjustResolution`
* rather than the corresponding setters. This will let view do its internal
* computations. Besides, the `adjust*` methods also take an `anchor`
* argument which allows specifying an origin for the transformation.
*
* ### Interacting with the view
*
* View constraints are usually only applied when the view is *at rest*, meaning that
* no interaction or animation is ongoing. As such, if the user puts the view in a
* state that is not equivalent to a constrained one (e.g. rotating the view when
* the snap angle is 0), an animation will be triggered at the interaction end to
* put back the view to a stable state;
*
* @api
*/
var View = class extends BaseObject {
	/**
	* @param {ViewOptions} [options] View options.
	*/
	constructor(options) {
		super();
		/***
		* @type {ViewOnSignature<import("./events").EventsKey>}
		*/
		this.on;
		/***
		* @type {ViewOnSignature<import("./events").EventsKey>}
		*/
		this.once;
		/***
		* @type {ViewOnSignature<void>}
		*/
		this.un;
		options = Object.assign({}, options);
		/**
		* @private
		* @type {Array<number>}
		*/
		this.hints_ = [0, 0];
		/**
		* @private
		* @type {Array<Array<Animation>>}
		*/
		this.animations_ = [];
		/**
		* @private
		* @type {number|undefined}
		*/
		this.updateAnimationKey_;
		/**
		* @private
		* @const
		* @type {import("./proj/Projection.js").default}
		*/
		this.projection_ = createProjection(options.projection, "EPSG:3857");
		/**
		* @private
		* @type {import("./size.js").Size}
		*/
		this.viewportSize_ = [100, 100];
		/**
		* @private
		* @type {import("./coordinate.js").Coordinate|undefined}
		*/
		this.targetCenter_ = null;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.targetResolution_;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.targetRotation_;
		/**
		* @private
		* @type {import("./coordinate.js").Coordinate}
		*/
		this.nextCenter_ = null;
		/**
		* @private
		* @type {number}
		*/
		this.nextResolution_;
		/**
		* @private
		* @type {number}
		*/
		this.nextRotation_;
		/**
		* @private
		* @type {import("./coordinate.js").Coordinate|undefined}
		*/
		this.cancelAnchor_ = void 0;
		if (options.projection) disableCoordinateWarning();
		if (options.center) options.center = fromUserCoordinate(options.center, this.projection_);
		if (options.extent) options.extent = fromUserExtent(options.extent, this.projection_);
		this.applyOptions_(options);
	}
	/**
	* Set up the view with the given options.
	* @param {ViewOptions} options View options.
	*/
	applyOptions_(options) {
		const properties = Object.assign({}, options);
		for (const key in ViewProperty_default) delete properties[key];
		this.setProperties(properties, true);
		const resolutionConstraintInfo = createResolutionConstraint(options);
		/**
		* @private
		* @type {number}
		*/
		this.maxResolution_ = resolutionConstraintInfo.maxResolution;
		/**
		* @private
		* @type {number}
		*/
		this.minResolution_ = resolutionConstraintInfo.minResolution;
		/**
		* @private
		* @type {number}
		*/
		this.zoomFactor_ = resolutionConstraintInfo.zoomFactor;
		/**
		* @private
		* @type {Array<number>|undefined}
		*/
		this.resolutions_ = options.resolutions;
		/**
		* @type {Array<number>|undefined}
		* @private
		*/
		this.padding_ = options.padding;
		/**
		* @private
		* @type {number}
		*/
		this.minZoom_ = resolutionConstraintInfo.minZoom;
		const centerConstraint = createCenterConstraint(options);
		const resolutionConstraint = resolutionConstraintInfo.constraint;
		const rotationConstraint = createRotationConstraint(options);
		/**
		* @private
		* @type {Constraints}
		*/
		this.constraints_ = {
			center: centerConstraint,
			resolution: resolutionConstraint,
			rotation: rotationConstraint
		};
		this.setRotation(options.rotation !== void 0 ? options.rotation : 0);
		this.setCenterInternal(options.center !== void 0 ? options.center : null);
		if (options.resolution !== void 0) this.setResolution(options.resolution);
		else if (options.zoom !== void 0) this.setZoom(options.zoom);
	}
	/**
	* Padding (in css pixels).
	* If the map viewport is partially covered with other content (overlays) along
	* its edges, this setting allows to shift the center of the viewport away from that
	* content. The order of the values in the array is top, right, bottom, left.
	* The default is no padding, which is equivalent to `[0, 0, 0, 0]`.
	* @type {Array<number>|undefined}
	* @api
	*/
	get padding() {
		return this.padding_;
	}
	set padding(padding) {
		let oldPadding = this.padding_;
		this.padding_ = padding;
		const center = this.getCenterInternal();
		if (center) {
			const newPadding = padding || [
				0,
				0,
				0,
				0
			];
			oldPadding = oldPadding || [
				0,
				0,
				0,
				0
			];
			const resolution = this.getResolution();
			const offsetX = resolution / 2 * (newPadding[3] - oldPadding[3] + oldPadding[1] - newPadding[1]);
			const offsetY = resolution / 2 * (newPadding[0] - oldPadding[0] + oldPadding[2] - newPadding[2]);
			this.setCenterInternal([center[0] + offsetX, center[1] - offsetY]);
		}
	}
	/**
	* Get an updated version of the view options used to construct the view.  The
	* current resolution (or zoom), center, and rotation are applied to any stored
	* options.  The provided options can be used to apply new min/max zoom or
	* resolution limits.
	* @param {ViewOptions} newOptions New options to be applied.
	* @return {ViewOptions} New options updated with the current view state.
	*/
	getUpdatedOptions_(newOptions) {
		const options = this.getProperties();
		if (options.resolution !== void 0) options.resolution = this.getResolution();
		else options.zoom = this.getZoom();
		options.center = this.getCenterInternal();
		options.rotation = this.getRotation();
		return Object.assign({}, options, newOptions);
	}
	/**
	* Animate the view.  The view's center, zoom (or resolution), and rotation
	* can be animated for smooth transitions between view states.  For example,
	* to animate the view to a new zoom level:
	*
	*     view.animate({zoom: view.getZoom() + 1});
	*
	* By default, the animation lasts one second and uses in-and-out easing.  You
	* can customize this behavior by including `duration` (in milliseconds) and
	* `easing` options (see {@link module:ol/easing}).
	*
	* To chain together multiple animations, call the method with multiple
	* animation objects.  For example, to first zoom and then pan:
	*
	*     view.animate({zoom: 10}, {center: [0, 0]});
	*
	* If you provide a function as the last argument to the animate method, it
	* will get called at the end of an animation series.  The callback will be
	* called with `true` if the animation series completed on its own or `false`
	* if it was cancelled.
	*
	* Animations are cancelled by user interactions (e.g. dragging the map) or by
	* calling `view.setCenter()`, `view.setResolution()`, or `view.setRotation()`
	* (or another method that calls one of these).
	*
	* @param {...(AnimationOptions|function(boolean): void)} var_args Animation
	*     options.  Multiple animations can be run in series by passing multiple
	*     options objects.  To run multiple animations in parallel, call the method
	*     multiple times.  An optional callback can be provided as a final
	*     argument.  The callback will be called with a boolean indicating whether
	*     the animation completed without being cancelled.
	* @api
	*/
	animate(var_args) {
		if (this.isDef() && !this.getAnimating()) this.resolveConstraints(0);
		const args = new Array(arguments.length);
		for (let i = 0; i < args.length; ++i) {
			let options = arguments[i];
			if (options.center) {
				options = Object.assign({}, options);
				options.center = fromUserCoordinate(options.center, this.getProjection());
			}
			if (options.anchor) {
				options = Object.assign({}, options);
				options.anchor = fromUserCoordinate(options.anchor, this.getProjection());
			}
			args[i] = options;
		}
		this.animateInternal.apply(this, args);
	}
	/**
	* @param {...(AnimationOptions|function(boolean): void)} var_args Animation options.
	*/
	animateInternal(var_args) {
		let animationCount = arguments.length;
		let callback;
		if (animationCount > 1 && typeof arguments[animationCount - 1] === "function") {
			callback = arguments[animationCount - 1];
			--animationCount;
		}
		let i = 0;
		for (; i < animationCount && !this.isDef(); ++i) {
			const state = arguments[i];
			if (state.center) this.setCenterInternal(state.center);
			if (state.zoom !== void 0) this.setZoom(state.zoom);
			else if (state.resolution) this.setResolution(state.resolution);
			if (state.rotation !== void 0) this.setRotation(state.rotation);
		}
		if (i === animationCount) {
			if (callback) animationCallback(callback, true);
			return;
		}
		let start = Date.now();
		let center = this.targetCenter_.slice();
		let resolution = this.targetResolution_;
		let rotation = this.targetRotation_;
		const series = [];
		for (; i < animationCount; ++i) {
			const options = arguments[i];
			const animation = {
				start,
				complete: false,
				anchor: options.anchor,
				duration: options.duration !== void 0 ? options.duration : 1e3,
				easing: options.easing || inAndOut,
				callback
			};
			if (options.center) {
				animation.sourceCenter = center;
				animation.targetCenter = options.center.slice();
				center = animation.targetCenter;
			}
			if (options.zoom !== void 0) {
				animation.sourceResolution = resolution;
				animation.targetResolution = this.getResolutionForZoom(options.zoom);
				resolution = animation.targetResolution;
			} else if (options.resolution) {
				animation.sourceResolution = resolution;
				animation.targetResolution = options.resolution;
				resolution = animation.targetResolution;
			}
			if (options.rotation !== void 0) {
				animation.sourceRotation = rotation;
				const delta = modulo(options.rotation - rotation + Math.PI, 2 * Math.PI) - Math.PI;
				animation.targetRotation = rotation + delta;
				rotation = animation.targetRotation;
			}
			if (isNoopAnimation(animation)) animation.complete = true;
			else start += animation.duration;
			series.push(animation);
		}
		this.animations_.push(series);
		this.setHint(ViewHint_default.ANIMATING, 1);
		this.updateAnimations_();
	}
	/**
	* Determine if the view is being animated.
	* @return {boolean} The view is being animated.
	* @api
	*/
	getAnimating() {
		return this.hints_[ViewHint_default.ANIMATING] > 0;
	}
	/**
	* Determine if the user is interacting with the view, such as panning or zooming.
	* @return {boolean} The view is being interacted with.
	* @api
	*/
	getInteracting() {
		return this.hints_[ViewHint_default.INTERACTING] > 0;
	}
	/**
	* Cancel any ongoing animations.
	* @api
	*/
	cancelAnimations() {
		this.setHint(ViewHint_default.ANIMATING, -this.hints_[ViewHint_default.ANIMATING]);
		let anchor;
		for (let i = 0, ii = this.animations_.length; i < ii; ++i) {
			const series = this.animations_[i];
			if (series[0].callback) animationCallback(series[0].callback, false);
			if (!anchor) for (let j = 0, jj = series.length; j < jj; ++j) {
				const animation = series[j];
				if (!animation.complete) {
					anchor = animation.anchor;
					break;
				}
			}
		}
		this.animations_.length = 0;
		this.cancelAnchor_ = anchor;
		this.nextCenter_ = null;
		this.nextResolution_ = NaN;
		this.nextRotation_ = NaN;
	}
	/**
	* Update all animations.
	*/
	updateAnimations_() {
		if (this.updateAnimationKey_ !== void 0) {
			cancelAnimationFrame(this.updateAnimationKey_);
			this.updateAnimationKey_ = void 0;
		}
		if (!this.getAnimating()) return;
		const now = Date.now();
		let more = false;
		for (let i = this.animations_.length - 1; i >= 0; --i) {
			const series = this.animations_[i];
			let seriesComplete = true;
			for (let j = 0, jj = series.length; j < jj; ++j) {
				const animation = series[j];
				if (animation.complete) continue;
				const elapsed = now - animation.start;
				let fraction = animation.duration > 0 ? elapsed / animation.duration : 1;
				if (fraction >= 1) {
					animation.complete = true;
					fraction = 1;
				} else seriesComplete = false;
				const progress = animation.easing(fraction);
				if (animation.sourceCenter) {
					const x0 = animation.sourceCenter[0];
					const y0 = animation.sourceCenter[1];
					const x1 = animation.targetCenter[0];
					const y1 = animation.targetCenter[1];
					this.nextCenter_ = animation.targetCenter;
					const x = x0 + progress * (x1 - x0);
					const y = y0 + progress * (y1 - y0);
					this.targetCenter_ = [x, y];
				}
				if (animation.sourceResolution && animation.targetResolution) {
					const resolution = progress === 1 ? animation.targetResolution : animation.sourceResolution + progress * (animation.targetResolution - animation.sourceResolution);
					if (animation.anchor) {
						const size = this.getViewportSize_(this.getRotation());
						const constrainedResolution = this.constraints_.resolution(resolution, 0, size, true);
						this.targetCenter_ = this.calculateCenterZoom(constrainedResolution, animation.anchor);
					}
					this.nextResolution_ = animation.targetResolution;
					this.targetResolution_ = resolution;
					this.applyTargetState_(true);
				}
				if (animation.sourceRotation !== void 0 && animation.targetRotation !== void 0) {
					const rotation = progress === 1 ? modulo(animation.targetRotation + Math.PI, 2 * Math.PI) - Math.PI : animation.sourceRotation + progress * (animation.targetRotation - animation.sourceRotation);
					if (animation.anchor) {
						const constrainedRotation = this.constraints_.rotation(rotation, true);
						this.targetCenter_ = this.calculateCenterRotate(constrainedRotation, animation.anchor);
					}
					this.nextRotation_ = animation.targetRotation;
					this.targetRotation_ = rotation;
				}
				this.applyTargetState_(true);
				more = true;
				if (!animation.complete) break;
			}
			if (seriesComplete) {
				this.animations_[i] = null;
				this.setHint(ViewHint_default.ANIMATING, -1);
				this.nextCenter_ = null;
				this.nextResolution_ = NaN;
				this.nextRotation_ = NaN;
				const callback = series[0].callback;
				if (callback) animationCallback(callback, true);
			}
		}
		this.animations_ = this.animations_.filter(Boolean);
		if (more && this.updateAnimationKey_ === void 0) this.updateAnimationKey_ = requestAnimationFrame(this.updateAnimations_.bind(this));
	}
	/**
	* @param {number} rotation Target rotation.
	* @param {import("./coordinate.js").Coordinate} anchor Rotation anchor.
	* @return {import("./coordinate.js").Coordinate|undefined} Center for rotation and anchor.
	*/
	calculateCenterRotate(rotation, anchor) {
		let center;
		const currentCenter = this.getCenterInternal();
		if (currentCenter !== void 0) {
			center = [currentCenter[0] - anchor[0], currentCenter[1] - anchor[1]];
			rotate$1(center, rotation - this.getRotation());
			add(center, anchor);
		}
		return center;
	}
	/**
	* @param {number} resolution Target resolution.
	* @param {import("./coordinate.js").Coordinate} anchor Zoom anchor.
	* @return {import("./coordinate.js").Coordinate|undefined} Center for resolution and anchor.
	*/
	calculateCenterZoom(resolution, anchor) {
		let center;
		const currentCenter = this.getCenterInternal();
		const currentResolution = this.getResolution();
		if (currentCenter !== void 0 && currentResolution !== void 0) center = [anchor[0] - resolution * (anchor[0] - currentCenter[0]) / currentResolution, anchor[1] - resolution * (anchor[1] - currentCenter[1]) / currentResolution];
		return center;
	}
	/**
	* Returns the current viewport size.
	* @private
	* @param {number} [rotation] Take into account the rotation of the viewport when giving the size
	* @return {import("./size.js").Size} Viewport size or `[100, 100]` when no viewport is found.
	*/
	getViewportSize_(rotation) {
		const size = this.viewportSize_;
		if (rotation) {
			const w = size[0];
			const h = size[1];
			return [Math.abs(w * Math.cos(rotation)) + Math.abs(h * Math.sin(rotation)), Math.abs(w * Math.sin(rotation)) + Math.abs(h * Math.cos(rotation))];
		}
		return size;
	}
	/**
	* Stores the viewport size on the view. The viewport size is not read every time from the DOM
	* to avoid performance hit and layout reflow.
	* This should be done on map size change.
	* Note: the constraints are not resolved during an animation to avoid stopping it
	* @param {import("./size.js").Size} [size] Viewport size; if undefined, [100, 100] is assumed
	*/
	setViewportSize(size) {
		this.viewportSize_ = Array.isArray(size) ? size.slice() : [100, 100];
		if (!this.getAnimating()) this.resolveConstraints(0);
	}
	/**
	* Get the view center.
	* @return {import("./coordinate.js").Coordinate|undefined} The center of the view.
	* @observable
	* @api
	*/
	getCenter() {
		const center = this.getCenterInternal();
		if (!center) return center;
		return toUserCoordinate(center, this.getProjection());
	}
	/**
	* Get the view center without transforming to user projection.
	* @return {import("./coordinate.js").Coordinate|undefined} The center of the view.
	*/
	getCenterInternal() {
		return this.get(ViewProperty_default.CENTER);
	}
	/**
	* @return {Constraints} Constraints.
	*/
	getConstraints() {
		return this.constraints_;
	}
	/**
	* @return {boolean} Resolution constraint is set
	*/
	getConstrainResolution() {
		return this.get("constrainResolution");
	}
	/**
	* @param {Array<number>} [hints] Destination array.
	* @return {Array<number>} Hint.
	*/
	getHints(hints) {
		if (hints !== void 0) {
			hints[0] = this.hints_[0];
			hints[1] = this.hints_[1];
			return hints;
		}
		return this.hints_.slice();
	}
	/**
	* Calculate the extent for the current view state and the passed box size.
	* @param {import("./size.js").Size} [size] The pixel dimensions of the box
	* into which the calculated extent should fit. Defaults to the size of the
	* map the view is associated with.
	* If no map or multiple maps are connected to the view, provide the desired
	* box size (e.g. `map.getSize()`).
	* @return {import("./extent.js").Extent} Extent.
	* @api
	*/
	calculateExtent(size) {
		const extent = this.calculateExtentInternal(size);
		return toUserExtent(extent, this.getProjection());
	}
	/**
	* @param {import("./size.js").Size} [size] Box pixel size. If not provided,
	* the map's last known viewport size will be used.
	* @return {import("./extent.js").Extent} Extent.
	*/
	calculateExtentInternal(size) {
		size = size || this.getViewportSizeMinusPadding_();
		const center = this.getCenterInternal();
		assert(center, "The view center is not defined");
		const resolution = this.getResolution();
		assert(resolution !== void 0, "The view resolution is not defined");
		const rotation = this.getRotation();
		assert(rotation !== void 0, "The view rotation is not defined");
		return getForViewAndSize(center, resolution, rotation, size);
	}
	/**
	* Get the maximum resolution of the view.
	* @return {number} The maximum resolution of the view.
	* @api
	*/
	getMaxResolution() {
		return this.maxResolution_;
	}
	/**
	* Get the minimum resolution of the view.
	* @return {number} The minimum resolution of the view.
	* @api
	*/
	getMinResolution() {
		return this.minResolution_;
	}
	/**
	* Get the maximum zoom level for the view.
	* @return {number} The maximum zoom level.
	* @api
	*/
	getMaxZoom() {
		return this.getZoomForResolution(this.minResolution_);
	}
	/**
	* Set a new maximum zoom level for the view.
	* @param {number} zoom The maximum zoom level.
	* @api
	*/
	setMaxZoom(zoom) {
		this.applyOptions_(this.getUpdatedOptions_({ maxZoom: zoom }));
	}
	/**
	* Get the minimum zoom level for the view.
	* @return {number} The minimum zoom level.
	* @api
	*/
	getMinZoom() {
		return this.getZoomForResolution(this.maxResolution_);
	}
	/**
	* Set a new minimum zoom level for the view.
	* @param {number} zoom The minimum zoom level.
	* @api
	*/
	setMinZoom(zoom) {
		this.applyOptions_(this.getUpdatedOptions_({ minZoom: zoom }));
	}
	/**
	* Set whether the view should allow intermediary zoom levels.
	* @param {boolean} enabled Whether the resolution is constrained.
	* @api
	*/
	setConstrainResolution(enabled) {
		this.applyOptions_(this.getUpdatedOptions_({ constrainResolution: enabled }));
	}
	/**
	* Get the view projection.
	* @return {import("./proj/Projection.js").default} The projection of the view.
	* @api
	*/
	getProjection() {
		return this.projection_;
	}
	/**
	* Get the view resolution.
	* @return {number|undefined} The resolution of the view.
	* @observable
	* @api
	*/
	getResolution() {
		return this.get(ViewProperty_default.RESOLUTION);
	}
	/**
	* Get the resolutions for the view. This returns the array of resolutions
	* passed to the constructor of the View, or undefined if none were given.
	* @return {Array<number>|undefined} The resolutions of the view.
	* @api
	*/
	getResolutions() {
		return this.resolutions_;
	}
	/**
	* Get the resolution for a provided extent (in map units) and size (in pixels).
	* @param {import("./extent.js").Extent} extent Extent.
	* @param {import("./size.js").Size} [size] Box pixel size.
	* @return {number} The resolution at which the provided extent will render at
	*     the given size.
	* @api
	*/
	getResolutionForExtent(extent, size) {
		return this.getResolutionForExtentInternal(fromUserExtent(extent, this.getProjection()), size);
	}
	/**
	* Get the resolution for a provided extent (in map units) and size (in pixels).
	* @param {import("./extent.js").Extent} extent Extent.
	* @param {import("./size.js").Size} [size] Box pixel size.
	* @return {number} The resolution at which the provided extent will render at
	*     the given size.
	*/
	getResolutionForExtentInternal(extent, size) {
		size = size || this.getViewportSizeMinusPadding_();
		const xResolution = getWidth(extent) / size[0];
		const yResolution = getHeight(extent) / size[1];
		return Math.max(xResolution, yResolution);
	}
	/**
	* Return a function that returns a value between 0 and 1 for a
	* resolution. Exponential scaling is assumed.
	* @param {number} [power] Power.
	* @return {function(number): number} Resolution for value function.
	*/
	getResolutionForValueFunction(power) {
		power = power || 2;
		const maxResolution = this.getConstrainedResolution(this.maxResolution_);
		const minResolution = this.minResolution_;
		const max = Math.log(maxResolution / minResolution) / Math.log(power);
		return (
		/**
		* @param {number} value Value.
		* @return {number} Resolution.
		*/
		function(value) {
			return maxResolution / Math.pow(power, value * max);
		});
	}
	/**
	* Get the view rotation.
	* @return {number} The rotation of the view in radians.
	* @observable
	* @api
	*/
	getRotation() {
		return this.get(ViewProperty_default.ROTATION);
	}
	/**
	* Return a function that returns a resolution for a value between
	* 0 and 1. Exponential scaling is assumed.
	* @param {number} [power] Power.
	* @return {function(number): number} Value for resolution function.
	*/
	getValueForResolutionFunction(power) {
		const logPower = Math.log(power || 2);
		const maxResolution = this.getConstrainedResolution(this.maxResolution_);
		const minResolution = this.minResolution_;
		const max = Math.log(maxResolution / minResolution) / logPower;
		return (
		/**
		* @param {number} resolution Resolution.
		* @return {number} Value.
		*/
		function(resolution) {
			return Math.log(maxResolution / resolution) / logPower / max;
		});
	}
	/**
	* Returns the size of the viewport minus padding.
	* @private
	* @param {number} [rotation] Take into account the rotation of the viewport when giving the size
	* @return {import("./size.js").Size} Viewport size reduced by the padding.
	*/
	getViewportSizeMinusPadding_(rotation) {
		let size = this.getViewportSize_(rotation);
		const padding = this.padding_;
		if (padding) size = [size[0] - padding[1] - padding[3], size[1] - padding[0] - padding[2]];
		return size;
	}
	/**
	* @return {State} View state.
	*/
	getState() {
		const projection = this.getProjection();
		const resolution = this.getResolution();
		const rotation = this.getRotation();
		let center = this.getCenterInternal();
		const padding = this.padding_;
		if (padding) {
			const reducedSize = this.getViewportSizeMinusPadding_();
			center = calculateCenterOn(center, this.getViewportSize_(), [reducedSize[0] / 2 + padding[3], reducedSize[1] / 2 + padding[0]], resolution, rotation);
		}
		return {
			center: center.slice(0),
			projection: projection !== void 0 ? projection : null,
			resolution,
			nextCenter: this.nextCenter_,
			nextResolution: this.nextResolution_,
			nextRotation: this.nextRotation_,
			rotation,
			zoom: this.getZoom()
		};
	}
	/**
	* @return {ViewStateLayerStateExtent} Like `FrameState`, but just `viewState` and `extent`.
	*/
	getViewStateAndExtent() {
		return {
			viewState: this.getState(),
			extent: this.calculateExtent()
		};
	}
	/**
	* Get the current zoom level. This method may return non-integer zoom levels
	* if the view does not constrain the resolution, or if an interaction or
	* animation is underway.
	* @return {number|undefined} Zoom.
	* @api
	*/
	getZoom() {
		let zoom;
		const resolution = this.getResolution();
		if (resolution !== void 0) zoom = this.getZoomForResolution(resolution);
		return zoom;
	}
	/**
	* Get the zoom level for a resolution.
	* @param {number} resolution The resolution.
	* @return {number|undefined} The zoom level for the provided resolution.
	* @api
	*/
	getZoomForResolution(resolution) {
		let offset = this.minZoom_ || 0;
		let max, zoomFactor;
		if (this.resolutions_) {
			const nearest = linearFindNearest(this.resolutions_, resolution, 1);
			offset = nearest;
			max = this.resolutions_[nearest];
			if (nearest == this.resolutions_.length - 1) zoomFactor = 2;
			else zoomFactor = max / this.resolutions_[nearest + 1];
		} else {
			max = this.maxResolution_;
			zoomFactor = this.zoomFactor_;
		}
		return offset + Math.log(max / resolution) / Math.log(zoomFactor);
	}
	/**
	* Get the resolution for a zoom level.
	* @param {number} zoom Zoom level.
	* @return {number} The view resolution for the provided zoom level.
	* @api
	*/
	getResolutionForZoom(zoom) {
		if (this.resolutions_) {
			if (this.resolutions_.length <= 1) return 0;
			const baseLevel = clamp(Math.floor(zoom), 0, this.resolutions_.length - 2);
			const zoomFactor = this.resolutions_[baseLevel] / this.resolutions_[baseLevel + 1];
			return this.resolutions_[baseLevel] / Math.pow(zoomFactor, clamp(zoom - baseLevel, 0, 1));
		}
		return this.maxResolution_ / Math.pow(this.zoomFactor_, zoom - this.minZoom_);
	}
	/**
	* Fit the given geometry or extent based on the given map size and border.
	* The size is pixel dimensions of the box to fit the extent into.
	* In most cases you will want to use the map size, that is `map.getSize()`.
	* Takes care of the map angle.
	* @param {import("./geom/SimpleGeometry.js").default|import("./extent.js").Extent} geometryOrExtent The geometry or
	*     extent to fit the view to.
	* @param {FitOptions} [options] Options.
	* @api
	*/
	fit(geometryOrExtent, options) {
		/** @type {import("./geom/SimpleGeometry.js").default} */
		let geometry;
		assert(Array.isArray(geometryOrExtent) || typeof geometryOrExtent.getSimplifiedGeometry === "function", "Invalid extent or geometry provided as `geometry`");
		if (Array.isArray(geometryOrExtent)) {
			assert(!isEmpty$1(geometryOrExtent), "Cannot fit empty extent provided as `geometry`");
			geometry = fromExtent(fromUserExtent(geometryOrExtent, this.getProjection()));
		} else if (geometryOrExtent.getType() === "Circle") {
			const extent = fromUserExtent(geometryOrExtent.getExtent(), this.getProjection());
			geometry = fromExtent(extent);
			geometry.rotate(this.getRotation(), getCenter(extent));
		} else {
			const userProjection = getUserProjection();
			if (userProjection) geometry = geometryOrExtent.clone().transform(userProjection, this.getProjection());
			else geometry = geometryOrExtent;
		}
		this.fitInternal(geometry, options);
	}
	/**
	* Calculate rotated extent
	* @param {import("./geom/SimpleGeometry.js").default} geometry The geometry.
	* @return {import("./extent").Extent} The rotated extent for the geometry.
	*/
	rotatedExtentForGeometry(geometry) {
		const rotation = this.getRotation();
		const cosAngle = Math.cos(rotation);
		const sinAngle = Math.sin(-rotation);
		const coords = geometry.getFlatCoordinates();
		const stride = geometry.getStride();
		let minRotX = Infinity;
		let minRotY = Infinity;
		let maxRotX = -Infinity;
		let maxRotY = -Infinity;
		for (let i = 0, ii = coords.length; i < ii; i += stride) {
			const rotX = coords[i] * cosAngle - coords[i + 1] * sinAngle;
			const rotY = coords[i] * sinAngle + coords[i + 1] * cosAngle;
			minRotX = Math.min(minRotX, rotX);
			minRotY = Math.min(minRotY, rotY);
			maxRotX = Math.max(maxRotX, rotX);
			maxRotY = Math.max(maxRotY, rotY);
		}
		return [
			minRotX,
			minRotY,
			maxRotX,
			maxRotY
		];
	}
	/**
	* @param {import("./geom/SimpleGeometry.js").default} geometry The geometry.
	* @param {FitOptions} [options] Options.
	*/
	fitInternal(geometry, options) {
		options = options || {};
		let size = options.size;
		if (!size) size = this.getViewportSizeMinusPadding_();
		const padding = options.padding !== void 0 ? options.padding : [
			0,
			0,
			0,
			0
		];
		const nearest = options.nearest !== void 0 ? options.nearest : false;
		let minResolution;
		if (options.minResolution !== void 0) minResolution = options.minResolution;
		else if (options.maxZoom !== void 0) minResolution = this.getResolutionForZoom(options.maxZoom);
		else minResolution = 0;
		const rotatedExtent = this.rotatedExtentForGeometry(geometry);
		let resolution = this.getResolutionForExtentInternal(rotatedExtent, [size[0] - padding[1] - padding[3], size[1] - padding[0] - padding[2]]);
		resolution = isNaN(resolution) ? minResolution : Math.max(resolution, minResolution);
		resolution = this.getConstrainedResolution(resolution, nearest ? 0 : 1);
		const rotation = this.getRotation();
		const sinAngle = Math.sin(rotation);
		const cosAngle = Math.cos(rotation);
		const centerRot = getCenter(rotatedExtent);
		centerRot[0] += (padding[1] - padding[3]) / 2 * resolution;
		centerRot[1] += (padding[0] - padding[2]) / 2 * resolution;
		const centerX = centerRot[0] * cosAngle - centerRot[1] * sinAngle;
		const centerY = centerRot[1] * cosAngle + centerRot[0] * sinAngle;
		const center = this.getConstrainedCenter([centerX, centerY], resolution);
		const callback = options.callback ? options.callback : VOID;
		if (options.duration !== void 0) this.animateInternal({
			resolution,
			center,
			duration: options.duration,
			easing: options.easing
		}, callback);
		else {
			this.targetResolution_ = resolution;
			this.targetCenter_ = center;
			this.applyTargetState_(false, true);
			animationCallback(callback, true);
		}
	}
	/**
	* Center on coordinate and view position.
	* @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
	* @param {import("./size.js").Size} size Box pixel size.
	* @param {import("./pixel.js").Pixel} position Position on the view to center on.
	* @api
	*/
	centerOn(coordinate, size, position) {
		this.centerOnInternal(fromUserCoordinate(coordinate, this.getProjection()), size, position);
	}
	/**
	* @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
	* @param {import("./size.js").Size} size Box pixel size.
	* @param {import("./pixel.js").Pixel} position Position on the view to center on.
	*/
	centerOnInternal(coordinate, size, position) {
		this.setCenterInternal(calculateCenterOn(coordinate, size, position, this.getResolution(), this.getRotation()));
	}
	/**
	* Calculates the shift between map and viewport center.
	* @param {import("./coordinate.js").Coordinate} center Center.
	* @param {number} resolution Resolution.
	* @param {number} rotation Rotation.
	* @param {import("./size.js").Size} size Size.
	* @return {Array<number>|undefined} Center shift.
	*/
	calculateCenterShift(center, resolution, rotation, size) {
		let centerShift;
		const padding = this.padding_;
		if (padding && center) {
			const reducedSize = this.getViewportSizeMinusPadding_(-rotation);
			const shiftedCenter = calculateCenterOn(center, size, [reducedSize[0] / 2 + padding[3], reducedSize[1] / 2 + padding[0]], resolution, rotation);
			centerShift = [center[0] - shiftedCenter[0], center[1] - shiftedCenter[1]];
		}
		return centerShift;
	}
	/**
	* @return {boolean} Is defined.
	*/
	isDef() {
		return !!this.getCenterInternal() && this.getResolution() !== void 0;
	}
	/**
	* Adds relative coordinates to the center of the view. Any extent constraint will apply.
	* @param {import("./coordinate.js").Coordinate} deltaCoordinates Relative value to add.
	* @api
	*/
	adjustCenter(deltaCoordinates) {
		const center = toUserCoordinate(this.targetCenter_, this.getProjection());
		this.setCenter([center[0] + deltaCoordinates[0], center[1] + deltaCoordinates[1]]);
	}
	/**
	* Adds relative coordinates to the center of the view. Any extent constraint will apply.
	* @param {import("./coordinate.js").Coordinate} deltaCoordinates Relative value to add.
	*/
	adjustCenterInternal(deltaCoordinates) {
		const center = this.targetCenter_;
		this.setCenterInternal([center[0] + deltaCoordinates[0], center[1] + deltaCoordinates[1]]);
	}
	/**
	* Multiply the view resolution by a ratio, optionally using an anchor. Any resolution
	* constraint will apply.
	* @param {number} ratio The ratio to apply on the view resolution.
	* @param {import("./coordinate.js").Coordinate} [anchor] The origin of the transformation.
	* @api
	*/
	adjustResolution(ratio, anchor) {
		anchor = anchor && fromUserCoordinate(anchor, this.getProjection());
		this.adjustResolutionInternal(ratio, anchor);
	}
	/**
	* Multiply the view resolution by a ratio, optionally using an anchor. Any resolution
	* constraint will apply.
	* @param {number} ratio The ratio to apply on the view resolution.
	* @param {import("./coordinate.js").Coordinate} [anchor] The origin of the transformation.
	*/
	adjustResolutionInternal(ratio, anchor) {
		const isMoving = this.getAnimating() || this.getInteracting();
		const size = this.getViewportSize_(this.getRotation());
		const newResolution = this.constraints_.resolution(this.targetResolution_ * ratio, 0, size, isMoving);
		if (anchor) this.targetCenter_ = this.calculateCenterZoom(newResolution, anchor);
		this.targetResolution_ *= ratio;
		this.applyTargetState_();
	}
	/**
	* Adds a value to the view zoom level, optionally using an anchor. Any resolution
	* constraint will apply.
	* @param {number} delta Relative value to add to the zoom level.
	* @param {import("./coordinate.js").Coordinate} [anchor] The origin of the transformation.
	* @api
	*/
	adjustZoom(delta, anchor) {
		this.adjustResolution(Math.pow(this.zoomFactor_, -delta), anchor);
	}
	/**
	* Adds a value to the view rotation, optionally using an anchor. Any rotation
	* constraint will apply.
	* @param {number} delta Relative value to add to the zoom rotation, in radians.
	* @param {import("./coordinate.js").Coordinate} [anchor] The rotation center.
	* @api
	*/
	adjustRotation(delta, anchor) {
		if (anchor) anchor = fromUserCoordinate(anchor, this.getProjection());
		this.adjustRotationInternal(delta, anchor);
	}
	/**
	* @param {number} delta Relative value to add to the zoom rotation, in radians.
	* @param {import("./coordinate.js").Coordinate} [anchor] The rotation center.
	*/
	adjustRotationInternal(delta, anchor) {
		const isMoving = this.getAnimating() || this.getInteracting();
		const newRotation = this.constraints_.rotation(this.targetRotation_ + delta, isMoving);
		if (anchor) this.targetCenter_ = this.calculateCenterRotate(newRotation, anchor);
		this.targetRotation_ += delta;
		this.applyTargetState_();
	}
	/**
	* Set the center of the current view. Any extent constraint will apply.
	* @param {import("./coordinate.js").Coordinate|undefined} center The center of the view.
	* @observable
	* @api
	*/
	setCenter(center) {
		this.setCenterInternal(center ? fromUserCoordinate(center, this.getProjection()) : center);
	}
	/**
	* Set the center using the view projection (not the user projection).
	* @param {import("./coordinate.js").Coordinate|undefined} center The center of the view.
	*/
	setCenterInternal(center) {
		this.targetCenter_ = center;
		this.applyTargetState_();
	}
	/**
	* @param {import("./ViewHint.js").default} hint Hint.
	* @param {number} delta Delta.
	* @return {number} New value.
	*/
	setHint(hint, delta) {
		this.hints_[hint] += delta;
		this.changed();
		return this.hints_[hint];
	}
	/**
	* Set the resolution for this view. Any resolution constraint will apply.
	* @param {number|undefined} resolution The resolution of the view.
	* @observable
	* @api
	*/
	setResolution(resolution) {
		this.targetResolution_ = resolution;
		this.applyTargetState_();
	}
	/**
	* Set the rotation for this view. Any rotation constraint will apply.
	* @param {number} rotation The rotation of the view in radians.
	* @observable
	* @api
	*/
	setRotation(rotation) {
		this.targetRotation_ = rotation;
		this.applyTargetState_();
	}
	/**
	* Zoom to a specific zoom level. Any resolution constrain will apply.
	* @param {number} zoom Zoom level.
	* @api
	*/
	setZoom(zoom) {
		this.setResolution(this.getResolutionForZoom(zoom));
	}
	/**
	* Recompute rotation/resolution/center based on target values.
	* Note: we have to compute rotation first, then resolution and center considering that
	* parameters can influence one another in case a view extent constraint is present.
	* @param {boolean} [doNotCancelAnims] Do not cancel animations.
	* @param {boolean} [forceMoving] Apply constraints as if the view is moving.
	* @private
	*/
	applyTargetState_(doNotCancelAnims, forceMoving) {
		const isMoving = this.getAnimating() || this.getInteracting() || forceMoving;
		const newRotation = this.constraints_.rotation(this.targetRotation_, isMoving);
		const size = this.getViewportSize_(newRotation);
		const newResolution = this.constraints_.resolution(this.targetResolution_, 0, size, isMoving);
		const newCenter = this.constraints_.center(this.targetCenter_, newResolution, size, isMoving, this.calculateCenterShift(this.targetCenter_, newResolution, newRotation, size));
		if (this.get(ViewProperty_default.ROTATION) !== newRotation) this.set(ViewProperty_default.ROTATION, newRotation);
		if (this.get(ViewProperty_default.RESOLUTION) !== newResolution) {
			this.set(ViewProperty_default.RESOLUTION, newResolution);
			this.set("zoom", this.getZoom(), true);
		}
		if (!newCenter || !this.get(ViewProperty_default.CENTER) || !equals(this.get(ViewProperty_default.CENTER), newCenter)) this.set(ViewProperty_default.CENTER, newCenter);
		if (this.getAnimating() && !doNotCancelAnims) this.cancelAnimations();
		this.cancelAnchor_ = void 0;
	}
	/**
	* If any constraints need to be applied, an animation will be triggered.
	* This is typically done on interaction end.
	* Note: calling this with a duration of 0 will apply the constrained values straight away,
	* without animation.
	* @param {number} [duration] The animation duration in ms.
	* @param {number} [resolutionDirection] Which direction to zoom.
	* @param {import("./coordinate.js").Coordinate} [anchor] The origin of the transformation.
	*/
	resolveConstraints(duration, resolutionDirection, anchor) {
		duration = duration !== void 0 ? duration : 200;
		const direction = resolutionDirection || 0;
		const newRotation = this.constraints_.rotation(this.targetRotation_);
		const size = this.getViewportSize_(newRotation);
		const newResolution = this.constraints_.resolution(this.targetResolution_, direction, size);
		const newCenter = this.constraints_.center(this.targetCenter_, newResolution, size, false, this.calculateCenterShift(this.targetCenter_, newResolution, newRotation, size));
		if (duration === 0 && !this.cancelAnchor_) {
			this.targetResolution_ = newResolution;
			this.targetRotation_ = newRotation;
			this.targetCenter_ = newCenter;
			this.applyTargetState_();
			return;
		}
		anchor = anchor || (duration === 0 ? this.cancelAnchor_ : void 0);
		this.cancelAnchor_ = void 0;
		if (this.getResolution() !== newResolution || this.getRotation() !== newRotation || !this.getCenterInternal() || !equals(this.getCenterInternal(), newCenter)) {
			if (this.getAnimating()) this.cancelAnimations();
			this.animateInternal({
				rotation: newRotation,
				center: newCenter,
				resolution: newResolution,
				duration,
				easing: easeOut,
				anchor
			});
		}
	}
	/**
	* Notify the View that an interaction has started.
	* The view state will be resolved to a stable one if needed
	* (depending on its constraints).
	* @api
	*/
	beginInteraction() {
		this.resolveConstraints(0);
		this.setHint(ViewHint_default.INTERACTING, 1);
	}
	/**
	* Notify the View that an interaction has ended. The view state will be resolved
	* to a stable one if needed (depending on its constraints).
	* @param {number} [duration] Animation duration in ms.
	* @param {number} [resolutionDirection] Which direction to zoom.
	* @param {import("./coordinate.js").Coordinate} [anchor] The origin of the transformation.
	* @api
	*/
	endInteraction(duration, resolutionDirection, anchor) {
		anchor = anchor && fromUserCoordinate(anchor, this.getProjection());
		this.endInteractionInternal(duration, resolutionDirection, anchor);
	}
	/**
	* Notify the View that an interaction has ended. The view state will be resolved
	* to a stable one if needed (depending on its constraints).
	* @param {number} [duration] Animation duration in ms.
	* @param {number} [resolutionDirection] Which direction to zoom.
	* @param {import("./coordinate.js").Coordinate} [anchor] The origin of the transformation.
	*/
	endInteractionInternal(duration, resolutionDirection, anchor) {
		if (!this.getInteracting()) return;
		this.setHint(ViewHint_default.INTERACTING, -1);
		this.resolveConstraints(duration, resolutionDirection, anchor);
	}
	/**
	* Get a valid position for the view center according to the current constraints.
	* @param {import("./coordinate.js").Coordinate|undefined} targetCenter Target center position.
	* @param {number} [targetResolution] Target resolution. If not supplied, the current one will be used.
	* This is useful to guess a valid center position at a different zoom level.
	* @return {import("./coordinate.js").Coordinate|undefined} Valid center position.
	*/
	getConstrainedCenter(targetCenter, targetResolution) {
		const size = this.getViewportSize_(this.getRotation());
		return this.constraints_.center(targetCenter, targetResolution || this.getResolution(), size);
	}
	/**
	* Get a valid zoom level according to the current view constraints.
	* @param {number|undefined} targetZoom Target zoom.
	* @param {number} [direction=0] Indicate which resolution should be used
	* by a renderer if the view resolution does not match any resolution of the tile source.
	* If 0, the nearest resolution will be used. If 1, the nearest lower resolution
	* will be used. If -1, the nearest higher resolution will be used.
	* @return {number|undefined} Valid zoom level.
	*/
	getConstrainedZoom(targetZoom, direction) {
		const targetRes = this.getResolutionForZoom(targetZoom);
		return this.getZoomForResolution(this.getConstrainedResolution(targetRes, direction));
	}
	/**
	* Get a valid resolution according to the current view constraints.
	* @param {number|undefined} targetResolution Target resolution.
	* @param {number} [direction=0] Indicate which resolution should be used
	* by a renderer if the view resolution does not match any resolution of the tile source.
	* If 0, the nearest resolution will be used. If 1, the nearest lower resolution
	* will be used. If -1, the nearest higher resolution will be used.
	* @return {number|undefined} Valid resolution.
	*/
	getConstrainedResolution(targetResolution, direction) {
		direction = direction || 0;
		const size = this.getViewportSize_(this.getRotation());
		return this.constraints_.resolution(targetResolution, direction, size);
	}
};
/**
* @param {Function} callback Callback.
* @param {*} returnValue Return value.
*/
function animationCallback(callback, returnValue) {
	setTimeout(function() {
		callback(returnValue);
	}, 0);
}
/**
* @param {ViewOptions} options View options.
* @return {import("./centerconstraint.js").Type} The constraint.
*/
function createCenterConstraint(options) {
	if (options.extent !== void 0) {
		const smooth = options.smoothExtentConstraint !== void 0 ? options.smoothExtentConstraint : true;
		return createExtent(options.extent, options.constrainOnlyCenter, smooth);
	}
	const projection = createProjection(options.projection, "EPSG:3857");
	if (options.multiWorld !== true && projection.isGlobal()) {
		const extent = projection.getExtent().slice();
		extent[0] = -Infinity;
		extent[2] = Infinity;
		return createExtent(extent, false, false);
	}
	return none$1;
}
/**
* @param {ViewOptions} options View options.
* @return {{constraint: import("./resolutionconstraint.js").Type, maxResolution: number,
*     minResolution: number, minZoom: number, zoomFactor: number}} The constraint.
*/
function createResolutionConstraint(options) {
	let resolutionConstraint;
	let maxResolution;
	let minResolution;
	const defaultMaxZoom = 28;
	const defaultZoomFactor = 2;
	let minZoom = options.minZoom !== void 0 ? options.minZoom : DEFAULT_MIN_ZOOM;
	let maxZoom = options.maxZoom !== void 0 ? options.maxZoom : defaultMaxZoom;
	const zoomFactor = options.zoomFactor !== void 0 ? options.zoomFactor : defaultZoomFactor;
	const multiWorld = options.multiWorld !== void 0 ? options.multiWorld : false;
	const smooth = options.smoothResolutionConstraint !== void 0 ? options.smoothResolutionConstraint : true;
	const showFullExtent = options.showFullExtent !== void 0 ? options.showFullExtent : false;
	const projection = createProjection(options.projection, "EPSG:3857");
	const projExtent = projection.getExtent();
	let constrainOnlyCenter = options.constrainOnlyCenter;
	let extent = options.extent;
	if (!multiWorld && !extent && projection.isGlobal()) {
		constrainOnlyCenter = false;
		extent = projExtent;
	}
	if (options.resolutions !== void 0) {
		const resolutions = options.resolutions;
		maxResolution = resolutions[minZoom];
		minResolution = resolutions[maxZoom] !== void 0 ? resolutions[maxZoom] : resolutions[resolutions.length - 1];
		if (options.constrainResolution) resolutionConstraint = createSnapToResolutions(resolutions, smooth, !constrainOnlyCenter && extent, showFullExtent);
		else resolutionConstraint = createMinMaxResolution(maxResolution, minResolution, smooth, !constrainOnlyCenter && extent, showFullExtent);
	} else {
		const defaultMaxResolution = (!projExtent ? 360 * METERS_PER_UNIT.degrees / projection.getMetersPerUnit() : Math.max(getWidth(projExtent), getHeight(projExtent))) / 256 / Math.pow(defaultZoomFactor, DEFAULT_MIN_ZOOM);
		const defaultMinResolution = defaultMaxResolution / Math.pow(defaultZoomFactor, 28);
		maxResolution = options.maxResolution;
		if (maxResolution !== void 0) minZoom = 0;
		else maxResolution = defaultMaxResolution / Math.pow(zoomFactor, minZoom);
		minResolution = options.minResolution;
		if (minResolution === void 0) if (options.maxZoom !== void 0) if (options.maxResolution !== void 0) minResolution = maxResolution / Math.pow(zoomFactor, maxZoom);
		else minResolution = defaultMaxResolution / Math.pow(zoomFactor, maxZoom);
		else minResolution = defaultMinResolution;
		maxZoom = minZoom + Math.floor(Math.log(maxResolution / minResolution) / Math.log(zoomFactor));
		minResolution = maxResolution / Math.pow(zoomFactor, maxZoom - minZoom);
		if (options.constrainResolution) resolutionConstraint = createSnapToPower(zoomFactor, maxResolution, minResolution, smooth, !constrainOnlyCenter && extent, showFullExtent);
		else resolutionConstraint = createMinMaxResolution(maxResolution, minResolution, smooth, !constrainOnlyCenter && extent, showFullExtent);
	}
	return {
		constraint: resolutionConstraint,
		maxResolution,
		minResolution,
		minZoom,
		zoomFactor
	};
}
/**
* @param {ViewOptions} options View options.
* @return {import("./rotationconstraint.js").Type} Rotation constraint.
*/
function createRotationConstraint(options) {
	if (options.enableRotation !== void 0 ? options.enableRotation : true) {
		const constrainRotation = options.constrainRotation;
		if (constrainRotation === void 0 || constrainRotation === true) return createSnapToZero();
		if (constrainRotation === false) return none;
		if (typeof constrainRotation === "number") return createSnapToN(constrainRotation);
		return none;
	}
	return disable;
}
/**
* Determine if an animation involves no view change.
* @param {Animation} animation The animation.
* @return {boolean} The animation involves no view change.
*/
function isNoopAnimation(animation) {
	if (animation.sourceCenter && animation.targetCenter) {
		if (!equals(animation.sourceCenter, animation.targetCenter)) return false;
	}
	if (animation.sourceResolution !== animation.targetResolution) return false;
	if (animation.sourceRotation !== animation.targetRotation) return false;
	return true;
}
/**
* @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
* @param {import("./size.js").Size} size Box pixel size.
* @param {import("./pixel.js").Pixel} position Position on the view to center on.
* @param {number} resolution Resolution.
* @param {number} rotation Rotation.
* @return {import("./coordinate.js").Coordinate} Shifted center.
*/
function calculateCenterOn(coordinate, size, position, resolution, rotation) {
	const cosAngle = Math.cos(-rotation);
	let sinAngle = Math.sin(-rotation);
	let rotX = coordinate[0] * cosAngle - coordinate[1] * sinAngle;
	let rotY = coordinate[1] * cosAngle + coordinate[0] * sinAngle;
	rotX += (size[0] / 2 - position[0]) * resolution;
	rotY += (position[1] - size[1] / 2) * resolution;
	sinAngle = -sinAngle;
	return [rotX * cosAngle - rotY * sinAngle, rotY * cosAngle + rotX * sinAngle];
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/layer/Layer.js
/**
* @module ol/layer/Layer
*/
/**
* @typedef {function(import("../Map.js").FrameState):HTMLElement} RenderFunction
*/
/**
* @typedef {'sourceready'|'change:source'} LayerEventType
*/
/***
* @template Return
* @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
*   import("../Observable").OnSignature<import("./Base").BaseLayerObjectEventTypes|
*     LayerEventType, import("../Object").ObjectEvent, Return> &
*   import("../Observable").OnSignature<import("../render/EventType").LayerRenderEventTypes, import("../render/Event").default, Return> &
*   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("./Base").BaseLayerObjectEventTypes|LayerEventType|
*     import("../render/EventType").LayerRenderEventTypes, Return>} LayerOnSignature
*/
/**
* @template {import("../source/Source.js").default} [SourceType=import("../source/Source.js").default]
* @typedef {Object} Options
* @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
* @property {number} [opacity=1] Opacity (0, 1).
* @property {boolean} [visible=true] Visibility.
* @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
* rendered outside of this extent.
* @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
* will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
* for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
* method was used.
* @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
* visible.
* @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
* be visible.
* @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
* visible.
* @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
* be visible.
* @property {SourceType} [source] Source for this layer.  If not provided to the constructor,
* the source can be set by calling {@link module:ol/layer/Layer~Layer#setSource layer.setSource(source)} after
* construction.
* @property {import("../Map.js").default|null} [map] Map.
* @property {RenderFunction} [render] Render function. Takes the frame state as input and is expected to return an
* HTML element. Will overwrite the default rendering for the layer.
* @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
*/
/**
* @typedef {Object} State
* @property {import("./Layer.js").default} layer Layer.
* @property {number} opacity Opacity, the value is rounded to two digits to appear after the decimal point.
* @property {boolean} visible Visible.
* @property {boolean} managed Managed.
* @property {import("../extent.js").Extent} [extent] Extent.
* @property {number | undefined} zIndex ZIndex.
* @property {number} maxResolution Maximum resolution.
* @property {number} minResolution Minimum resolution.
* @property {number} minZoom Minimum zoom.
* @property {number} maxZoom Maximum zoom.
*/
/**
* @classdesc
* Base class from which all layer types are derived. This should only be instantiated
* in the case where a custom layer is added to the map with a custom `render` function.
* Such a function can be specified in the `options` object, and is expected to return an HTML element.
*
* A visual representation of raster or vector map data.
* Layers group together those properties that pertain to how the data is to be
* displayed, irrespective of the source of that data.
*
* Layers are usually added to a map with [map.addLayer()]{@link import("../Map.js").default#addLayer}.
* Components like {@link module:ol/interaction/Draw~Draw} use unmanaged layers
* internally. These unmanaged layers are associated with the map using
* [layer.setMap()]{@link module:ol/layer/Layer~Layer#setMap} instead.
*
* A generic `change` event is fired when the state of the source changes.
* A `sourceready` event is fired when the layer's source is ready.
*
* @fires import("../render/Event.js").RenderEvent#prerender
* @fires import("../render/Event.js").RenderEvent#postrender
* @fires import("../events/Event.js").BaseEvent#sourceready
*
* @template {import("../source/Source.js").default} [SourceType=import("../source/Source.js").default]
* @template {import("../renderer/Layer.js").default} [RendererType=import("../renderer/Layer.js").default]
* @api
*/
var Layer = class extends BaseLayer {
	/**
	* @param {Options<SourceType>} options Layer options.
	*/
	constructor(options) {
		const baseOptions = Object.assign({}, options);
		delete baseOptions.source;
		super(baseOptions);
		/***
		* @type {LayerOnSignature<import("../events").EventsKey>}
		*/
		this.on;
		/***
		* @type {LayerOnSignature<import("../events").EventsKey>}
		*/
		this.once;
		/***
		* @type {LayerOnSignature<void>}
		*/
		this.un;
		/**
		* @private
		* @type {?import("../events.js").EventsKey}
		*/
		this.mapPrecomposeKey_ = null;
		/**
		* @private
		* @type {?import("../events.js").EventsKey}
		*/
		this.mapRenderKey_ = null;
		/**
		* @private
		* @type {?import("../events.js").EventsKey}
		*/
		this.sourceChangeKey_ = null;
		/**
		* @private
		* @type {RendererType}
		*/
		this.renderer_ = null;
		/**
		* @private
		* @type {boolean}
		*/
		this.sourceReady_ = false;
		/**
		* @protected
		* @type {boolean}
		*/
		this.rendered = false;
		if (options.render) this.render = options.render;
		if (options.map) this.setMap(options.map);
		this.addChangeListener(Property_default$1.SOURCE, this.handleSourcePropertyChange_);
		const source = options.source ? options.source : null;
		this.setSource(source);
	}
	/**
	* @param {Array<import("./Layer.js").default>} [array] Array of layers (to be modified in place).
	* @return {Array<import("./Layer.js").default>} Array of layers.
	*/
	getLayersArray(array) {
		array = array ? array : [];
		array.push(this);
		return array;
	}
	/**
	* @param {Array<import("./Layer.js").State>} [states] Optional list of layer states (to be modified in place).
	* @return {Array<import("./Layer.js").State>} List of layer states.
	*/
	getLayerStatesArray(states) {
		states = states ? states : [];
		states.push(this.getLayerState());
		return states;
	}
	/**
	* Get the layer source.
	* @return {SourceType|null} The layer source (or `null` if not yet set).
	* @observable
	* @api
	*/
	getSource() {
		return this.get(Property_default$1.SOURCE) || null;
	}
	/**
	* @return {SourceType|null} The source being rendered.
	*/
	getRenderSource() {
		return this.getSource();
	}
	/**
	* @return {import("../source/Source.js").State} Source state.
	*/
	getSourceState() {
		const source = this.getSource();
		return !source ? "undefined" : source.getState();
	}
	/**
	* @private
	*/
	handleSourceChange_() {
		this.changed();
		if (this.sourceReady_ || this.getSource().getState() !== "ready") return;
		this.sourceReady_ = true;
		this.dispatchEvent("sourceready");
	}
	/**
	* @private
	*/
	handleSourcePropertyChange_() {
		if (this.sourceChangeKey_) {
			unlistenByKey(this.sourceChangeKey_);
			this.sourceChangeKey_ = null;
		}
		this.sourceReady_ = false;
		const source = this.getSource();
		if (source) {
			this.sourceChangeKey_ = listen(source, EventType_default$2.CHANGE, this.handleSourceChange_, this);
			if (source.getState() === "ready") {
				this.sourceReady_ = true;
				setTimeout(() => {
					this.dispatchEvent("sourceready");
				}, 0);
			}
		}
		this.changed();
	}
	/**
	* @param {import("../pixel").Pixel} pixel Pixel.
	* @return {Promise<Array<import("../Feature").FeatureLike>>} Promise that resolves with
	* an array of features.
	*/
	getFeatures(pixel) {
		if (!this.renderer_) return Promise.resolve([]);
		return this.renderer_.getFeatures(pixel);
	}
	/**
	* @param {import("../pixel").Pixel} pixel Pixel.
	* @return {Uint8ClampedArray|Uint8Array|Float32Array|DataView|null} Pixel data.
	*/
	getData(pixel) {
		if (!this.renderer_ || !this.rendered) return null;
		return this.renderer_.getData(pixel);
	}
	/**
	* The layer is visible on the map view, i.e. within its min/max resolution or zoom and
	* extent, not set to `visible: false`, and not inside a layer group that is set
	* to `visible: false`.
	* @param {View|import("../View.js").ViewStateLayerStateExtent} [view] View or {@link import("../Map.js").FrameState}.
	* Only required when the layer is not added to a map.
	* @return {boolean} The layer is visible in the map view.
	* @api
	*/
	isVisible(view) {
		let frameState;
		const map = this.getMapInternal();
		if (!view && map) view = map.getView();
		if (view instanceof View) frameState = {
			viewState: view.getState(),
			extent: view.calculateExtent()
		};
		else frameState = view;
		if (!frameState.layerStatesArray && map) frameState.layerStatesArray = map.getLayerGroup().getLayerStatesArray();
		let layerState;
		if (frameState.layerStatesArray) layerState = frameState.layerStatesArray.find((layerState) => layerState.layer === this);
		else layerState = this.getLayerState();
		const layerExtent = this.getExtent();
		return inView(layerState, frameState.viewState) && (!layerExtent || intersects(layerExtent, frameState.extent));
	}
	/**
	* Get the attributions of the source of this layer for the given view.
	* @param {View|import("../View.js").ViewStateLayerStateExtent} [view] View or {@link import("../Map.js").FrameState}.
	* Only required when the layer is not added to a map.
	* @return {Array<string>} Attributions for this layer at the given view.
	* @api
	*/
	getAttributions(view) {
		if (!this.isVisible(view)) return [];
		let getAttributions;
		const source = this.getSource();
		if (source) getAttributions = source.getAttributions();
		if (!getAttributions) return [];
		const frameState = view instanceof View ? view.getViewStateAndExtent() : view;
		let attributions = getAttributions(frameState);
		if (!Array.isArray(attributions)) attributions = [attributions];
		return attributions;
	}
	/**
	* In charge to manage the rendering of the layer. One layer type is
	* bounded with one layer renderer.
	* @param {?import("../Map.js").FrameState} frameState Frame state.
	* @param {HTMLElement} target Target which the renderer may (but need not) use
	* for rendering its content.
	* @return {HTMLElement|null} The rendered element.
	*/
	render(frameState, target) {
		const layerRenderer = this.getRenderer();
		if (layerRenderer.prepareFrame(frameState)) {
			this.rendered = true;
			return layerRenderer.renderFrame(frameState, target);
		}
		return null;
	}
	/**
	* Called when a layer is not visible during a map render.
	*/
	unrender() {
		this.rendered = false;
	}
	/** @return {string} Declutter */
	getDeclutter() {}
	/**
	* @param {import("../Map.js").FrameState} frameState Frame state.
	* @param {import("../layer/Layer.js").State} layerState Layer state.
	*/
	renderDeclutter(frameState, layerState) {}
	/**
	* When the renderer follows a layout -> render approach, do the final rendering here.
	* @param {import('../Map.js').FrameState} frameState Frame state
	*/
	renderDeferred(frameState) {
		const layerRenderer = this.getRenderer();
		if (!layerRenderer) return;
		layerRenderer.renderDeferred(frameState);
	}
	/**
	* For use inside the library only.
	* @param {import("../Map.js").default|null} map Map.
	*/
	setMapInternal(map) {
		if (!map) this.unrender();
		this.set(Property_default$1.MAP, map);
	}
	/**
	* For use inside the library only.
	* @return {import("../Map.js").default|null} Map.
	*/
	getMapInternal() {
		return this.get(Property_default$1.MAP);
	}
	/**
	* Sets the layer to be rendered on top of other layers on a map. The map will
	* not manage this layer in its layers collection. This
	* is useful for temporary layers. To remove an unmanaged layer from the map,
	* use `#setMap(null)`.
	*
	* To add the layer to a map and have it managed by the map, use
	* {@link module:ol/Map~Map#addLayer} instead.
	* @param {import("../Map.js").default|null} map Map.
	* @api
	*/
	setMap(map) {
		if (this.mapPrecomposeKey_) {
			unlistenByKey(this.mapPrecomposeKey_);
			this.mapPrecomposeKey_ = null;
		}
		if (!map) this.changed();
		if (this.mapRenderKey_) {
			unlistenByKey(this.mapRenderKey_);
			this.mapRenderKey_ = null;
		}
		if (map) {
			this.mapPrecomposeKey_ = listen(map, EventType_default$1.PRECOMPOSE, function(evt) {
				const layerStatesArray = evt.frameState.layerStatesArray;
				const layerState = this.getLayerState(false);
				assert(!layerStatesArray.some(function(arrayLayerState) {
					return arrayLayerState.layer === layerState.layer;
				}), "A layer can only be added to the map once. Use either `layer.setMap()` or `map.addLayer()`, not both.");
				layerStatesArray.push(layerState);
			}, this);
			this.mapRenderKey_ = listen(this, EventType_default$2.CHANGE, map.render, map);
			this.changed();
		}
	}
	/**
	* Set the layer source.
	* @param {SourceType|null} source The layer source.
	* @observable
	* @api
	*/
	setSource(source) {
		this.set(Property_default$1.SOURCE, source);
	}
	/**
	* Get the renderer for this layer.
	* @return {RendererType|null} The layer renderer.
	*/
	getRenderer() {
		if (!this.renderer_) this.renderer_ = this.createRenderer();
		return this.renderer_;
	}
	/**
	* @return {boolean} The layer has a renderer.
	*/
	hasRenderer() {
		return !!this.renderer_;
	}
	/**
	* Create a renderer for this layer.
	* @return {RendererType} A layer renderer.
	* @protected
	*/
	createRenderer() {
		return null;
	}
	/**
	* Clean up.
	*/
	disposeInternal() {
		if (this.renderer_) {
			this.renderer_.dispose();
			delete this.renderer_;
		}
		this.setSource(null);
		super.disposeInternal();
	}
};
/**
* Return `true` if the layer is visible and if the provided view state
* has resolution and zoom levels that are in range of the layer's min/max.
* @param {State} layerState Layer state.
* @param {import("../View.js").State} viewState View state.
* @return {boolean} The layer is visible at the given view state.
*/
function inView(layerState, viewState) {
	if (!layerState.visible) return false;
	const resolution = viewState.resolution;
	if (resolution < layerState.minResolution || resolution >= layerState.maxResolution) return false;
	const zoom = viewState.zoom;
	return zoom > layerState.minZoom && zoom <= layerState.maxZoom;
}
//#endregion
//#region ../../node_modules/.pnpm/rbush@3.0.1/node_modules/rbush/rbush.min.js
var require_rbush_min = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(t, i) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = i() : "function" == typeof define && define.amd ? define(i) : (t = t || self).RBush = i();
	})(exports, function() {
		"use strict";
		function t(t, r, e, a, h) {
			(function t(n, r, e, a, h) {
				for (; a > e;) {
					if (a - e > 600) {
						var o = a - e + 1, s = r - e + 1, l = Math.log(o), f = .5 * Math.exp(2 * l / 3), u = .5 * Math.sqrt(l * f * (o - f) / o) * (s - o / 2 < 0 ? -1 : 1);
						t(n, r, Math.max(e, Math.floor(r - s * f / o + u)), Math.min(a, Math.floor(r + (o - s) * f / o + u)), h);
					}
					var p = n[r], d = e, x = a;
					for (i(n, e, r), h(n[a], p) > 0 && i(n, e, a); d < x;) {
						for (i(n, d, x), d++, x--; h(n[d], p) < 0;) d++;
						for (; h(n[x], p) > 0;) x--;
					}
					0 === h(n[e], p) ? i(n, e, x) : i(n, ++x, a), x <= r && (e = x + 1), r <= x && (a = x - 1);
				}
			})(t, r, e || 0, a || t.length - 1, h || n);
		}
		function i(t, i, n) {
			var r = t[i];
			t[i] = t[n], t[n] = r;
		}
		function n(t, i) {
			return t < i ? -1 : t > i ? 1 : 0;
		}
		var r = function(t) {
			void 0 === t && (t = 9), this._maxEntries = Math.max(4, t), this._minEntries = Math.max(2, Math.ceil(.4 * this._maxEntries)), this.clear();
		};
		function e(t, i, n) {
			if (!n) return i.indexOf(t);
			for (var r = 0; r < i.length; r++) if (n(t, i[r])) return r;
			return -1;
		}
		function a(t, i) {
			h(t, 0, t.children.length, i, t);
		}
		function h(t, i, n, r, e) {
			e || (e = p(null)), e.minX = Infinity, e.minY = Infinity, e.maxX = -Infinity, e.maxY = -Infinity;
			for (var a = i; a < n; a++) {
				var h = t.children[a];
				o(e, t.leaf ? r(h) : h);
			}
			return e;
		}
		function o(t, i) {
			return t.minX = Math.min(t.minX, i.minX), t.minY = Math.min(t.minY, i.minY), t.maxX = Math.max(t.maxX, i.maxX), t.maxY = Math.max(t.maxY, i.maxY), t;
		}
		function s(t, i) {
			return t.minX - i.minX;
		}
		function l(t, i) {
			return t.minY - i.minY;
		}
		function f(t) {
			return (t.maxX - t.minX) * (t.maxY - t.minY);
		}
		function u(t) {
			return t.maxX - t.minX + (t.maxY - t.minY);
		}
		function m(t, i) {
			return t.minX <= i.minX && t.minY <= i.minY && i.maxX <= t.maxX && i.maxY <= t.maxY;
		}
		function c(t, i) {
			return i.minX <= t.maxX && i.minY <= t.maxY && i.maxX >= t.minX && i.maxY >= t.minY;
		}
		function p(t) {
			return {
				children: t,
				height: 1,
				leaf: !0,
				minX: Infinity,
				minY: Infinity,
				maxX: -Infinity,
				maxY: -Infinity
			};
		}
		function d(i, n, r, e, a) {
			for (var h = [n, r]; h.length;) if (!((r = h.pop()) - (n = h.pop()) <= e)) {
				var o = n + Math.ceil((r - n) / e / 2) * e;
				t(i, o, n, r, a), h.push(n, o, o, r);
			}
		}
		return r.prototype.all = function() {
			return this._all(this.data, []);
		}, r.prototype.search = function(t) {
			var i = this.data, n = [];
			if (!c(t, i)) return n;
			for (var r = this.toBBox, e = []; i;) {
				for (var a = 0; a < i.children.length; a++) {
					var h = i.children[a], o = i.leaf ? r(h) : h;
					c(t, o) && (i.leaf ? n.push(h) : m(t, o) ? this._all(h, n) : e.push(h));
				}
				i = e.pop();
			}
			return n;
		}, r.prototype.collides = function(t) {
			var i = this.data;
			if (!c(t, i)) return !1;
			for (var n = []; i;) {
				for (var r = 0; r < i.children.length; r++) {
					var e = i.children[r], a = i.leaf ? this.toBBox(e) : e;
					if (c(t, a)) {
						if (i.leaf || m(t, a)) return !0;
						n.push(e);
					}
				}
				i = n.pop();
			}
			return !1;
		}, r.prototype.load = function(t) {
			if (!t || !t.length) return this;
			if (t.length < this._minEntries) {
				for (var i = 0; i < t.length; i++) this.insert(t[i]);
				return this;
			}
			var n = this._build(t.slice(), 0, t.length - 1, 0);
			if (this.data.children.length) if (this.data.height === n.height) this._splitRoot(this.data, n);
			else {
				if (this.data.height < n.height) {
					var r = this.data;
					this.data = n, n = r;
				}
				this._insert(n, this.data.height - n.height - 1, !0);
			}
			else this.data = n;
			return this;
		}, r.prototype.insert = function(t) {
			return t && this._insert(t, this.data.height - 1), this;
		}, r.prototype.clear = function() {
			return this.data = p([]), this;
		}, r.prototype.remove = function(t, i) {
			if (!t) return this;
			for (var n, r, a, h = this.data, o = this.toBBox(t), s = [], l = []; h || s.length;) {
				if (h || (h = s.pop(), r = s[s.length - 1], n = l.pop(), a = !0), h.leaf) {
					var f = e(t, h.children, i);
					if (-1 !== f) return h.children.splice(f, 1), s.push(h), this._condense(s), this;
				}
				a || h.leaf || !m(h, o) ? r ? (n++, h = r.children[n], a = !1) : h = null : (s.push(h), l.push(n), n = 0, r = h, h = h.children[0]);
			}
			return this;
		}, r.prototype.toBBox = function(t) {
			return t;
		}, r.prototype.compareMinX = function(t, i) {
			return t.minX - i.minX;
		}, r.prototype.compareMinY = function(t, i) {
			return t.minY - i.minY;
		}, r.prototype.toJSON = function() {
			return this.data;
		}, r.prototype.fromJSON = function(t) {
			return this.data = t, this;
		}, r.prototype._all = function(t, i) {
			for (var n = []; t;) t.leaf ? i.push.apply(i, t.children) : n.push.apply(n, t.children), t = n.pop();
			return i;
		}, r.prototype._build = function(t, i, n, r) {
			var e, h = n - i + 1, o = this._maxEntries;
			if (h <= o) return a(e = p(t.slice(i, n + 1)), this.toBBox), e;
			r || (r = Math.ceil(Math.log(h) / Math.log(o)), o = Math.ceil(h / Math.pow(o, r - 1))), (e = p([])).leaf = !1, e.height = r;
			var s = Math.ceil(h / o), l = s * Math.ceil(Math.sqrt(o));
			d(t, i, n, l, this.compareMinX);
			for (var f = i; f <= n; f += l) {
				var u = Math.min(f + l - 1, n);
				d(t, f, u, s, this.compareMinY);
				for (var m = f; m <= u; m += s) {
					var c = Math.min(m + s - 1, u);
					e.children.push(this._build(t, m, c, r - 1));
				}
			}
			return a(e, this.toBBox), e;
		}, r.prototype._chooseSubtree = function(t, i, n, r) {
			for (; r.push(i), !i.leaf && r.length - 1 !== n;) {
				for (var e = Infinity, a = Infinity, h = void 0, o = 0; o < i.children.length; o++) {
					var s = i.children[o], l = f(s), u = (m = t, c = s, (Math.max(c.maxX, m.maxX) - Math.min(c.minX, m.minX)) * (Math.max(c.maxY, m.maxY) - Math.min(c.minY, m.minY)) - l);
					u < a ? (a = u, e = l < e ? l : e, h = s) : u === a && l < e && (e = l, h = s);
				}
				i = h || i.children[0];
			}
			var m, c;
			return i;
		}, r.prototype._insert = function(t, i, n) {
			var r = n ? t : this.toBBox(t), e = [], a = this._chooseSubtree(r, this.data, i, e);
			for (a.children.push(t), o(a, r); i >= 0 && e[i].children.length > this._maxEntries;) this._split(e, i), i--;
			this._adjustParentBBoxes(r, e, i);
		}, r.prototype._split = function(t, i) {
			var n = t[i], r = n.children.length, e = this._minEntries;
			this._chooseSplitAxis(n, e, r);
			var h = this._chooseSplitIndex(n, e, r), o = p(n.children.splice(h, n.children.length - h));
			o.height = n.height, o.leaf = n.leaf, a(n, this.toBBox), a(o, this.toBBox), i ? t[i - 1].children.push(o) : this._splitRoot(n, o);
		}, r.prototype._splitRoot = function(t, i) {
			this.data = p([t, i]), this.data.height = t.height + 1, this.data.leaf = !1, a(this.data, this.toBBox);
		}, r.prototype._chooseSplitIndex = function(t, i, n) {
			for (var r, e, a, o, s, l, u, m = Infinity, c = Infinity, p = i; p <= n - i; p++) {
				var d = h(t, 0, p, this.toBBox), x = h(t, p, n, this.toBBox), v = (e = d, a = x, o = void 0, s = void 0, l = void 0, u = void 0, o = Math.max(e.minX, a.minX), s = Math.max(e.minY, a.minY), l = Math.min(e.maxX, a.maxX), u = Math.min(e.maxY, a.maxY), Math.max(0, l - o) * Math.max(0, u - s)), M = f(d) + f(x);
				v < m ? (m = v, r = p, c = M < c ? M : c) : v === m && M < c && (c = M, r = p);
			}
			return r || n - i;
		}, r.prototype._chooseSplitAxis = function(t, i, n) {
			var r = t.leaf ? this.compareMinX : s, e = t.leaf ? this.compareMinY : l;
			this._allDistMargin(t, i, n, r) < this._allDistMargin(t, i, n, e) && t.children.sort(r);
		}, r.prototype._allDistMargin = function(t, i, n, r) {
			t.children.sort(r);
			for (var e = this.toBBox, a = h(t, 0, i, e), s = h(t, n - i, n, e), l = u(a) + u(s), f = i; f < n - i; f++) {
				var m = t.children[f];
				o(a, t.leaf ? e(m) : m), l += u(a);
			}
			for (var c = n - i - 1; c >= i; c--) {
				var p = t.children[c];
				o(s, t.leaf ? e(p) : p), l += u(s);
			}
			return l;
		}, r.prototype._adjustParentBBoxes = function(t, i, n) {
			for (var r = n; r >= 0; r--) o(i[r], t);
		}, r.prototype._condense = function(t) {
			for (var i = t.length - 1, n = void 0; i >= 0; i--) 0 === t[i].children.length ? i > 0 ? (n = t[i - 1].children).splice(n.indexOf(t[i]), 1) : this.clear() : a(t[i], this.toBBox);
		}, r;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/style/Icon.js
/**
* @module ol/style/Icon
*/
/**
* @typedef {'fraction' | 'pixels'} IconAnchorUnits
* Anchor unit can be either a fraction of the icon size or in pixels.
*/
/**
* @typedef {'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'} IconOrigin
* Icon origin. One of 'bottom-left', 'bottom-right', 'top-left', 'top-right'.
*/
/**
* @typedef {Object} Options
* @property {Array<number>} [anchor=[0.5, 0.5]] Anchor. Default value is the icon center.
* @property {IconOrigin} [anchorOrigin='top-left'] Origin of the anchor: `bottom-left`, `bottom-right`,
* `top-left` or `top-right`.
* @property {IconAnchorUnits} [anchorXUnits='fraction'] Units in which the anchor x value is
* specified. A value of `'fraction'` indicates the x value is a fraction of the icon. A value of `'pixels'` indicates
* the x value in pixels.
* @property {IconAnchorUnits} [anchorYUnits='fraction'] Units in which the anchor y value is
* specified. A value of `'fraction'` indicates the y value is a fraction of the icon. A value of `'pixels'` indicates
* the y value in pixels.
* @property {import("../color.js").Color|string} [color] Color to tint the icon. If not specified,
* the icon will be left as is.
* @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images. Note that you must provide a
* `crossOrigin` value if you want to access pixel data with the Canvas renderer.
* See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
* @property {HTMLImageElement|HTMLCanvasElement|ImageBitmap} [img] Image object for the icon.
* @property {Array<number>} [displacement=[0, 0]] Displacement of the icon in pixels.
* Positive values will shift the icon right and up.
* @property {number} [opacity=1] Opacity of the icon.
* @property {number} [width] The width of the icon in pixels. This can't be used together with `scale`.
* @property {number} [height] The height of the icon in pixels. This can't be used together with `scale`.
* @property {number|import("../size.js").Size} [scale=1] Scale.
* @property {boolean} [rotateWithView=false] Whether to rotate the icon with the view.
* @property {number} [rotation=0] Rotation in radians (positive rotation clockwise).
* @property {Array<number>} [offset=[0, 0]] Offset which, together with `size` and `offsetOrigin`, defines the
* sub-rectangle to use from the original (sprite) image.
* @property {IconOrigin} [offsetOrigin='top-left'] Origin of the offset: `bottom-left`, `bottom-right`,
* `top-left` or `top-right`.
* @property {import("../size.js").Size} [size] Icon size in pixels. Used together with `offset` to define the
* sub-rectangle to use from the original (sprite) image.
* @property {string} [src] Image source URI.
* @property {import("./Style.js").DeclutterMode} [declutterMode] Declutter mode.
*/
/**
* @param {number} width The width.
* @param {number} height The height.
* @param {number|undefined} wantedWidth The wanted width.
* @param {number|undefined} wantedHeight The wanted height.
* @return {number|Array<number>} The scale.
*/
function calculateScale(width, height, wantedWidth, wantedHeight) {
	if (wantedWidth !== void 0 && wantedHeight !== void 0) return [wantedWidth / width, wantedHeight / height];
	if (wantedWidth !== void 0) return wantedWidth / width;
	if (wantedHeight !== void 0) return wantedHeight / height;
	return 1;
}
/**
* @classdesc
* Set icon style for vector features.
* @api
*/
var Icon = class Icon extends ImageStyle {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		options = options || {};
		/**
		* @type {number}
		*/
		const opacity = options.opacity !== void 0 ? options.opacity : 1;
		/**
		* @type {number}
		*/
		const rotation = options.rotation !== void 0 ? options.rotation : 0;
		/**
		* @type {number|import("../size.js").Size}
		*/
		const scale = options.scale !== void 0 ? options.scale : 1;
		/**
		* @type {boolean}
		*/
		const rotateWithView = options.rotateWithView !== void 0 ? options.rotateWithView : false;
		super({
			opacity,
			rotation,
			scale,
			displacement: options.displacement !== void 0 ? options.displacement : [0, 0],
			rotateWithView,
			declutterMode: options.declutterMode
		});
		/**
		* @private
		* @type {Array<number>}
		*/
		this.anchor_ = options.anchor !== void 0 ? options.anchor : [.5, .5];
		/**
		* @private
		* @type {Array<number>}
		*/
		this.normalizedAnchor_ = null;
		/**
		* @private
		* @type {IconOrigin}
		*/
		this.anchorOrigin_ = options.anchorOrigin !== void 0 ? options.anchorOrigin : "top-left";
		/**
		* @private
		* @type {IconAnchorUnits}
		*/
		this.anchorXUnits_ = options.anchorXUnits !== void 0 ? options.anchorXUnits : "fraction";
		/**
		* @private
		* @type {IconAnchorUnits}
		*/
		this.anchorYUnits_ = options.anchorYUnits !== void 0 ? options.anchorYUnits : "fraction";
		/**
		* @private
		* @type {?string}
		*/
		this.crossOrigin_ = options.crossOrigin !== void 0 ? options.crossOrigin : null;
		const image = options.img !== void 0 ? options.img : null;
		let cacheKey = options.src;
		assert(!(cacheKey !== void 0 && image), "`image` and `src` cannot be provided at the same time");
		if ((cacheKey === void 0 || cacheKey.length === 0) && image) cacheKey = image.src || getUid(image);
		assert(cacheKey !== void 0 && cacheKey.length > 0, "A defined and non-empty `src` or `image` must be provided");
		assert(!((options.width !== void 0 || options.height !== void 0) && options.scale !== void 0), "`width` or `height` cannot be provided together with `scale`");
		let imageState;
		if (options.src !== void 0) imageState = ImageState_default.IDLE;
		else if (image !== void 0) if ("complete" in image) if (image.complete) imageState = image.src ? ImageState_default.LOADED : ImageState_default.IDLE;
		else imageState = ImageState_default.LOADING;
		else imageState = ImageState_default.LOADED;
		/**
		* @private
		* @type {import("../color.js").Color}
		*/
		this.color_ = options.color !== void 0 ? asArray(options.color) : null;
		/**
		* @private
		* @type {import("./IconImage.js").default}
		*/
		this.iconImage_ = get(image, cacheKey, this.crossOrigin_, imageState, this.color_);
		/**
		* @private
		* @type {Array<number>}
		*/
		this.offset_ = options.offset !== void 0 ? options.offset : [0, 0];
		/**
		* @private
		* @type {IconOrigin}
		*/
		this.offsetOrigin_ = options.offsetOrigin !== void 0 ? options.offsetOrigin : "top-left";
		/**
		* @private
		* @type {Array<number>}
		*/
		this.origin_ = null;
		/**
		* @private
		* @type {import("../size.js").Size}
		*/
		this.size_ = options.size !== void 0 ? options.size : null;
		/**
		* Calculate the scale if width or height were given.
		*/
		if (options.width !== void 0 || options.height !== void 0) {
			let width, height;
			if (options.size) [width, height] = options.size;
			else {
				const image = this.getImage(1);
				if (image.width && image.height) {
					width = image.width;
					height = image.height;
				} else if (image instanceof HTMLImageElement) {
					this.initialOptions_ = options;
					const onload = () => {
						this.unlistenImageChange(onload);
						if (!this.initialOptions_) return;
						const imageSize = this.iconImage_.getSize();
						this.setScale(calculateScale(imageSize[0], imageSize[1], options.width, options.height));
					};
					this.listenImageChange(onload);
					return;
				}
			}
			if (width !== void 0) this.setScale(calculateScale(width, height, options.width, options.height));
		}
	}
	/**
	* Clones the style. The underlying Image/HTMLCanvasElement is not cloned.
	* @return {Icon} The cloned style.
	* @api
	*/
	clone() {
		let scale, width, height;
		if (this.initialOptions_) {
			width = this.initialOptions_.width;
			height = this.initialOptions_.height;
		} else {
			scale = this.getScale();
			scale = Array.isArray(scale) ? scale.slice() : scale;
		}
		return new Icon({
			anchor: this.anchor_.slice(),
			anchorOrigin: this.anchorOrigin_,
			anchorXUnits: this.anchorXUnits_,
			anchorYUnits: this.anchorYUnits_,
			color: this.color_ && this.color_.slice ? this.color_.slice() : this.color_ || void 0,
			crossOrigin: this.crossOrigin_,
			offset: this.offset_.slice(),
			offsetOrigin: this.offsetOrigin_,
			opacity: this.getOpacity(),
			rotateWithView: this.getRotateWithView(),
			rotation: this.getRotation(),
			scale,
			width,
			height,
			size: this.size_ !== null ? this.size_.slice() : void 0,
			src: this.getSrc(),
			displacement: this.getDisplacement().slice(),
			declutterMode: this.getDeclutterMode()
		});
	}
	/**
	* Get the anchor point in pixels. The anchor determines the center point for the
	* symbolizer.
	* @return {Array<number>} Anchor.
	* @api
	*/
	getAnchor() {
		let anchor = this.normalizedAnchor_;
		if (!anchor) {
			anchor = this.anchor_;
			const size = this.getSize();
			if (this.anchorXUnits_ == "fraction" || this.anchorYUnits_ == "fraction") {
				if (!size) return null;
				anchor = this.anchor_.slice();
				if (this.anchorXUnits_ == "fraction") anchor[0] *= size[0];
				if (this.anchorYUnits_ == "fraction") anchor[1] *= size[1];
			}
			if (this.anchorOrigin_ != "top-left") {
				if (!size) return null;
				if (anchor === this.anchor_) anchor = this.anchor_.slice();
				if (this.anchorOrigin_ == "top-right" || this.anchorOrigin_ == "bottom-right") anchor[0] = -anchor[0] + size[0];
				if (this.anchorOrigin_ == "bottom-left" || this.anchorOrigin_ == "bottom-right") anchor[1] = -anchor[1] + size[1];
			}
			this.normalizedAnchor_ = anchor;
		}
		const displacement = this.getDisplacement();
		const scale = this.getScaleArray();
		return [anchor[0] - displacement[0] / scale[0], anchor[1] + displacement[1] / scale[1]];
	}
	/**
	* Set the anchor point. The anchor determines the center point for the
	* symbolizer.
	*
	* @param {Array<number>} anchor Anchor.
	* @api
	*/
	setAnchor(anchor) {
		this.anchor_ = anchor;
		this.normalizedAnchor_ = null;
	}
	/**
	* Get the icon color.
	* @return {import("../color.js").Color} Color.
	* @api
	*/
	getColor() {
		return this.color_;
	}
	/**
	* Get the image icon.
	* @param {number} pixelRatio Pixel ratio.
	* @return {HTMLImageElement|HTMLCanvasElement|ImageBitmap} Image or Canvas element. If the Icon
	* style was configured with `src` or with a not let loaded `img`, an `ImageBitmap` will be returned.
	* @api
	*/
	getImage(pixelRatio) {
		return this.iconImage_.getImage(pixelRatio);
	}
	/**
	* Get the pixel ratio.
	* @param {number} pixelRatio Pixel ratio.
	* @return {number} The pixel ratio of the image.
	* @api
	*/
	getPixelRatio(pixelRatio) {
		return this.iconImage_.getPixelRatio(pixelRatio);
	}
	/**
	* @return {import("../size.js").Size} Image size.
	*/
	getImageSize() {
		return this.iconImage_.getSize();
	}
	/**
	* @return {import("../ImageState.js").default} Image state.
	*/
	getImageState() {
		return this.iconImage_.getImageState();
	}
	/**
	* @return {HTMLImageElement|HTMLCanvasElement|ImageBitmap} Image element.
	*/
	getHitDetectionImage() {
		return this.iconImage_.getHitDetectionImage();
	}
	/**
	* Get the origin of the symbolizer.
	* @return {Array<number>} Origin.
	* @api
	*/
	getOrigin() {
		if (this.origin_) return this.origin_;
		let offset = this.offset_;
		if (this.offsetOrigin_ != "top-left") {
			const size = this.getSize();
			const iconImageSize = this.iconImage_.getSize();
			if (!size || !iconImageSize) return null;
			offset = offset.slice();
			if (this.offsetOrigin_ == "top-right" || this.offsetOrigin_ == "bottom-right") offset[0] = iconImageSize[0] - size[0] - offset[0];
			if (this.offsetOrigin_ == "bottom-left" || this.offsetOrigin_ == "bottom-right") offset[1] = iconImageSize[1] - size[1] - offset[1];
		}
		this.origin_ = offset;
		return this.origin_;
	}
	/**
	* Get the image URL.
	* @return {string|undefined} Image src.
	* @api
	*/
	getSrc() {
		return this.iconImage_.getSrc();
	}
	/**
	* Get the size of the icon (in pixels).
	* @return {import("../size.js").Size} Image size.
	* @api
	*/
	getSize() {
		return !this.size_ ? this.iconImage_.getSize() : this.size_;
	}
	/**
	* Get the width of the icon (in pixels). Will return undefined when the icon image is not yet loaded.
	* @return {number} Icon width (in pixels).
	* @api
	*/
	getWidth() {
		const scale = this.getScaleArray();
		if (this.size_) return this.size_[0] * scale[0];
		if (this.iconImage_.getImageState() == ImageState_default.LOADED) return this.iconImage_.getSize()[0] * scale[0];
	}
	/**
	* Get the height of the icon (in pixels). Will return undefined when the icon image is not yet loaded.
	* @return {number} Icon height (in pixels).
	* @api
	*/
	getHeight() {
		const scale = this.getScaleArray();
		if (this.size_) return this.size_[1] * scale[1];
		if (this.iconImage_.getImageState() == ImageState_default.LOADED) return this.iconImage_.getSize()[1] * scale[1];
	}
	/**
	* Set the scale.
	*
	* @param {number|import("../size.js").Size} scale Scale.
	* @api
	*/
	setScale(scale) {
		delete this.initialOptions_;
		super.setScale(scale);
	}
	/**
	* @param {function(import("../events/Event.js").default): void} listener Listener function.
	*/
	listenImageChange(listener) {
		this.iconImage_.addEventListener(EventType_default$2.CHANGE, listener);
	}
	/**
	* Load not yet loaded URI.
	* When rendering a feature with an icon style, the vector renderer will
	* automatically call this method. However, you might want to call this
	* method yourself for preloading or other purposes.
	* @api
	*/
	load() {
		this.iconImage_.load();
	}
	/**
	* @param {function(import("../events/Event.js").default): void} listener Listener function.
	*/
	unlistenImageChange(listener) {
		this.iconImage_.removeEventListener(EventType_default$2.CHANGE, listener);
	}
	ready() {
		return this.iconImage_.ready();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/expr/expression.js
/**
* @module ol/expr/expression
*/
/**
* @fileoverview This module includes types and functions for parsing array encoded expressions.
* The result of parsing an encoded expression is one of the specific expression classes.
* During parsing, information is added to the parsing context about the data accessed by the
* expression.
*/
/**
* Base type used for literal style parameters; can be a number literal or the output of an operator,
* which in turns takes {@link import("./expression.js").ExpressionValue} arguments.
*
* See below for details on the available operators (with notes for those that are WebGL or Canvas only).
*
* * Reading operators:
*   * `['band', bandIndex, xOffset, yOffset]` For tile layers only. Fetches pixel values from band
*     `bandIndex` of the source's data. The first `bandIndex` of the source data is `1`. Fetched values
*     are in the 0..1 range. {@link import("../source/TileImage.js").default} sources have 4 bands: red,
*     green, blue and alpha. {@link import("../source/DataTile.js").default} sources can have any number
*     of bands, depending on the underlying data source and
*     {@link import("../source/GeoTIFF.js").Options configuration}. `xOffset` and `yOffset` are optional
*     and allow specifying pixel offsets for x and y. This is used for sampling data from neighboring pixels (WebGL only).
*   * `['get', 'attributeName', typeHint]` fetches a feature property value, similar to `feature.get('attributeName')`
*     A type hint can optionally be specified, in case the resulting expression contains a type ambiguity which
*     will make it invalid. Type hints can be one of: 'string', 'color', 'number', 'boolean', 'number[]'
*   * `['geometry-type']` returns a feature's geometry type as string, either: 'LineString', 'Point' or 'Polygon'
*     `Multi*` values are returned as their singular equivalent
*     `Circle` geometries are returned as 'Polygon'
*     `GeometryCollection` geometries are returned as the type of the first geometry found in the collection (WebGL only).
*   * `['resolution']` returns the current resolution
*   * `['time']` The time in seconds since the creation of the layer (WebGL only).
*   * `['var', 'varName']` fetches a value from the style variables; will throw an error if that variable is undefined
*   * `['zoom']` The current zoom level (WebGL only).
*
* * Math operators:
*   * `['*', value1, value2, ...]` multiplies the values (either numbers or colors)
*   * `['/', value1, value2]` divides `value1` by `value2`
*   * `['+', value1, value2, ...]` adds the values
*   * `['-', value1, value2]` subtracts `value2` from `value1`
*   * `['clamp', value, low, high]` clamps `value` between `low` and `high`
*   * `['%', value1, value2]` returns the result of `value1 % value2` (modulo)
*   * `['^', value1, value2]` returns the value of `value1` raised to the `value2` power
*   * `['abs', value1]` returns the absolute value of `value1`
*   * `['floor', value1]` returns the nearest integer less than or equal to `value1`
*   * `['round', value1]` returns the nearest integer to `value1`
*   * `['ceil', value1]` returns the nearest integer greater than or equal to `value1`
*   * `['sin', value1]` returns the sine of `value1`
*   * `['cos', value1]` returns the cosine of `value1`
*   * `['atan', value1, value2]` returns `atan2(value1, value2)`. If `value2` is not provided, returns `atan(value1)`
*   * `['sqrt', value1]` returns the square root of `value1`
*
* * Transform operators:
*   * `['case', condition1, output1, ...conditionN, outputN, fallback]` selects the first output whose corresponding
*     condition evaluates to `true`. If no match is found, returns the `fallback` value.
*     All conditions should be `boolean`, output and fallback can be any kind.
*   * `['match', input, match1, output1, ...matchN, outputN, fallback]` compares the `input` value against all
*     provided `matchX` values, returning the output associated with the first valid match. If no match is found,
*     returns the `fallback` value.
*     `input` and `matchX` values must all be of the same type, and can be `number` or `string`. `outputX` and
*     `fallback` values must be of the same type, and can be of any kind.
*   * `['interpolate', interpolation, input, stop1, output1, ...stopN, outputN]` returns a value by interpolating between
*     pairs of inputs and outputs; `interpolation` can either be `['linear']` or `['exponential', base]` where `base` is
*     the rate of increase from stop A to stop B (i.e. power to which the interpolation ratio is raised); a value
*     of 1 is equivalent to `['linear']`.
*     `input` and `stopX` values must all be of type `number`. `outputX` values can be `number` or `color` values.
*     Note: `input` will be clamped between `stop1` and `stopN`, meaning that all output values will be comprised
*     between `output1` and `outputN`.
*   * `['string', value1, value2, ...]` returns the first value in the list that evaluates to a string.
*     An example would be to provide a default value for get: `['string', ['get', 'propertyname'], 'default value']]`
*     (Canvas only).
*   * `['number', value1, value2, ...]` returns the first value in the list that evaluates to a number.
*     An example would be to provide a default value for get: `['string', ['get', 'propertyname'], 42]]`
*     (Canvas only).
*   * `['coalesce', value1, value2, ...]` returns the first value in the list which is not null or undefined.
*     An example would be to provide a default value for get: `['coalesce', ['get','propertyname'], 'default value']]`
*     (Canvas only).
*
* * Logical operators:
*   * `['<', value1, value2]` returns `true` if `value1` is strictly lower than `value2`, or `false` otherwise.
*   * `['<=', value1, value2]` returns `true` if `value1` is lower than or equals `value2`, or `false` otherwise.
*   * `['>', value1, value2]` returns `true` if `value1` is strictly greater than `value2`, or `false` otherwise.
*   * `['>=', value1, value2]` returns `true` if `value1` is greater than or equals `value2`, or `false` otherwise.
*   * `['==', value1, value2]` returns `true` if `value1` equals `value2`, or `false` otherwise.
*   * `['!=', value1, value2]` returns `true` if `value1` does not equal `value2`, or `false` otherwise.
*   * `['!', value1]` returns `false` if `value1` is `true` or greater than `0`, or `true` otherwise.
*   * `['all', value1, value2, ...]` returns `true` if all the inputs are `true`, `false` otherwise.
*   * `['any', value1, value2, ...]` returns `true` if any of the inputs are `true`, `false` otherwise.
*   * `['between', value1, value2, value3]` returns `true` if `value1` is contained between `value2` and `value3`
*     (inclusively), or `false` otherwise.
*   * `['in', needle, haystack]` returns `true` if `needle` is found in `haystack`, and
*     `false` otherwise.
*     This operator has the following limitations:
*     * `haystack` has to be an array of numbers or strings (searching for a substring in a string is not supported yet)
*     * Only literal arrays are supported as `haystack` for now; this means that `haystack` cannot be the result of an
*     expression. If `haystack` is an array of strings, use the `literal` operator to disambiguate from an expression:
*     `['literal', ['abc', 'def', 'ghi']]`
*
* * Conversion operators:
*   * `['array', value1, ...valueN]` creates a numerical array from `number` values; please note that the amount of
*     values can currently only be 2, 3 or 4 (WebGL only).
*   * `['color', red, green, blue, alpha]` or `['color', shade, alpha]` creates a `color` value from `number` values;
*     the `alpha` parameter is optional; if not specified, it will be set to 1 (WebGL only).
*     Note: `red`, `green` and `blue` or `shade` components must be values between 0 and 255; `alpha` between 0 and 1.
*   * `['palette', index, colors]` picks a `color` value from an array of colors using the given index; the `index`
*     expression must evaluate to a number; the items in the `colors` array must be strings with hex colors
*     (e.g. `'#86A136'`), colors using the rgba[a] functional notation (e.g. `'rgb(134, 161, 54)'` or `'rgba(134, 161, 54, 1)'`),
*     named colors (e.g. `'red'`), or array literals with 3 ([r, g, b]) or 4 ([r, g, b, a]) values (with r, g, and b
*     in the 0-255 range and a in the 0-1 range) (WebGL only).
*   * `['to-string', value]` converts the input value to a string. If the input is a boolean, the result is "true" or "false".
*     If the input is a number, it is converted to a string as specified by the "NumberToString" algorithm of the ECMAScript
*     Language Specification. If the input is a color, it is converted to a string of the form "rgba(r,g,b,a)". (Canvas only)
*
* Values can either be literals or another operator, as they will be evaluated recursively.
* Literal values can be of the following types:
* * `boolean`
* * `number`
* * `number[]` (number arrays can only have a length of 2, 3 or 4)
* * `string`
* * {@link module:ol/color~Color}
*
* @typedef {Array<*>|import("../color.js").Color|string|number|boolean} ExpressionValue
* @api
*/
var numTypes = 0;
var BooleanType = 1 << numTypes++;
var NumberType = 1 << numTypes++;
var StringType = 1 << numTypes++;
var ColorType = 1 << numTypes++;
var NumberArrayType = 1 << numTypes++;
var SizeType = 1 << numTypes++;
var AnyType = Math.pow(2, numTypes) - 1;
var typeNames = {
	[BooleanType]: "boolean",
	[NumberType]: "number",
	[StringType]: "string",
	[ColorType]: "color",
	[NumberArrayType]: "number[]",
	[SizeType]: "size"
};
var namedTypes = Object.keys(typeNames).map(Number).sort(ascending);
/**
* Get a string representation for a type.
* @param {number} type The type.
* @return {string} The type name.
*/
function typeName(type) {
	const names = [];
	for (const namedType of namedTypes) if (includesType(type, namedType)) names.push(typeNames[namedType]);
	if (names.length === 0) return "untyped";
	if (names.length < 3) return names.join(" or ");
	return names.slice(0, -1).join(", ") + ", or " + names[names.length - 1];
}
/**
* @param {number} broad The broad type.
* @param {number} specific The specific type.
* @return {boolean} The broad type includes the specific type.
*/
function includesType(broad, specific) {
	return (broad & specific) === specific;
}
/**
* @param {number} oneType One type.
* @param {number} otherType Another type.
* @return {boolean} The set of types overlap (share a common specific type)
*/
function overlapsType(oneType, otherType) {
	return !!(oneType & otherType);
}
/**
* @param {number} type The type.
* @param {number} expected The expected type.
* @return {boolean} The given type is exactly the expected type.
*/
function isType(type, expected) {
	return type === expected;
}
/**
* @typedef {boolean|number|string|Array<number>} LiteralValue
*/
var LiteralExpression = class {
	/**
	* @param {number} type The value type.
	* @param {LiteralValue} value The literal value.
	*/
	constructor(type, value) {
		this.type = type;
		this.value = value;
	}
};
var CallExpression = class {
	/**
	* @param {number} type The return type.
	* @param {string} operator The operator.
	* @param {...Expression} args The arguments.
	*/
	constructor(type, operator, ...args) {
		this.type = type;
		this.operator = operator;
		this.args = args;
	}
};
/**
* @typedef {LiteralExpression|CallExpression} Expression
*/
/**
* @typedef {Object} ParsingContext
* @property {Set<string>} variables Variables referenced with the 'var' operator.
* @property {Set<string>} properties Properties referenced with the 'get' operator.
* @property {boolean} featureId The style uses the feature id.
* @property {boolean} geometryType The style uses the feature geometry type.
* @property {import("../style/flat.js").FlatStyle|import("../style/webgl.js").WebGLStyle} style The style being parsed
*/
/**
* @return {ParsingContext} A new parsing context.
*/
function newParsingContext() {
	return {
		variables: /* @__PURE__ */ new Set(),
		properties: /* @__PURE__ */ new Set(),
		featureId: false,
		geometryType: false,
		style: {}
	};
}
/**
* @param {string} typeHint Type hint
* @return {number} Resulting value type (will be a single type)
*/
function getTypeFromHint(typeHint) {
	switch (typeHint) {
		case "string": return StringType;
		case "color": return ColorType;
		case "number": return NumberType;
		case "boolean": return BooleanType;
		case "number[]": return NumberArrayType;
		default: throw new Error(`Unrecognized type hint: ${typeHint}`);
	}
}
/**
* @typedef {LiteralValue|Array} EncodedExpression
*/
/**
* @param {EncodedExpression} encoded The encoded expression.
* @param {ParsingContext} context The parsing context.
* @param {number} [typeHint] Optional type hint
* @return {Expression} The parsed expression result.
*/
function parse(encoded, context, typeHint) {
	switch (typeof encoded) {
		case "boolean": return new LiteralExpression(BooleanType, encoded);
		case "number": return new LiteralExpression(typeHint === SizeType ? SizeType : NumberType, encoded);
		case "string": {
			let type = StringType;
			if (isStringColor(encoded)) type |= ColorType;
			if (!isType(type & typeHint, 0)) type &= typeHint;
			return new LiteralExpression(type, encoded);
		}
	}
	if (!Array.isArray(encoded)) throw new Error("Expression must be an array or a primitive value");
	if (encoded.length === 0) throw new Error("Empty expression");
	if (typeof encoded[0] === "string") return parseCallExpression(encoded, context, typeHint);
	for (const item of encoded) if (typeof item !== "number") throw new Error("Expected an array of numbers");
	let type = NumberArrayType;
	if (encoded.length === 2) type |= SizeType;
	else if (encoded.length === 3 || encoded.length === 4) type |= ColorType;
	if (typeHint) type &= typeHint;
	return new LiteralExpression(type, encoded);
}
/**
* @type {Object<string, string>}
*/
var Ops = {
	Get: "get",
	Var: "var",
	Concat: "concat",
	GeometryType: "geometry-type",
	Any: "any",
	All: "all",
	Not: "!",
	Resolution: "resolution",
	Zoom: "zoom",
	Time: "time",
	Equal: "==",
	NotEqual: "!=",
	GreaterThan: ">",
	GreaterThanOrEqualTo: ">=",
	LessThan: "<",
	LessThanOrEqualTo: "<=",
	Multiply: "*",
	Divide: "/",
	Add: "+",
	Subtract: "-",
	Clamp: "clamp",
	Mod: "%",
	Pow: "^",
	Abs: "abs",
	Floor: "floor",
	Ceil: "ceil",
	Round: "round",
	Sin: "sin",
	Cos: "cos",
	Atan: "atan",
	Sqrt: "sqrt",
	Match: "match",
	Between: "between",
	Interpolate: "interpolate",
	Coalesce: "coalesce",
	Case: "case",
	In: "in",
	Number: "number",
	String: "string",
	Array: "array",
	Color: "color",
	Id: "id",
	Band: "band",
	Palette: "palette",
	ToString: "to-string"
};
/**
* @typedef {function(Array, ParsingContext, number):Expression} Parser
* Third argument is a type hint
*/
/**
* @type {Object<string, Parser>}
*/
var parsers = {
	[Ops.Get]: createParser(([_, typeHint]) => {
		if (typeHint !== void 0) return getTypeFromHint(
			/** @type {LiteralExpression} */
			typeHint.value
		);
		return AnyType;
	}, withArgsCount(1, 2), withGetArgs),
	[Ops.Var]: createParser(([firstArg]) => firstArg.type, withArgsCount(1, 1), withVarArgs),
	[Ops.Id]: createParser(NumberType | StringType, withNoArgs, usesFeatureId),
	[Ops.Concat]: createParser(StringType, withArgsCount(2, Infinity), parseArgsOfType(AnyType)),
	[Ops.GeometryType]: createParser(StringType, withNoArgs, usesGeometryType),
	[Ops.Resolution]: createParser(NumberType, withNoArgs),
	[Ops.Zoom]: createParser(NumberType, withNoArgs),
	[Ops.Time]: createParser(NumberType, withNoArgs),
	[Ops.Any]: createParser(BooleanType, withArgsCount(2, Infinity), parseArgsOfType(BooleanType)),
	[Ops.All]: createParser(BooleanType, withArgsCount(2, Infinity), parseArgsOfType(BooleanType)),
	[Ops.Not]: createParser(BooleanType, withArgsCount(1, 1), parseArgsOfType(BooleanType)),
	[Ops.Equal]: createParser(BooleanType, withArgsCount(2, 2), parseArgsOfType(AnyType), narrowArgsType),
	[Ops.NotEqual]: createParser(BooleanType, withArgsCount(2, 2), parseArgsOfType(AnyType), narrowArgsType),
	[Ops.GreaterThan]: createParser(BooleanType, withArgsCount(2, 2), parseArgsOfType(AnyType), narrowArgsType),
	[Ops.GreaterThanOrEqualTo]: createParser(BooleanType, withArgsCount(2, 2), parseArgsOfType(AnyType), narrowArgsType),
	[Ops.LessThan]: createParser(BooleanType, withArgsCount(2, 2), parseArgsOfType(AnyType), narrowArgsType),
	[Ops.LessThanOrEqualTo]: createParser(BooleanType, withArgsCount(2, 2), parseArgsOfType(AnyType), narrowArgsType),
	[Ops.Multiply]: createParser((parsedArgs) => {
		let outputType = NumberType | ColorType;
		for (let i = 0; i < parsedArgs.length; i++) outputType &= parsedArgs[i].type;
		return outputType;
	}, withArgsCount(2, Infinity), parseArgsOfType(NumberType | ColorType), narrowArgsType),
	[Ops.Coalesce]: createParser((parsedArgs) => {
		let type = AnyType;
		for (let i = 1; i < parsedArgs.length; i += 2) type &= parsedArgs[i].type;
		type &= parsedArgs[parsedArgs.length - 1].type;
		return type;
	}, withArgsCount(2, Infinity), parseArgsOfType(AnyType), narrowArgsType),
	[Ops.Divide]: createParser(NumberType, withArgsCount(2, 2), parseArgsOfType(NumberType)),
	[Ops.Add]: createParser(NumberType, withArgsCount(2, Infinity), parseArgsOfType(NumberType)),
	[Ops.Subtract]: createParser(NumberType, withArgsCount(2, 2), parseArgsOfType(NumberType)),
	[Ops.Clamp]: createParser(NumberType, withArgsCount(3, 3), parseArgsOfType(NumberType)),
	[Ops.Mod]: createParser(NumberType, withArgsCount(2, 2), parseArgsOfType(NumberType)),
	[Ops.Pow]: createParser(NumberType, withArgsCount(2, 2), parseArgsOfType(NumberType)),
	[Ops.Abs]: createParser(NumberType, withArgsCount(1, 1), parseArgsOfType(NumberType)),
	[Ops.Floor]: createParser(NumberType, withArgsCount(1, 1), parseArgsOfType(NumberType)),
	[Ops.Ceil]: createParser(NumberType, withArgsCount(1, 1), parseArgsOfType(NumberType)),
	[Ops.Round]: createParser(NumberType, withArgsCount(1, 1), parseArgsOfType(NumberType)),
	[Ops.Sin]: createParser(NumberType, withArgsCount(1, 1), parseArgsOfType(NumberType)),
	[Ops.Cos]: createParser(NumberType, withArgsCount(1, 1), parseArgsOfType(NumberType)),
	[Ops.Atan]: createParser(NumberType, withArgsCount(1, 2), parseArgsOfType(NumberType)),
	[Ops.Sqrt]: createParser(NumberType, withArgsCount(1, 1), parseArgsOfType(NumberType)),
	[Ops.Match]: createParser((parsedArgs) => {
		let type = AnyType;
		for (let i = 2; i < parsedArgs.length; i += 2) type &= parsedArgs[i].type;
		type &= parsedArgs[parsedArgs.length - 1].type;
		return type;
	}, withArgsCount(4, Infinity), withEvenArgs, parseMatchArgs),
	[Ops.Between]: createParser(BooleanType, withArgsCount(3, 3), parseArgsOfType(NumberType)),
	[Ops.Interpolate]: createParser((parsedArgs) => {
		let type = ColorType | NumberType;
		for (let i = 3; i < parsedArgs.length; i += 2) type &= parsedArgs[i].type;
		return type;
	}, withArgsCount(6, Infinity), withEvenArgs, parseInterpolateArgs),
	[Ops.Case]: createParser((parsedArgs) => {
		let type = AnyType;
		for (let i = 1; i < parsedArgs.length; i += 2) type &= parsedArgs[i].type;
		type &= parsedArgs[parsedArgs.length - 1].type;
		return type;
	}, withArgsCount(3, Infinity), withOddArgs, parseCaseArgs),
	[Ops.In]: createParser(BooleanType, withArgsCount(2, 2), parseInArgs),
	[Ops.Number]: createParser(NumberType, withArgsCount(1, Infinity), parseArgsOfType(AnyType)),
	[Ops.String]: createParser(StringType, withArgsCount(1, Infinity), parseArgsOfType(AnyType)),
	[Ops.Array]: createParser((parsedArgs) => {
		return parsedArgs.length === 2 ? NumberArrayType | SizeType : parsedArgs.length === 3 || parsedArgs.length === 4 ? NumberArrayType | ColorType : NumberArrayType;
	}, withArgsCount(1, Infinity), parseArgsOfType(NumberType)),
	[Ops.Color]: createParser(ColorType, withArgsCount(1, 4), parseArgsOfType(NumberType)),
	[Ops.Band]: createParser(NumberType, withArgsCount(1, 3), parseArgsOfType(NumberType)),
	[Ops.Palette]: createParser(ColorType, withArgsCount(2, 2), parsePaletteArgs),
	[Ops.ToString]: createParser(StringType, withArgsCount(1, 1), parseArgsOfType(BooleanType | NumberType | StringType | ColorType))
};
/**
* @typedef {function(Array<EncodedExpression>, ParsingContext, Array<Expression>, number?):Array<Expression>|void} ArgValidator
* An argument validator applies various checks to an encoded expression arguments
* Returns the parsed arguments if any.
* Third argument is the array of parsed arguments from previous validators
* Fourth argument is an optional type hint
*/
/**
* @type ArgValidator
*/
function withGetArgs(encoded, context) {
	const arg = parse(encoded[1], context);
	if (!(arg instanceof LiteralExpression)) throw new Error("Expected a literal argument for get operation");
	if (typeof arg.value !== "string") throw new Error("Expected a string argument for get operation");
	context.properties.add(arg.value);
	if (encoded.length === 3) return [arg, parse(encoded[2], context)];
	return [arg];
}
/**
* @type ArgValidator
*/
function withVarArgs(encoded, context, parsedArgs, typeHint) {
	const varName = encoded[1];
	if (typeof varName !== "string") throw new Error("Expected a string argument for var operation");
	context.variables.add(varName);
	if (!("variables" in context.style) || context.style.variables[varName] === void 0) return [new LiteralExpression(AnyType, varName)];
	const initialValue = context.style.variables[varName];
	const arg = parse(initialValue, context);
	arg.value = varName;
	if (typeHint && !overlapsType(typeHint, arg.type)) throw new Error(`The variable ${varName} has type ${typeName(arg.type)} but the following type was expected: ${typeName(typeHint)}`);
	return [arg];
}
/**
* @type ArgValidator
*/
function usesFeatureId(encoded, context) {
	context.featureId = true;
}
/**
* @type ArgValidator
*/
function usesGeometryType(encoded, context) {
	context.geometryType = true;
}
/**
* @type ArgValidator
*/
function withNoArgs(encoded, context) {
	const operation = encoded[0];
	if (encoded.length !== 1) throw new Error(`Expected no arguments for ${operation} operation`);
	return [];
}
/**
* @param {number} minArgs The minimum number of arguments.
* @param {number} maxArgs The maximum number of arguments.
* @return {ArgValidator} The argument validator
*/
function withArgsCount(minArgs, maxArgs) {
	return function(encoded, context) {
		const operation = encoded[0];
		const argCount = encoded.length - 1;
		if (minArgs === maxArgs) {
			if (argCount !== minArgs) throw new Error(`Expected ${minArgs} argument${minArgs === 1 ? "" : "s"} for ${operation}, got ${argCount}`);
		} else if (argCount < minArgs || argCount > maxArgs) {
			const range = maxArgs === Infinity ? `${minArgs} or more` : `${minArgs} to ${maxArgs}`;
			throw new Error(`Expected ${range} arguments for ${operation}, got ${argCount}`);
		}
	};
}
/**
* @param {number} argType The argument type.
* @return {ArgValidator} The argument validator
*/
function parseArgsOfType(argType) {
	return function(encoded, context) {
		const operation = encoded[0];
		const argCount = encoded.length - 1;
		/**
		* @type {Array<Expression>}
		*/
		const args = new Array(argCount);
		for (let i = 0; i < argCount; ++i) {
			const expression = parse(encoded[i + 1], context);
			if (!overlapsType(argType, expression.type)) {
				const gotType = typeName(argType);
				const expectedType = typeName(expression.type);
				throw new Error(`Unexpected type for argument ${i} of ${operation} operation, got ${gotType} but expected ${expectedType}`);
			}
			expression.type &= argType;
			args[i] = expression;
		}
		return args;
	};
}
/**
* @type {ArgValidator}
*/
function narrowArgsType(encoded, context, parsedArgs) {
	const operation = encoded[0];
	const argCount = encoded.length - 1;
	let sameType = AnyType;
	for (let i = 0; i < parsedArgs.length; ++i) sameType &= parsedArgs[i].type;
	if (sameType === 0) throw new Error(`No common type could be found for arguments of ${operation} operation`);
	const args = new Array(argCount);
	for (let i = 0; i < argCount; ++i) args[i] = parse(encoded[i + 1], context, sameType);
	return args;
}
/**
* @type {ArgValidator}
*/
function withOddArgs(encoded, context) {
	const operation = encoded[0];
	const argCount = encoded.length - 1;
	if (argCount % 2 === 0) throw new Error(`An odd amount of arguments was expected for operation ${operation}, got ${JSON.stringify(argCount)} instead`);
}
/**
* @type {ArgValidator}
*/
function withEvenArgs(encoded, context) {
	const operation = encoded[0];
	const argCount = encoded.length - 1;
	if (argCount % 2 === 1) throw new Error(`An even amount of arguments was expected for operation ${operation}, got ${JSON.stringify(argCount)} instead`);
}
/**
* @type ArgValidator
*/
function parseMatchArgs(encoded, context, parsedArgs, typeHint) {
	const argsCount = encoded.length - 1;
	let inputType = parse(encoded[1], context).type;
	const fallback = parse(encoded[encoded.length - 1], context);
	let outputType = typeHint !== void 0 ? typeHint & fallback.type : fallback.type;
	const args = new Array(argsCount - 2);
	for (let i = 0; i < argsCount - 2; i += 2) {
		const match = parse(encoded[i + 2], context);
		const output = parse(encoded[i + 3], context);
		inputType &= match.type;
		outputType &= output.type;
		args[i] = match;
		args[i + 1] = output;
	}
	const expectedInputType = StringType | NumberType | BooleanType;
	if (!overlapsType(expectedInputType, inputType)) throw new Error(`Expected an input of type ${typeName(expectedInputType)} for the interpolate operation, got ${typeName(inputType)} instead`);
	inputType &= expectedInputType;
	if (isType(outputType, 0)) throw new Error(`Could not find a common output type for the following match operation: ` + JSON.stringify(encoded));
	for (let i = 0; i < argsCount - 2; i += 2) {
		const match = parse(encoded[i + 2], context, inputType);
		const output = parse(encoded[i + 3], context, outputType);
		args[i] = match;
		args[i + 1] = output;
	}
	return [
		parse(encoded[1], context, inputType),
		...args,
		parse(encoded[encoded.length - 1], context, outputType)
	];
}
/**
* @type ArgValidator
*/
function parseInterpolateArgs(encoded, context, parsedArgs, typeHint) {
	const interpolationType = encoded[1];
	let interpolation;
	switch (interpolationType[0]) {
		case "linear":
			interpolation = 1;
			break;
		case "exponential":
			interpolation = interpolationType[1];
			if (typeof interpolation !== "number") throw new Error(`Expected a number base for exponential interpolation, got ${JSON.stringify(interpolation)} instead`);
			break;
		default: interpolation = null;
	}
	if (!interpolation) throw new Error(`Invalid interpolation type: ${JSON.stringify(interpolationType)}`);
	interpolation = parse(interpolation, context);
	let input = parse(encoded[2], context);
	if (!overlapsType(NumberType, input.type)) throw new Error(`Expected an input of type number for the interpolate operation, got ${typeName(input.type)} instead`);
	input = parse(encoded[2], context, NumberType);
	const args = new Array(encoded.length - 3);
	for (let i = 0; i < args.length; i += 2) {
		let stop = parse(encoded[i + 3], context);
		if (!overlapsType(NumberType, stop.type)) throw new Error(`Expected all stop input values in the interpolate operation to be of type number, got ${typeName(stop.type)} at position ${i + 2} instead`);
		let output = parse(encoded[i + 4], context);
		if (!overlapsType(NumberType | ColorType, output.type)) throw new Error(`Expected all stop output values in the interpolate operation to be a number or color, got ${typeName(output.type)} at position ${i + 3} instead`);
		stop = parse(encoded[i + 3], context, NumberType);
		output = parse(encoded[i + 4], context, NumberType | ColorType);
		args[i] = stop;
		args[i + 1] = output;
	}
	return [
		interpolation,
		input,
		...args
	];
}
/**
* @type ArgValidator
*/
function parseCaseArgs(encoded, context, parsedArgs, typeHint) {
	const fallback = parse(encoded[encoded.length - 1], context, typeHint);
	let outputType = typeHint !== void 0 ? typeHint & fallback.type : fallback.type;
	const args = new Array(encoded.length - 1);
	for (let i = 0; i < args.length - 1; i += 2) {
		const condition = parse(encoded[i + 1], context);
		const output = parse(encoded[i + 2], context, typeHint);
		if (!overlapsType(BooleanType, condition.type)) throw new Error(`Expected all conditions in the case operation to be of type boolean, got ${typeName(condition.type)} at position ${i} instead`);
		outputType &= output.type;
		args[i] = condition;
		args[i + 1] = output;
	}
	if (isType(outputType, 0)) throw new Error(`Could not find a common output type for the following case operation: ` + JSON.stringify(encoded));
	for (let i = 0; i < args.length - 1; i += 2) args[i + 1] = parse(encoded[i + 2], context, outputType);
	args[args.length - 1] = parse(encoded[encoded.length - 1], context, outputType);
	return args;
}
/**
* @type ArgValidator
*/
function parseInArgs(encoded, context) {
	/** @type {Array<number|string>} */
	let haystack = encoded[2];
	if (!Array.isArray(haystack)) throw new Error(`The "in" operator was provided a literal value which was not an array as second argument.`);
	if (typeof haystack[0] === "string") {
		if (haystack[0] !== "literal") throw new Error(`For the "in" operator, a string array should be wrapped in a "literal" operator to disambiguate from expressions.`);
		if (!Array.isArray(haystack[1])) throw new Error(`The "in" operator was provided a literal value which was not an array as second argument.`);
		haystack = haystack[1];
	}
	let needleType = StringType | NumberType;
	const args = new Array(haystack.length);
	for (let i = 0; i < args.length; i++) {
		const arg = parse(haystack[i], context);
		needleType &= arg.type;
		args[i] = arg;
	}
	if (isType(needleType, 0)) throw new Error(`Could not find a common type for the following in operation: ` + JSON.stringify(encoded));
	return [parse(encoded[1], context, needleType), ...args];
}
/**
* @type ArgValidator
*/
function parsePaletteArgs(encoded, context) {
	const index = parse(encoded[1], context, NumberType);
	if (index.type !== NumberType) throw new Error(`The first argument of palette must be an number, got ${typeName(index.type)} instead`);
	const colors = encoded[2];
	if (!Array.isArray(colors)) throw new Error("The second argument of palette must be an array");
	const parsedColors = new Array(colors.length);
	for (let i = 0; i < parsedColors.length; i++) {
		const color = parse(colors[i], context, ColorType);
		if (!(color instanceof LiteralExpression)) throw new Error(`The palette color at index ${i} must be a literal value`);
		if (!overlapsType(color.type, ColorType)) throw new Error(`The palette color at index ${i} should be of type color, got ${typeName(color.type)} instead`);
		parsedColors[i] = color;
	}
	return [index, ...parsedColors];
}
/**
* @param {number|function(Array<Expression>):number} returnType The return type of the operator; can be a fixed value or a callback taking the parsed
* arguments
* @param {Array<ArgValidator>} argValidators A chain of argument validators; the return value of the last validator
* will be used as parsed arguments
* @return {Parser} The parser.
*/
function createParser(returnType, ...argValidators) {
	return function(encoded, context, typeHint) {
		const operator = encoded[0];
		let parsedArgs = [];
		for (let i = 0; i < argValidators.length; i++) parsedArgs = argValidators[i](encoded, context, parsedArgs, typeHint) || parsedArgs;
		let actualType = typeof returnType === "function" ? returnType(parsedArgs) : returnType;
		if (typeHint !== void 0) {
			if (!overlapsType(actualType, typeHint)) throw new Error(`The following expression was expected to return ${typeName(typeHint)}, but returns ${typeName(actualType)} instead: ${JSON.stringify(encoded)}`);
			actualType &= typeHint;
		}
		if (actualType === 0) throw new Error(`No matching type was found for the following expression: ${JSON.stringify(encoded)}`);
		return new CallExpression(actualType, operator, ...parsedArgs);
	};
}
/**
* @param {Array} encoded The encoded expression.
* @param {ParsingContext} context The parsing context.
* @param {number} [typeHint] Optional type hint
* @return {Expression} The parsed expression.
*/
function parseCallExpression(encoded, context, typeHint) {
	const operator = encoded[0];
	const parser = parsers[operator];
	if (!parser) throw new Error(`Unknown operator: ${operator}`);
	return parser(encoded, context, typeHint);
}
/**
* Returns a simplified geometry type suited for the `geometry-type` operator
* @param {import('../geom/Geometry.js').default|import('../render/Feature.js').default} geometry Geometry object
* @return {'Point'|'LineString'|'Polygon'|''} Simplified geometry type; empty string of no geometry found
*/
function computeGeometryType(geometry) {
	if (!geometry) return "";
	const type = geometry.getType();
	switch (type) {
		case "Point":
		case "LineString":
		case "Polygon": return type;
		case "MultiPoint":
		case "MultiLineString":
		case "MultiPolygon": return type.substring(5);
		case "Circle": return "Polygon";
		case "GeometryCollection": return computeGeometryType(
			/** @type {import("../geom/GeometryCollection.js").default} */
			geometry.getGeometries()[0]
		);
		default: return "";
	}
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/expr/cpu.js
/**
* @module ol/expr/cpu
*/
/**
* @fileoverview This module includes functions to build expressions for evaluation on the CPU.
* Building is composed of two steps: parsing and compiling.  The parsing step takes an encoded
* expression and returns an instance of one of the expression classes.  The compiling step takes
* the expression instance and returns a function that can be evaluated in to return a literal
* value.  The evaluator function should do as little allocation and work as possible.
*/
/**
* @typedef {Object} EvaluationContext
* @property {Object} properties The values for properties used in 'get' expressions.
* @property {Object} variables The values for variables used in 'var' expressions.
* @property {number} resolution The map resolution.
* @property {string|number|null} featureId The feature id.
* @property {string} geometryType Geometry type of the current object.
*/
/**
* @return {EvaluationContext} A new evaluation context.
*/
function newEvaluationContext() {
	return {
		variables: {},
		properties: {},
		resolution: NaN,
		featureId: null,
		geometryType: ""
	};
}
/**
* @typedef {function(EvaluationContext):import("./expression.js").LiteralValue} ExpressionEvaluator
*/
/**
* @typedef {function(EvaluationContext):boolean} BooleanEvaluator
*/
/**
* @typedef {function(EvaluationContext):number} NumberEvaluator
*/
/**
* @typedef {function(EvaluationContext):string} StringEvaluator
*/
/**
* @typedef {function(EvaluationContext):(Array<number>|string)} ColorLikeEvaluator
*/
/**
* @typedef {function(EvaluationContext):Array<number>} NumberArrayEvaluator
*/
/**
* @typedef {function(EvaluationContext):Array<number>} CoordinateEvaluator
*/
/**
* @typedef {function(EvaluationContext):(Array<number>)} SizeEvaluator
*/
/**
* @typedef {function(EvaluationContext):(Array<number>|number)} SizeLikeEvaluator
*/
/**
* @param {import('./expression.js').EncodedExpression} encoded The encoded expression.
* @param {number} type The expected type.
* @param {import('./expression.js').ParsingContext} context The parsing context.
* @return {ExpressionEvaluator} The expression evaluator.
*/
function buildExpression(encoded, type, context) {
	const expression = parse(encoded, context);
	if (!overlapsType(type, expression.type)) {
		const expected = typeName(type);
		const actual = typeName(expression.type);
		throw new Error(`Expected expression to be of type ${expected}, got ${actual}`);
	}
	return compileExpression(expression, context);
}
/**
* @param {import("./expression.js").Expression} expression The expression.
* @param {import('./expression.js').ParsingContext} context The parsing context.
* @return {ExpressionEvaluator} The evaluator function.
*/
function compileExpression(expression, context) {
	if (expression instanceof LiteralExpression) {
		if (expression.type === ColorType && typeof expression.value === "string") {
			const colorValue = fromString(expression.value);
			return function() {
				return colorValue;
			};
		}
		return function() {
			return expression.value;
		};
	}
	const operator = expression.operator;
	switch (operator) {
		case Ops.Number:
		case Ops.String:
		case Ops.Coalesce: return compileAssertionExpression(expression, context);
		case Ops.Get:
		case Ops.Var: return compileAccessorExpression(expression, context);
		case Ops.Id: return (context) => context.featureId;
		case Ops.GeometryType: return (context) => context.geometryType;
		case Ops.Concat: {
			const args = expression.args.map((e) => compileExpression(e, context));
			return (context) => "".concat(...args.map((arg) => arg(context).toString()));
		}
		case Ops.Resolution: return (context) => context.resolution;
		case Ops.Any:
		case Ops.All:
		case Ops.Between:
		case Ops.In:
		case Ops.Not: return compileLogicalExpression(expression, context);
		case Ops.Equal:
		case Ops.NotEqual:
		case Ops.LessThan:
		case Ops.LessThanOrEqualTo:
		case Ops.GreaterThan:
		case Ops.GreaterThanOrEqualTo: return compileComparisonExpression(expression, context);
		case Ops.Multiply:
		case Ops.Divide:
		case Ops.Add:
		case Ops.Subtract:
		case Ops.Clamp:
		case Ops.Mod:
		case Ops.Pow:
		case Ops.Abs:
		case Ops.Floor:
		case Ops.Ceil:
		case Ops.Round:
		case Ops.Sin:
		case Ops.Cos:
		case Ops.Atan:
		case Ops.Sqrt: return compileNumericExpression(expression, context);
		case Ops.Case: return compileCaseExpression(expression, context);
		case Ops.Match: return compileMatchExpression(expression, context);
		case Ops.Interpolate: return compileInterpolateExpression(expression, context);
		case Ops.ToString: return compileConvertExpression(expression, context);
		default: throw new Error(`Unsupported operator ${operator}`);
	}
}
/**
* @param {import('./expression.js').CallExpression} expression The call expression.
* @param {import('./expression.js').ParsingContext} context The parsing context.
* @return {ExpressionEvaluator} The evaluator function.
*/
function compileAssertionExpression(expression, context) {
	const type = expression.operator;
	const length = expression.args.length;
	const args = new Array(length);
	for (let i = 0; i < length; ++i) args[i] = compileExpression(expression.args[i], context);
	switch (type) {
		case Ops.Coalesce: return (context) => {
			for (let i = 0; i < length; ++i) {
				const value = args[i](context);
				if (typeof value !== "undefined" && value !== null) return value;
			}
			throw new Error("Expected one of the values to be non-null");
		};
		case Ops.Number:
		case Ops.String: return (context) => {
			for (let i = 0; i < length; ++i) {
				const value = args[i](context);
				if (typeof value === type) return value;
			}
			throw new Error(`Expected one of the values to be a ${type}`);
		};
		default: throw new Error(`Unsupported assertion operator ${type}`);
	}
}
/**
* @param {import('./expression.js').CallExpression} expression The call expression.
* @param {import('./expression.js').ParsingContext} context The parsing context.
* @return {ExpressionEvaluator} The evaluator function.
*/
function compileAccessorExpression(expression, context) {
	const name = expression.args[0].value;
	switch (expression.operator) {
		case Ops.Get: return (context) => context.properties[name];
		case Ops.Var: return (context) => context.variables[name];
		default: throw new Error(`Unsupported accessor operator ${expression.operator}`);
	}
}
/**
* @param {import('./expression.js').CallExpression} expression The call expression.
* @param {import('./expression.js').ParsingContext} context The parsing context.
* @return {BooleanEvaluator} The evaluator function.
*/
function compileComparisonExpression(expression, context) {
	const op = expression.operator;
	const left = compileExpression(expression.args[0], context);
	const right = compileExpression(expression.args[1], context);
	switch (op) {
		case Ops.Equal: return (context) => left(context) === right(context);
		case Ops.NotEqual: return (context) => left(context) !== right(context);
		case Ops.LessThan: return (context) => left(context) < right(context);
		case Ops.LessThanOrEqualTo: return (context) => left(context) <= right(context);
		case Ops.GreaterThan: return (context) => left(context) > right(context);
		case Ops.GreaterThanOrEqualTo: return (context) => left(context) >= right(context);
		default: throw new Error(`Unsupported comparison operator ${op}`);
	}
}
/**
* @param {import('./expression.js').CallExpression} expression The call expression.
* @param {import('./expression.js').ParsingContext} context The parsing context.
* @return {BooleanEvaluator} The evaluator function.
*/
function compileLogicalExpression(expression, context) {
	const op = expression.operator;
	const length = expression.args.length;
	const args = new Array(length);
	for (let i = 0; i < length; ++i) args[i] = compileExpression(expression.args[i], context);
	switch (op) {
		case Ops.Any: return (context) => {
			for (let i = 0; i < length; ++i) if (args[i](context)) return true;
			return false;
		};
		case Ops.All: return (context) => {
			for (let i = 0; i < length; ++i) if (!args[i](context)) return false;
			return true;
		};
		case Ops.Between: return (context) => {
			const value = args[0](context);
			const min = args[1](context);
			const max = args[2](context);
			return value >= min && value <= max;
		};
		case Ops.In: return (context) => {
			const value = args[0](context);
			for (let i = 1; i < length; ++i) if (value === args[i](context)) return true;
			return false;
		};
		case Ops.Not: return (context) => !args[0](context);
		default: throw new Error(`Unsupported logical operator ${op}`);
	}
}
/**
* @param {import('./expression.js').CallExpression} expression The call expression.
* @param {import('./expression.js').ParsingContext} context The parsing context.
* @return {NumberEvaluator} The evaluator function.
*/
function compileNumericExpression(expression, context) {
	const op = expression.operator;
	const length = expression.args.length;
	const args = new Array(length);
	for (let i = 0; i < length; ++i) args[i] = compileExpression(expression.args[i], context);
	switch (op) {
		case Ops.Multiply: return (context) => {
			let value = 1;
			for (let i = 0; i < length; ++i) value *= args[i](context);
			return value;
		};
		case Ops.Divide: return (context) => args[0](context) / args[1](context);
		case Ops.Add: return (context) => {
			let value = 0;
			for (let i = 0; i < length; ++i) value += args[i](context);
			return value;
		};
		case Ops.Subtract: return (context) => args[0](context) - args[1](context);
		case Ops.Clamp: return (context) => {
			const value = args[0](context);
			const min = args[1](context);
			if (value < min) return min;
			const max = args[2](context);
			if (value > max) return max;
			return value;
		};
		case Ops.Mod: return (context) => args[0](context) % args[1](context);
		case Ops.Pow: return (context) => Math.pow(args[0](context), args[1](context));
		case Ops.Abs: return (context) => Math.abs(args[0](context));
		case Ops.Floor: return (context) => Math.floor(args[0](context));
		case Ops.Ceil: return (context) => Math.ceil(args[0](context));
		case Ops.Round: return (context) => Math.round(args[0](context));
		case Ops.Sin: return (context) => Math.sin(args[0](context));
		case Ops.Cos: return (context) => Math.cos(args[0](context));
		case Ops.Atan:
			if (length === 2) return (context) => Math.atan2(args[0](context), args[1](context));
			return (context) => Math.atan(args[0](context));
		case Ops.Sqrt: return (context) => Math.sqrt(args[0](context));
		default: throw new Error(`Unsupported numeric operator ${op}`);
	}
}
/**
* @param {import('./expression.js').CallExpression} expression The call expression.
* @param {import('./expression.js').ParsingContext} context The parsing context.
* @return {ExpressionEvaluator} The evaluator function.
*/
function compileCaseExpression(expression, context) {
	const length = expression.args.length;
	const args = new Array(length);
	for (let i = 0; i < length; ++i) args[i] = compileExpression(expression.args[i], context);
	return (context) => {
		for (let i = 0; i < length - 1; i += 2) if (args[i](context)) return args[i + 1](context);
		return args[length - 1](context);
	};
}
/**
* @param {import('./expression.js').CallExpression} expression The call expression.
* @param {import('./expression.js').ParsingContext} context The parsing context.
* @return {ExpressionEvaluator} The evaluator function.
*/
function compileMatchExpression(expression, context) {
	const length = expression.args.length;
	const args = new Array(length);
	for (let i = 0; i < length; ++i) args[i] = compileExpression(expression.args[i], context);
	return (context) => {
		const value = args[0](context);
		for (let i = 1; i < length; i += 2) if (value === args[i](context)) return args[i + 1](context);
		return args[length - 1](context);
	};
}
/**
* @param {import('./expression.js').CallExpression} expression The call expression.
* @param {import('./expression.js').ParsingContext} context The parsing context.
* @return {ExpressionEvaluator} The evaluator function.
*/
function compileInterpolateExpression(expression, context) {
	const length = expression.args.length;
	const args = new Array(length);
	for (let i = 0; i < length; ++i) args[i] = compileExpression(expression.args[i], context);
	return (context) => {
		const base = args[0](context);
		const value = args[1](context);
		let previousInput;
		let previousOutput;
		for (let i = 2; i < length; i += 2) {
			const input = args[i](context);
			let output = args[i + 1](context);
			const isColor = Array.isArray(output);
			if (isColor) output = withAlpha(output);
			if (input >= value) {
				if (i === 2) return output;
				if (isColor) return interpolateColor(base, value, previousInput, previousOutput, input, output);
				return interpolateNumber(base, value, previousInput, previousOutput, input, output);
			}
			previousInput = input;
			previousOutput = output;
		}
		return previousOutput;
	};
}
/**
* @param {import('./expression.js').CallExpression} expression The call expression.
* @param {import('./expression.js').ParsingContext} context The parsing context.
* @return {ExpressionEvaluator} The evaluator function.
*/
function compileConvertExpression(expression, context) {
	const op = expression.operator;
	const length = expression.args.length;
	const args = new Array(length);
	for (let i = 0; i < length; ++i) args[i] = compileExpression(expression.args[i], context);
	switch (op) {
		case Ops.ToString: return (context) => {
			const value = args[0](context);
			if (expression.args[0].type === ColorType) return toString(value);
			return value.toString();
		};
		default: throw new Error(`Unsupported convert operator ${op}`);
	}
}
/**
* @param {number} base The base.
* @param {number} value The value.
* @param {number} input1 The first input value.
* @param {number} output1 The first output value.
* @param {number} input2 The second input value.
* @param {number} output2 The second output value.
* @return {number} The interpolated value.
*/
function interpolateNumber(base, value, input1, output1, input2, output2) {
	const delta = input2 - input1;
	if (delta === 0) return output1;
	const along = value - input1;
	return output1 + (base === 1 ? along / delta : (Math.pow(base, along) - 1) / (Math.pow(base, delta) - 1)) * (output2 - output1);
}
/**
* @param {number} base The base.
* @param {number} value The value.
* @param {number} input1 The first input value.
* @param {import('../color.js').Color} rgba1 The first output value.
* @param {number} input2 The second input value.
* @param {import('../color.js').Color} rgba2 The second output value.
* @return {import('../color.js').Color} The interpolated color.
*/
function interpolateColor(base, value, input1, rgba1, input2, rgba2) {
	if (input2 - input1 === 0) return rgba1;
	const lcha1 = rgbaToLcha(rgba1);
	const lcha2 = rgbaToLcha(rgba2);
	let deltaHue = lcha2[2] - lcha1[2];
	if (deltaHue > 180) deltaHue -= 360;
	else if (deltaHue < -180) deltaHue += 360;
	return normalize(lchaToRgba([
		interpolateNumber(base, value, input1, lcha1[0], input2, lcha2[0]),
		interpolateNumber(base, value, input1, lcha1[1], input2, lcha2[1]),
		lcha1[2] + interpolateNumber(base, value, input1, 0, input2, deltaHue),
		interpolateNumber(base, value, input1, rgba1[3], input2, rgba2[3])
	]));
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/render/canvas/style.js
/**
* @module ol/render/canvas/style
*/
/**
* @fileoverview This module includes functions to build styles for the canvas renderer.  Building
* is composed of two steps: parsing and compiling.  The parsing step takes an encoded expression
* and returns an instance of one of the expression classes.  The compiling step takes the
* expression instance and returns a function that can be evaluated to return a literal value.  The
* evaluator function should do as little allocation and work as possible.
*/
/**
* @typedef {import("../../style/flat.js").FlatStyle} FlatStyle
*/
/**
* @typedef {import("../../expr/expression.js").EncodedExpression} EncodedExpression
*/
/**
* @typedef {import("../../expr/expression.js").ParsingContext} ParsingContext
*/
/**
* @typedef {import("../../expr/expression.js").CallExpression} CallExpression
*/
/**
* @typedef {import("../../expr/cpu.js").EvaluationContext} EvaluationContext
*/
/**
* @typedef {import("../../expr/cpu.js").ExpressionEvaluator} ExpressionEvaluator
*/
/**
* @param {EvaluationContext} context The evaluation context.
* @return {boolean} Always true.
*/
function always$1(context) {
	return true;
}
/**
* This function adapts a rule evaluator to the existing style function interface.
* After we have deprecated the style function, we can use the compiled rules directly
* and pass a more complete evaluation context (variables, zoom, time, etc.).
*
* @param {Array<import('../../style/flat.js').Rule>} rules The rules.
* @return {import('../../style/Style.js').StyleFunction} A style function.
*/
function rulesToStyleFunction(rules) {
	const parsingContext = newParsingContext();
	const evaluator = buildRuleSet(rules, parsingContext);
	const evaluationContext = newEvaluationContext();
	return function(feature, resolution) {
		evaluationContext.properties = feature.getPropertiesInternal();
		evaluationContext.resolution = resolution;
		if (parsingContext.featureId) {
			const id = feature.getId();
			if (id !== void 0) evaluationContext.featureId = id;
			else evaluationContext.featureId = null;
		}
		if (parsingContext.geometryType) evaluationContext.geometryType = computeGeometryType(feature.getGeometry());
		return evaluator(evaluationContext);
	};
}
/**
* This function adapts a style evaluator to the existing style function interface.
* After we have deprecated the style function, we can use the compiled rules directly
* and pass a more complete evaluation context (variables, zoom, time, etc.).
*
* @param {Array<import('../../style/flat.js').FlatStyle>} flatStyles The flat styles.
* @return {import('../../style/Style.js').StyleFunction} A style function.
*/
function flatStylesToStyleFunction(flatStyles) {
	const parsingContext = newParsingContext();
	const length = flatStyles.length;
	/**
	* @type {Array<StyleEvaluator>}
	*/
	const evaluators = new Array(length);
	for (let i = 0; i < length; ++i) evaluators[i] = buildStyle(flatStyles[i], parsingContext);
	const evaluationContext = newEvaluationContext();
	/**
	* @type {Array<Style>}
	*/
	const styles = new Array(length);
	return function(feature, resolution) {
		evaluationContext.properties = feature.getPropertiesInternal();
		evaluationContext.resolution = resolution;
		if (parsingContext.featureId) {
			const id = feature.getId();
			if (id !== void 0) evaluationContext.featureId = id;
			else evaluationContext.featureId = null;
		}
		let nonNullCount = 0;
		for (let i = 0; i < length; ++i) {
			const style = evaluators[i](evaluationContext);
			if (style) {
				styles[nonNullCount] = style;
				nonNullCount += 1;
			}
		}
		styles.length = nonNullCount;
		return styles;
	};
}
/**
* @typedef {function(EvaluationContext):Array<Style>} RuleSetEvaluator
*/
/**
* @typedef {Object} CompiledRule
* @property {ExpressionEvaluator} filter The compiled filter evaluator.
* @property {Array<StyleEvaluator>} styles The list of compiled style evaluators.
*/
/**
* @param {Array<import('../../style/flat.js').Rule>} rules The rules.
* @param {ParsingContext} context The parsing context.
* @return {RuleSetEvaluator} The evaluator function.
*/
function buildRuleSet(rules, context) {
	const length = rules.length;
	/**
	* @type {Array<CompiledRule>}
	*/
	const compiledRules = new Array(length);
	for (let i = 0; i < length; ++i) {
		const rule = rules[i];
		const filter = "filter" in rule ? buildExpression(rule.filter, BooleanType, context) : always$1;
		/**
		* @type {Array<StyleEvaluator>}
		*/
		let styles;
		if (Array.isArray(rule.style)) {
			const styleLength = rule.style.length;
			styles = new Array(styleLength);
			for (let j = 0; j < styleLength; ++j) styles[j] = buildStyle(rule.style[j], context);
		} else styles = [buildStyle(rule.style, context)];
		compiledRules[i] = {
			filter,
			styles
		};
	}
	return function(context) {
		/**
		* @type {Array<Style>}
		*/
		const styles = [];
		let someMatched = false;
		for (let i = 0; i < length; ++i) {
			const filterEvaluator = compiledRules[i].filter;
			if (!filterEvaluator(context)) continue;
			if (rules[i].else && someMatched) continue;
			someMatched = true;
			for (const styleEvaluator of compiledRules[i].styles) {
				const style = styleEvaluator(context);
				if (!style) continue;
				styles.push(style);
			}
		}
		return styles;
	};
}
/**
* @typedef {function(EvaluationContext):Style|null} StyleEvaluator
*/
/**
* @param {FlatStyle} flatStyle A flat style literal.
* @param {ParsingContext} context The parsing context.
* @return {StyleEvaluator} A function that evaluates to a style.  The style returned by
* this function will be reused between invocations.
*/
function buildStyle(flatStyle, context) {
	const evaluateFill = buildFill(flatStyle, "", context);
	const evaluateStroke = buildStroke(flatStyle, "", context);
	const evaluateText = buildText(flatStyle, context);
	const evaluateImage = buildImage(flatStyle, context);
	const evaluateZIndex = numberEvaluator(flatStyle, "z-index", context);
	if (!evaluateFill && !evaluateStroke && !evaluateText && !evaluateImage && !isEmpty(flatStyle)) throw new Error("No fill, stroke, point, or text symbolizer properties in style: " + JSON.stringify(flatStyle));
	const style = new Style();
	return function(context) {
		let empty = true;
		if (evaluateFill) {
			const fill = evaluateFill(context);
			if (fill) empty = false;
			style.setFill(fill);
		}
		if (evaluateStroke) {
			const stroke = evaluateStroke(context);
			if (stroke) empty = false;
			style.setStroke(stroke);
		}
		if (evaluateText) {
			const text = evaluateText(context);
			if (text) empty = false;
			style.setText(text);
		}
		if (evaluateImage) {
			const image = evaluateImage(context);
			if (image) empty = false;
			style.setImage(image);
		}
		if (evaluateZIndex) style.setZIndex(evaluateZIndex(context));
		if (empty) return null;
		return style;
	};
}
/**
* @typedef {function(EvaluationContext):Fill|null} FillEvaluator
*/
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} prefix The property prefix.
* @param {ParsingContext} context The parsing context.
* @return {FillEvaluator?} A function that evaluates to a fill.
*/
function buildFill(flatStyle, prefix, context) {
	let evaluateColor;
	if (prefix + "fill-pattern-src" in flatStyle) evaluateColor = patternEvaluator(flatStyle, prefix + "fill-", context);
	else evaluateColor = colorLikeEvaluator(flatStyle, prefix + "fill-color", context);
	if (!evaluateColor) return null;
	const fill = new Fill();
	return function(context) {
		const color = evaluateColor(context);
		if (color === "none") return null;
		fill.setColor(color);
		return fill;
	};
}
/**
* @typedef {function(EvaluationContext):Stroke|null} StrokeEvaluator
*/
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} prefix The property prefix.
* @param {ParsingContext} context The parsing context.
* @return {StrokeEvaluator?} A function the evaluates to a stroke.
*/
function buildStroke(flatStyle, prefix, context) {
	const evaluateWidth = numberEvaluator(flatStyle, prefix + "stroke-width", context);
	const evaluateColor = colorLikeEvaluator(flatStyle, prefix + "stroke-color", context);
	if (!evaluateWidth && !evaluateColor) return null;
	const evaluateLineCap = stringEvaluator(flatStyle, prefix + "stroke-line-cap", context);
	const evaluateLineJoin = stringEvaluator(flatStyle, prefix + "stroke-line-join", context);
	const evaluateLineDash = numberArrayEvaluator(flatStyle, prefix + "stroke-line-dash", context);
	const evaluateLineDashOffset = numberEvaluator(flatStyle, prefix + "stroke-line-dash-offset", context);
	const evaluateMiterLimit = numberEvaluator(flatStyle, prefix + "stroke-miter-limit", context);
	const stroke = new Stroke();
	return function(context) {
		if (evaluateColor) {
			const color = evaluateColor(context);
			if (color === "none") return null;
			stroke.setColor(color);
		}
		if (evaluateWidth) stroke.setWidth(evaluateWidth(context));
		if (evaluateLineCap) {
			const lineCap = evaluateLineCap(context);
			if (lineCap !== "butt" && lineCap !== "round" && lineCap !== "square") throw new Error("Expected butt, round, or square line cap");
			stroke.setLineCap(lineCap);
		}
		if (evaluateLineJoin) {
			const lineJoin = evaluateLineJoin(context);
			if (lineJoin !== "bevel" && lineJoin !== "round" && lineJoin !== "miter") throw new Error("Expected bevel, round, or miter line join");
			stroke.setLineJoin(lineJoin);
		}
		if (evaluateLineDash) stroke.setLineDash(evaluateLineDash(context));
		if (evaluateLineDashOffset) stroke.setLineDashOffset(evaluateLineDashOffset(context));
		if (evaluateMiterLimit) stroke.setMiterLimit(evaluateMiterLimit(context));
		return stroke;
	};
}
/**
* @typedef {function(EvaluationContext):Text} TextEvaluator
*/
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {ParsingContext} context The parsing context.
* @return {TextEvaluator?} A function that evaluates to a text symbolizer.
*/
function buildText(flatStyle, context) {
	const prefix = "text-";
	const evaluateValue = stringEvaluator(flatStyle, "text-value", context);
	if (!evaluateValue) return null;
	const evaluateFill = buildFill(flatStyle, prefix, context);
	const evaluateBackgroundFill = buildFill(flatStyle, "text-background-", context);
	const evaluateStroke = buildStroke(flatStyle, prefix, context);
	const evaluateBackgroundStroke = buildStroke(flatStyle, "text-background-", context);
	const evaluateFont = stringEvaluator(flatStyle, "text-font", context);
	const evaluateMaxAngle = numberEvaluator(flatStyle, "text-max-angle", context);
	const evaluateOffsetX = numberEvaluator(flatStyle, "text-offset-x", context);
	const evaluateOffsetY = numberEvaluator(flatStyle, "text-offset-y", context);
	const evaluateOverflow = booleanEvaluator(flatStyle, "text-overflow", context);
	const evaluatePlacement = stringEvaluator(flatStyle, "text-placement", context);
	const evaluateRepeat = numberEvaluator(flatStyle, "text-repeat", context);
	const evaluateScale = sizeLikeEvaluator(flatStyle, "text-scale", context);
	const evaluateRotateWithView = booleanEvaluator(flatStyle, "text-rotate-with-view", context);
	const evaluateRotation = numberEvaluator(flatStyle, "text-rotation", context);
	const evaluateAlign = stringEvaluator(flatStyle, "text-align", context);
	const evaluateJustify = stringEvaluator(flatStyle, "text-justify", context);
	const evaluateBaseline = stringEvaluator(flatStyle, "text-baseline", context);
	const evaluatePadding = numberArrayEvaluator(flatStyle, "text-padding", context);
	const text = new Text({ declutterMode: optionalDeclutterMode(flatStyle, "text-declutter-mode") });
	return function(context) {
		text.setText(evaluateValue(context));
		if (evaluateFill) text.setFill(evaluateFill(context));
		if (evaluateBackgroundFill) text.setBackgroundFill(evaluateBackgroundFill(context));
		if (evaluateStroke) text.setStroke(evaluateStroke(context));
		if (evaluateBackgroundStroke) text.setBackgroundStroke(evaluateBackgroundStroke(context));
		if (evaluateFont) text.setFont(evaluateFont(context));
		if (evaluateMaxAngle) text.setMaxAngle(evaluateMaxAngle(context));
		if (evaluateOffsetX) text.setOffsetX(evaluateOffsetX(context));
		if (evaluateOffsetY) text.setOffsetY(evaluateOffsetY(context));
		if (evaluateOverflow) text.setOverflow(evaluateOverflow(context));
		if (evaluatePlacement) {
			const placement = evaluatePlacement(context);
			if (placement !== "point" && placement !== "line") throw new Error("Expected point or line for text-placement");
			text.setPlacement(placement);
		}
		if (evaluateRepeat) text.setRepeat(evaluateRepeat(context));
		if (evaluateScale) text.setScale(evaluateScale(context));
		if (evaluateRotateWithView) text.setRotateWithView(evaluateRotateWithView(context));
		if (evaluateRotation) text.setRotation(evaluateRotation(context));
		if (evaluateAlign) {
			const textAlign = evaluateAlign(context);
			if (textAlign !== "left" && textAlign !== "center" && textAlign !== "right" && textAlign !== "end" && textAlign !== "start") throw new Error("Expected left, right, center, start, or end for text-align");
			text.setTextAlign(textAlign);
		}
		if (evaluateJustify) {
			const justify = evaluateJustify(context);
			if (justify !== "left" && justify !== "right" && justify !== "center") throw new Error("Expected left, right, or center for text-justify");
			text.setJustify(justify);
		}
		if (evaluateBaseline) {
			const textBaseline = evaluateBaseline(context);
			if (textBaseline !== "bottom" && textBaseline !== "top" && textBaseline !== "middle" && textBaseline !== "alphabetic" && textBaseline !== "hanging") throw new Error("Expected bottom, top, middle, alphabetic, or hanging for text-baseline");
			text.setTextBaseline(textBaseline);
		}
		if (evaluatePadding) text.setPadding(evaluatePadding(context));
		return text;
	};
}
/**
* @typedef {function(EvaluationContext):import("../../style/Image.js").default} ImageEvaluator
*/
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {ParsingContext} context The parsing context.
* @return {ImageEvaluator?} A function that evaluates to an image symbolizer.
*/
function buildImage(flatStyle, context) {
	if ("icon-src" in flatStyle) return buildIcon(flatStyle, context);
	if ("shape-points" in flatStyle) return buildShape(flatStyle, context);
	if ("circle-radius" in flatStyle) return buildCircle(flatStyle, context);
	return null;
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {ParsingContext} context The parsing context.
* @return {ImageEvaluator} A function that evaluates to an image symbolizer.
*/
function buildIcon(flatStyle, context) {
	const srcName = "icon-src";
	const src = requireString(flatStyle[srcName], srcName);
	const evaluateAnchor = coordinateEvaluator(flatStyle, "icon-anchor", context);
	const evaluateScale = sizeLikeEvaluator(flatStyle, "icon-scale", context);
	const evaluateOpacity = numberEvaluator(flatStyle, "icon-opacity", context);
	const evaluateDisplacement = coordinateEvaluator(flatStyle, "icon-displacement", context);
	const evaluateRotation = numberEvaluator(flatStyle, "icon-rotation", context);
	const evaluateRotateWithView = booleanEvaluator(flatStyle, "icon-rotate-with-view", context);
	const anchorOrigin = optionalIconOrigin(flatStyle, "icon-anchor-origin");
	const anchorXUnits = optionalIconAnchorUnits(flatStyle, "icon-anchor-x-units");
	const anchorYUnits = optionalIconAnchorUnits(flatStyle, "icon-anchor-y-units");
	const color = optionalColorLike(flatStyle, "icon-color");
	const crossOrigin = optionalString(flatStyle, "icon-cross-origin");
	const offset = optionalNumberArray(flatStyle, "icon-offset");
	const offsetOrigin = optionalIconOrigin(flatStyle, "icon-offset-origin");
	const width = optionalNumber(flatStyle, "icon-width");
	const icon = new Icon({
		src,
		anchorOrigin,
		anchorXUnits,
		anchorYUnits,
		color,
		crossOrigin,
		offset,
		offsetOrigin,
		height: optionalNumber(flatStyle, "icon-height"),
		width,
		size: optionalSize(flatStyle, "icon-size"),
		declutterMode: optionalDeclutterMode(flatStyle, "icon-declutter-mode")
	});
	return function(context) {
		if (evaluateOpacity) icon.setOpacity(evaluateOpacity(context));
		if (evaluateDisplacement) icon.setDisplacement(evaluateDisplacement(context));
		if (evaluateRotation) icon.setRotation(evaluateRotation(context));
		if (evaluateRotateWithView) icon.setRotateWithView(evaluateRotateWithView(context));
		if (evaluateScale) icon.setScale(evaluateScale(context));
		if (evaluateAnchor) icon.setAnchor(evaluateAnchor(context));
		return icon;
	};
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {ParsingContext} context The parsing context.
* @return {ImageEvaluator} A function that evaluates to an icon symbolizer.
*/
function buildShape(flatStyle, context) {
	const prefix = "shape-";
	const pointsName = "shape-points";
	const radiusName = "shape-radius";
	const points = requireNumber(flatStyle[pointsName], pointsName);
	const radius = requireNumber(flatStyle[radiusName], radiusName);
	const evaluateFill = buildFill(flatStyle, prefix, context);
	const evaluateStroke = buildStroke(flatStyle, prefix, context);
	const evaluateScale = sizeLikeEvaluator(flatStyle, "shape-scale", context);
	const evaluateDisplacement = coordinateEvaluator(flatStyle, "shape-displacement", context);
	const evaluateRotation = numberEvaluator(flatStyle, "shape-rotation", context);
	const evaluateRotateWithView = booleanEvaluator(flatStyle, "shape-rotate-with-view", context);
	const shape = new RegularShape({
		points,
		radius,
		radius2: optionalNumber(flatStyle, "shape-radius2"),
		angle: optionalNumber(flatStyle, "shape-angle"),
		declutterMode: optionalDeclutterMode(flatStyle, "shape-declutter-mode")
	});
	return function(context) {
		if (evaluateFill) shape.setFill(evaluateFill(context));
		if (evaluateStroke) shape.setStroke(evaluateStroke(context));
		if (evaluateDisplacement) shape.setDisplacement(evaluateDisplacement(context));
		if (evaluateRotation) shape.setRotation(evaluateRotation(context));
		if (evaluateRotateWithView) shape.setRotateWithView(evaluateRotateWithView(context));
		if (evaluateScale) shape.setScale(evaluateScale(context));
		return shape;
	};
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {ParsingContext} context The parsing context.
* @return {ImageEvaluator} A function that evaluates to a circle symbolizer.
*/
function buildCircle(flatStyle, context) {
	const prefix = "circle-";
	const evaluateFill = buildFill(flatStyle, prefix, context);
	const evaluateStroke = buildStroke(flatStyle, prefix, context);
	const evaluateRadius = numberEvaluator(flatStyle, "circle-radius", context);
	const evaluateScale = sizeLikeEvaluator(flatStyle, "circle-scale", context);
	const evaluateDisplacement = coordinateEvaluator(flatStyle, "circle-displacement", context);
	const evaluateRotation = numberEvaluator(flatStyle, "circle-rotation", context);
	const evaluateRotateWithView = booleanEvaluator(flatStyle, "circle-rotate-with-view", context);
	const circle = new CircleStyle({
		radius: 5,
		declutterMode: optionalDeclutterMode(flatStyle, "circle-declutter-mode")
	});
	return function(context) {
		if (evaluateRadius) circle.setRadius(evaluateRadius(context));
		if (evaluateFill) circle.setFill(evaluateFill(context));
		if (evaluateStroke) circle.setStroke(evaluateStroke(context));
		if (evaluateDisplacement) circle.setDisplacement(evaluateDisplacement(context));
		if (evaluateRotation) circle.setRotation(evaluateRotation(context));
		if (evaluateRotateWithView) circle.setRotateWithView(evaluateRotateWithView(context));
		if (evaluateScale) circle.setScale(evaluateScale(context));
		return circle;
	};
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} name The property name.
* @param {ParsingContext} context The parsing context.
* @return {import('../../expr/cpu.js').NumberEvaluator|undefined} The expression evaluator or undefined.
*/
function numberEvaluator(flatStyle, name, context) {
	if (!(name in flatStyle)) return;
	const evaluator = buildExpression(flatStyle[name], NumberType, context);
	return function(context) {
		return requireNumber(evaluator(context), name);
	};
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} name The property name.
* @param {ParsingContext} context The parsing context.
* @return {import('../../expr/cpu.js').StringEvaluator?} The expression evaluator.
*/
function stringEvaluator(flatStyle, name, context) {
	if (!(name in flatStyle)) return null;
	const evaluator = buildExpression(flatStyle[name], StringType, context);
	return function(context) {
		return requireString(evaluator(context), name);
	};
}
function patternEvaluator(flatStyle, prefix, context) {
	const srcEvaluator = stringEvaluator(flatStyle, prefix + "pattern-src", context);
	const offsetEvaluator = sizeEvaluator(flatStyle, prefix + "pattern-offset", context);
	const patternSizeEvaluator = sizeEvaluator(flatStyle, prefix + "pattern-size", context);
	const colorEvaluator = colorLikeEvaluator(flatStyle, prefix + "color", context);
	return function(context) {
		return {
			src: srcEvaluator(context),
			offset: offsetEvaluator && offsetEvaluator(context),
			size: patternSizeEvaluator && patternSizeEvaluator(context),
			color: colorEvaluator && colorEvaluator(context)
		};
	};
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} name The property name.
* @param {ParsingContext} context The parsing context.
* @return {import('../../expr/cpu.js').BooleanEvaluator?} The expression evaluator.
*/
function booleanEvaluator(flatStyle, name, context) {
	if (!(name in flatStyle)) return null;
	const evaluator = buildExpression(flatStyle[name], BooleanType, context);
	return function(context) {
		const value = evaluator(context);
		if (typeof value !== "boolean") throw new Error(`Expected a boolean for ${name}`);
		return value;
	};
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} name The property name.
* @param {ParsingContext} context The parsing context.
* @return {import('../../expr/cpu.js').ColorLikeEvaluator?} The expression evaluator.
*/
function colorLikeEvaluator(flatStyle, name, context) {
	if (!(name in flatStyle)) return null;
	const evaluator = buildExpression(flatStyle[name], ColorType | StringType, context);
	return function(context) {
		return requireColorLike(evaluator(context), name);
	};
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} name The property name.
* @param {ParsingContext} context The parsing context.
* @return {import('../../expr/cpu.js').NumberArrayEvaluator?} The expression evaluator.
*/
function numberArrayEvaluator(flatStyle, name, context) {
	if (!(name in flatStyle)) return null;
	const evaluator = buildExpression(flatStyle[name], NumberArrayType, context);
	return function(context) {
		return requireNumberArray(evaluator(context), name);
	};
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} name The property name.
* @param {ParsingContext} context The parsing context.
* @return {import('../../expr/cpu.js').CoordinateEvaluator?} The expression evaluator.
*/
function coordinateEvaluator(flatStyle, name, context) {
	if (!(name in flatStyle)) return null;
	const evaluator = buildExpression(flatStyle[name], NumberArrayType, context);
	return function(context) {
		const array = requireNumberArray(evaluator(context), name);
		if (array.length !== 2) throw new Error(`Expected two numbers for ${name}`);
		return array;
	};
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} name The property name.
* @param {ParsingContext} context The parsing context.
* @return {import('../../expr/cpu.js').SizeEvaluator?} The expression evaluator.
*/
function sizeEvaluator(flatStyle, name, context) {
	if (!(name in flatStyle)) return null;
	const evaluator = buildExpression(flatStyle[name], NumberArrayType, context);
	return function(context) {
		return requireSize(evaluator(context), name);
	};
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} name The property name.
* @param {ParsingContext} context The parsing context.
* @return {import('../../expr/cpu.js').SizeLikeEvaluator?} The expression evaluator.
*/
function sizeLikeEvaluator(flatStyle, name, context) {
	if (!(name in flatStyle)) return null;
	const evaluator = buildExpression(flatStyle[name], NumberArrayType | NumberType, context);
	return function(context) {
		return requireSizeLike(evaluator(context), name);
	};
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} property The symbolizer property.
* @return {number|undefined} A number or undefined.
*/
function optionalNumber(flatStyle, property) {
	const value = flatStyle[property];
	if (value === void 0) return;
	if (typeof value !== "number") throw new Error(`Expected a number for ${property}`);
	return value;
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} property The symbolizer property.
* @return {import("../../size.js").Size|undefined} A size or undefined.
*/
function optionalSize(flatStyle, property) {
	const encoded = flatStyle[property];
	if (encoded === void 0) return;
	if (typeof encoded === "number") return toSize(encoded);
	if (!Array.isArray(encoded)) throw new Error(`Expected a number or size array for ${property}`);
	if (encoded.length !== 2 || typeof encoded[0] !== "number" || typeof encoded[1] !== "number") throw new Error(`Expected a number or size array for ${property}`);
	return encoded;
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} property The symbolizer property.
* @return {string|undefined} A string or undefined.
*/
function optionalString(flatStyle, property) {
	const encoded = flatStyle[property];
	if (encoded === void 0) return;
	if (typeof encoded !== "string") throw new Error(`Expected a string for ${property}`);
	return encoded;
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} property The symbolizer property.
* @return {import("../../style/Icon.js").IconOrigin|undefined} An icon origin or undefined.
*/
function optionalIconOrigin(flatStyle, property) {
	const encoded = flatStyle[property];
	if (encoded === void 0) return;
	if (encoded !== "bottom-left" && encoded !== "bottom-right" && encoded !== "top-left" && encoded !== "top-right") throw new Error(`Expected bottom-left, bottom-right, top-left, or top-right for ${property}`);
	return encoded;
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} property The symbolizer property.
* @return {import("../../style/Icon.js").IconAnchorUnits|undefined} Icon anchor units or undefined.
*/
function optionalIconAnchorUnits(flatStyle, property) {
	const encoded = flatStyle[property];
	if (encoded === void 0) return;
	if (encoded !== "pixels" && encoded !== "fraction") throw new Error(`Expected pixels or fraction for ${property}`);
	return encoded;
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} property The symbolizer property.
* @return {Array<number>|undefined} An array of numbers or undefined.
*/
function optionalNumberArray(flatStyle, property) {
	const encoded = flatStyle[property];
	if (encoded === void 0) return;
	return requireNumberArray(encoded, property);
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} property The symbolizer property.
* @return {import('../../style/Style.js').DeclutterMode} Icon declutter mode.
*/
function optionalDeclutterMode(flatStyle, property) {
	const encoded = flatStyle[property];
	if (encoded === void 0) return;
	if (typeof encoded !== "string") throw new Error(`Expected a string for ${property}`);
	if (encoded !== "declutter" && encoded !== "obstacle" && encoded !== "none") throw new Error(`Expected declutter, obstacle, or none for ${property}`);
	return encoded;
}
/**
* @param {FlatStyle} flatStyle The flat style.
* @param {string} property The symbolizer property.
* @return {string|Array<number>|undefined} A string or an array of color values or undefined.
*/
function optionalColorLike(flatStyle, property) {
	const encoded = flatStyle[property];
	if (encoded === void 0) return;
	return requireColorLike(encoded, property);
}
/**
* @param {any} value The value.
* @param {string} property The property.
* @return {Array<number>} An array of numbers.
*/
function requireNumberArray(value, property) {
	if (!Array.isArray(value)) throw new Error(`Expected an array for ${property}`);
	const length = value.length;
	for (let i = 0; i < length; ++i) if (typeof value[i] !== "number") throw new Error(`Expected an array of numbers for ${property}`);
	return value;
}
/**
* @param {any} value The value.
* @param {string} property The property.
* @return {string} A string.
*/
function requireString(value, property) {
	if (typeof value !== "string") throw new Error(`Expected a string for ${property}`);
	return value;
}
/**
* @param {any} value The value.
* @param {string} property The property.
* @return {number} A number.
*/
function requireNumber(value, property) {
	if (typeof value !== "number") throw new Error(`Expected a number for ${property}`);
	return value;
}
/**
* @param {any} value The value.
* @param {string} property The property.
* @return {Array<number>|string} A color.
*/
function requireColorLike(value, property) {
	if (typeof value === "string") return value;
	const array = requireNumberArray(value, property);
	const length = array.length;
	if (length < 3 || length > 4) throw new Error(`Expected a color with 3 or 4 values for ${property}`);
	return array;
}
/**
* @param {any} value The value.
* @param {string} property The property.
* @return {Array<number>} A number or an array of two numbers.
*/
function requireSize(value, property) {
	const size = requireNumberArray(value, property);
	if (size.length !== 2) throw new Error(`Expected an array of two numbers for ${property}`);
	return size;
}
/**
* @param {any} value The value.
* @param {string} property The property.
* @return {number|Array<number>} A number or an array of two numbers.
*/
function requireSizeLike(value, property) {
	if (typeof value === "number") return value;
	return requireSize(value, property);
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/layer/BaseVector.js
/**
* @module ol/layer/BaseVector
*/
var import_rbush_min = /* @__PURE__ */ __toESM(require_rbush_min(), 1);
/**
* @template {import("../source/Vector.js").default<import('../Feature').FeatureLike>|import("../source/VectorTile.js").default<import('../Feature').FeatureLike>} VectorSourceType
* @typedef {Object} Options
* @property {string} [className='ol-layer'] A CSS class name to set to the layer element.
* @property {number} [opacity=1] Opacity (0, 1).
* @property {boolean} [visible=true] Visibility.
* @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
* rendered outside of this extent.
* @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
* will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
* for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
* method was used.
* @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
* visible.
* @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
* be visible.
* @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
* visible.
* @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
* be visible.
* @property {import("../render.js").OrderFunction} [renderOrder] Render order. Function to be used when sorting
* features before rendering. By default features are drawn in the order that they are created. Use
* `null` to avoid the sort, but get an undefined draw order.
* @property {number} [renderBuffer=100] The buffer in pixels around the viewport extent used by the
* renderer when getting features from the vector source for the rendering or hit-detection.
* Recommended value: the size of the largest symbol, line width or label.
* @property {VectorSourceType} [source] Source.
* @property {import("../Map.js").default} [map] Sets the layer as overlay on a map. The map will not manage
* this layer in its layers collection, and the layer will be rendered on top. This is useful for
* temporary layers. The standard way to add a layer to a map and have it managed by the map is to
* use [map.addLayer()]{@link import("../Map.js").default#addLayer}.
* @property {boolean|string|number} [declutter=false] Declutter images and text. Any truthy value will enable
* decluttering. Within a layer, a feature rendered before another has higher priority. All layers with the
* same `declutter` value will be decluttered together. The priority is determined by the drawing order of the
* layers with the same `declutter` value. Higher in the layer stack means higher priority. To declutter distinct
* layers or groups of layers separately, use different truthy values for `declutter`.
* @property {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null} [style] Layer style. When set to `null`, only
* features that have their own style will be rendered. See {@link module:ol/style/Style~Style} for the default style
* which will be used if this is not set.
* @property {import("./Base.js").BackgroundColor} [background] Background color for the layer. If not specified, no background
* will be rendered.
* @property {boolean} [updateWhileAnimating=false] When set to `true`, feature batches will
* be recreated during animations. This means that no vectors will be shown clipped, but the
* setting will have a performance impact for large amounts of vector data. When set to `false`,
* batches will be recreated when no animation is active.
* @property {boolean} [updateWhileInteracting=false] When set to `true`, feature batches will
* be recreated during interactions. See also `updateWhileAnimating`.
* @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
*/
/**
* @enum {string}
* @private
*/
var Property$1 = { RENDER_ORDER: "renderOrder" };
/**
* @classdesc
* Vector data that is rendered client-side.
* Note that any property set in the options is set as a {@link module:ol/Object~BaseObject}
* property on the layer object; for example, setting `title: 'My Title'` in the
* options means that `title` is observable, and has get/set accessors.
*
* @template {import("../source/Vector.js").default<import('../Feature').FeatureLike>|import("../source/VectorTile.js").default<import('../Feature').FeatureLike>} VectorSourceType
* @template {import("../renderer/canvas/VectorLayer.js").default|import("../renderer/canvas/VectorTileLayer.js").default|import("../renderer/canvas/VectorImageLayer.js").default|import("../renderer/webgl/PointsLayer.js").default} RendererType
* @extends {Layer<VectorSourceType, RendererType>}
* @api
*/
var BaseVectorLayer = class extends Layer {
	/**
	* @param {Options<VectorSourceType>} [options] Options.
	*/
	constructor(options) {
		options = options ? options : {};
		const baseOptions = Object.assign({}, options);
		delete baseOptions.style;
		delete baseOptions.renderBuffer;
		delete baseOptions.updateWhileAnimating;
		delete baseOptions.updateWhileInteracting;
		super(baseOptions);
		/**
		* @private
		* @type {string}
		*/
		this.declutter_ = options.declutter ? String(options.declutter) : void 0;
		/**
		* @type {number}
		* @private
		*/
		this.renderBuffer_ = options.renderBuffer !== void 0 ? options.renderBuffer : 100;
		/**
		* User provided style.
		* @type {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike}
		* @private
		*/
		this.style_ = null;
		/**
		* Style function for use within the library.
		* @type {import("../style/Style.js").StyleFunction|undefined}
		* @private
		*/
		this.styleFunction_ = void 0;
		this.setStyle(options.style);
		/**
		* @type {boolean}
		* @private
		*/
		this.updateWhileAnimating_ = options.updateWhileAnimating !== void 0 ? options.updateWhileAnimating : false;
		/**
		* @type {boolean}
		* @private
		*/
		this.updateWhileInteracting_ = options.updateWhileInteracting !== void 0 ? options.updateWhileInteracting : false;
	}
	/**
	* @return {string} Declutter group.
	*/
	getDeclutter() {
		return this.declutter_;
	}
	/**
	* Get the topmost feature that intersects the given pixel on the viewport. Returns a promise
	* that resolves with an array of features. The array will either contain the topmost feature
	* when a hit was detected, or it will be empty.
	*
	* The hit detection algorithm used for this method is optimized for performance, but is less
	* accurate than the one used in [map.getFeaturesAtPixel()]{@link import("../Map.js").default#getFeaturesAtPixel}.
	* Text is not considered, and icons are only represented by their bounding box instead of the exact
	* image.
	*
	* @param {import("../pixel.js").Pixel} pixel Pixel.
	* @return {Promise<Array<import("../Feature").FeatureLike>>} Promise that resolves with an array of features.
	* @api
	*/
	getFeatures(pixel) {
		return super.getFeatures(pixel);
	}
	/**
	* @return {number|undefined} Render buffer.
	*/
	getRenderBuffer() {
		return this.renderBuffer_;
	}
	/**
	* @return {function(import("../Feature.js").default, import("../Feature.js").default): number|null|undefined} Render
	*     order.
	*/
	getRenderOrder() {
		return this.get(Property$1.RENDER_ORDER);
	}
	/**
	* Get the style for features.  This returns whatever was passed to the `style`
	* option at construction or to the `setStyle` method.
	* @return {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null|undefined} Layer style.
	* @api
	*/
	getStyle() {
		return this.style_;
	}
	/**
	* Get the style function.
	* @return {import("../style/Style.js").StyleFunction|undefined} Layer style function.
	* @api
	*/
	getStyleFunction() {
		return this.styleFunction_;
	}
	/**
	* @return {boolean} Whether the rendered layer should be updated while
	*     animating.
	*/
	getUpdateWhileAnimating() {
		return this.updateWhileAnimating_;
	}
	/**
	* @return {boolean} Whether the rendered layer should be updated while
	*     interacting.
	*/
	getUpdateWhileInteracting() {
		return this.updateWhileInteracting_;
	}
	/**
	* Render declutter items for this layer
	* @param {import("../Map.js").FrameState} frameState Frame state.
	* @param {import("../layer/Layer.js").State} layerState Layer state.
	*/
	renderDeclutter(frameState, layerState) {
		const declutterGroup = this.getDeclutter();
		if (declutterGroup in frameState.declutter === false) frameState.declutter[declutterGroup] = new import_rbush_min.default(9);
		this.getRenderer().renderDeclutter(frameState, layerState);
	}
	/**
	* @param {import("../render.js").OrderFunction|null|undefined} renderOrder
	*     Render order.
	*/
	setRenderOrder(renderOrder) {
		this.set(Property$1.RENDER_ORDER, renderOrder);
	}
	/**
	* Set the style for features.  This can be a single style object, an array
	* of styles, or a function that takes a feature and resolution and returns
	* an array of styles. If set to `null`, the layer has no style (a `null` style),
	* so only features that have their own styles will be rendered in the layer. Call
	* `setStyle()` without arguments to reset to the default style. See
	* [the ol/style/Style module]{@link module:ol/style/Style~Style} for information on the default style.
	*
	* If your layer has a static style, you can use [flat style]{@link module:ol/style/flat~FlatStyle} object
	* literals instead of using the `Style` and symbolizer constructors (`Fill`, `Stroke`, etc.):
	* ```js
	* vectorLayer.setStyle({
	*   "fill-color": "yellow",
	*   "stroke-color": "black",
	*   "stroke-width": 4
	* })
	* ```
	*
	* @param {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null} [style] Layer style.
	* @api
	*/
	setStyle(style) {
		this.style_ = style === void 0 ? createDefaultStyle : style;
		const styleLike = toStyleLike(style);
		this.styleFunction_ = style === null ? void 0 : toFunction(styleLike);
		this.changed();
	}
};
/**
* Coerce the allowed style types into a shorter list of types.  Flat styles, arrays of flat
* styles, and arrays of rules are converted into style functions.
*
* @param {import("../style/Style.js").StyleLike|import("../style/flat.js").FlatStyleLike|null} [style] Layer style.
* @return {import("../style/Style.js").StyleLike|null} The style.
*/
function toStyleLike(style) {
	if (style === void 0) return createDefaultStyle;
	if (!style) return null;
	if (typeof style === "function") return style;
	if (style instanceof Style) return style;
	if (!Array.isArray(style)) return flatStylesToStyleFunction([style]);
	if (style.length === 0) return [];
	const length = style.length;
	const first = style[0];
	if (first instanceof Style) {
		/**
		* @type {Array<Style>}
		*/
		const styles = new Array(length);
		for (let i = 0; i < length; ++i) {
			const candidate = style[i];
			if (!(candidate instanceof Style)) throw new Error("Expected a list of style instances");
			styles[i] = candidate;
		}
		return styles;
	}
	if ("style" in first) {
		/**
		* @type Array<import("../style/flat.js").Rule>
		*/
		const rules = new Array(length);
		for (let i = 0; i < length; ++i) {
			const candidate = style[i];
			if (!("style" in candidate)) throw new Error("Expected a list of rules with a style property");
			rules[i] = candidate;
		}
		return rulesToStyleFunction(rules);
	}
	return flatStylesToStyleFunction(style);
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/render/Event.js
/**
* @module ol/render/Event
*/
var RenderEvent = class extends BaseEvent {
	/**
	* @param {import("./EventType.js").default} type Type.
	* @param {import("../transform.js").Transform} [inversePixelTransform] Transform for
	*     CSS pixels to rendered pixels.
	* @param {import("../Map.js").FrameState} [frameState] Frame state.
	* @param {?(CanvasRenderingContext2D|WebGLRenderingContext)} [context] Context.
	*/
	constructor(type, inversePixelTransform, frameState, context) {
		super(type);
		/**
		* Transform from CSS pixels (relative to the top-left corner of the map viewport)
		* to rendered pixels on this event's `context`. Only available when a Canvas renderer is used, null otherwise.
		* @type {import("../transform.js").Transform|undefined}
		* @api
		*/
		this.inversePixelTransform = inversePixelTransform;
		/**
		* An object representing the current render frame state.
		* @type {import("../Map.js").FrameState|undefined}
		* @api
		*/
		this.frameState = frameState;
		/**
		* Canvas context. Not available when the event is dispatched by the map. For Canvas 2D layers,
		* the context will be the 2D rendering context.  For WebGL layers, the context will be the WebGL
		* context.
		* @type {CanvasRenderingContext2D|WebGLRenderingContext|undefined}
		* @api
		*/
		this.context = context;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/TileState.js
/**
* @module ol/TileState
*/
/**
* @enum {number}
*/
var TileState_default = {
	IDLE: 0,
	LOADING: 1,
	LOADED: 2,
	/**
	* Indicates that tile loading failed
	* @type {number}
	*/
	ERROR: 3,
	EMPTY: 4
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/Kinetic.js
/**
* @module ol/Kinetic
*/
/**
* @classdesc
* Implementation of inertial deceleration for map movement.
*
* @api
*/
var Kinetic = class {
	/**
	* @param {number} decay Rate of decay (must be negative).
	* @param {number} minVelocity Minimum velocity (pixels/millisecond).
	* @param {number} delay Delay to consider to calculate the kinetic
	*     initial values (milliseconds).
	*/
	constructor(decay, minVelocity, delay) {
		/**
		* @private
		* @type {number}
		*/
		this.decay_ = decay;
		/**
		* @private
		* @type {number}
		*/
		this.minVelocity_ = minVelocity;
		/**
		* @private
		* @type {number}
		*/
		this.delay_ = delay;
		/**
		* @private
		* @type {Array<number>}
		*/
		this.points_ = [];
		/**
		* @private
		* @type {number}
		*/
		this.angle_ = 0;
		/**
		* @private
		* @type {number}
		*/
		this.initialVelocity_ = 0;
	}
	/**
	* FIXME empty description for jsdoc
	*/
	begin() {
		this.points_.length = 0;
		this.angle_ = 0;
		this.initialVelocity_ = 0;
	}
	/**
	* @param {number} x X.
	* @param {number} y Y.
	*/
	update(x, y) {
		this.points_.push(x, y, Date.now());
	}
	/**
	* @return {boolean} Whether we should do kinetic animation.
	*/
	end() {
		if (this.points_.length < 6) return false;
		const delay = Date.now() - this.delay_;
		const lastIndex = this.points_.length - 3;
		if (this.points_[lastIndex + 2] < delay) return false;
		let firstIndex = lastIndex - 3;
		while (firstIndex > 0 && this.points_[firstIndex + 2] > delay) firstIndex -= 3;
		const duration = this.points_[lastIndex + 2] - this.points_[firstIndex + 2];
		if (duration < 1e3 / 60) return false;
		const dx = this.points_[lastIndex] - this.points_[firstIndex];
		const dy = this.points_[lastIndex + 1] - this.points_[firstIndex + 1];
		this.angle_ = Math.atan2(dy, dx);
		this.initialVelocity_ = Math.sqrt(dx * dx + dy * dy) / duration;
		return this.initialVelocity_ > this.minVelocity_;
	}
	/**
	* @return {number} Total distance travelled (pixels).
	*/
	getDistance() {
		return (this.minVelocity_ - this.initialVelocity_) / this.decay_;
	}
	/**
	* @return {number} Angle of the kinetic panning animation (radians).
	*/
	getAngle() {
		return this.angle_;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/renderer/Map.js
/**
* @module ol/renderer/Map
*/
/**
* @template T
* @typedef HitMatch
* @property {import("../Feature.js").FeatureLike} feature Feature.
* @property {import("../layer/Layer.js").default} layer Layer.
* @property {import("../geom/SimpleGeometry.js").default} geometry Geometry.
* @property {number} distanceSq Squared distance.
* @property {import("./vector.js").FeatureCallback<T>} callback Callback.
*/
/**
* @abstract
*/
var MapRenderer = class extends Disposable {
	/**
	* @param {import("../Map.js").default} map Map.
	*/
	constructor(map) {
		super();
		/**
		* @private
		* @type {import("../Map.js").default}
		*/
		this.map_ = map;
	}
	/**
	* @abstract
	* @param {import("../render/EventType.js").default} type Event type.
	* @param {import("../Map.js").FrameState} frameState Frame state.
	*/
	dispatchRenderEvent(type, frameState) {
		abstract();
	}
	/**
	* @param {import("../Map.js").FrameState} frameState FrameState.
	* @protected
	*/
	calculateMatrices2D(frameState) {
		const viewState = frameState.viewState;
		const coordinateToPixelTransform = frameState.coordinateToPixelTransform;
		const pixelToCoordinateTransform = frameState.pixelToCoordinateTransform;
		compose(coordinateToPixelTransform, frameState.size[0] / 2, frameState.size[1] / 2, 1 / viewState.resolution, -1 / viewState.resolution, -viewState.rotation, -viewState.center[0], -viewState.center[1]);
		makeInverse(pixelToCoordinateTransform, coordinateToPixelTransform);
	}
	/**
	* @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
	* @param {import("../Map.js").FrameState} frameState FrameState.
	* @param {number} hitTolerance Hit tolerance in pixels.
	* @param {boolean} checkWrapped Check for wrapped geometries.
	* @param {import("./vector.js").FeatureCallback<T>} callback Feature callback.
	* @param {S} thisArg Value to use as `this` when executing `callback`.
	* @param {function(this: U, import("../layer/Layer.js").default): boolean} layerFilter Layer filter
	*     function, only layers which are visible and for which this function
	*     returns `true` will be tested for features.  By default, all visible
	*     layers will be tested.
	* @param {U} thisArg2 Value to use as `this` when executing `layerFilter`.
	* @return {T|undefined} Callback result.
	* @template S,T,U
	*/
	forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, checkWrapped, callback, thisArg, layerFilter, thisArg2) {
		let result;
		const viewState = frameState.viewState;
		/**
		* @param {boolean} managed Managed layer.
		* @param {import("../Feature.js").FeatureLike} feature Feature.
		* @param {import("../layer/Layer.js").default} layer Layer.
		* @param {import("../geom/Geometry.js").default} geometry Geometry.
		* @return {T|undefined} Callback result.
		*/
		function forEachFeatureAtCoordinate(managed, feature, layer, geometry) {
			return callback.call(thisArg, feature, managed ? layer : null, geometry);
		}
		const projection = viewState.projection;
		const translatedCoordinate = wrapX(coordinate.slice(), projection);
		const offsets = [[0, 0]];
		if (projection.canWrapX() && checkWrapped) {
			const projectionExtent = projection.getExtent();
			const worldWidth = getWidth(projectionExtent);
			offsets.push([-worldWidth, 0], [worldWidth, 0]);
		}
		const layerStates = frameState.layerStatesArray;
		const numLayers = layerStates.length;
		const matches = [];
		const tmpCoord = [];
		for (let i = 0; i < offsets.length; i++) for (let j = numLayers - 1; j >= 0; --j) {
			const layerState = layerStates[j];
			const layer = layerState.layer;
			if (layer.hasRenderer() && inView(layerState, viewState) && layerFilter.call(thisArg2, layer)) {
				const layerRenderer = layer.getRenderer();
				const source = layer.getSource();
				if (layerRenderer && source) {
					const coordinates = source.getWrapX() ? translatedCoordinate : coordinate;
					const callback = forEachFeatureAtCoordinate.bind(null, layerState.managed);
					tmpCoord[0] = coordinates[0] + offsets[i][0];
					tmpCoord[1] = coordinates[1] + offsets[i][1];
					result = layerRenderer.forEachFeatureAtCoordinate(tmpCoord, frameState, hitTolerance, callback, matches);
				}
				if (result) return result;
			}
		}
		if (matches.length === 0) return;
		const order = 1 / matches.length;
		matches.forEach((m, i) => m.distanceSq += i * order);
		matches.sort((a, b) => a.distanceSq - b.distanceSq);
		matches.some((m) => {
			return result = m.callback(m.feature, m.layer, m.geometry);
		});
		return result;
	}
	/**
	* @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
	* @param {import("../Map.js").FrameState} frameState FrameState.
	* @param {number} hitTolerance Hit tolerance in pixels.
	* @param {boolean} checkWrapped Check for wrapped geometries.
	* @param {function(this: U, import("../layer/Layer.js").default): boolean} layerFilter Layer filter
	*     function, only layers which are visible and for which this function
	*     returns `true` will be tested for features.  By default, all visible
	*     layers will be tested.
	* @param {U} thisArg Value to use as `this` when executing `layerFilter`.
	* @return {boolean} Is there a feature at the given coordinate?
	* @template U
	*/
	hasFeatureAtCoordinate(coordinate, frameState, hitTolerance, checkWrapped, layerFilter, thisArg) {
		return this.forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, checkWrapped, TRUE, this, layerFilter, thisArg) !== void 0;
	}
	/**
	* @return {import("../Map.js").default} Map.
	*/
	getMap() {
		return this.map_;
	}
	/**
	* Render.
	* @abstract
	* @param {?import("../Map.js").FrameState} frameState Frame state.
	*/
	renderFrame(frameState) {
		abstract();
	}
	/**
	* @param {import("../Map.js").FrameState} frameState Frame state.
	* @protected
	*/
	scheduleExpireIconCache(frameState) {
		if (shared.canExpireCache()) frameState.postRenderFunctions.push(expireIconCache);
	}
};
/**
* @param {import("../Map.js").default} map Map.
* @param {import("../Map.js").FrameState} frameState Frame state.
*/
function expireIconCache(map, frameState) {
	shared.expire();
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/renderer/Composite.js
/**
* @module ol/renderer/Composite
*/
/**
* @classdesc
* Canvas map renderer.
* @api
*/
var CompositeMapRenderer = class extends MapRenderer {
	/**
	* @param {import("../Map.js").default} map Map.
	*/
	constructor(map) {
		super(map);
		/**
		* @type {import("../events.js").EventsKey}
		*/
		this.fontChangeListenerKey_ = listen(checkedFonts, ObjectEventType_default.PROPERTYCHANGE, map.redrawText.bind(map));
		/**
		* @private
		* @type {HTMLDivElement}
		*/
		this.element_ = document.createElement("div");
		const style = this.element_.style;
		style.position = "absolute";
		style.width = "100%";
		style.height = "100%";
		style.zIndex = "0";
		this.element_.className = CLASS_UNSELECTABLE + " ol-layers";
		const container = map.getViewport();
		container.insertBefore(this.element_, container.firstChild || null);
		/**
		* @private
		* @type {Array<HTMLElement>}
		*/
		this.children_ = [];
		/**
		* @private
		* @type {boolean}
		*/
		this.renderedVisible_ = true;
	}
	/**
	* @param {import("../render/EventType.js").default} type Event type.
	* @param {import("../Map.js").FrameState} frameState Frame state.
	*/
	dispatchRenderEvent(type, frameState) {
		const map = this.getMap();
		if (map.hasListener(type)) {
			const event = new RenderEvent(type, void 0, frameState);
			map.dispatchEvent(event);
		}
	}
	disposeInternal() {
		unlistenByKey(this.fontChangeListenerKey_);
		this.element_.parentNode.removeChild(this.element_);
		super.disposeInternal();
	}
	/**
	* Render.
	* @param {?import("../Map.js").FrameState} frameState Frame state.
	*/
	renderFrame(frameState) {
		if (!frameState) {
			if (this.renderedVisible_) {
				this.element_.style.display = "none";
				this.renderedVisible_ = false;
			}
			return;
		}
		this.calculateMatrices2D(frameState);
		this.dispatchRenderEvent(EventType_default$1.PRECOMPOSE, frameState);
		const layerStatesArray = frameState.layerStatesArray.sort(function(a, b) {
			return a.zIndex - b.zIndex;
		});
		if (layerStatesArray.some((layerState) => layerState.layer instanceof BaseVectorLayer && layerState.layer.getDeclutter())) frameState.declutter = {};
		const viewState = frameState.viewState;
		this.children_.length = 0;
		const renderedLayerStates = [];
		let previousElement = null;
		for (let i = 0, ii = layerStatesArray.length; i < ii; ++i) {
			const layerState = layerStatesArray[i];
			frameState.layerIndex = i;
			const layer = layerState.layer;
			const sourceState = layer.getSourceState();
			if (!inView(layerState, viewState) || sourceState != "ready" && sourceState != "undefined") {
				layer.unrender();
				continue;
			}
			const element = layer.render(frameState, previousElement);
			if (!element) continue;
			if (element !== previousElement) {
				this.children_.push(element);
				previousElement = element;
			}
			renderedLayerStates.push(layerState);
		}
		this.declutter(frameState, renderedLayerStates);
		replaceChildren(this.element_, this.children_);
		this.dispatchRenderEvent(EventType_default$1.POSTCOMPOSE, frameState);
		if (!this.renderedVisible_) {
			this.element_.style.display = "";
			this.renderedVisible_ = true;
		}
		this.scheduleExpireIconCache(frameState);
	}
	/**
	* @param {import("../Map.js").FrameState} frameState Frame state.
	* @param {Array<import('../layer/Layer.js').State>} layerStates Layers.
	*/
	declutter(frameState, layerStates) {
		if (!frameState.declutter) return;
		for (let i = layerStates.length - 1; i >= 0; --i) {
			const layerState = layerStates[i];
			const layer = layerState.layer;
			if (layer.getDeclutter()) layer.renderDeclutter(frameState, layerState);
		}
		layerStates.forEach((layerState) => layerState.layer.renderDeferred(frameState));
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/layer/Group.js
/**
* @module ol/layer/Group
*/
/**
* @typedef {'addlayer'|'removelayer'} GroupEventType
*/
/**
* @classdesc
* A layer group triggers 'addlayer' and 'removelayer' events when layers are added to or removed from
* the group or one of its child groups.  When a layer group is added to or removed from another layer group,
* a single event will be triggered (instead of one per layer in the group added or removed).
*/
var GroupEvent = class extends BaseEvent {
	/**
	* @param {GroupEventType} type The event type.
	* @param {BaseLayer} layer The layer.
	*/
	constructor(type, layer) {
		super(type);
		/**
		* The added or removed layer.
		* @type {BaseLayer}
		* @api
		*/
		this.layer = layer;
	}
};
/***
* @template Return
* @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
*   import("../Observable").OnSignature<import("./Base").BaseLayerObjectEventTypes|
*     'change:layers', import("../Object").ObjectEvent, Return> &
*   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("./Base").BaseLayerObjectEventTypes|'change:layers', Return>} GroupOnSignature
*/
/**
* @typedef {Object} Options
* @property {number} [opacity=1] Opacity (0, 1).
* @property {boolean} [visible=true] Visibility.
* @property {import("../extent.js").Extent} [extent] The bounding extent for layer rendering.  The layer will not be
* rendered outside of this extent.
* @property {number} [zIndex] The z-index for layer rendering.  At rendering time, the layers
* will be ordered, first by Z-index and then by position. When `undefined`, a `zIndex` of 0 is assumed
* for layers that are added to the map's `layers` collection, or `Infinity` when the layer's `setMap()`
* method was used.
* @property {number} [minResolution] The minimum resolution (inclusive) at which this layer will be
* visible.
* @property {number} [maxResolution] The maximum resolution (exclusive) below which this layer will
* be visible.
* @property {number} [minZoom] The minimum view zoom level (exclusive) above which this layer will be
* visible.
* @property {number} [maxZoom] The maximum view zoom level (inclusive) at which this layer will
* be visible.
* @property {Array<import("./Base.js").default>|Collection<import("./Base.js").default>} [layers] Child layers.
* @property {Object<string, *>} [properties] Arbitrary observable properties. Can be accessed with `#get()` and `#set()`.
*/
/**
* @enum {string}
* @private
*/
var Property = { LAYERS: "layers" };
/**
* @classdesc
* A {@link module:ol/Collection~Collection} of layers that are handled together.
*
* A generic `change` event is triggered when the group/Collection changes.
*
* @api
*/
var LayerGroup = class LayerGroup extends BaseLayer {
	/**
	* @param {Options} [options] Layer options.
	*/
	constructor(options) {
		options = options || {};
		const baseOptions = Object.assign({}, options);
		delete baseOptions.layers;
		let layers = options.layers;
		super(baseOptions);
		/***
		* @type {GroupOnSignature<import("../events").EventsKey>}
		*/
		this.on;
		/***
		* @type {GroupOnSignature<import("../events").EventsKey>}
		*/
		this.once;
		/***
		* @type {GroupOnSignature<void>}
		*/
		this.un;
		/**
		* @private
		* @type {Array<import("../events.js").EventsKey>}
		*/
		this.layersListenerKeys_ = [];
		/**
		* @private
		* @type {Object<string, Array<import("../events.js").EventsKey>>}
		*/
		this.listenerKeys_ = {};
		this.addChangeListener(Property.LAYERS, this.handleLayersChanged_);
		if (layers) if (Array.isArray(layers)) layers = new Collection(layers.slice(), { unique: true });
		else assert(typeof layers.getArray === "function", "Expected `layers` to be an array or a `Collection`");
		else layers = new Collection(void 0, { unique: true });
		this.setLayers(layers);
	}
	/**
	* @private
	*/
	handleLayerChange_() {
		this.changed();
	}
	/**
	* @private
	*/
	handleLayersChanged_() {
		this.layersListenerKeys_.forEach(unlistenByKey);
		this.layersListenerKeys_.length = 0;
		const layers = this.getLayers();
		this.layersListenerKeys_.push(listen(layers, CollectionEventType_default.ADD, this.handleLayersAdd_, this), listen(layers, CollectionEventType_default.REMOVE, this.handleLayersRemove_, this));
		for (const id in this.listenerKeys_) this.listenerKeys_[id].forEach(unlistenByKey);
		clear(this.listenerKeys_);
		const layersArray = layers.getArray();
		for (let i = 0, ii = layersArray.length; i < ii; i++) {
			const layer = layersArray[i];
			this.registerLayerListeners_(layer);
			this.dispatchEvent(new GroupEvent("addlayer", layer));
		}
		this.changed();
	}
	/**
	* @param {BaseLayer} layer The layer.
	*/
	registerLayerListeners_(layer) {
		const listenerKeys = [listen(layer, ObjectEventType_default.PROPERTYCHANGE, this.handleLayerChange_, this), listen(layer, EventType_default$2.CHANGE, this.handleLayerChange_, this)];
		if (layer instanceof LayerGroup) listenerKeys.push(listen(layer, "addlayer", this.handleLayerGroupAdd_, this), listen(layer, "removelayer", this.handleLayerGroupRemove_, this));
		this.listenerKeys_[getUid(layer)] = listenerKeys;
	}
	/**
	* @param {GroupEvent} event The layer group event.
	*/
	handleLayerGroupAdd_(event) {
		this.dispatchEvent(new GroupEvent("addlayer", event.layer));
	}
	/**
	* @param {GroupEvent} event The layer group event.
	*/
	handleLayerGroupRemove_(event) {
		this.dispatchEvent(new GroupEvent("removelayer", event.layer));
	}
	/**
	* @param {import("../Collection.js").CollectionEvent<import("./Base.js").default>} collectionEvent CollectionEvent.
	* @private
	*/
	handleLayersAdd_(collectionEvent) {
		const layer = collectionEvent.element;
		this.registerLayerListeners_(layer);
		this.dispatchEvent(new GroupEvent("addlayer", layer));
		this.changed();
	}
	/**
	* @param {import("../Collection.js").CollectionEvent<import("./Base.js").default>} collectionEvent CollectionEvent.
	* @private
	*/
	handleLayersRemove_(collectionEvent) {
		const layer = collectionEvent.element;
		const key = getUid(layer);
		this.listenerKeys_[key].forEach(unlistenByKey);
		delete this.listenerKeys_[key];
		this.dispatchEvent(new GroupEvent("removelayer", layer));
		this.changed();
	}
	/**
	* Returns the {@link module:ol/Collection~Collection collection} of {@link module:ol/layer/Layer~Layer layers}
	* in this group.
	* @return {!Collection<import("./Base.js").default>} Collection of
	*   {@link module:ol/layer/Base~BaseLayer layers} that are part of this group.
	* @observable
	* @api
	*/
	getLayers() {
		return this.get(Property.LAYERS);
	}
	/**
	* Set the {@link module:ol/Collection~Collection collection} of {@link module:ol/layer/Layer~Layer layers}
	* in this group.
	* @param {!Collection<import("./Base.js").default>} layers Collection of
	*   {@link module:ol/layer/Base~BaseLayer layers} that are part of this group.
	* @observable
	* @api
	*/
	setLayers(layers) {
		const collection = this.getLayers();
		if (collection) {
			const currentLayers = collection.getArray();
			for (let i = 0, ii = currentLayers.length; i < ii; ++i) this.dispatchEvent(new GroupEvent("removelayer", currentLayers[i]));
		}
		this.set(Property.LAYERS, layers);
	}
	/**
	* @param {Array<import("./Layer.js").default>} [array] Array of layers (to be modified in place).
	* @return {Array<import("./Layer.js").default>} Array of layers.
	*/
	getLayersArray(array) {
		array = array !== void 0 ? array : [];
		this.getLayers().forEach(function(layer) {
			layer.getLayersArray(array);
		});
		return array;
	}
	/**
	* Get the layer states list and use this groups z-index as the default
	* for all layers in this and nested groups, if it is unset at this point.
	* If dest is not provided and this group's z-index is undefined
	* 0 is used a the default z-index.
	* @param {Array<import("./Layer.js").State>} [dest] Optional list
	* of layer states (to be modified in place).
	* @return {Array<import("./Layer.js").State>} List of layer states.
	*/
	getLayerStatesArray(dest) {
		const states = dest !== void 0 ? dest : [];
		const pos = states.length;
		this.getLayers().forEach(function(layer) {
			layer.getLayerStatesArray(states);
		});
		const ownLayerState = this.getLayerState();
		let defaultZIndex = ownLayerState.zIndex;
		if (!dest && ownLayerState.zIndex === void 0) defaultZIndex = 0;
		for (let i = pos, ii = states.length; i < ii; i++) {
			const layerState = states[i];
			layerState.opacity *= ownLayerState.opacity;
			layerState.visible = layerState.visible && ownLayerState.visible;
			layerState.maxResolution = Math.min(layerState.maxResolution, ownLayerState.maxResolution);
			layerState.minResolution = Math.max(layerState.minResolution, ownLayerState.minResolution);
			layerState.minZoom = Math.max(layerState.minZoom, ownLayerState.minZoom);
			layerState.maxZoom = Math.min(layerState.maxZoom, ownLayerState.maxZoom);
			if (ownLayerState.extent !== void 0) if (layerState.extent !== void 0) layerState.extent = getIntersection(layerState.extent, ownLayerState.extent);
			else layerState.extent = ownLayerState.extent;
			if (layerState.zIndex === void 0) layerState.zIndex = defaultZIndex;
		}
		return states;
	}
	/**
	* @return {import("../source/Source.js").State} Source state.
	*/
	getSourceState() {
		return "ready";
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/MapEvent.js
/**
* @module ol/MapEvent
*/
/**
* @classdesc
* Events emitted as map events are instances of this type.
* See {@link module:ol/Map~Map} for which events trigger a map event.
*/
var MapEvent = class extends BaseEvent {
	/**
	* @param {string} type Event type.
	* @param {import("./Map.js").default} map Map.
	* @param {?import("./Map.js").FrameState} [frameState] Frame state.
	*/
	constructor(type, map, frameState) {
		super(type);
		/**
		* The map where the event occurred.
		* @type {import("./Map.js").default}
		* @api
		*/
		this.map = map;
		/**
		* The frame state at the time of the event.
		* @type {?import("./Map.js").FrameState}
		* @api
		*/
		this.frameState = frameState !== void 0 ? frameState : null;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/MapBrowserEvent.js
/**
* @module ol/MapBrowserEvent
*/
/**
* @classdesc
* Events emitted as map browser events are instances of this type.
* See {@link module:ol/Map~Map} for which events trigger a map browser event.
* @template {UIEvent} EVENT
*/
var MapBrowserEvent = class extends MapEvent {
	/**
	* @param {string} type Event type.
	* @param {import("./Map.js").default} map Map.
	* @param {EVENT} originalEvent Original event.
	* @param {boolean} [dragging] Is the map currently being dragged?
	* @param {import("./Map.js").FrameState} [frameState] Frame state.
	* @param {Array<PointerEvent>} [activePointers] Active pointers.
	*/
	constructor(type, map, originalEvent, dragging, frameState, activePointers) {
		super(type, map, frameState);
		/**
		* The original browser event.
		* @const
		* @type {EVENT}
		* @api
		*/
		this.originalEvent = originalEvent;
		/**
		* The map pixel relative to the viewport corresponding to the original browser event.
		* @type {?import("./pixel.js").Pixel}
		*/
		this.pixel_ = null;
		/**
		* The coordinate in the user projection corresponding to the original browser event.
		* @type {?import("./coordinate.js").Coordinate}
		*/
		this.coordinate_ = null;
		/**
		* Indicates if the map is currently being dragged. Only set for
		* `POINTERDRAG` and `POINTERMOVE` events. Default is `false`.
		*
		* @type {boolean}
		* @api
		*/
		this.dragging = dragging !== void 0 ? dragging : false;
		/**
		* @type {Array<PointerEvent>|undefined}
		*/
		this.activePointers = activePointers;
	}
	/**
	* The map pixel relative to the viewport corresponding to the original event.
	* @type {import("./pixel.js").Pixel}
	* @api
	*/
	get pixel() {
		if (!this.pixel_) this.pixel_ = this.map.getEventPixel(this.originalEvent);
		return this.pixel_;
	}
	set pixel(pixel) {
		this.pixel_ = pixel;
	}
	/**
	* The coordinate corresponding to the original browser event.  This will be in the user
	* projection if one is set.  Otherwise it will be in the view projection.
	* @type {import("./coordinate.js").Coordinate}
	* @api
	*/
	get coordinate() {
		if (!this.coordinate_) this.coordinate_ = this.map.getCoordinateFromPixel(this.pixel);
		return this.coordinate_;
	}
	set coordinate(coordinate) {
		this.coordinate_ = coordinate;
	}
	/**
	* Prevents the default browser action.
	* See https://developer.mozilla.org/en-US/docs/Web/API/event.preventDefault.
	* @api
	*/
	preventDefault() {
		super.preventDefault();
		if ("preventDefault" in this.originalEvent)
 /** @type {UIEvent} */ this.originalEvent.preventDefault();
	}
	/**
	* Prevents further propagation of the current event.
	* See https://developer.mozilla.org/en-US/docs/Web/API/event.stopPropagation.
	* @api
	*/
	stopPropagation() {
		super.stopPropagation();
		if ("stopPropagation" in this.originalEvent)
 /** @type {UIEvent} */ this.originalEvent.stopPropagation();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/MapBrowserEventType.js
/**
* @module ol/MapBrowserEventType
*/
/**
* Constants for event names.
* @enum {string}
*/
var MapBrowserEventType_default = {
	/**
	* A true single click with no dragging and no double click. Note that this
	* event is delayed by 250 ms to ensure that it is not a double click.
	* @event module:ol/MapBrowserEvent~MapBrowserEvent#singleclick
	* @api
	*/
	SINGLECLICK: "singleclick",
	/**
	* A click with no dragging. A double click will fire two of this.
	* @event module:ol/MapBrowserEvent~MapBrowserEvent#click
	* @api
	*/
	CLICK: EventType_default$2.CLICK,
	/**
	* A true double click, with no dragging.
	* @event module:ol/MapBrowserEvent~MapBrowserEvent#dblclick
	* @api
	*/
	DBLCLICK: EventType_default$2.DBLCLICK,
	/**
	* Triggered when a pointer is dragged.
	* @event module:ol/MapBrowserEvent~MapBrowserEvent#pointerdrag
	* @api
	*/
	POINTERDRAG: "pointerdrag",
	/**
	* Triggered when a pointer is moved. Note that on touch devices this is
	* triggered when the map is panned, so is not the same as mousemove.
	* @event module:ol/MapBrowserEvent~MapBrowserEvent#pointermove
	* @api
	*/
	POINTERMOVE: "pointermove",
	POINTERDOWN: "pointerdown",
	POINTERUP: "pointerup",
	POINTEROVER: "pointerover",
	POINTEROUT: "pointerout",
	POINTERENTER: "pointerenter",
	POINTERLEAVE: "pointerleave",
	POINTERCANCEL: "pointercancel"
};
/***
* @typedef {'singleclick'|'click'|'dblclick'|'pointerdrag'|'pointermove'} Types
*/
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/pointer/EventType.js
/**
* @module ol/pointer/EventType
*/
/**
* Constants for event names.
* @enum {string}
*/
var EventType_default = {
	POINTERMOVE: "pointermove",
	POINTERDOWN: "pointerdown",
	POINTERUP: "pointerup",
	POINTEROVER: "pointerover",
	POINTEROUT: "pointerout",
	POINTERENTER: "pointerenter",
	POINTERLEAVE: "pointerleave",
	POINTERCANCEL: "pointercancel"
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/MapBrowserEventHandler.js
/**
* @module ol/MapBrowserEventHandler
*/
var MapBrowserEventHandler = class extends Target {
	/**
	* @param {import("./Map.js").default} map The map with the viewport to listen to events on.
	* @param {number} [moveTolerance] The minimal distance the pointer must travel to trigger a move.
	*/
	constructor(map, moveTolerance) {
		super(map);
		/**
		* This is the element that we will listen to the real events on.
		* @type {import("./Map.js").default}
		* @private
		*/
		this.map_ = map;
		/**
		* @type {ReturnType<typeof setTimeout>}
		* @private
		*/
		this.clickTimeoutId_;
		/**
		* Emulate dblclick and singleclick. Will be true when only one pointer is active.
		* @type {boolean}
		*/
		this.emulateClicks_ = false;
		/**
		* @type {boolean}
		* @private
		*/
		this.dragging_ = false;
		/**
		* @type {!Array<import("./events.js").EventsKey>}
		* @private
		*/
		this.dragListenerKeys_ = [];
		/**
		* @type {number}
		* @private
		*/
		this.moveTolerance_ = moveTolerance === void 0 ? 1 : moveTolerance;
		/**
		* The most recent "down" type event (or null if none have occurred).
		* Set on pointerdown.
		* @type {PointerEvent|null}
		* @private
		*/
		this.down_ = null;
		const element = this.map_.getViewport();
		/**
		* @type {Array<PointerEvent>}
		* @private
		*/
		this.activePointers_ = [];
		/**
		* @type {!Object<number, Event>}
		* @private
		*/
		this.trackedTouches_ = {};
		this.element_ = element;
		/**
		* @type {?import("./events.js").EventsKey}
		* @private
		*/
		this.pointerdownListenerKey_ = listen(element, EventType_default.POINTERDOWN, this.handlePointerDown_, this);
		/**
		* @type {PointerEvent}
		* @private
		*/
		this.originalPointerMoveEvent_;
		/**
		* @type {?import("./events.js").EventsKey}
		* @private
		*/
		this.relayedListenerKey_ = listen(element, EventType_default.POINTERMOVE, this.relayMoveEvent_, this);
		/**
		* @private
		*/
		this.boundHandleTouchMove_ = this.handleTouchMove_.bind(this);
		this.element_.addEventListener(EventType_default$2.TOUCHMOVE, this.boundHandleTouchMove_, PASSIVE_EVENT_LISTENERS ? { passive: false } : false);
	}
	/**
	* @param {PointerEvent} pointerEvent Pointer
	* event.
	* @private
	*/
	emulateClick_(pointerEvent) {
		let newEvent = new MapBrowserEvent(MapBrowserEventType_default.CLICK, this.map_, pointerEvent);
		this.dispatchEvent(newEvent);
		if (this.clickTimeoutId_ !== void 0) {
			clearTimeout(this.clickTimeoutId_);
			this.clickTimeoutId_ = void 0;
			newEvent = new MapBrowserEvent(MapBrowserEventType_default.DBLCLICK, this.map_, pointerEvent);
			this.dispatchEvent(newEvent);
		} else this.clickTimeoutId_ = setTimeout(() => {
			this.clickTimeoutId_ = void 0;
			const newEvent = new MapBrowserEvent(MapBrowserEventType_default.SINGLECLICK, this.map_, pointerEvent);
			this.dispatchEvent(newEvent);
		}, 250);
	}
	/**
	* Keeps track on how many pointers are currently active.
	*
	* @param {PointerEvent} pointerEvent Pointer
	* event.
	* @private
	*/
	updateActivePointers_(pointerEvent) {
		const event = pointerEvent;
		const id = event.pointerId;
		if (event.type == MapBrowserEventType_default.POINTERUP || event.type == MapBrowserEventType_default.POINTERCANCEL) {
			delete this.trackedTouches_[id];
			for (const pointerId in this.trackedTouches_) if (this.trackedTouches_[pointerId].target !== event.target) {
				delete this.trackedTouches_[pointerId];
				break;
			}
		} else if (event.type == MapBrowserEventType_default.POINTERDOWN || event.type == MapBrowserEventType_default.POINTERMOVE) this.trackedTouches_[id] = event;
		this.activePointers_ = Object.values(this.trackedTouches_);
	}
	/**
	* @param {PointerEvent} pointerEvent Pointer
	* event.
	* @private
	*/
	handlePointerUp_(pointerEvent) {
		this.updateActivePointers_(pointerEvent);
		const newEvent = new MapBrowserEvent(MapBrowserEventType_default.POINTERUP, this.map_, pointerEvent, void 0, void 0, this.activePointers_);
		this.dispatchEvent(newEvent);
		if (this.emulateClicks_ && !newEvent.defaultPrevented && !this.dragging_ && this.isMouseActionButton_(pointerEvent)) this.emulateClick_(this.down_);
		if (this.activePointers_.length === 0) {
			this.dragListenerKeys_.forEach(unlistenByKey);
			this.dragListenerKeys_.length = 0;
			this.dragging_ = false;
			this.down_ = null;
		}
	}
	/**
	* @param {PointerEvent} pointerEvent Pointer
	* event.
	* @return {boolean} If the left mouse button was pressed.
	* @private
	*/
	isMouseActionButton_(pointerEvent) {
		return pointerEvent.button === 0;
	}
	/**
	* @param {PointerEvent} pointerEvent Pointer
	* event.
	* @private
	*/
	handlePointerDown_(pointerEvent) {
		this.emulateClicks_ = this.activePointers_.length === 0;
		this.updateActivePointers_(pointerEvent);
		const newEvent = new MapBrowserEvent(MapBrowserEventType_default.POINTERDOWN, this.map_, pointerEvent, void 0, void 0, this.activePointers_);
		this.dispatchEvent(newEvent);
		this.down_ = new PointerEvent(pointerEvent.type, pointerEvent);
		Object.defineProperty(this.down_, "target", {
			writable: false,
			value: pointerEvent.target
		});
		if (this.dragListenerKeys_.length === 0) {
			const doc = this.map_.getOwnerDocument();
			this.dragListenerKeys_.push(listen(doc, MapBrowserEventType_default.POINTERMOVE, this.handlePointerMove_, this), listen(doc, MapBrowserEventType_default.POINTERUP, this.handlePointerUp_, this), listen(this.element_, MapBrowserEventType_default.POINTERCANCEL, this.handlePointerUp_, this));
			if (this.element_.getRootNode && this.element_.getRootNode() !== doc) this.dragListenerKeys_.push(listen(this.element_.getRootNode(), MapBrowserEventType_default.POINTERUP, this.handlePointerUp_, this));
		}
	}
	/**
	* @param {PointerEvent} pointerEvent Pointer
	* event.
	* @private
	*/
	handlePointerMove_(pointerEvent) {
		if (this.isMoving_(pointerEvent)) {
			this.updateActivePointers_(pointerEvent);
			this.dragging_ = true;
			const newEvent = new MapBrowserEvent(MapBrowserEventType_default.POINTERDRAG, this.map_, pointerEvent, this.dragging_, void 0, this.activePointers_);
			this.dispatchEvent(newEvent);
		}
	}
	/**
	* Wrap and relay a pointermove event.
	* @param {PointerEvent} pointerEvent Pointer
	* event.
	* @private
	*/
	relayMoveEvent_(pointerEvent) {
		this.originalPointerMoveEvent_ = pointerEvent;
		const dragging = !!(this.down_ && this.isMoving_(pointerEvent));
		this.dispatchEvent(new MapBrowserEvent(MapBrowserEventType_default.POINTERMOVE, this.map_, pointerEvent, dragging));
	}
	/**
	* Flexible handling of a `touch-action: none` css equivalent: because calling
	* `preventDefault()` on a `pointermove` event does not stop native page scrolling
	* and zooming, we also listen for `touchmove` and call `preventDefault()` on it
	* when an interaction (currently `DragPan` handles the event.
	* @param {TouchEvent} event Event.
	* @private
	*/
	handleTouchMove_(event) {
		const originalEvent = this.originalPointerMoveEvent_;
		if ((!originalEvent || originalEvent.defaultPrevented) && (typeof event.cancelable !== "boolean" || event.cancelable === true)) event.preventDefault();
	}
	/**
	* @param {PointerEvent} pointerEvent Pointer
	* event.
	* @return {boolean} Is moving.
	* @private
	*/
	isMoving_(pointerEvent) {
		return this.dragging_ || Math.abs(pointerEvent.clientX - this.down_.clientX) > this.moveTolerance_ || Math.abs(pointerEvent.clientY - this.down_.clientY) > this.moveTolerance_;
	}
	/**
	* Clean up.
	*/
	disposeInternal() {
		if (this.relayedListenerKey_) {
			unlistenByKey(this.relayedListenerKey_);
			this.relayedListenerKey_ = null;
		}
		this.element_.removeEventListener(EventType_default$2.TOUCHMOVE, this.boundHandleTouchMove_);
		if (this.pointerdownListenerKey_) {
			unlistenByKey(this.pointerdownListenerKey_);
			this.pointerdownListenerKey_ = null;
		}
		this.dragListenerKeys_.forEach(unlistenByKey);
		this.dragListenerKeys_.length = 0;
		this.element_ = null;
		super.disposeInternal();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/MapEventType.js
/**
* @module ol/MapEventType
*/
/**
* @enum {string}
*/
var MapEventType_default = {
	/**
	* Triggered after a map frame is rendered.
	* @event module:ol/MapEvent~MapEvent#postrender
	* @api
	*/
	POSTRENDER: "postrender",
	/**
	* Triggered when the map starts moving.
	* @event module:ol/MapEvent~MapEvent#movestart
	* @api
	*/
	MOVESTART: "movestart",
	/**
	* Triggered after the map is moved.
	* @event module:ol/MapEvent~MapEvent#moveend
	* @api
	*/
	MOVEEND: "moveend",
	/**
	* Triggered when loading of additional map data (tiles, images, features) starts.
	* @event module:ol/MapEvent~MapEvent#loadstart
	* @api
	*/
	LOADSTART: "loadstart",
	/**
	* Triggered when loading of additional map data has completed.
	* @event module:ol/MapEvent~MapEvent#loadend
	* @api
	*/
	LOADEND: "loadend"
};
/***
* @typedef {'postrender'|'movestart'|'moveend'|'loadstart'|'loadend'} Types
*/
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/MapProperty.js
/**
* @module ol/MapProperty
*/
/**
* @enum {string}
*/
var MapProperty_default = {
	LAYERGROUP: "layergroup",
	SIZE: "size",
	TARGET: "target",
	VIEW: "view"
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/structs/PriorityQueue.js
/**
* @module ol/structs/PriorityQueue
*/
/**
* @type {number}
*/
var DROP = Infinity;
/**
* @classdesc
* Priority queue.
*
* The implementation is inspired from the Closure Library's Heap class and
* Python's heapq module.
*
* See https://github.com/google/closure-library/blob/master/closure/goog/structs/heap.js
* and https://hg.python.org/cpython/file/2.7/Lib/heapq.py.
*
* @template T
*/
var PriorityQueue = class {
	/**
	* @param {function(T): number} priorityFunction Priority function.
	* @param {function(T): string} keyFunction Key function.
	*/
	constructor(priorityFunction, keyFunction) {
		/**
		* @type {function(T): number}
		* @private
		*/
		this.priorityFunction_ = priorityFunction;
		/**
		* @type {function(T): string}
		* @private
		*/
		this.keyFunction_ = keyFunction;
		/**
		* @type {Array<T>}
		* @private
		*/
		this.elements_ = [];
		/**
		* @type {Array<number>}
		* @private
		*/
		this.priorities_ = [];
		/**
		* @type {!Object<string, boolean>}
		* @private
		*/
		this.queuedElements_ = {};
	}
	/**
	* FIXME empty description for jsdoc
	*/
	clear() {
		this.elements_.length = 0;
		this.priorities_.length = 0;
		clear(this.queuedElements_);
	}
	/**
	* Remove and return the highest-priority element. O(log N).
	* @return {T} Element.
	*/
	dequeue() {
		const elements = this.elements_;
		const priorities = this.priorities_;
		const element = elements[0];
		if (elements.length == 1) {
			elements.length = 0;
			priorities.length = 0;
		} else {
			elements[0] = elements.pop();
			priorities[0] = priorities.pop();
			this.siftUp_(0);
		}
		const elementKey = this.keyFunction_(element);
		delete this.queuedElements_[elementKey];
		return element;
	}
	/**
	* Enqueue an element. O(log N).
	* @param {T} element Element.
	* @return {boolean} The element was added to the queue.
	*/
	enqueue(element) {
		assert(!(this.keyFunction_(element) in this.queuedElements_), "Tried to enqueue an `element` that was already added to the queue");
		const priority = this.priorityFunction_(element);
		if (priority != Infinity) {
			this.elements_.push(element);
			this.priorities_.push(priority);
			this.queuedElements_[this.keyFunction_(element)] = true;
			this.siftDown_(0, this.elements_.length - 1);
			return true;
		}
		return false;
	}
	/**
	* @return {number} Count.
	*/
	getCount() {
		return this.elements_.length;
	}
	/**
	* Gets the index of the left child of the node at the given index.
	* @param {number} index The index of the node to get the left child for.
	* @return {number} The index of the left child.
	* @private
	*/
	getLeftChildIndex_(index) {
		return index * 2 + 1;
	}
	/**
	* Gets the index of the right child of the node at the given index.
	* @param {number} index The index of the node to get the right child for.
	* @return {number} The index of the right child.
	* @private
	*/
	getRightChildIndex_(index) {
		return index * 2 + 2;
	}
	/**
	* Gets the index of the parent of the node at the given index.
	* @param {number} index The index of the node to get the parent for.
	* @return {number} The index of the parent.
	* @private
	*/
	getParentIndex_(index) {
		return index - 1 >> 1;
	}
	/**
	* Make this a heap. O(N).
	* @private
	*/
	heapify_() {
		let i;
		for (i = (this.elements_.length >> 1) - 1; i >= 0; i--) this.siftUp_(i);
	}
	/**
	* @return {boolean} Is empty.
	*/
	isEmpty() {
		return this.elements_.length === 0;
	}
	/**
	* @param {string} key Key.
	* @return {boolean} Is key queued.
	*/
	isKeyQueued(key) {
		return key in this.queuedElements_;
	}
	/**
	* @param {T} element Element.
	* @return {boolean} Is queued.
	*/
	isQueued(element) {
		return this.isKeyQueued(this.keyFunction_(element));
	}
	/**
	* @param {number} index The index of the node to move down.
	* @private
	*/
	siftUp_(index) {
		const elements = this.elements_;
		const priorities = this.priorities_;
		const count = elements.length;
		const element = elements[index];
		const priority = priorities[index];
		const startIndex = index;
		while (index < count >> 1) {
			const lIndex = this.getLeftChildIndex_(index);
			const rIndex = this.getRightChildIndex_(index);
			const smallerChildIndex = rIndex < count && priorities[rIndex] < priorities[lIndex] ? rIndex : lIndex;
			elements[index] = elements[smallerChildIndex];
			priorities[index] = priorities[smallerChildIndex];
			index = smallerChildIndex;
		}
		elements[index] = element;
		priorities[index] = priority;
		this.siftDown_(startIndex, index);
	}
	/**
	* @param {number} startIndex The index of the root.
	* @param {number} index The index of the node to move up.
	* @private
	*/
	siftDown_(startIndex, index) {
		const elements = this.elements_;
		const priorities = this.priorities_;
		const element = elements[index];
		const priority = priorities[index];
		while (index > startIndex) {
			const parentIndex = this.getParentIndex_(index);
			if (priorities[parentIndex] > priority) {
				elements[index] = elements[parentIndex];
				priorities[index] = priorities[parentIndex];
				index = parentIndex;
			} else break;
		}
		elements[index] = element;
		priorities[index] = priority;
	}
	/**
	* FIXME empty description for jsdoc
	*/
	reprioritize() {
		const priorityFunction = this.priorityFunction_;
		const elements = this.elements_;
		const priorities = this.priorities_;
		let index = 0;
		const n = elements.length;
		let element, i, priority;
		for (i = 0; i < n; ++i) {
			element = elements[i];
			priority = priorityFunction(element);
			if (priority == Infinity) delete this.queuedElements_[this.keyFunction_(element)];
			else {
				priorities[index] = priority;
				elements[index++] = element;
			}
		}
		elements.length = index;
		priorities.length = index;
		this.heapify_();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/TileQueue.js
/**
* @module ol/TileQueue
*/
/**
* @typedef {function(import("./Tile.js").default, string, import("./coordinate.js").Coordinate, number): number} PriorityFunction
*/
var TileQueue = class extends PriorityQueue {
	/**
	* @param {PriorityFunction} tilePriorityFunction Tile priority function.
	* @param {function(): ?} tileChangeCallback Function called on each tile change event.
	*/
	constructor(tilePriorityFunction, tileChangeCallback) {
		super(
			/**
			* @param {Array} element Element.
			* @return {number} Priority.
			*/
			function(element) {
				return tilePriorityFunction.apply(null, element);
			},
			/**
			* @param {Array} element Element.
			* @return {string} Key.
			*/
			function(element) {
				return element[0].getKey();
			}
		);
		/** @private */
		this.boundHandleTileChange_ = this.handleTileChange.bind(this);
		/**
		* @private
		* @type {function(): ?}
		*/
		this.tileChangeCallback_ = tileChangeCallback;
		/**
		* @private
		* @type {number}
		*/
		this.tilesLoading_ = 0;
		/**
		* @private
		* @type {!Object<string,boolean>}
		*/
		this.tilesLoadingKeys_ = {};
	}
	/**
	* @param {Array} element Element.
	* @return {boolean} The element was added to the queue.
	*/
	enqueue(element) {
		const added = super.enqueue(element);
		if (added) element[0].addEventListener(EventType_default$2.CHANGE, this.boundHandleTileChange_);
		return added;
	}
	/**
	* @return {number} Number of tiles loading.
	*/
	getTilesLoading() {
		return this.tilesLoading_;
	}
	/**
	* @param {import("./events/Event.js").default} event Event.
	* @protected
	*/
	handleTileChange(event) {
		const tile = event.target;
		const state = tile.getState();
		if (state === TileState_default.LOADED || state === TileState_default.ERROR || state === TileState_default.EMPTY) {
			if (state !== TileState_default.ERROR) tile.removeEventListener(EventType_default$2.CHANGE, this.boundHandleTileChange_);
			const tileKey = tile.getKey();
			if (tileKey in this.tilesLoadingKeys_) {
				delete this.tilesLoadingKeys_[tileKey];
				--this.tilesLoading_;
			}
			this.tileChangeCallback_();
		}
	}
	/**
	* @param {number} maxTotalLoading Maximum number tiles to load simultaneously.
	* @param {number} maxNewLoads Maximum number of new tiles to load.
	*/
	loadMoreTiles(maxTotalLoading, maxNewLoads) {
		let newLoads = 0;
		let state, tile, tileKey;
		while (this.tilesLoading_ < maxTotalLoading && newLoads < maxNewLoads && this.getCount() > 0) {
			tile = this.dequeue()[0];
			tileKey = tile.getKey();
			state = tile.getState();
			if (state === TileState_default.IDLE && !(tileKey in this.tilesLoadingKeys_)) {
				this.tilesLoadingKeys_[tileKey] = true;
				++this.tilesLoading_;
				++newLoads;
				tile.load();
			}
		}
	}
};
/**
* @param {import('./Map.js').FrameState} frameState Frame state.
* @param {import("./Tile.js").default} tile Tile.
* @param {string} tileSourceKey Tile source key.
* @param {import("./coordinate.js").Coordinate} tileCenter Tile center.
* @param {number} tileResolution Tile resolution.
* @return {number} Tile priority.
*/
function getTilePriority(frameState, tile, tileSourceKey, tileCenter, tileResolution) {
	if (!frameState || !(tileSourceKey in frameState.wantedTiles)) return DROP;
	if (!frameState.wantedTiles[tileSourceKey][tile.getKey()]) return DROP;
	const center = frameState.viewState.center;
	const deltaX = tileCenter[0] - center[0];
	const deltaY = tileCenter[1] - center[1];
	return 65536 * Math.log(tileResolution) + Math.sqrt(deltaX * deltaX + deltaY * deltaY) / tileResolution;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/control/Control.js
/**
* @module ol/control/Control
*/
/**
* @typedef {Object} Options
* @property {HTMLElement} [element] The element is the control's
* container element. This only needs to be specified if you're developing
* a custom control.
* @property {function(import("../MapEvent.js").default):void} [render] Function called when
* the control should be re-rendered. This is called in a `requestAnimationFrame`
* callback.
* @property {HTMLElement|string} [target] Specify a target if you want
* the control to be rendered outside of the map's viewport.
*/
/**
* @classdesc
* A control is a visible widget with a DOM element in a fixed position on the
* screen. They can involve user input (buttons), or be informational only;
* the position is determined using CSS. By default these are placed in the
* container with CSS class name `ol-overlaycontainer-stopevent`, but can use
* any outside DOM element.
*
* This is the base class for controls. You can use it for simple custom
* controls by creating the element with listeners, creating an instance:
* ```js
* const myControl = new Control({element: myElement});
* ```
* and then adding this to the map.
*
* The main advantage of having this as a control rather than a simple separate
* DOM element is that preventing propagation is handled for you. Controls
* will also be objects in a {@link module:ol/Collection~Collection}, so you can use their methods.
*
* You can also extend this base for your own control class. See
* examples/custom-controls for an example of how to do this.
*
* @api
*/
var Control = class extends BaseObject {
	/**
	* @param {Options} options Control options.
	*/
	constructor(options) {
		super();
		const element = options.element;
		if (element && !options.target && !element.style.pointerEvents) element.style.pointerEvents = "auto";
		/**
		* @protected
		* @type {HTMLElement}
		*/
		this.element = element ? element : null;
		/**
		* @private
		* @type {HTMLElement}
		*/
		this.target_ = null;
		/**
		* @private
		* @type {import("../Map.js").default|null}
		*/
		this.map_ = null;
		/**
		* @protected
		* @type {!Array<import("../events.js").EventsKey>}
		*/
		this.listenerKeys = [];
		if (options.render) this.render = options.render;
		if (options.target) this.setTarget(options.target);
	}
	/**
	* Clean up.
	*/
	disposeInternal() {
		removeNode(this.element);
		super.disposeInternal();
	}
	/**
	* Get the map associated with this control.
	* @return {import("../Map.js").default|null} Map.
	* @api
	*/
	getMap() {
		return this.map_;
	}
	/**
	* Remove the control from its current map and attach it to the new map.
	* Pass `null` to just remove the control from the current map.
	* Subclasses may set up event handlers to get notified about changes to
	* the map here.
	* @param {import("../Map.js").default|null} map Map.
	* @api
	*/
	setMap(map) {
		if (this.map_) removeNode(this.element);
		for (let i = 0, ii = this.listenerKeys.length; i < ii; ++i) unlistenByKey(this.listenerKeys[i]);
		this.listenerKeys.length = 0;
		this.map_ = map;
		if (map) {
			(this.target_ ? this.target_ : map.getOverlayContainerStopEvent()).appendChild(this.element);
			if (this.render !== VOID) this.listenerKeys.push(listen(map, MapEventType_default.POSTRENDER, this.render, this));
			map.render();
		}
	}
	/**
	* Renders the control.
	* @param {import("../MapEvent.js").default} mapEvent Map event.
	* @api
	*/
	render(mapEvent) {}
	/**
	* This function is used to set a target element for the control. It has no
	* effect if it is called after the control has been added to the map (i.e.
	* after `setMap` is called on the control). If no `target` is set in the
	* options passed to the control constructor and if `setTarget` is not called
	* then the control is added to the map's overlay container.
	* @param {HTMLElement|string} target Target.
	* @api
	*/
	setTarget(target) {
		this.target_ = typeof target === "string" ? document.getElementById(target) : target;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/control/Attribution.js
/**
* @module ol/control/Attribution
*/
/**
* @typedef {Object} Options
* @property {string} [className='ol-attribution'] CSS class name.
* @property {HTMLElement|string} [target] Specify a target if you
* want the control to be rendered outside of the map's
* viewport.
* @property {boolean} [collapsible] Specify if attributions can
* be collapsed. If not specified, sources control this behavior with their
* `attributionsCollapsible` setting.
* @property {boolean} [collapsed=true] Specify if attributions should
* be collapsed at startup.
* @property {string} [tipLabel='Attributions'] Text label to use for the button tip.
* @property {string|HTMLElement} [label='i'] Text label to use for the
* collapsed attributions button.
* Instead of text, also an element (e.g. a `span` element) can be used.
* @property {string} [expandClassName=className + '-expand'] CSS class name for the
* collapsed attributions button.
* @property {string|HTMLElement} [collapseLabel='›'] Text label to use
* for the expanded attributions button.
* Instead of text, also an element (e.g. a `span` element) can be used.
* @property {string} [collapseClassName=className + '-collapse'] CSS class name for the
* expanded attributions button.
* @property {function(import("../MapEvent.js").default):void} [render] Function called when
* the control should be re-rendered. This is called in a `requestAnimationFrame`
* callback.
*/
/**
* @classdesc
* Control to show all the attributions associated with the layer sources
* in the map. This control is one of the default controls included in maps.
* By default it will show in the bottom right portion of the map, but this can
* be changed by using a css selector for `.ol-attribution`.
*
* @api
*/
var Attribution = class extends Control {
	/**
	* @param {Options} [options] Attribution options.
	*/
	constructor(options) {
		options = options ? options : {};
		super({
			element: document.createElement("div"),
			render: options.render,
			target: options.target
		});
		/**
		* @private
		* @type {HTMLElement}
		*/
		this.ulElement_ = document.createElement("ul");
		/**
		* @private
		* @type {boolean}
		*/
		this.collapsed_ = options.collapsed !== void 0 ? options.collapsed : true;
		/**
		* @private
		* @type {boolean}
		*/
		this.userCollapsed_ = this.collapsed_;
		/**
		* @private
		* @type {boolean}
		*/
		this.overrideCollapsible_ = options.collapsible !== void 0;
		/**
		* @private
		* @type {boolean}
		*/
		this.collapsible_ = options.collapsible !== void 0 ? options.collapsible : true;
		if (!this.collapsible_) this.collapsed_ = false;
		const className = options.className !== void 0 ? options.className : "ol-attribution";
		const tipLabel = options.tipLabel !== void 0 ? options.tipLabel : "Attributions";
		const expandClassName = options.expandClassName !== void 0 ? options.expandClassName : className + "-expand";
		const collapseLabel = options.collapseLabel !== void 0 ? options.collapseLabel : "›";
		const collapseClassName = options.collapseClassName !== void 0 ? options.collapseClassName : className + "-collapse";
		if (typeof collapseLabel === "string") {
			/**
			* @private
			* @type {HTMLElement}
			*/
			this.collapseLabel_ = document.createElement("span");
			this.collapseLabel_.textContent = collapseLabel;
			this.collapseLabel_.className = collapseClassName;
		} else this.collapseLabel_ = collapseLabel;
		const label = options.label !== void 0 ? options.label : "i";
		if (typeof label === "string") {
			/**
			* @private
			* @type {HTMLElement}
			*/
			this.label_ = document.createElement("span");
			this.label_.textContent = label;
			this.label_.className = expandClassName;
		} else this.label_ = label;
		const activeLabel = this.collapsible_ && !this.collapsed_ ? this.collapseLabel_ : this.label_;
		/**
		* @private
		* @type {HTMLElement}
		*/
		this.toggleButton_ = document.createElement("button");
		this.toggleButton_.setAttribute("type", "button");
		this.toggleButton_.setAttribute("aria-expanded", String(!this.collapsed_));
		this.toggleButton_.title = tipLabel;
		this.toggleButton_.appendChild(activeLabel);
		this.toggleButton_.addEventListener(EventType_default$2.CLICK, this.handleClick_.bind(this), false);
		const cssClasses = className + " " + CLASS_UNSELECTABLE + " " + CLASS_CONTROL + (this.collapsed_ && this.collapsible_ ? " " + CLASS_COLLAPSED : "") + (this.collapsible_ ? "" : " ol-uncollapsible");
		const element = this.element;
		element.className = cssClasses;
		element.appendChild(this.toggleButton_);
		element.appendChild(this.ulElement_);
		/**
		* A list of currently rendered resolutions.
		* @type {Array<string>}
		* @private
		*/
		this.renderedAttributions_ = [];
		/**
		* @private
		* @type {boolean}
		*/
		this.renderedVisible_ = true;
	}
	/**
	* Collect a list of visible attributions and set the collapsible state.
	* @param {import("../Map.js").FrameState} frameState Frame state.
	* @return {Array<string>} Attributions.
	* @private
	*/
	collectSourceAttributions_(frameState) {
		const visibleAttributions = Array.from(new Set(this.getMap().getAllLayers().flatMap((layer) => layer.getAttributions(frameState))));
		const collapsible = !this.getMap().getAllLayers().some((layer) => layer.getSource() && layer.getSource().getAttributionsCollapsible() === false);
		if (!this.overrideCollapsible_) this.setCollapsible(collapsible);
		return visibleAttributions;
	}
	/**
	* @private
	* @param {?import("../Map.js").FrameState} frameState Frame state.
	*/
	async updateElement_(frameState) {
		if (!frameState) {
			if (this.renderedVisible_) {
				this.element.style.display = "none";
				this.renderedVisible_ = false;
			}
			return;
		}
		const attributions = await Promise.all(this.collectSourceAttributions_(frameState).map((attribution) => toPromise(() => attribution)));
		const visible = attributions.length > 0;
		if (this.renderedVisible_ != visible) {
			this.element.style.display = visible ? "" : "none";
			this.renderedVisible_ = visible;
		}
		if (equals$1(attributions, this.renderedAttributions_)) return;
		removeChildren(this.ulElement_);
		for (let i = 0, ii = attributions.length; i < ii; ++i) {
			const element = document.createElement("li");
			element.innerHTML = attributions[i];
			this.ulElement_.appendChild(element);
		}
		this.renderedAttributions_ = attributions;
	}
	/**
	* @param {MouseEvent} event The event to handle
	* @private
	*/
	handleClick_(event) {
		event.preventDefault();
		this.handleToggle_();
		this.userCollapsed_ = this.collapsed_;
	}
	/**
	* @private
	*/
	handleToggle_() {
		this.element.classList.toggle(CLASS_COLLAPSED);
		if (this.collapsed_) replaceNode(this.collapseLabel_, this.label_);
		else replaceNode(this.label_, this.collapseLabel_);
		this.collapsed_ = !this.collapsed_;
		this.toggleButton_.setAttribute("aria-expanded", String(!this.collapsed_));
	}
	/**
	* Return `true` if the attribution is collapsible, `false` otherwise.
	* @return {boolean} True if the widget is collapsible.
	* @api
	*/
	getCollapsible() {
		return this.collapsible_;
	}
	/**
	* Set whether the attribution should be collapsible.
	* @param {boolean} collapsible True if the widget is collapsible.
	* @api
	*/
	setCollapsible(collapsible) {
		if (this.collapsible_ === collapsible) return;
		this.collapsible_ = collapsible;
		this.element.classList.toggle("ol-uncollapsible");
		if (this.userCollapsed_) this.handleToggle_();
	}
	/**
	* Collapse or expand the attribution according to the passed parameter. Will
	* not do anything if the attribution isn't collapsible or if the current
	* collapsed state is already the one requested.
	* @param {boolean} collapsed True if the widget is collapsed.
	* @api
	*/
	setCollapsed(collapsed) {
		this.userCollapsed_ = collapsed;
		if (!this.collapsible_ || this.collapsed_ === collapsed) return;
		this.handleToggle_();
	}
	/**
	* Return `true` when the attribution is currently collapsed or `false`
	* otherwise.
	* @return {boolean} True if the widget is collapsed.
	* @api
	*/
	getCollapsed() {
		return this.collapsed_;
	}
	/**
	* Update the attribution element.
	* @param {import("../MapEvent.js").default} mapEvent Map event.
	* @override
	*/
	render(mapEvent) {
		this.updateElement_(mapEvent.frameState);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/control/Rotate.js
/**
* @module ol/control/Rotate
*/
/**
* @typedef {Object} Options
* @property {string} [className='ol-rotate'] CSS class name.
* @property {string|HTMLElement} [label='⇧'] Text label to use for the rotate button.
* Instead of text, also an element (e.g. a `span` element) can be used.
* @property {string} [tipLabel='Reset rotation'] Text label to use for the rotate tip.
* @property {string} [compassClassName='ol-compass'] CSS class name for the compass.
* @property {number} [duration=250] Animation duration in milliseconds.
* @property {boolean} [autoHide=true] Hide the control when rotation is 0.
* @property {function(import("../MapEvent.js").default):void} [render] Function called when the control should
* be re-rendered. This is called in a `requestAnimationFrame` callback.
* @property {function():void} [resetNorth] Function called when the control is clicked.
* This will override the default `resetNorth`.
* @property {HTMLElement|string} [target] Specify a target if you want the control to be
* rendered outside of the map's viewport.
*/
/**
* @classdesc
* A button control to reset rotation to 0.
* To style this control use css selector `.ol-rotate`. A `.ol-hidden` css
* selector is added to the button when the rotation is 0.
*
* @api
*/
var Rotate = class extends Control {
	/**
	* @param {Options} [options] Rotate options.
	*/
	constructor(options) {
		options = options ? options : {};
		super({
			element: document.createElement("div"),
			render: options.render,
			target: options.target
		});
		const className = options.className !== void 0 ? options.className : "ol-rotate";
		const label = options.label !== void 0 ? options.label : "⇧";
		const compassClassName = options.compassClassName !== void 0 ? options.compassClassName : "ol-compass";
		/**
		* @type {HTMLElement}
		* @private
		*/
		this.label_ = null;
		if (typeof label === "string") {
			this.label_ = document.createElement("span");
			this.label_.className = compassClassName;
			this.label_.textContent = label;
		} else {
			this.label_ = label;
			this.label_.classList.add(compassClassName);
		}
		const tipLabel = options.tipLabel ? options.tipLabel : "Reset rotation";
		const button = document.createElement("button");
		button.className = className + "-reset";
		button.setAttribute("type", "button");
		button.title = tipLabel;
		button.appendChild(this.label_);
		button.addEventListener(EventType_default$2.CLICK, this.handleClick_.bind(this), false);
		const cssClasses = className + " " + CLASS_UNSELECTABLE + " " + CLASS_CONTROL;
		const element = this.element;
		element.className = cssClasses;
		element.appendChild(button);
		this.callResetNorth_ = options.resetNorth ? options.resetNorth : void 0;
		/**
		* @type {number}
		* @private
		*/
		this.duration_ = options.duration !== void 0 ? options.duration : 250;
		/**
		* @type {boolean}
		* @private
		*/
		this.autoHide_ = options.autoHide !== void 0 ? options.autoHide : true;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.rotation_ = void 0;
		if (this.autoHide_) this.element.classList.add(CLASS_HIDDEN);
	}
	/**
	* @param {MouseEvent} event The event to handle
	* @private
	*/
	handleClick_(event) {
		event.preventDefault();
		if (this.callResetNorth_ !== void 0) this.callResetNorth_();
		else this.resetNorth_();
	}
	/**
	* @private
	*/
	resetNorth_() {
		const view = this.getMap().getView();
		if (!view) return;
		const rotation = view.getRotation();
		if (rotation !== void 0) if (this.duration_ > 0 && rotation % (2 * Math.PI) !== 0) view.animate({
			rotation: 0,
			duration: this.duration_,
			easing: easeOut
		});
		else view.setRotation(0);
	}
	/**
	* Update the rotate control element.
	* @param {import("../MapEvent.js").default} mapEvent Map event.
	* @override
	*/
	render(mapEvent) {
		const frameState = mapEvent.frameState;
		if (!frameState) return;
		const rotation = frameState.viewState.rotation;
		if (rotation != this.rotation_) {
			const transform = "rotate(" + rotation + "rad)";
			if (this.autoHide_) {
				const contains = this.element.classList.contains(CLASS_HIDDEN);
				if (!contains && rotation === 0) this.element.classList.add(CLASS_HIDDEN);
				else if (contains && rotation !== 0) this.element.classList.remove(CLASS_HIDDEN);
			}
			this.label_.style.transform = transform;
		}
		this.rotation_ = rotation;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/control/Zoom.js
/**
* @module ol/control/Zoom
*/
/**
* @typedef {Object} Options
* @property {number} [duration=250] Animation duration in milliseconds.
* @property {string} [className='ol-zoom'] CSS class name.
* @property {string} [zoomInClassName=className + '-in'] CSS class name for the zoom-in button.
* @property {string} [zoomOutClassName=className + '-out'] CSS class name for the zoom-out button.
* @property {string|HTMLElement} [zoomInLabel='+'] Text label to use for the zoom-in
* button. Instead of text, also an element (e.g. a `span` element) can be used.
* @property {string|HTMLElement} [zoomOutLabel='–'] Text label to use for the zoom-out button.
* Instead of text, also an element (e.g. a `span` element) can be used.
* @property {string} [zoomInTipLabel='Zoom in'] Text label to use for the button tip.
* @property {string} [zoomOutTipLabel='Zoom out'] Text label to use for the button tip.
* @property {number} [delta=1] The zoom delta applied on each click.
* @property {HTMLElement|string} [target] Specify a target if you want the control to be
* rendered outside of the map's viewport.
*/
/**
* @classdesc
* A control with 2 buttons, one for zoom in and one for zoom out.
* This control is one of the default controls of a map. To style this control
* use css selectors `.ol-zoom-in` and `.ol-zoom-out`.
*
* @api
*/
var Zoom = class extends Control {
	/**
	* @param {Options} [options] Zoom options.
	*/
	constructor(options) {
		options = options ? options : {};
		super({
			element: document.createElement("div"),
			target: options.target
		});
		const className = options.className !== void 0 ? options.className : "ol-zoom";
		const delta = options.delta !== void 0 ? options.delta : 1;
		const zoomInClassName = options.zoomInClassName !== void 0 ? options.zoomInClassName : className + "-in";
		const zoomOutClassName = options.zoomOutClassName !== void 0 ? options.zoomOutClassName : className + "-out";
		const zoomInLabel = options.zoomInLabel !== void 0 ? options.zoomInLabel : "+";
		const zoomOutLabel = options.zoomOutLabel !== void 0 ? options.zoomOutLabel : "–";
		const zoomInTipLabel = options.zoomInTipLabel !== void 0 ? options.zoomInTipLabel : "Zoom in";
		const zoomOutTipLabel = options.zoomOutTipLabel !== void 0 ? options.zoomOutTipLabel : "Zoom out";
		const inElement = document.createElement("button");
		inElement.className = zoomInClassName;
		inElement.setAttribute("type", "button");
		inElement.title = zoomInTipLabel;
		inElement.appendChild(typeof zoomInLabel === "string" ? document.createTextNode(zoomInLabel) : zoomInLabel);
		inElement.addEventListener(EventType_default$2.CLICK, this.handleClick_.bind(this, delta), false);
		const outElement = document.createElement("button");
		outElement.className = zoomOutClassName;
		outElement.setAttribute("type", "button");
		outElement.title = zoomOutTipLabel;
		outElement.appendChild(typeof zoomOutLabel === "string" ? document.createTextNode(zoomOutLabel) : zoomOutLabel);
		outElement.addEventListener(EventType_default$2.CLICK, this.handleClick_.bind(this, -delta), false);
		const cssClasses = className + " " + CLASS_UNSELECTABLE + " " + CLASS_CONTROL;
		const element = this.element;
		element.className = cssClasses;
		element.appendChild(inElement);
		element.appendChild(outElement);
		/**
		* @type {number}
		* @private
		*/
		this.duration_ = options.duration !== void 0 ? options.duration : 250;
	}
	/**
	* @param {number} delta Zoom delta.
	* @param {MouseEvent} event The event to handle
	* @private
	*/
	handleClick_(delta, event) {
		event.preventDefault();
		this.zoomByDelta_(delta);
	}
	/**
	* @param {number} delta Zoom delta.
	* @private
	*/
	zoomByDelta_(delta) {
		const view = this.getMap().getView();
		if (!view) return;
		const currentZoom = view.getZoom();
		if (currentZoom !== void 0) {
			const newZoom = view.getConstrainedZoom(currentZoom + delta);
			if (this.duration_ > 0) {
				if (view.getAnimating()) view.cancelAnimations();
				view.animate({
					zoom: newZoom,
					duration: this.duration_,
					easing: easeOut
				});
			} else view.setZoom(newZoom);
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/control/defaults.js
/**
* @module ol/control/defaults
*/
/**
* @typedef {Object} DefaultsOptions
* @property {boolean} [attribution=true] Include
* {@link module:ol/control/Attribution~Attribution}.
* @property {import("./Attribution.js").Options} [attributionOptions]
* Options for {@link module:ol/control/Attribution~Attribution}.
* @property {boolean} [rotate=true] Include
* {@link module:ol/control/Rotate~Rotate}.
* @property {import("./Rotate.js").Options} [rotateOptions] Options
* for {@link module:ol/control/Rotate~Rotate}.
* @property {boolean} [zoom] Include {@link module:ol/control/Zoom~Zoom}.
* @property {import("./Zoom.js").Options} [zoomOptions] Options for
* {@link module:ol/control/Zoom~Zoom}.
*/
/**
* Set of controls included in maps by default. Unless configured otherwise,
* this returns a collection containing an instance of each of the following
* controls:
* * {@link module:ol/control/Zoom~Zoom}
* * {@link module:ol/control/Rotate~Rotate}
* * {@link module:ol/control/Attribution~Attribution}
*
* @param {DefaultsOptions} [options] Options for the default controls.
* @return {Collection<import("./Control.js").default>} A collection of controls
* to be used with the {@link module:ol/Map~Map} constructor's `controls` option.
* @api
*/
function defaults$1(options) {
	options = options ? options : {};
	/** @type {Collection<import("./Control.js").default>} */
	const controls = new Collection();
	if (options.zoom !== void 0 ? options.zoom : true) controls.push(new Zoom(options.zoomOptions));
	if (options.rotate !== void 0 ? options.rotate : true) controls.push(new Rotate(options.rotateOptions));
	if (options.attribution !== void 0 ? options.attribution : true) controls.push(new Attribution(options.attributionOptions));
	return controls;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/Property.js
/**
* @module ol/interaction/Property
*/
/**
* @enum {string}
*/
var Property_default = { ACTIVE: "active" };
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/Interaction.js
/**
* @module ol/interaction/Interaction
*/
/***
* @template Return
* @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
*   import("../Observable").OnSignature<import("../ObjectEventType").Types|
*     'change:active', import("../Object").ObjectEvent, Return> &
*   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
*     'change:active', Return>} InteractionOnSignature
*/
/**
* Object literal with config options for interactions.
* @typedef {Object} InteractionOptions
* @property {function(import("../MapBrowserEvent.js").default):boolean} handleEvent
* Method called by the map to notify the interaction that a browser event was
* dispatched to the map. If the function returns a falsy value, propagation of
* the event to other interactions in the map's interactions chain will be
* prevented (this includes functions with no explicit return). The interactions
* are traversed in reverse order of the interactions collection of the map.
*/
/**
* @classdesc
* Abstract base class; normally only used for creating subclasses and not
* instantiated in apps.
* User actions that change the state of the map. Some are similar to controls,
* but are not associated with a DOM element.
* For example, {@link module:ol/interaction/KeyboardZoom~KeyboardZoom} is
* functionally the same as {@link module:ol/control/Zoom~Zoom}, but triggered
* by a keyboard event not a button element event.
* Although interactions do not have a DOM element, some of them do render
* vectors and so are visible on the screen.
* @api
*/
var Interaction = class extends BaseObject {
	/**
	* @param {InteractionOptions} [options] Options.
	*/
	constructor(options) {
		super();
		/***
		* @type {InteractionOnSignature<import("../events").EventsKey>}
		*/
		this.on;
		/***
		* @type {InteractionOnSignature<import("../events").EventsKey>}
		*/
		this.once;
		/***
		* @type {InteractionOnSignature<void>}
		*/
		this.un;
		if (options && options.handleEvent) this.handleEvent = options.handleEvent;
		/**
		* @private
		* @type {import("../Map.js").default|null}
		*/
		this.map_ = null;
		this.setActive(true);
	}
	/**
	* Return whether the interaction is currently active.
	* @return {boolean} `true` if the interaction is active, `false` otherwise.
	* @observable
	* @api
	*/
	getActive() {
		return this.get(Property_default.ACTIVE);
	}
	/**
	* Get the map associated with this interaction.
	* @return {import("../Map.js").default|null} Map.
	* @api
	*/
	getMap() {
		return this.map_;
	}
	/**
	* Handles the {@link module:ol/MapBrowserEvent~MapBrowserEvent map browser event}.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
	* @return {boolean} `false` to stop event propagation.
	* @api
	*/
	handleEvent(mapBrowserEvent) {
		return true;
	}
	/**
	* Activate or deactivate the interaction.
	* @param {boolean} active Active.
	* @observable
	* @api
	*/
	setActive(active) {
		this.set(Property_default.ACTIVE, active);
	}
	/**
	* Remove the interaction from its current map and attach it to the new map.
	* Subclasses may set up event handlers to get notified about changes to
	* the map here.
	* @param {import("../Map.js").default|null} map Map.
	*/
	setMap(map) {
		this.map_ = map;
	}
};
/**
* @param {import("../View.js").default} view View.
* @param {import("../coordinate.js").Coordinate} delta Delta.
* @param {number} [duration] Duration.
*/
function pan(view, delta, duration) {
	const currentCenter = view.getCenterInternal();
	if (currentCenter) {
		const center = [currentCenter[0] + delta[0], currentCenter[1] + delta[1]];
		view.animateInternal({
			duration: duration !== void 0 ? duration : 250,
			easing: linear,
			center: view.getConstrainedCenter(center)
		});
	}
}
/**
* @param {import("../View.js").default} view View.
* @param {number} delta Delta from previous zoom level.
* @param {import("../coordinate.js").Coordinate} [anchor] Anchor coordinate in the user projection.
* @param {number} [duration] Duration.
*/
function zoomByDelta(view, delta, anchor, duration) {
	const currentZoom = view.getZoom();
	if (currentZoom === void 0) return;
	const newZoom = view.getConstrainedZoom(currentZoom + delta);
	const newResolution = view.getResolutionForZoom(newZoom);
	if (view.getAnimating()) view.cancelAnimations();
	view.animate({
		resolution: newResolution,
		anchor,
		duration: duration !== void 0 ? duration : 250,
		easing: easeOut
	});
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/DoubleClickZoom.js
/**
* @module ol/interaction/DoubleClickZoom
*/
/**
* @typedef {Object} Options
* @property {number} [duration=250] Animation duration in milliseconds.
* @property {number} [delta=1] The zoom delta applied on each double click.
*/
/**
* @classdesc
* Allows the user to zoom by double-clicking on the map.
* @api
*/
var DoubleClickZoom = class extends Interaction {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		super();
		options = options ? options : {};
		/**
		* @private
		* @type {number}
		*/
		this.delta_ = options.delta ? options.delta : 1;
		/**
		* @private
		* @type {number}
		*/
		this.duration_ = options.duration !== void 0 ? options.duration : 250;
	}
	/**
	* Handles the {@link module:ol/MapBrowserEvent~MapBrowserEvent map browser event} (if it was a
	* doubleclick) and eventually zooms the map.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
	* @return {boolean} `false` to stop event propagation.
	*/
	handleEvent(mapBrowserEvent) {
		let stopEvent = false;
		if (mapBrowserEvent.type == MapBrowserEventType_default.DBLCLICK) {
			const browserEvent = mapBrowserEvent.originalEvent;
			const map = mapBrowserEvent.map;
			const anchor = mapBrowserEvent.coordinate;
			const delta = browserEvent.shiftKey ? -this.delta_ : this.delta_;
			zoomByDelta(map.getView(), delta, anchor, this.duration_);
			browserEvent.preventDefault();
			stopEvent = true;
		}
		return !stopEvent;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/Pointer.js
/**
* @module ol/interaction/Pointer
*/
/**
* @typedef {Object} Options
* @property {function(import("../MapBrowserEvent.js").default):boolean} [handleDownEvent]
* Function handling "down" events. If the function returns `true` then a drag
* sequence is started.
* @property {function(import("../MapBrowserEvent.js").default):void} [handleDragEvent]
* Function handling "drag" events. This function is called on "move" events
* during a drag sequence.
* @property {function(import("../MapBrowserEvent.js").default):boolean} [handleEvent]
* Method called by the map to notify the interaction that a browser event was
* dispatched to the map. The function may return `false` to prevent the
* propagation of the event to other interactions in the map's interactions
* chain.
* @property {function(import("../MapBrowserEvent.js").default):void} [handleMoveEvent]
* Function handling "move" events. This function is called on "move" events.
* This functions is also called during a drag sequence, so during a drag
* sequence both the `handleDragEvent` function and this function are called.
* If `handleDownEvent` is defined and it returns true this function will not
* be called during a drag sequence.
* @property {function(import("../MapBrowserEvent.js").default):boolean} [handleUpEvent]
*  Function handling "up" events. If the function returns `false` then the
* current drag sequence is stopped.
* @property {function(boolean):boolean} [stopDown]
* Should the down event be propagated to other interactions, or should be
* stopped?
*/
/**
* @classdesc
* Base class that calls user-defined functions on `down`, `move` and `up`
* events. This class also manages "drag sequences".
*
* When the `handleDownEvent` user function returns `true` a drag sequence is
* started. During a drag sequence the `handleDragEvent` user function is
* called on `move` events. The drag sequence ends when the `handleUpEvent`
* user function is called and returns `false`.
* @api
*/
var PointerInteraction = class extends Interaction {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		options = options ? options : {};
		super(options);
		if (options.handleDownEvent) this.handleDownEvent = options.handleDownEvent;
		if (options.handleDragEvent) this.handleDragEvent = options.handleDragEvent;
		if (options.handleMoveEvent) this.handleMoveEvent = options.handleMoveEvent;
		if (options.handleUpEvent) this.handleUpEvent = options.handleUpEvent;
		if (options.stopDown) this.stopDown = options.stopDown;
		/**
		* @type {boolean}
		* @protected
		*/
		this.handlingDownUpSequence = false;
		/**
		* @type {Array<PointerEvent>}
		* @protected
		*/
		this.targetPointers = [];
	}
	/**
	* Returns the current number of pointers involved in the interaction,
	* e.g. `2` when two fingers are used.
	* @return {number} The number of pointers.
	* @api
	*/
	getPointerCount() {
		return this.targetPointers.length;
	}
	/**
	* Handle pointer down events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @return {boolean} If the event was consumed.
	* @protected
	*/
	handleDownEvent(mapBrowserEvent) {
		return false;
	}
	/**
	* Handle pointer drag events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @protected
	*/
	handleDragEvent(mapBrowserEvent) {}
	/**
	* Handles the {@link module:ol/MapBrowserEvent~MapBrowserEvent map browser event} and may call into
	* other functions, if event sequences like e.g. 'drag' or 'down-up' etc. are
	* detected.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
	* @return {boolean} `false` to stop event propagation.
	* @api
	*/
	handleEvent(mapBrowserEvent) {
		if (!mapBrowserEvent.originalEvent) return true;
		let stopEvent = false;
		this.updateTrackedPointers_(mapBrowserEvent);
		if (this.handlingDownUpSequence) {
			if (mapBrowserEvent.type == MapBrowserEventType_default.POINTERDRAG) {
				this.handleDragEvent(mapBrowserEvent);
				mapBrowserEvent.originalEvent.preventDefault();
			} else if (mapBrowserEvent.type == MapBrowserEventType_default.POINTERUP) {
				const handledUp = this.handleUpEvent(mapBrowserEvent);
				this.handlingDownUpSequence = handledUp && this.targetPointers.length > 0;
			}
		} else if (mapBrowserEvent.type == MapBrowserEventType_default.POINTERDOWN) {
			const handled = this.handleDownEvent(mapBrowserEvent);
			this.handlingDownUpSequence = handled;
			stopEvent = this.stopDown(handled);
		} else if (mapBrowserEvent.type == MapBrowserEventType_default.POINTERMOVE) this.handleMoveEvent(mapBrowserEvent);
		return !stopEvent;
	}
	/**
	* Handle pointer move events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @protected
	*/
	handleMoveEvent(mapBrowserEvent) {}
	/**
	* Handle pointer up events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @return {boolean} If the event was consumed.
	* @protected
	*/
	handleUpEvent(mapBrowserEvent) {
		return false;
	}
	/**
	* This function is used to determine if "down" events should be propagated
	* to other interactions or should be stopped.
	* @param {boolean} handled Was the event handled by the interaction?
	* @return {boolean} Should the `down` event be stopped?
	*/
	stopDown(handled) {
		return handled;
	}
	/**
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @private
	*/
	updateTrackedPointers_(mapBrowserEvent) {
		if (mapBrowserEvent.activePointers) this.targetPointers = mapBrowserEvent.activePointers;
	}
};
/**
* @param {Array<PointerEvent>} pointerEvents List of events.
* @return {{clientX: number, clientY: number}} Centroid pixel.
*/
function centroid(pointerEvents) {
	const length = pointerEvents.length;
	let clientX = 0;
	let clientY = 0;
	for (let i = 0; i < length; i++) {
		clientX += pointerEvents[i].clientX;
		clientY += pointerEvents[i].clientY;
	}
	return {
		clientX: clientX / length,
		clientY: clientY / length
	};
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/events/condition.js
/**
* A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
* `{boolean}`. If the condition is met, true should be returned.
*
* @typedef {function(this: ?, import("../MapBrowserEvent.js").default): boolean} Condition
*/
/**
* Creates a condition function that passes when all provided conditions pass.
* @param {...Condition} var_args Conditions to check.
* @return {Condition} Condition function.
*/
function all(var_args) {
	const conditions = arguments;
	/**
	* @param {import("../MapBrowserEvent.js").default} event Event.
	* @return {boolean} All conditions passed.
	*/
	return function(event) {
		let pass = true;
		for (let i = 0, ii = conditions.length; i < ii; ++i) {
			pass = pass && conditions[i](event);
			if (!pass) break;
		}
		return pass;
	};
}
/**
* Return `true` if only the alt-key and shift-key is pressed, `false` otherwise
* (e.g. when additionally the platform-modifier-key is pressed).
*
* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
* @return {boolean} True if only the alt and shift keys are pressed.
* @api
*/
var altShiftKeysOnly = function(mapBrowserEvent) {
	const originalEvent = mapBrowserEvent.originalEvent;
	return originalEvent.altKey && !(originalEvent.metaKey || originalEvent.ctrlKey) && originalEvent.shiftKey;
};
/**
* Return `true` if the map has the focus. This condition requires a map target
* element with a `tabindex` attribute, e.g. `<div id="map" tabindex="1">`.
*
* @param {import("../MapBrowserEvent.js").default} event Map browser event.
* @return {boolean} The map has the focus.
* @api
*/
var focus = function(event) {
	const targetElement = event.map.getTargetElement();
	const activeElement = event.map.getOwnerDocument().activeElement;
	return targetElement.contains(activeElement);
};
/**
* Return `true` if the map has the focus or no 'tabindex' attribute set.
*
* @param {import("../MapBrowserEvent.js").default} event Map browser event.
* @return {boolean} The map container has the focus or no 'tabindex' attribute.
*/
var focusWithTabindex = function(event) {
	return event.map.getTargetElement().hasAttribute("tabindex") ? focus(event) : true;
};
/**
* Return always true.
*
* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
* @return {boolean} True.
* @api
*/
var always = TRUE;
/**
* Return `true` if the event has an "action"-producing mouse button.
*
* By definition, this includes left-click on windows/linux, and left-click
* without the ctrl key on Macs.
*
* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
* @return {boolean} The result.
*/
var mouseActionButton = function(mapBrowserEvent) {
	const originalEvent = mapBrowserEvent.originalEvent;
	return originalEvent.button == 0 && !(WEBKIT && MAC && originalEvent.ctrlKey);
};
/**
* Return `true` if no modifier key (alt-, shift- or platform-modifier-key) is
* pressed.
*
* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
* @return {boolean} True only if there no modifier keys are pressed.
* @api
*/
var noModifierKeys = function(mapBrowserEvent) {
	const originalEvent = mapBrowserEvent.originalEvent;
	return !originalEvent.altKey && !(originalEvent.metaKey || originalEvent.ctrlKey) && !originalEvent.shiftKey;
};
/**
* Return `true` if the platform-modifier-key (the meta-key on Mac,
* ctrl-key otherwise) is pressed.
*
* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
* @return {boolean} True if the platform modifier key is pressed.
* @api
*/
var platformModifierKey = function(mapBrowserEvent) {
	const originalEvent = mapBrowserEvent.originalEvent;
	return MAC ? originalEvent.metaKey : originalEvent.ctrlKey;
};
/**
* Return `true` if only the shift-key is pressed, `false` otherwise (e.g. when
* additionally the alt-key is pressed).
*
* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
* @return {boolean} True if only the shift key is pressed.
* @api
*/
var shiftKeyOnly = function(mapBrowserEvent) {
	const originalEvent = mapBrowserEvent.originalEvent;
	return !originalEvent.altKey && !(originalEvent.metaKey || originalEvent.ctrlKey) && originalEvent.shiftKey;
};
/**
* Return `true` if the target element is not editable, i.e. not an `input`,
* `select`, or `textarea` element and no `contenteditable` attribute is
* set or inherited, `false` otherwise.
*
* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
* @return {boolean} True only if the target element is not editable.
* @api
*/
var targetNotEditable = function(mapBrowserEvent) {
	const originalEvent = mapBrowserEvent.originalEvent;
	const tagName = originalEvent.target.tagName;
	return tagName !== "INPUT" && tagName !== "SELECT" && tagName !== "TEXTAREA" && !originalEvent.target.isContentEditable;
};
/**
* Return `true` if the event originates from a mouse device.
*
* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
* @return {boolean} True if the event originates from a mouse device.
* @api
*/
var mouseOnly = function(mapBrowserEvent) {
	const pointerEvent = mapBrowserEvent.originalEvent;
	assert(pointerEvent !== void 0, "mapBrowserEvent must originate from a pointer event");
	return pointerEvent.pointerType == "mouse";
};
/**
* Return `true` if the event originates from a primary pointer in
* contact with the surface or if the left mouse button is pressed.
* See https://www.w3.org/TR/pointerevents/#button-states.
*
* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
* @return {boolean} True if the event originates from a primary pointer.
* @api
*/
var primaryAction = function(mapBrowserEvent) {
	const pointerEvent = mapBrowserEvent.originalEvent;
	assert(pointerEvent !== void 0, "mapBrowserEvent must originate from a pointer event");
	return pointerEvent.isPrimary && pointerEvent.button === 0;
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/DragPan.js
/**
* @module ol/interaction/DragPan
*/
/**
* @typedef {Object} Options
* @property {import("../events/condition.js").Condition} [condition] A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
* to indicate whether that event should be handled.
* Default is {@link module:ol/events/condition.noModifierKeys} and {@link module:ol/events/condition.primaryAction}.
* @property {boolean} [onFocusOnly=false] When the map's target has a `tabindex` attribute set,
* the interaction will only handle events when the map has the focus.
* @property {import("../Kinetic.js").default} [kinetic] Kinetic inertia to apply to the pan.
*/
/**
* @classdesc
* Allows the user to pan the map by dragging the map.
* @api
*/
var DragPan = class extends PointerInteraction {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		super({ stopDown: FALSE });
		options = options ? options : {};
		/**
		* @private
		* @type {import("../Kinetic.js").default|undefined}
		*/
		this.kinetic_ = options.kinetic;
		/**
		* @type {import("../pixel.js").Pixel}
		*/
		this.lastCentroid = null;
		/**
		* @type {number}
		*/
		this.lastPointersCount_;
		/**
		* @type {boolean}
		*/
		this.panning_ = false;
		const condition = options.condition ? options.condition : all(noModifierKeys, primaryAction);
		/**
		* @private
		* @type {import("../events/condition.js").Condition}
		*/
		this.condition_ = options.onFocusOnly ? all(focusWithTabindex, condition) : condition;
		/**
		* @private
		* @type {boolean}
		*/
		this.noKinetic_ = false;
	}
	/**
	* Handle pointer drag events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	*/
	handleDragEvent(mapBrowserEvent) {
		const map = mapBrowserEvent.map;
		if (!this.panning_) {
			this.panning_ = true;
			map.getView().beginInteraction();
		}
		const targetPointers = this.targetPointers;
		const centroid$1 = map.getEventPixel(centroid(targetPointers));
		if (targetPointers.length == this.lastPointersCount_) {
			if (this.kinetic_) this.kinetic_.update(centroid$1[0], centroid$1[1]);
			if (this.lastCentroid) {
				const delta = [this.lastCentroid[0] - centroid$1[0], centroid$1[1] - this.lastCentroid[1]];
				const view = mapBrowserEvent.map.getView();
				scale$1(delta, view.getResolution());
				rotate$1(delta, view.getRotation());
				view.adjustCenterInternal(delta);
			}
		} else if (this.kinetic_) this.kinetic_.begin();
		this.lastCentroid = centroid$1;
		this.lastPointersCount_ = targetPointers.length;
		mapBrowserEvent.originalEvent.preventDefault();
	}
	/**
	* Handle pointer up events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @return {boolean} If the event was consumed.
	*/
	handleUpEvent(mapBrowserEvent) {
		const map = mapBrowserEvent.map;
		const view = map.getView();
		if (this.targetPointers.length === 0) {
			if (!this.noKinetic_ && this.kinetic_ && this.kinetic_.end()) {
				const distance = this.kinetic_.getDistance();
				const angle = this.kinetic_.getAngle();
				const center = view.getCenterInternal();
				const centerpx = map.getPixelFromCoordinateInternal(center);
				const dest = map.getCoordinateFromPixelInternal([centerpx[0] - distance * Math.cos(angle), centerpx[1] - distance * Math.sin(angle)]);
				view.animateInternal({
					center: view.getConstrainedCenter(dest),
					duration: 500,
					easing: easeOut
				});
			}
			if (this.panning_) {
				this.panning_ = false;
				view.endInteraction();
			}
			return false;
		}
		if (this.kinetic_) this.kinetic_.begin();
		this.lastCentroid = null;
		return true;
	}
	/**
	* Handle pointer down events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @return {boolean} If the event was consumed.
	*/
	handleDownEvent(mapBrowserEvent) {
		if (this.targetPointers.length > 0 && this.condition_(mapBrowserEvent)) {
			const view = mapBrowserEvent.map.getView();
			this.lastCentroid = null;
			if (view.getAnimating()) view.cancelAnimations();
			if (this.kinetic_) this.kinetic_.begin();
			this.noKinetic_ = this.targetPointers.length > 1;
			return true;
		}
		return false;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/DragRotate.js
/**
* @module ol/interaction/DragRotate
*/
/**
* @typedef {Object} Options
* @property {import("../events/condition.js").Condition} [condition] A function that takes an
* {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
* to indicate whether that event should be handled.
* Default is {@link module:ol/events/condition.altShiftKeysOnly}.
* @property {number} [duration=250] Animation duration in milliseconds.
*/
/**
* @classdesc
* Allows the user to rotate the map by clicking and dragging on the map,
* normally combined with an {@link module:ol/events/condition} that limits
* it to when the alt and shift keys are held down.
*
* This interaction is only supported for mouse devices.
* @api
*/
var DragRotate = class extends PointerInteraction {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		options = options ? options : {};
		super({ stopDown: FALSE });
		/**
		* @private
		* @type {import("../events/condition.js").Condition}
		*/
		this.condition_ = options.condition ? options.condition : altShiftKeysOnly;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.lastAngle_ = void 0;
		/**
		* @private
		* @type {number}
		*/
		this.duration_ = options.duration !== void 0 ? options.duration : 250;
	}
	/**
	* Handle pointer drag events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	*/
	handleDragEvent(mapBrowserEvent) {
		if (!mouseOnly(mapBrowserEvent)) return;
		const map = mapBrowserEvent.map;
		const view = map.getView();
		if (view.getConstraints().rotation === disable) return;
		const size = map.getSize();
		const offset = mapBrowserEvent.pixel;
		const theta = Math.atan2(size[1] / 2 - offset[1], offset[0] - size[0] / 2);
		if (this.lastAngle_ !== void 0) {
			const delta = theta - this.lastAngle_;
			view.adjustRotationInternal(-delta);
		}
		this.lastAngle_ = theta;
	}
	/**
	* Handle pointer up events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @return {boolean} If the event was consumed.
	*/
	handleUpEvent(mapBrowserEvent) {
		if (!mouseOnly(mapBrowserEvent)) return true;
		mapBrowserEvent.map.getView().endInteraction(this.duration_);
		return false;
	}
	/**
	* Handle pointer down events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @return {boolean} If the event was consumed.
	*/
	handleDownEvent(mapBrowserEvent) {
		if (!mouseOnly(mapBrowserEvent)) return false;
		if (mouseActionButton(mapBrowserEvent) && this.condition_(mapBrowserEvent)) {
			mapBrowserEvent.map.getView().beginInteraction();
			this.lastAngle_ = void 0;
			return true;
		}
		return false;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/render/Box.js
/**
* @module ol/render/Box
*/
var RenderBox = class extends Disposable {
	/**
	* @param {string} className CSS class name.
	*/
	constructor(className) {
		super();
		/**
		* @type {import("../geom/Polygon.js").default}
		* @private
		*/
		this.geometry_ = null;
		/**
		* @type {HTMLDivElement}
		* @private
		*/
		this.element_ = document.createElement("div");
		this.element_.style.position = "absolute";
		this.element_.style.pointerEvents = "auto";
		this.element_.className = "ol-box " + className;
		/**
		* @private
		* @type {import("../Map.js").default|null}
		*/
		this.map_ = null;
		/**
		* @private
		* @type {import("../pixel.js").Pixel}
		*/
		this.startPixel_ = null;
		/**
		* @private
		* @type {import("../pixel.js").Pixel}
		*/
		this.endPixel_ = null;
	}
	/**
	* Clean up.
	*/
	disposeInternal() {
		this.setMap(null);
	}
	/**
	* @private
	*/
	render_() {
		const startPixel = this.startPixel_;
		const endPixel = this.endPixel_;
		const px = "px";
		const style = this.element_.style;
		style.left = Math.min(startPixel[0], endPixel[0]) + px;
		style.top = Math.min(startPixel[1], endPixel[1]) + px;
		style.width = Math.abs(endPixel[0] - startPixel[0]) + px;
		style.height = Math.abs(endPixel[1] - startPixel[1]) + px;
	}
	/**
	* @param {import("../Map.js").default|null} map Map.
	*/
	setMap(map) {
		if (this.map_) {
			this.map_.getOverlayContainer().removeChild(this.element_);
			const style = this.element_.style;
			style.left = "inherit";
			style.top = "inherit";
			style.width = "inherit";
			style.height = "inherit";
		}
		this.map_ = map;
		if (this.map_) this.map_.getOverlayContainer().appendChild(this.element_);
	}
	/**
	* @param {import("../pixel.js").Pixel} startPixel Start pixel.
	* @param {import("../pixel.js").Pixel} endPixel End pixel.
	*/
	setPixels(startPixel, endPixel) {
		this.startPixel_ = startPixel;
		this.endPixel_ = endPixel;
		this.createOrUpdateGeometry();
		this.render_();
	}
	/**
	* Creates or updates the cached geometry.
	*/
	createOrUpdateGeometry() {
		if (!this.map_) return;
		const startPixel = this.startPixel_;
		const endPixel = this.endPixel_;
		const coordinates = [
			startPixel,
			[startPixel[0], endPixel[1]],
			endPixel,
			[endPixel[0], startPixel[1]]
		].map(this.map_.getCoordinateFromPixelInternal, this.map_);
		coordinates[4] = coordinates[0].slice();
		if (!this.geometry_) this.geometry_ = new Polygon([coordinates]);
		else this.geometry_.setCoordinates([coordinates]);
	}
	/**
	* @return {import("../geom/Polygon.js").default} Geometry.
	*/
	getGeometry() {
		return this.geometry_;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/DragBox.js
/**
* @module ol/interaction/DragBox
*/
/**
* A function that takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and two
* {@link module:ol/pixel~Pixel}s and returns a `{boolean}`. If the condition is met,
* true should be returned.
* @typedef {function(this: ?, import("../MapBrowserEvent.js").default, import("../pixel.js").Pixel, import("../pixel.js").Pixel):boolean} EndCondition
*/
/**
* @typedef {Object} Options
* @property {string} [className='ol-dragbox'] CSS class name for styling the box.
* @property {import("../events/condition.js").Condition} [condition] A function that takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a boolean
* to indicate whether that event should be handled.
* Default is {@link ol/events/condition~mouseActionButton}.
* @property {number} [minArea=64] The minimum area of the box in pixel, this value is used by the default
* `boxEndCondition` function.
* @property {EndCondition} [boxEndCondition] A function that takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and two
* {@link module:ol/pixel~Pixel}s to indicate whether a `boxend` event should be fired.
* Default is `true` if the area of the box is bigger than the `minArea` option.
* @property {function(this:DragBox, import("../MapBrowserEvent.js").default):void} [onBoxEnd] Code to execute just
* before `boxend` is fired.
*/
/**
* @enum {string}
*/
var DragBoxEventType = {
	/**
	* Triggered upon drag box start.
	* @event DragBoxEvent#boxstart
	* @api
	*/
	BOXSTART: "boxstart",
	/**
	* Triggered on drag when box is active.
	* @event DragBoxEvent#boxdrag
	* @api
	*/
	BOXDRAG: "boxdrag",
	/**
	* Triggered upon drag box end.
	* @event DragBoxEvent#boxend
	* @api
	*/
	BOXEND: "boxend",
	/**
	* Triggered upon drag box canceled.
	* @event DragBoxEvent#boxcancel
	* @api
	*/
	BOXCANCEL: "boxcancel"
};
/**
* @classdesc
* Events emitted by {@link module:ol/interaction/DragBox~DragBox} instances are instances of
* this type.
*/
var DragBoxEvent = class extends BaseEvent {
	/**
	* @param {string} type The event type.
	* @param {import("../coordinate.js").Coordinate} coordinate The event coordinate.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Originating event.
	*/
	constructor(type, coordinate, mapBrowserEvent) {
		super(type);
		/**
		* The coordinate of the drag event.
		* @const
		* @type {import("../coordinate.js").Coordinate}
		* @api
		*/
		this.coordinate = coordinate;
		/**
		* @const
		* @type {import("../MapBrowserEvent.js").default}
		* @api
		*/
		this.mapBrowserEvent = mapBrowserEvent;
	}
};
/***
* @template Return
* @typedef {import("../Observable").OnSignature<import("../Observable").EventTypes, import("../events/Event.js").default, Return> &
*   import("../Observable").OnSignature<import("../ObjectEventType").Types|
*     'change:active', import("../Object").ObjectEvent, Return> &
*   import("../Observable").OnSignature<'boxcancel'|'boxdrag'|'boxend'|'boxstart', DragBoxEvent, Return> &
*   import("../Observable").CombinedOnSignature<import("../Observable").EventTypes|import("../ObjectEventType").Types|
*     'change:active'|'boxcancel'|'boxdrag'|'boxend', Return>} DragBoxOnSignature
*/
/**
* @classdesc
* Allows the user to draw a vector box by clicking and dragging on the map,
* normally combined with an {@link module:ol/events/condition} that limits
* it to when the shift or other key is held down. This is used, for example,
* for zooming to a specific area of the map
* (see {@link module:ol/interaction/DragZoom~DragZoom} and
* {@link module:ol/interaction/DragRotateAndZoom~DragRotateAndZoom}).
*
* @fires DragBoxEvent
* @api
*/
var DragBox = class extends PointerInteraction {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		super();
		/***
		* @type {DragBoxOnSignature<import("../events").EventsKey>}
		*/
		this.on;
		/***
		* @type {DragBoxOnSignature<import("../events").EventsKey>}
		*/
		this.once;
		/***
		* @type {DragBoxOnSignature<void>}
		*/
		this.un;
		options = options ? options : {};
		/**
		* @type {import("../render/Box.js").default}
		* @private
		*/
		this.box_ = new RenderBox(options.className || "ol-dragbox");
		/**
		* @type {number}
		* @private
		*/
		this.minArea_ = options.minArea !== void 0 ? options.minArea : 64;
		if (options.onBoxEnd) this.onBoxEnd = options.onBoxEnd;
		/**
		* @type {import("../pixel.js").Pixel}
		* @private
		*/
		this.startPixel_ = null;
		/**
		* @private
		* @type {import("../events/condition.js").Condition}
		*/
		this.condition_ = options.condition ? options.condition : mouseActionButton;
		/**
		* @private
		* @type {EndCondition}
		*/
		this.boxEndCondition_ = options.boxEndCondition ? options.boxEndCondition : this.defaultBoxEndCondition;
	}
	/**
	* The default condition for determining whether the boxend event
	* should fire.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent The originating MapBrowserEvent
	*     leading to the box end.
	* @param {import("../pixel.js").Pixel} startPixel The starting pixel of the box.
	* @param {import("../pixel.js").Pixel} endPixel The end pixel of the box.
	* @return {boolean} Whether or not the boxend condition should be fired.
	*/
	defaultBoxEndCondition(mapBrowserEvent, startPixel, endPixel) {
		const width = endPixel[0] - startPixel[0];
		const height = endPixel[1] - startPixel[1];
		return width * width + height * height >= this.minArea_;
	}
	/**
	* Returns geometry of last drawn box.
	* @return {import("../geom/Polygon.js").default} Geometry.
	* @api
	*/
	getGeometry() {
		return this.box_.getGeometry();
	}
	/**
	* Handle pointer drag events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	*/
	handleDragEvent(mapBrowserEvent) {
		if (!this.startPixel_) return;
		this.box_.setPixels(this.startPixel_, mapBrowserEvent.pixel);
		this.dispatchEvent(new DragBoxEvent(DragBoxEventType.BOXDRAG, mapBrowserEvent.coordinate, mapBrowserEvent));
	}
	/**
	* Handle pointer up events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @return {boolean} If the event was consumed.
	*/
	handleUpEvent(mapBrowserEvent) {
		if (!this.startPixel_) return false;
		this.box_.setMap(null);
		const completeBox = this.boxEndCondition_(mapBrowserEvent, this.startPixel_, mapBrowserEvent.pixel);
		if (completeBox) this.onBoxEnd(mapBrowserEvent);
		this.dispatchEvent(new DragBoxEvent(completeBox ? DragBoxEventType.BOXEND : DragBoxEventType.BOXCANCEL, mapBrowserEvent.coordinate, mapBrowserEvent));
		return false;
	}
	/**
	* Handle pointer down events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @return {boolean} If the event was consumed.
	*/
	handleDownEvent(mapBrowserEvent) {
		if (this.condition_(mapBrowserEvent)) {
			this.startPixel_ = mapBrowserEvent.pixel;
			this.box_.setMap(mapBrowserEvent.map);
			this.box_.setPixels(this.startPixel_, this.startPixel_);
			this.dispatchEvent(new DragBoxEvent(DragBoxEventType.BOXSTART, mapBrowserEvent.coordinate, mapBrowserEvent));
			return true;
		}
		return false;
	}
	/**
	* Function to execute just before `onboxend` is fired
	* @param {import("../MapBrowserEvent.js").default} event Event.
	*/
	onBoxEnd(event) {}
	/**
	* Activate or deactivate the interaction.
	* @param {boolean} active Active.
	* @observable
	* @api
	*/
	setActive(active) {
		if (!active) {
			this.box_.setMap(null);
			if (this.startPixel_) {
				this.dispatchEvent(new DragBoxEvent(DragBoxEventType.BOXCANCEL, this.startPixel_, null));
				this.startPixel_ = null;
			}
		}
		super.setActive(active);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/DragZoom.js
/**
* @module ol/interaction/DragZoom
*/
/**
* @typedef {Object} Options
* @property {string} [className='ol-dragzoom'] CSS class name for styling the
* box.
* @property {import("../events/condition.js").Condition} [condition] A function that
* takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
* boolean to indicate whether that event should be handled.
* Default is {@link module:ol/events/condition.shiftKeyOnly}.
* @property {number} [duration=200] Animation duration in milliseconds.
* @property {boolean} [out=false] Use interaction for zooming out.
* @property {number} [minArea=64] The minimum area of the box in pixel, this value is used by the parent default
* `boxEndCondition` function.
*/
/**
* @classdesc
* Allows the user to zoom the map by clicking and dragging on the map,
* normally combined with an {@link module:ol/events/condition} that limits
* it to when a key, shift by default, is held down.
*
* To change the style of the box, use CSS and the `.ol-dragzoom` selector, or
* your custom one configured with `className`.
* @api
*/
var DragZoom = class extends DragBox {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		options = options ? options : {};
		const condition = options.condition ? options.condition : shiftKeyOnly;
		super({
			condition,
			className: options.className || "ol-dragzoom",
			minArea: options.minArea
		});
		/**
		* @private
		* @type {number}
		*/
		this.duration_ = options.duration !== void 0 ? options.duration : 200;
		/**
		* @private
		* @type {boolean}
		*/
		this.out_ = options.out !== void 0 ? options.out : false;
	}
	/**
	* Function to execute just before `onboxend` is fired
	* @param {import("../MapBrowserEvent.js").default} event Event.
	*/
	onBoxEnd(event) {
		const view = this.getMap().getView();
		let geometry = this.getGeometry();
		if (this.out_) {
			const rotatedExtent = view.rotatedExtentForGeometry(geometry);
			const resolution = view.getResolutionForExtentInternal(rotatedExtent);
			const factor = view.getResolution() / resolution;
			geometry = geometry.clone();
			geometry.scale(factor * factor);
		}
		view.fitInternal(geometry, {
			duration: this.duration_,
			easing: easeOut
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/events/Key.js
/**
* @module ol/events/Key
*/
/**
* @enum {string}
* @const
*/
var Key_default = {
	LEFT: "ArrowLeft",
	UP: "ArrowUp",
	RIGHT: "ArrowRight",
	DOWN: "ArrowDown"
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/KeyboardPan.js
/**
* @module ol/interaction/KeyboardPan
*/
/**
* @typedef {Object} Options
* @property {import("../events/condition.js").Condition} [condition] A function that
* takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
* boolean to indicate whether that event should be handled. Default is
* {@link module:ol/events/condition.noModifierKeys} and
* {@link module:ol/events/condition.targetNotEditable}.
* @property {number} [duration=100] Animation duration in milliseconds.
* @property {number} [pixelDelta=128] The amount of pixels to pan on each key
* press.
*/
/**
* @classdesc
* Allows the user to pan the map using keyboard arrows.
* Note that, although this interaction is by default included in maps,
* the keys can only be used when browser focus is on the element to which
* the keyboard events are attached. By default, this is the map div,
* though you can change this with the `keyboardEventTarget` in
* {@link module:ol/Map~Map}. `document` never loses focus but, for any other
* element, focus will have to be on, and returned to, this element if the keys
* are to function.
* See also {@link module:ol/interaction/KeyboardZoom~KeyboardZoom}.
* @api
*/
var KeyboardPan = class extends Interaction {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		super();
		options = options || {};
		/**
		* @private
		* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Browser event.
		* @return {boolean} Combined condition result.
		*/
		this.defaultCondition_ = function(mapBrowserEvent) {
			return noModifierKeys(mapBrowserEvent) && targetNotEditable(mapBrowserEvent);
		};
		/**
		* @private
		* @type {import("../events/condition.js").Condition}
		*/
		this.condition_ = options.condition !== void 0 ? options.condition : this.defaultCondition_;
		/**
		* @private
		* @type {number}
		*/
		this.duration_ = options.duration !== void 0 ? options.duration : 100;
		/**
		* @private
		* @type {number}
		*/
		this.pixelDelta_ = options.pixelDelta !== void 0 ? options.pixelDelta : 128;
	}
	/**
	* Handles the {@link module:ol/MapBrowserEvent~MapBrowserEvent map browser event} if it was a
	* `KeyEvent`, and decides the direction to pan to (if an arrow key was
	* pressed).
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
	* @return {boolean} `false` to stop event propagation.
	*/
	handleEvent(mapBrowserEvent) {
		let stopEvent = false;
		if (mapBrowserEvent.type == EventType_default$2.KEYDOWN) {
			const keyEvent = mapBrowserEvent.originalEvent;
			const key = keyEvent.key;
			if (this.condition_(mapBrowserEvent) && (key == Key_default.DOWN || key == Key_default.LEFT || key == Key_default.RIGHT || key == Key_default.UP)) {
				const view = mapBrowserEvent.map.getView();
				const mapUnitsDelta = view.getResolution() * this.pixelDelta_;
				let deltaX = 0, deltaY = 0;
				if (key == Key_default.DOWN) deltaY = -mapUnitsDelta;
				else if (key == Key_default.LEFT) deltaX = -mapUnitsDelta;
				else if (key == Key_default.RIGHT) deltaX = mapUnitsDelta;
				else deltaY = mapUnitsDelta;
				const delta = [deltaX, deltaY];
				rotate$1(delta, view.getRotation());
				pan(view, delta, this.duration_);
				keyEvent.preventDefault();
				stopEvent = true;
			}
		}
		return !stopEvent;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/KeyboardZoom.js
/**
* @module ol/interaction/KeyboardZoom
*/
/**
* @typedef {Object} Options
* @property {number} [duration=100] Animation duration in milliseconds.
* @property {import("../events/condition.js").Condition} [condition] A function that
* takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
* boolean to indicate whether that event should be handled. The default condition is
* that {@link module:ol/events/condition.targetNotEditable} is fulfilled and that
* the platform modifier key isn't pressed
* (!{@link module:ol/events/condition.platformModifierKey}).
* @property {number} [delta=1] The zoom level delta on each key press.
*/
/**
* @classdesc
* Allows the user to zoom the map using keyboard + and -.
* Note that, although this interaction is by default included in maps,
* the keys can only be used when browser focus is on the element to which
* the keyboard events are attached. By default, this is the map div,
* though you can change this with the `keyboardEventTarget` in
* {@link module:ol/Map~Map}. `document` never loses focus but, for any other
* element, focus will have to be on, and returned to, this element if the keys
* are to function.
* See also {@link module:ol/interaction/KeyboardPan~KeyboardPan}.
* @api
*/
var KeyboardZoom = class extends Interaction {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		super();
		options = options ? options : {};
		/**
		* @private
		* @type {import("../events/condition.js").Condition}
		*/
		this.condition_ = options.condition ? options.condition : function(mapBrowserEvent) {
			return !platformModifierKey(mapBrowserEvent) && targetNotEditable(mapBrowserEvent);
		};
		/**
		* @private
		* @type {number}
		*/
		this.delta_ = options.delta ? options.delta : 1;
		/**
		* @private
		* @type {number}
		*/
		this.duration_ = options.duration !== void 0 ? options.duration : 100;
	}
	/**
	* Handles the {@link module:ol/MapBrowserEvent~MapBrowserEvent map browser event} if it was a
	* `KeyEvent`, and decides whether to zoom in or out (depending on whether the
	* key pressed was '+' or '-').
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
	* @return {boolean} `false` to stop event propagation.
	*/
	handleEvent(mapBrowserEvent) {
		let stopEvent = false;
		if (mapBrowserEvent.type == EventType_default$2.KEYDOWN || mapBrowserEvent.type == EventType_default$2.KEYPRESS) {
			const keyEvent = mapBrowserEvent.originalEvent;
			const key = keyEvent.key;
			if (this.condition_(mapBrowserEvent) && (key === "+" || key === "-")) {
				const map = mapBrowserEvent.map;
				const delta = key === "+" ? this.delta_ : -this.delta_;
				zoomByDelta(map.getView(), delta, void 0, this.duration_);
				keyEvent.preventDefault();
				stopEvent = true;
			}
		}
		return !stopEvent;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/MouseWheelZoom.js
/**
* @module ol/interaction/MouseWheelZoom
*/
/**
* @typedef {'trackpad' | 'wheel'} Mode
*/
/**
* @typedef {Object} Options
* @property {import("../events/condition.js").Condition} [condition] A function that
* takes an {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
* boolean to indicate whether that event should be handled. Default is
* {@link module:ol/events/condition.always}.
* @property {boolean} [onFocusOnly=false] When the map's target has a `tabindex` attribute set,
* the interaction will only handle events when the map has the focus.
* @property {number} [maxDelta=1] Maximum mouse wheel delta.
* @property {number} [duration=250] Animation duration in milliseconds.
* @property {number} [timeout=80] Mouse wheel timeout duration in milliseconds.
* @property {boolean} [useAnchor=true] Enable zooming using the mouse's
* location as the anchor. When set to `false`, zooming in and out will zoom to
* the center of the screen instead of zooming on the mouse's location.
* @property {boolean} [constrainResolution=false] If true, the mouse wheel zoom
* event will always animate to the closest zoom level after an interaction;
* false means intermediary zoom levels are allowed.
*/
/**
* @classdesc
* Allows the user to zoom the map by scrolling the mouse wheel.
* @api
*/
var MouseWheelZoom = class extends Interaction {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		options = options ? options : {};
		super(options);
		/**
		* @private
		* @type {number}
		*/
		this.totalDelta_ = 0;
		/**
		* @private
		* @type {number}
		*/
		this.lastDelta_ = 0;
		/**
		* @private
		* @type {number}
		*/
		this.maxDelta_ = options.maxDelta !== void 0 ? options.maxDelta : 1;
		/**
		* @private
		* @type {number}
		*/
		this.duration_ = options.duration !== void 0 ? options.duration : 250;
		/**
		* @private
		* @type {number}
		*/
		this.timeout_ = options.timeout !== void 0 ? options.timeout : 80;
		/**
		* @private
		* @type {boolean}
		*/
		this.useAnchor_ = options.useAnchor !== void 0 ? options.useAnchor : true;
		/**
		* @private
		* @type {boolean}
		*/
		this.constrainResolution_ = options.constrainResolution !== void 0 ? options.constrainResolution : false;
		const condition = options.condition ? options.condition : always;
		/**
		* @private
		* @type {import("../events/condition.js").Condition}
		*/
		this.condition_ = options.onFocusOnly ? all(focusWithTabindex, condition) : condition;
		/**
		* @private
		* @type {?import("../coordinate.js").Coordinate}
		*/
		this.lastAnchor_ = null;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.startTime_ = void 0;
		/**
		* @private
		* @type {ReturnType<typeof setTimeout>}
		*/
		this.timeoutId_;
		/**
		* @private
		* @type {Mode|undefined}
		*/
		this.mode_ = void 0;
		/**
		* Trackpad events separated by this delay will be considered separate
		* interactions.
		* @private
		* @type {number}
		*/
		this.trackpadEventGap_ = 400;
		/**
		* @private
		* @type {ReturnType<typeof setTimeout>}
		*/
		this.trackpadTimeoutId_;
		/**
		* The number of delta values per zoom level
		* @private
		* @type {number}
		*/
		this.deltaPerZoom_ = 300;
	}
	/**
	* @private
	*/
	endInteraction_() {
		this.trackpadTimeoutId_ = void 0;
		const map = this.getMap();
		if (!map) return;
		map.getView().endInteraction(void 0, this.lastDelta_ ? this.lastDelta_ > 0 ? 1 : -1 : 0, this.lastAnchor_);
	}
	/**
	* Handles the {@link module:ol/MapBrowserEvent~MapBrowserEvent map browser event} (if it was a mousewheel-event) and eventually
	* zooms the map.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
	* @return {boolean} `false` to stop event propagation.
	*/
	handleEvent(mapBrowserEvent) {
		if (!this.condition_(mapBrowserEvent)) return true;
		if (mapBrowserEvent.type !== EventType_default$2.WHEEL) return true;
		const map = mapBrowserEvent.map;
		const wheelEvent = mapBrowserEvent.originalEvent;
		wheelEvent.preventDefault();
		if (this.useAnchor_) this.lastAnchor_ = mapBrowserEvent.coordinate;
		let delta;
		if (mapBrowserEvent.type == EventType_default$2.WHEEL) {
			delta = wheelEvent.deltaY;
			if (FIREFOX && wheelEvent.deltaMode === WheelEvent.DOM_DELTA_PIXEL) delta /= DEVICE_PIXEL_RATIO;
			if (wheelEvent.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 40;
		}
		if (delta === 0) return false;
		this.lastDelta_ = delta;
		const now = Date.now();
		if (this.startTime_ === void 0) this.startTime_ = now;
		if (!this.mode_ || now - this.startTime_ > this.trackpadEventGap_) this.mode_ = Math.abs(delta) < 4 ? "trackpad" : "wheel";
		const view = map.getView();
		if (this.mode_ === "trackpad" && !(view.getConstrainResolution() || this.constrainResolution_)) {
			if (this.trackpadTimeoutId_) clearTimeout(this.trackpadTimeoutId_);
			else {
				if (view.getAnimating()) view.cancelAnimations();
				view.beginInteraction();
			}
			this.trackpadTimeoutId_ = setTimeout(this.endInteraction_.bind(this), this.timeout_);
			view.adjustZoom(-delta / this.deltaPerZoom_, this.lastAnchor_);
			this.startTime_ = now;
			return false;
		}
		this.totalDelta_ += delta;
		const timeLeft = Math.max(this.timeout_ - (now - this.startTime_), 0);
		clearTimeout(this.timeoutId_);
		this.timeoutId_ = setTimeout(this.handleWheelZoom_.bind(this, map), timeLeft);
		return false;
	}
	/**
	* @private
	* @param {import("../Map.js").default} map Map.
	*/
	handleWheelZoom_(map) {
		const view = map.getView();
		if (view.getAnimating()) view.cancelAnimations();
		let delta = -clamp(this.totalDelta_, -this.maxDelta_ * this.deltaPerZoom_, this.maxDelta_ * this.deltaPerZoom_) / this.deltaPerZoom_;
		if (view.getConstrainResolution() || this.constrainResolution_) delta = delta ? delta > 0 ? 1 : -1 : 0;
		zoomByDelta(view, delta, this.lastAnchor_, this.duration_);
		this.mode_ = void 0;
		this.totalDelta_ = 0;
		this.lastAnchor_ = null;
		this.startTime_ = void 0;
		this.timeoutId_ = void 0;
	}
	/**
	* Enable or disable using the mouse's location as an anchor when zooming
	* @param {boolean} useAnchor true to zoom to the mouse's location, false
	* to zoom to the center of the map
	* @api
	*/
	setMouseAnchor(useAnchor) {
		this.useAnchor_ = useAnchor;
		if (!useAnchor) this.lastAnchor_ = null;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/PinchRotate.js
/**
* @module ol/interaction/PinchRotate
*/
/**
* @typedef {Object} Options
* @property {number} [duration=250] The duration of the animation in
* milliseconds.
* @property {number} [threshold=0.3] Minimal angle in radians to start a rotation.
*/
/**
* @classdesc
* Allows the user to rotate the map by twisting with two fingers
* on a touch screen.
* @api
*/
var PinchRotate = class extends PointerInteraction {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		options = options ? options : {};
		const pointerOptions = options;
		if (!pointerOptions.stopDown) pointerOptions.stopDown = FALSE;
		super(pointerOptions);
		/**
		* @private
		* @type {import("../coordinate.js").Coordinate}
		*/
		this.anchor_ = null;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.lastAngle_ = void 0;
		/**
		* @private
		* @type {boolean}
		*/
		this.rotating_ = false;
		/**
		* @private
		* @type {number}
		*/
		this.rotationDelta_ = 0;
		/**
		* @private
		* @type {number}
		*/
		this.threshold_ = options.threshold !== void 0 ? options.threshold : .3;
		/**
		* @private
		* @type {number}
		*/
		this.duration_ = options.duration !== void 0 ? options.duration : 250;
	}
	/**
	* Handle pointer drag events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	*/
	handleDragEvent(mapBrowserEvent) {
		let rotationDelta = 0;
		const touch0 = this.targetPointers[0];
		const touch1 = this.targetPointers[1];
		const angle = Math.atan2(touch1.clientY - touch0.clientY, touch1.clientX - touch0.clientX);
		if (this.lastAngle_ !== void 0) {
			const delta = angle - this.lastAngle_;
			this.rotationDelta_ += delta;
			if (!this.rotating_ && Math.abs(this.rotationDelta_) > this.threshold_) this.rotating_ = true;
			rotationDelta = delta;
		}
		this.lastAngle_ = angle;
		const map = mapBrowserEvent.map;
		const view = map.getView();
		if (view.getConstraints().rotation === disable) return;
		this.anchor_ = map.getCoordinateFromPixelInternal(map.getEventPixel(centroid(this.targetPointers)));
		if (this.rotating_) {
			map.render();
			view.adjustRotationInternal(rotationDelta, this.anchor_);
		}
	}
	/**
	* Handle pointer up events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @return {boolean} If the event was consumed.
	*/
	handleUpEvent(mapBrowserEvent) {
		if (this.targetPointers.length < 2) {
			mapBrowserEvent.map.getView().endInteraction(this.duration_);
			return false;
		}
		return true;
	}
	/**
	* Handle pointer down events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @return {boolean} If the event was consumed.
	*/
	handleDownEvent(mapBrowserEvent) {
		if (this.targetPointers.length >= 2) {
			const map = mapBrowserEvent.map;
			this.anchor_ = null;
			this.lastAngle_ = void 0;
			this.rotating_ = false;
			this.rotationDelta_ = 0;
			if (!this.handlingDownUpSequence) map.getView().beginInteraction();
			return true;
		}
		return false;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/PinchZoom.js
/**
* @module ol/interaction/PinchZoom
*/
/**
* @typedef {Object} Options
* @property {number} [duration=400] Animation duration in milliseconds.
*/
/**
* @classdesc
* Allows the user to zoom the map by pinching with two fingers
* on a touch screen.
* @api
*/
var PinchZoom = class extends PointerInteraction {
	/**
	* @param {Options} [options] Options.
	*/
	constructor(options) {
		options = options ? options : {};
		const pointerOptions = options;
		if (!pointerOptions.stopDown) pointerOptions.stopDown = FALSE;
		super(pointerOptions);
		/**
		* @private
		* @type {import("../coordinate.js").Coordinate}
		*/
		this.anchor_ = null;
		/**
		* @private
		* @type {number}
		*/
		this.duration_ = options.duration !== void 0 ? options.duration : 400;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.lastDistance_ = void 0;
		/**
		* @private
		* @type {number}
		*/
		this.lastScaleDelta_ = 1;
	}
	/**
	* Handle pointer drag events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	*/
	handleDragEvent(mapBrowserEvent) {
		let scaleDelta = 1;
		const touch0 = this.targetPointers[0];
		const touch1 = this.targetPointers[1];
		const dx = touch0.clientX - touch1.clientX;
		const dy = touch0.clientY - touch1.clientY;
		const distance = Math.sqrt(dx * dx + dy * dy);
		if (this.lastDistance_ !== void 0) scaleDelta = this.lastDistance_ / distance;
		this.lastDistance_ = distance;
		const map = mapBrowserEvent.map;
		const view = map.getView();
		if (scaleDelta != 1) this.lastScaleDelta_ = scaleDelta;
		this.anchor_ = map.getCoordinateFromPixelInternal(map.getEventPixel(centroid(this.targetPointers)));
		map.render();
		view.adjustResolutionInternal(scaleDelta, this.anchor_);
	}
	/**
	* Handle pointer up events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @return {boolean} If the event was consumed.
	*/
	handleUpEvent(mapBrowserEvent) {
		if (this.targetPointers.length < 2) {
			const view = mapBrowserEvent.map.getView();
			const direction = this.lastScaleDelta_ > 1 ? 1 : -1;
			view.endInteraction(this.duration_, direction);
			return false;
		}
		return true;
	}
	/**
	* Handle pointer down events.
	* @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Event.
	* @return {boolean} If the event was consumed.
	*/
	handleDownEvent(mapBrowserEvent) {
		if (this.targetPointers.length >= 2) {
			const map = mapBrowserEvent.map;
			this.anchor_ = null;
			this.lastDistance_ = void 0;
			this.lastScaleDelta_ = 1;
			if (!this.handlingDownUpSequence) map.getView().beginInteraction();
			return true;
		}
		return false;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/interaction/defaults.js
/**
* @module ol/interaction/defaults
*/
/**
* @typedef {Object} DefaultsOptions
* @property {boolean} [altShiftDragRotate=true] Whether Alt-Shift-drag rotate is
* desired.
* @property {boolean} [onFocusOnly=false] Interact only when the map has the
* focus. This affects the `MouseWheelZoom` and `DragPan` interactions and is
* useful when page scroll is desired for maps that do not have the browser's
* focus.
* @property {boolean} [doubleClickZoom=true] Whether double click zoom is
* desired.
* @property {boolean} [keyboard=true] Whether keyboard interaction is desired.
* @property {boolean} [mouseWheelZoom=true] Whether mousewheel zoom is desired.
* @property {boolean} [shiftDragZoom=true] Whether Shift-drag zoom is desired.
* @property {boolean} [dragPan=true] Whether drag pan is desired.
* @property {boolean} [pinchRotate=true] Whether pinch rotate is desired.
* @property {boolean} [pinchZoom=true] Whether pinch zoom is desired.
* @property {number} [zoomDelta] Zoom level delta when using keyboard or double click zoom.
* @property {number} [zoomDuration] Duration of the zoom animation in
* milliseconds.
*/
/**
* Set of interactions included in maps by default. Specific interactions can be
* excluded by setting the appropriate option to false in the constructor
* options, but the order of the interactions is fixed.  If you want to specify
* a different order for interactions, you will need to create your own
* {@link module:ol/interaction/Interaction~Interaction} instances and insert
* them into a {@link module:ol/Collection~Collection} in the order you want
* before creating your {@link module:ol/Map~Map} instance. Changing the order can
* be of interest if the event propagation needs to be stopped at a point.
* The default set of interactions, in sequence, is:
* * {@link module:ol/interaction/DragRotate~DragRotate}
* * {@link module:ol/interaction/DoubleClickZoom~DoubleClickZoom}
* * {@link module:ol/interaction/DragPan~DragPan}
* * {@link module:ol/interaction/PinchRotate~PinchRotate}
* * {@link module:ol/interaction/PinchZoom~PinchZoom}
* * {@link module:ol/interaction/KeyboardPan~KeyboardPan}
* * {@link module:ol/interaction/KeyboardZoom~KeyboardZoom}
* * {@link module:ol/interaction/MouseWheelZoom~MouseWheelZoom}
* * {@link module:ol/interaction/DragZoom~DragZoom}
*
* @param {DefaultsOptions} [options] Defaults options.
* @return {Collection<import("./Interaction.js").default>}
* A collection of interactions to be used with the {@link module:ol/Map~Map}
* constructor's `interactions` option.
* @api
*/
function defaults(options) {
	options = options ? options : {};
	/** @type {Collection<import("./Interaction.js").default>} */
	const interactions = new Collection();
	const kinetic = new Kinetic(-.005, .05, 100);
	if (options.altShiftDragRotate !== void 0 ? options.altShiftDragRotate : true) interactions.push(new DragRotate());
	if (options.doubleClickZoom !== void 0 ? options.doubleClickZoom : true) interactions.push(new DoubleClickZoom({
		delta: options.zoomDelta,
		duration: options.zoomDuration
	}));
	if (options.dragPan !== void 0 ? options.dragPan : true) interactions.push(new DragPan({
		onFocusOnly: options.onFocusOnly,
		kinetic
	}));
	if (options.pinchRotate !== void 0 ? options.pinchRotate : true) interactions.push(new PinchRotate());
	if (options.pinchZoom !== void 0 ? options.pinchZoom : true) interactions.push(new PinchZoom({ duration: options.zoomDuration }));
	if (options.keyboard !== void 0 ? options.keyboard : true) {
		interactions.push(new KeyboardPan());
		interactions.push(new KeyboardZoom({
			delta: options.zoomDelta,
			duration: options.zoomDuration
		}));
	}
	if (options.mouseWheelZoom !== void 0 ? options.mouseWheelZoom : true) interactions.push(new MouseWheelZoom({
		onFocusOnly: options.onFocusOnly,
		duration: options.zoomDuration
	}));
	if (options.shiftDragZoom !== void 0 ? options.shiftDragZoom : true) interactions.push(new DragZoom({ duration: options.zoomDuration }));
	return interactions;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/Map.js
/**
* @module ol/Map
*/
/**
* State of the current frame. Only `pixelRatio`, `time` and `viewState` should
* be used in applications.
* @typedef {Object} FrameState
* @property {number} pixelRatio The pixel ratio of the frame.
* @property {number} time The time when rendering of the frame was requested.
* @property {import("./View.js").State} viewState The state of the current view.
* @property {boolean} animate Animate.
* @property {import("./transform.js").Transform} coordinateToPixelTransform CoordinateToPixelTransform.
* @property {Object<string, import("rbush").default>|null} declutter Declutter trees by declutter group.
* When null, no decluttering is needed because no layers have decluttering enabled.
* @property {null|import("./extent.js").Extent} extent Extent (in view projection coordinates).
* @property {import("./extent.js").Extent} [nextExtent] Next extent during an animation series.
* @property {number} index Index.
* @property {Array<import("./layer/Layer.js").State>} layerStatesArray LayerStatesArray.
* @property {number} layerIndex LayerIndex.
* @property {import("./transform.js").Transform} pixelToCoordinateTransform PixelToCoordinateTransform.
* @property {Array<PostRenderFunction>} postRenderFunctions PostRenderFunctions.
* @property {import("./size.js").Size} size Size.
* @property {TileQueue} tileQueue TileQueue.
* @property {!Object<string, Object<string, boolean>>} usedTiles UsedTiles.
* @property {Array<number>} viewHints ViewHints.
* @property {!Object<string, Object<string, boolean>>} wantedTiles WantedTiles.
* @property {string} mapId The id of the map.
* @property {Object<string, boolean>} renderTargets Identifiers of previously rendered elements.
*/
/**
* @typedef {function(Map, ?FrameState): any} PostRenderFunction
*/
/**
* @typedef {Object} AtPixelOptions
* @property {undefined|function(import("./layer/Layer.js").default<import("./source/Source").default>): boolean} [layerFilter] Layer filter
* function. The filter function will receive one argument, the
* {@link module:ol/layer/Layer~Layer layer-candidate} and it should return a boolean value.
* Only layers which are visible and for which this function returns `true`
* will be tested for features. By default, all visible layers will be tested.
* @property {number} [hitTolerance=0] Hit-detection tolerance in css pixels. Pixels
* inside the radius around the given position will be checked for features.
* @property {boolean} [checkWrapped=true] Check-Wrapped Will check for wrapped geometries inside the range of
*   +/- 1 world width. Works only if a projection is used that can be wrapped.
*/
/**
* @typedef {Object} MapOptionsInternal
* @property {Collection<import("./control/Control.js").default>} [controls] Controls.
* @property {Collection<import("./interaction/Interaction.js").default>} [interactions] Interactions.
* @property {HTMLElement|Document} keyboardEventTarget KeyboardEventTarget.
* @property {Collection<import("./Overlay.js").default>} overlays Overlays.
* @property {Object<string, *>} values Values.
*/
/**
* @typedef {import("./ObjectEventType").Types|'change:layergroup'|'change:size'|'change:target'|'change:view'} MapObjectEventTypes
*/
/***
* @template Return
* @typedef {import("./Observable").OnSignature<import("./Observable").EventTypes, import("./events/Event.js").default, Return> &
*    import("./Observable").OnSignature<MapObjectEventTypes, import("./Object").ObjectEvent, Return> &
*    import("./Observable").OnSignature<import("./MapBrowserEventType").Types, import("./MapBrowserEvent").default, Return> &
*    import("./Observable").OnSignature<import("./MapEventType").Types, import("./MapEvent").default, Return> &
*    import("./Observable").OnSignature<import("./render/EventType").MapRenderEventTypes, import("./render/Event").default, Return> &
*    import("./Observable").CombinedOnSignature<import("./Observable").EventTypes|MapObjectEventTypes|
*      import("./MapBrowserEventType").Types|import("./MapEventType").Types|
*      import("./render/EventType").MapRenderEventTypes, Return>} MapEventHandler
*/
/**
* Object literal with config options for the map.
* @typedef {Object} MapOptions
* @property {Collection<import("./control/Control.js").default>|Array<import("./control/Control.js").default>} [controls]
* Controls initially added to the map. If not specified,
* {@link module:ol/control/defaults.defaults} is used.
* @property {number} [pixelRatio=window.devicePixelRatio] The ratio between
* physical pixels and device-independent pixels (dips) on the device.
* @property {Collection<import("./interaction/Interaction.js").default>|Array<import("./interaction/Interaction.js").default>} [interactions]
* Interactions that are initially added to the map. If not specified,
* {@link module:ol/interaction/defaults.defaults} is used.
* @property {HTMLElement|Document|string} [keyboardEventTarget] The element to
* listen to keyboard events on. This determines when the `KeyboardPan` and
* `KeyboardZoom` interactions trigger. For example, if this option is set to
* `document` the keyboard interactions will always trigger. If this option is
* not specified, the element the library listens to keyboard events on is the
* map target (i.e. the user-provided div for the map). If this is not
* `document`, the target element needs to be focused for key events to be
* emitted, requiring that the target element has a `tabindex` attribute.
* @property {Array<import("./layer/Base.js").default>|Collection<import("./layer/Base.js").default>|LayerGroup} [layers]
* Layers. If this is not defined, a map with no layers will be rendered. Note
* that layers are rendered in the order supplied, so if you want, for example,
* a vector layer to appear on top of a tile layer, it must come after the tile
* layer.
* @property {number} [maxTilesLoading=16] Maximum number tiles to load
* simultaneously.
* @property {number} [moveTolerance=1] The minimum distance in pixels the
* cursor must move to be detected as a map move event instead of a click.
* Increasing this value can make it easier to click on the map.
* @property {Collection<import("./Overlay.js").default>|Array<import("./Overlay.js").default>} [overlays]
* Overlays initially added to the map. By default, no overlays are added.
* @property {HTMLElement|string} [target] The container for the map, either the
* element itself or the `id` of the element. If not specified at construction
* time, {@link module:ol/Map~Map#setTarget} must be called for the map to be
* rendered. If passed by element, the container can be in a secondary document.
* **Note:** CSS `transform` support for the target element is limited to `scale`.
* @property {View|Promise<import("./View.js").ViewOptions>} [view] The map's view.  No layer sources will be
* fetched unless this is specified at construction time or through
* {@link module:ol/Map~Map#setView}.
*/
/**
* @param {import("./layer/Base.js").default} layer Layer.
*/
function removeLayerMapProperty(layer) {
	if (layer instanceof Layer) {
		layer.setMapInternal(null);
		return;
	}
	if (layer instanceof LayerGroup) layer.getLayers().forEach(removeLayerMapProperty);
}
/**
* @param {import("./layer/Base.js").default} layer Layer.
* @param {Map} map Map.
*/
function setLayerMapProperty(layer, map) {
	if (layer instanceof Layer) {
		layer.setMapInternal(map);
		return;
	}
	if (layer instanceof LayerGroup) {
		const layers = layer.getLayers().getArray();
		for (let i = 0, ii = layers.length; i < ii; ++i) setLayerMapProperty(layers[i], map);
	}
}
/**
* @classdesc
* The map is the core component of OpenLayers. For a map to render, a view,
* one or more layers, and a target container are needed:
*
*     import Map from 'ol/Map.js';
*     import View from 'ol/View.js';
*     import TileLayer from 'ol/layer/Tile.js';
*     import OSM from 'ol/source/OSM.js';
*
*     const map = new Map({
*       view: new View({
*         center: [0, 0],
*         zoom: 1,
*       }),
*       layers: [
*         new TileLayer({
*           source: new OSM(),
*         }),
*       ],
*       target: 'map',
*     });
*
* The above snippet creates a map using a {@link module:ol/layer/Tile~TileLayer} to
* display {@link module:ol/source/OSM~OSM} OSM data and render it to a DOM
* element with the id `map`.
*
* The constructor places a viewport container (with CSS class name
* `ol-viewport`) in the target element (see `getViewport()`), and then two
* further elements within the viewport: one with CSS class name
* `ol-overlaycontainer-stopevent` for controls and some overlays, and one with
* CSS class name `ol-overlaycontainer` for other overlays (see the `stopEvent`
* option of {@link module:ol/Overlay~Overlay} for the difference). The map
* itself is placed in a further element within the viewport.
*
* Layers are stored as a {@link module:ol/Collection~Collection} in
* layerGroups. A top-level group is provided by the library. This is what is
* accessed by `getLayerGroup` and `setLayerGroup`. Layers entered in the
* options are added to this group, and `addLayer` and `removeLayer` change the
* layer collection in the group. `getLayers` is a convenience function for
* `getLayerGroup().getLayers()`. Note that {@link module:ol/layer/Group~LayerGroup}
* is a subclass of {@link module:ol/layer/Base~BaseLayer}, so layers entered in the
* options or added with `addLayer` can be groups, which can contain further
* groups, and so on.
*
* @fires import("./MapBrowserEvent.js").MapBrowserEvent
* @fires import("./MapEvent.js").MapEvent
* @fires import("./render/Event.js").default#precompose
* @fires import("./render/Event.js").default#postcompose
* @fires import("./render/Event.js").default#rendercomplete
* @api
*/
var Map = class extends BaseObject {
	/**
	* @param {MapOptions} [options] Map options.
	*/
	constructor(options) {
		super();
		options = options || {};
		/***
		* @type {MapEventHandler<import("./events").EventsKey>}
		*/
		this.on;
		/***
		* @type {MapEventHandler<import("./events").EventsKey>}
		*/
		this.once;
		/***
		* @type {MapEventHandler<void>}
		*/
		this.un;
		const optionsInternal = createOptionsInternal(options);
		/**
		* @private
		* @type {boolean|undefined}
		*/
		this.renderComplete_;
		/**
		* @private
		* @type {boolean}
		*/
		this.loaded_ = true;
		/** @private */
		this.boundHandleBrowserEvent_ = this.handleBrowserEvent.bind(this);
		/**
		* @type {number}
		* @private
		*/
		this.maxTilesLoading_ = options.maxTilesLoading !== void 0 ? options.maxTilesLoading : 16;
		/**
		* @private
		* @type {number}
		*/
		this.pixelRatio_ = options.pixelRatio !== void 0 ? options.pixelRatio : DEVICE_PIXEL_RATIO;
		/**
		* @private
		* @type {ReturnType<typeof setTimeout>}
		*/
		this.postRenderTimeoutHandle_;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.animationDelayKey_;
		/**
		* @private
		*/
		this.animationDelay_ = this.animationDelay_.bind(this);
		/**
		* @private
		* @type {import("./transform.js").Transform}
		*/
		this.coordinateToPixelTransform_ = create();
		/**
		* @private
		* @type {import("./transform.js").Transform}
		*/
		this.pixelToCoordinateTransform_ = create();
		/**
		* @private
		* @type {number}
		*/
		this.frameIndex_ = 0;
		/**
		* @private
		* @type {?FrameState}
		*/
		this.frameState_ = null;
		/**
		* The extent at the previous 'moveend' event.
		* @private
		* @type {import("./extent.js").Extent}
		*/
		this.previousExtent_ = null;
		/**
		* @private
		* @type {?import("./events.js").EventsKey}
		*/
		this.viewPropertyListenerKey_ = null;
		/**
		* @private
		* @type {?import("./events.js").EventsKey}
		*/
		this.viewChangeListenerKey_ = null;
		/**
		* @private
		* @type {?Array<import("./events.js").EventsKey>}
		*/
		this.layerGroupPropertyListenerKeys_ = null;
		/**
		* @private
		* @type {!HTMLElement}
		*/
		this.viewport_ = document.createElement("div");
		this.viewport_.className = "ol-viewport" + ("ontouchstart" in window ? " ol-touch" : "");
		this.viewport_.style.position = "relative";
		this.viewport_.style.overflow = "hidden";
		this.viewport_.style.width = "100%";
		this.viewport_.style.height = "100%";
		/**
		* @private
		* @type {!HTMLElement}
		*/
		this.overlayContainer_ = document.createElement("div");
		this.overlayContainer_.style.position = "absolute";
		this.overlayContainer_.style.zIndex = "0";
		this.overlayContainer_.style.width = "100%";
		this.overlayContainer_.style.height = "100%";
		this.overlayContainer_.style.pointerEvents = "none";
		this.overlayContainer_.className = "ol-overlaycontainer";
		this.viewport_.appendChild(this.overlayContainer_);
		/**
		* @private
		* @type {!HTMLElement}
		*/
		this.overlayContainerStopEvent_ = document.createElement("div");
		this.overlayContainerStopEvent_.style.position = "absolute";
		this.overlayContainerStopEvent_.style.zIndex = "0";
		this.overlayContainerStopEvent_.style.width = "100%";
		this.overlayContainerStopEvent_.style.height = "100%";
		this.overlayContainerStopEvent_.style.pointerEvents = "none";
		this.overlayContainerStopEvent_.className = "ol-overlaycontainer-stopevent";
		this.viewport_.appendChild(this.overlayContainerStopEvent_);
		/**
		* @private
		* @type {MapBrowserEventHandler}
		*/
		this.mapBrowserEventHandler_ = null;
		/**
		* @private
		* @type {number}
		*/
		this.moveTolerance_ = options.moveTolerance;
		/**
		* @private
		* @type {HTMLElement|Document}
		*/
		this.keyboardEventTarget_ = optionsInternal.keyboardEventTarget;
		/**
		* @private
		* @type {?Array<import("./events.js").EventsKey>}
		*/
		this.targetChangeHandlerKeys_ = null;
		/**
		* @private
		* @type {HTMLElement|null}
		*/
		this.targetElement_ = null;
		/**
		* @type {ResizeObserver}
		*/
		this.resizeObserver_ = new ResizeObserver(() => this.updateSize());
		/**
		* @type {Collection<import("./control/Control.js").default>}
		* @protected
		*/
		this.controls = optionsInternal.controls || defaults$1();
		/**
		* @type {Collection<import("./interaction/Interaction.js").default>}
		* @protected
		*/
		this.interactions = optionsInternal.interactions || defaults({ onFocusOnly: true });
		/**
		* @type {Collection<import("./Overlay.js").default>}
		* @private
		*/
		this.overlays_ = optionsInternal.overlays;
		/**
		* A lookup of overlays by id.
		* @private
		* @type {Object<string, import("./Overlay.js").default>}
		*/
		this.overlayIdIndex_ = {};
		/**
		* @type {import("./renderer/Map.js").default|null}
		* @private
		*/
		this.renderer_ = null;
		/**
		* @private
		* @type {!Array<PostRenderFunction>}
		*/
		this.postRenderFunctions_ = [];
		/**
		* @private
		* @type {TileQueue}
		*/
		this.tileQueue_ = new TileQueue(this.getTilePriority.bind(this), this.handleTileChange_.bind(this));
		this.addChangeListener(MapProperty_default.LAYERGROUP, this.handleLayerGroupChanged_);
		this.addChangeListener(MapProperty_default.VIEW, this.handleViewChanged_);
		this.addChangeListener(MapProperty_default.SIZE, this.handleSizeChanged_);
		this.addChangeListener(MapProperty_default.TARGET, this.handleTargetChanged_);
		this.setProperties(optionsInternal.values);
		const map = this;
		if (options.view && !(options.view instanceof View)) options.view.then(function(viewOptions) {
			map.setView(new View(viewOptions));
		});
		this.controls.addEventListener(
			CollectionEventType_default.ADD,
			/**
			* @param {import("./Collection.js").CollectionEvent<import("./control/Control.js").default>} event CollectionEvent
			*/
			(event) => {
				event.element.setMap(this);
			}
		);
		this.controls.addEventListener(
			CollectionEventType_default.REMOVE,
			/**
			* @param {import("./Collection.js").CollectionEvent<import("./control/Control.js").default>} event CollectionEvent.
			*/
			(event) => {
				event.element.setMap(null);
			}
		);
		this.interactions.addEventListener(
			CollectionEventType_default.ADD,
			/**
			* @param {import("./Collection.js").CollectionEvent<import("./interaction/Interaction.js").default>} event CollectionEvent.
			*/
			(event) => {
				event.element.setMap(this);
			}
		);
		this.interactions.addEventListener(
			CollectionEventType_default.REMOVE,
			/**
			* @param {import("./Collection.js").CollectionEvent<import("./interaction/Interaction.js").default>} event CollectionEvent.
			*/
			(event) => {
				event.element.setMap(null);
			}
		);
		this.overlays_.addEventListener(
			CollectionEventType_default.ADD,
			/**
			* @param {import("./Collection.js").CollectionEvent<import("./Overlay.js").default>} event CollectionEvent.
			*/
			(event) => {
				this.addOverlayInternal_(event.element);
			}
		);
		this.overlays_.addEventListener(
			CollectionEventType_default.REMOVE,
			/**
			* @param {import("./Collection.js").CollectionEvent<import("./Overlay.js").default>} event CollectionEvent.
			*/
			(event) => {
				const id = event.element.getId();
				if (id !== void 0) delete this.overlayIdIndex_[id.toString()];
				event.element.setMap(null);
			}
		);
		this.controls.forEach(
			/**
			* @param {import("./control/Control.js").default} control Control.
			*/
			(control) => {
				control.setMap(this);
			}
		);
		this.interactions.forEach(
			/**
			* @param {import("./interaction/Interaction.js").default} interaction Interaction.
			*/
			(interaction) => {
				interaction.setMap(this);
			}
		);
		this.overlays_.forEach(this.addOverlayInternal_.bind(this));
	}
	/**
	* Add the given control to the map.
	* @param {import("./control/Control.js").default} control Control.
	* @api
	*/
	addControl(control) {
		this.getControls().push(control);
	}
	/**
	* Add the given interaction to the map. If you want to add an interaction
	* at another point of the collection use `getInteractions()` and the methods
	* available on {@link module:ol/Collection~Collection}. This can be used to
	* stop the event propagation from the handleEvent function. The interactions
	* get to handle the events in the reverse order of this collection.
	* @param {import("./interaction/Interaction.js").default} interaction Interaction to add.
	* @api
	*/
	addInteraction(interaction) {
		this.getInteractions().push(interaction);
	}
	/**
	* Adds the given layer to the top of this map. If you want to add a layer
	* elsewhere in the stack, use `getLayers()` and the methods available on
	* {@link module:ol/Collection~Collection}.
	* @param {import("./layer/Base.js").default} layer Layer.
	* @api
	*/
	addLayer(layer) {
		this.getLayerGroup().getLayers().push(layer);
	}
	/**
	* @param {import("./layer/Group.js").GroupEvent} event The layer add event.
	* @private
	*/
	handleLayerAdd_(event) {
		setLayerMapProperty(event.layer, this);
	}
	/**
	* Add the given overlay to the map.
	* @param {import("./Overlay.js").default} overlay Overlay.
	* @api
	*/
	addOverlay(overlay) {
		this.getOverlays().push(overlay);
	}
	/**
	* This deals with map's overlay collection changes.
	* @param {import("./Overlay.js").default} overlay Overlay.
	* @private
	*/
	addOverlayInternal_(overlay) {
		const id = overlay.getId();
		if (id !== void 0) this.overlayIdIndex_[id.toString()] = overlay;
		overlay.setMap(this);
	}
	/**
	*
	* Clean up.
	*/
	disposeInternal() {
		this.controls.clear();
		this.interactions.clear();
		this.overlays_.clear();
		this.resizeObserver_.disconnect();
		this.setTarget(null);
		super.disposeInternal();
	}
	/**
	* Detect features that intersect a pixel on the viewport, and execute a
	* callback with each intersecting feature. Layers included in the detection can
	* be configured through the `layerFilter` option in `options`.
	* @param {import("./pixel.js").Pixel} pixel Pixel.
	* @param {function(import("./Feature.js").FeatureLike, import("./layer/Layer.js").default<import("./source/Source").default>, import("./geom/SimpleGeometry.js").default): T} callback Feature callback. The callback will be
	*     called with two arguments. The first argument is one
	*     {@link module:ol/Feature~Feature feature} or
	*     {@link module:ol/render/Feature~RenderFeature render feature} at the pixel, the second is
	*     the {@link module:ol/layer/Layer~Layer layer} of the feature and will be null for
	*     unmanaged layers. To stop detection, callback functions can return a
	*     truthy value.
	* @param {AtPixelOptions} [options] Optional options.
	* @return {T|undefined} Callback result, i.e. the return value of last
	* callback execution, or the first truthy callback return value.
	* @template T
	* @api
	*/
	forEachFeatureAtPixel(pixel, callback, options) {
		if (!this.frameState_ || !this.renderer_) return;
		const coordinate = this.getCoordinateFromPixelInternal(pixel);
		options = options !== void 0 ? options : {};
		const hitTolerance = options.hitTolerance !== void 0 ? options.hitTolerance : 0;
		const layerFilter = options.layerFilter !== void 0 ? options.layerFilter : TRUE;
		const checkWrapped = options.checkWrapped !== false;
		return this.renderer_.forEachFeatureAtCoordinate(coordinate, this.frameState_, hitTolerance, checkWrapped, callback, null, layerFilter, null);
	}
	/**
	* Get all features that intersect a pixel on the viewport.
	* @param {import("./pixel.js").Pixel} pixel Pixel.
	* @param {AtPixelOptions} [options] Optional options.
	* @return {Array<import("./Feature.js").FeatureLike>} The detected features or
	* an empty array if none were found.
	* @api
	*/
	getFeaturesAtPixel(pixel, options) {
		const features = [];
		this.forEachFeatureAtPixel(pixel, function(feature) {
			features.push(feature);
		}, options);
		return features;
	}
	/**
	* Get all layers from all layer groups.
	* @return {Array<import("./layer/Layer.js").default>} Layers.
	* @api
	*/
	getAllLayers() {
		const layers = [];
		function addLayersFrom(layerGroup) {
			layerGroup.forEach(function(layer) {
				if (layer instanceof LayerGroup) addLayersFrom(layer.getLayers());
				else layers.push(layer);
			});
		}
		addLayersFrom(this.getLayers());
		return layers;
	}
	/**
	* Detect if features intersect a pixel on the viewport. Layers included in the
	* detection can be configured through the `layerFilter` option.
	* @param {import("./pixel.js").Pixel} pixel Pixel.
	* @param {AtPixelOptions} [options] Optional options.
	* @return {boolean} Is there a feature at the given pixel?
	* @api
	*/
	hasFeatureAtPixel(pixel, options) {
		if (!this.frameState_ || !this.renderer_) return false;
		const coordinate = this.getCoordinateFromPixelInternal(pixel);
		options = options !== void 0 ? options : {};
		const layerFilter = options.layerFilter !== void 0 ? options.layerFilter : TRUE;
		const hitTolerance = options.hitTolerance !== void 0 ? options.hitTolerance : 0;
		const checkWrapped = options.checkWrapped !== false;
		return this.renderer_.hasFeatureAtCoordinate(coordinate, this.frameState_, hitTolerance, checkWrapped, layerFilter, null);
	}
	/**
	* Returns the coordinate in user projection for a browser event.
	* @param {MouseEvent} event Event.
	* @return {import("./coordinate.js").Coordinate} Coordinate.
	* @api
	*/
	getEventCoordinate(event) {
		return this.getCoordinateFromPixel(this.getEventPixel(event));
	}
	/**
	* Returns the coordinate in view projection for a browser event.
	* @param {MouseEvent} event Event.
	* @return {import("./coordinate.js").Coordinate} Coordinate.
	*/
	getEventCoordinateInternal(event) {
		return this.getCoordinateFromPixelInternal(this.getEventPixel(event));
	}
	/**
	* Returns the map pixel position for a browser event relative to the viewport.
	* @param {UIEvent|{clientX: number, clientY: number}} event Event.
	* @return {import("./pixel.js").Pixel} Pixel.
	* @api
	*/
	getEventPixel(event) {
		const viewportPosition = this.viewport_.getBoundingClientRect();
		const viewportSize = this.getSize();
		const scaleX = viewportPosition.width / viewportSize[0];
		const scaleY = viewportPosition.height / viewportSize[1];
		const eventPosition = "changedTouches" in event ? event.changedTouches[0] : event;
		return [(eventPosition.clientX - viewportPosition.left) / scaleX, (eventPosition.clientY - viewportPosition.top) / scaleY];
	}
	/**
	* Get the target in which this map is rendered.
	* Note that this returns what is entered as an option or in setTarget:
	* if that was an element, it returns an element; if a string, it returns that.
	* @return {HTMLElement|string|undefined} The Element or id of the Element that the
	*     map is rendered in.
	* @observable
	* @api
	*/
	getTarget() {
		return this.get(MapProperty_default.TARGET);
	}
	/**
	* Get the DOM element into which this map is rendered. In contrast to
	* `getTarget` this method always return an `Element`, or `null` if the
	* map has no target.
	* @return {HTMLElement} The element that the map is rendered in.
	* @api
	*/
	getTargetElement() {
		return this.targetElement_;
	}
	/**
	* Get the coordinate for a given pixel.  This returns a coordinate in the
	* user projection.
	* @param {import("./pixel.js").Pixel} pixel Pixel position in the map viewport.
	* @return {import("./coordinate.js").Coordinate} The coordinate for the pixel position.
	* @api
	*/
	getCoordinateFromPixel(pixel) {
		return toUserCoordinate(this.getCoordinateFromPixelInternal(pixel), this.getView().getProjection());
	}
	/**
	* Get the coordinate for a given pixel.  This returns a coordinate in the
	* map view projection.
	* @param {import("./pixel.js").Pixel} pixel Pixel position in the map viewport.
	* @return {import("./coordinate.js").Coordinate} The coordinate for the pixel position.
	*/
	getCoordinateFromPixelInternal(pixel) {
		const frameState = this.frameState_;
		if (!frameState) return null;
		return apply(frameState.pixelToCoordinateTransform, pixel.slice());
	}
	/**
	* Get the map controls. Modifying this collection changes the controls
	* associated with the map.
	* @return {Collection<import("./control/Control.js").default>} Controls.
	* @api
	*/
	getControls() {
		return this.controls;
	}
	/**
	* Get the map overlays. Modifying this collection changes the overlays
	* associated with the map.
	* @return {Collection<import("./Overlay.js").default>} Overlays.
	* @api
	*/
	getOverlays() {
		return this.overlays_;
	}
	/**
	* Get an overlay by its identifier (the value returned by overlay.getId()).
	* Note that the index treats string and numeric identifiers as the same. So
	* `map.getOverlayById(2)` will return an overlay with id `'2'` or `2`.
	* @param {string|number} id Overlay identifier.
	* @return {import("./Overlay.js").default|null} Overlay.
	* @api
	*/
	getOverlayById(id) {
		const overlay = this.overlayIdIndex_[id.toString()];
		return overlay !== void 0 ? overlay : null;
	}
	/**
	* Get the map interactions. Modifying this collection changes the interactions
	* associated with the map.
	*
	* Interactions are used for e.g. pan, zoom and rotate.
	* @return {Collection<import("./interaction/Interaction.js").default>} Interactions.
	* @api
	*/
	getInteractions() {
		return this.interactions;
	}
	/**
	* Get the layergroup associated with this map.
	* @return {LayerGroup} A layer group containing the layers in this map.
	* @observable
	* @api
	*/
	getLayerGroup() {
		return this.get(MapProperty_default.LAYERGROUP);
	}
	/**
	* Clear any existing layers and add layers to the map.
	* @param {Array<import("./layer/Base.js").default>|Collection<import("./layer/Base.js").default>} layers The layers to be added to the map.
	* @api
	*/
	setLayers(layers) {
		const group = this.getLayerGroup();
		if (layers instanceof Collection) {
			group.setLayers(layers);
			return;
		}
		const collection = group.getLayers();
		collection.clear();
		collection.extend(layers);
	}
	/**
	* Get the collection of layers associated with this map.
	* @return {!Collection<import("./layer/Base.js").default>} Layers.
	* @api
	*/
	getLayers() {
		return this.getLayerGroup().getLayers();
	}
	/**
	* @return {boolean} Layers have sources that are still loading.
	*/
	getLoadingOrNotReady() {
		const layerStatesArray = this.getLayerGroup().getLayerStatesArray();
		for (let i = 0, ii = layerStatesArray.length; i < ii; ++i) {
			const state = layerStatesArray[i];
			if (!state.visible) continue;
			const renderer = state.layer.getRenderer();
			if (renderer && !renderer.ready) return true;
			const source = state.layer.getSource();
			if (source && source.loading) return true;
		}
		return false;
	}
	/**
	* Get the pixel for a coordinate.  This takes a coordinate in the user
	* projection and returns the corresponding pixel.
	* @param {import("./coordinate.js").Coordinate} coordinate A map coordinate.
	* @return {import("./pixel.js").Pixel} A pixel position in the map viewport.
	* @api
	*/
	getPixelFromCoordinate(coordinate) {
		const viewCoordinate = fromUserCoordinate(coordinate, this.getView().getProjection());
		return this.getPixelFromCoordinateInternal(viewCoordinate);
	}
	/**
	* Get the pixel for a coordinate.  This takes a coordinate in the map view
	* projection and returns the corresponding pixel.
	* @param {import("./coordinate.js").Coordinate} coordinate A map coordinate.
	* @return {import("./pixel.js").Pixel} A pixel position in the map viewport.
	*/
	getPixelFromCoordinateInternal(coordinate) {
		const frameState = this.frameState_;
		if (!frameState) return null;
		return apply(frameState.coordinateToPixelTransform, coordinate.slice(0, 2));
	}
	/**
	* Get the map renderer.
	* @return {import("./renderer/Map.js").default|null} Renderer
	*/
	getRenderer() {
		return this.renderer_;
	}
	/**
	* Get the size of this map.
	* @return {import("./size.js").Size|undefined} The size in pixels of the map in the DOM.
	* @observable
	* @api
	*/
	getSize() {
		return this.get(MapProperty_default.SIZE);
	}
	/**
	* Get the view associated with this map. A view manages properties such as
	* center and resolution.
	* @return {View} The view that controls this map.
	* @observable
	* @api
	*/
	getView() {
		return this.get(MapProperty_default.VIEW);
	}
	/**
	* Get the element that serves as the map viewport.
	* @return {HTMLElement} Viewport.
	* @api
	*/
	getViewport() {
		return this.viewport_;
	}
	/**
	* Get the element that serves as the container for overlays.  Elements added to
	* this container will let mousedown and touchstart events through to the map,
	* so clicks and gestures on an overlay will trigger {@link module:ol/MapBrowserEvent~MapBrowserEvent}
	* events.
	* @return {!HTMLElement} The map's overlay container.
	*/
	getOverlayContainer() {
		return this.overlayContainer_;
	}
	/**
	* Get the element that serves as a container for overlays that don't allow
	* event propagation. Elements added to this container won't let mousedown and
	* touchstart events through to the map, so clicks and gestures on an overlay
	* don't trigger any {@link module:ol/MapBrowserEvent~MapBrowserEvent}.
	* @return {!HTMLElement} The map's overlay container that stops events.
	*/
	getOverlayContainerStopEvent() {
		return this.overlayContainerStopEvent_;
	}
	/**
	* @return {!Document} The document where the map is displayed.
	*/
	getOwnerDocument() {
		const targetElement = this.getTargetElement();
		return targetElement ? targetElement.ownerDocument : document;
	}
	/**
	* @param {import("./Tile.js").default} tile Tile.
	* @param {string} tileSourceKey Tile source key.
	* @param {import("./coordinate.js").Coordinate} tileCenter Tile center.
	* @param {number} tileResolution Tile resolution.
	* @return {number} Tile priority.
	*/
	getTilePriority(tile, tileSourceKey, tileCenter, tileResolution) {
		return getTilePriority(this.frameState_, tile, tileSourceKey, tileCenter, tileResolution);
	}
	/**
	* @param {UIEvent} browserEvent Browser event.
	* @param {string} [type] Type.
	*/
	handleBrowserEvent(browserEvent, type) {
		type = type || browserEvent.type;
		const mapBrowserEvent = new MapBrowserEvent(type, this, browserEvent);
		this.handleMapBrowserEvent(mapBrowserEvent);
	}
	/**
	* @param {MapBrowserEvent} mapBrowserEvent The event to handle.
	*/
	handleMapBrowserEvent(mapBrowserEvent) {
		if (!this.frameState_) return;
		const originalEvent = mapBrowserEvent.originalEvent;
		const eventType = originalEvent.type;
		if (eventType === EventType_default.POINTERDOWN || eventType === EventType_default$2.WHEEL || eventType === EventType_default$2.KEYDOWN) {
			const doc = this.getOwnerDocument();
			const rootNode = this.viewport_.getRootNode ? this.viewport_.getRootNode() : doc;
			const target = originalEvent.target;
			if (this.overlayContainerStopEvent_.contains(target) || !(rootNode === doc ? doc.documentElement : rootNode).contains(target)) return;
		}
		mapBrowserEvent.frameState = this.frameState_;
		if (this.dispatchEvent(mapBrowserEvent) !== false) {
			const interactionsArray = this.getInteractions().getArray().slice();
			for (let i = interactionsArray.length - 1; i >= 0; i--) {
				const interaction = interactionsArray[i];
				if (interaction.getMap() !== this || !interaction.getActive() || !this.getTargetElement()) continue;
				if (!interaction.handleEvent(mapBrowserEvent) || mapBrowserEvent.propagationStopped) break;
			}
		}
	}
	/**
	* @protected
	*/
	handlePostRender() {
		const frameState = this.frameState_;
		const tileQueue = this.tileQueue_;
		if (!tileQueue.isEmpty()) {
			let maxTotalLoading = this.maxTilesLoading_;
			let maxNewLoads = maxTotalLoading;
			if (frameState) {
				const hints = frameState.viewHints;
				if (hints[ViewHint_default.ANIMATING] || hints[ViewHint_default.INTERACTING]) {
					const lowOnFrameBudget = Date.now() - frameState.time > 8;
					maxTotalLoading = lowOnFrameBudget ? 0 : 8;
					maxNewLoads = lowOnFrameBudget ? 0 : 2;
				}
			}
			if (tileQueue.getTilesLoading() < maxTotalLoading) {
				tileQueue.reprioritize();
				tileQueue.loadMoreTiles(maxTotalLoading, maxNewLoads);
			}
		}
		if (frameState && this.renderer_ && !frameState.animate) {
			if (this.renderComplete_ === true) {
				if (this.hasListener(EventType_default$1.RENDERCOMPLETE)) this.renderer_.dispatchRenderEvent(EventType_default$1.RENDERCOMPLETE, frameState);
				if (this.loaded_ === false) {
					this.loaded_ = true;
					this.dispatchEvent(new MapEvent(MapEventType_default.LOADEND, this, frameState));
				}
			} else if (this.loaded_ === true) {
				this.loaded_ = false;
				this.dispatchEvent(new MapEvent(MapEventType_default.LOADSTART, this, frameState));
			}
		}
		const postRenderFunctions = this.postRenderFunctions_;
		for (let i = 0, ii = postRenderFunctions.length; i < ii; ++i) postRenderFunctions[i](this, frameState);
		postRenderFunctions.length = 0;
	}
	/**
	* @private
	*/
	handleSizeChanged_() {
		if (this.getView() && !this.getView().getAnimating()) this.getView().resolveConstraints(0);
		this.render();
	}
	/**
	* @private
	*/
	handleTargetChanged_() {
		if (this.mapBrowserEventHandler_) {
			for (let i = 0, ii = this.targetChangeHandlerKeys_.length; i < ii; ++i) unlistenByKey(this.targetChangeHandlerKeys_[i]);
			this.targetChangeHandlerKeys_ = null;
			this.viewport_.removeEventListener(EventType_default$2.CONTEXTMENU, this.boundHandleBrowserEvent_);
			this.viewport_.removeEventListener(EventType_default$2.WHEEL, this.boundHandleBrowserEvent_);
			this.mapBrowserEventHandler_.dispose();
			this.mapBrowserEventHandler_ = null;
			removeNode(this.viewport_);
		}
		if (this.targetElement_) {
			this.resizeObserver_.unobserve(this.targetElement_);
			const rootNode = this.targetElement_.getRootNode();
			if (rootNode instanceof ShadowRoot) this.resizeObserver_.unobserve(rootNode.host);
			this.setSize(void 0);
		}
		const target = this.getTarget();
		const targetElement = typeof target === "string" ? document.getElementById(target) : target;
		this.targetElement_ = targetElement;
		if (!targetElement) {
			if (this.renderer_) {
				clearTimeout(this.postRenderTimeoutHandle_);
				this.postRenderTimeoutHandle_ = void 0;
				this.postRenderFunctions_.length = 0;
				this.renderer_.dispose();
				this.renderer_ = null;
			}
			if (this.animationDelayKey_) {
				cancelAnimationFrame(this.animationDelayKey_);
				this.animationDelayKey_ = void 0;
			}
		} else {
			targetElement.appendChild(this.viewport_);
			if (!this.renderer_) this.renderer_ = new CompositeMapRenderer(this);
			this.mapBrowserEventHandler_ = new MapBrowserEventHandler(this, this.moveTolerance_);
			for (const key in MapBrowserEventType_default) this.mapBrowserEventHandler_.addEventListener(MapBrowserEventType_default[key], this.handleMapBrowserEvent.bind(this));
			this.viewport_.addEventListener(EventType_default$2.CONTEXTMENU, this.boundHandleBrowserEvent_, false);
			this.viewport_.addEventListener(EventType_default$2.WHEEL, this.boundHandleBrowserEvent_, PASSIVE_EVENT_LISTENERS ? { passive: false } : false);
			const keyboardEventTarget = !this.keyboardEventTarget_ ? targetElement : this.keyboardEventTarget_;
			this.targetChangeHandlerKeys_ = [listen(keyboardEventTarget, EventType_default$2.KEYDOWN, this.handleBrowserEvent, this), listen(keyboardEventTarget, EventType_default$2.KEYPRESS, this.handleBrowserEvent, this)];
			const rootNode = targetElement.getRootNode();
			if (rootNode instanceof ShadowRoot) this.resizeObserver_.observe(rootNode.host);
			this.resizeObserver_.observe(targetElement);
		}
		this.updateSize();
	}
	/**
	* @private
	*/
	handleTileChange_() {
		this.render();
	}
	/**
	* @private
	*/
	handleViewPropertyChanged_() {
		this.render();
	}
	/**
	* @private
	*/
	handleViewChanged_() {
		if (this.viewPropertyListenerKey_) {
			unlistenByKey(this.viewPropertyListenerKey_);
			this.viewPropertyListenerKey_ = null;
		}
		if (this.viewChangeListenerKey_) {
			unlistenByKey(this.viewChangeListenerKey_);
			this.viewChangeListenerKey_ = null;
		}
		const view = this.getView();
		if (view) {
			this.updateViewportSize_(this.getSize());
			this.viewPropertyListenerKey_ = listen(view, ObjectEventType_default.PROPERTYCHANGE, this.handleViewPropertyChanged_, this);
			this.viewChangeListenerKey_ = listen(view, EventType_default$2.CHANGE, this.handleViewPropertyChanged_, this);
			view.resolveConstraints(0);
		}
		this.render();
	}
	/**
	* @private
	*/
	handleLayerGroupChanged_() {
		if (this.layerGroupPropertyListenerKeys_) {
			this.layerGroupPropertyListenerKeys_.forEach(unlistenByKey);
			this.layerGroupPropertyListenerKeys_ = null;
		}
		const layerGroup = this.getLayerGroup();
		if (layerGroup) {
			this.handleLayerAdd_(new GroupEvent("addlayer", layerGroup));
			this.layerGroupPropertyListenerKeys_ = [
				listen(layerGroup, ObjectEventType_default.PROPERTYCHANGE, this.render, this),
				listen(layerGroup, EventType_default$2.CHANGE, this.render, this),
				listen(layerGroup, "addlayer", this.handleLayerAdd_, this),
				listen(layerGroup, "removelayer", this.handleLayerRemove_, this)
			];
		}
		this.render();
	}
	/**
	* @return {boolean} Is rendered.
	*/
	isRendered() {
		return !!this.frameState_;
	}
	/**
	* @private
	*/
	animationDelay_() {
		this.animationDelayKey_ = void 0;
		this.renderFrame_(Date.now());
	}
	/**
	* Requests an immediate render in a synchronous manner.
	* @api
	*/
	renderSync() {
		if (this.animationDelayKey_) cancelAnimationFrame(this.animationDelayKey_);
		this.animationDelay_();
	}
	/**
	* Redraws all text after new fonts have loaded
	*/
	redrawText() {
		const layerStates = this.getLayerGroup().getLayerStatesArray();
		for (let i = 0, ii = layerStates.length; i < ii; ++i) {
			const layer = layerStates[i].layer;
			if (layer.hasRenderer()) layer.getRenderer().handleFontsChanged();
		}
	}
	/**
	* Request a map rendering (at the next animation frame).
	* @api
	*/
	render() {
		if (this.renderer_ && this.animationDelayKey_ === void 0) this.animationDelayKey_ = requestAnimationFrame(this.animationDelay_);
	}
	/**
	* Remove the given control from the map.
	* @param {import("./control/Control.js").default} control Control.
	* @return {import("./control/Control.js").default|undefined} The removed control (or undefined
	*     if the control was not found).
	* @api
	*/
	removeControl(control) {
		return this.getControls().remove(control);
	}
	/**
	* Remove the given interaction from the map.
	* @param {import("./interaction/Interaction.js").default} interaction Interaction to remove.
	* @return {import("./interaction/Interaction.js").default|undefined} The removed interaction (or
	*     undefined if the interaction was not found).
	* @api
	*/
	removeInteraction(interaction) {
		return this.getInteractions().remove(interaction);
	}
	/**
	* Removes the given layer from the map.
	* @param {import("./layer/Base.js").default} layer Layer.
	* @return {import("./layer/Base.js").default|undefined} The removed layer (or undefined if the
	*     layer was not found).
	* @api
	*/
	removeLayer(layer) {
		return this.getLayerGroup().getLayers().remove(layer);
	}
	/**
	* @param {import("./layer/Group.js").GroupEvent} event The layer remove event.
	* @private
	*/
	handleLayerRemove_(event) {
		removeLayerMapProperty(event.layer);
	}
	/**
	* Remove the given overlay from the map.
	* @param {import("./Overlay.js").default} overlay Overlay.
	* @return {import("./Overlay.js").default|undefined} The removed overlay (or undefined
	*     if the overlay was not found).
	* @api
	*/
	removeOverlay(overlay) {
		return this.getOverlays().remove(overlay);
	}
	/**
	* @param {number} time Time.
	* @private
	*/
	renderFrame_(time) {
		const size = this.getSize();
		const view = this.getView();
		const previousFrameState = this.frameState_;
		/** @type {?FrameState} */
		let frameState = null;
		if (size !== void 0 && hasArea(size) && view && view.isDef()) {
			const viewHints = view.getHints(this.frameState_ ? this.frameState_.viewHints : void 0);
			const viewState = view.getState();
			frameState = {
				animate: false,
				coordinateToPixelTransform: this.coordinateToPixelTransform_,
				declutter: null,
				extent: getForViewAndSize(viewState.center, viewState.resolution, viewState.rotation, size),
				index: this.frameIndex_++,
				layerIndex: 0,
				layerStatesArray: this.getLayerGroup().getLayerStatesArray(),
				pixelRatio: this.pixelRatio_,
				pixelToCoordinateTransform: this.pixelToCoordinateTransform_,
				postRenderFunctions: [],
				size,
				tileQueue: this.tileQueue_,
				time,
				usedTiles: {},
				viewState,
				viewHints,
				wantedTiles: {},
				mapId: getUid(this),
				renderTargets: {}
			};
			if (viewState.nextCenter && viewState.nextResolution) {
				const rotation = isNaN(viewState.nextRotation) ? viewState.rotation : viewState.nextRotation;
				frameState.nextExtent = getForViewAndSize(viewState.nextCenter, viewState.nextResolution, rotation, size);
			}
		}
		this.frameState_ = frameState;
		this.renderer_.renderFrame(frameState);
		if (frameState) {
			if (frameState.animate) this.render();
			Array.prototype.push.apply(this.postRenderFunctions_, frameState.postRenderFunctions);
			if (previousFrameState) {
				if (!this.previousExtent_ || !isEmpty$1(this.previousExtent_) && !equals$2(frameState.extent, this.previousExtent_)) {
					this.dispatchEvent(new MapEvent(MapEventType_default.MOVESTART, this, previousFrameState));
					this.previousExtent_ = createOrUpdateEmpty(this.previousExtent_);
				}
			}
			if (this.previousExtent_ && !frameState.viewHints[ViewHint_default.ANIMATING] && !frameState.viewHints[ViewHint_default.INTERACTING] && !equals$2(frameState.extent, this.previousExtent_)) {
				this.dispatchEvent(new MapEvent(MapEventType_default.MOVEEND, this, frameState));
				clone(frameState.extent, this.previousExtent_);
			}
		}
		this.dispatchEvent(new MapEvent(MapEventType_default.POSTRENDER, this, frameState));
		this.renderComplete_ = this.hasListener(MapEventType_default.LOADSTART) || this.hasListener(MapEventType_default.LOADEND) || this.hasListener(EventType_default$1.RENDERCOMPLETE) ? !this.tileQueue_.getTilesLoading() && !this.tileQueue_.getCount() && !this.getLoadingOrNotReady() : void 0;
		if (!this.postRenderTimeoutHandle_) this.postRenderTimeoutHandle_ = setTimeout(() => {
			this.postRenderTimeoutHandle_ = void 0;
			this.handlePostRender();
		}, 0);
	}
	/**
	* Sets the layergroup of this map.
	* @param {LayerGroup} layerGroup A layer group containing the layers in this map.
	* @observable
	* @api
	*/
	setLayerGroup(layerGroup) {
		const oldLayerGroup = this.getLayerGroup();
		if (oldLayerGroup) this.handleLayerRemove_(new GroupEvent("removelayer", oldLayerGroup));
		this.set(MapProperty_default.LAYERGROUP, layerGroup);
	}
	/**
	* Set the size of this map.
	* @param {import("./size.js").Size|undefined} size The size in pixels of the map in the DOM.
	* @observable
	* @api
	*/
	setSize(size) {
		this.set(MapProperty_default.SIZE, size);
	}
	/**
	* Set the target element to render this map into.
	* @param {HTMLElement|string} [target] The Element or id of the Element
	*     that the map is rendered in.
	* @observable
	* @api
	*/
	setTarget(target) {
		this.set(MapProperty_default.TARGET, target);
	}
	/**
	* Set the view for this map.
	* @param {View|Promise<import("./View.js").ViewOptions>} view The view that controls this map.
	* It is also possible to pass a promise that resolves to options for constructing a view.  This
	* alternative allows view properties to be resolved by sources or other components that load
	* view-related metadata.
	* @observable
	* @api
	*/
	setView(view) {
		if (!view || view instanceof View) {
			this.set(MapProperty_default.VIEW, view);
			return;
		}
		this.set(MapProperty_default.VIEW, new View());
		const map = this;
		view.then(function(viewOptions) {
			map.setView(new View(viewOptions));
		});
	}
	/**
	* Force a recalculation of the map viewport size.  This should be called when
	* third-party code changes the size of the map viewport.
	* @api
	*/
	updateSize() {
		const targetElement = this.getTargetElement();
		let size = void 0;
		if (targetElement) {
			const computedStyle = getComputedStyle(targetElement);
			const width = targetElement.offsetWidth - parseFloat(computedStyle["borderLeftWidth"]) - parseFloat(computedStyle["paddingLeft"]) - parseFloat(computedStyle["paddingRight"]) - parseFloat(computedStyle["borderRightWidth"]);
			const height = targetElement.offsetHeight - parseFloat(computedStyle["borderTopWidth"]) - parseFloat(computedStyle["paddingTop"]) - parseFloat(computedStyle["paddingBottom"]) - parseFloat(computedStyle["borderBottomWidth"]);
			if (!isNaN(width) && !isNaN(height)) {
				size = [width, height];
				if (!hasArea(size) && !!(targetElement.offsetWidth || targetElement.offsetHeight || targetElement.getClientRects().length)) warn("No map visible because the map container's width or height are 0.");
			}
		}
		const oldSize = this.getSize();
		if (size && (!oldSize || !equals$1(size, oldSize))) {
			this.setSize(size);
			this.updateViewportSize_(size);
		}
	}
	/**
	* Recomputes the viewport size and save it on the view object (if any)
	* @param {import("./size.js").Size|undefined} size The size.
	* @private
	*/
	updateViewportSize_(size) {
		const view = this.getView();
		if (view) view.setViewportSize(size);
	}
};
/**
* @param {MapOptions} options Map options.
* @return {MapOptionsInternal} Internal map options.
*/
function createOptionsInternal(options) {
	/**
	* @type {HTMLElement|Document}
	*/
	let keyboardEventTarget = null;
	if (options.keyboardEventTarget !== void 0) keyboardEventTarget = typeof options.keyboardEventTarget === "string" ? document.getElementById(options.keyboardEventTarget) : options.keyboardEventTarget;
	/**
	* @type {Object<string, *>}
	*/
	const values = {};
	const layerGroup = options.layers && typeof options.layers.getLayers === "function" ? options.layers : new LayerGroup({ layers: options.layers });
	values[MapProperty_default.LAYERGROUP] = layerGroup;
	values[MapProperty_default.TARGET] = options.target;
	values[MapProperty_default.VIEW] = options.view instanceof View ? options.view : new View();
	/** @type {Collection<import("./control/Control.js").default>} */
	let controls;
	if (options.controls !== void 0) if (Array.isArray(options.controls)) controls = new Collection(options.controls.slice());
	else {
		assert(typeof options.controls.getArray === "function", "Expected `controls` to be an array or an `ol/Collection.js`");
		controls = options.controls;
	}
	/** @type {Collection<import("./interaction/Interaction").default>} */
	let interactions;
	if (options.interactions !== void 0) if (Array.isArray(options.interactions)) interactions = new Collection(options.interactions.slice());
	else {
		assert(typeof options.interactions.getArray === "function", "Expected `interactions` to be an array or an `ol/Collection.js`");
		interactions = options.interactions;
	}
	/** @type {Collection<import("./Overlay.js").default>} */
	let overlays;
	if (options.overlays !== void 0) if (Array.isArray(options.overlays)) overlays = new Collection(options.overlays.slice());
	else {
		assert(typeof options.overlays.getArray === "function", "Expected `overlays` to be an array or an `ol/Collection.js`");
		overlays = options.overlays;
	}
	else overlays = new Collection();
	return {
		controls,
		interactions,
		keyboardEventTarget,
		overlays,
		values
	};
}
//#endregion
//#region ../../node_modules/.pnpm/ol-echarts@1.3.6_echarts@5.6.0_ol@9.2.4/node_modules/ol-echarts/dist/ol-echarts.esm.js
/*!
* author: FDD <smileFDD@gmail.com> 
* ol-echarts v1.3.6
* build-time: 2018-12-22 14:19
* LICENSE: MIT
* (c) 2017-2018 https://sakitam-fdd.github.io/ol3Echarts
*/
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
	return typeof obj;
} : function(obj) {
	return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};
var classCallCheck = function(instance, Constructor) {
	if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
};
var inherits = function(subClass, superClass) {
	if (typeof superClass !== "function" && superClass !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
	subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: {
		value: subClass,
		enumerable: false,
		writable: true,
		configurable: true
	} });
	if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};
var possibleConstructorReturn = function(self, call) {
	if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	return call && (typeof call === "object" || typeof call === "function") ? call : self;
};
var isObject = function isObject(value) {
	var type = typeof value === "undefined" ? "undefined" : _typeof(value);
	return value !== null && (type === "object" || type === "function");
};
var merge = function merge(a, b) {
	for (var key in b) if (isObject(b[key]) && isObject(a[key])) merge(a[key], b[key]);
	else a[key] = b[key];
	return a;
};
var getTarget = function getTarget(selector) {
	var doc = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : document;
	return function() {
		var found = void 0;
		return doc && /^#([\w-]+)$/.test(selector) ? (found = doc.getElementById(RegExp.$1)) ? [found] : [] : Array.prototype.slice.call(/^\.([\w-]+)$/.test(selector) ? doc.getElementsByClassName(RegExp.$1) : /^[\w-]+$/.test(selector) ? doc.getElementsByTagName(selector) : doc.querySelectorAll(selector));
	}();
};
var map = function map(obj, cb, context) {
	if (!(obj && cb)) return;
	if (obj.map && obj.map === Array.prototype.map) return obj.map(cb, context);
	else {
		var result = [];
		for (var i = 0, len = obj.length; i < len; i++) result.push(cb.call(context, obj[i], i, obj));
		return result;
	}
};
var bind = function bind(func, context) {
	var args = Array.prototype.slice.call(arguments, 2);
	return function() {
		return func.apply(context, args.concat(Array.prototype.slice.call(arguments)));
	};
};
var arrayAdd = function arrayAdd(array, item) {
	var i = 0;
	var index = void 0;
	var length = array.length;
	for (; i < length; i++) if (array[i]["seriesIndex"] === item["seriesIndex"]) index = i;
	if (index === void 0) array.push(item);
	else array[index] = item;
	return array;
};
var checkDecoded = function checkDecoded(json) {
	if (json.UTF8Encoding) return false;
	else return true;
};
var decode = function decode(json) {
	if (checkDecoded(json)) return json;
	var encodeScale = json.UTF8Scale;
	if (encodeScale == null) encodeScale = 1024;
	var features = json.features;
	for (var f = 0; f < features.length; f++) {
		var geometry = features[f].geometry;
		var _ref = [geometry.coordinates, geometry.encodeOffsets], coordinates = _ref[0], encodeOffsets = _ref[1];
		for (var c = 0; c < coordinates.length; c++) {
			var coordinate = coordinates[c];
			if (geometry.type === "Polygon") coordinates[c] = decodePolygon(coordinate, encodeOffsets[c], encodeScale);
			else if (geometry.type === "MultiPolygon") for (var c2 = 0; c2 < coordinate.length; c2++) {
				var polygon = coordinate[c2];
				coordinate[c2] = decodePolygon(polygon, encodeOffsets[c][c2], encodeScale);
			}
		}
	}
	json.UTF8Encoding = false;
	return json;
};
var decodePolygon = function decodePolygon(coordinate, encodeOffsets, encodeScale) {
	var _ref2 = [
		[],
		encodeOffsets[0],
		encodeOffsets[1]
	], result = _ref2[0], prevX = _ref2[1], prevY = _ref2[2];
	for (var i = 0; i < coordinate.length; i += 2) {
		var x = coordinate.charCodeAt(i) - 64;
		var y = coordinate.charCodeAt(i + 1) - 64;
		x = x >> 1 ^ -(x & 1);
		y = y >> 1 ^ -(y & 1);
		x += prevX;
		y += prevY;
		prevX = x;
		prevY = y;
		result.push([x / encodeScale, y / encodeScale]);
	}
	return result;
};
function formatGeoJSON(json) {
	var geoJson = decode(json);
	return {
		type: "FeatureCollection",
		crs: {},
		features: echarts_compat_default.util.map(echarts_compat_default.util.filter(geoJson.features, function(featureObj) {
			return featureObj.geometry && featureObj.properties && featureObj.geometry.coordinates.length > 0;
		}), function(featureObj) {
			var properties = featureObj.properties;
			var geo = featureObj.geometry;
			var coordinates = geo.coordinates;
			var geometries = [];
			if (geo.type === "Polygon") geometries.push(coordinates[0]);
			if (geo.type === "MultiPolygon") echarts_compat_default.util.each(coordinates, function(item) {
				if (item[0]) geometries.push(item[0]);
			});
			return {
				type: "Feature",
				geometry: {
					type: "Polygon",
					coordinates: geometries
				},
				properties
			};
		})
	};
}
var _getCoordinateSystem = function _getCoordinateSystem(map$$1) {
	var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	var RegisterCoordinateSystem = function RegisterCoordinateSystem() {
		this._mapOffset = [0, 0];
		this.dimensions = ["lng", "lat"];
		this.projCode_ = this._getProjectionCode();
	};
	RegisterCoordinateSystem.prototype.dimensions = ["lng", "lat"];
	RegisterCoordinateSystem.dimensions = RegisterCoordinateSystem.prototype.dimensions;
	RegisterCoordinateSystem.prototype.getZoom = function() {
		return map$$1.getView().getZoom();
	};
	RegisterCoordinateSystem.prototype.setZoom = function(zoom) {
		return map$$1.getView().setZoom(zoom);
	};
	RegisterCoordinateSystem.prototype.getViewRectAfterRoam = function() {
		return this.getViewRect().clone();
	};
	RegisterCoordinateSystem.prototype.setMapOffset = function(mapOffset) {
		this._mapOffset = mapOffset;
	};
	RegisterCoordinateSystem.prototype.dataToPoint = function(coords) {
		if (coords && Array.isArray(coords) && coords.length > 0) coords = coords.map(function(item) {
			if (typeof item === "string") item = Number(item);
			return item;
		});
		var source = options["source"] || "EPSG:4326";
		var destination = options["destination"] || this.projCode_;
		var pixel = map$$1.getPixelFromCoordinate(transform(coords, source, destination));
		var mapOffset = this._mapOffset;
		return [pixel[0] - mapOffset[0], pixel[1] - mapOffset[1]];
	};
	RegisterCoordinateSystem.prototype._getProjectionCode = function() {
		var code = "";
		if (map$$1) code = map$$1.getView() && map$$1.getView().getProjection().getCode();
		else code = "EPSG:3857";
		return code;
	};
	RegisterCoordinateSystem.prototype.pointToData = function(pixel) {
		var mapOffset = this._mapOffset;
		return map$$1.getCoordinateFromPixel([pixel[0] + mapOffset[0], pixel[1] + mapOffset[1]]);
	};
	RegisterCoordinateSystem.prototype.getViewRect = function() {
		var size = map$$1.getSize();
		return new echarts_compat_default.graphic.BoundingRect(0, 0, size[0], size[1]);
	};
	RegisterCoordinateSystem.prototype.getRoamTransform = function() {
		return echarts_compat_default.matrix.create();
	};
	RegisterCoordinateSystem.prototype.prepareCustoms = function(data) {
		var rect = this.getViewRect();
		return {
			coordSys: {
				type: "openlayers",
				x: rect.x,
				y: rect.y,
				width: rect.width,
				height: rect.height
			},
			api: {
				coord: bind(this.dataToPoint, this),
				size: bind(RegisterCoordinateSystem.dataToCoordSize, this)
			}
		};
	};
	RegisterCoordinateSystem.dataToCoordSize = function(dataSize, dataItem) {
		dataItem = dataItem || [0, 0];
		return map([0, 1], function(dimIdx) {
			var val = dataItem[dimIdx];
			var halfSize = dataSize[dimIdx] / 2;
			var p1 = [], p2 = [];
			p1[dimIdx] = val - halfSize;
			p2[dimIdx] = val + halfSize;
			p1[1 - dimIdx] = p2[1 - dimIdx] = dataItem[1 - dimIdx];
			return Math.abs(this.dataToPoint(p1)[dimIdx] - this.dataToPoint(p2)[dimIdx]);
		}, this);
	};
	RegisterCoordinateSystem.create = function(echartModel, api) {
		echartModel.eachSeries(function(seriesModel) {
			if (seriesModel.get("coordinateSystem") === "openlayers") seriesModel.coordinateSystem = new RegisterCoordinateSystem(map$$1);
		});
	};
	return RegisterCoordinateSystem;
};
var charts = /*#__PURE__*/ Object.freeze({
	pie: function pie(options, serie, coordinateSystem) {
		serie.center = coordinateSystem.dataToPoint(serie.coordinates);
		return serie;
	},
	bar: function bar(options, serie, coordinateSystem) {
		if (isObject(options.grid) && !Array.isArray(options.grid)) console.log(options);
		else if (Array.isArray(options.grid)) options.grid = options.grid.map(function(gri, index) {
			var coorPixel = coordinateSystem.dataToPoint(options.series[index].coordinates);
			gri.left = coorPixel[0] - parseFloat(gri.width) / 2;
			gri.top = coorPixel[1] - parseFloat(gri.height) / 2;
			return gri;
		});
		return serie;
	}
});
var _options = {
	forcedRerender: false,
	forcedPrecomposeRerender: false,
	hideOnZooming: false,
	hideOnMoving: false,
	hideOnRotating: false,
	convertTypes: [
		"pie",
		"line",
		"bar"
	]
};
var EChartsLayer = function(_Object) {
	inherits(EChartsLayer, _Object);
	function EChartsLayer(chartOptions) {
		var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		var map$$1 = arguments[2];
		classCallCheck(this, EChartsLayer);
		var _this = possibleConstructorReturn(this, _Object.call(this));
		_this.$options = merge(_options, options);
		_this.$chartOptions = chartOptions;
		_this.$chart = null;
		_this.$Map = null;
		_this._isRegistered = false;
		_this._incremental = [];
		_this._coordinateSystem = null;
		if (map$$1) _this.appendTo(map$$1);
		return _this;
	}
	EChartsLayer.prototype.appendTo = function appendTo(map$$1) {
		var _this2 = this;
		if (map$$1 && map$$1 instanceof Map) {
			this.$Map = map$$1;
			this.$Map.once("postrender", function(event) {
				_this2.render();
			});
			this.$Map.renderSync();
			this._unRegisterEvents();
			this._registerEvents();
		} else throw new Error("not map object");
	};
	EChartsLayer.prototype.getChartOptions = function getChartOptions() {
		return this.$chartOptions;
	};
	EChartsLayer.prototype.setChartOptions = function setChartOptions() {
		var _this3 = this;
		var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		this.$chartOptions = options;
		this.$Map.once("postrender", function(event) {
			_this3.render();
		});
		this.$Map.renderSync();
		return this;
	};
	EChartsLayer.prototype.appendData = function appendData(data) {
		var save = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
		if (data) {
			if (save) this._incremental = arrayAdd(this._incremental, {
				data: data.data,
				seriesIndex: data.seriesIndex
			});
			this.$chart.appendData({
				data: data.data.copyWithin(),
				seriesIndex: data.seriesIndex
			});
		}
		return this;
	};
	EChartsLayer.prototype.clear = function clear() {
		this._incremental = [];
		this.$chart.clear();
	};
	EChartsLayer.prototype.getMap = function getMap() {
		return this.$Map;
	};
	EChartsLayer.prototype._isVisible = function _isVisible() {
		return this.$container && this.$container.style.display === "";
	};
	EChartsLayer.prototype.show = function show() {
		if (this.$container) this.$container.style.display = "";
	};
	EChartsLayer.prototype.hide = function hide() {
		if (this.$container) this.$container.style.display = "none";
	};
	EChartsLayer.prototype.remove = function remove() {
		this.$chart.clear();
		this.$chart.dispose();
		this._unRegisterEvents();
		this._incremental = [];
		delete this.$chart;
		delete this.$Map;
		this.$container.parentNode.removeChild(this.$container);
	};
	EChartsLayer.prototype.showLoading = function showLoading() {
		if (this.$chart) this.$chart.showLoading();
	};
	EChartsLayer.prototype.hideLoading = function hideLoading() {
		if (this.$chart) this.$chart.hideLoading();
	};
	EChartsLayer.prototype._createLayerContainer = function _createLayerContainer(map$$1, options) {
		var viewPort = map$$1.getViewport();
		var container = this.$container = document.createElement("div");
		container.style.position = "absolute";
		container.style.top = "0px";
		container.style.left = "0px";
		container.style.right = "0px";
		container.style.bottom = "0px";
		var _target = getTarget(options["target"], viewPort);
		if (_target && _target[0] && _target[0] instanceof Element) _target[0].appendChild(container);
		else {
			var _target2 = getTarget(".ol-overlaycontainer", viewPort);
			if (_target2 && _target2[0] && _target2[0] instanceof Element) _target2[0].appendChild(container);
			else viewPort.appendChild(container);
		}
	};
	EChartsLayer.prototype._resizeContainer = function _resizeContainer() {
		var size = this.getMap().getSize();
		this.$container.style.height = size[1] + "px";
		this.$container.style.width = size[0] + "px";
	};
	EChartsLayer.prototype._clearAndRedraw = function _clearAndRedraw() {
		if (!this.$chart || this.$container && this.$container.style.display === "none") return;
		this.dispatchEvent({
			type: "redraw",
			source: this
		});
		if (this.$options.forcedRerender) this.$chart.clear();
		this.$chart.resize();
		if (this.$chartOptions) {
			this._registerMap();
			this.$chart.setOption(this.reConverData(this.$chartOptions), false);
			if (this._incremental && this._incremental.length > 0) for (var i = 0; i < this._incremental.length; i++) this.appendData(this._incremental[i], false);
		}
	};
	EChartsLayer.prototype.onResize = function onResize() {
		this._resizeContainer();
		this._clearAndRedraw();
		this.dispatchEvent({
			type: "change:size",
			source: this
		});
	};
	EChartsLayer.prototype.onZoomEnd = function onZoomEnd() {
		this.$options["hideOnZooming"] && this.show();
		this._clearAndRedraw();
		this.dispatchEvent({
			type: "zoomend",
			source: this
		});
	};
	EChartsLayer.prototype.onDragRotateEnd = function onDragRotateEnd() {
		this.$options["hideOnRotating"] && this.show();
		this._clearAndRedraw();
		this.dispatchEvent({
			type: "change:rotation",
			source: this
		});
	};
	EChartsLayer.prototype.onMoveStart = function onMoveStart() {
		this.$options["hideOnMoving"] && this.hide();
		this.dispatchEvent({
			type: "movestart",
			source: this
		});
	};
	EChartsLayer.prototype.onMoveEnd = function onMoveEnd() {
		this.$options["hideOnMoving"] && this.show();
		this._clearAndRedraw();
		this.dispatchEvent({
			type: "moveend",
			source: this
		});
	};
	EChartsLayer.prototype.onCenterChange = function onCenterChange(event) {
		this._clearAndRedraw();
		this.dispatchEvent({
			type: "change:center",
			source: this
		});
	};
	EChartsLayer.prototype._registerEvents = function _registerEvents() {
		var Map$$1 = this.$Map;
		var view = Map$$1.getView();
		if (this.$options.forcedPrecomposeRerender) this.precomposeListener_ = Map$$1.on("precompose", this.reRender.bind(this));
		this.sizeChangeListener_ = Map$$1.on("change:size", this.onResize.bind(this));
		this.resolutionListener_ = view.on("change:resolution", this.onZoomEnd.bind(this));
		this.centerChangeListener_ = view.on("change:center", this.onCenterChange.bind(this));
		this.rotationListener_ = view.on("change:rotation", this.onDragRotateEnd.bind(this));
		this.movestartListener_ = Map$$1.on("movestart", this.onMoveStart.bind(this));
		this.moveendListener_ = Map$$1.on("moveend", this.onMoveEnd.bind(this));
	};
	EChartsLayer.prototype._unRegisterEvents = function _unRegisterEvents() {
		unByKey(this.sizeChangeListener_);
		if (this.$options.forcedPrecomposeRerender) unByKey(this.precomposeListener_);
		unByKey(this.resolutionListener_);
		unByKey(this.centerChangeListener_);
		unByKey(this.rotationListener_);
		unByKey(this.movestartListener_);
		unByKey(this.moveendListener_);
		this.sizeChangeListener_ = null;
		this.precomposeListener_ = null;
		this.sizeChangeListener_ = null;
		this.resolutionListener_ = null;
		this.centerChangeListener_ = null;
		this.rotationListener_ = null;
		this.movestartListener_ = null;
		this.moveendListener_ = null;
	};
	EChartsLayer.prototype._registerMap = function _registerMap() {
		if (!this._isRegistered) {
			echarts_compat_default.registerCoordinateSystem("openlayers", _getCoordinateSystem(this.getMap(), this.$options));
			this._isRegistered = true;
		}
		var series = this.$chartOptions.series;
		if (series && isObject(series)) for (var i = series.length - 1; i >= 0; i--) {
			if (!(this.$options.convertTypes.indexOf(series[i]["type"]) > -1)) series[i]["coordinateSystem"] = "openlayers";
			series[i]["animation"] = false;
		}
	};
	EChartsLayer.prototype.reConverData = function reConverData(options) {
		var series = options["series"];
		if (series && series.length > 0) {
			if (!this._coordinateSystem) {
				var _cs = _getCoordinateSystem(this.getMap(), this.$options);
				this._coordinateSystem = new _cs();
			}
			if (series && isObject(series)) {
				for (var i = series.length - 1; i >= 0; i--) if (this.$options.convertTypes.indexOf(series[i]["type"]) > -1) {
					if (series[i] && series[i].hasOwnProperty("coordinates")) series[i] = charts[series[i]["type"]](options, series[i], this._coordinateSystem);
				}
			}
		}
		return options;
	};
	EChartsLayer.prototype.render = function render() {
		if (!this.$container) {
			this._createLayerContainer(this.$Map, this.$options);
			this._resizeContainer();
		}
		if (!this.$chart) {
			this.$chart = echarts_compat_default.init(this.$container);
			if (this.$chartOptions) {
				this._registerMap();
				this.$chart.setOption(this.reConverData(this.$chartOptions), false);
			}
		} else if (this._isVisible()) {
			this.$chart.resize();
			this.reRender();
		}
	};
	EChartsLayer.prototype.reRender = function reRender() {
		this._clearAndRedraw();
	};
	return EChartsLayer;
}(BaseObject);
EChartsLayer.getTarget = getTarget;
EChartsLayer.merge = merge;
EChartsLayer.map = map;
EChartsLayer.bind = bind;
EChartsLayer.formatGeoJSON = formatGeoJSON;
//#endregion
export { EChartsLayer as default };
