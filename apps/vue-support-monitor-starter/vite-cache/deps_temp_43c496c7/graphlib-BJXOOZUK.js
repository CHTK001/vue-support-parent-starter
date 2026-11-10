import { F as isBuffer, I as isArguments, J as isFunction, L as isPrototype, M as isTypedArray, O as keys, Q as arrayMap, R as isArrayLike, W as arrayEach, Y as identity, Z as isArray, i as baseEach, k as baseKeys, n as isUndefined, p as _getTag_default, q as constant, s as baseIteratee, t as union, v as arrayFilter } from "./union-C2_w5tV6.js";
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_arrayReduce.js
/**
* A specialized version of `_.reduce` for arrays without support for
* iteratee shorthands.
*
* @private
* @param {Array} [array] The array to iterate over.
* @param {Function} iteratee The function invoked per iteration.
* @param {*} [accumulator] The initial value.
* @param {boolean} [initAccum] Specify using the first element of `array` as
*  the initial value.
* @returns {*} Returns the accumulated value.
*/
function arrayReduce(array, iteratee, accumulator, initAccum) {
	var index = -1, length = array == null ? 0 : array.length;
	if (initAccum && length) accumulator = array[++index];
	while (++index < length) accumulator = iteratee(accumulator, array[index], index, array);
	return accumulator;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_castFunction.js
/**
* Casts `value` to `identity` if it's not a function.
*
* @private
* @param {*} value The value to inspect.
* @returns {Function} Returns cast function.
*/
function castFunction(value) {
	return typeof value == "function" ? value : identity;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/forEach.js
/**
* Iterates over elements of `collection` and invokes `iteratee` for each element.
* The iteratee is invoked with three arguments: (value, index|key, collection).
* Iteratee functions may exit iteration early by explicitly returning `false`.
*
* **Note:** As with other "Collections" methods, objects with a "length"
* property are iterated like arrays. To avoid this behavior use `_.forIn`
* or `_.forOwn` for object iteration.
*
* @static
* @memberOf _
* @since 0.1.0
* @alias each
* @category Collection
* @param {Array|Object} collection The collection to iterate over.
* @param {Function} [iteratee=_.identity] The function invoked per iteration.
* @returns {Array|Object} Returns `collection`.
* @see _.forEachRight
* @example
*
* _.forEach([1, 2], function(value) {
*   console.log(value);
* });
* // => Logs `1` then `2`.
*
* _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
*   console.log(key);
* });
* // => Logs 'a' then 'b' (iteration order is not guaranteed).
*/
function forEach(collection, iteratee) {
	return (isArray(collection) ? arrayEach : baseEach)(collection, castFunction(iteratee));
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_baseFilter.js
/**
* The base implementation of `_.filter` without support for iteratee shorthands.
*
* @private
* @param {Array|Object} collection The collection to iterate over.
* @param {Function} predicate The function invoked per iteration.
* @returns {Array} Returns the new filtered array.
*/
function baseFilter(collection, predicate) {
	var result = [];
	baseEach(collection, function(value, index, collection) {
		if (predicate(value, index, collection)) result.push(value);
	});
	return result;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/filter.js
/**
* Iterates over elements of `collection`, returning an array of all elements
* `predicate` returns truthy for. The predicate is invoked with three
* arguments: (value, index|key, collection).
*
* **Note:** Unlike `_.remove`, this method returns a new array.
*
* @static
* @memberOf _
* @since 0.1.0
* @category Collection
* @param {Array|Object} collection The collection to iterate over.
* @param {Function} [predicate=_.identity] The function invoked per iteration.
* @returns {Array} Returns the new filtered array.
* @see _.reject
* @example
*
* var users = [
*   { 'user': 'barney', 'age': 36, 'active': true },
*   { 'user': 'fred',   'age': 40, 'active': false }
* ];
*
* _.filter(users, function(o) { return !o.active; });
* // => objects for ['fred']
*
* // The `_.matches` iteratee shorthand.
* _.filter(users, { 'age': 36, 'active': true });
* // => objects for ['barney']
*
* // The `_.matchesProperty` iteratee shorthand.
* _.filter(users, ['active', false]);
* // => objects for ['fred']
*
* // The `_.property` iteratee shorthand.
* _.filter(users, 'active');
* // => objects for ['barney']
*
* // Combining several predicates using `_.overEvery` or `_.overSome`.
* _.filter(users, _.overSome([{ 'age': 36 }, ['age', 40]]));
* // => objects for ['fred', 'barney']
*/
function filter(collection, predicate) {
	return (isArray(collection) ? arrayFilter : baseFilter)(collection, baseIteratee(predicate, 3));
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_baseValues.js
/**
* The base implementation of `_.values` and `_.valuesIn` which creates an
* array of `object` property values corresponding to the property names
* of `props`.
*
* @private
* @param {Object} object The object to query.
* @param {Array} props The property names to get values for.
* @returns {Object} Returns the array of property values.
*/
function baseValues(object, props) {
	return arrayMap(props, function(key) {
		return object[key];
	});
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/values.js
/**
* Creates an array of the own enumerable string keyed property values of `object`.
*
* **Note:** Non-object values are coerced to objects.
*
* @static
* @since 0.1.0
* @memberOf _
* @category Object
* @param {Object} object The object to query.
* @returns {Array} Returns the array of property values.
* @example
*
* function Foo() {
*   this.a = 1;
*   this.b = 2;
* }
*
* Foo.prototype.c = 3;
*
* _.values(new Foo);
* // => [1, 2] (iteration order is not guaranteed)
*
* _.values('hi');
* // => ['h', 'i']
*/
function values(object) {
	return object == null ? [] : baseValues(object, keys(object));
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/isEmpty.js
/** `Object#toString` result references. */
var mapTag = "[object Map]";
var setTag = "[object Set]";
/** Used to check objects for own properties. */
var hasOwnProperty = Object.prototype.hasOwnProperty;
/**
* Checks if `value` is an empty object, collection, map, or set.
*
* Objects are considered empty if they have no own enumerable string keyed
* properties.
*
* Array-like values such as `arguments` objects, arrays, buffers, strings, or
* jQuery-like collections are considered empty if they have a `length` of `0`.
* Similarly, maps and sets are considered empty if they have a `size` of `0`.
*
* @static
* @memberOf _
* @since 0.1.0
* @category Lang
* @param {*} value The value to check.
* @returns {boolean} Returns `true` if `value` is empty, else `false`.
* @example
*
* _.isEmpty(null);
* // => true
*
* _.isEmpty(true);
* // => true
*
* _.isEmpty(1);
* // => true
*
* _.isEmpty([1, 2, 3]);
* // => false
*
* _.isEmpty({ 'a': 1 });
* // => false
*/
function isEmpty(value) {
	if (value == null) return true;
	if (isArrayLike(value) && (isArray(value) || typeof value == "string" || typeof value.splice == "function" || isBuffer(value) || isTypedArray(value) || isArguments(value))) return !value.length;
	var tag = _getTag_default(value);
	if (tag == mapTag || tag == setTag) return !value.size;
	if (isPrototype(value)) return !baseKeys(value).length;
	for (var key in value) if (hasOwnProperty.call(value, key)) return false;
	return true;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_baseReduce.js
/**
* The base implementation of `_.reduce` and `_.reduceRight`, without support
* for iteratee shorthands, which iterates over `collection` using `eachFunc`.
*
* @private
* @param {Array|Object} collection The collection to iterate over.
* @param {Function} iteratee The function invoked per iteration.
* @param {*} accumulator The initial value.
* @param {boolean} initAccum Specify using the first or last element of
*  `collection` as the initial value.
* @param {Function} eachFunc The function to iterate over `collection`.
* @returns {*} Returns the accumulated value.
*/
function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
	eachFunc(collection, function(value, index, collection) {
		accumulator = initAccum ? (initAccum = false, value) : iteratee(accumulator, value, index, collection);
	});
	return accumulator;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/reduce.js
/**
* Reduces `collection` to a value which is the accumulated result of running
* each element in `collection` thru `iteratee`, where each successive
* invocation is supplied the return value of the previous. If `accumulator`
* is not given, the first element of `collection` is used as the initial
* value. The iteratee is invoked with four arguments:
* (accumulator, value, index|key, collection).
*
* Many lodash methods are guarded to work as iteratees for methods like
* `_.reduce`, `_.reduceRight`, and `_.transform`.
*
* The guarded methods are:
* `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `orderBy`,
* and `sortBy`
*
* @static
* @memberOf _
* @since 0.1.0
* @category Collection
* @param {Array|Object} collection The collection to iterate over.
* @param {Function} [iteratee=_.identity] The function invoked per iteration.
* @param {*} [accumulator] The initial value.
* @returns {*} Returns the accumulated value.
* @see _.reduceRight
* @example
*
* _.reduce([1, 2], function(sum, n) {
*   return sum + n;
* }, 0);
* // => 3
*
* _.reduce({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
*   (result[value] || (result[value] = [])).push(key);
*   return result;
* }, {});
* // => { '1': ['a', 'c'], '2': ['b'] } (iteration order is not guaranteed)
*/
function reduce(collection, iteratee, accumulator) {
	var func = isArray(collection) ? arrayReduce : baseReduce, initAccum = arguments.length < 3;
	return func(collection, baseIteratee(iteratee, 4), accumulator, initAccum, baseEach);
}
//#endregion
//#region ../../node_modules/.pnpm/dagre-d3-es@7.0.14/node_modules/dagre-d3-es/src/graphlib/graph.js
var DEFAULT_EDGE_NAME = "\0";
var GRAPH_NODE = "\0";
var EDGE_KEY_DELIM = "";
/**
* @typedef {string} NodeID ID of a node.
*/
/**
* @typedef {`${string}${typeof EDGE_KEY_DELIM}${string}${typeof EDGE_KEY_DELIM}${string}`} EdgeID ID of an edge.
* @internal - All public APIs use {@link EdgeObj} instead to refer to edges.
*/
/**
* @typedef {object} EdgeObj
* @property {NodeID} v the id of the source or tail node of an edge
* @property {NodeID} w the id of the target or head node of an edge
* @property {string | number} [name] Name of the edge. Needed to uniquely identify
* multiple edges between the same pair of nodes in a multigraph.
*/
/**
* @template {unknown} T
* @typedef {T[] | Record<any, T>} Collection
* Lodash object that can be iterated over with `_.each`.
*
* Beware, objects with `.length` are treated as arrays, see
* https://lodash.com/docs/4.17.15#forEach
*/
/**
* @typedef {object} GraphOptions
* @property {boolean | undefined} [directed] - set to `true` to get a
* directed graph and `false` to get an undirected graph.
* An undirected graph does not treat the order of nodes in an edge as
* significant.
* In other words, `g.edge("a", "b") === g.edge("b", "a")` for
* an undirected graph.
* Default: `true`
* @property {boolean | undefined} [multigraph] - set to `true` to allow a
* graph to have multiple edges between the same pair of nodes.
* Default: `false`.
* @property {boolean | undefined} [compound] - set to `true` to allow a
* graph to have compound nodes - nodes which can be the parent of other
* nodes.
* Default: `false`.
*/
/**
* Graphlib has a single graph type: {@link Graph}. To create a new instance:
*
* ```js
* var g = new Graph();
* ```
*
* By default this will create a directed graph that does not allow multi-edges
* or compound nodes.
* The following options can be used when constructing a new graph:
*
* * {@link GraphOptions#directed}: set to `true` to get a directed graph and `false` to get an
*   undirected graph.
*   An undirected graph does not treat the order of nodes in an edge as
*   significant. In other words,
*   `g.edge("a", "b") === g.edge("b", "a")` for an undirected graph.
*   Default: `true`.
* * {@link GraphOptions#multigraph}: set to `true` to allow a graph to have multiple edges
*   between the same pair of nodes. Default: `false`.
* * {@link GraphOptions#compound}: set to `true` to allow a graph to have compound nodes -
*   nodes which can be the parent of other nodes. Default: `false`.
*
* To set the options, pass in an options object to the `Graph` constructor.
* For example, to create a directed compound multigraph:
*
* ```js
* var g = new Graph({ directed: true, compound: true, multigraph: true });
* ```
*
* ### Node and Edge Representation
*
* In graphlib, a node is represented by a user-supplied String id.
* All node related functions use this String id as a way to uniquely identify
* the node. Here is an example of interacting with nodes:
*
* ```js
* var g = new Graph();
* g.setNode("my-id", "my-label");
* g.node("my-id"); // returns "my-label"
* ```
*
* Edges in graphlib are identified by the nodes they connect. For example:
*
* ```js
* var g = new Graph();
* g.setEdge("source", "target", "my-label");
* g.edge("source", "target"); // returns "my-label"
* ```
*
* However, we need a way to uniquely identify an edge in a single object for
* various edge queries (e.g. {@link Graph#outEdges}).
* We use {@link EdgeObj}s for this purpose.
* They consist of the following properties:
*
* * {@link EdgeObj#v}: the id of the source or tail node of an edge
* * {@link EdgeObj#w}: the id of the target or head node of an edge
* * {@link EdgeObj#name} (optional): the name that uniquely identifies a multiedge.
*
* Any edge function that takes an edge id will also work with an {@link EdgeObj}. For example:
*
* ```js
* var g = new Graph();
* g.setEdge("source", "target", "my-label");
* g.edge({ v: "source", w: "target" }); // returns "my-label"
* ```
*
* ### Multigraphs
*
* A [multigraph](https://en.wikipedia.org/wiki/Multigraph) is a graph that can
* have more than one edge between the same pair of nodes.
* By default graphlib graphs are not multigraphs, but a multigraph can be
* constructed by setting the {@link GraphOptions#multigraph} property to true:
*
* ```js
* var g = new Graph({ multigraph: true });
* ```
*
* With multiple edges between two nodes we need some way to uniquely identify
* each edge. We call this the {@link EdgeObj#name} property.
* Here's an example of creating a couple of edges between the same nodes:
*
* ```js
* var g = new Graph({ multigraph: true });
* g.setEdge("a", "b", "edge1-label", "edge1");
* g.setEdge("a", "b", "edge2-label", "edge2");
* g.edge("a", "b", "edge1"); // returns "edge1-label"
* g.edge("a", "b", "edge2"); // returns "edge2-label"
* g.edges(); // returns [{ v: "a", w: "b", name: "edge1" },
*            //          { v: "a", w: "b", name: "edge2" }]
* ```
*
* A multigraph still allows an edge with no name to be created:
*
* ```js
* var g = new Graph({ multigraph: true });
* g.setEdge("a", "b", "my-label");
* g.edge({ v: "a", w: "b" }); // returns "my-label"
* ```
*
* ### Compound Graphs
*
* A compound graph is one where a node can be the parent of other nodes.
* The child nodes form a "subgraph".
* Here's an example of constructing and interacting with a compound graph:
*
* ```js
* var g = new Graph({ compound: true });
* g.setParent("a", "parent");
* g.setParent("b", "parent");
* g.parent("a");      // returns "parent"
* g.parent("b");      // returns "parent"
* g.parent("parent"); // returns undefined
* ```
*
* ### Default Labels
*
* When a node or edge is created without a label, a default label can be assigned.
* See {@link setDefaultNodeLabel} and {@link setDefaultEdgeLabel}.
*
* @template [GraphLabel=any] - Label of the graph.
* @template [NodeLabel=any] - Label of a node.
* Even though this is a "label", this could be any type that the user requires
* (and may need to be an object for some layout/ranking algorithms in dagre).
* @template [EdgeLabel=any] - Label of an edge.
* Even though this is a "label", this could be any type that the user requires,
* (and may need to be a object for ranking in dagre).
*/
var Graph = class {
	/**
	* @param {GraphOptions} [opts] - Graph options.
	*/
	constructor(opts = {}) {
		/**
		* @type {boolean}
		* @private
		*/
		this._isDirected = Object.prototype.hasOwnProperty.call(opts, "directed") ? opts.directed : true;
		/**
		* @type {boolean}
		* @private
		*/
		this._isMultigraph = Object.prototype.hasOwnProperty.call(opts, "multigraph") ? opts.multigraph : false;
		/**
		* @type {boolean}
		* @private
		*/
		this._isCompound = Object.prototype.hasOwnProperty.call(opts, "compound") ? opts.compound : false;
		/**
		* @type {GraphLabel | undefined}
		* Label for the graph itself
		*/
		this._label = void 0;
		/**
		* Default label to be set when creating a new node.
		*
		* @private
		* @type {(v: NodeID | number) => NodeLabel}
		*/
		this._defaultNodeLabelFn = constant(void 0);
		/**
		* Default label to be set when creating a new edge
		*
		* @private
		* @type {(v: NodeID, w: NodeID, name: string | undefined) => EdgeLabel}
		*/
		this._defaultEdgeLabelFn = constant(void 0);
		/**
		* @type {Record<NodeID, NodeLabel>}
		* @private
		*
		* v -> label
		*/
		this._nodes = {};
		if (this._isCompound) {
			/**
			* @type {Record<NodeID, NodeID>}
			* @private
			* v -> parent
			*/
			this._parent = {};
			/**
			* @type {Record<NodeID, Record<NodeID, true>>}
			* @private
			* v -> children
			*/
			this._children = {};
			this._children[GRAPH_NODE] = {};
		}
		/**
		* @type {Record<NodeID, Record<EdgeID, EdgeObj>>}
		* @private
		* v -> edgeObj
		*/
		this._in = {};
		/**
		* @type {Record<NodeID, Record<NodeID, number>>}
		* @private
		* u -> v -> Number
		*/
		this._preds = {};
		/**
		* @type {Record<NodeID, Record<EdgeID, EdgeObj>>}
		* @private
		* v -> edgeObj
		*/
		this._out = {};
		/**
		* @type {Record<NodeID, Record<NodeID, number>>}
		* @private
		* v -> w -> Number
		*/
		this._sucs = {};
		/**
		* @type {Record<EdgeID, EdgeObj>}
		* @private
		* e -> edgeObj
		*/
		this._edgeObjs = {};
		/**
		* @type {Record<EdgeID, EdgeLabel>}
		* @private
		* e -> label
		*/
		this._edgeLabels = {};
	}
	/**
	*
	* @returns {boolean} `true` if the graph is [directed](https://en.wikipedia.org/wiki/Directed_graph).
	* A directed graph treats the order of nodes in an edge as significant whereas an
	* [undirected](https://en.wikipedia.org/wiki/Graph_(mathematics)#Undirected_graph)
	* graph does not.
	* This example demonstrates the difference:
	*
	* @example
	*
	* ```js
	* var directed = new Graph({ directed: true });
	* directed.setEdge("a", "b", "my-label");
	* directed.edge("a", "b"); // returns "my-label"
	* directed.edge("b", "a"); // returns undefined
	*
	* var undirected = new Graph({ directed: false });
	* undirected.setEdge("a", "b", "my-label");
	* undirected.edge("a", "b"); // returns "my-label"
	* undirected.edge("b", "a"); // returns "my-label"
	* ```
	*/
	isDirected() {
		return this._isDirected;
	}
	/**
	* @returns {boolean} `true` if the graph is a multigraph.
	*/
	isMultigraph() {
		return this._isMultigraph;
	}
	/**
	* @returns {boolean} `true` if the graph is compound.
	*/
	isCompound() {
		return this._isCompound;
	}
	/**
	* Sets the label for the graph to `label`.
	*
	* @param {GraphLabel} label - Label for the graph.
	* @returns {this}
	*/
	setGraph(label) {
		this._label = label;
		return this;
	}
	/**
	* @returns {GraphLabel | undefined} the currently assigned label for the graph.
	* If no label has been assigned, returns `undefined`.
	*
	* @example
	*
	* ```js
	* var g = new Graph();
	* g.graph(); // returns undefined
	* g.setGraph("graph-label");
	*  g.graph(); // returns "graph-label"
	* ```
	*/
	graph() {
		return this._label;
	}
	/**
	* Sets a new default value that is assigned to nodes that are created without
	* a label.
	*
	* @param {typeof this._defaultNodeLabelFn | NodeLabel} newDefault - If a function,
	* it is called with the id of the node being created.
	* Otherwise, it is assigned as the label directly.
	* @returns {this}
	*/
	setDefaultNodeLabel(newDefault) {
		if (!isFunction(newDefault)) newDefault = constant(newDefault);
		this._defaultNodeLabelFn = newDefault;
		return this;
	}
	/**
	* @returns {number} the number of nodes in the graph.
	*/
	nodeCount() {
		return this._nodeCount;
	}
	/**
	* @returns {NodeID[]} the ids of the nodes in the graph.
	*
	* @remarks
	* Use {@link node()} to get the label for each node.
	* Takes `O(|V|)` time.
	*/
	nodes() {
		return keys(this._nodes);
	}
	/**
	* @returns {NodeID[]} those nodes in the graph that have no in-edges.
	* @remarks Takes `O(|V|)` time.
	*/
	sources() {
		var self = this;
		return filter(this.nodes(), function(v) {
			return isEmpty(self._in[v]);
		});
	}
	/**
	* @returns {NodeID[]} those nodes in the graph that have no out-edges.
	* @remarks Takes `O(|V|)` time.
	*/
	sinks() {
		var self = this;
		return filter(this.nodes(), function(v) {
			return isEmpty(self._out[v]);
		});
	}
	/**
	* Invokes setNode method for each node in `vs` list.
	*
	* @param {Collection<NodeID | number>} vs - List of node IDs to create/set.
	* @param {NodeLabel} [value] - If set, update all nodes with this value.
	* @returns {this}
	* @remarks Complexity: O(|names|).
	*/
	setNodes(vs, value) {
		var args = arguments;
		var self = this;
		forEach(vs, function(v) {
			if (args.length > 1) self.setNode(v, value);
			else self.setNode(v);
		});
		return this;
	}
	/**
	* Creates or updates the value for the node `v` in the graph.
	*
	* @param {NodeID | number} v - ID of the node to create/set.
	* @param {NodeLabel} [value] - If supplied, it is set as the value for the node.
	* If not supplied and the node was created by this call then
	* {@link setDefaultNodeLabel} will be used to set the node's value.
	* @returns {this} the graph, allowing this to be chained with other functions.
	* @remarks Takes `O(1)` time.
	*/
	setNode(v, value) {
		if (Object.prototype.hasOwnProperty.call(this._nodes, v)) {
			if (arguments.length > 1) this._nodes[v] = value;
			return this;
		}
		this._nodes[v] = arguments.length > 1 ? value : this._defaultNodeLabelFn(v);
		if (this._isCompound) {
			this._parent[v] = GRAPH_NODE;
			this._children[v] = {};
			this._children[GRAPH_NODE][v] = true;
		}
		this._in[v] = {};
		this._preds[v] = {};
		this._out[v] = {};
		this._sucs[v] = {};
		++this._nodeCount;
		return this;
	}
	/**
	* Gets the label of node with specified name.
	*
	* @param {NodeID | number} v - Node ID.
	* @returns {NodeLabel | undefined} the label assigned to the node with the id `v`
	* if it is in the graph.
	* Otherwise returns `undefined`.
	* @remarks Takes `O(1)` time.
	*/
	node(v) {
		return this._nodes[v];
	}
	/**
	* Detects whether graph has a node with specified name or not.
	*
	* @param {NodeID | number} v - Node ID.
	* @returns {boolean} Returns `true` the graph has a node with the id.
	* @remarks Takes `O(1)` time.
	*/
	hasNode(v) {
		return Object.prototype.hasOwnProperty.call(this._nodes, v);
	}
	/**
	* Remove the node with the id `v` in the graph or do nothing if the node is
	* not in the graph.
	*
	* If the node was removed this function also removes any incident edges.
	*
	* @param {NodeID | number} v - Node ID to remove.
	* @returns {this} the graph, allowing this to be chained with other functions.
	* @remarks Takes `O(|E|)` time.
	*/
	removeNode(v) {
		if (Object.prototype.hasOwnProperty.call(this._nodes, v)) {
			var removeEdge = (e) => this.removeEdge(this._edgeObjs[e]);
			delete this._nodes[v];
			if (this._isCompound) {
				this._removeFromParentsChildList(v);
				delete this._parent[v];
				forEach(this.children(v), (child) => {
					this.setParent(child);
				});
				delete this._children[v];
			}
			forEach(keys(this._in[v]), removeEdge);
			delete this._in[v];
			delete this._preds[v];
			forEach(keys(this._out[v]), removeEdge);
			delete this._out[v];
			delete this._sucs[v];
			--this._nodeCount;
		}
		return this;
	}
	/**
	* Sets the parent for `v` to `parent` if it is defined or removes the parent
	* for `v` if `parent` is undefined.
	*
	* @param {NodeID | number} v - Node ID to set the parent for.
	* @param {NodeID | number} [parent] - Parent node ID. If not defined, removes the parent.
	* @returns {this} the graph, allowing this to be chained with other functions.
	* @throws if the graph is not compound.
	* @throws if setting the parent would create a cycle.
	* @remarks Takes `O(1)` time.
	*/
	setParent(v, parent) {
		if (!this._isCompound) throw new Error("Cannot set parent in a non-compound graph");
		if (isUndefined(parent)) parent = GRAPH_NODE;
		else {
			parent += "";
			for (var ancestor = parent; !isUndefined(ancestor); ancestor = this.parent(ancestor)) if (ancestor === v) throw new Error("Setting " + parent + " as parent of " + v + " would create a cycle");
			this.setNode(parent);
		}
		this.setNode(v);
		this._removeFromParentsChildList(v);
		this._parent[v] = parent;
		this._children[parent][v] = true;
		return this;
	}
	/**
	* @private
	* @param {NodeID | number} v - Node ID.
	*/
	_removeFromParentsChildList(v) {
		delete this._children[this._parent[v]][v];
	}
	/**
	* Get parent node for node `v`.
	*
	* @param {NodeID | number} v - Node ID.
	* @returns {NodeID | undefined} the node that is a parent of node `v`
	* or `undefined` if node `v` does not have a parent or is not a member of
	* the graph.
	* Always returns `undefined` for graphs that are not compound.
	* @remarks Takes `O(1)` time.
	*/
	parent(v) {
		if (this._isCompound) {
			var parent = this._parent[v];
			if (parent !== GRAPH_NODE) return parent;
		}
	}
	/**
	* Gets list of direct children of node v.
	*
	* @param {NodeID | number} [v] - Node ID. If not specified, gets nodes
	* with no parent (top-level nodes).
	* @returns {NodeID[] | undefined} all nodes that are children of node `v` or
	* `undefined` if node `v` is not in the graph.
	* Always returns `[]` for graphs that are not compound.
	* @remarks Takes `O(|V|)` time.
	*/
	children(v) {
		if (isUndefined(v)) v = GRAPH_NODE;
		if (this._isCompound) {
			var children = this._children[v];
			if (children) return keys(children);
		} else if (v === GRAPH_NODE) return this.nodes();
		else if (this.hasNode(v)) return [];
	}
	/**
	* @param {NodeID | number} v - Node ID.
	* @returns {NodeID[] | undefined} all nodes that are predecessors of the
	* specified node or `undefined` if node `v` is not in the graph.
	* @remarks
	* Behavior is undefined for undirected graphs - use {@link neighbors} instead.
	* Takes `O(|V|)` time.
	*/
	predecessors(v) {
		var predsV = this._preds[v];
		if (predsV) return keys(predsV);
	}
	/**
	* @param {NodeID | number} v - Node ID.
	* @returns {NodeID[] | undefined} all nodes that are successors of the
	* specified node or `undefined` if node `v` is not in the graph.
	* @remarks
	* Behavior is undefined for undirected graphs - use {@link neighbors} instead.
	* Takes `O(|V|)` time.
	*/
	successors(v) {
		var sucsV = this._sucs[v];
		if (sucsV) return keys(sucsV);
	}
	/**
	* @param {NodeID | number} v - Node ID.
	* @returns {NodeID[] | undefined} all nodes that are predecessors or
	* successors of the specified node
	* or `undefined` if node `v` is not in the graph.
	* @remarks Takes `O(|V|)` time.
	*/
	neighbors(v) {
		var preds = this.predecessors(v);
		if (preds) return union(preds, this.successors(v));
	}
	/**
	* @param {NodeID | number} v - Node ID.
	* @returns {boolean} True if the node is a leaf (has no successors), false otherwise.
	*/
	isLeaf(v) {
		var neighbors;
		if (this.isDirected()) neighbors = this.successors(v);
		else neighbors = this.neighbors(v);
		return neighbors.length === 0;
	}
	/**
	* Creates new graph with nodes filtered via `filter`.
	* Edges incident to rejected node
	* are also removed.
	* 
	* In case of compound graph, if parent is rejected by `filter`,
	* than all its children are rejected too.
	
	* @param {(v: NodeID) => boolean} filter - Function that returns `true` for nodes to keep.
	* @returns {Graph<GraphLabel, NodeLabel, EdgeLabel>} A new graph containing only the nodes for which `filter` returns `true`.
	* @remarks Average-case complexity: O(|E|+|V|).
	*/
	filterNodes(filter) {
		/**
		* @type {Graph<GraphLabel, NodeLabel, EdgeLabel>}
		*/
		var copy = new this.constructor({
			directed: this._isDirected,
			multigraph: this._isMultigraph,
			compound: this._isCompound
		});
		copy.setGraph(this.graph());
		var self = this;
		forEach(this._nodes, function(value, v) {
			if (filter(v)) copy.setNode(v, value);
		});
		forEach(this._edgeObjs, function(e) {
			if (copy.hasNode(e.v) && copy.hasNode(e.w)) copy.setEdge(e, self.edge(e));
		});
		var parents = {};
		function findParent(v) {
			var parent = self.parent(v);
			if (parent === void 0 || copy.hasNode(parent)) {
				parents[v] = parent;
				return parent;
			} else if (parent in parents) return parents[parent];
			else return findParent(parent);
		}
		if (this._isCompound) forEach(copy.nodes(), function(v) {
			copy.setParent(v, findParent(v));
		});
		return copy;
	}
	/**
	* Sets a new default value that is assigned to edges that are created without
	* a label.
	*
	* @param {typeof this._defaultEdgeLabelFn | EdgeLabel} newDefault - If a function,
	* it is called with the parameters `(v, w, name)`.
	* Otherwise, it is assigned as the label directly.
	* @returns {this}
	*/
	setDefaultEdgeLabel(newDefault) {
		if (!isFunction(newDefault)) newDefault = constant(newDefault);
		this._defaultEdgeLabelFn = newDefault;
		return this;
	}
	/**
	* @returns {number} the number of edges in the graph.
	* @remarks Complexity: O(1).
	*/
	edgeCount() {
		return this._edgeCount;
	}
	/**
	* Gets edges of the graph.
	*
	* @returns {EdgeObj[]} the {@link EdgeObj} for each edge in the graph.
	*
	* @remarks
	* In case of compound graph subgraphs are not considered.
	* Use {@link edge()} to get the label for each edge.
	* Takes `O(|E|)` time.
	*/
	edges() {
		return values(this._edgeObjs);
	}
	/**
	* Establish an edges path over the nodes in nodes list.
	*
	* If some edge is already exists, it will update its label, otherwise it will
	* create an edge between pair of nodes with label provided or default label
	* if no label provided.
	*
	* @param {Collection<NodeID>} vs - List of node IDs to create edges between.
	* @param {EdgeLabel} [value] - If set, update all edges with this value.
	* @returns {this}
	* @remarks Complexity: O(|nodes|).
	*/
	setPath(vs, value) {
		var self = this;
		var args = arguments;
		reduce(vs, function(v, w) {
			if (args.length > 1) self.setEdge(v, w, value);
			else self.setEdge(v, w);
			return w;
		});
		return this;
	}
	/**
	* Creates or updates the label for the edge (`v`, `w`) with the optionally
	* supplied `name`.
	*
	* @overload
	* @param {EdgeObj} arg0 - Edge object.
	* @param {EdgeLabel} [value] - If supplied, it is set as the label for the edge.
	* If not supplied and the edge was created by this call then
	* {@link setDefaultEdgeLabel} will be used to assign the edge's label.
	* @returns {this} the graph, allowing this to be chained with other functions.
	* @remarks Takes `O(1)` time.
	*/
	/**
	* Creates or updates the label for the edge (`v`, `w`) with the optionally
	* supplied `name`.
	*
	* @overload
	* @param {NodeID | number} v - Source node ID. Number values will be coerced to strings.
	* @param {NodeID | number} w - Target node ID. Number values will be coerced to strings.
	* @param {EdgeLabel} [value] - If supplied, it is set as the label for the edge.
	* If not supplied and the edge was created by this call then
	* {@link setDefaultEdgeLabel} will be used to assign the edge's label.
	* @param {string | number} [name] - Edge name. Only useful with multigraphs.
	* @returns {this} the graph, allowing this to be chained with other functions.
	* @remarks Takes `O(1)` time.
	*/
	setEdge() {
		var v, w, name, value;
		var valueSpecified = false;
		var arg0 = arguments[0];
		if (typeof arg0 === "object" && arg0 !== null && "v" in arg0) {
			v = arg0.v;
			w = arg0.w;
			name = arg0.name;
			if (arguments.length === 2) {
				value = arguments[1];
				valueSpecified = true;
			}
		} else {
			v = arg0;
			w = arguments[1];
			name = arguments[3];
			if (arguments.length > 2) {
				value = arguments[2];
				valueSpecified = true;
			}
		}
		v = "" + v;
		w = "" + w;
		if (!isUndefined(name)) name = "" + name;
		var e = edgeArgsToId(this._isDirected, v, w, name);
		if (Object.prototype.hasOwnProperty.call(this._edgeLabels, e)) {
			if (valueSpecified) this._edgeLabels[e] = value;
			return this;
		}
		if (!isUndefined(name) && !this._isMultigraph) throw new Error("Cannot set a named edge when isMultigraph = false");
		this.setNode(v);
		this.setNode(w);
		this._edgeLabels[e] = valueSpecified ? value : this._defaultEdgeLabelFn(v, w, name);
		var edgeObj = edgeArgsToObj(this._isDirected, v, w, name);
		v = edgeObj.v;
		w = edgeObj.w;
		Object.freeze(edgeObj);
		this._edgeObjs[e] = edgeObj;
		incrementOrInitEntry(this._preds[w], v);
		incrementOrInitEntry(this._sucs[v], w);
		this._in[w][e] = edgeObj;
		this._out[v][e] = edgeObj;
		this._edgeCount++;
		return this;
	}
	/**
	* Gets the label for the specified edge.
	*
	* @overload
	* @param {EdgeObj} v - Edge object.
	* @returns {EdgeLabel | undefined} the label for the edge (`v`, `w`) if the
	* graph has an edge between `v` and `w` with the optional `name`.
	* Returned `undefined` if there is no such edge in the graph.
	* @remarks
	* `v` and `w` can be interchanged for undirected graphs.
	* Takes `O(1)` time.
	*/
	/**
	* Gets the label for the specified edge.
	*
	* @overload
	* @param {NodeID | number} v - Source node ID.
	* @param {NodeID | number} w - Target node ID.
	* @param {string | number} [name] - Edge name. Only useful with multigraphs.
	* @returns {EdgeLabel | undefined} the label for the edge (`v`, `w`) if the
	* graph has an edge between `v` and `w` with the optional `name`.
	* Returned `undefined` if there is no such edge in the graph.
	* @remarks
	* `v` and `w` can be interchanged for undirected graphs.
	* Takes `O(1)` time.
	*/
	edge(v, w, name) {
		var e = arguments.length === 1 ? edgeObjToId(this._isDirected, arguments[0]) : edgeArgsToId(this._isDirected, v, w, name);
		return this._edgeLabels[e];
	}
	/**
	* Detects whether the graph contains specified edge or not.
	*
	* @overload
	* @param {EdgeObj} v - Edge object.
	* @returns {boolean} `true` if the graph has an edge between `v` and `w`
	* with the optional `name`.
	* @remarks
	* `v` and `w` can be interchanged for undirected graphs.
	* No subgraphs are considered.
	* Takes `O(1)` time.
	*/
	/**
	* Detects whether the graph contains specified edge or not.
	*
	* @overload
	* @param {NodeID | number} v - Source node ID.
	* @param {NodeID | number} w - Target node ID.
	* @param {string | number} [name] - Edge name. Only useful with multigraphs.
	* @returns {boolean} `true` if the graph has an edge between `v` and `w`
	* with the optional `name`.
	* @remarks
	* `v` and `w` can be interchanged for undirected graphs.
	* No subgraphs are considered.
	* Takes `O(1)` time.
	*/
	hasEdge(v, w, name) {
		var e = arguments.length === 1 ? edgeObjToId(this._isDirected, arguments[0]) : edgeArgsToId(this._isDirected, v, w, name);
		return Object.prototype.hasOwnProperty.call(this._edgeLabels, e);
	}
	/**
	* Removes the edge (`v`, `w`) if the graph has an edge between `v` and `w`
	* with the optional `name`. If not this function does nothing.
	*
	* @overload
	* @param {EdgeObj} v - Edge object.
	* @returns {this}
	* @remarks
	* `v` and `w` can be interchanged for undirected graphs.
	* No subgraphs are considered.
	* Takes `O(1)` time.
	*/
	/**
	* Removes the edge (`v`, `w`) if the graph has an edge between `v` and `w`
	* with the optional `name`. If not this function does nothing.
	*
	* @overload
	* @param {NodeID | number} v - Source node ID.
	* @param {NodeID | number} w - Target node ID.
	* @param {string | number} [name] - Edge name. Only useful with multigraphs.
	* @returns {this}
	* @remarks
	* `v` and `w` can be interchanged for undirected graphs.
	* Takes `O(1)` time.
	*/
	removeEdge(v, w, name) {
		var e = arguments.length === 1 ? edgeObjToId(this._isDirected, arguments[0]) : edgeArgsToId(this._isDirected, v, w, name);
		var edge = this._edgeObjs[e];
		if (edge) {
			v = edge.v;
			w = edge.w;
			delete this._edgeLabels[e];
			delete this._edgeObjs[e];
			decrementOrRemoveEntry(this._preds[w], v);
			decrementOrRemoveEntry(this._sucs[v], w);
			delete this._in[w][e];
			delete this._out[v][e];
			this._edgeCount--;
		}
		return this;
	}
	/**
	* @param {NodeID | number} v - Target node ID.
	* @param {NodeID | number} [u] - Optionally filters edges down to just those
	* coming from node `u`.
	* @returns {EdgeObj[] | undefined} all edges that point to the node `v`.
	* Returns `undefined` if node `v` is not in the graph.
	* @remarks
	* Behavior is undefined for undirected graphs - use {@link nodeEdges} instead.
	* Takes `O(|E|)` time.
	*/
	inEdges(v, u) {
		var inV = this._in[v];
		if (inV) {
			var edges = values(inV);
			if (!u) return edges;
			return filter(edges, function(edge) {
				return edge.v === u;
			});
		}
	}
	/**
	* @param {NodeID | number} v - Target node ID.
	* @param {NodeID | number} [w] - Optionally filters edges down to just those
	* that point to `w`.
	* @returns {EdgeObj[] | undefined} all edges that point to the node `v`.
	* Returns `undefined` if node `v` is not in the graph.
	* @remarks
	* Behavior is undefined for undirected graphs - use {@link nodeEdges} instead.
	* Takes `O(|E|)` time.
	*/
	outEdges(v, w) {
		var outV = this._out[v];
		if (outV) {
			var edges = values(outV);
			if (!w) return edges;
			return filter(edges, function(edge) {
				return edge.w === w;
			});
		}
	}
	/**
	* @param {NodeID | number} v - Target Node ID.
	* @param {NodeID | number} [w] - If set, filters those edges down to just
	* those between nodes `v` and `w` regardless of direction
	* @returns {EdgeObj[] | undefined} all edges to or from node `v` regardless
	* of direction. Returns `undefined` if node `v` is not in the graph.
	* @remarks Takes `O(|E|)` time.
	*/
	nodeEdges(v, w) {
		var inEdges = this.inEdges(v, w);
		if (inEdges) return inEdges.concat(this.outEdges(v, w));
	}
};
Graph.prototype._nodeCount = 0;
Graph.prototype._edgeCount = 0;
/**
* @param {Record<NodeID, number>} map - Object mapping node IDs to counts.
* @param {NodeID | number} k - Node ID.
*/
function incrementOrInitEntry(map, k) {
	if (map[k]) map[k]++;
	else map[k] = 1;
}
/**
* @param {Record<NodeID, number>} map - Object mapping node IDs to counts.
* @param {NodeID | number} k - Node ID.
*/
function decrementOrRemoveEntry(map, k) {
	if (!--map[k]) delete map[k];
}
/**
* @param {boolean} isDirected - If `false`, sorts v and w to ensure a consistent ID.
* @param {EdgeObj['v'] | number} v_ - Source node ID.
* @param {EdgeObj['w'] | number} w_ - Target node ID.
* @param {EdgeObj['name']} [name] - Edge name (for multiple edges between the same nodes).
* @returns {EdgeID} Unique ID for the edge.
*/
function edgeArgsToId(isDirected, v_, w_, name) {
	var v = "" + v_;
	var w = "" + w_;
	if (!isDirected && v > w) {
		var tmp = v;
		v = w;
		w = tmp;
	}
	return v + EDGE_KEY_DELIM + w + EDGE_KEY_DELIM + (isUndefined(name) ? DEFAULT_EDGE_NAME : name);
}
/**
* @param {boolean} isDirected - If `false`, sorts v and w to ensure a consistent ID.
* @param {EdgeObj['v'] | number} v_ - Source node ID.
* @param {EdgeObj['w'] | number} w_ - Target node ID.
* @param {EdgeObj['name']} [name] - Edge name (for multiple edges between the same nodes).
* @returns {EdgeObj}
*/
function edgeArgsToObj(isDirected, v_, w_, name) {
	var v = "" + v_;
	var w = "" + w_;
	if (!isDirected && v > w) {
		var tmp = v;
		v = w;
		w = tmp;
	}
	var edgeObj = {
		v,
		w
	};
	if (name) edgeObj.name = name;
	return edgeObj;
}
/**
* @param {boolean} isDirected - If `false`, sorts v and w to ensure a consistent ID.
* @param {EdgeObj} edgeObj - Edge object.
* @returns {EdgeID} Unique ID for the edge.
*/
function edgeObjToId(isDirected, edgeObj) {
	return edgeArgsToId(isDirected, edgeObj.v, edgeObj.w, edgeObj.name);
}
//#endregion
export { forEach as a, filter as i, reduce as n, castFunction as o, values as r, Graph as t };
