import { $n as toRefs, Gn as readonly, Jn as shallowReadonly, Kn as ref, Nn as getCurrentScope, Ot as nextTick, Rn as isRef, U as computed, Vn as onScopeDispose, Wn as reactive, Yn as shallowRef, _n as watchEffect, gn as watch, ht as hasInjectionContext, nr as unref, qn as shallowReactive, xt as inject } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
import { t as setupDevtoolsPlugin } from "./esm-c9KBDSeW.js";
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/utils.js
/**
* Base Vue injection key `VueQueryPlugin` provides the `QueryClient` under.
* @internal
*/
var VUE_QUERY_CLIENT = "VUE_QUERY_CLIENT";
/**
* Builds the injection key `useQueryClient`/`VueQueryPlugin` use for a given `queryClientKey`.
* @internal
* @param key - The `queryClientKey`. Without it, the base key is used.
* @returns The injection key.
*/
function getClientKey(key) {
	return `${VUE_QUERY_CLIENT}${key ? `:${key}` : ""}`;
}
/**
* Copies each property from `update` onto `state`, in place, for every key already on `state`.
* @internal
* @param state - The object to update.
* @param update - The object to copy the values from.
*/
function updateState(state, update) {
	Object.keys(state).forEach((key) => {
		state[key] = update[key];
	});
}
/**
* Recursive implementation of {@link cloneDeep}, which also tracks the key and nesting level of
* the current node for `customize`.
* @param value - The value to clone.
* @param customize - Called for every node with its key and nesting level. If it returns a value
* other than `undefined`, that value is used instead of recursing.
* @param currentKey - The key of the current node.
* @param currentLevel - The nesting level of the current node.
* @returns The cloned value.
*/
function _cloneDeep(value, customize, currentKey = "", currentLevel = 0) {
	if (customize) {
		const result = customize(value, currentKey, currentLevel);
		if (result === void 0 && isRef(value)) return result;
		if (result !== void 0) return result;
	}
	if (Array.isArray(value)) return value.map((val, index) => _cloneDeep(val, customize, String(index), currentLevel + 1));
	if (typeof value === "object" && isPlainObject$1(value)) {
		const entries = Object.entries(value).map(([key, val]) => [key, _cloneDeep(val, customize, key, currentLevel + 1)]);
		return Object.fromEntries(entries);
	}
	return value;
}
/**
* Deep-clones `value`, recursing into arrays and plain objects. `customize`, if provided, can
* intercept any node (by key and nesting level) and substitute its own return value instead of recursing
* further.
* @internal
* @param value - The value to clone.
* @param customize - Called for every node with its key and nesting level. If it returns a value
* other than `undefined`, that value is used instead of recursing.
* @returns The cloned value.
*/
function cloneDeep(value, customize) {
	return _cloneDeep(value, customize);
}
/**
* Deep-clones `value` like {@link cloneDeep}, additionally unwrapping any `ref`s it encounters (and,
* if `unrefGetters` is `true`, calling any functions it encounters and unwrapping their result too). Always
* resolves `queryKey` this way, regardless of `unrefGetters` — this is what lets a `queryKey` containing `ref`s
* be passed straight through to `@tanstack/query-core`.
* @internal
* @param obj - The value to clone.
* @param unrefGetters - Whether to also call functions and unwrap their result.
* @returns The cloned value, with `ref`s unwrapped.
*/
function cloneDeepUnref(obj, unrefGetters = false) {
	return cloneDeep(obj, (val, key, level) => {
		if (level === 1 && key === "queryKey") return cloneDeepUnref(val, true);
		if (unrefGetters && isFunction(val)) return cloneDeepUnref(val(), unrefGetters);
		if (isRef(val)) return cloneDeepUnref(unref(val), unrefGetters);
	});
}
/**
* Checks whether a value is a plain object, created with an object literal or
* `Object.create(null)`.
* @param value - The value to check.
* @returns `true` if `value` is a plain object.
*/
function isPlainObject$1(value) {
	if (Object.prototype.toString.call(value) !== "[object Object]") return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === null || prototype === Object.prototype;
}
/**
* Checks whether a value is a function.
* @param value - The value to check.
* @returns `true` if `value` is a function.
*/
function isFunction(value) {
	return typeof value === "function";
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/useQueryClient.js
/**
* Retrieves the `QueryClient` installed by `VueQueryPlugin`, via Vue's `inject`. Must be called inside
* `setup()` or another function that supports an injection context.
* @param id - The `queryClientKey` passed to `VueQueryPlugin` — only needed when multiple `QueryClient`s are
* installed in the same app.
* @returns The installed `QueryClient`.
* @throws {Error} If called outside an injection context, or if no `QueryClient` was installed via
* `VueQueryPlugin`.
* @example
* ```vue
* <script setup lang="ts">
* import { useQueryClient } from '@tanstack/vue-query'
*
* const queryClient = useQueryClient()
*
* function invalidate() {
*   queryClient.invalidateQueries({ queryKey: ['todos'] })
* }
* <\/script>
* ```
*/
function useQueryClient(id = "") {
	if (!hasInjectionContext()) throw new Error("vue-query hooks can only be used inside setup() function or functions that support injection context.");
	const key = getClientKey(id);
	const queryClient = inject(key);
	if (!queryClient) throw new Error("No 'queryClient' found in Vue context, use 'VueQueryPlugin' to properly initialize the library.");
	return queryClient;
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/timeoutManager.js
var defaultTimeoutProvider = {
	setTimeout: (callback, delay) => setTimeout(callback, delay),
	clearTimeout: (timeoutId) => clearTimeout(timeoutId),
	setInterval: (callback, delay) => setInterval(callback, delay),
	clearInterval: (intervalId) => clearInterval(intervalId)
};
/**
* Allows customization of how timeouts are created.
*
* `@tanstack/query-core` makes liberal use of timeouts to implement `staleTime`
* and `gcTime`. The default TimeoutManager provider uses the platform's global
* `setTimeout` implementation, which is known to have scalability issues with
* thousands of timeouts on the event loop.
*
* If you hit this limitation, consider providing a custom TimeoutProvider that
* coalesces timeouts.
*/
var TimeoutManager = class {
	#provider = defaultTimeoutProvider;
	#providerCalled = false;
	/**
	* `setTimeoutProvider` can be used to set a custom implementation of the
	* `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` functions,
	* called a `TimeoutProvider`.
	*
	* This may be useful if you notice event loop performance issues with
	* thousands of queries. A custom TimeoutProvider could also support timer
	* delays longer than the global `setTimeout` maximum delay value of about
	* 24 days.
	*
	* It is important to call `setTimeoutProvider` before creating a
	* QueryClient or queries, so that the same provider is used consistently
	* for all timers in the application, since different TimeoutProviders
	* cannot cancel each others' timers.
	* @param provider - The `TimeoutProvider` to use for all timers from now on.
	* @example
	* ```ts
	* import { timeoutManager, QueryClient } from '@tanstack/query-core'
	* import { CustomTimeoutProvider } from './CustomTimeoutProvider'
	*
	* timeoutManager.setTimeoutProvider(new CustomTimeoutProvider())
	*
	* export const queryClient = new QueryClient()
	* ```
	*/
	setTimeoutProvider(provider) {
		if (this.#providerCalled && provider !== this.#provider) console.error(`[timeoutManager]: Switching provider after calls to previous provider might result in unexpected behavior.`, {
			previous: this.#provider,
			provider
		});
		this.#provider = provider;
		this.#providerCalled = false;
	}
	/**
	* `setTimeout` schedules a callback to run after approximately `delay`
	* milliseconds, like the global `setTimeout` function. The callback can be
	* canceled with `clearTimeout`.
	*
	* It returns a timer ID, which may be a number or an object that can be
	* coerced to a number via `Symbol.toPrimitive`.
	* @param callback - The function to call when the timeout elapses.
	* @param delay - The time to wait before calling `callback`, in milliseconds.
	* @returns The timer ID, to pass to {@link TimeoutManager#clearTimeout}.
	* @example
	* ```ts
	* import { timeoutManager } from '@tanstack/query-core'
	*
	* const timeoutId = timeoutManager.setTimeout(
	*   () => console.log('ran at:', new Date()),
	*   1000,
	* )
	*
	* const timeoutIdNumber: number = Number(timeoutId)
	* ```
	*/
	setTimeout(callback, delay) {
		this.#providerCalled = true;
		return this.#provider.setTimeout(callback, delay);
	}
	/**
	* `clearTimeout` cancels a timeout callback scheduled with `setTimeout`,
	* like the global `clearTimeout` function. It should be called with a
	* timer ID returned by `setTimeout`.
	* @param timeoutId - The timer ID returned by `setTimeout`, or `undefined`.
	* @example
	* ```ts
	* import { timeoutManager } from '@tanstack/query-core'
	*
	* const timeoutId = timeoutManager.setTimeout(
	*   () => console.log('ran at:', new Date()),
	*   1000,
	* )
	*
	* timeoutManager.clearTimeout(timeoutId)
	* ```
	*/
	clearTimeout(timeoutId) {
		this.#provider.clearTimeout(timeoutId);
	}
	/**
	* `setInterval` schedules a callback to be called approximately every
	* `delay` milliseconds, like the global `setInterval` function.
	*
	* Like `setTimeout`, it returns a timer ID, which may be a number or an
	* object that can be coerced to a number via `Symbol.toPrimitive`.
	* @param callback - The function to call on every interval.
	* @param delay - The time between calls, in milliseconds.
	* @returns The timer ID, to pass to {@link TimeoutManager#clearInterval}.
	* @example
	* ```ts
	* import { timeoutManager } from '@tanstack/query-core'
	*
	* const intervalId = timeoutManager.setInterval(
	*   () => console.log('ran at:', new Date()),
	*   1000,
	* )
	* ```
	*/
	setInterval(callback, delay) {
		this.#providerCalled = true;
		return this.#provider.setInterval(callback, delay);
	}
	/**
	* `clearInterval` can be used to cancel an interval, like the global
	* `clearInterval` function. It should be called with an interval ID
	* returned by `setInterval`.
	* @param intervalId - The timer ID returned by `setInterval`, or `undefined`.
	* @example
	* ```ts
	* import { timeoutManager } from '@tanstack/query-core'
	*
	* const intervalId = timeoutManager.setInterval(
	*   () => console.log('ran at:', new Date()),
	*   1000,
	* )
	*
	* timeoutManager.clearInterval(intervalId)
	* ```
	*/
	clearInterval(intervalId) {
		this.#provider.clearInterval(intervalId);
	}
};
/**
* Singleton instance of {@link TimeoutManager}, used throughout TanStack Query to schedule and cancel timers.
*/
var timeoutManager = new TimeoutManager();
/**
* In many cases code wants to delay to the next event loop tick; this is not
* mediated by {@link timeoutManager}.
*
* This function is provided to make auditing the `tanstack/query-core` for
* incorrect use of system `setTimeout` easier.
* @param callback - The function to call on the next event loop tick.
*/
function systemSetTimeoutZero(callback) {
	setTimeout(callback, 0);
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/utils.js
/**
* @deprecated use `environmentManager.isServer()` instead.
*/
var isServer$1 = typeof window === "undefined" || "Deno" in globalThis;
function noop() {}
/**
* Resolves an {@link Updater}: calls it with `input` if it is a function, otherwise returns it as
* is.
* @param updater - The new value, or a function that receives `input` and returns the new value.
* @param input - The current value, passed to `updater` if it is a function.
* @returns The new value.
*/
function functionalUpdate(updater, input) {
	return typeof updater === "function" ? updater(input) : updater;
}
/**
* Checks whether a value can be used as a timeout: a non-negative, finite number.
* @param value - The value to check.
* @returns `true` if `value` is a number that is `>= 0` and not `Infinity`.
*/
function isValidTimeout(value) {
	return typeof value === "number" && value >= 0 && value !== Infinity;
}
/**
* Calculates how long until data updated at `updatedAt` becomes stale.
* @param updatedAt - The timestamp, in milliseconds, at which the data was last updated.
* @param staleTime - The time, in milliseconds, after which data is considered stale. Defaults to
* `0`.
* @returns The remaining time in milliseconds, or `0` if the data is already stale.
*/
function timeUntilStale(updatedAt, staleTime) {
	return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0);
}
/**
* Resolves an option that can be given either as a value or as a function of the query, such as
* `staleTime`.
* @param value - The option value, or a function that receives `query` and returns the value.
* @param query - The query passed to `value` if it is a function.
* @returns The resolved value, or `undefined` if `value` is `undefined`.
*/
function resolveQueryValue(value, query) {
	return typeof value === "function" ? value(query) : value;
}
/**
* Checks whether a query matches the given {@link QueryFilters}.
* Every filter that is specified must match; filters that are left unspecified are ignored.
* @param filters - The filters to check the query against.
* @param query - The query to check.
* @returns `true` if the query matches every specified filter.
* @example
* ```ts
* const queryCache = queryClient.getQueryCache()
*
* const matchingQueries = queryCache
*   .getAll()
*   .filter((query) => matchQuery({ queryKey: ['posts'] }, query))
* ```
*/
function matchQuery(filters, query) {
	const { type = "all", exact, fetchStatus, predicate, queryKey, stale } = filters;
	if (queryKey) {
		if (exact) {
			if (query.queryHash !== hashQueryKeyByOptions(queryKey, query.options)) return false;
		} else if (!partialMatchKey(query.queryKey, queryKey)) return false;
	}
	if (type !== "all") {
		const isActive = query.isActive();
		if (type === "active" && !isActive) return false;
		if (type === "inactive" && isActive) return false;
	}
	if (typeof stale === "boolean" && query.isStale() !== stale) return false;
	if (fetchStatus && fetchStatus !== query.state.fetchStatus) return false;
	if (predicate && !predicate(query)) return false;
	return true;
}
/**
* Checks whether a mutation matches the given {@link MutationFilters}.
* Every filter that is specified must match; filters that are left unspecified are ignored.
* If a `mutationKey` filter is provided but the mutation has no `mutationKey` of its own, it does not match.
* @param filters - The filters to check the mutation against.
* @param mutation - The mutation to check.
* @returns `true` if the mutation matches every specified filter.
* @example
* ```ts
* const mutationCache = queryClient.getMutationCache()
*
* const matchingMutations = mutationCache
*   .getAll()
*   .filter((mutation) => matchMutation({ mutationKey: ['addPost'] }, mutation))
* ```
*/
function matchMutation(filters, mutation) {
	const { exact, status, predicate, mutationKey } = filters;
	if (mutationKey) {
		if (!mutation.options.mutationKey) return false;
		if (exact) {
			if (hashKey(mutation.options.mutationKey) !== hashKey(mutationKey)) return false;
		} else if (!partialMatchKey(mutation.options.mutationKey, mutationKey)) return false;
	}
	if (status && mutation.state.status !== status) return false;
	if (predicate && !predicate(mutation)) return false;
	return true;
}
/**
* Hashes a query key with the query's `queryKeyHashFn` option, falling back to {@link hashKey}.
* @param queryKey - The query key to hash.
* @param options - The query options that may provide a custom `queryKeyHashFn`.
* @returns The query hash, a string that identifies the query in the cache.
*/
function hashQueryKeyByOptions(queryKey, options) {
	return (options?.queryKeyHashFn || hashKey)(queryKey);
}
/**
* Default query & mutation keys hash function.
* Hashes the value into a stable hash.
* @param queryKey - The query or mutation key to hash.
* @returns The stable hash of the key, as a JSON string.
* @example
* ```ts
* // Object keys are sorted, so key order doesn't affect the hash:
* hashKey(['todos', { page: 1, filter: 'done' }]) // === '["todos",{"filter":"done","page":1}]'
* ```
*/
function hashKey(queryKey) {
	return JSON.stringify(queryKey, (_, val) => isPlainObject(val) ? Object.keys(val).sort().reduce((result, key) => {
		result[key] = val[key];
		return result;
	}, {}) : val);
}
function partialMatchKey(a, b) {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;
	if (a && b && typeof a === "object" && typeof b === "object") {
		if (Array.isArray(a) && Array.isArray(b)) {
			if (b.length > a.length) return false;
			for (let i = 0; i < b.length; i++) if (!partialMatchKey(a[i], b[i])) return false;
			return true;
		}
		const bKeys = Object.keys(b);
		for (const key of bKeys) if (!partialMatchKey(a[key], b[key])) return false;
		return true;
	}
	return false;
}
var hasOwn = Object.prototype.hasOwnProperty;
function replaceEqualDeep(a, b, depth = 0) {
	if (a === b) return a;
	if (depth > 500) return b;
	const array = isPlainArray(a) && isPlainArray(b);
	if (!array && !(isPlainObject(a) && isPlainObject(b))) return b;
	const aSize = (array ? a : Object.keys(a)).length;
	const bItems = array ? b : Object.keys(b);
	const bSize = bItems.length;
	const copy = array ? new Array(bSize) : {};
	let equalItems = 0;
	for (let i = 0; i < bSize; i++) {
		const key = array ? i : bItems[i];
		const aItem = a[key];
		const bItem = b[key];
		if (aItem === bItem) {
			copy[key] = aItem;
			if (array ? i < aSize : hasOwn.call(a, key)) equalItems++;
			continue;
		}
		if (aItem === null || bItem === null || typeof aItem !== "object" || typeof bItem !== "object") {
			copy[key] = bItem;
			continue;
		}
		const v = replaceEqualDeep(aItem, bItem, depth + 1);
		copy[key] = v;
		if (v === aItem) equalItems++;
	}
	return aSize === bSize && equalItems === aSize ? a : copy;
}
/**
* Shallow compare objects.
* @param a - The first object.
* @param b - The second object, or `undefined`.
* @returns `true` if both objects have the same keys, with strictly equal values for each key.
*/
function shallowEqualObjects(a, b) {
	if (!b || Object.keys(a).length !== Object.keys(b).length) return false;
	for (const key in a) if (a[key] !== b[key]) return false;
	return true;
}
/**
* Checks whether a value is an array with no holes and no extra properties.
* @param value - The value to check.
* @returns `true` if `value` is an array whose number of own keys equals its `length`.
*/
function isPlainArray(value) {
	return Array.isArray(value) && value.length === Object.keys(value).length;
}
/**
* Checks whether a value is a plain object, e.g. created with an object literal or
* `Object.create(null)`.
* @param o - The value to check.
* @returns `true` if `o` is a plain object.
*/
function isPlainObject(o) {
	if (!hasObjectPrototype(o)) return false;
	const objectPrototype = Object.getPrototypeOf(o);
	const ctor = objectPrototype?.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return false;
	const prot = ctor.prototype;
	if (!hasObjectPrototype(prot)) return false;
	if (!prot.hasOwnProperty("isPrototypeOf")) return false;
	if (objectPrototype !== Object.prototype) return false;
	return true;
}
/**
* Checks whether a value's `Object.prototype.toString` tag is `[object Object]`.
* @param o - The value to check.
* @returns `true` if the tag is `[object Object]`.
*/
function hasObjectPrototype(o) {
	return Object.prototype.toString.call(o) === "[object Object]";
}
/**
* Waits for the given time, using the configured {@link timeoutManager}.
* @param timeout - The time to wait, in milliseconds.
* @returns A promise that resolves after `timeout` milliseconds.
*/
function sleep(timeout) {
	return new Promise((resolve) => {
		timeoutManager.setTimeout(resolve, timeout);
	});
}
/**
* Applies a query's `structuralSharing` option when writing new data.
* @param prevData - The previously cached data.
* @param data - The new data.
* @param options - The query options, whose `structuralSharing` decides how the data is merged.
* @returns The result of a custom `structuralSharing` function, `data` with its unchanged parts
* replaced by those of `prevData` by default, or `data` as is if `structuralSharing` is `false`.
* @throws {Error} The error from the default structural sharing, e.g. when the data is not JSON serializable.
* Outside production, it is also logged to the console.
*/
function replaceData(prevData, data, options) {
	if (typeof options.structuralSharing === "function") return options.structuralSharing(prevData, data);
	else if (options.structuralSharing !== false) try {
		return replaceEqualDeep(prevData, data);
	} catch (error) {
		console.error(`Structural sharing requires data to be JSON serializable. To fix this, turn off structuralSharing or return JSON-serializable data from your queryFn. [${options.queryHash}]: ${error}`);
		throw error;
	}
	return data;
}
/**
* Intended to be passed as a query's `placeholderData` option, for example
* `placeholderData: keepPreviousData`. Instead of resetting the query's data to `undefined` while a new
* query key is fetching, it keeps displaying the previously fetched data until the new data arrives.
* @param previousData - The data of the previous query key, passed by the observer.
* @returns The previous data, unchanged.
* @example
* ```ts
* new QueryObserver(queryClient, {
*   queryKey: ['posts', page],
*   queryFn: () => fetchPosts(page),
*   placeholderData: keepPreviousData,
* })
* ```
*/
function keepPreviousData(previousData) {
	return previousData;
}
/**
* Returns a new array with `item` added at the end. If that makes the array longer than `max`,
* the first item is dropped. Only one item is dropped, so the result can still exceed `max` if
* `items` already did.
* @param items - The current items.
* @param item - The value to append.
* @param max - The length above which an item is dropped. `0` (the default) means no limit.
* @returns A new array with `item` added.
*/
function addToEnd(items, item, max = 0) {
	const newItems = [...items, item];
	return max && newItems.length > max ? newItems.slice(1) : newItems;
}
/**
* Returns a new array with `item` added at the start. If that makes the array longer than `max`,
* the last item is dropped. Only one item is dropped, so the result can still exceed `max` if
* `items` already did.
* @param items - The current items.
* @param item - The value to prepend.
* @param max - The length above which an item is dropped. `0` (the default) means no limit.
* @returns A new array with `item` added.
*/
function addToStart(items, item, max = 0) {
	const newItems = [item, ...items];
	return max && newItems.length > max ? newItems.slice(0, -1) : newItems;
}
/**
* Sentinel value that can be passed as a query's `queryFn` to conditionally disable the query (equivalent
* to `enabled: false`) while preserving full type inference for the query's data. Unlike `enabled: false`,
* a query disabled via `skipToken` cannot be triggered with `refetch`.
* @example
* ```ts
* new QueryObserver(queryClient, {
*   queryKey: ['post', postId],
*   queryFn: postId != null ? () => fetchPost(postId) : skipToken,
* })
* ```
*/
var skipToken = Symbol();
/**
* Returns the function to call for a fetch. If there is no `queryFn` but the fetch was started from
* an `initialPromise`, that promise is returned instead. If there is no usable `queryFn` (missing or
* {@link skipToken}), the returned function rejects with a `Missing queryFn` error.
* @param options - The query options with the `queryFn`, and the `queryHash` used in error messages.
* @param fetchOptions - The fetch options, which may carry an `initialPromise`.
* @returns The function to call for the fetch.
*/
function ensureQueryFn(options, fetchOptions) {
	if (options.queryFn === skipToken) console.error(`Attempted to invoke queryFn when set to skipToken. This is likely a configuration error. Query hash: '${options.queryHash}'`);
	if (!options.queryFn && fetchOptions?.initialPromise) return () => fetchOptions.initialPromise;
	if (!options.queryFn || options.queryFn === skipToken) return () => Promise.reject(/* @__PURE__ */ new Error(`Missing queryFn: '${options.queryHash}'`));
	return options.queryFn;
}
/**
* Resolves a `throwOnError` option to a boolean.
* If `throwOnError` is a function, it is called with `params` (e.g. the error and, depending on the caller,
* additional context such as the query or mutation) and its result is returned, allowing the throwing
* behavior to be decided per error. Otherwise, `throwOnError` itself is coerced to a boolean (`undefined`
* resolves to `false`).
* @param throwOnError - The `throwOnError` option: a boolean, a function that decides per error, or
* `undefined`.
* @param params - The arguments passed to `throwOnError` if it is a function.
* @returns Whether the error should be thrown.
* @example
* ```ts
* const throwOnError =
*   query.state.error && typeof options.throwOnError === 'function'
*     ? shouldThrowError(options.throwOnError, [query.state.error, query])
*     : options.throwOnError
* ```
*/
function shouldThrowError(throwOnError, params) {
	if (typeof throwOnError === "function") return throwOnError(...params);
	return !!throwOnError;
}
/**
* Adds a lazy `signal` getter to an object, such as a query function context. The first time
* `signal` is read, `onCancelled` is registered for the signal's `abort` event (or called right
* away if it is already aborted), so cancellation is only tracked when the signal is actually used.
* @param object - The object to add the `signal` property to.
* @param getSignal - Returns the `AbortSignal`. Called once, when `signal` is first read.
* @param onCancelled - Called when the signal is aborted, if `signal` was read.
* @returns The same object, with the `signal` property added.
*/
function addConsumeAwareSignal(object, getSignal, onCancelled) {
	let consumed = false;
	let signal;
	Object.defineProperty(object, "signal", {
		enumerable: true,
		get: () => {
			signal ??= getSignal();
			if (consumed) return signal;
			consumed = true;
			if (signal.aborted) onCancelled();
			else signal.addEventListener("abort", onCancelled, { once: true });
			return signal;
		}
	});
	return object;
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/environmentManager.js
var isServerFn = () => isServer$1;
/**
* Returns whether the current runtime should be treated as a server environment.
* @returns `true` if the runtime is treated as a server.
*/
var isServer = () => isServerFn();
/**
* Manages how TanStack Query detects whether the current runtime should be treated as
* server-side, which disables scheduling refetch timers and changes the default `retry` count
* and `gcTime`. By default, the detection treats a missing `window` (or the presence of a
* `Deno` global) as server.
*
* Override this for runtimes where that default detection would give the wrong answer — for
* example, a Service Worker, where `window` is undefined even though the environment should
* behave like a client.
* @example
* ```ts
* import { environmentManager } from '@tanstack/query-core'
*
* environmentManager.setIsServer(() => false)
* ```
*/
var environmentManager = {
	isServer,
	/**
	* Overrides the server check globally.
	* @param isServerValue - A function that returns whether the runtime should be treated as a
	* server.
	*/
	setIsServer(isServerValue) {
		isServerFn = isServerValue;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/subscribable.js
/**
* The base class behind everything in Query that you can subscribe to: `QueryCache`, `MutationCache`,
* the observers, and the `FocusManager`/`OnlineManager` behind `focusManager` and `onlineManager`.
* Subclasses decide what a listener receives and when it is called.
*/
var Subscribable = class {
	constructor() {
		this.listeners = /* @__PURE__ */ new Set();
		this.subscribe = this.subscribe.bind(this);
	}
	/**
	* Registers a listener to be called on every update this object notifies about. Returns a function
	* that removes the listener again — call it to stop listening. The base class never drops a listener
	* on its own, though some subclasses clear all of theirs in `destroy()`.
	* @param listener - Called on each update, with whatever the subclass passes to its subscribers.
	* @returns A function that removes the listener.
	* @example
	* ```ts
	* const unsubscribe = subscribable.subscribe(() => {
	*   // react to the update
	* })
	*
	* unsubscribe()
	* ```
	*/
	subscribe(listener) {
		this.listeners.add(listener);
		this.onSubscribe();
		return () => {
			this.listeners.delete(listener);
			this.onUnsubscribe();
		};
	}
	/**
	* Returns `true` while at least one listener is registered, `false` once they have all unsubscribed.
	* @returns `true` if at least one listener is registered.
	*/
	hasListeners() {
		return this.listeners.size > 0;
	}
	/**
	* Called after a listener is added. Does nothing here; subclasses override it, e.g. to start
	* tracking what they observe once the first listener subscribes.
	*/
	onSubscribe() {}
	/**
	* Called after a listener is removed. Does nothing here; subclasses override it, e.g. to clean up
	* once the last listener unsubscribes.
	*/
	onUnsubscribe() {}
};
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/focusManager.js
/**
* The `FocusManager` manages the focus state within TanStack Query.
*
* It can be used to change the default event listeners or to manually change the focus state.
*/
var FocusManager = class extends Subscribable {
	#focused;
	#cleanup;
	#setup;
	constructor() {
		super();
		this.#setup = (onFocus) => {
			if (typeof window !== "undefined" && window.addEventListener) {
				const listener = () => onFocus();
				window.addEventListener("visibilitychange", listener, false);
				return () => {
					window.removeEventListener("visibilitychange", listener);
				};
			}
		};
	}
	onSubscribe() {
		if (!this.#cleanup) this.setEventListener(this.#setup);
	}
	onUnsubscribe() {
		if (!this.hasListeners()) {
			this.#cleanup?.();
			this.#cleanup = void 0;
		}
	}
	/**
	* `setEventListener` can be used to set a custom event listener that will
	* be used to determine the focus state. The provided `setup` function
	* receives a `setFocused` callback: call it with a `boolean` to manually
	* set the focus state, or with no arguments to re-evaluate the current
	* focus state and notify subscribers.
	* @param setup - Receives the `setFocused` callback, registers the event listener, and may return
	* a cleanup function that is called when the listener is replaced or no longer needed.
	* @example
	* ```ts
	* import { focusManager } from '@tanstack/query-core'
	*
	* focusManager.setEventListener((handleFocus) => {
	*   const listener = () => handleFocus()
	*   // Listen to visibilitychange
	*   if (typeof window !== 'undefined' && window.addEventListener) {
	*     window.addEventListener('visibilitychange', listener, false)
	*   }
	*
	*   return () => {
	*     // Be sure to unsubscribe if a new handler is set
	*     window.removeEventListener('visibilitychange', listener)
	*   }
	* })
	* ```
	*/
	setEventListener(setup) {
		this.#setup = setup;
		this.#cleanup?.();
		this.#cleanup = setup((focused) => {
			if (typeof focused === "boolean") this.setFocused(focused);
			else this.onFocus();
		});
	}
	/**
	* `setFocused` can be used to manually set the focus state. Set `undefined`
	* to fall back to the default focus check.
	* @param focused - The focus state, or `undefined` to use the default focus check.
	* @example
	* ```ts
	* import { focusManager } from '@tanstack/query-core'
	*
	* // Set focused
	* focusManager.setFocused(true)
	*
	* // Set unfocused
	* focusManager.setFocused(false)
	*
	* // Fallback to the default focus check
	* focusManager.setFocused(undefined)
	* ```
	*/
	setFocused(focused) {
		if (this.#focused !== focused) {
			this.#focused = focused;
			this.onFocus();
		}
	}
	/**
	* `onFocus` notifies all subscribed listeners with the current focus state.
	*/
	onFocus() {
		const isFocused = this.isFocused();
		this.listeners.forEach((listener) => {
			listener(isFocused);
		});
	}
	/**
	* `isFocused` can be used to get the current focus state.
	* @returns The focus state set with `setFocused`, or otherwise whether the document is visible.
	*/
	isFocused() {
		if (typeof this.#focused === "boolean") return this.#focused;
		return globalThis.document?.visibilityState !== "hidden";
	}
};
/**
* Singleton instance of {@link FocusManager}, used to manage and observe the focus state within TanStack Query.
*/
var focusManager = new FocusManager();
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/hydration.js
/**
* Reads the value of a promise synchronously if it has already resolved, e.g. a thenable that
* resolves within its `then` call.
* @param promise - The promise to read.
* @returns An object with the resolved `data`, or `undefined` if the promise hasn't resolved
* synchronously (or resolved with `undefined`).
*/
function tryResolveSync(promise) {
	let data;
	promise.then((result) => {
		data = result;
		return result;
	}, noop)?.catch?.(noop);
	if (data !== void 0) return { data };
}
/**
* Dehydrates a single `Mutation` into a serializable snapshot of its key, state, scope, and meta.
* @param mutation - The mutation to dehydrate.
* @returns The dehydrated mutation.
*/
function dehydrateMutation(mutation) {
	return {
		mutationKey: mutation.options.mutationKey,
		state: mutation.state,
		...mutation.options.scope && { scope: mutation.options.scope },
		...mutation.meta && { meta: mutation.meta }
	};
}
/**
* Prepares the in-flight promise of a pending query for dehydration: applies `serializeData` to its
* result, and redacts its rejection error unless `shouldRedactErrors` returns `false` for it.
* @param query - The pending query whose promise is dehydrated.
* @param serializeData - Optional transform applied to the resolved data.
* @param shouldRedactErrors - Optional predicate; if it returns `false` for the rejection error,
* that
* error is kept as-is instead of being redacted.
* @returns The transformed promise, or `undefined` if the query has no in-flight promise.
*/
function dehydratePromise(query, serializeData, shouldRedactErrors) {
	const promise = query.promise?.then(serializeData).catch((error) => {
		if (shouldRedactErrors?.(error) === false) return Promise.reject(error);
		console.error(`A query that was dehydrated as pending ended up rejecting. [${query.queryHash}]: ${error}; The error will be redacted in production builds`);
		return Promise.reject(/* @__PURE__ */ new Error("redacted"));
	});
	promise?.catch(noop);
	return promise;
}
/**
* Dehydrates a single `Query` into a serializable `DehydratedQuery` snapshot. Note that most query config (e.g.
* `queryFn`, `staleTime`) is not dehydrated but instead meant to be configured again when consuming the
* de/rehydrated data, typically with `useQuery` on the client. If the query is still `pending`, its in-flight
* promise is dehydrated too so it can be resumed on the other side instead of re-fetched.
* @param query - The query to dehydrate.
* @param serializeData - Optional transform applied to `query.state.data` before it is included in the snapshot.
* @param shouldRedactErrors - Optional predicate; if it returns `false` for the promise's rejection error, that
* error is kept as-is instead of being redacted.
* @returns The dehydrated query.
*/
function dehydrateQuery(query, serializeData, shouldRedactErrors) {
	return {
		dehydratedAt: Date.now(),
		state: {
			...query.state,
			...query.state.data !== void 0 && { data: serializeData ? serializeData(query.state.data) : query.state.data }
		},
		queryKey: query.queryKey,
		queryHash: query.queryHash,
		...query.state.status === "pending" && { promise: dehydratePromise(query, serializeData, shouldRedactErrors) },
		...query.meta && { meta: query.meta },
		...query.queryType && { queryType: query.queryType }
	};
}
/**
* The default `shouldDehydrateMutation` predicate used by `dehydrate`. Only dehydrates mutations that are
* currently paused (e.g. paused by `networkMode` while offline).
* @param mutation - The mutation to check.
* @returns `true` if the mutation is paused.
*/
function defaultShouldDehydrateMutation(mutation) {
	return mutation.state.isPaused;
}
/**
* The default `shouldDehydrateQuery` predicate used by `dehydrate`. Only dehydrates queries whose status is
* `'success'`.
* @param query - The query to check.
* @returns `true` if the query's status is `'success'`.
*/
function defaultShouldDehydrateQuery(query) {
	return query.state.status === "success";
}
/**
* Dehydrates a `QueryClient`'s cache (queries and mutations) into a plain, serializable `DehydratedState`,
* typically to embed in server-rendered markup and later restore into a client-side `QueryClient` via `hydrate`.
* Which queries/mutations are included, and how their data/errors are transformed, is controlled by `options`,
* falling back to the client's `dehydrate` default options, and finally to `defaultShouldDehydrateQuery` /
* `defaultShouldDehydrateMutation`.
* @param client - The client whose cache is dehydrated.
* @param options - Controls which queries and mutations are included and how their data and errors
* are transformed. Each option falls back to the client's `defaultOptions.dehydrate`.
* @returns The dehydrated state, with the included `queries` and `mutations`.
* @example
* ```ts
* const queryClient = new QueryClient()
*
* await queryClient.prefetchQuery({
*   queryKey: ['posts'],
*   queryFn: getPosts,
* })
*
* const dehydratedState = dehydrate(queryClient)
* ```
*/
function dehydrate(client, options = {}) {
	const filterMutation = options.shouldDehydrateMutation ?? client.getDefaultOptions().dehydrate?.shouldDehydrateMutation ?? defaultShouldDehydrateMutation;
	const mutations = client.getMutationCache().getAll().flatMap((mutation) => filterMutation(mutation) ? [dehydrateMutation(mutation)] : []);
	const filterQuery = options.shouldDehydrateQuery ?? client.getDefaultOptions().dehydrate?.shouldDehydrateQuery ?? defaultShouldDehydrateQuery;
	const shouldRedactErrors = options.shouldRedactErrors ?? client.getDefaultOptions().dehydrate?.shouldRedactErrors;
	const serializeData = options.serializeData ?? client.getDefaultOptions().dehydrate?.serializeData;
	return {
		mutations,
		queries: client.getQueryCache().getAll().flatMap((query) => filterQuery(query) ? [dehydrateQuery(query, serializeData, shouldRedactErrors)] : [])
	};
}
/**
* Restores a `DehydratedState` (as produced by `dehydrate`) into a `QueryClient`'s cache, typically to seed the
* client with data already fetched on the server. `mutations` and `queries` are each optional on `dehydratedState`.
* Queries not yet in the cache are built from the dehydrated snapshot; queries that already exist are only updated
* when the dehydrated data is newer than what's already cached. Newly built queries have their `fetchStatus` reset
* to `'idle'` so they don't hydrate stuck in a fetching state. If a dehydrated query still had an in-flight
* promise, it is resumed via `query.fetch()` (reusing that promise as `initialPromise`) rather than re-invoking
* `queryFn`.
* @param client - The client whose cache is restored into.
* @param dehydratedState - The dehydrated state, e.g. produced by `dehydrate` on the server.
* @param options - `defaultOptions` merged into every restored query and mutation (on top of the
* client's `defaultOptions.hydrate`), and `deserializeData` to reverse `serializeData`.
* @example
* ```ts
* // dehydratedState was produced by `dehydrate` on the server
* // and sent to the client, e.g. embedded in server-rendered markup.
* const queryClient = new QueryClient()
*
* hydrate(queryClient, dehydratedState)
* ```
*/
function hydrate(client, dehydratedState, options) {
	const mutationCache = client.getMutationCache();
	const queryCache = client.getQueryCache();
	const deserializeData = options?.defaultOptions?.deserializeData ?? client.getDefaultOptions().hydrate?.deserializeData;
	dehydratedState.mutations?.forEach(({ state, ...mutationOptions }) => {
		mutationCache.build(client, {
			...client.getDefaultOptions().hydrate?.mutations,
			...options?.defaultOptions?.mutations,
			...mutationOptions
		}, state);
	});
	dehydratedState.queries?.forEach(({ queryKey, state, queryHash, meta, promise, dehydratedAt, queryType }) => {
		const syncData = promise ? tryResolveSync(promise) : void 0;
		const rawData = state.data === void 0 ? syncData?.data : state.data;
		const data = rawData === void 0 ? rawData : deserializeData ? deserializeData(rawData) : rawData;
		let query = queryCache.get(queryHash);
		const existingQueryIsPending = query?.state.status === "pending";
		const existingQueryIsFetching = query?.state.fetchStatus === "fetching";
		if (query) {
			const hasNewerSyncData = syncData && dehydratedAt > query.state.dataUpdatedAt;
			if (state.dataUpdatedAt > query.state.dataUpdatedAt || hasNewerSyncData) {
				const { fetchStatus: _ignored, ...serializedState } = state;
				query.setState({
					...serializedState,
					data,
					...state.status === "pending" && data !== void 0 && {
						status: "success",
						dataUpdatedAt: dehydratedAt,
						...!existingQueryIsFetching && { fetchStatus: "idle" }
					}
				});
			}
		} else query = queryCache.build(client, {
			...client.getDefaultOptions().hydrate?.queries,
			...options?.defaultOptions?.queries,
			queryKey,
			queryHash,
			meta,
			_type: queryType
		}, {
			...state,
			data,
			fetchStatus: "idle",
			status: state.status === "pending" && data !== void 0 ? "success" : state.status,
			...state.status === "pending" && data !== void 0 && { dataUpdatedAt: dehydratedAt }
		});
		if (promise && !syncData && !existingQueryIsPending && !existingQueryIsFetching && dehydratedAt > query.state.dataUpdatedAt) query.fetch(void 0, { initialPromise: Promise.resolve(promise).then(deserializeData) }).catch(noop);
	});
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/notifyManager.js
/**
* Default scheduling function used by the notify manager.
* Schedules the callback with the system's `setTimeout(callback, 0)`.
*/
var defaultScheduler = systemSetTimeoutZero;
/**
* Creates a notify manager, which schedules and batches notifications to subscribers. Query uses a
* single instance of it, exported as {@link notifyManager}.
* @returns A new notify manager.
*/
function createNotifyManager() {
	let queue = [];
	let transactions = 0;
	let notifyFn = (callback) => {
		callback();
	};
	let batchNotifyFn = (callback) => {
		callback();
	};
	let scheduleFn = defaultScheduler;
	const schedule = (callback) => {
		if (transactions) queue.push(callback);
		else scheduleFn(() => {
			notifyFn(callback);
		});
	};
	const flush = () => {
		const originalQueue = queue;
		queue = [];
		if (originalQueue.length) scheduleFn(() => {
			batchNotifyFn(() => {
				originalQueue.forEach((callback) => {
					notifyFn(callback);
				});
			});
		});
	};
	return {
		/**
		* Batches all updates scheduled inside the passed callback.
		* This is mainly used internally to optimize query client updating.
		* Batches can be nested; the queue is only flushed once the outermost `batch` call finishes.
		* The return value of `callback` is passed through.
		* @param callback - The function to run in the batch.
		* @returns The return value of `callback`.
		*/
		batch: (callback) => {
			let result;
			transactions++;
			try {
				result = callback();
			} finally {
				transactions--;
				if (!transactions) flush();
			}
			return result;
		},
		/**
		* All calls to the wrapped function will be batched.
		* @param callback - The function to wrap.
		* @returns A function that schedules a call to `callback` with the given arguments.
		*/
		batchCalls: (callback) => {
			return (...args) => {
				schedule(() => {
					callback(...args);
				});
			};
		},
		/**
		* Schedules a function to be run on the next batch.
		* By default, the batch is run with a `setTimeout`, but this can be configured via `setScheduler`.
		*/
		schedule,
		/**
		* Use this method to set a custom notify function.
		* This can be used to for example wrap notifications with `React.act` while running tests.
		* @param fn - Receives each notification callback and must call it.
		*/
		setNotifyFunction: (fn) => {
			notifyFn = fn;
		},
		/**
		* Use this method to set a custom function to batch notifications together into a single tick.
		* Framework adapters use this to plug in their own batching primitive, so that a single query
		* update only triggers one re-render instead of one per subscriber.
		* @param fn - Receives a function that runs a batch of notifications and must call it.
		* @example
		* ```ts
		* import { notifyManager } from '@tanstack/query-core'
		* import { batch } from 'solid-js'
		*
		* notifyManager.setBatchNotifyFunction(batch)
		* ```
		*/
		setBatchNotifyFunction: (fn) => {
			batchNotifyFn = fn;
		},
		/**
		* Configures a custom callback that schedules when the next batch runs.
		* The default behavior is `setTimeout(callback, 0)`.
		* @param fn - Receives a callback that runs the next batch, and schedules it.
		* @example
		* ```ts
		* import { notifyManager } from '@tanstack/query-core'
		*
		* // Schedule batches in the next microtask
		* notifyManager.setScheduler(queueMicrotask)
		*
		* // Schedule batches before the next frame is rendered
		* notifyManager.setScheduler(requestAnimationFrame)
		*
		* // Schedule batches some time in the future
		* notifyManager.setScheduler((cb) => setTimeout(cb, 10))
		* ```
		*/
		setScheduler: (fn) => {
			scheduleFn = fn;
		}
	};
}
/**
* Handles scheduling and batching callbacks in TanStack Query.
*/
var notifyManager = createNotifyManager();
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/onlineManager.js
/**
* The `OnlineManager` manages the online state within TanStack Query. It can
* be used to change the default event listeners or to manually change the
* online state.
*
* By default, the `onlineManager` assumes an active network connection, and
* listens to the `online` and `offline` events on the `window` object to
* detect changes.
*/
var OnlineManager = class extends Subscribable {
	#online = true;
	#cleanup;
	#setup;
	constructor() {
		super();
		this.#setup = (onOnline) => {
			if (typeof window !== "undefined" && window.addEventListener) {
				const onlineListener = () => onOnline(true);
				const offlineListener = () => onOnline(false);
				window.addEventListener("online", onlineListener, false);
				window.addEventListener("offline", offlineListener, false);
				return () => {
					window.removeEventListener("online", onlineListener);
					window.removeEventListener("offline", offlineListener);
				};
			}
		};
	}
	onSubscribe() {
		if (!this.#cleanup) this.setEventListener(this.#setup);
	}
	onUnsubscribe() {
		if (!this.hasListeners()) {
			this.#cleanup?.();
			this.#cleanup = void 0;
		}
	}
	/**
	* `setEventListener` can be used to set a custom event listener that will
	* be used to determine the online state. The provided `setup` function
	* receives a `setOnline` callback that should be called with a `boolean`
	* whenever the online state changes.
	* @param setup - Receives the `setOnline` callback, registers the event listener, and may return
	* a cleanup function that is called when the listener is replaced or no longer needed.
	* @example
	* ```ts
	* import NetInfo from '@react-native-community/netinfo'
	* import { onlineManager } from '@tanstack/query-core'
	*
	* onlineManager.setEventListener((setOnline) => {
	*   return NetInfo.addEventListener((state) => {
	*     setOnline(!!state.isConnected)
	*   })
	* })
	* ```
	*/
	setEventListener(setup) {
		this.#setup = setup;
		this.#cleanup?.();
		this.#cleanup = setup(this.setOnline.bind(this));
	}
	/**
	* `setOnline` can be used to manually set the online state.
	* @param online - The online state.
	* @example
	* ```ts
	* import { onlineManager } from '@tanstack/query-core'
	*
	* // Set to online
	* onlineManager.setOnline(true)
	*
	* // Set to offline
	* onlineManager.setOnline(false)
	* ```
	*/
	setOnline(online) {
		if (this.#online !== online) {
			this.#online = online;
			this.listeners.forEach((listener) => {
				listener(online);
			});
		}
	}
	/**
	* `isOnline` can be used to get the current online state.
	* @returns `true` if online.
	*/
	isOnline() {
		return this.#online;
	}
};
/**
* Singleton instance of {@link OnlineManager}, used to manage and observe the online state within TanStack Query.
*/
var onlineManager = new OnlineManager();
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/retryer.js
/**
* The default `retryDelay`: doubles with every failure, starting at 1 second, up to 30 seconds.
* @param failureCount - The number of failures so far.
* @returns The delay before the next retry, in milliseconds.
*/
function defaultRetryDelay(failureCount) {
	return Math.min(1e3 * 2 ** failureCount, 3e4);
}
/**
* Checks whether a fetch can run for the given network mode.
* @param networkMode - The `networkMode` option. Defaults to `'online'`.
* @returns `true` if the network mode is not `'online'`, or if it is and the client is online.
*/
function canFetch(networkMode) {
	return (networkMode ?? "online") === "online" ? onlineManager.isOnline() : true;
}
/**
* The error thrown by a `Retryer` (and surfaced to `query.promise`/`mutation`) when a fetch is cancelled, e.g. via
* `query.cancel()`. `revert`, if `true`, tells the caller to restore the state the query was in before the fetch
* started instead of surfacing the error. `silent`, if `true`, tells the caller to suppress this error and instead
* resolve with the promise of the fetch that triggered the cancellation.
* @example
* ```ts
* query.cancel()
*
* try {
*   await query.promise
* } catch (error) {
*   if (error instanceof CancelledError) {
*     // the fetch was cancelled, e.g. via `query.cancel()`
*   }
* }
* ```
*/
var CancelledError = class extends Error {
	constructor(options) {
		super("CancelledError");
		this.revert = options?.revert;
		this.silent = options?.silent;
	}
};
/**
* Checks whether a value is a `CancelledError`.
* @param value - The value to check.
* @returns `true` if `value` is a `CancelledError`.
* @deprecated Use instanceof `CancelledError` instead.
*/
function isCancelledError(value) {
	return value instanceof CancelledError;
}
/**
* Creates a retryer, which runs a function and retries it on failure according to the `retry` and
* `retryDelay` options. It pauses while the network mode doesn't allow fetching or `canRun` returns
* `false`, and can be cancelled. Queries and mutations use it to run their `queryFn` and
* `mutationFn`.
* @param config - The function to run, the retry options, and the callbacks for failures, pausing,
* continuing, and cancellation.
* @returns The retryer, whose `promise` settles with the result of the function.
*/
function createRetryer(config) {
	let isRetryCancelled = false;
	let failureCount = 0;
	let continueFn;
	let status = "pending";
	let promiseResolve;
	let promiseReject;
	const promise = new Promise((resolve, reject) => {
		promiseResolve = resolve;
		promiseReject = reject;
	});
	promise.catch(noop);
	const isResolved = () => status !== "pending";
	const cancel = (cancelOptions) => {
		if (!isResolved()) {
			const error = new CancelledError(cancelOptions);
			reject(error);
			config.onCancel?.(error);
		}
	};
	const cancelRetry = () => {
		isRetryCancelled = true;
	};
	const continueRetry = () => {
		isRetryCancelled = false;
	};
	const canContinue = () => focusManager.isFocused() && (config.networkMode === "always" || onlineManager.isOnline()) && config.canRun();
	const canStart = () => canFetch(config.networkMode) && config.canRun();
	const resolve = (value) => {
		if (!isResolved()) {
			continueFn?.();
			status = "resolved";
			promiseResolve(value);
		}
	};
	const reject = (value) => {
		if (!isResolved()) {
			continueFn?.();
			status = "rejected";
			promiseReject(value);
		}
	};
	const pause = (canResume) => {
		return new Promise((continueResolve) => {
			continueFn = (value) => {
				if (isResolved() || canResume()) continueResolve(value);
			};
			config.onPause?.();
		}).then(() => {
			continueFn = void 0;
			if (!isResolved()) config.onContinue?.();
		});
	};
	const run = () => {
		if (isResolved()) return;
		let promiseOrValue;
		const initialPromise = failureCount === 0 ? config.initialPromise : void 0;
		try {
			promiseOrValue = initialPromise ?? config.fn();
		} catch (error) {
			promiseOrValue = Promise.reject(error);
		}
		Promise.resolve(promiseOrValue).then(resolve).catch((error) => {
			if (isResolved()) return;
			const retry = config.retry ?? (isServer() ? 0 : 3);
			const retryDelay = config.retryDelay ?? defaultRetryDelay;
			const delay = typeof retryDelay === "function" ? retryDelay(failureCount, error) : retryDelay;
			const shouldRetry = retry === true || typeof retry === "number" && failureCount < retry || typeof retry === "function" && retry(failureCount, error);
			if (isRetryCancelled || !shouldRetry) {
				reject(error);
				return;
			}
			failureCount++;
			config.onFail?.(failureCount, error);
			sleep(delay).then(() => {
				return canContinue() ? void 0 : pause(canContinue);
			}).then(() => {
				if (isRetryCancelled) reject(error);
				else run();
			});
		});
	};
	return {
		promise,
		status: () => status,
		cancel,
		continue: () => {
			continueFn?.();
			return promise;
		},
		cancelRetry,
		continueRetry,
		canStart,
		start: () => {
			if (canStart()) run();
			else pause(canStart).then(run);
			return promise;
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/removable.js
/**
* The base class for cache entries that are garbage collected once nothing is using them —
* `Query` and `Mutation` both extend it. `gcTime` controls how long an unused entry is kept.
*/
var Removable = class {
	#gcTimeout;
	/**
	* Clears the pending garbage collection timeout, so the entry is no longer scheduled for removal.
	* A subclass may override this to release what it holds on to as well — `Query` also cancels any
	* in-flight fetch.
	*/
	destroy() {
		this.clearGcTimeout();
	}
	/**
	* Schedules the entry to be removed from its cache after `gcTime`, replacing any timeout scheduled
	* before. Nothing is scheduled if `gcTime` is `Infinity`.
	*/
	scheduleGc() {
		this.clearGcTimeout();
		if (isValidTimeout(this.gcTime)) this.#gcTimeout = timeoutManager.setTimeout(() => {
			this.optionalRemove();
		}, this.gcTime);
	}
	/**
	* Updates `gcTime`, keeping the longest one seen so far. Without a value, it defaults to 5 minutes
	* on the client and `Infinity` on the server.
	* @param newGcTime - The `gcTime` from the latest options, if any.
	*/
	updateGcTime(newGcTime) {
		this.gcTime = Math.max(this.gcTime || 0, newGcTime ?? (isServer() ? Infinity : 3e5));
	}
	/**
	* Cancels the scheduled removal, if there is one.
	*/
	clearGcTimeout() {
		if (this.#gcTimeout !== void 0) {
			timeoutManager.clearTimeout(this.#gcTimeout);
			this.#gcTimeout = void 0;
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/infiniteQueryBehavior.js
/**
* Creates the behavior that fetches the pages of an infinite query: the next or previous page for
* `fetchNextPage`/`fetchPreviousPage`, or all pages again from the start on a refetch.
* @param pages - The number of pages to fetch from the start when all pages are fetched again,
* e.g. from the `pages` option of `queryClient.infiniteQuery`. Defaults to the number of cached
* pages.
* @returns The query behavior to set on an infinite query.
*/
function infiniteQueryBehavior(pages) {
	return { onFetch: (context, query) => {
		const options = context.options;
		const direction = context.fetchOptions?.meta?.fetchMore?.direction;
		const oldPages = context.state.data?.pages || [];
		const oldPageParams = context.state.data?.pageParams || [];
		let result = {
			pages: [],
			pageParams: []
		};
		let currentPage = 0;
		const fetchFn = async () => {
			let cancelled = false;
			const addSignalProperty = (object) => {
				addConsumeAwareSignal(object, () => context.signal, () => cancelled = true);
			};
			const queryFn = ensureQueryFn(context.options, context.fetchOptions);
			const fetchPage = async (data, param, previous) => {
				if (cancelled) return Promise.reject(context.signal.reason);
				if (param == null && data.pages.length) return Promise.resolve(data);
				const createQueryFnContext = () => {
					const queryFnContext = {
						client: context.client,
						queryKey: context.queryKey,
						pageParam: param,
						direction: previous ? "backward" : "forward",
						meta: context.options.meta
					};
					addSignalProperty(queryFnContext);
					return queryFnContext;
				};
				const queryFnContext = createQueryFnContext();
				const page = await queryFn(queryFnContext);
				const { maxPages } = context.options;
				const addTo = previous ? addToStart : addToEnd;
				return {
					pages: addTo(data.pages, page, maxPages),
					pageParams: addTo(data.pageParams, param, maxPages)
				};
			};
			if (direction && oldPages.length) {
				const previous = direction === "backward";
				const pageParamFn = previous ? getPreviousPageParam : getNextPageParam;
				const oldData = {
					pages: oldPages,
					pageParams: oldPageParams
				};
				result = await fetchPage(oldData, pageParamFn(options, oldData), previous);
			} else {
				const remainingPages = pages ?? oldPages.length;
				do {
					const param = currentPage === 0 ? oldPageParams[0] === void 0 ? options.initialPageParam : oldPageParams[0] : getNextPageParam(options, result);
					if (currentPage > 0 && param == null) break;
					result = await fetchPage(result, param);
					currentPage++;
				} while (currentPage < remainingPages);
			}
			return result;
		};
		if (context.options.persister) context.fetchFn = () => {
			return context.options.persister?.(fetchFn, {
				client: context.client,
				queryKey: context.queryKey,
				meta: context.options.meta,
				signal: context.signal
			}, query);
		};
		else context.fetchFn = fetchFn;
	} };
}
/**
* Computes the page param of the page after the last one, with the `getNextPageParam` option.
* @param options - The infinite query options.
* @param data - The current pages and page params.
* @returns The next page param, or `undefined` if there are no pages yet.
*/
function getNextPageParam(options, { pages, pageParams }) {
	const lastIndex = pages.length - 1;
	return pages.length > 0 ? options.getNextPageParam(pages[lastIndex], pages, pageParams[lastIndex], pageParams) : void 0;
}
/**
* Computes the page param of the page before the first one, with the `getPreviousPageParam`
* option.
* @param options - The infinite query options.
* @param data - The current pages and page params.
* @returns The previous page param, or `undefined` if there are no pages yet or no
* `getPreviousPageParam` option.
*/
function getPreviousPageParam(options, { pages, pageParams }) {
	return pages.length > 0 ? options.getPreviousPageParam?.(pages[0], pages, pageParams[0], pageParams) : void 0;
}
/**
* Checks if there is a next page.
* @param options - The infinite query options with `getNextPageParam`.
* @param data - The current pages and page params.
* @returns `true` if `getNextPageParam` returns a value other than `null` or `undefined`.
*/
function hasNextPage(options, data) {
	if (!data) return false;
	return getNextPageParam(options, data) != null;
}
/**
* Checks if there is a previous page.
* @param options - The infinite query options with `getPreviousPageParam`.
* @param data - The current pages and page params.
* @returns `true` if `getPreviousPageParam` is set and returns a value other than `null` or
* `undefined`.
*/
function hasPreviousPage(options, data) {
	if (!data || !options.getPreviousPageParam) return false;
	return getPreviousPageParam(options, data) != null;
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/query.js
/**
* Represents a single cached query. A `Query` holds the query's key, options,
* state (data/error/status), and the observers currently subscribed to it.
*
* Instances are created and managed internally by `QueryCache`; application
* code typically interacts with queries indirectly through `QueryClient` or
* a framework hook like `useQuery`. Direct access to a `Query` instance is
* possible via `queryCache.find()`/`findAll()` for inspecting cache state.
* @example
* ```ts
* const queryCache = queryClient.getQueryCache()
* const query = queryCache.find({ queryKey: ['posts'] })
*
* if (query) {
*   console.log(query.state.dataUpdatedAt)
* }
* ```
*/
var Query = class extends Removable {
	#queryType;
	#initialState;
	#revertState;
	#cache;
	#client;
	#retryer;
	#defaultOptions;
	#abortSignalConsumed;
	constructor(config) {
		super();
		this.#abortSignalConsumed = false;
		this.#defaultOptions = config.defaultOptions;
		this.setOptions(config.options);
		this.observers = [];
		this.#client = config.client;
		this.#cache = this.#client.getQueryCache();
		this.queryKey = config.queryKey;
		this.queryHash = config.queryHash;
		this.#initialState = getDefaultState$1(this.options);
		this.state = config.state ?? this.#initialState;
		this.scheduleGc();
	}
	/**
	* The `meta` object passed in the query's options, if any.
	* @returns The query's `meta`, or `undefined` if none was set.
	*/
	get meta() {
		return this.options.meta;
	}
	/**
	* `'infinite'` for an infinite query, otherwise `undefined`.
	* @internal
	* @returns The type of the query, set from the `_type` option (e.g. `'infinite'`).
	*/
	get queryType() {
		return this.#queryType;
	}
	/**
	* The promise for the currently in-flight fetch, if the query is fetching.
	* `undefined` when the query is not fetching.
	* @returns The promise of the in-flight fetch, or `undefined`.
	*/
	get promise() {
		return this.#retryer?.promise;
	}
	/**
	* Replaces the query's options and applies their `gcTime`. If the query has no data yet, it gets
	* the `initialData` from the new options, if any.
	* @internal
	* @param options - The new query options, merged on top of the query's default options.
	*/
	setOptions(options) {
		this.options = {
			...this.#defaultOptions,
			...options
		};
		if (options?._type) this.#queryType = options._type;
		this.updateGcTime(this.options.gcTime);
		if (this.state && this.state.data === void 0) {
			const defaultState = getDefaultState$1(this.options);
			if (defaultState.data !== void 0) {
				this.setState(successState(defaultState.data, defaultState.dataUpdatedAt));
				this.#initialState = defaultState;
			}
		}
	}
	optionalRemove() {
		if (!this.observers.length && this.state.fetchStatus === "idle") this.#cache.remove(this);
	}
	/**
	* Writes new data to the query and marks it as successfully fetched.
	* @internal
	* @param newData - The data to write. Structural sharing with the current data is applied.
	* @param options - Set `updatedAt` to override the timestamp, and `manual` to mark the write as
	* manual (e.g. from `queryClient.setQueryData`).
	* @returns The data that was written.
	*/
	setData(newData, options) {
		const data = replaceData(this.state.data, newData, this.options);
		this.#dispatch({
			data,
			type: "success",
			dataUpdatedAt: options?.updatedAt,
			manual: options?.manual
		});
		return data;
	}
	/**
	* Merges the given partial state directly into this query's state, notifying observers. Used
	* by persistence and broadcast plugins to restore a state snapshot, and by devtools to let a
	* user manually trigger a loading/error state or edit the cached data.
	* @param state - The partial state to merge into the query's state.
	*/
	setState(state) {
		this.#dispatch({
			type: "setState",
			state
		});
	}
	/**
	* Cancels the query's currently in-flight fetch, if any.
	* - Returns a promise that resolves once the cancellation has settled.
	* - If no fetch is in progress, resolves immediately.
	* @param options - Set `revert` to restore the state from before the fetch started, and `silent`
	* to suppress the cancellation error when a new fetch replaces the cancelled one.
	* @returns A promise that resolves once the cancellation has settled.
	* @example
	* ```ts
	* await query.cancel()
	* ```
	*/
	cancel(options) {
		const promise = this.#retryer?.promise;
		this.#retryer?.cancel(options);
		return promise ? promise.then(noop).catch(noop) : Promise.resolve();
	}
	/**
	* Clears the query's garbage collection timeout and silently cancels any
	* in-flight fetch. Called by `QueryCache` when the query is removed from
	* the cache.
	* @see {@link Query#cancel}
	*/
	destroy() {
		super.destroy();
		this.cancel({ silent: true });
	}
	/**
	* The state the query was created with.
	* @internal
	* @returns The state the query had when it was first created, used by {@link Query#reset}.
	*/
	get resetState() {
		return this.#initialState;
	}
	/**
	* Resets the query back to its initial state (the state it had when it was
	* first created, e.g. any `initialData`), destroying it first to cancel any
	* in-flight fetch.
	*/
	reset() {
		this.destroy();
		this.setState(this.resetState);
	}
	/**
	* Returns `true` if the query has at least one observer for which `enabled`
	* does not resolve to `false`.
	* @returns `true` if the query has an enabled observer.
	*/
	isActive() {
		return this.observers.some((observer) => resolveQueryValue(observer.options.enabled, this) !== false);
	}
	/**
	* Returns `true` if the query is disabled, meaning it will not fetch
	* automatically.
	* - If the query has observers, it is disabled when none of them are active
	*   (see `isActive`).
	* - If the query has no observers, it is disabled when its `queryFn` is
	*   `skipToken` or it has never been fetched.
	* @returns `true` if the query is disabled.
	*/
	isDisabled() {
		if (this.getObserversCount() > 0) return !this.isActive();
		return this.options.queryFn === skipToken || !this.isFetched();
	}
	/**
	* Returns `true` if the query has been fetched, i.e. it has resolved with
	* either data or an error at least once.
	* @returns `true` if the query has been fetched.
	*/
	isFetched() {
		return this.state.dataUpdateCount + this.state.errorUpdateCount > 0;
	}
	/**
	* Returns `true` if the query has at least one observer configured with
	* `staleTime: 'static'`, meaning it is treated as never stale.
	* @returns `true` if the query is static.
	*/
	isStatic() {
		if (this.getObserversCount() > 0) return this.observers.some((observer) => resolveQueryValue(observer.options.staleTime, this) === "static");
		return false;
	}
	/**
	* Returns `true` if the query is stale.
	* - If the query has observers, defers to whether any observer's current
	*   result reports `isStale` (which accounts for each observer's own
	*   `staleTime` and `enabled` state).
	* - If the query has no observers, it is considered stale when it has no
	*   data or has been invalidated.
	* @returns `true` if the query is stale.
	* @see {@link Query#isStaleByTime}
	* @example
	* ```ts
	* if (query.isStale()) {
	*   // refetch or otherwise treat the cached data as outdated
	* }
	* ```
	*/
	isStale() {
		if (this.getObserversCount() > 0) return this.observers.some((observer) => observer.getCurrentResult().isStale);
		return this.state.data === void 0 || this.state.isInvalidated;
	}
	/**
	* Returns `true` if the query's data is stale relative to the given
	* `staleTime` (defaults to `0`).
	* - A query with no data is always stale.
	* - `staleTime: 'static'` is never stale.
	* - An invalidated query is always stale.
	* - Otherwise, staleness is based on elapsed time since `dataUpdatedAt`.
	* @param staleTime - The time, in milliseconds, after which data is considered stale, or
	* `'static'` to never treat existing data as stale. A query without data is stale either way.
	* @returns `true` if the query's data is stale.
	* @see {@link Query#isStale}
	* @example
	* ```ts
	* const isStale = query.isStaleByTime(1000 * 60)
	* ```
	*/
	isStaleByTime(staleTime = 0) {
		if (this.state.data === void 0) return true;
		if (staleTime === "static") return false;
		if (this.state.isInvalidated) return true;
		return !timeUntilStale(this.state.dataUpdatedAt, staleTime);
	}
	/**
	* Refetches the query when the window regains focus, if an observer wants that, and continues a
	* paused fetch.
	* @internal
	*/
	onFocus() {
		this.observers.find((x) => x.shouldFetchOnWindowFocus())?.refetch({ cancelRefetch: false });
		this.#retryer?.continue();
	}
	/**
	* Refetches the query when the app reconnects, if an observer wants that, and continues a paused
	* fetch.
	* @internal
	*/
	onOnline() {
		this.observers.find((x) => x.shouldFetchOnReconnect())?.refetch({ cancelRefetch: false });
		this.#retryer?.continue();
	}
	/**
	* Subscribes an observer to the query and stops its garbage collection.
	* @internal
	* @param observer - The observer to add. Adding an observer that is already subscribed does
	* nothing.
	*/
	addObserver(observer) {
		if (!this.observers.includes(observer)) {
			this.observers.push(observer);
			this.clearGcTimeout();
			this.#cache.notify({
				type: "observerAdded",
				query: this,
				observer
			});
		}
	}
	/**
	* Unsubscribes an observer from the query.
	* @internal
	* @param observer - The observer to remove. When the last observer is removed, the in-flight
	* fetch is cancelled if its abort signal was consumed (otherwise only its retries are stopped),
	* and garbage collection is scheduled.
	*/
	removeObserver(observer) {
		const index = this.observers.indexOf(observer);
		if (index !== -1) {
			this.observers.splice(index, 1);
			if (!this.observers.length) {
				if (this.#retryer) if (this.#abortSignalConsumed || this.state.fetchStatus === "paused" && this.state.status === "pending") this.#retryer.cancel({ revert: true });
				else this.#retryer.cancelRetry();
				this.scheduleGc();
			}
			this.#cache.notify({
				type: "observerRemoved",
				query: this,
				observer
			});
		}
	}
	/**
	* Returns the number of observers currently subscribed to this query.
	* @returns The number of observers.
	* @example
	* ```ts
	* if (query.getObserversCount() === 0) {
	*   // no component is currently watching this query
	* }
	* ```
	*/
	getObserversCount() {
		return this.observers.length;
	}
	/**
	* Marks the query as invalidated, unless it is already invalidated. This
	* updates `state.isInvalidated` and notifies observers, but does not by
	* itself trigger a refetch.
	* @example
	* ```ts
	* query.invalidate()
	* ```
	*/
	invalidate() {
		if (!this.state.isInvalidated) this.#dispatch({ type: "invalidate" });
	}
	/**
	* Fetches the query, i.e. runs its `queryFn` (through any configured
	* retryer/behavior) and updates the query's state with the result.
	* - If a fetch is already in flight, returns its promise instead of
	*   starting a new one, unless `fetchOptions.cancelRefetch` is set and the
	*   query already has data, in which case the current fetch is silently
	*   cancelled first.
	* - If `options` is passed, it replaces the query's current options
	*   before fetching.
	* @param options - Query options that replace the query's current options before fetching. They
	* are not applied when an in-flight fetch is reused.
	* @param fetchOptions - Set `cancelRefetch` to cancel an in-flight fetch first (only if the query
	* already has data), and `meta` to pass extra information to the query's behavior.
	* @returns A promise that resolves with the fetched data, or rejects with the fetch error. If the
	* fetch is cancelled with `revert` while the query has data, it resolves with the restored data
	* instead.
	*/
	async fetch(options, fetchOptions) {
		if (this.state.fetchStatus !== "idle" && this.#retryer?.status() !== "rejected") {
			if (this.state.data !== void 0 && fetchOptions?.cancelRefetch) this.cancel({ silent: true });
			else if (this.#retryer) {
				this.#retryer.continueRetry();
				return this.#retryer.promise;
			}
		}
		if (options) this.setOptions(options);
		if (!this.options.queryFn) {
			const observer = this.observers.find((x) => x.options.queryFn);
			if (observer) this.setOptions(observer.options);
		}
		if (!Array.isArray(this.options.queryKey)) console.error(`As of v4, queryKey needs to be an Array. If you are using a string like 'repoData', please change it to an Array, e.g. ['repoData']`);
		const abortController = new AbortController();
		const addSignalProperty = (object) => {
			Object.defineProperty(object, "signal", {
				enumerable: true,
				get: () => {
					this.#abortSignalConsumed = true;
					return abortController.signal;
				}
			});
		};
		const fetchFn = () => {
			const queryFn = ensureQueryFn(this.options, fetchOptions);
			const createQueryFnContext = () => {
				const queryFnContext = {
					client: this.#client,
					queryKey: this.queryKey,
					meta: this.meta
				};
				addSignalProperty(queryFnContext);
				return queryFnContext;
			};
			const queryFnContext = createQueryFnContext();
			this.#abortSignalConsumed = false;
			if (this.options.persister) return this.options.persister(queryFn, queryFnContext, this);
			return queryFn(queryFnContext);
		};
		const createFetchContext = () => {
			const context = {
				fetchOptions,
				options: this.options,
				queryKey: this.queryKey,
				client: this.#client,
				state: this.state,
				fetchFn
			};
			addSignalProperty(context);
			return context;
		};
		const context = createFetchContext();
		(this.#queryType === "infinite" ? infiniteQueryBehavior(this.options.pages) : this.options.behavior)?.onFetch(context, this);
		this.#revertState = this.state;
		if (this.state.fetchStatus === "idle" || this.state.fetchMeta !== context.fetchOptions?.meta) this.#dispatch({
			type: "fetch",
			meta: context.fetchOptions?.meta
		});
		const retryer = this.#retryer = createRetryer({
			initialPromise: fetchOptions?.initialPromise,
			fn: context.fetchFn,
			onCancel: (error) => {
				if (error instanceof CancelledError && error.revert) this.setState({
					...this.#revertState,
					fetchStatus: "idle"
				});
				abortController.abort();
			},
			onFail: (failureCount, error) => {
				this.#dispatch({
					type: "failed",
					failureCount,
					error
				});
			},
			onPause: () => {
				this.#dispatch({ type: "pause" });
			},
			onContinue: () => {
				this.#dispatch({ type: "continue" });
			},
			retry: context.options.retry,
			retryDelay: context.options.retryDelay,
			networkMode: context.options.networkMode,
			canRun: () => true
		});
		try {
			const data = await retryer.start();
			if (data === void 0) {
				console.error(`Query data cannot be undefined. Please make sure to return a value other than undefined from your query function. Affected query key: ${this.queryHash}`);
				throw new Error(`${this.queryHash} data is undefined`);
			}
			this.setData(data);
			this.#cache.config.onSuccess?.(data, this);
			this.#cache.config.onSettled?.(data, this.state.error, this);
			return data;
		} catch (error) {
			if (error instanceof CancelledError) {
				if (error.silent) return this.#retryer.promise;
				else if (error.revert) {
					if (this.state.data === void 0) throw error;
					return this.state.data;
				}
			}
			this.#dispatch({
				type: "error",
				error
			});
			this.#cache.config.onError?.(error, this);
			this.#cache.config.onSettled?.(this.state.data, error, this);
			throw error;
		} finally {
			if (this.#retryer === retryer) this.#retryer = void 0;
			this.scheduleGc();
		}
	}
	#dispatch(action) {
		const reducer = (state) => {
			switch (action.type) {
				case "failed": return {
					...state,
					fetchFailureCount: action.failureCount,
					fetchFailureReason: action.error
				};
				case "pause": return {
					...state,
					fetchStatus: "paused"
				};
				case "continue": return {
					...state,
					fetchStatus: "fetching"
				};
				case "fetch": return {
					...state,
					...fetchState(state.data, this.options),
					fetchMeta: action.meta ?? null
				};
				case "success":
					const newState = {
						...state,
						...successState(action.data, action.dataUpdatedAt),
						dataUpdateCount: state.dataUpdateCount + 1,
						...!action.manual && {
							fetchStatus: "idle",
							fetchFailureCount: 0,
							fetchFailureReason: null
						}
					};
					this.#revertState = action.manual ? newState : void 0;
					return newState;
				case "error":
					const error = action.error;
					return {
						...state,
						error,
						errorUpdateCount: state.errorUpdateCount + 1,
						errorUpdatedAt: Date.now(),
						fetchFailureCount: state.fetchFailureCount + 1,
						fetchFailureReason: error,
						fetchStatus: "idle",
						status: "error",
						isInvalidated: true
					};
				case "invalidate": return {
					...state,
					isInvalidated: true
				};
				case "setState": return {
					...state,
					...action.state
				};
			}
		};
		this.state = reducer(this.state);
		notifyManager.batch(() => {
			this.observers.slice().forEach((observer) => {
				observer.onQueryUpdate();
			});
			this.#cache.notify({
				query: this,
				type: "updated",
				action
			});
		});
	}
};
/**
* Returns the state changes applied when a query starts fetching.
* @param data - The query's current data. If it is `undefined`, the query is also reset to
* `'pending'` with no error.
* @param options - The query options, whose `networkMode` decides whether the query is `'fetching'`
* or `'paused'`.
* @returns The partial query state for a starting fetch.
*/
function fetchState(data, options) {
	return {
		fetchFailureCount: 0,
		fetchFailureReason: null,
		fetchStatus: canFetch(options.networkMode) ? "fetching" : "paused",
		...data === void 0 && {
			error: null,
			status: "pending"
		}
	};
}
/**
* Returns the state changes applied when a query receives data.
* @param data - The new data.
* @param dataUpdatedAt - The timestamp the data is recorded with. Defaults to the current time.
* @returns The partial query state for a successful update.
*/
function successState(data, dataUpdatedAt) {
	return {
		data,
		dataUpdatedAt: dataUpdatedAt ?? Date.now(),
		error: null,
		isInvalidated: false,
		status: "success"
	};
}
/**
* Returns the initial state of a query, based on its `initialData` and `initialDataUpdatedAt`
* options.
* @param options - The query options.
* @returns The initial query state: `'success'` if `initialData` is set, otherwise `'pending'`.
*/
function getDefaultState$1(options) {
	const data = typeof options.initialData === "function" ? options.initialData() : options.initialData;
	const hasData = data !== void 0;
	const initialDataUpdatedAt = hasData ? typeof options.initialDataUpdatedAt === "function" ? options.initialDataUpdatedAt() : options.initialDataUpdatedAt : 0;
	return {
		data,
		dataUpdateCount: 0,
		dataUpdatedAt: hasData ? initialDataUpdatedAt ?? Date.now() : 0,
		error: null,
		errorUpdateCount: 0,
		errorUpdatedAt: 0,
		fetchFailureCount: 0,
		fetchFailureReason: null,
		fetchMeta: null,
		isInvalidated: false,
		status: hasData ? "success" : "pending",
		fetchStatus: "idle"
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/queryObserver.js
/**
* A `QueryObserver` watches a single query in the `QueryCache` and computes a
* `QueryObserverResult` from its state, recomputing and notifying subscribers
* whenever the underlying query (or the observer's options) changes. It is
* the primitive that framework adapters (e.g. `useQuery`) build their hooks
* on top of, but it can also be used directly to observe and switch between
* queries outside of any framework.
* @example
* ```ts
* const observer = new QueryObserver(queryClient, {
*   queryKey: ['posts'],
*   queryFn: fetchPosts,
* })
*
* const unsubscribe = observer.subscribe((result) => {
*   console.log(result.data)
* })
* ```
*/
var QueryObserver = class extends Subscribable {
	#client;
	#currentQuery = void 0;
	#currentQueryInitialState = void 0;
	#currentResult = void 0;
	#currentResultState;
	#currentResultOptions;
	#selectError;
	#selectFn;
	#selectResult;
	#lastQueryWithDefinedData;
	#staleTimeoutId;
	#refetchIntervalId;
	#currentRefetchInterval;
	#trackedProps = /* @__PURE__ */ new Set();
	constructor(client, options) {
		super();
		this.options = options;
		this.#client = client;
		this.#selectError = null;
		this.bindMethods();
		this.setOptions(options);
	}
	/**
	* Binds the methods of the result (`refetch`) to the observer, so they keep working when destructured
	* from it. Subclasses override it to bind their own result methods as well.
	*/
	bindMethods() {
		this.refetch = this.refetch.bind(this);
	}
	onSubscribe() {
		if (this.listeners.size === 1) {
			this.#currentQuery.addObserver(this);
			if (shouldFetchOnMount(this.#currentQuery, this.options)) this.#executeFetch();
			else this.updateResult();
			this.#updateTimers();
		}
	}
	onUnsubscribe() {
		if (!this.hasListeners()) this.destroy();
	}
	/**
	* Returns whether the observed query is currently stale and configured
	* (via the `refetchOnReconnect` option) to refetch when the network
	* reconnects.
	* @returns `true` if the observer should refetch the query on reconnect.
	*/
	shouldFetchOnReconnect() {
		return shouldFetchOn(this.#currentQuery, this.options, this.options.refetchOnReconnect);
	}
	/**
	* Returns whether the observed query is currently stale and configured
	* (via the `refetchOnWindowFocus` option) to refetch when the window
	* regains focus.
	* @returns `true` if the observer should refetch the query on window focus.
	*/
	shouldFetchOnWindowFocus() {
		return shouldFetchOn(this.#currentQuery, this.options, this.options.refetchOnWindowFocus);
	}
	/**
	* Stops observing the current query: clears all listeners, cancels the
	* stale and refetch-interval timers, and removes this observer from the
	* query it was observing.
	*/
	destroy() {
		this.listeners = /* @__PURE__ */ new Set();
		this.#clearStaleTimeout();
		this.#clearRefetchInterval();
		this.#currentQuery.removeObserver(this);
	}
	/**
	* Updates the observer's options. This will re-resolve the query being
	* observed (switching to a different query if the `queryKey` changed),
	* trigger a fetch if the new options require one and the observer has
	* subscribers, recompute the current result, and reschedule the stale and
	* refetch-interval timers as needed.
	* @param options - The new observer options. They are defaulted with {@link
	* QueryClient#defaultQueryOptions} before being applied.
	* @throws {Error} If `enabled` is neither a boolean nor a function.
	* @example
	* ```ts
	* observer.setOptions({ queryKey: ['posts', 1], queryFn: () => fetchPost(1) })
	* // later: switch to a different query, reusing the same observer
	* observer.setOptions({ queryKey: ['posts', 2], queryFn: () => fetchPost(2) })
	* ```
	*/
	setOptions(options) {
		const prevOptions = this.options;
		const prevQuery = this.#currentQuery;
		this.options = this.#client.defaultQueryOptions(options);
		if (this.options.enabled !== void 0 && typeof this.options.enabled !== "boolean" && typeof this.options.enabled !== "function" && typeof resolveQueryValue(this.options.enabled, this.#currentQuery) !== "boolean") throw new Error("Expected enabled to be a boolean or a callback that returns a boolean");
		this.#updateQuery();
		this.#currentQuery.setOptions(this.options);
		if (prevOptions._defaulted && !shallowEqualObjects(this.options, prevOptions)) this.#client.getQueryCache().notify({
			type: "observerOptionsUpdated",
			query: this.#currentQuery,
			observer: this
		});
		const mounted = this.hasListeners();
		if (mounted && shouldFetchOptionally(this.#currentQuery, prevQuery, this.options, prevOptions)) this.#executeFetch();
		this.updateResult();
		if (mounted && (this.#currentQuery !== prevQuery || resolveQueryValue(this.options.enabled, this.#currentQuery) !== resolveQueryValue(prevOptions.enabled, this.#currentQuery) || resolveQueryValue(this.options.staleTime, this.#currentQuery) !== resolveQueryValue(prevOptions.staleTime, this.#currentQuery))) this.#updateStaleTimeout();
		const nextRefetchInterval = this.#computeRefetchInterval();
		if (mounted && (this.#currentQuery !== prevQuery || resolveQueryValue(this.options.enabled, this.#currentQuery) !== resolveQueryValue(prevOptions.enabled, this.#currentQuery) || nextRefetchInterval !== this.#currentRefetchInterval)) this.#updateRefetchInterval(nextRefetchInterval);
	}
	/**
	* Computes the result the observer would produce for the given (already-defaulted) options
	* right now, building the underlying `Query` if it doesn't exist yet, without waiting for a
	* subscription callback. Called by framework adapters on every render (e.g. `useQuery`) so the
	* returned value is available synchronously, ahead of `setOptions` triggering an actual fetch.
	* @param options - The defaulted observer options to compute the result for.
	* @returns The result for the given options.
	*/
	getOptimisticResult(options) {
		const query = this.#client.getQueryCache().build(this.#client, options);
		const result = this.createResult(query, options);
		if (!shallowEqualObjects(this.getCurrentResult(), result)) {
			this.#currentResult = result;
			this.#currentResultOptions = this.options;
			this.#currentResultState = this.#currentQuery.state;
		}
		return result;
	}
	/**
	* Returns the most recently computed `QueryObserverResult` for the
	* observed query. This is a point-in-time read; to be notified of updates
	* as they happen, subscribe to the observer instead (its inherited
	* `subscribe` method).
	* @returns The observer's latest result.
	* @example
	* ```ts
	* const result = observer.getCurrentResult()
	* console.log(result.status, result.data)
	* ```
	*/
	getCurrentResult() {
		return this.#currentResult;
	}
	/**
	* Wraps a `QueryObserverResult` in a `Proxy` that records which properties are read, via
	* {@link QueryObserver#trackProp} (and an optional `onPropTracked` callback). Used by framework
	* adapters when `notifyOnChangeProps` is not set, to implement its default "only re-render on
	* properties you actually read" behavior.
	* @param result - The result to wrap.
	* @param onPropTracked - Called with the name of each property that is read.
	* @returns A proxy of `result` that tracks property reads.
	*/
	trackResult(result, onPropTracked) {
		return new Proxy(result, { get: (target, key) => {
			this.trackProp(key);
			onPropTracked?.(key);
			return Reflect.get(target, key);
		} });
	}
	/**
	* Records that the given `QueryObserverResult` property was read, so a subsequent update only
	* notifies this observer if a tracked property actually changed. Normally called indirectly via
	* {@link QueryObserver#trackResult}'s proxy; exposed directly for adapters that track property
	* access themselves (e.g. through their own reactivity system) instead of via the proxy.
	* @param key - The name of the property that was read.
	*/
	trackProp(key) {
		this.#trackedProps.add(key);
	}
	/**
	* Returns the `Query` instance this observer is currently observing.
	* @returns The observed query.
	*/
	getCurrentQuery() {
		return this.#currentQuery;
	}
	/**
	* Refetches the observed query and returns a promise that resolves with
	* the resulting `QueryObserverResult`.
	* @param options - Set `cancelRefetch` to `false` to keep a running fetch instead of cancelling
	* it, and `throwOnError` to `true` to reject when the refetch fails.
	* @returns A promise that resolves with the result after the refetch.
	* @example
	* ```ts
	* const result = await observer.refetch({ cancelRefetch: false })
	* console.log(result.data)
	* ```
	*/
	refetch({ ...options } = {}) {
		return this.fetch({ ...options });
	}
	/**
	* Fetches a query defined by the given options without affecting this
	* observer's own tracked query or result, and returns a promise that
	* resolves with the `QueryObserverResult` for that fetch. This is useful
	* for prefetching data that another observer (e.g. a query about to be
	* navigated to) will need, ahead of time.
	* @param options - The observer options of the query to fetch.
	* @returns A promise that resolves with the result for the fetched query.
	* @example
	* ```ts
	* const result = await observer.fetchOptimistic({
	*   queryKey: ['posts', 2],
	*   queryFn: () => fetchPost(2),
	* })
	* console.log(result.data)
	* ```
	*/
	fetchOptimistic(options) {
		const defaultedOptions = this.#client.defaultQueryOptions(options);
		const query = this.#client.getQueryCache().build(this.#client, defaultedOptions);
		let unsubscribe = () => {};
		let resolveEarly;
		const cachePromise = new Promise((resolve) => {
			resolveEarly = resolve;
			unsubscribe = this.#client.getQueryCache().subscribe((event) => {
				if (event.type === "updated" && event.query.queryHash === query.queryHash && query.state.data !== void 0) {
					unsubscribe();
					resolve(this.createResult(query, defaultedOptions));
				}
			});
		});
		return Promise.race([query.fetch(defaultedOptions).then(() => {
			const result = this.createResult(query, defaultedOptions);
			resolveEarly?.(result);
			return result;
		}).finally(() => {
			unsubscribe();
		}), cachePromise]);
	}
	/**
	* Fetches the observed query and updates the result once the fetch settles. Used by `refetch` and,
	* in `InfiniteQueryObserver`, to fetch more pages.
	* @param fetchOptions - Options for this fetch. `cancelRefetch` defaults to `true`.
	* @returns A promise that resolves with the updated result.
	*/
	fetch(fetchOptions) {
		return this.#executeFetch({
			...fetchOptions,
			cancelRefetch: fetchOptions.cancelRefetch ?? true
		}).then(() => {
			this.updateResult();
			return this.#currentResult;
		});
	}
	#executeFetch(fetchOptions) {
		this.#updateQuery();
		let promise = this.#currentQuery.fetch(this.options, fetchOptions);
		if (!fetchOptions?.throwOnError) promise = promise.catch(noop);
		return promise;
	}
	#shouldScheduleTimer(timeout) {
		return !isServer() && resolveQueryValue(this.options.enabled, this.#currentQuery) !== false && isValidTimeout(timeout);
	}
	#updateStaleTimeout() {
		this.#clearStaleTimeout();
		const staleTime = resolveQueryValue(this.options.staleTime, this.#currentQuery);
		if (this.#currentResult.isStale || !this.#shouldScheduleTimer(staleTime)) return;
		const timeout = timeUntilStale(this.#currentResult.dataUpdatedAt, staleTime) + 1;
		this.#staleTimeoutId = timeoutManager.setTimeout(() => {
			if (!this.#currentResult.isStale) this.updateResult();
		}, timeout);
	}
	#computeRefetchInterval() {
		return resolveQueryValue(this.options.refetchInterval, this.#currentQuery) ?? false;
	}
	#updateRefetchInterval(nextInterval) {
		this.#clearRefetchInterval();
		this.#currentRefetchInterval = nextInterval;
		if (this.#currentRefetchInterval === 0 || !this.#shouldScheduleTimer(this.#currentRefetchInterval)) return;
		this.#refetchIntervalId = timeoutManager.setInterval(() => {
			if (this.options.refetchIntervalInBackground || focusManager.isFocused()) this.#executeFetch();
		}, this.#currentRefetchInterval);
	}
	#updateTimers() {
		this.#updateStaleTimeout();
		this.#updateRefetchInterval(this.#computeRefetchInterval());
	}
	#clearStaleTimeout() {
		if (this.#staleTimeoutId !== void 0) {
			timeoutManager.clearTimeout(this.#staleTimeoutId);
			this.#staleTimeoutId = void 0;
		}
	}
	#clearRefetchInterval() {
		if (this.#refetchIntervalId !== void 0) {
			timeoutManager.clearInterval(this.#refetchIntervalId);
			this.#refetchIntervalId = void 0;
		}
	}
	/**
	* Computes the result for a query and options from the query's state, applying `select`,
	* `placeholderData`, and the derived flags. Subclasses override it to add their own fields.
	* @param query - The query to compute the result for.
	* @param options - The observer options to compute the result with.
	* @returns The computed result.
	*/
	createResult(query, options) {
		const prevQuery = this.#currentQuery;
		const prevOptions = this.options;
		const prevResult = this.#currentResult;
		const prevResultState = this.#currentResultState;
		const prevResultOptions = this.#currentResultOptions;
		const queryInitialState = query !== prevQuery ? query.state : this.#currentQueryInitialState;
		const { state } = query;
		let newState = { ...state };
		let isPlaceholderData = false;
		let data;
		if (options._optimisticResults) {
			const mounted = this.hasListeners();
			const fetchOnMount = !mounted && shouldFetchOnMount(query, options);
			const fetchOptionally = mounted && shouldFetchOptionally(query, prevQuery, options, prevOptions);
			if (fetchOnMount || fetchOptionally) newState = {
				...newState,
				...fetchState(state.data, query.options)
			};
			if (options._optimisticResults === "isRestoring") newState.fetchStatus = "idle";
		}
		let { error, errorUpdatedAt, status } = newState;
		data = newState.data;
		let skipSelect = false;
		if (options.placeholderData !== void 0 && data === void 0 && status === "pending") {
			let placeholderData;
			if (prevResult?.isPlaceholderData && options.placeholderData === prevResultOptions?.placeholderData) {
				placeholderData = prevResult.data;
				skipSelect = true;
			} else placeholderData = typeof options.placeholderData === "function" ? options.placeholderData(this.#lastQueryWithDefinedData?.state.data, this.#lastQueryWithDefinedData) : options.placeholderData;
			if (placeholderData !== void 0) {
				status = "success";
				data = replaceData(prevResult?.data, placeholderData, options);
				isPlaceholderData = true;
			}
		}
		if (options.select && data !== void 0 && !skipSelect) if (prevResult && data === prevResultState?.data && options.select === this.#selectFn) data = this.#selectResult;
		else try {
			this.#selectFn = options.select;
			data = options.select(data);
			data = replaceData(prevResult?.data, data, options);
			this.#selectResult = data;
			this.#selectError = null;
		} catch (selectError) {
			this.#selectError = selectError;
		}
		else if (data === void 0) this.#selectError = null;
		if (this.#selectError) {
			error = this.#selectError;
			data = this.#selectResult;
			errorUpdatedAt = Date.now();
			status = "error";
			isPlaceholderData = false;
		}
		const isFetching = newState.fetchStatus === "fetching";
		const isPending = status === "pending";
		const isError = status === "error";
		const isLoading = isPending && isFetching;
		const hasData = data !== void 0;
		return {
			status,
			fetchStatus: newState.fetchStatus,
			isPending,
			isSuccess: status === "success",
			isError,
			isInitialLoading: isLoading,
			isLoading,
			data,
			dataUpdatedAt: newState.dataUpdatedAt,
			error,
			errorUpdatedAt,
			failureCount: newState.fetchFailureCount,
			failureReason: newState.fetchFailureReason,
			errorUpdateCount: newState.errorUpdateCount,
			isFetched: query.isFetched(),
			isFetchedAfterMount: newState.dataUpdateCount > queryInitialState.dataUpdateCount || newState.errorUpdateCount > queryInitialState.errorUpdateCount,
			isFetching,
			isRefetching: isFetching && !isPending,
			isLoadingError: isError && !hasData,
			isPaused: newState.fetchStatus === "paused",
			isPlaceholderData,
			isRefetchError: isError && hasData,
			isStale: isStale(query, options),
			refetch: this.refetch,
			isEnabled: resolveQueryValue(options.enabled, query) !== false
		};
	}
	/**
	* Recomputes and stores the current result from the current query/options, notifying listeners
	* if it changed. Framework adapters call this right after subscribing to make sure no query
	* update was missed in the gap between creating the observer and subscribing to it.
	*/
	updateResult() {
		const prevResult = this.#currentResult;
		const nextResult = this.createResult(this.#currentQuery, this.options);
		this.#currentResultState = this.#currentQuery.state;
		this.#currentResultOptions = this.options;
		if (this.#currentResultState.data !== void 0) this.#lastQueryWithDefinedData = this.#currentQuery;
		if (shallowEqualObjects(nextResult, prevResult)) return;
		this.#currentResult = nextResult;
		const shouldNotifyListeners = () => {
			if (!prevResult) return true;
			const { notifyOnChangeProps } = this.options;
			const notifyOnChangePropsValue = typeof notifyOnChangeProps === "function" ? notifyOnChangeProps() : notifyOnChangeProps;
			if (notifyOnChangePropsValue === "all" || !notifyOnChangePropsValue && !this.#trackedProps.size) return true;
			const includedProps = new Set(notifyOnChangePropsValue ?? this.#trackedProps);
			if (this.options.throwOnError) includedProps.add("error");
			return Object.keys(this.#currentResult).some((key) => {
				const typedKey = key;
				return this.#currentResult[typedKey] !== prevResult[typedKey] && includedProps.has(typedKey);
			});
		};
		const notifyListeners = shouldNotifyListeners();
		notifyManager.batch(() => {
			if (notifyListeners) this.listeners.forEach((listener) => {
				listener(this.#currentResult);
			});
			this.#client.getQueryCache().notify({
				query: this.#currentQuery,
				type: "observerResultsUpdated"
			});
		});
	}
	#updateQuery() {
		const query = this.#client.getQueryCache().build(this.#client, this.options);
		if (query === this.#currentQuery) return;
		const prevQuery = this.#currentQuery;
		this.#currentQuery = query;
		this.#currentQueryInitialState = query.state;
		if (this.hasListeners()) {
			prevQuery?.removeObserver(this);
			query.addObserver(this);
		}
	}
	/**
	* Updates the observer's result when the observed query changes, and reschedules its timers if it
	* has listeners.
	* @internal
	*/
	onQueryUpdate() {
		this.updateResult();
		if (this.hasListeners()) this.#updateTimers();
	}
};
/**
* Checks whether a query has no data yet and should do its initial load when an observer mounts.
* @param query - The query to check.
* @param options - The observer options.
* @returns `true` if the query is enabled, has no data, and isn't in an error state with
* `retryOnMount: false`.
*/
function shouldLoadOnMount(query, options) {
	return resolveQueryValue(options.enabled, query) !== false && query.state.data === void 0 && !(query.state.status === "error" && resolveQueryValue(options.retryOnMount, query) === false);
}
/**
* Checks whether a query should fetch when an observer mounts: either for its initial load, or
* because it has data and `refetchOnMount` asks for a refetch.
* @param query - The query to check.
* @param options - The observer options.
* @returns `true` if the query should fetch on mount.
*/
function shouldFetchOnMount(query, options) {
	return shouldLoadOnMount(query, options) || query.state.data !== void 0 && shouldFetchOn(query, options, options.refetchOnMount);
}
/**
* Checks whether a query should fetch for a `refetchOnMount`, `refetchOnWindowFocus`, or
* `refetchOnReconnect` option.
* @param query - The query to check.
* @param options - The observer options.
* @param field - The value of the option to check.
* @returns `true` if the query is enabled, not static, and the option is `'always'`, or is not
* `false` and the query is stale.
*/
function shouldFetchOn(query, options, field) {
	if (resolveQueryValue(options.enabled, query) !== false && resolveQueryValue(options.staleTime, query) !== "static") {
		const value = resolveQueryValue(field, query);
		return value === "always" || value !== false && isStale(query, options);
	}
	return false;
}
/**
* Checks whether a query should fetch after the observer's options change.
* @param query - The query observed with the new options.
* @param prevQuery - The query observed with the previous options.
* @param options - The new observer options.
* @param prevOptions - The previous observer options.
* @returns `true` if the query changed or was disabled before, it isn't a suspense query in an
* error state, and it is stale.
*/
function shouldFetchOptionally(query, prevQuery, options, prevOptions) {
	return (query !== prevQuery || resolveQueryValue(prevOptions.enabled, query) === false) && (!options.suspense || query.state.status !== "error") && isStale(query, options);
}
/**
* Checks whether a query is stale for the given observer options.
* @param query - The query to check.
* @param options - The observer options, whose `enabled` and `staleTime` are used.
* @returns `true` if the query is enabled and its data is stale for `staleTime`.
*/
function isStale(query, options) {
	return resolveQueryValue(options.enabled, query) !== false && query.isStaleByTime(resolveQueryValue(options.staleTime, query));
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/infiniteQueryObserver.js
/**
* An `InfiniteQueryObserver` extends `QueryObserver` to observe and switch
* between infinite queries. It augments the base `QueryObserverResult` with
* infinite-query-specific fields and methods, such as `hasNextPage` and
* `fetchNextPage`, and is the primitive that framework adapters (e.g.
* `useInfiniteQuery`) build their hooks on top of.
* @example
* ```ts
* const observer = new InfiniteQueryObserver(queryClient, {
*   queryKey: ['projects'],
*   queryFn: ({ pageParam }) => fetchProjects(pageParam),
*   initialPageParam: 0,
*   getNextPageParam: (lastPage) => lastPage.nextCursor,
* })
*
* const unsubscribe = observer.subscribe((result) => console.log(result))
* ```
*/
var InfiniteQueryObserver = class extends QueryObserver {
	constructor(client, options) {
		super(client, options);
	}
	bindMethods() {
		super.bindMethods();
		this.fetchNextPage = this.fetchNextPage.bind(this);
		this.fetchPreviousPage = this.fetchPreviousPage.bind(this);
	}
	/**
	* Updates the observer's options. Behaves the same as
	* `QueryObserver.setOptions`, additionally marking the options as
	* belonging to an infinite query before delegating to the base
	* implementation.
	* @param options - The new infinite query observer options.
	*/
	setOptions(options) {
		options._type = "infinite";
		super.setOptions(options);
	}
	/**
	* The infinite-query counterpart of {@link QueryObserver#getOptimisticResult}, marking the
	* options as an infinite query before delegating to it. Called by framework adapters (e.g.
	* `useInfiniteQuery`) ahead of subscribing, to compute the current `InfiniteQueryObserverResult`
	* synchronously.
	* @param options - The defaulted infinite query observer options to compute the result for.
	* @returns The result for the given options.
	*/
	getOptimisticResult(options) {
		options._type = "infinite";
		return super.getOptimisticResult(options);
	}
	/**
	* Fetches the next page of the infinite query and returns a promise that
	* resolves with the resulting `InfiniteQueryObserverResult`. The page
	* param used for the fetch is determined by `getNextPageParam`, which
	* receives the current pages/page params and whose result also determines
	* `hasNextPage`.
	* @param options - Set `cancelRefetch` to `false` to ignore the call while a fetch is running,
	* and `throwOnError` to `true` to reject when the fetch fails.
	* @returns A promise that resolves with the result after the next page is fetched. With
	* `cancelRefetch: false`, a running fetch is reused instead, so the next page may not be fetched.
	* @see {@link InfiniteQueryObserver#fetchPreviousPage}
	* @example
	* ```ts
	* const { hasNextPage } = observer.getCurrentResult()
	*
	* if (hasNextPage) {
	*   await observer.fetchNextPage()
	* }
	* ```
	*/
	fetchNextPage(options) {
		return this.fetch({
			...options,
			meta: { fetchMore: { direction: "forward" } }
		});
	}
	/**
	* Fetches the previous page of the infinite query and returns a promise
	* that resolves with the resulting `InfiniteQueryObserverResult`. The page
	* param used for the fetch is determined by `getPreviousPageParam`, which
	* receives the current pages/page params and whose result also determines
	* `hasPreviousPage`.
	* @param options - Set `cancelRefetch` to `false` to ignore the call while a fetch is running,
	* and `throwOnError` to `true` to reject when the fetch fails.
	* @returns A promise that resolves with the result after the previous page is fetched. With
	* `cancelRefetch: false`, a running fetch is reused instead, so the previous page may not be fetched.
	* @see {@link InfiniteQueryObserver#fetchNextPage}
	* @example
	* ```ts
	* const { hasPreviousPage } = observer.getCurrentResult()
	*
	* if (hasPreviousPage) {
	*   await observer.fetchPreviousPage()
	* }
	* ```
	*/
	fetchPreviousPage(options) {
		return this.fetch({
			...options,
			meta: { fetchMore: { direction: "backward" } }
		});
	}
	createResult(query, options) {
		const { state } = query;
		const parentResult = super.createResult(query, options);
		const { isFetching, isRefetching, isError, isRefetchError } = parentResult;
		const fetchDirection = state.fetchMeta?.fetchMore?.direction;
		const isFetchNextPageError = isError && fetchDirection === "forward";
		const isFetchingNextPage = isFetching && fetchDirection === "forward";
		const isFetchPreviousPageError = isError && fetchDirection === "backward";
		const isFetchingPreviousPage = isFetching && fetchDirection === "backward";
		return {
			...parentResult,
			fetchNextPage: this.fetchNextPage,
			fetchPreviousPage: this.fetchPreviousPage,
			hasNextPage: hasNextPage(options, state.data),
			hasPreviousPage: hasPreviousPage(options, state.data),
			isFetchNextPageError,
			isFetchingNextPage,
			isFetchPreviousPageError,
			isFetchingPreviousPage,
			isRefetchError: isRefetchError && !isFetchNextPageError && !isFetchPreviousPageError,
			isRefetching: isRefetching && !isFetchingNextPage && !isFetchingPreviousPage
		};
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/mutation.js
/**
* Represents a single mutation attempt. A `Mutation` holds the mutation's
* options, state (data/error/status), and the `MutationObserver`s currently
* subscribed to it.
*
* Instances are created and managed internally by `MutationCache`; application
* code typically interacts with mutations indirectly through `QueryClient` or
* a framework hook like `useMutation`. Direct access to a `Mutation` instance
* is possible via `mutationCache.find()`/`getAll()` for inspecting cache state.
* @example
* ```ts
* const mutationCache = queryClient.getMutationCache()
*
* const mutation = mutationCache.find({ mutationKey: ['addPost'] })
* ```
*/
var Mutation = class extends Removable {
	#client;
	#observers;
	#mutationCache;
	#retryer;
	constructor(config) {
		super();
		this.#client = config.client;
		this.mutationId = config.mutationId;
		this.#mutationCache = config.mutationCache;
		this.#observers = [];
		this.state = config.state || getDefaultState();
		this.setOptions(config.options);
		this.scheduleGc();
	}
	/**
	* Replaces the mutation's options and applies their `gcTime`.
	* @internal
	* @param options - The new mutation options.
	*/
	setOptions(options) {
		this.options = options;
		this.updateGcTime(this.options.gcTime);
	}
	/**
	* The `meta` object passed in the mutation's options, if any.
	* @returns The mutation's `meta`, or `undefined` if none was set.
	*/
	get meta() {
		return this.options.meta;
	}
	/**
	* Subscribes an observer to the mutation and stops its garbage collection.
	* @internal
	* @param observer - The observer to add. Adding an observer that is already subscribed does
	* nothing.
	*/
	addObserver(observer) {
		if (!this.#observers.includes(observer)) {
			this.#observers.push(observer);
			this.clearGcTimeout();
			this.#mutationCache.notify({
				type: "observerAdded",
				mutation: this,
				observer
			});
		}
	}
	/**
	* Unsubscribes an observer from the mutation.
	* @internal
	* @param observer - The observer to remove. Garbage collection is scheduled afterwards.
	*/
	removeObserver(observer) {
		this.#observers = this.#observers.filter((x) => x !== observer);
		this.scheduleGc();
		this.#mutationCache.notify({
			type: "observerRemoved",
			mutation: this,
			observer
		});
	}
	optionalRemove() {
		if (!this.#observers.length) if (this.state.status === "pending") this.scheduleGc();
		else this.#mutationCache.remove(this);
	}
	/**
	* Resumes a mutation that is currently paused or was restored from a
	* dehydrated, still-`pending` state.
	*
	* - If this mutation has an active retryer (it paused mid-attempt, e.g. due
	*   to the network mode or scope-based queuing), its retryer is resumed.
	* - Otherwise, if the mutation's status is still `pending` (e.g. it was
	*   dehydrated while an attempt was in flight and never got a retryer in
	*   this instance), `execute` is called again with the last known variables.
	* - Otherwise the mutation has already settled and this resolves immediately
	*   without running anything again.
	* @returns A promise that settles with the resumed mutation: it rejects if the mutation fails.
	* It resolves immediately if the mutation has already settled.
	* @see {@link Mutation#execute}
	* @example
	* ```ts
	* // typically driven by reconnect handling, e.g. queryClient.resumePausedMutations()
	* const mutation = mutationCache.find({ mutationKey: ['addPost'] })
	* await mutation?.continue()
	* ```
	*/
	continue() {
		return this.#retryer?.continue() ?? (this.state.status === "pending" ? this.execute(this.state.variables) : Promise.resolve());
	}
	/**
	* Runs the mutation function for the given variables through a retryer, and
	* drives the mutation's state and lifecycle callbacks through to settlement.
	*
	* If this mutation's state is already `pending` when `execute` is called
	* (i.e. it was restored, still in-flight, from a dehydrated state), the
	* `onMutate` step is skipped and a `continue` action is dispatched to
	* unpause it; otherwise a `pending` action is dispatched first, then the
	* mutation cache's `onMutate` and the mutation's own `onMutate` option are
	* awaited in that order, and the resulting context is stored.
	*
	* The mutation function is then run (subject to `retry`/`retryDelay`/
	* `networkMode`, and to the mutation cache's scope-based serialization).
	* On success, the cache's `onSuccess`/`onSettled` callbacks run before the
	* mutation's own `onSuccess`/`onSettled` options, a `success` action is
	* dispatched, and the resolved data is returned. On failure, the same
	* cache-then-option ordering is used for `onError`/`onSettled`, but each of
	* those four callbacks is individually caught so that a throwing callback
	* cannot mask the original error; an `error` action is then dispatched and
	* the original error is re-thrown.
	* @param variables - The variables passed to the `mutationFn`.
	* @returns A promise that resolves with the mutation's data, or rejects with its error.
	* @see {@link Mutation#continue}
	* @example
	* ```ts
	* // Called internally by `MutationObserver.mutate` and `Mutation.continue` —
	* // applications normally trigger mutations through those, not this method.
	* const data = await mutation.execute(variables)
	* ```
	*/
	async execute(variables) {
		const onContinue = () => {
			this.#dispatch({ type: "continue" });
		};
		const mutationFnContext = {
			client: this.#client,
			meta: this.options.meta,
			mutationKey: this.options.mutationKey
		};
		const retryer = this.#retryer = createRetryer({
			fn: () => {
				if (!this.options.mutationFn) return Promise.reject(/* @__PURE__ */ new Error("No mutationFn found"));
				return this.options.mutationFn(variables, mutationFnContext);
			},
			onFail: (failureCount, error) => {
				this.#dispatch({
					type: "failed",
					failureCount,
					error
				});
			},
			onPause: () => {
				this.#dispatch({ type: "pause" });
			},
			onContinue,
			retry: this.options.retry ?? 0,
			retryDelay: this.options.retryDelay,
			networkMode: this.options.networkMode,
			canRun: () => this.#mutationCache.canRun(this)
		});
		const restored = this.state.status === "pending";
		const isPaused = !retryer.canStart();
		try {
			if (restored) onContinue();
			else {
				this.#dispatch({
					type: "pending",
					variables,
					isPaused
				});
				if (this.#mutationCache.config.onMutate) await this.#mutationCache.config.onMutate(variables, this, mutationFnContext);
				const context = await this.options.onMutate?.(variables, mutationFnContext);
				if (context !== this.state.context) this.#dispatch({
					type: "pending",
					context,
					variables,
					isPaused
				});
			}
			const data = await retryer.start();
			await this.#mutationCache.config.onSuccess?.(data, variables, this.state.context, this, mutationFnContext);
			await this.options.onSuccess?.(data, variables, this.state.context, mutationFnContext);
			await this.#mutationCache.config.onSettled?.(data, null, this.state.variables, this.state.context, this, mutationFnContext);
			await this.options.onSettled?.(data, null, variables, this.state.context, mutationFnContext);
			this.#dispatch({
				type: "success",
				data
			});
			return data;
		} catch (error) {
			try {
				await this.#mutationCache.config.onError?.(error, variables, this.state.context, this, mutationFnContext);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.options.onError?.(error, variables, this.state.context, mutationFnContext);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.#mutationCache.config.onSettled?.(void 0, error, this.state.variables, this.state.context, this, mutationFnContext);
			} catch (e) {
				Promise.reject(e);
			}
			try {
				await this.options.onSettled?.(void 0, error, variables, this.state.context, mutationFnContext);
			} catch (e) {
				Promise.reject(e);
			}
			this.#dispatch({
				type: "error",
				error
			});
			throw error;
		} finally {
			if (this.#retryer === retryer) this.#retryer = void 0;
			this.#mutationCache.runNext(this);
		}
	}
	#dispatch(action) {
		const reducer = (state) => {
			switch (action.type) {
				case "failed": return {
					...state,
					failureCount: action.failureCount,
					failureReason: action.error
				};
				case "pause": return {
					...state,
					isPaused: true
				};
				case "continue": return {
					...state,
					isPaused: false
				};
				case "pending": return {
					...state,
					context: action.context,
					data: void 0,
					failureCount: 0,
					failureReason: null,
					error: null,
					isPaused: action.isPaused,
					status: "pending",
					variables: action.variables,
					submittedAt: Date.now()
				};
				case "success": return {
					...state,
					data: action.data,
					failureCount: 0,
					failureReason: null,
					error: null,
					status: "success",
					isPaused: false
				};
				case "error": return {
					...state,
					data: void 0,
					error: action.error,
					failureCount: state.failureCount + 1,
					failureReason: action.error,
					isPaused: false,
					status: "error"
				};
			}
		};
		this.state = reducer(this.state);
		notifyManager.batch(() => {
			this.#observers.forEach((observer) => {
				observer.onMutationUpdate(action);
			});
			this.#mutationCache.notify({
				mutation: this,
				type: "updated",
				action
			});
		});
	}
};
/**
* Returns the initial state of a mutation: `'idle'`, with no data, error, or variables.
* @returns The initial mutation state.
*/
function getDefaultState() {
	return {
		context: void 0,
		data: void 0,
		error: null,
		failureCount: 0,
		failureReason: null,
		isPaused: false,
		status: "idle",
		variables: void 0,
		submittedAt: 0
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/mutationCache.js
/**
* The `MutationCache` is the storage for mutations.
*
* Normally, you will not interact with the `MutationCache` directly and instead use a
* `QueryClient`. You can subscribe to it (inherited from `Subscribable`) to be informed of
* safe/known updates to the cache, such as mutations being added, removed, or updated.
* @example
* ```ts
* const unsubscribe = mutationCache.subscribe((event) => {
*   console.log(event.type, event.mutation)
* })
* ```
*/
var MutationCache$1 = class extends Subscribable {
	#mutations;
	#scopes;
	#mutationId;
	constructor(config = {}) {
		super();
		this.config = config;
		this.#mutations = /* @__PURE__ */ new Set();
		this.#scopes = /* @__PURE__ */ new Map();
		this.#mutationId = 0;
	}
	/**
	* Creates a mutation and adds it to the cache.
	* @internal
	* @param client - The client the mutation belongs to, used to default its options.
	* @param options - The mutation options. They are defaulted with {@link
	* QueryClient#defaultMutationOptions}.
	* @param state - The initial state of the mutation, e.g. when restoring a dehydrated mutation.
	* @returns The new mutation, already added to the cache.
	*/
	build(client, options, state) {
		const mutation = new Mutation({
			client,
			mutationCache: this,
			mutationId: ++this.#mutationId,
			options: client.defaultMutationOptions(options),
			state
		});
		this.add(mutation);
		return mutation;
	}
	/**
	* Adds a mutation to the cache.
	* @internal
	* @param mutation - The mutation to add. If it has a `scope`, it is queued in that scope.
	*/
	add(mutation) {
		this.#mutations.add(mutation);
		const scope = scopeFor(mutation);
		if (typeof scope === "string") {
			const scopedMutations = this.#scopes.get(scope);
			if (scopedMutations) scopedMutations.push(mutation);
			else this.#scopes.set(scope, [mutation]);
		}
		this.notify({
			type: "added",
			mutation
		});
	}
	/**
	* Removes a mutation from the cache.
	* @internal
	* @param mutation - The mutation to remove, also from its scope's queue.
	*/
	remove(mutation) {
		if (this.#mutations.delete(mutation)) {
			const scope = scopeFor(mutation);
			if (typeof scope === "string") {
				const scopedMutations = this.#scopes.get(scope);
				if (scopedMutations) {
					if (scopedMutations.length > 1) {
						const index = scopedMutations.indexOf(mutation);
						if (index !== -1) scopedMutations.splice(index, 1);
					} else if (scopedMutations[0] === mutation) this.#scopes.delete(scope);
				}
			}
		}
		this.notify({
			type: "removed",
			mutation
		});
	}
	/**
	* Checks whether a mutation can run now, given the other mutations in its `scope`.
	* @internal
	* @param mutation - The mutation to check.
	* @returns `true` if the mutation has no `scope`, or no other mutation in its scope is pending
	* ahead of it.
	*/
	canRun(mutation) {
		const scope = scopeFor(mutation);
		if (typeof scope === "string") {
			const firstPendingMutation = this.#scopes.get(scope)?.find((m) => m.state.status === "pending");
			return !firstPendingMutation || firstPendingMutation === mutation;
		} else return true;
	}
	/**
	* Continues the next paused mutation in the same `scope` after a mutation finishes.
	* @internal
	* @param mutation - The mutation that finished.
	* @returns A promise that resolves once the next paused mutation in the same scope has continued,
	* or immediately if there is none.
	*/
	runNext(mutation) {
		const scope = scopeFor(mutation);
		if (typeof scope === "string") return (this.#scopes.get(scope)?.find((m) => m !== mutation && m.state.isPaused))?.continue() ?? Promise.resolve();
		else return Promise.resolve();
	}
	/**
	* Removes all mutations from the cache.
	* @example
	* ```ts
	* const mutationCache = queryClient.getMutationCache()
	*
	* mutationCache.clear()
	* ```
	*/
	clear() {
		notifyManager.batch(() => {
			const mutations = this.getAll();
			this.#mutations.clear();
			this.#scopes.clear();
			mutations.forEach((mutation) => {
				this.notify({
					type: "removed",
					mutation
				});
			});
		});
	}
	/**
	* Returns all mutations within the cache.
	*
	* This is not typically needed for most applications, but can come in handy when needing more
	* information about a mutation in rare scenarios.
	* @returns Every mutation in the cache.
	* @example
	* ```ts
	* const mutationCache = queryClient.getMutationCache()
	*
	* const mutations = mutationCache.getAll()
	* ```
	*/
	getAll() {
		return Array.from(this.#mutations);
	}
	/**
	* A slightly more advanced method that can be used to get an existing mutation instance from
	* the cache. If the mutation does not exist, `undefined` is returned.
	*
	* This is not typically needed for most applications, but can come in handy when needing more
	* information about a mutation in rare scenarios.
	* @param filters - The filters to match. `exact` defaults to `true`.
	* @returns The first matching mutation, or `undefined`.
	* @see {@link MutationCache#findAll}
	* @example
	* ```ts
	* const mutationCache = queryClient.getMutationCache()
	*
	* const mutation = mutationCache.find({ mutationKey: ['addPost'] })
	* ```
	*/
	find(filters) {
		const defaultedFilters = {
			exact: true,
			...filters
		};
		return this.getAll().find((mutation) => matchMutation(defaultedFilters, mutation));
	}
	/**
	* An even more advanced method that can be used to get existing mutation instances from the
	* cache that match the given filters. If no mutations match, an empty array is returned.
	*
	* This is not typically needed for most applications, but can come in handy when needing more
	* information about mutations in rare scenarios.
	* @param filters - The filters to match. Without filters, every mutation is returned.
	* @returns The matching mutations.
	* @see {@link MutationCache#find}
	* @example
	* ```ts
	* const mutationCache = queryClient.getMutationCache()
	*
	* const mutations = mutationCache.findAll({ mutationKey: ['addPost'] })
	* ```
	*/
	findAll(filters = {}) {
		return this.getAll().filter((mutation) => matchMutation(filters, mutation));
	}
	/**
	* Notifies every cache listener of an event, in one batch.
	* @internal
	* @param event - The event passed to every listener.
	*/
	notify(event) {
		notifyManager.batch(() => {
			this.listeners.forEach((listener) => {
				listener(event);
			});
		});
	}
	/**
	* Continues every paused mutation, e.g. when the app comes back online.
	* @internal
	* @returns A promise that resolves once every paused mutation has continued and settled.
	*/
	resumePausedMutations() {
		const pausedMutations = this.getAll().filter((x) => x.state.isPaused);
		return notifyManager.batch(() => Promise.all(pausedMutations.map((mutation) => mutation.continue().catch(noop))));
	}
};
/**
* Returns the scope id of a mutation, used to run mutations with the same scope one after another.
* @param mutation - The mutation to read the scope of.
* @returns The mutation's `scope.id`, or `undefined` if it has no scope.
*/
function scopeFor(mutation) {
	return mutation.options.scope?.id;
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/mutationObserver.js
/**
* Observes a single mutation and derives a `MutationObserverResult` from it.
* A framework hook like `useMutation` creates one `MutationObserver` per hook
* call, keeps it stable across re-renders, calls `setOptions` when the options
* passed to the hook change, subscribes to it to re-render on updates, and
* reads `getCurrentResult()` for the value to return. Calling `mutate()`
* builds a new underlying `Mutation` in the `MutationCache` and executes it.
* @example
* ```ts
* const observer = new MutationObserver(queryClient, {
*   mutationFn: (variables: { title: string }) => addPost(variables),
* })
* ```
*/
var MutationObserver = class extends Subscribable {
	#client;
	#currentResult = void 0;
	#currentMutation;
	#mutateOptions;
	constructor(client, options) {
		super();
		this.#client = client;
		this.setOptions(options);
		this.bindMethods();
		this.#updateResult();
	}
	/**
	* Binds the methods of the result (`mutate` and `reset`) to the observer, so they keep working when
	* destructured from it.
	*/
	bindMethods() {
		this.mutate = this.mutate.bind(this);
		this.reset = this.reset.bind(this);
	}
	/**
	* Updates the observer's options.
	*
	* If the new `mutationKey` differs from the previous one (and both were
	* defined), the observer is reset, detaching it from the mutation it was
	* observing. Otherwise, if the currently observed mutation is still
	* `pending`, its options are updated in place as well.
	* @param options - The new mutation observer options. They are defaulted with {@link
	* QueryClient#defaultMutationOptions} before being applied.
	* @example
	* ```ts
	* observer.setOptions({
	*   mutationFn: (variables: { title: string }) => addPost(variables),
	*   onSuccess: (data) => console.log(data),
	* })
	* ```
	*/
	setOptions(options) {
		const prevOptions = this.options;
		this.options = this.#client.defaultMutationOptions(options);
		if (!shallowEqualObjects(this.options, prevOptions)) this.#client.getMutationCache().notify({
			type: "observerOptionsUpdated",
			mutation: this.#currentMutation,
			observer: this
		});
		if (prevOptions?.mutationKey && this.options.mutationKey && hashKey(prevOptions.mutationKey) !== hashKey(this.options.mutationKey)) this.reset();
		else if (this.#currentMutation?.state.status === "pending") this.#currentMutation.setOptions(this.options);
	}
	onSubscribe() {
		if (this.listeners.size === 1 && this.#currentMutation) {
			this.#currentMutation.addObserver(this);
			this.#updateResult();
		}
	}
	onUnsubscribe() {
		if (!this.hasListeners()) this.#currentMutation?.removeObserver(this);
	}
	/**
	* Updates the observer's result when the observed mutation changes, and notifies its listeners.
	* @internal
	* @param action - The action that updated the observed mutation, passed on to the observer's
	* callbacks.
	*/
	onMutationUpdate(action) {
		this.#updateResult();
		this.#notify(action);
	}
	/**
	* Returns the observer's current result, derived from the observed
	* mutation's state (or the default, `idle` state if no mutation has been
	* built yet, e.g. before the first `mutate()` call or after `reset()`).
	* @returns The observer's latest result.
	*/
	getCurrentResult() {
		return this.#currentResult;
	}
	/**
	* Detaches the observer from the mutation it is currently observing (if
	* any) and resets the observed result back to its default, `idle` state.
	*
	* This does not cancel an in-flight mutation; the mutation itself keeps
	* running to completion and its own callbacks still fire, but this
	* observer stops reflecting its state and a subsequent `mutate()` call
	* will build a brand new mutation.
	* @see {@link MutationObserver#mutate}
	* @example
	* ```ts
	* observer.reset()
	* ```
	*/
	reset() {
		this.#currentMutation?.removeObserver(this);
		this.#currentMutation = void 0;
		this.#updateResult();
		this.#notify();
	}
	/**
	* Builds a new `Mutation` in the `MutationCache` using the observer's
	* current options, detaches this observer from any previously observed
	* mutation, attaches it to the new one, and executes it with the given
	* variables.
	*
	* The optional per-call `options` (`onSuccess`/`onError`/`onSettled`) are
	* invoked once the mutation settles, in addition to any callbacks defined
	* on the observer's own options.
	* @param variables - The variables passed to the `mutationFn`.
	* @param options - Per-call `onSuccess`, `onError`, and `onSettled` callbacks.
	* @returns A promise that resolves with the mutation's data, or rejects with its error.
	* @example
	* ```ts
	* await observer.mutate(
	*   { title: 'New post' },
	*   { onSuccess: (data) => console.log(data) },
	* )
	* ```
	*/
	mutate(variables, options) {
		this.#mutateOptions = options;
		this.#currentMutation?.removeObserver(this);
		this.#currentMutation = this.#client.getMutationCache().build(this.#client, this.options);
		this.#currentMutation.addObserver(this);
		return this.#currentMutation.execute(variables);
	}
	#updateResult() {
		const state = this.#currentMutation?.state ?? getDefaultState();
		this.#currentResult = {
			...state,
			isPending: state.status === "pending",
			isSuccess: state.status === "success",
			isError: state.status === "error",
			isIdle: state.status === "idle",
			mutate: this.mutate,
			reset: this.reset
		};
	}
	#notify(action) {
		notifyManager.batch(() => {
			const mutateOptions = this.#mutateOptions;
			if (mutateOptions && this.hasListeners()) {
				const variables = this.#currentResult.variables;
				const onMutateResult = this.#currentResult.context;
				const context = {
					client: this.#client,
					meta: this.options.meta,
					mutationKey: this.options.mutationKey
				};
				if (action?.type === "success") {
					try {
						mutateOptions.onSuccess?.(action.data, variables, onMutateResult, context);
					} catch (e) {
						Promise.reject(e);
					}
					try {
						mutateOptions.onSettled?.(action.data, null, variables, onMutateResult, context);
					} catch (e) {
						Promise.reject(e);
					}
				} else if (action?.type === "error") {
					try {
						mutateOptions.onError?.(action.error, variables, onMutateResult, context);
					} catch (e) {
						Promise.reject(e);
					}
					try {
						mutateOptions.onSettled?.(void 0, action.error, variables, onMutateResult, context);
					} catch (e) {
						Promise.reject(e);
					}
				}
			}
			this.listeners.forEach((listener) => {
				listener(this.#currentResult);
			});
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/queriesObserver.js
/**
* Returns the items of `array1` that are not in `array2`.
* @param array1 - The items to filter.
* @param array2 - The items to exclude.
* @returns A new array with the items of `array1` that are not in `array2`.
*/
function difference(array1, array2) {
	const excludeSet = new Set(array2);
	return array1.filter((x) => !excludeSet.has(x));
}
/**
* A `QueriesObserver` watches an array of queries at once, exposing them as
* a single array of `QueryObserverResult`s (or, when a `combine` option is
* given, as a combined value derived from that array). It manages one
* internal `QueryObserver` per query, and is the primitive that framework
* adapters (e.g. `useQueries`) build their hooks on top of.
* @example
* ```ts
* const observer = new QueriesObserver(queryClient, [
*   { queryKey: ['post', 1], queryFn: fetchPost },
*   { queryKey: ['post', 2], queryFn: fetchPost },
* ])
*
* const unsubscribe = observer.subscribe((result) => {
*   console.log(result)
* })
* ```
*/
var QueriesObserver = class extends Subscribable {
	#client;
	#result;
	#queries;
	#options;
	#observers;
	#combinedResult;
	#lastCombine;
	#lastResult;
	#lastQueryHashes;
	#observerMatches = [];
	constructor(client, queries, options) {
		super();
		this.#client = client;
		this.#options = options;
		this.#queries = [];
		this.#observers = [];
		this.#result = [];
		this.setQueries(queries);
	}
	onSubscribe() {
		if (this.listeners.size === 1) this.#observers.forEach((observer) => {
			observer.subscribe((result) => {
				this.#onUpdate(observer, result);
			});
		});
	}
	onUnsubscribe() {
		if (!this.listeners.size) this.destroy();
	}
	/**
	* Stops observing all queries: clears all listeners and destroys every
	* underlying `QueryObserver` this observer manages.
	*/
	destroy() {
		this.listeners = /* @__PURE__ */ new Set();
		this.#observers.forEach((observer) => {
			observer.destroy();
		});
	}
	/**
	* Replaces the set of queries being observed. Existing `QueryObserver`s
	* are reused for queries that match an already-observed query hash;
	* observers for queries that are no longer present are destroyed, and new
	* observers are created and subscribed to for newly added queries.
	* @param queries - The options of the queries to observe.
	* @param options - Replaces the observer's options, e.g. its `combine` function.
	* @example
	* ```ts
	* observer.setQueries([
	*   { queryKey: ['post', 1], queryFn: fetchPost },
	*   { queryKey: ['post', 3], queryFn: fetchPost },
	* ])
	* ```
	*/
	setQueries(queries, options) {
		this.#queries = queries;
		this.#options = options;
		{
			const queryHashes = queries.map((query) => this.#client.defaultQueryOptions(query).queryHash);
			if (new Set(queryHashes).size !== queryHashes.length) console.warn("[QueriesObserver]: Duplicate Queries found. This might result in unexpected behavior.");
		}
		notifyManager.batch(() => {
			const prevObservers = this.#observers;
			const newObserverMatches = this.#findMatchingObservers(this.#queries);
			newObserverMatches.forEach((match) => match.observer.setOptions(match.defaultedQueryOptions));
			const newObservers = newObserverMatches.map((match) => match.observer);
			const newResult = newObservers.map((observer) => observer.getCurrentResult());
			const hasLengthChange = prevObservers.length !== newObservers.length;
			const hasIndexChange = newObservers.some((observer, index) => observer !== prevObservers[index]);
			const hasStructuralChange = hasLengthChange || hasIndexChange;
			const hasResultChange = hasStructuralChange ? true : newResult.some((result, index) => {
				const prev = this.#result[index];
				return !prev || !shallowEqualObjects(result, prev);
			});
			if (!hasStructuralChange && !hasResultChange) return;
			if (hasStructuralChange) {
				this.#observerMatches = newObserverMatches;
				this.#observers = newObservers;
			}
			this.#result = newResult;
			if (!this.hasListeners()) return;
			if (hasStructuralChange) {
				difference(prevObservers, newObservers).forEach((observer) => {
					observer.destroy();
				});
				difference(newObservers, prevObservers).forEach((observer) => {
					observer.subscribe((result) => {
						this.#onUpdate(observer, result);
					});
				});
			}
			this.#notify();
		});
	}
	/**
	* Returns the most recently computed array of `QueryObserverResult`s, one
	* per observed query, in the same order as the queries passed to the
	* constructor or `setQueries`.
	* @returns The current results.
	* @example
	* ```ts
	* const results = observer.getCurrentResult()
	* const data = results.map((result) => result.data)
	* ```
	*/
	getCurrentResult() {
		return this.#result;
	}
	/**
	* Returns the underlying `Query` instances currently being observed, in
	* the same order as the queries passed to the constructor or `setQueries`.
	* @returns The observed queries.
	*/
	getQueries() {
		return this.#observers.map((observer) => observer.getCurrentQuery());
	}
	/**
	* Returns the underlying `QueryObserver` instances this observer manages,
	* in the same order as the queries passed to the constructor or
	* `setQueries`.
	* @returns The managed query observers.
	*/
	getObservers() {
		return this.#observers;
	}
	/**
	* The `QueriesObserver` counterpart of {@link QueryObserver#getOptimisticResult} — computes
	* the result for the given (already-defaulted) queries right now, synchronously. Called by
	* framework adapters (e.g. `useQueries`) ahead of subscribing, returning a tuple of the raw
	* per-query results, a function to compute the combined result from them, and a function to
	* wrap the results for property-access tracking.
	* @param queries - The defaulted options of the queries to compute the result for.
	* @param combine - The `combine` function used by the returned `combineResult`, if any.
	* @returns A tuple of the per-query results, a function that computes the combined result, and a
	* function that returns the results wrapped for property-access tracking.
	*/
	getOptimisticResult(queries, combine) {
		const matches = this.#findMatchingObservers(queries);
		const result = matches.map((match) => match.observer.getOptimisticResult(match.defaultedQueryOptions));
		const queryHashes = matches.map((match) => match.defaultedQueryOptions.queryHash);
		return [
			result,
			(r) => {
				return this.#combineResult(r ?? result, combine, queryHashes);
			},
			() => {
				return this.#trackResult(result, matches);
			}
		];
	}
	#trackResult(result, matches) {
		const trackedProps = /* @__PURE__ */ new Set();
		return matches.map((match, index) => {
			const observerResult = result[index];
			return !match.defaultedQueryOptions.notifyOnChangeProps ? match.observer.trackResult(observerResult, (accessedProp) => {
				if (!trackedProps.has(accessedProp)) {
					trackedProps.add(accessedProp);
					matches.forEach((m) => {
						m.observer.trackProp(accessedProp);
					});
				}
			}) : observerResult;
		});
	}
	#combineResult(input, combine, queryHashes) {
		if (combine) {
			const lastHashes = this.#lastQueryHashes;
			const queryHashesChanged = queryHashes !== void 0 && lastHashes !== void 0 && (lastHashes.length !== queryHashes.length || queryHashes.some((hash, i) => hash !== lastHashes[i]));
			if (this.#result !== this.#lastResult || queryHashesChanged || combine !== this.#lastCombine) {
				this.#lastCombine = combine;
				this.#lastResult = this.#result;
				if (queryHashes !== void 0) this.#lastQueryHashes = queryHashes;
				this.#combinedResult = replaceEqualDeep(this.#combinedResult, combine(input));
			}
			return this.#combinedResult;
		}
		return input;
	}
	#shouldSkipCombine() {
		return !this.#options?.combine || this.#observers.some((observer, index) => {
			return observer.options.suspense && this.#result[index]?.data === void 0;
		});
	}
	#findMatchingObservers(queries) {
		const prevObserversMap = /* @__PURE__ */ new Map();
		this.#observers.forEach((observer) => {
			const key = observer.options.queryHash;
			if (!key) return;
			const previousObservers = prevObserversMap.get(key);
			if (previousObservers) previousObservers.push(observer);
			else prevObserversMap.set(key, [observer]);
		});
		const observers = [];
		queries.forEach((options) => {
			const defaultedOptions = this.#client.defaultQueryOptions(options);
			const observer = prevObserversMap.get(defaultedOptions.queryHash)?.shift() ?? new QueryObserver(this.#client, defaultedOptions);
			observers.push({
				defaultedQueryOptions: defaultedOptions,
				observer
			});
		});
		return observers;
	}
	#onUpdate(observer, result) {
		const index = this.#observers.indexOf(observer);
		if (index !== -1) {
			this.#result = this.#result.slice();
			this.#result[index] = result;
			this.#notify();
		}
	}
	#notify() {
		if (this.hasListeners()) {
			const shouldSkipCombine = this.#shouldSkipCombine();
			const previousResult = this.#combinedResult;
			const newResult = shouldSkipCombine ? previousResult : this.#combineResult(this.#trackResult(this.#result, this.#observerMatches), this.#options?.combine);
			if (shouldSkipCombine || previousResult !== newResult) notifyManager.batch(() => {
				this.listeners.forEach((listener) => {
					listener(this.#result);
				});
			});
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/queryCache.js
/**
* The `QueryCache` is the storage mechanism for TanStack Query. It stores all the data, meta
* information, and state of the queries it contains.
*
* Normally, you will not interact with the `QueryCache` directly and instead use a `QueryClient`
* for a specific cache. You can subscribe to it (inherited from `Subscribable`) to be informed of
* safe/known updates to the cache, such as queries being added, removed, or updated — updates made
* outside of the cache's own tracked mechanisms (e.g. mutating a query's state object directly) do
* not notify subscribers.
* @example
* ```ts
* const unsubscribe = queryCache.subscribe((event) => {
*   console.log(event.type, event.query)
* })
* ```
*/
var QueryCache$1 = class extends Subscribable {
	#queries;
	constructor(config = {}) {
		super();
		this.config = config;
		this.#queries = /* @__PURE__ */ new Map();
	}
	/**
	* Returns the existing `Query` instance for the given options' `queryKey`/`queryHash`, or
	* builds and adds a new one to the cache if none exists yet. Used by framework adapters and
	* plugins (e.g. broadcast/persistence) that need to get-or-create a `Query` directly, bypassing
	* the reactive `QueryObserver` machinery.
	* @param client - The client the query belongs to, used to default its options.
	* @param options - The query options, including the `queryKey`. A new query is created with the
	* options defaulted by {@link QueryClient#defaultQueryOptions}.
	* @param state - The initial state of a newly created query, e.g. when hydrating. Ignored if the
	* query already exists.
	* @returns The existing or newly created query.
	* @example
	* ```ts
	* const queryCache = queryClient.getQueryCache()
	*
	* const query = queryCache.build(queryClient, {
	*   queryKey: ['posts'],
	*   queryFn: fetchPosts,
	* })
	* ```
	*/
	build(client, options, state) {
		const queryKey = options.queryKey;
		const queryHash = options.queryHash ?? hashQueryKeyByOptions(queryKey, options);
		let query = this.get(queryHash);
		if (!query) {
			query = new Query({
				client,
				queryKey,
				queryHash,
				options: client.defaultQueryOptions(options),
				state,
				defaultOptions: client.getQueryDefaults(queryKey)
			});
			this.add(query);
		}
		return query;
	}
	/**
	* Adds a query to the cache.
	* @internal
	* @param query - The query to add. If a query with the same hash is already cached, nothing
	* happens.
	*/
	add(query) {
		if (!this.#queries.has(query.queryHash)) {
			this.#queries.set(query.queryHash, query);
			this.notify({
				type: "added",
				query
			});
		}
	}
	/**
	* Destroys the given `Query` and removes it from the cache, notifying subscribers with a
	* `'removed'` event. A no-op if the query is no longer the one currently stored under its hash
	* (e.g. it was already replaced). Used by plugins (e.g. the broadcast client) that mirror
	* removals across `QueryCache` instances.
	* @param query - The query to remove.
	* @example
	* ```ts
	* const queryCache = queryClient.getQueryCache()
	* const query = queryCache.find({ queryKey: ['posts'] })
	*
	* if (query) {
	*   queryCache.remove(query)
	* }
	* ```
	*/
	remove(query) {
		if (this.#queries.get(query.queryHash) === query) {
			query.destroy();
			this.#queries.delete(query.queryHash);
			this.notify({
				type: "removed",
				query
			});
		}
	}
	/**
	* Removes all queries from the cache.
	* @example
	* ```ts
	* const queryCache = queryClient.getQueryCache()
	*
	* queryCache.clear()
	* ```
	*/
	clear() {
		notifyManager.batch(() => {
			this.getAll().forEach((query) => {
				this.remove(query);
			});
		});
	}
	/**
	* Returns the `Query` instance stored under the given `queryHash`, or `undefined` if none
	* exists. Unlike {@link QueryCache#find}, this looks up by the already-computed hash rather
	* than by `QueryFilters`. Used by plugins (e.g. broadcast/hydration) that already have a hash
	* to look up directly.
	* @param queryHash - The hash of the query to look up.
	* @returns The query stored under the hash, or `undefined`.
	* @example
	* ```ts
	* const queryCache = queryClient.getQueryCache()
	* const queryHash = hashKey(['posts'])
	*
	* const query = queryCache.get(queryHash)
	* ```
	*/
	get(queryHash) {
		return this.#queries.get(queryHash);
	}
	/**
	* Returns all queries within the cache.
	* @returns Every query in the cache.
	* @example
	* ```ts
	* const queryCache = queryClient.getQueryCache()
	*
	* const queries = queryCache.getAll()
	* ```
	*/
	getAll() {
		return [...this.#queries.values()];
	}
	/**
	* A slightly more advanced method that can be used to get an existing query instance from the
	* cache. This instance not only contains all the state for the query, but all of the instances,
	* and underlying guts of the query as well. If the query does not exist, `undefined` is
	* returned.
	*
	* This is not typically needed for most applications, but can come in handy when needing more
	* information about a query in rare scenarios (e.g. looking at `query.state.dataUpdatedAt` to
	* decide whether a query is fresh enough to be used as an initial value).
	* @param filters - The filters to match, including the required `queryKey`. `exact` defaults to
	* `true`.
	* @returns The first matching query, or `undefined`.
	* @see {@link QueryCache#findAll}
	* @example
	* ```ts
	* const queryCache = queryClient.getQueryCache()
	*
	* const query = queryCache.find({ queryKey: ['posts'] })
	* ```
	*/
	find(filters) {
		const defaultedFilters = {
			exact: true,
			...filters
		};
		return this.getAll().find((query) => matchQuery(defaultedFilters, query));
	}
	/**
	* An even more advanced method that can be used to get existing query instances from the cache
	* that partially match a query key. If no queries match, an empty array is returned.
	*
	* This is not typically needed for most applications, but can come in handy when needing more
	* information about queries in rare scenarios.
	* @param filters - The filters to match. Without filters, every query is returned.
	* @returns The matching queries.
	* @see {@link QueryCache#find}
	* @example
	* ```ts
	* const queryCache = queryClient.getQueryCache()
	*
	* const queries = queryCache.findAll({ queryKey: ['posts'] })
	* ```
	*/
	findAll(filters = {}) {
		const queries = this.getAll();
		return Object.keys(filters).length > 0 ? queries.filter((query) => matchQuery(filters, query)) : queries;
	}
	/**
	* Notifies every cache listener of an event, in one batch.
	* @internal
	* @param event - The event passed to every listener.
	*/
	notify(event) {
		notifyManager.batch(() => {
			this.listeners.forEach((listener) => {
				listener(event);
			});
		});
	}
	/**
	* Calls {@link Query#onFocus} on every cached query, in one batch.
	* @internal
	*/
	onFocus() {
		notifyManager.batch(() => {
			this.getAll().forEach((query) => {
				query.onFocus();
			});
		});
	}
	/**
	* Calls {@link Query#onOnline} on every cached query, in one batch.
	* @internal
	*/
	onOnline() {
		notifyManager.batch(() => {
			this.getAll().forEach((query) => {
				query.onOnline();
			});
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/queryClient.js
/**
* `QueryClient` is used to interact with a cache of queries and mutations. It owns a
* `QueryCache` and a `MutationCache` (creating default ones if none are passed in) and holds
* the default options that are applied to queries and mutations created through it.
* @example
* ```ts
* const queryClient = new QueryClient({
*   defaultOptions: {
*     queries: {
*       staleTime: Infinity,
*     },
*   },
* })
*
* await queryClient.query({ queryKey: ['posts'], queryFn: fetchPosts })
* ```
*/
var QueryClient$1 = class {
	#queryCache;
	#mutationCache;
	#defaultOptions;
	#queryDefaults;
	#mutationDefaults;
	#mountCount;
	#unsubscribeFocus;
	#unsubscribeOnline;
	constructor(config = {}) {
		this.#queryCache = config.queryCache || new QueryCache$1();
		this.#mutationCache = config.mutationCache || new MutationCache$1();
		this.#defaultOptions = config.defaultOptions || {};
		this.#queryDefaults = /* @__PURE__ */ new Map();
		this.#mutationDefaults = /* @__PURE__ */ new Map();
		this.#mountCount = 0;
	}
	/**
	* Called by a framework adapter's `QueryClientProvider`-equivalent when it mounts, to start
	* listening for focus/online events and resume paused mutations. Ref-counted via an internal
	* mount count, so nested or multiple providers sharing the same `QueryClient` don't tear down
	* the shared listeners until the last one unmounts.
	*/
	mount() {
		this.#mountCount++;
		if (this.#mountCount !== 1) return;
		this.#unsubscribeFocus = focusManager.subscribe(async (focused) => {
			if (focused) {
				await this.resumePausedMutations();
				this.#queryCache.onFocus();
			}
		});
		this.#unsubscribeOnline = onlineManager.subscribe(async (online) => {
			if (online) {
				await this.resumePausedMutations();
				this.#queryCache.onOnline();
			}
		});
	}
	/**
	* The inverse of {@link QueryClient#mount} — called by a framework adapter's
	* `QueryClientProvider`-equivalent when it unmounts. Only tears down the focus/online
	* listeners once the mount count returns to `0`.
	*/
	unmount() {
		this.#mountCount--;
		if (this.#mountCount !== 0) return;
		this.#unsubscribeFocus?.();
		this.#unsubscribeFocus = void 0;
		this.#unsubscribeOnline?.();
		this.#unsubscribeOnline = void 0;
	}
	/**
	* Returns the number of queries in the cache that are currently fetching, optionally
	* matching a set of filters. This includes background-fetching, loading new pages, and
	* loading more infinite query results.
	* @param filters - Narrows down which fetching queries are counted. Without filters, every
	* fetching query is counted.
	* @returns The number of matching queries whose `fetchStatus` is `'fetching'`.
	* @example
	* ```ts
	* if (queryClient.isFetching()) {
	*   console.log('At least one query is fetching!')
	* }
	* ```
	*/
	isFetching(filters) {
		return this.#queryCache.findAll({
			...filters,
			fetchStatus: "fetching"
		}).length;
	}
	/**
	* Returns the number of mutations in the cache that are currently pending, optionally
	* matching a set of filters.
	* @param filters - Narrows down which pending mutations are counted. Without filters, every
	* pending mutation is counted.
	* @returns The number of matching mutations whose `status` is `'pending'`.
	* @example
	* ```ts
	* if (queryClient.isMutating()) {
	*   console.log('At least one mutation is pending!')
	* }
	* ```
	*/
	isMutating(filters) {
		return this.#mutationCache.findAll({
			...filters,
			status: "pending"
		}).length;
	}
	/**
	* Imperative (non-reactive) way to retrieve data for a QueryKey.
	* Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.
	*
	* Hint: Do not use this function inside a component, because it won't receive updates.
	* Use `useQuery` to create a `QueryObserver` that subscribes to changes.
	* @param queryKey - The query key of the query to read.
	* @returns The cached data for the query, or `undefined` if no query with this key has been observed yet.
	* @see {@link QueryClient#getQueriesData}
	*/
	getQueryData(queryKey) {
		const options = this.defaultQueryOptions({ queryKey });
		return this.#queryCache.get(options.queryHash)?.state.data;
	}
	/**
	* Returns the cached data of a query, or fetches it if there is none. With `revalidateIfStale`,
	* stale cached data is also refetched in the background.
	* @param options - The query options. If the query has no cached data yet, it is fetched with
	* these options.
	* @returns A promise that resolves to the cached data, or to the fetched data if nothing was
	* cached yet.
	* @deprecated Use queryClient.query({ ...options, staleTime: 'static' }) instead. This method will be removed in the next major version.
	*/
	ensureQueryData(options) {
		const defaultedOptions = this.defaultQueryOptions(options);
		const query = this.#queryCache.build(this, defaultedOptions);
		const cachedData = query.state.data;
		if (cachedData === void 0) return this.fetchQuery(options);
		if (options.revalidateIfStale && query.isStaleByTime(resolveQueryValue(defaultedOptions.staleTime, query))) this.prefetchQuery(defaultedOptions);
		return Promise.resolve(cachedData);
	}
	/**
	* Imperative (non-reactive) way to retrieve the cached data of multiple queries at once.
	* Only queries matching the given filters are returned; if none match, an empty array is
	* returned.
	*
	* Because the matched queries can hold data of different shapes (e.g. a broad filter can match
	* queries with unrelated data types), the `TQueryFnData` generic defaults to `unknown` rather
	* than being inferred. Passing a more specific type is a convenience for call sites that know
	* every matched query holds the same shape — it is not checked against the actual cache
	* contents.
	* @param filters - The filters that select which queries to read.
	* @returns An array of query key and data pairs. The data is `undefined` for a query with no cached data.
	* @see {@link QueryClient#getQueryData}
	* @example
	* ```ts
	* const data = queryClient.getQueriesData({ queryKey: ['posts'] })
	* ```
	*/
	getQueriesData(filters) {
		return this.#queryCache.findAll(filters).map(({ queryKey, state }) => {
			return [queryKey, state.data];
		});
	}
	/**
	* Synchronous way to immediately update a query's cached data. If the updater (or the value
	* passed) resolves to `undefined`, the cache is left untouched and no query is created;
	* otherwise, if the query does not exist yet, it will be created. To update multiple queries
	* at once by partially matching query keys, use {@link QueryClient#setQueriesData} instead.
	*
	* Updates must be performed immutably: do not mutate `oldData`, or data previously retrieved
	* via {@link QueryClient#getQueryData}, in place.
	* @param queryKey - The query key to set data for.
	* @param updater - Either the new data, or a function that receives the current data (which
	* may be `undefined`) and returns the new data.
	* @param options - Set `updatedAt` to override the timestamp the written data is recorded with.
	* @returns The data that was written, or `undefined` if the updater returned `undefined` — in that case
	* the write is skipped and the cache is left unchanged.
	* @example
	* ```ts
	* queryClient.setQueryData(['posts'], newPosts)
	*
	* // Or, using an updater function that receives the current data:
	* queryClient.setQueryData(['posts'], (oldPosts) => [...oldPosts, newPost])
	* ```
	*/
	setQueryData(queryKey, updater, options) {
		const defaultedOptions = this.defaultQueryOptions({ queryKey });
		const prevData = this.#queryCache.get(defaultedOptions.queryHash)?.state.data;
		const data = functionalUpdate(updater, prevData);
		if (data === void 0) return;
		return this.#queryCache.build(this, defaultedOptions).setData(data, {
			...options,
			manual: true
		});
	}
	/**
	* Synchronous way to immediately update the cached data of multiple queries at once, using
	* filters or partial query key matching. Only queries that already exist and match the given
	* filters are updated; no new cache entries are created. Internally this calls
	* {@link QueryClient#setQueryData} for each matching query.
	* @param filters - The filters that select which existing queries to update.
	* @param updater - Either the new data, or a function that receives each matched query's current
	* data (which may be `undefined`) and returns the new data.
	* @param options - Set `updatedAt` to override the timestamp the written data is recorded with.
	* @returns One `[queryKey, data]` tuple per matched query, in the same shape and with the same
	* `undefined` case as {@link QueryClient#setQueryData}.
	* @example
	* ```ts
	* queryClient.setQueriesData({ queryKey: ['posts'] }, (oldPosts) =>
	*   oldPosts ? oldPosts.filter((post) => post.id !== deletedId) : oldPosts,
	* )
	* ```
	*/
	setQueriesData(filters, updater, options) {
		return notifyManager.batch(() => this.#queryCache.findAll(filters).map(({ queryKey }) => [queryKey, this.setQueryData(queryKey, updater, options)]));
	}
	/**
	* Imperative (non-reactive) way to retrieve an existing query's state. If the query does not
	* exist, `undefined` is returned.
	* @param queryKey - The query key of the query to read.
	* @returns The query's state, or `undefined` if no query with this key exists.
	* @example
	* ```ts
	* const state = queryClient.getQueryState(['posts'])
	* console.log(state?.dataUpdatedAt)
	* ```
	*/
	getQueryState(queryKey) {
		const options = this.defaultQueryOptions({ queryKey });
		return this.#queryCache.get(options.queryHash)?.state;
	}
	/**
	* Removes queries from the cache that match the given filters. Unlike
	* {@link QueryClient#invalidateQueries} or {@link QueryClient#refetchQueries}, this removes
	* matching queries from the cache instead of refetching them. Without filters, every query in
	* the cache is removed.
	* @param filters - The filters that select which queries to remove. Without filters, every query
	* is removed.
	* @example
	* ```ts
	* queryClient.removeQueries({ queryKey: ['posts'], exact: true })
	* ```
	*/
	removeQueries(filters) {
		const queryCache = this.#queryCache;
		notifyManager.batch(() => {
			queryCache.findAll(filters).forEach((query) => {
				queryCache.remove(query);
			});
		});
	}
	/**
	* Resets queries matching the given filters back to their initial state (e.g. any
	* `initialData`), notifying subscribers rather than removing them. Active queries among the
	* matched set are then refetched, and the returned promise resolves once that refetch settles.
	* @param filters - The filters that select which queries to reset. Without filters, every query
	* is reset.
	* @param options - Passed to the refetch of the active matched queries, e.g. `cancelRefetch` and
	* `throwOnError`.
	* @returns A promise that resolves once the refetch of the active matched queries settles.
	* @example
	* ```ts
	* await queryClient.resetQueries({ queryKey: ['posts'], exact: true })
	* ```
	*/
	resetQueries(filters, options) {
		const queryCache = this.#queryCache;
		return notifyManager.batch(() => {
			const matched = queryCache.findAll(filters);
			const queriesToRefetch = new Set(matched);
			matched.forEach((query) => {
				query.reset();
			});
			return this.refetchQueries({
				type: "active",
				predicate: (query) => queriesToRefetch.has(query)
			}, options);
		});
	}
	/**
	* Cancels outgoing fetches for queries matching the given filters. Most useful when performing
	* optimistic updates, since any outgoing refetch that resolves afterwards would otherwise
	* overwrite the optimistic update. By default (`revert: true`), a cancelled query's data is
	* reverted to its state before the outgoing fetch started.
	*
	* The returned promise never rejects, even if individual cancellations fail.
	* @param filters - The filters that select which queries to cancel. Without filters, every query
	* is cancelled.
	* @param cancelOptions - Passed to each matched query's cancellation. `revert` defaults to
	* `true`.
	* @returns A promise that resolves once every cancellation has settled.
	* @example
	* ```ts
	* await queryClient.cancelQueries({ queryKey: ['posts'], exact: true })
	* ```
	*/
	cancelQueries(filters, cancelOptions = {}) {
		const defaultedCancelOptions = {
			revert: true,
			...cancelOptions
		};
		const promises = notifyManager.batch(() => this.#queryCache.findAll(filters).map((query) => query.cancel(defaultedCancelOptions)));
		return Promise.all(promises).then(noop).catch(noop);
	}
	/**
	* Marks queries matching the given filters as invalidated. Unlike
	* {@link QueryClient#removeQueries}, invalidated queries stay in the cache.
	*
	* Unless `filters.refetchType` is `'none'`, matching queries are then refetched via
	* {@link QueryClient#refetchQueries}, using `filters.refetchType` if set, otherwise
	* `filters.type`, otherwise `'active'`.
	* @param filters - The filters that select which queries to invalidate, plus `refetchType` to
	* control which of them to refetch afterwards. Without filters, every query is invalidated.
	* @param options - Passed to {@link QueryClient#refetchQueries}, e.g. `cancelRefetch` and
	* `throwOnError`.
	* @returns A promise that resolves once the refetch settles, or immediately if `refetchType` is
	* `'none'`.
	* @example
	* ```ts
	* await queryClient.invalidateQueries({ queryKey: ['posts'], refetchType: 'active' })
	* ```
	*/
	invalidateQueries(filters, options = {}) {
		return notifyManager.batch(() => {
			this.#queryCache.findAll(filters).forEach((query) => {
				query.invalidate();
			});
			if (filters?.refetchType === "none") return Promise.resolve();
			return this.refetchQueries({
				...filters,
				type: filters?.refetchType ?? filters?.type ?? "active"
			}, options);
		});
	}
	/**
	* Refetches queries matching the given filters, regardless of whether they are stale. Without
	* filters, every query in the cache is refetched. Queries that are disabled, or static (only
	* have observers with a static `staleTime`), are never refetched.
	*
	* By default (`cancelRefetch: true`), a currently running fetch is cancelled before the new
	* one starts. The returned promise resolves once all matching queries have settled; it does
	* not reject on individual query failures unless `throwOnError` is set.
	* @param filters - The filters that select which queries to refetch. Without filters, every query
	* in the cache is included.
	* @param options - Set `cancelRefetch` to `false` to keep a running fetch instead of cancelling
	* it, and `throwOnError` to `true` to reject when a refetch fails.
	* @returns A promise that resolves once every matched query has settled.
	* @example
	* ```ts
	* // refetch all active queries partially matching a query key:
	* await queryClient.refetchQueries({ queryKey: ['posts'], type: 'active' })
	* ```
	*/
	refetchQueries(filters, options = {}) {
		const fetchOptions = {
			...options,
			cancelRefetch: options.cancelRefetch ?? true
		};
		const promises = notifyManager.batch(() => this.#queryCache.findAll(filters).filter((query) => !query.isDisabled() && !query.isStatic()).map((query) => {
			let promise = query.fetch(void 0, fetchOptions);
			if (!fetchOptions.throwOnError) promise = promise.catch(noop);
			return query.state.fetchStatus === "paused" ? Promise.resolve() : promise;
		}));
		return Promise.all(promises).then(noop);
	}
	/**
	* Asynchronous method to fetch and cache a query, resolving with the data or throwing with
	* the error.
	*
	* If the query already exists in the cache and its data is not stale (per the given
	* `staleTime`), the cached data is returned without fetching. Otherwise, the query is fetched
	* and the promise resolves once the fetch settles. If a `select` function is provided, it is
	* applied to the data in both cases (cached or freshly fetched) before it is returned.
	*
	* Unlike a reactive observer, retries are disabled by default here (`retry: false`) unless
	* explicitly configured, since there is no component to catch a thrown error and retry through
	* re-render.
	*
	* The accepted options are `QueryObserverOptions` minus the fields that only make sense for a
	* reactive observer — `enabled`, `refetchInterval`, `refetchIntervalInBackground`,
	* `refetchOnWindowFocus`, `refetchOnReconnect`, `refetchOnMount`, `retryOnMount`,
	* `notifyOnChangeProps`, `throwOnError`, `suspense`, and `placeholderData` are not part of this
	* method's options.
	*
	* This method replaces the deprecated `fetchQuery`, and — combined with
	* `{ staleTime: 'static' }` — the deprecated `ensureQueryData`.
	* @param options - The query options, including the `queryKey` and the `queryFn` used if the
	* query needs to fetch.
	* @returns A promise that resolves to the data, or to the result of `select` if provided. It
	* rejects with the error from the fetch or from `select`.
	* @example
	* ```ts
	* try {
	*   const data = await queryClient.query({ queryKey, queryFn, staleTime: 10000 })
	* } catch (error) {
	*   console.log(error)
	* }
	* ```
	*/
	async query(options) {
		const defaultedOptions = this.defaultQueryOptions(options);
		if (defaultedOptions.retry === void 0) defaultedOptions.retry = false;
		const query = this.#queryCache.build(this, defaultedOptions);
		const queryData = query.isStaleByTime(resolveQueryValue(defaultedOptions.staleTime, query)) ? await query.fetch(defaultedOptions) : query.state.data;
		const select = defaultedOptions.select;
		if (select) return select(queryData);
		return queryData;
	}
	/**
	* Fetches and caches a query, or returns its cached data if it isn't stale. Unlike in observers,
	* the fetch isn't retried unless `retry` is set.
	* @param options - The query options, including the `queryKey` and the `queryFn` used if the
	* query needs to fetch.
	* @returns A promise that resolves to the cached or fetched data, or rejects with the fetch
	* error.
	* @deprecated Use queryClient.query(options) instead. This method will be removed in the next major version.
	*/
	fetchQuery(options) {
		const defaultedOptions = this.defaultQueryOptions(options);
		if (defaultedOptions.retry === void 0) defaultedOptions.retry = false;
		const query = this.#queryCache.build(this, defaultedOptions);
		return query.isStaleByTime(resolveQueryValue(defaultedOptions.staleTime, query)) ? query.fetch(defaultedOptions) : Promise.resolve(query.state.data);
	}
	/**
	* Fetches and caches a query like {@link QueryClient#fetchQuery}, but ignores the result and any
	* error.
	* @param options - The query options, including the `queryKey` and the `queryFn` used if the
	* query needs to fetch.
	* @returns A promise that resolves once the fetch settles. It never rejects.
	* @deprecated Use queryClient.query(options) instead. You can swallow errors with `.catch(noop)`. This method will be removed in the next major version.
	*/
	prefetchQuery(options) {
		return this.fetchQuery(options).then(noop).catch(noop);
	}
	/**
	* Asynchronous method to fetch and cache an infinite query, resolving with an
	* {@link InfiniteData} object or throwing with the error.
	*
	* Behaves like {@link QueryClient#query}, accepting the same options (minus
	* `initialPageParam`), plus the required `initialPageParam`, and an optional `pages` /
	* `getNextPageParam` pair used to refetch a fixed number of pages from the start.
	*
	* This method replaces the deprecated `fetchInfiniteQuery`, and — combined with
	* `{ staleTime: 'static' }` — the deprecated `ensureInfiniteQueryData`.
	* @param options - The infinite query options, including the `queryKey`, the `queryFn`, and the
	* `initialPageParam`.
	* @returns A promise that resolves to the {@link InfiniteData}, or to the result of `select` if
	* provided. It rejects with the error from the fetch or from `select`.
	* @example
	* ```ts
	* try {
	*   const data = await queryClient.infiniteQuery({ queryKey, queryFn, initialPageParam: 0 })
	*   console.log(data.pages)
	* } catch (error) {
	*   console.log(error)
	* }
	* ```
	*/
	infiniteQuery(options) {
		options._type = "infinite";
		return this.query(options);
	}
	/**
	* Fetches and caches an infinite query, or returns its cached data if it isn't stale.
	* @param options - The infinite query options, including the `queryKey`, the `queryFn`, and the
	* `initialPageParam`.
	* @returns A promise that resolves to the cached or fetched {@link InfiniteData}, or rejects with
	* the fetch error.
	* @deprecated Use queryClient.infiniteQuery(options) instead. This method will be removed in the next major version.
	*/
	fetchInfiniteQuery(options) {
		options._type = "infinite";
		return this.fetchQuery(options);
	}
	/**
	* Fetches and caches an infinite query like {@link QueryClient#fetchInfiniteQuery}, but ignores
	* the result and any error.
	* @param options - The infinite query options, including the `queryKey`, the `queryFn`, and the
	* `initialPageParam`.
	* @returns A promise that resolves once the fetch settles. It never rejects.
	* @deprecated Use queryClient.infiniteQuery(options) instead. You can swallow errors with `.catch(noop)`. This method will be removed in the next major version.
	*/
	prefetchInfiniteQuery(options) {
		return this.fetchInfiniteQuery(options).then(noop).catch(noop);
	}
	/**
	* Returns the cached data of an infinite query, or fetches it if there is none. With
	* `revalidateIfStale`, stale cached data is also refetched in the background.
	* @param options - The infinite query options. If the query has no cached data yet, it is fetched
	* with these options.
	* @returns A promise that resolves to the cached {@link InfiniteData}, or to the fetched data if
	* nothing was cached yet.
	* @deprecated Use queryClient.infiniteQuery({ ...options, staleTime: 'static' }) instead. This method will be removed in the next major version.
	*/
	ensureInfiniteQueryData(options) {
		options._type = "infinite";
		return this.ensureQueryData(options);
	}
	/**
	* Resumes mutations that were paused because there was no network connection. Does nothing
	* (resolving immediately) if the client is currently offline.
	* @returns A promise that resolves once the resumed mutations have settled.
	* @example
	* ```ts
	* import { QueryClient } from '@tanstack/query-core'
	*
	* const queryClient = new QueryClient()
	* await queryClient.resumePausedMutations()
	* ```
	*/
	resumePausedMutations() {
		if (onlineManager.isOnline()) return this.#mutationCache.resumePausedMutations();
		return Promise.resolve();
	}
	/**
	* Returns the query cache this client is connected to.
	* @returns The {@link QueryCache} instance.
	* @example
	* ```ts
	* import { QueryClient } from '@tanstack/query-core'
	*
	* const queryClient = new QueryClient()
	* const queryCache = queryClient.getQueryCache()
	* const queries = queryCache.findAll({ queryKey: ['posts'] })
	* ```
	*/
	getQueryCache() {
		return this.#queryCache;
	}
	/**
	* Returns the mutation cache this client is connected to.
	* @returns The {@link MutationCache} instance.
	* @example
	* ```ts
	* import { QueryClient } from '@tanstack/query-core'
	*
	* const queryClient = new QueryClient()
	* const mutationCache = queryClient.getMutationCache()
	* const mutations = mutationCache.findAll({ status: 'pending' })
	* ```
	*/
	getMutationCache() {
		return this.#mutationCache;
	}
	/**
	* Returns the default options that were set when creating the client, or via
	* {@link QueryClient#setDefaultOptions}.
	* @returns The client's current default options.
	* @example
	* ```ts
	* import { QueryClient } from '@tanstack/query-core'
	*
	* const queryClient = new QueryClient()
	* const defaultOptions = queryClient.getDefaultOptions()
	* ```
	*/
	getDefaultOptions() {
		return this.#defaultOptions;
	}
	/**
	* Dynamically sets the default options for this client, overwriting any previously defined
	* default options.
	* @param options - The new default options for queries and mutations.
	* @see {@link QueryClient#getDefaultOptions}
	* @example
	* ```ts
	* import { QueryClient } from '@tanstack/query-core'
	*
	* const queryClient = new QueryClient()
	* queryClient.setDefaultOptions({
	*   queries: {
	*     staleTime: Infinity,
	*   },
	* })
	* ```
	*/
	setDefaultOptions(options) {
		this.#defaultOptions = options;
	}
	/**
	* Sets default options for queries whose query key partially matches the given `queryKey`.
	*
	* If several registered query defaults match a given query key, they are merged together in
	* registration order by {@link QueryClient#getQueryDefaults}, so register defaults from the
	* most generic key to the least generic one — more specific defaults should be registered
	* after more generic ones so they take precedence.
	* @param queryKey - The query key that query keys are partially matched against.
	* @param options - The default options applied to matching queries.
	* @example
	* ```ts
	* queryClient.setQueryDefaults(['posts'], { queryFn: fetchPosts })
	*
	* await queryClient.query({ queryKey: ['posts'] })
	* ```
	*/
	setQueryDefaults(queryKey, options) {
		this.#queryDefaults.set(hashKey(queryKey), {
			queryKey,
			defaultOptions: options
		});
	}
	/**
	* Returns the default options registered for queries whose query key partially matches the
	* given `queryKey`, via {@link QueryClient#setQueryDefaults}. If multiple registered defaults
	* match, they are merged together in registration order.
	* @param queryKey - The query key to look up registered defaults for.
	* @returns The merged default options of every registration that matches, or an empty object if
	* none match.
	* @example
	* ```ts
	* const defaultOptions = queryClient.getQueryDefaults(['posts'])
	* ```
	*/
	getQueryDefaults(queryKey) {
		const defaults = [...this.#queryDefaults.values()];
		const result = {};
		defaults.forEach((queryDefault) => {
			if (partialMatchKey(queryKey, queryDefault.queryKey)) Object.assign(result, queryDefault.defaultOptions);
		});
		return result;
	}
	/**
	* Sets default options for mutations whose mutation key partially matches the given
	* `mutationKey`. As with {@link QueryClient#setQueryDefaults}, the order of registration
	* matters when several registered defaults match the same mutation key.
	* @param mutationKey - The mutation key that mutation keys are partially matched against.
	* @param options - The default options applied to matching mutations.
	* @see {@link QueryClient#getMutationDefaults}
	* @example
	* ```ts
	* queryClient.setMutationDefaults(['addPost'], { mutationFn: addPost })
	* ```
	*/
	setMutationDefaults(mutationKey, options) {
		this.#mutationDefaults.set(hashKey(mutationKey), {
			mutationKey,
			defaultOptions: options
		});
	}
	/**
	* Returns the default options registered for mutations whose mutation key partially matches
	* the given `mutationKey`, via {@link QueryClient#setMutationDefaults}. If multiple registered
	* defaults match, they are merged together in registration order.
	* @param mutationKey - The mutation key to look up registered defaults for.
	* @returns The merged default options of every registration that matches, or an empty object if
	* none match.
	* @example
	* ```ts
	* const defaultOptions = queryClient.getMutationDefaults(['addPost'])
	* ```
	*/
	getMutationDefaults(mutationKey) {
		const defaults = [...this.#mutationDefaults.values()];
		const result = {};
		defaults.forEach((queryDefault) => {
			if (partialMatchKey(mutationKey, queryDefault.mutationKey)) Object.assign(result, queryDefault.defaultOptions);
		});
		return result;
	}
	/**
	* Called by framework adapters (e.g. inside `useQuery`) to resolve the options passed by the
	* caller into their final, defaulted form: merging the client's own `defaultOptions.queries`,
	* then `queryClient.setQueryDefaults` for the given `queryKey`, then the caller's options on
	* top. A no-op if the options are already defaulted (`_defaulted: true`).
	* @param options - The query options passed by the caller.
	* @returns The defaulted options, with `queryHash` and dependent defaults (e.g.
	* `refetchOnReconnect`) filled in.
	*/
	defaultQueryOptions(options) {
		if (options._defaulted) return options;
		const defaultedOptions = {
			...this.#defaultOptions.queries,
			...this.getQueryDefaults(options.queryKey),
			...options,
			_defaulted: true
		};
		if (!defaultedOptions.queryHash) defaultedOptions.queryHash = hashQueryKeyByOptions(defaultedOptions.queryKey, defaultedOptions);
		if (defaultedOptions.refetchOnReconnect === void 0) defaultedOptions.refetchOnReconnect = defaultedOptions.networkMode !== "always";
		if (defaultedOptions.throwOnError === void 0) defaultedOptions.throwOnError = !!defaultedOptions.suspense;
		if (!defaultedOptions.networkMode && defaultedOptions.persister) defaultedOptions.networkMode = "offlineFirst";
		if (defaultedOptions.queryFn === skipToken) defaultedOptions.enabled = false;
		return defaultedOptions;
	}
	/**
	* The mutation counterpart of {@link QueryClient#defaultQueryOptions}. Called by framework
	* adapters (e.g. inside `useMutation`) to merge the client's `defaultOptions.mutations`, then
	* `queryClient.setMutationDefaults` for the given `mutationKey`, then the caller's options on
	* top. A no-op if the options are already defaulted (`_defaulted: true`).
	* @param options - The mutation options passed by the caller.
	* @returns The defaulted options.
	*/
	defaultMutationOptions(options) {
		if (options?._defaulted) return options;
		return {
			...this.#defaultOptions.mutations,
			...options?.mutationKey && this.getMutationDefaults(options.mutationKey),
			...options,
			_defaulted: true
		};
	}
	/**
	* Clears both the query cache and the mutation cache this client is connected to.
	* @example
	* ```ts
	* import { QueryClient } from '@tanstack/query-core'
	*
	* const queryClient = new QueryClient()
	* queryClient.clear()
	* ```
	*/
	clear() {
		this.#queryCache.clear();
		this.#mutationCache.clear();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/streamedQuery.js
/**
* This is a helper function to create a query function that streams data from an AsyncIterable.
* Data will be an Array of all the chunks received.
* The query will be in a 'pending' state until the first chunk of data is received, but will go to 'success' after that.
* The query will stay in fetchStatus 'fetching' until the stream ends.
* @param options - The `streamFn` that returns an AsyncIterable to stream data from, and the optional
* `refetchMode`, `reducer`, and `initialValue` options.
* @returns A query function to pass as `queryFn`.
* @example
* ```ts
* await queryClient.query({
*   queryKey: ['data'],
*   queryFn: streamedQuery({
*     streamFn: fetchDataInChunks,
*   }),
* })
* ```
*/
function streamedQuery({ streamFn, refetchMode = "reset", reducer = (items, chunk) => addToEnd(items, chunk), initialValue = [] }) {
	return async (context) => {
		const query = context.client.getQueryCache().find({
			queryKey: context.queryKey,
			exact: true
		});
		const isRefetch = !!query && query.isFetched();
		if (isRefetch && refetchMode === "reset") query.setState({
			...query.resetState,
			fetchStatus: "fetching"
		});
		let result = initialValue;
		let cancelled = false;
		const stream = await streamFn(addConsumeAwareSignal({
			client: context.client,
			meta: context.meta,
			queryKey: context.queryKey,
			pageParam: context.pageParam,
			direction: context.direction
		}, () => context.signal, () => cancelled = true));
		const isReplaceRefetch = isRefetch && refetchMode === "replace";
		for await (const chunk of stream) {
			if (cancelled) break;
			if (isReplaceRefetch) result = reducer(result, chunk);
			else context.client.setQueryData(context.queryKey, (prev) => reducer(prev === void 0 ? initialValue : prev, chunk));
		}
		if (isReplaceRefetch && !cancelled) context.client.setQueryData(context.queryKey, result);
		const data = context.client.getQueryData(context.queryKey);
		return data === void 0 ? initialValue : data;
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+query-core@5.104.5/node_modules/@tanstack/query-core/build/modern/types.js
/* istanbul ignore file */
var dataTagSymbol = Symbol();
var dataTagErrorSymbol = Symbol();
var unsetMarker = Symbol();
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/queryCache.js
/**
* Vue-aware subclass of `@tanstack/query-core`'s `QueryCache`. `find`/`findAll` also accept a
* {@link MaybeRefDeep} filters object, so `ref`s can be passed directly without unwrapping. Access it via
* `queryClient.getQueryCache()` — `QueryClient` constructs one of these by default.
*/
var QueryCache = class extends QueryCache$1 {
	find(filters) {
		return super.find(cloneDeepUnref(filters));
	}
	findAll(filters = {}) {
		return super.findAll(cloneDeepUnref(filters));
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/mutationCache.js
/**
* Vue-aware subclass of `@tanstack/query-core`'s `MutationCache`. `find`/`findAll` also accept a
* {@link MaybeRefDeep} filters object, so `ref`s can be passed directly without unwrapping. Access it via
* `queryClient.getMutationCache()` — `QueryClient` constructs one of these by default.
*/
var MutationCache = class extends MutationCache$1 {
	find(filters) {
		return super.find(cloneDeepUnref(filters));
	}
	findAll(filters = {}) {
		return super.findAll(cloneDeepUnref(filters));
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/queryClient.js
/**
* Vue-aware subclass of `@tanstack/query-core`'s `QueryClient`. Methods that accept `options` (such as
* `CancelOptions` or `InvalidateOptions`) or filters (such as the `QueryFilters` accepted by
* `invalidateQueries`) also accept a {@link MaybeRefDeep} version of it, so you can pass `ref`s directly
* without unwrapping them yourself — e.g. `queryClient.invalidateQueries({ queryKey: ['post', myRef] })`.
*
* `ref` entries in a `queryKey` are unwrapped this way on every method, but reactive getter entries
* (`() => id.value`) are only unwrapped when the `queryKey` is passed as a `queryKey` property of a
* filters/options object (e.g. `invalidateQueries({ queryKey: ['post', idGetter] })`) — methods like
* `getQueryData` that take the `queryKey` array as their own argument do not unwrap getter entries there,
* and the getter function itself ends up in the cache key.
*
* Install one on your app with `VueQueryPlugin`, or retrieve it with `useQueryClient`.
*/
var QueryClient = class extends QueryClient$1 {
	constructor(config = {}) {
		const vueQueryConfig = {
			defaultOptions: config.defaultOptions,
			queryCache: config.queryCache || new QueryCache(),
			mutationCache: config.mutationCache || new MutationCache()
		};
		super(vueQueryConfig);
		this.isRestoring = ref(false);
	}
	isFetching(filters = {}) {
		return super.isFetching(cloneDeepUnref(filters));
	}
	isMutating(filters = {}) {
		return super.isMutating(cloneDeepUnref(filters));
	}
	getQueryData(queryKey) {
		return super.getQueryData(cloneDeepUnref(queryKey));
	}
	ensureQueryData(options) {
		return super.ensureQueryData(cloneDeepUnref(options));
	}
	getQueriesData(filters) {
		return super.getQueriesData(cloneDeepUnref(filters));
	}
	setQueryData(queryKey, updater, options = {}) {
		return super.setQueryData(cloneDeepUnref(queryKey), updater, cloneDeepUnref(options));
	}
	setQueriesData(filters, updater, options = {}) {
		return super.setQueriesData(cloneDeepUnref(filters), updater, cloneDeepUnref(options));
	}
	getQueryState(queryKey) {
		return super.getQueryState(cloneDeepUnref(queryKey));
	}
	removeQueries(filters = {}) {
		return super.removeQueries(cloneDeepUnref(filters));
	}
	resetQueries(filters = {}, options = {}) {
		return super.resetQueries(cloneDeepUnref(filters), cloneDeepUnref(options));
	}
	cancelQueries(filters = {}, options = {}) {
		return super.cancelQueries(cloneDeepUnref(filters), cloneDeepUnref(options));
	}
	invalidateQueries(filters = {}, options = {}) {
		const filtersCloned = cloneDeepUnref(filters);
		const optionsCloned = cloneDeepUnref(options);
		super.invalidateQueries({
			...filtersCloned,
			refetchType: "none"
		}, optionsCloned);
		if (filtersCloned.refetchType === "none") return Promise.resolve();
		const refetchFilters = {
			...filtersCloned,
			type: filtersCloned.refetchType ?? filtersCloned.type ?? "active"
		};
		return nextTick().then(() => {
			return super.refetchQueries(refetchFilters, optionsCloned);
		});
	}
	refetchQueries(filters = {}, options = {}) {
		return super.refetchQueries(cloneDeepUnref(filters), cloneDeepUnref(options));
	}
	query(options) {
		return super.query(cloneDeepUnref(options));
	}
	fetchQuery(options) {
		return super.fetchQuery(cloneDeepUnref(options));
	}
	prefetchQuery(options) {
		return super.prefetchQuery(cloneDeepUnref(options));
	}
	infiniteQuery(options) {
		return super.infiniteQuery(cloneDeepUnref(options));
	}
	fetchInfiniteQuery(options) {
		return super.fetchInfiniteQuery(cloneDeepUnref(options));
	}
	prefetchInfiniteQuery(options) {
		return super.prefetchInfiniteQuery(cloneDeepUnref(options));
	}
	setDefaultOptions(options) {
		super.setDefaultOptions(cloneDeepUnref(options));
	}
	setQueryDefaults(queryKey, options) {
		super.setQueryDefaults(cloneDeepUnref(queryKey), cloneDeepUnref(options));
	}
	getQueryDefaults(queryKey) {
		return super.getQueryDefaults(cloneDeepUnref(queryKey));
	}
	setMutationDefaults(mutationKey, options) {
		super.setMutationDefaults(cloneDeepUnref(mutationKey), cloneDeepUnref(options));
	}
	getMutationDefaults(mutationKey) {
		return super.getMutationDefaults(cloneDeepUnref(mutationKey));
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/devtools/utils.js
/**
* Returns the devtools state of a query: fetching, paused, inactive (no observers), stale, or fresh,
* checked in that order.
* @param query - The query to check.
* @returns A `QueryState` value, used to label, color, and sort the query.
*/
function getQueryState(query) {
	if (query.state.fetchStatus === "fetching") return 0;
	if (query.state.fetchStatus === "paused") return 4;
	if (!query.getObserversCount()) return 3;
	if (query.isStale()) return 2;
	return 1;
}
/**
* Returns the label of a query's devtools state, shown in the inspector.
* @param query - The query to label.
* @returns `'fetching'`, `'paused'`, `'stale'`, `'inactive'`, or `'fresh'`.
*/
function getQueryStateLabel(query) {
	const queryState = getQueryState(query);
	if (queryState === 0) return "fetching";
	if (queryState === 4) return "paused";
	if (queryState === 2) return "stale";
	if (queryState === 3) return "inactive";
	return "fresh";
}
/**
* Returns the text color of a query's state label in the inspector.
* @param query - The query to get the color for.
* @returns Black for stale queries, otherwise white, as a hex number.
*/
function getQueryStatusFg(query) {
	if (getQueryState(query) === 2) return 0;
	return 16777215;
}
/**
* Returns the background color of a query's state label in the inspector.
* @param query - The query to get the color for.
* @returns The color for the query's state, as a hex number.
*/
function getQueryStatusBg(query) {
	const queryState = getQueryState(query);
	if (queryState === 0) return 27647;
	if (queryState === 4) return 9193963;
	if (queryState === 2) return 16757248;
	if (queryState === 3) return 4148832;
	return 33575;
}
var queryHashSort = (a, b) => a.queryHash.localeCompare(b.queryHash);
var dateSort = (a, b) => a.state.dataUpdatedAt < b.state.dataUpdatedAt ? 1 : -1;
var statusAndDateSort = (a, b) => {
	if (getQueryState(a) === getQueryState(b)) return dateSort(a, b);
	return getQueryState(a) > getQueryState(b) ? 1 : -1;
};
var sortFns = {
	"Status > Last Updated": statusAndDateSort,
	"Query Hash": queryHashSort,
	"Last Updated": dateSort
};
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+match-sorter-utils@9.2.6/node_modules/@tanstack/match-sorter-utils/dist/remove-accents.js
var characterMap = {
	À: "A",
	Á: "A",
	Â: "A",
	Ã: "A",
	Ä: "A",
	Å: "A",
	Ấ: "A",
	Ắ: "A",
	Ẳ: "A",
	Ẵ: "A",
	Ặ: "A",
	Æ: "AE",
	Ầ: "A",
	Ằ: "A",
	Ȃ: "A",
	Ç: "C",
	Ḉ: "C",
	È: "E",
	É: "E",
	Ê: "E",
	Ë: "E",
	Ế: "E",
	Ḗ: "E",
	Ề: "E",
	Ḕ: "E",
	Ḝ: "E",
	Ȇ: "E",
	Ì: "I",
	Í: "I",
	Î: "I",
	Ï: "I",
	Ḯ: "I",
	Ȋ: "I",
	Ð: "D",
	Ñ: "N",
	Ò: "O",
	Ó: "O",
	Ô: "O",
	Õ: "O",
	Ö: "O",
	Ø: "O",
	Ố: "O",
	Ṍ: "O",
	Ṓ: "O",
	Ȏ: "O",
	Ù: "U",
	Ú: "U",
	Û: "U",
	Ü: "U",
	Ý: "Y",
	à: "a",
	á: "a",
	â: "a",
	ã: "a",
	ä: "a",
	å: "a",
	ấ: "a",
	ắ: "a",
	ẳ: "a",
	ẵ: "a",
	ặ: "a",
	æ: "ae",
	ầ: "a",
	ằ: "a",
	ȃ: "a",
	ç: "c",
	ḉ: "c",
	è: "e",
	é: "e",
	ê: "e",
	ë: "e",
	ế: "e",
	ḗ: "e",
	ề: "e",
	ḕ: "e",
	ḝ: "e",
	ȇ: "e",
	ì: "i",
	í: "i",
	î: "i",
	ï: "i",
	ḯ: "i",
	ȋ: "i",
	ð: "d",
	ñ: "n",
	ò: "o",
	ó: "o",
	ô: "o",
	õ: "o",
	ö: "o",
	ø: "o",
	ố: "o",
	ṍ: "o",
	ṓ: "o",
	ȏ: "o",
	ù: "u",
	ú: "u",
	û: "u",
	ü: "u",
	ý: "y",
	ÿ: "y",
	Ā: "A",
	ā: "a",
	Ă: "A",
	ă: "a",
	Ą: "A",
	ą: "a",
	Ć: "C",
	ć: "c",
	Ĉ: "C",
	ĉ: "c",
	Ċ: "C",
	ċ: "c",
	Č: "C",
	č: "c",
	C̆: "C",
	c̆: "c",
	Ď: "D",
	ď: "d",
	Đ: "D",
	đ: "d",
	Ē: "E",
	ē: "e",
	Ĕ: "E",
	ĕ: "e",
	Ė: "E",
	ė: "e",
	Ę: "E",
	ę: "e",
	Ě: "E",
	ě: "e",
	Ĝ: "G",
	Ǵ: "G",
	ĝ: "g",
	ǵ: "g",
	Ğ: "G",
	ğ: "g",
	Ġ: "G",
	ġ: "g",
	Ģ: "G",
	ģ: "g",
	Ĥ: "H",
	ĥ: "h",
	Ħ: "H",
	ħ: "h",
	Ḫ: "H",
	ḫ: "h",
	Ĩ: "I",
	ĩ: "i",
	Ī: "I",
	ī: "i",
	Ĭ: "I",
	ĭ: "i",
	Į: "I",
	į: "i",
	İ: "I",
	ı: "i",
	Ĳ: "IJ",
	ĳ: "ij",
	Ĵ: "J",
	ĵ: "j",
	Ķ: "K",
	ķ: "k",
	Ḱ: "K",
	ḱ: "k",
	K̆: "K",
	k̆: "k",
	Ĺ: "L",
	ĺ: "l",
	Ļ: "L",
	ļ: "l",
	Ľ: "L",
	ľ: "l",
	Ŀ: "L",
	ŀ: "l",
	Ł: "l",
	ł: "l",
	Ḿ: "M",
	ḿ: "m",
	M̆: "M",
	m̆: "m",
	Ń: "N",
	ń: "n",
	Ņ: "N",
	ņ: "n",
	Ň: "N",
	ň: "n",
	ŉ: "n",
	N̆: "N",
	n̆: "n",
	Ō: "O",
	ō: "o",
	Ŏ: "O",
	ŏ: "o",
	Ő: "O",
	ő: "o",
	Œ: "OE",
	œ: "oe",
	P̆: "P",
	p̆: "p",
	Ŕ: "R",
	ŕ: "r",
	Ŗ: "R",
	ŗ: "r",
	Ř: "R",
	ř: "r",
	R̆: "R",
	r̆: "r",
	Ȓ: "R",
	ȓ: "r",
	Ś: "S",
	ś: "s",
	Ŝ: "S",
	ŝ: "s",
	Ş: "S",
	Ș: "S",
	ș: "s",
	ş: "s",
	Š: "S",
	š: "s",
	Ţ: "T",
	ţ: "t",
	ț: "t",
	Ț: "T",
	Ť: "T",
	ť: "t",
	Ŧ: "T",
	ŧ: "t",
	T̆: "T",
	t̆: "t",
	Ũ: "U",
	ũ: "u",
	Ū: "U",
	ū: "u",
	Ŭ: "U",
	ŭ: "u",
	Ů: "U",
	ů: "u",
	Ű: "U",
	ű: "u",
	Ų: "U",
	ų: "u",
	Ȗ: "U",
	ȗ: "u",
	V̆: "V",
	v̆: "v",
	Ŵ: "W",
	ŵ: "w",
	Ẃ: "W",
	ẃ: "w",
	X̆: "X",
	x̆: "x",
	Ŷ: "Y",
	ŷ: "y",
	Ÿ: "Y",
	Y̆: "Y",
	y̆: "y",
	Ź: "Z",
	ź: "z",
	Ż: "Z",
	ż: "z",
	Ž: "Z",
	ž: "z",
	ſ: "s",
	ƒ: "f",
	Ơ: "O",
	ơ: "o",
	Ư: "U",
	ư: "u",
	Ǎ: "A",
	ǎ: "a",
	Ǐ: "I",
	ǐ: "i",
	Ǒ: "O",
	ǒ: "o",
	Ǔ: "U",
	ǔ: "u",
	Ǖ: "U",
	ǖ: "u",
	Ǘ: "U",
	ǘ: "u",
	Ǚ: "U",
	ǚ: "u",
	Ǜ: "U",
	ǜ: "u",
	Ứ: "U",
	ứ: "u",
	Ṹ: "U",
	ṹ: "u",
	Ǻ: "A",
	ǻ: "a",
	Ǽ: "AE",
	ǽ: "ae",
	Ǿ: "O",
	ǿ: "o",
	Þ: "TH",
	þ: "th",
	Ṕ: "P",
	ṕ: "p",
	Ṥ: "S",
	ṥ: "s",
	X́: "X",
	x́: "x",
	Ѓ: "Г",
	ѓ: "г",
	Ќ: "К",
	ќ: "к",
	A̋: "A",
	a̋: "a",
	E̋: "E",
	e̋: "e",
	I̋: "I",
	i̋: "i",
	Ǹ: "N",
	ǹ: "n",
	Ồ: "O",
	ồ: "o",
	Ṑ: "O",
	ṑ: "o",
	Ừ: "U",
	ừ: "u",
	Ẁ: "W",
	ẁ: "w",
	Ỳ: "Y",
	ỳ: "y",
	Ȁ: "A",
	ȁ: "a",
	Ȅ: "E",
	ȅ: "e",
	Ȉ: "I",
	ȉ: "i",
	Ȍ: "O",
	ȍ: "o",
	Ȑ: "R",
	ȑ: "r",
	Ȕ: "U",
	ȕ: "u",
	B̌: "B",
	b̌: "b",
	Č̣: "C",
	č̣: "c",
	Ê̌: "E",
	ê̌: "e",
	F̌: "F",
	f̌: "f",
	Ǧ: "G",
	ǧ: "g",
	Ȟ: "H",
	ȟ: "h",
	J̌: "J",
	ǰ: "j",
	Ǩ: "K",
	ǩ: "k",
	M̌: "M",
	m̌: "m",
	P̌: "P",
	p̌: "p",
	Q̌: "Q",
	q̌: "q",
	Ř̩: "R",
	ř̩: "r",
	Ṧ: "S",
	ṧ: "s",
	V̌: "V",
	v̌: "v",
	W̌: "W",
	w̌: "w",
	X̌: "X",
	x̌: "x",
	Y̌: "Y",
	y̌: "y",
	A̧: "A",
	a̧: "a",
	B̧: "B",
	b̧: "b",
	Ḑ: "D",
	ḑ: "d",
	Ȩ: "E",
	ȩ: "e",
	Ɛ̧: "E",
	ɛ̧: "e",
	Ḩ: "H",
	ḩ: "h",
	I̧: "I",
	i̧: "i",
	Ɨ̧: "I",
	ɨ̧: "i",
	M̧: "M",
	m̧: "m",
	O̧: "O",
	o̧: "o",
	Q̧: "Q",
	q̧: "q",
	U̧: "U",
	u̧: "u",
	X̧: "X",
	x̧: "x",
	Z̧: "Z",
	z̧: "z"
};
var chars = Object.keys(characterMap).join("|");
var allAccents = new RegExp(chars, "g");
function removeAccents(str) {
	return str.replace(allAccents, (match) => {
		return characterMap[match];
	});
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+match-sorter-utils@9.2.6/node_modules/@tanstack/match-sorter-utils/dist/index.js
/**
* @name match-sorter
* @license MIT license.
* @copyright (c) 2099 Kent C. Dodds
* @author Kent C. Dodds <me@kentcdodds.com> (https://kentcdodds.com)
*/
var rankings = {
	CASE_SENSITIVE_EQUAL: 7,
	EQUAL: 6,
	STARTS_WITH: 5,
	WORD_STARTS_WITH: 4,
	CONTAINS: 3,
	ACRONYM: 2,
	MATCHES: 1,
	NO_MATCH: 0
};
/**
* Gets the highest ranking value for the given item based on its values for the given keys
* @param {*} item - the item to rank
* @param {String} value - the value to rank against
* @param {Object} options - options to control the ranking
* @return {{rank: Number, accessorIndex: Number, accessorThreshold: Number}} - the highest ranking
*/
function rankItem(item, value, options) {
	options = options || {};
	options.threshold = options.threshold ?? rankings.MATCHES;
	if (!options.accessors) {
		const rank = getMatchRanking(item, value, options);
		return {
			rankedValue: item,
			rank,
			accessorIndex: -1,
			accessorThreshold: options.threshold,
			passed: rank >= options.threshold
		};
	}
	const valuesToRank = getAllValuesToRank(item, options.accessors);
	const rankingInfo = {
		rankedValue: item,
		rank: rankings.NO_MATCH,
		accessorIndex: -1,
		accessorThreshold: options.threshold,
		passed: false
	};
	for (let i = 0; i < valuesToRank.length; i++) {
		const rankValue = valuesToRank[i];
		let newRank = getMatchRanking(rankValue.itemValue, value, options);
		const { minRanking, maxRanking, threshold = options.threshold } = rankValue.attributes;
		if (newRank < minRanking && newRank >= rankings.MATCHES) newRank = minRanking;
		else if (newRank > maxRanking) newRank = maxRanking;
		newRank = Math.min(newRank, maxRanking);
		if (newRank >= threshold && newRank > rankingInfo.rank) {
			rankingInfo.rank = newRank;
			rankingInfo.passed = true;
			rankingInfo.accessorIndex = i;
			rankingInfo.accessorThreshold = threshold;
			rankingInfo.rankedValue = rankValue.itemValue;
		}
	}
	return rankingInfo;
}
/**
* Gives a rankings score based on how well the two strings match.
* @param {String} testString - the string to test against
* @param {String} stringToRank - the string to rank
* @param {Object} options - options for the match (like keepDiacritics for comparison)
* @returns {Number} the ranking for how well stringToRank matches testString
*/
function getMatchRanking(testString, stringToRank, options) {
	testString = prepareValueForComparison(testString, options);
	stringToRank = prepareValueForComparison(stringToRank, options);
	if (stringToRank.length > testString.length) return rankings.NO_MATCH;
	if (testString === stringToRank) return rankings.CASE_SENSITIVE_EQUAL;
	testString = testString.toLowerCase();
	stringToRank = stringToRank.toLowerCase();
	if (testString === stringToRank) return rankings.EQUAL;
	if (testString.startsWith(stringToRank)) return rankings.STARTS_WITH;
	if (testString.includes(` ${stringToRank}`)) return rankings.WORD_STARTS_WITH;
	if (testString.includes(stringToRank)) return rankings.CONTAINS;
	else if (stringToRank.length === 1) return rankings.NO_MATCH;
	if (getAcronym(testString).includes(stringToRank)) return rankings.ACRONYM;
	return getClosenessRanking(testString, stringToRank);
}
/**
* Generates an acronym for a string.
*
* @param {String} string the string for which to produce the acronym
* @returns {String} the acronym
*/
function getAcronym(string) {
	let acronym = "";
	string.split(" ").forEach((wordInString) => {
		wordInString.split("-").forEach((splitByHyphenWord) => {
			acronym += splitByHyphenWord.substr(0, 1);
		});
	});
	return acronym;
}
/**
* Returns a score based on how spread apart the
* characters from the stringToRank are within the testString.
* A number close to rankings.MATCHES represents a loose match. A number close
* to rankings.MATCHES + 1 represents a tighter match.
* @param {String} testString - the string to test against
* @param {String} stringToRank - the string to rank
* @returns {Number} the number between rankings.MATCHES and
* rankings.MATCHES + 1 for how well stringToRank matches testString
*/
function getClosenessRanking(testString, stringToRank) {
	let matchingInOrderCharCount = 0;
	let charNumber = 0;
	function findMatchingCharacter(matchChar, string, index) {
		for (let j = index, J = string.length; j < J; j++) if (string[j] === matchChar) {
			matchingInOrderCharCount += 1;
			return j + 1;
		}
		return -1;
	}
	function getRanking(spread) {
		const spreadPercentage = 1 / spread;
		const inOrderPercentage = matchingInOrderCharCount / stringToRank.length;
		return rankings.MATCHES + inOrderPercentage * spreadPercentage;
	}
	const firstIndex = findMatchingCharacter(stringToRank[0], testString, 0);
	if (firstIndex < 0) return rankings.NO_MATCH;
	charNumber = firstIndex;
	for (let i = 1, I = stringToRank.length; i < I; i++) {
		const matchChar = stringToRank[i];
		charNumber = findMatchingCharacter(matchChar, testString, charNumber);
		if (!(charNumber > -1)) return rankings.NO_MATCH;
	}
	return getRanking(charNumber - firstIndex);
}
/**
* Prepares value for comparison by stringifying it, removing diacritics (if specified)
* @param {String} value - the value to clean
* @param {Object} options - {keepDiacritics: whether to remove diacritics}
* @return {String} the prepared value
*/
function prepareValueForComparison(value, { keepDiacritics }) {
	value = `${value}`;
	if (!keepDiacritics) value = removeAccents(value);
	return value;
}
/**
* Gets value for key in item at arbitrarily nested keypath
* @param {Object} item - the item
* @param {Object|Function} key - the potentially nested keypath or property callback
* @return {Array} - an array containing the value(s) at the nested keypath
*/
function getItemValues(item, accessor) {
	let accessorFn = accessor;
	if (typeof accessor === "object") accessorFn = accessor.accessor;
	const value = accessorFn(item);
	if (value == null) return [];
	if (Array.isArray(value)) return value;
	return [String(value)];
}
/**
* Gets all the values for the given keys in the given item and returns an array of those values
* @param item - the item from which the values will be retrieved
* @param keys - the keys to use to retrieve the values
* @return objects with {itemValue, attributes}
*/
function getAllValuesToRank(item, accessors) {
	const allValues = [];
	for (let j = 0, J = accessors.length; j < J; j++) {
		const accessor = accessors[j];
		const attributes = getAccessorAttributes(accessor);
		const itemValues = getItemValues(item, accessor);
		for (let i = 0, I = itemValues.length; i < I; i++) allValues.push({
			itemValue: itemValues[i],
			attributes
		});
	}
	return allValues;
}
var defaultKeyAttributes = {
	maxRanking: Infinity,
	minRanking: -Infinity
};
/**
* Gets all the attributes for the given accessor
* @param accessor - the accessor from which the attributes will be retrieved
* @return object containing the accessor's attributes
*/
function getAccessorAttributes(accessor) {
	if (typeof accessor === "function") return defaultKeyAttributes;
	return {
		...defaultKeyAttributes,
		...accessor
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/devtools/devtools.js
var pluginId = "vue-query";
var pluginName = "Vue Query";
/**
* Registers the Vue Query plugin with the Vue devtools, adding a query inspector and a timeline
* layer for query cache events.
* @param app - The Vue app instance.
* @param queryClient - The client whose query cache is shown in the devtools.
*/
function setupDevtools(app, queryClient) {
	setupDevtoolsPlugin({
		id: pluginId,
		label: pluginName,
		packageName: "vue-query",
		homepage: "https://tanstack.com/query/latest",
		logo: "https://raw.githubusercontent.com/TanStack/query/main/packages/vue-query/media/vue-query.svg",
		app,
		settings: {
			baseSort: {
				type: "choice",
				component: "button-group",
				label: "Sort Cache Entries",
				options: [{
					label: "ASC",
					value: 1
				}, {
					label: "DESC",
					value: -1
				}],
				defaultValue: 1
			},
			sortFn: {
				type: "choice",
				label: "Sort Function",
				options: Object.keys(sortFns).map((key) => ({
					label: key,
					value: key
				})),
				defaultValue: Object.keys(sortFns)[0]
			},
			onlineMode: {
				type: "choice",
				component: "button-group",
				label: "Online mode",
				options: [{
					label: "Online",
					value: 1
				}, {
					label: "Offline",
					value: 0
				}],
				defaultValue: 1
			}
		}
	}, (api) => {
		const initialSettings = api.getSettings();
		onlineManager.setOnline(Boolean(initialSettings.onlineMode.valueOf()));
		const queryCache = queryClient.getQueryCache();
		api.addInspector({
			id: pluginId,
			label: pluginName,
			icon: "api",
			nodeActions: [
				{
					icon: "file_download",
					tooltip: "Refetch",
					action: (queryHash) => {
						queryCache.get(queryHash)?.fetch();
					}
				},
				{
					icon: "alarm",
					tooltip: "Invalidate",
					action: (queryHash) => {
						const query = queryCache.get(queryHash);
						queryClient.invalidateQueries({
							queryKey: query.queryKey,
							exact: true
						});
					}
				},
				{
					icon: "settings_backup_restore",
					tooltip: "Reset",
					action: (queryHash) => {
						queryCache.get(queryHash)?.reset();
					}
				},
				{
					icon: "delete",
					tooltip: "Remove",
					action: (queryHash) => {
						const query = queryCache.get(queryHash);
						queryCache.remove(query);
					}
				},
				{
					icon: "hourglass_empty",
					tooltip: "Force loading",
					action: (queryHash) => {
						queryCache.get(queryHash).setState({
							data: void 0,
							status: "pending"
						});
					}
				},
				{
					icon: "error_outline",
					tooltip: "Force error",
					action: (queryHash) => {
						queryCache.get(queryHash).setState({
							data: void 0,
							status: "error",
							error: /* @__PURE__ */ new Error("Unknown error from devtools")
						});
					}
				}
			]
		});
		api.addTimelineLayer({
			id: pluginId,
			label: pluginName,
			color: 16767308
		});
		queryCache.subscribe((event) => {
			api.sendInspectorTree(pluginId);
			api.sendInspectorState(pluginId);
			if ([
				"added",
				"removed",
				"updated"
			].includes(event.type)) api.addTimelineEvent({
				layerId: pluginId,
				event: {
					title: event.type,
					subtitle: event.query.queryHash,
					time: api.now(),
					data: {
						queryHash: event.query.queryHash,
						...event
					}
				}
			});
		});
		api.on.setPluginSettings((payload) => {
			if (payload.key === "onlineMode") onlineManager.setOnline(Boolean(payload.newValue));
		});
		api.on.getInspectorTree((payload) => {
			if (payload.inspectorId === pluginId) {
				const queries = queryCache.getAll();
				const settings = api.getSettings();
				payload.rootNodes = (payload.filter ? queries.filter((item) => rankItem(item.queryHash, payload.filter).passed) : [...queries]).sort((a, b) => sortFns[settings.sortFn](a, b) * settings.baseSort).map((query) => {
					const stateLabel = getQueryStateLabel(query);
					return {
						id: query.queryHash,
						label: query.queryHash,
						tags: [{
							label: `${stateLabel} [${query.getObserversCount()}]`,
							textColor: getQueryStatusFg(query),
							backgroundColor: getQueryStatusBg(query)
						}]
					};
				});
			}
		});
		api.on.getInspectorState((payload) => {
			if (payload.inspectorId === pluginId) {
				const query = queryCache.get(payload.nodeId);
				if (!query) return;
				payload.state = {
					" Query Details": [
						{
							key: "Query key",
							value: query.queryHash
						},
						{
							key: "Query status",
							value: getQueryStateLabel(query)
						},
						{
							key: "Observers",
							value: query.getObserversCount()
						},
						{
							key: "Last Updated",
							value: new Date(query.state.dataUpdatedAt).toLocaleTimeString()
						}
					],
					"Data Explorer": [{
						key: "Data",
						value: query.state.data
					}],
					"Query Explorer": [{
						key: "Query",
						value: query
					}]
				};
			}
		});
	});
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/vueQueryPlugin.js
/**
* Installs a `QueryClient` on the Vue app, making it available to every descendant component through
* `useQueryClient` — the Vue equivalent of React's `QueryClientProvider`, but wired up as an app-level plugin
* instead of a wrapping component.
* @example
* ```ts
* import { createApp } from 'vue'
* import { VueQueryPlugin } from '@tanstack/vue-query'
*
* const app = createApp(App)
* app.use(VueQueryPlugin)
* ```
* @example
* Pass a `queryClient` you constructed yourself — useful for SSR, where you need a fresh `QueryClient` per
* request, or when the same instance also needs to be used outside of Vue components:
* ```ts
* import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
*
* const queryClient = new QueryClient()
* app.use(VueQueryPlugin, { queryClient })
* ```
* @example
* Or pass `queryClientConfig` to let the plugin construct the `QueryClient` for you, with your own defaults:
* ```ts
* app.use(VueQueryPlugin, {
*   queryClientConfig: {
*     defaultOptions: { queries: { staleTime: 5 * 1000 } },
*   },
* })
* ```
*/
var VueQueryPlugin = { install: (app, options = {}) => {
	const clientKey = getClientKey(options.queryClientKey);
	let client;
	if ("queryClient" in options && options.queryClient) client = options.queryClient;
	else client = new QueryClient("queryClientConfig" in options ? options.queryClientConfig : void 0);
	if (!environmentManager.isServer()) client.mount();
	let persisterUnmount = () => {};
	if (options.clientPersister) {
		if (client.isRestoring) client.isRestoring.value = true;
		const [unmount, promise] = options.clientPersister(client);
		persisterUnmount = unmount;
		promise.then(() => {
			if (client.isRestoring) client.isRestoring.value = false;
			options.clientPersisterOnSuccess?.(client);
		});
	}
	const cleanup = () => {
		client.unmount();
		persisterUnmount();
	};
	if (app.onUnmount) app.onUnmount(cleanup);
	else {
		const originalUnmount = app.unmount;
		app.unmount = function vueQueryUnmount() {
			cleanup();
			originalUnmount();
		};
	}
	app.provide(clientKey, client);
	if (options.enableDevtoolsV6Plugin) setupDevtools(app, client);
} };
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/queryOptions.js
function queryOptions(options) {
	return options;
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/infiniteQueryOptions.js
function infiniteQueryOptions(options) {
	return options;
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/mutationOptions.js
function mutationOptions(options) {
	return options;
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/useBaseQuery.js
/**
* Base implementation shared by `useQuery` and `useInfiniteQuery`.
* @param Observer - The observer class from query-core (`QueryObserver` or `InfiniteQueryObserver`).
* @param options - A `ref`, plain value, or reactive getter resolving to the query options.
* @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
* will be used.
* @returns The query result as `ref`s, plus the `suspense` function.
*/
function useBaseQuery(Observer, options, queryClient) {
	if (!getCurrentScope()) console.warn("vue-query composable like \"useQuery()\" should only be used inside a \"setup()\" function or a running effect scope. They might otherwise lead to memory leaks.");
	const client = queryClient || useQueryClient();
	const defaultedOptions = computed(() => {
		let resolvedOptions = options;
		if (typeof resolvedOptions === "function") resolvedOptions = resolvedOptions();
		const clonedOptions = cloneDeepUnref(resolvedOptions);
		if (typeof clonedOptions.enabled === "function") clonedOptions.enabled = clonedOptions.enabled();
		const defaulted = client.defaultQueryOptions(clonedOptions);
		defaulted._optimisticResults = client.isRestoring?.value ? "isRestoring" : "optimistic";
		return defaulted;
	});
	const observer = new Observer(client, defaultedOptions.value);
	const state = defaultedOptions.value.shallow ? shallowReactive(observer.getCurrentResult()) : reactive(observer.getCurrentResult());
	let unsubscribe = () => {};
	if (client.isRestoring) watch(client.isRestoring, (isRestoring) => {
		if (!isRestoring) {
			unsubscribe();
			unsubscribe = observer.subscribe((result) => {
				updateState(state, result);
			});
		}
	}, { immediate: true });
	const updater = () => {
		observer.setOptions(defaultedOptions.value);
		updateState(state, observer.getCurrentResult());
	};
	watch(defaultedOptions, updater);
	onScopeDispose(() => {
		unsubscribe();
	});
	const refetch = (...args) => {
		updater();
		return state.refetch(...args);
	};
	const suspense = () => {
		return new Promise((resolve, reject) => {
			let stopWatch = () => {};
			const run = () => {
				if (defaultedOptions.value.enabled !== false) {
					observer.setOptions(defaultedOptions.value);
					const optimisticResult = observer.getOptimisticResult(defaultedOptions.value);
					if (optimisticResult.isStale) {
						stopWatch();
						observer.fetchOptimistic(defaultedOptions.value).then(resolve, (error) => {
							if (shouldThrowError(defaultedOptions.value.throwOnError, [error, observer.getCurrentQuery()])) reject(error);
							else resolve(observer.getCurrentResult());
						});
					} else {
						stopWatch();
						resolve(optimisticResult);
					}
				}
			};
			run();
			stopWatch = watch(defaultedOptions, run);
		});
	};
	watch(() => state.error, (error) => {
		if (state.isError && !state.isFetching && shouldThrowError(defaultedOptions.value.throwOnError, [error, observer.getCurrentQuery()])) throw error;
	});
	const readonlyState = defaultedOptions.value.shallow ? shallowReadonly(state) : readonly(state);
	const object = toRefs(readonlyState);
	for (const key in state) if (typeof state[key] === "function") object[key] = state[key];
	object.suspense = suspense;
	object.refetch = refetch;
	return object;
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/useQuery.js
function useQuery(options, queryClient) {
	return useBaseQuery(QueryObserver, options, queryClient);
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/useQueries.js
/**
* The `useQueries` composable can be used to fetch a variable number of queries.
*
* The `queries` option accepts an array of query option objects mostly identical to `useQuery`'s. It may be a
* plain array, a `ref`/reactive array (each entry tracked individually), or a getter function — pass a getter
* if the array itself (its length, or which queries are in it) depends on other reactive state.
*
* Having the same query key more than once in the array of query objects may cause some data to be shared
* between queries. To avoid this, consider de-duplicating the queries and map the results back to the desired
* structure.
*
* The `combine` option can be used to combine the results of the queries into a single value. The result will
* be structurally shared to be as referentially stable as possible.
*
* `placeholderData` is supported here too, but unlike `useQuery`, it doesn't receive information from
* previously rendered queries, because the number of queries can differ between renders.
* @param options - The `queries` array to run, and the optional `combine` and `shallow` options.
* @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
* will be used.
* @returns A `ref` to the combined result. Without `combine`, this is an array with all the query results, in
* the same order as the input. When `combine` is provided, this is the value returned by `combine` instead.
* @example
* ```vue
* <script setup lang="ts">
* import { useQueries } from '@tanstack/vue-query'
*
* const props = defineProps<{ ids: Array<number> }>()
*
* const postQueries = useQueries({
*   queries: () =>
*     props.ids.map((id) => ({
*       queryKey: ['post', id],
*       queryFn: () => fetchPost(id),
*       staleTime: Infinity,
*     })),
* })
* <\/script>
*
* <template>
*   <ul>
*     <li v-for="(query, index) in postQueries" :key="props.ids[index]">
*       <span v-if="query.isPending">Loading...</span>
*       <span v-else-if="query.isError">Error: {{ query.error.message }}</span>
*       <span v-else>{{ query.data.title }}</span>
*     </li>
*   </ul>
* </template>
* ```
* @example
* Combining results into a single value:
* ```vue
* <script setup lang="ts">
* import { useQueries } from '@tanstack/vue-query'
*
* const props = defineProps<{ ids: Array<number> }>()
*
* const combined = useQueries({
*   queries: () =>
*     props.ids.map((id) => ({
*       queryKey: ['post', id],
*       queryFn: () => fetchPost(id),
*     })),
*   combine: (postQueries) => ({
*     data: postQueries.map((query) => query.data),
*     isPending: postQueries.some((query) => query.isPending),
*     isError: postQueries.some((query) => query.isError),
*   }),
* })
* <\/script>
*
* <template>
*   <span v-if="combined.isPending">Loading...</span>
*   <span v-else-if="combined.isError">Error!</span>
*   <ul v-else>
*     <li v-for="post in combined.data" :key="post.id">{{ post.title }}</li>
*   </ul>
* </template>
* ```
* @example
* Typing `select` via {@link queryOptions}. Note that spreading a `queryOptions` result and overriding
* `select` inline still falls back to `unknown` — wrap the spread in `queryOptions` again so the override is
* resolved before it reaches `useQueries`:
* ```vue
* <script setup lang="ts">
* import { queryOptions, useQueries } from '@tanstack/vue-query'
*
* const props = defineProps<{ id: number }>()
*
* const postOptions = (id: number) =>
*   queryOptions({
*     queryKey: ['post', id],
*     queryFn: () => fetchPost(id),
*   })
*
* const [{ data: broken }] = useQueries({
*   queries: () => [
*     {
*       ...postOptions(props.id),
*       // ❌ `data` is `unknown` here
*       select: (data) => data.title,
*     },
*   ],
* })
*
* const [{ data: fixed }] = useQueries({
*   queries: () => [
*     queryOptions({
*       ...postOptions(props.id),
*       // ✅ `data` is `Post`
*       select: (data) => data.title,
*     }),
*   ],
* })
* <\/script>
*
* <template>
*   <h1>{{ fixed }}</h1>
* </template>
* ```
*/
function useQueries({ queries, ...options }, queryClient) {
	if (!getCurrentScope()) console.warn("vue-query composable like \"useQuery()\" should only be used inside a \"setup()\" function or a running effect scope. They might otherwise lead to memory leaks.");
	const client = queryClient || useQueryClient();
	const defaultedQueries = computed(() => {
		const resolvedQueries = typeof queries === "function" ? queries() : queries;
		return unref(resolvedQueries).map((queryOptions) => {
			const clonedOptions = cloneDeepUnref(queryOptions);
			if (typeof clonedOptions.enabled === "function") clonedOptions.enabled = queryOptions.enabled();
			const defaulted = client.defaultQueryOptions(clonedOptions);
			defaulted._optimisticResults = client.isRestoring?.value ? "isRestoring" : "optimistic";
			return defaulted;
		});
	});
	const observer = new QueriesObserver(client, defaultedQueries.value, options);
	const getOptimisticResult = () => {
		const [results, getCombinedResult] = observer.getOptimisticResult(defaultedQueries.value, options.combine);
		return getCombinedResult(results.map((result, index) => {
			return {
				...result,
				refetch: async (...args) => {
					const [{ [index]: query }] = observer.getOptimisticResult(defaultedQueries.value, options.combine);
					return query.refetch(...args);
				}
			};
		}));
	};
	const state = shallowRef(getOptimisticResult());
	let unsubscribe = () => {};
	if (client.isRestoring) watch(client.isRestoring, (isRestoring) => {
		if (!isRestoring) {
			unsubscribe();
			unsubscribe = observer.subscribe(() => {
				state.value = getOptimisticResult();
			});
			state.value = getOptimisticResult();
		}
	}, { immediate: true });
	watch(defaultedQueries, (queriesValue) => {
		observer.setQueries(queriesValue, options);
		state.value = getOptimisticResult();
	});
	onScopeDispose(() => {
		unsubscribe();
	});
	return options.shallow ? shallowReadonly(state) : readonly(state);
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/useInfiniteQuery.js
function useInfiniteQuery(options, queryClient) {
	return useBaseQuery(InfiniteQueryObserver, options, queryClient);
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/usePrefetchQuery.js
/**
* Checks whether an option was passed as a getter function.
* @param value - The option value.
* @returns `true` if `value` is a function.
*/
function isGetter$1(value) {
	return typeof value === "function";
}
/**
* `usePrefetchQuery` does not return anything — it fires a prefetch as a reactive side effect, useful for
* kicking off a fetch ahead of the component that will actually render the data with `useQuery`. You can pass
* everything to `usePrefetchQuery` that you can pass to `queryClient.query`, though `queryKey` is always
* required, and `queryFn` is required unless a default query function has been defined.
*
* The prefetch is skipped if the query already has any cached state — including a `pending`/`error` state left
* over from a previous attempt — so it won't refetch data that's already there or already in flight. It
* re-runs whenever a reactive dependency in `options` (built with `queryOptions`, for example) changes.
*
* Fire this during render, before a suspense boundary that wraps a component using `useQuery`'s `suspense()`
* — see the {@link https://tanstack.com/query/latest/docs/framework/vue/guides/suspense | Suspense guide}.
* @param options - A `ref`, plain value, or reactive getter resolving to the {@link UsePrefetchQueryOptions} to
* use — everything you can pass to `queryClient.query`.
* @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
* will be used.
* @example
* ```vue
* <script setup lang="ts">
* import { usePrefetchQuery } from '@tanstack/vue-query'
* import Posts from './Posts.vue'
*
* // Fire the prefetch as soon as this component runs, before `Posts` mounts and calls `useQuery`.
* usePrefetchQuery({
*   queryKey: ['posts'],
*   queryFn: fetchPosts,
* })
* <\/script>
*
* <template>
*   <Posts />
* </template>
* ```
*/
function usePrefetchQuery(options, queryClient) {
	if (!getCurrentScope()) console.warn("vue-query composable like \"useQuery()\" should only be used inside a \"setup()\" function or a running effect scope. They might otherwise lead to memory leaks.");
	const client = queryClient || useQueryClient();
	watchEffect(() => {
		const clonedOptions = cloneDeepUnref(isGetter$1(options) ? options() : unref(options));
		if (!client.getQueryState(clonedOptions.queryKey)) client.query(clonedOptions).catch(noop);
	});
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/usePrefetchInfiniteQuery.js
/**
* Checks whether an option was passed as a getter function.
* @param value - The option value.
* @returns `true` if `value` is a function.
*/
function isGetter(value) {
	return typeof value === "function";
}
/**
* `usePrefetchInfiniteQuery` does not return anything — it fires a prefetch as a reactive side effect, useful
* for kicking off a fetch ahead of the component that will actually render the data with `useInfiniteQuery`.
* You can pass everything to `usePrefetchInfiniteQuery` that you can pass to `queryClient.infiniteQuery`,
* though `queryKey`, `initialPageParam`, and `getNextPageParam` are always required, and `queryFn` is required
* unless a default query function has been defined.
*
* `getNextPageParam` receives both the last page of the infinite list of data and the full array of all pages,
* as well as pageParam information, and should return a single variable that will be passed to your query
* function as `context.pageParam`. Return `undefined` or `null` to indicate there is no next page available.
*
* The prefetch is skipped if the query already has any cached state — including a `pending`/`error` state left
* over from a previous attempt — so it won't refetch data that's already there or already in flight. It
* re-runs whenever a reactive dependency in `options` (built with `infiniteQueryOptions`, for example) changes.
*
* Fire this during render, before a suspense boundary that wraps a component using `useInfiniteQuery`'s
* `suspense()` — see the {@link https://tanstack.com/query/latest/docs/framework/vue/guides/suspense | Suspense guide}.
* @param options - A `ref`, plain value, or reactive getter resolving to the
* {@link UsePrefetchInfiniteQueryOptions} to use — everything you can pass to `queryClient.infiniteQuery`.
* @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
* will be used.
* @example
* ```vue
* <script setup lang="ts">
* import { infiniteQueryOptions, usePrefetchInfiniteQuery } from '@tanstack/vue-query'
* import Projects from './Projects.vue'
*
* const projectsOptions = infiniteQueryOptions({
*   queryKey: ['projects'],
*   queryFn: ({ pageParam }) => fetchProjects(pageParam),
*   initialPageParam: 0,
*   getNextPageParam: (lastPage) => lastPage.nextId,
* })
*
* // Fire the prefetch as soon as this component runs, before `Projects` mounts and calls `useInfiniteQuery`.
* usePrefetchInfiniteQuery(projectsOptions)
* <\/script>
*
* <template>
*   <Projects />
* </template>
* ```
*/
function usePrefetchInfiniteQuery(options, queryClient) {
	if (!getCurrentScope()) console.warn("vue-query composable like \"useQuery()\" should only be used inside a \"setup()\" function or a running effect scope. They might otherwise lead to memory leaks.");
	const client = queryClient || useQueryClient();
	watchEffect(() => {
		const clonedOptions = cloneDeepUnref(isGetter(options) ? options() : unref(options));
		if (!client.getQueryState(clonedOptions.queryKey)) client.infiniteQuery(clonedOptions).then(noop).catch(noop);
	});
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/useMutation.js
/**
* Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects.
* `useMutation` is the composable for that.
*
* `options` may be a plain object, a `ref`, or a reactive getter (`() => ({ ... })`) — pass a getter
* if the options themselves depend on other reactive state.
* @param options - The {@link UseMutationOptions} to use — everything you can pass to `useMutation`.
* @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
* will be used.
* @returns `mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a second
* argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to the shared
* mutation definition. Hook-level callbacks (passed to `options`) fire for every mutation; per-call
* callbacks fire only for the latest call you've made.
* @see {@link mutationOptions} to share these options across multiple `useMutation` call sites, or to look
* the mutation up elsewhere via its `mutationKey` (e.g. with `useMutationState`).
* @example
* ```vue
* <script setup lang="ts">
* import { useMutation, useQueryClient } from '@tanstack/vue-query'
*
* const queryClient = useQueryClient()
*
* const addMutation = useMutation({
*   mutationFn: addTodo,
*   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
* })
*
* function onAdd() {
*   addMutation.mutate('Item', {
*     onError: (error) => console.error('Failed to add item:', error),
*   })
* }
* <\/script>
*
* <template>
*   <button @click="onAdd">Add</button>
* </template>
* ```
* @example
* Rendering the mutation's own state, rather than just firing it off:
* ```vue
* <script setup lang="ts">
* import { useMutation, useQueryClient } from '@tanstack/vue-query'
*
* const queryClient = useQueryClient()
*
* const addMutation = useMutation({
*   mutationFn: addTodo,
*   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
* })
* <\/script>
*
* <template>
*   <div v-if="addMutation.isPending.value">Adding todo...</div>
*   <div v-else>
*     <div v-if="addMutation.isError.value">An error occurred: {{ addMutation.error.value.message }}</div>
*     <button @click="addMutation.mutate('Item')">Add</button>
*   </div>
* </template>
* ```
* @example
* Optimistic update via `onMutate`, rolling back on `onError`:
* ```vue
* <script setup lang="ts">
* import { useMutation, useQueryClient } from '@tanstack/vue-query'
*
* const queryClient = useQueryClient()
*
* const addMutation = useMutation({
*   mutationFn: addTodo,
*   onMutate: async (newTodo: string) => {
*     await queryClient.cancelQueries({ queryKey: ['todos'] })
*     const previousTodos = queryClient.getQueryData<Array<string>>(['todos'])
*
*     queryClient.setQueryData<Array<string>>(['todos'], (old) => [
*       ...(old ?? []),
*       newTodo,
*     ])
*
*     // Passed to `onError` as `onMutateResult` if the mutation fails.
*     return { previousTodos }
*   },
*   onError: (_err, _newTodo, onMutateResult) => {
*     queryClient.setQueryData(['todos'], onMutateResult?.previousTodos)
*   },
*   onSettled: () => {
*     queryClient.invalidateQueries({ queryKey: ['todos'] })
*   },
* })
* <\/script>
*
* <template>
*   <button @click="addMutation.mutate('Item')">Add</button>
* </template>
* ```
* @example
* Callbacks passed per call to `mutate` only fire for the last call — `mutateAsync` gives you a
* promise per call instead, so you can wait for all of them when they succeed:
* ```vue
* <script setup lang="ts">
* import { useMutation, useQueryClient } from '@tanstack/vue-query'
*
* const queryClient = useQueryClient()
*
* const addMutation = useMutation({
*   mutationFn: addTodo,
*   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
* })
*
* async function handleAddAll(todos: Array<string>) {
*   try {
*     await Promise.all(todos.map((todo) => addMutation.mutateAsync(todo)))
*   } catch (error) {
*     console.error('Failed to add todos:', error)
*   }
* }
* <\/script>
*
* <template>
*   <button @click="handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])">Add all</button>
* </template>
* ```
* @example
* If some of the mutations above can fail independently of the others, and you want to know which ones
* did — rather than losing that information the moment the first one rejects — swap `Promise.all` for
* `Promise.allSettled`:
* ```vue
* <script setup lang="ts">
* import { useMutation, useQueryClient } from '@tanstack/vue-query'
*
* const queryClient = useQueryClient()
*
* const addMutation = useMutation({
*   mutationFn: addTodo,
*   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
* })
*
* async function handleAddAll(todos: Array<string>) {
*   const addResults = await Promise.allSettled(
*     todos.map((todo) => addMutation.mutateAsync(todo)),
*   )
*
*   addResults.forEach((addResult, index) => {
*     if (addResult.status === 'rejected') {
*       console.error(`Failed to add "${todos[index]}":`, addResult.reason)
*     }
*   })
* }
* <\/script>
*
* <template>
*   <button @click="handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])">Add all</button>
* </template>
* ```
*/
function useMutation(options, queryClient) {
	if (!getCurrentScope()) console.warn("vue-query composable like \"useQuery()\" should only be used inside a \"setup()\" function or a running effect scope. They might otherwise lead to memory leaks.");
	const client = queryClient || useQueryClient();
	const defaultedOptions = computed(() => {
		const resolvedOptions = typeof options === "function" ? options() : options;
		return client.defaultMutationOptions(cloneDeepUnref(resolvedOptions));
	});
	const observer = new MutationObserver(client, defaultedOptions.value);
	const state = defaultedOptions.value.shallow ? shallowReactive(observer.getCurrentResult()) : reactive(observer.getCurrentResult());
	const unsubscribe = observer.subscribe((result) => {
		updateState(state, result);
	});
	const mutate = (...args) => {
		observer.mutate(args[0], args[1]).catch(() => {});
	};
	watch(defaultedOptions, () => {
		observer.setOptions(defaultedOptions.value);
	});
	onScopeDispose(() => {
		unsubscribe();
	});
	const readonlyState = defaultedOptions.value.shallow ? shallowReadonly(state) : readonly(state);
	const resultRefs = toRefs(readonlyState);
	watch(() => state.error, (error) => {
		if (error && shouldThrowError(defaultedOptions.value.throwOnError, [error])) throw error;
	});
	return {
		...resultRefs,
		mutate,
		mutateAsync: state.mutate,
		reset: state.reset
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/useIsFetching.js
/**
* The `useIsFetching` composable returns a `ref` to the `number` of the queries that your application is
* loading or fetching in the background (useful for app-wide loading indicators).
*
* `fetchingFilters` may be a plain object, `MaybeRefDeep`, or a reactive getter (`() => ({ ... })`) — pass a
* getter if the filters themselves depend on other reactive state.
* @param fetchingFilters - The {@link QueryFilters} to narrow down the matched queries.
* @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
* will be used.
* @returns A `ref` to the `number` of the queries that your application is currently loading or fetching in
* the background.
* @example
* ```vue
* <script setup lang="ts">
* import { useIsFetching } from '@tanstack/vue-query'
*
* // How many queries matching the posts prefix are fetching?
* const isFetchingPosts = useIsFetching({ queryKey: ['posts'] })
* <\/script>
*
* <template>
*   <span v-if="isFetchingPosts">Refreshing posts...</span>
* </template>
* ```
* @example
* A global loading indicator for any query fetching in the background, not just the ones on screen:
* ```vue
* <script setup lang="ts">
* import { useIsFetching } from '@tanstack/vue-query'
*
* const isFetching = useIsFetching()
* <\/script>
*
* <template>
*   <div v-if="isFetching">Queries are fetching in the background...</div>
* </template>
* ```
*/
function useIsFetching(fetchingFilters = {}, queryClient) {
	if (!getCurrentScope()) console.warn("vue-query composable like \"useQuery()\" should only be used inside a \"setup()\" function or a running effect scope. They might otherwise lead to memory leaks.");
	const client = queryClient || useQueryClient();
	const isFetching = ref();
	const listener = () => {
		const resolvedFilters = typeof fetchingFilters === "function" ? fetchingFilters() : fetchingFilters;
		isFetching.value = client.isFetching(cloneDeepUnref(resolvedFilters));
	};
	const unsubscribe = client.getQueryCache().subscribe(listener);
	watchEffect(listener);
	onScopeDispose(() => {
		unsubscribe();
	});
	return isFetching;
}
//#endregion
//#region ../../node_modules/.pnpm/@tanstack+vue-query@5.104.5_vue@3.5.45_typescript@5.9.3_/node_modules/@tanstack/vue-query/build/modern/useMutationState.js
/**
* The `useIsMutating` composable returns a `ref` to the `number` of mutations that your application currently
* has `pending` (useful for app-wide loading indicators).
*
* `filters` may be a plain object, `MaybeRefDeep`, or a reactive getter (`() => ({ ... })`) — pass a getter if
* the filters themselves depend on other reactive state.
* @param filters - The {@link MutationFilters} to narrow down the matched mutations.
* @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
* will be used.
* @returns A `ref` to the `number` of the mutations that your application currently has `pending`.
* @example
* ```vue
* <script setup lang="ts">
* import { useIsMutating } from '@tanstack/vue-query'
*
* // How many mutations matching the posts prefix are in progress?
* const isMutatingPosts = useIsMutating({ mutationKey: ['posts'] })
* <\/script>
*
* <template>
*   <span v-if="isMutatingPosts">Saving posts...</span>
* </template>
* ```
*/
function useIsMutating(filters = {}, queryClient) {
	if (!getCurrentScope()) console.warn("vue-query composable like \"useQuery()\" should only be used inside a \"setup()\" function or a running effect scope. They might otherwise lead to memory leaks.");
	const client = queryClient || useQueryClient();
	const mutationState = useMutationState({ filters: computed(() => ({
		...cloneDeepUnref(typeof filters === "function" ? filters() : filters),
		status: "pending"
	})) }, client);
	return computed(() => mutationState.value.length);
}
/**
* Collects the mutations in the cache that match `options.filters`, mapped with `options.select`
* (or to their state, by default).
* @param mutationCache - The mutation cache to read.
* @param options - The `filters` to match and the `select` function to map each mutation with.
* @returns The selected value of every matching mutation.
*/
function getResult(mutationCache, options) {
	return mutationCache.findAll(options.filters).map((mutation) => options.select ? options.select(mutation) : mutation.state);
}
/**
* `useMutationState` is a composable that gives you access to all mutations in the `MutationCache`. You can
* pass `filters` ({@link MutationFilters}) to narrow down your mutations, and `select` to transform the
* mutation state.
*
* `options` may be a plain object or a reactive getter (`() => ({ ... })`) — pass a getter if the filters
* themselves depend on other reactive state.
* @param options - The `filters` to narrow down matched mutations, and an optional `select` to transform the
* mutation state.
* @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
* will be used.
* @returns A `ref` to an Array of whatever `select` returns for each matching mutation.
* @example
* Get all variables of all running mutations:
* ```vue
* <script setup lang="ts">
* import { useMutationState } from '@tanstack/vue-query'
*
* const pendingVariables = useMutationState({
*   filters: { status: 'pending' },
*   select: (mutation) => mutation.state.variables,
* })
* <\/script>
*
* <template>{{ pendingVariables.length }} posts saving...</template>
* ```
* @example
* Get all data for specific mutations via the `mutationKey`:
* ```vue
* <script setup lang="ts">
* import { useMutation, useMutationState } from '@tanstack/vue-query'
*
* const mutationKey = ['posts']
*
* // Some mutation that we want to get the state for
* const mutation = useMutation({
*   mutationKey,
*   mutationFn: createPosts,
* })
*
* const savedPosts = useMutationState({
*   // this mutation key needs to match the mutation key of the given mutation (see above)
*   filters: { mutationKey, status: 'success' },
*   select: (mutation) => mutation.state.data,
* })
* <\/script>
*
* <template>
*   <button @click="mutation.mutate(['New Post'])">
*     Create post ({{ savedPosts.length }} saved so far)
*   </button>
* </template>
* ```
* @example
* Access the latest successful mutation data via the `mutationKey`. Each invocation of `mutate` adds a new
* entry to the mutation cache for `gcTime` milliseconds — with the `status: 'success'` filter below, check the
* last item that `useMutationState` returns to get the latest successful invocation:
* ```vue
* <script setup lang="ts">
* import { computed } from 'vue'
* import { useMutationState } from '@tanstack/vue-query'
*
* const savedPosts = useMutationState({
*   filters: { mutationKey: ['posts'], status: 'success' },
*   select: (mutation) => mutation.state.data,
* })
*
* const latestSavedPost = computed(() => savedPosts.value[savedPosts.value.length - 1])
* <\/script>
*
* <template>{{ latestSavedPost ? 'Saved' : 'Nothing saved yet' }}</template>
* ```
*/
function useMutationState(options = {}, queryClient) {
	const resolvedOptions = computed(() => {
		const newOptions = typeof options === "function" ? options() : options;
		return {
			filters: cloneDeepUnref(newOptions.filters),
			select: newOptions.select
		};
	});
	const mutationCache = (queryClient || useQueryClient()).getMutationCache();
	const state = shallowRef(getResult(mutationCache, resolvedOptions.value));
	const unsubscribe = mutationCache.subscribe(() => {
		state.value = getResult(mutationCache, resolvedOptions.value);
	});
	watch(resolvedOptions, () => {
		state.value = getResult(mutationCache, resolvedOptions.value);
	});
	onScopeDispose(() => {
		unsubscribe();
	});
	return shallowReadonly(state);
}
//#endregion
export { defaultScheduler as A, isServer$1 as B, Mutation as C, CancelledError as D, Query as E, dehydrateQuery as F, partialMatchKey as G, matchMutation as H, hydrate as I, skipToken as J, replaceEqualDeep as K, focusManager as L, defaultShouldDehydrateMutation as M, defaultShouldDehydrateQuery as N, isCancelledError as O, dehydrate as P, environmentManager as R, MutationObserver as S, QueryObserver as T, matchQuery as U, keepPreviousData as V, noop as W, useQueryClient as X, timeoutManager as Y, VUE_QUERY_CLIENT as Z, dataTagErrorSymbol as _, usePrefetchInfiniteQuery as a, streamedQuery as b, useQueries as c, infiniteQueryOptions as d, queryOptions as f, QueryCache as g, MutationCache as h, useMutation as i, notifyManager as j, onlineManager as k, useQuery as l, QueryClient as m, useMutationState as n, usePrefetchQuery as o, VueQueryPlugin as p, shouldThrowError as q, useIsFetching as r, useInfiniteQuery as s, useIsMutating as t, mutationOptions as u, dataTagSymbol as v, InfiniteQueryObserver as w, QueriesObserver as x, unsetMarker as y, hashKey as z };
