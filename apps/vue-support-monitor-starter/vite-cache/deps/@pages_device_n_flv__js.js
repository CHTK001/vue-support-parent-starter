import { t as __commonJSMin } from "./rolldown-runtime-CEgmsyvS.js";
//#region ../../node_modules/.pnpm/flv.js@1.6.2/node_modules/flv.js/dist/flv.js
var require_flv = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function webpackUniversalModuleDefinition(root, factory) {
		if (typeof exports === "object" && typeof module === "object") module.exports = factory();
		else if (typeof define === "function" && define.amd) define([], factory);
		else if (typeof exports === "object") exports["flvjs"] = factory();
		else root["flvjs"] = factory();
	})(self, function() {
		return (function() {
			var __webpack_modules__ = {
				"./node_modules/es6-promise/dist/es6-promise.js": (function(module$1, __unused_webpack_exports, __webpack_require__) {
					/*!******************************************************!*\
					!*** ./node_modules/es6-promise/dist/es6-promise.js ***!
					\******************************************************/
					/*!
					* @overview es6-promise - a tiny implementation of Promises/A+.
					* @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
					* @license   Licensed under MIT license
					*            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
					* @version   v4.2.8+1e68dce6
					*/
					(function(global, factory) {
						module$1.exports = factory();
					})(this, (function() {
						"use strict";
						function objectOrFunction(x) {
							var type = typeof x;
							return x !== null && (type === "object" || type === "function");
						}
						function isFunction(x) {
							return typeof x === "function";
						}
						var _isArray = void 0;
						if (Array.isArray) _isArray = Array.isArray;
						else _isArray = function(x) {
							return Object.prototype.toString.call(x) === "[object Array]";
						};
						var isArray = _isArray;
						var len = 0;
						var vertxNext = void 0;
						var customSchedulerFn = void 0;
						var asap = function asap(callback, arg) {
							queue[len] = callback;
							queue[len + 1] = arg;
							len += 2;
							if (len === 2) if (customSchedulerFn) customSchedulerFn(flush);
							else scheduleFlush();
						};
						function setScheduler(scheduleFn) {
							customSchedulerFn = scheduleFn;
						}
						function setAsap(asapFn) {
							asap = asapFn;
						}
						var browserWindow = typeof window !== "undefined" ? window : void 0;
						var browserGlobal = browserWindow || {};
						var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
						var isNode = typeof self === "undefined" && typeof process !== "undefined" && {}.toString.call(process) === "[object process]";
						var isWorker = typeof Uint8ClampedArray !== "undefined" && typeof importScripts !== "undefined" && typeof MessageChannel !== "undefined";
						function useNextTick() {
							return function() {
								return process.nextTick(flush);
							};
						}
						function useVertxTimer() {
							if (typeof vertxNext !== "undefined") return function() {
								vertxNext(flush);
							};
							return useSetTimeout();
						}
						function useMutationObserver() {
							var iterations = 0;
							var observer = new BrowserMutationObserver(flush);
							var node = document.createTextNode("");
							observer.observe(node, { characterData: true });
							return function() {
								node.data = iterations = ++iterations % 2;
							};
						}
						function useMessageChannel() {
							var channel = new MessageChannel();
							channel.port1.onmessage = flush;
							return function() {
								return channel.port2.postMessage(0);
							};
						}
						function useSetTimeout() {
							var globalSetTimeout = setTimeout;
							return function() {
								return globalSetTimeout(flush, 1);
							};
						}
						var queue = new Array(1e3);
						function flush() {
							for (var i = 0; i < len; i += 2) {
								var callback = queue[i];
								var arg = queue[i + 1];
								callback(arg);
								queue[i] = void 0;
								queue[i + 1] = void 0;
							}
							len = 0;
						}
						function attemptVertx() {
							try {
								var vertx = Function("return this")().require("vertx");
								vertxNext = vertx.runOnLoop || vertx.runOnContext;
								return useVertxTimer();
							} catch (e) {
								return useSetTimeout();
							}
						}
						var scheduleFlush = void 0;
						if (isNode) scheduleFlush = useNextTick();
						else if (BrowserMutationObserver) scheduleFlush = useMutationObserver();
						else if (isWorker) scheduleFlush = useMessageChannel();
						else if (browserWindow === void 0 && true) scheduleFlush = attemptVertx();
						else scheduleFlush = useSetTimeout();
						function then(onFulfillment, onRejection) {
							var parent = this;
							var child = new this.constructor(noop);
							if (child[PROMISE_ID] === void 0) makePromise(child);
							var _state = parent._state;
							if (_state) {
								var callback = arguments[_state - 1];
								asap(function() {
									return invokeCallback(_state, child, callback, parent._result);
								});
							} else subscribe(parent, child, onFulfillment, onRejection);
							return child;
						}
						/**
						`Promise.resolve` returns a promise that will become resolved with the
						passed `value`. It is shorthand for the following:
						
						```javascript
						let promise = new Promise(function(resolve, reject){
						resolve(1);
						});
						
						promise.then(function(value){
						// value === 1
						});
						```
						
						Instead of writing the above, your code now simply becomes the following:
						
						```javascript
						let promise = Promise.resolve(1);
						
						promise.then(function(value){
						// value === 1
						});
						```
						
						@method resolve
						@static
						@param {Any} value value that the returned promise will be resolved with
						Useful for tooling.
						@return {Promise} a promise that will become fulfilled with the given
						`value`
						*/
						function resolve$1(object) {
							var Constructor = this;
							if (object && typeof object === "object" && object.constructor === Constructor) return object;
							var promise = new Constructor(noop);
							resolve(promise, object);
							return promise;
						}
						var PROMISE_ID = Math.random().toString(36).substring(2);
						function noop() {}
						var PENDING = void 0;
						var FULFILLED = 1;
						var REJECTED = 2;
						function selfFulfillment() {
							return /* @__PURE__ */ new TypeError("You cannot resolve a promise with itself");
						}
						function cannotReturnOwn() {
							return /* @__PURE__ */ new TypeError("A promises callback cannot return that same promise.");
						}
						function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
							try {
								then$$1.call(value, fulfillmentHandler, rejectionHandler);
							} catch (e) {
								return e;
							}
						}
						function handleForeignThenable(promise, thenable, then$$1) {
							asap(function(promise) {
								var sealed = false;
								var error = tryThen(then$$1, thenable, function(value) {
									if (sealed) return;
									sealed = true;
									if (thenable !== value) resolve(promise, value);
									else fulfill(promise, value);
								}, function(reason) {
									if (sealed) return;
									sealed = true;
									reject(promise, reason);
								}, "Settle: " + (promise._label || " unknown promise"));
								if (!sealed && error) {
									sealed = true;
									reject(promise, error);
								}
							}, promise);
						}
						function handleOwnThenable(promise, thenable) {
							if (thenable._state === FULFILLED) fulfill(promise, thenable._result);
							else if (thenable._state === REJECTED) reject(promise, thenable._result);
							else subscribe(thenable, void 0, function(value) {
								return resolve(promise, value);
							}, function(reason) {
								return reject(promise, reason);
							});
						}
						function handleMaybeThenable(promise, maybeThenable, then$$1) {
							if (maybeThenable.constructor === promise.constructor && then$$1 === then && maybeThenable.constructor.resolve === resolve$1) handleOwnThenable(promise, maybeThenable);
							else if (then$$1 === void 0) fulfill(promise, maybeThenable);
							else if (isFunction(then$$1)) handleForeignThenable(promise, maybeThenable, then$$1);
							else fulfill(promise, maybeThenable);
						}
						function resolve(promise, value) {
							if (promise === value) reject(promise, selfFulfillment());
							else if (objectOrFunction(value)) {
								var then$$1 = void 0;
								try {
									then$$1 = value.then;
								} catch (error) {
									reject(promise, error);
									return;
								}
								handleMaybeThenable(promise, value, then$$1);
							} else fulfill(promise, value);
						}
						function publishRejection(promise) {
							if (promise._onerror) promise._onerror(promise._result);
							publish(promise);
						}
						function fulfill(promise, value) {
							if (promise._state !== PENDING) return;
							promise._result = value;
							promise._state = FULFILLED;
							if (promise._subscribers.length !== 0) asap(publish, promise);
						}
						function reject(promise, reason) {
							if (promise._state !== PENDING) return;
							promise._state = REJECTED;
							promise._result = reason;
							asap(publishRejection, promise);
						}
						function subscribe(parent, child, onFulfillment, onRejection) {
							var _subscribers = parent._subscribers;
							var length = _subscribers.length;
							parent._onerror = null;
							_subscribers[length] = child;
							_subscribers[length + FULFILLED] = onFulfillment;
							_subscribers[length + REJECTED] = onRejection;
							if (length === 0 && parent._state) asap(publish, parent);
						}
						function publish(promise) {
							var subscribers = promise._subscribers;
							var settled = promise._state;
							if (subscribers.length === 0) return;
							var child = void 0, callback = void 0, detail = promise._result;
							for (var i = 0; i < subscribers.length; i += 3) {
								child = subscribers[i];
								callback = subscribers[i + settled];
								if (child) invokeCallback(settled, child, callback, detail);
								else callback(detail);
							}
							promise._subscribers.length = 0;
						}
						function invokeCallback(settled, promise, callback, detail) {
							var hasCallback = isFunction(callback), value = void 0, error = void 0, succeeded = true;
							if (hasCallback) {
								try {
									value = callback(detail);
								} catch (e) {
									succeeded = false;
									error = e;
								}
								if (promise === value) {
									reject(promise, cannotReturnOwn());
									return;
								}
							} else value = detail;
							if (promise._state !== PENDING) {} else if (hasCallback && succeeded) resolve(promise, value);
							else if (succeeded === false) reject(promise, error);
							else if (settled === FULFILLED) fulfill(promise, value);
							else if (settled === REJECTED) reject(promise, value);
						}
						function initializePromise(promise, resolver) {
							try {
								resolver(function resolvePromise(value) {
									resolve(promise, value);
								}, function rejectPromise(reason) {
									reject(promise, reason);
								});
							} catch (e) {
								reject(promise, e);
							}
						}
						var id = 0;
						function nextId() {
							return id++;
						}
						function makePromise(promise) {
							promise[PROMISE_ID] = id++;
							promise._state = void 0;
							promise._result = void 0;
							promise._subscribers = [];
						}
						function validationError() {
							return /* @__PURE__ */ new Error("Array Methods must be provided an Array");
						}
						var Enumerator = function() {
							function Enumerator(Constructor, input) {
								this._instanceConstructor = Constructor;
								this.promise = new Constructor(noop);
								if (!this.promise[PROMISE_ID]) makePromise(this.promise);
								if (isArray(input)) {
									this.length = input.length;
									this._remaining = input.length;
									this._result = new Array(this.length);
									if (this.length === 0) fulfill(this.promise, this._result);
									else {
										this.length = this.length || 0;
										this._enumerate(input);
										if (this._remaining === 0) fulfill(this.promise, this._result);
									}
								} else reject(this.promise, validationError());
							}
							Enumerator.prototype._enumerate = function _enumerate(input) {
								for (var i = 0; this._state === PENDING && i < input.length; i++) this._eachEntry(input[i], i);
							};
							Enumerator.prototype._eachEntry = function _eachEntry(entry, i) {
								var c = this._instanceConstructor;
								var resolve$$1 = c.resolve;
								if (resolve$$1 === resolve$1) {
									var _then = void 0;
									var error = void 0;
									var didError = false;
									try {
										_then = entry.then;
									} catch (e) {
										didError = true;
										error = e;
									}
									if (_then === then && entry._state !== PENDING) this._settledAt(entry._state, i, entry._result);
									else if (typeof _then !== "function") {
										this._remaining--;
										this._result[i] = entry;
									} else if (c === Promise$1) {
										var promise = new c(noop);
										if (didError) reject(promise, error);
										else handleMaybeThenable(promise, entry, _then);
										this._willSettleAt(promise, i);
									} else this._willSettleAt(new c(function(resolve$$1) {
										return resolve$$1(entry);
									}), i);
								} else this._willSettleAt(resolve$$1(entry), i);
							};
							Enumerator.prototype._settledAt = function _settledAt(state, i, value) {
								var promise = this.promise;
								if (promise._state === PENDING) {
									this._remaining--;
									if (state === REJECTED) reject(promise, value);
									else this._result[i] = value;
								}
								if (this._remaining === 0) fulfill(promise, this._result);
							};
							Enumerator.prototype._willSettleAt = function _willSettleAt(promise, i) {
								var enumerator = this;
								subscribe(promise, void 0, function(value) {
									return enumerator._settledAt(FULFILLED, i, value);
								}, function(reason) {
									return enumerator._settledAt(REJECTED, i, reason);
								});
							};
							return Enumerator;
						}();
						/**
						`Promise.all` accepts an array of promises, and returns a new promise which
						is fulfilled with an array of fulfillment values for the passed promises, or
						rejected with the reason of the first passed promise to be rejected. It casts all
						elements of the passed iterable to promises as it runs this algorithm.
						
						Example:
						
						```javascript
						let promise1 = resolve(1);
						let promise2 = resolve(2);
						let promise3 = resolve(3);
						let promises = [ promise1, promise2, promise3 ];
						
						Promise.all(promises).then(function(array){
						// The array here would be [ 1, 2, 3 ];
						});
						```
						
						If any of the `promises` given to `all` are rejected, the first promise
						that is rejected will be given as an argument to the returned promises's
						rejection handler. For example:
						
						Example:
						
						```javascript
						let promise1 = resolve(1);
						let promise2 = reject(new Error("2"));
						let promise3 = reject(new Error("3"));
						let promises = [ promise1, promise2, promise3 ];
						
						Promise.all(promises).then(function(array){
						// Code here never runs because there are rejected promises!
						}, function(error) {
						// error.message === "2"
						});
						```
						
						@method all
						@static
						@param {Array} entries array of promises
						@param {String} label optional string for labeling the promise.
						Useful for tooling.
						@return {Promise} promise that is fulfilled when all `promises` have been
						fulfilled, or rejected if any of them become rejected.
						@static
						*/
						function all(entries) {
							return new Enumerator(this, entries).promise;
						}
						/**
						`Promise.race` returns a new promise which is settled in the same way as the
						first passed promise to settle.
						
						Example:
						
						```javascript
						let promise1 = new Promise(function(resolve, reject){
						setTimeout(function(){
						resolve('promise 1');
						}, 200);
						});
						
						let promise2 = new Promise(function(resolve, reject){
						setTimeout(function(){
						resolve('promise 2');
						}, 100);
						});
						
						Promise.race([promise1, promise2]).then(function(result){
						// result === 'promise 2' because it was resolved before promise1
						// was resolved.
						});
						```
						
						`Promise.race` is deterministic in that only the state of the first
						settled promise matters. For example, even if other promises given to the
						`promises` array argument are resolved, but the first settled promise has
						become rejected before the other promises became fulfilled, the returned
						promise will become rejected:
						
						```javascript
						let promise1 = new Promise(function(resolve, reject){
						setTimeout(function(){
						resolve('promise 1');
						}, 200);
						});
						
						let promise2 = new Promise(function(resolve, reject){
						setTimeout(function(){
						reject(new Error('promise 2'));
						}, 100);
						});
						
						Promise.race([promise1, promise2]).then(function(result){
						// Code here never runs
						}, function(reason){
						// reason.message === 'promise 2' because promise 2 became rejected before
						// promise 1 became fulfilled
						});
						```
						
						An example real-world use case is implementing timeouts:
						
						```javascript
						Promise.race([ajax('foo.json'), timeout(5000)])
						```
						
						@method race
						@static
						@param {Array} promises array of promises to observe
						Useful for tooling.
						@return {Promise} a promise which settles in the same way as the first passed
						promise to settle.
						*/
						function race(entries) {
							var Constructor = this;
							if (!isArray(entries)) return new Constructor(function(_, reject) {
								return reject(/* @__PURE__ */ new TypeError("You must pass an array to race."));
							});
							else return new Constructor(function(resolve, reject) {
								var length = entries.length;
								for (var i = 0; i < length; i++) Constructor.resolve(entries[i]).then(resolve, reject);
							});
						}
						/**
						`Promise.reject` returns a promise rejected with the passed `reason`.
						It is shorthand for the following:
						
						```javascript
						let promise = new Promise(function(resolve, reject){
						reject(new Error('WHOOPS'));
						});
						
						promise.then(function(value){
						// Code here doesn't run because the promise is rejected!
						}, function(reason){
						// reason.message === 'WHOOPS'
						});
						```
						
						Instead of writing the above, your code now simply becomes the following:
						
						```javascript
						let promise = Promise.reject(new Error('WHOOPS'));
						
						promise.then(function(value){
						// Code here doesn't run because the promise is rejected!
						}, function(reason){
						// reason.message === 'WHOOPS'
						});
						```
						
						@method reject
						@static
						@param {Any} reason value that the returned promise will be rejected with.
						Useful for tooling.
						@return {Promise} a promise rejected with the given `reason`.
						*/
						function reject$1(reason) {
							var promise = new this(noop);
							reject(promise, reason);
							return promise;
						}
						function needsResolver() {
							throw new TypeError("You must pass a resolver function as the first argument to the promise constructor");
						}
						function needsNew() {
							throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
						}
						/**
						Promise objects represent the eventual result of an asynchronous operation. The
						primary way of interacting with a promise is through its `then` method, which
						registers callbacks to receive either a promise's eventual value or the reason
						why the promise cannot be fulfilled.
						
						Terminology
						-----------
						
						- `promise` is an object or function with a `then` method whose behavior conforms to this specification.
						- `thenable` is an object or function that defines a `then` method.
						- `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
						- `exception` is a value that is thrown using the throw statement.
						- `reason` is a value that indicates why a promise was rejected.
						- `settled` the final resting state of a promise, fulfilled or rejected.
						
						A promise can be in one of three states: pending, fulfilled, or rejected.
						
						Promises that are fulfilled have a fulfillment value and are in the fulfilled
						state.  Promises that are rejected have a rejection reason and are in the
						rejected state.  A fulfillment value is never a thenable.
						
						Promises can also be said to *resolve* a value.  If this value is also a
						promise, then the original promise's settled state will match the value's
						settled state.  So a promise that *resolves* a promise that rejects will
						itself reject, and a promise that *resolves* a promise that fulfills will
						itself fulfill.
						
						
						Basic Usage:
						------------
						
						```js
						let promise = new Promise(function(resolve, reject) {
						// on success
						resolve(value);
						
						// on failure
						reject(reason);
						});
						
						promise.then(function(value) {
						// on fulfillment
						}, function(reason) {
						// on rejection
						});
						```
						
						Advanced Usage:
						---------------
						
						Promises shine when abstracting away asynchronous interactions such as
						`XMLHttpRequest`s.
						
						```js
						function getJSON(url) {
						return new Promise(function(resolve, reject){
						let xhr = new XMLHttpRequest();
						
						xhr.open('GET', url);
						xhr.onreadystatechange = handler;
						xhr.responseType = 'json';
						xhr.setRequestHeader('Accept', 'application/json');
						xhr.send();
						
						function handler() {
						if (this.readyState === this.DONE) {
						if (this.status === 200) {
						resolve(this.response);
						} else {
						reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
						}
						}
						};
						});
						}
						
						getJSON('/posts.json').then(function(json) {
						// on fulfillment
						}, function(reason) {
						// on rejection
						});
						```
						
						Unlike callbacks, promises are great composable primitives.
						
						```js
						Promise.all([
						getJSON('/posts'),
						getJSON('/comments')
						]).then(function(values){
						values[0] // => postsJSON
						values[1] // => commentsJSON
						
						return values;
						});
						```
						
						@class Promise
						@param {Function} resolver
						Useful for tooling.
						@constructor
						*/
						var Promise$1 = function() {
							function Promise(resolver) {
								this[PROMISE_ID] = nextId();
								this._result = this._state = void 0;
								this._subscribers = [];
								if (noop !== resolver) {
									typeof resolver !== "function" && needsResolver();
									this instanceof Promise ? initializePromise(this, resolver) : needsNew();
								}
							}
							/**
							The primary way of interacting with a promise is through its `then` method,
							which registers callbacks to receive either a promise's eventual value or the
							reason why the promise cannot be fulfilled.
							```js
							findUser().then(function(user){
							// user is available
							}, function(reason){
							// user is unavailable, and you are given the reason why
							});
							```
							Chaining
							--------
							The return value of `then` is itself a promise.  This second, 'downstream'
							promise is resolved with the return value of the first promise's fulfillment
							or rejection handler, or rejected if the handler throws an exception.
							```js
							findUser().then(function (user) {
							return user.name;
							}, function (reason) {
							return 'default name';
							}).then(function (userName) {
							// If `findUser` fulfilled, `userName` will be the user's name, otherwise it
							// will be `'default name'`
							});
							findUser().then(function (user) {
							throw new Error('Found user, but still unhappy');
							}, function (reason) {
							throw new Error('`findUser` rejected and we're unhappy');
							}).then(function (value) {
							// never reached
							}, function (reason) {
							// if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
							// If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
							});
							```
							If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
							```js
							findUser().then(function (user) {
							throw new PedagogicalException('Upstream error');
							}).then(function (value) {
							// never reached
							}).then(function (value) {
							// never reached
							}, function (reason) {
							// The `PedgagocialException` is propagated all the way down to here
							});
							```
							Assimilation
							------------
							Sometimes the value you want to propagate to a downstream promise can only be
							retrieved asynchronously. This can be achieved by returning a promise in the
							fulfillment or rejection handler. The downstream promise will then be pending
							until the returned promise is settled. This is called *assimilation*.
							```js
							findUser().then(function (user) {
							return findCommentsByAuthor(user);
							}).then(function (comments) {
							// The user's comments are now available
							});
							```
							If the assimliated promise rejects, then the downstream promise will also reject.
							```js
							findUser().then(function (user) {
							return findCommentsByAuthor(user);
							}).then(function (comments) {
							// If `findCommentsByAuthor` fulfills, we'll have the value here
							}, function (reason) {
							// If `findCommentsByAuthor` rejects, we'll have the reason here
							});
							```
							Simple Example
							--------------
							Synchronous Example
							```javascript
							let result;
							try {
							result = findResult();
							// success
							} catch(reason) {
							// failure
							}
							```
							Errback Example
							```js
							findResult(function(result, err){
							if (err) {
							// failure
							} else {
							// success
							}
							});
							```
							Promise Example;
							```javascript
							findResult().then(function(result){
							// success
							}, function(reason){
							// failure
							});
							```
							Advanced Example
							--------------
							Synchronous Example
							```javascript
							let author, books;
							try {
							author = findAuthor();
							books  = findBooksByAuthor(author);
							// success
							} catch(reason) {
							// failure
							}
							```
							Errback Example
							```js
							function foundBooks(books) {
							}
							function failure(reason) {
							}
							findAuthor(function(author, err){
							if (err) {
							failure(err);
							// failure
							} else {
							try {
							findBoooksByAuthor(author, function(books, err) {
							if (err) {
							failure(err);
							} else {
							try {
							foundBooks(books);
							} catch(reason) {
							failure(reason);
							}
							}
							});
							} catch(error) {
							failure(err);
							}
							// success
							}
							});
							```
							Promise Example;
							```javascript
							findAuthor().
							then(findBooksByAuthor).
							then(function(books){
							// found books
							}).catch(function(reason){
							// something went wrong
							});
							```
							@method then
							@param {Function} onFulfilled
							@param {Function} onRejected
							Useful for tooling.
							@return {Promise}
							*/
							/**
							`catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
							as the catch block of a try/catch statement.
							```js
							function findAuthor(){
							throw new Error('couldn't find that author');
							}
							// synchronous
							try {
							findAuthor();
							} catch(reason) {
							// something went wrong
							}
							// async with promises
							findAuthor().catch(function(reason){
							// something went wrong
							});
							```
							@method catch
							@param {Function} onRejection
							Useful for tooling.
							@return {Promise}
							*/
							Promise.prototype.catch = function _catch(onRejection) {
								return this.then(null, onRejection);
							};
							/**
							`finally` will be invoked regardless of the promise's fate just as native
							try/catch/finally behaves
							
							Synchronous example:
							
							```js
							findAuthor() {
							if (Math.random() > 0.5) {
							throw new Error();
							}
							return new Author();
							}
							
							try {
							return findAuthor(); // succeed or fail
							} catch(error) {
							return findOtherAuther();
							} finally {
							// always runs
							// doesn't affect the return value
							}
							```
							
							Asynchronous example:
							
							```js
							findAuthor().catch(function(reason){
							return findOtherAuther();
							}).finally(function(){
							// author was either found, or not
							});
							```
							
							@method finally
							@param {Function} callback
							@return {Promise}
							*/
							Promise.prototype.finally = function _finally(callback) {
								var promise = this;
								var constructor = promise.constructor;
								if (isFunction(callback)) return promise.then(function(value) {
									return constructor.resolve(callback()).then(function() {
										return value;
									});
								}, function(reason) {
									return constructor.resolve(callback()).then(function() {
										throw reason;
									});
								});
								return promise.then(callback, callback);
							};
							return Promise;
						}();
						Promise$1.prototype.then = then;
						Promise$1.all = all;
						Promise$1.race = race;
						Promise$1.resolve = resolve$1;
						Promise$1.reject = reject$1;
						Promise$1._setScheduler = setScheduler;
						Promise$1._setAsap = setAsap;
						Promise$1._asap = asap;
						function polyfill() {
							var local = void 0;
							if (typeof __webpack_require__.g !== "undefined") local = __webpack_require__.g;
							else if (typeof self !== "undefined") local = self;
							else try {
								local = Function("return this")();
							} catch (e) {
								throw new Error("polyfill failed because global object is unavailable in this environment");
							}
							var P = local.Promise;
							if (P) {
								var promiseToString = null;
								try {
									promiseToString = Object.prototype.toString.call(P.resolve());
								} catch (e) {}
								if (promiseToString === "[object Promise]" && !P.cast) return;
							}
							local.Promise = Promise$1;
						}
						Promise$1.polyfill = polyfill;
						Promise$1.Promise = Promise$1;
						return Promise$1;
					}));
				}),
				"./node_modules/events/events.js": (function(module$2) {
					"use strict";
					/*!***************************************!*\
					!*** ./node_modules/events/events.js ***!
					\***************************************/
					var R = typeof Reflect === "object" ? Reflect : null;
					var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply(target, receiver, args) {
						return Function.prototype.apply.call(target, receiver, args);
					};
					var ReflectOwnKeys;
					if (R && typeof R.ownKeys === "function") ReflectOwnKeys = R.ownKeys;
					else if (Object.getOwnPropertySymbols) ReflectOwnKeys = function ReflectOwnKeys(target) {
						return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
					};
					else ReflectOwnKeys = function ReflectOwnKeys(target) {
						return Object.getOwnPropertyNames(target);
					};
					function ProcessEmitWarning(warning) {
						if (console && console.warn) console.warn(warning);
					}
					var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
						return value !== value;
					};
					function EventEmitter() {
						EventEmitter.init.call(this);
					}
					module$2.exports = EventEmitter;
					module$2.exports.once = once;
					EventEmitter.EventEmitter = EventEmitter;
					EventEmitter.prototype._events = void 0;
					EventEmitter.prototype._eventsCount = 0;
					EventEmitter.prototype._maxListeners = void 0;
					var defaultMaxListeners = 10;
					function checkListener(listener) {
						if (typeof listener !== "function") throw new TypeError("The \"listener\" argument must be of type Function. Received type " + typeof listener);
					}
					Object.defineProperty(EventEmitter, "defaultMaxListeners", {
						enumerable: true,
						get: function() {
							return defaultMaxListeners;
						},
						set: function(arg) {
							if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) throw new RangeError("The value of \"defaultMaxListeners\" is out of range. It must be a non-negative number. Received " + arg + ".");
							defaultMaxListeners = arg;
						}
					});
					EventEmitter.init = function() {
						if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
							this._events = Object.create(null);
							this._eventsCount = 0;
						}
						this._maxListeners = this._maxListeners || void 0;
					};
					EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
						if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) throw new RangeError("The value of \"n\" is out of range. It must be a non-negative number. Received " + n + ".");
						this._maxListeners = n;
						return this;
					};
					function _getMaxListeners(that) {
						if (that._maxListeners === void 0) return EventEmitter.defaultMaxListeners;
						return that._maxListeners;
					}
					EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
						return _getMaxListeners(this);
					};
					EventEmitter.prototype.emit = function emit(type) {
						var args = [];
						for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
						var doError = type === "error";
						var events = this._events;
						if (events !== void 0) doError = doError && events.error === void 0;
						else if (!doError) return false;
						if (doError) {
							var er;
							if (args.length > 0) er = args[0];
							if (er instanceof Error) throw er;
							var err = /* @__PURE__ */ new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
							err.context = er;
							throw err;
						}
						var handler = events[type];
						if (handler === void 0) return false;
						if (typeof handler === "function") ReflectApply(handler, this, args);
						else {
							var len = handler.length;
							var listeners = arrayClone(handler, len);
							for (var i = 0; i < len; ++i) ReflectApply(listeners[i], this, args);
						}
						return true;
					};
					function _addListener(target, type, listener, prepend) {
						var m;
						var events;
						var existing;
						checkListener(listener);
						events = target._events;
						if (events === void 0) {
							events = target._events = Object.create(null);
							target._eventsCount = 0;
						} else {
							if (events.newListener !== void 0) {
								target.emit("newListener", type, listener.listener ? listener.listener : listener);
								events = target._events;
							}
							existing = events[type];
						}
						if (existing === void 0) {
							existing = events[type] = listener;
							++target._eventsCount;
						} else {
							if (typeof existing === "function") existing = events[type] = prepend ? [listener, existing] : [existing, listener];
							else if (prepend) existing.unshift(listener);
							else existing.push(listener);
							m = _getMaxListeners(target);
							if (m > 0 && existing.length > m && !existing.warned) {
								existing.warned = true;
								var w = /* @__PURE__ */ new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
								w.name = "MaxListenersExceededWarning";
								w.emitter = target;
								w.type = type;
								w.count = existing.length;
								ProcessEmitWarning(w);
							}
						}
						return target;
					}
					EventEmitter.prototype.addListener = function addListener(type, listener) {
						return _addListener(this, type, listener, false);
					};
					EventEmitter.prototype.on = EventEmitter.prototype.addListener;
					EventEmitter.prototype.prependListener = function prependListener(type, listener) {
						return _addListener(this, type, listener, true);
					};
					function onceWrapper() {
						if (!this.fired) {
							this.target.removeListener(this.type, this.wrapFn);
							this.fired = true;
							if (arguments.length === 0) return this.listener.call(this.target);
							return this.listener.apply(this.target, arguments);
						}
					}
					function _onceWrap(target, type, listener) {
						var state = {
							fired: false,
							wrapFn: void 0,
							target,
							type,
							listener
						};
						var wrapped = onceWrapper.bind(state);
						wrapped.listener = listener;
						state.wrapFn = wrapped;
						return wrapped;
					}
					EventEmitter.prototype.once = function once(type, listener) {
						checkListener(listener);
						this.on(type, _onceWrap(this, type, listener));
						return this;
					};
					EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
						checkListener(listener);
						this.prependListener(type, _onceWrap(this, type, listener));
						return this;
					};
					EventEmitter.prototype.removeListener = function removeListener(type, listener) {
						var list, events, position, i, originalListener;
						checkListener(listener);
						events = this._events;
						if (events === void 0) return this;
						list = events[type];
						if (list === void 0) return this;
						if (list === listener || list.listener === listener) if (--this._eventsCount === 0) this._events = Object.create(null);
						else {
							delete events[type];
							if (events.removeListener) this.emit("removeListener", type, list.listener || listener);
						}
						else if (typeof list !== "function") {
							position = -1;
							for (i = list.length - 1; i >= 0; i--) if (list[i] === listener || list[i].listener === listener) {
								originalListener = list[i].listener;
								position = i;
								break;
							}
							if (position < 0) return this;
							if (position === 0) list.shift();
							else spliceOne(list, position);
							if (list.length === 1) events[type] = list[0];
							if (events.removeListener !== void 0) this.emit("removeListener", type, originalListener || listener);
						}
						return this;
					};
					EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
					EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
						var listeners, events = this._events, i;
						if (events === void 0) return this;
						if (events.removeListener === void 0) {
							if (arguments.length === 0) {
								this._events = Object.create(null);
								this._eventsCount = 0;
							} else if (events[type] !== void 0) if (--this._eventsCount === 0) this._events = Object.create(null);
							else delete events[type];
							return this;
						}
						if (arguments.length === 0) {
							var keys = Object.keys(events);
							var key;
							for (i = 0; i < keys.length; ++i) {
								key = keys[i];
								if (key === "removeListener") continue;
								this.removeAllListeners(key);
							}
							this.removeAllListeners("removeListener");
							this._events = Object.create(null);
							this._eventsCount = 0;
							return this;
						}
						listeners = events[type];
						if (typeof listeners === "function") this.removeListener(type, listeners);
						else if (listeners !== void 0) for (i = listeners.length - 1; i >= 0; i--) this.removeListener(type, listeners[i]);
						return this;
					};
					function _listeners(target, type, unwrap) {
						var events = target._events;
						if (events === void 0) return [];
						var evlistener = events[type];
						if (evlistener === void 0) return [];
						if (typeof evlistener === "function") return unwrap ? [evlistener.listener || evlistener] : [evlistener];
						return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
					}
					EventEmitter.prototype.listeners = function listeners(type) {
						return _listeners(this, type, true);
					};
					EventEmitter.prototype.rawListeners = function rawListeners(type) {
						return _listeners(this, type, false);
					};
					EventEmitter.listenerCount = function(emitter, type) {
						if (typeof emitter.listenerCount === "function") return emitter.listenerCount(type);
						else return listenerCount.call(emitter, type);
					};
					EventEmitter.prototype.listenerCount = listenerCount;
					function listenerCount(type) {
						var events = this._events;
						if (events !== void 0) {
							var evlistener = events[type];
							if (typeof evlistener === "function") return 1;
							else if (evlistener !== void 0) return evlistener.length;
						}
						return 0;
					}
					EventEmitter.prototype.eventNames = function eventNames() {
						return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
					};
					function arrayClone(arr, n) {
						var copy = new Array(n);
						for (var i = 0; i < n; ++i) copy[i] = arr[i];
						return copy;
					}
					function spliceOne(list, index) {
						for (; index + 1 < list.length; index++) list[index] = list[index + 1];
						list.pop();
					}
					function unwrapListeners(arr) {
						var ret = new Array(arr.length);
						for (var i = 0; i < ret.length; ++i) ret[i] = arr[i].listener || arr[i];
						return ret;
					}
					function once(emitter, name) {
						return new Promise(function(resolve, reject) {
							function errorListener(err) {
								emitter.removeListener(name, resolver);
								reject(err);
							}
							function resolver() {
								if (typeof emitter.removeListener === "function") emitter.removeListener("error", errorListener);
								resolve([].slice.call(arguments));
							}
							eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
							if (name !== "error") addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
						});
					}
					function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
						if (typeof emitter.on === "function") eventTargetAgnosticAddListener(emitter, "error", handler, flags);
					}
					function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
						if (typeof emitter.on === "function") if (flags.once) emitter.once(name, listener);
						else emitter.on(name, listener);
						else if (typeof emitter.addEventListener === "function") emitter.addEventListener(name, function wrapListener(arg) {
							if (flags.once) emitter.removeEventListener(name, wrapListener);
							listener(arg);
						});
						else throw new TypeError("The \"emitter\" argument must be of type EventEmitter. Received type " + typeof emitter);
					}
				}),
				"./node_modules/webworkify-webpack/index.js": (function(module$3, __unused_webpack_exports, __webpack_require__) {
					/*!**************************************************!*\
					!*** ./node_modules/webworkify-webpack/index.js ***!
					\**************************************************/
					function webpackBootstrapFunc(modules) {
						var installedModules = {};
						function __nested_webpack_require_164__(moduleId) {
							if (installedModules[moduleId]) return installedModules[moduleId].exports;
							var module$4 = installedModules[moduleId] = {
								i: moduleId,
								l: false,
								exports: {}
							};
							modules[moduleId].call(module$4.exports, module$4, module$4.exports, __nested_webpack_require_164__);
							module$4.l = true;
							return module$4.exports;
						}
						__nested_webpack_require_164__.m = modules;
						__nested_webpack_require_164__.c = installedModules;
						__nested_webpack_require_164__.i = function(value) {
							return value;
						};
						__nested_webpack_require_164__.d = function(exports$1, name, getter) {
							if (!__nested_webpack_require_164__.o(exports$1, name)) Object.defineProperty(exports$1, name, {
								configurable: false,
								enumerable: true,
								get: getter
							});
						};
						__nested_webpack_require_164__.r = function(exports$2) {
							Object.defineProperty(exports$2, "__esModule", { value: true });
						};
						__nested_webpack_require_164__.n = function(module$5) {
							var getter = module$5 && module$5.__esModule ? function getDefault() {
								return module$5["default"];
							} : function getModuleExports() {
								return module$5;
							};
							__nested_webpack_require_164__.d(getter, "a", getter);
							return getter;
						};
						__nested_webpack_require_164__.o = function(object, property) {
							return Object.prototype.hasOwnProperty.call(object, property);
						};
						__nested_webpack_require_164__.p = "/";
						__nested_webpack_require_164__.oe = function(err) {
							console.error(err);
							throw err;
						};
						var f = __nested_webpack_require_164__(__nested_webpack_require_164__.s = ENTRY_MODULE);
						return f.default || f;
					}
					var moduleNameReqExp = "[\\.|\\-|\\+|\\w|/|@]+";
					var dependencyRegExp = "\\(\\s*(/\\*.*?\\*/)?\\s*.*?(" + moduleNameReqExp + ").*?\\)";
					function quoteRegExp(str) {
						return (str + "").replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
					}
					function isNumeric(n) {
						return !isNaN(1 * n);
					}
					function getModuleDependencies(sources, module$6, queueName) {
						var retval = {};
						retval[queueName] = [];
						var fnString = module$6.toString();
						var wrapperSignature = fnString.match(/^function\s?\w*\(\w+,\s*\w+,\s*(\w+)\)/);
						if (!wrapperSignature) return retval;
						var webpackRequireName = wrapperSignature[1];
						var re = new RegExp("(\\\\n|\\W)" + quoteRegExp(webpackRequireName) + dependencyRegExp, "g");
						var match;
						while (match = re.exec(fnString)) {
							if (match[3] === "dll-reference") continue;
							retval[queueName].push(match[3]);
						}
						re = new RegExp("\\(" + quoteRegExp(webpackRequireName) + "\\(\"(dll-reference\\s(" + moduleNameReqExp + "))\"\\)\\)" + dependencyRegExp, "g");
						while (match = re.exec(fnString)) {
							if (!sources[match[2]]) {
								retval[queueName].push(match[1]);
								sources[match[2]] = __webpack_require__(match[1]).m;
							}
							retval[match[2]] = retval[match[2]] || [];
							retval[match[2]].push(match[4]);
						}
						var keys = Object.keys(retval);
						for (var i = 0; i < keys.length; i++) for (var j = 0; j < retval[keys[i]].length; j++) if (isNumeric(retval[keys[i]][j])) retval[keys[i]][j] = 1 * retval[keys[i]][j];
						return retval;
					}
					function hasValuesInQueues(queues) {
						return Object.keys(queues).reduce(function(hasValues, key) {
							return hasValues || queues[key].length > 0;
						}, false);
					}
					function getRequiredModules(sources, moduleId) {
						var modulesQueue = { main: [moduleId] };
						var requiredModules = { main: [] };
						var seenModules = { main: {} };
						while (hasValuesInQueues(modulesQueue)) {
							var queues = Object.keys(modulesQueue);
							for (var i = 0; i < queues.length; i++) {
								var queueName = queues[i];
								var moduleToCheck = modulesQueue[queueName].pop();
								seenModules[queueName] = seenModules[queueName] || {};
								if (seenModules[queueName][moduleToCheck] || !sources[queueName][moduleToCheck]) continue;
								seenModules[queueName][moduleToCheck] = true;
								requiredModules[queueName] = requiredModules[queueName] || [];
								requiredModules[queueName].push(moduleToCheck);
								var newModules = getModuleDependencies(sources, sources[queueName][moduleToCheck], queueName);
								var newModulesKeys = Object.keys(newModules);
								for (var j = 0; j < newModulesKeys.length; j++) {
									modulesQueue[newModulesKeys[j]] = modulesQueue[newModulesKeys[j]] || [];
									modulesQueue[newModulesKeys[j]] = modulesQueue[newModulesKeys[j]].concat(newModules[newModulesKeys[j]]);
								}
							}
						}
						return requiredModules;
					}
					module$3.exports = function(moduleId, options) {
						options = options || {};
						var sources = { main: __webpack_require__.m };
						var requiredModules = options.all ? { main: Object.keys(sources.main) } : getRequiredModules(sources, moduleId);
						var src = "";
						Object.keys(requiredModules).filter(function(m) {
							return m !== "main";
						}).forEach(function(module$7) {
							var entryModule = 0;
							while (requiredModules[module$7][entryModule]) entryModule++;
							requiredModules[module$7].push(entryModule);
							sources[module$7][entryModule] = "(function(module, exports, __webpack_require__) { module.exports = __webpack_require__; })";
							src = src + "var " + module$7 + " = (" + webpackBootstrapFunc.toString().replace("ENTRY_MODULE", JSON.stringify(entryModule)) + ")({" + requiredModules[module$7].map(function(id) {
								return "" + JSON.stringify(id) + ": " + sources[module$7][id].toString();
							}).join(",") + "});\n";
						});
						src = src + "new ((" + webpackBootstrapFunc.toString().replace("ENTRY_MODULE", JSON.stringify(moduleId)) + ")({" + requiredModules.main.map(function(id) {
							return "" + JSON.stringify(id) + ": " + sources.main[id].toString();
						}).join(",") + "}))(self);";
						var blob = new window.Blob([src], { type: "text/javascript" });
						if (options.bare) return blob;
						var workerUrl = (window.URL || window.webkitURL || window.mozURL || window.msURL).createObjectURL(blob);
						var worker = new window.Worker(workerUrl);
						worker.objectURL = workerUrl;
						return worker;
					};
				}),
				"./src/config.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!***********************!*\
					!*** ./src/config.js ***!
					\***********************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_require__.d(__webpack_exports__, {
						"defaultConfig": function() {
							return defaultConfig;
						},
						"createDefaultConfig": function() {
							return createDefaultConfig;
						}
					});
					var defaultConfig = {
						enableWorker: false,
						enableStashBuffer: true,
						stashInitialSize: void 0,
						isLive: false,
						lazyLoad: true,
						lazyLoadMaxDuration: 180,
						lazyLoadRecoverDuration: 30,
						deferLoadAfterSourceOpen: true,
						autoCleanupMaxBackwardDuration: 180,
						autoCleanupMinBackwardDuration: 120,
						statisticsInfoReportInterval: 600,
						fixAudioTimestampGap: true,
						accurateSeek: false,
						seekType: "range",
						seekParamStart: "bstart",
						seekParamEnd: "bend",
						rangeLoadZeroStart: false,
						customSeekHandler: void 0,
						reuseRedirectedURL: false,
						headers: void 0,
						customLoader: void 0
					};
					function createDefaultConfig() {
						return Object.assign({}, defaultConfig);
					}
				}),
				"./src/core/features.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!******************************!*\
					!*** ./src/core/features.js ***!
					\******************************/
					__webpack_require__.r(__webpack_exports__);
					var _io_io_controller_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ../io/io-controller.js */
						"./src/io/io-controller.js"
					);
					var _config_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ../config.js */
						"./src/config.js"
					);
					__webpack_exports__["default"] = function() {
						function Features() {}
						Features.supportMSEH264Playback = function() {
							return window.MediaSource && window.MediaSource.isTypeSupported("video/mp4; codecs=\"avc1.42E01E,mp4a.40.2\"");
						};
						Features.supportNetworkStreamIO = function() {
							var ioctl = new _io_io_controller_js__WEBPACK_IMPORTED_MODULE_0__.default({}, (0, _config_js__WEBPACK_IMPORTED_MODULE_1__.createDefaultConfig)());
							var loaderType = ioctl.loaderType;
							ioctl.destroy();
							return loaderType == "fetch-stream-loader" || loaderType == "xhr-moz-chunked-loader";
						};
						Features.getNetworkLoaderTypeName = function() {
							var ioctl = new _io_io_controller_js__WEBPACK_IMPORTED_MODULE_0__.default({}, (0, _config_js__WEBPACK_IMPORTED_MODULE_1__.createDefaultConfig)());
							var loaderType = ioctl.loaderType;
							ioctl.destroy();
							return loaderType;
						};
						Features.supportNativeMediaPlayback = function(mimeType) {
							if (Features.videoElement == void 0) Features.videoElement = window.document.createElement("video");
							var canPlay = Features.videoElement.canPlayType(mimeType);
							return canPlay === "probably" || canPlay == "maybe";
						};
						Features.getFeatureList = function() {
							var features = {
								mseFlvPlayback: false,
								mseLiveFlvPlayback: false,
								networkStreamIO: false,
								networkLoaderName: "",
								nativeMP4H264Playback: false,
								nativeWebmVP8Playback: false,
								nativeWebmVP9Playback: false
							};
							features.mseFlvPlayback = Features.supportMSEH264Playback();
							features.networkStreamIO = Features.supportNetworkStreamIO();
							features.networkLoaderName = Features.getNetworkLoaderTypeName();
							features.mseLiveFlvPlayback = features.mseFlvPlayback && features.networkStreamIO;
							features.nativeMP4H264Playback = Features.supportNativeMediaPlayback("video/mp4; codecs=\"avc1.42001E, mp4a.40.2\"");
							features.nativeWebmVP8Playback = Features.supportNativeMediaPlayback("video/webm; codecs=\"vp8.0, vorbis\"");
							features.nativeWebmVP9Playback = Features.supportNativeMediaPlayback("video/webm; codecs=\"vp9\"");
							return features;
						};
						return Features;
					}();
				}),
				"./src/core/media-info.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!********************************!*\
					!*** ./src/core/media-info.js ***!
					\********************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_exports__["default"] = function() {
						function MediaInfo() {
							this.mimeType = null;
							this.duration = null;
							this.hasAudio = null;
							this.hasVideo = null;
							this.audioCodec = null;
							this.videoCodec = null;
							this.audioDataRate = null;
							this.videoDataRate = null;
							this.audioSampleRate = null;
							this.audioChannelCount = null;
							this.width = null;
							this.height = null;
							this.fps = null;
							this.profile = null;
							this.level = null;
							this.refFrames = null;
							this.chromaFormat = null;
							this.sarNum = null;
							this.sarDen = null;
							this.metadata = null;
							this.segments = null;
							this.segmentCount = null;
							this.hasKeyframesIndex = null;
							this.keyframesIndex = null;
						}
						MediaInfo.prototype.isComplete = function() {
							var audioInfoComplete = this.hasAudio === false || this.hasAudio === true && this.audioCodec != null && this.audioSampleRate != null && this.audioChannelCount != null;
							var videoInfoComplete = this.hasVideo === false || this.hasVideo === true && this.videoCodec != null && this.width != null && this.height != null && this.fps != null && this.profile != null && this.level != null && this.refFrames != null && this.chromaFormat != null && this.sarNum != null && this.sarDen != null;
							return this.mimeType != null && this.duration != null && this.metadata != null && this.hasKeyframesIndex != null && audioInfoComplete && videoInfoComplete;
						};
						MediaInfo.prototype.isSeekable = function() {
							return this.hasKeyframesIndex === true;
						};
						MediaInfo.prototype.getNearestKeyframe = function(milliseconds) {
							if (this.keyframesIndex == null) return null;
							var table = this.keyframesIndex;
							var keyframeIdx = this._search(table.times, milliseconds);
							return {
								index: keyframeIdx,
								milliseconds: table.times[keyframeIdx],
								fileposition: table.filepositions[keyframeIdx]
							};
						};
						MediaInfo.prototype._search = function(list, value) {
							var idx = 0;
							var last = list.length - 1;
							var mid = 0;
							var lbound = 0;
							var ubound = last;
							if (value < list[0]) {
								idx = 0;
								lbound = ubound + 1;
							}
							while (lbound <= ubound) {
								mid = lbound + Math.floor((ubound - lbound) / 2);
								if (mid === last || value >= list[mid] && value < list[mid + 1]) {
									idx = mid;
									break;
								} else if (list[mid] < value) lbound = mid + 1;
								else ubound = mid - 1;
							}
							return idx;
						};
						return MediaInfo;
					}();
				}),
				"./src/core/media-segment-info.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!****************************************!*\
					!*** ./src/core/media-segment-info.js ***!
					\****************************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_require__.d(__webpack_exports__, {
						"SampleInfo": function() {
							return SampleInfo;
						},
						"MediaSegmentInfo": function() {
							return MediaSegmentInfo;
						},
						"IDRSampleList": function() {
							return IDRSampleList;
						},
						"MediaSegmentInfoList": function() {
							return MediaSegmentInfoList;
						}
					});
					var SampleInfo = function() {
						function SampleInfo(dts, pts, duration, originalDts, isSync) {
							this.dts = dts;
							this.pts = pts;
							this.duration = duration;
							this.originalDts = originalDts;
							this.isSyncPoint = isSync;
							this.fileposition = null;
						}
						return SampleInfo;
					}();
					var MediaSegmentInfo = function() {
						function MediaSegmentInfo() {
							this.beginDts = 0;
							this.endDts = 0;
							this.beginPts = 0;
							this.endPts = 0;
							this.originalBeginDts = 0;
							this.originalEndDts = 0;
							this.syncPoints = [];
							this.firstSample = null;
							this.lastSample = null;
						}
						MediaSegmentInfo.prototype.appendSyncPoint = function(sampleInfo) {
							sampleInfo.isSyncPoint = true;
							this.syncPoints.push(sampleInfo);
						};
						return MediaSegmentInfo;
					}();
					var IDRSampleList = function() {
						function IDRSampleList() {
							this._list = [];
						}
						IDRSampleList.prototype.clear = function() {
							this._list = [];
						};
						IDRSampleList.prototype.appendArray = function(syncPoints) {
							var list = this._list;
							if (syncPoints.length === 0) return;
							if (list.length > 0 && syncPoints[0].originalDts < list[list.length - 1].originalDts) this.clear();
							Array.prototype.push.apply(list, syncPoints);
						};
						IDRSampleList.prototype.getLastSyncPointBeforeDts = function(dts) {
							if (this._list.length == 0) return null;
							var list = this._list;
							var idx = 0;
							var last = list.length - 1;
							var mid = 0;
							var lbound = 0;
							var ubound = last;
							if (dts < list[0].dts) {
								idx = 0;
								lbound = ubound + 1;
							}
							while (lbound <= ubound) {
								mid = lbound + Math.floor((ubound - lbound) / 2);
								if (mid === last || dts >= list[mid].dts && dts < list[mid + 1].dts) {
									idx = mid;
									break;
								} else if (list[mid].dts < dts) lbound = mid + 1;
								else ubound = mid - 1;
							}
							return this._list[idx];
						};
						return IDRSampleList;
					}();
					var MediaSegmentInfoList = function() {
						function MediaSegmentInfoList(type) {
							this._type = type;
							this._list = [];
							this._lastAppendLocation = -1;
						}
						Object.defineProperty(MediaSegmentInfoList.prototype, "type", {
							get: function() {
								return this._type;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(MediaSegmentInfoList.prototype, "length", {
							get: function() {
								return this._list.length;
							},
							enumerable: false,
							configurable: true
						});
						MediaSegmentInfoList.prototype.isEmpty = function() {
							return this._list.length === 0;
						};
						MediaSegmentInfoList.prototype.clear = function() {
							this._list = [];
							this._lastAppendLocation = -1;
						};
						MediaSegmentInfoList.prototype._searchNearestSegmentBefore = function(originalBeginDts) {
							var list = this._list;
							if (list.length === 0) return -2;
							var last = list.length - 1;
							var mid = 0;
							var lbound = 0;
							var ubound = last;
							var idx = 0;
							if (originalBeginDts < list[0].originalBeginDts) {
								idx = -1;
								return idx;
							}
							while (lbound <= ubound) {
								mid = lbound + Math.floor((ubound - lbound) / 2);
								if (mid === last || originalBeginDts > list[mid].lastSample.originalDts && originalBeginDts < list[mid + 1].originalBeginDts) {
									idx = mid;
									break;
								} else if (list[mid].originalBeginDts < originalBeginDts) lbound = mid + 1;
								else ubound = mid - 1;
							}
							return idx;
						};
						MediaSegmentInfoList.prototype._searchNearestSegmentAfter = function(originalBeginDts) {
							return this._searchNearestSegmentBefore(originalBeginDts) + 1;
						};
						MediaSegmentInfoList.prototype.append = function(mediaSegmentInfo) {
							var list = this._list;
							var msi = mediaSegmentInfo;
							var lastAppendIdx = this._lastAppendLocation;
							var insertIdx = 0;
							if (lastAppendIdx !== -1 && lastAppendIdx < list.length && msi.originalBeginDts >= list[lastAppendIdx].lastSample.originalDts && (lastAppendIdx === list.length - 1 || lastAppendIdx < list.length - 1 && msi.originalBeginDts < list[lastAppendIdx + 1].originalBeginDts)) insertIdx = lastAppendIdx + 1;
							else if (list.length > 0) insertIdx = this._searchNearestSegmentBefore(msi.originalBeginDts) + 1;
							this._lastAppendLocation = insertIdx;
							this._list.splice(insertIdx, 0, msi);
						};
						MediaSegmentInfoList.prototype.getLastSegmentBefore = function(originalBeginDts) {
							var idx = this._searchNearestSegmentBefore(originalBeginDts);
							if (idx >= 0) return this._list[idx];
							else return null;
						};
						MediaSegmentInfoList.prototype.getLastSampleBefore = function(originalBeginDts) {
							var segment = this.getLastSegmentBefore(originalBeginDts);
							if (segment != null) return segment.lastSample;
							else return null;
						};
						MediaSegmentInfoList.prototype.getLastSyncPointBefore = function(originalBeginDts) {
							var segmentIdx = this._searchNearestSegmentBefore(originalBeginDts);
							var syncPoints = this._list[segmentIdx].syncPoints;
							while (syncPoints.length === 0 && segmentIdx > 0) {
								segmentIdx--;
								syncPoints = this._list[segmentIdx].syncPoints;
							}
							if (syncPoints.length > 0) return syncPoints[syncPoints.length - 1];
							else return null;
						};
						return MediaSegmentInfoList;
					}();
				}),
				"./src/core/mse-controller.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!************************************!*\
					!*** ./src/core/mse-controller.js ***!
					\************************************/
					__webpack_require__.r(__webpack_exports__);
					var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! events */
						"./node_modules/events/events.js"
					);
					var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);
					var _utils_logger_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ../utils/logger.js */
						"./src/utils/logger.js"
					);
					var _utils_browser_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ../utils/browser.js */
						"./src/utils/browser.js"
					);
					var _mse_events_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
						/*! ./mse-events.js */
						"./src/core/mse-events.js"
					);
					var _media_segment_info_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
						/*! ./media-segment-info.js */
						"./src/core/media-segment-info.js"
					);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					__webpack_exports__["default"] = function() {
						function MSEController(config) {
							this.TAG = "MSEController";
							this._config = config;
							this._emitter = new (events__WEBPACK_IMPORTED_MODULE_0___default())();
							if (this._config.isLive && this._config.autoCleanupSourceBuffer == void 0) this._config.autoCleanupSourceBuffer = true;
							this.e = {
								onSourceOpen: this._onSourceOpen.bind(this),
								onSourceEnded: this._onSourceEnded.bind(this),
								onSourceClose: this._onSourceClose.bind(this),
								onSourceBufferError: this._onSourceBufferError.bind(this),
								onSourceBufferUpdateEnd: this._onSourceBufferUpdateEnd.bind(this)
							};
							this._mediaSource = null;
							this._mediaSourceObjectURL = null;
							this._mediaElement = null;
							this._isBufferFull = false;
							this._hasPendingEos = false;
							this._requireSetMediaDuration = false;
							this._pendingMediaDuration = 0;
							this._pendingSourceBufferInit = [];
							this._mimeTypes = {
								video: null,
								audio: null
							};
							this._sourceBuffers = {
								video: null,
								audio: null
							};
							this._lastInitSegments = {
								video: null,
								audio: null
							};
							this._pendingSegments = {
								video: [],
								audio: []
							};
							this._pendingRemoveRanges = {
								video: [],
								audio: []
							};
							this._idrList = new _media_segment_info_js__WEBPACK_IMPORTED_MODULE_4__.IDRSampleList();
						}
						MSEController.prototype.destroy = function() {
							if (this._mediaElement || this._mediaSource) this.detachMediaElement();
							this.e = null;
							this._emitter.removeAllListeners();
							this._emitter = null;
						};
						MSEController.prototype.on = function(event, listener) {
							this._emitter.addListener(event, listener);
						};
						MSEController.prototype.off = function(event, listener) {
							this._emitter.removeListener(event, listener);
						};
						MSEController.prototype.attachMediaElement = function(mediaElement) {
							if (this._mediaSource) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_5__.IllegalStateException("MediaSource has been attached to an HTMLMediaElement!");
							var ms = this._mediaSource = new window.MediaSource();
							ms.addEventListener("sourceopen", this.e.onSourceOpen);
							ms.addEventListener("sourceended", this.e.onSourceEnded);
							ms.addEventListener("sourceclose", this.e.onSourceClose);
							this._mediaElement = mediaElement;
							this._mediaSourceObjectURL = window.URL.createObjectURL(this._mediaSource);
							mediaElement.src = this._mediaSourceObjectURL;
						};
						MSEController.prototype.detachMediaElement = function() {
							if (this._mediaSource) {
								var ms = this._mediaSource;
								for (var type in this._sourceBuffers) {
									var ps = this._pendingSegments[type];
									ps.splice(0, ps.length);
									this._pendingSegments[type] = null;
									this._pendingRemoveRanges[type] = null;
									this._lastInitSegments[type] = null;
									var sb = this._sourceBuffers[type];
									if (sb) {
										if (ms.readyState !== "closed") {
											try {
												ms.removeSourceBuffer(sb);
											} catch (error) {
												_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.e(this.TAG, error.message);
											}
											sb.removeEventListener("error", this.e.onSourceBufferError);
											sb.removeEventListener("updateend", this.e.onSourceBufferUpdateEnd);
										}
										this._mimeTypes[type] = null;
										this._sourceBuffers[type] = null;
									}
								}
								if (ms.readyState === "open") try {
									ms.endOfStream();
								} catch (error) {
									_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.e(this.TAG, error.message);
								}
								ms.removeEventListener("sourceopen", this.e.onSourceOpen);
								ms.removeEventListener("sourceended", this.e.onSourceEnded);
								ms.removeEventListener("sourceclose", this.e.onSourceClose);
								this._pendingSourceBufferInit = [];
								this._isBufferFull = false;
								this._idrList.clear();
								this._mediaSource = null;
							}
							if (this._mediaElement) {
								this._mediaElement.src = "";
								this._mediaElement.removeAttribute("src");
								this._mediaElement = null;
							}
							if (this._mediaSourceObjectURL) {
								window.URL.revokeObjectURL(this._mediaSourceObjectURL);
								this._mediaSourceObjectURL = null;
							}
						};
						MSEController.prototype.appendInitSegment = function(initSegment, deferred) {
							if (!this._mediaSource || this._mediaSource.readyState !== "open") {
								this._pendingSourceBufferInit.push(initSegment);
								this._pendingSegments[initSegment.type].push(initSegment);
								return;
							}
							var is = initSegment;
							var mimeType = "" + is.container;
							if (is.codec && is.codec.length > 0) mimeType += ";codecs=" + is.codec;
							var firstInitSegment = false;
							_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.v(this.TAG, "Received Initialization Segment, mimeType: " + mimeType);
							this._lastInitSegments[is.type] = is;
							if (mimeType !== this._mimeTypes[is.type]) {
								if (!this._mimeTypes[is.type]) {
									firstInitSegment = true;
									try {
										var sb = this._sourceBuffers[is.type] = this._mediaSource.addSourceBuffer(mimeType);
										sb.addEventListener("error", this.e.onSourceBufferError);
										sb.addEventListener("updateend", this.e.onSourceBufferUpdateEnd);
									} catch (error) {
										_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.e(this.TAG, error.message);
										this._emitter.emit(_mse_events_js__WEBPACK_IMPORTED_MODULE_3__.default.ERROR, {
											code: error.code,
											msg: error.message
										});
										return;
									}
								} else _utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.v(this.TAG, "Notice: " + is.type + " mimeType changed, origin: " + this._mimeTypes[is.type] + ", target: " + mimeType);
								this._mimeTypes[is.type] = mimeType;
							}
							if (!deferred) this._pendingSegments[is.type].push(is);
							if (!firstInitSegment) {
								if (this._sourceBuffers[is.type] && !this._sourceBuffers[is.type].updating) this._doAppendSegments();
							}
							if (_utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.safari && is.container === "audio/mpeg" && is.mediaDuration > 0) {
								this._requireSetMediaDuration = true;
								this._pendingMediaDuration = is.mediaDuration / 1e3;
								this._updateMediaSourceDuration();
							}
						};
						MSEController.prototype.appendMediaSegment = function(mediaSegment) {
							var ms = mediaSegment;
							this._pendingSegments[ms.type].push(ms);
							if (this._config.autoCleanupSourceBuffer && this._needCleanupSourceBuffer()) this._doCleanupSourceBuffer();
							var sb = this._sourceBuffers[ms.type];
							if (sb && !sb.updating && !this._hasPendingRemoveRanges()) this._doAppendSegments();
						};
						MSEController.prototype.seek = function(seconds) {
							for (var type in this._sourceBuffers) {
								if (!this._sourceBuffers[type]) continue;
								var sb = this._sourceBuffers[type];
								if (this._mediaSource.readyState === "open") try {
									sb.abort();
								} catch (error) {
									_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.e(this.TAG, error.message);
								}
								this._idrList.clear();
								var ps = this._pendingSegments[type];
								ps.splice(0, ps.length);
								if (this._mediaSource.readyState === "closed") continue;
								for (var i = 0; i < sb.buffered.length; i++) {
									var start = sb.buffered.start(i);
									var end = sb.buffered.end(i);
									this._pendingRemoveRanges[type].push({
										start,
										end
									});
								}
								if (!sb.updating) this._doRemoveRanges();
								if (_utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.safari) {
									var lastInitSegment = this._lastInitSegments[type];
									if (lastInitSegment) {
										this._pendingSegments[type].push(lastInitSegment);
										if (!sb.updating) this._doAppendSegments();
									}
								}
							}
						};
						MSEController.prototype.endOfStream = function() {
							var ms = this._mediaSource;
							var sb = this._sourceBuffers;
							if (!ms || ms.readyState !== "open") {
								if (ms && ms.readyState === "closed" && this._hasPendingSegments()) this._hasPendingEos = true;
								return;
							}
							if (sb.video && sb.video.updating || sb.audio && sb.audio.updating) this._hasPendingEos = true;
							else {
								this._hasPendingEos = false;
								ms.endOfStream();
							}
						};
						MSEController.prototype.getNearestKeyframe = function(dts) {
							return this._idrList.getLastSyncPointBeforeDts(dts);
						};
						MSEController.prototype._needCleanupSourceBuffer = function() {
							if (!this._config.autoCleanupSourceBuffer) return false;
							var currentTime = this._mediaElement.currentTime;
							for (var type in this._sourceBuffers) {
								var sb = this._sourceBuffers[type];
								if (sb) {
									var buffered = sb.buffered;
									if (buffered.length >= 1) {
										if (currentTime - buffered.start(0) >= this._config.autoCleanupMaxBackwardDuration) return true;
									}
								}
							}
							return false;
						};
						MSEController.prototype._doCleanupSourceBuffer = function() {
							var currentTime = this._mediaElement.currentTime;
							for (var type in this._sourceBuffers) {
								var sb = this._sourceBuffers[type];
								if (sb) {
									var buffered = sb.buffered;
									var doRemove = false;
									for (var i = 0; i < buffered.length; i++) {
										var start = buffered.start(i);
										var end = buffered.end(i);
										if (start <= currentTime && currentTime < end + 3) {
											if (currentTime - start >= this._config.autoCleanupMaxBackwardDuration) {
												doRemove = true;
												var removeEnd = currentTime - this._config.autoCleanupMinBackwardDuration;
												this._pendingRemoveRanges[type].push({
													start,
													end: removeEnd
												});
											}
										} else if (end < currentTime) {
											doRemove = true;
											this._pendingRemoveRanges[type].push({
												start,
												end
											});
										}
									}
									if (doRemove && !sb.updating) this._doRemoveRanges();
								}
							}
						};
						MSEController.prototype._updateMediaSourceDuration = function() {
							var sb = this._sourceBuffers;
							if (this._mediaElement.readyState === 0 || this._mediaSource.readyState !== "open") return;
							if (sb.video && sb.video.updating || sb.audio && sb.audio.updating) return;
							var current = this._mediaSource.duration;
							var target = this._pendingMediaDuration;
							if (target > 0 && (isNaN(current) || target > current)) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.v(this.TAG, "Update MediaSource duration from " + current + " to " + target);
								this._mediaSource.duration = target;
							}
							this._requireSetMediaDuration = false;
							this._pendingMediaDuration = 0;
						};
						MSEController.prototype._doRemoveRanges = function() {
							for (var type in this._pendingRemoveRanges) {
								if (!this._sourceBuffers[type] || this._sourceBuffers[type].updating) continue;
								var sb = this._sourceBuffers[type];
								var ranges = this._pendingRemoveRanges[type];
								while (ranges.length && !sb.updating) {
									var range = ranges.shift();
									sb.remove(range.start, range.end);
								}
							}
						};
						MSEController.prototype._doAppendSegments = function() {
							var pendingSegments = this._pendingSegments;
							for (var type in pendingSegments) {
								if (!this._sourceBuffers[type] || this._sourceBuffers[type].updating) continue;
								if (pendingSegments[type].length > 0) {
									var segment = pendingSegments[type].shift();
									if (segment.timestampOffset) {
										var currentOffset = this._sourceBuffers[type].timestampOffset;
										var targetOffset = segment.timestampOffset / 1e3;
										if (Math.abs(currentOffset - targetOffset) > .1) {
											_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.v(this.TAG, "Update MPEG audio timestampOffset from " + currentOffset + " to " + targetOffset);
											this._sourceBuffers[type].timestampOffset = targetOffset;
										}
										delete segment.timestampOffset;
									}
									if (!segment.data || segment.data.byteLength === 0) continue;
									try {
										this._sourceBuffers[type].appendBuffer(segment.data);
										this._isBufferFull = false;
										if (type === "video" && segment.hasOwnProperty("info")) this._idrList.appendArray(segment.info.syncPoints);
									} catch (error) {
										this._pendingSegments[type].unshift(segment);
										if (error.code === 22) {
											if (!this._isBufferFull) this._emitter.emit(_mse_events_js__WEBPACK_IMPORTED_MODULE_3__.default.BUFFER_FULL);
											this._isBufferFull = true;
										} else {
											_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.e(this.TAG, error.message);
											this._emitter.emit(_mse_events_js__WEBPACK_IMPORTED_MODULE_3__.default.ERROR, {
												code: error.code,
												msg: error.message
											});
										}
									}
								}
							}
						};
						MSEController.prototype._onSourceOpen = function() {
							_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.v(this.TAG, "MediaSource onSourceOpen");
							this._mediaSource.removeEventListener("sourceopen", this.e.onSourceOpen);
							if (this._pendingSourceBufferInit.length > 0) {
								var pendings = this._pendingSourceBufferInit;
								while (pendings.length) {
									var segment = pendings.shift();
									this.appendInitSegment(segment, true);
								}
							}
							if (this._hasPendingSegments()) this._doAppendSegments();
							this._emitter.emit(_mse_events_js__WEBPACK_IMPORTED_MODULE_3__.default.SOURCE_OPEN);
						};
						MSEController.prototype._onSourceEnded = function() {
							_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.v(this.TAG, "MediaSource onSourceEnded");
						};
						MSEController.prototype._onSourceClose = function() {
							_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.v(this.TAG, "MediaSource onSourceClose");
							if (this._mediaSource && this.e != null) {
								this._mediaSource.removeEventListener("sourceopen", this.e.onSourceOpen);
								this._mediaSource.removeEventListener("sourceended", this.e.onSourceEnded);
								this._mediaSource.removeEventListener("sourceclose", this.e.onSourceClose);
							}
						};
						MSEController.prototype._hasPendingSegments = function() {
							var ps = this._pendingSegments;
							return ps.video.length > 0 || ps.audio.length > 0;
						};
						MSEController.prototype._hasPendingRemoveRanges = function() {
							var prr = this._pendingRemoveRanges;
							return prr.video.length > 0 || prr.audio.length > 0;
						};
						MSEController.prototype._onSourceBufferUpdateEnd = function() {
							if (this._requireSetMediaDuration) this._updateMediaSourceDuration();
							else if (this._hasPendingRemoveRanges()) this._doRemoveRanges();
							else if (this._hasPendingSegments()) this._doAppendSegments();
							else if (this._hasPendingEos) this.endOfStream();
							this._emitter.emit(_mse_events_js__WEBPACK_IMPORTED_MODULE_3__.default.UPDATE_END);
						};
						MSEController.prototype._onSourceBufferError = function(e) {
							_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.e(this.TAG, "SourceBuffer Error: " + e);
						};
						return MSEController;
					}();
				}),
				"./src/core/mse-events.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!********************************!*\
					!*** ./src/core/mse-events.js ***!
					\********************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_exports__["default"] = {
						ERROR: "error",
						SOURCE_OPEN: "source_open",
						UPDATE_END: "update_end",
						BUFFER_FULL: "buffer_full"
					};
				}),
				"./src/core/transmuxer.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!********************************!*\
					!*** ./src/core/transmuxer.js ***!
					\********************************/
					__webpack_require__.r(__webpack_exports__);
					var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! events */
						"./node_modules/events/events.js"
					);
					var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);
					var webworkify_webpack__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! webworkify-webpack */
						"./node_modules/webworkify-webpack/index.js"
					);
					var webworkify_webpack__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/ __webpack_require__.n(webworkify_webpack__WEBPACK_IMPORTED_MODULE_1__);
					var _utils_logger_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ../utils/logger.js */
						"./src/utils/logger.js"
					);
					var _utils_logging_control_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
						/*! ../utils/logging-control.js */
						"./src/utils/logging-control.js"
					);
					var _transmuxing_controller_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
						/*! ./transmuxing-controller.js */
						"./src/core/transmuxing-controller.js"
					);
					var _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
						/*! ./transmuxing-events.js */
						"./src/core/transmuxing-events.js"
					);
					var _media_info_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(
						/*! ./media-info.js */
						"./src/core/media-info.js"
					);
					/*! ./transmuxing-worker */
					__webpack_exports__["default"] = function() {
						function Transmuxer(mediaDataSource, config) {
							this.TAG = "Transmuxer";
							this._emitter = new (events__WEBPACK_IMPORTED_MODULE_0___default())();
							if (config.enableWorker && typeof Worker !== "undefined") try {
								this._worker = webworkify_webpack__WEBPACK_IMPORTED_MODULE_1___default()("./src/core/transmuxing-worker.js");
								this._workerDestroying = false;
								this._worker.addEventListener("message", this._onWorkerMessage.bind(this));
								this._worker.postMessage({
									cmd: "init",
									param: [mediaDataSource, config]
								});
								this.e = { onLoggingConfigChanged: this._onLoggingConfigChanged.bind(this) };
								_utils_logging_control_js__WEBPACK_IMPORTED_MODULE_3__.default.registerListener(this.e.onLoggingConfigChanged);
								this._worker.postMessage({
									cmd: "logging_config",
									param: _utils_logging_control_js__WEBPACK_IMPORTED_MODULE_3__.default.getConfig()
								});
							} catch (error) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_2__.default.e(this.TAG, "Error while initialize transmuxing worker, fallback to inline transmuxing");
								this._worker = null;
								this._controller = new _transmuxing_controller_js__WEBPACK_IMPORTED_MODULE_4__.default(mediaDataSource, config);
							}
							else this._controller = new _transmuxing_controller_js__WEBPACK_IMPORTED_MODULE_4__.default(mediaDataSource, config);
							if (this._controller) {
								var ctl = this._controller;
								ctl.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.IO_ERROR, this._onIOError.bind(this));
								ctl.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.DEMUX_ERROR, this._onDemuxError.bind(this));
								ctl.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.INIT_SEGMENT, this._onInitSegment.bind(this));
								ctl.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.MEDIA_SEGMENT, this._onMediaSegment.bind(this));
								ctl.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.LOADING_COMPLETE, this._onLoadingComplete.bind(this));
								ctl.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.RECOVERED_EARLY_EOF, this._onRecoveredEarlyEof.bind(this));
								ctl.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.MEDIA_INFO, this._onMediaInfo.bind(this));
								ctl.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.METADATA_ARRIVED, this._onMetaDataArrived.bind(this));
								ctl.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.SCRIPTDATA_ARRIVED, this._onScriptDataArrived.bind(this));
								ctl.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.STATISTICS_INFO, this._onStatisticsInfo.bind(this));
								ctl.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.RECOMMEND_SEEKPOINT, this._onRecommendSeekpoint.bind(this));
							}
						}
						Transmuxer.prototype.destroy = function() {
							if (this._worker) {
								if (!this._workerDestroying) {
									this._workerDestroying = true;
									this._worker.postMessage({ cmd: "destroy" });
									_utils_logging_control_js__WEBPACK_IMPORTED_MODULE_3__.default.removeListener(this.e.onLoggingConfigChanged);
									this.e = null;
								}
							} else {
								this._controller.destroy();
								this._controller = null;
							}
							this._emitter.removeAllListeners();
							this._emitter = null;
						};
						Transmuxer.prototype.on = function(event, listener) {
							this._emitter.addListener(event, listener);
						};
						Transmuxer.prototype.off = function(event, listener) {
							this._emitter.removeListener(event, listener);
						};
						Transmuxer.prototype.hasWorker = function() {
							return this._worker != null;
						};
						Transmuxer.prototype.open = function() {
							if (this._worker) this._worker.postMessage({ cmd: "start" });
							else this._controller.start();
						};
						Transmuxer.prototype.close = function() {
							if (this._worker) this._worker.postMessage({ cmd: "stop" });
							else this._controller.stop();
						};
						Transmuxer.prototype.seek = function(milliseconds) {
							if (this._worker) this._worker.postMessage({
								cmd: "seek",
								param: milliseconds
							});
							else this._controller.seek(milliseconds);
						};
						Transmuxer.prototype.pause = function() {
							if (this._worker) this._worker.postMessage({ cmd: "pause" });
							else this._controller.pause();
						};
						Transmuxer.prototype.resume = function() {
							if (this._worker) this._worker.postMessage({ cmd: "resume" });
							else this._controller.resume();
						};
						Transmuxer.prototype._onInitSegment = function(type, initSegment) {
							var _this = this;
							Promise.resolve().then(function() {
								_this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.INIT_SEGMENT, type, initSegment);
							});
						};
						Transmuxer.prototype._onMediaSegment = function(type, mediaSegment) {
							var _this = this;
							Promise.resolve().then(function() {
								_this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.MEDIA_SEGMENT, type, mediaSegment);
							});
						};
						Transmuxer.prototype._onLoadingComplete = function() {
							var _this = this;
							Promise.resolve().then(function() {
								_this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.LOADING_COMPLETE);
							});
						};
						Transmuxer.prototype._onRecoveredEarlyEof = function() {
							var _this = this;
							Promise.resolve().then(function() {
								_this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.RECOVERED_EARLY_EOF);
							});
						};
						Transmuxer.prototype._onMediaInfo = function(mediaInfo) {
							var _this = this;
							Promise.resolve().then(function() {
								_this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.MEDIA_INFO, mediaInfo);
							});
						};
						Transmuxer.prototype._onMetaDataArrived = function(metadata) {
							var _this = this;
							Promise.resolve().then(function() {
								_this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.METADATA_ARRIVED, metadata);
							});
						};
						Transmuxer.prototype._onScriptDataArrived = function(data) {
							var _this = this;
							Promise.resolve().then(function() {
								_this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.SCRIPTDATA_ARRIVED, data);
							});
						};
						Transmuxer.prototype._onStatisticsInfo = function(statisticsInfo) {
							var _this = this;
							Promise.resolve().then(function() {
								_this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.STATISTICS_INFO, statisticsInfo);
							});
						};
						Transmuxer.prototype._onIOError = function(type, info) {
							var _this = this;
							Promise.resolve().then(function() {
								_this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.IO_ERROR, type, info);
							});
						};
						Transmuxer.prototype._onDemuxError = function(type, info) {
							var _this = this;
							Promise.resolve().then(function() {
								_this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.DEMUX_ERROR, type, info);
							});
						};
						Transmuxer.prototype._onRecommendSeekpoint = function(milliseconds) {
							var _this = this;
							Promise.resolve().then(function() {
								_this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.RECOMMEND_SEEKPOINT, milliseconds);
							});
						};
						Transmuxer.prototype._onLoggingConfigChanged = function(config) {
							if (this._worker) this._worker.postMessage({
								cmd: "logging_config",
								param: config
							});
						};
						Transmuxer.prototype._onWorkerMessage = function(e) {
							var message = e.data;
							var data = message.data;
							if (message.msg === "destroyed" || this._workerDestroying) {
								this._workerDestroying = false;
								this._worker.terminate();
								this._worker = null;
								return;
							}
							switch (message.msg) {
								case _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.INIT_SEGMENT:
								case _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.MEDIA_SEGMENT:
									this._emitter.emit(message.msg, data.type, data.data);
									break;
								case _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.LOADING_COMPLETE:
								case _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.RECOVERED_EARLY_EOF:
									this._emitter.emit(message.msg);
									break;
								case _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.MEDIA_INFO:
									Object.setPrototypeOf(data, _media_info_js__WEBPACK_IMPORTED_MODULE_6__.default.prototype);
									this._emitter.emit(message.msg, data);
									break;
								case _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.METADATA_ARRIVED:
								case _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.SCRIPTDATA_ARRIVED:
								case _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.STATISTICS_INFO:
									this._emitter.emit(message.msg, data);
									break;
								case _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.IO_ERROR:
								case _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.DEMUX_ERROR:
									this._emitter.emit(message.msg, data.type, data.info);
									break;
								case _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.RECOMMEND_SEEKPOINT:
									this._emitter.emit(message.msg, data);
									break;
								case "logcat_callback": _utils_logger_js__WEBPACK_IMPORTED_MODULE_2__.default.emitter.emit("log", data.type, data.logcat);
							}
						};
						return Transmuxer;
					}();
				}),
				"./src/core/transmuxing-controller.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!********************************************!*\
					!*** ./src/core/transmuxing-controller.js ***!
					\********************************************/
					__webpack_require__.r(__webpack_exports__);
					var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! events */
						"./node_modules/events/events.js"
					);
					var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);
					var _utils_logger_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ../utils/logger.js */
						"./src/utils/logger.js"
					);
					var _utils_browser_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ../utils/browser.js */
						"./src/utils/browser.js"
					);
					var _media_info_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
						/*! ./media-info.js */
						"./src/core/media-info.js"
					);
					var _demux_flv_demuxer_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
						/*! ../demux/flv-demuxer.js */
						"./src/demux/flv-demuxer.js"
					);
					var _remux_mp4_remuxer_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
						/*! ../remux/mp4-remuxer.js */
						"./src/remux/mp4-remuxer.js"
					);
					var _demux_demux_errors_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(
						/*! ../demux/demux-errors.js */
						"./src/demux/demux-errors.js"
					);
					var _io_io_controller_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(
						/*! ../io/io-controller.js */
						"./src/io/io-controller.js"
					);
					var _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(
						/*! ./transmuxing-events.js */
						"./src/core/transmuxing-events.js"
					);
					__webpack_exports__["default"] = function() {
						function TransmuxingController(mediaDataSource, config) {
							this.TAG = "TransmuxingController";
							this._emitter = new (events__WEBPACK_IMPORTED_MODULE_0___default())();
							this._config = config;
							if (!mediaDataSource.segments) mediaDataSource.segments = [{
								duration: mediaDataSource.duration,
								filesize: mediaDataSource.filesize,
								url: mediaDataSource.url
							}];
							if (typeof mediaDataSource.cors !== "boolean") mediaDataSource.cors = true;
							if (typeof mediaDataSource.withCredentials !== "boolean") mediaDataSource.withCredentials = false;
							this._mediaDataSource = mediaDataSource;
							this._currentSegmentIndex = 0;
							var totalDuration = 0;
							this._mediaDataSource.segments.forEach(function(segment) {
								segment.timestampBase = totalDuration;
								totalDuration += segment.duration;
								segment.cors = mediaDataSource.cors;
								segment.withCredentials = mediaDataSource.withCredentials;
								if (config.referrerPolicy) segment.referrerPolicy = config.referrerPolicy;
							});
							if (!isNaN(totalDuration) && this._mediaDataSource.duration !== totalDuration) this._mediaDataSource.duration = totalDuration;
							this._mediaInfo = null;
							this._demuxer = null;
							this._remuxer = null;
							this._ioctl = null;
							this._pendingSeekTime = null;
							this._pendingResolveSeekPoint = null;
							this._statisticsReporter = null;
						}
						TransmuxingController.prototype.destroy = function() {
							this._mediaInfo = null;
							this._mediaDataSource = null;
							if (this._statisticsReporter) this._disableStatisticsReporter();
							if (this._ioctl) {
								this._ioctl.destroy();
								this._ioctl = null;
							}
							if (this._demuxer) {
								this._demuxer.destroy();
								this._demuxer = null;
							}
							if (this._remuxer) {
								this._remuxer.destroy();
								this._remuxer = null;
							}
							this._emitter.removeAllListeners();
							this._emitter = null;
						};
						TransmuxingController.prototype.on = function(event, listener) {
							this._emitter.addListener(event, listener);
						};
						TransmuxingController.prototype.off = function(event, listener) {
							this._emitter.removeListener(event, listener);
						};
						TransmuxingController.prototype.start = function() {
							this._loadSegment(0);
							this._enableStatisticsReporter();
						};
						TransmuxingController.prototype._loadSegment = function(segmentIndex, optionalFrom) {
							this._currentSegmentIndex = segmentIndex;
							var dataSource = this._mediaDataSource.segments[segmentIndex];
							var ioctl = this._ioctl = new _io_io_controller_js__WEBPACK_IMPORTED_MODULE_7__.default(dataSource, this._config, segmentIndex);
							ioctl.onError = this._onIOException.bind(this);
							ioctl.onSeeked = this._onIOSeeked.bind(this);
							ioctl.onComplete = this._onIOComplete.bind(this);
							ioctl.onRedirect = this._onIORedirect.bind(this);
							ioctl.onRecoveredEarlyEof = this._onIORecoveredEarlyEof.bind(this);
							if (optionalFrom) this._demuxer.bindDataSource(this._ioctl);
							else ioctl.onDataArrival = this._onInitChunkArrival.bind(this);
							ioctl.open(optionalFrom);
						};
						TransmuxingController.prototype.stop = function() {
							this._internalAbort();
							this._disableStatisticsReporter();
						};
						TransmuxingController.prototype._internalAbort = function() {
							if (this._ioctl) {
								this._ioctl.destroy();
								this._ioctl = null;
							}
						};
						TransmuxingController.prototype.pause = function() {
							if (this._ioctl && this._ioctl.isWorking()) {
								this._ioctl.pause();
								this._disableStatisticsReporter();
							}
						};
						TransmuxingController.prototype.resume = function() {
							if (this._ioctl && this._ioctl.isPaused()) {
								this._ioctl.resume();
								this._enableStatisticsReporter();
							}
						};
						TransmuxingController.prototype.seek = function(milliseconds) {
							if (this._mediaInfo == null || !this._mediaInfo.isSeekable()) return;
							var targetSegmentIndex = this._searchSegmentIndexContains(milliseconds);
							if (targetSegmentIndex === this._currentSegmentIndex) {
								var segmentInfo = this._mediaInfo.segments[targetSegmentIndex];
								if (segmentInfo == void 0) this._pendingSeekTime = milliseconds;
								else {
									var keyframe = segmentInfo.getNearestKeyframe(milliseconds);
									this._remuxer.seek(keyframe.milliseconds);
									this._ioctl.seek(keyframe.fileposition);
									this._pendingResolveSeekPoint = keyframe.milliseconds;
								}
							} else {
								var targetSegmentInfo = this._mediaInfo.segments[targetSegmentIndex];
								if (targetSegmentInfo == void 0) {
									this._pendingSeekTime = milliseconds;
									this._internalAbort();
									this._remuxer.seek();
									this._remuxer.insertDiscontinuity();
									this._loadSegment(targetSegmentIndex);
								} else {
									var keyframe = targetSegmentInfo.getNearestKeyframe(milliseconds);
									this._internalAbort();
									this._remuxer.seek(milliseconds);
									this._remuxer.insertDiscontinuity();
									this._demuxer.resetMediaInfo();
									this._demuxer.timestampBase = this._mediaDataSource.segments[targetSegmentIndex].timestampBase;
									this._loadSegment(targetSegmentIndex, keyframe.fileposition);
									this._pendingResolveSeekPoint = keyframe.milliseconds;
									this._reportSegmentMediaInfo(targetSegmentIndex);
								}
							}
							this._enableStatisticsReporter();
						};
						TransmuxingController.prototype._searchSegmentIndexContains = function(milliseconds) {
							var segments = this._mediaDataSource.segments;
							var idx = segments.length - 1;
							for (var i = 0; i < segments.length; i++) if (milliseconds < segments[i].timestampBase) {
								idx = i - 1;
								break;
							}
							return idx;
						};
						TransmuxingController.prototype._onInitChunkArrival = function(data, byteStart) {
							var _this = this;
							var probeData = null;
							var consumed = 0;
							if (byteStart > 0) {
								this._demuxer.bindDataSource(this._ioctl);
								this._demuxer.timestampBase = this._mediaDataSource.segments[this._currentSegmentIndex].timestampBase;
								consumed = this._demuxer.parseChunks(data, byteStart);
							} else if ((probeData = _demux_flv_demuxer_js__WEBPACK_IMPORTED_MODULE_4__.default.probe(data)).match) {
								this._demuxer = new _demux_flv_demuxer_js__WEBPACK_IMPORTED_MODULE_4__.default(probeData, this._config);
								if (!this._remuxer) this._remuxer = new _remux_mp4_remuxer_js__WEBPACK_IMPORTED_MODULE_5__.default(this._config);
								var mds = this._mediaDataSource;
								if (mds.duration != void 0 && !isNaN(mds.duration)) this._demuxer.overridedDuration = mds.duration;
								if (typeof mds.hasAudio === "boolean") this._demuxer.overridedHasAudio = mds.hasAudio;
								if (typeof mds.hasVideo === "boolean") this._demuxer.overridedHasVideo = mds.hasVideo;
								this._demuxer.timestampBase = mds.segments[this._currentSegmentIndex].timestampBase;
								this._demuxer.onError = this._onDemuxException.bind(this);
								this._demuxer.onMediaInfo = this._onMediaInfo.bind(this);
								this._demuxer.onMetaDataArrived = this._onMetaDataArrived.bind(this);
								this._demuxer.onScriptDataArrived = this._onScriptDataArrived.bind(this);
								this._remuxer.bindDataSource(this._demuxer.bindDataSource(this._ioctl));
								this._remuxer.onInitSegment = this._onRemuxerInitSegmentArrival.bind(this);
								this._remuxer.onMediaSegment = this._onRemuxerMediaSegmentArrival.bind(this);
								consumed = this._demuxer.parseChunks(data, byteStart);
							} else {
								probeData = null;
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.e(this.TAG, "Non-FLV, Unsupported media type!");
								Promise.resolve().then(function() {
									_this._internalAbort();
								});
								this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__.default.DEMUX_ERROR, _demux_demux_errors_js__WEBPACK_IMPORTED_MODULE_6__.default.FORMAT_UNSUPPORTED, "Non-FLV, Unsupported media type");
								consumed = 0;
							}
							return consumed;
						};
						TransmuxingController.prototype._onMediaInfo = function(mediaInfo) {
							var _this = this;
							if (this._mediaInfo == null) {
								this._mediaInfo = Object.assign({}, mediaInfo);
								this._mediaInfo.keyframesIndex = null;
								this._mediaInfo.segments = [];
								this._mediaInfo.segmentCount = this._mediaDataSource.segments.length;
								Object.setPrototypeOf(this._mediaInfo, _media_info_js__WEBPACK_IMPORTED_MODULE_3__.default.prototype);
							}
							var segmentInfo = Object.assign({}, mediaInfo);
							Object.setPrototypeOf(segmentInfo, _media_info_js__WEBPACK_IMPORTED_MODULE_3__.default.prototype);
							this._mediaInfo.segments[this._currentSegmentIndex] = segmentInfo;
							this._reportSegmentMediaInfo(this._currentSegmentIndex);
							if (this._pendingSeekTime != null) Promise.resolve().then(function() {
								var target = _this._pendingSeekTime;
								_this._pendingSeekTime = null;
								_this.seek(target);
							});
						};
						TransmuxingController.prototype._onMetaDataArrived = function(metadata) {
							this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__.default.METADATA_ARRIVED, metadata);
						};
						TransmuxingController.prototype._onScriptDataArrived = function(data) {
							this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__.default.SCRIPTDATA_ARRIVED, data);
						};
						TransmuxingController.prototype._onIOSeeked = function() {
							this._remuxer.insertDiscontinuity();
						};
						TransmuxingController.prototype._onIOComplete = function(extraData) {
							var nextSegmentIndex = extraData + 1;
							if (nextSegmentIndex < this._mediaDataSource.segments.length) {
								this._internalAbort();
								this._remuxer.flushStashedSamples();
								this._loadSegment(nextSegmentIndex);
							} else {
								this._remuxer.flushStashedSamples();
								this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__.default.LOADING_COMPLETE);
								this._disableStatisticsReporter();
							}
						};
						TransmuxingController.prototype._onIORedirect = function(redirectedURL) {
							var segmentIndex = this._ioctl.extraData;
							this._mediaDataSource.segments[segmentIndex].redirectedURL = redirectedURL;
						};
						TransmuxingController.prototype._onIORecoveredEarlyEof = function() {
							this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__.default.RECOVERED_EARLY_EOF);
						};
						TransmuxingController.prototype._onIOException = function(type, info) {
							_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.e(this.TAG, "IOException: type = " + type + ", code = " + info.code + ", msg = " + info.msg);
							this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__.default.IO_ERROR, type, info);
							this._disableStatisticsReporter();
						};
						TransmuxingController.prototype._onDemuxException = function(type, info) {
							_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.e(this.TAG, "DemuxException: type = " + type + ", info = " + info);
							this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__.default.DEMUX_ERROR, type, info);
						};
						TransmuxingController.prototype._onRemuxerInitSegmentArrival = function(type, initSegment) {
							this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__.default.INIT_SEGMENT, type, initSegment);
						};
						TransmuxingController.prototype._onRemuxerMediaSegmentArrival = function(type, mediaSegment) {
							if (this._pendingSeekTime != null) return;
							this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__.default.MEDIA_SEGMENT, type, mediaSegment);
							if (this._pendingResolveSeekPoint != null && type === "video") {
								var syncPoints = mediaSegment.info.syncPoints;
								var seekpoint = this._pendingResolveSeekPoint;
								this._pendingResolveSeekPoint = null;
								if (_utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.safari && syncPoints.length > 0 && syncPoints[0].originalDts === seekpoint) seekpoint = syncPoints[0].pts;
								this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__.default.RECOMMEND_SEEKPOINT, seekpoint);
							}
						};
						TransmuxingController.prototype._enableStatisticsReporter = function() {
							if (this._statisticsReporter == null) this._statisticsReporter = self.setInterval(this._reportStatisticsInfo.bind(this), this._config.statisticsInfoReportInterval);
						};
						TransmuxingController.prototype._disableStatisticsReporter = function() {
							if (this._statisticsReporter) {
								self.clearInterval(this._statisticsReporter);
								this._statisticsReporter = null;
							}
						};
						TransmuxingController.prototype._reportSegmentMediaInfo = function(segmentIndex) {
							var segmentInfo = this._mediaInfo.segments[segmentIndex];
							var exportInfo = Object.assign({}, segmentInfo);
							exportInfo.duration = this._mediaInfo.duration;
							exportInfo.segmentCount = this._mediaInfo.segmentCount;
							delete exportInfo.segments;
							delete exportInfo.keyframesIndex;
							this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__.default.MEDIA_INFO, exportInfo);
						};
						TransmuxingController.prototype._reportStatisticsInfo = function() {
							var info = {};
							info.url = this._ioctl.currentURL;
							info.hasRedirect = this._ioctl.hasRedirect;
							if (info.hasRedirect) info.redirectedURL = this._ioctl.currentRedirectedURL;
							info.speed = this._ioctl.currentSpeed;
							info.loaderType = this._ioctl.loaderType;
							info.currentSegmentIndex = this._currentSegmentIndex;
							info.totalSegmentCount = this._mediaDataSource.segments.length;
							this._emitter.emit(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_8__.default.STATISTICS_INFO, info);
						};
						return TransmuxingController;
					}();
				}),
				"./src/core/transmuxing-events.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!****************************************!*\
					!*** ./src/core/transmuxing-events.js ***!
					\****************************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_exports__["default"] = {
						IO_ERROR: "io_error",
						DEMUX_ERROR: "demux_error",
						INIT_SEGMENT: "init_segment",
						MEDIA_SEGMENT: "media_segment",
						LOADING_COMPLETE: "loading_complete",
						RECOVERED_EARLY_EOF: "recovered_early_eof",
						MEDIA_INFO: "media_info",
						METADATA_ARRIVED: "metadata_arrived",
						SCRIPTDATA_ARRIVED: "scriptdata_arrived",
						STATISTICS_INFO: "statistics_info",
						RECOMMEND_SEEKPOINT: "recommend_seekpoint"
					};
				}),
				"./src/core/transmuxing-worker.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!****************************************!*\
					!*** ./src/core/transmuxing-worker.js ***!
					\****************************************/
					__webpack_require__.r(__webpack_exports__);
					var _utils_logging_control_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ../utils/logging-control.js */
						"./src/utils/logging-control.js"
					);
					var _utils_polyfill_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ../utils/polyfill.js */
						"./src/utils/polyfill.js"
					);
					var _transmuxing_controller_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ./transmuxing-controller.js */
						"./src/core/transmuxing-controller.js"
					);
					var _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
						/*! ./transmuxing-events.js */
						"./src/core/transmuxing-events.js"
					);
					var TransmuxingWorker = function(self) {
						var controller = null;
						var logcatListener = onLogcatCallback.bind(this);
						_utils_polyfill_js__WEBPACK_IMPORTED_MODULE_1__.default.install();
						self.addEventListener("message", function(e) {
							switch (e.data.cmd) {
								case "init":
									controller = new _transmuxing_controller_js__WEBPACK_IMPORTED_MODULE_2__.default(e.data.param[0], e.data.param[1]);
									controller.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.IO_ERROR, onIOError.bind(this));
									controller.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.DEMUX_ERROR, onDemuxError.bind(this));
									controller.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.INIT_SEGMENT, onInitSegment.bind(this));
									controller.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.MEDIA_SEGMENT, onMediaSegment.bind(this));
									controller.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.LOADING_COMPLETE, onLoadingComplete.bind(this));
									controller.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.RECOVERED_EARLY_EOF, onRecoveredEarlyEof.bind(this));
									controller.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.MEDIA_INFO, onMediaInfo.bind(this));
									controller.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.METADATA_ARRIVED, onMetaDataArrived.bind(this));
									controller.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.SCRIPTDATA_ARRIVED, onScriptDataArrived.bind(this));
									controller.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.STATISTICS_INFO, onStatisticsInfo.bind(this));
									controller.on(_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.RECOMMEND_SEEKPOINT, onRecommendSeekpoint.bind(this));
									break;
								case "destroy":
									if (controller) {
										controller.destroy();
										controller = null;
									}
									self.postMessage({ msg: "destroyed" });
									break;
								case "start":
									controller.start();
									break;
								case "stop":
									controller.stop();
									break;
								case "seek":
									controller.seek(e.data.param);
									break;
								case "pause":
									controller.pause();
									break;
								case "resume":
									controller.resume();
									break;
								case "logging_config":
									var config = e.data.param;
									_utils_logging_control_js__WEBPACK_IMPORTED_MODULE_0__.default.applyConfig(config);
									if (config.enableCallback === true) _utils_logging_control_js__WEBPACK_IMPORTED_MODULE_0__.default.addLogListener(logcatListener);
									else _utils_logging_control_js__WEBPACK_IMPORTED_MODULE_0__.default.removeLogListener(logcatListener);
							}
						});
						function onInitSegment(type, initSegment) {
							var obj = {
								msg: _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.INIT_SEGMENT,
								data: {
									type,
									data: initSegment
								}
							};
							self.postMessage(obj, [initSegment.data]);
						}
						function onMediaSegment(type, mediaSegment) {
							var obj = {
								msg: _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.MEDIA_SEGMENT,
								data: {
									type,
									data: mediaSegment
								}
							};
							self.postMessage(obj, [mediaSegment.data]);
						}
						function onLoadingComplete() {
							var obj = { msg: _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.LOADING_COMPLETE };
							self.postMessage(obj);
						}
						function onRecoveredEarlyEof() {
							var obj = { msg: _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.RECOVERED_EARLY_EOF };
							self.postMessage(obj);
						}
						function onMediaInfo(mediaInfo) {
							var obj = {
								msg: _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.MEDIA_INFO,
								data: mediaInfo
							};
							self.postMessage(obj);
						}
						function onMetaDataArrived(metadata) {
							var obj = {
								msg: _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.METADATA_ARRIVED,
								data: metadata
							};
							self.postMessage(obj);
						}
						function onScriptDataArrived(data) {
							var obj = {
								msg: _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.SCRIPTDATA_ARRIVED,
								data
							};
							self.postMessage(obj);
						}
						function onStatisticsInfo(statInfo) {
							var obj = {
								msg: _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.STATISTICS_INFO,
								data: statInfo
							};
							self.postMessage(obj);
						}
						function onIOError(type, info) {
							self.postMessage({
								msg: _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.IO_ERROR,
								data: {
									type,
									info
								}
							});
						}
						function onDemuxError(type, info) {
							self.postMessage({
								msg: _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.DEMUX_ERROR,
								data: {
									type,
									info
								}
							});
						}
						function onRecommendSeekpoint(milliseconds) {
							self.postMessage({
								msg: _transmuxing_events_js__WEBPACK_IMPORTED_MODULE_3__.default.RECOMMEND_SEEKPOINT,
								data: milliseconds
							});
						}
						function onLogcatCallback(type, str) {
							self.postMessage({
								msg: "logcat_callback",
								data: {
									type,
									logcat: str
								}
							});
						}
					};
					__webpack_exports__["default"] = TransmuxingWorker;
				}),
				"./src/demux/amf-parser.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!*********************************!*\
					!*** ./src/demux/amf-parser.js ***!
					\*********************************/
					__webpack_require__.r(__webpack_exports__);
					var _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ../utils/logger.js */
						"./src/utils/logger.js"
					);
					var _utils_utf8_conv_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ../utils/utf8-conv.js */
						"./src/utils/utf8-conv.js"
					);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					var le = (function() {
						var buf = /* @__PURE__ */ new ArrayBuffer(2);
						new DataView(buf).setInt16(0, 256, true);
						return new Int16Array(buf)[0] === 256;
					})();
					__webpack_exports__["default"] = function() {
						function AMF() {}
						AMF.parseScriptData = function(arrayBuffer, dataOffset, dataSize) {
							var data = {};
							try {
								var name_1 = AMF.parseValue(arrayBuffer, dataOffset, dataSize);
								var value = AMF.parseValue(arrayBuffer, dataOffset + name_1.size, dataSize - name_1.size);
								data[name_1.data] = value.data;
							} catch (e) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.e("AMF", e.toString());
							}
							return data;
						};
						AMF.parseObject = function(arrayBuffer, dataOffset, dataSize) {
							if (dataSize < 3) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__.IllegalStateException("Data not enough when parse ScriptDataObject");
							var name = AMF.parseString(arrayBuffer, dataOffset, dataSize);
							var value = AMF.parseValue(arrayBuffer, dataOffset + name.size, dataSize - name.size);
							var isObjectEnd = value.objectEnd;
							return {
								data: {
									name: name.data,
									value: value.data
								},
								size: name.size + value.size,
								objectEnd: isObjectEnd
							};
						};
						AMF.parseVariable = function(arrayBuffer, dataOffset, dataSize) {
							return AMF.parseObject(arrayBuffer, dataOffset, dataSize);
						};
						AMF.parseString = function(arrayBuffer, dataOffset, dataSize) {
							if (dataSize < 2) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__.IllegalStateException("Data not enough when parse String");
							var length = new DataView(arrayBuffer, dataOffset, dataSize).getUint16(0, !le);
							var str;
							if (length > 0) str = (0, _utils_utf8_conv_js__WEBPACK_IMPORTED_MODULE_1__.default)(new Uint8Array(arrayBuffer, dataOffset + 2, length));
							else str = "";
							return {
								data: str,
								size: 2 + length
							};
						};
						AMF.parseLongString = function(arrayBuffer, dataOffset, dataSize) {
							if (dataSize < 4) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__.IllegalStateException("Data not enough when parse LongString");
							var length = new DataView(arrayBuffer, dataOffset, dataSize).getUint32(0, !le);
							var str;
							if (length > 0) str = (0, _utils_utf8_conv_js__WEBPACK_IMPORTED_MODULE_1__.default)(new Uint8Array(arrayBuffer, dataOffset + 4, length));
							else str = "";
							return {
								data: str,
								size: 4 + length
							};
						};
						AMF.parseDate = function(arrayBuffer, dataOffset, dataSize) {
							if (dataSize < 10) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__.IllegalStateException("Data size invalid when parse Date");
							var v = new DataView(arrayBuffer, dataOffset, dataSize);
							var timestamp = v.getFloat64(0, !le);
							var localTimeOffset = v.getInt16(8, !le);
							timestamp += localTimeOffset * 60 * 1e3;
							return {
								data: new Date(timestamp),
								size: 10
							};
						};
						AMF.parseValue = function(arrayBuffer, dataOffset, dataSize) {
							if (dataSize < 1) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__.IllegalStateException("Data not enough when parse Value");
							var v = new DataView(arrayBuffer, dataOffset, dataSize);
							var offset = 1;
							var type = v.getUint8(0);
							var value;
							var objectEnd = false;
							try {
								switch (type) {
									case 0:
										value = v.getFloat64(1, !le);
										offset += 8;
										break;
									case 1:
										value = v.getUint8(1) ? true : false;
										offset += 1;
										break;
									case 2:
										var amfstr = AMF.parseString(arrayBuffer, dataOffset + 1, dataSize - 1);
										value = amfstr.data;
										offset += amfstr.size;
										break;
									case 3:
										value = {};
										var terminal = 0;
										if ((v.getUint32(dataSize - 4, !le) & 16777215) === 9) terminal = 3;
										while (offset < dataSize - 4) {
											var amfobj = AMF.parseObject(arrayBuffer, dataOffset + offset, dataSize - offset - terminal);
											if (amfobj.objectEnd) break;
											value[amfobj.data.name] = amfobj.data.value;
											offset += amfobj.size;
										}
										if (offset <= dataSize - 3) {
											var marker = v.getUint32(offset - 1, !le) & 16777215;
											if (marker === 9) offset += 3;
										}
										break;
									case 8:
										value = {};
										offset += 4;
										var terminal = 0;
										if ((v.getUint32(dataSize - 4, !le) & 16777215) === 9) terminal = 3;
										while (offset < dataSize - 8) {
											var amfvar = AMF.parseVariable(arrayBuffer, dataOffset + offset, dataSize - offset - terminal);
											if (amfvar.objectEnd) break;
											value[amfvar.data.name] = amfvar.data.value;
											offset += amfvar.size;
										}
										if (offset <= dataSize - 3) {
											var marker = v.getUint32(offset - 1, !le) & 16777215;
											if (marker === 9) offset += 3;
										}
										break;
									case 9:
										value = void 0;
										offset = 1;
										objectEnd = true;
										break;
									case 10:
										value = [];
										var strictArrayLength = v.getUint32(1, !le);
										offset += 4;
										for (var i = 0; i < strictArrayLength; i++) {
											var val = AMF.parseValue(arrayBuffer, dataOffset + offset, dataSize - offset);
											value.push(val.data);
											offset += val.size;
										}
										break;
									case 11:
										var date = AMF.parseDate(arrayBuffer, dataOffset + 1, dataSize - 1);
										value = date.data;
										offset += date.size;
										break;
									case 12:
										var amfLongStr = AMF.parseString(arrayBuffer, dataOffset + 1, dataSize - 1);
										value = amfLongStr.data;
										offset += amfLongStr.size;
										break;
									default:
										offset = dataSize;
										_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w("AMF", "Unsupported AMF value type " + type);
								}
							} catch (e) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.e("AMF", e.toString());
							}
							return {
								data: value,
								size: offset,
								objectEnd
							};
						};
						return AMF;
					}();
				}),
				"./src/demux/demux-errors.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!***********************************!*\
					!*** ./src/demux/demux-errors.js ***!
					\***********************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_exports__["default"] = {
						OK: "OK",
						FORMAT_ERROR: "FormatError",
						FORMAT_UNSUPPORTED: "FormatUnsupported",
						CODEC_UNSUPPORTED: "CodecUnsupported"
					};
				}),
				"./src/demux/exp-golomb.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!*********************************!*\
					!*** ./src/demux/exp-golomb.js ***!
					\*********************************/
					__webpack_require__.r(__webpack_exports__);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					__webpack_exports__["default"] = function() {
						function ExpGolomb(uint8array) {
							this.TAG = "ExpGolomb";
							this._buffer = uint8array;
							this._buffer_index = 0;
							this._total_bytes = uint8array.byteLength;
							this._total_bits = uint8array.byteLength * 8;
							this._current_word = 0;
							this._current_word_bits_left = 0;
						}
						ExpGolomb.prototype.destroy = function() {
							this._buffer = null;
						};
						ExpGolomb.prototype._fillCurrentWord = function() {
							var buffer_bytes_left = this._total_bytes - this._buffer_index;
							if (buffer_bytes_left <= 0) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_0__.IllegalStateException("ExpGolomb: _fillCurrentWord() but no bytes available");
							var bytes_read = Math.min(4, buffer_bytes_left);
							var word = /* @__PURE__ */ new Uint8Array(4);
							word.set(this._buffer.subarray(this._buffer_index, this._buffer_index + bytes_read));
							this._current_word = new DataView(word.buffer).getUint32(0, false);
							this._buffer_index += bytes_read;
							this._current_word_bits_left = bytes_read * 8;
						};
						ExpGolomb.prototype.readBits = function(bits) {
							if (bits > 32) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_0__.InvalidArgumentException("ExpGolomb: readBits() bits exceeded max 32bits!");
							if (bits <= this._current_word_bits_left) {
								var result_1 = this._current_word >>> 32 - bits;
								this._current_word <<= bits;
								this._current_word_bits_left -= bits;
								return result_1;
							}
							var result = this._current_word_bits_left ? this._current_word : 0;
							result = result >>> 32 - this._current_word_bits_left;
							var bits_need_left = bits - this._current_word_bits_left;
							this._fillCurrentWord();
							var bits_read_next = Math.min(bits_need_left, this._current_word_bits_left);
							var result2 = this._current_word >>> 32 - bits_read_next;
							this._current_word <<= bits_read_next;
							this._current_word_bits_left -= bits_read_next;
							result = result << bits_read_next | result2;
							return result;
						};
						ExpGolomb.prototype.readBool = function() {
							return this.readBits(1) === 1;
						};
						ExpGolomb.prototype.readByte = function() {
							return this.readBits(8);
						};
						ExpGolomb.prototype._skipLeadingZero = function() {
							var zero_count;
							for (zero_count = 0; zero_count < this._current_word_bits_left; zero_count++) if (0 !== (this._current_word & 2147483648 >>> zero_count)) {
								this._current_word <<= zero_count;
								this._current_word_bits_left -= zero_count;
								return zero_count;
							}
							this._fillCurrentWord();
							return zero_count + this._skipLeadingZero();
						};
						ExpGolomb.prototype.readUEG = function() {
							var leading_zeros = this._skipLeadingZero();
							return this.readBits(leading_zeros + 1) - 1;
						};
						ExpGolomb.prototype.readSEG = function() {
							var value = this.readUEG();
							if (value & 1) return value + 1 >>> 1;
							else return -1 * (value >>> 1);
						};
						return ExpGolomb;
					}();
				}),
				"./src/demux/flv-demuxer.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!**********************************!*\
					!*** ./src/demux/flv-demuxer.js ***!
					\**********************************/
					__webpack_require__.r(__webpack_exports__);
					var _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ../utils/logger.js */
						"./src/utils/logger.js"
					);
					var _amf_parser_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ./amf-parser.js */
						"./src/demux/amf-parser.js"
					);
					var _sps_parser_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ./sps-parser.js */
						"./src/demux/sps-parser.js"
					);
					var _demux_errors_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
						/*! ./demux-errors.js */
						"./src/demux/demux-errors.js"
					);
					var _core_media_info_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
						/*! ../core/media-info.js */
						"./src/core/media-info.js"
					);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					function ReadBig32(array, index) {
						return array[index] << 24 | array[index + 1] << 16 | array[index + 2] << 8 | array[index + 3];
					}
					__webpack_exports__["default"] = function() {
						function FLVDemuxer(probeData, config) {
							this.TAG = "FLVDemuxer";
							this._config = config;
							this._onError = null;
							this._onMediaInfo = null;
							this._onMetaDataArrived = null;
							this._onScriptDataArrived = null;
							this._onTrackMetadata = null;
							this._onDataAvailable = null;
							this._dataOffset = probeData.dataOffset;
							this._firstParse = true;
							this._dispatch = false;
							this._hasAudio = probeData.hasAudioTrack;
							this._hasVideo = probeData.hasVideoTrack;
							this._hasAudioFlagOverrided = false;
							this._hasVideoFlagOverrided = false;
							this._audioInitialMetadataDispatched = false;
							this._videoInitialMetadataDispatched = false;
							this._mediaInfo = new _core_media_info_js__WEBPACK_IMPORTED_MODULE_4__.default();
							this._mediaInfo.hasAudio = this._hasAudio;
							this._mediaInfo.hasVideo = this._hasVideo;
							this._metadata = null;
							this._audioMetadata = null;
							this._videoMetadata = null;
							this._naluLengthSize = 4;
							this._timestampBase = 0;
							this._timescale = 1e3;
							this._duration = 0;
							this._durationOverrided = false;
							this._referenceFrameRate = {
								fixed: true,
								fps: 23.976,
								fps_num: 23976,
								fps_den: 1e3
							};
							this._flvSoundRateTable = [
								5500,
								11025,
								22050,
								44100,
								48e3
							];
							this._mpegSamplingRates = [
								96e3,
								88200,
								64e3,
								48e3,
								44100,
								32e3,
								24e3,
								22050,
								16e3,
								12e3,
								11025,
								8e3,
								7350
							];
							this._mpegAudioV10SampleRateTable = [
								44100,
								48e3,
								32e3,
								0
							];
							this._mpegAudioV20SampleRateTable = [
								22050,
								24e3,
								16e3,
								0
							];
							this._mpegAudioV25SampleRateTable = [
								11025,
								12e3,
								8e3,
								0
							];
							this._mpegAudioL1BitRateTable = [
								0,
								32,
								64,
								96,
								128,
								160,
								192,
								224,
								256,
								288,
								320,
								352,
								384,
								416,
								448,
								-1
							];
							this._mpegAudioL2BitRateTable = [
								0,
								32,
								48,
								56,
								64,
								80,
								96,
								112,
								128,
								160,
								192,
								224,
								256,
								320,
								384,
								-1
							];
							this._mpegAudioL3BitRateTable = [
								0,
								32,
								40,
								48,
								56,
								64,
								80,
								96,
								112,
								128,
								160,
								192,
								224,
								256,
								320,
								-1
							];
							this._videoTrack = {
								type: "video",
								id: 1,
								sequenceNumber: 0,
								samples: [],
								length: 0
							};
							this._audioTrack = {
								type: "audio",
								id: 2,
								sequenceNumber: 0,
								samples: [],
								length: 0
							};
							this._littleEndian = (function() {
								var buf = /* @__PURE__ */ new ArrayBuffer(2);
								new DataView(buf).setInt16(0, 256, true);
								return new Int16Array(buf)[0] === 256;
							})();
						}
						FLVDemuxer.prototype.destroy = function() {
							this._mediaInfo = null;
							this._metadata = null;
							this._audioMetadata = null;
							this._videoMetadata = null;
							this._videoTrack = null;
							this._audioTrack = null;
							this._onError = null;
							this._onMediaInfo = null;
							this._onMetaDataArrived = null;
							this._onScriptDataArrived = null;
							this._onTrackMetadata = null;
							this._onDataAvailable = null;
						};
						FLVDemuxer.probe = function(buffer) {
							var data = new Uint8Array(buffer);
							var mismatch = { match: false };
							if (data[0] !== 70 || data[1] !== 76 || data[2] !== 86 || data[3] !== 1) return mismatch;
							var hasAudio = (data[4] & 4) >>> 2 !== 0;
							var hasVideo = (data[4] & 1) !== 0;
							var offset = ReadBig32(data, 5);
							if (offset < 9) return mismatch;
							return {
								match: true,
								consumed: offset,
								dataOffset: offset,
								hasAudioTrack: hasAudio,
								hasVideoTrack: hasVideo
							};
						};
						FLVDemuxer.prototype.bindDataSource = function(loader) {
							loader.onDataArrival = this.parseChunks.bind(this);
							return this;
						};
						Object.defineProperty(FLVDemuxer.prototype, "onTrackMetadata", {
							get: function() {
								return this._onTrackMetadata;
							},
							set: function(callback) {
								this._onTrackMetadata = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FLVDemuxer.prototype, "onMediaInfo", {
							get: function() {
								return this._onMediaInfo;
							},
							set: function(callback) {
								this._onMediaInfo = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FLVDemuxer.prototype, "onMetaDataArrived", {
							get: function() {
								return this._onMetaDataArrived;
							},
							set: function(callback) {
								this._onMetaDataArrived = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FLVDemuxer.prototype, "onScriptDataArrived", {
							get: function() {
								return this._onScriptDataArrived;
							},
							set: function(callback) {
								this._onScriptDataArrived = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FLVDemuxer.prototype, "onError", {
							get: function() {
								return this._onError;
							},
							set: function(callback) {
								this._onError = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FLVDemuxer.prototype, "onDataAvailable", {
							get: function() {
								return this._onDataAvailable;
							},
							set: function(callback) {
								this._onDataAvailable = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FLVDemuxer.prototype, "timestampBase", {
							get: function() {
								return this._timestampBase;
							},
							set: function(base) {
								this._timestampBase = base;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FLVDemuxer.prototype, "overridedDuration", {
							get: function() {
								return this._duration;
							},
							set: function(duration) {
								this._durationOverrided = true;
								this._duration = duration;
								this._mediaInfo.duration = duration;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FLVDemuxer.prototype, "overridedHasAudio", {
							set: function(hasAudio) {
								this._hasAudioFlagOverrided = true;
								this._hasAudio = hasAudio;
								this._mediaInfo.hasAudio = hasAudio;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FLVDemuxer.prototype, "overridedHasVideo", {
							set: function(hasVideo) {
								this._hasVideoFlagOverrided = true;
								this._hasVideo = hasVideo;
								this._mediaInfo.hasVideo = hasVideo;
							},
							enumerable: false,
							configurable: true
						});
						FLVDemuxer.prototype.resetMediaInfo = function() {
							this._mediaInfo = new _core_media_info_js__WEBPACK_IMPORTED_MODULE_4__.default();
						};
						FLVDemuxer.prototype._isInitialMetadataDispatched = function() {
							if (this._hasAudio && this._hasVideo) return this._audioInitialMetadataDispatched && this._videoInitialMetadataDispatched;
							if (this._hasAudio && !this._hasVideo) return this._audioInitialMetadataDispatched;
							if (!this._hasAudio && this._hasVideo) return this._videoInitialMetadataDispatched;
							return false;
						};
						FLVDemuxer.prototype.parseChunks = function(chunk, byteStart) {
							if (!this._onError || !this._onMediaInfo || !this._onTrackMetadata || !this._onDataAvailable) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_5__.IllegalStateException("Flv: onError & onMediaInfo & onTrackMetadata & onDataAvailable callback must be specified");
							var offset = 0;
							var le = this._littleEndian;
							if (byteStart === 0) if (chunk.byteLength > 13) offset = FLVDemuxer.probe(chunk).dataOffset;
							else return 0;
							if (this._firstParse) {
								this._firstParse = false;
								if (byteStart + offset !== this._dataOffset) _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "First time parsing but chunk byteStart invalid!");
								var v = new DataView(chunk, offset);
								if (v.getUint32(0, !le) !== 0) _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "PrevTagSize0 !== 0 !!!");
								offset += 4;
							}
							while (offset < chunk.byteLength) {
								this._dispatch = true;
								var v = new DataView(chunk, offset);
								if (offset + 11 + 4 > chunk.byteLength) break;
								var tagType = v.getUint8(0);
								var dataSize = v.getUint32(0, !le) & 16777215;
								if (offset + 11 + dataSize + 4 > chunk.byteLength) break;
								if (tagType !== 8 && tagType !== 9 && tagType !== 18) {
									_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Unsupported tag type " + tagType + ", skipped");
									offset += 11 + dataSize + 4;
									continue;
								}
								var ts2 = v.getUint8(4);
								var ts1 = v.getUint8(5);
								var ts0 = v.getUint8(6);
								var ts3 = v.getUint8(7);
								var timestamp = ts0 | ts1 << 8 | ts2 << 16 | ts3 << 24;
								if ((v.getUint32(7, !le) & 16777215) !== 0) _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Meet tag which has StreamID != 0!");
								var dataOffset = offset + 11;
								switch (tagType) {
									case 8:
										this._parseAudioData(chunk, dataOffset, dataSize, timestamp);
										break;
									case 9:
										this._parseVideoData(chunk, dataOffset, dataSize, timestamp, byteStart + offset);
										break;
									case 18: this._parseScriptData(chunk, dataOffset, dataSize);
								}
								var prevTagSize = v.getUint32(11 + dataSize, !le);
								if (prevTagSize !== 11 + dataSize) _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Invalid PrevTagSize " + prevTagSize);
								offset += 11 + dataSize + 4;
							}
							if (this._isInitialMetadataDispatched()) {
								if (this._dispatch && (this._audioTrack.length || this._videoTrack.length)) this._onDataAvailable(this._audioTrack, this._videoTrack);
							}
							return offset;
						};
						FLVDemuxer.prototype._parseScriptData = function(arrayBuffer, dataOffset, dataSize) {
							var scriptData = _amf_parser_js__WEBPACK_IMPORTED_MODULE_1__.default.parseScriptData(arrayBuffer, dataOffset, dataSize);
							if (scriptData.hasOwnProperty("onMetaData")) {
								if (scriptData.onMetaData == null || typeof scriptData.onMetaData !== "object") {
									_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Invalid onMetaData structure!");
									return;
								}
								if (this._metadata) _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Found another onMetaData tag!");
								this._metadata = scriptData;
								var onMetaData = this._metadata.onMetaData;
								if (this._onMetaDataArrived) this._onMetaDataArrived(Object.assign({}, onMetaData));
								if (typeof onMetaData.hasAudio === "boolean") {
									if (this._hasAudioFlagOverrided === false) {
										this._hasAudio = onMetaData.hasAudio;
										this._mediaInfo.hasAudio = this._hasAudio;
									}
								}
								if (typeof onMetaData.hasVideo === "boolean") {
									if (this._hasVideoFlagOverrided === false) {
										this._hasVideo = onMetaData.hasVideo;
										this._mediaInfo.hasVideo = this._hasVideo;
									}
								}
								if (typeof onMetaData.audiodatarate === "number") this._mediaInfo.audioDataRate = onMetaData.audiodatarate;
								if (typeof onMetaData.videodatarate === "number") this._mediaInfo.videoDataRate = onMetaData.videodatarate;
								if (typeof onMetaData.width === "number") this._mediaInfo.width = onMetaData.width;
								if (typeof onMetaData.height === "number") this._mediaInfo.height = onMetaData.height;
								if (typeof onMetaData.duration === "number") {
									if (!this._durationOverrided) {
										var duration = Math.floor(onMetaData.duration * this._timescale);
										this._duration = duration;
										this._mediaInfo.duration = duration;
									}
								} else this._mediaInfo.duration = 0;
								if (typeof onMetaData.framerate === "number") {
									var fps_num = Math.floor(onMetaData.framerate * 1e3);
									if (fps_num > 0) {
										var fps = fps_num / 1e3;
										this._referenceFrameRate.fixed = true;
										this._referenceFrameRate.fps = fps;
										this._referenceFrameRate.fps_num = fps_num;
										this._referenceFrameRate.fps_den = 1e3;
										this._mediaInfo.fps = fps;
									}
								}
								if (typeof onMetaData.keyframes === "object") {
									this._mediaInfo.hasKeyframesIndex = true;
									var keyframes = onMetaData.keyframes;
									this._mediaInfo.keyframesIndex = this._parseKeyframesIndex(keyframes);
									onMetaData.keyframes = null;
								} else this._mediaInfo.hasKeyframesIndex = false;
								this._dispatch = false;
								this._mediaInfo.metadata = onMetaData;
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.v(this.TAG, "Parsed onMetaData");
								if (this._mediaInfo.isComplete()) this._onMediaInfo(this._mediaInfo);
							}
							if (Object.keys(scriptData).length > 0) {
								if (this._onScriptDataArrived) this._onScriptDataArrived(Object.assign({}, scriptData));
							}
						};
						FLVDemuxer.prototype._parseKeyframesIndex = function(keyframes) {
							var times = [];
							var filepositions = [];
							for (var i = 1; i < keyframes.times.length; i++) {
								var time = this._timestampBase + Math.floor(keyframes.times[i] * 1e3);
								times.push(time);
								filepositions.push(keyframes.filepositions[i]);
							}
							return {
								times,
								filepositions
							};
						};
						FLVDemuxer.prototype._parseAudioData = function(arrayBuffer, dataOffset, dataSize, tagTimestamp) {
							if (dataSize <= 1) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Flv: Invalid audio packet, missing SoundData payload!");
								return;
							}
							if (this._hasAudioFlagOverrided === true && this._hasAudio === false) return;
							this._littleEndian;
							var soundSpec = new DataView(arrayBuffer, dataOffset, dataSize).getUint8(0);
							var soundFormat = soundSpec >>> 4;
							if (soundFormat !== 2 && soundFormat !== 10) {
								this._onError(_demux_errors_js__WEBPACK_IMPORTED_MODULE_3__.default.CODEC_UNSUPPORTED, "Flv: Unsupported audio codec idx: " + soundFormat);
								return;
							}
							var soundRate = 0;
							var soundRateIndex = (soundSpec & 12) >>> 2;
							if (soundRateIndex >= 0 && soundRateIndex <= 4) soundRate = this._flvSoundRateTable[soundRateIndex];
							else {
								this._onError(_demux_errors_js__WEBPACK_IMPORTED_MODULE_3__.default.FORMAT_ERROR, "Flv: Invalid audio sample rate idx: " + soundRateIndex);
								return;
							}
							(soundSpec & 2) >>> 1;
							var soundType = soundSpec & 1;
							var meta = this._audioMetadata;
							var track = this._audioTrack;
							if (!meta) {
								if (this._hasAudio === false && this._hasAudioFlagOverrided === false) {
									this._hasAudio = true;
									this._mediaInfo.hasAudio = true;
								}
								meta = this._audioMetadata = {};
								meta.type = "audio";
								meta.id = track.id;
								meta.timescale = this._timescale;
								meta.duration = this._duration;
								meta.audioSampleRate = soundRate;
								meta.channelCount = soundType === 0 ? 1 : 2;
							}
							if (soundFormat === 10) {
								var aacData = this._parseAACAudioData(arrayBuffer, dataOffset + 1, dataSize - 1);
								if (aacData == void 0) return;
								if (aacData.packetType === 0) {
									if (meta.config) _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Found another AudioSpecificConfig!");
									var misc = aacData.data;
									meta.audioSampleRate = misc.samplingRate;
									meta.channelCount = misc.channelCount;
									meta.codec = misc.codec;
									meta.originalCodec = misc.originalCodec;
									meta.config = misc.config;
									meta.refSampleDuration = 1024 / meta.audioSampleRate * meta.timescale;
									_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.v(this.TAG, "Parsed AudioSpecificConfig");
									if (this._isInitialMetadataDispatched()) {
										if (this._dispatch && (this._audioTrack.length || this._videoTrack.length)) this._onDataAvailable(this._audioTrack, this._videoTrack);
									} else this._audioInitialMetadataDispatched = true;
									this._dispatch = false;
									this._onTrackMetadata("audio", meta);
									var mi = this._mediaInfo;
									mi.audioCodec = meta.originalCodec;
									mi.audioSampleRate = meta.audioSampleRate;
									mi.audioChannelCount = meta.channelCount;
									if (mi.hasVideo) {
										if (mi.videoCodec != null) mi.mimeType = "video/x-flv; codecs=\"" + mi.videoCodec + "," + mi.audioCodec + "\"";
									} else mi.mimeType = "video/x-flv; codecs=\"" + mi.audioCodec + "\"";
									if (mi.isComplete()) this._onMediaInfo(mi);
								} else if (aacData.packetType === 1) {
									var dts = this._timestampBase + tagTimestamp;
									var aacSample = {
										unit: aacData.data,
										length: aacData.data.byteLength,
										dts,
										pts: dts
									};
									track.samples.push(aacSample);
									track.length += aacData.data.length;
								} else _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.e(this.TAG, "Flv: Unsupported AAC data type " + aacData.packetType);
							} else if (soundFormat === 2) {
								if (!meta.codec) {
									var misc = this._parseMP3AudioData(arrayBuffer, dataOffset + 1, dataSize - 1, true);
									if (misc == void 0) return;
									meta.audioSampleRate = misc.samplingRate;
									meta.channelCount = misc.channelCount;
									meta.codec = misc.codec;
									meta.originalCodec = misc.originalCodec;
									meta.refSampleDuration = 1152 / meta.audioSampleRate * meta.timescale;
									_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.v(this.TAG, "Parsed MPEG Audio Frame Header");
									this._audioInitialMetadataDispatched = true;
									this._onTrackMetadata("audio", meta);
									var mi = this._mediaInfo;
									mi.audioCodec = meta.codec;
									mi.audioSampleRate = meta.audioSampleRate;
									mi.audioChannelCount = meta.channelCount;
									mi.audioDataRate = misc.bitRate;
									if (mi.hasVideo) {
										if (mi.videoCodec != null) mi.mimeType = "video/x-flv; codecs=\"" + mi.videoCodec + "," + mi.audioCodec + "\"";
									} else mi.mimeType = "video/x-flv; codecs=\"" + mi.audioCodec + "\"";
									if (mi.isComplete()) this._onMediaInfo(mi);
								}
								var data = this._parseMP3AudioData(arrayBuffer, dataOffset + 1, dataSize - 1, false);
								if (data == void 0) return;
								var dts = this._timestampBase + tagTimestamp;
								var mp3Sample = {
									unit: data,
									length: data.byteLength,
									dts,
									pts: dts
								};
								track.samples.push(mp3Sample);
								track.length += data.length;
							}
						};
						FLVDemuxer.prototype._parseAACAudioData = function(arrayBuffer, dataOffset, dataSize) {
							if (dataSize <= 1) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Flv: Invalid AAC packet, missing AACPacketType or/and Data!");
								return;
							}
							var result = {};
							var array = new Uint8Array(arrayBuffer, dataOffset, dataSize);
							result.packetType = array[0];
							if (array[0] === 0) result.data = this._parseAACAudioSpecificConfig(arrayBuffer, dataOffset + 1, dataSize - 1);
							else result.data = array.subarray(1);
							return result;
						};
						FLVDemuxer.prototype._parseAACAudioSpecificConfig = function(arrayBuffer, dataOffset, dataSize) {
							var array = new Uint8Array(arrayBuffer, dataOffset, dataSize);
							var config = null;
							var audioObjectType = 0;
							var originalAudioObjectType = 0;
							var samplingIndex = 0;
							var extensionSamplingIndex = null;
							audioObjectType = originalAudioObjectType = array[0] >>> 3;
							samplingIndex = (array[0] & 7) << 1 | array[1] >>> 7;
							if (samplingIndex < 0 || samplingIndex >= this._mpegSamplingRates.length) {
								this._onError(_demux_errors_js__WEBPACK_IMPORTED_MODULE_3__.default.FORMAT_ERROR, "Flv: AAC invalid sampling frequency index!");
								return;
							}
							var samplingFrequence = this._mpegSamplingRates[samplingIndex];
							var channelConfig = (array[1] & 120) >>> 3;
							if (channelConfig < 0 || channelConfig >= 8) {
								this._onError(_demux_errors_js__WEBPACK_IMPORTED_MODULE_3__.default.FORMAT_ERROR, "Flv: AAC invalid channel configuration");
								return;
							}
							if (audioObjectType === 5) {
								extensionSamplingIndex = (array[1] & 7) << 1 | array[2] >>> 7;
								(array[2] & 124) >>> 2;
							}
							var userAgent = self.navigator.userAgent.toLowerCase();
							if (userAgent.indexOf("firefox") !== -1) if (samplingIndex >= 6) {
								audioObjectType = 5;
								config = new Array(4);
								extensionSamplingIndex = samplingIndex - 3;
							} else {
								audioObjectType = 2;
								config = new Array(2);
								extensionSamplingIndex = samplingIndex;
							}
							else if (userAgent.indexOf("android") !== -1) {
								audioObjectType = 2;
								config = new Array(2);
								extensionSamplingIndex = samplingIndex;
							} else {
								audioObjectType = 5;
								extensionSamplingIndex = samplingIndex;
								config = new Array(4);
								if (samplingIndex >= 6) extensionSamplingIndex = samplingIndex - 3;
								else if (channelConfig === 1) {
									audioObjectType = 2;
									config = new Array(2);
									extensionSamplingIndex = samplingIndex;
								}
							}
							config[0] = audioObjectType << 3;
							config[0] |= (samplingIndex & 15) >>> 1;
							config[1] = (samplingIndex & 15) << 7;
							config[1] |= (channelConfig & 15) << 3;
							if (audioObjectType === 5) {
								config[1] |= (extensionSamplingIndex & 15) >>> 1;
								config[2] = (extensionSamplingIndex & 1) << 7;
								config[2] |= 8;
								config[3] = 0;
							}
							return {
								config,
								samplingRate: samplingFrequence,
								channelCount: channelConfig,
								codec: "mp4a.40." + audioObjectType,
								originalCodec: "mp4a.40." + originalAudioObjectType
							};
						};
						FLVDemuxer.prototype._parseMP3AudioData = function(arrayBuffer, dataOffset, dataSize, requestHeader) {
							if (dataSize < 4) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Flv: Invalid MP3 packet, header missing!");
								return;
							}
							this._littleEndian;
							var array = new Uint8Array(arrayBuffer, dataOffset, dataSize);
							var result = null;
							if (requestHeader) {
								if (array[0] !== 255) return;
								var ver = array[1] >>> 3 & 3;
								var layer = (array[1] & 6) >> 1;
								var bitrate_index = (array[2] & 240) >>> 4;
								var sampling_freq_index = (array[2] & 12) >>> 2;
								var channel_count = (array[3] >>> 6 & 3) !== 3 ? 2 : 1;
								var sample_rate = 0;
								var bit_rate = 0;
								var codec = "mp3";
								switch (ver) {
									case 0:
										sample_rate = this._mpegAudioV25SampleRateTable[sampling_freq_index];
										break;
									case 2:
										sample_rate = this._mpegAudioV20SampleRateTable[sampling_freq_index];
										break;
									case 3: sample_rate = this._mpegAudioV10SampleRateTable[sampling_freq_index];
								}
								switch (layer) {
									case 1:
										if (bitrate_index < this._mpegAudioL3BitRateTable.length) bit_rate = this._mpegAudioL3BitRateTable[bitrate_index];
										break;
									case 2:
										if (bitrate_index < this._mpegAudioL2BitRateTable.length) bit_rate = this._mpegAudioL2BitRateTable[bitrate_index];
										break;
									case 3: if (bitrate_index < this._mpegAudioL1BitRateTable.length) bit_rate = this._mpegAudioL1BitRateTable[bitrate_index];
								}
								result = {
									bitRate: bit_rate,
									samplingRate: sample_rate,
									channelCount: channel_count,
									codec,
									originalCodec: codec
								};
							} else result = array;
							return result;
						};
						FLVDemuxer.prototype._parseVideoData = function(arrayBuffer, dataOffset, dataSize, tagTimestamp, tagPosition) {
							if (dataSize <= 1) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Flv: Invalid video packet, missing VideoData payload!");
								return;
							}
							if (this._hasVideoFlagOverrided === true && this._hasVideo === false) return;
							var spec = new Uint8Array(arrayBuffer, dataOffset, dataSize)[0];
							var frameType = (spec & 240) >>> 4;
							var codecId = spec & 15;
							if (codecId !== 7) {
								this._onError(_demux_errors_js__WEBPACK_IMPORTED_MODULE_3__.default.CODEC_UNSUPPORTED, "Flv: Unsupported codec in video frame: " + codecId);
								return;
							}
							this._parseAVCVideoPacket(arrayBuffer, dataOffset + 1, dataSize - 1, tagTimestamp, tagPosition, frameType);
						};
						FLVDemuxer.prototype._parseAVCVideoPacket = function(arrayBuffer, dataOffset, dataSize, tagTimestamp, tagPosition, frameType) {
							if (dataSize < 4) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Flv: Invalid AVC packet, missing AVCPacketType or/and CompositionTime");
								return;
							}
							var le = this._littleEndian;
							var v = new DataView(arrayBuffer, dataOffset, dataSize);
							var packetType = v.getUint8(0);
							var cts = (v.getUint32(0, !le) & 16777215) << 8 >> 8;
							if (packetType === 0) this._parseAVCDecoderConfigurationRecord(arrayBuffer, dataOffset + 4, dataSize - 4);
							else if (packetType === 1) this._parseAVCVideoData(arrayBuffer, dataOffset + 4, dataSize - 4, tagTimestamp, tagPosition, frameType, cts);
							else if (packetType === 2) {} else {
								this._onError(_demux_errors_js__WEBPACK_IMPORTED_MODULE_3__.default.FORMAT_ERROR, "Flv: Invalid video packet type " + packetType);
								return;
							}
						};
						FLVDemuxer.prototype._parseAVCDecoderConfigurationRecord = function(arrayBuffer, dataOffset, dataSize) {
							if (dataSize < 7) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Flv: Invalid AVCDecoderConfigurationRecord, lack of data!");
								return;
							}
							var meta = this._videoMetadata;
							var track = this._videoTrack;
							var le = this._littleEndian;
							var v = new DataView(arrayBuffer, dataOffset, dataSize);
							if (!meta) {
								if (this._hasVideo === false && this._hasVideoFlagOverrided === false) {
									this._hasVideo = true;
									this._mediaInfo.hasVideo = true;
								}
								meta = this._videoMetadata = {};
								meta.type = "video";
								meta.id = track.id;
								meta.timescale = this._timescale;
								meta.duration = this._duration;
							} else if (typeof meta.avcc !== "undefined") _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Found another AVCDecoderConfigurationRecord!");
							var version = v.getUint8(0);
							var avcProfile = v.getUint8(1);
							v.getUint8(2);
							v.getUint8(3);
							if (version !== 1 || avcProfile === 0) {
								this._onError(_demux_errors_js__WEBPACK_IMPORTED_MODULE_3__.default.FORMAT_ERROR, "Flv: Invalid AVCDecoderConfigurationRecord");
								return;
							}
							this._naluLengthSize = (v.getUint8(4) & 3) + 1;
							if (this._naluLengthSize !== 3 && this._naluLengthSize !== 4) {
								this._onError(_demux_errors_js__WEBPACK_IMPORTED_MODULE_3__.default.FORMAT_ERROR, "Flv: Strange NaluLengthSizeMinusOne: " + (this._naluLengthSize - 1));
								return;
							}
							var spsCount = v.getUint8(5) & 31;
							if (spsCount === 0) {
								this._onError(_demux_errors_js__WEBPACK_IMPORTED_MODULE_3__.default.FORMAT_ERROR, "Flv: Invalid AVCDecoderConfigurationRecord: No SPS");
								return;
							} else if (spsCount > 1) _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Flv: Strange AVCDecoderConfigurationRecord: SPS Count = " + spsCount);
							var offset = 6;
							for (var i = 0; i < spsCount; i++) {
								var len = v.getUint16(offset, !le);
								offset += 2;
								if (len === 0) continue;
								var sps = new Uint8Array(arrayBuffer, dataOffset + offset, len);
								offset += len;
								var config = _sps_parser_js__WEBPACK_IMPORTED_MODULE_2__.default.parseSPS(sps);
								if (i !== 0) continue;
								meta.codecWidth = config.codec_size.width;
								meta.codecHeight = config.codec_size.height;
								meta.presentWidth = config.present_size.width;
								meta.presentHeight = config.present_size.height;
								meta.profile = config.profile_string;
								meta.level = config.level_string;
								meta.bitDepth = config.bit_depth;
								meta.chromaFormat = config.chroma_format;
								meta.sarRatio = config.sar_ratio;
								meta.frameRate = config.frame_rate;
								if (config.frame_rate.fixed === false || config.frame_rate.fps_num === 0 || config.frame_rate.fps_den === 0) meta.frameRate = this._referenceFrameRate;
								var fps_den = meta.frameRate.fps_den;
								var fps_num = meta.frameRate.fps_num;
								meta.refSampleDuration = meta.timescale * (fps_den / fps_num);
								var codecArray = sps.subarray(1, 4);
								var codecString = "avc1.";
								for (var j = 0; j < 3; j++) {
									var h = codecArray[j].toString(16);
									if (h.length < 2) h = "0" + h;
									codecString += h;
								}
								meta.codec = codecString;
								var mi = this._mediaInfo;
								mi.width = meta.codecWidth;
								mi.height = meta.codecHeight;
								mi.fps = meta.frameRate.fps;
								mi.profile = meta.profile;
								mi.level = meta.level;
								mi.refFrames = config.ref_frames;
								mi.chromaFormat = config.chroma_format_string;
								mi.sarNum = meta.sarRatio.width;
								mi.sarDen = meta.sarRatio.height;
								mi.videoCodec = codecString;
								if (mi.hasAudio) {
									if (mi.audioCodec != null) mi.mimeType = "video/x-flv; codecs=\"" + mi.videoCodec + "," + mi.audioCodec + "\"";
								} else mi.mimeType = "video/x-flv; codecs=\"" + mi.videoCodec + "\"";
								if (mi.isComplete()) this._onMediaInfo(mi);
							}
							var ppsCount = v.getUint8(offset);
							if (ppsCount === 0) {
								this._onError(_demux_errors_js__WEBPACK_IMPORTED_MODULE_3__.default.FORMAT_ERROR, "Flv: Invalid AVCDecoderConfigurationRecord: No PPS");
								return;
							} else if (ppsCount > 1) _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Flv: Strange AVCDecoderConfigurationRecord: PPS Count = " + ppsCount);
							offset++;
							for (var i = 0; i < ppsCount; i++) {
								var len = v.getUint16(offset, !le);
								offset += 2;
								if (len === 0) continue;
								offset += len;
							}
							meta.avcc = new Uint8Array(dataSize);
							meta.avcc.set(new Uint8Array(arrayBuffer, dataOffset, dataSize), 0);
							_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.v(this.TAG, "Parsed AVCDecoderConfigurationRecord");
							if (this._isInitialMetadataDispatched()) {
								if (this._dispatch && (this._audioTrack.length || this._videoTrack.length)) this._onDataAvailable(this._audioTrack, this._videoTrack);
							} else this._videoInitialMetadataDispatched = true;
							this._dispatch = false;
							this._onTrackMetadata("video", meta);
						};
						FLVDemuxer.prototype._parseAVCVideoData = function(arrayBuffer, dataOffset, dataSize, tagTimestamp, tagPosition, frameType, cts) {
							var le = this._littleEndian;
							var v = new DataView(arrayBuffer, dataOffset, dataSize);
							var units = [], length = 0;
							var offset = 0;
							var lengthSize = this._naluLengthSize;
							var dts = this._timestampBase + tagTimestamp;
							var keyframe = frameType === 1;
							while (offset < dataSize) {
								if (offset + 4 >= dataSize) {
									_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Malformed Nalu near timestamp " + dts + ", offset = " + offset + ", dataSize = " + dataSize);
									break;
								}
								var naluSize = v.getUint32(offset, !le);
								if (lengthSize === 3) naluSize >>>= 8;
								if (naluSize > dataSize - lengthSize) {
									_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Malformed Nalus near timestamp " + dts + ", NaluSize > DataSize!");
									return;
								}
								var unitType = v.getUint8(offset + lengthSize) & 31;
								if (unitType === 5) keyframe = true;
								var data = new Uint8Array(arrayBuffer, dataOffset + offset, lengthSize + naluSize);
								var unit = {
									type: unitType,
									data
								};
								units.push(unit);
								length += data.byteLength;
								offset += lengthSize + naluSize;
							}
							if (units.length) {
								var track = this._videoTrack;
								var avcSample = {
									units,
									length,
									isKeyframe: keyframe,
									dts,
									cts,
									pts: dts + cts
								};
								if (keyframe) avcSample.fileposition = tagPosition;
								track.samples.push(avcSample);
								track.length += length;
							}
						};
						return FLVDemuxer;
					}();
				}),
				"./src/demux/sps-parser.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!*********************************!*\
					!*** ./src/demux/sps-parser.js ***!
					\*********************************/
					__webpack_require__.r(__webpack_exports__);
					var _exp_golomb_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ./exp-golomb.js */
						"./src/demux/exp-golomb.js"
					);
					__webpack_exports__["default"] = function() {
						function SPSParser() {}
						SPSParser._ebsp2rbsp = function(uint8array) {
							var src = uint8array;
							var src_length = src.byteLength;
							var dst = new Uint8Array(src_length);
							var dst_idx = 0;
							for (var i = 0; i < src_length; i++) {
								if (i >= 2) {
									if (src[i] === 3 && src[i - 1] === 0 && src[i - 2] === 0) continue;
								}
								dst[dst_idx] = src[i];
								dst_idx++;
							}
							return new Uint8Array(dst.buffer, 0, dst_idx);
						};
						SPSParser.parseSPS = function(uint8array) {
							var rbsp = SPSParser._ebsp2rbsp(uint8array);
							var gb = new _exp_golomb_js__WEBPACK_IMPORTED_MODULE_0__.default(rbsp);
							gb.readByte();
							var profile_idc = gb.readByte();
							gb.readByte();
							var level_idc = gb.readByte();
							gb.readUEG();
							var profile_string = SPSParser.getProfileString(profile_idc);
							var level_string = SPSParser.getLevelString(level_idc);
							var chroma_format_idc = 1;
							var chroma_format = 420;
							var chroma_format_table = [
								0,
								420,
								422,
								444
							];
							var bit_depth = 8;
							if (profile_idc === 100 || profile_idc === 110 || profile_idc === 122 || profile_idc === 244 || profile_idc === 44 || profile_idc === 83 || profile_idc === 86 || profile_idc === 118 || profile_idc === 128 || profile_idc === 138 || profile_idc === 144) {
								chroma_format_idc = gb.readUEG();
								if (chroma_format_idc === 3) gb.readBits(1);
								if (chroma_format_idc <= 3) chroma_format = chroma_format_table[chroma_format_idc];
								bit_depth = gb.readUEG() + 8;
								gb.readUEG();
								gb.readBits(1);
								if (gb.readBool()) {
									var scaling_list_count = chroma_format_idc !== 3 ? 8 : 12;
									for (var i = 0; i < scaling_list_count; i++) if (gb.readBool()) if (i < 6) SPSParser._skipScalingList(gb, 16);
									else SPSParser._skipScalingList(gb, 64);
								}
							}
							gb.readUEG();
							var pic_order_cnt_type = gb.readUEG();
							if (pic_order_cnt_type === 0) gb.readUEG();
							else if (pic_order_cnt_type === 1) {
								gb.readBits(1);
								gb.readSEG();
								gb.readSEG();
								var num_ref_frames_in_pic_order_cnt_cycle = gb.readUEG();
								for (var i = 0; i < num_ref_frames_in_pic_order_cnt_cycle; i++) gb.readSEG();
							}
							var ref_frames = gb.readUEG();
							gb.readBits(1);
							var pic_width_in_mbs_minus1 = gb.readUEG();
							var pic_height_in_map_units_minus1 = gb.readUEG();
							var frame_mbs_only_flag = gb.readBits(1);
							if (frame_mbs_only_flag === 0) gb.readBits(1);
							gb.readBits(1);
							var frame_crop_left_offset = 0;
							var frame_crop_right_offset = 0;
							var frame_crop_top_offset = 0;
							var frame_crop_bottom_offset = 0;
							if (gb.readBool()) {
								frame_crop_left_offset = gb.readUEG();
								frame_crop_right_offset = gb.readUEG();
								frame_crop_top_offset = gb.readUEG();
								frame_crop_bottom_offset = gb.readUEG();
							}
							var sar_width = 1, sar_height = 1;
							var fps = 0, fps_fixed = true, fps_num = 0, fps_den = 0;
							if (gb.readBool()) {
								if (gb.readBool()) {
									var aspect_ratio_idc = gb.readByte();
									var sar_w_table = [
										1,
										12,
										10,
										16,
										40,
										24,
										20,
										32,
										80,
										18,
										15,
										64,
										160,
										4,
										3,
										2
									];
									var sar_h_table = [
										1,
										11,
										11,
										11,
										33,
										11,
										11,
										11,
										33,
										11,
										11,
										33,
										99,
										3,
										2,
										1
									];
									if (aspect_ratio_idc > 0 && aspect_ratio_idc < 16) {
										sar_width = sar_w_table[aspect_ratio_idc - 1];
										sar_height = sar_h_table[aspect_ratio_idc - 1];
									} else if (aspect_ratio_idc === 255) {
										sar_width = gb.readByte() << 8 | gb.readByte();
										sar_height = gb.readByte() << 8 | gb.readByte();
									}
								}
								if (gb.readBool()) gb.readBool();
								if (gb.readBool()) {
									gb.readBits(4);
									if (gb.readBool()) gb.readBits(24);
								}
								if (gb.readBool()) {
									gb.readUEG();
									gb.readUEG();
								}
								if (gb.readBool()) {
									var num_units_in_tick = gb.readBits(32);
									var time_scale = gb.readBits(32);
									fps_fixed = gb.readBool();
									fps_num = time_scale;
									fps_den = num_units_in_tick * 2;
									fps = fps_num / fps_den;
								}
							}
							var sarScale = 1;
							if (sar_width !== 1 || sar_height !== 1) sarScale = sar_width / sar_height;
							var crop_unit_x = 0, crop_unit_y = 0;
							if (chroma_format_idc === 0) {
								crop_unit_x = 1;
								crop_unit_y = 2 - frame_mbs_only_flag;
							} else {
								var sub_wc = chroma_format_idc === 3 ? 1 : 2;
								var sub_hc = chroma_format_idc === 1 ? 2 : 1;
								crop_unit_x = sub_wc;
								crop_unit_y = sub_hc * (2 - frame_mbs_only_flag);
							}
							var codec_width = (pic_width_in_mbs_minus1 + 1) * 16;
							var codec_height = (2 - frame_mbs_only_flag) * ((pic_height_in_map_units_minus1 + 1) * 16);
							codec_width -= (frame_crop_left_offset + frame_crop_right_offset) * crop_unit_x;
							codec_height -= (frame_crop_top_offset + frame_crop_bottom_offset) * crop_unit_y;
							var present_width = Math.ceil(codec_width * sarScale);
							gb.destroy();
							gb = null;
							return {
								profile_string,
								level_string,
								bit_depth,
								ref_frames,
								chroma_format,
								chroma_format_string: SPSParser.getChromaFormatString(chroma_format),
								frame_rate: {
									fixed: fps_fixed,
									fps,
									fps_den,
									fps_num
								},
								sar_ratio: {
									width: sar_width,
									height: sar_height
								},
								codec_size: {
									width: codec_width,
									height: codec_height
								},
								present_size: {
									width: present_width,
									height: codec_height
								}
							};
						};
						SPSParser._skipScalingList = function(gb, count) {
							var last_scale = 8, next_scale = 8;
							var delta_scale = 0;
							for (var i = 0; i < count; i++) {
								if (next_scale !== 0) {
									delta_scale = gb.readSEG();
									next_scale = (last_scale + delta_scale + 256) % 256;
								}
								last_scale = next_scale === 0 ? last_scale : next_scale;
							}
						};
						SPSParser.getProfileString = function(profile_idc) {
							switch (profile_idc) {
								case 66: return "Baseline";
								case 77: return "Main";
								case 88: return "Extended";
								case 100: return "High";
								case 110: return "High10";
								case 122: return "High422";
								case 244: return "High444";
								default: return "Unknown";
							}
						};
						SPSParser.getLevelString = function(level_idc) {
							return (level_idc / 10).toFixed(1);
						};
						SPSParser.getChromaFormatString = function(chroma) {
							switch (chroma) {
								case 420: return "4:2:0";
								case 422: return "4:2:2";
								case 444: return "4:4:4";
								default: return "Unknown";
							}
						};
						return SPSParser;
					}();
				}),
				"./src/flv.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!********************!*\
					!*** ./src/flv.js ***!
					\********************/
					__webpack_require__.r(__webpack_exports__);
					var _utils_polyfill_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ./utils/polyfill.js */
						"./src/utils/polyfill.js"
					);
					var _core_features_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ./core/features.js */
						"./src/core/features.js"
					);
					var _io_loader_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ./io/loader.js */
						"./src/io/loader.js"
					);
					var _player_flv_player_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
						/*! ./player/flv-player.js */
						"./src/player/flv-player.js"
					);
					var _player_native_player_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
						/*! ./player/native-player.js */
						"./src/player/native-player.js"
					);
					var _player_player_events_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
						/*! ./player/player-events.js */
						"./src/player/player-events.js"
					);
					var _player_player_errors_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(
						/*! ./player/player-errors.js */
						"./src/player/player-errors.js"
					);
					var _utils_logging_control_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(
						/*! ./utils/logging-control.js */
						"./src/utils/logging-control.js"
					);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(
						/*! ./utils/exception.js */
						"./src/utils/exception.js"
					);
					_utils_polyfill_js__WEBPACK_IMPORTED_MODULE_0__.default.install();
					function createPlayer(mediaDataSource, optionalConfig) {
						var mds = mediaDataSource;
						if (mds == null || typeof mds !== "object") throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_8__.InvalidArgumentException("MediaDataSource must be an javascript object!");
						if (!mds.hasOwnProperty("type")) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_8__.InvalidArgumentException("MediaDataSource must has type field to indicate video file type!");
						switch (mds.type) {
							case "flv": return new _player_flv_player_js__WEBPACK_IMPORTED_MODULE_3__.default(mds, optionalConfig);
							default: return new _player_native_player_js__WEBPACK_IMPORTED_MODULE_4__.default(mds, optionalConfig);
						}
					}
					function isSupported() {
						return _core_features_js__WEBPACK_IMPORTED_MODULE_1__.default.supportMSEH264Playback();
					}
					function getFeatureList() {
						return _core_features_js__WEBPACK_IMPORTED_MODULE_1__.default.getFeatureList();
					}
					var flvjs = {};
					flvjs.createPlayer = createPlayer;
					flvjs.isSupported = isSupported;
					flvjs.getFeatureList = getFeatureList;
					flvjs.BaseLoader = _io_loader_js__WEBPACK_IMPORTED_MODULE_2__.BaseLoader;
					flvjs.LoaderStatus = _io_loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderStatus;
					flvjs.LoaderErrors = _io_loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderErrors;
					flvjs.Events = _player_player_events_js__WEBPACK_IMPORTED_MODULE_5__.default;
					flvjs.ErrorTypes = _player_player_errors_js__WEBPACK_IMPORTED_MODULE_6__.ErrorTypes;
					flvjs.ErrorDetails = _player_player_errors_js__WEBPACK_IMPORTED_MODULE_6__.ErrorDetails;
					flvjs.FlvPlayer = _player_flv_player_js__WEBPACK_IMPORTED_MODULE_3__.default;
					flvjs.NativePlayer = _player_native_player_js__WEBPACK_IMPORTED_MODULE_4__.default;
					flvjs.LoggingControl = _utils_logging_control_js__WEBPACK_IMPORTED_MODULE_7__.default;
					Object.defineProperty(flvjs, "version", {
						enumerable: true,
						get: function() {
							return "1.6.2";
						}
					});
					__webpack_exports__["default"] = flvjs;
				}),
				"./src/index.js": (function(module$8, __unused_webpack_exports, __webpack_require__) {
					/*!**********************!*\
					!*** ./src/index.js ***!
					\**********************/
					module$8.exports = __webpack_require__(
						/*! ./flv.js */
						"./src/flv.js"
					).default;
				}),
				"./src/io/fetch-stream-loader.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!***************************************!*\
					!*** ./src/io/fetch-stream-loader.js ***!
					\***************************************/
					__webpack_require__.r(__webpack_exports__);
					var _utils_browser_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ../utils/browser.js */
						"./src/utils/browser.js"
					);
					var _loader_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ./loader.js */
						"./src/io/loader.js"
					);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					var __extends = (function() {
						var extendStatics = function(d, b) {
							extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
								d.__proto__ = b;
							} || function(d, b) {
								for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
							};
							return extendStatics(d, b);
						};
						return function(d, b) {
							if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
							extendStatics(d, b);
							function __() {
								this.constructor = d;
							}
							d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
						};
					})();
					__webpack_exports__["default"] = function(_super) {
						__extends(FetchStreamLoader, _super);
						function FetchStreamLoader(seekHandler, config) {
							var _this = _super.call(this, "fetch-stream-loader") || this;
							_this.TAG = "FetchStreamLoader";
							_this._seekHandler = seekHandler;
							_this._config = config;
							_this._needStash = true;
							_this._requestAbort = false;
							_this._contentLength = null;
							_this._receivedLength = 0;
							return _this;
						}
						FetchStreamLoader.isSupported = function() {
							try {
								var isWorkWellEdge = _utils_browser_js__WEBPACK_IMPORTED_MODULE_0__.default.msedge && _utils_browser_js__WEBPACK_IMPORTED_MODULE_0__.default.version.minor >= 15048;
								var browserNotBlacklisted = _utils_browser_js__WEBPACK_IMPORTED_MODULE_0__.default.msedge ? isWorkWellEdge : true;
								return self.fetch && self.ReadableStream && browserNotBlacklisted;
							} catch (e) {
								return false;
							}
						};
						FetchStreamLoader.prototype.destroy = function() {
							if (this.isWorking()) this.abort();
							_super.prototype.destroy.call(this);
						};
						FetchStreamLoader.prototype.open = function(dataSource, range) {
							var _this = this;
							this._dataSource = dataSource;
							this._range = range;
							var sourceURL = dataSource.url;
							if (this._config.reuseRedirectedURL && dataSource.redirectedURL != void 0) sourceURL = dataSource.redirectedURL;
							var seekConfig = this._seekHandler.getConfig(sourceURL, range);
							var headers = new self.Headers();
							if (typeof seekConfig.headers === "object") {
								var configHeaders = seekConfig.headers;
								for (var key in configHeaders) if (configHeaders.hasOwnProperty(key)) headers.append(key, configHeaders[key]);
							}
							var params = {
								method: "GET",
								headers,
								mode: "cors",
								cache: "default",
								referrerPolicy: "no-referrer-when-downgrade"
							};
							if (typeof this._config.headers === "object") for (var key in this._config.headers) headers.append(key, this._config.headers[key]);
							if (dataSource.cors === false) params.mode = "same-origin";
							if (dataSource.withCredentials) params.credentials = "include";
							if (dataSource.referrerPolicy) params.referrerPolicy = dataSource.referrerPolicy;
							if (self.AbortController) {
								this._abortController = new self.AbortController();
								params.signal = this._abortController.signal;
							}
							this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kConnecting;
							self.fetch(seekConfig.url, params).then(function(res) {
								if (_this._requestAbort) {
									_this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kIdle;
									res.body.cancel();
									return;
								}
								if (res.ok && res.status >= 200 && res.status <= 299) {
									if (res.url !== seekConfig.url) {
										if (_this._onURLRedirect) {
											var redirectedURL = _this._seekHandler.removeURLParameters(res.url);
											_this._onURLRedirect(redirectedURL);
										}
									}
									var lengthHeader = res.headers.get("Content-Length");
									if (lengthHeader != null) {
										_this._contentLength = parseInt(lengthHeader);
										if (_this._contentLength !== 0) {
											if (_this._onContentLengthKnown) _this._onContentLengthKnown(_this._contentLength);
										}
									}
									return _this._pump.call(_this, res.body.getReader());
								} else {
									_this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kError;
									if (_this._onError) _this._onError(_loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderErrors.HTTP_STATUS_CODE_INVALID, {
										code: res.status,
										msg: res.statusText
									});
									else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__.RuntimeException("FetchStreamLoader: Http code invalid, " + res.status + " " + res.statusText);
								}
							}).catch(function(e) {
								if (_this._abortController && _this._abortController.signal.aborted) return;
								_this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kError;
								if (_this._onError) _this._onError(_loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderErrors.EXCEPTION, {
									code: -1,
									msg: e.message
								});
								else throw e;
							});
						};
						FetchStreamLoader.prototype.abort = function() {
							this._requestAbort = true;
							if (this._status !== _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kBuffering || !_utils_browser_js__WEBPACK_IMPORTED_MODULE_0__.default.chrome) {
								if (this._abortController) try {
									this._abortController.abort();
								} catch (e) {}
							}
						};
						FetchStreamLoader.prototype._pump = function(reader) {
							var _this = this;
							return reader.read().then(function(result) {
								if (result.done) if (_this._contentLength !== null && _this._receivedLength < _this._contentLength) {
									_this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kError;
									var type = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderErrors.EARLY_EOF;
									var info = {
										code: -1,
										msg: "Fetch stream meet Early-EOF"
									};
									if (_this._onError) _this._onError(type, info);
									else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__.RuntimeException(info.msg);
								} else {
									_this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kComplete;
									if (_this._onComplete) _this._onComplete(_this._range.from, _this._range.from + _this._receivedLength - 1);
								}
								else {
									if (_this._abortController && _this._abortController.signal.aborted) {
										_this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kComplete;
										return;
									} else if (_this._requestAbort === true) {
										_this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kComplete;
										return reader.cancel();
									}
									_this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kBuffering;
									var chunk = result.value.buffer;
									var byteStart = _this._range.from + _this._receivedLength;
									_this._receivedLength += chunk.byteLength;
									if (_this._onDataArrival) _this._onDataArrival(chunk, byteStart, _this._receivedLength);
									_this._pump(reader);
								}
							}).catch(function(e) {
								if (_this._abortController && _this._abortController.signal.aborted) {
									_this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kComplete;
									return;
								}
								if (e.code === 11 && _utils_browser_js__WEBPACK_IMPORTED_MODULE_0__.default.msedge) return;
								_this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kError;
								var type = 0;
								var info = null;
								if ((e.code === 19 || e.message === "network error") && (_this._contentLength === null || _this._contentLength !== null && _this._receivedLength < _this._contentLength)) {
									type = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderErrors.EARLY_EOF;
									info = {
										code: e.code,
										msg: "Fetch stream meet Early-EOF"
									};
								} else {
									type = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderErrors.EXCEPTION;
									info = {
										code: e.code,
										msg: e.message
									};
								}
								if (_this._onError) _this._onError(type, info);
								else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__.RuntimeException(info.msg);
							});
						};
						return FetchStreamLoader;
					}(_loader_js__WEBPACK_IMPORTED_MODULE_1__.BaseLoader);
				}),
				"./src/io/io-controller.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!*********************************!*\
					!*** ./src/io/io-controller.js ***!
					\*********************************/
					__webpack_require__.r(__webpack_exports__);
					var _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ../utils/logger.js */
						"./src/utils/logger.js"
					);
					var _speed_sampler_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ./speed-sampler.js */
						"./src/io/speed-sampler.js"
					);
					var _loader_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ./loader.js */
						"./src/io/loader.js"
					);
					var _fetch_stream_loader_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
						/*! ./fetch-stream-loader.js */
						"./src/io/fetch-stream-loader.js"
					);
					var _xhr_moz_chunked_loader_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
						/*! ./xhr-moz-chunked-loader.js */
						"./src/io/xhr-moz-chunked-loader.js"
					);
					var _xhr_range_loader_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
						/*! ./xhr-range-loader.js */
						"./src/io/xhr-range-loader.js"
					);
					var _websocket_loader_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(
						/*! ./websocket-loader.js */
						"./src/io/websocket-loader.js"
					);
					var _range_seek_handler_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(
						/*! ./range-seek-handler.js */
						"./src/io/range-seek-handler.js"
					);
					var _param_seek_handler_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(
						/*! ./param-seek-handler.js */
						"./src/io/param-seek-handler.js"
					);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					__webpack_exports__["default"] = function() {
						function IOController(dataSource, config, extraData) {
							this.TAG = "IOController";
							this._config = config;
							this._extraData = extraData;
							this._stashInitialSize = 393216;
							if (config.stashInitialSize != void 0 && config.stashInitialSize > 0) this._stashInitialSize = config.stashInitialSize;
							this._stashUsed = 0;
							this._stashSize = this._stashInitialSize;
							this._bufferSize = 3145728;
							this._stashBuffer = new ArrayBuffer(this._bufferSize);
							this._stashByteStart = 0;
							this._enableStash = true;
							if (config.enableStashBuffer === false) this._enableStash = false;
							this._loader = null;
							this._loaderClass = null;
							this._seekHandler = null;
							this._dataSource = dataSource;
							this._isWebSocketURL = /wss?:\/\/(.+?)/.test(dataSource.url);
							this._refTotalLength = dataSource.filesize ? dataSource.filesize : null;
							this._totalLength = this._refTotalLength;
							this._fullRequestFlag = false;
							this._currentRange = null;
							this._redirectedURL = null;
							this._speedNormalized = 0;
							this._speedSampler = new _speed_sampler_js__WEBPACK_IMPORTED_MODULE_1__.default();
							this._speedNormalizeList = [
								64,
								128,
								256,
								384,
								512,
								768,
								1024,
								1536,
								2048,
								3072,
								4096
							];
							this._isEarlyEofReconnecting = false;
							this._paused = false;
							this._resumeFrom = 0;
							this._onDataArrival = null;
							this._onSeeked = null;
							this._onError = null;
							this._onComplete = null;
							this._onRedirect = null;
							this._onRecoveredEarlyEof = null;
							this._selectSeekHandler();
							this._selectLoader();
							this._createLoader();
						}
						IOController.prototype.destroy = function() {
							if (this._loader.isWorking()) this._loader.abort();
							this._loader.destroy();
							this._loader = null;
							this._loaderClass = null;
							this._dataSource = null;
							this._stashBuffer = null;
							this._stashUsed = this._stashSize = this._bufferSize = this._stashByteStart = 0;
							this._currentRange = null;
							this._speedSampler = null;
							this._isEarlyEofReconnecting = false;
							this._onDataArrival = null;
							this._onSeeked = null;
							this._onError = null;
							this._onComplete = null;
							this._onRedirect = null;
							this._onRecoveredEarlyEof = null;
							this._extraData = null;
						};
						IOController.prototype.isWorking = function() {
							return this._loader && this._loader.isWorking() && !this._paused;
						};
						IOController.prototype.isPaused = function() {
							return this._paused;
						};
						Object.defineProperty(IOController.prototype, "status", {
							get: function() {
								return this._loader.status;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(IOController.prototype, "extraData", {
							get: function() {
								return this._extraData;
							},
							set: function(data) {
								this._extraData = data;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(IOController.prototype, "onDataArrival", {
							get: function() {
								return this._onDataArrival;
							},
							set: function(callback) {
								this._onDataArrival = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(IOController.prototype, "onSeeked", {
							get: function() {
								return this._onSeeked;
							},
							set: function(callback) {
								this._onSeeked = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(IOController.prototype, "onError", {
							get: function() {
								return this._onError;
							},
							set: function(callback) {
								this._onError = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(IOController.prototype, "onComplete", {
							get: function() {
								return this._onComplete;
							},
							set: function(callback) {
								this._onComplete = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(IOController.prototype, "onRedirect", {
							get: function() {
								return this._onRedirect;
							},
							set: function(callback) {
								this._onRedirect = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(IOController.prototype, "onRecoveredEarlyEof", {
							get: function() {
								return this._onRecoveredEarlyEof;
							},
							set: function(callback) {
								this._onRecoveredEarlyEof = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(IOController.prototype, "currentURL", {
							get: function() {
								return this._dataSource.url;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(IOController.prototype, "hasRedirect", {
							get: function() {
								return this._redirectedURL != null || this._dataSource.redirectedURL != void 0;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(IOController.prototype, "currentRedirectedURL", {
							get: function() {
								return this._redirectedURL || this._dataSource.redirectedURL;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(IOController.prototype, "currentSpeed", {
							get: function() {
								if (this._loaderClass === _xhr_range_loader_js__WEBPACK_IMPORTED_MODULE_5__.default) return this._loader.currentSpeed;
								return this._speedSampler.lastSecondKBps;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(IOController.prototype, "loaderType", {
							get: function() {
								return this._loader.type;
							},
							enumerable: false,
							configurable: true
						});
						IOController.prototype._selectSeekHandler = function() {
							var config = this._config;
							if (config.seekType === "range") this._seekHandler = new _range_seek_handler_js__WEBPACK_IMPORTED_MODULE_7__.default(this._config.rangeLoadZeroStart);
							else if (config.seekType === "param") {
								var paramStart = config.seekParamStart || "bstart";
								var paramEnd = config.seekParamEnd || "bend";
								this._seekHandler = new _param_seek_handler_js__WEBPACK_IMPORTED_MODULE_8__.default(paramStart, paramEnd);
							} else if (config.seekType === "custom") {
								if (typeof config.customSeekHandler !== "function") throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_9__.InvalidArgumentException("Custom seekType specified in config but invalid customSeekHandler!");
								this._seekHandler = new config.customSeekHandler();
							} else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_9__.InvalidArgumentException("Invalid seekType in config: " + config.seekType);
						};
						IOController.prototype._selectLoader = function() {
							if (this._config.customLoader != null) this._loaderClass = this._config.customLoader;
							else if (this._isWebSocketURL) this._loaderClass = _websocket_loader_js__WEBPACK_IMPORTED_MODULE_6__.default;
							else if (_fetch_stream_loader_js__WEBPACK_IMPORTED_MODULE_3__.default.isSupported()) this._loaderClass = _fetch_stream_loader_js__WEBPACK_IMPORTED_MODULE_3__.default;
							else if (_xhr_moz_chunked_loader_js__WEBPACK_IMPORTED_MODULE_4__.default.isSupported()) this._loaderClass = _xhr_moz_chunked_loader_js__WEBPACK_IMPORTED_MODULE_4__.default;
							else if (_xhr_range_loader_js__WEBPACK_IMPORTED_MODULE_5__.default.isSupported()) this._loaderClass = _xhr_range_loader_js__WEBPACK_IMPORTED_MODULE_5__.default;
							else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_9__.RuntimeException("Your browser doesn't support xhr with arraybuffer responseType!");
						};
						IOController.prototype._createLoader = function() {
							this._loader = new this._loaderClass(this._seekHandler, this._config);
							if (this._loader.needStashBuffer === false) this._enableStash = false;
							this._loader.onContentLengthKnown = this._onContentLengthKnown.bind(this);
							this._loader.onURLRedirect = this._onURLRedirect.bind(this);
							this._loader.onDataArrival = this._onLoaderChunkArrival.bind(this);
							this._loader.onComplete = this._onLoaderComplete.bind(this);
							this._loader.onError = this._onLoaderError.bind(this);
						};
						IOController.prototype.open = function(optionalFrom) {
							this._currentRange = {
								from: 0,
								to: -1
							};
							if (optionalFrom) this._currentRange.from = optionalFrom;
							this._speedSampler.reset();
							if (!optionalFrom) this._fullRequestFlag = true;
							this._loader.open(this._dataSource, Object.assign({}, this._currentRange));
						};
						IOController.prototype.abort = function() {
							this._loader.abort();
							if (this._paused) {
								this._paused = false;
								this._resumeFrom = 0;
							}
						};
						IOController.prototype.pause = function() {
							if (this.isWorking()) {
								this._loader.abort();
								if (this._stashUsed !== 0) {
									this._resumeFrom = this._stashByteStart;
									this._currentRange.to = this._stashByteStart - 1;
								} else this._resumeFrom = this._currentRange.to + 1;
								this._stashUsed = 0;
								this._stashByteStart = 0;
								this._paused = true;
							}
						};
						IOController.prototype.resume = function() {
							if (this._paused) {
								this._paused = false;
								var bytes = this._resumeFrom;
								this._resumeFrom = 0;
								this._internalSeek(bytes, true);
							}
						};
						IOController.prototype.seek = function(bytes) {
							this._paused = false;
							this._stashUsed = 0;
							this._stashByteStart = 0;
							this._internalSeek(bytes, true);
						};
						/**
						* When seeking request is from media seeking, unconsumed stash data should be dropped
						* However, stash data shouldn't be dropped if seeking requested from http reconnection
						*
						* @dropUnconsumed: Ignore and discard all unconsumed data in stash buffer
						*/
						IOController.prototype._internalSeek = function(bytes, dropUnconsumed) {
							if (this._loader.isWorking()) this._loader.abort();
							this._flushStashBuffer(dropUnconsumed);
							this._loader.destroy();
							this._loader = null;
							var requestRange = {
								from: bytes,
								to: -1
							};
							this._currentRange = {
								from: requestRange.from,
								to: -1
							};
							this._speedSampler.reset();
							this._stashSize = this._stashInitialSize;
							this._createLoader();
							this._loader.open(this._dataSource, requestRange);
							if (this._onSeeked) this._onSeeked();
						};
						IOController.prototype.updateUrl = function(url) {
							if (!url || typeof url !== "string" || url.length === 0) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_9__.InvalidArgumentException("Url must be a non-empty string!");
							this._dataSource.url = url;
						};
						IOController.prototype._expandBuffer = function(expectedBytes) {
							var bufferNewSize = this._stashSize;
							while (bufferNewSize + 1048576 < expectedBytes) bufferNewSize *= 2;
							bufferNewSize += 1048576;
							if (bufferNewSize === this._bufferSize) return;
							var newBuffer = new ArrayBuffer(bufferNewSize);
							if (this._stashUsed > 0) {
								var stashOldArray = new Uint8Array(this._stashBuffer, 0, this._stashUsed);
								new Uint8Array(newBuffer, 0, bufferNewSize).set(stashOldArray, 0);
							}
							this._stashBuffer = newBuffer;
							this._bufferSize = bufferNewSize;
						};
						IOController.prototype._normalizeSpeed = function(input) {
							var list = this._speedNormalizeList;
							var last = list.length - 1;
							var mid = 0;
							var lbound = 0;
							var ubound = last;
							if (input < list[0]) return list[0];
							while (lbound <= ubound) {
								mid = lbound + Math.floor((ubound - lbound) / 2);
								if (mid === last || input >= list[mid] && input < list[mid + 1]) return list[mid];
								else if (list[mid] < input) lbound = mid + 1;
								else ubound = mid - 1;
							}
						};
						IOController.prototype._adjustStashSize = function(normalized) {
							var stashSizeKB = 0;
							if (this._config.isLive) stashSizeKB = normalized;
							else if (normalized < 512) stashSizeKB = normalized;
							else if (normalized >= 512 && normalized <= 1024) stashSizeKB = Math.floor(normalized * 1.5);
							else stashSizeKB = normalized * 2;
							if (stashSizeKB > 8192) stashSizeKB = 8192;
							var bufferSize = stashSizeKB * 1024 + 1048576;
							if (this._bufferSize < bufferSize) this._expandBuffer(bufferSize);
							this._stashSize = stashSizeKB * 1024;
						};
						IOController.prototype._dispatchChunks = function(chunks, byteStart) {
							this._currentRange.to = byteStart + chunks.byteLength - 1;
							return this._onDataArrival(chunks, byteStart);
						};
						IOController.prototype._onURLRedirect = function(redirectedURL) {
							this._redirectedURL = redirectedURL;
							if (this._onRedirect) this._onRedirect(redirectedURL);
						};
						IOController.prototype._onContentLengthKnown = function(contentLength) {
							if (contentLength && this._fullRequestFlag) {
								this._totalLength = contentLength;
								this._fullRequestFlag = false;
							}
						};
						IOController.prototype._onLoaderChunkArrival = function(chunk, byteStart, receivedLength) {
							if (!this._onDataArrival) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_9__.IllegalStateException("IOController: No existing consumer (onDataArrival) callback!");
							if (this._paused) return;
							if (this._isEarlyEofReconnecting) {
								this._isEarlyEofReconnecting = false;
								if (this._onRecoveredEarlyEof) this._onRecoveredEarlyEof();
							}
							this._speedSampler.addBytes(chunk.byteLength);
							var KBps = this._speedSampler.lastSecondKBps;
							if (KBps !== 0) {
								var normalized = this._normalizeSpeed(KBps);
								if (this._speedNormalized !== normalized) {
									this._speedNormalized = normalized;
									this._adjustStashSize(normalized);
								}
							}
							if (!this._enableStash) if (this._stashUsed === 0) {
								var consumed = this._dispatchChunks(chunk, byteStart);
								if (consumed < chunk.byteLength) {
									var remain = chunk.byteLength - consumed;
									if (remain > this._bufferSize) this._expandBuffer(remain);
									var stashArray = new Uint8Array(this._stashBuffer, 0, this._bufferSize);
									stashArray.set(new Uint8Array(chunk, consumed), 0);
									this._stashUsed += remain;
									this._stashByteStart = byteStart + consumed;
								}
							} else {
								if (this._stashUsed + chunk.byteLength > this._bufferSize) this._expandBuffer(this._stashUsed + chunk.byteLength);
								var stashArray = new Uint8Array(this._stashBuffer, 0, this._bufferSize);
								stashArray.set(new Uint8Array(chunk), this._stashUsed);
								this._stashUsed += chunk.byteLength;
								var consumed = this._dispatchChunks(this._stashBuffer.slice(0, this._stashUsed), this._stashByteStart);
								if (consumed < this._stashUsed && consumed > 0) {
									var remainArray = new Uint8Array(this._stashBuffer, consumed);
									stashArray.set(remainArray, 0);
								}
								this._stashUsed -= consumed;
								this._stashByteStart += consumed;
							}
							else {
								if (this._stashUsed === 0 && this._stashByteStart === 0) this._stashByteStart = byteStart;
								if (this._stashUsed + chunk.byteLength <= this._stashSize) {
									var stashArray = new Uint8Array(this._stashBuffer, 0, this._stashSize);
									stashArray.set(new Uint8Array(chunk), this._stashUsed);
									this._stashUsed += chunk.byteLength;
								} else {
									var stashArray = new Uint8Array(this._stashBuffer, 0, this._bufferSize);
									if (this._stashUsed > 0) {
										var buffer = this._stashBuffer.slice(0, this._stashUsed);
										var consumed = this._dispatchChunks(buffer, this._stashByteStart);
										if (consumed < buffer.byteLength) {
											if (consumed > 0) {
												var remainArray = new Uint8Array(buffer, consumed);
												stashArray.set(remainArray, 0);
												this._stashUsed = remainArray.byteLength;
												this._stashByteStart += consumed;
											}
										} else {
											this._stashUsed = 0;
											this._stashByteStart += consumed;
										}
										if (this._stashUsed + chunk.byteLength > this._bufferSize) {
											this._expandBuffer(this._stashUsed + chunk.byteLength);
											stashArray = new Uint8Array(this._stashBuffer, 0, this._bufferSize);
										}
										stashArray.set(new Uint8Array(chunk), this._stashUsed);
										this._stashUsed += chunk.byteLength;
									} else {
										var consumed = this._dispatchChunks(chunk, byteStart);
										if (consumed < chunk.byteLength) {
											var remain = chunk.byteLength - consumed;
											if (remain > this._bufferSize) {
												this._expandBuffer(remain);
												stashArray = new Uint8Array(this._stashBuffer, 0, this._bufferSize);
											}
											stashArray.set(new Uint8Array(chunk, consumed), 0);
											this._stashUsed += remain;
											this._stashByteStart = byteStart + consumed;
										}
									}
								}
							}
						};
						IOController.prototype._flushStashBuffer = function(dropUnconsumed) {
							if (this._stashUsed > 0) {
								var buffer = this._stashBuffer.slice(0, this._stashUsed);
								var consumed = this._dispatchChunks(buffer, this._stashByteStart);
								var remain = buffer.byteLength - consumed;
								if (consumed < buffer.byteLength) if (dropUnconsumed) _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, remain + " bytes unconsumed data remain when flush buffer, dropped");
								else {
									if (consumed > 0) {
										var stashArray = new Uint8Array(this._stashBuffer, 0, this._bufferSize);
										var remainArray = new Uint8Array(buffer, consumed);
										stashArray.set(remainArray, 0);
										this._stashUsed = remainArray.byteLength;
										this._stashByteStart += consumed;
									}
									return 0;
								}
								this._stashUsed = 0;
								this._stashByteStart = 0;
								return remain;
							}
							return 0;
						};
						IOController.prototype._onLoaderComplete = function(from, to) {
							this._flushStashBuffer(true);
							if (this._onComplete) this._onComplete(this._extraData);
						};
						IOController.prototype._onLoaderError = function(type, data) {
							_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.e(this.TAG, "Loader error, code = " + data.code + ", msg = " + data.msg);
							this._flushStashBuffer(false);
							if (this._isEarlyEofReconnecting) {
								this._isEarlyEofReconnecting = false;
								type = _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderErrors.UNRECOVERABLE_EARLY_EOF;
							}
							switch (type) {
								case _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderErrors.EARLY_EOF:
									if (!this._config.isLive) {
										if (this._totalLength) {
											var nextFrom = this._currentRange.to + 1;
											if (nextFrom < this._totalLength) {
												_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Connection lost, trying reconnect...");
												this._isEarlyEofReconnecting = true;
												this._internalSeek(nextFrom, false);
											}
											return;
										}
									}
									type = _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderErrors.UNRECOVERABLE_EARLY_EOF;
									break;
								case _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderErrors.UNRECOVERABLE_EARLY_EOF:
								case _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderErrors.CONNECTING_TIMEOUT:
								case _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderErrors.HTTP_STATUS_CODE_INVALID:
								case _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderErrors.EXCEPTION:
							}
							if (this._onError) this._onError(type, data);
							else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_9__.RuntimeException("IOException: " + data.msg);
						};
						return IOController;
					}();
				}),
				"./src/io/loader.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!**************************!*\
					!*** ./src/io/loader.js ***!
					\**************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_require__.d(__webpack_exports__, {
						"LoaderStatus": function() {
							return LoaderStatus;
						},
						"LoaderErrors": function() {
							return LoaderErrors;
						},
						"BaseLoader": function() {
							return BaseLoader;
						}
					});
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					var LoaderStatus = {
						kIdle: 0,
						kConnecting: 1,
						kBuffering: 2,
						kError: 3,
						kComplete: 4
					};
					var LoaderErrors = {
						OK: "OK",
						EXCEPTION: "Exception",
						HTTP_STATUS_CODE_INVALID: "HttpStatusCodeInvalid",
						CONNECTING_TIMEOUT: "ConnectingTimeout",
						EARLY_EOF: "EarlyEof",
						UNRECOVERABLE_EARLY_EOF: "UnrecoverableEarlyEof"
					};
					var BaseLoader = function() {
						function BaseLoader(typeName) {
							this._type = typeName || "undefined";
							this._status = LoaderStatus.kIdle;
							this._needStash = false;
							this._onContentLengthKnown = null;
							this._onURLRedirect = null;
							this._onDataArrival = null;
							this._onError = null;
							this._onComplete = null;
						}
						BaseLoader.prototype.destroy = function() {
							this._status = LoaderStatus.kIdle;
							this._onContentLengthKnown = null;
							this._onURLRedirect = null;
							this._onDataArrival = null;
							this._onError = null;
							this._onComplete = null;
						};
						BaseLoader.prototype.isWorking = function() {
							return this._status === LoaderStatus.kConnecting || this._status === LoaderStatus.kBuffering;
						};
						Object.defineProperty(BaseLoader.prototype, "type", {
							get: function() {
								return this._type;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(BaseLoader.prototype, "status", {
							get: function() {
								return this._status;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(BaseLoader.prototype, "needStashBuffer", {
							get: function() {
								return this._needStash;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(BaseLoader.prototype, "onContentLengthKnown", {
							get: function() {
								return this._onContentLengthKnown;
							},
							set: function(callback) {
								this._onContentLengthKnown = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(BaseLoader.prototype, "onURLRedirect", {
							get: function() {
								return this._onURLRedirect;
							},
							set: function(callback) {
								this._onURLRedirect = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(BaseLoader.prototype, "onDataArrival", {
							get: function() {
								return this._onDataArrival;
							},
							set: function(callback) {
								this._onDataArrival = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(BaseLoader.prototype, "onError", {
							get: function() {
								return this._onError;
							},
							set: function(callback) {
								this._onError = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(BaseLoader.prototype, "onComplete", {
							get: function() {
								return this._onComplete;
							},
							set: function(callback) {
								this._onComplete = callback;
							},
							enumerable: false,
							configurable: true
						});
						BaseLoader.prototype.open = function(dataSource, range) {
							throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_0__.NotImplementedException("Unimplemented abstract function!");
						};
						BaseLoader.prototype.abort = function() {
							throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_0__.NotImplementedException("Unimplemented abstract function!");
						};
						return BaseLoader;
					}();
				}),
				"./src/io/param-seek-handler.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!**************************************!*\
					!*** ./src/io/param-seek-handler.js ***!
					\**************************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_exports__["default"] = function() {
						function ParamSeekHandler(paramStart, paramEnd) {
							this._startName = paramStart;
							this._endName = paramEnd;
						}
						ParamSeekHandler.prototype.getConfig = function(baseUrl, range) {
							var url = baseUrl;
							if (range.from !== 0 || range.to !== -1) {
								var needAnd = true;
								if (url.indexOf("?") === -1) {
									url += "?";
									needAnd = false;
								}
								if (needAnd) url += "&";
								url += this._startName + "=" + range.from.toString();
								if (range.to !== -1) url += "&" + this._endName + "=" + range.to.toString();
							}
							return {
								url,
								headers: {}
							};
						};
						ParamSeekHandler.prototype.removeURLParameters = function(seekedURL) {
							var baseURL = seekedURL.split("?")[0];
							var params = void 0;
							var queryIndex = seekedURL.indexOf("?");
							if (queryIndex !== -1) params = seekedURL.substring(queryIndex + 1);
							var resultParams = "";
							if (params != void 0 && params.length > 0) {
								var pairs = params.split("&");
								for (var i = 0; i < pairs.length; i++) {
									var pair = pairs[i].split("=");
									var requireAnd = i > 0;
									if (pair[0] !== this._startName && pair[0] !== this._endName) {
										if (requireAnd) resultParams += "&";
										resultParams += pairs[i];
									}
								}
							}
							return resultParams.length === 0 ? baseURL : baseURL + "?" + resultParams;
						};
						return ParamSeekHandler;
					}();
				}),
				"./src/io/range-seek-handler.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!**************************************!*\
					!*** ./src/io/range-seek-handler.js ***!
					\**************************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_exports__["default"] = function() {
						function RangeSeekHandler(zeroStart) {
							this._zeroStart = zeroStart || false;
						}
						RangeSeekHandler.prototype.getConfig = function(url, range) {
							var headers = {};
							if (range.from !== 0 || range.to !== -1) {
								var param = void 0;
								if (range.to !== -1) param = "bytes=" + range.from.toString() + "-" + range.to.toString();
								else param = "bytes=" + range.from.toString() + "-";
								headers["Range"] = param;
							} else if (this._zeroStart) headers["Range"] = "bytes=0-";
							return {
								url,
								headers
							};
						};
						RangeSeekHandler.prototype.removeURLParameters = function(seekedURL) {
							return seekedURL;
						};
						return RangeSeekHandler;
					}();
				}),
				"./src/io/speed-sampler.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!*********************************!*\
					!*** ./src/io/speed-sampler.js ***!
					\*********************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_exports__["default"] = function() {
						function SpeedSampler() {
							this._firstCheckpoint = 0;
							this._lastCheckpoint = 0;
							this._intervalBytes = 0;
							this._totalBytes = 0;
							this._lastSecondBytes = 0;
							if (self.performance && self.performance.now) this._now = self.performance.now.bind(self.performance);
							else this._now = Date.now;
						}
						SpeedSampler.prototype.reset = function() {
							this._firstCheckpoint = this._lastCheckpoint = 0;
							this._totalBytes = this._intervalBytes = 0;
							this._lastSecondBytes = 0;
						};
						SpeedSampler.prototype.addBytes = function(bytes) {
							if (this._firstCheckpoint === 0) {
								this._firstCheckpoint = this._now();
								this._lastCheckpoint = this._firstCheckpoint;
								this._intervalBytes += bytes;
								this._totalBytes += bytes;
							} else if (this._now() - this._lastCheckpoint < 1e3) {
								this._intervalBytes += bytes;
								this._totalBytes += bytes;
							} else {
								this._lastSecondBytes = this._intervalBytes;
								this._intervalBytes = bytes;
								this._totalBytes += bytes;
								this._lastCheckpoint = this._now();
							}
						};
						Object.defineProperty(SpeedSampler.prototype, "currentKBps", {
							get: function() {
								this.addBytes(0);
								var durationSeconds = (this._now() - this._lastCheckpoint) / 1e3;
								if (durationSeconds == 0) durationSeconds = 1;
								return this._intervalBytes / durationSeconds / 1024;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(SpeedSampler.prototype, "lastSecondKBps", {
							get: function() {
								this.addBytes(0);
								if (this._lastSecondBytes !== 0) return this._lastSecondBytes / 1024;
								else if (this._now() - this._lastCheckpoint >= 500) return this.currentKBps;
								else return 0;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(SpeedSampler.prototype, "averageKBps", {
							get: function() {
								var durationSeconds = (this._now() - this._firstCheckpoint) / 1e3;
								return this._totalBytes / durationSeconds / 1024;
							},
							enumerable: false,
							configurable: true
						});
						return SpeedSampler;
					}();
				}),
				"./src/io/websocket-loader.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!************************************!*\
					!*** ./src/io/websocket-loader.js ***!
					\************************************/
					__webpack_require__.r(__webpack_exports__);
					var _loader_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ./loader.js */
						"./src/io/loader.js"
					);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					var __extends = (function() {
						var extendStatics = function(d, b) {
							extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
								d.__proto__ = b;
							} || function(d, b) {
								for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
							};
							return extendStatics(d, b);
						};
						return function(d, b) {
							if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
							extendStatics(d, b);
							function __() {
								this.constructor = d;
							}
							d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
						};
					})();
					__webpack_exports__["default"] = function(_super) {
						__extends(WebSocketLoader, _super);
						function WebSocketLoader() {
							var _this = _super.call(this, "websocket-loader") || this;
							_this.TAG = "WebSocketLoader";
							_this._needStash = true;
							_this._ws = null;
							_this._requestAbort = false;
							_this._receivedLength = 0;
							return _this;
						}
						WebSocketLoader.isSupported = function() {
							try {
								return typeof self.WebSocket !== "undefined";
							} catch (e) {
								return false;
							}
						};
						WebSocketLoader.prototype.destroy = function() {
							if (this._ws) this.abort();
							_super.prototype.destroy.call(this);
						};
						WebSocketLoader.prototype.open = function(dataSource) {
							try {
								var ws = this._ws = new self.WebSocket(dataSource.url);
								ws.binaryType = "arraybuffer";
								ws.onopen = this._onWebSocketOpen.bind(this);
								ws.onclose = this._onWebSocketClose.bind(this);
								ws.onmessage = this._onWebSocketMessage.bind(this);
								ws.onerror = this._onWebSocketError.bind(this);
								this._status = _loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderStatus.kConnecting;
							} catch (e) {
								this._status = _loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderStatus.kError;
								var info = {
									code: e.code,
									msg: e.message
								};
								if (this._onError) this._onError(_loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderErrors.EXCEPTION, info);
								else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_1__.RuntimeException(info.msg);
							}
						};
						WebSocketLoader.prototype.abort = function() {
							var ws = this._ws;
							if (ws && (ws.readyState === 0 || ws.readyState === 1)) {
								this._requestAbort = true;
								ws.close();
							}
							this._ws = null;
							this._status = _loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderStatus.kComplete;
						};
						WebSocketLoader.prototype._onWebSocketOpen = function(e) {
							this._status = _loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderStatus.kBuffering;
						};
						WebSocketLoader.prototype._onWebSocketClose = function(e) {
							if (this._requestAbort === true) {
								this._requestAbort = false;
								return;
							}
							this._status = _loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderStatus.kComplete;
							if (this._onComplete) this._onComplete(0, this._receivedLength - 1);
						};
						WebSocketLoader.prototype._onWebSocketMessage = function(e) {
							var _this = this;
							if (e.data instanceof ArrayBuffer) this._dispatchArrayBuffer(e.data);
							else if (e.data instanceof Blob) {
								var reader_1 = new FileReader();
								reader_1.onload = function() {
									_this._dispatchArrayBuffer(reader_1.result);
								};
								reader_1.readAsArrayBuffer(e.data);
							} else {
								this._status = _loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderStatus.kError;
								var info = {
									code: -1,
									msg: "Unsupported WebSocket message type: " + e.data.constructor.name
								};
								if (this._onError) this._onError(_loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderErrors.EXCEPTION, info);
								else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_1__.RuntimeException(info.msg);
							}
						};
						WebSocketLoader.prototype._dispatchArrayBuffer = function(arraybuffer) {
							var chunk = arraybuffer;
							var byteStart = this._receivedLength;
							this._receivedLength += chunk.byteLength;
							if (this._onDataArrival) this._onDataArrival(chunk, byteStart, this._receivedLength);
						};
						WebSocketLoader.prototype._onWebSocketError = function(e) {
							this._status = _loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderStatus.kError;
							var info = {
								code: e.code,
								msg: e.message
							};
							if (this._onError) this._onError(_loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderErrors.EXCEPTION, info);
							else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_1__.RuntimeException(info.msg);
						};
						return WebSocketLoader;
					}(_loader_js__WEBPACK_IMPORTED_MODULE_0__.BaseLoader);
				}),
				"./src/io/xhr-moz-chunked-loader.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!******************************************!*\
					!*** ./src/io/xhr-moz-chunked-loader.js ***!
					\******************************************/
					__webpack_require__.r(__webpack_exports__);
					var _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ../utils/logger.js */
						"./src/utils/logger.js"
					);
					var _loader_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ./loader.js */
						"./src/io/loader.js"
					);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					var __extends = (function() {
						var extendStatics = function(d, b) {
							extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
								d.__proto__ = b;
							} || function(d, b) {
								for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
							};
							return extendStatics(d, b);
						};
						return function(d, b) {
							if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
							extendStatics(d, b);
							function __() {
								this.constructor = d;
							}
							d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
						};
					})();
					__webpack_exports__["default"] = function(_super) {
						__extends(MozChunkedLoader, _super);
						function MozChunkedLoader(seekHandler, config) {
							var _this = _super.call(this, "xhr-moz-chunked-loader") || this;
							_this.TAG = "MozChunkedLoader";
							_this._seekHandler = seekHandler;
							_this._config = config;
							_this._needStash = true;
							_this._xhr = null;
							_this._requestAbort = false;
							_this._contentLength = null;
							_this._receivedLength = 0;
							return _this;
						}
						MozChunkedLoader.isSupported = function() {
							try {
								var xhr = new XMLHttpRequest();
								xhr.open("GET", "https://example.com", true);
								xhr.responseType = "moz-chunked-arraybuffer";
								return xhr.responseType === "moz-chunked-arraybuffer";
							} catch (e) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w("MozChunkedLoader", e.message);
								return false;
							}
						};
						MozChunkedLoader.prototype.destroy = function() {
							if (this.isWorking()) this.abort();
							if (this._xhr) {
								this._xhr.onreadystatechange = null;
								this._xhr.onprogress = null;
								this._xhr.onloadend = null;
								this._xhr.onerror = null;
								this._xhr = null;
							}
							_super.prototype.destroy.call(this);
						};
						MozChunkedLoader.prototype.open = function(dataSource, range) {
							this._dataSource = dataSource;
							this._range = range;
							var sourceURL = dataSource.url;
							if (this._config.reuseRedirectedURL && dataSource.redirectedURL != void 0) sourceURL = dataSource.redirectedURL;
							var seekConfig = this._seekHandler.getConfig(sourceURL, range);
							this._requestURL = seekConfig.url;
							var xhr = this._xhr = new XMLHttpRequest();
							xhr.open("GET", seekConfig.url, true);
							xhr.responseType = "moz-chunked-arraybuffer";
							xhr.onreadystatechange = this._onReadyStateChange.bind(this);
							xhr.onprogress = this._onProgress.bind(this);
							xhr.onloadend = this._onLoadEnd.bind(this);
							xhr.onerror = this._onXhrError.bind(this);
							if (dataSource.withCredentials) xhr.withCredentials = true;
							if (typeof seekConfig.headers === "object") {
								var headers = seekConfig.headers;
								for (var key in headers) if (headers.hasOwnProperty(key)) xhr.setRequestHeader(key, headers[key]);
							}
							if (typeof this._config.headers === "object") {
								var headers = this._config.headers;
								for (var key in headers) if (headers.hasOwnProperty(key)) xhr.setRequestHeader(key, headers[key]);
							}
							this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kConnecting;
							xhr.send();
						};
						MozChunkedLoader.prototype.abort = function() {
							this._requestAbort = true;
							if (this._xhr) this._xhr.abort();
							this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kComplete;
						};
						MozChunkedLoader.prototype._onReadyStateChange = function(e) {
							var xhr = e.target;
							if (xhr.readyState === 2) {
								if (xhr.responseURL != void 0 && xhr.responseURL !== this._requestURL) {
									if (this._onURLRedirect) {
										var redirectedURL = this._seekHandler.removeURLParameters(xhr.responseURL);
										this._onURLRedirect(redirectedURL);
									}
								}
								if (xhr.status !== 0 && (xhr.status < 200 || xhr.status > 299)) {
									this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kError;
									if (this._onError) this._onError(_loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderErrors.HTTP_STATUS_CODE_INVALID, {
										code: xhr.status,
										msg: xhr.statusText
									});
									else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__.RuntimeException("MozChunkedLoader: Http code invalid, " + xhr.status + " " + xhr.statusText);
								} else this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kBuffering;
							}
						};
						MozChunkedLoader.prototype._onProgress = function(e) {
							if (this._status === _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kError) return;
							if (this._contentLength === null) {
								if (e.total !== null && e.total !== 0) {
									this._contentLength = e.total;
									if (this._onContentLengthKnown) this._onContentLengthKnown(this._contentLength);
								}
							}
							var chunk = e.target.response;
							var byteStart = this._range.from + this._receivedLength;
							this._receivedLength += chunk.byteLength;
							if (this._onDataArrival) this._onDataArrival(chunk, byteStart, this._receivedLength);
						};
						MozChunkedLoader.prototype._onLoadEnd = function(e) {
							if (this._requestAbort === true) {
								this._requestAbort = false;
								return;
							} else if (this._status === _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kError) return;
							this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kComplete;
							if (this._onComplete) this._onComplete(this._range.from, this._range.from + this._receivedLength - 1);
						};
						MozChunkedLoader.prototype._onXhrError = function(e) {
							this._status = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderStatus.kError;
							var type = 0;
							var info = null;
							if (this._contentLength && e.loaded < this._contentLength) {
								type = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderErrors.EARLY_EOF;
								info = {
									code: -1,
									msg: "Moz-Chunked stream meet Early-Eof"
								};
							} else {
								type = _loader_js__WEBPACK_IMPORTED_MODULE_1__.LoaderErrors.EXCEPTION;
								info = {
									code: -1,
									msg: e.constructor.name + " " + e.type
								};
							}
							if (this._onError) this._onError(type, info);
							else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_2__.RuntimeException(info.msg);
						};
						return MozChunkedLoader;
					}(_loader_js__WEBPACK_IMPORTED_MODULE_1__.BaseLoader);
				}),
				"./src/io/xhr-range-loader.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!************************************!*\
					!*** ./src/io/xhr-range-loader.js ***!
					\************************************/
					__webpack_require__.r(__webpack_exports__);
					var _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ../utils/logger.js */
						"./src/utils/logger.js"
					);
					var _speed_sampler_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ./speed-sampler.js */
						"./src/io/speed-sampler.js"
					);
					var _loader_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ./loader.js */
						"./src/io/loader.js"
					);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					var __extends = (function() {
						var extendStatics = function(d, b) {
							extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
								d.__proto__ = b;
							} || function(d, b) {
								for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
							};
							return extendStatics(d, b);
						};
						return function(d, b) {
							if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
							extendStatics(d, b);
							function __() {
								this.constructor = d;
							}
							d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
						};
					})();
					__webpack_exports__["default"] = function(_super) {
						__extends(RangeLoader, _super);
						function RangeLoader(seekHandler, config) {
							var _this = _super.call(this, "xhr-range-loader") || this;
							_this.TAG = "RangeLoader";
							_this._seekHandler = seekHandler;
							_this._config = config;
							_this._needStash = false;
							_this._chunkSizeKBList = [
								128,
								256,
								384,
								512,
								768,
								1024,
								1536,
								2048,
								3072,
								4096,
								5120,
								6144,
								7168,
								8192
							];
							_this._currentChunkSizeKB = 384;
							_this._currentSpeedNormalized = 0;
							_this._zeroSpeedChunkCount = 0;
							_this._xhr = null;
							_this._speedSampler = new _speed_sampler_js__WEBPACK_IMPORTED_MODULE_1__.default();
							_this._requestAbort = false;
							_this._waitForTotalLength = false;
							_this._totalLengthReceived = false;
							_this._currentRequestURL = null;
							_this._currentRedirectedURL = null;
							_this._currentRequestRange = null;
							_this._totalLength = null;
							_this._contentLength = null;
							_this._receivedLength = 0;
							_this._lastTimeLoaded = 0;
							return _this;
						}
						RangeLoader.isSupported = function() {
							try {
								var xhr = new XMLHttpRequest();
								xhr.open("GET", "https://example.com", true);
								xhr.responseType = "arraybuffer";
								return xhr.responseType === "arraybuffer";
							} catch (e) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w("RangeLoader", e.message);
								return false;
							}
						};
						RangeLoader.prototype.destroy = function() {
							if (this.isWorking()) this.abort();
							if (this._xhr) {
								this._xhr.onreadystatechange = null;
								this._xhr.onprogress = null;
								this._xhr.onload = null;
								this._xhr.onerror = null;
								this._xhr = null;
							}
							_super.prototype.destroy.call(this);
						};
						Object.defineProperty(RangeLoader.prototype, "currentSpeed", {
							get: function() {
								return this._speedSampler.lastSecondKBps;
							},
							enumerable: false,
							configurable: true
						});
						RangeLoader.prototype.open = function(dataSource, range) {
							this._dataSource = dataSource;
							this._range = range;
							this._status = _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderStatus.kConnecting;
							var useRefTotalLength = false;
							if (this._dataSource.filesize != void 0 && this._dataSource.filesize !== 0) {
								useRefTotalLength = true;
								this._totalLength = this._dataSource.filesize;
							}
							if (!this._totalLengthReceived && !useRefTotalLength) {
								this._waitForTotalLength = true;
								this._internalOpen(this._dataSource, {
									from: 0,
									to: -1
								});
							} else this._openSubRange();
						};
						RangeLoader.prototype._openSubRange = function() {
							var chunkSize = this._currentChunkSizeKB * 1024;
							var from = this._range.from + this._receivedLength;
							var to = from + chunkSize;
							if (this._contentLength != null) {
								if (to - this._range.from >= this._contentLength) to = this._range.from + this._contentLength - 1;
							}
							this._currentRequestRange = {
								from,
								to
							};
							this._internalOpen(this._dataSource, this._currentRequestRange);
						};
						RangeLoader.prototype._internalOpen = function(dataSource, range) {
							this._lastTimeLoaded = 0;
							var sourceURL = dataSource.url;
							if (this._config.reuseRedirectedURL) {
								if (this._currentRedirectedURL != void 0) sourceURL = this._currentRedirectedURL;
								else if (dataSource.redirectedURL != void 0) sourceURL = dataSource.redirectedURL;
							}
							var seekConfig = this._seekHandler.getConfig(sourceURL, range);
							this._currentRequestURL = seekConfig.url;
							var xhr = this._xhr = new XMLHttpRequest();
							xhr.open("GET", seekConfig.url, true);
							xhr.responseType = "arraybuffer";
							xhr.onreadystatechange = this._onReadyStateChange.bind(this);
							xhr.onprogress = this._onProgress.bind(this);
							xhr.onload = this._onLoad.bind(this);
							xhr.onerror = this._onXhrError.bind(this);
							if (dataSource.withCredentials) xhr.withCredentials = true;
							if (typeof seekConfig.headers === "object") {
								var headers = seekConfig.headers;
								for (var key in headers) if (headers.hasOwnProperty(key)) xhr.setRequestHeader(key, headers[key]);
							}
							if (typeof this._config.headers === "object") {
								var headers = this._config.headers;
								for (var key in headers) if (headers.hasOwnProperty(key)) xhr.setRequestHeader(key, headers[key]);
							}
							xhr.send();
						};
						RangeLoader.prototype.abort = function() {
							this._requestAbort = true;
							this._internalAbort();
							this._status = _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderStatus.kComplete;
						};
						RangeLoader.prototype._internalAbort = function() {
							if (this._xhr) {
								this._xhr.onreadystatechange = null;
								this._xhr.onprogress = null;
								this._xhr.onload = null;
								this._xhr.onerror = null;
								this._xhr.abort();
								this._xhr = null;
							}
						};
						RangeLoader.prototype._onReadyStateChange = function(e) {
							var xhr = e.target;
							if (xhr.readyState === 2) {
								if (xhr.responseURL != void 0) {
									var redirectedURL = this._seekHandler.removeURLParameters(xhr.responseURL);
									if (xhr.responseURL !== this._currentRequestURL && redirectedURL !== this._currentRedirectedURL) {
										this._currentRedirectedURL = redirectedURL;
										if (this._onURLRedirect) this._onURLRedirect(redirectedURL);
									}
								}
								if (xhr.status >= 200 && xhr.status <= 299) {
									if (this._waitForTotalLength) return;
									this._status = _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderStatus.kBuffering;
								} else {
									this._status = _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderStatus.kError;
									if (this._onError) this._onError(_loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderErrors.HTTP_STATUS_CODE_INVALID, {
										code: xhr.status,
										msg: xhr.statusText
									});
									else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_3__.RuntimeException("RangeLoader: Http code invalid, " + xhr.status + " " + xhr.statusText);
								}
							}
						};
						RangeLoader.prototype._onProgress = function(e) {
							if (this._status === _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderStatus.kError) return;
							if (this._contentLength === null) {
								var openNextRange = false;
								if (this._waitForTotalLength) {
									this._waitForTotalLength = false;
									this._totalLengthReceived = true;
									openNextRange = true;
									var total = e.total;
									this._internalAbort();
									if (total != null & total !== 0) this._totalLength = total;
								}
								if (this._range.to === -1) this._contentLength = this._totalLength - this._range.from;
								else this._contentLength = this._range.to - this._range.from + 1;
								if (openNextRange) {
									this._openSubRange();
									return;
								}
								if (this._onContentLengthKnown) this._onContentLengthKnown(this._contentLength);
							}
							var delta = e.loaded - this._lastTimeLoaded;
							this._lastTimeLoaded = e.loaded;
							this._speedSampler.addBytes(delta);
						};
						RangeLoader.prototype._normalizeSpeed = function(input) {
							var list = this._chunkSizeKBList;
							var last = list.length - 1;
							var mid = 0;
							var lbound = 0;
							var ubound = last;
							if (input < list[0]) return list[0];
							while (lbound <= ubound) {
								mid = lbound + Math.floor((ubound - lbound) / 2);
								if (mid === last || input >= list[mid] && input < list[mid + 1]) return list[mid];
								else if (list[mid] < input) lbound = mid + 1;
								else ubound = mid - 1;
							}
						};
						RangeLoader.prototype._onLoad = function(e) {
							if (this._status === _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderStatus.kError) return;
							if (this._waitForTotalLength) {
								this._waitForTotalLength = false;
								return;
							}
							this._lastTimeLoaded = 0;
							var KBps = this._speedSampler.lastSecondKBps;
							if (KBps === 0) {
								this._zeroSpeedChunkCount++;
								if (this._zeroSpeedChunkCount >= 3) KBps = this._speedSampler.currentKBps;
							}
							if (KBps !== 0) {
								var normalized = this._normalizeSpeed(KBps);
								if (this._currentSpeedNormalized !== normalized) {
									this._currentSpeedNormalized = normalized;
									this._currentChunkSizeKB = normalized;
								}
							}
							var chunk = e.target.response;
							var byteStart = this._range.from + this._receivedLength;
							this._receivedLength += chunk.byteLength;
							var reportComplete = false;
							if (this._contentLength != null && this._receivedLength < this._contentLength) this._openSubRange();
							else reportComplete = true;
							if (this._onDataArrival) this._onDataArrival(chunk, byteStart, this._receivedLength);
							if (reportComplete) {
								this._status = _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderStatus.kComplete;
								if (this._onComplete) this._onComplete(this._range.from, this._range.from + this._receivedLength - 1);
							}
						};
						RangeLoader.prototype._onXhrError = function(e) {
							this._status = _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderStatus.kError;
							var type = 0;
							var info = null;
							if (this._contentLength && this._receivedLength > 0 && this._receivedLength < this._contentLength) {
								type = _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderErrors.EARLY_EOF;
								info = {
									code: -1,
									msg: "RangeLoader meet Early-Eof"
								};
							} else {
								type = _loader_js__WEBPACK_IMPORTED_MODULE_2__.LoaderErrors.EXCEPTION;
								info = {
									code: -1,
									msg: e.constructor.name + " " + e.type
								};
							}
							if (this._onError) this._onError(type, info);
							else throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_3__.RuntimeException(info.msg);
						};
						return RangeLoader;
					}(_loader_js__WEBPACK_IMPORTED_MODULE_2__.BaseLoader);
				}),
				"./src/player/flv-player.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!**********************************!*\
					!*** ./src/player/flv-player.js ***!
					\**********************************/
					__webpack_require__.r(__webpack_exports__);
					var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! events */
						"./node_modules/events/events.js"
					);
					var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);
					var _utils_logger_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ../utils/logger.js */
						"./src/utils/logger.js"
					);
					var _utils_browser_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ../utils/browser.js */
						"./src/utils/browser.js"
					);
					var _player_events_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
						/*! ./player-events.js */
						"./src/player/player-events.js"
					);
					var _core_transmuxer_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
						/*! ../core/transmuxer.js */
						"./src/core/transmuxer.js"
					);
					var _core_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
						/*! ../core/transmuxing-events.js */
						"./src/core/transmuxing-events.js"
					);
					var _core_mse_controller_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(
						/*! ../core/mse-controller.js */
						"./src/core/mse-controller.js"
					);
					var _core_mse_events_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(
						/*! ../core/mse-events.js */
						"./src/core/mse-events.js"
					);
					var _player_errors_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(
						/*! ./player-errors.js */
						"./src/player/player-errors.js"
					);
					var _config_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(
						/*! ../config.js */
						"./src/config.js"
					);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					__webpack_exports__["default"] = function() {
						function FlvPlayer(mediaDataSource, config) {
							this.TAG = "FlvPlayer";
							this._type = "FlvPlayer";
							this._emitter = new (events__WEBPACK_IMPORTED_MODULE_0___default())();
							this._config = (0, _config_js__WEBPACK_IMPORTED_MODULE_9__.createDefaultConfig)();
							if (typeof config === "object") Object.assign(this._config, config);
							if (mediaDataSource.type.toLowerCase() !== "flv") throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_10__.InvalidArgumentException("FlvPlayer requires an flv MediaDataSource input!");
							if (mediaDataSource.isLive === true) this._config.isLive = true;
							this.e = {
								onvLoadedMetadata: this._onvLoadedMetadata.bind(this),
								onvSeeking: this._onvSeeking.bind(this),
								onvCanPlay: this._onvCanPlay.bind(this),
								onvStalled: this._onvStalled.bind(this),
								onvProgress: this._onvProgress.bind(this)
							};
							if (self.performance && self.performance.now) this._now = self.performance.now.bind(self.performance);
							else this._now = Date.now;
							this._pendingSeekTime = null;
							this._requestSetTime = false;
							this._seekpointRecord = null;
							this._progressChecker = null;
							this._mediaDataSource = mediaDataSource;
							this._mediaElement = null;
							this._msectl = null;
							this._transmuxer = null;
							this._mseSourceOpened = false;
							this._hasPendingLoad = false;
							this._receivedCanPlay = false;
							this._mediaInfo = null;
							this._statisticsInfo = null;
							var chromeNeedIDRFix = _utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.chrome && (_utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.version.major < 50 || _utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.version.major === 50 && _utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.version.build < 2661);
							this._alwaysSeekKeyframe = chromeNeedIDRFix || _utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.msedge || _utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.msie ? true : false;
							if (this._alwaysSeekKeyframe) this._config.accurateSeek = false;
						}
						FlvPlayer.prototype.destroy = function() {
							if (this._progressChecker != null) {
								window.clearInterval(this._progressChecker);
								this._progressChecker = null;
							}
							if (this._transmuxer) this.unload();
							if (this._mediaElement) this.detachMediaElement();
							this.e = null;
							this._mediaDataSource = null;
							this._emitter.removeAllListeners();
							this._emitter = null;
						};
						FlvPlayer.prototype.on = function(event, listener) {
							var _this = this;
							if (event === _player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.MEDIA_INFO) {
								if (this._mediaInfo != null) Promise.resolve().then(function() {
									_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.MEDIA_INFO, _this.mediaInfo);
								});
							} else if (event === _player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.STATISTICS_INFO) {
								if (this._statisticsInfo != null) Promise.resolve().then(function() {
									_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.STATISTICS_INFO, _this.statisticsInfo);
								});
							}
							this._emitter.addListener(event, listener);
						};
						FlvPlayer.prototype.off = function(event, listener) {
							this._emitter.removeListener(event, listener);
						};
						FlvPlayer.prototype.attachMediaElement = function(mediaElement) {
							var _this = this;
							this._mediaElement = mediaElement;
							mediaElement.addEventListener("loadedmetadata", this.e.onvLoadedMetadata);
							mediaElement.addEventListener("seeking", this.e.onvSeeking);
							mediaElement.addEventListener("canplay", this.e.onvCanPlay);
							mediaElement.addEventListener("stalled", this.e.onvStalled);
							mediaElement.addEventListener("progress", this.e.onvProgress);
							this._msectl = new _core_mse_controller_js__WEBPACK_IMPORTED_MODULE_6__.default(this._config);
							this._msectl.on(_core_mse_events_js__WEBPACK_IMPORTED_MODULE_7__.default.UPDATE_END, this._onmseUpdateEnd.bind(this));
							this._msectl.on(_core_mse_events_js__WEBPACK_IMPORTED_MODULE_7__.default.BUFFER_FULL, this._onmseBufferFull.bind(this));
							this._msectl.on(_core_mse_events_js__WEBPACK_IMPORTED_MODULE_7__.default.SOURCE_OPEN, function() {
								_this._mseSourceOpened = true;
								if (_this._hasPendingLoad) {
									_this._hasPendingLoad = false;
									_this.load();
								}
							});
							this._msectl.on(_core_mse_events_js__WEBPACK_IMPORTED_MODULE_7__.default.ERROR, function(info) {
								_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.ERROR, _player_errors_js__WEBPACK_IMPORTED_MODULE_8__.ErrorTypes.MEDIA_ERROR, _player_errors_js__WEBPACK_IMPORTED_MODULE_8__.ErrorDetails.MEDIA_MSE_ERROR, info);
							});
							this._msectl.attachMediaElement(mediaElement);
							if (this._pendingSeekTime != null) try {
								mediaElement.currentTime = this._pendingSeekTime;
								this._pendingSeekTime = null;
							} catch (e) {}
						};
						FlvPlayer.prototype.detachMediaElement = function() {
							if (this._mediaElement) {
								this._msectl.detachMediaElement();
								this._mediaElement.removeEventListener("loadedmetadata", this.e.onvLoadedMetadata);
								this._mediaElement.removeEventListener("seeking", this.e.onvSeeking);
								this._mediaElement.removeEventListener("canplay", this.e.onvCanPlay);
								this._mediaElement.removeEventListener("stalled", this.e.onvStalled);
								this._mediaElement.removeEventListener("progress", this.e.onvProgress);
								this._mediaElement = null;
							}
							if (this._msectl) {
								this._msectl.destroy();
								this._msectl = null;
							}
						};
						FlvPlayer.prototype.load = function() {
							var _this = this;
							if (!this._mediaElement) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_10__.IllegalStateException("HTMLMediaElement must be attached before load()!");
							if (this._transmuxer) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_10__.IllegalStateException("FlvPlayer.load() has been called, please call unload() first!");
							if (this._hasPendingLoad) return;
							if (this._config.deferLoadAfterSourceOpen && this._mseSourceOpened === false) {
								this._hasPendingLoad = true;
								return;
							}
							if (this._mediaElement.readyState > 0) {
								this._requestSetTime = true;
								this._mediaElement.currentTime = 0;
							}
							this._transmuxer = new _core_transmuxer_js__WEBPACK_IMPORTED_MODULE_4__.default(this._mediaDataSource, this._config);
							this._transmuxer.on(_core_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.INIT_SEGMENT, function(type, is) {
								_this._msectl.appendInitSegment(is);
							});
							this._transmuxer.on(_core_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.MEDIA_SEGMENT, function(type, ms) {
								_this._msectl.appendMediaSegment(ms);
								if (_this._config.lazyLoad && !_this._config.isLive) {
									var currentTime = _this._mediaElement.currentTime;
									if (ms.info.endDts >= (currentTime + _this._config.lazyLoadMaxDuration) * 1e3) {
										if (_this._progressChecker == null) {
											_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.v(_this.TAG, "Maximum buffering duration exceeded, suspend transmuxing task");
											_this._suspendTransmuxer();
										}
									}
								}
							});
							this._transmuxer.on(_core_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.LOADING_COMPLETE, function() {
								_this._msectl.endOfStream();
								_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.LOADING_COMPLETE);
							});
							this._transmuxer.on(_core_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.RECOVERED_EARLY_EOF, function() {
								_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.RECOVERED_EARLY_EOF);
							});
							this._transmuxer.on(_core_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.IO_ERROR, function(detail, info) {
								_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.ERROR, _player_errors_js__WEBPACK_IMPORTED_MODULE_8__.ErrorTypes.NETWORK_ERROR, detail, info);
							});
							this._transmuxer.on(_core_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.DEMUX_ERROR, function(detail, info) {
								_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.ERROR, _player_errors_js__WEBPACK_IMPORTED_MODULE_8__.ErrorTypes.MEDIA_ERROR, detail, {
									code: -1,
									msg: info
								});
							});
							this._transmuxer.on(_core_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.MEDIA_INFO, function(mediaInfo) {
								_this._mediaInfo = mediaInfo;
								_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.MEDIA_INFO, Object.assign({}, mediaInfo));
							});
							this._transmuxer.on(_core_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.METADATA_ARRIVED, function(metadata) {
								_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.METADATA_ARRIVED, metadata);
							});
							this._transmuxer.on(_core_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.SCRIPTDATA_ARRIVED, function(data) {
								_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.SCRIPTDATA_ARRIVED, data);
							});
							this._transmuxer.on(_core_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.STATISTICS_INFO, function(statInfo) {
								_this._statisticsInfo = _this._fillStatisticsInfo(statInfo);
								_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_3__.default.STATISTICS_INFO, Object.assign({}, _this._statisticsInfo));
							});
							this._transmuxer.on(_core_transmuxing_events_js__WEBPACK_IMPORTED_MODULE_5__.default.RECOMMEND_SEEKPOINT, function(milliseconds) {
								if (_this._mediaElement && !_this._config.accurateSeek) {
									_this._requestSetTime = true;
									_this._mediaElement.currentTime = milliseconds / 1e3;
								}
							});
							this._transmuxer.open();
						};
						FlvPlayer.prototype.unload = function() {
							if (this._mediaElement) this._mediaElement.pause();
							if (this._msectl) this._msectl.seek(0);
							if (this._transmuxer) {
								this._transmuxer.close();
								this._transmuxer.destroy();
								this._transmuxer = null;
							}
						};
						FlvPlayer.prototype.play = function() {
							return this._mediaElement.play();
						};
						FlvPlayer.prototype.pause = function() {
							this._mediaElement.pause();
						};
						Object.defineProperty(FlvPlayer.prototype, "type", {
							get: function() {
								return this._type;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FlvPlayer.prototype, "buffered", {
							get: function() {
								return this._mediaElement.buffered;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FlvPlayer.prototype, "duration", {
							get: function() {
								return this._mediaElement.duration;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FlvPlayer.prototype, "volume", {
							get: function() {
								return this._mediaElement.volume;
							},
							set: function(value) {
								this._mediaElement.volume = value;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FlvPlayer.prototype, "muted", {
							get: function() {
								return this._mediaElement.muted;
							},
							set: function(muted) {
								this._mediaElement.muted = muted;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FlvPlayer.prototype, "currentTime", {
							get: function() {
								if (this._mediaElement) return this._mediaElement.currentTime;
								return 0;
							},
							set: function(seconds) {
								if (this._mediaElement) this._internalSeek(seconds);
								else this._pendingSeekTime = seconds;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FlvPlayer.prototype, "mediaInfo", {
							get: function() {
								return Object.assign({}, this._mediaInfo);
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(FlvPlayer.prototype, "statisticsInfo", {
							get: function() {
								if (this._statisticsInfo == null) this._statisticsInfo = {};
								this._statisticsInfo = this._fillStatisticsInfo(this._statisticsInfo);
								return Object.assign({}, this._statisticsInfo);
							},
							enumerable: false,
							configurable: true
						});
						FlvPlayer.prototype._fillStatisticsInfo = function(statInfo) {
							statInfo.playerType = this._type;
							if (!(this._mediaElement instanceof HTMLVideoElement)) return statInfo;
							var hasQualityInfo = true;
							var decoded = 0;
							var dropped = 0;
							if (this._mediaElement.getVideoPlaybackQuality) {
								var quality = this._mediaElement.getVideoPlaybackQuality();
								decoded = quality.totalVideoFrames;
								dropped = quality.droppedVideoFrames;
							} else if (this._mediaElement.webkitDecodedFrameCount != void 0) {
								decoded = this._mediaElement.webkitDecodedFrameCount;
								dropped = this._mediaElement.webkitDroppedFrameCount;
							} else hasQualityInfo = false;
							if (hasQualityInfo) {
								statInfo.decodedFrames = decoded;
								statInfo.droppedFrames = dropped;
							}
							return statInfo;
						};
						FlvPlayer.prototype._onmseUpdateEnd = function() {
							if (!this._config.lazyLoad || this._config.isLive) return;
							var buffered = this._mediaElement.buffered;
							var currentTime = this._mediaElement.currentTime;
							var currentRangeEnd = 0;
							for (var i = 0; i < buffered.length; i++) {
								var start = buffered.start(i);
								var end = buffered.end(i);
								if (start <= currentTime && currentTime < end) {
									currentRangeEnd = end;
									break;
								}
							}
							if (currentRangeEnd >= currentTime + this._config.lazyLoadMaxDuration && this._progressChecker == null) {
								_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.v(this.TAG, "Maximum buffering duration exceeded, suspend transmuxing task");
								this._suspendTransmuxer();
							}
						};
						FlvPlayer.prototype._onmseBufferFull = function() {
							_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.v(this.TAG, "MSE SourceBuffer is full, suspend transmuxing task");
							if (this._progressChecker == null) this._suspendTransmuxer();
						};
						FlvPlayer.prototype._suspendTransmuxer = function() {
							if (this._transmuxer) {
								this._transmuxer.pause();
								if (this._progressChecker == null) this._progressChecker = window.setInterval(this._checkProgressAndResume.bind(this), 1e3);
							}
						};
						FlvPlayer.prototype._checkProgressAndResume = function() {
							var currentTime = this._mediaElement.currentTime;
							var buffered = this._mediaElement.buffered;
							var needResume = false;
							for (var i = 0; i < buffered.length; i++) {
								var from = buffered.start(i);
								var to = buffered.end(i);
								if (currentTime >= from && currentTime < to) {
									if (currentTime >= to - this._config.lazyLoadRecoverDuration) needResume = true;
									break;
								}
							}
							if (needResume) {
								window.clearInterval(this._progressChecker);
								this._progressChecker = null;
								if (needResume) {
									_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.v(this.TAG, "Continue loading from paused position");
									this._transmuxer.resume();
								}
							}
						};
						FlvPlayer.prototype._isTimepointBuffered = function(seconds) {
							var buffered = this._mediaElement.buffered;
							for (var i = 0; i < buffered.length; i++) {
								var from = buffered.start(i);
								var to = buffered.end(i);
								if (seconds >= from && seconds < to) return true;
							}
							return false;
						};
						FlvPlayer.prototype._internalSeek = function(seconds) {
							var directSeek = this._isTimepointBuffered(seconds);
							var directSeekBegin = false;
							var directSeekBeginTime = 0;
							if (seconds < 1 && this._mediaElement.buffered.length > 0) {
								var videoBeginTime = this._mediaElement.buffered.start(0);
								if (videoBeginTime < 1 && seconds < videoBeginTime || _utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.safari) {
									directSeekBegin = true;
									directSeekBeginTime = _utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.safari ? .1 : videoBeginTime;
								}
							}
							if (directSeekBegin) {
								this._requestSetTime = true;
								this._mediaElement.currentTime = directSeekBeginTime;
							} else if (directSeek) {
								if (!this._alwaysSeekKeyframe) {
									this._requestSetTime = true;
									this._mediaElement.currentTime = seconds;
								} else {
									var idr = this._msectl.getNearestKeyframe(Math.floor(seconds * 1e3));
									this._requestSetTime = true;
									if (idr != null) this._mediaElement.currentTime = idr.dts / 1e3;
									else this._mediaElement.currentTime = seconds;
								}
								if (this._progressChecker != null) this._checkProgressAndResume();
							} else {
								if (this._progressChecker != null) {
									window.clearInterval(this._progressChecker);
									this._progressChecker = null;
								}
								this._msectl.seek(seconds);
								this._transmuxer.seek(Math.floor(seconds * 1e3));
								if (this._config.accurateSeek) {
									this._requestSetTime = true;
									this._mediaElement.currentTime = seconds;
								}
							}
						};
						FlvPlayer.prototype._checkAndApplyUnbufferedSeekpoint = function() {
							if (this._seekpointRecord) if (this._seekpointRecord.recordTime <= this._now() - 100) {
								var target = this._mediaElement.currentTime;
								this._seekpointRecord = null;
								if (!this._isTimepointBuffered(target)) {
									if (this._progressChecker != null) {
										window.clearTimeout(this._progressChecker);
										this._progressChecker = null;
									}
									this._msectl.seek(target);
									this._transmuxer.seek(Math.floor(target * 1e3));
									if (this._config.accurateSeek) {
										this._requestSetTime = true;
										this._mediaElement.currentTime = target;
									}
								}
							} else window.setTimeout(this._checkAndApplyUnbufferedSeekpoint.bind(this), 50);
						};
						FlvPlayer.prototype._checkAndResumeStuckPlayback = function(stalled) {
							var media = this._mediaElement;
							if (stalled || !this._receivedCanPlay || media.readyState < 2) {
								var buffered = media.buffered;
								if (buffered.length > 0 && media.currentTime < buffered.start(0)) {
									_utils_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.w(this.TAG, "Playback seems stuck at " + media.currentTime + ", seek to " + buffered.start(0));
									this._requestSetTime = true;
									this._mediaElement.currentTime = buffered.start(0);
									this._mediaElement.removeEventListener("progress", this.e.onvProgress);
								}
							} else this._mediaElement.removeEventListener("progress", this.e.onvProgress);
						};
						FlvPlayer.prototype._onvLoadedMetadata = function(e) {
							if (this._pendingSeekTime != null) {
								this._mediaElement.currentTime = this._pendingSeekTime;
								this._pendingSeekTime = null;
							}
						};
						FlvPlayer.prototype._onvSeeking = function(e) {
							var target = this._mediaElement.currentTime;
							var buffered = this._mediaElement.buffered;
							if (this._requestSetTime) {
								this._requestSetTime = false;
								return;
							}
							if (target < 1 && buffered.length > 0) {
								var videoBeginTime = buffered.start(0);
								if (videoBeginTime < 1 && target < videoBeginTime || _utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.safari) {
									this._requestSetTime = true;
									this._mediaElement.currentTime = _utils_browser_js__WEBPACK_IMPORTED_MODULE_2__.default.safari ? .1 : videoBeginTime;
									return;
								}
							}
							if (this._isTimepointBuffered(target)) {
								if (this._alwaysSeekKeyframe) {
									var idr = this._msectl.getNearestKeyframe(Math.floor(target * 1e3));
									if (idr != null) {
										this._requestSetTime = true;
										this._mediaElement.currentTime = idr.dts / 1e3;
									}
								}
								if (this._progressChecker != null) this._checkProgressAndResume();
								return;
							}
							this._seekpointRecord = {
								seekPoint: target,
								recordTime: this._now()
							};
							window.setTimeout(this._checkAndApplyUnbufferedSeekpoint.bind(this), 50);
						};
						FlvPlayer.prototype._onvCanPlay = function(e) {
							this._receivedCanPlay = true;
							this._mediaElement.removeEventListener("canplay", this.e.onvCanPlay);
						};
						FlvPlayer.prototype._onvStalled = function(e) {
							this._checkAndResumeStuckPlayback(true);
						};
						FlvPlayer.prototype._onvProgress = function(e) {
							this._checkAndResumeStuckPlayback();
						};
						return FlvPlayer;
					}();
				}),
				"./src/player/native-player.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!*************************************!*\
					!*** ./src/player/native-player.js ***!
					\*************************************/
					__webpack_require__.r(__webpack_exports__);
					var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! events */
						"./node_modules/events/events.js"
					);
					var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);
					var _player_events_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ./player-events.js */
						"./src/player/player-events.js"
					);
					var _config_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ../config.js */
						"./src/config.js"
					);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					__webpack_exports__["default"] = function() {
						function NativePlayer(mediaDataSource, config) {
							this.TAG = "NativePlayer";
							this._type = "NativePlayer";
							this._emitter = new (events__WEBPACK_IMPORTED_MODULE_0___default())();
							this._config = (0, _config_js__WEBPACK_IMPORTED_MODULE_2__.createDefaultConfig)();
							if (typeof config === "object") Object.assign(this._config, config);
							if (mediaDataSource.type.toLowerCase() === "flv") throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_3__.InvalidArgumentException("NativePlayer does't support flv MediaDataSource input!");
							if (mediaDataSource.hasOwnProperty("segments")) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_3__.InvalidArgumentException("NativePlayer(" + mediaDataSource.type + ") doesn't support multipart playback!");
							this.e = { onvLoadedMetadata: this._onvLoadedMetadata.bind(this) };
							this._pendingSeekTime = null;
							this._statisticsReporter = null;
							this._mediaDataSource = mediaDataSource;
							this._mediaElement = null;
						}
						NativePlayer.prototype.destroy = function() {
							if (this._mediaElement) {
								this.unload();
								this.detachMediaElement();
							}
							this.e = null;
							this._mediaDataSource = null;
							this._emitter.removeAllListeners();
							this._emitter = null;
						};
						NativePlayer.prototype.on = function(event, listener) {
							var _this = this;
							if (event === _player_events_js__WEBPACK_IMPORTED_MODULE_1__.default.MEDIA_INFO) {
								if (this._mediaElement != null && this._mediaElement.readyState !== 0) Promise.resolve().then(function() {
									_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_1__.default.MEDIA_INFO, _this.mediaInfo);
								});
							} else if (event === _player_events_js__WEBPACK_IMPORTED_MODULE_1__.default.STATISTICS_INFO) {
								if (this._mediaElement != null && this._mediaElement.readyState !== 0) Promise.resolve().then(function() {
									_this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_1__.default.STATISTICS_INFO, _this.statisticsInfo);
								});
							}
							this._emitter.addListener(event, listener);
						};
						NativePlayer.prototype.off = function(event, listener) {
							this._emitter.removeListener(event, listener);
						};
						NativePlayer.prototype.attachMediaElement = function(mediaElement) {
							this._mediaElement = mediaElement;
							mediaElement.addEventListener("loadedmetadata", this.e.onvLoadedMetadata);
							if (this._pendingSeekTime != null) try {
								mediaElement.currentTime = this._pendingSeekTime;
								this._pendingSeekTime = null;
							} catch (e) {}
						};
						NativePlayer.prototype.detachMediaElement = function() {
							if (this._mediaElement) {
								this._mediaElement.src = "";
								this._mediaElement.removeAttribute("src");
								this._mediaElement.removeEventListener("loadedmetadata", this.e.onvLoadedMetadata);
								this._mediaElement = null;
							}
							if (this._statisticsReporter != null) {
								window.clearInterval(this._statisticsReporter);
								this._statisticsReporter = null;
							}
						};
						NativePlayer.prototype.load = function() {
							if (!this._mediaElement) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_3__.IllegalStateException("HTMLMediaElement must be attached before load()!");
							this._mediaElement.src = this._mediaDataSource.url;
							if (this._mediaElement.readyState > 0) this._mediaElement.currentTime = 0;
							this._mediaElement.preload = "auto";
							this._mediaElement.load();
							this._statisticsReporter = window.setInterval(this._reportStatisticsInfo.bind(this), this._config.statisticsInfoReportInterval);
						};
						NativePlayer.prototype.unload = function() {
							if (this._mediaElement) {
								this._mediaElement.src = "";
								this._mediaElement.removeAttribute("src");
							}
							if (this._statisticsReporter != null) {
								window.clearInterval(this._statisticsReporter);
								this._statisticsReporter = null;
							}
						};
						NativePlayer.prototype.play = function() {
							return this._mediaElement.play();
						};
						NativePlayer.prototype.pause = function() {
							this._mediaElement.pause();
						};
						Object.defineProperty(NativePlayer.prototype, "type", {
							get: function() {
								return this._type;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(NativePlayer.prototype, "buffered", {
							get: function() {
								return this._mediaElement.buffered;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(NativePlayer.prototype, "duration", {
							get: function() {
								return this._mediaElement.duration;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(NativePlayer.prototype, "volume", {
							get: function() {
								return this._mediaElement.volume;
							},
							set: function(value) {
								this._mediaElement.volume = value;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(NativePlayer.prototype, "muted", {
							get: function() {
								return this._mediaElement.muted;
							},
							set: function(muted) {
								this._mediaElement.muted = muted;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(NativePlayer.prototype, "currentTime", {
							get: function() {
								if (this._mediaElement) return this._mediaElement.currentTime;
								return 0;
							},
							set: function(seconds) {
								if (this._mediaElement) this._mediaElement.currentTime = seconds;
								else this._pendingSeekTime = seconds;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(NativePlayer.prototype, "mediaInfo", {
							get: function() {
								var info = { mimeType: (this._mediaElement instanceof HTMLAudioElement ? "audio/" : "video/") + this._mediaDataSource.type };
								if (this._mediaElement) {
									info.duration = Math.floor(this._mediaElement.duration * 1e3);
									if (this._mediaElement instanceof HTMLVideoElement) {
										info.width = this._mediaElement.videoWidth;
										info.height = this._mediaElement.videoHeight;
									}
								}
								return info;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(NativePlayer.prototype, "statisticsInfo", {
							get: function() {
								var info = {
									playerType: this._type,
									url: this._mediaDataSource.url
								};
								if (!(this._mediaElement instanceof HTMLVideoElement)) return info;
								var hasQualityInfo = true;
								var decoded = 0;
								var dropped = 0;
								if (this._mediaElement.getVideoPlaybackQuality) {
									var quality = this._mediaElement.getVideoPlaybackQuality();
									decoded = quality.totalVideoFrames;
									dropped = quality.droppedVideoFrames;
								} else if (this._mediaElement.webkitDecodedFrameCount != void 0) {
									decoded = this._mediaElement.webkitDecodedFrameCount;
									dropped = this._mediaElement.webkitDroppedFrameCount;
								} else hasQualityInfo = false;
								if (hasQualityInfo) {
									info.decodedFrames = decoded;
									info.droppedFrames = dropped;
								}
								return info;
							},
							enumerable: false,
							configurable: true
						});
						NativePlayer.prototype._onvLoadedMetadata = function(e) {
							if (this._pendingSeekTime != null) {
								this._mediaElement.currentTime = this._pendingSeekTime;
								this._pendingSeekTime = null;
							}
							this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_1__.default.MEDIA_INFO, this.mediaInfo);
						};
						NativePlayer.prototype._reportStatisticsInfo = function() {
							this._emitter.emit(_player_events_js__WEBPACK_IMPORTED_MODULE_1__.default.STATISTICS_INFO, this.statisticsInfo);
						};
						return NativePlayer;
					}();
				}),
				"./src/player/player-errors.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!*************************************!*\
					!*** ./src/player/player-errors.js ***!
					\*************************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_require__.d(__webpack_exports__, {
						"ErrorTypes": function() {
							return ErrorTypes;
						},
						"ErrorDetails": function() {
							return ErrorDetails;
						}
					});
					var _io_loader_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ../io/loader.js */
						"./src/io/loader.js"
					);
					var _demux_demux_errors_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ../demux/demux-errors.js */
						"./src/demux/demux-errors.js"
					);
					var ErrorTypes = {
						NETWORK_ERROR: "NetworkError",
						MEDIA_ERROR: "MediaError",
						OTHER_ERROR: "OtherError"
					};
					var ErrorDetails = {
						NETWORK_EXCEPTION: _io_loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderErrors.EXCEPTION,
						NETWORK_STATUS_CODE_INVALID: _io_loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderErrors.HTTP_STATUS_CODE_INVALID,
						NETWORK_TIMEOUT: _io_loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderErrors.CONNECTING_TIMEOUT,
						NETWORK_UNRECOVERABLE_EARLY_EOF: _io_loader_js__WEBPACK_IMPORTED_MODULE_0__.LoaderErrors.UNRECOVERABLE_EARLY_EOF,
						MEDIA_MSE_ERROR: "MediaMSEError",
						MEDIA_FORMAT_ERROR: _demux_demux_errors_js__WEBPACK_IMPORTED_MODULE_1__.default.FORMAT_ERROR,
						MEDIA_FORMAT_UNSUPPORTED: _demux_demux_errors_js__WEBPACK_IMPORTED_MODULE_1__.default.FORMAT_UNSUPPORTED,
						MEDIA_CODEC_UNSUPPORTED: _demux_demux_errors_js__WEBPACK_IMPORTED_MODULE_1__.default.CODEC_UNSUPPORTED
					};
				}),
				"./src/player/player-events.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!*************************************!*\
					!*** ./src/player/player-events.js ***!
					\*************************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_exports__["default"] = {
						ERROR: "error",
						LOADING_COMPLETE: "loading_complete",
						RECOVERED_EARLY_EOF: "recovered_early_eof",
						MEDIA_INFO: "media_info",
						METADATA_ARRIVED: "metadata_arrived",
						SCRIPTDATA_ARRIVED: "scriptdata_arrived",
						STATISTICS_INFO: "statistics_info"
					};
				}),
				"./src/remux/aac-silent.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!*********************************!*\
					!*** ./src/remux/aac-silent.js ***!
					\*********************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_exports__["default"] = function() {
						function AAC() {}
						AAC.getSilentFrame = function(codec, channelCount) {
							if (codec === "mp4a.40.2") {
								if (channelCount === 1) return new Uint8Array([
									0,
									200,
									0,
									128,
									35,
									128
								]);
								else if (channelCount === 2) return new Uint8Array([
									33,
									0,
									73,
									144,
									2,
									25,
									0,
									35,
									128
								]);
								else if (channelCount === 3) return new Uint8Array([
									0,
									200,
									0,
									128,
									32,
									132,
									1,
									38,
									64,
									8,
									100,
									0,
									142
								]);
								else if (channelCount === 4) return new Uint8Array([
									0,
									200,
									0,
									128,
									32,
									132,
									1,
									38,
									64,
									8,
									100,
									0,
									128,
									44,
									128,
									8,
									2,
									56
								]);
								else if (channelCount === 5) return new Uint8Array([
									0,
									200,
									0,
									128,
									32,
									132,
									1,
									38,
									64,
									8,
									100,
									0,
									130,
									48,
									4,
									153,
									0,
									33,
									144,
									2,
									56
								]);
								else if (channelCount === 6) return new Uint8Array([
									0,
									200,
									0,
									128,
									32,
									132,
									1,
									38,
									64,
									8,
									100,
									0,
									130,
									48,
									4,
									153,
									0,
									33,
									144,
									2,
									0,
									178,
									0,
									32,
									8,
									224
								]);
							} else if (channelCount === 1) return new Uint8Array([
								1,
								64,
								34,
								128,
								163,
								78,
								230,
								128,
								186,
								8,
								0,
								0,
								0,
								28,
								6,
								241,
								193,
								10,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								94
							]);
							else if (channelCount === 2) return new Uint8Array([
								1,
								64,
								34,
								128,
								163,
								94,
								230,
								128,
								186,
								8,
								0,
								0,
								0,
								0,
								149,
								0,
								6,
								241,
								161,
								10,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								94
							]);
							else if (channelCount === 3) return new Uint8Array([
								1,
								64,
								34,
								128,
								163,
								94,
								230,
								128,
								186,
								8,
								0,
								0,
								0,
								0,
								149,
								0,
								6,
								241,
								161,
								10,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								90,
								94
							]);
							return null;
						};
						return AAC;
					}();
				}),
				"./src/remux/mp4-generator.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!************************************!*\
					!*** ./src/remux/mp4-generator.js ***!
					\************************************/
					__webpack_require__.r(__webpack_exports__);
					var MP4 = function() {
						function MP4() {}
						MP4.init = function() {
							MP4.types = {
								avc1: [],
								avcC: [],
								btrt: [],
								dinf: [],
								dref: [],
								esds: [],
								ftyp: [],
								hdlr: [],
								mdat: [],
								mdhd: [],
								mdia: [],
								mfhd: [],
								minf: [],
								moof: [],
								moov: [],
								mp4a: [],
								mvex: [],
								mvhd: [],
								sdtp: [],
								stbl: [],
								stco: [],
								stsc: [],
								stsd: [],
								stsz: [],
								stts: [],
								tfdt: [],
								tfhd: [],
								traf: [],
								trak: [],
								trun: [],
								trex: [],
								tkhd: [],
								vmhd: [],
								smhd: [],
								".mp3": []
							};
							for (var name_1 in MP4.types) if (MP4.types.hasOwnProperty(name_1)) MP4.types[name_1] = [
								name_1.charCodeAt(0),
								name_1.charCodeAt(1),
								name_1.charCodeAt(2),
								name_1.charCodeAt(3)
							];
							var constants = MP4.constants = {};
							constants.FTYP = new Uint8Array([
								105,
								115,
								111,
								109,
								0,
								0,
								0,
								1,
								105,
								115,
								111,
								109,
								97,
								118,
								99,
								49
							]);
							constants.STSD_PREFIX = new Uint8Array([
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								1
							]);
							constants.STTS = new Uint8Array([
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0
							]);
							constants.STSC = constants.STCO = constants.STTS;
							constants.STSZ = new Uint8Array([
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0
							]);
							constants.HDLR_VIDEO = new Uint8Array([
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								118,
								105,
								100,
								101,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								86,
								105,
								100,
								101,
								111,
								72,
								97,
								110,
								100,
								108,
								101,
								114,
								0
							]);
							constants.HDLR_AUDIO = new Uint8Array([
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								115,
								111,
								117,
								110,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								83,
								111,
								117,
								110,
								100,
								72,
								97,
								110,
								100,
								108,
								101,
								114,
								0
							]);
							constants.DREF = new Uint8Array([
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								1,
								0,
								0,
								0,
								12,
								117,
								114,
								108,
								32,
								0,
								0,
								0,
								1
							]);
							constants.SMHD = new Uint8Array([
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0
							]);
							constants.VMHD = new Uint8Array([
								0,
								0,
								0,
								1,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0
							]);
						};
						MP4.box = function(type) {
							var size = 8;
							var result = null;
							var datas = Array.prototype.slice.call(arguments, 1);
							var arrayCount = datas.length;
							for (var i = 0; i < arrayCount; i++) size += datas[i].byteLength;
							result = new Uint8Array(size);
							result[0] = size >>> 24 & 255;
							result[1] = size >>> 16 & 255;
							result[2] = size >>> 8 & 255;
							result[3] = size & 255;
							result.set(type, 4);
							var offset = 8;
							for (var i = 0; i < arrayCount; i++) {
								result.set(datas[i], offset);
								offset += datas[i].byteLength;
							}
							return result;
						};
						MP4.generateInitSegment = function(meta) {
							var ftyp = MP4.box(MP4.types.ftyp, MP4.constants.FTYP);
							var moov = MP4.moov(meta);
							var result = new Uint8Array(ftyp.byteLength + moov.byteLength);
							result.set(ftyp, 0);
							result.set(moov, ftyp.byteLength);
							return result;
						};
						MP4.moov = function(meta) {
							var mvhd = MP4.mvhd(meta.timescale, meta.duration);
							var trak = MP4.trak(meta);
							var mvex = MP4.mvex(meta);
							return MP4.box(MP4.types.moov, mvhd, trak, mvex);
						};
						MP4.mvhd = function(timescale, duration) {
							return MP4.box(MP4.types.mvhd, new Uint8Array([
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								timescale >>> 24 & 255,
								timescale >>> 16 & 255,
								timescale >>> 8 & 255,
								timescale & 255,
								duration >>> 24 & 255,
								duration >>> 16 & 255,
								duration >>> 8 & 255,
								duration & 255,
								0,
								1,
								0,
								0,
								1,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								1,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								1,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								64,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								255,
								255,
								255,
								255
							]));
						};
						MP4.trak = function(meta) {
							return MP4.box(MP4.types.trak, MP4.tkhd(meta), MP4.mdia(meta));
						};
						MP4.tkhd = function(meta) {
							var trackId = meta.id, duration = meta.duration;
							var width = meta.presentWidth, height = meta.presentHeight;
							return MP4.box(MP4.types.tkhd, new Uint8Array([
								0,
								0,
								0,
								7,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								trackId >>> 24 & 255,
								trackId >>> 16 & 255,
								trackId >>> 8 & 255,
								trackId & 255,
								0,
								0,
								0,
								0,
								duration >>> 24 & 255,
								duration >>> 16 & 255,
								duration >>> 8 & 255,
								duration & 255,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								1,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								1,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								64,
								0,
								0,
								0,
								width >>> 8 & 255,
								width & 255,
								0,
								0,
								height >>> 8 & 255,
								height & 255,
								0,
								0
							]));
						};
						MP4.mdia = function(meta) {
							return MP4.box(MP4.types.mdia, MP4.mdhd(meta), MP4.hdlr(meta), MP4.minf(meta));
						};
						MP4.mdhd = function(meta) {
							var timescale = meta.timescale;
							var duration = meta.duration;
							return MP4.box(MP4.types.mdhd, new Uint8Array([
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								timescale >>> 24 & 255,
								timescale >>> 16 & 255,
								timescale >>> 8 & 255,
								timescale & 255,
								duration >>> 24 & 255,
								duration >>> 16 & 255,
								duration >>> 8 & 255,
								duration & 255,
								85,
								196,
								0,
								0
							]));
						};
						MP4.hdlr = function(meta) {
							var data = null;
							if (meta.type === "audio") data = MP4.constants.HDLR_AUDIO;
							else data = MP4.constants.HDLR_VIDEO;
							return MP4.box(MP4.types.hdlr, data);
						};
						MP4.minf = function(meta) {
							var xmhd = null;
							if (meta.type === "audio") xmhd = MP4.box(MP4.types.smhd, MP4.constants.SMHD);
							else xmhd = MP4.box(MP4.types.vmhd, MP4.constants.VMHD);
							return MP4.box(MP4.types.minf, xmhd, MP4.dinf(), MP4.stbl(meta));
						};
						MP4.dinf = function() {
							return MP4.box(MP4.types.dinf, MP4.box(MP4.types.dref, MP4.constants.DREF));
						};
						MP4.stbl = function(meta) {
							return MP4.box(MP4.types.stbl, MP4.stsd(meta), MP4.box(MP4.types.stts, MP4.constants.STTS), MP4.box(MP4.types.stsc, MP4.constants.STSC), MP4.box(MP4.types.stsz, MP4.constants.STSZ), MP4.box(MP4.types.stco, MP4.constants.STCO));
						};
						MP4.stsd = function(meta) {
							if (meta.type === "audio") {
								if (meta.codec === "mp3") return MP4.box(MP4.types.stsd, MP4.constants.STSD_PREFIX, MP4.mp3(meta));
								return MP4.box(MP4.types.stsd, MP4.constants.STSD_PREFIX, MP4.mp4a(meta));
							} else return MP4.box(MP4.types.stsd, MP4.constants.STSD_PREFIX, MP4.avc1(meta));
						};
						MP4.mp3 = function(meta) {
							var channelCount = meta.channelCount;
							var sampleRate = meta.audioSampleRate;
							var data = new Uint8Array([
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								1,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								channelCount,
								0,
								16,
								0,
								0,
								0,
								0,
								sampleRate >>> 8 & 255,
								sampleRate & 255,
								0,
								0
							]);
							return MP4.box(MP4.types[".mp3"], data);
						};
						MP4.mp4a = function(meta) {
							var channelCount = meta.channelCount;
							var sampleRate = meta.audioSampleRate;
							var data = new Uint8Array([
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								1,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								channelCount,
								0,
								16,
								0,
								0,
								0,
								0,
								sampleRate >>> 8 & 255,
								sampleRate & 255,
								0,
								0
							]);
							return MP4.box(MP4.types.mp4a, data, MP4.esds(meta));
						};
						MP4.esds = function(meta) {
							var config = meta.config || [];
							var configSize = config.length;
							var data = new Uint8Array([
								0,
								0,
								0,
								0,
								3,
								23 + configSize,
								0,
								1,
								0,
								4,
								15 + configSize,
								64,
								21,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								5
							].concat([configSize]).concat(config).concat([
								6,
								1,
								2
							]));
							return MP4.box(MP4.types.esds, data);
						};
						MP4.avc1 = function(meta) {
							var avcc = meta.avcc;
							var width = meta.codecWidth, height = meta.codecHeight;
							var data = new Uint8Array([
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								1,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								width >>> 8 & 255,
								width & 255,
								height >>> 8 & 255,
								height & 255,
								0,
								72,
								0,
								0,
								0,
								72,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								1,
								10,
								120,
								113,
								113,
								47,
								102,
								108,
								118,
								46,
								106,
								115,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								24,
								255,
								255
							]);
							return MP4.box(MP4.types.avc1, data, MP4.box(MP4.types.avcC, avcc));
						};
						MP4.mvex = function(meta) {
							return MP4.box(MP4.types.mvex, MP4.trex(meta));
						};
						MP4.trex = function(meta) {
							var trackId = meta.id;
							var data = new Uint8Array([
								0,
								0,
								0,
								0,
								trackId >>> 24 & 255,
								trackId >>> 16 & 255,
								trackId >>> 8 & 255,
								trackId & 255,
								0,
								0,
								0,
								1,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								0,
								1,
								0,
								1
							]);
							return MP4.box(MP4.types.trex, data);
						};
						MP4.moof = function(track, baseMediaDecodeTime) {
							return MP4.box(MP4.types.moof, MP4.mfhd(track.sequenceNumber), MP4.traf(track, baseMediaDecodeTime));
						};
						MP4.mfhd = function(sequenceNumber) {
							var data = new Uint8Array([
								0,
								0,
								0,
								0,
								sequenceNumber >>> 24 & 255,
								sequenceNumber >>> 16 & 255,
								sequenceNumber >>> 8 & 255,
								sequenceNumber & 255
							]);
							return MP4.box(MP4.types.mfhd, data);
						};
						MP4.traf = function(track, baseMediaDecodeTime) {
							var trackId = track.id;
							var tfhd = MP4.box(MP4.types.tfhd, new Uint8Array([
								0,
								0,
								0,
								0,
								trackId >>> 24 & 255,
								trackId >>> 16 & 255,
								trackId >>> 8 & 255,
								trackId & 255
							]));
							var tfdt = MP4.box(MP4.types.tfdt, new Uint8Array([
								0,
								0,
								0,
								0,
								baseMediaDecodeTime >>> 24 & 255,
								baseMediaDecodeTime >>> 16 & 255,
								baseMediaDecodeTime >>> 8 & 255,
								baseMediaDecodeTime & 255
							]));
							var sdtp = MP4.sdtp(track);
							var trun = MP4.trun(track, sdtp.byteLength + 16 + 16 + 8 + 16 + 8 + 8);
							return MP4.box(MP4.types.traf, tfhd, tfdt, trun, sdtp);
						};
						MP4.sdtp = function(track) {
							var samples = track.samples || [];
							var sampleCount = samples.length;
							var data = new Uint8Array(4 + sampleCount);
							for (var i = 0; i < sampleCount; i++) {
								var flags = samples[i].flags;
								data[i + 4] = flags.isLeading << 6 | flags.dependsOn << 4 | flags.isDependedOn << 2 | flags.hasRedundancy;
							}
							return MP4.box(MP4.types.sdtp, data);
						};
						MP4.trun = function(track, offset) {
							var samples = track.samples || [];
							var sampleCount = samples.length;
							var dataSize = 12 + 16 * sampleCount;
							var data = new Uint8Array(dataSize);
							offset += 8 + dataSize;
							data.set([
								0,
								0,
								15,
								1,
								sampleCount >>> 24 & 255,
								sampleCount >>> 16 & 255,
								sampleCount >>> 8 & 255,
								sampleCount & 255,
								offset >>> 24 & 255,
								offset >>> 16 & 255,
								offset >>> 8 & 255,
								offset & 255
							], 0);
							for (var i = 0; i < sampleCount; i++) {
								var duration = samples[i].duration;
								var size = samples[i].size;
								var flags = samples[i].flags;
								var cts = samples[i].cts;
								data.set([
									duration >>> 24 & 255,
									duration >>> 16 & 255,
									duration >>> 8 & 255,
									duration & 255,
									size >>> 24 & 255,
									size >>> 16 & 255,
									size >>> 8 & 255,
									size & 255,
									flags.isLeading << 2 | flags.dependsOn,
									flags.isDependedOn << 6 | flags.hasRedundancy << 4 | flags.isNonSync,
									0,
									0,
									cts >>> 24 & 255,
									cts >>> 16 & 255,
									cts >>> 8 & 255,
									cts & 255
								], 12 + 16 * i);
							}
							return MP4.box(MP4.types.trun, data);
						};
						MP4.mdat = function(data) {
							return MP4.box(MP4.types.mdat, data);
						};
						return MP4;
					}();
					MP4.init();
					__webpack_exports__["default"] = MP4;
				}),
				"./src/remux/mp4-remuxer.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!**********************************!*\
					!*** ./src/remux/mp4-remuxer.js ***!
					\**********************************/
					__webpack_require__.r(__webpack_exports__);
					var _utils_logger_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! ../utils/logger.js */
						"./src/utils/logger.js"
					);
					var _mp4_generator_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ./mp4-generator.js */
						"./src/remux/mp4-generator.js"
					);
					var _aac_silent_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
						/*! ./aac-silent.js */
						"./src/remux/aac-silent.js"
					);
					var _utils_browser_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
						/*! ../utils/browser.js */
						"./src/utils/browser.js"
					);
					var _core_media_segment_info_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
						/*! ../core/media-segment-info.js */
						"./src/core/media-segment-info.js"
					);
					var _utils_exception_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
						/*! ../utils/exception.js */
						"./src/utils/exception.js"
					);
					__webpack_exports__["default"] = function() {
						function MP4Remuxer(config) {
							this.TAG = "MP4Remuxer";
							this._config = config;
							this._isLive = config.isLive === true ? true : false;
							this._dtsBase = -1;
							this._dtsBaseInited = false;
							this._audioDtsBase = Infinity;
							this._videoDtsBase = Infinity;
							this._audioNextDts = void 0;
							this._videoNextDts = void 0;
							this._audioStashedLastSample = null;
							this._videoStashedLastSample = null;
							this._audioMeta = null;
							this._videoMeta = null;
							this._audioSegmentInfoList = new _core_media_segment_info_js__WEBPACK_IMPORTED_MODULE_4__.MediaSegmentInfoList("audio");
							this._videoSegmentInfoList = new _core_media_segment_info_js__WEBPACK_IMPORTED_MODULE_4__.MediaSegmentInfoList("video");
							this._onInitSegment = null;
							this._onMediaSegment = null;
							this._forceFirstIDR = _utils_browser_js__WEBPACK_IMPORTED_MODULE_3__.default.chrome && (_utils_browser_js__WEBPACK_IMPORTED_MODULE_3__.default.version.major < 50 || _utils_browser_js__WEBPACK_IMPORTED_MODULE_3__.default.version.major === 50 && _utils_browser_js__WEBPACK_IMPORTED_MODULE_3__.default.version.build < 2661) ? true : false;
							this._fillSilentAfterSeek = _utils_browser_js__WEBPACK_IMPORTED_MODULE_3__.default.msedge || _utils_browser_js__WEBPACK_IMPORTED_MODULE_3__.default.msie;
							this._mp3UseMpegAudio = !_utils_browser_js__WEBPACK_IMPORTED_MODULE_3__.default.firefox;
							this._fillAudioTimestampGap = this._config.fixAudioTimestampGap;
						}
						MP4Remuxer.prototype.destroy = function() {
							this._dtsBase = -1;
							this._dtsBaseInited = false;
							this._audioMeta = null;
							this._videoMeta = null;
							this._audioSegmentInfoList.clear();
							this._audioSegmentInfoList = null;
							this._videoSegmentInfoList.clear();
							this._videoSegmentInfoList = null;
							this._onInitSegment = null;
							this._onMediaSegment = null;
						};
						MP4Remuxer.prototype.bindDataSource = function(producer) {
							producer.onDataAvailable = this.remux.bind(this);
							producer.onTrackMetadata = this._onTrackMetadataReceived.bind(this);
							return this;
						};
						Object.defineProperty(MP4Remuxer.prototype, "onInitSegment", {
							get: function() {
								return this._onInitSegment;
							},
							set: function(callback) {
								this._onInitSegment = callback;
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(MP4Remuxer.prototype, "onMediaSegment", {
							get: function() {
								return this._onMediaSegment;
							},
							set: function(callback) {
								this._onMediaSegment = callback;
							},
							enumerable: false,
							configurable: true
						});
						MP4Remuxer.prototype.insertDiscontinuity = function() {
							this._audioNextDts = this._videoNextDts = void 0;
						};
						MP4Remuxer.prototype.seek = function(originalDts) {
							this._audioStashedLastSample = null;
							this._videoStashedLastSample = null;
							this._videoSegmentInfoList.clear();
							this._audioSegmentInfoList.clear();
						};
						MP4Remuxer.prototype.remux = function(audioTrack, videoTrack) {
							if (!this._onMediaSegment) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_5__.IllegalStateException("MP4Remuxer: onMediaSegment callback must be specificed!");
							if (!this._dtsBaseInited) this._calculateDtsBase(audioTrack, videoTrack);
							this._remuxVideo(videoTrack);
							this._remuxAudio(audioTrack);
						};
						MP4Remuxer.prototype._onTrackMetadataReceived = function(type, metadata) {
							var metabox = null;
							var container = "mp4";
							var codec = metadata.codec;
							if (type === "audio") {
								this._audioMeta = metadata;
								if (metadata.codec === "mp3" && this._mp3UseMpegAudio) {
									container = "mpeg";
									codec = "";
									metabox = /* @__PURE__ */ new Uint8Array();
								} else metabox = _mp4_generator_js__WEBPACK_IMPORTED_MODULE_1__.default.generateInitSegment(metadata);
							} else if (type === "video") {
								this._videoMeta = metadata;
								metabox = _mp4_generator_js__WEBPACK_IMPORTED_MODULE_1__.default.generateInitSegment(metadata);
							} else return;
							if (!this._onInitSegment) throw new _utils_exception_js__WEBPACK_IMPORTED_MODULE_5__.IllegalStateException("MP4Remuxer: onInitSegment callback must be specified!");
							this._onInitSegment(type, {
								type,
								data: metabox.buffer,
								codec,
								container: type + "/" + container,
								mediaDuration: metadata.duration
							});
						};
						MP4Remuxer.prototype._calculateDtsBase = function(audioTrack, videoTrack) {
							if (this._dtsBaseInited) return;
							if (audioTrack.samples && audioTrack.samples.length) this._audioDtsBase = audioTrack.samples[0].dts;
							if (videoTrack.samples && videoTrack.samples.length) this._videoDtsBase = videoTrack.samples[0].dts;
							this._dtsBase = Math.min(this._audioDtsBase, this._videoDtsBase);
							this._dtsBaseInited = true;
						};
						MP4Remuxer.prototype.flushStashedSamples = function() {
							var videoSample = this._videoStashedLastSample;
							var audioSample = this._audioStashedLastSample;
							var videoTrack = {
								type: "video",
								id: 1,
								sequenceNumber: 0,
								samples: [],
								length: 0
							};
							if (videoSample != null) {
								videoTrack.samples.push(videoSample);
								videoTrack.length = videoSample.length;
							}
							var audioTrack = {
								type: "audio",
								id: 2,
								sequenceNumber: 0,
								samples: [],
								length: 0
							};
							if (audioSample != null) {
								audioTrack.samples.push(audioSample);
								audioTrack.length = audioSample.length;
							}
							this._videoStashedLastSample = null;
							this._audioStashedLastSample = null;
							this._remuxVideo(videoTrack, true);
							this._remuxAudio(audioTrack, true);
						};
						MP4Remuxer.prototype._remuxAudio = function(audioTrack, force) {
							if (this._audioMeta == null) return;
							var track = audioTrack;
							var samples = track.samples;
							var dtsCorrection = void 0, firstDts = -1, lastDts = -1;
							var refSampleDuration = this._audioMeta.refSampleDuration;
							var mpegRawTrack = this._audioMeta.codec === "mp3" && this._mp3UseMpegAudio;
							var firstSegmentAfterSeek = this._dtsBaseInited && this._audioNextDts === void 0;
							var insertPrefixSilentFrame = false;
							if (!samples || samples.length === 0) return;
							if (samples.length === 1 && !force) return;
							var offset = 0;
							var mdatbox = null;
							var mdatBytes = 0;
							if (mpegRawTrack) {
								offset = 0;
								mdatBytes = track.length;
							} else {
								offset = 8;
								mdatBytes = 8 + track.length;
							}
							var lastSample = null;
							if (samples.length > 1) {
								lastSample = samples.pop();
								mdatBytes -= lastSample.length;
							}
							if (this._audioStashedLastSample != null) {
								var sample = this._audioStashedLastSample;
								this._audioStashedLastSample = null;
								samples.unshift(sample);
								mdatBytes += sample.length;
							}
							if (lastSample != null) this._audioStashedLastSample = lastSample;
							var firstSampleOriginalDts = samples[0].dts - this._dtsBase;
							if (this._audioNextDts) dtsCorrection = firstSampleOriginalDts - this._audioNextDts;
							else if (this._audioSegmentInfoList.isEmpty()) {
								dtsCorrection = 0;
								if (this._fillSilentAfterSeek && !this._videoSegmentInfoList.isEmpty()) {
									if (this._audioMeta.originalCodec !== "mp3") insertPrefixSilentFrame = true;
								}
							} else {
								var lastSample_1 = this._audioSegmentInfoList.getLastSampleBefore(firstSampleOriginalDts);
								if (lastSample_1 != null) {
									var distance = firstSampleOriginalDts - (lastSample_1.originalDts + lastSample_1.duration);
									if (distance <= 3) distance = 0;
									dtsCorrection = firstSampleOriginalDts - (lastSample_1.dts + lastSample_1.duration + distance);
								} else dtsCorrection = 0;
							}
							if (insertPrefixSilentFrame) {
								var firstSampleDts = firstSampleOriginalDts - dtsCorrection;
								var videoSegment = this._videoSegmentInfoList.getLastSegmentBefore(firstSampleOriginalDts);
								if (videoSegment != null && videoSegment.beginDts < firstSampleDts) {
									var silentUnit = _aac_silent_js__WEBPACK_IMPORTED_MODULE_2__.default.getSilentFrame(this._audioMeta.originalCodec, this._audioMeta.channelCount);
									if (silentUnit) {
										var dts = videoSegment.beginDts;
										var silentFrameDuration = firstSampleDts - videoSegment.beginDts;
										_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.v(this.TAG, "InsertPrefixSilentAudio: dts: " + dts + ", duration: " + silentFrameDuration);
										samples.unshift({
											unit: silentUnit,
											dts,
											pts: dts
										});
										mdatBytes += silentUnit.byteLength;
									}
								} else insertPrefixSilentFrame = false;
							}
							var mp4Samples = [];
							for (var i = 0; i < samples.length; i++) {
								var sample = samples[i];
								var unit = sample.unit;
								var originalDts = sample.dts - this._dtsBase;
								var dts = originalDts;
								var needFillSilentFrames = false;
								var silentFrames = null;
								var sampleDuration = 0;
								if (originalDts < -.001) continue;
								if (this._audioMeta.codec !== "mp3") {
									var curRefDts = originalDts;
									var maxAudioFramesDrift = 3;
									if (this._audioNextDts) curRefDts = this._audioNextDts;
									dtsCorrection = originalDts - curRefDts;
									if (dtsCorrection <= -maxAudioFramesDrift * refSampleDuration) {
										_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Dropping 1 audio frame (originalDts: " + originalDts + " ms ,curRefDts: " + curRefDts + " ms)  due to dtsCorrection: " + dtsCorrection + " ms overlap.");
										continue;
									} else if (dtsCorrection >= maxAudioFramesDrift * refSampleDuration && this._fillAudioTimestampGap && !_utils_browser_js__WEBPACK_IMPORTED_MODULE_3__.default.safari) {
										needFillSilentFrames = true;
										var frameCount = Math.floor(dtsCorrection / refSampleDuration);
										_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Large audio timestamp gap detected, may cause AV sync to drift. Silent frames will be generated to avoid unsync.\n" + ("originalDts: " + originalDts + " ms, curRefDts: " + curRefDts + " ms, ") + ("dtsCorrection: " + Math.round(dtsCorrection) + " ms, generate: " + frameCount + " frames"));
										dts = Math.floor(curRefDts);
										sampleDuration = Math.floor(curRefDts + refSampleDuration) - dts;
										var silentUnit = _aac_silent_js__WEBPACK_IMPORTED_MODULE_2__.default.getSilentFrame(this._audioMeta.originalCodec, this._audioMeta.channelCount);
										if (silentUnit == null) {
											_utils_logger_js__WEBPACK_IMPORTED_MODULE_0__.default.w(this.TAG, "Unable to generate silent frame for " + (this._audioMeta.originalCodec + " with " + this._audioMeta.channelCount + " channels, repeat last frame"));
											silentUnit = unit;
										}
										silentFrames = [];
										for (var j = 0; j < frameCount; j++) {
											curRefDts = curRefDts + refSampleDuration;
											var intDts = Math.floor(curRefDts);
											var intDuration = Math.floor(curRefDts + refSampleDuration) - intDts;
											var frame = {
												dts: intDts,
												pts: intDts,
												cts: 0,
												unit: silentUnit,
												size: silentUnit.byteLength,
												duration: intDuration,
												originalDts,
												flags: {
													isLeading: 0,
													dependsOn: 1,
													isDependedOn: 0,
													hasRedundancy: 0
												}
											};
											silentFrames.push(frame);
											mdatBytes += frame.size;
										}
										this._audioNextDts = curRefDts + refSampleDuration;
									} else {
										dts = Math.floor(curRefDts);
										sampleDuration = Math.floor(curRefDts + refSampleDuration) - dts;
										this._audioNextDts = curRefDts + refSampleDuration;
									}
								} else {
									dts = originalDts - dtsCorrection;
									if (i !== samples.length - 1) {
										var nextDts = samples[i + 1].dts - this._dtsBase - dtsCorrection;
										sampleDuration = nextDts - dts;
									} else if (lastSample != null) {
										var nextDts = lastSample.dts - this._dtsBase - dtsCorrection;
										sampleDuration = nextDts - dts;
									} else if (mp4Samples.length >= 1) sampleDuration = mp4Samples[mp4Samples.length - 1].duration;
									else sampleDuration = Math.floor(refSampleDuration);
									this._audioNextDts = dts + sampleDuration;
								}
								if (firstDts === -1) firstDts = dts;
								mp4Samples.push({
									dts,
									pts: dts,
									cts: 0,
									unit: sample.unit,
									size: sample.unit.byteLength,
									duration: sampleDuration,
									originalDts,
									flags: {
										isLeading: 0,
										dependsOn: 1,
										isDependedOn: 0,
										hasRedundancy: 0
									}
								});
								if (needFillSilentFrames) mp4Samples.push.apply(mp4Samples, silentFrames);
							}
							if (mp4Samples.length === 0) {
								track.samples = [];
								track.length = 0;
								return;
							}
							if (mpegRawTrack) mdatbox = new Uint8Array(mdatBytes);
							else {
								mdatbox = new Uint8Array(mdatBytes);
								mdatbox[0] = mdatBytes >>> 24 & 255;
								mdatbox[1] = mdatBytes >>> 16 & 255;
								mdatbox[2] = mdatBytes >>> 8 & 255;
								mdatbox[3] = mdatBytes & 255;
								mdatbox.set(_mp4_generator_js__WEBPACK_IMPORTED_MODULE_1__.default.types.mdat, 4);
							}
							for (var i = 0; i < mp4Samples.length; i++) {
								var unit = mp4Samples[i].unit;
								mdatbox.set(unit, offset);
								offset += unit.byteLength;
							}
							var latest = mp4Samples[mp4Samples.length - 1];
							lastDts = latest.dts + latest.duration;
							var info = new _core_media_segment_info_js__WEBPACK_IMPORTED_MODULE_4__.MediaSegmentInfo();
							info.beginDts = firstDts;
							info.endDts = lastDts;
							info.beginPts = firstDts;
							info.endPts = lastDts;
							info.originalBeginDts = mp4Samples[0].originalDts;
							info.originalEndDts = latest.originalDts + latest.duration;
							info.firstSample = new _core_media_segment_info_js__WEBPACK_IMPORTED_MODULE_4__.SampleInfo(mp4Samples[0].dts, mp4Samples[0].pts, mp4Samples[0].duration, mp4Samples[0].originalDts, false);
							info.lastSample = new _core_media_segment_info_js__WEBPACK_IMPORTED_MODULE_4__.SampleInfo(latest.dts, latest.pts, latest.duration, latest.originalDts, false);
							if (!this._isLive) this._audioSegmentInfoList.append(info);
							track.samples = mp4Samples;
							track.sequenceNumber++;
							var moofbox = null;
							if (mpegRawTrack) moofbox = /* @__PURE__ */ new Uint8Array();
							else moofbox = _mp4_generator_js__WEBPACK_IMPORTED_MODULE_1__.default.moof(track, firstDts);
							track.samples = [];
							track.length = 0;
							var segment = {
								type: "audio",
								data: this._mergeBoxes(moofbox, mdatbox).buffer,
								sampleCount: mp4Samples.length,
								info
							};
							if (mpegRawTrack && firstSegmentAfterSeek) segment.timestampOffset = firstDts;
							this._onMediaSegment("audio", segment);
						};
						MP4Remuxer.prototype._remuxVideo = function(videoTrack, force) {
							if (this._videoMeta == null) return;
							var track = videoTrack;
							var samples = track.samples;
							var dtsCorrection = void 0;
							var firstDts = -1, lastDts = -1;
							var firstPts = -1, lastPts = -1;
							if (!samples || samples.length === 0) return;
							if (samples.length === 1 && !force) return;
							var offset = 8;
							var mdatbox = null;
							var mdatBytes = 8 + videoTrack.length;
							var lastSample = null;
							if (samples.length > 1) {
								lastSample = samples.pop();
								mdatBytes -= lastSample.length;
							}
							if (this._videoStashedLastSample != null) {
								var sample = this._videoStashedLastSample;
								this._videoStashedLastSample = null;
								samples.unshift(sample);
								mdatBytes += sample.length;
							}
							if (lastSample != null) this._videoStashedLastSample = lastSample;
							var firstSampleOriginalDts = samples[0].dts - this._dtsBase;
							if (this._videoNextDts) dtsCorrection = firstSampleOriginalDts - this._videoNextDts;
							else if (this._videoSegmentInfoList.isEmpty()) dtsCorrection = 0;
							else {
								var lastSample_2 = this._videoSegmentInfoList.getLastSampleBefore(firstSampleOriginalDts);
								if (lastSample_2 != null) {
									var distance = firstSampleOriginalDts - (lastSample_2.originalDts + lastSample_2.duration);
									if (distance <= 3) distance = 0;
									dtsCorrection = firstSampleOriginalDts - (lastSample_2.dts + lastSample_2.duration + distance);
								} else dtsCorrection = 0;
							}
							var info = new _core_media_segment_info_js__WEBPACK_IMPORTED_MODULE_4__.MediaSegmentInfo();
							var mp4Samples = [];
							for (var i = 0; i < samples.length; i++) {
								var sample = samples[i];
								var originalDts = sample.dts - this._dtsBase;
								var isKeyframe = sample.isKeyframe;
								var dts = originalDts - dtsCorrection;
								var cts = sample.cts;
								var pts = dts + cts;
								if (firstDts === -1) {
									firstDts = dts;
									firstPts = pts;
								}
								var sampleDuration = 0;
								if (i !== samples.length - 1) {
									var nextDts = samples[i + 1].dts - this._dtsBase - dtsCorrection;
									sampleDuration = nextDts - dts;
								} else if (lastSample != null) {
									var nextDts = lastSample.dts - this._dtsBase - dtsCorrection;
									sampleDuration = nextDts - dts;
								} else if (mp4Samples.length >= 1) sampleDuration = mp4Samples[mp4Samples.length - 1].duration;
								else sampleDuration = Math.floor(this._videoMeta.refSampleDuration);
								if (isKeyframe) {
									var syncPoint = new _core_media_segment_info_js__WEBPACK_IMPORTED_MODULE_4__.SampleInfo(dts, pts, sampleDuration, sample.dts, true);
									syncPoint.fileposition = sample.fileposition;
									info.appendSyncPoint(syncPoint);
								}
								mp4Samples.push({
									dts,
									pts,
									cts,
									units: sample.units,
									size: sample.length,
									isKeyframe,
									duration: sampleDuration,
									originalDts,
									flags: {
										isLeading: 0,
										dependsOn: isKeyframe ? 2 : 1,
										isDependedOn: isKeyframe ? 1 : 0,
										hasRedundancy: 0,
										isNonSync: isKeyframe ? 0 : 1
									}
								});
							}
							mdatbox = new Uint8Array(mdatBytes);
							mdatbox[0] = mdatBytes >>> 24 & 255;
							mdatbox[1] = mdatBytes >>> 16 & 255;
							mdatbox[2] = mdatBytes >>> 8 & 255;
							mdatbox[3] = mdatBytes & 255;
							mdatbox.set(_mp4_generator_js__WEBPACK_IMPORTED_MODULE_1__.default.types.mdat, 4);
							for (var i = 0; i < mp4Samples.length; i++) {
								var units = mp4Samples[i].units;
								while (units.length) {
									var data = units.shift().data;
									mdatbox.set(data, offset);
									offset += data.byteLength;
								}
							}
							var latest = mp4Samples[mp4Samples.length - 1];
							lastDts = latest.dts + latest.duration;
							lastPts = latest.pts + latest.duration;
							this._videoNextDts = lastDts;
							info.beginDts = firstDts;
							info.endDts = lastDts;
							info.beginPts = firstPts;
							info.endPts = lastPts;
							info.originalBeginDts = mp4Samples[0].originalDts;
							info.originalEndDts = latest.originalDts + latest.duration;
							info.firstSample = new _core_media_segment_info_js__WEBPACK_IMPORTED_MODULE_4__.SampleInfo(mp4Samples[0].dts, mp4Samples[0].pts, mp4Samples[0].duration, mp4Samples[0].originalDts, mp4Samples[0].isKeyframe);
							info.lastSample = new _core_media_segment_info_js__WEBPACK_IMPORTED_MODULE_4__.SampleInfo(latest.dts, latest.pts, latest.duration, latest.originalDts, latest.isKeyframe);
							if (!this._isLive) this._videoSegmentInfoList.append(info);
							track.samples = mp4Samples;
							track.sequenceNumber++;
							if (this._forceFirstIDR) {
								var flags = mp4Samples[0].flags;
								flags.dependsOn = 2;
								flags.isNonSync = 0;
							}
							var moofbox = _mp4_generator_js__WEBPACK_IMPORTED_MODULE_1__.default.moof(track, firstDts);
							track.samples = [];
							track.length = 0;
							this._onMediaSegment("video", {
								type: "video",
								data: this._mergeBoxes(moofbox, mdatbox).buffer,
								sampleCount: mp4Samples.length,
								info
							});
						};
						MP4Remuxer.prototype._mergeBoxes = function(moof, mdat) {
							var result = new Uint8Array(moof.byteLength + mdat.byteLength);
							result.set(moof, 0);
							result.set(mdat, moof.byteLength);
							return result;
						};
						return MP4Remuxer;
					}();
				}),
				"./src/utils/browser.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!******************************!*\
					!*** ./src/utils/browser.js ***!
					\******************************/
					__webpack_require__.r(__webpack_exports__);
					var Browser = {};
					function detect() {
						var ua = self.navigator.userAgent.toLowerCase();
						var match = /(edge)\/([\w.]+)/.exec(ua) || /(opr)[\/]([\w.]+)/.exec(ua) || /(chrome)[ \/]([\w.]+)/.exec(ua) || /(iemobile)[\/]([\w.]+)/.exec(ua) || /(version)(applewebkit)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+).*(version)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("trident") >= 0 && /(rv)(?::| )([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 && /(firefox)[ \/]([\w.]+)/.exec(ua) || [];
						var platform_match = /(ipad)/.exec(ua) || /(ipod)/.exec(ua) || /(windows phone)/.exec(ua) || /(iphone)/.exec(ua) || /(kindle)/.exec(ua) || /(android)/.exec(ua) || /(windows)/.exec(ua) || /(mac)/.exec(ua) || /(linux)/.exec(ua) || /(cros)/.exec(ua) || [];
						var matched = {
							browser: match[5] || match[3] || match[1] || "",
							version: match[2] || match[4] || "0",
							majorVersion: match[4] || match[2] || "0",
							platform: platform_match[0] || ""
						};
						var browser = {};
						if (matched.browser) {
							browser[matched.browser] = true;
							var versionArray = matched.majorVersion.split(".");
							browser.version = {
								major: parseInt(matched.majorVersion, 10),
								string: matched.version
							};
							if (versionArray.length > 1) browser.version.minor = parseInt(versionArray[1], 10);
							if (versionArray.length > 2) browser.version.build = parseInt(versionArray[2], 10);
						}
						if (matched.platform) browser[matched.platform] = true;
						if (browser.chrome || browser.opr || browser.safari) browser.webkit = true;
						if (browser.rv || browser.iemobile) {
							if (browser.rv) delete browser.rv;
							var msie = "msie";
							matched.browser = msie;
							browser[msie] = true;
						}
						if (browser.edge) {
							delete browser.edge;
							var msedge = "msedge";
							matched.browser = msedge;
							browser[msedge] = true;
						}
						if (browser.opr) {
							var opera = "opera";
							matched.browser = opera;
							browser[opera] = true;
						}
						if (browser.safari && browser.android) {
							var android = "android";
							matched.browser = android;
							browser[android] = true;
						}
						browser.name = matched.browser;
						browser.platform = matched.platform;
						for (var key in Browser) if (Browser.hasOwnProperty(key)) delete Browser[key];
						Object.assign(Browser, browser);
					}
					detect();
					__webpack_exports__["default"] = Browser;
				}),
				"./src/utils/exception.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!********************************!*\
					!*** ./src/utils/exception.js ***!
					\********************************/
					__webpack_require__.r(__webpack_exports__);
					__webpack_require__.d(__webpack_exports__, {
						"RuntimeException": function() {
							return RuntimeException;
						},
						"IllegalStateException": function() {
							return IllegalStateException;
						},
						"InvalidArgumentException": function() {
							return InvalidArgumentException;
						},
						"NotImplementedException": function() {
							return NotImplementedException;
						}
					});
					var __extends = (function() {
						var extendStatics = function(d, b) {
							extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
								d.__proto__ = b;
							} || function(d, b) {
								for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
							};
							return extendStatics(d, b);
						};
						return function(d, b) {
							if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
							extendStatics(d, b);
							function __() {
								this.constructor = d;
							}
							d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
						};
					})();
					var RuntimeException = function() {
						function RuntimeException(message) {
							this._message = message;
						}
						Object.defineProperty(RuntimeException.prototype, "name", {
							get: function() {
								return "RuntimeException";
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(RuntimeException.prototype, "message", {
							get: function() {
								return this._message;
							},
							enumerable: false,
							configurable: true
						});
						RuntimeException.prototype.toString = function() {
							return this.name + ": " + this.message;
						};
						return RuntimeException;
					}();
					var IllegalStateException = function(_super) {
						__extends(IllegalStateException, _super);
						function IllegalStateException(message) {
							return _super.call(this, message) || this;
						}
						Object.defineProperty(IllegalStateException.prototype, "name", {
							get: function() {
								return "IllegalStateException";
							},
							enumerable: false,
							configurable: true
						});
						return IllegalStateException;
					}(RuntimeException);
					var InvalidArgumentException = function(_super) {
						__extends(InvalidArgumentException, _super);
						function InvalidArgumentException(message) {
							return _super.call(this, message) || this;
						}
						Object.defineProperty(InvalidArgumentException.prototype, "name", {
							get: function() {
								return "InvalidArgumentException";
							},
							enumerable: false,
							configurable: true
						});
						return InvalidArgumentException;
					}(RuntimeException);
					var NotImplementedException = function(_super) {
						__extends(NotImplementedException, _super);
						function NotImplementedException(message) {
							return _super.call(this, message) || this;
						}
						Object.defineProperty(NotImplementedException.prototype, "name", {
							get: function() {
								return "NotImplementedException";
							},
							enumerable: false,
							configurable: true
						});
						return NotImplementedException;
					}(RuntimeException);
				}),
				"./src/utils/logger.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!*****************************!*\
					!*** ./src/utils/logger.js ***!
					\*****************************/
					__webpack_require__.r(__webpack_exports__);
					var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! events */
						"./node_modules/events/events.js"
					);
					var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);
					var Log = function() {
						function Log() {}
						Log.e = function(tag, msg) {
							if (!tag || Log.FORCE_GLOBAL_TAG) tag = Log.GLOBAL_TAG;
							var str = "[" + tag + "] > " + msg;
							if (Log.ENABLE_CALLBACK) Log.emitter.emit("log", "error", str);
							if (!Log.ENABLE_ERROR) return;
							if (console.error) console.error(str);
							else if (console.warn) console.warn(str);
							else console.log(str);
						};
						Log.i = function(tag, msg) {
							if (!tag || Log.FORCE_GLOBAL_TAG) tag = Log.GLOBAL_TAG;
							var str = "[" + tag + "] > " + msg;
							if (Log.ENABLE_CALLBACK) Log.emitter.emit("log", "info", str);
							if (!Log.ENABLE_INFO) return;
							if (console.info) console.info(str);
							else console.log(str);
						};
						Log.w = function(tag, msg) {
							if (!tag || Log.FORCE_GLOBAL_TAG) tag = Log.GLOBAL_TAG;
							var str = "[" + tag + "] > " + msg;
							if (Log.ENABLE_CALLBACK) Log.emitter.emit("log", "warn", str);
							if (!Log.ENABLE_WARN) return;
							if (console.warn) console.warn(str);
							else console.log(str);
						};
						Log.d = function(tag, msg) {
							if (!tag || Log.FORCE_GLOBAL_TAG) tag = Log.GLOBAL_TAG;
							var str = "[" + tag + "] > " + msg;
							if (Log.ENABLE_CALLBACK) Log.emitter.emit("log", "debug", str);
							if (!Log.ENABLE_DEBUG) return;
							if (console.debug) console.debug(str);
							else console.log(str);
						};
						Log.v = function(tag, msg) {
							if (!tag || Log.FORCE_GLOBAL_TAG) tag = Log.GLOBAL_TAG;
							var str = "[" + tag + "] > " + msg;
							if (Log.ENABLE_CALLBACK) Log.emitter.emit("log", "verbose", str);
							if (!Log.ENABLE_VERBOSE) return;
							console.log(str);
						};
						return Log;
					}();
					Log.GLOBAL_TAG = "flv.js";
					Log.FORCE_GLOBAL_TAG = false;
					Log.ENABLE_ERROR = true;
					Log.ENABLE_INFO = true;
					Log.ENABLE_WARN = true;
					Log.ENABLE_DEBUG = true;
					Log.ENABLE_VERBOSE = true;
					Log.ENABLE_CALLBACK = false;
					Log.emitter = new (events__WEBPACK_IMPORTED_MODULE_0___default())();
					__webpack_exports__["default"] = Log;
				}),
				"./src/utils/logging-control.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!**************************************!*\
					!*** ./src/utils/logging-control.js ***!
					\**************************************/
					__webpack_require__.r(__webpack_exports__);
					var events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
						/*! events */
						"./node_modules/events/events.js"
					);
					var events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(events__WEBPACK_IMPORTED_MODULE_0__);
					var _logger_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
						/*! ./logger.js */
						"./src/utils/logger.js"
					);
					var LoggingControl = function() {
						function LoggingControl() {}
						Object.defineProperty(LoggingControl, "forceGlobalTag", {
							get: function() {
								return _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.FORCE_GLOBAL_TAG;
							},
							set: function(enable) {
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.FORCE_GLOBAL_TAG = enable;
								LoggingControl._notifyChange();
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(LoggingControl, "globalTag", {
							get: function() {
								return _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.GLOBAL_TAG;
							},
							set: function(tag) {
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.GLOBAL_TAG = tag;
								LoggingControl._notifyChange();
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(LoggingControl, "enableAll", {
							get: function() {
								return _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_VERBOSE && _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_DEBUG && _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_INFO && _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_WARN && _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_ERROR;
							},
							set: function(enable) {
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_VERBOSE = enable;
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_DEBUG = enable;
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_INFO = enable;
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_WARN = enable;
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_ERROR = enable;
								LoggingControl._notifyChange();
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(LoggingControl, "enableDebug", {
							get: function() {
								return _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_DEBUG;
							},
							set: function(enable) {
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_DEBUG = enable;
								LoggingControl._notifyChange();
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(LoggingControl, "enableVerbose", {
							get: function() {
								return _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_VERBOSE;
							},
							set: function(enable) {
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_VERBOSE = enable;
								LoggingControl._notifyChange();
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(LoggingControl, "enableInfo", {
							get: function() {
								return _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_INFO;
							},
							set: function(enable) {
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_INFO = enable;
								LoggingControl._notifyChange();
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(LoggingControl, "enableWarn", {
							get: function() {
								return _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_WARN;
							},
							set: function(enable) {
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_WARN = enable;
								LoggingControl._notifyChange();
							},
							enumerable: false,
							configurable: true
						});
						Object.defineProperty(LoggingControl, "enableError", {
							get: function() {
								return _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_ERROR;
							},
							set: function(enable) {
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_ERROR = enable;
								LoggingControl._notifyChange();
							},
							enumerable: false,
							configurable: true
						});
						LoggingControl.getConfig = function() {
							return {
								globalTag: _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.GLOBAL_TAG,
								forceGlobalTag: _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.FORCE_GLOBAL_TAG,
								enableVerbose: _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_VERBOSE,
								enableDebug: _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_DEBUG,
								enableInfo: _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_INFO,
								enableWarn: _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_WARN,
								enableError: _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_ERROR,
								enableCallback: _logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_CALLBACK
							};
						};
						LoggingControl.applyConfig = function(config) {
							_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.GLOBAL_TAG = config.globalTag;
							_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.FORCE_GLOBAL_TAG = config.forceGlobalTag;
							_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_VERBOSE = config.enableVerbose;
							_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_DEBUG = config.enableDebug;
							_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_INFO = config.enableInfo;
							_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_WARN = config.enableWarn;
							_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_ERROR = config.enableError;
							_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_CALLBACK = config.enableCallback;
						};
						LoggingControl._notifyChange = function() {
							var emitter = LoggingControl.emitter;
							if (emitter.listenerCount("change") > 0) {
								var config = LoggingControl.getConfig();
								emitter.emit("change", config);
							}
						};
						LoggingControl.registerListener = function(listener) {
							LoggingControl.emitter.addListener("change", listener);
						};
						LoggingControl.removeListener = function(listener) {
							LoggingControl.emitter.removeListener("change", listener);
						};
						LoggingControl.addLogListener = function(listener) {
							_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.emitter.addListener("log", listener);
							if (_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.emitter.listenerCount("log") > 0) {
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_CALLBACK = true;
								LoggingControl._notifyChange();
							}
						};
						LoggingControl.removeLogListener = function(listener) {
							_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.emitter.removeListener("log", listener);
							if (_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.emitter.listenerCount("log") === 0) {
								_logger_js__WEBPACK_IMPORTED_MODULE_1__.default.ENABLE_CALLBACK = false;
								LoggingControl._notifyChange();
							}
						};
						return LoggingControl;
					}();
					LoggingControl.emitter = new (events__WEBPACK_IMPORTED_MODULE_0___default())();
					__webpack_exports__["default"] = LoggingControl;
				}),
				"./src/utils/polyfill.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!*******************************!*\
					!*** ./src/utils/polyfill.js ***!
					\*******************************/
					__webpack_require__.r(__webpack_exports__);
					var Polyfill = function() {
						function Polyfill() {}
						Polyfill.install = function() {
							Object.setPrototypeOf = Object.setPrototypeOf || function(obj, proto) {
								obj.__proto__ = proto;
								return obj;
							};
							Object.assign = Object.assign || function(target) {
								if (target === void 0 || target === null) throw new TypeError("Cannot convert undefined or null to object");
								var output = Object(target);
								for (var i = 1; i < arguments.length; i++) {
									var source = arguments[i];
									if (source !== void 0 && source !== null) {
										for (var key in source) if (source.hasOwnProperty(key)) output[key] = source[key];
									}
								}
								return output;
							};
							if (typeof self.Promise !== "function") __webpack_require__(
								/*! es6-promise */
								"./node_modules/es6-promise/dist/es6-promise.js"
							).polyfill();
						};
						return Polyfill;
					}();
					Polyfill.install();
					__webpack_exports__["default"] = Polyfill;
				}),
				"./src/utils/utf8-conv.js": (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
					"use strict";
					/*!********************************!*\
					!*** ./src/utils/utf8-conv.js ***!
					\********************************/
					__webpack_require__.r(__webpack_exports__);
					function checkContinuation(uint8array, start, checkLength) {
						var array = uint8array;
						if (start + checkLength < array.length) {
							while (checkLength--) if ((array[++start] & 192) !== 128) return false;
							return true;
						} else return false;
					}
					function decodeUTF8(uint8array) {
						var out = [];
						var input = uint8array;
						var i = 0;
						var length = uint8array.length;
						while (i < length) {
							if (input[i] < 128) {
								out.push(String.fromCharCode(input[i]));
								++i;
								continue;
							} else if (input[i] < 192) {} else if (input[i] < 224) {
								if (checkContinuation(input, i, 1)) {
									var ucs4 = (input[i] & 31) << 6 | input[i + 1] & 63;
									if (ucs4 >= 128) {
										out.push(String.fromCharCode(ucs4 & 65535));
										i += 2;
										continue;
									}
								}
							} else if (input[i] < 240) {
								if (checkContinuation(input, i, 2)) {
									var ucs4 = (input[i] & 15) << 12 | (input[i + 1] & 63) << 6 | input[i + 2] & 63;
									if (ucs4 >= 2048 && (ucs4 & 63488) !== 55296) {
										out.push(String.fromCharCode(ucs4 & 65535));
										i += 3;
										continue;
									}
								}
							} else if (input[i] < 248) {
								if (checkContinuation(input, i, 3)) {
									var ucs4 = (input[i] & 7) << 18 | (input[i + 1] & 63) << 12 | (input[i + 2] & 63) << 6 | input[i + 3] & 63;
									if (ucs4 > 65536 && ucs4 < 1114112) {
										ucs4 -= 65536;
										out.push(String.fromCharCode(ucs4 >>> 10 | 55296));
										out.push(String.fromCharCode(ucs4 & 1023 | 56320));
										i += 4;
										continue;
									}
								}
							}
							out.push(String.fromCharCode(65533));
							++i;
						}
						return out.join("");
					}
					__webpack_exports__["default"] = decodeUTF8;
				})
			};
			var __webpack_module_cache__ = {};
			function __webpack_require__(moduleId) {
				var cachedModule = __webpack_module_cache__[moduleId];
				if (cachedModule !== void 0) return cachedModule.exports;
				var module$9 = __webpack_module_cache__[moduleId] = { exports: {} };
				__webpack_modules__[moduleId].call(module$9.exports, module$9, module$9.exports, __webpack_require__);
				return module$9.exports;
			}
			__webpack_require__.m = __webpack_modules__;
			(function() {
				__webpack_require__.n = function(module$10) {
					var getter = module$10 && module$10.__esModule ? function() {
						return module$10["default"];
					} : function() {
						return module$10;
					};
					__webpack_require__.d(getter, { a: getter });
					return getter;
				};
			})();
			(function() {
				__webpack_require__.d = function(exports$3, definition) {
					for (var key in definition) if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports$3, key)) Object.defineProperty(exports$3, key, {
						enumerable: true,
						get: definition[key]
					});
				};
			})();
			(function() {
				__webpack_require__.g = (function() {
					if (typeof globalThis === "object") return globalThis;
					try {
						return this || new Function("return this")();
					} catch (e) {
						if (typeof window === "object") return window;
					}
				})();
			})();
			(function() {
				__webpack_require__.o = function(obj, prop) {
					return Object.prototype.hasOwnProperty.call(obj, prop);
				};
			})();
			(function() {
				__webpack_require__.r = function(exports$4) {
					if (typeof Symbol !== "undefined" && Symbol.toStringTag) Object.defineProperty(exports$4, Symbol.toStringTag, { value: "Module" });
					Object.defineProperty(exports$4, "__esModule", { value: true });
				};
			})();
			return __webpack_require__("./src/index.js");
		})();
	});
}));
//#endregion
export default require_flv();
