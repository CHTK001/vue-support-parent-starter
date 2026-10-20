import { o as __toESM$1, t as __commonJSMin } from "./rolldown-runtime-CEgmsyvS.js";
import { Bo as createFileViewerViewStateChangeEmitter, Hs as unregisterFileViewerZoomProvider, Rs as registerFileViewerViewStateProvider, Vs as unregisterFileViewerViewStateProvider, _n as normalizeFileViewerUiDensity, ho as createFileViewerTranslator, ts as createFileViewerZoomChangeEmitter, ud as __vitePreload, wc as DEFAULT_RENDERER_DEFINITIONS, zo as createFileViewerViewStateChange, zs as registerFileViewerZoomProvider } from "./file-viewer-3d-ijA7B-Qe.js";
import { d as Panzoom } from "./file-viewer-drawing-DeKTjxNF.js";
//#region __vite-browser-external
var require___vite_browser_external = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {};
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/readable-stream-browser.js
var require_readable_stream_browser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require___vite_browser_external();
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/support.js
var require_support = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.base64 = true;
	exports.array = true;
	exports.string = true;
	exports.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
	exports.nodebuffer = typeof Buffer !== "undefined";
	exports.uint8array = typeof Uint8Array !== "undefined";
	if (typeof ArrayBuffer === "undefined") exports.blob = false;
	else {
		var buffer = /* @__PURE__ */ new ArrayBuffer(0);
		try {
			exports.blob = new Blob([buffer], { type: "application/zip" }).size === 0;
		} catch (e) {
			try {
				var builder = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
				builder.append(buffer);
				exports.blob = builder.getBlob("application/zip").size === 0;
			} catch (e) {
				exports.blob = false;
			}
		}
	}
	try {
		exports.nodestream = !!require_readable_stream_browser().Readable;
	} catch (e) {
		exports.nodestream = false;
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/base64.js
var require_base64 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utils = require_utils();
	var support = require_support();
	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	exports.encode = function(input) {
		var output = [];
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0, len = input.length, remainingBytes = len;
		var isArray = utils.getTypeOf(input) !== "string";
		while (i < input.length) {
			remainingBytes = len - i;
			if (!isArray) {
				chr1 = input.charCodeAt(i++);
				chr2 = i < len ? input.charCodeAt(i++) : 0;
				chr3 = i < len ? input.charCodeAt(i++) : 0;
			} else {
				chr1 = input[i++];
				chr2 = i < len ? input[i++] : 0;
				chr3 = i < len ? input[i++] : 0;
			}
			enc1 = chr1 >> 2;
			enc2 = (chr1 & 3) << 4 | chr2 >> 4;
			enc3 = remainingBytes > 1 ? (chr2 & 15) << 2 | chr3 >> 6 : 64;
			enc4 = remainingBytes > 2 ? chr3 & 63 : 64;
			output.push(_keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4));
		}
		return output.join("");
	};
	exports.decode = function(input) {
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0, resultIndex = 0;
		var dataUrlPrefix = "data:";
		if (input.substr(0, dataUrlPrefix.length) === dataUrlPrefix) throw new Error("Invalid base64 input, it looks like a data url.");
		input = input.replace(/[^A-Za-z0-9+/=]/g, "");
		var totalLength = input.length * 3 / 4;
		if (input.charAt(input.length - 1) === _keyStr.charAt(64)) totalLength--;
		if (input.charAt(input.length - 2) === _keyStr.charAt(64)) totalLength--;
		if (totalLength % 1 !== 0) throw new Error("Invalid base64 input, bad content length.");
		var output;
		if (support.uint8array) output = new Uint8Array(totalLength | 0);
		else output = new Array(totalLength | 0);
		while (i < input.length) {
			enc1 = _keyStr.indexOf(input.charAt(i++));
			enc2 = _keyStr.indexOf(input.charAt(i++));
			enc3 = _keyStr.indexOf(input.charAt(i++));
			enc4 = _keyStr.indexOf(input.charAt(i++));
			chr1 = enc1 << 2 | enc2 >> 4;
			chr2 = (enc2 & 15) << 4 | enc3 >> 2;
			chr3 = (enc3 & 3) << 6 | enc4;
			output[resultIndex++] = chr1;
			if (enc3 !== 64) output[resultIndex++] = chr2;
			if (enc4 !== 64) output[resultIndex++] = chr3;
		}
		return output;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/nodejsUtils.js
var require_nodejsUtils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		/**
		* True if this is running in Nodejs, will be undefined in a browser.
		* In a browser, browserify won't include this file and the whole module
		* will be resolved an empty object.
		*/
		isNode: typeof Buffer !== "undefined",
		/**
		* Create a new nodejs Buffer from an existing content.
		* @param {Object} data the data to pass to the constructor.
		* @param {String} encoding the encoding to use.
		* @return {Buffer} a new Buffer.
		*/
		newBufferFrom: function(data, encoding) {
			if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(data, encoding);
			else {
				if (typeof data === "number") throw new Error("The \"data\" argument must not be a number");
				return new Buffer(data, encoding);
			}
		},
		/**
		* Create a new nodejs Buffer with the specified size.
		* @param {Integer} size the size of the buffer.
		* @return {Buffer} a new Buffer.
		*/
		allocBuffer: function(size) {
			if (Buffer.alloc) return Buffer.alloc(size);
			else {
				var buf = new Buffer(size);
				buf.fill(0);
				return buf;
			}
		},
		/**
		* Find out if an object is a Buffer.
		* @param {Object} b the object to test.
		* @return {Boolean} true if the object is a Buffer, false otherwise.
		*/
		isBuffer: function(b) {
			return Buffer.isBuffer(b);
		},
		isStream: function(obj) {
			return obj && typeof obj.on === "function" && typeof obj.pause === "function" && typeof obj.resume === "function";
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/immediate@3.0.6/node_modules/immediate/lib/browser.js
var require_browser$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Mutation = global.MutationObserver || global.WebKitMutationObserver;
	var scheduleDrain;
	if (Mutation) {
		var called = 0;
		var observer = new Mutation(nextTick);
		var element = global.document.createTextNode("");
		observer.observe(element, { characterData: true });
		scheduleDrain = function() {
			element.data = called = ++called % 2;
		};
	} else if (!global.setImmediate && typeof global.MessageChannel !== "undefined") {
		var channel = new global.MessageChannel();
		channel.port1.onmessage = nextTick;
		scheduleDrain = function() {
			channel.port2.postMessage(0);
		};
	} else if ("document" in global && "onreadystatechange" in global.document.createElement("script")) scheduleDrain = function() {
		var scriptEl = global.document.createElement("script");
		scriptEl.onreadystatechange = function() {
			nextTick();
			scriptEl.onreadystatechange = null;
			scriptEl.parentNode.removeChild(scriptEl);
			scriptEl = null;
		};
		global.document.documentElement.appendChild(scriptEl);
	};
	else scheduleDrain = function() {
		setTimeout(nextTick, 0);
	};
	var draining;
	var queue = [];
	function nextTick() {
		draining = true;
		var i, oldQueue;
		var len = queue.length;
		while (len) {
			oldQueue = queue;
			queue = [];
			i = -1;
			while (++i < len) oldQueue[i]();
			len = queue.length;
		}
		draining = false;
	}
	module.exports = immediate;
	function immediate(task) {
		if (queue.push(task) === 1 && !draining) scheduleDrain();
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/lie@3.3.0/node_modules/lie/lib/browser.js
var require_browser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var immediate = require_browser$1();
	/* istanbul ignore next */
	function INTERNAL() {}
	var handlers = {};
	var REJECTED = ["REJECTED"];
	var FULFILLED = ["FULFILLED"];
	var PENDING = ["PENDING"];
	module.exports = Promise;
	function Promise(resolver) {
		if (typeof resolver !== "function") throw new TypeError("resolver must be a function");
		this.state = PENDING;
		this.queue = [];
		this.outcome = void 0;
		if (resolver !== INTERNAL) safelyResolveThenable(this, resolver);
	}
	Promise.prototype["finally"] = function(callback) {
		if (typeof callback !== "function") return this;
		var p = this.constructor;
		return this.then(resolve, reject);
		function resolve(value) {
			function yes() {
				return value;
			}
			return p.resolve(callback()).then(yes);
		}
		function reject(reason) {
			function no() {
				throw reason;
			}
			return p.resolve(callback()).then(no);
		}
	};
	Promise.prototype["catch"] = function(onRejected) {
		return this.then(null, onRejected);
	};
	Promise.prototype.then = function(onFulfilled, onRejected) {
		if (typeof onFulfilled !== "function" && this.state === FULFILLED || typeof onRejected !== "function" && this.state === REJECTED) return this;
		var promise = new this.constructor(INTERNAL);
		if (this.state !== PENDING) unwrap(promise, this.state === FULFILLED ? onFulfilled : onRejected, this.outcome);
		else this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
		return promise;
	};
	function QueueItem(promise, onFulfilled, onRejected) {
		this.promise = promise;
		if (typeof onFulfilled === "function") {
			this.onFulfilled = onFulfilled;
			this.callFulfilled = this.otherCallFulfilled;
		}
		if (typeof onRejected === "function") {
			this.onRejected = onRejected;
			this.callRejected = this.otherCallRejected;
		}
	}
	QueueItem.prototype.callFulfilled = function(value) {
		handlers.resolve(this.promise, value);
	};
	QueueItem.prototype.otherCallFulfilled = function(value) {
		unwrap(this.promise, this.onFulfilled, value);
	};
	QueueItem.prototype.callRejected = function(value) {
		handlers.reject(this.promise, value);
	};
	QueueItem.prototype.otherCallRejected = function(value) {
		unwrap(this.promise, this.onRejected, value);
	};
	function unwrap(promise, func, value) {
		immediate(function() {
			var returnValue;
			try {
				returnValue = func(value);
			} catch (e) {
				return handlers.reject(promise, e);
			}
			if (returnValue === promise) handlers.reject(promise, /* @__PURE__ */ new TypeError("Cannot resolve promise with itself"));
			else handlers.resolve(promise, returnValue);
		});
	}
	handlers.resolve = function(self, value) {
		var result = tryCatch(getThen, value);
		if (result.status === "error") return handlers.reject(self, result.value);
		var thenable = result.value;
		if (thenable) safelyResolveThenable(self, thenable);
		else {
			self.state = FULFILLED;
			self.outcome = value;
			var i = -1;
			var len = self.queue.length;
			while (++i < len) self.queue[i].callFulfilled(value);
		}
		return self;
	};
	handlers.reject = function(self, error) {
		self.state = REJECTED;
		self.outcome = error;
		var i = -1;
		var len = self.queue.length;
		while (++i < len) self.queue[i].callRejected(error);
		return self;
	};
	function getThen(obj) {
		var then = obj && obj.then;
		if (obj && (typeof obj === "object" || typeof obj === "function") && typeof then === "function") return function appyThen() {
			then.apply(obj, arguments);
		};
	}
	function safelyResolveThenable(self, thenable) {
		var called = false;
		function onError(value) {
			if (called) return;
			called = true;
			handlers.reject(self, value);
		}
		function onSuccess(value) {
			if (called) return;
			called = true;
			handlers.resolve(self, value);
		}
		function tryToUnwrap() {
			thenable(onSuccess, onError);
		}
		var result = tryCatch(tryToUnwrap);
		if (result.status === "error") onError(result.value);
	}
	function tryCatch(func, value) {
		var out = {};
		try {
			out.value = func(value);
			out.status = "success";
		} catch (e) {
			out.status = "error";
			out.value = e;
		}
		return out;
	}
	Promise.resolve = resolve;
	function resolve(value) {
		if (value instanceof this) return value;
		return handlers.resolve(new this(INTERNAL), value);
	}
	Promise.reject = reject;
	function reject(reason) {
		var promise = new this(INTERNAL);
		return handlers.reject(promise, reason);
	}
	Promise.all = all;
	function all(iterable) {
		var self = this;
		if (Object.prototype.toString.call(iterable) !== "[object Array]") return this.reject(/* @__PURE__ */ new TypeError("must be an array"));
		var len = iterable.length;
		var called = false;
		if (!len) return this.resolve([]);
		var values = new Array(len);
		var resolved = 0;
		var i = -1;
		var promise = new this(INTERNAL);
		while (++i < len) allResolver(iterable[i], i);
		return promise;
		function allResolver(value, i) {
			self.resolve(value).then(resolveFromAll, function(error) {
				if (!called) {
					called = true;
					handlers.reject(promise, error);
				}
			});
			function resolveFromAll(outValue) {
				values[i] = outValue;
				if (++resolved === len && !called) {
					called = true;
					handlers.resolve(promise, values);
				}
			}
		}
	}
	Promise.race = race;
	function race(iterable) {
		var self = this;
		if (Object.prototype.toString.call(iterable) !== "[object Array]") return this.reject(/* @__PURE__ */ new TypeError("must be an array"));
		var len = iterable.length;
		var called = false;
		if (!len) return this.resolve([]);
		var i = -1;
		var promise = new this(INTERNAL);
		while (++i < len) resolver(iterable[i]);
		return promise;
		function resolver(value) {
			self.resolve(value).then(function(response) {
				if (!called) {
					called = true;
					handlers.resolve(promise, response);
				}
			}, function(error) {
				if (!called) {
					called = true;
					handlers.reject(promise, error);
				}
			});
		}
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/external.js
var require_external = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var ES6Promise = null;
	if (typeof Promise !== "undefined") ES6Promise = Promise;
	else ES6Promise = require_browser();
	/**
	* Let the user use/change some implementations.
	*/
	module.exports = { Promise: ES6Promise };
}));
//#endregion
//#region ../../node_modules/.pnpm/setimmediate@1.0.5/node_modules/setimmediate/setImmediate.js
var require_setImmediate = /* @__PURE__ */ __commonJSMin((() => {
	(function(global, undefined) {
		"use strict";
		if (global.setImmediate) return;
		var nextHandle = 1;
		var tasksByHandle = {};
		var currentlyRunningATask = false;
		var doc = global.document;
		var registerImmediate;
		function setImmediate(callback) {
			if (typeof callback !== "function") callback = new Function("" + callback);
			var args = new Array(arguments.length - 1);
			for (var i = 0; i < args.length; i++) args[i] = arguments[i + 1];
			tasksByHandle[nextHandle] = {
				callback,
				args
			};
			registerImmediate(nextHandle);
			return nextHandle++;
		}
		function clearImmediate(handle) {
			delete tasksByHandle[handle];
		}
		function run(task) {
			var callback = task.callback;
			var args = task.args;
			switch (args.length) {
				case 0:
					callback();
					break;
				case 1:
					callback(args[0]);
					break;
				case 2:
					callback(args[0], args[1]);
					break;
				case 3:
					callback(args[0], args[1], args[2]);
					break;
				default: callback.apply(undefined, args);
			}
		}
		function runIfPresent(handle) {
			if (currentlyRunningATask) setTimeout(runIfPresent, 0, handle);
			else {
				var task = tasksByHandle[handle];
				if (task) {
					currentlyRunningATask = true;
					try {
						run(task);
					} finally {
						clearImmediate(handle);
						currentlyRunningATask = false;
					}
				}
			}
		}
		function installNextTickImplementation() {
			registerImmediate = function(handle) {
				process.nextTick(function() {
					runIfPresent(handle);
				});
			};
		}
		function canUsePostMessage() {
			if (global.postMessage && !global.importScripts) {
				var postMessageIsAsynchronous = true;
				var oldOnMessage = global.onmessage;
				global.onmessage = function() {
					postMessageIsAsynchronous = false;
				};
				global.postMessage("", "*");
				global.onmessage = oldOnMessage;
				return postMessageIsAsynchronous;
			}
		}
		function installPostMessageImplementation() {
			var messagePrefix = "setImmediate$" + Math.random() + "$";
			var onGlobalMessage = function(event) {
				if (event.source === global && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) runIfPresent(+event.data.slice(messagePrefix.length));
			};
			if (global.addEventListener) global.addEventListener("message", onGlobalMessage, false);
			else global.attachEvent("onmessage", onGlobalMessage);
			registerImmediate = function(handle) {
				global.postMessage(messagePrefix + handle, "*");
			};
		}
		function installMessageChannelImplementation() {
			var channel = new MessageChannel();
			channel.port1.onmessage = function(event) {
				var handle = event.data;
				runIfPresent(handle);
			};
			registerImmediate = function(handle) {
				channel.port2.postMessage(handle);
			};
		}
		function installReadyStateChangeImplementation() {
			var html = doc.documentElement;
			registerImmediate = function(handle) {
				var script = doc.createElement("script");
				script.onreadystatechange = function() {
					runIfPresent(handle);
					script.onreadystatechange = null;
					html.removeChild(script);
					script = null;
				};
				html.appendChild(script);
			};
		}
		function installSetTimeoutImplementation() {
			registerImmediate = function(handle) {
				setTimeout(runIfPresent, 0, handle);
			};
		}
		var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
		attachTo = attachTo && attachTo.setTimeout ? attachTo : global;
		if ({}.toString.call(global.process) === "[object process]") installNextTickImplementation();
		else if (canUsePostMessage()) installPostMessageImplementation();
		else if (global.MessageChannel) installMessageChannelImplementation();
		else if (doc && "onreadystatechange" in doc.createElement("script")) installReadyStateChangeImplementation();
		else installSetTimeoutImplementation();
		attachTo.setImmediate = setImmediate;
		attachTo.clearImmediate = clearImmediate;
	})(typeof self === "undefined" ? typeof global === "undefined" ? void 0 : global : self);
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	var support = require_support();
	var base64 = require_base64();
	var nodejsUtils = require_nodejsUtils();
	var external = require_external();
	require_setImmediate();
	/**
	* Convert a string that pass as a "binary string": it should represent a byte
	* array but may have > 255 char codes. Be sure to take only the first byte
	* and returns the byte array.
	* @param {String} str the string to transform.
	* @return {Array|Uint8Array} the string in a binary format.
	*/
	function string2binary(str) {
		var result = null;
		if (support.uint8array) result = new Uint8Array(str.length);
		else result = new Array(str.length);
		return stringToArrayLike(str, result);
	}
	/**
	* Create a new blob with the given content and the given type.
	* @param {String|ArrayBuffer} part the content to put in the blob. DO NOT use
	* an Uint8Array because the stock browser of android 4 won't accept it (it
	* will be silently converted to a string, "[object Uint8Array]").
	*
	* Use only ONE part to build the blob to avoid a memory leak in IE11 / Edge:
	* when a large amount of Array is used to create the Blob, the amount of
	* memory consumed is nearly 100 times the original data amount.
	*
	* @param {String} type the mime type of the blob.
	* @return {Blob} the created blob.
	*/
	exports.newBlob = function(part, type) {
		exports.checkSupport("blob");
		try {
			return new Blob([part], { type });
		} catch (e) {
			try {
				var builder = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
				builder.append(part);
				return builder.getBlob(type);
			} catch (e) {
				throw new Error("Bug : can't construct the Blob.");
			}
		}
	};
	/**
	* The identity function.
	* @param {Object} input the input.
	* @return {Object} the same input.
	*/
	function identity(input) {
		return input;
	}
	/**
	* Fill in an array with a string.
	* @param {String} str the string to use.
	* @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to fill in (will be mutated).
	* @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated array.
	*/
	function stringToArrayLike(str, array) {
		for (var i = 0; i < str.length; ++i) array[i] = str.charCodeAt(i) & 255;
		return array;
	}
	/**
	* An helper for the function arrayLikeToString.
	* This contains static information and functions that
	* can be optimized by the browser JIT compiler.
	*/
	var arrayToStringHelper = {
		/**
		* Transform an array of int into a string, chunk by chunk.
		* See the performances notes on arrayLikeToString.
		* @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
		* @param {String} type the type of the array.
		* @param {Integer} chunk the chunk size.
		* @return {String} the resulting string.
		* @throws Error if the chunk is too big for the stack.
		*/
		stringifyByChunk: function(array, type, chunk) {
			var result = [], k = 0, len = array.length;
			if (len <= chunk) return String.fromCharCode.apply(null, array);
			while (k < len) {
				if (type === "array" || type === "nodebuffer") result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
				else result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
				k += chunk;
			}
			return result.join("");
		},
		/**
		* Call String.fromCharCode on every item in the array.
		* This is the naive implementation, which generate A LOT of intermediate string.
		* This should be used when everything else fail.
		* @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
		* @return {String} the result.
		*/
		stringifyByChar: function(array) {
			var resultStr = "";
			for (var i = 0; i < array.length; i++) resultStr += String.fromCharCode(array[i]);
			return resultStr;
		},
		applyCanBeUsed: {
			/**
			* true if the browser accepts to use String.fromCharCode on Uint8Array
			*/
			uint8array: (function() {
				try {
					return support.uint8array && String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1)).length === 1;
				} catch (e) {
					return false;
				}
			})(),
			/**
			* true if the browser accepts to use String.fromCharCode on nodejs Buffer.
			*/
			nodebuffer: (function() {
				try {
					return support.nodebuffer && String.fromCharCode.apply(null, nodejsUtils.allocBuffer(1)).length === 1;
				} catch (e) {
					return false;
				}
			})()
		}
	};
	/**
	* Transform an array-like object to a string.
	* @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
	* @return {String} the result.
	*/
	function arrayLikeToString(array) {
		var chunk = 65536, type = exports.getTypeOf(array), canUseApply = true;
		if (type === "uint8array") canUseApply = arrayToStringHelper.applyCanBeUsed.uint8array;
		else if (type === "nodebuffer") canUseApply = arrayToStringHelper.applyCanBeUsed.nodebuffer;
		if (canUseApply) while (chunk > 1) try {
			return arrayToStringHelper.stringifyByChunk(array, type, chunk);
		} catch (e) {
			chunk = Math.floor(chunk / 2);
		}
		return arrayToStringHelper.stringifyByChar(array);
	}
	exports.applyFromCharCode = arrayLikeToString;
	/**
	* Copy the data from an array-like to an other array-like.
	* @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayFrom the origin array.
	* @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayTo the destination array which will be mutated.
	* @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated destination array.
	*/
	function arrayLikeToArrayLike(arrayFrom, arrayTo) {
		for (var i = 0; i < arrayFrom.length; i++) arrayTo[i] = arrayFrom[i];
		return arrayTo;
	}
	var transform = {};
	transform["string"] = {
		"string": identity,
		"array": function(input) {
			return stringToArrayLike(input, new Array(input.length));
		},
		"arraybuffer": function(input) {
			return transform["string"]["uint8array"](input).buffer;
		},
		"uint8array": function(input) {
			return stringToArrayLike(input, new Uint8Array(input.length));
		},
		"nodebuffer": function(input) {
			return stringToArrayLike(input, nodejsUtils.allocBuffer(input.length));
		}
	};
	transform["array"] = {
		"string": arrayLikeToString,
		"array": identity,
		"arraybuffer": function(input) {
			return new Uint8Array(input).buffer;
		},
		"uint8array": function(input) {
			return new Uint8Array(input);
		},
		"nodebuffer": function(input) {
			return nodejsUtils.newBufferFrom(input);
		}
	};
	transform["arraybuffer"] = {
		"string": function(input) {
			return arrayLikeToString(new Uint8Array(input));
		},
		"array": function(input) {
			return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
		},
		"arraybuffer": identity,
		"uint8array": function(input) {
			return new Uint8Array(input);
		},
		"nodebuffer": function(input) {
			return nodejsUtils.newBufferFrom(new Uint8Array(input));
		}
	};
	transform["uint8array"] = {
		"string": arrayLikeToString,
		"array": function(input) {
			return arrayLikeToArrayLike(input, new Array(input.length));
		},
		"arraybuffer": function(input) {
			return input.buffer;
		},
		"uint8array": identity,
		"nodebuffer": function(input) {
			return nodejsUtils.newBufferFrom(input);
		}
	};
	transform["nodebuffer"] = {
		"string": arrayLikeToString,
		"array": function(input) {
			return arrayLikeToArrayLike(input, new Array(input.length));
		},
		"arraybuffer": function(input) {
			return transform["nodebuffer"]["uint8array"](input).buffer;
		},
		"uint8array": function(input) {
			return arrayLikeToArrayLike(input, new Uint8Array(input.length));
		},
		"nodebuffer": identity
	};
	/**
	* Transform an input into any type.
	* The supported output type are : string, array, uint8array, arraybuffer, nodebuffer.
	* If no output type is specified, the unmodified input will be returned.
	* @param {String} outputType the output type.
	* @param {String|Array|ArrayBuffer|Uint8Array|Buffer} input the input to convert.
	* @throws {Error} an Error if the browser doesn't support the requested output type.
	*/
	exports.transformTo = function(outputType, input) {
		if (!input) input = "";
		if (!outputType) return input;
		exports.checkSupport(outputType);
		return transform[exports.getTypeOf(input)][outputType](input);
	};
	/**
	* Resolve all relative path components, "." and "..", in a path. If these relative components
	* traverse above the root then the resulting path will only contain the final path component.
	*
	* All empty components, e.g. "//", are removed.
	* @param {string} path A path with / or \ separators
	* @returns {string} The path with all relative path components resolved.
	*/
	exports.resolve = function(path) {
		var parts = path.split("/");
		var result = [];
		for (var index = 0; index < parts.length; index++) {
			var part = parts[index];
			if (part === "." || part === "" && index !== 0 && index !== parts.length - 1) continue;
			else if (part === "..") result.pop();
			else result.push(part);
		}
		return result.join("/");
	};
	/**
	* Return the type of the input.
	* The type will be in a format valid for JSZip.utils.transformTo : string, array, uint8array, arraybuffer.
	* @param {Object} input the input to identify.
	* @return {String} the (lowercase) type of the input.
	*/
	exports.getTypeOf = function(input) {
		if (typeof input === "string") return "string";
		var proto = Object.prototype.toString.call(input);
		if (proto === "[object Array]") return "array";
		if (support.nodebuffer && nodejsUtils.isBuffer(input)) return "nodebuffer";
		if (support.uint8array && proto === "[object Uint8Array]") return "uint8array";
		if (support.arraybuffer && proto === "[object ArrayBuffer]") return "arraybuffer";
	};
	/**
	* Throw an exception if the type is not supported.
	* @param {String} type the type to check.
	* @throws {Error} an Error if the browser doesn't support the requested type.
	*/
	exports.checkSupport = function(type) {
		if (!support[type.toLowerCase()]) throw new Error(type + " is not supported by this platform");
	};
	exports.MAX_VALUE_16BITS = 65535;
	exports.MAX_VALUE_32BITS = -1;
	/**
	* Prettify a string read as binary.
	* @param {string} str the string to prettify.
	* @return {string} a pretty string.
	*/
	exports.pretty = function(str) {
		var res = "", code, i;
		for (i = 0; i < (str || "").length; i++) {
			code = str.charCodeAt(i);
			res += "\\x" + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
		}
		return res;
	};
	/**
	* Defer the call of a function.
	* @param {Function} callback the function to call asynchronously.
	* @param {Array} args the arguments to give to the callback.
	*/
	exports.delay = function(callback, args, self) {
		setImmediate(function() {
			callback.apply(self || null, args || []);
		});
	};
	/**
	* Extends a prototype with an other, without calling a constructor with
	* side effects. Inspired by nodejs' `utils.inherits`
	* @param {Function} ctor the constructor to augment
	* @param {Function} superCtor the parent constructor to use
	*/
	exports.inherits = function(ctor, superCtor) {
		var Obj = function() {};
		Obj.prototype = superCtor.prototype;
		ctor.prototype = new Obj();
	};
	/**
	* Merge the objects passed as parameters into a new one.
	* @private
	* @param {...Object} var_args All objects to merge.
	* @return {Object} a new object with the data of the others.
	*/
	exports.extend = function() {
		var result = {}, i, attr;
		for (i = 0; i < arguments.length; i++) for (attr in arguments[i]) if (Object.prototype.hasOwnProperty.call(arguments[i], attr) && typeof result[attr] === "undefined") result[attr] = arguments[i][attr];
		return result;
	};
	/**
	* Transform arbitrary content into a Promise.
	* @param {String} name a name for the content being processed.
	* @param {Object} inputData the content to process.
	* @param {Boolean} isBinary true if the content is not an unicode string
	* @param {Boolean} isOptimizedBinaryString true if the string content only has one byte per character.
	* @param {Boolean} isBase64 true if the string content is encoded with base64.
	* @return {Promise} a promise in a format usable by JSZip.
	*/
	exports.prepareContent = function(name, inputData, isBinary, isOptimizedBinaryString, isBase64) {
		return external.Promise.resolve(inputData).then(function(data) {
			if (support.blob && (data instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(data)) !== -1)) if (typeof Blob.prototype.arrayBuffer !== "undefined") return data.arrayBuffer();
			else if (typeof FileReader !== "undefined") return new external.Promise(function(resolve, reject) {
				var reader = new FileReader();
				reader.onload = function(e) {
					resolve(e.target.result);
				};
				reader.onerror = function(e) {
					reject(e.target.error);
				};
				reader.readAsArrayBuffer(data);
			});
			else return external.Promise.reject(/* @__PURE__ */ new Error(name + " is a Blob, but we have no way of reading it."));
			return data;
		}).then(function(data) {
			var dataType = exports.getTypeOf(data);
			if (!dataType) return external.Promise.reject(/* @__PURE__ */ new Error("Can't read the data of '" + name + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
			if (dataType === "arraybuffer") data = exports.transformTo("uint8array", data);
			else if (dataType === "string") {
				if (isBase64) data = base64.decode(data);
				else if (isBinary) {
					if (isOptimizedBinaryString !== true) data = string2binary(data);
				}
			}
			return data;
		});
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/stream/GenericWorker.js
var require_GenericWorker = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* A worker that does nothing but passing chunks to the next one. This is like
	* a nodejs stream but with some differences. On the good side :
	* - it works on IE 6-9 without any issue / polyfill
	* - it weights less than the full dependencies bundled with browserify
	* - it forwards errors (no need to declare an error handler EVERYWHERE)
	*
	* A chunk is an object with 2 attributes : `meta` and `data`. The former is an
	* object containing anything (`percent` for example), see each worker for more
	* details. The latter is the real data (String, Uint8Array, etc).
	*
	* @constructor
	* @param {String} name the name of the stream (mainly used for debugging purposes)
	*/
	function GenericWorker(name) {
		this.name = name || "default";
		this.streamInfo = {};
		this.generatedError = null;
		this.extraStreamInfo = {};
		this.isPaused = true;
		this.isFinished = false;
		this.isLocked = false;
		this._listeners = {
			"data": [],
			"end": [],
			"error": []
		};
		this.previous = null;
	}
	GenericWorker.prototype = {
		/**
		* Push a chunk to the next workers.
		* @param {Object} chunk the chunk to push
		*/
		push: function(chunk) {
			this.emit("data", chunk);
		},
		/**
		* End the stream.
		* @return {Boolean} true if this call ended the worker, false otherwise.
		*/
		end: function() {
			if (this.isFinished) return false;
			this.flush();
			try {
				this.emit("end");
				this.cleanUp();
				this.isFinished = true;
			} catch (e) {
				this.emit("error", e);
			}
			return true;
		},
		/**
		* End the stream with an error.
		* @param {Error} e the error which caused the premature end.
		* @return {Boolean} true if this call ended the worker with an error, false otherwise.
		*/
		error: function(e) {
			if (this.isFinished) return false;
			if (this.isPaused) this.generatedError = e;
			else {
				this.isFinished = true;
				this.emit("error", e);
				if (this.previous) this.previous.error(e);
				this.cleanUp();
			}
			return true;
		},
		/**
		* Add a callback on an event.
		* @param {String} name the name of the event (data, end, error)
		* @param {Function} listener the function to call when the event is triggered
		* @return {GenericWorker} the current object for chainability
		*/
		on: function(name, listener) {
			this._listeners[name].push(listener);
			return this;
		},
		/**
		* Clean any references when a worker is ending.
		*/
		cleanUp: function() {
			this.streamInfo = this.generatedError = this.extraStreamInfo = null;
			this._listeners = [];
		},
		/**
		* Trigger an event. This will call registered callback with the provided arg.
		* @param {String} name the name of the event (data, end, error)
		* @param {Object} arg the argument to call the callback with.
		*/
		emit: function(name, arg) {
			if (this._listeners[name]) for (var i = 0; i < this._listeners[name].length; i++) this._listeners[name][i].call(this, arg);
		},
		/**
		* Chain a worker with an other.
		* @param {Worker} next the worker receiving events from the current one.
		* @return {worker} the next worker for chainability
		*/
		pipe: function(next) {
			return next.registerPrevious(this);
		},
		/**
		* Same as `pipe` in the other direction.
		* Using an API with `pipe(next)` is very easy.
		* Implementing the API with the point of view of the next one registering
		* a source is easier, see the ZipFileWorker.
		* @param {Worker} previous the previous worker, sending events to this one
		* @return {Worker} the current worker for chainability
		*/
		registerPrevious: function(previous) {
			if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
			this.streamInfo = previous.streamInfo;
			this.mergeStreamInfo();
			this.previous = previous;
			var self = this;
			previous.on("data", function(chunk) {
				self.processChunk(chunk);
			});
			previous.on("end", function() {
				self.end();
			});
			previous.on("error", function(e) {
				self.error(e);
			});
			return this;
		},
		/**
		* Pause the stream so it doesn't send events anymore.
		* @return {Boolean} true if this call paused the worker, false otherwise.
		*/
		pause: function() {
			if (this.isPaused || this.isFinished) return false;
			this.isPaused = true;
			if (this.previous) this.previous.pause();
			return true;
		},
		/**
		* Resume a paused stream.
		* @return {Boolean} true if this call resumed the worker, false otherwise.
		*/
		resume: function() {
			if (!this.isPaused || this.isFinished) return false;
			this.isPaused = false;
			var withError = false;
			if (this.generatedError) {
				this.error(this.generatedError);
				withError = true;
			}
			if (this.previous) this.previous.resume();
			return !withError;
		},
		/**
		* Flush any remaining bytes as the stream is ending.
		*/
		flush: function() {},
		/**
		* Process a chunk. This is usually the method overridden.
		* @param {Object} chunk the chunk to process.
		*/
		processChunk: function(chunk) {
			this.push(chunk);
		},
		/**
		* Add a key/value to be added in the workers chain streamInfo once activated.
		* @param {String} key the key to use
		* @param {Object} value the associated value
		* @return {Worker} the current worker for chainability
		*/
		withStreamInfo: function(key, value) {
			this.extraStreamInfo[key] = value;
			this.mergeStreamInfo();
			return this;
		},
		/**
		* Merge this worker's streamInfo into the chain's streamInfo.
		*/
		mergeStreamInfo: function() {
			for (var key in this.extraStreamInfo) {
				if (!Object.prototype.hasOwnProperty.call(this.extraStreamInfo, key)) continue;
				this.streamInfo[key] = this.extraStreamInfo[key];
			}
		},
		/**
		* Lock the stream to prevent further updates on the workers chain.
		* After calling this method, all calls to pipe will fail.
		*/
		lock: function() {
			if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
			this.isLocked = true;
			if (this.previous) this.previous.lock();
		},
		/**
		*
		* Pretty print the workers chain.
		*/
		toString: function() {
			var me = "Worker " + this.name;
			if (this.previous) return this.previous + " -> " + me;
			else return me;
		}
	};
	module.exports = GenericWorker;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/utf8.js
var require_utf8 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utils = require_utils();
	var support = require_support();
	var nodejsUtils = require_nodejsUtils();
	var GenericWorker = require_GenericWorker();
	/**
	* The following functions come from pako, from pako/lib/utils/strings
	* released under the MIT license, see pako https://github.com/nodeca/pako/
	*/
	var _utf8len = new Array(256);
	for (var i = 0; i < 256; i++) _utf8len[i] = i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1;
	_utf8len[254] = _utf8len[254] = 1;
	var string2buf = function(str) {
		var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
		for (m_pos = 0; m_pos < str_len; m_pos++) {
			c = str.charCodeAt(m_pos);
			if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
				c2 = str.charCodeAt(m_pos + 1);
				if ((c2 & 64512) === 56320) {
					c = 65536 + (c - 55296 << 10) + (c2 - 56320);
					m_pos++;
				}
			}
			buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
		}
		if (support.uint8array) buf = new Uint8Array(buf_len);
		else buf = new Array(buf_len);
		for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
			c = str.charCodeAt(m_pos);
			if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
				c2 = str.charCodeAt(m_pos + 1);
				if ((c2 & 64512) === 56320) {
					c = 65536 + (c - 55296 << 10) + (c2 - 56320);
					m_pos++;
				}
			}
			if (c < 128) buf[i++] = c;
			else if (c < 2048) {
				buf[i++] = 192 | c >>> 6;
				buf[i++] = 128 | c & 63;
			} else if (c < 65536) {
				buf[i++] = 224 | c >>> 12;
				buf[i++] = 128 | c >>> 6 & 63;
				buf[i++] = 128 | c & 63;
			} else {
				buf[i++] = 240 | c >>> 18;
				buf[i++] = 128 | c >>> 12 & 63;
				buf[i++] = 128 | c >>> 6 & 63;
				buf[i++] = 128 | c & 63;
			}
		}
		return buf;
	};
	var utf8border = function(buf, max) {
		var pos;
		max = max || buf.length;
		if (max > buf.length) max = buf.length;
		pos = max - 1;
		while (pos >= 0 && (buf[pos] & 192) === 128) pos--;
		if (pos < 0) return max;
		if (pos === 0) return max;
		return pos + _utf8len[buf[pos]] > max ? pos : max;
	};
	var buf2string = function(buf) {
		var i, out, c, c_len;
		var len = buf.length;
		var utf16buf = new Array(len * 2);
		for (out = 0, i = 0; i < len;) {
			c = buf[i++];
			if (c < 128) {
				utf16buf[out++] = c;
				continue;
			}
			c_len = _utf8len[c];
			if (c_len > 4) {
				utf16buf[out++] = 65533;
				i += c_len - 1;
				continue;
			}
			c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
			while (c_len > 1 && i < len) {
				c = c << 6 | buf[i++] & 63;
				c_len--;
			}
			if (c_len > 1) {
				utf16buf[out++] = 65533;
				continue;
			}
			if (c < 65536) utf16buf[out++] = c;
			else {
				c -= 65536;
				utf16buf[out++] = 55296 | c >> 10 & 1023;
				utf16buf[out++] = 56320 | c & 1023;
			}
		}
		if (utf16buf.length !== out) if (utf16buf.subarray) utf16buf = utf16buf.subarray(0, out);
		else utf16buf.length = out;
		return utils.applyFromCharCode(utf16buf);
	};
	/**
	* Transform a javascript string into an array (typed if possible) of bytes,
	* UTF-8 encoded.
	* @param {String} str the string to encode
	* @return {Array|Uint8Array|Buffer} the UTF-8 encoded string.
	*/
	exports.utf8encode = function utf8encode(str) {
		if (support.nodebuffer) return nodejsUtils.newBufferFrom(str, "utf-8");
		return string2buf(str);
	};
	/**
	* Transform a bytes array (or a representation) representing an UTF-8 encoded
	* string into a javascript string.
	* @param {Array|Uint8Array|Buffer} buf the data de decode
	* @return {String} the decoded string.
	*/
	exports.utf8decode = function utf8decode(buf) {
		if (support.nodebuffer) return utils.transformTo("nodebuffer", buf).toString("utf-8");
		buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);
		return buf2string(buf);
	};
	/**
	* A worker to decode utf8 encoded binary chunks into string chunks.
	* @constructor
	*/
	function Utf8DecodeWorker() {
		GenericWorker.call(this, "utf-8 decode");
		this.leftOver = null;
	}
	utils.inherits(Utf8DecodeWorker, GenericWorker);
	/**
	* @see GenericWorker.processChunk
	*/
	Utf8DecodeWorker.prototype.processChunk = function(chunk) {
		var data = utils.transformTo(support.uint8array ? "uint8array" : "array", chunk.data);
		if (this.leftOver && this.leftOver.length) {
			if (support.uint8array) {
				var previousData = data;
				data = new Uint8Array(previousData.length + this.leftOver.length);
				data.set(this.leftOver, 0);
				data.set(previousData, this.leftOver.length);
			} else data = this.leftOver.concat(data);
			this.leftOver = null;
		}
		var nextBoundary = utf8border(data);
		var usableData = data;
		if (nextBoundary !== data.length) if (support.uint8array) {
			usableData = data.subarray(0, nextBoundary);
			this.leftOver = data.subarray(nextBoundary, data.length);
		} else {
			usableData = data.slice(0, nextBoundary);
			this.leftOver = data.slice(nextBoundary, data.length);
		}
		this.push({
			data: exports.utf8decode(usableData),
			meta: chunk.meta
		});
	};
	/**
	* @see GenericWorker.flush
	*/
	Utf8DecodeWorker.prototype.flush = function() {
		if (this.leftOver && this.leftOver.length) {
			this.push({
				data: exports.utf8decode(this.leftOver),
				meta: {}
			});
			this.leftOver = null;
		}
	};
	exports.Utf8DecodeWorker = Utf8DecodeWorker;
	/**
	* A worker to endcode string chunks into utf8 encoded binary chunks.
	* @constructor
	*/
	function Utf8EncodeWorker() {
		GenericWorker.call(this, "utf-8 encode");
	}
	utils.inherits(Utf8EncodeWorker, GenericWorker);
	/**
	* @see GenericWorker.processChunk
	*/
	Utf8EncodeWorker.prototype.processChunk = function(chunk) {
		this.push({
			data: exports.utf8encode(chunk.data),
			meta: chunk.meta
		});
	};
	exports.Utf8EncodeWorker = Utf8EncodeWorker;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/stream/ConvertWorker.js
var require_ConvertWorker = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var GenericWorker = require_GenericWorker();
	var utils = require_utils();
	/**
	* A worker which convert chunks to a specified type.
	* @constructor
	* @param {String} destType the destination type.
	*/
	function ConvertWorker(destType) {
		GenericWorker.call(this, "ConvertWorker to " + destType);
		this.destType = destType;
	}
	utils.inherits(ConvertWorker, GenericWorker);
	/**
	* @see GenericWorker.processChunk
	*/
	ConvertWorker.prototype.processChunk = function(chunk) {
		this.push({
			data: utils.transformTo(this.destType, chunk.data),
			meta: chunk.meta
		});
	};
	module.exports = ConvertWorker;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/nodejs/NodejsStreamOutputAdapter.js
var require_NodejsStreamOutputAdapter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Readable = require_readable_stream_browser().Readable;
	require_utils().inherits(NodejsStreamOutputAdapter, Readable);
	/**
	* A nodejs stream using a worker as source.
	* @see the SourceWrapper in http://nodejs.org/api/stream.html
	* @constructor
	* @param {StreamHelper} helper the helper wrapping the worker
	* @param {Object} options the nodejs stream options
	* @param {Function} updateCb the update callback.
	*/
	function NodejsStreamOutputAdapter(helper, options, updateCb) {
		Readable.call(this, options);
		this._helper = helper;
		var self = this;
		helper.on("data", function(data, meta) {
			if (!self.push(data)) self._helper.pause();
			if (updateCb) updateCb(meta);
		}).on("error", function(e) {
			self.emit("error", e);
		}).on("end", function() {
			self.push(null);
		});
	}
	NodejsStreamOutputAdapter.prototype._read = function() {
		this._helper.resume();
	};
	module.exports = NodejsStreamOutputAdapter;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/stream/StreamHelper.js
var require_StreamHelper = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var ConvertWorker = require_ConvertWorker();
	var GenericWorker = require_GenericWorker();
	var base64 = require_base64();
	var support = require_support();
	var external = require_external();
	var NodejsStreamOutputAdapter = null;
	if (support.nodestream) try {
		NodejsStreamOutputAdapter = require_NodejsStreamOutputAdapter();
	} catch (e) {}
	/**
	* Apply the final transformation of the data. If the user wants a Blob for
	* example, it's easier to work with an U8intArray and finally do the
	* ArrayBuffer/Blob conversion.
	* @param {String} type the name of the final type
	* @param {String|Uint8Array|Buffer} content the content to transform
	* @param {String} mimeType the mime type of the content, if applicable.
	* @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the content in the right format.
	*/
	function transformZipOutput(type, content, mimeType) {
		switch (type) {
			case "blob": return utils.newBlob(utils.transformTo("arraybuffer", content), mimeType);
			case "base64": return base64.encode(content);
			default: return utils.transformTo(type, content);
		}
	}
	/**
	* Concatenate an array of data of the given type.
	* @param {String} type the type of the data in the given array.
	* @param {Array} dataArray the array containing the data chunks to concatenate
	* @return {String|Uint8Array|Buffer} the concatenated data
	* @throws Error if the asked type is unsupported
	*/
	function concat(type, dataArray) {
		var i, index = 0, res = null, totalLength = 0;
		for (i = 0; i < dataArray.length; i++) totalLength += dataArray[i].length;
		switch (type) {
			case "string": return dataArray.join("");
			case "array": return Array.prototype.concat.apply([], dataArray);
			case "uint8array":
				res = new Uint8Array(totalLength);
				for (i = 0; i < dataArray.length; i++) {
					res.set(dataArray[i], index);
					index += dataArray[i].length;
				}
				return res;
			case "nodebuffer": return Buffer.concat(dataArray);
			default: throw new Error("concat : unsupported type '" + type + "'");
		}
	}
	/**
	* Listen a StreamHelper, accumulate its content and concatenate it into a
	* complete block.
	* @param {StreamHelper} helper the helper to use.
	* @param {Function} updateCallback a callback called on each update. Called
	* with one arg :
	* - the metadata linked to the update received.
	* @return Promise the promise for the accumulation.
	*/
	function accumulate(helper, updateCallback) {
		return new external.Promise(function(resolve, reject) {
			var dataArray = [];
			var chunkType = helper._internalType, resultType = helper._outputType, mimeType = helper._mimeType;
			helper.on("data", function(data, meta) {
				dataArray.push(data);
				if (updateCallback) updateCallback(meta);
			}).on("error", function(err) {
				dataArray = [];
				reject(err);
			}).on("end", function() {
				try {
					resolve(transformZipOutput(resultType, concat(chunkType, dataArray), mimeType));
				} catch (e) {
					reject(e);
				}
				dataArray = [];
			}).resume();
		});
	}
	/**
	* An helper to easily use workers outside of JSZip.
	* @constructor
	* @param {Worker} worker the worker to wrap
	* @param {String} outputType the type of data expected by the use
	* @param {String} mimeType the mime type of the content, if applicable.
	*/
	function StreamHelper(worker, outputType, mimeType) {
		var internalType = outputType;
		switch (outputType) {
			case "blob":
			case "arraybuffer":
				internalType = "uint8array";
				break;
			case "base64": internalType = "string";
		}
		try {
			this._internalType = internalType;
			this._outputType = outputType;
			this._mimeType = mimeType;
			utils.checkSupport(internalType);
			this._worker = worker.pipe(new ConvertWorker(internalType));
			worker.lock();
		} catch (e) {
			this._worker = new GenericWorker("error");
			this._worker.error(e);
		}
	}
	StreamHelper.prototype = {
		/**
		* Listen a StreamHelper, accumulate its content and concatenate it into a
		* complete block.
		* @param {Function} updateCb the update callback.
		* @return Promise the promise for the accumulation.
		*/
		accumulate: function(updateCb) {
			return accumulate(this, updateCb);
		},
		/**
		* Add a listener on an event triggered on a stream.
		* @param {String} evt the name of the event
		* @param {Function} fn the listener
		* @return {StreamHelper} the current helper.
		*/
		on: function(evt, fn) {
			var self = this;
			if (evt === "data") this._worker.on(evt, function(chunk) {
				fn.call(self, chunk.data, chunk.meta);
			});
			else this._worker.on(evt, function() {
				utils.delay(fn, arguments, self);
			});
			return this;
		},
		/**
		* Resume the flow of chunks.
		* @return {StreamHelper} the current helper.
		*/
		resume: function() {
			utils.delay(this._worker.resume, [], this._worker);
			return this;
		},
		/**
		* Pause the flow of chunks.
		* @return {StreamHelper} the current helper.
		*/
		pause: function() {
			this._worker.pause();
			return this;
		},
		/**
		* Return a nodejs stream for this helper.
		* @param {Function} updateCb the update callback.
		* @return {NodejsStreamOutputAdapter} the nodejs stream.
		*/
		toNodejsStream: function(updateCb) {
			utils.checkSupport("nodestream");
			if (this._outputType !== "nodebuffer") throw new Error(this._outputType + " is not supported by this method");
			return new NodejsStreamOutputAdapter(this, { objectMode: this._outputType !== "nodebuffer" }, updateCb);
		}
	};
	module.exports = StreamHelper;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/defaults.js
var require_defaults = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.base64 = false;
	exports.binary = false;
	exports.dir = false;
	exports.createFolders = true;
	exports.date = null;
	exports.compression = null;
	exports.compressionOptions = null;
	exports.comment = null;
	exports.unixPermissions = null;
	exports.dosPermissions = null;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/stream/DataWorker.js
var require_DataWorker = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var GenericWorker = require_GenericWorker();
	var DEFAULT_BLOCK_SIZE = 16384;
	/**
	* A worker that reads a content and emits chunks.
	* @constructor
	* @param {Promise} dataP the promise of the data to split
	*/
	function DataWorker(dataP) {
		GenericWorker.call(this, "DataWorker");
		var self = this;
		this.dataIsReady = false;
		this.index = 0;
		this.max = 0;
		this.data = null;
		this.type = "";
		this._tickScheduled = false;
		dataP.then(function(data) {
			self.dataIsReady = true;
			self.data = data;
			self.max = data && data.length || 0;
			self.type = utils.getTypeOf(data);
			if (!self.isPaused) self._tickAndRepeat();
		}, function(e) {
			self.error(e);
		});
	}
	utils.inherits(DataWorker, GenericWorker);
	/**
	* @see GenericWorker.cleanUp
	*/
	DataWorker.prototype.cleanUp = function() {
		GenericWorker.prototype.cleanUp.call(this);
		this.data = null;
	};
	/**
	* @see GenericWorker.resume
	*/
	DataWorker.prototype.resume = function() {
		if (!GenericWorker.prototype.resume.call(this)) return false;
		if (!this._tickScheduled && this.dataIsReady) {
			this._tickScheduled = true;
			utils.delay(this._tickAndRepeat, [], this);
		}
		return true;
	};
	/**
	* Trigger a tick a schedule an other call to this function.
	*/
	DataWorker.prototype._tickAndRepeat = function() {
		this._tickScheduled = false;
		if (this.isPaused || this.isFinished) return;
		this._tick();
		if (!this.isFinished) {
			utils.delay(this._tickAndRepeat, [], this);
			this._tickScheduled = true;
		}
	};
	/**
	* Read and push a chunk.
	*/
	DataWorker.prototype._tick = function() {
		if (this.isPaused || this.isFinished) return false;
		var size = DEFAULT_BLOCK_SIZE;
		var data = null, nextIndex = Math.min(this.max, this.index + size);
		if (this.index >= this.max) return this.end();
		else {
			switch (this.type) {
				case "string":
					data = this.data.substring(this.index, nextIndex);
					break;
				case "uint8array":
					data = this.data.subarray(this.index, nextIndex);
					break;
				case "array":
				case "nodebuffer": data = this.data.slice(this.index, nextIndex);
			}
			this.index = nextIndex;
			return this.push({
				data,
				meta: { percent: this.max ? this.index / this.max * 100 : 0 }
			});
		}
	};
	module.exports = DataWorker;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/crc32.js
var require_crc32$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	/**
	* The following functions come from pako, from pako/lib/zlib/crc32.js
	* released under the MIT license, see pako https://github.com/nodeca/pako/
	*/
	function makeTable() {
		var c, table = [];
		for (var n = 0; n < 256; n++) {
			c = n;
			for (var k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
			table[n] = c;
		}
		return table;
	}
	var crcTable = makeTable();
	function crc32(crc, buf, len, pos) {
		var t = crcTable, end = pos + len;
		crc = crc ^ -1;
		for (var i = pos; i < end; i++) crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
		return crc ^ -1;
	}
	/**
	* Compute the crc32 of a string.
	* This is almost the same as the function crc32, but for strings. Using the
	* same function for the two use cases leads to horrible performances.
	* @param {Number} crc the starting value of the crc.
	* @param {String} str the string to use.
	* @param {Number} len the length of the string.
	* @param {Number} pos the starting position for the crc32 computation.
	* @return {Number} the computed crc32.
	*/
	function crc32str(crc, str, len, pos) {
		var t = crcTable, end = pos + len;
		crc = crc ^ -1;
		for (var i = pos; i < end; i++) crc = crc >>> 8 ^ t[(crc ^ str.charCodeAt(i)) & 255];
		return crc ^ -1;
	}
	module.exports = function crc32wrapper(input, crc) {
		if (typeof input === "undefined" || !input.length) return 0;
		if (utils.getTypeOf(input) !== "string") return crc32(crc | 0, input, input.length, 0);
		else return crc32str(crc | 0, input, input.length, 0);
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/stream/Crc32Probe.js
var require_Crc32Probe = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var GenericWorker = require_GenericWorker();
	var crc32 = require_crc32$1();
	var utils = require_utils();
	/**
	* A worker which calculate the crc32 of the data flowing through.
	* @constructor
	*/
	function Crc32Probe() {
		GenericWorker.call(this, "Crc32Probe");
		this.withStreamInfo("crc32", 0);
	}
	utils.inherits(Crc32Probe, GenericWorker);
	/**
	* @see GenericWorker.processChunk
	*/
	Crc32Probe.prototype.processChunk = function(chunk) {
		this.streamInfo.crc32 = crc32(chunk.data, this.streamInfo.crc32 || 0);
		this.push(chunk);
	};
	module.exports = Crc32Probe;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/stream/DataLengthProbe.js
var require_DataLengthProbe = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var GenericWorker = require_GenericWorker();
	/**
	* A worker which calculate the total length of the data flowing through.
	* @constructor
	* @param {String} propName the name used to expose the length
	*/
	function DataLengthProbe(propName) {
		GenericWorker.call(this, "DataLengthProbe for " + propName);
		this.propName = propName;
		this.withStreamInfo(propName, 0);
	}
	utils.inherits(DataLengthProbe, GenericWorker);
	/**
	* @see GenericWorker.processChunk
	*/
	DataLengthProbe.prototype.processChunk = function(chunk) {
		if (chunk) {
			var length = this.streamInfo[this.propName] || 0;
			this.streamInfo[this.propName] = length + chunk.data.length;
		}
		GenericWorker.prototype.processChunk.call(this, chunk);
	};
	module.exports = DataLengthProbe;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/compressedObject.js
var require_compressedObject = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var external = require_external();
	var DataWorker = require_DataWorker();
	var Crc32Probe = require_Crc32Probe();
	var DataLengthProbe = require_DataLengthProbe();
	/**
	* Represent a compressed object, with everything needed to decompress it.
	* @constructor
	* @param {number} compressedSize the size of the data compressed.
	* @param {number} uncompressedSize the size of the data after decompression.
	* @param {number} crc32 the crc32 of the decompressed file.
	* @param {object} compression the type of compression, see lib/compressions.js.
	* @param {String|ArrayBuffer|Uint8Array|Buffer} data the compressed data.
	*/
	function CompressedObject(compressedSize, uncompressedSize, crc32, compression, data) {
		this.compressedSize = compressedSize;
		this.uncompressedSize = uncompressedSize;
		this.crc32 = crc32;
		this.compression = compression;
		this.compressedContent = data;
	}
	CompressedObject.prototype = {
		/**
		* Create a worker to get the uncompressed content.
		* @return {GenericWorker} the worker.
		*/
		getContentWorker: function() {
			var worker = new DataWorker(external.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new DataLengthProbe("data_length"));
			var that = this;
			worker.on("end", function() {
				if (this.streamInfo["data_length"] !== that.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
			});
			return worker;
		},
		/**
		* Create a worker to get the compressed content.
		* @return {GenericWorker} the worker.
		*/
		getCompressedWorker: function() {
			return new DataWorker(external.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
		}
	};
	/**
	* Chain the given worker with other workers to compress the content with the
	* given compression.
	* @param {GenericWorker} uncompressedWorker the worker to pipe.
	* @param {Object} compression the compression object.
	* @param {Object} compressionOptions the options to use when compressing.
	* @return {GenericWorker} the new worker compressing the content.
	*/
	CompressedObject.createWorkerFrom = function(uncompressedWorker, compression, compressionOptions) {
		return uncompressedWorker.pipe(new Crc32Probe()).pipe(new DataLengthProbe("uncompressedSize")).pipe(compression.compressWorker(compressionOptions)).pipe(new DataLengthProbe("compressedSize")).withStreamInfo("compression", compression);
	};
	module.exports = CompressedObject;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/zipObject.js
var require_zipObject = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var StreamHelper = require_StreamHelper();
	var DataWorker = require_DataWorker();
	var utf8 = require_utf8();
	var CompressedObject = require_compressedObject();
	var GenericWorker = require_GenericWorker();
	/**
	* A simple object representing a file in the zip file.
	* @constructor
	* @param {string} name the name of the file
	* @param {String|ArrayBuffer|Uint8Array|Buffer} data the data
	* @param {Object} options the options of the file
	*/
	var ZipObject = function(name, data, options) {
		this.name = name;
		this.dir = options.dir;
		this.date = options.date;
		this.comment = options.comment;
		this.unixPermissions = options.unixPermissions;
		this.dosPermissions = options.dosPermissions;
		this._data = data;
		this._dataBinary = options.binary;
		this.options = {
			compression: options.compression,
			compressionOptions: options.compressionOptions
		};
	};
	ZipObject.prototype = {
		/**
		* Create an internal stream for the content of this object.
		* @param {String} type the type of each chunk.
		* @return StreamHelper the stream.
		*/
		internalStream: function(type) {
			var result = null, outputType = "string";
			try {
				if (!type) throw new Error("No output type specified.");
				outputType = type.toLowerCase();
				var askUnicodeString = outputType === "string" || outputType === "text";
				if (outputType === "binarystring" || outputType === "text") outputType = "string";
				result = this._decompressWorker();
				var isUnicodeString = !this._dataBinary;
				if (isUnicodeString && !askUnicodeString) result = result.pipe(new utf8.Utf8EncodeWorker());
				if (!isUnicodeString && askUnicodeString) result = result.pipe(new utf8.Utf8DecodeWorker());
			} catch (e) {
				result = new GenericWorker("error");
				result.error(e);
			}
			return new StreamHelper(result, outputType, "");
		},
		/**
		* Prepare the content in the asked type.
		* @param {String} type the type of the result.
		* @param {Function} onUpdate a function to call on each internal update.
		* @return Promise the promise of the result.
		*/
		async: function(type, onUpdate) {
			return this.internalStream(type).accumulate(onUpdate);
		},
		/**
		* Prepare the content as a nodejs stream.
		* @param {String} type the type of each chunk.
		* @param {Function} onUpdate a function to call on each internal update.
		* @return Stream the stream.
		*/
		nodeStream: function(type, onUpdate) {
			return this.internalStream(type || "nodebuffer").toNodejsStream(onUpdate);
		},
		/**
		* Return a worker for the compressed content.
		* @private
		* @param {Object} compression the compression object to use.
		* @param {Object} compressionOptions the options to use when compressing.
		* @return Worker the worker.
		*/
		_compressWorker: function(compression, compressionOptions) {
			if (this._data instanceof CompressedObject && this._data.compression.magic === compression.magic) return this._data.getCompressedWorker();
			else {
				var result = this._decompressWorker();
				if (!this._dataBinary) result = result.pipe(new utf8.Utf8EncodeWorker());
				return CompressedObject.createWorkerFrom(result, compression, compressionOptions);
			}
		},
		/**
		* Return a worker for the decompressed content.
		* @private
		* @return Worker the worker.
		*/
		_decompressWorker: function() {
			if (this._data instanceof CompressedObject) return this._data.getContentWorker();
			else if (this._data instanceof GenericWorker) return this._data;
			else return new DataWorker(this._data);
		}
	};
	var removedMethods = [
		"asText",
		"asBinary",
		"asNodeBuffer",
		"asUint8Array",
		"asArrayBuffer"
	];
	var removedFn = function() {
		throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
	};
	for (var i = 0; i < removedMethods.length; i++) ZipObject.prototype[removedMethods[i]] = removedFn;
	module.exports = ZipObject;
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/utils/common.js
var require_common = /* @__PURE__ */ __commonJSMin(((exports) => {
	var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
	function _has(obj, key) {
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
	exports.assign = function(obj) {
		var sources = Array.prototype.slice.call(arguments, 1);
		while (sources.length) {
			var source = sources.shift();
			if (!source) continue;
			if (typeof source !== "object") throw new TypeError(source + "must be non-object");
			for (var p in source) if (_has(source, p)) obj[p] = source[p];
		}
		return obj;
	};
	exports.shrinkBuf = function(buf, size) {
		if (buf.length === size) return buf;
		if (buf.subarray) return buf.subarray(0, size);
		buf.length = size;
		return buf;
	};
	var fnTyped = {
		arraySet: function(dest, src, src_offs, len, dest_offs) {
			if (src.subarray && dest.subarray) {
				dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
				return;
			}
			for (var i = 0; i < len; i++) dest[dest_offs + i] = src[src_offs + i];
		},
		flattenChunks: function(chunks) {
			var i, l, len = 0, pos, chunk, result;
			for (i = 0, l = chunks.length; i < l; i++) len += chunks[i].length;
			result = new Uint8Array(len);
			pos = 0;
			for (i = 0, l = chunks.length; i < l; i++) {
				chunk = chunks[i];
				result.set(chunk, pos);
				pos += chunk.length;
			}
			return result;
		}
	};
	var fnUntyped = {
		arraySet: function(dest, src, src_offs, len, dest_offs) {
			for (var i = 0; i < len; i++) dest[dest_offs + i] = src[src_offs + i];
		},
		flattenChunks: function(chunks) {
			return [].concat.apply([], chunks);
		}
	};
	exports.setTyped = function(on) {
		if (on) {
			exports.Buf8 = Uint8Array;
			exports.Buf16 = Uint16Array;
			exports.Buf32 = Int32Array;
			exports.assign(exports, fnTyped);
		} else {
			exports.Buf8 = Array;
			exports.Buf16 = Array;
			exports.Buf32 = Array;
			exports.assign(exports, fnUntyped);
		}
	};
	exports.setTyped(TYPED_OK);
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/trees.js
var require_trees = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utils = require_common();
	var Z_FIXED = 4;
	var Z_BINARY = 0;
	var Z_TEXT = 1;
	var Z_UNKNOWN = 2;
	function zero(buf) {
		var len = buf.length;
		while (--len >= 0) buf[len] = 0;
	}
	var STORED_BLOCK = 0;
	var STATIC_TREES = 1;
	var DYN_TREES = 2;
	var MIN_MATCH = 3;
	var MAX_MATCH = 258;
	var LENGTH_CODES = 29;
	var LITERALS = 256;
	var L_CODES = LITERALS + 1 + LENGTH_CODES;
	var D_CODES = 30;
	var BL_CODES = 19;
	var HEAP_SIZE = 2 * L_CODES + 1;
	var MAX_BITS = 15;
	var Buf_size = 16;
	var MAX_BL_BITS = 7;
	var END_BLOCK = 256;
	var REP_3_6 = 16;
	var REPZ_3_10 = 17;
	var REPZ_11_138 = 18;
	var extra_lbits = [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		2,
		2,
		2,
		2,
		3,
		3,
		3,
		3,
		4,
		4,
		4,
		4,
		5,
		5,
		5,
		5,
		0
	];
	var extra_dbits = [
		0,
		0,
		0,
		0,
		1,
		1,
		2,
		2,
		3,
		3,
		4,
		4,
		5,
		5,
		6,
		6,
		7,
		7,
		8,
		8,
		9,
		9,
		10,
		10,
		11,
		11,
		12,
		12,
		13,
		13
	];
	var extra_blbits = [
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
		2,
		3,
		7
	];
	var bl_order = [
		16,
		17,
		18,
		0,
		8,
		7,
		9,
		6,
		10,
		5,
		11,
		4,
		12,
		3,
		13,
		2,
		14,
		1,
		15
	];
	var DIST_CODE_LEN = 512;
	var static_ltree = new Array((L_CODES + 2) * 2);
	zero(static_ltree);
	var static_dtree = new Array(D_CODES * 2);
	zero(static_dtree);
	var _dist_code = new Array(DIST_CODE_LEN);
	zero(_dist_code);
	var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
	zero(_length_code);
	var base_length = new Array(LENGTH_CODES);
	zero(base_length);
	var base_dist = new Array(D_CODES);
	zero(base_dist);
	function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
		this.static_tree = static_tree;
		this.extra_bits = extra_bits;
		this.extra_base = extra_base;
		this.elems = elems;
		this.max_length = max_length;
		this.has_stree = static_tree && static_tree.length;
	}
	var static_l_desc;
	var static_d_desc;
	var static_bl_desc;
	function TreeDesc(dyn_tree, stat_desc) {
		this.dyn_tree = dyn_tree;
		this.max_code = 0;
		this.stat_desc = stat_desc;
	}
	function d_code(dist) {
		return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
	}
	function put_short(s, w) {
		s.pending_buf[s.pending++] = w & 255;
		s.pending_buf[s.pending++] = w >>> 8 & 255;
	}
	function send_bits(s, value, length) {
		if (s.bi_valid > Buf_size - length) {
			s.bi_buf |= value << s.bi_valid & 65535;
			put_short(s, s.bi_buf);
			s.bi_buf = value >> Buf_size - s.bi_valid;
			s.bi_valid += length - Buf_size;
		} else {
			s.bi_buf |= value << s.bi_valid & 65535;
			s.bi_valid += length;
		}
	}
	function send_code(s, c, tree) {
		send_bits(s, tree[c * 2], tree[c * 2 + 1]);
	}
	function bi_reverse(code, len) {
		var res = 0;
		do {
			res |= code & 1;
			code >>>= 1;
			res <<= 1;
		} while (--len > 0);
		return res >>> 1;
	}
	function bi_flush(s) {
		if (s.bi_valid === 16) {
			put_short(s, s.bi_buf);
			s.bi_buf = 0;
			s.bi_valid = 0;
		} else if (s.bi_valid >= 8) {
			s.pending_buf[s.pending++] = s.bi_buf & 255;
			s.bi_buf >>= 8;
			s.bi_valid -= 8;
		}
	}
	function gen_bitlen(s, desc) {
		var tree = desc.dyn_tree;
		var max_code = desc.max_code;
		var stree = desc.stat_desc.static_tree;
		var has_stree = desc.stat_desc.has_stree;
		var extra = desc.stat_desc.extra_bits;
		var base = desc.stat_desc.extra_base;
		var max_length = desc.stat_desc.max_length;
		var h;
		var n, m;
		var bits;
		var xbits;
		var f;
		var overflow = 0;
		for (bits = 0; bits <= MAX_BITS; bits++) s.bl_count[bits] = 0;
		tree[s.heap[s.heap_max] * 2 + 1] = 0;
		for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
			n = s.heap[h];
			bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
			if (bits > max_length) {
				bits = max_length;
				overflow++;
			}
			tree[n * 2 + 1] = bits;
			if (n > max_code) continue;
			s.bl_count[bits]++;
			xbits = 0;
			if (n >= base) xbits = extra[n - base];
			f = tree[n * 2];
			s.opt_len += f * (bits + xbits);
			if (has_stree) s.static_len += f * (stree[n * 2 + 1] + xbits);
		}
		if (overflow === 0) return;
		do {
			bits = max_length - 1;
			while (s.bl_count[bits] === 0) bits--;
			s.bl_count[bits]--;
			s.bl_count[bits + 1] += 2;
			s.bl_count[max_length]--;
			overflow -= 2;
		} while (overflow > 0);
		for (bits = max_length; bits !== 0; bits--) {
			n = s.bl_count[bits];
			while (n !== 0) {
				m = s.heap[--h];
				if (m > max_code) continue;
				if (tree[m * 2 + 1] !== bits) {
					s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
					tree[m * 2 + 1] = bits;
				}
				n--;
			}
		}
	}
	function gen_codes(tree, max_code, bl_count) {
		var next_code = new Array(MAX_BITS + 1);
		var code = 0;
		var bits;
		var n;
		for (bits = 1; bits <= MAX_BITS; bits++) next_code[bits] = code = code + bl_count[bits - 1] << 1;
		for (n = 0; n <= max_code; n++) {
			var len = tree[n * 2 + 1];
			if (len === 0) continue;
			tree[n * 2] = bi_reverse(next_code[len]++, len);
		}
	}
	function tr_static_init() {
		var n;
		var bits;
		var length;
		var code;
		var dist;
		var bl_count = new Array(MAX_BITS + 1);
		length = 0;
		for (code = 0; code < LENGTH_CODES - 1; code++) {
			base_length[code] = length;
			for (n = 0; n < 1 << extra_lbits[code]; n++) _length_code[length++] = code;
		}
		_length_code[length - 1] = code;
		dist = 0;
		for (code = 0; code < 16; code++) {
			base_dist[code] = dist;
			for (n = 0; n < 1 << extra_dbits[code]; n++) _dist_code[dist++] = code;
		}
		dist >>= 7;
		for (; code < D_CODES; code++) {
			base_dist[code] = dist << 7;
			for (n = 0; n < 1 << extra_dbits[code] - 7; n++) _dist_code[256 + dist++] = code;
		}
		for (bits = 0; bits <= MAX_BITS; bits++) bl_count[bits] = 0;
		n = 0;
		while (n <= 143) {
			static_ltree[n * 2 + 1] = 8;
			n++;
			bl_count[8]++;
		}
		while (n <= 255) {
			static_ltree[n * 2 + 1] = 9;
			n++;
			bl_count[9]++;
		}
		while (n <= 279) {
			static_ltree[n * 2 + 1] = 7;
			n++;
			bl_count[7]++;
		}
		while (n <= 287) {
			static_ltree[n * 2 + 1] = 8;
			n++;
			bl_count[8]++;
		}
		gen_codes(static_ltree, L_CODES + 1, bl_count);
		for (n = 0; n < D_CODES; n++) {
			static_dtree[n * 2 + 1] = 5;
			static_dtree[n * 2] = bi_reverse(n, 5);
		}
		static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
		static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
		static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
	}
	function init_block(s) {
		var n;
		for (n = 0; n < L_CODES; n++) s.dyn_ltree[n * 2] = 0;
		for (n = 0; n < D_CODES; n++) s.dyn_dtree[n * 2] = 0;
		for (n = 0; n < BL_CODES; n++) s.bl_tree[n * 2] = 0;
		s.dyn_ltree[END_BLOCK * 2] = 1;
		s.opt_len = s.static_len = 0;
		s.last_lit = s.matches = 0;
	}
	function bi_windup(s) {
		if (s.bi_valid > 8) put_short(s, s.bi_buf);
		else if (s.bi_valid > 0) s.pending_buf[s.pending++] = s.bi_buf;
		s.bi_buf = 0;
		s.bi_valid = 0;
	}
	function copy_block(s, buf, len, header) {
		bi_windup(s);
		if (header) {
			put_short(s, len);
			put_short(s, ~len);
		}
		utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
		s.pending += len;
	}
	function smaller(tree, n, m, depth) {
		var _n2 = n * 2;
		var _m2 = m * 2;
		return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
	}
	function pqdownheap(s, tree, k) {
		var v = s.heap[k];
		var j = k << 1;
		while (j <= s.heap_len) {
			if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) j++;
			if (smaller(tree, v, s.heap[j], s.depth)) break;
			s.heap[k] = s.heap[j];
			k = j;
			j <<= 1;
		}
		s.heap[k] = v;
	}
	function compress_block(s, ltree, dtree) {
		var dist;
		var lc;
		var lx = 0;
		var code;
		var extra;
		if (s.last_lit !== 0) do {
			dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
			lc = s.pending_buf[s.l_buf + lx];
			lx++;
			if (dist === 0) send_code(s, lc, ltree);
			else {
				code = _length_code[lc];
				send_code(s, code + LITERALS + 1, ltree);
				extra = extra_lbits[code];
				if (extra !== 0) {
					lc -= base_length[code];
					send_bits(s, lc, extra);
				}
				dist--;
				code = d_code(dist);
				send_code(s, code, dtree);
				extra = extra_dbits[code];
				if (extra !== 0) {
					dist -= base_dist[code];
					send_bits(s, dist, extra);
				}
			}
		} while (lx < s.last_lit);
		send_code(s, END_BLOCK, ltree);
	}
	function build_tree(s, desc) {
		var tree = desc.dyn_tree;
		var stree = desc.stat_desc.static_tree;
		var has_stree = desc.stat_desc.has_stree;
		var elems = desc.stat_desc.elems;
		var n, m;
		var max_code = -1;
		var node;
		s.heap_len = 0;
		s.heap_max = HEAP_SIZE;
		for (n = 0; n < elems; n++) if (tree[n * 2] !== 0) {
			s.heap[++s.heap_len] = max_code = n;
			s.depth[n] = 0;
		} else tree[n * 2 + 1] = 0;
		while (s.heap_len < 2) {
			node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
			tree[node * 2] = 1;
			s.depth[node] = 0;
			s.opt_len--;
			if (has_stree) s.static_len -= stree[node * 2 + 1];
		}
		desc.max_code = max_code;
		for (n = s.heap_len >> 1; n >= 1; n--) pqdownheap(s, tree, n);
		node = elems;
		do {
			/*** pqremove ***/
			n = s.heap[1];
			s.heap[1] = s.heap[s.heap_len--];
			pqdownheap(s, tree, 1);
			m = s.heap[1];
			s.heap[--s.heap_max] = n;
			s.heap[--s.heap_max] = m;
			tree[node * 2] = tree[n * 2] + tree[m * 2];
			s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
			tree[n * 2 + 1] = tree[m * 2 + 1] = node;
			s.heap[1] = node++;
			pqdownheap(s, tree, 1);
		} while (s.heap_len >= 2);
		s.heap[--s.heap_max] = s.heap[1];
		gen_bitlen(s, desc);
		gen_codes(tree, max_code, s.bl_count);
	}
	function scan_tree(s, tree, max_code) {
		var n;
		var prevlen = -1;
		var curlen;
		var nextlen = tree[1];
		var count = 0;
		var max_count = 7;
		var min_count = 4;
		if (nextlen === 0) {
			max_count = 138;
			min_count = 3;
		}
		tree[(max_code + 1) * 2 + 1] = 65535;
		for (n = 0; n <= max_code; n++) {
			curlen = nextlen;
			nextlen = tree[(n + 1) * 2 + 1];
			if (++count < max_count && curlen === nextlen) continue;
			else if (count < min_count) s.bl_tree[curlen * 2] += count;
			else if (curlen !== 0) {
				if (curlen !== prevlen) s.bl_tree[curlen * 2]++;
				s.bl_tree[REP_3_6 * 2]++;
			} else if (count <= 10) s.bl_tree[REPZ_3_10 * 2]++;
			else s.bl_tree[REPZ_11_138 * 2]++;
			count = 0;
			prevlen = curlen;
			if (nextlen === 0) {
				max_count = 138;
				min_count = 3;
			} else if (curlen === nextlen) {
				max_count = 6;
				min_count = 3;
			} else {
				max_count = 7;
				min_count = 4;
			}
		}
	}
	function send_tree(s, tree, max_code) {
		var n;
		var prevlen = -1;
		var curlen;
		var nextlen = tree[1];
		var count = 0;
		var max_count = 7;
		var min_count = 4;
		if (nextlen === 0) {
			max_count = 138;
			min_count = 3;
		}
		for (n = 0; n <= max_code; n++) {
			curlen = nextlen;
			nextlen = tree[(n + 1) * 2 + 1];
			if (++count < max_count && curlen === nextlen) continue;
			else if (count < min_count) do
				send_code(s, curlen, s.bl_tree);
			while (--count !== 0);
			else if (curlen !== 0) {
				if (curlen !== prevlen) {
					send_code(s, curlen, s.bl_tree);
					count--;
				}
				send_code(s, REP_3_6, s.bl_tree);
				send_bits(s, count - 3, 2);
			} else if (count <= 10) {
				send_code(s, REPZ_3_10, s.bl_tree);
				send_bits(s, count - 3, 3);
			} else {
				send_code(s, REPZ_11_138, s.bl_tree);
				send_bits(s, count - 11, 7);
			}
			count = 0;
			prevlen = curlen;
			if (nextlen === 0) {
				max_count = 138;
				min_count = 3;
			} else if (curlen === nextlen) {
				max_count = 6;
				min_count = 3;
			} else {
				max_count = 7;
				min_count = 4;
			}
		}
	}
	function build_bl_tree(s) {
		var max_blindex;
		scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
		scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
		build_tree(s, s.bl_desc);
		for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) break;
		s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
		return max_blindex;
	}
	function send_all_trees(s, lcodes, dcodes, blcodes) {
		var rank;
		send_bits(s, lcodes - 257, 5);
		send_bits(s, dcodes - 1, 5);
		send_bits(s, blcodes - 4, 4);
		for (rank = 0; rank < blcodes; rank++) send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
		send_tree(s, s.dyn_ltree, lcodes - 1);
		send_tree(s, s.dyn_dtree, dcodes - 1);
	}
	function detect_data_type(s) {
		var black_mask = 4093624447;
		var n;
		for (n = 0; n <= 31; n++, black_mask >>>= 1) if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) return Z_BINARY;
		if (s.dyn_ltree[18] !== 0 || s.dyn_ltree[20] !== 0 || s.dyn_ltree[26] !== 0) return Z_TEXT;
		for (n = 32; n < LITERALS; n++) if (s.dyn_ltree[n * 2] !== 0) return Z_TEXT;
		return Z_BINARY;
	}
	var static_init_done = false;
	function _tr_init(s) {
		if (!static_init_done) {
			tr_static_init();
			static_init_done = true;
		}
		s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
		s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
		s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
		s.bi_buf = 0;
		s.bi_valid = 0;
		init_block(s);
	}
	function _tr_stored_block(s, buf, stored_len, last) {
		send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
		copy_block(s, buf, stored_len, true);
	}
	function _tr_align(s) {
		send_bits(s, STATIC_TREES << 1, 3);
		send_code(s, END_BLOCK, static_ltree);
		bi_flush(s);
	}
	function _tr_flush_block(s, buf, stored_len, last) {
		var opt_lenb, static_lenb;
		var max_blindex = 0;
		if (s.level > 0) {
			if (s.strm.data_type === Z_UNKNOWN) s.strm.data_type = detect_data_type(s);
			build_tree(s, s.l_desc);
			build_tree(s, s.d_desc);
			max_blindex = build_bl_tree(s);
			opt_lenb = s.opt_len + 3 + 7 >>> 3;
			static_lenb = s.static_len + 3 + 7 >>> 3;
			if (static_lenb <= opt_lenb) opt_lenb = static_lenb;
		} else opt_lenb = static_lenb = stored_len + 5;
		if (stored_len + 4 <= opt_lenb && buf !== -1) _tr_stored_block(s, buf, stored_len, last);
		else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
			send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
			compress_block(s, static_ltree, static_dtree);
		} else {
			send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
			send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
			compress_block(s, s.dyn_ltree, s.dyn_dtree);
		}
		init_block(s);
		if (last) bi_windup(s);
	}
	function _tr_tally(s, dist, lc) {
		s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
		s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
		s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
		s.last_lit++;
		if (dist === 0) s.dyn_ltree[lc * 2]++;
		else {
			s.matches++;
			dist--;
			s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
			s.dyn_dtree[d_code(dist) * 2]++;
		}
		return s.last_lit === s.lit_bufsize - 1;
	}
	exports._tr_init = _tr_init;
	exports._tr_stored_block = _tr_stored_block;
	exports._tr_flush_block = _tr_flush_block;
	exports._tr_tally = _tr_tally;
	exports._tr_align = _tr_align;
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/adler32.js
var require_adler32 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function adler32(adler, buf, len, pos) {
		var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
		while (len !== 0) {
			n = len > 2e3 ? 2e3 : len;
			len -= n;
			do {
				s1 = s1 + buf[pos++] | 0;
				s2 = s2 + s1 | 0;
			} while (--n);
			s1 %= 65521;
			s2 %= 65521;
		}
		return s1 | s2 << 16 | 0;
	}
	module.exports = adler32;
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/crc32.js
var require_crc32 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function makeTable() {
		var c, table = [];
		for (var n = 0; n < 256; n++) {
			c = n;
			for (var k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
			table[n] = c;
		}
		return table;
	}
	var crcTable = makeTable();
	function crc32(crc, buf, len, pos) {
		var t = crcTable, end = pos + len;
		crc ^= -1;
		for (var i = pos; i < end; i++) crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
		return crc ^ -1;
	}
	module.exports = crc32;
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/messages.js
var require_messages = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		2: "need dictionary",
		1: "stream end",
		0: "",
		"-1": "file error",
		"-2": "stream error",
		"-3": "data error",
		"-4": "insufficient memory",
		"-5": "buffer error",
		"-6": "incompatible version"
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/deflate.js
var require_deflate$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utils = require_common();
	var trees = require_trees();
	var adler32 = require_adler32();
	var crc32 = require_crc32();
	var msg = require_messages();
	var Z_NO_FLUSH = 0;
	var Z_PARTIAL_FLUSH = 1;
	var Z_FULL_FLUSH = 3;
	var Z_FINISH = 4;
	var Z_BLOCK = 5;
	var Z_OK = 0;
	var Z_STREAM_END = 1;
	var Z_STREAM_ERROR = -2;
	var Z_DATA_ERROR = -3;
	var Z_BUF_ERROR = -5;
	var Z_DEFAULT_COMPRESSION = -1;
	var Z_FILTERED = 1;
	var Z_HUFFMAN_ONLY = 2;
	var Z_RLE = 3;
	var Z_FIXED = 4;
	var Z_DEFAULT_STRATEGY = 0;
	var Z_UNKNOWN = 2;
	var Z_DEFLATED = 8;
	var MAX_MEM_LEVEL = 9;
	var MAX_WBITS = 15;
	var DEF_MEM_LEVEL = 8;
	var L_CODES = 286;
	var D_CODES = 30;
	var BL_CODES = 19;
	var HEAP_SIZE = 2 * L_CODES + 1;
	var MAX_BITS = 15;
	var MIN_MATCH = 3;
	var MAX_MATCH = 258;
	var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
	var PRESET_DICT = 32;
	var INIT_STATE = 42;
	var EXTRA_STATE = 69;
	var NAME_STATE = 73;
	var COMMENT_STATE = 91;
	var HCRC_STATE = 103;
	var BUSY_STATE = 113;
	var FINISH_STATE = 666;
	var BS_NEED_MORE = 1;
	var BS_BLOCK_DONE = 2;
	var BS_FINISH_STARTED = 3;
	var BS_FINISH_DONE = 4;
	var OS_CODE = 3;
	function err(strm, errorCode) {
		strm.msg = msg[errorCode];
		return errorCode;
	}
	function rank(f) {
		return (f << 1) - (f > 4 ? 9 : 0);
	}
	function zero(buf) {
		var len = buf.length;
		while (--len >= 0) buf[len] = 0;
	}
	function flush_pending(strm) {
		var s = strm.state;
		var len = s.pending;
		if (len > strm.avail_out) len = strm.avail_out;
		if (len === 0) return;
		utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
		strm.next_out += len;
		s.pending_out += len;
		strm.total_out += len;
		strm.avail_out -= len;
		s.pending -= len;
		if (s.pending === 0) s.pending_out = 0;
	}
	function flush_block_only(s, last) {
		trees._tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
		s.block_start = s.strstart;
		flush_pending(s.strm);
	}
	function put_byte(s, b) {
		s.pending_buf[s.pending++] = b;
	}
	function putShortMSB(s, b) {
		s.pending_buf[s.pending++] = b >>> 8 & 255;
		s.pending_buf[s.pending++] = b & 255;
	}
	function read_buf(strm, buf, start, size) {
		var len = strm.avail_in;
		if (len > size) len = size;
		if (len === 0) return 0;
		strm.avail_in -= len;
		utils.arraySet(buf, strm.input, strm.next_in, len, start);
		if (strm.state.wrap === 1) strm.adler = adler32(strm.adler, buf, len, start);
		else if (strm.state.wrap === 2) strm.adler = crc32(strm.adler, buf, len, start);
		strm.next_in += len;
		strm.total_in += len;
		return len;
	}
	function longest_match(s, cur_match) {
		var chain_length = s.max_chain_length;
		var scan = s.strstart;
		var match;
		var len;
		var best_len = s.prev_length;
		var nice_match = s.nice_match;
		var limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
		var _win = s.window;
		var wmask = s.w_mask;
		var prev = s.prev;
		var strend = s.strstart + MAX_MATCH;
		var scan_end1 = _win[scan + best_len - 1];
		var scan_end = _win[scan + best_len];
		if (s.prev_length >= s.good_match) chain_length >>= 2;
		if (nice_match > s.lookahead) nice_match = s.lookahead;
		do {
			match = cur_match;
			if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) continue;
			scan += 2;
			match++;
			do			;
while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
			len = MAX_MATCH - (strend - scan);
			scan = strend - MAX_MATCH;
			if (len > best_len) {
				s.match_start = cur_match;
				best_len = len;
				if (len >= nice_match) break;
				scan_end1 = _win[scan + best_len - 1];
				scan_end = _win[scan + best_len];
			}
		} while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
		if (best_len <= s.lookahead) return best_len;
		return s.lookahead;
	}
	function fill_window(s) {
		var _w_size = s.w_size;
		var p, n, m, more, str;
		do {
			more = s.window_size - s.lookahead - s.strstart;
			if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
				utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
				s.match_start -= _w_size;
				s.strstart -= _w_size;
				s.block_start -= _w_size;
				n = s.hash_size;
				p = n;
				do {
					m = s.head[--p];
					s.head[p] = m >= _w_size ? m - _w_size : 0;
				} while (--n);
				n = _w_size;
				p = n;
				do {
					m = s.prev[--p];
					s.prev[p] = m >= _w_size ? m - _w_size : 0;
				} while (--n);
				more += _w_size;
			}
			if (s.strm.avail_in === 0) break;
			n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
			s.lookahead += n;
			if (s.lookahead + s.insert >= MIN_MATCH) {
				str = s.strstart - s.insert;
				s.ins_h = s.window[str];
				s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
				while (s.insert) {
					s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
					s.prev[str & s.w_mask] = s.head[s.ins_h];
					s.head[s.ins_h] = str;
					str++;
					s.insert--;
					if (s.lookahead + s.insert < MIN_MATCH) break;
				}
			}
		} while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
	}
	function deflate_stored(s, flush) {
		var max_block_size = 65535;
		if (max_block_size > s.pending_buf_size - 5) max_block_size = s.pending_buf_size - 5;
		for (;;) {
			if (s.lookahead <= 1) {
				fill_window(s);
				if (s.lookahead === 0 && flush === Z_NO_FLUSH) return BS_NEED_MORE;
				if (s.lookahead === 0) break;
			}
			s.strstart += s.lookahead;
			s.lookahead = 0;
			var max_start = s.block_start + max_block_size;
			if (s.strstart === 0 || s.strstart >= max_start) {
				s.lookahead = s.strstart - max_start;
				s.strstart = max_start;
				/*** FLUSH_BLOCK(s, 0); ***/
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
			if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
				/*** FLUSH_BLOCK(s, 0); ***/
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
		}
		s.insert = 0;
		if (flush === Z_FINISH) {
			/*** FLUSH_BLOCK(s, 1); ***/
			flush_block_only(s, true);
			if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
			return BS_FINISH_DONE;
		}
		if (s.strstart > s.block_start) {
			/*** FLUSH_BLOCK(s, 0); ***/
			flush_block_only(s, false);
			if (s.strm.avail_out === 0) return BS_NEED_MORE;
		}
		return BS_NEED_MORE;
	}
	function deflate_fast(s, flush) {
		var hash_head;
		var bflush;
		for (;;) {
			if (s.lookahead < MIN_LOOKAHEAD) {
				fill_window(s);
				if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) return BS_NEED_MORE;
				if (s.lookahead === 0) break;
			}
			hash_head = 0;
			if (s.lookahead >= MIN_MATCH) {
				/*** INSERT_STRING(s, s.strstart, hash_head); ***/
				s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
				hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
				s.head[s.ins_h] = s.strstart;
			}
			if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) s.match_length = longest_match(s, hash_head);
			if (s.match_length >= MIN_MATCH) {
				/*** _tr_tally_dist(s, s.strstart - s.match_start,
				s.match_length - MIN_MATCH, bflush); ***/
				bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
				s.lookahead -= s.match_length;
				if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
					s.match_length--;
					do {
						s.strstart++;
						/*** INSERT_STRING(s, s.strstart, hash_head); ***/
						s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
						hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
						s.head[s.ins_h] = s.strstart;
					} while (--s.match_length !== 0);
					s.strstart++;
				} else {
					s.strstart += s.match_length;
					s.match_length = 0;
					s.ins_h = s.window[s.strstart];
					s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
				}
			} else {
				/*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
				bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
				s.lookahead--;
				s.strstart++;
			}
			if (bflush) {
				/*** FLUSH_BLOCK(s, 0); ***/
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
		}
		s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
		if (flush === Z_FINISH) {
			/*** FLUSH_BLOCK(s, 1); ***/
			flush_block_only(s, true);
			if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
			return BS_FINISH_DONE;
		}
		if (s.last_lit) {
			/*** FLUSH_BLOCK(s, 0); ***/
			flush_block_only(s, false);
			if (s.strm.avail_out === 0) return BS_NEED_MORE;
		}
		return BS_BLOCK_DONE;
	}
	function deflate_slow(s, flush) {
		var hash_head;
		var bflush;
		var max_insert;
		for (;;) {
			if (s.lookahead < MIN_LOOKAHEAD) {
				fill_window(s);
				if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) return BS_NEED_MORE;
				if (s.lookahead === 0) break;
			}
			hash_head = 0;
			if (s.lookahead >= MIN_MATCH) {
				/*** INSERT_STRING(s, s.strstart, hash_head); ***/
				s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
				hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
				s.head[s.ins_h] = s.strstart;
			}
			s.prev_length = s.match_length;
			s.prev_match = s.match_start;
			s.match_length = MIN_MATCH - 1;
			if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
				s.match_length = longest_match(s, hash_head);
				if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) s.match_length = MIN_MATCH - 1;
			}
			if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
				max_insert = s.strstart + s.lookahead - MIN_MATCH;
				/***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
				s.prev_length - MIN_MATCH, bflush);***/
				bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
				s.lookahead -= s.prev_length - 1;
				s.prev_length -= 2;
				do
					if (++s.strstart <= max_insert) {
						/*** INSERT_STRING(s, s.strstart, hash_head); ***/
						s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
						hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
						s.head[s.ins_h] = s.strstart;
					}
				while (--s.prev_length !== 0);
				s.match_available = 0;
				s.match_length = MIN_MATCH - 1;
				s.strstart++;
				if (bflush) {
					/*** FLUSH_BLOCK(s, 0); ***/
					flush_block_only(s, false);
					if (s.strm.avail_out === 0) return BS_NEED_MORE;
				}
			} else if (s.match_available) {
				/*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
				bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
				if (bflush)
 /*** FLUSH_BLOCK_ONLY(s, 0) ***/
				flush_block_only(s, false);
				s.strstart++;
				s.lookahead--;
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			} else {
				s.match_available = 1;
				s.strstart++;
				s.lookahead--;
			}
		}
		if (s.match_available) {
			/*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
			bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
			s.match_available = 0;
		}
		s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
		if (flush === Z_FINISH) {
			/*** FLUSH_BLOCK(s, 1); ***/
			flush_block_only(s, true);
			if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
			return BS_FINISH_DONE;
		}
		if (s.last_lit) {
			/*** FLUSH_BLOCK(s, 0); ***/
			flush_block_only(s, false);
			if (s.strm.avail_out === 0) return BS_NEED_MORE;
		}
		return BS_BLOCK_DONE;
	}
	function deflate_rle(s, flush) {
		var bflush;
		var prev;
		var scan, strend;
		var _win = s.window;
		for (;;) {
			if (s.lookahead <= MAX_MATCH) {
				fill_window(s);
				if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) return BS_NEED_MORE;
				if (s.lookahead === 0) break;
			}
			s.match_length = 0;
			if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
				scan = s.strstart - 1;
				prev = _win[scan];
				if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
					strend = s.strstart + MAX_MATCH;
					do					;
while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
					s.match_length = MAX_MATCH - (strend - scan);
					if (s.match_length > s.lookahead) s.match_length = s.lookahead;
				}
			}
			if (s.match_length >= MIN_MATCH) {
				/*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
				bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);
				s.lookahead -= s.match_length;
				s.strstart += s.match_length;
				s.match_length = 0;
			} else {
				/*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
				bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
				s.lookahead--;
				s.strstart++;
			}
			if (bflush) {
				/*** FLUSH_BLOCK(s, 0); ***/
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
		}
		s.insert = 0;
		if (flush === Z_FINISH) {
			/*** FLUSH_BLOCK(s, 1); ***/
			flush_block_only(s, true);
			if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
			return BS_FINISH_DONE;
		}
		if (s.last_lit) {
			/*** FLUSH_BLOCK(s, 0); ***/
			flush_block_only(s, false);
			if (s.strm.avail_out === 0) return BS_NEED_MORE;
		}
		return BS_BLOCK_DONE;
	}
	function deflate_huff(s, flush) {
		var bflush;
		for (;;) {
			if (s.lookahead === 0) {
				fill_window(s);
				if (s.lookahead === 0) {
					if (flush === Z_NO_FLUSH) return BS_NEED_MORE;
					break;
				}
			}
			s.match_length = 0;
			/*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
			bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
			s.lookahead--;
			s.strstart++;
			if (bflush) {
				/*** FLUSH_BLOCK(s, 0); ***/
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
		}
		s.insert = 0;
		if (flush === Z_FINISH) {
			/*** FLUSH_BLOCK(s, 1); ***/
			flush_block_only(s, true);
			if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
			return BS_FINISH_DONE;
		}
		if (s.last_lit) {
			/*** FLUSH_BLOCK(s, 0); ***/
			flush_block_only(s, false);
			if (s.strm.avail_out === 0) return BS_NEED_MORE;
		}
		return BS_BLOCK_DONE;
	}
	function Config(good_length, max_lazy, nice_length, max_chain, func) {
		this.good_length = good_length;
		this.max_lazy = max_lazy;
		this.nice_length = nice_length;
		this.max_chain = max_chain;
		this.func = func;
	}
	var configuration_table = [
		new Config(0, 0, 0, 0, deflate_stored),
		new Config(4, 4, 8, 4, deflate_fast),
		new Config(4, 5, 16, 8, deflate_fast),
		new Config(4, 6, 32, 32, deflate_fast),
		new Config(4, 4, 16, 16, deflate_slow),
		new Config(8, 16, 32, 32, deflate_slow),
		new Config(8, 16, 128, 128, deflate_slow),
		new Config(8, 32, 128, 256, deflate_slow),
		new Config(32, 128, 258, 1024, deflate_slow),
		new Config(32, 258, 258, 4096, deflate_slow)
	];
	function lm_init(s) {
		s.window_size = 2 * s.w_size;
		/*** CLEAR_HASH(s); ***/
		zero(s.head);
		s.max_lazy_match = configuration_table[s.level].max_lazy;
		s.good_match = configuration_table[s.level].good_length;
		s.nice_match = configuration_table[s.level].nice_length;
		s.max_chain_length = configuration_table[s.level].max_chain;
		s.strstart = 0;
		s.block_start = 0;
		s.lookahead = 0;
		s.insert = 0;
		s.match_length = s.prev_length = MIN_MATCH - 1;
		s.match_available = 0;
		s.ins_h = 0;
	}
	function DeflateState() {
		this.strm = null;
		this.status = 0;
		this.pending_buf = null;
		this.pending_buf_size = 0;
		this.pending_out = 0;
		this.pending = 0;
		this.wrap = 0;
		this.gzhead = null;
		this.gzindex = 0;
		this.method = Z_DEFLATED;
		this.last_flush = -1;
		this.w_size = 0;
		this.w_bits = 0;
		this.w_mask = 0;
		this.window = null;
		this.window_size = 0;
		this.prev = null;
		this.head = null;
		this.ins_h = 0;
		this.hash_size = 0;
		this.hash_bits = 0;
		this.hash_mask = 0;
		this.hash_shift = 0;
		this.block_start = 0;
		this.match_length = 0;
		this.prev_match = 0;
		this.match_available = 0;
		this.strstart = 0;
		this.match_start = 0;
		this.lookahead = 0;
		this.prev_length = 0;
		this.max_chain_length = 0;
		this.max_lazy_match = 0;
		this.level = 0;
		this.strategy = 0;
		this.good_match = 0;
		this.nice_match = 0;
		this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
		this.dyn_dtree = new utils.Buf16((2 * D_CODES + 1) * 2);
		this.bl_tree = new utils.Buf16((2 * BL_CODES + 1) * 2);
		zero(this.dyn_ltree);
		zero(this.dyn_dtree);
		zero(this.bl_tree);
		this.l_desc = null;
		this.d_desc = null;
		this.bl_desc = null;
		this.bl_count = new utils.Buf16(MAX_BITS + 1);
		this.heap = new utils.Buf16(2 * L_CODES + 1);
		zero(this.heap);
		this.heap_len = 0;
		this.heap_max = 0;
		this.depth = new utils.Buf16(2 * L_CODES + 1);
		zero(this.depth);
		this.l_buf = 0;
		this.lit_bufsize = 0;
		this.last_lit = 0;
		this.d_buf = 0;
		this.opt_len = 0;
		this.static_len = 0;
		this.matches = 0;
		this.insert = 0;
		this.bi_buf = 0;
		this.bi_valid = 0;
	}
	function deflateResetKeep(strm) {
		var s;
		if (!strm || !strm.state) return err(strm, Z_STREAM_ERROR);
		strm.total_in = strm.total_out = 0;
		strm.data_type = Z_UNKNOWN;
		s = strm.state;
		s.pending = 0;
		s.pending_out = 0;
		if (s.wrap < 0) s.wrap = -s.wrap;
		s.status = s.wrap ? INIT_STATE : BUSY_STATE;
		strm.adler = s.wrap === 2 ? 0 : 1;
		s.last_flush = Z_NO_FLUSH;
		trees._tr_init(s);
		return Z_OK;
	}
	function deflateReset(strm) {
		var ret = deflateResetKeep(strm);
		if (ret === Z_OK) lm_init(strm.state);
		return ret;
	}
	function deflateSetHeader(strm, head) {
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		if (strm.state.wrap !== 2) return Z_STREAM_ERROR;
		strm.state.gzhead = head;
		return Z_OK;
	}
	function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
		if (!strm) return Z_STREAM_ERROR;
		var wrap = 1;
		if (level === Z_DEFAULT_COMPRESSION) level = 6;
		if (windowBits < 0) {
			wrap = 0;
			windowBits = -windowBits;
		} else if (windowBits > 15) {
			wrap = 2;
			windowBits -= 16;
		}
		if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) return err(strm, Z_STREAM_ERROR);
		if (windowBits === 8) windowBits = 9;
		var s = new DeflateState();
		strm.state = s;
		s.strm = strm;
		s.wrap = wrap;
		s.gzhead = null;
		s.w_bits = windowBits;
		s.w_size = 1 << s.w_bits;
		s.w_mask = s.w_size - 1;
		s.hash_bits = memLevel + 7;
		s.hash_size = 1 << s.hash_bits;
		s.hash_mask = s.hash_size - 1;
		s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
		s.window = new utils.Buf8(s.w_size * 2);
		s.head = new utils.Buf16(s.hash_size);
		s.prev = new utils.Buf16(s.w_size);
		s.lit_bufsize = 1 << memLevel + 6;
		s.pending_buf_size = s.lit_bufsize * 4;
		s.pending_buf = new utils.Buf8(s.pending_buf_size);
		s.d_buf = 1 * s.lit_bufsize;
		s.l_buf = 3 * s.lit_bufsize;
		s.level = level;
		s.strategy = strategy;
		s.method = method;
		return deflateReset(strm);
	}
	function deflateInit(strm, level) {
		return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
	}
	function deflate(strm, flush) {
		var old_flush, s;
		var beg, val;
		if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
		s = strm.state;
		if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
		s.strm = strm;
		old_flush = s.last_flush;
		s.last_flush = flush;
		if (s.status === INIT_STATE) if (s.wrap === 2) {
			strm.adler = 0;
			put_byte(s, 31);
			put_byte(s, 139);
			put_byte(s, 8);
			if (!s.gzhead) {
				put_byte(s, 0);
				put_byte(s, 0);
				put_byte(s, 0);
				put_byte(s, 0);
				put_byte(s, 0);
				put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
				put_byte(s, OS_CODE);
				s.status = BUSY_STATE;
			} else {
				put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16));
				put_byte(s, s.gzhead.time & 255);
				put_byte(s, s.gzhead.time >> 8 & 255);
				put_byte(s, s.gzhead.time >> 16 & 255);
				put_byte(s, s.gzhead.time >> 24 & 255);
				put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
				put_byte(s, s.gzhead.os & 255);
				if (s.gzhead.extra && s.gzhead.extra.length) {
					put_byte(s, s.gzhead.extra.length & 255);
					put_byte(s, s.gzhead.extra.length >> 8 & 255);
				}
				if (s.gzhead.hcrc) strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
				s.gzindex = 0;
				s.status = EXTRA_STATE;
			}
		} else {
			var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
			var level_flags = -1;
			if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) level_flags = 0;
			else if (s.level < 6) level_flags = 1;
			else if (s.level === 6) level_flags = 2;
			else level_flags = 3;
			header |= level_flags << 6;
			if (s.strstart !== 0) header |= PRESET_DICT;
			header += 31 - header % 31;
			s.status = BUSY_STATE;
			putShortMSB(s, header);
			if (s.strstart !== 0) {
				putShortMSB(s, strm.adler >>> 16);
				putShortMSB(s, strm.adler & 65535);
			}
			strm.adler = 1;
		}
		if (s.status === EXTRA_STATE) if (s.gzhead.extra) {
			beg = s.pending;
			while (s.gzindex < (s.gzhead.extra.length & 65535)) {
				if (s.pending === s.pending_buf_size) {
					if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
					flush_pending(strm);
					beg = s.pending;
					if (s.pending === s.pending_buf_size) break;
				}
				put_byte(s, s.gzhead.extra[s.gzindex] & 255);
				s.gzindex++;
			}
			if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
			if (s.gzindex === s.gzhead.extra.length) {
				s.gzindex = 0;
				s.status = NAME_STATE;
			}
		} else s.status = NAME_STATE;
		if (s.status === NAME_STATE) if (s.gzhead.name) {
			beg = s.pending;
			do {
				if (s.pending === s.pending_buf_size) {
					if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
					flush_pending(strm);
					beg = s.pending;
					if (s.pending === s.pending_buf_size) {
						val = 1;
						break;
					}
				}
				if (s.gzindex < s.gzhead.name.length) val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
				else val = 0;
				put_byte(s, val);
			} while (val !== 0);
			if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
			if (val === 0) {
				s.gzindex = 0;
				s.status = COMMENT_STATE;
			}
		} else s.status = COMMENT_STATE;
		if (s.status === COMMENT_STATE) if (s.gzhead.comment) {
			beg = s.pending;
			do {
				if (s.pending === s.pending_buf_size) {
					if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
					flush_pending(strm);
					beg = s.pending;
					if (s.pending === s.pending_buf_size) {
						val = 1;
						break;
					}
				}
				if (s.gzindex < s.gzhead.comment.length) val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
				else val = 0;
				put_byte(s, val);
			} while (val !== 0);
			if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
			if (val === 0) s.status = HCRC_STATE;
		} else s.status = HCRC_STATE;
		if (s.status === HCRC_STATE) if (s.gzhead.hcrc) {
			if (s.pending + 2 > s.pending_buf_size) flush_pending(strm);
			if (s.pending + 2 <= s.pending_buf_size) {
				put_byte(s, strm.adler & 255);
				put_byte(s, strm.adler >> 8 & 255);
				strm.adler = 0;
				s.status = BUSY_STATE;
			}
		} else s.status = BUSY_STATE;
		if (s.pending !== 0) {
			flush_pending(strm);
			if (strm.avail_out === 0) {
				s.last_flush = -1;
				return Z_OK;
			}
		} else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) return err(strm, Z_BUF_ERROR);
		if (s.status === FINISH_STATE && strm.avail_in !== 0) return err(strm, Z_BUF_ERROR);
		if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
			var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
			if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) s.status = FINISH_STATE;
			if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
				if (strm.avail_out === 0) s.last_flush = -1;
				return Z_OK;
			}
			if (bstate === BS_BLOCK_DONE) {
				if (flush === Z_PARTIAL_FLUSH) trees._tr_align(s);
				else if (flush !== Z_BLOCK) {
					trees._tr_stored_block(s, 0, 0, false);
					if (flush === Z_FULL_FLUSH) {
						/*** CLEAR_HASH(s); ***/ zero(s.head);
						if (s.lookahead === 0) {
							s.strstart = 0;
							s.block_start = 0;
							s.insert = 0;
						}
					}
				}
				flush_pending(strm);
				if (strm.avail_out === 0) {
					s.last_flush = -1;
					return Z_OK;
				}
			}
		}
		if (flush !== Z_FINISH) return Z_OK;
		if (s.wrap <= 0) return Z_STREAM_END;
		if (s.wrap === 2) {
			put_byte(s, strm.adler & 255);
			put_byte(s, strm.adler >> 8 & 255);
			put_byte(s, strm.adler >> 16 & 255);
			put_byte(s, strm.adler >> 24 & 255);
			put_byte(s, strm.total_in & 255);
			put_byte(s, strm.total_in >> 8 & 255);
			put_byte(s, strm.total_in >> 16 & 255);
			put_byte(s, strm.total_in >> 24 & 255);
		} else {
			putShortMSB(s, strm.adler >>> 16);
			putShortMSB(s, strm.adler & 65535);
		}
		flush_pending(strm);
		if (s.wrap > 0) s.wrap = -s.wrap;
		return s.pending !== 0 ? Z_OK : Z_STREAM_END;
	}
	function deflateEnd(strm) {
		var status;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		status = strm.state.status;
		if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) return err(strm, Z_STREAM_ERROR);
		strm.state = null;
		return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
	}
	function deflateSetDictionary(strm, dictionary) {
		var dictLength = dictionary.length;
		var s;
		var str, n;
		var wrap;
		var avail;
		var next;
		var input;
		var tmpDict;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		s = strm.state;
		wrap = s.wrap;
		if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) return Z_STREAM_ERROR;
		if (wrap === 1) strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
		s.wrap = 0;
		if (dictLength >= s.w_size) {
			if (wrap === 0) {
				/*** CLEAR_HASH(s); ***/
				zero(s.head);
				s.strstart = 0;
				s.block_start = 0;
				s.insert = 0;
			}
			tmpDict = new utils.Buf8(s.w_size);
			utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
			dictionary = tmpDict;
			dictLength = s.w_size;
		}
		avail = strm.avail_in;
		next = strm.next_in;
		input = strm.input;
		strm.avail_in = dictLength;
		strm.next_in = 0;
		strm.input = dictionary;
		fill_window(s);
		while (s.lookahead >= MIN_MATCH) {
			str = s.strstart;
			n = s.lookahead - (MIN_MATCH - 1);
			do {
				s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
				s.prev[str & s.w_mask] = s.head[s.ins_h];
				s.head[s.ins_h] = str;
				str++;
			} while (--n);
			s.strstart = str;
			s.lookahead = MIN_MATCH - 1;
			fill_window(s);
		}
		s.strstart += s.lookahead;
		s.block_start = s.strstart;
		s.insert = s.lookahead;
		s.lookahead = 0;
		s.match_length = s.prev_length = MIN_MATCH - 1;
		s.match_available = 0;
		strm.next_in = next;
		strm.input = input;
		strm.avail_in = avail;
		s.wrap = wrap;
		return Z_OK;
	}
	exports.deflateInit = deflateInit;
	exports.deflateInit2 = deflateInit2;
	exports.deflateReset = deflateReset;
	exports.deflateResetKeep = deflateResetKeep;
	exports.deflateSetHeader = deflateSetHeader;
	exports.deflate = deflate;
	exports.deflateEnd = deflateEnd;
	exports.deflateSetDictionary = deflateSetDictionary;
	exports.deflateInfo = "pako deflate (from Nodeca project)";
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/utils/strings.js
var require_strings = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utils = require_common();
	var STR_APPLY_OK = true;
	var STR_APPLY_UIA_OK = true;
	try {
		String.fromCharCode.apply(null, [0]);
	} catch (__) {
		STR_APPLY_OK = false;
	}
	try {
		String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1));
	} catch (__) {
		STR_APPLY_UIA_OK = false;
	}
	var _utf8len = new utils.Buf8(256);
	for (var q = 0; q < 256; q++) _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
	_utf8len[254] = _utf8len[254] = 1;
	exports.string2buf = function(str) {
		var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
		for (m_pos = 0; m_pos < str_len; m_pos++) {
			c = str.charCodeAt(m_pos);
			if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
				c2 = str.charCodeAt(m_pos + 1);
				if ((c2 & 64512) === 56320) {
					c = 65536 + (c - 55296 << 10) + (c2 - 56320);
					m_pos++;
				}
			}
			buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
		}
		buf = new utils.Buf8(buf_len);
		for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
			c = str.charCodeAt(m_pos);
			if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
				c2 = str.charCodeAt(m_pos + 1);
				if ((c2 & 64512) === 56320) {
					c = 65536 + (c - 55296 << 10) + (c2 - 56320);
					m_pos++;
				}
			}
			if (c < 128) buf[i++] = c;
			else if (c < 2048) {
				buf[i++] = 192 | c >>> 6;
				buf[i++] = 128 | c & 63;
			} else if (c < 65536) {
				buf[i++] = 224 | c >>> 12;
				buf[i++] = 128 | c >>> 6 & 63;
				buf[i++] = 128 | c & 63;
			} else {
				buf[i++] = 240 | c >>> 18;
				buf[i++] = 128 | c >>> 12 & 63;
				buf[i++] = 128 | c >>> 6 & 63;
				buf[i++] = 128 | c & 63;
			}
		}
		return buf;
	};
	function buf2binstring(buf, len) {
		if (len < 65534) {
			if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
		}
		var result = "";
		for (var i = 0; i < len; i++) result += String.fromCharCode(buf[i]);
		return result;
	}
	exports.buf2binstring = function(buf) {
		return buf2binstring(buf, buf.length);
	};
	exports.binstring2buf = function(str) {
		var buf = new utils.Buf8(str.length);
		for (var i = 0, len = buf.length; i < len; i++) buf[i] = str.charCodeAt(i);
		return buf;
	};
	exports.buf2string = function(buf, max) {
		var i, out, c, c_len;
		var len = max || buf.length;
		var utf16buf = new Array(len * 2);
		for (out = 0, i = 0; i < len;) {
			c = buf[i++];
			if (c < 128) {
				utf16buf[out++] = c;
				continue;
			}
			c_len = _utf8len[c];
			if (c_len > 4) {
				utf16buf[out++] = 65533;
				i += c_len - 1;
				continue;
			}
			c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
			while (c_len > 1 && i < len) {
				c = c << 6 | buf[i++] & 63;
				c_len--;
			}
			if (c_len > 1) {
				utf16buf[out++] = 65533;
				continue;
			}
			if (c < 65536) utf16buf[out++] = c;
			else {
				c -= 65536;
				utf16buf[out++] = 55296 | c >> 10 & 1023;
				utf16buf[out++] = 56320 | c & 1023;
			}
		}
		return buf2binstring(utf16buf, out);
	};
	exports.utf8border = function(buf, max) {
		var pos;
		max = max || buf.length;
		if (max > buf.length) max = buf.length;
		pos = max - 1;
		while (pos >= 0 && (buf[pos] & 192) === 128) pos--;
		if (pos < 0) return max;
		if (pos === 0) return max;
		return pos + _utf8len[buf[pos]] > max ? pos : max;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/zstream.js
var require_zstream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function ZStream() {
		this.input = null;
		this.next_in = 0;
		this.avail_in = 0;
		this.total_in = 0;
		this.output = null;
		this.next_out = 0;
		this.avail_out = 0;
		this.total_out = 0;
		this.msg = "";
		this.state = null;
		this.data_type = 2;
		this.adler = 0;
	}
	module.exports = ZStream;
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/deflate.js
var require_deflate = /* @__PURE__ */ __commonJSMin(((exports) => {
	var zlib_deflate = require_deflate$1();
	var utils = require_common();
	var strings = require_strings();
	var msg = require_messages();
	var ZStream = require_zstream();
	var toString = Object.prototype.toString;
	var Z_NO_FLUSH = 0;
	var Z_FINISH = 4;
	var Z_OK = 0;
	var Z_STREAM_END = 1;
	var Z_SYNC_FLUSH = 2;
	var Z_DEFAULT_COMPRESSION = -1;
	var Z_DEFAULT_STRATEGY = 0;
	var Z_DEFLATED = 8;
	/**
	* class Deflate
	*
	* Generic JS-style wrapper for zlib calls. If you don't need
	* streaming behaviour - use more simple functions: [[deflate]],
	* [[deflateRaw]] and [[gzip]].
	**/
	/**
	* Deflate.result -> Uint8Array|Array
	*
	* Compressed result, generated by default [[Deflate#onData]]
	* and [[Deflate#onEnd]] handlers. Filled after you push last chunk
	* (call [[Deflate#push]] with `Z_FINISH` / `true` param)  or if you
	* push a chunk with explicit flush (call [[Deflate#push]] with
	* `Z_SYNC_FLUSH` param).
	**/
	/**
	* Deflate.err -> Number
	*
	* Error code after deflate finished. 0 (Z_OK) on success.
	* You will not need it in real life, because deflate errors
	* are possible only on wrong options or bad `onData` / `onEnd`
	* custom handlers.
	**/
	/**
	* Deflate.msg -> String
	*
	* Error message, if [[Deflate.err]] != 0
	**/
	/**
	* new Deflate(options)
	* - options (Object): zlib deflate options.
	*
	* Creates new deflator instance with specified params. Throws exception
	* on bad params. Supported options:
	*
	* - `level`
	* - `windowBits`
	* - `memLevel`
	* - `strategy`
	* - `dictionary`
	*
	* [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
	* for more information on these.
	*
	* Additional options, for internal needs:
	*
	* - `chunkSize` - size of generated data chunks (16K by default)
	* - `raw` (Boolean) - do raw deflate
	* - `gzip` (Boolean) - create gzip wrapper
	* - `to` (String) - if equal to 'string', then result will be "binary string"
	*    (each char code [0..255])
	* - `header` (Object) - custom header for gzip
	*   - `text` (Boolean) - true if compressed data believed to be text
	*   - `time` (Number) - modification time, unix timestamp
	*   - `os` (Number) - operation system code
	*   - `extra` (Array) - array of bytes with extra data (max 65536)
	*   - `name` (String) - file name (binary string)
	*   - `comment` (String) - comment (binary string)
	*   - `hcrc` (Boolean) - true if header crc should be added
	*
	* ##### Example:
	*
	* ```javascript
	* var pako = require('pako')
	*   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
	*   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
	*
	* var deflate = new pako.Deflate({ level: 3});
	*
	* deflate.push(chunk1, false);
	* deflate.push(chunk2, true);  // true -> last chunk
	*
	* if (deflate.err) { throw new Error(deflate.err); }
	*
	* console.log(deflate.result);
	* ```
	**/
	function Deflate(options) {
		if (!(this instanceof Deflate)) return new Deflate(options);
		this.options = utils.assign({
			level: Z_DEFAULT_COMPRESSION,
			method: Z_DEFLATED,
			chunkSize: 16384,
			windowBits: 15,
			memLevel: 8,
			strategy: Z_DEFAULT_STRATEGY,
			to: ""
		}, options || {});
		var opt = this.options;
		if (opt.raw && opt.windowBits > 0) opt.windowBits = -opt.windowBits;
		else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) opt.windowBits += 16;
		this.err = 0;
		this.msg = "";
		this.ended = false;
		this.chunks = [];
		this.strm = new ZStream();
		this.strm.avail_out = 0;
		var status = zlib_deflate.deflateInit2(this.strm, opt.level, opt.method, opt.windowBits, opt.memLevel, opt.strategy);
		if (status !== Z_OK) throw new Error(msg[status]);
		if (opt.header) zlib_deflate.deflateSetHeader(this.strm, opt.header);
		if (opt.dictionary) {
			var dict;
			if (typeof opt.dictionary === "string") dict = strings.string2buf(opt.dictionary);
			else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") dict = new Uint8Array(opt.dictionary);
			else dict = opt.dictionary;
			status = zlib_deflate.deflateSetDictionary(this.strm, dict);
			if (status !== Z_OK) throw new Error(msg[status]);
			this._dict_set = true;
		}
	}
	/**
	* Deflate#push(data[, mode]) -> Boolean
	* - data (Uint8Array|Array|ArrayBuffer|String): input data. Strings will be
	*   converted to utf8 byte sequence.
	* - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
	*   See constants. Skipped or `false` means Z_NO_FLUSH, `true` means Z_FINISH.
	*
	* Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
	* new compressed chunks. Returns `true` on success. The last data block must have
	* mode Z_FINISH (or `true`). That will flush internal pending buffers and call
	* [[Deflate#onEnd]]. For interim explicit flushes (without ending the stream) you
	* can use mode Z_SYNC_FLUSH, keeping the compression context.
	*
	* On fail call [[Deflate#onEnd]] with error code and return false.
	*
	* We strongly recommend to use `Uint8Array` on input for best speed (output
	* array format is detected automatically). Also, don't skip last param and always
	* use the same type in your code (boolean or number). That will improve JS speed.
	*
	* For regular `Array`-s make sure all elements are [0..255].
	*
	* ##### Example
	*
	* ```javascript
	* push(chunk, false); // push one of data chunks
	* ...
	* push(chunk, true);  // push last chunk
	* ```
	**/
	Deflate.prototype.push = function(data, mode) {
		var strm = this.strm;
		var chunkSize = this.options.chunkSize;
		var status, _mode;
		if (this.ended) return false;
		_mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
		if (typeof data === "string") strm.input = strings.string2buf(data);
		else if (toString.call(data) === "[object ArrayBuffer]") strm.input = new Uint8Array(data);
		else strm.input = data;
		strm.next_in = 0;
		strm.avail_in = strm.input.length;
		do {
			if (strm.avail_out === 0) {
				strm.output = new utils.Buf8(chunkSize);
				strm.next_out = 0;
				strm.avail_out = chunkSize;
			}
			status = zlib_deflate.deflate(strm, _mode);
			if (status !== Z_STREAM_END && status !== Z_OK) {
				this.onEnd(status);
				this.ended = true;
				return false;
			}
			if (strm.avail_out === 0 || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) if (this.options.to === "string") this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
			else this.onData(utils.shrinkBuf(strm.output, strm.next_out));
		} while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
		if (_mode === Z_FINISH) {
			status = zlib_deflate.deflateEnd(this.strm);
			this.onEnd(status);
			this.ended = true;
			return status === Z_OK;
		}
		if (_mode === Z_SYNC_FLUSH) {
			this.onEnd(Z_OK);
			strm.avail_out = 0;
			return true;
		}
		return true;
	};
	/**
	* Deflate#onData(chunk) -> Void
	* - chunk (Uint8Array|Array|String): output data. Type of array depends
	*   on js engine support. When string output requested, each chunk
	*   will be string.
	*
	* By default, stores data blocks in `chunks[]` property and glue
	* those in `onEnd`. Override this handler, if you need another behaviour.
	**/
	Deflate.prototype.onData = function(chunk) {
		this.chunks.push(chunk);
	};
	/**
	* Deflate#onEnd(status) -> Void
	* - status (Number): deflate status. 0 (Z_OK) on success,
	*   other if not.
	*
	* Called once after you tell deflate that the input stream is
	* complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
	* or if an error happened. By default - join collected chunks,
	* free memory and fill `results` / `err` properties.
	**/
	Deflate.prototype.onEnd = function(status) {
		if (status === Z_OK) if (this.options.to === "string") this.result = this.chunks.join("");
		else this.result = utils.flattenChunks(this.chunks);
		this.chunks = [];
		this.err = status;
		this.msg = this.strm.msg;
	};
	/**
	* deflate(data[, options]) -> Uint8Array|Array|String
	* - data (Uint8Array|Array|String): input data to compress.
	* - options (Object): zlib deflate options.
	*
	* Compress `data` with deflate algorithm and `options`.
	*
	* Supported options are:
	*
	* - level
	* - windowBits
	* - memLevel
	* - strategy
	* - dictionary
	*
	* [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
	* for more information on these.
	*
	* Sugar (options):
	*
	* - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
	*   negative windowBits implicitly.
	* - `to` (String) - if equal to 'string', then result will be "binary string"
	*    (each char code [0..255])
	*
	* ##### Example:
	*
	* ```javascript
	* var pako = require('pako')
	*   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
	*
	* console.log(pako.deflate(data));
	* ```
	**/
	function deflate(input, options) {
		var deflator = new Deflate(options);
		deflator.push(input, true);
		if (deflator.err) throw deflator.msg || msg[deflator.err];
		return deflator.result;
	}
	/**
	* deflateRaw(data[, options]) -> Uint8Array|Array|String
	* - data (Uint8Array|Array|String): input data to compress.
	* - options (Object): zlib deflate options.
	*
	* The same as [[deflate]], but creates raw data, without wrapper
	* (header and adler32 crc).
	**/
	function deflateRaw(input, options) {
		options = options || {};
		options.raw = true;
		return deflate(input, options);
	}
	/**
	* gzip(data[, options]) -> Uint8Array|Array|String
	* - data (Uint8Array|Array|String): input data to compress.
	* - options (Object): zlib deflate options.
	*
	* The same as [[deflate]], but create gzip wrapper instead of
	* deflate one.
	**/
	function gzip(input, options) {
		options = options || {};
		options.gzip = true;
		return deflate(input, options);
	}
	exports.Deflate = Deflate;
	exports.deflate = deflate;
	exports.deflateRaw = deflateRaw;
	exports.gzip = gzip;
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/inffast.js
var require_inffast = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var BAD = 30;
	var TYPE = 12;
	module.exports = function inflate_fast(strm, start) {
		var state;
		var _in;
		var last;
		var _out;
		var beg;
		var end;
		var dmax;
		var wsize;
		var whave;
		var wnext;
		var s_window;
		var hold;
		var bits;
		var lcode;
		var dcode;
		var lmask;
		var dmask;
		var here;
		var op;
		var len;
		var dist;
		var from;
		var from_source;
		var input, output;
		state = strm.state;
		_in = strm.next_in;
		input = strm.input;
		last = _in + (strm.avail_in - 5);
		_out = strm.next_out;
		output = strm.output;
		beg = _out - (start - strm.avail_out);
		end = _out + (strm.avail_out - 257);
		dmax = state.dmax;
		wsize = state.wsize;
		whave = state.whave;
		wnext = state.wnext;
		s_window = state.window;
		hold = state.hold;
		bits = state.bits;
		lcode = state.lencode;
		dcode = state.distcode;
		lmask = (1 << state.lenbits) - 1;
		dmask = (1 << state.distbits) - 1;
		top: do {
			if (bits < 15) {
				hold += input[_in++] << bits;
				bits += 8;
				hold += input[_in++] << bits;
				bits += 8;
			}
			here = lcode[hold & lmask];
			dolen: for (;;) {
				op = here >>> 24;
				hold >>>= op;
				bits -= op;
				op = here >>> 16 & 255;
				if (op === 0) output[_out++] = here & 65535;
				else if (op & 16) {
					len = here & 65535;
					op &= 15;
					if (op) {
						if (bits < op) {
							hold += input[_in++] << bits;
							bits += 8;
						}
						len += hold & (1 << op) - 1;
						hold >>>= op;
						bits -= op;
					}
					if (bits < 15) {
						hold += input[_in++] << bits;
						bits += 8;
						hold += input[_in++] << bits;
						bits += 8;
					}
					here = dcode[hold & dmask];
					dodist: for (;;) {
						op = here >>> 24;
						hold >>>= op;
						bits -= op;
						op = here >>> 16 & 255;
						if (op & 16) {
							dist = here & 65535;
							op &= 15;
							if (bits < op) {
								hold += input[_in++] << bits;
								bits += 8;
								if (bits < op) {
									hold += input[_in++] << bits;
									bits += 8;
								}
							}
							dist += hold & (1 << op) - 1;
							if (dist > dmax) {
								strm.msg = "invalid distance too far back";
								state.mode = BAD;
								break top;
							}
							hold >>>= op;
							bits -= op;
							op = _out - beg;
							if (dist > op) {
								op = dist - op;
								if (op > whave) {
									if (state.sane) {
										strm.msg = "invalid distance too far back";
										state.mode = BAD;
										break top;
									}
								}
								from = 0;
								from_source = s_window;
								if (wnext === 0) {
									from += wsize - op;
									if (op < len) {
										len -= op;
										do
											output[_out++] = s_window[from++];
										while (--op);
										from = _out - dist;
										from_source = output;
									}
								} else if (wnext < op) {
									from += wsize + wnext - op;
									op -= wnext;
									if (op < len) {
										len -= op;
										do
											output[_out++] = s_window[from++];
										while (--op);
										from = 0;
										if (wnext < len) {
											op = wnext;
											len -= op;
											do
												output[_out++] = s_window[from++];
											while (--op);
											from = _out - dist;
											from_source = output;
										}
									}
								} else {
									from += wnext - op;
									if (op < len) {
										len -= op;
										do
											output[_out++] = s_window[from++];
										while (--op);
										from = _out - dist;
										from_source = output;
									}
								}
								while (len > 2) {
									output[_out++] = from_source[from++];
									output[_out++] = from_source[from++];
									output[_out++] = from_source[from++];
									len -= 3;
								}
								if (len) {
									output[_out++] = from_source[from++];
									if (len > 1) output[_out++] = from_source[from++];
								}
							} else {
								from = _out - dist;
								do {
									output[_out++] = output[from++];
									output[_out++] = output[from++];
									output[_out++] = output[from++];
									len -= 3;
								} while (len > 2);
								if (len) {
									output[_out++] = output[from++];
									if (len > 1) output[_out++] = output[from++];
								}
							}
						} else if ((op & 64) === 0) {
							here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
							continue dodist;
						} else {
							strm.msg = "invalid distance code";
							state.mode = BAD;
							break top;
						}
						break;
					}
				} else if ((op & 64) === 0) {
					here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
					continue dolen;
				} else if (op & 32) {
					state.mode = TYPE;
					break top;
				} else {
					strm.msg = "invalid literal/length code";
					state.mode = BAD;
					break top;
				}
				break;
			}
		} while (_in < last && _out < end);
		len = bits >> 3;
		_in -= len;
		bits -= len << 3;
		hold &= (1 << bits) - 1;
		strm.next_in = _in;
		strm.next_out = _out;
		strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
		strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
		state.hold = hold;
		state.bits = bits;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/inftrees.js
var require_inftrees = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_common();
	var MAXBITS = 15;
	var ENOUGH_LENS = 852;
	var ENOUGH_DISTS = 592;
	var CODES = 0;
	var LENS = 1;
	var DISTS = 2;
	var lbase = [
		3,
		4,
		5,
		6,
		7,
		8,
		9,
		10,
		11,
		13,
		15,
		17,
		19,
		23,
		27,
		31,
		35,
		43,
		51,
		59,
		67,
		83,
		99,
		115,
		131,
		163,
		195,
		227,
		258,
		0,
		0
	];
	var lext = [
		16,
		16,
		16,
		16,
		16,
		16,
		16,
		16,
		17,
		17,
		17,
		17,
		18,
		18,
		18,
		18,
		19,
		19,
		19,
		19,
		20,
		20,
		20,
		20,
		21,
		21,
		21,
		21,
		16,
		72,
		78
	];
	var dbase = [
		1,
		2,
		3,
		4,
		5,
		7,
		9,
		13,
		17,
		25,
		33,
		49,
		65,
		97,
		129,
		193,
		257,
		385,
		513,
		769,
		1025,
		1537,
		2049,
		3073,
		4097,
		6145,
		8193,
		12289,
		16385,
		24577,
		0,
		0
	];
	var dext = [
		16,
		16,
		16,
		16,
		17,
		17,
		18,
		18,
		19,
		19,
		20,
		20,
		21,
		21,
		22,
		22,
		23,
		23,
		24,
		24,
		25,
		25,
		26,
		26,
		27,
		27,
		28,
		28,
		29,
		29,
		64,
		64
	];
	module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
		var bits = opts.bits;
		var len = 0;
		var sym = 0;
		var min = 0, max = 0;
		var root = 0;
		var curr = 0;
		var drop = 0;
		var left = 0;
		var used = 0;
		var huff = 0;
		var incr;
		var fill;
		var low;
		var mask;
		var next;
		var base = null;
		var base_index = 0;
		var end;
		var count = new utils.Buf16(MAXBITS + 1);
		var offs = new utils.Buf16(MAXBITS + 1);
		var extra = null;
		var extra_index = 0;
		var here_bits, here_op, here_val;
		for (len = 0; len <= MAXBITS; len++) count[len] = 0;
		for (sym = 0; sym < codes; sym++) count[lens[lens_index + sym]]++;
		root = bits;
		for (max = MAXBITS; max >= 1; max--) if (count[max] !== 0) break;
		if (root > max) root = max;
		if (max === 0) {
			table[table_index++] = 20971520;
			table[table_index++] = 20971520;
			opts.bits = 1;
			return 0;
		}
		for (min = 1; min < max; min++) if (count[min] !== 0) break;
		if (root < min) root = min;
		left = 1;
		for (len = 1; len <= MAXBITS; len++) {
			left <<= 1;
			left -= count[len];
			if (left < 0) return -1;
		}
		if (left > 0 && (type === CODES || max !== 1)) return -1;
		offs[1] = 0;
		for (len = 1; len < MAXBITS; len++) offs[len + 1] = offs[len] + count[len];
		for (sym = 0; sym < codes; sym++) if (lens[lens_index + sym] !== 0) work[offs[lens[lens_index + sym]]++] = sym;
		if (type === CODES) {
			base = extra = work;
			end = 19;
		} else if (type === LENS) {
			base = lbase;
			base_index -= 257;
			extra = lext;
			extra_index -= 257;
			end = 256;
		} else {
			base = dbase;
			extra = dext;
			end = -1;
		}
		huff = 0;
		sym = 0;
		len = min;
		next = table_index;
		curr = root;
		drop = 0;
		low = -1;
		used = 1 << root;
		mask = used - 1;
		if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) return 1;
		for (;;) {
			here_bits = len - drop;
			if (work[sym] < end) {
				here_op = 0;
				here_val = work[sym];
			} else if (work[sym] > end) {
				here_op = extra[extra_index + work[sym]];
				here_val = base[base_index + work[sym]];
			} else {
				here_op = 96;
				here_val = 0;
			}
			incr = 1 << len - drop;
			fill = 1 << curr;
			min = fill;
			do {
				fill -= incr;
				table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
			} while (fill !== 0);
			incr = 1 << len - 1;
			while (huff & incr) incr >>= 1;
			if (incr !== 0) {
				huff &= incr - 1;
				huff += incr;
			} else huff = 0;
			sym++;
			if (--count[len] === 0) {
				if (len === max) break;
				len = lens[lens_index + work[sym]];
			}
			if (len > root && (huff & mask) !== low) {
				if (drop === 0) drop = root;
				next += min;
				curr = len - drop;
				left = 1 << curr;
				while (curr + drop < max) {
					left -= count[curr + drop];
					if (left <= 0) break;
					curr++;
					left <<= 1;
				}
				used += 1 << curr;
				if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) return 1;
				low = huff & mask;
				table[low] = root << 24 | curr << 16 | next - table_index | 0;
			}
		}
		if (huff !== 0) table[next + huff] = len - drop << 24 | 4194304;
		opts.bits = root;
		return 0;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/inflate.js
var require_inflate$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utils = require_common();
	var adler32 = require_adler32();
	var crc32 = require_crc32();
	var inflate_fast = require_inffast();
	var inflate_table = require_inftrees();
	var CODES = 0;
	var LENS = 1;
	var DISTS = 2;
	var Z_FINISH = 4;
	var Z_BLOCK = 5;
	var Z_TREES = 6;
	var Z_OK = 0;
	var Z_STREAM_END = 1;
	var Z_NEED_DICT = 2;
	var Z_STREAM_ERROR = -2;
	var Z_DATA_ERROR = -3;
	var Z_MEM_ERROR = -4;
	var Z_BUF_ERROR = -5;
	var Z_DEFLATED = 8;
	var HEAD = 1;
	var FLAGS = 2;
	var TIME = 3;
	var OS = 4;
	var EXLEN = 5;
	var EXTRA = 6;
	var NAME = 7;
	var COMMENT = 8;
	var HCRC = 9;
	var DICTID = 10;
	var DICT = 11;
	var TYPE = 12;
	var TYPEDO = 13;
	var STORED = 14;
	var COPY_ = 15;
	var COPY = 16;
	var TABLE = 17;
	var LENLENS = 18;
	var CODELENS = 19;
	var LEN_ = 20;
	var LEN = 21;
	var LENEXT = 22;
	var DIST = 23;
	var DISTEXT = 24;
	var MATCH = 25;
	var LIT = 26;
	var CHECK = 27;
	var LENGTH = 28;
	var DONE = 29;
	var BAD = 30;
	var MEM = 31;
	var SYNC = 32;
	var ENOUGH_LENS = 852;
	var ENOUGH_DISTS = 592;
	var DEF_WBITS = 15;
	function zswap32(q) {
		return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
	}
	function InflateState() {
		this.mode = 0;
		this.last = false;
		this.wrap = 0;
		this.havedict = false;
		this.flags = 0;
		this.dmax = 0;
		this.check = 0;
		this.total = 0;
		this.head = null;
		this.wbits = 0;
		this.wsize = 0;
		this.whave = 0;
		this.wnext = 0;
		this.window = null;
		this.hold = 0;
		this.bits = 0;
		this.length = 0;
		this.offset = 0;
		this.extra = 0;
		this.lencode = null;
		this.distcode = null;
		this.lenbits = 0;
		this.distbits = 0;
		this.ncode = 0;
		this.nlen = 0;
		this.ndist = 0;
		this.have = 0;
		this.next = null;
		this.lens = new utils.Buf16(320);
		this.work = new utils.Buf16(288);
		this.lendyn = null;
		this.distdyn = null;
		this.sane = 0;
		this.back = 0;
		this.was = 0;
	}
	function inflateResetKeep(strm) {
		var state;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		state = strm.state;
		strm.total_in = strm.total_out = state.total = 0;
		strm.msg = "";
		if (state.wrap) strm.adler = state.wrap & 1;
		state.mode = HEAD;
		state.last = 0;
		state.havedict = 0;
		state.dmax = 32768;
		state.head = null;
		state.hold = 0;
		state.bits = 0;
		state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
		state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);
		state.sane = 1;
		state.back = -1;
		return Z_OK;
	}
	function inflateReset(strm) {
		var state;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		state = strm.state;
		state.wsize = 0;
		state.whave = 0;
		state.wnext = 0;
		return inflateResetKeep(strm);
	}
	function inflateReset2(strm, windowBits) {
		var wrap;
		var state;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		state = strm.state;
		if (windowBits < 0) {
			wrap = 0;
			windowBits = -windowBits;
		} else {
			wrap = (windowBits >> 4) + 1;
			if (windowBits < 48) windowBits &= 15;
		}
		if (windowBits && (windowBits < 8 || windowBits > 15)) return Z_STREAM_ERROR;
		if (state.window !== null && state.wbits !== windowBits) state.window = null;
		state.wrap = wrap;
		state.wbits = windowBits;
		return inflateReset(strm);
	}
	function inflateInit2(strm, windowBits) {
		var ret;
		var state;
		if (!strm) return Z_STREAM_ERROR;
		state = new InflateState();
		strm.state = state;
		state.window = null;
		ret = inflateReset2(strm, windowBits);
		if (ret !== Z_OK) strm.state = null;
		return ret;
	}
	function inflateInit(strm) {
		return inflateInit2(strm, DEF_WBITS);
	}
	var virgin = true;
	var lenfix;
	var distfix;
	function fixedtables(state) {
		if (virgin) {
			var sym;
			lenfix = new utils.Buf32(512);
			distfix = new utils.Buf32(32);
			sym = 0;
			while (sym < 144) state.lens[sym++] = 8;
			while (sym < 256) state.lens[sym++] = 9;
			while (sym < 280) state.lens[sym++] = 7;
			while (sym < 288) state.lens[sym++] = 8;
			inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
			sym = 0;
			while (sym < 32) state.lens[sym++] = 5;
			inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
			virgin = false;
		}
		state.lencode = lenfix;
		state.lenbits = 9;
		state.distcode = distfix;
		state.distbits = 5;
	}
	function updatewindow(strm, src, end, copy) {
		var dist;
		var state = strm.state;
		if (state.window === null) {
			state.wsize = 1 << state.wbits;
			state.wnext = 0;
			state.whave = 0;
			state.window = new utils.Buf8(state.wsize);
		}
		if (copy >= state.wsize) {
			utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
			state.wnext = 0;
			state.whave = state.wsize;
		} else {
			dist = state.wsize - state.wnext;
			if (dist > copy) dist = copy;
			utils.arraySet(state.window, src, end - copy, dist, state.wnext);
			copy -= dist;
			if (copy) {
				utils.arraySet(state.window, src, end - copy, copy, 0);
				state.wnext = copy;
				state.whave = state.wsize;
			} else {
				state.wnext += dist;
				if (state.wnext === state.wsize) state.wnext = 0;
				if (state.whave < state.wsize) state.whave += dist;
			}
		}
		return 0;
	}
	function inflate(strm, flush) {
		var state;
		var input, output;
		var next;
		var put;
		var have, left;
		var hold;
		var bits;
		var _in, _out;
		var copy;
		var from;
		var from_source;
		var here = 0;
		var here_bits, here_op, here_val;
		var last_bits, last_op, last_val;
		var len;
		var ret;
		var hbuf = new utils.Buf8(4);
		var opts;
		var n;
		var order = [
			16,
			17,
			18,
			0,
			8,
			7,
			9,
			6,
			10,
			5,
			11,
			4,
			12,
			3,
			13,
			2,
			14,
			1,
			15
		];
		if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) return Z_STREAM_ERROR;
		state = strm.state;
		if (state.mode === TYPE) state.mode = TYPEDO;
		put = strm.next_out;
		output = strm.output;
		left = strm.avail_out;
		next = strm.next_in;
		input = strm.input;
		have = strm.avail_in;
		hold = state.hold;
		bits = state.bits;
		_in = have;
		_out = left;
		ret = Z_OK;
		inf_leave: for (;;) switch (state.mode) {
			case HEAD:
				if (state.wrap === 0) {
					state.mode = TYPEDO;
					break;
				}
				while (bits < 16) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				if (state.wrap & 2 && hold === 35615) {
					state.check = 0;
					hbuf[0] = hold & 255;
					hbuf[1] = hold >>> 8 & 255;
					state.check = crc32(state.check, hbuf, 2, 0);
					hold = 0;
					bits = 0;
					state.mode = FLAGS;
					break;
				}
				state.flags = 0;
				if (state.head) state.head.done = false;
				if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
					strm.msg = "incorrect header check";
					state.mode = BAD;
					break;
				}
				if ((hold & 15) !== Z_DEFLATED) {
					strm.msg = "unknown compression method";
					state.mode = BAD;
					break;
				}
				hold >>>= 4;
				bits -= 4;
				len = (hold & 15) + 8;
				if (state.wbits === 0) state.wbits = len;
				else if (len > state.wbits) {
					strm.msg = "invalid window size";
					state.mode = BAD;
					break;
				}
				state.dmax = 1 << len;
				strm.adler = state.check = 1;
				state.mode = hold & 512 ? DICTID : TYPE;
				hold = 0;
				bits = 0;
				break;
			case FLAGS:
				while (bits < 16) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				state.flags = hold;
				if ((state.flags & 255) !== Z_DEFLATED) {
					strm.msg = "unknown compression method";
					state.mode = BAD;
					break;
				}
				if (state.flags & 57344) {
					strm.msg = "unknown header flags set";
					state.mode = BAD;
					break;
				}
				if (state.head) state.head.text = hold >> 8 & 1;
				if (state.flags & 512) {
					hbuf[0] = hold & 255;
					hbuf[1] = hold >>> 8 & 255;
					state.check = crc32(state.check, hbuf, 2, 0);
				}
				hold = 0;
				bits = 0;
				state.mode = TIME;
			case TIME:
				while (bits < 32) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				if (state.head) state.head.time = hold;
				if (state.flags & 512) {
					hbuf[0] = hold & 255;
					hbuf[1] = hold >>> 8 & 255;
					hbuf[2] = hold >>> 16 & 255;
					hbuf[3] = hold >>> 24 & 255;
					state.check = crc32(state.check, hbuf, 4, 0);
				}
				hold = 0;
				bits = 0;
				state.mode = OS;
			case OS:
				while (bits < 16) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				if (state.head) {
					state.head.xflags = hold & 255;
					state.head.os = hold >> 8;
				}
				if (state.flags & 512) {
					hbuf[0] = hold & 255;
					hbuf[1] = hold >>> 8 & 255;
					state.check = crc32(state.check, hbuf, 2, 0);
				}
				hold = 0;
				bits = 0;
				state.mode = EXLEN;
			case EXLEN:
				if (state.flags & 1024) {
					while (bits < 16) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					state.length = hold;
					if (state.head) state.head.extra_len = hold;
					if (state.flags & 512) {
						hbuf[0] = hold & 255;
						hbuf[1] = hold >>> 8 & 255;
						state.check = crc32(state.check, hbuf, 2, 0);
					}
					hold = 0;
					bits = 0;
				} else if (state.head) state.head.extra = null;
				state.mode = EXTRA;
			case EXTRA:
				if (state.flags & 1024) {
					copy = state.length;
					if (copy > have) copy = have;
					if (copy) {
						if (state.head) {
							len = state.head.extra_len - state.length;
							if (!state.head.extra) state.head.extra = new Array(state.head.extra_len);
							utils.arraySet(state.head.extra, input, next, copy, len);
						}
						if (state.flags & 512) state.check = crc32(state.check, input, copy, next);
						have -= copy;
						next += copy;
						state.length -= copy;
					}
					if (state.length) break inf_leave;
				}
				state.length = 0;
				state.mode = NAME;
			case NAME:
				if (state.flags & 2048) {
					if (have === 0) break inf_leave;
					copy = 0;
					do {
						len = input[next + copy++];
						if (state.head && len && state.length < 65536) state.head.name += String.fromCharCode(len);
					} while (len && copy < have);
					if (state.flags & 512) state.check = crc32(state.check, input, copy, next);
					have -= copy;
					next += copy;
					if (len) break inf_leave;
				} else if (state.head) state.head.name = null;
				state.length = 0;
				state.mode = COMMENT;
			case COMMENT:
				if (state.flags & 4096) {
					if (have === 0) break inf_leave;
					copy = 0;
					do {
						len = input[next + copy++];
						if (state.head && len && state.length < 65536) state.head.comment += String.fromCharCode(len);
					} while (len && copy < have);
					if (state.flags & 512) state.check = crc32(state.check, input, copy, next);
					have -= copy;
					next += copy;
					if (len) break inf_leave;
				} else if (state.head) state.head.comment = null;
				state.mode = HCRC;
			case HCRC:
				if (state.flags & 512) {
					while (bits < 16) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					if (hold !== (state.check & 65535)) {
						strm.msg = "header crc mismatch";
						state.mode = BAD;
						break;
					}
					hold = 0;
					bits = 0;
				}
				if (state.head) {
					state.head.hcrc = state.flags >> 9 & 1;
					state.head.done = true;
				}
				strm.adler = state.check = 0;
				state.mode = TYPE;
				break;
			case DICTID:
				while (bits < 32) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				strm.adler = state.check = zswap32(hold);
				hold = 0;
				bits = 0;
				state.mode = DICT;
			case DICT:
				if (state.havedict === 0) {
					strm.next_out = put;
					strm.avail_out = left;
					strm.next_in = next;
					strm.avail_in = have;
					state.hold = hold;
					state.bits = bits;
					return Z_NEED_DICT;
				}
				strm.adler = state.check = 1;
				state.mode = TYPE;
			case TYPE: if (flush === Z_BLOCK || flush === Z_TREES) break inf_leave;
			case TYPEDO:
				if (state.last) {
					hold >>>= bits & 7;
					bits -= bits & 7;
					state.mode = CHECK;
					break;
				}
				while (bits < 3) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				state.last = hold & 1;
				hold >>>= 1;
				bits -= 1;
				switch (hold & 3) {
					case 0:
						state.mode = STORED;
						break;
					case 1:
						fixedtables(state);
						state.mode = LEN_;
						if (flush === Z_TREES) {
							hold >>>= 2;
							bits -= 2;
							break inf_leave;
						}
						break;
					case 2:
						state.mode = TABLE;
						break;
					case 3:
						strm.msg = "invalid block type";
						state.mode = BAD;
				}
				hold >>>= 2;
				bits -= 2;
				break;
			case STORED:
				hold >>>= bits & 7;
				bits -= bits & 7;
				while (bits < 32) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
					strm.msg = "invalid stored block lengths";
					state.mode = BAD;
					break;
				}
				state.length = hold & 65535;
				hold = 0;
				bits = 0;
				state.mode = COPY_;
				if (flush === Z_TREES) break inf_leave;
			case COPY_: state.mode = COPY;
			case COPY:
				copy = state.length;
				if (copy) {
					if (copy > have) copy = have;
					if (copy > left) copy = left;
					if (copy === 0) break inf_leave;
					utils.arraySet(output, input, next, copy, put);
					have -= copy;
					next += copy;
					left -= copy;
					put += copy;
					state.length -= copy;
					break;
				}
				state.mode = TYPE;
				break;
			case TABLE:
				while (bits < 14) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				state.nlen = (hold & 31) + 257;
				hold >>>= 5;
				bits -= 5;
				state.ndist = (hold & 31) + 1;
				hold >>>= 5;
				bits -= 5;
				state.ncode = (hold & 15) + 4;
				hold >>>= 4;
				bits -= 4;
				if (state.nlen > 286 || state.ndist > 30) {
					strm.msg = "too many length or distance symbols";
					state.mode = BAD;
					break;
				}
				state.have = 0;
				state.mode = LENLENS;
			case LENLENS:
				while (state.have < state.ncode) {
					while (bits < 3) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					state.lens[order[state.have++]] = hold & 7;
					hold >>>= 3;
					bits -= 3;
				}
				while (state.have < 19) state.lens[order[state.have++]] = 0;
				state.lencode = state.lendyn;
				state.lenbits = 7;
				opts = { bits: state.lenbits };
				ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
				state.lenbits = opts.bits;
				if (ret) {
					strm.msg = "invalid code lengths set";
					state.mode = BAD;
					break;
				}
				state.have = 0;
				state.mode = CODELENS;
			case CODELENS:
				while (state.have < state.nlen + state.ndist) {
					for (;;) {
						here = state.lencode[hold & (1 << state.lenbits) - 1];
						here_bits = here >>> 24;
						here_op = here >>> 16 & 255;
						here_val = here & 65535;
						if (here_bits <= bits) break;
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					if (here_val < 16) {
						hold >>>= here_bits;
						bits -= here_bits;
						state.lens[state.have++] = here_val;
					} else {
						if (here_val === 16) {
							n = here_bits + 2;
							while (bits < n) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							hold >>>= here_bits;
							bits -= here_bits;
							if (state.have === 0) {
								strm.msg = "invalid bit length repeat";
								state.mode = BAD;
								break;
							}
							len = state.lens[state.have - 1];
							copy = 3 + (hold & 3);
							hold >>>= 2;
							bits -= 2;
						} else if (here_val === 17) {
							n = here_bits + 3;
							while (bits < n) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							hold >>>= here_bits;
							bits -= here_bits;
							len = 0;
							copy = 3 + (hold & 7);
							hold >>>= 3;
							bits -= 3;
						} else {
							n = here_bits + 7;
							while (bits < n) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							hold >>>= here_bits;
							bits -= here_bits;
							len = 0;
							copy = 11 + (hold & 127);
							hold >>>= 7;
							bits -= 7;
						}
						if (state.have + copy > state.nlen + state.ndist) {
							strm.msg = "invalid bit length repeat";
							state.mode = BAD;
							break;
						}
						while (copy--) state.lens[state.have++] = len;
					}
				}
				if (state.mode === BAD) break;
				if (state.lens[256] === 0) {
					strm.msg = "invalid code -- missing end-of-block";
					state.mode = BAD;
					break;
				}
				state.lenbits = 9;
				opts = { bits: state.lenbits };
				ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
				state.lenbits = opts.bits;
				if (ret) {
					strm.msg = "invalid literal/lengths set";
					state.mode = BAD;
					break;
				}
				state.distbits = 6;
				state.distcode = state.distdyn;
				opts = { bits: state.distbits };
				ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
				state.distbits = opts.bits;
				if (ret) {
					strm.msg = "invalid distances set";
					state.mode = BAD;
					break;
				}
				state.mode = LEN_;
				if (flush === Z_TREES) break inf_leave;
			case LEN_: state.mode = LEN;
			case LEN:
				if (have >= 6 && left >= 258) {
					strm.next_out = put;
					strm.avail_out = left;
					strm.next_in = next;
					strm.avail_in = have;
					state.hold = hold;
					state.bits = bits;
					inflate_fast(strm, _out);
					put = strm.next_out;
					output = strm.output;
					left = strm.avail_out;
					next = strm.next_in;
					input = strm.input;
					have = strm.avail_in;
					hold = state.hold;
					bits = state.bits;
					if (state.mode === TYPE) state.back = -1;
					break;
				}
				state.back = 0;
				for (;;) {
					here = state.lencode[hold & (1 << state.lenbits) - 1];
					here_bits = here >>> 24;
					here_op = here >>> 16 & 255;
					here_val = here & 65535;
					if (here_bits <= bits) break;
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				if (here_op && (here_op & 240) === 0) {
					last_bits = here_bits;
					last_op = here_op;
					last_val = here_val;
					for (;;) {
						here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
						here_bits = here >>> 24;
						here_op = here >>> 16 & 255;
						here_val = here & 65535;
						if (last_bits + here_bits <= bits) break;
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					hold >>>= last_bits;
					bits -= last_bits;
					state.back += last_bits;
				}
				hold >>>= here_bits;
				bits -= here_bits;
				state.back += here_bits;
				state.length = here_val;
				if (here_op === 0) {
					state.mode = LIT;
					break;
				}
				if (here_op & 32) {
					state.back = -1;
					state.mode = TYPE;
					break;
				}
				if (here_op & 64) {
					strm.msg = "invalid literal/length code";
					state.mode = BAD;
					break;
				}
				state.extra = here_op & 15;
				state.mode = LENEXT;
			case LENEXT:
				if (state.extra) {
					n = state.extra;
					while (bits < n) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					state.length += hold & (1 << state.extra) - 1;
					hold >>>= state.extra;
					bits -= state.extra;
					state.back += state.extra;
				}
				state.was = state.length;
				state.mode = DIST;
			case DIST:
				for (;;) {
					here = state.distcode[hold & (1 << state.distbits) - 1];
					here_bits = here >>> 24;
					here_op = here >>> 16 & 255;
					here_val = here & 65535;
					if (here_bits <= bits) break;
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				if ((here_op & 240) === 0) {
					last_bits = here_bits;
					last_op = here_op;
					last_val = here_val;
					for (;;) {
						here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
						here_bits = here >>> 24;
						here_op = here >>> 16 & 255;
						here_val = here & 65535;
						if (last_bits + here_bits <= bits) break;
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					hold >>>= last_bits;
					bits -= last_bits;
					state.back += last_bits;
				}
				hold >>>= here_bits;
				bits -= here_bits;
				state.back += here_bits;
				if (here_op & 64) {
					strm.msg = "invalid distance code";
					state.mode = BAD;
					break;
				}
				state.offset = here_val;
				state.extra = here_op & 15;
				state.mode = DISTEXT;
			case DISTEXT:
				if (state.extra) {
					n = state.extra;
					while (bits < n) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					state.offset += hold & (1 << state.extra) - 1;
					hold >>>= state.extra;
					bits -= state.extra;
					state.back += state.extra;
				}
				if (state.offset > state.dmax) {
					strm.msg = "invalid distance too far back";
					state.mode = BAD;
					break;
				}
				state.mode = MATCH;
			case MATCH:
				if (left === 0) break inf_leave;
				copy = _out - left;
				if (state.offset > copy) {
					copy = state.offset - copy;
					if (copy > state.whave) {
						if (state.sane) {
							strm.msg = "invalid distance too far back";
							state.mode = BAD;
							break;
						}
					}
					if (copy > state.wnext) {
						copy -= state.wnext;
						from = state.wsize - copy;
					} else from = state.wnext - copy;
					if (copy > state.length) copy = state.length;
					from_source = state.window;
				} else {
					from_source = output;
					from = put - state.offset;
					copy = state.length;
				}
				if (copy > left) copy = left;
				left -= copy;
				state.length -= copy;
				do
					output[put++] = from_source[from++];
				while (--copy);
				if (state.length === 0) state.mode = LEN;
				break;
			case LIT:
				if (left === 0) break inf_leave;
				output[put++] = state.length;
				left--;
				state.mode = LEN;
				break;
			case CHECK:
				if (state.wrap) {
					while (bits < 32) {
						if (have === 0) break inf_leave;
						have--;
						hold |= input[next++] << bits;
						bits += 8;
					}
					_out -= left;
					strm.total_out += _out;
					state.total += _out;
					if (_out) strm.adler = state.check = state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
					_out = left;
					if ((state.flags ? hold : zswap32(hold)) !== state.check) {
						strm.msg = "incorrect data check";
						state.mode = BAD;
						break;
					}
					hold = 0;
					bits = 0;
				}
				state.mode = LENGTH;
			case LENGTH:
				if (state.wrap && state.flags) {
					while (bits < 32) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					if (hold !== (state.total & 4294967295)) {
						strm.msg = "incorrect length check";
						state.mode = BAD;
						break;
					}
					hold = 0;
					bits = 0;
				}
				state.mode = DONE;
			case DONE:
				ret = Z_STREAM_END;
				break inf_leave;
			case BAD:
				ret = Z_DATA_ERROR;
				break inf_leave;
			case MEM: return Z_MEM_ERROR;
			case SYNC:
			default: return Z_STREAM_ERROR;
		}
		strm.next_out = put;
		strm.avail_out = left;
		strm.next_in = next;
		strm.avail_in = have;
		state.hold = hold;
		state.bits = bits;
		if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
			if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
				state.mode = MEM;
				return Z_MEM_ERROR;
			}
		}
		_in -= strm.avail_in;
		_out -= strm.avail_out;
		strm.total_in += _in;
		strm.total_out += _out;
		state.total += _out;
		if (state.wrap && _out) strm.adler = state.check = state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
		strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
		if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) ret = Z_BUF_ERROR;
		return ret;
	}
	function inflateEnd(strm) {
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		var state = strm.state;
		if (state.window) state.window = null;
		strm.state = null;
		return Z_OK;
	}
	function inflateGetHeader(strm, head) {
		var state;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		state = strm.state;
		if ((state.wrap & 2) === 0) return Z_STREAM_ERROR;
		state.head = head;
		head.done = false;
		return Z_OK;
	}
	function inflateSetDictionary(strm, dictionary) {
		var dictLength = dictionary.length;
		var state;
		var dictid;
		var ret;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		state = strm.state;
		if (state.wrap !== 0 && state.mode !== DICT) return Z_STREAM_ERROR;
		if (state.mode === DICT) {
			dictid = 1;
			dictid = adler32(dictid, dictionary, dictLength, 0);
			if (dictid !== state.check) return Z_DATA_ERROR;
		}
		ret = updatewindow(strm, dictionary, dictLength, dictLength);
		if (ret) {
			state.mode = MEM;
			return Z_MEM_ERROR;
		}
		state.havedict = 1;
		return Z_OK;
	}
	exports.inflateReset = inflateReset;
	exports.inflateReset2 = inflateReset2;
	exports.inflateResetKeep = inflateResetKeep;
	exports.inflateInit = inflateInit;
	exports.inflateInit2 = inflateInit2;
	exports.inflate = inflate;
	exports.inflateEnd = inflateEnd;
	exports.inflateGetHeader = inflateGetHeader;
	exports.inflateSetDictionary = inflateSetDictionary;
	exports.inflateInfo = "pako inflate (from Nodeca project)";
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		Z_NO_FLUSH: 0,
		Z_PARTIAL_FLUSH: 1,
		Z_SYNC_FLUSH: 2,
		Z_FULL_FLUSH: 3,
		Z_FINISH: 4,
		Z_BLOCK: 5,
		Z_TREES: 6,
		Z_OK: 0,
		Z_STREAM_END: 1,
		Z_NEED_DICT: 2,
		Z_ERRNO: -1,
		Z_STREAM_ERROR: -2,
		Z_DATA_ERROR: -3,
		Z_BUF_ERROR: -5,
		Z_NO_COMPRESSION: 0,
		Z_BEST_SPEED: 1,
		Z_BEST_COMPRESSION: 9,
		Z_DEFAULT_COMPRESSION: -1,
		Z_FILTERED: 1,
		Z_HUFFMAN_ONLY: 2,
		Z_RLE: 3,
		Z_FIXED: 4,
		Z_DEFAULT_STRATEGY: 0,
		Z_BINARY: 0,
		Z_TEXT: 1,
		Z_UNKNOWN: 2,
		Z_DEFLATED: 8
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/gzheader.js
var require_gzheader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function GZheader() {
		this.text = 0;
		this.time = 0;
		this.xflags = 0;
		this.os = 0;
		this.extra = null;
		this.extra_len = 0;
		this.name = "";
		this.comment = "";
		this.hcrc = 0;
		this.done = false;
	}
	module.exports = GZheader;
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/inflate.js
var require_inflate = /* @__PURE__ */ __commonJSMin(((exports) => {
	var zlib_inflate = require_inflate$1();
	var utils = require_common();
	var strings = require_strings();
	var c = require_constants();
	var msg = require_messages();
	var ZStream = require_zstream();
	var GZheader = require_gzheader();
	var toString = Object.prototype.toString;
	/**
	* class Inflate
	*
	* Generic JS-style wrapper for zlib calls. If you don't need
	* streaming behaviour - use more simple functions: [[inflate]]
	* and [[inflateRaw]].
	**/
	/**
	* Inflate.result -> Uint8Array|Array|String
	*
	* Uncompressed result, generated by default [[Inflate#onData]]
	* and [[Inflate#onEnd]] handlers. Filled after you push last chunk
	* (call [[Inflate#push]] with `Z_FINISH` / `true` param) or if you
	* push a chunk with explicit flush (call [[Inflate#push]] with
	* `Z_SYNC_FLUSH` param).
	**/
	/**
	* Inflate.err -> Number
	*
	* Error code after inflate finished. 0 (Z_OK) on success.
	* Should be checked if broken data possible.
	**/
	/**
	* Inflate.msg -> String
	*
	* Error message, if [[Inflate.err]] != 0
	**/
	/**
	* new Inflate(options)
	* - options (Object): zlib inflate options.
	*
	* Creates new inflator instance with specified params. Throws exception
	* on bad params. Supported options:
	*
	* - `windowBits`
	* - `dictionary`
	*
	* [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
	* for more information on these.
	*
	* Additional options, for internal needs:
	*
	* - `chunkSize` - size of generated data chunks (16K by default)
	* - `raw` (Boolean) - do raw inflate
	* - `to` (String) - if equal to 'string', then result will be converted
	*   from utf8 to utf16 (javascript) string. When string output requested,
	*   chunk length can differ from `chunkSize`, depending on content.
	*
	* By default, when no options set, autodetect deflate/gzip data format via
	* wrapper header.
	*
	* ##### Example:
	*
	* ```javascript
	* var pako = require('pako')
	*   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
	*   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
	*
	* var inflate = new pako.Inflate({ level: 3});
	*
	* inflate.push(chunk1, false);
	* inflate.push(chunk2, true);  // true -> last chunk
	*
	* if (inflate.err) { throw new Error(inflate.err); }
	*
	* console.log(inflate.result);
	* ```
	**/
	function Inflate(options) {
		if (!(this instanceof Inflate)) return new Inflate(options);
		this.options = utils.assign({
			chunkSize: 16384,
			windowBits: 0,
			to: ""
		}, options || {});
		var opt = this.options;
		if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
			opt.windowBits = -opt.windowBits;
			if (opt.windowBits === 0) opt.windowBits = -15;
		}
		if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) opt.windowBits += 32;
		if (opt.windowBits > 15 && opt.windowBits < 48) {
			if ((opt.windowBits & 15) === 0) opt.windowBits |= 15;
		}
		this.err = 0;
		this.msg = "";
		this.ended = false;
		this.chunks = [];
		this.strm = new ZStream();
		this.strm.avail_out = 0;
		var status = zlib_inflate.inflateInit2(this.strm, opt.windowBits);
		if (status !== c.Z_OK) throw new Error(msg[status]);
		this.header = new GZheader();
		zlib_inflate.inflateGetHeader(this.strm, this.header);
		if (opt.dictionary) {
			if (typeof opt.dictionary === "string") opt.dictionary = strings.string2buf(opt.dictionary);
			else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") opt.dictionary = new Uint8Array(opt.dictionary);
			if (opt.raw) {
				status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
				if (status !== c.Z_OK) throw new Error(msg[status]);
			}
		}
	}
	/**
	* Inflate#push(data[, mode]) -> Boolean
	* - data (Uint8Array|Array|ArrayBuffer|String): input data
	* - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
	*   See constants. Skipped or `false` means Z_NO_FLUSH, `true` means Z_FINISH.
	*
	* Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
	* new output chunks. Returns `true` on success. The last data block must have
	* mode Z_FINISH (or `true`). That will flush internal pending buffers and call
	* [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
	* can use mode Z_SYNC_FLUSH, keeping the decompression context.
	*
	* On fail call [[Inflate#onEnd]] with error code and return false.
	*
	* We strongly recommend to use `Uint8Array` on input for best speed (output
	* format is detected automatically). Also, don't skip last param and always
	* use the same type in your code (boolean or number). That will improve JS speed.
	*
	* For regular `Array`-s make sure all elements are [0..255].
	*
	* ##### Example
	*
	* ```javascript
	* push(chunk, false); // push one of data chunks
	* ...
	* push(chunk, true);  // push last chunk
	* ```
	**/
	Inflate.prototype.push = function(data, mode) {
		var strm = this.strm;
		var chunkSize = this.options.chunkSize;
		var dictionary = this.options.dictionary;
		var status, _mode;
		var next_out_utf8, tail, utf8str;
		var allowBufError = false;
		if (this.ended) return false;
		_mode = mode === ~~mode ? mode : mode === true ? c.Z_FINISH : c.Z_NO_FLUSH;
		if (typeof data === "string") strm.input = strings.binstring2buf(data);
		else if (toString.call(data) === "[object ArrayBuffer]") strm.input = new Uint8Array(data);
		else strm.input = data;
		strm.next_in = 0;
		strm.avail_in = strm.input.length;
		do {
			if (strm.avail_out === 0) {
				strm.output = new utils.Buf8(chunkSize);
				strm.next_out = 0;
				strm.avail_out = chunkSize;
			}
			status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);
			if (status === c.Z_NEED_DICT && dictionary) status = zlib_inflate.inflateSetDictionary(this.strm, dictionary);
			if (status === c.Z_BUF_ERROR && allowBufError === true) {
				status = c.Z_OK;
				allowBufError = false;
			}
			if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
				this.onEnd(status);
				this.ended = true;
				return false;
			}
			if (strm.next_out) {
				if (strm.avail_out === 0 || status === c.Z_STREAM_END || strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH)) if (this.options.to === "string") {
					next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
					tail = strm.next_out - next_out_utf8;
					utf8str = strings.buf2string(strm.output, next_out_utf8);
					strm.next_out = tail;
					strm.avail_out = chunkSize - tail;
					if (tail) utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
					this.onData(utf8str);
				} else this.onData(utils.shrinkBuf(strm.output, strm.next_out));
			}
			if (strm.avail_in === 0 && strm.avail_out === 0) allowBufError = true;
		} while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);
		if (status === c.Z_STREAM_END) _mode = c.Z_FINISH;
		if (_mode === c.Z_FINISH) {
			status = zlib_inflate.inflateEnd(this.strm);
			this.onEnd(status);
			this.ended = true;
			return status === c.Z_OK;
		}
		if (_mode === c.Z_SYNC_FLUSH) {
			this.onEnd(c.Z_OK);
			strm.avail_out = 0;
			return true;
		}
		return true;
	};
	/**
	* Inflate#onData(chunk) -> Void
	* - chunk (Uint8Array|Array|String): output data. Type of array depends
	*   on js engine support. When string output requested, each chunk
	*   will be string.
	*
	* By default, stores data blocks in `chunks[]` property and glue
	* those in `onEnd`. Override this handler, if you need another behaviour.
	**/
	Inflate.prototype.onData = function(chunk) {
		this.chunks.push(chunk);
	};
	/**
	* Inflate#onEnd(status) -> Void
	* - status (Number): inflate status. 0 (Z_OK) on success,
	*   other if not.
	*
	* Called either after you tell inflate that the input stream is
	* complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
	* or if an error happened. By default - join collected chunks,
	* free memory and fill `results` / `err` properties.
	**/
	Inflate.prototype.onEnd = function(status) {
		if (status === c.Z_OK) if (this.options.to === "string") this.result = this.chunks.join("");
		else this.result = utils.flattenChunks(this.chunks);
		this.chunks = [];
		this.err = status;
		this.msg = this.strm.msg;
	};
	/**
	* inflate(data[, options]) -> Uint8Array|Array|String
	* - data (Uint8Array|Array|String): input data to decompress.
	* - options (Object): zlib inflate options.
	*
	* Decompress `data` with inflate/ungzip and `options`. Autodetect
	* format via wrapper header by default. That's why we don't provide
	* separate `ungzip` method.
	*
	* Supported options are:
	*
	* - windowBits
	*
	* [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
	* for more information.
	*
	* Sugar (options):
	*
	* - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
	*   negative windowBits implicitly.
	* - `to` (String) - if equal to 'string', then result will be converted
	*   from utf8 to utf16 (javascript) string. When string output requested,
	*   chunk length can differ from `chunkSize`, depending on content.
	*
	*
	* ##### Example:
	*
	* ```javascript
	* var pako = require('pako')
	*   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
	*   , output;
	*
	* try {
	*   output = pako.inflate(input);
	* } catch (err)
	*   console.log(err);
	* }
	* ```
	**/
	function inflate(input, options) {
		var inflator = new Inflate(options);
		inflator.push(input, true);
		if (inflator.err) throw inflator.msg || msg[inflator.err];
		return inflator.result;
	}
	/**
	* inflateRaw(data[, options]) -> Uint8Array|Array|String
	* - data (Uint8Array|Array|String): input data to decompress.
	* - options (Object): zlib inflate options.
	*
	* The same as [[inflate]], but creates raw data, without wrapper
	* (header and adler32 crc).
	**/
	function inflateRaw(input, options) {
		options = options || {};
		options.raw = true;
		return inflate(input, options);
	}
	/**
	* ungzip(data[, options]) -> Uint8Array|Array|String
	* - data (Uint8Array|Array|String): input data to decompress.
	* - options (Object): zlib inflate options.
	*
	* Just shortcut to [[inflate]], because it autodetects format
	* by header.content. Done for convenience.
	**/
	exports.Inflate = Inflate;
	exports.inflate = inflate;
	exports.inflateRaw = inflateRaw;
	exports.ungzip = inflate;
}));
//#endregion
//#region ../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/index.js
var require_pako = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assign = require_common().assign;
	var deflate = require_deflate();
	var inflate = require_inflate();
	var constants = require_constants();
	var pako = {};
	assign(pako, deflate, inflate, constants);
	module.exports = pako;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/flate.js
var require_flate = /* @__PURE__ */ __commonJSMin(((exports) => {
	var USE_TYPEDARRAY = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Uint32Array !== "undefined";
	var pako = require_pako();
	var utils = require_utils();
	var GenericWorker = require_GenericWorker();
	var ARRAY_TYPE = USE_TYPEDARRAY ? "uint8array" : "array";
	exports.magic = "\b\0";
	/**
	* Create a worker that uses pako to inflate/deflate.
	* @constructor
	* @param {String} action the name of the pako function to call : either "Deflate" or "Inflate".
	* @param {Object} options the options to use when (de)compressing.
	*/
	function FlateWorker(action, options) {
		GenericWorker.call(this, "FlateWorker/" + action);
		this._pako = null;
		this._pakoAction = action;
		this._pakoOptions = options;
		this.meta = {};
	}
	utils.inherits(FlateWorker, GenericWorker);
	/**
	* @see GenericWorker.processChunk
	*/
	FlateWorker.prototype.processChunk = function(chunk) {
		this.meta = chunk.meta;
		if (this._pako === null) this._createPako();
		this._pako.push(utils.transformTo(ARRAY_TYPE, chunk.data), false);
	};
	/**
	* @see GenericWorker.flush
	*/
	FlateWorker.prototype.flush = function() {
		GenericWorker.prototype.flush.call(this);
		if (this._pako === null) this._createPako();
		this._pako.push([], true);
	};
	/**
	* @see GenericWorker.cleanUp
	*/
	FlateWorker.prototype.cleanUp = function() {
		GenericWorker.prototype.cleanUp.call(this);
		this._pako = null;
	};
	/**
	* Create the _pako object.
	* TODO: lazy-loading this object isn't the best solution but it's the
	* quickest. The best solution is to lazy-load the worker list. See also the
	* issue #446.
	*/
	FlateWorker.prototype._createPako = function() {
		this._pako = new pako[this._pakoAction]({
			raw: true,
			level: this._pakoOptions.level || -1
		});
		var self = this;
		this._pako.onData = function(data) {
			self.push({
				data,
				meta: self.meta
			});
		};
	};
	exports.compressWorker = function(compressionOptions) {
		return new FlateWorker("Deflate", compressionOptions);
	};
	exports.uncompressWorker = function() {
		return new FlateWorker("Inflate", {});
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/compressions.js
var require_compressions = /* @__PURE__ */ __commonJSMin(((exports) => {
	var GenericWorker = require_GenericWorker();
	exports.STORE = {
		magic: "\0\0",
		compressWorker: function() {
			return new GenericWorker("STORE compression");
		},
		uncompressWorker: function() {
			return new GenericWorker("STORE decompression");
		}
	};
	exports.DEFLATE = require_flate();
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/signature.js
var require_signature = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.LOCAL_FILE_HEADER = "PK";
	exports.CENTRAL_FILE_HEADER = "PK";
	exports.CENTRAL_DIRECTORY_END = "PK";
	exports.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07";
	exports.ZIP64_CENTRAL_DIRECTORY_END = "PK";
	exports.DATA_DESCRIPTOR = "PK\x07\b";
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/generate/ZipFileWorker.js
var require_ZipFileWorker = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var GenericWorker = require_GenericWorker();
	var utf8 = require_utf8();
	var crc32 = require_crc32$1();
	var signature = require_signature();
	/**
	* Transform an integer into a string in hexadecimal.
	* @private
	* @param {number} dec the number to convert.
	* @param {number} bytes the number of bytes to generate.
	* @returns {string} the result.
	*/
	var decToHex = function(dec, bytes) {
		var hex = "", i;
		for (i = 0; i < bytes; i++) {
			hex += String.fromCharCode(dec & 255);
			dec = dec >>> 8;
		}
		return hex;
	};
	/**
	* Generate the UNIX part of the external file attributes.
	* @param {Object} unixPermissions the unix permissions or null.
	* @param {Boolean} isDir true if the entry is a directory, false otherwise.
	* @return {Number} a 32 bit integer.
	*
	* adapted from http://unix.stackexchange.com/questions/14705/the-zip-formats-external-file-attribute :
	*
	* TTTTsstrwxrwxrwx0000000000ADVSHR
	* ^^^^____________________________ file type, see zipinfo.c (UNX_*)
	*     ^^^_________________________ setuid, setgid, sticky
	*        ^^^^^^^^^________________ permissions
	*                 ^^^^^^^^^^______ not used ?
	*                           ^^^^^^ DOS attribute bits : Archive, Directory, Volume label, System file, Hidden, Read only
	*/
	var generateUnixExternalFileAttr = function(unixPermissions, isDir) {
		var result = unixPermissions;
		if (!unixPermissions) result = isDir ? 16893 : 33204;
		return (result & 65535) << 16;
	};
	/**
	* Generate the DOS part of the external file attributes.
	* @param {Object} dosPermissions the dos permissions or null.
	* @param {Boolean} isDir true if the entry is a directory, false otherwise.
	* @return {Number} a 32 bit integer.
	*
	* Bit 0     Read-Only
	* Bit 1     Hidden
	* Bit 2     System
	* Bit 3     Volume Label
	* Bit 4     Directory
	* Bit 5     Archive
	*/
	var generateDosExternalFileAttr = function(dosPermissions) {
		return (dosPermissions || 0) & 63;
	};
	/**
	* Generate the various parts used in the construction of the final zip file.
	* @param {Object} streamInfo the hash with information about the compressed file.
	* @param {Boolean} streamedContent is the content streamed ?
	* @param {Boolean} streamingEnded is the stream finished ?
	* @param {number} offset the current offset from the start of the zip file.
	* @param {String} platform let's pretend we are this platform (change platform dependents fields)
	* @param {Function} encodeFileName the function to encode the file name / comment.
	* @return {Object} the zip parts.
	*/
	var generateZipParts = function(streamInfo, streamedContent, streamingEnded, offset, platform, encodeFileName) {
		var file = streamInfo["file"], compression = streamInfo["compression"], useCustomEncoding = encodeFileName !== utf8.utf8encode, encodedFileName = utils.transformTo("string", encodeFileName(file.name)), utfEncodedFileName = utils.transformTo("string", utf8.utf8encode(file.name)), comment = file.comment, encodedComment = utils.transformTo("string", encodeFileName(comment)), utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)), useUTF8ForFileName = utfEncodedFileName.length !== file.name.length, useUTF8ForComment = utfEncodedComment.length !== comment.length, dosTime, dosDate, extraFields = "", unicodePathExtraField = "", unicodeCommentExtraField = "", dir = file.dir, date = file.date;
		var dataInfo = {
			crc32: 0,
			compressedSize: 0,
			uncompressedSize: 0
		};
		if (!streamedContent || streamingEnded) {
			dataInfo.crc32 = streamInfo["crc32"];
			dataInfo.compressedSize = streamInfo["compressedSize"];
			dataInfo.uncompressedSize = streamInfo["uncompressedSize"];
		}
		var bitflag = 0;
		if (streamedContent) bitflag |= 8;
		if (!useCustomEncoding && (useUTF8ForFileName || useUTF8ForComment)) bitflag |= 2048;
		var extFileAttr = 0;
		var versionMadeBy = 0;
		if (dir) extFileAttr |= 16;
		if (platform === "UNIX") {
			versionMadeBy = 798;
			extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
		} else {
			versionMadeBy = 20;
			extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir);
		}
		dosTime = date.getUTCHours();
		dosTime = dosTime << 6;
		dosTime = dosTime | date.getUTCMinutes();
		dosTime = dosTime << 5;
		dosTime = dosTime | date.getUTCSeconds() / 2;
		dosDate = date.getUTCFullYear() - 1980;
		dosDate = dosDate << 4;
		dosDate = dosDate | date.getUTCMonth() + 1;
		dosDate = dosDate << 5;
		dosDate = dosDate | date.getUTCDate();
		if (useUTF8ForFileName) {
			unicodePathExtraField = decToHex(1, 1) + decToHex(crc32(encodedFileName), 4) + utfEncodedFileName;
			extraFields += "up" + decToHex(unicodePathExtraField.length, 2) + unicodePathExtraField;
		}
		if (useUTF8ForComment) {
			unicodeCommentExtraField = decToHex(1, 1) + decToHex(crc32(encodedComment), 4) + utfEncodedComment;
			extraFields += "uc" + decToHex(unicodeCommentExtraField.length, 2) + unicodeCommentExtraField;
		}
		var header = "";
		header += "\n\0";
		header += decToHex(bitflag, 2);
		header += compression.magic;
		header += decToHex(dosTime, 2);
		header += decToHex(dosDate, 2);
		header += decToHex(dataInfo.crc32, 4);
		header += decToHex(dataInfo.compressedSize, 4);
		header += decToHex(dataInfo.uncompressedSize, 4);
		header += decToHex(encodedFileName.length, 2);
		header += decToHex(extraFields.length, 2);
		return {
			fileRecord: signature.LOCAL_FILE_HEADER + header + encodedFileName + extraFields,
			dirRecord: signature.CENTRAL_FILE_HEADER + decToHex(versionMadeBy, 2) + header + decToHex(encodedComment.length, 2) + "\0\0\0\0" + decToHex(extFileAttr, 4) + decToHex(offset, 4) + encodedFileName + extraFields + encodedComment
		};
	};
	/**
	* Generate the EOCD record.
	* @param {Number} entriesCount the number of entries in the zip file.
	* @param {Number} centralDirLength the length (in bytes) of the central dir.
	* @param {Number} localDirLength the length (in bytes) of the local dir.
	* @param {String} comment the zip file comment as a binary string.
	* @param {Function} encodeFileName the function to encode the comment.
	* @return {String} the EOCD record.
	*/
	var generateCentralDirectoryEnd = function(entriesCount, centralDirLength, localDirLength, comment, encodeFileName) {
		var dirEnd = "";
		var encodedComment = utils.transformTo("string", encodeFileName(comment));
		dirEnd = signature.CENTRAL_DIRECTORY_END + "\0\0\0\0" + decToHex(entriesCount, 2) + decToHex(entriesCount, 2) + decToHex(centralDirLength, 4) + decToHex(localDirLength, 4) + decToHex(encodedComment.length, 2) + encodedComment;
		return dirEnd;
	};
	/**
	* Generate data descriptors for a file entry.
	* @param {Object} streamInfo the hash generated by a worker, containing information
	* on the file entry.
	* @return {String} the data descriptors.
	*/
	var generateDataDescriptors = function(streamInfo) {
		var descriptor = "";
		descriptor = signature.DATA_DESCRIPTOR + decToHex(streamInfo["crc32"], 4) + decToHex(streamInfo["compressedSize"], 4) + decToHex(streamInfo["uncompressedSize"], 4);
		return descriptor;
	};
	/**
	* A worker to concatenate other workers to create a zip file.
	* @param {Boolean} streamFiles `true` to stream the content of the files,
	* `false` to accumulate it.
	* @param {String} comment the comment to use.
	* @param {String} platform the platform to use, "UNIX" or "DOS".
	* @param {Function} encodeFileName the function to encode file names and comments.
	*/
	function ZipFileWorker(streamFiles, comment, platform, encodeFileName) {
		GenericWorker.call(this, "ZipFileWorker");
		this.bytesWritten = 0;
		this.zipComment = comment;
		this.zipPlatform = platform;
		this.encodeFileName = encodeFileName;
		this.streamFiles = streamFiles;
		this.accumulate = false;
		this.contentBuffer = [];
		this.dirRecords = [];
		this.currentSourceOffset = 0;
		this.entriesCount = 0;
		this.currentFile = null;
		this._sources = [];
	}
	utils.inherits(ZipFileWorker, GenericWorker);
	/**
	* @see GenericWorker.push
	*/
	ZipFileWorker.prototype.push = function(chunk) {
		var currentFilePercent = chunk.meta.percent || 0;
		var entriesCount = this.entriesCount;
		var remainingFiles = this._sources.length;
		if (this.accumulate) this.contentBuffer.push(chunk);
		else {
			this.bytesWritten += chunk.data.length;
			GenericWorker.prototype.push.call(this, {
				data: chunk.data,
				meta: {
					currentFile: this.currentFile,
					percent: entriesCount ? (currentFilePercent + 100 * (entriesCount - remainingFiles - 1)) / entriesCount : 100
				}
			});
		}
	};
	/**
	* The worker started a new source (an other worker).
	* @param {Object} streamInfo the streamInfo object from the new source.
	*/
	ZipFileWorker.prototype.openedSource = function(streamInfo) {
		this.currentSourceOffset = this.bytesWritten;
		this.currentFile = streamInfo["file"].name;
		var streamedContent = this.streamFiles && !streamInfo["file"].dir;
		if (streamedContent) {
			var record = generateZipParts(streamInfo, streamedContent, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
			this.push({
				data: record.fileRecord,
				meta: { percent: 0 }
			});
		} else this.accumulate = true;
	};
	/**
	* The worker finished a source (an other worker).
	* @param {Object} streamInfo the streamInfo object from the finished source.
	*/
	ZipFileWorker.prototype.closedSource = function(streamInfo) {
		this.accumulate = false;
		var streamedContent = this.streamFiles && !streamInfo["file"].dir;
		var record = generateZipParts(streamInfo, streamedContent, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
		this.dirRecords.push(record.dirRecord);
		if (streamedContent) this.push({
			data: generateDataDescriptors(streamInfo),
			meta: { percent: 100 }
		});
		else {
			this.push({
				data: record.fileRecord,
				meta: { percent: 0 }
			});
			while (this.contentBuffer.length) this.push(this.contentBuffer.shift());
		}
		this.currentFile = null;
	};
	/**
	* @see GenericWorker.flush
	*/
	ZipFileWorker.prototype.flush = function() {
		var localDirLength = this.bytesWritten;
		for (var i = 0; i < this.dirRecords.length; i++) this.push({
			data: this.dirRecords[i],
			meta: { percent: 100 }
		});
		var centralDirLength = this.bytesWritten - localDirLength;
		var dirEnd = generateCentralDirectoryEnd(this.dirRecords.length, centralDirLength, localDirLength, this.zipComment, this.encodeFileName);
		this.push({
			data: dirEnd,
			meta: { percent: 100 }
		});
	};
	/**
	* Prepare the next source to be read.
	*/
	ZipFileWorker.prototype.prepareNextSource = function() {
		this.previous = this._sources.shift();
		this.openedSource(this.previous.streamInfo);
		if (this.isPaused) this.previous.pause();
		else this.previous.resume();
	};
	/**
	* @see GenericWorker.registerPrevious
	*/
	ZipFileWorker.prototype.registerPrevious = function(previous) {
		this._sources.push(previous);
		var self = this;
		previous.on("data", function(chunk) {
			self.processChunk(chunk);
		});
		previous.on("end", function() {
			self.closedSource(self.previous.streamInfo);
			if (self._sources.length) self.prepareNextSource();
			else self.end();
		});
		previous.on("error", function(e) {
			self.error(e);
		});
		return this;
	};
	/**
	* @see GenericWorker.resume
	*/
	ZipFileWorker.prototype.resume = function() {
		if (!GenericWorker.prototype.resume.call(this)) return false;
		if (!this.previous && this._sources.length) {
			this.prepareNextSource();
			return true;
		}
		if (!this.previous && !this._sources.length && !this.generatedError) {
			this.end();
			return true;
		}
	};
	/**
	* @see GenericWorker.error
	*/
	ZipFileWorker.prototype.error = function(e) {
		var sources = this._sources;
		if (!GenericWorker.prototype.error.call(this, e)) return false;
		for (var i = 0; i < sources.length; i++) try {
			sources[i].error(e);
		} catch (e) {}
		return true;
	};
	/**
	* @see GenericWorker.lock
	*/
	ZipFileWorker.prototype.lock = function() {
		GenericWorker.prototype.lock.call(this);
		var sources = this._sources;
		for (var i = 0; i < sources.length; i++) sources[i].lock();
	};
	module.exports = ZipFileWorker;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/generate/index.js
var require_generate = /* @__PURE__ */ __commonJSMin(((exports) => {
	var compressions = require_compressions();
	var ZipFileWorker = require_ZipFileWorker();
	/**
	* Find the compression to use.
	* @param {String} fileCompression the compression defined at the file level, if any.
	* @param {String} zipCompression the compression defined at the load() level.
	* @return {Object} the compression object to use.
	*/
	var getCompression = function(fileCompression, zipCompression) {
		var compressionName = fileCompression || zipCompression;
		var compression = compressions[compressionName];
		if (!compression) throw new Error(compressionName + " is not a valid compression method !");
		return compression;
	};
	/**
	* Create a worker to generate a zip file.
	* @param {JSZip} zip the JSZip instance at the right root level.
	* @param {Object} options to generate the zip file.
	* @param {String} comment the comment to use.
	*/
	exports.generateWorker = function(zip, options, comment) {
		var zipFileWorker = new ZipFileWorker(options.streamFiles, comment, options.platform, options.encodeFileName);
		var entriesCount = 0;
		try {
			zip.forEach(function(relativePath, file) {
				entriesCount++;
				var compression = getCompression(file.options.compression, options.compression);
				var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};
				var dir = file.dir, date = file.date;
				file._compressWorker(compression, compressionOptions).withStreamInfo("file", {
					name: relativePath,
					dir,
					date,
					comment: file.comment || "",
					unixPermissions: file.unixPermissions,
					dosPermissions: file.dosPermissions
				}).pipe(zipFileWorker);
			});
			zipFileWorker.entriesCount = entriesCount;
		} catch (e) {
			zipFileWorker.error(e);
		}
		return zipFileWorker;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/nodejs/NodejsStreamInputAdapter.js
var require_NodejsStreamInputAdapter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var GenericWorker = require_GenericWorker();
	/**
	* A worker that use a nodejs stream as source.
	* @constructor
	* @param {String} filename the name of the file entry for this stream.
	* @param {Readable} stream the nodejs stream.
	*/
	function NodejsStreamInputAdapter(filename, stream) {
		GenericWorker.call(this, "Nodejs stream input adapter for " + filename);
		this._upstreamEnded = false;
		this._bindStream(stream);
	}
	utils.inherits(NodejsStreamInputAdapter, GenericWorker);
	/**
	* Prepare the stream and bind the callbacks on it.
	* Do this ASAP on node 0.10 ! A lazy binding doesn't always work.
	* @param {Stream} stream the nodejs stream to use.
	*/
	NodejsStreamInputAdapter.prototype._bindStream = function(stream) {
		var self = this;
		this._stream = stream;
		stream.pause();
		stream.on("data", function(chunk) {
			self.push({
				data: chunk,
				meta: { percent: 0 }
			});
		}).on("error", function(e) {
			if (self.isPaused) this.generatedError = e;
			else self.error(e);
		}).on("end", function() {
			if (self.isPaused) self._upstreamEnded = true;
			else self.end();
		});
	};
	NodejsStreamInputAdapter.prototype.pause = function() {
		if (!GenericWorker.prototype.pause.call(this)) return false;
		this._stream.pause();
		return true;
	};
	NodejsStreamInputAdapter.prototype.resume = function() {
		if (!GenericWorker.prototype.resume.call(this)) return false;
		if (this._upstreamEnded) this.end();
		else this._stream.resume();
		return true;
	};
	module.exports = NodejsStreamInputAdapter;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/object.js
var require_object = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utf8 = require_utf8();
	var utils = require_utils();
	var GenericWorker = require_GenericWorker();
	var StreamHelper = require_StreamHelper();
	var defaults = require_defaults();
	var CompressedObject = require_compressedObject();
	var ZipObject = require_zipObject();
	var generate = require_generate();
	var nodejsUtils = require_nodejsUtils();
	var NodejsStreamInputAdapter = require_NodejsStreamInputAdapter();
	/**
	* Add a file in the current folder.
	* @private
	* @param {string} name the name of the file
	* @param {String|ArrayBuffer|Uint8Array|Buffer} data the data of the file
	* @param {Object} originalOptions the options of the file
	* @return {Object} the new file.
	*/
	var fileAdd = function(name, data, originalOptions) {
		var dataType = utils.getTypeOf(data), parent;
		var o = utils.extend(originalOptions || {}, defaults);
		o.date = o.date || /* @__PURE__ */ new Date();
		if (o.compression !== null) o.compression = o.compression.toUpperCase();
		if (typeof o.unixPermissions === "string") o.unixPermissions = parseInt(o.unixPermissions, 8);
		if (o.unixPermissions && o.unixPermissions & 16384) o.dir = true;
		if (o.dosPermissions && o.dosPermissions & 16) o.dir = true;
		if (o.dir) name = forceTrailingSlash(name);
		if (o.createFolders && (parent = parentFolder(name))) folderAdd.call(this, parent, true);
		var isUnicodeString = dataType === "string" && o.binary === false && o.base64 === false;
		if (!originalOptions || typeof originalOptions.binary === "undefined") o.binary = !isUnicodeString;
		if (data instanceof CompressedObject && data.uncompressedSize === 0 || o.dir || !data || data.length === 0) {
			o.base64 = false;
			o.binary = true;
			data = "";
			o.compression = "STORE";
			dataType = "string";
		}
		var zipObjectContent = null;
		if (data instanceof CompressedObject || data instanceof GenericWorker) zipObjectContent = data;
		else if (nodejsUtils.isNode && nodejsUtils.isStream(data)) zipObjectContent = new NodejsStreamInputAdapter(name, data);
		else zipObjectContent = utils.prepareContent(name, data, o.binary, o.optimizedBinaryString, o.base64);
		var object = new ZipObject(name, zipObjectContent, o);
		this.files[name] = object;
	};
	/**
	* Find the parent folder of the path.
	* @private
	* @param {string} path the path to use
	* @return {string} the parent folder, or ""
	*/
	var parentFolder = function(path) {
		if (path.slice(-1) === "/") path = path.substring(0, path.length - 1);
		var lastSlash = path.lastIndexOf("/");
		return lastSlash > 0 ? path.substring(0, lastSlash) : "";
	};
	/**
	* Returns the path with a slash at the end.
	* @private
	* @param {String} path the path to check.
	* @return {String} the path with a trailing slash.
	*/
	var forceTrailingSlash = function(path) {
		if (path.slice(-1) !== "/") path += "/";
		return path;
	};
	/**
	* Add a (sub) folder in the current folder.
	* @private
	* @param {string} name the folder's name
	* @param {boolean=} [createFolders] If true, automatically create sub
	*  folders. Defaults to false.
	* @return {Object} the new folder.
	*/
	var folderAdd = function(name, createFolders) {
		createFolders = typeof createFolders !== "undefined" ? createFolders : defaults.createFolders;
		name = forceTrailingSlash(name);
		if (!this.files[name]) fileAdd.call(this, name, null, {
			dir: true,
			createFolders
		});
		return this.files[name];
	};
	/**
	* Cross-window, cross-Node-context regular expression detection
	* @param  {Object}  object Anything
	* @return {Boolean}        true if the object is a regular expression,
	* false otherwise
	*/
	function isRegExp(object) {
		return Object.prototype.toString.call(object) === "[object RegExp]";
	}
	module.exports = {
		/**
		* @see loadAsync
		*/
		load: function() {
			throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
		},
		/**
		* Call a callback function for each entry at this folder level.
		* @param {Function} cb the callback function:
		* function (relativePath, file) {...}
		* It takes 2 arguments : the relative path and the file.
		*/
		forEach: function(cb) {
			var filename, relativePath, file;
			for (filename in this.files) {
				file = this.files[filename];
				relativePath = filename.slice(this.root.length, filename.length);
				if (relativePath && filename.slice(0, this.root.length) === this.root) cb(relativePath, file);
			}
		},
		/**
		* Filter nested files/folders with the specified function.
		* @param {Function} search the predicate to use :
		* function (relativePath, file) {...}
		* It takes 2 arguments : the relative path and the file.
		* @return {Array} An array of matching elements.
		*/
		filter: function(search) {
			var result = [];
			this.forEach(function(relativePath, entry) {
				if (search(relativePath, entry)) result.push(entry);
			});
			return result;
		},
		/**
		* Add a file to the zip file, or search a file.
		* @param   {string|RegExp} name The name of the file to add (if data is defined),
		* the name of the file to find (if no data) or a regex to match files.
		* @param   {String|ArrayBuffer|Uint8Array|Buffer} data  The file data, either raw or base64 encoded
		* @param   {Object} o     File options
		* @return  {JSZip|Object|Array} this JSZip object (when adding a file),
		* a file (when searching by string) or an array of files (when searching by regex).
		*/
		file: function(name, data, o) {
			if (arguments.length === 1) if (isRegExp(name)) {
				var regexp = name;
				return this.filter(function(relativePath, file) {
					return !file.dir && regexp.test(relativePath);
				});
			} else {
				var obj = this.files[this.root + name];
				if (obj && !obj.dir) return obj;
				else return null;
			}
			else {
				name = this.root + name;
				fileAdd.call(this, name, data, o);
			}
			return this;
		},
		/**
		* Add a directory to the zip file, or search.
		* @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
		* @return  {JSZip} an object with the new directory as the root, or an array containing matching folders.
		*/
		folder: function(arg) {
			if (!arg) return this;
			if (isRegExp(arg)) return this.filter(function(relativePath, file) {
				return file.dir && arg.test(relativePath);
			});
			var name = this.root + arg;
			var newFolder = folderAdd.call(this, name);
			var ret = this.clone();
			ret.root = newFolder.name;
			return ret;
		},
		/**
		* Delete a file, or a directory and all sub-files, from the zip
		* @param {string} name the name of the file to delete
		* @return {JSZip} this JSZip object
		*/
		remove: function(name) {
			name = this.root + name;
			var file = this.files[name];
			if (!file) {
				if (name.slice(-1) !== "/") name += "/";
				file = this.files[name];
			}
			if (file && !file.dir) delete this.files[name];
			else {
				var kids = this.filter(function(relativePath, file) {
					return file.name.slice(0, name.length) === name;
				});
				for (var i = 0; i < kids.length; i++) delete this.files[kids[i].name];
			}
			return this;
		},
		/**
		* @deprecated This method has been removed in JSZip 3.0, please check the upgrade guide.
		*/
		generate: function() {
			throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
		},
		/**
		* Generate the complete zip file as an internal stream.
		* @param {Object} options the options to generate the zip file :
		* - compression, "STORE" by default.
		* - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
		* @return {StreamHelper} the streamed zip file.
		*/
		generateInternalStream: function(options) {
			var worker, opts = {};
			try {
				opts = utils.extend(options || {}, {
					streamFiles: false,
					compression: "STORE",
					compressionOptions: null,
					type: "",
					platform: "DOS",
					comment: null,
					mimeType: "application/zip",
					encodeFileName: utf8.utf8encode
				});
				opts.type = opts.type.toLowerCase();
				opts.compression = opts.compression.toUpperCase();
				if (opts.type === "binarystring") opts.type = "string";
				if (!opts.type) throw new Error("No output type specified.");
				utils.checkSupport(opts.type);
				if (opts.platform === "darwin" || opts.platform === "freebsd" || opts.platform === "linux" || opts.platform === "sunos") opts.platform = "UNIX";
				if (opts.platform === "win32") opts.platform = "DOS";
				var comment = opts.comment || this.comment || "";
				worker = generate.generateWorker(this, opts, comment);
			} catch (e) {
				worker = new GenericWorker("error");
				worker.error(e);
			}
			return new StreamHelper(worker, opts.type || "string", opts.mimeType);
		},
		/**
		* Generate the complete zip file asynchronously.
		* @see generateInternalStream
		*/
		generateAsync: function(options, onUpdate) {
			return this.generateInternalStream(options).accumulate(onUpdate);
		},
		/**
		* Generate the complete zip file asynchronously.
		* @see generateInternalStream
		*/
		generateNodeStream: function(options, onUpdate) {
			options = options || {};
			if (!options.type) options.type = "nodebuffer";
			return this.generateInternalStream(options).toNodejsStream(onUpdate);
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/reader/DataReader.js
var require_DataReader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	function DataReader(data) {
		this.data = data;
		this.length = data.length;
		this.index = 0;
		this.zero = 0;
	}
	DataReader.prototype = {
		/**
		* Check that the offset will not go too far.
		* @param {string} offset the additional offset to check.
		* @throws {Error} an Error if the offset is out of bounds.
		*/
		checkOffset: function(offset) {
			this.checkIndex(this.index + offset);
		},
		/**
		* Check that the specified index will not be too far.
		* @param {string} newIndex the index to check.
		* @throws {Error} an Error if the index is out of bounds.
		*/
		checkIndex: function(newIndex) {
			if (this.length < this.zero + newIndex || newIndex < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + newIndex + "). Corrupted zip ?");
		},
		/**
		* Change the index.
		* @param {number} newIndex The new index.
		* @throws {Error} if the new index is out of the data.
		*/
		setIndex: function(newIndex) {
			this.checkIndex(newIndex);
			this.index = newIndex;
		},
		/**
		* Skip the next n bytes.
		* @param {number} n the number of bytes to skip.
		* @throws {Error} if the new index is out of the data.
		*/
		skip: function(n) {
			this.setIndex(this.index + n);
		},
		/**
		* Get the byte at the specified index.
		* @param {number} i the index to use.
		* @return {number} a byte.
		*/
		byteAt: function() {},
		/**
		* Get the next number with a given byte size.
		* @param {number} size the number of bytes to read.
		* @return {number} the corresponding number.
		*/
		readInt: function(size) {
			var result = 0, i;
			this.checkOffset(size);
			for (i = this.index + size - 1; i >= this.index; i--) result = (result << 8) + this.byteAt(i);
			this.index += size;
			return result;
		},
		/**
		* Get the next string with a given byte size.
		* @param {number} size the number of bytes to read.
		* @return {string} the corresponding string.
		*/
		readString: function(size) {
			return utils.transformTo("string", this.readData(size));
		},
		/**
		* Get raw data without conversion, <size> bytes.
		* @param {number} size the number of bytes to read.
		* @return {Object} the raw data, implementation specific.
		*/
		readData: function() {},
		/**
		* Find the last occurrence of a zip signature (4 bytes).
		* @param {string} sig the signature to find.
		* @return {number} the index of the last occurrence, -1 if not found.
		*/
		lastIndexOfSignature: function() {},
		/**
		* Read the signature (4 bytes) at the current position and compare it with sig.
		* @param {string} sig the expected signature
		* @return {boolean} true if the signature matches, false otherwise.
		*/
		readAndCheckSignature: function() {},
		/**
		* Get the next date.
		* @return {Date} the date.
		*/
		readDate: function() {
			var dostime = this.readInt(4);
			return new Date(Date.UTC((dostime >> 25 & 127) + 1980, (dostime >> 21 & 15) - 1, dostime >> 16 & 31, dostime >> 11 & 31, dostime >> 5 & 63, (dostime & 31) << 1));
		}
	};
	module.exports = DataReader;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/reader/ArrayReader.js
var require_ArrayReader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var DataReader = require_DataReader();
	var utils = require_utils();
	function ArrayReader(data) {
		DataReader.call(this, data);
		for (var i = 0; i < this.data.length; i++) data[i] = data[i] & 255;
	}
	utils.inherits(ArrayReader, DataReader);
	/**
	* @see DataReader.byteAt
	*/
	ArrayReader.prototype.byteAt = function(i) {
		return this.data[this.zero + i];
	};
	/**
	* @see DataReader.lastIndexOfSignature
	*/
	ArrayReader.prototype.lastIndexOfSignature = function(sig) {
		var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3);
		for (var i = this.length - 4; i >= 0; --i) if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) return i - this.zero;
		return -1;
	};
	/**
	* @see DataReader.readAndCheckSignature
	*/
	ArrayReader.prototype.readAndCheckSignature = function(sig) {
		var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3), data = this.readData(4);
		return sig0 === data[0] && sig1 === data[1] && sig2 === data[2] && sig3 === data[3];
	};
	/**
	* @see DataReader.readData
	*/
	ArrayReader.prototype.readData = function(size) {
		this.checkOffset(size);
		if (size === 0) return [];
		var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
		this.index += size;
		return result;
	};
	module.exports = ArrayReader;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/reader/StringReader.js
var require_StringReader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var DataReader = require_DataReader();
	var utils = require_utils();
	function StringReader(data) {
		DataReader.call(this, data);
	}
	utils.inherits(StringReader, DataReader);
	/**
	* @see DataReader.byteAt
	*/
	StringReader.prototype.byteAt = function(i) {
		return this.data.charCodeAt(this.zero + i);
	};
	/**
	* @see DataReader.lastIndexOfSignature
	*/
	StringReader.prototype.lastIndexOfSignature = function(sig) {
		return this.data.lastIndexOf(sig) - this.zero;
	};
	/**
	* @see DataReader.readAndCheckSignature
	*/
	StringReader.prototype.readAndCheckSignature = function(sig) {
		return sig === this.readData(4);
	};
	/**
	* @see DataReader.readData
	*/
	StringReader.prototype.readData = function(size) {
		this.checkOffset(size);
		var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
		this.index += size;
		return result;
	};
	module.exports = StringReader;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/reader/Uint8ArrayReader.js
var require_Uint8ArrayReader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var ArrayReader = require_ArrayReader();
	var utils = require_utils();
	function Uint8ArrayReader(data) {
		ArrayReader.call(this, data);
	}
	utils.inherits(Uint8ArrayReader, ArrayReader);
	/**
	* @see DataReader.readData
	*/
	Uint8ArrayReader.prototype.readData = function(size) {
		this.checkOffset(size);
		if (size === 0) return /* @__PURE__ */ new Uint8Array(0);
		var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
		this.index += size;
		return result;
	};
	module.exports = Uint8ArrayReader;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/reader/NodeBufferReader.js
var require_NodeBufferReader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Uint8ArrayReader = require_Uint8ArrayReader();
	var utils = require_utils();
	function NodeBufferReader(data) {
		Uint8ArrayReader.call(this, data);
	}
	utils.inherits(NodeBufferReader, Uint8ArrayReader);
	/**
	* @see DataReader.readData
	*/
	NodeBufferReader.prototype.readData = function(size) {
		this.checkOffset(size);
		var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
		this.index += size;
		return result;
	};
	module.exports = NodeBufferReader;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/reader/readerFor.js
var require_readerFor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var support = require_support();
	var ArrayReader = require_ArrayReader();
	var StringReader = require_StringReader();
	var NodeBufferReader = require_NodeBufferReader();
	var Uint8ArrayReader = require_Uint8ArrayReader();
	/**
	* Create a reader adapted to the data.
	* @param {String|ArrayBuffer|Uint8Array|Buffer} data the data to read.
	* @return {DataReader} the data reader.
	*/
	module.exports = function(data) {
		var type = utils.getTypeOf(data);
		utils.checkSupport(type);
		if (type === "string" && !support.uint8array) return new StringReader(data);
		if (type === "nodebuffer") return new NodeBufferReader(data);
		if (support.uint8array) return new Uint8ArrayReader(utils.transformTo("uint8array", data));
		return new ArrayReader(utils.transformTo("array", data));
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/zipEntry.js
var require_zipEntry = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var readerFor = require_readerFor();
	var utils = require_utils();
	var CompressedObject = require_compressedObject();
	var crc32fn = require_crc32$1();
	var utf8 = require_utf8();
	var compressions = require_compressions();
	var support = require_support();
	var MADE_BY_DOS = 0;
	var MADE_BY_UNIX = 3;
	/**
	* Find a compression registered in JSZip.
	* @param {string} compressionMethod the method magic to find.
	* @return {Object|null} the JSZip compression object, null if none found.
	*/
	var findCompression = function(compressionMethod) {
		for (var method in compressions) {
			if (!Object.prototype.hasOwnProperty.call(compressions, method)) continue;
			if (compressions[method].magic === compressionMethod) return compressions[method];
		}
		return null;
	};
	/**
	* An entry in the zip file.
	* @constructor
	* @param {Object} options Options of the current file.
	* @param {Object} loadOptions Options for loading the stream.
	*/
	function ZipEntry(options, loadOptions) {
		this.options = options;
		this.loadOptions = loadOptions;
	}
	ZipEntry.prototype = {
		/**
		* say if the file is encrypted.
		* @return {boolean} true if the file is encrypted, false otherwise.
		*/
		isEncrypted: function() {
			return (this.bitFlag & 1) === 1;
		},
		/**
		* say if the file has utf-8 filename/comment.
		* @return {boolean} true if the filename/comment is in utf-8, false otherwise.
		*/
		useUTF8: function() {
			return (this.bitFlag & 2048) === 2048;
		},
		/**
		* Read the local part of a zip file and add the info in this object.
		* @param {DataReader} reader the reader to use.
		*/
		readLocalPart: function(reader) {
			var compression, localExtraFieldsLength;
			reader.skip(22);
			this.fileNameLength = reader.readInt(2);
			localExtraFieldsLength = reader.readInt(2);
			this.fileName = reader.readData(this.fileNameLength);
			reader.skip(localExtraFieldsLength);
			if (this.compressedSize === -1 || this.uncompressedSize === -1) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
			compression = findCompression(this.compressionMethod);
			if (compression === null) throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + utils.transformTo("string", this.fileName) + ")");
			this.decompressed = new CompressedObject(this.compressedSize, this.uncompressedSize, this.crc32, compression, reader.readData(this.compressedSize));
		},
		/**
		* Read the central part of a zip file and add the info in this object.
		* @param {DataReader} reader the reader to use.
		*/
		readCentralPart: function(reader) {
			this.versionMadeBy = reader.readInt(2);
			reader.skip(2);
			this.bitFlag = reader.readInt(2);
			this.compressionMethod = reader.readString(2);
			this.date = reader.readDate();
			this.crc32 = reader.readInt(4);
			this.compressedSize = reader.readInt(4);
			this.uncompressedSize = reader.readInt(4);
			var fileNameLength = reader.readInt(2);
			this.extraFieldsLength = reader.readInt(2);
			this.fileCommentLength = reader.readInt(2);
			this.diskNumberStart = reader.readInt(2);
			this.internalFileAttributes = reader.readInt(2);
			this.externalFileAttributes = reader.readInt(4);
			this.localHeaderOffset = reader.readInt(4);
			if (this.isEncrypted()) throw new Error("Encrypted zip are not supported");
			reader.skip(fileNameLength);
			this.readExtraFields(reader);
			this.parseZIP64ExtraField(reader);
			this.fileComment = reader.readData(this.fileCommentLength);
		},
		/**
		* Parse the external file attributes and get the unix/dos permissions.
		*/
		processAttributes: function() {
			this.unixPermissions = null;
			this.dosPermissions = null;
			var madeBy = this.versionMadeBy >> 8;
			this.dir = this.externalFileAttributes & 16 ? true : false;
			if (madeBy === MADE_BY_DOS) this.dosPermissions = this.externalFileAttributes & 63;
			if (madeBy === MADE_BY_UNIX) this.unixPermissions = this.externalFileAttributes >> 16 & 65535;
			if (!this.dir && this.fileNameStr.slice(-1) === "/") this.dir = true;
		},
		/**
		* Parse the ZIP64 extra field and merge the info in the current ZipEntry.
		* @param {DataReader} reader the reader to use.
		*/
		parseZIP64ExtraField: function() {
			if (!this.extraFields[1]) return;
			var extraReader = readerFor(this.extraFields[1].value);
			if (this.uncompressedSize === utils.MAX_VALUE_32BITS) this.uncompressedSize = extraReader.readInt(8);
			if (this.compressedSize === utils.MAX_VALUE_32BITS) this.compressedSize = extraReader.readInt(8);
			if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) this.localHeaderOffset = extraReader.readInt(8);
			if (this.diskNumberStart === utils.MAX_VALUE_32BITS) this.diskNumberStart = extraReader.readInt(4);
		},
		/**
		* Read the central part of a zip file and add the info in this object.
		* @param {DataReader} reader the reader to use.
		*/
		readExtraFields: function(reader) {
			var end = reader.index + this.extraFieldsLength, extraFieldId, extraFieldLength, extraFieldValue;
			if (!this.extraFields) this.extraFields = {};
			while (reader.index + 4 < end) {
				extraFieldId = reader.readInt(2);
				extraFieldLength = reader.readInt(2);
				extraFieldValue = reader.readData(extraFieldLength);
				this.extraFields[extraFieldId] = {
					id: extraFieldId,
					length: extraFieldLength,
					value: extraFieldValue
				};
			}
			reader.setIndex(end);
		},
		/**
		* Apply an UTF8 transformation if needed.
		*/
		handleUTF8: function() {
			var decodeParamType = support.uint8array ? "uint8array" : "array";
			if (this.useUTF8()) {
				this.fileNameStr = utf8.utf8decode(this.fileName);
				this.fileCommentStr = utf8.utf8decode(this.fileComment);
			} else {
				var upath = this.findExtraFieldUnicodePath();
				if (upath !== null) this.fileNameStr = upath;
				else {
					var fileNameByteArray = utils.transformTo(decodeParamType, this.fileName);
					this.fileNameStr = this.loadOptions.decodeFileName(fileNameByteArray);
				}
				var ucomment = this.findExtraFieldUnicodeComment();
				if (ucomment !== null) this.fileCommentStr = ucomment;
				else {
					var commentByteArray = utils.transformTo(decodeParamType, this.fileComment);
					this.fileCommentStr = this.loadOptions.decodeFileName(commentByteArray);
				}
			}
		},
		/**
		* Find the unicode path declared in the extra field, if any.
		* @return {String} the unicode path, null otherwise.
		*/
		findExtraFieldUnicodePath: function() {
			var upathField = this.extraFields[28789];
			if (upathField) {
				var extraReader = readerFor(upathField.value);
				if (extraReader.readInt(1) !== 1) return null;
				if (crc32fn(this.fileName) !== extraReader.readInt(4)) return null;
				return utf8.utf8decode(extraReader.readData(upathField.length - 5));
			}
			return null;
		},
		/**
		* Find the unicode comment declared in the extra field, if any.
		* @return {String} the unicode comment, null otherwise.
		*/
		findExtraFieldUnicodeComment: function() {
			var ucommentField = this.extraFields[25461];
			if (ucommentField) {
				var extraReader = readerFor(ucommentField.value);
				if (extraReader.readInt(1) !== 1) return null;
				if (crc32fn(this.fileComment) !== extraReader.readInt(4)) return null;
				return utf8.utf8decode(extraReader.readData(ucommentField.length - 5));
			}
			return null;
		}
	};
	module.exports = ZipEntry;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/zipEntries.js
var require_zipEntries = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var readerFor = require_readerFor();
	var utils = require_utils();
	var sig = require_signature();
	var ZipEntry = require_zipEntry();
	var support = require_support();
	/**
	* All the entries in the zip file.
	* @constructor
	* @param {Object} loadOptions Options for loading the stream.
	*/
	function ZipEntries(loadOptions) {
		this.files = [];
		this.loadOptions = loadOptions;
	}
	ZipEntries.prototype = {
		/**
		* Check that the reader is on the specified signature.
		* @param {string} expectedSignature the expected signature.
		* @throws {Error} if it is an other signature.
		*/
		checkSignature: function(expectedSignature) {
			if (!this.reader.readAndCheckSignature(expectedSignature)) {
				this.reader.index -= 4;
				var signature = this.reader.readString(4);
				throw new Error("Corrupted zip or bug: unexpected signature (" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
			}
		},
		/**
		* Check if the given signature is at the given index.
		* @param {number} askedIndex the index to check.
		* @param {string} expectedSignature the signature to expect.
		* @return {boolean} true if the signature is here, false otherwise.
		*/
		isSignature: function(askedIndex, expectedSignature) {
			var currentIndex = this.reader.index;
			this.reader.setIndex(askedIndex);
			var result = this.reader.readString(4) === expectedSignature;
			this.reader.setIndex(currentIndex);
			return result;
		},
		/**
		* Read the end of the central directory.
		*/
		readBlockEndOfCentral: function() {
			this.diskNumber = this.reader.readInt(2);
			this.diskWithCentralDirStart = this.reader.readInt(2);
			this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
			this.centralDirRecords = this.reader.readInt(2);
			this.centralDirSize = this.reader.readInt(4);
			this.centralDirOffset = this.reader.readInt(4);
			this.zipCommentLength = this.reader.readInt(2);
			var zipComment = this.reader.readData(this.zipCommentLength);
			var decodeParamType = support.uint8array ? "uint8array" : "array";
			var decodeContent = utils.transformTo(decodeParamType, zipComment);
			this.zipComment = this.loadOptions.decodeFileName(decodeContent);
		},
		/**
		* Read the end of the Zip 64 central directory.
		* Not merged with the method readEndOfCentral :
		* The end of central can coexist with its Zip64 brother,
		* I don't want to read the wrong number of bytes !
		*/
		readBlockZip64EndOfCentral: function() {
			this.zip64EndOfCentralSize = this.reader.readInt(8);
			this.reader.skip(4);
			this.diskNumber = this.reader.readInt(4);
			this.diskWithCentralDirStart = this.reader.readInt(4);
			this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
			this.centralDirRecords = this.reader.readInt(8);
			this.centralDirSize = this.reader.readInt(8);
			this.centralDirOffset = this.reader.readInt(8);
			this.zip64ExtensibleData = {};
			var extraDataSize = this.zip64EndOfCentralSize - 44, index = 0, extraFieldId, extraFieldLength, extraFieldValue;
			while (index < extraDataSize) {
				extraFieldId = this.reader.readInt(2);
				extraFieldLength = this.reader.readInt(4);
				extraFieldValue = this.reader.readData(extraFieldLength);
				this.zip64ExtensibleData[extraFieldId] = {
					id: extraFieldId,
					length: extraFieldLength,
					value: extraFieldValue
				};
			}
		},
		/**
		* Read the end of the Zip 64 central directory locator.
		*/
		readBlockZip64EndOfCentralLocator: function() {
			this.diskWithZip64CentralDirStart = this.reader.readInt(4);
			this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
			this.disksCount = this.reader.readInt(4);
			if (this.disksCount > 1) throw new Error("Multi-volumes zip are not supported");
		},
		/**
		* Read the local files, based on the offset read in the central part.
		*/
		readLocalFiles: function() {
			var i, file;
			for (i = 0; i < this.files.length; i++) {
				file = this.files[i];
				this.reader.setIndex(file.localHeaderOffset);
				this.checkSignature(sig.LOCAL_FILE_HEADER);
				file.readLocalPart(this.reader);
				file.handleUTF8();
				file.processAttributes();
			}
		},
		/**
		* Read the central directory.
		*/
		readCentralDir: function() {
			var file;
			this.reader.setIndex(this.centralDirOffset);
			while (this.reader.readAndCheckSignature(sig.CENTRAL_FILE_HEADER)) {
				file = new ZipEntry({ zip64: this.zip64 }, this.loadOptions);
				file.readCentralPart(this.reader);
				this.files.push(file);
			}
			if (this.centralDirRecords !== this.files.length) {
				if (this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
			}
		},
		/**
		* Read the end of central directory.
		*/
		readEndOfCentral: function() {
			var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
			if (offset < 0) if (!this.isSignature(0, sig.LOCAL_FILE_HEADER)) throw new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
			else throw new Error("Corrupted zip: can't find end of central directory");
			this.reader.setIndex(offset);
			var endOfCentralDirOffset = offset;
			this.checkSignature(sig.CENTRAL_DIRECTORY_END);
			this.readBlockEndOfCentral();
			if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
				this.zip64 = true;
				offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
				if (offset < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
				this.reader.setIndex(offset);
				this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
				this.readBlockZip64EndOfCentralLocator();
				if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, sig.ZIP64_CENTRAL_DIRECTORY_END)) {
					this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
					if (this.relativeOffsetEndOfZip64CentralDir < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
				}
				this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
				this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
				this.readBlockZip64EndOfCentral();
			}
			var expectedEndOfCentralDirOffset = this.centralDirOffset + this.centralDirSize;
			if (this.zip64) {
				expectedEndOfCentralDirOffset += 20;
				expectedEndOfCentralDirOffset += 12 + this.zip64EndOfCentralSize;
			}
			var extraBytes = endOfCentralDirOffset - expectedEndOfCentralDirOffset;
			if (extraBytes > 0) if (this.isSignature(endOfCentralDirOffset, sig.CENTRAL_FILE_HEADER)) {} else this.reader.zero = extraBytes;
			else if (extraBytes < 0) throw new Error("Corrupted zip: missing " + Math.abs(extraBytes) + " bytes.");
		},
		prepareReader: function(data) {
			this.reader = readerFor(data);
		},
		/**
		* Read a zip file and create ZipEntries.
		* @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary string representing a zip file.
		*/
		load: function(data) {
			this.prepareReader(data);
			this.readEndOfCentral();
			this.readCentralDir();
			this.readLocalFiles();
		}
	};
	module.exports = ZipEntries;
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/load.js
var require_load = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var external = require_external();
	var utf8 = require_utf8();
	var ZipEntries = require_zipEntries();
	var Crc32Probe = require_Crc32Probe();
	var nodejsUtils = require_nodejsUtils();
	/**
	* Check the CRC32 of an entry.
	* @param {ZipEntry} zipEntry the zip entry to check.
	* @return {Promise} the result.
	*/
	function checkEntryCRC32(zipEntry) {
		return new external.Promise(function(resolve, reject) {
			var worker = zipEntry.decompressed.getContentWorker().pipe(new Crc32Probe());
			worker.on("error", function(e) {
				reject(e);
			}).on("end", function() {
				if (worker.streamInfo.crc32 !== zipEntry.decompressed.crc32) reject(/* @__PURE__ */ new Error("Corrupted zip : CRC32 mismatch"));
				else resolve();
			}).resume();
		});
	}
	module.exports = function(data, options) {
		var zip = this;
		options = utils.extend(options || {}, {
			base64: false,
			checkCRC32: false,
			optimizedBinaryString: false,
			createFolders: false,
			decodeFileName: utf8.utf8decode
		});
		if (nodejsUtils.isNode && nodejsUtils.isStream(data)) return external.Promise.reject(/* @__PURE__ */ new Error("JSZip can't accept a stream when loading a zip file."));
		return utils.prepareContent("the loaded zip file", data, true, options.optimizedBinaryString, options.base64).then(function(data) {
			var zipEntries = new ZipEntries(options);
			zipEntries.load(data);
			return zipEntries;
		}).then(function checkCRC32(zipEntries) {
			var promises = [external.Promise.resolve(zipEntries)];
			var files = zipEntries.files;
			if (options.checkCRC32) for (var i = 0; i < files.length; i++) promises.push(checkEntryCRC32(files[i]));
			return external.Promise.all(promises);
		}).then(function addFiles(results) {
			var zipEntries = results.shift();
			var files = zipEntries.files;
			for (var i = 0; i < files.length; i++) {
				var input = files[i];
				var unsafeName = input.fileNameStr;
				var safeName = utils.resolve(input.fileNameStr);
				zip.file(safeName, input.decompressed, {
					binary: true,
					optimizedBinaryString: true,
					date: input.date,
					dir: input.dir,
					comment: input.fileCommentStr.length ? input.fileCommentStr : null,
					unixPermissions: input.unixPermissions,
					dosPermissions: input.dosPermissions,
					createFolders: options.createFolders
				});
				if (!input.dir) zip.file(safeName).unsafeOriginalName = unsafeName;
			}
			if (zipEntries.zipComment.length) zip.comment = zipEntries.zipComment;
			return zip;
		});
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/jszip@3.10.2/node_modules/jszip/lib/index.js
var require_lib$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Representation a of zip file in js
	* @constructor
	*/
	function JSZip() {
		if (!(this instanceof JSZip)) return new JSZip();
		if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
		this.files = Object.create(null);
		this.comment = null;
		this.root = "";
		this.clone = function() {
			var newObj = new JSZip();
			for (var i in this) if (typeof this[i] !== "function") newObj[i] = this[i];
			return newObj;
		};
	}
	JSZip.prototype = require_object();
	JSZip.prototype.loadAsync = require_load();
	JSZip.support = require_support();
	JSZip.defaults = require_defaults();
	JSZip.version = "3.10.2";
	JSZip.loadAsync = function(content, options) {
		return new JSZip().loadAsync(content, options);
	};
	JSZip.external = require_external();
	module.exports = JSZip;
}));
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-mindmap@3.1.2/node_modules/@file-viewer/renderer-mindmap/dist/index.js
var mindmapDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "mindmap");
if (!mindmapDefinition) throw new Error("@file-viewer/renderer-mindmap could not locate the core mind map renderer definition.");
var mindmapRendererDefinition = mindmapDefinition;
var renderFileViewerMindMap = (buffer, target, type, context) => __vitePreload(async () => {
	const { default: renderXMind } = await import("./xmind-DQvR74hj.js");
	return { default: renderXMind };
}, []).then(({ default: renderXMind }) => renderXMind(buffer, target, type, context));
var mindmapRenderer = {
	id: "file-viewer-renderer-mindmap",
	label: "Flyfish File Viewer mind map renderer",
	definitions: [mindmapRendererDefinition],
	handlers: [{
		rendererId: mindmapRendererDefinition.id,
		handler: renderFileViewerMindMap
	}]
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-mindmap@3.1.2/node_modules/@file-viewer/renderer-mindmap/dist/vendor/xmind.js
var import_lib = /* @__PURE__ */ __toESM$1(require_lib$1(), 1);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
	try {
		return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
	} catch (e) {
		throw mod = 0, e;
	}
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: () => from[key],
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var require_conventions = __commonJS({ "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/conventions.js"(exports) {
	"use strict";
	function find(list, predicate, ac) {
		if (ac === void 0) ac = Array.prototype;
		if (list && typeof ac.find === "function") return ac.find.call(list, predicate);
		for (var i = 0; i < list.length; i++) if (hasOwn(list, i)) {
			var item = list[i];
			if (predicate.call(void 0, item, i, list)) return item;
		}
	}
	function freeze(object, oc) {
		if (oc === void 0) oc = Object;
		if (oc && typeof oc.getOwnPropertyDescriptors === "function") object = oc.create(null, oc.getOwnPropertyDescriptors(object));
		return oc && typeof oc.freeze === "function" ? oc.freeze(object) : object;
	}
	function hasOwn(object, key) {
		return Object.prototype.hasOwnProperty.call(object, key);
	}
	function assign(target, source) {
		if (target === null || typeof target !== "object") throw new TypeError("target is not an object");
		for (var key in source) if (hasOwn(source, key)) target[key] = source[key];
		return target;
	}
	var HTML_BOOLEAN_ATTRIBUTES = freeze({
		allowfullscreen: true,
		async: true,
		autofocus: true,
		autoplay: true,
		checked: true,
		controls: true,
		default: true,
		defer: true,
		disabled: true,
		formnovalidate: true,
		hidden: true,
		ismap: true,
		itemscope: true,
		loop: true,
		multiple: true,
		muted: true,
		nomodule: true,
		novalidate: true,
		open: true,
		playsinline: true,
		readonly: true,
		required: true,
		reversed: true,
		selected: true
	});
	function isHTMLBooleanAttribute(name) {
		return hasOwn(HTML_BOOLEAN_ATTRIBUTES, name.toLowerCase());
	}
	var HTML_VOID_ELEMENTS = freeze({
		area: true,
		base: true,
		br: true,
		col: true,
		embed: true,
		hr: true,
		img: true,
		input: true,
		link: true,
		meta: true,
		param: true,
		source: true,
		track: true,
		wbr: true
	});
	function isHTMLVoidElement(tagName) {
		return hasOwn(HTML_VOID_ELEMENTS, tagName.toLowerCase());
	}
	var HTML_RAW_TEXT_ELEMENTS = freeze({
		script: false,
		style: false,
		textarea: true,
		title: true
	});
	function isHTMLRawTextElement(tagName) {
		var key = tagName.toLowerCase();
		return hasOwn(HTML_RAW_TEXT_ELEMENTS, key) && !HTML_RAW_TEXT_ELEMENTS[key];
	}
	function isHTMLEscapableRawTextElement(tagName) {
		var key = tagName.toLowerCase();
		return hasOwn(HTML_RAW_TEXT_ELEMENTS, key) && HTML_RAW_TEXT_ELEMENTS[key];
	}
	function isHTMLMimeType(mimeType) {
		return mimeType === MIME_TYPE.HTML;
	}
	function hasDefaultHTMLNamespace(mimeType) {
		return isHTMLMimeType(mimeType) || mimeType === MIME_TYPE.XML_XHTML_APPLICATION;
	}
	var MIME_TYPE = freeze({
		/**
		* `text/html`, the only mime type that triggers treating an XML document as HTML.
		*
		* @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
		* @see https://en.wikipedia.org/wiki/HTML Wikipedia
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
		* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring
		*      WHATWG HTML Spec
		*/
		HTML: "text/html",
		/**
		* `application/xml`, the standard mime type for XML documents.
		*
		* @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType
		*      registration
		* @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
		* @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
		*/
		XML_APPLICATION: "application/xml",
		/**
		* `text/xml`, an alias for `application/xml`.
		*
		* @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
		* @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
		* @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
		*/
		XML_TEXT: "text/xml",
		/**
		* `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
		* but is parsed as an XML document.
		*
		* @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType
		*      registration
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
		* @see https://en.wikipedia.org/wiki/XHTML Wikipedia
		*/
		XML_XHTML_APPLICATION: "application/xhtml+xml",
		/**
		* `image/svg+xml`,
		*
		* @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
		* @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
		* @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
		*/
		XML_SVG_IMAGE: "image/svg+xml"
	});
	var _MIME_TYPES = Object.keys(MIME_TYPE).map(function(key) {
		return MIME_TYPE[key];
	});
	function isValidMimeType(mimeType) {
		return _MIME_TYPES.indexOf(mimeType) > -1;
	}
	var NAMESPACE = freeze({
		/**
		* The XHTML namespace.
		*
		* @see http://www.w3.org/1999/xhtml
		*/
		HTML: "http://www.w3.org/1999/xhtml",
		/**
		* The SVG namespace.
		*
		* @see http://www.w3.org/2000/svg
		*/
		SVG: "http://www.w3.org/2000/svg",
		/**
		* The `xml:` namespace.
		*
		* @see http://www.w3.org/XML/1998/namespace
		*/
		XML: "http://www.w3.org/XML/1998/namespace",
		/**
		* The `xmlns:` namespace.
		*
		* @see https://www.w3.org/2000/xmlns/
		*/
		XMLNS: "http://www.w3.org/2000/xmlns/"
	});
	exports.assign = assign;
	exports.find = find;
	exports.freeze = freeze;
	exports.HTML_BOOLEAN_ATTRIBUTES = HTML_BOOLEAN_ATTRIBUTES;
	exports.HTML_RAW_TEXT_ELEMENTS = HTML_RAW_TEXT_ELEMENTS;
	exports.HTML_VOID_ELEMENTS = HTML_VOID_ELEMENTS;
	exports.hasDefaultHTMLNamespace = hasDefaultHTMLNamespace;
	exports.hasOwn = hasOwn;
	exports.isHTMLBooleanAttribute = isHTMLBooleanAttribute;
	exports.isHTMLRawTextElement = isHTMLRawTextElement;
	exports.isHTMLEscapableRawTextElement = isHTMLEscapableRawTextElement;
	exports.isHTMLMimeType = isHTMLMimeType;
	exports.isHTMLVoidElement = isHTMLVoidElement;
	exports.isValidMimeType = isValidMimeType;
	exports.MIME_TYPE = MIME_TYPE;
	exports.NAMESPACE = NAMESPACE;
} });
var require_errors = __commonJS({ "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/errors.js"(exports) {
	"use strict";
	var conventions = require_conventions();
	function extendError(constructor, writableName) {
		constructor.prototype = Object.create(Error.prototype, {
			constructor: { value: constructor },
			name: {
				value: constructor.name,
				enumerable: true,
				writable: writableName
			}
		});
	}
	var DOMExceptionName = conventions.freeze({
		/**
		* the default value as defined by the spec
		*/
		Error: "Error",
		/**
		* @deprecated
		* Use RangeError instead.
		*/
		IndexSizeError: "IndexSizeError",
		/**
		* @deprecated
		* Just to match the related static code, not part of the spec.
		*/
		DomstringSizeError: "DomstringSizeError",
		HierarchyRequestError: "HierarchyRequestError",
		WrongDocumentError: "WrongDocumentError",
		InvalidCharacterError: "InvalidCharacterError",
		/**
		* @deprecated
		* Just to match the related static code, not part of the spec.
		*/
		NoDataAllowedError: "NoDataAllowedError",
		NoModificationAllowedError: "NoModificationAllowedError",
		NotFoundError: "NotFoundError",
		NotSupportedError: "NotSupportedError",
		InUseAttributeError: "InUseAttributeError",
		InvalidStateError: "InvalidStateError",
		SyntaxError: "SyntaxError",
		InvalidModificationError: "InvalidModificationError",
		NamespaceError: "NamespaceError",
		/**
		* @deprecated
		* Use TypeError for invalid arguments,
		* "NotSupportedError" DOMException for unsupported operations,
		* and "NotAllowedError" DOMException for denied requests instead.
		*/
		InvalidAccessError: "InvalidAccessError",
		/**
		* @deprecated
		* Just to match the related static code, not part of the spec.
		*/
		ValidationError: "ValidationError",
		/**
		* @deprecated
		* Use TypeError instead.
		*/
		TypeMismatchError: "TypeMismatchError",
		SecurityError: "SecurityError",
		NetworkError: "NetworkError",
		AbortError: "AbortError",
		/**
		* @deprecated
		* Just to match the related static code, not part of the spec.
		*/
		URLMismatchError: "URLMismatchError",
		QuotaExceededError: "QuotaExceededError",
		TimeoutError: "TimeoutError",
		InvalidNodeTypeError: "InvalidNodeTypeError",
		DataCloneError: "DataCloneError",
		EncodingError: "EncodingError",
		NotReadableError: "NotReadableError",
		UnknownError: "UnknownError",
		ConstraintError: "ConstraintError",
		DataError: "DataError",
		TransactionInactiveError: "TransactionInactiveError",
		ReadOnlyError: "ReadOnlyError",
		VersionError: "VersionError",
		OperationError: "OperationError",
		NotAllowedError: "NotAllowedError",
		OptOutError: "OptOutError"
	});
	var DOMExceptionNames = Object.keys(DOMExceptionName);
	function isValidDomExceptionCode(value) {
		return typeof value === "number" && value >= 1 && value <= 25;
	}
	function endsWithError(value) {
		return typeof value === "string" && value.substring(value.length - DOMExceptionName.Error.length) === DOMExceptionName.Error;
	}
	function DOMException(messageOrCode, nameOrMessage) {
		if (isValidDomExceptionCode(messageOrCode)) {
			this.name = DOMExceptionNames[messageOrCode];
			this.message = nameOrMessage || "";
		} else {
			this.message = messageOrCode;
			this.name = endsWithError(nameOrMessage) ? nameOrMessage : DOMExceptionName.Error;
		}
		if (Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
	}
	extendError(DOMException, true);
	Object.defineProperties(DOMException.prototype, { code: {
		enumerable: true,
		get: function() {
			var code = DOMExceptionNames.indexOf(this.name);
			if (isValidDomExceptionCode(code)) return code;
			return 0;
		}
	} });
	var ExceptionCode = {
		INDEX_SIZE_ERR: 1,
		DOMSTRING_SIZE_ERR: 2,
		HIERARCHY_REQUEST_ERR: 3,
		WRONG_DOCUMENT_ERR: 4,
		INVALID_CHARACTER_ERR: 5,
		NO_DATA_ALLOWED_ERR: 6,
		NO_MODIFICATION_ALLOWED_ERR: 7,
		NOT_FOUND_ERR: 8,
		NOT_SUPPORTED_ERR: 9,
		INUSE_ATTRIBUTE_ERR: 10,
		INVALID_STATE_ERR: 11,
		SYNTAX_ERR: 12,
		INVALID_MODIFICATION_ERR: 13,
		NAMESPACE_ERR: 14,
		INVALID_ACCESS_ERR: 15,
		VALIDATION_ERR: 16,
		TYPE_MISMATCH_ERR: 17,
		SECURITY_ERR: 18,
		NETWORK_ERR: 19,
		ABORT_ERR: 20,
		URL_MISMATCH_ERR: 21,
		QUOTA_EXCEEDED_ERR: 22,
		TIMEOUT_ERR: 23,
		INVALID_NODE_TYPE_ERR: 24,
		DATA_CLONE_ERR: 25
	};
	var entries = Object.entries(ExceptionCode);
	for (i = 0; i < entries.length; i++) {
		key = entries[i][0];
		DOMException[key] = entries[i][1];
	}
	var key;
	var i;
	function ParseError(message, locator, cause) {
		this.message = message;
		this.locator = locator;
		this.cause = cause;
		if (Error.captureStackTrace) Error.captureStackTrace(this, ParseError);
	}
	extendError(ParseError);
	exports.DOMException = DOMException;
	exports.DOMExceptionName = DOMExceptionName;
	exports.ExceptionCode = ExceptionCode;
	exports.ParseError = ParseError;
} });
var require_grammar = __commonJS({ "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/grammar.js"(exports) {
	"use strict";
	function detectUnicodeSupport(RegExpImpl) {
		try {
			if (typeof RegExpImpl !== "function") RegExpImpl = RegExp;
			var match = new RegExpImpl("𝌆", "u").exec("𝌆");
			return !!match && match[0].length === 2;
		} catch (error) {}
		return false;
	}
	var UNICODE_SUPPORT = detectUnicodeSupport();
	function chars(regexp) {
		if (regexp.source[0] !== "[") throw new Error(regexp + " can not be used with chars");
		return regexp.source.slice(1, regexp.source.lastIndexOf("]"));
	}
	function chars_without(regexp, search) {
		if (regexp.source[0] !== "[") throw new Error("/" + regexp.source + "/ can not be used with chars_without");
		if (!search || typeof search !== "string") throw new Error(JSON.stringify(search) + " is not a valid search");
		if (regexp.source.indexOf(search) === -1) throw new Error("\"" + search + "\" is not is /" + regexp.source + "/");
		if (search === "-" && regexp.source.indexOf(search) !== 1) throw new Error("\"" + search + "\" is not at the first postion of /" + regexp.source + "/");
		return new RegExp(regexp.source.replace(search, ""), UNICODE_SUPPORT ? "u" : "");
	}
	function reg(args) {
		var self = this;
		return new RegExp(Array.prototype.slice.call(arguments).map(function(part) {
			var isStr = typeof part === "string";
			if (isStr && self === void 0 && part === "|") throw new Error("use regg instead of reg to wrap expressions with `|`!");
			return isStr ? part : part.source;
		}).join(""), UNICODE_SUPPORT ? "u" : "");
	}
	function regg(args) {
		if (arguments.length === 0) throw new Error("no parameters provided");
		return reg.apply(regg, ["(?:"].concat(Array.prototype.slice.call(arguments), [")"]));
	}
	var UNICODE_REPLACEMENT_CHARACTER = "�";
	var Char = /[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;
	if (UNICODE_SUPPORT) Char = reg("[", chars(Char), "\\u{10000}-\\u{10FFFF}", "]");
	var InvalidChar = new RegExp("[^" + chars(Char) + "]", UNICODE_SUPPORT ? "u" : "");
	var _SChar = /[\x20\x09\x0D\x0A]/;
	var SChar_s = chars(_SChar);
	var S = reg(_SChar, "+");
	var S_OPT = reg(_SChar, "*");
	var NameStartChar = /[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
	if (UNICODE_SUPPORT) NameStartChar = reg("[", chars(NameStartChar), "\\u{10000}-\\u{10FFFF}", "]");
	var NameChar = reg("[", chars(NameStartChar), chars(/[-.0-9\xB7]/), chars(/[\u0300-\u036F\u203F-\u2040]/), "]");
	var Name = reg(NameStartChar, NameChar, "*");
	var Name_exact = reg("^", Name, "$");
	var Nmtoken = reg(NameChar, "+");
	var Reference = regg(reg("&", Name, ";"), "|", regg(/&#[0-9]+;|&#x[0-9a-fA-F]+;/));
	var PEReference = reg("%", Name, ";");
	var EntityValue = regg(reg("\"", regg(/[^%&"]/, "|", PEReference, "|", Reference), "*", "\""), "|", reg("'", regg(/[^%&']/, "|", PEReference, "|", Reference), "*", "'"));
	var AttValue = regg("\"", regg(/[^<&"]/, "|", Reference), "*", "\"", "|", "'", regg(/[^<&']/, "|", Reference), "*", "'");
	var NCName = reg(chars_without(NameStartChar, ":"), chars_without(NameChar, ":"), "*");
	var NCName_exact = reg("^", NCName, "$");
	var QName = reg(NCName, regg(":", NCName), "?");
	var QName_exact = reg("^", QName, "$");
	var QName_group = reg("(", QName, ")");
	var SystemLiteral = regg(/"[^"]*"|'[^']*'/);
	var PI = reg(/^<\?/, "(", Name, ")", regg(S, "(?!", _SChar, ")(", Char, "*?)"), "?", /\?>/);
	var PubidChar = /[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/;
	var PubidLiteral = regg("\"", PubidChar, "*\"", "|", "'", chars_without(PubidChar, "'"), "*'");
	var COMMENT_START = "<!--";
	var COMMENT_END = "-->";
	var Comment = reg(COMMENT_START, regg(chars_without(Char, "-"), "|", reg("-", chars_without(Char, "-"))), "*", COMMENT_END);
	var PCDATA = "#PCDATA";
	var contentspec = regg("EMPTY", "|", "ANY", "|", regg(reg(/\(/, S_OPT, PCDATA, regg(S_OPT, /\|/, S_OPT, QName), "*", S_OPT, /\)\*/), "|", reg(/\(/, S_OPT, PCDATA, S_OPT, /\)/)), "|", reg(/\([^>]+\)/, /[?*+]?/));
	var elementdecl = reg("<!ELEMENT", S, regg(QName, "|", PEReference), S, regg(contentspec, "|", PEReference), S_OPT, ">");
	var AttlistDecl = reg("<!ATTLIST", S, Name, regg(S, Name, S, regg(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/, "|", regg(reg("NOTATION", S, /\(/, S_OPT, Name, regg(S_OPT, /\|/, S_OPT, Name), "*", S_OPT, /\)/), "|", reg(/\(/, S_OPT, Nmtoken, regg(S_OPT, /\|/, S_OPT, Nmtoken), "*", S_OPT, /\)/))), S, regg(/#REQUIRED|#IMPLIED/, "|", regg(regg("#FIXED", S), "?", AttValue))), "*", S_OPT, ">");
	var ABOUT_LEGACY_COMPAT = "about:legacy-compat";
	var ABOUT_LEGACY_COMPAT_SystemLiteral = regg("\"" + ABOUT_LEGACY_COMPAT + "\"", "|", "'" + ABOUT_LEGACY_COMPAT + "'");
	var SYSTEM = "SYSTEM";
	var PUBLIC = "PUBLIC";
	var ExternalID = regg(regg(SYSTEM, S, SystemLiteral), "|", regg(PUBLIC, S, PubidLiteral, S, SystemLiteral));
	var ExternalID_match = reg("^", regg(regg(SYSTEM, S, "(?<SystemLiteralOnly>", SystemLiteral, ")"), "|", regg(PUBLIC, S, "(?<PubidLiteral>", PubidLiteral, ")", S, "(?<SystemLiteral>", SystemLiteral, ")")));
	var PubidLiteral_match = reg("^", PubidLiteral, "$");
	var SystemLiteral_match = reg("^", SystemLiteral, "$");
	var EntityDef = regg(EntityValue, "|", regg(ExternalID, regg(S, "NDATA", S, Name), "?"));
	var ENTITY_DECL_START = "<!ENTITY";
	var EntityDecl = regg(reg(ENTITY_DECL_START, S, Name, S, EntityDef, S_OPT, ">"), "|", reg(ENTITY_DECL_START, S, "%", S, Name, S, regg(EntityValue, "|", ExternalID), S_OPT, ">"));
	var NotationDecl = reg("<!NOTATION", S, Name, S, regg(ExternalID, "|", reg(PUBLIC, S, PubidLiteral)), S_OPT, ">");
	var Eq = reg(S_OPT, "=", S_OPT);
	var VersionNum = /1[.]\d+/;
	var VersionInfo = reg(S, "version", Eq, regg("'", VersionNum, "'", "|", "\"", VersionNum, "\""));
	var EncName = /[A-Za-z][-A-Za-z0-9._]*/;
	var XMLDecl = reg(/^<\?xml/, VersionInfo, regg(S, "encoding", Eq, regg("\"", EncName, "\"", "|", "'", EncName, "'")), "?", regg(S, "standalone", Eq, regg("'", regg("yes", "|", "no"), "'", "|", "\"", regg("yes", "|", "no"), "\"")), "?", S_OPT, /\?>/);
	var DOCTYPE_DECL_START = "<!DOCTYPE";
	var CDATA_START = "<![CDATA[";
	var CDATA_END = "]]>";
	var CDSect = reg(/<!\[CDATA\[/, reg(Char, "*?", /\]\]>/));
	exports.chars = chars;
	exports.chars_without = chars_without;
	exports.detectUnicodeSupport = detectUnicodeSupport;
	exports.reg = reg;
	exports.regg = regg;
	exports.ABOUT_LEGACY_COMPAT = ABOUT_LEGACY_COMPAT;
	exports.ABOUT_LEGACY_COMPAT_SystemLiteral = ABOUT_LEGACY_COMPAT_SystemLiteral;
	exports.AttlistDecl = AttlistDecl;
	exports.CDATA_START = CDATA_START;
	exports.CDATA_END = CDATA_END;
	exports.CDSect = CDSect;
	exports.Char = Char;
	exports.Comment = Comment;
	exports.COMMENT_START = COMMENT_START;
	exports.COMMENT_END = COMMENT_END;
	exports.DOCTYPE_DECL_START = DOCTYPE_DECL_START;
	exports.elementdecl = elementdecl;
	exports.EntityDecl = EntityDecl;
	exports.EntityValue = EntityValue;
	exports.ExternalID = ExternalID;
	exports.ExternalID_match = ExternalID_match;
	exports.Name = Name;
	exports.Name_exact = Name_exact;
	exports.NCName_exact = NCName_exact;
	exports.NotationDecl = NotationDecl;
	exports.Reference = Reference;
	exports.PEReference = PEReference;
	exports.PI = PI;
	exports.PUBLIC = PUBLIC;
	exports.PubidLiteral = PubidLiteral;
	exports.PubidLiteral_match = PubidLiteral_match;
	exports.QName = QName;
	exports.QName_exact = QName_exact;
	exports.QName_group = QName_group;
	exports.S = S;
	exports.SChar_s = SChar_s;
	exports.S_OPT = S_OPT;
	exports.SYSTEM = SYSTEM;
	exports.SystemLiteral = SystemLiteral;
	exports.SystemLiteral_match = SystemLiteral_match;
	exports.InvalidChar = InvalidChar;
	exports.UNICODE_REPLACEMENT_CHARACTER = UNICODE_REPLACEMENT_CHARACTER;
	exports.UNICODE_SUPPORT = UNICODE_SUPPORT;
	exports.XMLDecl = XMLDecl;
} });
var require_dom = __commonJS({ "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/dom.js"(exports) {
	"use strict";
	var conventions = require_conventions();
	var find = conventions.find;
	var hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
	var hasOwn = conventions.hasOwn;
	var isHTMLMimeType = conventions.isHTMLMimeType;
	var isHTMLRawTextElement = conventions.isHTMLRawTextElement;
	var isHTMLVoidElement = conventions.isHTMLVoidElement;
	var MIME_TYPE = conventions.MIME_TYPE;
	var NAMESPACE = conventions.NAMESPACE;
	var PDC = /* @__PURE__ */ Symbol();
	var errors = require_errors();
	var DOMException = errors.DOMException;
	var DOMExceptionName = errors.DOMExceptionName;
	var g = require_grammar();
	function checkSymbol(symbol) {
		if (symbol !== PDC) throw new TypeError("Illegal constructor");
	}
	function notEmptyString(input) {
		return input !== "";
	}
	function splitOnASCIIWhitespace(input) {
		return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
	}
	function orderedSetReducer(current, element) {
		if (!hasOwn(current, element)) current[element] = true;
		return current;
	}
	function toOrderedSet(input) {
		if (!input) return [];
		var list = splitOnASCIIWhitespace(input);
		return Object.keys(list.reduce(orderedSetReducer, {}));
	}
	function arrayIncludes(list) {
		return function(element) {
			return list && list.indexOf(element) !== -1;
		};
	}
	function validateQualifiedName(qualifiedName) {
		if (!g.QName_exact.test(qualifiedName)) throw new DOMException(DOMException.INVALID_CHARACTER_ERR, "invalid character in qualified name \"" + qualifiedName + "\"");
	}
	function validateAndExtract(namespace, qualifiedName) {
		validateQualifiedName(qualifiedName);
		namespace = namespace || null;
		var prefix = null;
		var localName = qualifiedName;
		if (qualifiedName.indexOf(":") >= 0) {
			var splitResult = qualifiedName.split(":");
			prefix = splitResult[0];
			localName = splitResult[1];
		}
		if (prefix !== null && namespace === null) throw new DOMException(DOMException.NAMESPACE_ERR, "prefix is non-null and namespace is null");
		if (prefix === "xml" && namespace !== conventions.NAMESPACE.XML) throw new DOMException(DOMException.NAMESPACE_ERR, "prefix is \"xml\" and namespace is not the XML namespace");
		if ((prefix === "xmlns" || qualifiedName === "xmlns") && namespace !== conventions.NAMESPACE.XMLNS) throw new DOMException(DOMException.NAMESPACE_ERR, "either qualifiedName or prefix is \"xmlns\" and namespace is not the XMLNS namespace");
		if (namespace === conventions.NAMESPACE.XMLNS && prefix !== "xmlns" && qualifiedName !== "xmlns") throw new DOMException(DOMException.NAMESPACE_ERR, "namespace is the XMLNS namespace and neither qualifiedName nor prefix is \"xmlns\"");
		return [
			namespace,
			prefix,
			localName
		];
	}
	function copy(src, dest) {
		for (var p in src) if (hasOwn(src, p)) dest[p] = src[p];
	}
	function _extends(Class, Super) {
		var pt = Class.prototype;
		if (!(pt instanceof Super)) {
			let t = function() {};
			t.prototype = Super.prototype;
			t = new t();
			copy(pt, t);
			Class.prototype = pt = t;
		}
		if (pt.constructor != Class) {
			if (typeof Class != "function") console.error("unknown Class:" + Class);
			pt.constructor = Class;
		}
	}
	var NodeType = {};
	var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
	var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
	var TEXT_NODE = NodeType.TEXT_NODE = 3;
	var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
	var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
	var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
	var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
	var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
	var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
	var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
	var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
	var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
	var DocumentPosition = conventions.freeze({
		DOCUMENT_POSITION_DISCONNECTED: 1,
		DOCUMENT_POSITION_PRECEDING: 2,
		DOCUMENT_POSITION_FOLLOWING: 4,
		DOCUMENT_POSITION_CONTAINS: 8,
		DOCUMENT_POSITION_CONTAINED_BY: 16,
		DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32
	});
	function commonAncestor(a, b) {
		if (b.length < a.length) return commonAncestor(b, a);
		var c = null;
		for (var n in a) {
			if (a[n] !== b[n]) return c;
			c = a[n];
		}
		return c;
	}
	function docGUID(doc) {
		if (!doc.guid) doc.guid = Math.random();
		return doc.guid;
	}
	function NodeList() {}
	NodeList.prototype = {
		/**
		* The number of nodes in the list. The range of valid child node indices is 0 to length-1
		* inclusive.
		*
		* @type {number}
		*/
		length: 0,
		/**
		* Returns the item at `index`. If index is greater than or equal to the number of nodes in
		* the list, this returns null.
		*
		* @param index
		* Unsigned long Index into the collection.
		* @returns {Node | null}
		* The node at position `index` in the NodeList,
		* or null if that is not a valid index.
		*/
		item: function(index) {
			return index >= 0 && index < this.length ? this[index] : null;
		},
		/**
		* Returns a string representation of the NodeList.
		*
		* Accepts the same `options` object as `XMLSerializer.prototype.serializeToString`
		* (`requireWellFormed`, `splitCDATASections`, `nodeFilter`). Passing a function is treated as
		* a legacy `nodeFilter` for backward compatibility.
		*
		* @param {Object | function} [options]
		* @param {boolean} [options.requireWellFormed=false]
		* @param {boolean} [options.splitCDATASections=true]
		* @param {function} [options.nodeFilter]
		* @returns {string}
		*/
		toString: function(options) {
			var opts;
			if (typeof options === "function") opts = {
				requireWellFormed: false,
				splitCDATASections: true,
				nodeFilter: options
			};
			else if (!!options) opts = {
				requireWellFormed: !!options.requireWellFormed,
				splitCDATASections: options.splitCDATASections !== false,
				nodeFilter: options.nodeFilter || null
			};
			else opts = {
				requireWellFormed: false,
				splitCDATASections: true,
				nodeFilter: null
			};
			for (var buf = [], i = 0; i < this.length; i++) serializeToString(this[i], buf, null, opts);
			return buf.join("");
		},
		/**
		* Filters the NodeList based on a predicate.
		*
		* @param {function(Node): boolean} predicate
		* - A predicate function to filter the NodeList.
		* @returns {Node[]}
		* An array of nodes that satisfy the predicate.
		* @private
		*/
		filter: function(predicate) {
			return Array.prototype.filter.call(this, predicate);
		},
		/**
		* Returns the first index at which a given node can be found in the NodeList, or -1 if it is
		* not present.
		*
		* @param {Node} item
		* - The Node item to locate in the NodeList.
		* @returns {number}
		* The first index of the node in the NodeList; -1 if not found.
		* @private
		*/
		indexOf: function(item) {
			return Array.prototype.indexOf.call(this, item);
		}
	};
	NodeList.prototype[Symbol.iterator] = function() {
		var me = this;
		var index = 0;
		return {
			next: function() {
				if (index < me.length) return {
					value: me[index++],
					done: false
				};
				else return { done: true };
			},
			return: function() {
				return { done: true };
			}
		};
	};
	function LiveNodeList(node, refresh) {
		this._node = node;
		this._refresh = refresh;
		_updateLiveList(this);
	}
	function _updateLiveList(list) {
		var inc = list._node._inc || list._node.ownerDocument._inc;
		if (list._inc !== inc) {
			var ls = list._refresh(list._node);
			__set__(list, "length", ls.length);
			if (!list.$$length || ls.length < list.$$length) {
				for (var i = ls.length; i in list; i++) if (hasOwn(list, i)) delete list[i];
			}
			copy(ls, list);
			list._inc = inc;
		}
	}
	LiveNodeList.prototype.item = function(i) {
		_updateLiveList(this);
		return this[i] || null;
	};
	_extends(LiveNodeList, NodeList);
	function NamedNodeMap() {
		this._nsIndex = /* @__PURE__ */ Object.create(null);
		this._noNsIndex = /* @__PURE__ */ Object.create(null);
	}
	function _findNodeIndex(list, node) {
		var i = 0;
		while (i < list.length) {
			if (list[i] === node) return i;
			i++;
		}
	}
	function _nnmBucket(map, namespaceURI, create) {
		if (!namespaceURI) return map._noNsIndex;
		var bucket = map._nsIndex[namespaceURI];
		if (!bucket && create) bucket = map._nsIndex[namespaceURI] = /* @__PURE__ */ Object.create(null);
		return bucket;
	}
	function _nnmIndexFind(map, namespaceURI, localName) {
		var bucket = _nnmBucket(map, namespaceURI, false);
		var found = bucket && bucket[localName];
		return found ? found : null;
	}
	function _nnmIndexAdd(map, attr) {
		_nnmBucket(map, attr.namespaceURI, true)[attr.localName] = attr;
	}
	function _nnmIndexRemove(map, attr) {
		var bucket = _nnmBucket(map, attr.namespaceURI, false);
		if (bucket) delete bucket[attr.localName];
	}
	function _addNamedNode(el, list, newAttr, oldAttr) {
		if (oldAttr) list[_findNodeIndex(list, oldAttr)] = newAttr;
		else {
			list[list.length] = newAttr;
			list.length++;
		}
		_nnmIndexAdd(list, newAttr);
		if (el) {
			newAttr.ownerElement = el;
			var doc = el.ownerDocument;
			if (doc) {
				oldAttr && _onRemoveAttribute(doc, el, oldAttr);
				_onAddAttribute(doc, el, newAttr);
			}
		}
	}
	function _removeNamedNode(el, list, attr) {
		var i = _findNodeIndex(list, attr);
		if (i >= 0) {
			var lastIndex = list.length - 1;
			while (i <= lastIndex) list[i] = list[++i];
			list.length = lastIndex;
			_nnmIndexRemove(list, attr);
			if (el) {
				var doc = el.ownerDocument;
				if (doc) _onRemoveAttribute(doc, el, attr);
				attr.ownerElement = null;
			}
		}
	}
	NamedNodeMap.prototype = {
		length: 0,
		item: NodeList.prototype.item,
		/**
		* Get an attribute by name. Note: Name is in lower case in case of HTML namespace and
		* document.
		*
		* @param {string} localName
		* The local name of the attribute.
		* @returns {Attr | null}
		* The attribute with the given local name, or null if no such attribute exists.
		* @see https://dom.spec.whatwg.org/#concept-element-attributes-get-by-name
		*/
		getNamedItem: function(localName) {
			if (this._ownerElement && this._ownerElement._isInHTMLDocumentAndNamespace()) localName = localName.toLowerCase();
			var i = 0;
			while (i < this.length) {
				var attr = this[i];
				if (attr.nodeName === localName) return attr;
				i++;
			}
			return null;
		},
		/**
		* Set an attribute.
		*
		* @param {Attr} attr
		* The attribute to set.
		* @returns {Attr | null}
		* The old attribute with the same local name and namespace URI as the new one, or null if no
		* such attribute exists.
		* @throws {DOMException}
		* With code:
		* - {@link INUSE_ATTRIBUTE_ERR} - If the attribute is already an attribute of another
		* element.
		* @see https://dom.spec.whatwg.org/#concept-element-attributes-set
		*/
		setNamedItem: function(attr) {
			var el = attr.ownerElement;
			if (el && el !== this._ownerElement) throw new DOMException(DOMException.INUSE_ATTRIBUTE_ERR);
			var oldAttr = _nnmIndexFind(this, attr.namespaceURI, attr.localName);
			if (oldAttr === attr) return attr;
			_addNamedNode(this._ownerElement, this, attr, oldAttr);
			return oldAttr;
		},
		/**
		* Set an attribute, replacing an existing attribute with the same local name and namespace
		* URI if one exists.
		*
		* @param {Attr} attr
		* The attribute to set.
		* @returns {Attr | null}
		* The old attribute with the same local name and namespace URI as the new one, or null if no
		* such attribute exists.
		* @throws {DOMException}
		* Throws a DOMException with the name "InUseAttributeError" if the attribute is already an
		* attribute of another element.
		* @see https://dom.spec.whatwg.org/#concept-element-attributes-set
		*/
		setNamedItemNS: function(attr) {
			return this.setNamedItem(attr);
		},
		/**
		* Removes an attribute specified by the local name.
		*
		* @param {string} localName
		* The local name of the attribute to be removed.
		* @returns {Attr}
		* The attribute node that was removed.
		* @throws {DOMException}
		* With code:
		* - {@link DOMException.NOT_FOUND_ERR} if no attribute with the given name is found.
		* @see https://dom.spec.whatwg.org/#dom-namednodemap-removenameditem
		* @see https://dom.spec.whatwg.org/#concept-element-attributes-remove-by-name
		*/
		removeNamedItem: function(localName) {
			var attr = this.getNamedItem(localName);
			if (!attr) throw new DOMException(DOMException.NOT_FOUND_ERR, localName);
			_removeNamedNode(this._ownerElement, this, attr);
			return attr;
		},
		/**
		* Removes an attribute specified by the namespace and local name.
		*
		* @param {string | null} namespaceURI
		* The namespace URI of the attribute to be removed.
		* @param {string} localName
		* The local name of the attribute to be removed.
		* @returns {Attr}
		* The attribute node that was removed.
		* @throws {DOMException}
		* With code:
		* - {@link DOMException.NOT_FOUND_ERR} if no attribute with the given namespace URI and local
		* name is found.
		* @see https://dom.spec.whatwg.org/#dom-namednodemap-removenameditemns
		* @see https://dom.spec.whatwg.org/#concept-element-attributes-remove-by-namespace
		*/
		removeNamedItemNS: function(namespaceURI, localName) {
			var attr = this.getNamedItemNS(namespaceURI, localName);
			if (!attr) throw new DOMException(DOMException.NOT_FOUND_ERR, namespaceURI ? namespaceURI + " : " + localName : localName);
			_removeNamedNode(this._ownerElement, this, attr);
			return attr;
		},
		/**
		* Get an attribute by namespace and local name.
		*
		* @param {string | null} namespaceURI
		* The namespace URI of the attribute.
		* @param {string} localName
		* The local name of the attribute.
		* @returns {Attr | null}
		* The attribute with the given namespace URI and local name, or null if no such attribute
		* exists.
		* @see https://dom.spec.whatwg.org/#concept-element-attributes-get-by-namespace
		*/
		getNamedItemNS: function(namespaceURI, localName) {
			if (!namespaceURI) namespaceURI = null;
			var i = 0;
			while (i < this.length) {
				var node = this[i];
				if (node.localName === localName && node.namespaceURI === namespaceURI) return node;
				i++;
			}
			return null;
		}
	};
	NamedNodeMap.prototype[Symbol.iterator] = function() {
		var me = this;
		var index = 0;
		return {
			next: function() {
				if (index < me.length) return {
					value: me[index++],
					done: false
				};
				else return { done: true };
			},
			return: function() {
				return { done: true };
			}
		};
	};
	function DOMImplementation() {}
	DOMImplementation.prototype = {
		/**
		* Test if the DOM implementation implements a specific feature and version, as specified in
		* {@link https://www.w3.org/TR/DOM-Level-3-Core/core.html#DOMFeatures DOM Features}.
		*
		* The DOMImplementation.hasFeature() method returns a Boolean flag indicating if a given
		* feature is supported. The different implementations fairly diverged in what kind of
		* features were reported. The latest version of the spec settled to force this method to
		* always return true, where the functionality was accurate and in use.
		*
		* @deprecated
		* It is deprecated and modern browsers return true in all cases.
		* @function DOMImplementation#hasFeature
		* @param {string} feature
		* The name of the feature to test.
		* @param {string} [version]
		* This is the version number of the feature to test.
		* @returns {boolean}
		* Always returns true.
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/hasFeature MDN
		* @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-5CED94D7 DOM Level 1 Core
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-hasfeature DOM Living Standard
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-5CED94D7 DOM Level 3 Core
		*/
		hasFeature: function(feature, version) {
			return true;
		},
		/**
		* Creates a DOM Document object of the specified type with its document element. Note that
		* based on the {@link DocumentType}
		* given to create the document, the implementation may instantiate specialized
		* {@link Document} objects that support additional features than the "Core", such as "HTML"
		* {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#DOM2HTML DOM Level 2 HTML}.
		* On the other hand, setting the {@link DocumentType} after the document was created makes
		* this very unlikely to happen. Alternatively, specialized {@link Document} creation methods,
		* such as createHTMLDocument
		* {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#DOM2HTML DOM Level 2 HTML},
		* can be used to obtain specific types of {@link Document} objects.
		*
		* __It behaves slightly different from the description in the living standard__:
		* - There is no interface/class `XMLDocument`, it returns a `Document`
		* instance (with it's `type` set to `'xml'`).
		* - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
		*
		* @function DOMImplementation.createDocument
		* @param {string | null} namespaceURI
		* The
		* {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-namespaceURI namespace URI}
		* of the document element to create or null.
		* @param {string | null} qualifiedName
		* The
		* {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-qualifiedname qualified name}
		* of the document element to be created or null.
		* @param {DocumentType | null} [doctype=null]
		* The type of document to be created or null. When doctype is not null, its
		* {@link Node#ownerDocument} attribute is set to the document being created. Default is
		* `null`
		* @returns {Document}
		* A new {@link Document} object with its document element. If the NamespaceURI,
		* qualifiedName, and doctype are null, the returned {@link Document} is empty with no
		* document element.
		* @throws {DOMException}
		* With code:
		*
		* - `INVALID_CHARACTER_ERR`: Raised if the specified qualified name is not an XML name
		* according to {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#XML XML 1.0}.
		* - `NAMESPACE_ERR`: Raised if the qualifiedName is malformed, if the qualifiedName has a
		* prefix and the namespaceURI is null, or if the qualifiedName is null and the namespaceURI
		* is different from null, or if the qualifiedName has a prefix that is "xml" and the
		* namespaceURI is different from "{@link http://www.w3.org/XML/1998/namespace}"
		* {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#Namespaces XML Namespaces},
		* or if the DOM implementation does not support the "XML" feature but a non-null namespace
		* URI was provided, since namespaces were defined by XML.
		* - `WRONG_DOCUMENT_ERR`: Raised if doctype has already been used with a different document
		* or was created from a different implementation.
		* - `NOT_SUPPORTED_ERR`: May be raised if the implementation does not support the feature
		* "XML" and the language exposed through the Document does not support XML Namespaces (such
		* as {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#HTML40 HTML 4.01}).
		* @since DOM Level 2.
		* @see {@link #createHTMLDocument}
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocument MDN
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument DOM Living Standard
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Level-2-Core-DOM-createDocument DOM
		*      Level 3 Core
		* @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocument DOM
		*      Level 2 Core (initial)
		*/
		createDocument: function(namespaceURI, qualifiedName, doctype) {
			var contentType = MIME_TYPE.XML_APPLICATION;
			if (namespaceURI === NAMESPACE.HTML) contentType = MIME_TYPE.XML_XHTML_APPLICATION;
			else if (namespaceURI === NAMESPACE.SVG) contentType = MIME_TYPE.XML_SVG_IMAGE;
			var doc = new Document(PDC, { contentType });
			doc.implementation = this;
			doc.childNodes = new NodeList();
			doc.doctype = doctype || null;
			if (doctype) doc.appendChild(doctype);
			if (qualifiedName) {
				var root = doc.createElementNS(namespaceURI, qualifiedName);
				doc.appendChild(root);
			}
			return doc;
		},
		/**
		* Creates an empty DocumentType node. Entity declarations and notations are not made
		* available. Entity reference expansions and default attribute additions do not occur.
		*
		* **This behavior is slightly different from the one in the specs**:
		* - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
		* - `publicId` and `systemId` contain the raw data including any possible quotes,
		*   so they can always be serialized back to the original value
		* - `internalSubset` contains the raw string between `[` and `]` if present,
		*   but is not parsed or validated in any form.
		*
		* @function DOMImplementation#createDocumentType
		* @param {string} qualifiedName
		* The {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-qualifiedname qualified
		* name} of the document type to be created.
		* @param {string} [publicId]
		* The external subset public identifier. Stored verbatim including surrounding quotes.
		* When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
		* if the value is non-empty and does not match the XML `PubidLiteral` production
		* (W3C DOM Parsing §3.2.1.3; XML 1.0 production [12]). Creation-time validation is not
		* enforced — deferred to a future breaking release.
		* @param {string} [systemId]
		* The external subset system identifier. Stored verbatim including surrounding quotes.
		* When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
		* if the value is non-empty and does not match the XML `SystemLiteral` production
		* (W3C DOM Parsing §3.2.1.3; XML 1.0 production [11]). Creation-time validation is not
		* enforced — deferred to a future breaking release.
		* @param {string} [internalSubset]
		* The internal subset or an empty string if it is not present. Stored verbatim.
		* When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
		* if the value contains `"]>"`. Creation-time validation is not enforced.
		* @returns {DocumentType}
		* A new {@link DocumentType} node with {@link Node#ownerDocument} set to null.
		* @throws {DOMException}
		* With code:
		*
		* - `INVALID_CHARACTER_ERR`: Raised if the specified qualified name is not an XML name
		* according to {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#XML XML 1.0}.
		* - `NAMESPACE_ERR`: Raised if the qualifiedName is malformed.
		* - `NOT_SUPPORTED_ERR`: May be raised if the implementation does not support the feature
		* "XML" and the language exposed through the Document does not support XML Namespaces (such
		* as {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#HTML40 HTML 4.01}).
		* @since DOM Level 2.
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocumentType
		*      MDN
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocumenttype DOM Living
		*      Standard
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Level-3-Core-DOM-createDocType DOM
		*      Level 3 Core
		* @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocType DOM
		*      Level 2 Core
		* @see https://github.com/xmldom/xmldom/blob/master/CHANGELOG.md#050
		* @see https://www.w3.org/TR/DOM-Level-2-Core/#core-ID-Core-DocType-internalSubset
		* @prettierignore
		*/
		createDocumentType: function(qualifiedName, publicId, systemId, internalSubset) {
			validateQualifiedName(qualifiedName);
			var node = new DocumentType(PDC);
			node.name = qualifiedName;
			node.nodeName = qualifiedName;
			node.publicId = publicId || "";
			node.systemId = systemId || "";
			node.internalSubset = internalSubset || "";
			node.childNodes = new NodeList();
			return node;
		},
		/**
		* Returns an HTML document, that might already have a basic DOM structure.
		*
		* __It behaves slightly different from the description in the living standard__:
		* - If the first argument is `false` no initial nodes are added (steps 3-7 in the specs are
		* omitted)
		* - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
		*
		* @param {string | false} [title]
		* A string containing the title to give the new HTML document.
		* @returns {Document}
		* The HTML document.
		* @since WHATWG Living Standard.
		* @see {@link #createDocument}
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createhtmldocument
		* @see https://dom.spec.whatwg.org/#html-document
		*/
		createHTMLDocument: function(title) {
			var doc = new Document(PDC, { contentType: MIME_TYPE.HTML });
			doc.implementation = this;
			doc.childNodes = new NodeList();
			if (title !== false) {
				doc.doctype = this.createDocumentType("html");
				doc.doctype.ownerDocument = doc;
				doc.appendChild(doc.doctype);
				var htmlNode = doc.createElement("html");
				doc.appendChild(htmlNode);
				var headNode = doc.createElement("head");
				htmlNode.appendChild(headNode);
				if (typeof title === "string") {
					var titleNode = doc.createElement("title");
					titleNode.appendChild(doc.createTextNode(title));
					headNode.appendChild(titleNode);
				}
				htmlNode.appendChild(doc.createElement("body"));
			}
			return doc;
		}
	};
	function Node(symbol) {
		checkSymbol(symbol);
	}
	Node.prototype = {
		/**
		* The first child of this node.
		*
		* @type {Node | null}
		*/
		firstChild: null,
		/**
		* The last child of this node.
		*
		* @type {Node | null}
		*/
		lastChild: null,
		/**
		* The previous sibling of this node.
		*
		* @type {Node | null}
		*/
		previousSibling: null,
		/**
		* The next sibling of this node.
		*
		* @type {Node | null}
		*/
		nextSibling: null,
		/**
		* The parent node of this node.
		*
		* @type {Node | null}
		*/
		parentNode: null,
		/**
		* The parent element of this node.
		*
		* @type {Element | null}
		*/
		get parentElement() {
			return this.parentNode && this.parentNode.nodeType === this.ELEMENT_NODE ? this.parentNode : null;
		},
		/**
		* The child nodes of this node.
		*
		* @type {NodeList}
		*/
		childNodes: null,
		/**
		* The document object associated with this node.
		*
		* @type {Document | null}
		*/
		ownerDocument: null,
		/**
		* The value of this node.
		*
		* @type {string | null}
		*/
		nodeValue: null,
		/**
		* The namespace URI of this node.
		*
		* @type {string | null}
		*/
		namespaceURI: null,
		/**
		* The prefix of the namespace for this node.
		*
		* @type {string | null}
		*/
		prefix: null,
		/**
		* The local part of the qualified name of this node.
		*
		* @type {string | null}
		*/
		localName: null,
		/**
		* The baseURI is currently always `about:blank`,
		* since that's what happens when you create a document from scratch.
		*
		* @type {'about:blank'}
		*/
		baseURI: "about:blank",
		/**
		* Is true if this node is part of a document.
		*
		* @type {boolean}
		*/
		get isConnected() {
			var rootNode = this.getRootNode();
			return rootNode && rootNode.nodeType === rootNode.DOCUMENT_NODE;
		},
		/**
		* Checks whether `other` is an inclusive descendant of this node.
		*
		* @param {Node | null | undefined} other
		* The node to check.
		* @returns {boolean}
		* True if `other` is an inclusive descendant of this node; false otherwise.
		* @see https://dom.spec.whatwg.org/#dom-node-contains
		*/
		contains: function(other) {
			if (!other) return false;
			var parent = other;
			do {
				if (this === parent) return true;
				parent = parent.parentNode;
			} while (parent);
			return false;
		},
		/**
		* @typedef GetRootNodeOptions
		* @property {boolean} [composed=false]
		*/
		/**
		* Searches for the root node of this node.
		*
		* **This behavior is slightly different from the in the specs**:
		* - ignores `options.composed`, since `ShadowRoot`s are unsupported, always returns root.
		*
		* @param {GetRootNodeOptions} [options]
		* @returns {Node}
		* Root node.
		* @see https://dom.spec.whatwg.org/#dom-node-getrootnode
		* @see https://dom.spec.whatwg.org/#concept-shadow-including-root
		*/
		getRootNode: function(options) {
			var parent = this;
			do {
				if (!parent.parentNode) return parent;
				parent = parent.parentNode;
			} while (parent);
		},
		/**
		* Checks whether the given node is equal to this node.
		*
		* Two nodes are equal when they have the same type, defining characteristics (for the type),
		* and the same childNodes. The comparison is iterative to avoid stack overflows on
		* deeply-nested trees. Attribute nodes of each Element pair are also pushed onto the stack
		* and compared the same way.
		*
		* @param {Node} [otherNode]
		* @returns {boolean}
		* @see https://dom.spec.whatwg.org/#concept-node-equals
		* @see ../docs/walk-dom.md.
		*/
		isEqualNode: function(otherNode) {
			if (!otherNode) return false;
			var stack = [{
				node: this,
				other: otherNode
			}];
			while (stack.length > 0) {
				var pair = stack.pop();
				var node = pair.node;
				var other = pair.other;
				if (node.nodeType !== other.nodeType) return false;
				switch (node.nodeType) {
					case node.DOCUMENT_TYPE_NODE:
						if (node.name !== other.name) return false;
						if (node.publicId !== other.publicId) return false;
						if (node.systemId !== other.systemId) return false;
						break;
					case node.ELEMENT_NODE:
						if (node.namespaceURI !== other.namespaceURI) return false;
						if (node.prefix !== other.prefix) return false;
						if (node.localName !== other.localName) return false;
						if (node.attributes.length !== other.attributes.length) return false;
						for (var i = 0; i < node.attributes.length; i++) {
							var attr = node.attributes.item(i);
							var otherAttr = other.getAttributeNodeNS(attr.namespaceURI, attr.localName);
							if (!otherAttr) return false;
							stack.push({
								node: attr,
								other: otherAttr
							});
						}
						break;
					case node.ATTRIBUTE_NODE:
						if (node.namespaceURI !== other.namespaceURI) return false;
						if (node.localName !== other.localName) return false;
						if (node.value !== other.value) return false;
						break;
					case node.PROCESSING_INSTRUCTION_NODE:
						if (node.target !== other.target || node.data !== other.data) return false;
						break;
					case node.TEXT_NODE:
					case node.CDATA_SECTION_NODE:
					case node.COMMENT_NODE: if (node.data !== other.data) return false;
				}
				if (node.childNodes.length !== other.childNodes.length) return false;
				for (var i = node.childNodes.length - 1; i >= 0; i--) stack.push({
					node: node.childNodes[i],
					other: other.childNodes[i]
				});
			}
			return true;
		},
		/**
		* Checks whether or not the given node is this node.
		*
		* @param {Node} [otherNode]
		*/
		isSameNode: function(otherNode) {
			return this === otherNode;
		},
		/**
		* Inserts a node before a reference node as a child of this node.
		*
		* @param {Node} newChild
		* The new child node to be inserted.
		* @param {Node | null} refChild
		* The reference node before which newChild will be inserted.
		* @returns {Node}
		* The new child node successfully inserted.
		* @throws {DOMException}
		* Throws a DOMException if inserting the node would result in a DOM tree that is not
		* well-formed, or if `child` is provided but is not a child of `parent`.
		* See {@link _insertBefore} for more details.
		* @since Modified in DOM L2
		*/
		insertBefore: function(newChild, refChild) {
			return _insertBefore(this, newChild, refChild);
		},
		/**
		* Replaces an old child node with a new child node within this node.
		*
		* @param {Node} newChild
		* The new node that is to replace the old node.
		* If it already exists in the DOM, it is removed from its original position.
		* @param {Node} oldChild
		* The existing child node to be replaced.
		* @returns {Node}
		* Returns the replaced child node.
		* @throws {DOMException}
		* Throws a DOMException if replacing the node would result in a DOM tree that is not
		* well-formed, or if `oldChild` is not a child of `this`.
		* This can also occur if the pre-replacement validity assertion fails.
		* See {@link _insertBefore}, {@link Node.removeChild}, and
		* {@link assertPreReplacementValidityInDocument} for more details.
		* @see https://dom.spec.whatwg.org/#concept-node-replace
		*/
		replaceChild: function(newChild, oldChild) {
			_insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
			if (oldChild) this.removeChild(oldChild);
		},
		/**
		* Removes an existing child node from this node.
		*
		* @param {Node} oldChild
		* The child node to be removed.
		* @returns {Node}
		* Returns the removed child node.
		* @throws {DOMException}
		* Throws a DOMException if `oldChild` is not a child of `this`.
		* See {@link _removeChild} for more details.
		*/
		removeChild: function(oldChild) {
			return _removeChild(this, oldChild);
		},
		/**
		* Appends a child node to this node.
		*
		* @param {Node} newChild
		* The child node to be appended to this node.
		* If it already exists in the DOM, it is removed from its original position.
		* @returns {Node}
		* Returns the appended child node.
		* @throws {DOMException}
		* Throws a DOMException if appending the node would result in a DOM tree that is not
		* well-formed, or if `newChild` is not a valid Node.
		* See {@link insertBefore} for more details.
		*/
		appendChild: function(newChild) {
			return this.insertBefore(newChild, null);
		},
		/**
		* Determines whether this node has any child nodes.
		*
		* @returns {boolean}
		* Returns true if this node has any child nodes, and false otherwise.
		*/
		hasChildNodes: function() {
			return this.firstChild != null;
		},
		/**
		* Creates a copy of the calling node.
		*
		* @param {boolean} deep
		* If true, the contents of the node are recursively copied.
		* If false, only the node itself (and its attributes, if it is an element) are copied.
		* @returns {Node}
		* Returns the newly created copy of the node.
		* @throws {DOMException}
		* May throw a DOMException if operations within {@link Element#setAttributeNode} or
		* {@link Node#appendChild} (which are potentially invoked in this method) do not meet their
		* specific constraints.
		* @see {@link cloneNode}
		*/
		cloneNode: function(deep) {
			return cloneNode(this.ownerDocument || this, this, deep);
		},
		/**
		* Puts the specified node and all of its subtree into a "normalized" form. In a normalized
		* subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
		*
		* Specifically, this method merges any adjacent text nodes (i.e., nodes for which `nodeType`
		* is `TEXT_NODE`) into a single node with the combined data. It also removes any empty text
		* nodes.
		*
		* This method iterativly traverses all child nodes to normalize all descendent nodes within
		* the subtree.
		*
		* @throws {DOMException}
		* May throw a DOMException if operations within removeChild or appendData (which are
		* potentially invoked in this method) do not meet their specific constraints.
		* @since Modified in DOM Level 2
		* @see {@link Node.removeChild}
		* @see {@link CharacterData.appendData}
		* @see ../docs/walk-dom.md.
		*/
		normalize: function() {
			walkDOM(this, null, { enter: function(node) {
				var child = node.firstChild;
				while (child) {
					var next = child.nextSibling;
					if (next !== null && next.nodeType === TEXT_NODE && child.nodeType === TEXT_NODE) {
						var tail = [];
						var sibling = next;
						while (sibling !== null && sibling.nodeType === TEXT_NODE) {
							tail.push(sibling.data);
							sibling = sibling.nextSibling;
						}
						var removed = child.nextSibling;
						while (removed !== sibling) {
							var following = removed.nextSibling;
							removed.parentNode = null;
							removed.previousSibling = null;
							removed.nextSibling = null;
							removed = following;
						}
						child.nextSibling = sibling;
						if (sibling !== null) sibling.previousSibling = child;
						else node.lastChild = child;
						child.appendData(tail.join(""));
						_onUpdateChild(node.ownerDocument, node);
						child = sibling;
					} else child = next;
				}
				return true;
			} });
		},
		/**
		* Checks whether the DOM implementation implements a specific feature and its version.
		*
		* @deprecated
		* Since `DOMImplementation.hasFeature` is deprecated and always returns true.
		* @param {string} feature
		* The package name of the feature to test. This is the same name that can be passed to the
		* method `hasFeature` on `DOMImplementation`.
		* @param {string} version
		* This is the version number of the package name to test.
		* @returns {boolean}
		* Returns true in all cases in the current implementation.
		* @since Introduced in DOM Level 2
		* @see {@link DOMImplementation.hasFeature}
		*/
		isSupported: function(feature, version) {
			return this.ownerDocument.implementation.hasFeature(feature, version);
		},
		/**
		* Look up the prefix associated to the given namespace URI, starting from this node.
		* **The default namespace declarations are ignored by this method.**
		* See Namespace Prefix Lookup for details on the algorithm used by this method.
		*
		* **This behavior is different from the in the specs**:
		* - no node type specific handling
		* - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
		*
		* @param {string | null} namespaceURI
		* The namespace URI for which to find the associated prefix.
		* @returns {string | null}
		* The associated prefix, if found; otherwise, null.
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
		* @see https://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
		* @see https://dom.spec.whatwg.org/#dom-node-lookupprefix
		* @see https://github.com/xmldom/xmldom/issues/322
		* @prettierignore
		*/
		lookupPrefix: function(namespaceURI) {
			var el = this;
			while (el) {
				var map = el._nsMap;
				if (map) {
					for (var n in map) if (hasOwn(map, n) && map[n] === namespaceURI) return n;
				}
				el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
			}
			return null;
		},
		/**
		* This function is used to look up the namespace URI associated with the given prefix,
		* starting from this node.
		*
		* **This behavior is different from the in the specs**:
		* - no node type specific handling
		* - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
		*
		* @param {string | null} prefix
		* The prefix for which to find the associated namespace URI.
		* @returns {string | null}
		* The associated namespace URI, if found; otherwise, null.
		* @since DOM Level 3
		* @see https://dom.spec.whatwg.org/#dom-node-lookupnamespaceuri
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespaceURI
		* @prettierignore
		*/
		lookupNamespaceURI: function(prefix) {
			var el = this;
			while (el) {
				var map = el._nsMap;
				if (map) {
					if (hasOwn(map, prefix)) return map[prefix];
				}
				el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
			}
			return null;
		},
		/**
		* Determines whether the given namespace URI is the default namespace.
		*
		* The function works by looking up the prefix associated with the given namespace URI. If no
		* prefix is found (i.e., the namespace URI is not registered in the namespace map of this
		* node or any of its ancestors), it returns `true`, implying the namespace URI is considered
		* the default.
		*
		* **This behavior is different from the in the specs**:
		* - no node type specific handling
		* - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
		*
		* @param {string | null} namespaceURI
		* The namespace URI to be checked.
		* @returns {boolean}
		* Returns true if the given namespace URI is the default namespace, false otherwise.
		* @since DOM Level 3
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-isDefaultNamespace
		* @see https://dom.spec.whatwg.org/#dom-node-isdefaultnamespace
		* @prettierignore
		*/
		isDefaultNamespace: function(namespaceURI) {
			return this.lookupPrefix(namespaceURI) == null;
		},
		/**
		* Compares the reference node with a node with regard to their position in the document and
		* according to the document order.
		*
		* @param {Node} other
		* The node to compare the reference node to.
		* @returns {number}
		* Returns how the node is positioned relatively to the reference node according to the
		* bitmask. 0 if reference node and given node are the same.
		* @since DOM Level 3
		* @see https://www.w3.org/TR/2004/REC-DOM-Level-3-Core-20040407/core.html#Node3-compare
		* @see https://dom.spec.whatwg.org/#dom-node-comparedocumentposition
		*/
		compareDocumentPosition: function(other) {
			if (this === other) return 0;
			var node1 = other;
			var node2 = this;
			var attr1 = null;
			var attr2 = null;
			if (node1 instanceof Attr) {
				attr1 = node1;
				node1 = attr1.ownerElement;
			}
			if (node2 instanceof Attr) {
				attr2 = node2;
				node2 = attr2.ownerElement;
				if (attr1 && node1 && node2 === node1) for (var i = 0, attr; attr = node2.attributes[i]; i++) {
					if (attr === attr1) return DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
					if (attr === attr2) return DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
				}
			}
			if (!node1 || !node2 || node2.ownerDocument !== node1.ownerDocument) return DocumentPosition.DOCUMENT_POSITION_DISCONNECTED + DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + (docGUID(node2.ownerDocument) > docGUID(node1.ownerDocument) ? DocumentPosition.DOCUMENT_POSITION_FOLLOWING : DocumentPosition.DOCUMENT_POSITION_PRECEDING);
			if (attr2 && node1 === node2) return DocumentPosition.DOCUMENT_POSITION_CONTAINS + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
			if (attr1 && node1 === node2) return DocumentPosition.DOCUMENT_POSITION_CONTAINED_BY + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
			var chain1 = [];
			var ancestor1 = node1.parentNode;
			while (ancestor1) {
				if (!attr2 && ancestor1 === node2) return DocumentPosition.DOCUMENT_POSITION_CONTAINED_BY + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
				chain1.push(ancestor1);
				ancestor1 = ancestor1.parentNode;
			}
			chain1.reverse();
			var chain2 = [];
			var ancestor2 = node2.parentNode;
			while (ancestor2) {
				if (!attr1 && ancestor2 === node1) return DocumentPosition.DOCUMENT_POSITION_CONTAINS + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
				chain2.push(ancestor2);
				ancestor2 = ancestor2.parentNode;
			}
			chain2.reverse();
			var ca = commonAncestor(chain1, chain2);
			for (var n in ca.childNodes) {
				var child = ca.childNodes[n];
				if (child === node2) return DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
				if (child === node1) return DocumentPosition.DOCUMENT_POSITION_PRECEDING;
				if (chain2.indexOf(child) >= 0) return DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
				if (chain1.indexOf(child) >= 0) return DocumentPosition.DOCUMENT_POSITION_PRECEDING;
			}
			return 0;
		}
	};
	function _xmlEncoder(c) {
		return c == "<" && "&lt;" || c == ">" && "&gt;" || c == "&" && "&amp;" || c == "\"" && "&quot;" || "&#" + c.charCodeAt() + ";";
	}
	copy(NodeType, Node);
	copy(NodeType, Node.prototype);
	copy(DocumentPosition, Node);
	copy(DocumentPosition, Node.prototype);
	function _visitNode(node, callback) {
		walkDOM(node, null, { enter: function(n) {
			return callback(n) ? walkDOM.STOP : true;
		} });
	}
	function walkDOM(node, context, callbacks) {
		var stack = [{
			node,
			context,
			phase: walkDOM.ENTER
		}];
		while (stack.length > 0) {
			var frame = stack.pop();
			if (frame.phase === walkDOM.ENTER) {
				var childContext = callbacks.enter(frame.node, frame.context);
				if (childContext === walkDOM.STOP) return walkDOM.STOP;
				stack.push({
					node: frame.node,
					context: childContext,
					phase: walkDOM.EXIT
				});
				if (childContext === null || childContext === void 0) continue;
				var child = frame.node.lastChild;
				while (child) {
					stack.push({
						node: child,
						context: childContext,
						phase: walkDOM.ENTER
					});
					child = child.previousSibling;
				}
			} else if (callbacks.exit) callbacks.exit(frame.node, frame.context);
		}
	}
	walkDOM.STOP = /* @__PURE__ */ Symbol("walkDOM.STOP");
	walkDOM.ENTER = 0;
	walkDOM.EXIT = 1;
	function Document(symbol, options) {
		checkSymbol(symbol);
		var opt = options || {};
		this.ownerDocument = this;
		this.contentType = opt.contentType || MIME_TYPE.XML_APPLICATION;
		this.type = isHTMLMimeType(this.contentType) ? "html" : "xml";
	}
	function _onAddAttribute(doc, el, newAttr) {
		doc && doc._inc++;
		if (newAttr.namespaceURI === NAMESPACE.XMLNS) el._nsMap[newAttr.prefix ? newAttr.localName : ""] = newAttr.value;
	}
	function _onRemoveAttribute(doc, el, newAttr, remove) {
		doc && doc._inc++;
		if (newAttr.namespaceURI === NAMESPACE.XMLNS) delete el._nsMap[newAttr.prefix ? newAttr.localName : ""];
	}
	function _onUpdateChild(doc, parent, newChild) {
		if (doc && doc._inc) {
			doc._inc++;
			var childNodes = parent.childNodes;
			if (newChild && !newChild.nextSibling) childNodes[childNodes.length++] = newChild;
			else {
				var child = parent.firstChild;
				var i = 0;
				while (child) {
					childNodes[i++] = child;
					child = child.nextSibling;
				}
				childNodes.length = i;
				delete childNodes[childNodes.length];
			}
		}
	}
	function _removeChild(parentNode, child) {
		if (parentNode !== child.parentNode) throw new DOMException(DOMException.NOT_FOUND_ERR, "child's parent is not parent");
		var oldPreviousSibling = child.previousSibling;
		var oldNextSibling = child.nextSibling;
		if (oldPreviousSibling) oldPreviousSibling.nextSibling = oldNextSibling;
		else parentNode.firstChild = oldNextSibling;
		if (oldNextSibling) oldNextSibling.previousSibling = oldPreviousSibling;
		else parentNode.lastChild = oldPreviousSibling;
		_onUpdateChild(parentNode.ownerDocument, parentNode);
		child.parentNode = null;
		child.previousSibling = null;
		child.nextSibling = null;
		return child;
	}
	function hasValidParentNodeType(node) {
		return node && (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE);
	}
	function hasInsertableNodeType(node) {
		return node && (node.nodeType === Node.CDATA_SECTION_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.DOCUMENT_TYPE_NODE || node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE || node.nodeType === Node.TEXT_NODE);
	}
	function isDocTypeNode(node) {
		return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
	}
	function isElementNode(node) {
		return node && node.nodeType === Node.ELEMENT_NODE;
	}
	function isTextNode(node) {
		return node && node.nodeType === Node.TEXT_NODE;
	}
	function isElementInsertionPossible(doc, child) {
		var parentChildNodes = doc.childNodes || [];
		if (find(parentChildNodes, isElementNode) || isDocTypeNode(child)) return false;
		var docTypeNode = find(parentChildNodes, isDocTypeNode);
		return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
	}
	function isElementReplacementPossible(doc, child) {
		var parentChildNodes = doc.childNodes || [];
		function hasElementChildThatIsNotChild(node) {
			return isElementNode(node) && node !== child;
		}
		if (find(parentChildNodes, hasElementChildThatIsNotChild)) return false;
		var docTypeNode = find(parentChildNodes, isDocTypeNode);
		return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
	}
	function assertPreInsertionValidity1to5(parent, node, child) {
		if (!hasValidParentNodeType(parent)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + parent.nodeType);
		if (child && child.parentNode !== parent) throw new DOMException(DOMException.NOT_FOUND_ERR, "child not in parent");
		if (!hasInsertableNodeType(node) || isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Unexpected node type " + node.nodeType + " for parent node type " + parent.nodeType);
	}
	function assertPreInsertionValidityInDocument(parent, node, child) {
		var parentChildNodes = parent.childNodes || [];
		var nodeChildNodes = node.childNodes || [];
		if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
			var nodeChildElements = nodeChildNodes.filter(isElementNode);
			if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
			if (nodeChildElements.length === 1 && !isElementInsertionPossible(parent, child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
		}
		if (isElementNode(node)) {
			if (!isElementInsertionPossible(parent, child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
		}
		if (isDocTypeNode(node)) {
			if (find(parentChildNodes, isDocTypeNode)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
			var parentElementChild = find(parentChildNodes, isElementNode);
			if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
			if (!child && parentElementChild) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
		}
	}
	function assertPreReplacementValidityInDocument(parent, node, child) {
		var parentChildNodes = parent.childNodes || [];
		var nodeChildNodes = node.childNodes || [];
		if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
			var nodeChildElements = nodeChildNodes.filter(isElementNode);
			if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
			if (nodeChildElements.length === 1 && !isElementReplacementPossible(parent, child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
		}
		if (isElementNode(node)) {
			if (!isElementReplacementPossible(parent, child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
		}
		if (isDocTypeNode(node)) {
			let hasDoctypeChildThatIsNotChild = function(node2) {
				return isDocTypeNode(node2) && node2 !== child;
			};
			if (find(parentChildNodes, hasDoctypeChildThatIsNotChild)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
			var parentElementChild = find(parentChildNodes, isElementNode);
			if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
		}
	}
	function _insertBefore(parent, node, child, _inDocumentAssertion) {
		assertPreInsertionValidity1to5(parent, node, child);
		if (parent.nodeType === Node.DOCUMENT_NODE) (_inDocumentAssertion || assertPreInsertionValidityInDocument)(parent, node, child);
		var cp = node.parentNode;
		if (cp) cp.removeChild(node);
		if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
			var newFirst = node.firstChild;
			if (newFirst == null) return node;
			var newLast = node.lastChild;
		} else newFirst = newLast = node;
		var pre = child ? child.previousSibling : parent.lastChild;
		newFirst.previousSibling = pre;
		newLast.nextSibling = child;
		if (pre) pre.nextSibling = newFirst;
		else parent.firstChild = newFirst;
		if (child == null) parent.lastChild = newLast;
		else child.previousSibling = newLast;
		do
			newFirst.parentNode = parent;
		while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
		_onUpdateChild(parent.ownerDocument || parent, parent, node);
		if (node.nodeType == DOCUMENT_FRAGMENT_NODE) node.firstChild = node.lastChild = null;
		return node;
	}
	Document.prototype = {
		/**
		* The implementation that created this document.
		*
		* @type DOMImplementation
		* @readonly
		*/
		implementation: null,
		nodeName: "#document",
		nodeType: DOCUMENT_NODE,
		/**
		* The DocumentType node of the document.
		*
		* @type DocumentType
		* @readonly
		*/
		doctype: null,
		documentElement: null,
		_inc: 1,
		insertBefore: function(newChild, refChild) {
			if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
				var child = newChild.firstChild;
				while (child) {
					var next = child.nextSibling;
					this.insertBefore(child, refChild);
					child = next;
				}
				return newChild;
			}
			_insertBefore(this, newChild, refChild);
			newChild.ownerDocument = this;
			if (this.documentElement === null && newChild.nodeType === ELEMENT_NODE) this.documentElement = newChild;
			return newChild;
		},
		removeChild: function(oldChild) {
			var removed = _removeChild(this, oldChild);
			if (removed === this.documentElement) this.documentElement = null;
			return removed;
		},
		replaceChild: function(newChild, oldChild) {
			_insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
			newChild.ownerDocument = this;
			if (oldChild) this.removeChild(oldChild);
			if (isElementNode(newChild)) this.documentElement = newChild;
		},
		/**
		* Imports a node from another document into this document, creating a new copy owned by this
		* document. The source node and its subtree are not modified.
		*
		* @param {Node} importedNode
		* The node to import.
		* @param {boolean} deep
		* If true, the contents of the node are recursively imported.
		* If false, only the node itself (and its attributes, if it is an element) are imported.
		* @returns {Node}
		* Returns the newly created import of the node.
		* @see {@link importNode}
		* @see {@link https://dom.spec.whatwg.org/#dom-document-importnode}
		*/
		importNode: function(importedNode, deep) {
			return importNode(this, importedNode, deep);
		},
		getElementById: function(id) {
			var rtv = null;
			_visitNode(this.documentElement, function(node) {
				if (node.nodeType == ELEMENT_NODE) {
					if (node.getAttribute("id") == id) {
						rtv = node;
						return true;
					}
				}
			});
			return rtv;
		},
		/**
		* Creates a new `Element` that is owned by this `Document`.
		* In HTML Documents `localName` is the lower cased `tagName`,
		* otherwise no transformation is being applied.
		* When `contentType` implies the HTML namespace, it will be set as `namespaceURI`.
		*
		* __This implementation differs from the specification:__ - The provided name is not checked
		* against the `Name` production,
		* so no related error will be thrown.
		* - There is no interface `HTMLElement`, it is always an `Element`.
		* - There is no support for a second argument to indicate using custom elements.
		*
		* @param {string} tagName
		* @returns {Element}
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
		* @see https://dom.spec.whatwg.org/#dom-document-createelement
		* @see https://dom.spec.whatwg.org/#concept-create-element
		*/
		createElement: function(tagName) {
			var node = new Element(PDC);
			node.ownerDocument = this;
			if (this.type === "html") tagName = tagName.toLowerCase();
			if (hasDefaultHTMLNamespace(this.contentType)) node.namespaceURI = NAMESPACE.HTML;
			node.nodeName = tagName;
			node.tagName = tagName;
			node.localName = tagName;
			node.childNodes = new NodeList();
			var attrs = node.attributes = new NamedNodeMap();
			attrs._ownerElement = node;
			return node;
		},
		/**
		* @returns {DocumentFragment}
		*/
		createDocumentFragment: function() {
			var node = new DocumentFragment(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			return node;
		},
		/**
		* @param {string} data
		* @returns {Text}
		*/
		createTextNode: function(data) {
			var node = new Text(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.appendData(data);
			return node;
		},
		/**
		* @param {string} data
		* @returns {Comment}
		* @see https://dom.spec.whatwg.org/#dom-document-createcomment
		* @see https://www.w3.org/TR/xml/#NT-Comment XML 1.0 production [15]
		* @see https://www.w3.org/TR/DOM-Parsing/#dfn-concept-serialize-xml §3.2.1.3
		*
		*      Note: no validation is performed at creation time. When the resulting document is
		*      serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
		*      if the comment data contains `--` anywhere, ends with `-`, or contains characters
		*      outside the XML Char production (W3C DOM Parsing §3.2.1.3). Without that option the
		*      data is emitted verbatim.
		*/
		createComment: function(data) {
			var node = new Comment(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.appendData(data);
			return node;
		},
		/**
		* Returns a new CDATASection node whose data is `data`.
		*
		* __This implementation differs from the specification:__ - calling this method on an HTML
		* document does not throw `NotSupportedError`.
		*
		* @param {string} data
		* @returns {CDATASection}
		* @throws {DOMException}
		* With code `INVALID_CHARACTER_ERR` if `data` contains `"]]>"`.
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createCDATASection
		* @see https://dom.spec.whatwg.org/#dom-document-createcdatasection
		*/
		createCDATASection: function(data) {
			if (data.indexOf("]]>") !== -1) throw new DOMException(DOMException.INVALID_CHARACTER_ERR, "data contains \"]]>\"");
			var node = new CDATASection(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.appendData(data);
			return node;
		},
		/**
		* Returns a ProcessingInstruction node whose target is target and data is data.
		*
		* __This behavior is slightly different from the in the specs__:
		* - it does not do any input validation on the arguments and doesn't throw
		* "InvalidCharacterError".
		*
		* Note: When the resulting document is serialized with `requireWellFormed: true`, the
		* serializer throws `InvalidStateError` if `.target` is not a valid XML `NCName` (a `Name`
		* with no colon) or is an ASCII case-insensitive match for `"xml"`, or if `.data` contains
		* `?>` or characters outside the XML Char production (W3C DOM Parsing §3.2.1.7). Without that
		* option the target and data are emitted verbatim.
		*
		* @param {string} target
		* @param {string} data
		* @returns {ProcessingInstruction}
		* @see https://developer.mozilla.org/docs/Web/API/Document/createProcessingInstruction
		* @see https://dom.spec.whatwg.org/#dom-document-createprocessinginstruction
		* @see https://www.w3.org/TR/DOM-Parsing/#dfn-concept-serialize-xml §3.2.1.7
		*/
		createProcessingInstruction: function(target, data) {
			var node = new ProcessingInstruction(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.nodeName = node.target = target;
			node.nodeValue = node.data = data;
			return node;
		},
		/**
		* Creates an `Attr` node that is owned by this document.
		* In HTML Documents `localName` is the lower cased `name`,
		* otherwise no transformation is being applied.
		*
		* __This implementation differs from the specification:__ - The provided name is not checked
		* against the `Name` production,
		* so no related error will be thrown.
		*
		* @param {string} name
		* @returns {Attr}
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createAttribute
		* @see https://dom.spec.whatwg.org/#dom-document-createattribute
		*/
		createAttribute: function(name) {
			if (!g.QName_exact.test(name)) throw new DOMException(DOMException.INVALID_CHARACTER_ERR, "invalid character in name \"" + name + "\"");
			if (this.type === "html") name = name.toLowerCase();
			return this._createAttribute(name);
		},
		_createAttribute: function(name) {
			var node = new Attr(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.name = name;
			node.nodeName = name;
			node.localName = name;
			node.specified = true;
			return node;
		},
		/**
		* Creates an EntityReference object.
		* The current implementation does not fill the `childNodes` with those of the corresponding
		* `Entity`
		*
		* The `name` is validated against the XML `Name` production at creation time; an invalid name
		* throws `InvalidCharacterError`. When the resulting node is serialized with
		* `requireWellFormed: true`, the serializer re-validates `nodeName` against the XML `Name`
		* production and throws `InvalidStateError` if a later `nodeName` mutation made it invalid;
		* without that option the name is emitted verbatim.
		*
		* __This implementation differs from the specification:__ xmldom does not expand entities —
		* the parser resolves entity references inline and never constructs `EntityReference` nodes,
		* so this method is the only producer.
		*
		* @deprecated
		* In DOM Level 4.
		* @param {string} name
		* The name of the entity to reference. No namespace well-formedness checks are performed.
		* @returns {EntityReference}
		* @throws {DOMException}
		* With code `INVALID_CHARACTER_ERR` when `name` is not a valid XML `Name`.
		* @throws {DOMException}
		* with code `NOT_SUPPORTED_ERR` when the document is of type `html`
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-392B75AE
		*/
		createEntityReference: function(name) {
			if (!g.Name_exact.test(name)) throw new DOMException(DOMException.INVALID_CHARACTER_ERR, "not a valid xml name \"" + name + "\"");
			if (this.type === "html") throw new DOMException("document is an html document", DOMExceptionName.NotSupportedError);
			var node = new EntityReference(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.nodeName = name;
			return node;
		},
		/**
		* @param {string} namespaceURI
		* @param {string} qualifiedName
		* @returns {Element}
		*/
		createElementNS: function(namespaceURI, qualifiedName) {
			var validated = validateAndExtract(namespaceURI, qualifiedName);
			var node = new Element(PDC);
			var attrs = node.attributes = new NamedNodeMap();
			node.childNodes = new NodeList();
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.tagName = qualifiedName;
			node.namespaceURI = validated[0];
			node.prefix = validated[1];
			node.localName = validated[2];
			attrs._ownerElement = node;
			return node;
		},
		/**
		* @param {string} namespaceURI
		* @param {string} qualifiedName
		* @returns {Attr}
		*/
		createAttributeNS: function(namespaceURI, qualifiedName) {
			var validated = validateAndExtract(namespaceURI, qualifiedName);
			var node = new Attr(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.nodeName = qualifiedName;
			node.name = qualifiedName;
			node.specified = true;
			node.namespaceURI = validated[0];
			node.prefix = validated[1];
			node.localName = validated[2];
			return node;
		}
	};
	_extends(Document, Node);
	function Element(symbol) {
		checkSymbol(symbol);
		this._nsMap = /* @__PURE__ */ Object.create(null);
	}
	Element.prototype = {
		nodeType: ELEMENT_NODE,
		/**
		* The attributes of this element.
		*
		* @type {NamedNodeMap | null}
		*/
		attributes: null,
		getQualifiedName: function() {
			return this.prefix ? this.prefix + ":" + this.localName : this.localName;
		},
		_isInHTMLDocumentAndNamespace: function() {
			return this.ownerDocument.type === "html" && this.namespaceURI === NAMESPACE.HTML;
		},
		/**
		* Implementaton of Level2 Core function hasAttributes.
		*
		* @returns {boolean}
		* True if attribute list is not empty.
		* @see https://www.w3.org/TR/DOM-Level-2-Core/#core-ID-NodeHasAttrs
		*/
		hasAttributes: function() {
			return !!(this.attributes && this.attributes.length);
		},
		hasAttribute: function(name) {
			return !!this.getAttributeNode(name);
		},
		/**
		* Returns element’s first attribute whose qualified name is `name`, and `null`
		* if there is no such attribute.
		*
		* @param {string} name
		* @returns {string | null}
		*/
		getAttribute: function(name) {
			var attr = this.getAttributeNode(name);
			return attr ? attr.value : null;
		},
		getAttributeNode: function(name) {
			if (this._isInHTMLDocumentAndNamespace()) name = name.toLowerCase();
			return this.attributes.getNamedItem(name);
		},
		/**
		* Sets the value of element’s first attribute whose qualified name is qualifiedName to value.
		*
		* @param {string} name
		* @param {string} value
		*/
		setAttribute: function(name, value) {
			if (this._isInHTMLDocumentAndNamespace()) name = name.toLowerCase();
			var attr = this.getAttributeNode(name);
			if (attr) attr.value = attr.nodeValue = "" + value;
			else {
				attr = this.ownerDocument._createAttribute(name);
				attr.value = attr.nodeValue = "" + value;
				this.setAttributeNode(attr);
			}
		},
		removeAttribute: function(name) {
			var attr = this.getAttributeNode(name);
			attr && this.removeAttributeNode(attr);
		},
		setAttributeNode: function(newAttr) {
			return this.attributes.setNamedItem(newAttr);
		},
		setAttributeNodeNS: function(newAttr) {
			return this.attributes.setNamedItemNS(newAttr);
		},
		removeAttributeNode: function(oldAttr) {
			return this.attributes.removeNamedItem(oldAttr.nodeName);
		},
		removeAttributeNS: function(namespaceURI, localName) {
			var old = this.getAttributeNodeNS(namespaceURI, localName);
			old && this.removeAttributeNode(old);
		},
		hasAttributeNS: function(namespaceURI, localName) {
			return this.getAttributeNodeNS(namespaceURI, localName) != null;
		},
		/**
		* Returns element’s attribute whose namespace is `namespaceURI` and local name is
		* `localName`,
		* or `null` if there is no such attribute.
		*
		* @param {string} namespaceURI
		* @param {string} localName
		* @returns {string | null}
		*/
		getAttributeNS: function(namespaceURI, localName) {
			var attr = this.getAttributeNodeNS(namespaceURI, localName);
			return attr ? attr.value : null;
		},
		/**
		* Sets the value of element’s attribute whose namespace is `namespaceURI` and local name is
		* `localName` to value.
		*
		* @param {string} namespaceURI
		* @param {string} qualifiedName
		* @param {string} value
		* @see https://dom.spec.whatwg.org/#dom-element-setattributens
		*/
		setAttributeNS: function(namespaceURI, qualifiedName, value) {
			var localName = validateAndExtract(namespaceURI, qualifiedName)[2];
			var attr = this.getAttributeNodeNS(namespaceURI, localName);
			if (attr) attr.value = attr.nodeValue = "" + value;
			else {
				attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
				attr.value = attr.nodeValue = "" + value;
				this.setAttributeNode(attr);
			}
		},
		getAttributeNodeNS: function(namespaceURI, localName) {
			return this.attributes.getNamedItemNS(namespaceURI, localName);
		},
		/**
		* Returns a LiveNodeList of all child elements which have **all** of the given class name(s).
		*
		* Returns an empty list if `classNames` is an empty string or only contains HTML white space
		* characters.
		*
		* Warning: This returns a live LiveNodeList.
		* Changes in the DOM will reflect in the array as the changes occur.
		* If an element selected by this array no longer qualifies for the selector,
		* it will automatically be removed. Be aware of this for iteration purposes.
		*
		* @param {string} classNames
		* Is a string representing the class name(s) to match; multiple class names are separated by
		* (ASCII-)whitespace.
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByClassName
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
		* @see https://dom.spec.whatwg.org/#concept-getelementsbyclassname
		*/
		getElementsByClassName: function(classNames) {
			var classNamesSet = toOrderedSet(classNames);
			return new LiveNodeList(this, function(base) {
				var ls = [];
				if (classNamesSet.length > 0) _visitNode(base, function(node) {
					if (node !== base && node.nodeType === ELEMENT_NODE) {
						var nodeClassNames = node.getAttribute("class");
						if (nodeClassNames) {
							var matches = classNames === nodeClassNames;
							if (!matches) {
								var nodeClassNamesSet = toOrderedSet(nodeClassNames);
								matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
							}
							if (matches) ls.push(node);
						}
					}
				});
				return ls;
			});
		},
		/**
		* Returns a LiveNodeList of elements with the given qualifiedName.
		* Searching for all descendants can be done by passing `*` as `qualifiedName`.
		*
		* All descendants of the specified element are searched, but not the element itself.
		* The returned list is live, which means it updates itself with the DOM tree automatically.
		* Therefore, there is no need to call `Element.getElementsByTagName()`
		* with the same element and arguments repeatedly if the DOM changes in between calls.
		*
		* When called on an HTML element in an HTML document,
		* `getElementsByTagName` lower-cases the argument before searching for it.
		* This is undesirable when trying to match camel-cased SVG elements (such as
		* `<linearGradient>`) in an HTML document.
		* Instead, use `Element.getElementsByTagNameNS()`,
		* which preserves the capitalization of the tag name.
		*
		* `Element.getElementsByTagName` is similar to `Document.getElementsByTagName()`,
		* except that it only searches for elements that are descendants of the specified element.
		*
		* @param {string} qualifiedName
		* @returns {LiveNodeList}
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagName
		* @see https://dom.spec.whatwg.org/#concept-getelementsbytagname
		*/
		getElementsByTagName: function(qualifiedName) {
			var isHTMLDocument = (this.nodeType === DOCUMENT_NODE ? this : this.ownerDocument).type === "html";
			var lowerQualifiedName = qualifiedName.toLowerCase();
			return new LiveNodeList(this, function(base) {
				var ls = [];
				_visitNode(base, function(node) {
					if (node === base || node.nodeType !== ELEMENT_NODE) return;
					if (qualifiedName === "*") ls.push(node);
					else if (node.getQualifiedName() === (isHTMLDocument && node.namespaceURI === NAMESPACE.HTML ? lowerQualifiedName : qualifiedName)) ls.push(node);
				});
				return ls;
			});
		},
		getElementsByTagNameNS: function(namespaceURI, localName) {
			return new LiveNodeList(this, function(base) {
				var ls = [];
				_visitNode(base, function(node) {
					if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === "*" || node.namespaceURI === namespaceURI) && (localName === "*" || node.localName == localName)) ls.push(node);
				});
				return ls;
			});
		}
	};
	Document.prototype.getElementsByClassName = Element.prototype.getElementsByClassName;
	Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
	Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
	_extends(Element, Node);
	function Attr(symbol) {
		checkSymbol(symbol);
		this.namespaceURI = null;
		this.prefix = null;
		this.ownerElement = null;
	}
	Attr.prototype.nodeType = ATTRIBUTE_NODE;
	_extends(Attr, Node);
	function CharacterData(symbol) {
		checkSymbol(symbol);
	}
	CharacterData.prototype = {
		data: "",
		substringData: function(offset, count) {
			return this.data.substring(offset, offset + count);
		},
		appendData: function(text) {
			text = this.data + text;
			this.nodeValue = this.data = text;
			this.length = text.length;
		},
		insertData: function(offset, text) {
			this.replaceData(offset, 0, text);
		},
		deleteData: function(offset, count) {
			this.replaceData(offset, count, "");
		},
		replaceData: function(offset, count, text) {
			var start = this.data.substring(0, offset);
			var end = this.data.substring(offset + count);
			text = start + text + end;
			this.nodeValue = this.data = text;
			this.length = text.length;
		}
	};
	_extends(CharacterData, Node);
	function Text(symbol) {
		checkSymbol(symbol);
	}
	Text.prototype = {
		nodeName: "#text",
		nodeType: TEXT_NODE,
		splitText: function(offset) {
			var text = this.data;
			var newText = text.substring(offset);
			text = text.substring(0, offset);
			this.data = this.nodeValue = text;
			this.length = text.length;
			var newNode = this.ownerDocument.createTextNode(newText);
			if (this.parentNode) this.parentNode.insertBefore(newNode, this.nextSibling);
			return newNode;
		}
	};
	_extends(Text, CharacterData);
	function Comment(symbol) {
		checkSymbol(symbol);
	}
	Comment.prototype = {
		nodeName: "#comment",
		nodeType: COMMENT_NODE
	};
	_extends(Comment, CharacterData);
	function CDATASection(symbol) {
		checkSymbol(symbol);
	}
	CDATASection.prototype = {
		nodeName: "#cdata-section",
		nodeType: CDATA_SECTION_NODE
	};
	_extends(CDATASection, Text);
	function DocumentType(symbol) {
		checkSymbol(symbol);
	}
	DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
	_extends(DocumentType, Node);
	function Notation(symbol) {
		checkSymbol(symbol);
	}
	Notation.prototype.nodeType = NOTATION_NODE;
	_extends(Notation, Node);
	function Entity(symbol) {
		checkSymbol(symbol);
	}
	Entity.prototype.nodeType = ENTITY_NODE;
	_extends(Entity, Node);
	function EntityReference(symbol) {
		checkSymbol(symbol);
	}
	EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
	_extends(EntityReference, Node);
	function DocumentFragment(symbol) {
		checkSymbol(symbol);
	}
	DocumentFragment.prototype.nodeName = "#document-fragment";
	DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
	_extends(DocumentFragment, Node);
	function ProcessingInstruction(symbol) {
		checkSymbol(symbol);
	}
	ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
	_extends(ProcessingInstruction, CharacterData);
	function XMLSerializer2() {}
	XMLSerializer2.prototype.serializeToString = function(node, options) {
		return nodeSerializeToString.call(node, options);
	};
	Node.prototype.toString = nodeSerializeToString;
	function nodeSerializeToString(options) {
		var opts;
		if (typeof options === "function") opts = {
			requireWellFormed: false,
			splitCDATASections: true,
			nodeFilter: options
		};
		else if (options != null) opts = {
			requireWellFormed: !!options.requireWellFormed,
			splitCDATASections: options.splitCDATASections !== false,
			nodeFilter: options.nodeFilter || null
		};
		else opts = {
			requireWellFormed: false,
			splitCDATASections: true,
			nodeFilter: null
		};
		var buf = [];
		var refNode = this.nodeType === DOCUMENT_NODE && this.documentElement || this;
		var prefix = refNode.prefix;
		var uri = refNode.namespaceURI;
		if (uri && prefix == null) {
			var prefix = refNode.lookupPrefix(uri);
			if (prefix == null) var visibleNamespaces = [{
				namespace: uri,
				prefix: null
			}];
		}
		serializeToString(this, buf, visibleNamespaces, opts);
		return buf.join("");
	}
	function needNamespaceDefine(node, isHTML, visibleNamespaces) {
		var prefix = node.prefix || "";
		var uri = node.namespaceURI;
		if (!uri) return false;
		if (prefix === "xml" && uri === NAMESPACE.XML || uri === NAMESPACE.XMLNS) return false;
		var i = visibleNamespaces.length;
		while (i--) {
			var ns = visibleNamespaces[i];
			if (ns.prefix === prefix) return ns.namespace !== uri;
		}
		return true;
	}
	function addSerializedAttribute(buf, qualifiedName, value, requireWellFormed) {
		if (requireWellFormed && !g.QName_exact.test(qualifiedName)) throw new DOMException("The attribute name \"" + qualifiedName + "\" is not a valid XML QName", DOMExceptionName.InvalidStateError);
		buf.push(" ", qualifiedName, "=\"", value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), "\"");
	}
	function serializeToString(node, buf, visibleNamespaces, opts) {
		if (!visibleNamespaces) visibleNamespaces = [];
		var nodeFilter = opts.nodeFilter;
		var requireWellFormed = opts.requireWellFormed;
		var splitCDATASections = opts.splitCDATASections;
		var isHTML = (node.nodeType === DOCUMENT_NODE ? node : node.ownerDocument).type === "html";
		walkDOM(node, { ns: visibleNamespaces }, {
			enter: function(n, ctx) {
				var namespaces = ctx.ns;
				if (nodeFilter) {
					n = nodeFilter(n);
					if (n) {
						if (typeof n == "string") {
							buf.push(n);
							return null;
						}
					} else return null;
				}
				switch (n.nodeType) {
					case ELEMENT_NODE:
						var attrs = n.attributes;
						var len = attrs.length;
						var nodeName = n.tagName;
						var prefixedNodeName = nodeName;
						if (!isHTML && !n.prefix && n.namespaceURI) {
							var defaultNS;
							for (var ai = 0; ai < attrs.length; ai++) if (attrs.item(ai).name === "xmlns") {
								defaultNS = attrs.item(ai).value;
								break;
							}
							if (!defaultNS) for (var nsi = namespaces.length - 1; nsi >= 0; nsi--) {
								var nsEntry = namespaces[nsi];
								if (nsEntry.prefix === "" && nsEntry.namespace === n.namespaceURI) {
									defaultNS = nsEntry.namespace;
									break;
								}
							}
							if (defaultNS !== n.namespaceURI) for (var nsi = namespaces.length - 1; nsi >= 0; nsi--) {
								var nsEntry = namespaces[nsi];
								if (nsEntry.namespace === n.namespaceURI) {
									if (nsEntry.prefix) prefixedNodeName = nsEntry.prefix + ":" + nodeName;
									break;
								}
							}
						}
						if (requireWellFormed && !g.QName_exact.test(prefixedNodeName)) throw new DOMException("The element name \"" + prefixedNodeName + "\" is not a valid XML QName", DOMExceptionName.InvalidStateError);
						buf.push("<", prefixedNodeName);
						var childNamespaces = namespaces.slice();
						for (var i = 0; i < len; i++) {
							var attr = attrs.item(i);
							if (attr.prefix == "xmlns") childNamespaces.push({
								prefix: attr.localName,
								namespace: attr.value
							});
							else if (attr.nodeName == "xmlns") childNamespaces.push({
								prefix: "",
								namespace: attr.value
							});
						}
						for (var i = 0; i < len; i++) {
							var attr = attrs.item(i);
							if (needNamespaceDefine(attr, isHTML, childNamespaces)) {
								var attrPrefix = attr.prefix || "";
								var uri = attr.namespaceURI;
								addSerializedAttribute(buf, attrPrefix ? "xmlns:" + attrPrefix : "xmlns", uri, requireWellFormed);
								childNamespaces.push({
									prefix: attrPrefix,
									namespace: uri
								});
							}
							var filteredAttr = nodeFilter ? nodeFilter(attr) : attr;
							if (filteredAttr) if (typeof filteredAttr === "string") buf.push(filteredAttr);
							else addSerializedAttribute(buf, filteredAttr.name, filteredAttr.value, requireWellFormed);
						}
						if (nodeName === prefixedNodeName && needNamespaceDefine(n, isHTML, childNamespaces)) {
							var nodePrefix = n.prefix || "";
							var uri = n.namespaceURI;
							addSerializedAttribute(buf, nodePrefix ? "xmlns:" + nodePrefix : "xmlns", uri, requireWellFormed);
							childNamespaces.push({
								prefix: nodePrefix,
								namespace: uri
							});
						}
						var canCloseTag = !n.firstChild;
						if (canCloseTag && (isHTML || n.namespaceURI === NAMESPACE.HTML)) canCloseTag = isHTMLVoidElement(nodeName);
						if (canCloseTag) {
							buf.push("/>");
							return null;
						}
						buf.push(">");
						if (isHTML && isHTMLRawTextElement(nodeName)) {
							var child = n.firstChild;
							while (child) {
								if (child.data) buf.push(child.data);
								else serializeToString(child, buf, childNamespaces.slice(), opts);
								child = child.nextSibling;
							}
							buf.push("</", prefixedNodeName, ">");
							return null;
						}
						return {
							ns: childNamespaces,
							tag: prefixedNodeName
						};
					case DOCUMENT_NODE:
					case DOCUMENT_FRAGMENT_NODE:
						if (requireWellFormed && n.nodeType === DOCUMENT_NODE && n.documentElement == null) throw new DOMException("The Document has no documentElement", DOMExceptionName.InvalidStateError);
						return { ns: namespaces };
					case ATTRIBUTE_NODE:
						addSerializedAttribute(buf, n.name, n.value, requireWellFormed);
						return null;
					case TEXT_NODE:
						if (requireWellFormed && g.InvalidChar.test(n.data)) throw new DOMException("The Text node data contains characters outside the XML Char production", DOMExceptionName.InvalidStateError);
						buf.push(n.data.replace(/[<&>]/g, _xmlEncoder));
						return null;
					case CDATA_SECTION_NODE:
						if (requireWellFormed && n.data.indexOf("]]>") !== -1) throw new DOMException("The CDATASection data contains \"]]>\"", DOMExceptionName.InvalidStateError);
						if (splitCDATASections) buf.push(g.CDATA_START, n.data.replace(/]]>/g, "]]]]><![CDATA[>"), g.CDATA_END);
						else buf.push(g.CDATA_START, n.data, g.CDATA_END);
						return null;
					case COMMENT_NODE:
						if (requireWellFormed) {
							if (g.InvalidChar.test(n.data)) throw new DOMException("The comment node data contains characters outside the XML Char production", DOMExceptionName.InvalidStateError);
							if (n.data.indexOf("--") !== -1 || n.data[n.data.length - 1] === "-") throw new DOMException("The comment node data contains \"--\" or ends with \"-\"", DOMExceptionName.InvalidStateError);
						}
						buf.push(g.COMMENT_START, n.data, g.COMMENT_END);
						return null;
					case DOCUMENT_TYPE_NODE:
						var pubid = n.publicId;
						var sysid = n.systemId;
						if (requireWellFormed) {
							if (!g.Name_exact.test(n.name)) throw new DOMException("The doctype name \"" + n.name + "\" is not a valid XML Name", DOMExceptionName.InvalidStateError);
							if (pubid && !g.PubidLiteral_match.test(pubid)) throw new DOMException("DocumentType publicId is not a valid PubidLiteral", DOMExceptionName.InvalidStateError);
							if (sysid && sysid !== "." && !g.SystemLiteral_match.test(sysid)) throw new DOMException("DocumentType systemId is not a valid SystemLiteral", DOMExceptionName.InvalidStateError);
							if (n.internalSubset && n.internalSubset.indexOf("]>") !== -1) throw new DOMException("DocumentType internalSubset contains \"]>\"", DOMExceptionName.InvalidStateError);
						}
						buf.push(g.DOCTYPE_DECL_START, " ", n.name);
						if (pubid) {
							buf.push(" ", g.PUBLIC, " ", pubid);
							if (sysid && sysid !== ".") buf.push(" ", sysid);
						} else if (sysid && sysid !== ".") buf.push(" ", g.SYSTEM, " ", sysid);
						if (n.internalSubset) buf.push(" [", n.internalSubset, "]");
						buf.push(">");
						return null;
					case PROCESSING_INSTRUCTION_NODE:
						if (requireWellFormed) {
							if (!g.NCName_exact.test(n.target) || n.target.toLowerCase() === "xml") throw new DOMException("The processing instruction target \"" + n.target + "\" is not a valid XML NCName or is reserved", DOMExceptionName.InvalidStateError);
							if (g.InvalidChar.test(n.data)) throw new DOMException("The ProcessingInstruction data contains characters outside the XML Char production", DOMExceptionName.InvalidStateError);
							if (n.data.indexOf("?>") !== -1) throw new DOMException("The ProcessingInstruction data contains \"?>\"", DOMExceptionName.InvalidStateError);
						}
						buf.push("<?", n.target, " ", n.data, "?>");
						return null;
					case ENTITY_REFERENCE_NODE:
						if (requireWellFormed && !g.Name_exact.test(n.nodeName)) throw new DOMException("The entity reference name \"" + n.nodeName + "\" is not a valid XML Name", DOMExceptionName.InvalidStateError);
						buf.push("&", n.nodeName, ";");
						return null;
					default:
						buf.push("??", n.nodeName);
						return null;
				}
			},
			exit: function(n, childCtx) {
				if (childCtx && childCtx.tag) buf.push("</", childCtx.tag, ">");
			}
		});
	}
	function importNode(doc, node, deep) {
		var destRoot;
		walkDOM(node, null, { enter: function(srcNode, destParent) {
			var destNode = srcNode.cloneNode(false);
			destNode.ownerDocument = doc;
			destNode.parentNode = null;
			if (destParent === null) destRoot = destNode;
			else destParent.appendChild(destNode);
			return srcNode.nodeType === ATTRIBUTE_NODE || deep ? destNode : null;
		} });
		return destRoot;
	}
	function cloneNode(doc, node, deep) {
		var destRoot;
		walkDOM(node, null, { enter: function(srcNode, destParent) {
			var destNode = new srcNode.constructor(PDC);
			for (var n in srcNode) if (hasOwn(srcNode, n)) {
				var v = srcNode[n];
				if (typeof v != "object") {
					if (v != destNode[n]) destNode[n] = v;
				}
			}
			if (srcNode.childNodes) destNode.childNodes = new NodeList();
			destNode.ownerDocument = doc;
			var shouldDeep = deep;
			switch (destNode.nodeType) {
				case ELEMENT_NODE:
					var attrs = srcNode.attributes;
					var attrs2 = destNode.attributes = new NamedNodeMap();
					var len = attrs.length;
					attrs2._ownerElement = destNode;
					for (var i = 0; i < len; i++) destNode.setAttributeNode(cloneNode(doc, attrs.item(i), true));
					break;
				case ATTRIBUTE_NODE: shouldDeep = true;
			}
			if (destParent !== null) destParent.appendChild(destNode);
			else destRoot = destNode;
			return shouldDeep ? destNode : null;
		} });
		return destRoot;
	}
	function __set__(object, key, value) {
		object[key] = value;
	}
	function childrenRefresh(node) {
		var ls = [];
		var child = node.firstChild;
		while (child) {
			if (child.nodeType === ELEMENT_NODE) ls.push(child);
			child = child.nextSibling;
		}
		return ls;
	}
	try {
		if (Object.defineProperty) {
			Object.defineProperty(LiveNodeList.prototype, "length", { get: function() {
				_updateLiveList(this);
				return this.$$length;
			} });
			Object.defineProperty(Node.prototype, "textContent", {
				get: function() {
					if (this.nodeType === ELEMENT_NODE || this.nodeType === DOCUMENT_FRAGMENT_NODE) {
						var buf = [];
						walkDOM(this, null, { enter: function(n) {
							if (n.nodeType === ELEMENT_NODE || n.nodeType === DOCUMENT_FRAGMENT_NODE) return true;
							if (n.nodeType === PROCESSING_INSTRUCTION_NODE || n.nodeType === COMMENT_NODE) return null;
							buf.push(n.nodeValue);
						} });
						return buf.join("");
					}
					return this.nodeValue;
				},
				set: function(data) {
					switch (this.nodeType) {
						case ELEMENT_NODE:
						case DOCUMENT_FRAGMENT_NODE:
							while (this.firstChild) this.removeChild(this.firstChild);
							if (data || String(data)) this.appendChild(this.ownerDocument.createTextNode(data));
							break;
						default:
							this.data = data;
							this.value = data;
							this.nodeValue = data;
					}
				}
			});
			Object.defineProperty(CharacterData.prototype, "data", {
				get: function() {
					return this._data != null ? this._data : "";
				},
				set: function(v) {
					this._data = v;
					this.length = typeof v === "string" ? v.length : 0;
				}
			});
			Object.defineProperty(CharacterData.prototype, "nodeValue", {
				get: function() {
					return this.data;
				},
				set: function(v) {
					this.data = v;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(Element.prototype, "children", { get: function() {
				return new LiveNodeList(this, childrenRefresh);
			} });
			Object.defineProperty(Document.prototype, "children", { get: function() {
				return new LiveNodeList(this, childrenRefresh);
			} });
			Object.defineProperty(DocumentFragment.prototype, "children", { get: function() {
				return new LiveNodeList(this, childrenRefresh);
			} });
			__set__ = function(object, key, value) {
				object["$$" + key] = value;
			};
		}
	} catch (e) {}
	exports._updateLiveList = _updateLiveList;
	exports.Attr = Attr;
	exports.CDATASection = CDATASection;
	exports.CharacterData = CharacterData;
	exports.Comment = Comment;
	exports.Document = Document;
	exports.DocumentFragment = DocumentFragment;
	exports.DocumentType = DocumentType;
	exports.DOMImplementation = DOMImplementation;
	exports.Element = Element;
	exports.Entity = Entity;
	exports.EntityReference = EntityReference;
	exports.LiveNodeList = LiveNodeList;
	exports.NamedNodeMap = NamedNodeMap;
	exports.Node = Node;
	exports.NodeList = NodeList;
	exports.Notation = Notation;
	exports.Text = Text;
	exports.ProcessingInstruction = ProcessingInstruction;
	exports.walkDOM = walkDOM;
	exports.XMLSerializer = XMLSerializer2;
} });
var require_entities = __commonJS({ "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/entities.js"(exports) {
	"use strict";
	var freeze = require_conventions().freeze;
	exports.XML_ENTITIES = freeze({
		amp: "&",
		apos: "'",
		gt: ">",
		lt: "<",
		quot: "\""
	});
	exports.HTML_ENTITIES = freeze({
		Aacute: "Á",
		aacute: "á",
		Abreve: "Ă",
		abreve: "ă",
		ac: "∾",
		acd: "∿",
		acE: "∾̳",
		Acirc: "Â",
		acirc: "â",
		acute: "´",
		Acy: "А",
		acy: "а",
		AElig: "Æ",
		aelig: "æ",
		af: "⁡",
		Afr: "𝔄",
		afr: "𝔞",
		Agrave: "À",
		agrave: "à",
		alefsym: "ℵ",
		aleph: "ℵ",
		Alpha: "Α",
		alpha: "α",
		Amacr: "Ā",
		amacr: "ā",
		amalg: "⨿",
		AMP: "&",
		amp: "&",
		And: "⩓",
		and: "∧",
		andand: "⩕",
		andd: "⩜",
		andslope: "⩘",
		andv: "⩚",
		ang: "∠",
		ange: "⦤",
		angle: "∠",
		angmsd: "∡",
		angmsdaa: "⦨",
		angmsdab: "⦩",
		angmsdac: "⦪",
		angmsdad: "⦫",
		angmsdae: "⦬",
		angmsdaf: "⦭",
		angmsdag: "⦮",
		angmsdah: "⦯",
		angrt: "∟",
		angrtvb: "⊾",
		angrtvbd: "⦝",
		angsph: "∢",
		angst: "Å",
		angzarr: "⍼",
		Aogon: "Ą",
		aogon: "ą",
		Aopf: "𝔸",
		aopf: "𝕒",
		ap: "≈",
		apacir: "⩯",
		apE: "⩰",
		ape: "≊",
		apid: "≋",
		apos: "'",
		ApplyFunction: "⁡",
		approx: "≈",
		approxeq: "≊",
		Aring: "Å",
		aring: "å",
		Ascr: "𝒜",
		ascr: "𝒶",
		Assign: "≔",
		ast: "*",
		asymp: "≈",
		asympeq: "≍",
		Atilde: "Ã",
		atilde: "ã",
		Auml: "Ä",
		auml: "ä",
		awconint: "∳",
		awint: "⨑",
		backcong: "≌",
		backepsilon: "϶",
		backprime: "‵",
		backsim: "∽",
		backsimeq: "⋍",
		Backslash: "∖",
		Barv: "⫧",
		barvee: "⊽",
		Barwed: "⌆",
		barwed: "⌅",
		barwedge: "⌅",
		bbrk: "⎵",
		bbrktbrk: "⎶",
		bcong: "≌",
		Bcy: "Б",
		bcy: "б",
		bdquo: "„",
		becaus: "∵",
		Because: "∵",
		because: "∵",
		bemptyv: "⦰",
		bepsi: "϶",
		bernou: "ℬ",
		Bernoullis: "ℬ",
		Beta: "Β",
		beta: "β",
		beth: "ℶ",
		between: "≬",
		Bfr: "𝔅",
		bfr: "𝔟",
		bigcap: "⋂",
		bigcirc: "◯",
		bigcup: "⋃",
		bigodot: "⨀",
		bigoplus: "⨁",
		bigotimes: "⨂",
		bigsqcup: "⨆",
		bigstar: "★",
		bigtriangledown: "▽",
		bigtriangleup: "△",
		biguplus: "⨄",
		bigvee: "⋁",
		bigwedge: "⋀",
		bkarow: "⤍",
		blacklozenge: "⧫",
		blacksquare: "▪",
		blacktriangle: "▴",
		blacktriangledown: "▾",
		blacktriangleleft: "◂",
		blacktriangleright: "▸",
		blank: "␣",
		blk12: "▒",
		blk14: "░",
		blk34: "▓",
		block: "█",
		bne: "=⃥",
		bnequiv: "≡⃥",
		bNot: "⫭",
		bnot: "⌐",
		Bopf: "𝔹",
		bopf: "𝕓",
		bot: "⊥",
		bottom: "⊥",
		bowtie: "⋈",
		boxbox: "⧉",
		boxDL: "╗",
		boxDl: "╖",
		boxdL: "╕",
		boxdl: "┐",
		boxDR: "╔",
		boxDr: "╓",
		boxdR: "╒",
		boxdr: "┌",
		boxH: "═",
		boxh: "─",
		boxHD: "╦",
		boxHd: "╤",
		boxhD: "╥",
		boxhd: "┬",
		boxHU: "╩",
		boxHu: "╧",
		boxhU: "╨",
		boxhu: "┴",
		boxminus: "⊟",
		boxplus: "⊞",
		boxtimes: "⊠",
		boxUL: "╝",
		boxUl: "╜",
		boxuL: "╛",
		boxul: "┘",
		boxUR: "╚",
		boxUr: "╙",
		boxuR: "╘",
		boxur: "└",
		boxV: "║",
		boxv: "│",
		boxVH: "╬",
		boxVh: "╫",
		boxvH: "╪",
		boxvh: "┼",
		boxVL: "╣",
		boxVl: "╢",
		boxvL: "╡",
		boxvl: "┤",
		boxVR: "╠",
		boxVr: "╟",
		boxvR: "╞",
		boxvr: "├",
		bprime: "‵",
		Breve: "˘",
		breve: "˘",
		brvbar: "¦",
		Bscr: "ℬ",
		bscr: "𝒷",
		bsemi: "⁏",
		bsim: "∽",
		bsime: "⋍",
		bsol: "\\",
		bsolb: "⧅",
		bsolhsub: "⟈",
		bull: "•",
		bullet: "•",
		bump: "≎",
		bumpE: "⪮",
		bumpe: "≏",
		Bumpeq: "≎",
		bumpeq: "≏",
		Cacute: "Ć",
		cacute: "ć",
		Cap: "⋒",
		cap: "∩",
		capand: "⩄",
		capbrcup: "⩉",
		capcap: "⩋",
		capcup: "⩇",
		capdot: "⩀",
		CapitalDifferentialD: "ⅅ",
		caps: "∩︀",
		caret: "⁁",
		caron: "ˇ",
		Cayleys: "ℭ",
		ccaps: "⩍",
		Ccaron: "Č",
		ccaron: "č",
		Ccedil: "Ç",
		ccedil: "ç",
		Ccirc: "Ĉ",
		ccirc: "ĉ",
		Cconint: "∰",
		ccups: "⩌",
		ccupssm: "⩐",
		Cdot: "Ċ",
		cdot: "ċ",
		cedil: "¸",
		Cedilla: "¸",
		cemptyv: "⦲",
		cent: "¢",
		CenterDot: "·",
		centerdot: "·",
		Cfr: "ℭ",
		cfr: "𝔠",
		CHcy: "Ч",
		chcy: "ч",
		check: "✓",
		checkmark: "✓",
		Chi: "Χ",
		chi: "χ",
		cir: "○",
		circ: "ˆ",
		circeq: "≗",
		circlearrowleft: "↺",
		circlearrowright: "↻",
		circledast: "⊛",
		circledcirc: "⊚",
		circleddash: "⊝",
		CircleDot: "⊙",
		circledR: "®",
		circledS: "Ⓢ",
		CircleMinus: "⊖",
		CirclePlus: "⊕",
		CircleTimes: "⊗",
		cirE: "⧃",
		cire: "≗",
		cirfnint: "⨐",
		cirmid: "⫯",
		cirscir: "⧂",
		ClockwiseContourIntegral: "∲",
		CloseCurlyDoubleQuote: "”",
		CloseCurlyQuote: "’",
		clubs: "♣",
		clubsuit: "♣",
		Colon: "∷",
		colon: ":",
		Colone: "⩴",
		colone: "≔",
		coloneq: "≔",
		comma: ",",
		commat: "@",
		comp: "∁",
		compfn: "∘",
		complement: "∁",
		complexes: "ℂ",
		cong: "≅",
		congdot: "⩭",
		Congruent: "≡",
		Conint: "∯",
		conint: "∮",
		ContourIntegral: "∮",
		Copf: "ℂ",
		copf: "𝕔",
		coprod: "∐",
		Coproduct: "∐",
		COPY: "©",
		copy: "©",
		copysr: "℗",
		CounterClockwiseContourIntegral: "∳",
		crarr: "↵",
		Cross: "⨯",
		cross: "✗",
		Cscr: "𝒞",
		cscr: "𝒸",
		csub: "⫏",
		csube: "⫑",
		csup: "⫐",
		csupe: "⫒",
		ctdot: "⋯",
		cudarrl: "⤸",
		cudarrr: "⤵",
		cuepr: "⋞",
		cuesc: "⋟",
		cularr: "↶",
		cularrp: "⤽",
		Cup: "⋓",
		cup: "∪",
		cupbrcap: "⩈",
		CupCap: "≍",
		cupcap: "⩆",
		cupcup: "⩊",
		cupdot: "⊍",
		cupor: "⩅",
		cups: "∪︀",
		curarr: "↷",
		curarrm: "⤼",
		curlyeqprec: "⋞",
		curlyeqsucc: "⋟",
		curlyvee: "⋎",
		curlywedge: "⋏",
		curren: "¤",
		curvearrowleft: "↶",
		curvearrowright: "↷",
		cuvee: "⋎",
		cuwed: "⋏",
		cwconint: "∲",
		cwint: "∱",
		cylcty: "⌭",
		Dagger: "‡",
		dagger: "†",
		daleth: "ℸ",
		Darr: "↡",
		dArr: "⇓",
		darr: "↓",
		dash: "‐",
		Dashv: "⫤",
		dashv: "⊣",
		dbkarow: "⤏",
		dblac: "˝",
		Dcaron: "Ď",
		dcaron: "ď",
		Dcy: "Д",
		dcy: "д",
		DD: "ⅅ",
		dd: "ⅆ",
		ddagger: "‡",
		ddarr: "⇊",
		DDotrahd: "⤑",
		ddotseq: "⩷",
		deg: "°",
		Del: "∇",
		Delta: "Δ",
		delta: "δ",
		demptyv: "⦱",
		dfisht: "⥿",
		Dfr: "𝔇",
		dfr: "𝔡",
		dHar: "⥥",
		dharl: "⇃",
		dharr: "⇂",
		DiacriticalAcute: "´",
		DiacriticalDot: "˙",
		DiacriticalDoubleAcute: "˝",
		DiacriticalGrave: "`",
		DiacriticalTilde: "˜",
		diam: "⋄",
		Diamond: "⋄",
		diamond: "⋄",
		diamondsuit: "♦",
		diams: "♦",
		die: "¨",
		DifferentialD: "ⅆ",
		digamma: "ϝ",
		disin: "⋲",
		div: "÷",
		divide: "÷",
		divideontimes: "⋇",
		divonx: "⋇",
		DJcy: "Ђ",
		djcy: "ђ",
		dlcorn: "⌞",
		dlcrop: "⌍",
		dollar: "$",
		Dopf: "𝔻",
		dopf: "𝕕",
		Dot: "¨",
		dot: "˙",
		DotDot: "⃜",
		doteq: "≐",
		doteqdot: "≑",
		DotEqual: "≐",
		dotminus: "∸",
		dotplus: "∔",
		dotsquare: "⊡",
		doublebarwedge: "⌆",
		DoubleContourIntegral: "∯",
		DoubleDot: "¨",
		DoubleDownArrow: "⇓",
		DoubleLeftArrow: "⇐",
		DoubleLeftRightArrow: "⇔",
		DoubleLeftTee: "⫤",
		DoubleLongLeftArrow: "⟸",
		DoubleLongLeftRightArrow: "⟺",
		DoubleLongRightArrow: "⟹",
		DoubleRightArrow: "⇒",
		DoubleRightTee: "⊨",
		DoubleUpArrow: "⇑",
		DoubleUpDownArrow: "⇕",
		DoubleVerticalBar: "∥",
		DownArrow: "↓",
		Downarrow: "⇓",
		downarrow: "↓",
		DownArrowBar: "⤓",
		DownArrowUpArrow: "⇵",
		DownBreve: "̑",
		downdownarrows: "⇊",
		downharpoonleft: "⇃",
		downharpoonright: "⇂",
		DownLeftRightVector: "⥐",
		DownLeftTeeVector: "⥞",
		DownLeftVector: "↽",
		DownLeftVectorBar: "⥖",
		DownRightTeeVector: "⥟",
		DownRightVector: "⇁",
		DownRightVectorBar: "⥗",
		DownTee: "⊤",
		DownTeeArrow: "↧",
		drbkarow: "⤐",
		drcorn: "⌟",
		drcrop: "⌌",
		Dscr: "𝒟",
		dscr: "𝒹",
		DScy: "Ѕ",
		dscy: "ѕ",
		dsol: "⧶",
		Dstrok: "Đ",
		dstrok: "đ",
		dtdot: "⋱",
		dtri: "▿",
		dtrif: "▾",
		duarr: "⇵",
		duhar: "⥯",
		dwangle: "⦦",
		DZcy: "Џ",
		dzcy: "џ",
		dzigrarr: "⟿",
		Eacute: "É",
		eacute: "é",
		easter: "⩮",
		Ecaron: "Ě",
		ecaron: "ě",
		ecir: "≖",
		Ecirc: "Ê",
		ecirc: "ê",
		ecolon: "≕",
		Ecy: "Э",
		ecy: "э",
		eDDot: "⩷",
		Edot: "Ė",
		eDot: "≑",
		edot: "ė",
		ee: "ⅇ",
		efDot: "≒",
		Efr: "𝔈",
		efr: "𝔢",
		eg: "⪚",
		Egrave: "È",
		egrave: "è",
		egs: "⪖",
		egsdot: "⪘",
		el: "⪙",
		Element: "∈",
		elinters: "⏧",
		ell: "ℓ",
		els: "⪕",
		elsdot: "⪗",
		Emacr: "Ē",
		emacr: "ē",
		empty: "∅",
		emptyset: "∅",
		EmptySmallSquare: "◻",
		emptyv: "∅",
		EmptyVerySmallSquare: "▫",
		emsp: " ",
		emsp13: " ",
		emsp14: " ",
		ENG: "Ŋ",
		eng: "ŋ",
		ensp: " ",
		Eogon: "Ę",
		eogon: "ę",
		Eopf: "𝔼",
		eopf: "𝕖",
		epar: "⋕",
		eparsl: "⧣",
		eplus: "⩱",
		epsi: "ε",
		Epsilon: "Ε",
		epsilon: "ε",
		epsiv: "ϵ",
		eqcirc: "≖",
		eqcolon: "≕",
		eqsim: "≂",
		eqslantgtr: "⪖",
		eqslantless: "⪕",
		Equal: "⩵",
		equals: "=",
		EqualTilde: "≂",
		equest: "≟",
		Equilibrium: "⇌",
		equiv: "≡",
		equivDD: "⩸",
		eqvparsl: "⧥",
		erarr: "⥱",
		erDot: "≓",
		Escr: "ℰ",
		escr: "ℯ",
		esdot: "≐",
		Esim: "⩳",
		esim: "≂",
		Eta: "Η",
		eta: "η",
		ETH: "Ð",
		eth: "ð",
		Euml: "Ë",
		euml: "ë",
		euro: "€",
		excl: "!",
		exist: "∃",
		Exists: "∃",
		expectation: "ℰ",
		ExponentialE: "ⅇ",
		exponentiale: "ⅇ",
		fallingdotseq: "≒",
		Fcy: "Ф",
		fcy: "ф",
		female: "♀",
		ffilig: "ﬃ",
		fflig: "ﬀ",
		ffllig: "ﬄ",
		Ffr: "𝔉",
		ffr: "𝔣",
		filig: "ﬁ",
		FilledSmallSquare: "◼",
		FilledVerySmallSquare: "▪",
		fjlig: "fj",
		flat: "♭",
		fllig: "ﬂ",
		fltns: "▱",
		fnof: "ƒ",
		Fopf: "𝔽",
		fopf: "𝕗",
		ForAll: "∀",
		forall: "∀",
		fork: "⋔",
		forkv: "⫙",
		Fouriertrf: "ℱ",
		fpartint: "⨍",
		frac12: "½",
		frac13: "⅓",
		frac14: "¼",
		frac15: "⅕",
		frac16: "⅙",
		frac18: "⅛",
		frac23: "⅔",
		frac25: "⅖",
		frac34: "¾",
		frac35: "⅗",
		frac38: "⅜",
		frac45: "⅘",
		frac56: "⅚",
		frac58: "⅝",
		frac78: "⅞",
		frasl: "⁄",
		frown: "⌢",
		Fscr: "ℱ",
		fscr: "𝒻",
		gacute: "ǵ",
		Gamma: "Γ",
		gamma: "γ",
		Gammad: "Ϝ",
		gammad: "ϝ",
		gap: "⪆",
		Gbreve: "Ğ",
		gbreve: "ğ",
		Gcedil: "Ģ",
		Gcirc: "Ĝ",
		gcirc: "ĝ",
		Gcy: "Г",
		gcy: "г",
		Gdot: "Ġ",
		gdot: "ġ",
		gE: "≧",
		ge: "≥",
		gEl: "⪌",
		gel: "⋛",
		geq: "≥",
		geqq: "≧",
		geqslant: "⩾",
		ges: "⩾",
		gescc: "⪩",
		gesdot: "⪀",
		gesdoto: "⪂",
		gesdotol: "⪄",
		gesl: "⋛︀",
		gesles: "⪔",
		Gfr: "𝔊",
		gfr: "𝔤",
		Gg: "⋙",
		gg: "≫",
		ggg: "⋙",
		gimel: "ℷ",
		GJcy: "Ѓ",
		gjcy: "ѓ",
		gl: "≷",
		gla: "⪥",
		glE: "⪒",
		glj: "⪤",
		gnap: "⪊",
		gnapprox: "⪊",
		gnE: "≩",
		gne: "⪈",
		gneq: "⪈",
		gneqq: "≩",
		gnsim: "⋧",
		Gopf: "𝔾",
		gopf: "𝕘",
		grave: "`",
		GreaterEqual: "≥",
		GreaterEqualLess: "⋛",
		GreaterFullEqual: "≧",
		GreaterGreater: "⪢",
		GreaterLess: "≷",
		GreaterSlantEqual: "⩾",
		GreaterTilde: "≳",
		Gscr: "𝒢",
		gscr: "ℊ",
		gsim: "≳",
		gsime: "⪎",
		gsiml: "⪐",
		Gt: "≫",
		GT: ">",
		gt: ">",
		gtcc: "⪧",
		gtcir: "⩺",
		gtdot: "⋗",
		gtlPar: "⦕",
		gtquest: "⩼",
		gtrapprox: "⪆",
		gtrarr: "⥸",
		gtrdot: "⋗",
		gtreqless: "⋛",
		gtreqqless: "⪌",
		gtrless: "≷",
		gtrsim: "≳",
		gvertneqq: "≩︀",
		gvnE: "≩︀",
		Hacek: "ˇ",
		hairsp: " ",
		half: "½",
		hamilt: "ℋ",
		HARDcy: "Ъ",
		hardcy: "ъ",
		hArr: "⇔",
		harr: "↔",
		harrcir: "⥈",
		harrw: "↭",
		Hat: "^",
		hbar: "ℏ",
		Hcirc: "Ĥ",
		hcirc: "ĥ",
		hearts: "♥",
		heartsuit: "♥",
		hellip: "…",
		hercon: "⊹",
		Hfr: "ℌ",
		hfr: "𝔥",
		HilbertSpace: "ℋ",
		hksearow: "⤥",
		hkswarow: "⤦",
		hoarr: "⇿",
		homtht: "∻",
		hookleftarrow: "↩",
		hookrightarrow: "↪",
		Hopf: "ℍ",
		hopf: "𝕙",
		horbar: "―",
		HorizontalLine: "─",
		Hscr: "ℋ",
		hscr: "𝒽",
		hslash: "ℏ",
		Hstrok: "Ħ",
		hstrok: "ħ",
		HumpDownHump: "≎",
		HumpEqual: "≏",
		hybull: "⁃",
		hyphen: "‐",
		Iacute: "Í",
		iacute: "í",
		ic: "⁣",
		Icirc: "Î",
		icirc: "î",
		Icy: "И",
		icy: "и",
		Idot: "İ",
		IEcy: "Е",
		iecy: "е",
		iexcl: "¡",
		iff: "⇔",
		Ifr: "ℑ",
		ifr: "𝔦",
		Igrave: "Ì",
		igrave: "ì",
		ii: "ⅈ",
		iiiint: "⨌",
		iiint: "∭",
		iinfin: "⧜",
		iiota: "℩",
		IJlig: "Ĳ",
		ijlig: "ĳ",
		Im: "ℑ",
		Imacr: "Ī",
		imacr: "ī",
		image: "ℑ",
		ImaginaryI: "ⅈ",
		imagline: "ℐ",
		imagpart: "ℑ",
		imath: "ı",
		imof: "⊷",
		imped: "Ƶ",
		Implies: "⇒",
		in: "∈",
		incare: "℅",
		infin: "∞",
		infintie: "⧝",
		inodot: "ı",
		Int: "∬",
		int: "∫",
		intcal: "⊺",
		integers: "ℤ",
		Integral: "∫",
		intercal: "⊺",
		Intersection: "⋂",
		intlarhk: "⨗",
		intprod: "⨼",
		InvisibleComma: "⁣",
		InvisibleTimes: "⁢",
		IOcy: "Ё",
		iocy: "ё",
		Iogon: "Į",
		iogon: "į",
		Iopf: "𝕀",
		iopf: "𝕚",
		Iota: "Ι",
		iota: "ι",
		iprod: "⨼",
		iquest: "¿",
		Iscr: "ℐ",
		iscr: "𝒾",
		isin: "∈",
		isindot: "⋵",
		isinE: "⋹",
		isins: "⋴",
		isinsv: "⋳",
		isinv: "∈",
		it: "⁢",
		Itilde: "Ĩ",
		itilde: "ĩ",
		Iukcy: "І",
		iukcy: "і",
		Iuml: "Ï",
		iuml: "ï",
		Jcirc: "Ĵ",
		jcirc: "ĵ",
		Jcy: "Й",
		jcy: "й",
		Jfr: "𝔍",
		jfr: "𝔧",
		jmath: "ȷ",
		Jopf: "𝕁",
		jopf: "𝕛",
		Jscr: "𝒥",
		jscr: "𝒿",
		Jsercy: "Ј",
		jsercy: "ј",
		Jukcy: "Є",
		jukcy: "є",
		Kappa: "Κ",
		kappa: "κ",
		kappav: "ϰ",
		Kcedil: "Ķ",
		kcedil: "ķ",
		Kcy: "К",
		kcy: "к",
		Kfr: "𝔎",
		kfr: "𝔨",
		kgreen: "ĸ",
		KHcy: "Х",
		khcy: "х",
		KJcy: "Ќ",
		kjcy: "ќ",
		Kopf: "𝕂",
		kopf: "𝕜",
		Kscr: "𝒦",
		kscr: "𝓀",
		lAarr: "⇚",
		Lacute: "Ĺ",
		lacute: "ĺ",
		laemptyv: "⦴",
		lagran: "ℒ",
		Lambda: "Λ",
		lambda: "λ",
		Lang: "⟪",
		lang: "⟨",
		langd: "⦑",
		langle: "⟨",
		lap: "⪅",
		Laplacetrf: "ℒ",
		laquo: "«",
		Larr: "↞",
		lArr: "⇐",
		larr: "←",
		larrb: "⇤",
		larrbfs: "⤟",
		larrfs: "⤝",
		larrhk: "↩",
		larrlp: "↫",
		larrpl: "⤹",
		larrsim: "⥳",
		larrtl: "↢",
		lat: "⪫",
		lAtail: "⤛",
		latail: "⤙",
		late: "⪭",
		lates: "⪭︀",
		lBarr: "⤎",
		lbarr: "⤌",
		lbbrk: "❲",
		lbrace: "{",
		lbrack: "[",
		lbrke: "⦋",
		lbrksld: "⦏",
		lbrkslu: "⦍",
		Lcaron: "Ľ",
		lcaron: "ľ",
		Lcedil: "Ļ",
		lcedil: "ļ",
		lceil: "⌈",
		lcub: "{",
		Lcy: "Л",
		lcy: "л",
		ldca: "⤶",
		ldquo: "“",
		ldquor: "„",
		ldrdhar: "⥧",
		ldrushar: "⥋",
		ldsh: "↲",
		lE: "≦",
		le: "≤",
		LeftAngleBracket: "⟨",
		LeftArrow: "←",
		Leftarrow: "⇐",
		leftarrow: "←",
		LeftArrowBar: "⇤",
		LeftArrowRightArrow: "⇆",
		leftarrowtail: "↢",
		LeftCeiling: "⌈",
		LeftDoubleBracket: "⟦",
		LeftDownTeeVector: "⥡",
		LeftDownVector: "⇃",
		LeftDownVectorBar: "⥙",
		LeftFloor: "⌊",
		leftharpoondown: "↽",
		leftharpoonup: "↼",
		leftleftarrows: "⇇",
		LeftRightArrow: "↔",
		Leftrightarrow: "⇔",
		leftrightarrow: "↔",
		leftrightarrows: "⇆",
		leftrightharpoons: "⇋",
		leftrightsquigarrow: "↭",
		LeftRightVector: "⥎",
		LeftTee: "⊣",
		LeftTeeArrow: "↤",
		LeftTeeVector: "⥚",
		leftthreetimes: "⋋",
		LeftTriangle: "⊲",
		LeftTriangleBar: "⧏",
		LeftTriangleEqual: "⊴",
		LeftUpDownVector: "⥑",
		LeftUpTeeVector: "⥠",
		LeftUpVector: "↿",
		LeftUpVectorBar: "⥘",
		LeftVector: "↼",
		LeftVectorBar: "⥒",
		lEg: "⪋",
		leg: "⋚",
		leq: "≤",
		leqq: "≦",
		leqslant: "⩽",
		les: "⩽",
		lescc: "⪨",
		lesdot: "⩿",
		lesdoto: "⪁",
		lesdotor: "⪃",
		lesg: "⋚︀",
		lesges: "⪓",
		lessapprox: "⪅",
		lessdot: "⋖",
		lesseqgtr: "⋚",
		lesseqqgtr: "⪋",
		LessEqualGreater: "⋚",
		LessFullEqual: "≦",
		LessGreater: "≶",
		lessgtr: "≶",
		LessLess: "⪡",
		lesssim: "≲",
		LessSlantEqual: "⩽",
		LessTilde: "≲",
		lfisht: "⥼",
		lfloor: "⌊",
		Lfr: "𝔏",
		lfr: "𝔩",
		lg: "≶",
		lgE: "⪑",
		lHar: "⥢",
		lhard: "↽",
		lharu: "↼",
		lharul: "⥪",
		lhblk: "▄",
		LJcy: "Љ",
		ljcy: "љ",
		Ll: "⋘",
		ll: "≪",
		llarr: "⇇",
		llcorner: "⌞",
		Lleftarrow: "⇚",
		llhard: "⥫",
		lltri: "◺",
		Lmidot: "Ŀ",
		lmidot: "ŀ",
		lmoust: "⎰",
		lmoustache: "⎰",
		lnap: "⪉",
		lnapprox: "⪉",
		lnE: "≨",
		lne: "⪇",
		lneq: "⪇",
		lneqq: "≨",
		lnsim: "⋦",
		loang: "⟬",
		loarr: "⇽",
		lobrk: "⟦",
		LongLeftArrow: "⟵",
		Longleftarrow: "⟸",
		longleftarrow: "⟵",
		LongLeftRightArrow: "⟷",
		Longleftrightarrow: "⟺",
		longleftrightarrow: "⟷",
		longmapsto: "⟼",
		LongRightArrow: "⟶",
		Longrightarrow: "⟹",
		longrightarrow: "⟶",
		looparrowleft: "↫",
		looparrowright: "↬",
		lopar: "⦅",
		Lopf: "𝕃",
		lopf: "𝕝",
		loplus: "⨭",
		lotimes: "⨴",
		lowast: "∗",
		lowbar: "_",
		LowerLeftArrow: "↙",
		LowerRightArrow: "↘",
		loz: "◊",
		lozenge: "◊",
		lozf: "⧫",
		lpar: "(",
		lparlt: "⦓",
		lrarr: "⇆",
		lrcorner: "⌟",
		lrhar: "⇋",
		lrhard: "⥭",
		lrm: "‎",
		lrtri: "⊿",
		lsaquo: "‹",
		Lscr: "ℒ",
		lscr: "𝓁",
		Lsh: "↰",
		lsh: "↰",
		lsim: "≲",
		lsime: "⪍",
		lsimg: "⪏",
		lsqb: "[",
		lsquo: "‘",
		lsquor: "‚",
		Lstrok: "Ł",
		lstrok: "ł",
		Lt: "≪",
		LT: "<",
		lt: "<",
		ltcc: "⪦",
		ltcir: "⩹",
		ltdot: "⋖",
		lthree: "⋋",
		ltimes: "⋉",
		ltlarr: "⥶",
		ltquest: "⩻",
		ltri: "◃",
		ltrie: "⊴",
		ltrif: "◂",
		ltrPar: "⦖",
		lurdshar: "⥊",
		luruhar: "⥦",
		lvertneqq: "≨︀",
		lvnE: "≨︀",
		macr: "¯",
		male: "♂",
		malt: "✠",
		maltese: "✠",
		Map: "⤅",
		map: "↦",
		mapsto: "↦",
		mapstodown: "↧",
		mapstoleft: "↤",
		mapstoup: "↥",
		marker: "▮",
		mcomma: "⨩",
		Mcy: "М",
		mcy: "м",
		mdash: "—",
		mDDot: "∺",
		measuredangle: "∡",
		MediumSpace: " ",
		Mellintrf: "ℳ",
		Mfr: "𝔐",
		mfr: "𝔪",
		mho: "℧",
		micro: "µ",
		mid: "∣",
		midast: "*",
		midcir: "⫰",
		middot: "·",
		minus: "−",
		minusb: "⊟",
		minusd: "∸",
		minusdu: "⨪",
		MinusPlus: "∓",
		mlcp: "⫛",
		mldr: "…",
		mnplus: "∓",
		models: "⊧",
		Mopf: "𝕄",
		mopf: "𝕞",
		mp: "∓",
		Mscr: "ℳ",
		mscr: "𝓂",
		mstpos: "∾",
		Mu: "Μ",
		mu: "μ",
		multimap: "⊸",
		mumap: "⊸",
		nabla: "∇",
		Nacute: "Ń",
		nacute: "ń",
		nang: "∠⃒",
		nap: "≉",
		napE: "⩰̸",
		napid: "≋̸",
		napos: "ŉ",
		napprox: "≉",
		natur: "♮",
		natural: "♮",
		naturals: "ℕ",
		nbsp: "\xA0",
		nbump: "≎̸",
		nbumpe: "≏̸",
		ncap: "⩃",
		Ncaron: "Ň",
		ncaron: "ň",
		Ncedil: "Ņ",
		ncedil: "ņ",
		ncong: "≇",
		ncongdot: "⩭̸",
		ncup: "⩂",
		Ncy: "Н",
		ncy: "н",
		ndash: "–",
		ne: "≠",
		nearhk: "⤤",
		neArr: "⇗",
		nearr: "↗",
		nearrow: "↗",
		nedot: "≐̸",
		NegativeMediumSpace: "​",
		NegativeThickSpace: "​",
		NegativeThinSpace: "​",
		NegativeVeryThinSpace: "​",
		nequiv: "≢",
		nesear: "⤨",
		nesim: "≂̸",
		NestedGreaterGreater: "≫",
		NestedLessLess: "≪",
		NewLine: "\n",
		nexist: "∄",
		nexists: "∄",
		Nfr: "𝔑",
		nfr: "𝔫",
		ngE: "≧̸",
		nge: "≱",
		ngeq: "≱",
		ngeqq: "≧̸",
		ngeqslant: "⩾̸",
		nges: "⩾̸",
		nGg: "⋙̸",
		ngsim: "≵",
		nGt: "≫⃒",
		ngt: "≯",
		ngtr: "≯",
		nGtv: "≫̸",
		nhArr: "⇎",
		nharr: "↮",
		nhpar: "⫲",
		ni: "∋",
		nis: "⋼",
		nisd: "⋺",
		niv: "∋",
		NJcy: "Њ",
		njcy: "њ",
		nlArr: "⇍",
		nlarr: "↚",
		nldr: "‥",
		nlE: "≦̸",
		nle: "≰",
		nLeftarrow: "⇍",
		nleftarrow: "↚",
		nLeftrightarrow: "⇎",
		nleftrightarrow: "↮",
		nleq: "≰",
		nleqq: "≦̸",
		nleqslant: "⩽̸",
		nles: "⩽̸",
		nless: "≮",
		nLl: "⋘̸",
		nlsim: "≴",
		nLt: "≪⃒",
		nlt: "≮",
		nltri: "⋪",
		nltrie: "⋬",
		nLtv: "≪̸",
		nmid: "∤",
		NoBreak: "⁠",
		NonBreakingSpace: "\xA0",
		Nopf: "ℕ",
		nopf: "𝕟",
		Not: "⫬",
		not: "¬",
		NotCongruent: "≢",
		NotCupCap: "≭",
		NotDoubleVerticalBar: "∦",
		NotElement: "∉",
		NotEqual: "≠",
		NotEqualTilde: "≂̸",
		NotExists: "∄",
		NotGreater: "≯",
		NotGreaterEqual: "≱",
		NotGreaterFullEqual: "≧̸",
		NotGreaterGreater: "≫̸",
		NotGreaterLess: "≹",
		NotGreaterSlantEqual: "⩾̸",
		NotGreaterTilde: "≵",
		NotHumpDownHump: "≎̸",
		NotHumpEqual: "≏̸",
		notin: "∉",
		notindot: "⋵̸",
		notinE: "⋹̸",
		notinva: "∉",
		notinvb: "⋷",
		notinvc: "⋶",
		NotLeftTriangle: "⋪",
		NotLeftTriangleBar: "⧏̸",
		NotLeftTriangleEqual: "⋬",
		NotLess: "≮",
		NotLessEqual: "≰",
		NotLessGreater: "≸",
		NotLessLess: "≪̸",
		NotLessSlantEqual: "⩽̸",
		NotLessTilde: "≴",
		NotNestedGreaterGreater: "⪢̸",
		NotNestedLessLess: "⪡̸",
		notni: "∌",
		notniva: "∌",
		notnivb: "⋾",
		notnivc: "⋽",
		NotPrecedes: "⊀",
		NotPrecedesEqual: "⪯̸",
		NotPrecedesSlantEqual: "⋠",
		NotReverseElement: "∌",
		NotRightTriangle: "⋫",
		NotRightTriangleBar: "⧐̸",
		NotRightTriangleEqual: "⋭",
		NotSquareSubset: "⊏̸",
		NotSquareSubsetEqual: "⋢",
		NotSquareSuperset: "⊐̸",
		NotSquareSupersetEqual: "⋣",
		NotSubset: "⊂⃒",
		NotSubsetEqual: "⊈",
		NotSucceeds: "⊁",
		NotSucceedsEqual: "⪰̸",
		NotSucceedsSlantEqual: "⋡",
		NotSucceedsTilde: "≿̸",
		NotSuperset: "⊃⃒",
		NotSupersetEqual: "⊉",
		NotTilde: "≁",
		NotTildeEqual: "≄",
		NotTildeFullEqual: "≇",
		NotTildeTilde: "≉",
		NotVerticalBar: "∤",
		npar: "∦",
		nparallel: "∦",
		nparsl: "⫽⃥",
		npart: "∂̸",
		npolint: "⨔",
		npr: "⊀",
		nprcue: "⋠",
		npre: "⪯̸",
		nprec: "⊀",
		npreceq: "⪯̸",
		nrArr: "⇏",
		nrarr: "↛",
		nrarrc: "⤳̸",
		nrarrw: "↝̸",
		nRightarrow: "⇏",
		nrightarrow: "↛",
		nrtri: "⋫",
		nrtrie: "⋭",
		nsc: "⊁",
		nsccue: "⋡",
		nsce: "⪰̸",
		Nscr: "𝒩",
		nscr: "𝓃",
		nshortmid: "∤",
		nshortparallel: "∦",
		nsim: "≁",
		nsime: "≄",
		nsimeq: "≄",
		nsmid: "∤",
		nspar: "∦",
		nsqsube: "⋢",
		nsqsupe: "⋣",
		nsub: "⊄",
		nsubE: "⫅̸",
		nsube: "⊈",
		nsubset: "⊂⃒",
		nsubseteq: "⊈",
		nsubseteqq: "⫅̸",
		nsucc: "⊁",
		nsucceq: "⪰̸",
		nsup: "⊅",
		nsupE: "⫆̸",
		nsupe: "⊉",
		nsupset: "⊃⃒",
		nsupseteq: "⊉",
		nsupseteqq: "⫆̸",
		ntgl: "≹",
		Ntilde: "Ñ",
		ntilde: "ñ",
		ntlg: "≸",
		ntriangleleft: "⋪",
		ntrianglelefteq: "⋬",
		ntriangleright: "⋫",
		ntrianglerighteq: "⋭",
		Nu: "Ν",
		nu: "ν",
		num: "#",
		numero: "№",
		numsp: " ",
		nvap: "≍⃒",
		nVDash: "⊯",
		nVdash: "⊮",
		nvDash: "⊭",
		nvdash: "⊬",
		nvge: "≥⃒",
		nvgt: ">⃒",
		nvHarr: "⤄",
		nvinfin: "⧞",
		nvlArr: "⤂",
		nvle: "≤⃒",
		nvlt: "<⃒",
		nvltrie: "⊴⃒",
		nvrArr: "⤃",
		nvrtrie: "⊵⃒",
		nvsim: "∼⃒",
		nwarhk: "⤣",
		nwArr: "⇖",
		nwarr: "↖",
		nwarrow: "↖",
		nwnear: "⤧",
		Oacute: "Ó",
		oacute: "ó",
		oast: "⊛",
		ocir: "⊚",
		Ocirc: "Ô",
		ocirc: "ô",
		Ocy: "О",
		ocy: "о",
		odash: "⊝",
		Odblac: "Ő",
		odblac: "ő",
		odiv: "⨸",
		odot: "⊙",
		odsold: "⦼",
		OElig: "Œ",
		oelig: "œ",
		ofcir: "⦿",
		Ofr: "𝔒",
		ofr: "𝔬",
		ogon: "˛",
		Ograve: "Ò",
		ograve: "ò",
		ogt: "⧁",
		ohbar: "⦵",
		ohm: "Ω",
		oint: "∮",
		olarr: "↺",
		olcir: "⦾",
		olcross: "⦻",
		oline: "‾",
		olt: "⧀",
		Omacr: "Ō",
		omacr: "ō",
		Omega: "Ω",
		omega: "ω",
		Omicron: "Ο",
		omicron: "ο",
		omid: "⦶",
		ominus: "⊖",
		Oopf: "𝕆",
		oopf: "𝕠",
		opar: "⦷",
		OpenCurlyDoubleQuote: "“",
		OpenCurlyQuote: "‘",
		operp: "⦹",
		oplus: "⊕",
		Or: "⩔",
		or: "∨",
		orarr: "↻",
		ord: "⩝",
		order: "ℴ",
		orderof: "ℴ",
		ordf: "ª",
		ordm: "º",
		origof: "⊶",
		oror: "⩖",
		orslope: "⩗",
		orv: "⩛",
		oS: "Ⓢ",
		Oscr: "𝒪",
		oscr: "ℴ",
		Oslash: "Ø",
		oslash: "ø",
		osol: "⊘",
		Otilde: "Õ",
		otilde: "õ",
		Otimes: "⨷",
		otimes: "⊗",
		otimesas: "⨶",
		Ouml: "Ö",
		ouml: "ö",
		ovbar: "⌽",
		OverBar: "‾",
		OverBrace: "⏞",
		OverBracket: "⎴",
		OverParenthesis: "⏜",
		par: "∥",
		para: "¶",
		parallel: "∥",
		parsim: "⫳",
		parsl: "⫽",
		part: "∂",
		PartialD: "∂",
		Pcy: "П",
		pcy: "п",
		percnt: "%",
		period: ".",
		permil: "‰",
		perp: "⊥",
		pertenk: "‱",
		Pfr: "𝔓",
		pfr: "𝔭",
		Phi: "Φ",
		phi: "φ",
		phiv: "ϕ",
		phmmat: "ℳ",
		phone: "☎",
		Pi: "Π",
		pi: "π",
		pitchfork: "⋔",
		piv: "ϖ",
		planck: "ℏ",
		planckh: "ℎ",
		plankv: "ℏ",
		plus: "+",
		plusacir: "⨣",
		plusb: "⊞",
		pluscir: "⨢",
		plusdo: "∔",
		plusdu: "⨥",
		pluse: "⩲",
		PlusMinus: "±",
		plusmn: "±",
		plussim: "⨦",
		plustwo: "⨧",
		pm: "±",
		Poincareplane: "ℌ",
		pointint: "⨕",
		Popf: "ℙ",
		popf: "𝕡",
		pound: "£",
		Pr: "⪻",
		pr: "≺",
		prap: "⪷",
		prcue: "≼",
		prE: "⪳",
		pre: "⪯",
		prec: "≺",
		precapprox: "⪷",
		preccurlyeq: "≼",
		Precedes: "≺",
		PrecedesEqual: "⪯",
		PrecedesSlantEqual: "≼",
		PrecedesTilde: "≾",
		preceq: "⪯",
		precnapprox: "⪹",
		precneqq: "⪵",
		precnsim: "⋨",
		precsim: "≾",
		Prime: "″",
		prime: "′",
		primes: "ℙ",
		prnap: "⪹",
		prnE: "⪵",
		prnsim: "⋨",
		prod: "∏",
		Product: "∏",
		profalar: "⌮",
		profline: "⌒",
		profsurf: "⌓",
		prop: "∝",
		Proportion: "∷",
		Proportional: "∝",
		propto: "∝",
		prsim: "≾",
		prurel: "⊰",
		Pscr: "𝒫",
		pscr: "𝓅",
		Psi: "Ψ",
		psi: "ψ",
		puncsp: " ",
		Qfr: "𝔔",
		qfr: "𝔮",
		qint: "⨌",
		Qopf: "ℚ",
		qopf: "𝕢",
		qprime: "⁗",
		Qscr: "𝒬",
		qscr: "𝓆",
		quaternions: "ℍ",
		quatint: "⨖",
		quest: "?",
		questeq: "≟",
		QUOT: "\"",
		quot: "\"",
		rAarr: "⇛",
		race: "∽̱",
		Racute: "Ŕ",
		racute: "ŕ",
		radic: "√",
		raemptyv: "⦳",
		Rang: "⟫",
		rang: "⟩",
		rangd: "⦒",
		range: "⦥",
		rangle: "⟩",
		raquo: "»",
		Rarr: "↠",
		rArr: "⇒",
		rarr: "→",
		rarrap: "⥵",
		rarrb: "⇥",
		rarrbfs: "⤠",
		rarrc: "⤳",
		rarrfs: "⤞",
		rarrhk: "↪",
		rarrlp: "↬",
		rarrpl: "⥅",
		rarrsim: "⥴",
		Rarrtl: "⤖",
		rarrtl: "↣",
		rarrw: "↝",
		rAtail: "⤜",
		ratail: "⤚",
		ratio: "∶",
		rationals: "ℚ",
		RBarr: "⤐",
		rBarr: "⤏",
		rbarr: "⤍",
		rbbrk: "❳",
		rbrace: "}",
		rbrack: "]",
		rbrke: "⦌",
		rbrksld: "⦎",
		rbrkslu: "⦐",
		Rcaron: "Ř",
		rcaron: "ř",
		Rcedil: "Ŗ",
		rcedil: "ŗ",
		rceil: "⌉",
		rcub: "}",
		Rcy: "Р",
		rcy: "р",
		rdca: "⤷",
		rdldhar: "⥩",
		rdquo: "”",
		rdquor: "”",
		rdsh: "↳",
		Re: "ℜ",
		real: "ℜ",
		realine: "ℛ",
		realpart: "ℜ",
		reals: "ℝ",
		rect: "▭",
		REG: "®",
		reg: "®",
		ReverseElement: "∋",
		ReverseEquilibrium: "⇋",
		ReverseUpEquilibrium: "⥯",
		rfisht: "⥽",
		rfloor: "⌋",
		Rfr: "ℜ",
		rfr: "𝔯",
		rHar: "⥤",
		rhard: "⇁",
		rharu: "⇀",
		rharul: "⥬",
		Rho: "Ρ",
		rho: "ρ",
		rhov: "ϱ",
		RightAngleBracket: "⟩",
		RightArrow: "→",
		Rightarrow: "⇒",
		rightarrow: "→",
		RightArrowBar: "⇥",
		RightArrowLeftArrow: "⇄",
		rightarrowtail: "↣",
		RightCeiling: "⌉",
		RightDoubleBracket: "⟧",
		RightDownTeeVector: "⥝",
		RightDownVector: "⇂",
		RightDownVectorBar: "⥕",
		RightFloor: "⌋",
		rightharpoondown: "⇁",
		rightharpoonup: "⇀",
		rightleftarrows: "⇄",
		rightleftharpoons: "⇌",
		rightrightarrows: "⇉",
		rightsquigarrow: "↝",
		RightTee: "⊢",
		RightTeeArrow: "↦",
		RightTeeVector: "⥛",
		rightthreetimes: "⋌",
		RightTriangle: "⊳",
		RightTriangleBar: "⧐",
		RightTriangleEqual: "⊵",
		RightUpDownVector: "⥏",
		RightUpTeeVector: "⥜",
		RightUpVector: "↾",
		RightUpVectorBar: "⥔",
		RightVector: "⇀",
		RightVectorBar: "⥓",
		ring: "˚",
		risingdotseq: "≓",
		rlarr: "⇄",
		rlhar: "⇌",
		rlm: "‏",
		rmoust: "⎱",
		rmoustache: "⎱",
		rnmid: "⫮",
		roang: "⟭",
		roarr: "⇾",
		robrk: "⟧",
		ropar: "⦆",
		Ropf: "ℝ",
		ropf: "𝕣",
		roplus: "⨮",
		rotimes: "⨵",
		RoundImplies: "⥰",
		rpar: ")",
		rpargt: "⦔",
		rppolint: "⨒",
		rrarr: "⇉",
		Rrightarrow: "⇛",
		rsaquo: "›",
		Rscr: "ℛ",
		rscr: "𝓇",
		Rsh: "↱",
		rsh: "↱",
		rsqb: "]",
		rsquo: "’",
		rsquor: "’",
		rthree: "⋌",
		rtimes: "⋊",
		rtri: "▹",
		rtrie: "⊵",
		rtrif: "▸",
		rtriltri: "⧎",
		RuleDelayed: "⧴",
		ruluhar: "⥨",
		rx: "℞",
		Sacute: "Ś",
		sacute: "ś",
		sbquo: "‚",
		Sc: "⪼",
		sc: "≻",
		scap: "⪸",
		Scaron: "Š",
		scaron: "š",
		sccue: "≽",
		scE: "⪴",
		sce: "⪰",
		Scedil: "Ş",
		scedil: "ş",
		Scirc: "Ŝ",
		scirc: "ŝ",
		scnap: "⪺",
		scnE: "⪶",
		scnsim: "⋩",
		scpolint: "⨓",
		scsim: "≿",
		Scy: "С",
		scy: "с",
		sdot: "⋅",
		sdotb: "⊡",
		sdote: "⩦",
		searhk: "⤥",
		seArr: "⇘",
		searr: "↘",
		searrow: "↘",
		sect: "§",
		semi: ";",
		seswar: "⤩",
		setminus: "∖",
		setmn: "∖",
		sext: "✶",
		Sfr: "𝔖",
		sfr: "𝔰",
		sfrown: "⌢",
		sharp: "♯",
		SHCHcy: "Щ",
		shchcy: "щ",
		SHcy: "Ш",
		shcy: "ш",
		ShortDownArrow: "↓",
		ShortLeftArrow: "←",
		shortmid: "∣",
		shortparallel: "∥",
		ShortRightArrow: "→",
		ShortUpArrow: "↑",
		shy: "­",
		Sigma: "Σ",
		sigma: "σ",
		sigmaf: "ς",
		sigmav: "ς",
		sim: "∼",
		simdot: "⩪",
		sime: "≃",
		simeq: "≃",
		simg: "⪞",
		simgE: "⪠",
		siml: "⪝",
		simlE: "⪟",
		simne: "≆",
		simplus: "⨤",
		simrarr: "⥲",
		slarr: "←",
		SmallCircle: "∘",
		smallsetminus: "∖",
		smashp: "⨳",
		smeparsl: "⧤",
		smid: "∣",
		smile: "⌣",
		smt: "⪪",
		smte: "⪬",
		smtes: "⪬︀",
		SOFTcy: "Ь",
		softcy: "ь",
		sol: "/",
		solb: "⧄",
		solbar: "⌿",
		Sopf: "𝕊",
		sopf: "𝕤",
		spades: "♠",
		spadesuit: "♠",
		spar: "∥",
		sqcap: "⊓",
		sqcaps: "⊓︀",
		sqcup: "⊔",
		sqcups: "⊔︀",
		Sqrt: "√",
		sqsub: "⊏",
		sqsube: "⊑",
		sqsubset: "⊏",
		sqsubseteq: "⊑",
		sqsup: "⊐",
		sqsupe: "⊒",
		sqsupset: "⊐",
		sqsupseteq: "⊒",
		squ: "□",
		Square: "□",
		square: "□",
		SquareIntersection: "⊓",
		SquareSubset: "⊏",
		SquareSubsetEqual: "⊑",
		SquareSuperset: "⊐",
		SquareSupersetEqual: "⊒",
		SquareUnion: "⊔",
		squarf: "▪",
		squf: "▪",
		srarr: "→",
		Sscr: "𝒮",
		sscr: "𝓈",
		ssetmn: "∖",
		ssmile: "⌣",
		sstarf: "⋆",
		Star: "⋆",
		star: "☆",
		starf: "★",
		straightepsilon: "ϵ",
		straightphi: "ϕ",
		strns: "¯",
		Sub: "⋐",
		sub: "⊂",
		subdot: "⪽",
		subE: "⫅",
		sube: "⊆",
		subedot: "⫃",
		submult: "⫁",
		subnE: "⫋",
		subne: "⊊",
		subplus: "⪿",
		subrarr: "⥹",
		Subset: "⋐",
		subset: "⊂",
		subseteq: "⊆",
		subseteqq: "⫅",
		SubsetEqual: "⊆",
		subsetneq: "⊊",
		subsetneqq: "⫋",
		subsim: "⫇",
		subsub: "⫕",
		subsup: "⫓",
		succ: "≻",
		succapprox: "⪸",
		succcurlyeq: "≽",
		Succeeds: "≻",
		SucceedsEqual: "⪰",
		SucceedsSlantEqual: "≽",
		SucceedsTilde: "≿",
		succeq: "⪰",
		succnapprox: "⪺",
		succneqq: "⪶",
		succnsim: "⋩",
		succsim: "≿",
		SuchThat: "∋",
		Sum: "∑",
		sum: "∑",
		sung: "♪",
		Sup: "⋑",
		sup: "⊃",
		sup1: "¹",
		sup2: "²",
		sup3: "³",
		supdot: "⪾",
		supdsub: "⫘",
		supE: "⫆",
		supe: "⊇",
		supedot: "⫄",
		Superset: "⊃",
		SupersetEqual: "⊇",
		suphsol: "⟉",
		suphsub: "⫗",
		suplarr: "⥻",
		supmult: "⫂",
		supnE: "⫌",
		supne: "⊋",
		supplus: "⫀",
		Supset: "⋑",
		supset: "⊃",
		supseteq: "⊇",
		supseteqq: "⫆",
		supsetneq: "⊋",
		supsetneqq: "⫌",
		supsim: "⫈",
		supsub: "⫔",
		supsup: "⫖",
		swarhk: "⤦",
		swArr: "⇙",
		swarr: "↙",
		swarrow: "↙",
		swnwar: "⤪",
		szlig: "ß",
		Tab: "	",
		target: "⌖",
		Tau: "Τ",
		tau: "τ",
		tbrk: "⎴",
		Tcaron: "Ť",
		tcaron: "ť",
		Tcedil: "Ţ",
		tcedil: "ţ",
		Tcy: "Т",
		tcy: "т",
		tdot: "⃛",
		telrec: "⌕",
		Tfr: "𝔗",
		tfr: "𝔱",
		there4: "∴",
		Therefore: "∴",
		therefore: "∴",
		Theta: "Θ",
		theta: "θ",
		thetasym: "ϑ",
		thetav: "ϑ",
		thickapprox: "≈",
		thicksim: "∼",
		ThickSpace: "  ",
		thinsp: " ",
		ThinSpace: " ",
		thkap: "≈",
		thksim: "∼",
		THORN: "Þ",
		thorn: "þ",
		Tilde: "∼",
		tilde: "˜",
		TildeEqual: "≃",
		TildeFullEqual: "≅",
		TildeTilde: "≈",
		times: "×",
		timesb: "⊠",
		timesbar: "⨱",
		timesd: "⨰",
		tint: "∭",
		toea: "⤨",
		top: "⊤",
		topbot: "⌶",
		topcir: "⫱",
		Topf: "𝕋",
		topf: "𝕥",
		topfork: "⫚",
		tosa: "⤩",
		tprime: "‴",
		TRADE: "™",
		trade: "™",
		triangle: "▵",
		triangledown: "▿",
		triangleleft: "◃",
		trianglelefteq: "⊴",
		triangleq: "≜",
		triangleright: "▹",
		trianglerighteq: "⊵",
		tridot: "◬",
		trie: "≜",
		triminus: "⨺",
		TripleDot: "⃛",
		triplus: "⨹",
		trisb: "⧍",
		tritime: "⨻",
		trpezium: "⏢",
		Tscr: "𝒯",
		tscr: "𝓉",
		TScy: "Ц",
		tscy: "ц",
		TSHcy: "Ћ",
		tshcy: "ћ",
		Tstrok: "Ŧ",
		tstrok: "ŧ",
		twixt: "≬",
		twoheadleftarrow: "↞",
		twoheadrightarrow: "↠",
		Uacute: "Ú",
		uacute: "ú",
		Uarr: "↟",
		uArr: "⇑",
		uarr: "↑",
		Uarrocir: "⥉",
		Ubrcy: "Ў",
		ubrcy: "ў",
		Ubreve: "Ŭ",
		ubreve: "ŭ",
		Ucirc: "Û",
		ucirc: "û",
		Ucy: "У",
		ucy: "у",
		udarr: "⇅",
		Udblac: "Ű",
		udblac: "ű",
		udhar: "⥮",
		ufisht: "⥾",
		Ufr: "𝔘",
		ufr: "𝔲",
		Ugrave: "Ù",
		ugrave: "ù",
		uHar: "⥣",
		uharl: "↿",
		uharr: "↾",
		uhblk: "▀",
		ulcorn: "⌜",
		ulcorner: "⌜",
		ulcrop: "⌏",
		ultri: "◸",
		Umacr: "Ū",
		umacr: "ū",
		uml: "¨",
		UnderBar: "_",
		UnderBrace: "⏟",
		UnderBracket: "⎵",
		UnderParenthesis: "⏝",
		Union: "⋃",
		UnionPlus: "⊎",
		Uogon: "Ų",
		uogon: "ų",
		Uopf: "𝕌",
		uopf: "𝕦",
		UpArrow: "↑",
		Uparrow: "⇑",
		uparrow: "↑",
		UpArrowBar: "⤒",
		UpArrowDownArrow: "⇅",
		UpDownArrow: "↕",
		Updownarrow: "⇕",
		updownarrow: "↕",
		UpEquilibrium: "⥮",
		upharpoonleft: "↿",
		upharpoonright: "↾",
		uplus: "⊎",
		UpperLeftArrow: "↖",
		UpperRightArrow: "↗",
		Upsi: "ϒ",
		upsi: "υ",
		upsih: "ϒ",
		Upsilon: "Υ",
		upsilon: "υ",
		UpTee: "⊥",
		UpTeeArrow: "↥",
		upuparrows: "⇈",
		urcorn: "⌝",
		urcorner: "⌝",
		urcrop: "⌎",
		Uring: "Ů",
		uring: "ů",
		urtri: "◹",
		Uscr: "𝒰",
		uscr: "𝓊",
		utdot: "⋰",
		Utilde: "Ũ",
		utilde: "ũ",
		utri: "▵",
		utrif: "▴",
		uuarr: "⇈",
		Uuml: "Ü",
		uuml: "ü",
		uwangle: "⦧",
		vangrt: "⦜",
		varepsilon: "ϵ",
		varkappa: "ϰ",
		varnothing: "∅",
		varphi: "ϕ",
		varpi: "ϖ",
		varpropto: "∝",
		vArr: "⇕",
		varr: "↕",
		varrho: "ϱ",
		varsigma: "ς",
		varsubsetneq: "⊊︀",
		varsubsetneqq: "⫋︀",
		varsupsetneq: "⊋︀",
		varsupsetneqq: "⫌︀",
		vartheta: "ϑ",
		vartriangleleft: "⊲",
		vartriangleright: "⊳",
		Vbar: "⫫",
		vBar: "⫨",
		vBarv: "⫩",
		Vcy: "В",
		vcy: "в",
		VDash: "⊫",
		Vdash: "⊩",
		vDash: "⊨",
		vdash: "⊢",
		Vdashl: "⫦",
		Vee: "⋁",
		vee: "∨",
		veebar: "⊻",
		veeeq: "≚",
		vellip: "⋮",
		Verbar: "‖",
		verbar: "|",
		Vert: "‖",
		vert: "|",
		VerticalBar: "∣",
		VerticalLine: "|",
		VerticalSeparator: "❘",
		VerticalTilde: "≀",
		VeryThinSpace: " ",
		Vfr: "𝔙",
		vfr: "𝔳",
		vltri: "⊲",
		vnsub: "⊂⃒",
		vnsup: "⊃⃒",
		Vopf: "𝕍",
		vopf: "𝕧",
		vprop: "∝",
		vrtri: "⊳",
		Vscr: "𝒱",
		vscr: "𝓋",
		vsubnE: "⫋︀",
		vsubne: "⊊︀",
		vsupnE: "⫌︀",
		vsupne: "⊋︀",
		Vvdash: "⊪",
		vzigzag: "⦚",
		Wcirc: "Ŵ",
		wcirc: "ŵ",
		wedbar: "⩟",
		Wedge: "⋀",
		wedge: "∧",
		wedgeq: "≙",
		weierp: "℘",
		Wfr: "𝔚",
		wfr: "𝔴",
		Wopf: "𝕎",
		wopf: "𝕨",
		wp: "℘",
		wr: "≀",
		wreath: "≀",
		Wscr: "𝒲",
		wscr: "𝓌",
		xcap: "⋂",
		xcirc: "◯",
		xcup: "⋃",
		xdtri: "▽",
		Xfr: "𝔛",
		xfr: "𝔵",
		xhArr: "⟺",
		xharr: "⟷",
		Xi: "Ξ",
		xi: "ξ",
		xlArr: "⟸",
		xlarr: "⟵",
		xmap: "⟼",
		xnis: "⋻",
		xodot: "⨀",
		Xopf: "𝕏",
		xopf: "𝕩",
		xoplus: "⨁",
		xotime: "⨂",
		xrArr: "⟹",
		xrarr: "⟶",
		Xscr: "𝒳",
		xscr: "𝓍",
		xsqcup: "⨆",
		xuplus: "⨄",
		xutri: "△",
		xvee: "⋁",
		xwedge: "⋀",
		Yacute: "Ý",
		yacute: "ý",
		YAcy: "Я",
		yacy: "я",
		Ycirc: "Ŷ",
		ycirc: "ŷ",
		Ycy: "Ы",
		ycy: "ы",
		yen: "¥",
		Yfr: "𝔜",
		yfr: "𝔶",
		YIcy: "Ї",
		yicy: "ї",
		Yopf: "𝕐",
		yopf: "𝕪",
		Yscr: "𝒴",
		yscr: "𝓎",
		YUcy: "Ю",
		yucy: "ю",
		Yuml: "Ÿ",
		yuml: "ÿ",
		Zacute: "Ź",
		zacute: "ź",
		Zcaron: "Ž",
		zcaron: "ž",
		Zcy: "З",
		zcy: "з",
		Zdot: "Ż",
		zdot: "ż",
		zeetrf: "ℨ",
		ZeroWidthSpace: "​",
		Zeta: "Ζ",
		zeta: "ζ",
		Zfr: "ℨ",
		zfr: "𝔷",
		ZHcy: "Ж",
		zhcy: "ж",
		zigrarr: "⇝",
		Zopf: "ℤ",
		zopf: "𝕫",
		Zscr: "𝒵",
		zscr: "𝓏",
		zwj: "‍",
		zwnj: "‌"
	});
	exports.entityMap = exports.HTML_ENTITIES;
} });
var require_sax = __commonJS({ "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/sax.js"(exports) {
	"use strict";
	var conventions = require_conventions();
	var g = require_grammar();
	var errors = require_errors();
	var isHTMLEscapableRawTextElement = conventions.isHTMLEscapableRawTextElement;
	var isHTMLMimeType = conventions.isHTMLMimeType;
	var isHTMLRawTextElement = conventions.isHTMLRawTextElement;
	var hasOwn = conventions.hasOwn;
	var NAMESPACE = conventions.NAMESPACE;
	var ParseError = errors.ParseError;
	var DOMException = errors.DOMException;
	var S_TAG = 0;
	var S_ATTR = 1;
	var S_ATTR_SPACE = 2;
	var S_EQ = 3;
	var S_ATTR_NOQUOT_VALUE = 4;
	var S_ATTR_END = 5;
	var S_TAG_SPACE = 6;
	var S_TAG_CLOSE = 7;
	function XMLReader() {}
	XMLReader.prototype = { parse: function(source, defaultNSMap, entityMap) {
		var domBuilder = this.domBuilder;
		domBuilder.startDocument();
		_copy(defaultNSMap, defaultNSMap = /* @__PURE__ */ Object.create(null));
		parse(source, defaultNSMap, entityMap, domBuilder, this.errorHandler);
		domBuilder.endDocument();
	} };
	var ENTITY_REG = /&#?\w+;?/g;
	function parse(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
		var isHTML = isHTMLMimeType(domBuilder.mimeType);
		if (source.indexOf(g.UNICODE_REPLACEMENT_CHARACTER) >= 0) errorHandler.warning("Unicode replacement character detected, source encoding issues?");
		function fixedFromCharCode(code) {
			if (code > 65535) {
				code -= 65536;
				var surrogate1 = 55296 + (code >> 10), surrogate2 = 56320 + (code & 1023);
				return String.fromCharCode(surrogate1, surrogate2);
			} else return String.fromCharCode(code);
		}
		function entityReplacer(a2) {
			var complete = a2[a2.length - 1] === ";" ? a2 : a2 + ";";
			if (!isHTML && complete !== a2) {
				errorHandler.error("EntityRef: expecting ;");
				return a2;
			}
			var match = g.Reference.exec(complete);
			if (!match || match[0].length !== complete.length) {
				errorHandler.error("entity not matching Reference production: " + a2);
				return a2;
			}
			var k = complete.slice(1, -1);
			if (hasOwn(entityMap, k)) return entityMap[k];
			else if (k.charAt(0) === "#") return fixedFromCharCode(parseInt(k.substring(1).replace("x", "0x")));
			else {
				errorHandler.error("entity not found:" + a2);
				return a2;
			}
		}
		function appendText(end2) {
			if (end2 > start) {
				var xt = source.substring(start, end2).replace(ENTITY_REG, entityReplacer);
				locator && position(start);
				domBuilder.characters(xt, 0, end2 - start);
				start = end2;
			}
		}
		var lineStart = 0;
		var lineEnd = 0;
		var linePattern = /\r\n?|\n|$/g;
		var locator = domBuilder.locator;
		function position(p, m) {
			while (p >= lineEnd && (m = linePattern.exec(source))) {
				lineStart = lineEnd;
				lineEnd = m.index + m[0].length;
				locator.lineNumber++;
			}
			locator.columnNumber = p - lineStart + 1;
		}
		var parseStack = [{ currentNSMap: defaultNSMapCopy }];
		var unclosedTags = [];
		var start = 0;
		while (true) {
			try {
				var tagStart = source.indexOf("<", start);
				if (tagStart < 0) {
					if (!isHTML && unclosedTags.length > 0) return errorHandler.fatalError("unclosed xml tag(s): " + unclosedTags.join(", "));
					if (!source.substring(start).match(/^\s*$/)) {
						var doc = domBuilder.doc;
						var text = doc.createTextNode(source.substring(start));
						if (doc.documentElement) return errorHandler.error("Extra content at the end of the document");
						doc.appendChild(text);
						domBuilder.currentElement = text;
					}
					return;
				}
				if (tagStart > start) {
					var fromSource = source.substring(start, tagStart);
					if (!isHTML && unclosedTags.length === 0) {
						fromSource = fromSource.replace(new RegExp(g.S_OPT.source, "g"), "");
						fromSource && errorHandler.error("Unexpected content outside root element: '" + fromSource + "'");
					}
					appendText(tagStart);
				}
				switch (source.charAt(tagStart + 1)) {
					case "/":
						var end = source.indexOf(">", tagStart + 2);
						var tagNameRaw = source.substring(tagStart + 2, end > 0 ? end : void 0);
						if (!tagNameRaw) return errorHandler.fatalError("end tag name missing");
						var endTagNameStrict = g.reg("^", g.QName_group, g.S_OPT, "$");
						var tagNameMatch = end > 0 && endTagNameStrict.exec(tagNameRaw);
						if (!tagNameMatch) {
							var leadingTagNameMatch = end > 0 && g.reg("^", g.QName_group).exec(tagNameRaw);
							if (isHTML && leadingTagNameMatch) {
								errorHandler.warning("end tag name contains invalid trailing characters: \"" + tagNameRaw + "\"");
								tagNameMatch = leadingTagNameMatch;
							} else if (leadingTagNameMatch && new RegExp(endTagNameStrict.source, endTagNameStrict.flags + "m").test(tagNameRaw)) {
								errorHandler.error("end tag name is followed by a line break and trailing content: \"" + tagNameRaw + "\"");
								tagNameMatch = leadingTagNameMatch;
							} else return errorHandler.fatalError("end tag name contains invalid characters: \"" + tagNameRaw + "\"");
						}
						if (!domBuilder.currentElement && !domBuilder.doc.documentElement) return;
						var currentTagName = unclosedTags[unclosedTags.length - 1] || domBuilder.currentElement.tagName || domBuilder.doc.documentElement.tagName || "";
						if (currentTagName !== tagNameMatch[1]) {
							var tagNameLower = tagNameMatch[1].toLowerCase();
							if (!isHTML || currentTagName.toLowerCase() !== tagNameLower) return errorHandler.fatalError("Opening and ending tag mismatch: \"" + currentTagName + "\" != \"" + tagNameRaw + "\"");
						}
						var config = parseStack.pop();
						unclosedTags.pop();
						var localNSMap = config.localNSMap;
						domBuilder.endElement(config.uri, config.localName, currentTagName);
						if (localNSMap) {
							for (var prefix in localNSMap) if (hasOwn(localNSMap, prefix)) domBuilder.endPrefixMapping(prefix);
						}
						end++;
						break;
					case "?":
						locator && position(tagStart);
						end = parseProcessingInstruction(source, tagStart, domBuilder, errorHandler);
						break;
					case "!":
						locator && position(tagStart);
						end = parseDoctypeCommentOrCData(source, tagStart, domBuilder, errorHandler, isHTML);
						break;
					default:
						locator && position(tagStart);
						var el = new ElementAttributes();
						var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
						var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler, isHTML);
						var len = el.length;
						if (!el.closed) if (isHTML && conventions.isHTMLVoidElement(el.tagName)) el.closed = true;
						else unclosedTags.push(el.tagName);
						if (locator && len) {
							var locator2 = copyLocator(locator, {});
							for (var i = 0; i < len; i++) {
								var a = el[i];
								position(a.offset);
								a.locator = copyLocator(locator, {});
							}
							domBuilder.locator = locator2;
							if (appendElement(el, domBuilder, currentNSMap)) parseStack.push(el);
							domBuilder.locator = locator;
						} else if (appendElement(el, domBuilder, currentNSMap)) parseStack.push(el);
						if (isHTML && !el.closed) end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
						else end++;
				}
			} catch (e) {
				if (e instanceof ParseError) throw e;
				else if (e instanceof DOMException) return errorHandler.fatalError("Error constructing the DOM: " + e.name + ": " + e.message, e);
				errorHandler.error("element parse error: " + e);
				end = -1;
			}
			if (end > start) start = end;
			else appendText(Math.max(tagStart, start) + 1);
		}
	}
	function copyLocator(f, t) {
		t.lineNumber = f.lineNumber;
		t.columnNumber = f.columnNumber;
		return t;
	}
	function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler, isHTML) {
		function addAttribute(qname, value2, startIndex) {
			if (hasOwn(el.attributeNames, qname)) return errorHandler.fatalError("Attribute " + qname + " redefined");
			if (!isHTML && value2.indexOf("<") >= 0) return errorHandler.fatalError("Unescaped '<' not allowed in attributes values");
			el.addValue(qname, value2.replace(/[\t\n\r]/g, " ").replace(ENTITY_REG, entityReplacer), startIndex);
		}
		var attrName;
		var value;
		var p = ++start;
		var s = S_TAG;
		while (true) {
			var c = source.charAt(p);
			if (s === S_TAG && c === "<") throw new Error("unexpected < in tag name: " + source.slice(start, p));
			switch (c) {
				case "=":
					if (s === S_ATTR) {
						attrName = source.slice(start, p);
						s = S_EQ;
					} else if (s === S_ATTR_SPACE) s = S_EQ;
					else throw new Error("attribute equal must after attrName");
					break;
				case "'":
				case "\"":
					if (s === S_EQ || s === S_ATTR) {
						if (s === S_ATTR) {
							errorHandler.warning("attribute value must after \"=\"");
							attrName = source.slice(start, p);
						}
						start = p + 1;
						p = source.indexOf(c, start);
						if (p > 0) {
							value = source.slice(start, p);
							addAttribute(attrName, value, start - 1);
							s = S_ATTR_END;
						} else throw new Error("attribute value no end '" + c + "' match");
					} else if (s == S_ATTR_NOQUOT_VALUE) {
						value = source.slice(start, p);
						addAttribute(attrName, value, start);
						errorHandler.warning("attribute \"" + attrName + "\" missed start quot(" + c + ")!!");
						start = p + 1;
						s = S_ATTR_END;
					} else throw new Error("attribute value must after \"=\"");
					break;
				case "/":
					switch (s) {
						case S_TAG: el.setTagName(source.slice(start, p));
						case S_ATTR_END:
						case S_TAG_SPACE:
						case S_TAG_CLOSE:
							s = S_TAG_CLOSE;
							el.closed = true;
						case S_ATTR_NOQUOT_VALUE:
						case S_ATTR: break;
						case S_ATTR_SPACE:
							el.closed = true;
							break;
						default: throw new Error("attribute invalid close char('/')");
					}
					break;
				case "":
					errorHandler.error("unexpected end of input");
					if (s == S_TAG) el.setTagName(source.slice(start, p));
					return p;
				case ">":
					switch (s) {
						case S_TAG: el.setTagName(source.slice(start, p));
						case S_ATTR_END:
						case S_TAG_SPACE:
						case S_TAG_CLOSE: break;
						case S_ATTR_NOQUOT_VALUE:
						case S_ATTR:
							value = source.slice(start, p);
							if (value.slice(-1) === "/") {
								el.closed = true;
								value = value.slice(0, -1);
							}
						case S_ATTR_SPACE:
							if (s === S_ATTR_SPACE) value = attrName;
							if (s == S_ATTR_NOQUOT_VALUE) {
								errorHandler.warning("attribute \"" + value + "\" missed quot(\")!");
								addAttribute(attrName, value, start);
							} else {
								if (!isHTML) errorHandler.warning("attribute \"" + value + "\" missed value!! \"" + value + "\" instead!!");
								addAttribute(value, value, start);
							}
							break;
						case S_EQ: if (!isHTML) return errorHandler.fatalError(`AttValue: ' or " expected`);
					}
					return p;
				case "": c = " ";
				default: if (c <= " ") switch (s) {
					case S_TAG:
						el.setTagName(source.slice(start, p));
						s = S_TAG_SPACE;
						break;
					case S_ATTR:
						attrName = source.slice(start, p);
						s = S_ATTR_SPACE;
						break;
					case S_ATTR_NOQUOT_VALUE:
						var value = source.slice(start, p);
						errorHandler.warning("attribute \"" + value + "\" missed quot(\")!!");
						addAttribute(attrName, value, start);
					case S_ATTR_END: s = S_TAG_SPACE;
				}
				else switch (s) {
					case S_ATTR_SPACE:
						if (!isHTML) errorHandler.warning("attribute \"" + attrName + "\" missed value!! \"" + attrName + "\" instead2!!");
						addAttribute(attrName, attrName, start);
						start = p;
						s = S_ATTR;
						break;
					case S_ATTR_END: errorHandler.warning("attribute space is required\"" + attrName + "\"!!");
					case S_TAG_SPACE:
						s = S_ATTR;
						start = p;
						break;
					case S_EQ:
						s = S_ATTR_NOQUOT_VALUE;
						start = p;
						break;
					case S_TAG_CLOSE: throw new Error("elements closed character '/' and '>' must be connected to");
				}
			}
			p++;
		}
	}
	function appendElement(el, domBuilder, currentNSMap) {
		var tagName = el.tagName;
		var localNSMap = null;
		var i = el.length;
		while (i--) {
			var a = el[i];
			var qName = a.qName;
			var value = a.value;
			var nsp = qName.indexOf(":");
			if (nsp > 0) {
				var prefix = a.prefix = qName.slice(0, nsp);
				var localName = qName.slice(nsp + 1);
				var nsPrefix = prefix === "xmlns" && localName;
			} else {
				localName = qName;
				prefix = null;
				nsPrefix = qName === "xmlns" && "";
			}
			a.localName = localName;
			if (nsPrefix !== false) {
				if (localNSMap == null) {
					localNSMap = /* @__PURE__ */ Object.create(null);
					currentNSMap = Object.create(currentNSMap);
				}
				currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
				a.uri = NAMESPACE.XMLNS;
				domBuilder.startPrefixMapping(nsPrefix, value);
			}
		}
		var i = el.length;
		while (i--) {
			a = el[i];
			if (a.prefix) {
				if (a.prefix === "xml") a.uri = NAMESPACE.XML;
				if (a.prefix !== "xmlns") a.uri = currentNSMap[a.prefix];
			}
		}
		var nsp = tagName.indexOf(":");
		if (nsp > 0) {
			prefix = el.prefix = tagName.slice(0, nsp);
			localName = el.localName = tagName.slice(nsp + 1);
		} else {
			prefix = null;
			localName = el.localName = tagName;
		}
		var ns = el.uri = currentNSMap[prefix || ""];
		domBuilder.startElement(ns, localName, tagName, el);
		if (el.closed) {
			domBuilder.endElement(ns, localName, tagName);
			if (localNSMap) {
				for (prefix in localNSMap) if (hasOwn(localNSMap, prefix)) domBuilder.endPrefixMapping(prefix);
			}
		} else {
			el.currentNSMap = currentNSMap;
			el.localNSMap = localNSMap;
			return true;
		}
	}
	function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
		var isEscapableRaw = isHTMLEscapableRawTextElement(tagName);
		if (isEscapableRaw || isHTMLRawTextElement(tagName)) {
			var closeTag = new RegExp("</" + tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ">", "ig");
			closeTag.lastIndex = elStartEnd;
			var match = closeTag.exec(source);
			var elEndStart = match ? match.index : -1;
			if (elEndStart < 0) return elStartEnd + 1;
			var text = source.substring(elStartEnd + 1, elEndStart);
			if (isEscapableRaw) text = text.replace(ENTITY_REG, entityReplacer);
			domBuilder.characters(text, 0, text.length);
			return elEndStart;
		}
		return elStartEnd + 1;
	}
	function _copy(source, target) {
		for (var n in source) if (hasOwn(source, n)) target[n] = source[n];
	}
	function parseUtils(source, start) {
		var index = start;
		function char(n) {
			n = n || 0;
			return source.charAt(index + n);
		}
		function skip(n) {
			n = n || 1;
			index += n;
		}
		function skipBlanks() {
			var blanks = 0;
			while (index < source.length) {
				var c = char();
				if (c !== " " && c !== "\n" && c !== "	" && c !== "\r") return blanks;
				blanks++;
				skip();
			}
			return -1;
		}
		function substringFromIndex() {
			return source.substring(index);
		}
		function substringStartsWith(text) {
			return source.substring(index, index + text.length) === text;
		}
		function substringStartsWithCaseInsensitive(text) {
			return source.substring(index, index + text.length).toUpperCase() === text.toUpperCase();
		}
		function getMatch(args) {
			var match = g.reg("^", args).exec(substringFromIndex());
			if (match) {
				skip(match[0].length);
				return match[0];
			}
			return null;
		}
		return {
			char,
			getIndex: function() {
				return index;
			},
			getMatch,
			getSource: function() {
				return source;
			},
			skip,
			skipBlanks,
			substringFromIndex,
			substringStartsWith,
			substringStartsWithCaseInsensitive
		};
	}
	function parseDoctypeInternalSubset(p, errorHandler) {
		function parsePI(p2, errorHandler2) {
			var match = g.PI.exec(p2.substringFromIndex());
			if (!match) return errorHandler2.fatalError("processing instruction is not well-formed at position " + p2.getIndex());
			if (match[1].toLowerCase() === "xml") return errorHandler2.fatalError("xml declaration is only allowed at the start of the document, but found at position " + p2.getIndex());
			p2.skip(match[0].length);
			return match[0];
		}
		var source = p.getSource();
		if (p.char() === "[") {
			p.skip(1);
			var intSubsetStart = p.getIndex();
			while (p.getIndex() < source.length) {
				p.skipBlanks();
				if (p.char() === "]") {
					var internalSubset = source.substring(intSubsetStart, p.getIndex());
					p.skip(1);
					return internalSubset;
				}
				var current = null;
				if (p.char() === "<" && p.char(1) === "!") switch (p.char(2)) {
					case "E":
						if (p.char(3) === "L") current = p.getMatch(g.elementdecl);
						else if (p.char(3) === "N") current = p.getMatch(g.EntityDecl);
						break;
					case "A":
						current = p.getMatch(g.AttlistDecl);
						break;
					case "N":
						current = p.getMatch(g.NotationDecl);
						break;
					case "-": current = p.getMatch(g.Comment);
				}
				else if (p.char() === "<" && p.char(1) === "?") current = parsePI(p, errorHandler);
				else if (p.char() === "%") current = p.getMatch(g.PEReference);
				else return errorHandler.fatalError("Error detected in Markup declaration");
				if (!current) return errorHandler.fatalError("Error in internal subset at position " + p.getIndex());
			}
			return errorHandler.fatalError("doctype internal subset is not well-formed, missing ]");
		}
	}
	function parseDoctypeCommentOrCData(source, start, domBuilder, errorHandler, isHTML) {
		var p = parseUtils(source, start);
		switch (isHTML ? p.char(2).toUpperCase() : p.char(2)) {
			case "-":
				var comment = p.getMatch(g.Comment);
				if (comment) {
					domBuilder.comment(comment, g.COMMENT_START.length, comment.length - g.COMMENT_START.length - g.COMMENT_END.length);
					return p.getIndex();
				} else return errorHandler.fatalError("comment is not well-formed at position " + p.getIndex());
			case "[":
				var cdata = p.getMatch(g.CDSect);
				if (cdata) {
					if (!isHTML && !domBuilder.currentElement) return errorHandler.fatalError("CDATA outside of element");
					domBuilder.startCDATA();
					domBuilder.characters(cdata, g.CDATA_START.length, cdata.length - g.CDATA_START.length - g.CDATA_END.length);
					domBuilder.endCDATA();
					return p.getIndex();
				} else return errorHandler.fatalError("Invalid CDATA starting at position " + start);
			case "D":
				if (domBuilder.doc && domBuilder.doc.documentElement) return errorHandler.fatalError("Doctype not allowed inside or after documentElement at position " + p.getIndex());
				if (isHTML ? !p.substringStartsWithCaseInsensitive(g.DOCTYPE_DECL_START) : !p.substringStartsWith(g.DOCTYPE_DECL_START)) return errorHandler.fatalError("Expected " + g.DOCTYPE_DECL_START + " at position " + p.getIndex());
				p.skip(g.DOCTYPE_DECL_START.length);
				if (p.skipBlanks() < 1) return errorHandler.fatalError("Expected whitespace after " + g.DOCTYPE_DECL_START + " at position " + p.getIndex());
				var doctype = {
					name: void 0,
					publicId: void 0,
					systemId: void 0,
					internalSubset: void 0
				};
				doctype.name = p.getMatch(g.Name);
				if (!doctype.name) return errorHandler.fatalError("doctype name missing or contains unexpected characters at position " + p.getIndex());
				if (isHTML && doctype.name.toLowerCase() !== "html") errorHandler.warning("Unexpected DOCTYPE in HTML document at position " + p.getIndex());
				p.skipBlanks();
				if (p.substringStartsWith(g.PUBLIC) || p.substringStartsWith(g.SYSTEM)) {
					var match = g.ExternalID_match.exec(p.substringFromIndex());
					if (!match) return errorHandler.fatalError("doctype external id is not well-formed at position " + p.getIndex());
					if (match.groups.SystemLiteralOnly !== void 0) doctype.systemId = match.groups.SystemLiteralOnly;
					else {
						doctype.systemId = match.groups.SystemLiteral;
						doctype.publicId = match.groups.PubidLiteral;
					}
					p.skip(match[0].length);
				} else if (isHTML && p.substringStartsWithCaseInsensitive(g.SYSTEM)) {
					p.skip(g.SYSTEM.length);
					if (p.skipBlanks() < 1) return errorHandler.fatalError("Expected whitespace after " + g.SYSTEM + " at position " + p.getIndex());
					doctype.systemId = p.getMatch(g.ABOUT_LEGACY_COMPAT_SystemLiteral);
					if (!doctype.systemId) return errorHandler.fatalError("Expected " + g.ABOUT_LEGACY_COMPAT + " in single or double quotes after " + g.SYSTEM + " at position " + p.getIndex());
				}
				if (isHTML && doctype.systemId && !g.ABOUT_LEGACY_COMPAT_SystemLiteral.test(doctype.systemId)) errorHandler.warning("Unexpected doctype.systemId in HTML document at position " + p.getIndex());
				if (!isHTML) {
					p.skipBlanks();
					doctype.internalSubset = parseDoctypeInternalSubset(p, errorHandler);
				}
				p.skipBlanks();
				if (p.char() !== ">") return errorHandler.fatalError("doctype not terminated with > at position " + p.getIndex());
				p.skip(1);
				domBuilder.startDTD(doctype.name, doctype.publicId, doctype.systemId, doctype.internalSubset);
				domBuilder.endDTD();
				return p.getIndex();
			default: return errorHandler.fatalError("Not well-formed XML starting with \"<!\" at position " + start);
		}
	}
	function parseProcessingInstruction(source, start, domBuilder, errorHandler) {
		var match = source.substring(start).match(g.PI);
		if (!match) return errorHandler.fatalError("Invalid processing instruction starting at position " + start);
		if (match[1].toLowerCase() === "xml") {
			if (start > 0) return errorHandler.fatalError("processing instruction at position " + start + " is an xml declaration which is only at the start of the document");
			if (!g.XMLDecl.test(source.substring(start))) return errorHandler.fatalError("xml declaration is not well-formed");
		}
		domBuilder.processingInstruction(match[1], match[2]);
		return start + match[0].length;
	}
	function ElementAttributes() {
		this.attributeNames = /* @__PURE__ */ Object.create(null);
	}
	ElementAttributes.prototype = {
		setTagName: function(tagName) {
			if (!g.QName_exact.test(tagName)) throw new Error("invalid tagName:" + tagName);
			this.tagName = tagName;
		},
		addValue: function(qName, value, offset) {
			if (!g.QName_exact.test(qName)) throw new Error("invalid attribute:" + qName);
			this.attributeNames[qName] = this.length;
			this[this.length++] = {
				qName,
				value,
				offset
			};
		},
		length: 0,
		getLocalName: function(i) {
			return this[i].localName;
		},
		getLocator: function(i) {
			return this[i].locator;
		},
		getQName: function(i) {
			return this[i].qName;
		},
		getURI: function(i) {
			return this[i].uri;
		},
		getValue: function(i) {
			return this[i].value;
		}
	};
	exports.XMLReader = XMLReader;
	exports.parseUtils = parseUtils;
	exports.parseDoctypeCommentOrCData = parseDoctypeCommentOrCData;
} });
var require_dom_parser = __commonJS({ "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/dom-parser.js"(exports) {
	"use strict";
	var conventions = require_conventions();
	var dom = require_dom();
	var errors = require_errors();
	var entities = require_entities();
	var sax = require_sax();
	var DOMImplementation = dom.DOMImplementation;
	var hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
	var isHTMLMimeType = conventions.isHTMLMimeType;
	var isValidMimeType = conventions.isValidMimeType;
	var MIME_TYPE = conventions.MIME_TYPE;
	var NAMESPACE = conventions.NAMESPACE;
	var ParseError = errors.ParseError;
	var XMLReader = sax.XMLReader;
	function normalizeLineEndings(input) {
		return input.replace(/\r[\n\u0085]/g, "\n").replace(/[\r\u0085\u2028\u2029]/g, "\n");
	}
	function DOMParser2(options) {
		options = options || {};
		if (options.locator === void 0) options.locator = true;
		this.assign = options.assign || conventions.assign;
		this.domHandler = options.domHandler || DOMHandler;
		this.onError = options.onError || options.errorHandler;
		if (options.errorHandler && typeof options.errorHandler !== "function") throw new TypeError("errorHandler object is no longer supported, switch to onError!");
		else if (options.errorHandler) options.errorHandler("warning", "The `errorHandler` option has been deprecated, use `onError` instead!", this);
		this.normalizeLineEndings = options.normalizeLineEndings || normalizeLineEndings;
		this.locator = !!options.locator;
		this.xmlns = this.assign(/* @__PURE__ */ Object.create(null), options.xmlns);
	}
	DOMParser2.prototype.parseFromString = function(source, mimeType) {
		if (!isValidMimeType(mimeType)) throw new TypeError("DOMParser.parseFromString: the provided mimeType \"" + mimeType + "\" is not valid.");
		var defaultNSMap = this.assign(/* @__PURE__ */ Object.create(null), this.xmlns);
		var entityMap = entities.XML_ENTITIES;
		var defaultNamespace = defaultNSMap[""] || null;
		if (hasDefaultHTMLNamespace(mimeType)) {
			entityMap = entities.HTML_ENTITIES;
			defaultNamespace = NAMESPACE.HTML;
		} else if (mimeType === MIME_TYPE.XML_SVG_IMAGE) defaultNamespace = NAMESPACE.SVG;
		defaultNSMap[""] = defaultNamespace;
		defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
		var domBuilder = new this.domHandler({
			mimeType,
			defaultNamespace,
			onError: this.onError
		});
		var locator = this.locator ? {} : void 0;
		if (this.locator) domBuilder.setDocumentLocator(locator);
		var sax2 = new XMLReader();
		sax2.errorHandler = domBuilder;
		sax2.domBuilder = domBuilder;
		if (!conventions.isHTMLMimeType(mimeType) && typeof source !== "string") sax2.errorHandler.fatalError("source is not a string");
		sax2.parse(this.normalizeLineEndings(String(source)), defaultNSMap, entityMap);
		if (!domBuilder.doc.documentElement) sax2.errorHandler.fatalError("missing root element");
		return domBuilder.doc;
	};
	function DOMHandler(options) {
		var opt = options || {};
		this.mimeType = opt.mimeType || MIME_TYPE.XML_APPLICATION;
		this.defaultNamespace = opt.defaultNamespace || null;
		this.cdata = false;
		this.currentElement = void 0;
		this.doc = void 0;
		this.locator = void 0;
		this.onError = opt.onError;
	}
	function position(locator, node) {
		node.lineNumber = locator.lineNumber;
		node.columnNumber = locator.columnNumber;
	}
	DOMHandler.prototype = {
		/**
		* Either creates an XML or an HTML document and stores it under `this.doc`.
		* If it is an XML document, `this.defaultNamespace` is used to create it,
		* and it will not contain any `childNodes`.
		* If it is an HTML document, it will be created without any `childNodes`.
		*
		* @see http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
		*/
		startDocument: function() {
			var impl = new DOMImplementation();
			this.doc = isHTMLMimeType(this.mimeType) ? impl.createHTMLDocument(false) : impl.createDocument(this.defaultNamespace, "");
		},
		startElement: function(namespaceURI, localName, qName, attrs) {
			var doc = this.doc;
			var el = doc.createElementNS(namespaceURI, qName || localName);
			var len = attrs.length;
			appendElement(this, el);
			this.currentElement = el;
			this.locator && position(this.locator, el);
			for (var i = 0; i < len; i++) {
				var namespaceURI = attrs.getURI(i);
				var value = attrs.getValue(i);
				var qName = attrs.getQName(i);
				var attr = doc.createAttributeNS(namespaceURI, qName);
				this.locator && position(attrs.getLocator(i), attr);
				attr.value = attr.nodeValue = value;
				el.setAttributeNode(attr);
			}
		},
		endElement: function(namespaceURI, localName, qName) {
			this.currentElement = this.currentElement.parentNode;
		},
		startPrefixMapping: function(prefix, uri) {},
		endPrefixMapping: function(prefix) {},
		processingInstruction: function(target, data) {
			var ins = this.doc.createProcessingInstruction(target, data);
			this.locator && position(this.locator, ins);
			appendElement(this, ins);
		},
		ignorableWhitespace: function(ch, start, length) {},
		characters: function(chars, start, length) {
			chars = _toString.apply(this, arguments);
			if (chars) {
				if (this.cdata) var charNode = this.doc.createCDATASection(chars);
				else var charNode = this.doc.createTextNode(chars);
				if (this.currentElement) this.currentElement.appendChild(charNode);
				else if (/^\s*$/.test(chars)) this.doc.appendChild(charNode);
				this.locator && position(this.locator, charNode);
			}
		},
		skippedEntity: function(name) {},
		endDocument: function() {
			this.doc.normalize();
		},
		/**
		* Stores the locator to be able to set the `columnNumber` and `lineNumber`
		* on the created DOM nodes.
		*
		* @param {Locator} locator
		*/
		setDocumentLocator: function(locator) {
			if (locator) locator.lineNumber = 0;
			this.locator = locator;
		},
		comment: function(chars, start, length) {
			chars = _toString.apply(this, arguments);
			var comm = this.doc.createComment(chars);
			this.locator && position(this.locator, comm);
			appendElement(this, comm);
		},
		startCDATA: function() {
			this.cdata = true;
		},
		endCDATA: function() {
			this.cdata = false;
		},
		startDTD: function(name, publicId, systemId, internalSubset) {
			var impl = this.doc.implementation;
			if (impl && impl.createDocumentType) {
				var dt = impl.createDocumentType(name, publicId, systemId, internalSubset);
				this.locator && position(this.locator, dt);
				appendElement(this, dt);
				this.doc.doctype = dt;
			}
		},
		reportError: function(level, message) {
			if (typeof this.onError === "function") try {
				this.onError(level, message, this);
			} catch (e) {
				throw new ParseError("Reporting " + level + " \"" + message + "\" caused " + e, this.locator);
			}
			else console.error("[xmldom " + level + "]	" + message, _locator(this.locator));
		},
		/**
		* @see http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
		*/
		warning: function(message) {
			this.reportError("warning", message);
		},
		error: function(message) {
			this.reportError("error", message);
		},
		/**
		* This function reports a fatal error and throws a ParseError.
		*
		* @param {string} message
		* - The message to be used for reporting and throwing the error.
		* @param {Error} [cause]
		* The error that caused this fatal error, preserved as the thrown `ParseError`'s `cause`.
		* @returns {never}
		* This function always throws an error and never returns a value.
		* @throws {ParseError}
		* Always throws a ParseError with the provided message.
		*/
		fatalError: function(message, cause) {
			this.reportError("fatalError", message);
			throw new ParseError(message, this.locator, cause);
		}
	};
	function _locator(l) {
		if (l) return "\n@#[line:" + l.lineNumber + ",col:" + l.columnNumber + "]";
	}
	function _toString(chars, start, length) {
		if (typeof chars == "string") return chars.substr(start, length);
		else {
			if (chars.length >= start + length || start) return new java.lang.String(chars, start, length) + "";
			return chars;
		}
	}
	"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(key) {
		DOMHandler.prototype[key] = function() {
			return null;
		};
	});
	function appendElement(handler, node) {
		if (!handler.currentElement) handler.doc.appendChild(node);
		else handler.currentElement.appendChild(node);
	}
	function onErrorStopParsing(level) {
		if (level === "error") throw "onErrorStopParsing";
	}
	function onWarningStopParsing() {
		throw "onWarningStopParsing";
	}
	exports.__DOMHandler = DOMHandler;
	exports.DOMParser = DOMParser2;
	exports.normalizeLineEndings = normalizeLineEndings;
	exports.onErrorStopParsing = onErrorStopParsing;
	exports.onWarningStopParsing = onWarningStopParsing;
} });
var require_lib = __commonJS({ "../../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/index.js"(exports) {
	"use strict";
	var conventions = require_conventions();
	exports.assign = conventions.assign;
	exports.hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
	exports.isHTMLMimeType = conventions.isHTMLMimeType;
	exports.isValidMimeType = conventions.isValidMimeType;
	exports.MIME_TYPE = conventions.MIME_TYPE;
	exports.NAMESPACE = conventions.NAMESPACE;
	var errors = require_errors();
	exports.DOMException = errors.DOMException;
	exports.DOMExceptionName = errors.DOMExceptionName;
	exports.ExceptionCode = errors.ExceptionCode;
	exports.ParseError = errors.ParseError;
	var dom = require_dom();
	exports.Attr = dom.Attr;
	exports.CDATASection = dom.CDATASection;
	exports.CharacterData = dom.CharacterData;
	exports.Comment = dom.Comment;
	exports.Document = dom.Document;
	exports.DocumentFragment = dom.DocumentFragment;
	exports.DocumentType = dom.DocumentType;
	exports.DOMImplementation = dom.DOMImplementation;
	exports.Element = dom.Element;
	exports.Entity = dom.Entity;
	exports.EntityReference = dom.EntityReference;
	exports.LiveNodeList = dom.LiveNodeList;
	exports.NamedNodeMap = dom.NamedNodeMap;
	exports.Node = dom.Node;
	exports.NodeList = dom.NodeList;
	exports.Notation = dom.Notation;
	exports.ProcessingInstruction = dom.ProcessingInstruction;
	exports.Text = dom.Text;
	exports.XMLSerializer = dom.XMLSerializer;
	var domParser = require_dom_parser();
	exports.DOMParser = domParser.DOMParser;
	exports.normalizeLineEndings = domParser.normalizeLineEndings;
	exports.onErrorStopParsing = domParser.onErrorStopParsing;
	exports.onWarningStopParsing = domParser.onWarningStopParsing;
} });
function preprocessXmind8Xml(xmlString) {
	return xmlString.replace(/\bxlink:href=/g, "href=").replace(/\bxhtml:src=/g, "src=").replace(/\bsvg:width=/g, "width=").replace(/\bsvg:height=/g, "height=").replace(/<xhtml:img\b/g, "<img").replace(/<\/xhtml:img>/g, "</img>");
}
async function parseXML(xmlString) {
	if (typeof DOMParser !== "undefined") return new DOMParser().parseFromString(xmlString, "text/xml");
	try {
		const { DOMParser: NodeDOMParser } = await Promise.resolve().then(() => __toESM(require_lib(), 1));
		return new NodeDOMParser().parseFromString(xmlString, "text/xml");
	} catch (e) {
		throw new Error("XML parsing requires @xmldom/xmldom in Node.js. Install it with: npm install @xmldom/xmldom");
	}
}
function getTextContent(el) {
	if (!el) return "";
	return (el.textContent || el.nodeValue || "").trim();
}
function getAttr(el, name, ns) {
	if (!el) return null;
	if (ns) return el.getAttributeNS(ns, name) || el.getAttribute(name) || null;
	return el.getAttribute(name) || null;
}
function getChildren(el, tagName) {
	if (!el || !el.childNodes) return [];
	const result = [];
	for (let i = 0; i < el.childNodes.length; i++) {
		const child = el.childNodes[i];
		if (child.nodeType === 1) {
			const localName = child.localName || child.nodeName.replace(/^.*:/, "");
			if (!tagName || localName === tagName) result.push(child);
		}
	}
	return result;
}
function getChild(el, tagName) {
	return getChildren(el, tagName)[0] || null;
}
var XMIND_PRIORITY_MARKERS = {
	"priority-1": 1,
	"priority-2": 2,
	"priority-3": 3,
	"priority-4": 4,
	"priority-5": 5,
	"priority-6": 6,
	"priority-7": 7,
	"priority-8": 8,
	"priority-9": 9
};
var XMIND_PROGRESS_MARKERS = {
	"task-start": 1,
	"task-oct": 2,
	"task-quarter": 3,
	"task-3oct": 4,
	"task-half": 5,
	"task-5oct": 6,
	"task-3quar": 7,
	"task-7oct": 8,
	"task-done": 9,
	"task-pause": 10
};
Object.fromEntries(Object.entries(XMIND_PRIORITY_MARKERS).map(([k, v]) => [v, k]));
Object.fromEntries(Object.entries(XMIND_PROGRESS_MARKERS).map(([k, v]) => [v, k]));
var KM_ROOT_TEMPLATE = () => ({
	root: {
		data: { text: "" },
		children: []
	},
	template: "default",
	theme: "fresh-blue",
	version: "1.4.43"
});
async function parseXmind8Xml(xmlString, options = {}) {
	const hideEmptyValue = options.hideEmptyValue !== false;
	const workbook = (await parseXML(preprocessXmind8Xml(xmlString))).documentElement;
	const sheets = getChildren(workbook, "sheet");
	if (sheets.length === 0) throw new Error("XMind 8: No sheets found in content.xml");
	let commentsMap = null;
	if (options.commentsXml) commentsMap = await parseCommentsXml(options.commentsXml);
	const resources = options.resources || null;
	const results = [];
	for (const sheet of sheets) {
		const km = KM_ROOT_TEMPLATE();
		km.title = getAttr(sheet, "name") || getTextContent(getChild(sheet, "title")) || "Sheet";
		const rootTopicEl = getChild(sheet, "topic");
		if (rootTopicEl) km.root = convertTopic8(rootTopicEl, commentsMap, hideEmptyValue, resources);
		results.push(km);
		if (options.firstSheetOnly) break;
	}
	return results;
}
function resolveImageSrc(src, resources) {
	if (!resources || !src) return src;
	const zipPath = src.replace(/^xap:/, "");
	const data = resources[zipPath];
	if (!data) return src;
	const mime = {
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		gif: "image/gif",
		webp: "image/webp",
		svg: "image/svg+xml",
		bmp: "image/bmp"
	}[zipPath.split(".").pop().toLowerCase()] || "image/png";
	let binary = "";
	for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
	return `data:${mime};base64,${btoa(binary)}`;
}
function convertTopic8(topicEl, commentsMap, hideEmptyValue, resources = null) {
	const node = {
		data: {},
		children: []
	};
	const data = node.data;
	const topicId = getAttr(topicEl, "id");
	data.text = getTextContent(getChild(topicEl, "title")) || "";
	const href = getAttr(topicEl, "href");
	if (href) if (href.startsWith("xap:attachments") || href.startsWith("xap:resources")) {
		data.hyperlink = href;
		data.attachment = true;
	} else if (href.startsWith("xmind:") || href.startsWith("#")) {
		data.hyperlink = href;
		data.internalLink = true;
	} else data.hyperlink = href;
	const notesEl = getChild(topicEl, "notes");
	if (notesEl) {
		const plainEl = getChild(notesEl, "plain");
		if (plainEl) data.note = getTextContent(plainEl);
		else data.note = extractNotesText(notesEl);
	}
	const labelsEl = getChild(topicEl, "labels");
	if (labelsEl) {
		const labelEls = getChildren(labelsEl, "label");
		if (labelEls.length > 0) data.label = labelEls.map((el) => getTextContent(el)).filter(Boolean);
	}
	const markerRefsEl = getChild(topicEl, "marker-refs");
	if (markerRefsEl) {
		const markerRefs = getChildren(markerRefsEl, "marker-ref");
		const otherMarkers = [];
		for (const ref of markerRefs) {
			const markerId = getAttr(ref, "marker-id");
			if (!markerId) continue;
			if (XMIND_PRIORITY_MARKERS[markerId] !== void 0) data.priority = XMIND_PRIORITY_MARKERS[markerId];
			else if (XMIND_PROGRESS_MARKERS[markerId] !== void 0) data.progress = XMIND_PROGRESS_MARKERS[markerId];
			else otherMarkers.push(markerId);
		}
		if (otherMarkers.length > 0) data.markers = otherMarkers;
	}
	const imgInfo = findImageElement(topicEl);
	if (imgInfo) {
		data.image = resolveImageSrc(imgInfo.src, resources);
		if (imgInfo.width || imgInfo.height) {
			data.imageSize = {};
			if (imgInfo.width) data.imageSize.width = imgInfo.width;
			if (imgInfo.height) data.imageSize.height = imgInfo.height;
		}
	}
	const styleId = getAttr(topicEl, "style-id");
	if (styleId) data.style = { "xmind-style-id": styleId };
	if (getAttr(topicEl, "branch") === "folded") data.expandState = "collapse";
	const structureClass = getAttr(topicEl, "structure-class");
	if (structureClass) data["xmind-structure"] = structureClass;
	if (commentsMap && topicId && commentsMap[topicId]) data.comment = commentsMap[topicId];
	const childrenEl = getChild(topicEl, "children");
	if (childrenEl) {
		const topicsEls = getChildren(childrenEl, "topics");
		for (const topicsEl of topicsEls) {
			const type = getAttr(topicsEl, "type");
			if (type === "attached" || type === null) for (const childTopic of getChildren(topicsEl, "topic")) node.children.push(convertTopic8(childTopic, commentsMap, hideEmptyValue, resources));
			else if (type === "detached") for (const childTopic of getChildren(topicsEl, "topic")) {
				const child = convertTopic8(childTopic, commentsMap, hideEmptyValue, resources);
				child.data["xmind-detached"] = true;
				node.children.push(child);
			}
			else if (type === "callout") {
				const calloutTexts = getChildren(topicsEl, "topic").map((t) => getTextContent(getChild(t, "title"))).filter(Boolean);
				if (calloutTexts.length > 0) data.note = (data.note ? data.note + "\n\n" : "") + calloutTexts.join("\n");
			}
		}
	}
	if (hideEmptyValue) for (const key of Object.keys(data)) {
		if (key === "text") continue;
		const val = data[key];
		if (val === null || val === void 0 || val === "" || Array.isArray(val) && val.length === 0) delete data[key];
	}
	return node;
}
function extractNotesText(notesEl) {
	const texts = [];
	function walk(el) {
		if (!el) return;
		if (el.nodeType === 3) {
			const t = (el.nodeValue || "").trim();
			if (t) texts.push(t);
		}
		if (el.childNodes) for (let i = 0; i < el.childNodes.length; i++) walk(el.childNodes[i]);
	}
	walk(notesEl);
	return texts.join("\n").trim();
}
function findImageElement(topicEl) {
	for (const child of getChildren(topicEl)) {
		const localName = (child.localName || child.nodeName || "").replace(/^.*:/, "");
		if (localName === "image") {
			const src = getAttr(child, "href") || getAttr(child, "src");
			if (!src) continue;
			return {
				src,
				width: parseInt(getAttr(child, "width") || "", 10) || void 0,
				height: parseInt(getAttr(child, "height") || "", 10) || void 0
			};
		}
		if (localName === "img") {
			const src = getAttr(child, "src");
			if (!src) continue;
			return {
				src,
				width: parseInt(getAttr(child, "width") || "", 10) || void 0,
				height: parseInt(getAttr(child, "height") || "", 10) || void 0
			};
		}
	}
	return null;
}
async function parseCommentsXml(commentsXmlStr) {
	if (!commentsXmlStr || !commentsXmlStr.trim()) return null;
	try {
		const root = (await parseXML(commentsXmlStr)).documentElement;
		const commentEls = getChildren(root, "comment");
		const map = {};
		for (const el of commentEls) {
			const objectId = getAttr(el, "object-id");
			if (!objectId) continue;
			const author = getAttr(el, "author") || "";
			const content = getTextContent(getChild(el, "content"));
			if (!map[objectId]) map[objectId] = [];
			map[objectId].push({
				author,
				content
			});
		}
		return map;
	} catch (e) {
		return null;
	}
}
function parseXmind2020Json(contentJson, options = {}) {
	const sheets = typeof contentJson === "string" ? JSON.parse(contentJson) : contentJson;
	if (!Array.isArray(sheets)) throw new Error("XMind 2020: content.json must be an array of sheets");
	const hideEmptyValue = options.hideEmptyValue !== false;
	const resources = options.resources || null;
	const results = [];
	for (const sheet of sheets) {
		const km = KM_ROOT_TEMPLATE();
		km.title = sheet.title || "Sheet";
		const rootTopic = sheet.rootTopic;
		if (rootTopic) km.root = convertTopic2020(rootTopic, hideEmptyValue, resources);
		results.push(km);
		if (options.firstSheetOnly) break;
	}
	return results;
}
function resolveImageSrc2(src, resources) {
	if (!resources || !src) return src;
	const zipPath = src.replace(/^xap:/, "");
	const data = resources[zipPath];
	if (!data) return src;
	const mime = {
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		gif: "image/gif",
		webp: "image/webp",
		svg: "image/svg+xml",
		bmp: "image/bmp"
	}[zipPath.split(".").pop().toLowerCase()] || "image/png";
	let binary = "";
	for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
	return `data:${mime};base64,${btoa(binary)}`;
}
function convertTopic2020(topic, hideEmptyValue = true, resources = null) {
	const node = {
		data: {},
		children: []
	};
	const data = node.data;
	data.text = topic.title || "";
	if (topic.href) data.hyperlink = topic.href;
	if (topic.notes) {
		if (topic.notes.plain && topic.notes.plain.content) data.note = topic.notes.plain.content;
		else if (topic.notes.realHTML && topic.notes.realHTML.content) data.note = stripHtml(topic.notes.realHTML.content);
	}
	if (Array.isArray(topic.labels) && topic.labels.length > 0) data.label = topic.labels.filter(Boolean);
	if (Array.isArray(topic.markers) && topic.markers.length > 0) {
		const otherMarkers = [];
		for (const marker of topic.markers) {
			const markerId = marker.markerId || marker.id || "";
			if (!markerId) continue;
			if (XMIND_PRIORITY_MARKERS[markerId] !== void 0) data.priority = XMIND_PRIORITY_MARKERS[markerId];
			else if (XMIND_PROGRESS_MARKERS[markerId] !== void 0) data.progress = XMIND_PROGRESS_MARKERS[markerId];
			else otherMarkers.push(markerId);
		}
		if (otherMarkers.length > 0) data.markers = otherMarkers;
	}
	if (topic.image) {
		const rawSrc = topic.image.src || topic.image.url || "";
		if (rawSrc) {
			data.image = resolveImageSrc2(rawSrc, resources);
			const w = topic.image.width;
			const h = topic.image.height;
			data.imageSize = {
				width: w || 200,
				height: h || 200
			};
		}
	}
	const styleId = topic.styleId || topic.style && topic.style.id;
	if (styleId) data.style = { "xmind-style-id": styleId };
	if (topic.style && topic.style.properties) {
		if (!data.style) data.style = {};
		const props = topic.style.properties;
		if (props["fo:color"]) data.style.color = props["fo:color"];
		if (props["fo:background-color"]) data.style.background = props["fo:background-color"];
		if (props["fo:font-size"]) data.style.fontSize = props["fo:font-size"];
		if (props["fo:font-weight"]) data.style.fontWeight = props["fo:font-weight"];
		if (props["fo:font-style"]) data.style.fontStyle = props["fo:font-style"];
		if (props["line-color"]) data.style.lineColor = props["line-color"];
		if (props["line-width"]) data.style.lineWidth = props["line-width"];
		if (props["shape-class"]) data.style.shapeClass = props["shape-class"];
	}
	if (topic.branch === "folded") data.expandState = "collapse";
	if (topic.structureClass) data["xmind-structure"] = topic.structureClass;
	if (topic.children) {
		if (Array.isArray(topic.children.attached)) for (const child of topic.children.attached) node.children.push(convertTopic2020(child, hideEmptyValue, resources));
		if (Array.isArray(topic.children.detached)) for (const child of topic.children.detached) {
			const childNode = convertTopic2020(child, hideEmptyValue, resources);
			childNode.data["xmind-detached"] = true;
			node.children.push(childNode);
		}
		if (Array.isArray(topic.children.summary)) for (const child of topic.children.summary) {
			const childNode = convertTopic2020(child, hideEmptyValue, resources);
			childNode.data["xmind-summary"] = true;
			node.children.push(childNode);
		}
		if (Array.isArray(topic.children.callout) && topic.children.callout.length > 0) {
			const calloutTexts = topic.children.callout.map((c) => (c.title || "").trim()).filter(Boolean);
			if (calloutTexts.length > 0) data.note = (data.note ? data.note + "\n\n" : "") + calloutTexts.join("\n");
		}
	}
	if (hideEmptyValue) for (const key of Object.keys(data)) {
		if (key === "text") continue;
		const val = data[key];
		if (val === null || val === void 0 || val === "" || Array.isArray(val) && val.length === 0) delete data[key];
	}
	return node;
}
function stripHtml(html) {
	if (!html) return "";
	return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&nbsp;/g, " ").trim();
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-mindmap@3.1.2/node_modules/@file-viewer/renderer-mindmap/dist/xmind.js
var NODE_WIDTH = 236;
var ROOT_WIDTH = 260;
var SIBLING_GAP = 24;
var CANVAS_PADDING = 44;
var MAX_RENDER_NODES = 1800;
var PAN_CLICK_THRESHOLD = 5;
var PAN_BOUNDARY_MARGIN = 180;
var PAN_MIN_VISIBLE_RATIO = .08;
var PAN_MIN_VISIBLE_PX = 56;
var WHEEL_ZOOM_STEP = .12;
var KEYBOARD_PAN_STEP = 42;
var KEYBOARD_PAN_FAST_STEP = 96;
var CLICK_SUPPRESSION_MS = 120;
var PANZOOM_EXCLUDE_CLASS = "xmind-pan-exclude";
var xmindStyle = `
.xmind-viewer{height:100%;min-height:0;display:flex;flex-direction:column;--xmind-sidebar-width:252px;--xmind-sidebar-padding:10px;--xmind-stats-gap:6px;--xmind-stats-margin:8px;--xmind-stats-padding:7px 8px;--xmind-stats-radius:9px;--xmind-stats-label-size:10px;--xmind-stats-value-size:14px;--xmind-outline-gap:2px;--xmind-outline-row-height:28px;--xmind-outline-font-size:13px;--xmind-outline-radius:7px;--xmind-outline-text:#334155;--xmind-outline-hover-bg:rgba(33,163,102,.1);--xmind-outline-hover-text:#0f766e;--xmind-outline-active-bg:rgba(33,163,102,.15);--xmind-outline-active-text:#0b7658;background:#eef3f7;color:#172033}
.xmind-viewer[data-viewer-density='compact']{--xmind-sidebar-width:232px;--xmind-sidebar-padding:7px;--xmind-stats-gap:4px;--xmind-stats-margin:6px;--xmind-stats-padding:5px 6px;--xmind-stats-radius:7px;--xmind-stats-label-size:9px;--xmind-stats-value-size:12px;--xmind-outline-gap:1px;--xmind-outline-row-height:26px;--xmind-outline-font-size:12px;--xmind-outline-radius:6px}
.xmind-viewer *{box-sizing:border-box}
.xmind-toolbar{min-height:62px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 16px;border-bottom:1px solid rgba(23,32,51,.08);background:#fff}
.xmind-title{min-width:0}.xmind-title span{color:#159365;font-size:12px;font-weight:900}.xmind-title strong{display:block;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:18px}
.xmind-actions{display:flex;align-items:center;gap:8px}.xmind-actions button{min-width:34px;min-height:30px;border:0;border-radius:8px;background:rgba(15,23,42,.06);color:#26364d;cursor:pointer;font-size:12px;font-weight:900}.xmind-actions button:hover{background:rgba(33,163,102,.14);color:#0f8f62}.xmind-actions span{min-width:48px;color:#64748b;text-align:center;font-size:12px;font-weight:900}
.xmind-tabs{display:flex;min-height:46px;gap:8px;align-items:center;overflow:auto;padding:8px 12px;border-bottom:1px solid rgba(23,32,51,.08);background:#f8fafc}
.xmind-tabs button{min-height:30px;max-width:220px;flex:0 0 auto;border:1px solid rgba(148,163,184,.28);border-radius:999px;padding:0 12px;background:#fff;color:#475569;cursor:pointer;font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.xmind-tabs button.active{border-color:rgba(33,163,102,.35);background:rgba(33,163,102,.12);color:#0f8f62}
.xmind-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(210px,var(--xmind-sidebar-width)) minmax(0,1fr)}
.xmind-sidebar{min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-gutter:stable;border-right:1px solid rgba(23,32,51,.08);background:rgba(255,255,255,.72);padding:var(--xmind-sidebar-padding)}
.xmind-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--xmind-stats-gap);margin-bottom:var(--xmind-stats-margin)}.xmind-stats div{min-width:0;border-radius:var(--xmind-stats-radius);background:#fff;padding:var(--xmind-stats-padding);box-shadow:inset 0 0 0 1px rgba(23,32,51,.06)}.xmind-stats span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#718096;font-size:var(--xmind-stats-label-size);font-weight:650;line-height:1.3}.xmind-stats strong{display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--xmind-stats-value-size);line-height:1.25;color:#172033}
.xmind-outline{display:flex;flex-direction:column;gap:var(--xmind-outline-gap)}.xmind-outline button{display:block;appearance:none;width:100%;min-height:var(--xmind-outline-row-height);border:0;border-radius:var(--xmind-outline-radius);padding:0 8px;background:transparent;color:var(--xmind-outline-text);cursor:pointer;font-family:inherit;font-size:var(--xmind-outline-font-size);font-weight:600;line-height:1.25;letter-spacing:-.01em;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.xmind-outline button:hover{background:var(--xmind-outline-hover-bg);color:var(--xmind-outline-hover-text)}.xmind-outline button.active{background:var(--xmind-outline-active-bg);color:var(--xmind-outline-active-text)}.xmind-outline button:focus-visible{outline:2px solid rgba(20,148,105,.42);outline-offset:-2px}
.xmind-stage{position:relative;min-width:0;min-height:0;overflow:hidden;cursor:grab;touch-action:none;overscroll-behavior:contain;user-select:none;-webkit-user-select:none;-webkit-user-drag:none;-webkit-tap-highlight-color:transparent;contain:layout paint;background:linear-gradient(90deg,rgba(15,23,42,.04) 1px,transparent 1px),linear-gradient(180deg,rgba(15,23,42,.04) 1px,transparent 1px),#f3f7fb;background-size:32px 32px;outline:none}
.xmind-stage *{touch-action:none;-webkit-user-drag:none}
.xmind-stage:focus-visible{box-shadow:inset 0 0 0 2px rgba(59,130,246,.42)}
.xmind-stage:active{cursor:grabbing}
.xmind-stage.is-panning,.xmind-stage.is-space-panning,.xmind-stage.is-panning *,.xmind-stage.is-space-panning *{cursor:grabbing!important;user-select:none}
.xmind-zoom-box{position:absolute;inset:0;transform-origin:top left;will-change:transform;cursor:inherit}.xmind-surface{position:absolute;left:0;top:0;transform-origin:top left;will-change:transform;cursor:inherit}.xmind-edges{position:absolute;inset:0;overflow:visible;pointer-events:none}.xmind-edges path{fill:none;stroke:#9db2c7;stroke-width:2.2;stroke-linecap:round}
.xmind-node{position:absolute;width:236px;min-height:58px;border:1px solid rgba(15,23,42,.1);border-radius:14px;padding:12px 12px 10px;background:#fff;box-shadow:0 12px 28px rgba(23,32,51,.11);color:#172033;cursor:grab;user-select:none;-webkit-user-select:none}
.xmind-node:active,.xmind-stage.is-panning .xmind-node{cursor:grabbing}
.xmind-node.root{width:260px;border-color:rgba(33,163,102,.28);background:linear-gradient(135deg,#effdf5,#fff);box-shadow:0 18px 38px rgba(33,163,102,.16)}
.xmind-node.detached{border-style:dashed}.xmind-node.summary{background:#fff8e7}.xmind-node.callout{background:#eef6ff}
.xmind-node h3{margin:0;color:#172033;font-size:14px;line-height:1.35;word-break:break-word}.xmind-node.root h3{font-size:16px}
.xmind-badges,.xmind-labels{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.xmind-badges span,.xmind-labels span{max-width:100%;border-radius:999px;padding:3px 7px;font-size:11px;font-weight:800;line-height:1.3}.xmind-badges span{background:#eef6f7;color:#0b7480}.xmind-labels span{background:#edf2ff;color:#3557a5}
.xmind-note{margin:8px 0 0;color:#64748b;font-size:12px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.xmind-link{display:block;margin-top:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#0f766e;font-size:12px;font-weight:800;text-decoration:none;cursor:pointer}.xmind-image{display:block;max-width:100%;max-height:96px;margin-top:8px;border-radius:8px;object-fit:contain;background:#f8fafc}
.xmind-stage.is-panning .xmind-link{pointer-events:none}
.xmind-state{position:absolute;inset:0;z-index:4;display:flex;align-items:center;justify-content:center;padding:24px;color:#64748b;font-weight:800;text-align:center;background:rgba(238,243,247,.88)}.xmind-state[hidden]{display:none!important}.xmind-state.error{color:#b42318}
[data-viewer-theme='dark'] .xmind-viewer{--xmind-outline-text:#cbd5e1;--xmind-outline-hover-bg:rgba(52,211,153,.11);--xmind-outline-hover-text:#a7f3d0;--xmind-outline-active-bg:rgba(52,211,153,.17);--xmind-outline-active-text:#d1fae5;background:#111827;color:#e5eef8}
[data-viewer-theme='dark'] .xmind-toolbar,[data-viewer-theme='dark'] .xmind-tabs,[data-viewer-theme='dark'] .xmind-sidebar{border-color:rgba(139,148,158,.2);background:#111827;color:#e5eef8}
[data-viewer-theme='dark'] .xmind-actions button,[data-viewer-theme='dark'] .xmind-tabs button,[data-viewer-theme='dark'] .xmind-stats div{border-color:rgba(139,148,158,.24);background:#1f2937;color:#cbd5e1;box-shadow:none}
[data-viewer-theme='dark'] .xmind-title strong,[data-viewer-theme='dark'] .xmind-stats strong{color:#e5eef8}
[data-viewer-theme='dark'] .xmind-actions span,[data-viewer-theme='dark'] .xmind-stats span{color:#94a3b8}
[data-viewer-theme='dark'] .xmind-stage{background:linear-gradient(90deg,rgba(148,163,184,.08) 1px,transparent 1px),linear-gradient(180deg,rgba(148,163,184,.08) 1px,transparent 1px),#0d1117;background-size:32px 32px}
[data-viewer-theme='dark'] .xmind-edges path{stroke:#50647a}
[data-viewer-theme='dark'] .xmind-node{border-color:rgba(139,148,158,.26);background:#161b22;color:#e6edf3;box-shadow:0 14px 32px rgba(0,0,0,.36)}
[data-viewer-theme='dark'] .xmind-node.root{border-color:rgba(52,211,153,.35);background:linear-gradient(135deg,#123128,#161b22)}
[data-viewer-theme='dark'] .xmind-node.summary{background:#2a2416}[data-viewer-theme='dark'] .xmind-node.callout{background:#14283d}
[data-viewer-theme='dark'] .xmind-node h3{color:#f0f6fc}[data-viewer-theme='dark'] .xmind-note{color:#9aa7b8}[data-viewer-theme='dark'] .xmind-image{background:#21262d}
[data-viewer-theme='dark'] .xmind-state{background:rgba(13,17,23,.9);color:#cbd5e1}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .xmind-viewer{--xmind-outline-text:#cbd5e1;--xmind-outline-hover-bg:rgba(52,211,153,.11);--xmind-outline-hover-text:#a7f3d0;--xmind-outline-active-bg:rgba(52,211,153,.17);--xmind-outline-active-text:#d1fae5;background:#111827;color:#e5eef8}[data-viewer-theme='system'] .xmind-toolbar,[data-viewer-theme='system'] .xmind-tabs,[data-viewer-theme='system'] .xmind-sidebar{border-color:rgba(139,148,158,.2);background:#111827;color:#e5eef8}[data-viewer-theme='system'] .xmind-actions button,[data-viewer-theme='system'] .xmind-tabs button,[data-viewer-theme='system'] .xmind-stats div{border-color:rgba(139,148,158,.24);background:#1f2937;color:#cbd5e1;box-shadow:none}[data-viewer-theme='system'] .xmind-title strong,[data-viewer-theme='system'] .xmind-stats strong{color:#e5eef8}[data-viewer-theme='system'] .xmind-actions span,[data-viewer-theme='system'] .xmind-stats span{color:#94a3b8}[data-viewer-theme='system'] .xmind-stage{background:linear-gradient(90deg,rgba(148,163,184,.08) 1px,transparent 1px),linear-gradient(180deg,rgba(148,163,184,.08) 1px,transparent 1px),#0d1117;background-size:32px 32px}[data-viewer-theme='system'] .xmind-edges path{stroke:#50647a}[data-viewer-theme='system'] .xmind-node{border-color:rgba(139,148,158,.26);background:#161b22;color:#e6edf3;box-shadow:0 14px 32px rgba(0,0,0,.36)}[data-viewer-theme='system'] .xmind-node.root{border-color:rgba(52,211,153,.35);background:linear-gradient(135deg,#123128,#161b22)}[data-viewer-theme='system'] .xmind-node.summary{background:#2a2416}[data-viewer-theme='system'] .xmind-node.callout{background:#14283d}[data-viewer-theme='system'] .xmind-node h3{color:#f0f6fc}[data-viewer-theme='system'] .xmind-note{color:#9aa7b8}[data-viewer-theme='system'] .xmind-image{background:#21262d}[data-viewer-theme='system'] .xmind-state{background:rgba(13,17,23,.9);color:#cbd5e1}}
@media (pointer:coarse){.xmind-viewer{--xmind-outline-row-height:36px;--xmind-outline-font-size:13px}}
@media (max-width:860px){.xmind-body{grid-template-columns:1fr}.xmind-sidebar{display:none}.xmind-toolbar{align-items:flex-start;flex-direction:column}.xmind-actions{width:100%;justify-content:flex-end}}
`;
var createStyle = () => {
	const style = document.createElement("style");
	style.textContent = xmindStyle;
	return style;
};
var createElement = (tagName, className, text) => {
	const element = document.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var clampZoom = (value) => Math.min(2.5, Math.max(.25, Number(value.toFixed(2))));
var normalizeArray = (value) => Array.isArray(value) ? value : [];
var textValue = (value, fallback = "") => {
	return typeof value === "string" && value.trim() ? value.trim() : fallback;
};
var truncate = (value, max = 220) => {
	return value.length > max ? `${value.slice(0, max - 1)}...` : value;
};
var estimateNodeHeight = (node) => {
	let height = 34 + Math.max(1, Math.ceil(node.title.length / 22)) * 18;
	if (node.labels.length || node.markers.length || node.priority || node.progress || node.collapsed || node.detached || node.summary || node.callout) height += 28;
	if (node.note) height += Math.min(60, 18 + Math.ceil(node.note.length / 34) * 16);
	if (node.hyperlink) height += 24;
	if (node.image) height += 96;
	return Math.max(58, height);
};
var createMindNode = (node, depth, indexPath, counter) => {
	counter.value += 1;
	const data = node.data || {};
	const children = counter.value >= MAX_RENDER_NODES ? [] : normalizeArray(node.children).map((child, index) => createMindNode(child, depth + 1, `${indexPath}.${index + 1}`, counter));
	const view = {
		id: `xmind-node-${indexPath.replace(/[^a-z0-9]+/gi, "-")}`,
		title: textValue(data.text, depth === 0 ? "Central Topic" : "Untitled Topic"),
		labels: normalizeArray(data.label).map((item) => String(item)).filter(Boolean),
		markers: normalizeArray(data.markers).map((item) => String(item)).filter(Boolean),
		note: textValue(data.note),
		hyperlink: textValue(data.hyperlink),
		image: textValue(data.image),
		priority: typeof data.priority === "number" ? data.priority : void 0,
		progress: typeof data.progress === "number" ? data.progress : void 0,
		structure: textValue(data["xmind-structure"]),
		collapsed: data.expandState === "collapse",
		detached: data["xmind-detached"] === true,
		summary: data["xmind-summary"] === true,
		callout: data["xmind-callout"] === true,
		depth,
		children,
		x: 0,
		y: 0,
		width: depth === 0 ? ROOT_WIDTH : NODE_WIDTH,
		height: 0,
		subtreeHeight: 0
	};
	view.height = estimateNodeHeight(view);
	return view;
};
var walkMindNodes = (node, visit) => {
	visit(node);
	node.children.forEach((child) => walkMindNodes(child, visit));
};
var computeSubtree = (node) => {
	if (!node.children.length) {
		node.subtreeHeight = node.height;
		return node.subtreeHeight;
	}
	const childHeight = node.children.reduce((sum, child, index) => sum + computeSubtree(child) + (index > 0 ? SIBLING_GAP : 0), 0);
	node.subtreeHeight = Math.max(node.height, childHeight);
	return node.subtreeHeight;
};
var assignLayout = (node, top) => {
	node.x = CANVAS_PADDING + node.depth * 348;
	node.y = top + (node.subtreeHeight - node.height) / 2;
	if (!node.children.length) return;
	const childTotal = node.children.reduce((sum, child, index) => sum + child.subtreeHeight + (index > 0 ? SIBLING_GAP : 0), 0);
	let childTop = top + (node.subtreeHeight - childTotal) / 2;
	node.children.forEach((child) => {
		assignLayout(child, childTop);
		childTop += child.subtreeHeight + SIBLING_GAP;
	});
};
var createSheetView = (document, index) => {
	const counter = { value: 0 };
	const root = createMindNode(document.root || { data: { text: document.title || `Sheet ${index + 1}` } }, 0, String(index + 1), counter);
	computeSubtree(root);
	assignLayout(root, CANVAS_PADDING);
	let maxDepth = 0;
	let maxRight = 0;
	let maxBottom = 0;
	walkMindNodes(root, (node) => {
		maxDepth = Math.max(maxDepth, node.depth);
		maxRight = Math.max(maxRight, node.x + node.width);
		maxBottom = Math.max(maxBottom, node.y + node.height);
	});
	return {
		title: textValue(document.title, `Sheet ${index + 1}`),
		theme: textValue(document.theme, "-"),
		template: textValue(document.template, "-"),
		version: textValue(document.version, "-"),
		root,
		nodeCount: counter.value,
		maxDepth,
		width: Math.max(840, maxRight + CANVAS_PADDING),
		height: Math.max(520, maxBottom + CANVAS_PADDING)
	};
};
var loadXMindSheets = async (buffer, unrecognizedMessage) => {
	const zip = await import_lib.default.loadAsync(buffer);
	const resources = {};
	const resourceTasks = [];
	zip.forEach((path, entry) => {
		if (entry.dir || !path.startsWith("resources/") && !path.startsWith("attachments/")) return;
		resourceTasks.push(entry.async("uint8array").then((bytes) => {
			resources[path] = bytes;
		}));
	});
	await Promise.all(resourceTasks);
	const parserOptions = { resources: Object.keys(resources).length ? resources : null };
	const contentJson = zip.file(/(^|\/)content\.json$/i)[0];
	if (contentJson) return await parseXmind2020Json(await contentJson.async("text"), parserOptions);
	const contentXml = zip.file(/(^|\/)content\.xml$/i)[0];
	if (contentXml) {
		const commentsXml = zip.file(/(^|\/)comments\.xml$/i)[0];
		return await parseXmind8Xml(await contentXml.async("text"), {
			...parserOptions,
			commentsXml: commentsXml ? await commentsXml.async("text") : void 0
		});
	}
	throw new Error(unrecognizedMessage);
};
var badgeTexts = (node, t) => {
	const badges = [];
	if (node.priority) badges.push(`P${node.priority}`);
	if (node.progress) badges.push(node.progress === 10 ? t("xmind.badge.paused") : `${Math.min(100, Math.round(node.progress / 9 * 100))}%`);
	if (node.collapsed) badges.push(t("xmind.badge.collapsed"));
	if (node.detached) badges.push(t("xmind.badge.floating"));
	if (node.summary) badges.push(t("xmind.badge.summary"));
	if (node.callout) badges.push(t("xmind.badge.callout"));
	node.markers.slice(0, 4).forEach((marker) => badges.push(marker));
	return badges;
};
var createEdgePath = (parent, child) => {
	const startX = parent.x + parent.width;
	const startY = parent.y + parent.height / 2;
	const endX = child.x;
	const endY = child.y + child.height / 2;
	const handle = Math.max(48, (endX - startX) * .48);
	return `M${startX} ${startY} C${startX + handle} ${startY}, ${endX - handle} ${endY}, ${endX} ${endY}`;
};
var renderEdges = (svg, node) => {
	node.children.forEach((child) => {
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", createEdgePath(node, child));
		svg.append(path);
		renderEdges(svg, child);
	});
};
var createNodeElement = (node, scrollToNode, shouldSuppressClick, t) => {
	const card = createElement("article", [
		"xmind-node",
		node.depth === 0 ? "root" : "",
		node.detached ? "detached" : "",
		node.summary ? "summary" : "",
		node.callout ? "callout" : ""
	].filter(Boolean).join(" "));
	card.id = node.id;
	card.style.left = `${node.x}px`;
	card.style.top = `${node.y}px`;
	card.style.width = `${node.width}px`;
	card.style.minHeight = `${node.height}px`;
	card.append(createElement("h3", void 0, node.title));
	const badges = badgeTexts(node, t);
	if (badges.length) {
		const badgeList = createElement("div", "xmind-badges");
		badges.forEach((item) => badgeList.append(createElement("span", void 0, item)));
		card.append(badgeList);
	}
	if (node.labels.length) {
		const labelList = createElement("div", "xmind-labels");
		node.labels.slice(0, 8).forEach((item) => labelList.append(createElement("span", void 0, item)));
		card.append(labelList);
	}
	if (node.note) card.append(createElement("p", "xmind-note", truncate(node.note)));
	if (node.image) if (/^data:image\//i.test(node.image) || /^https?:\/\//i.test(node.image)) {
		const image = document.createElement("img");
		image.className = "xmind-image";
		image.alt = node.title;
		image.src = node.image;
		image.draggable = false;
		card.append(image);
	} else card.append(createElement("p", "xmind-note", t("xmind.imageResource", { name: node.image })));
	if (node.hyperlink) {
		const link = document.createElement("a");
		link.className = `xmind-link ${PANZOOM_EXCLUDE_CLASS}`;
		link.textContent = node.hyperlink;
		link.href = node.hyperlink.startsWith("http") ? node.hyperlink : "#";
		link.target = "_blank";
		link.rel = "noreferrer";
		link.draggable = false;
		card.append(link);
	}
	card.addEventListener("click", (event) => {
		if (shouldSuppressClick()) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		scrollToNode(node);
	});
	return card;
};
async function renderXMind(buffer, target, _type = "xmind", context) {
	var _a, _b;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const viewStateEmitter = createFileViewerViewStateChangeEmitter();
	let status = "loading";
	let errorMessage = "";
	let zoom = 1;
	let panX = 0;
	let panY = 0;
	let disposed = false;
	let activeSheetIndex = 0;
	let sheets = [];
	let suppressNodeClick = false;
	let spacePanning = false;
	let userAdjustedViewport = false;
	let resizeFrame;
	let panzoom = null;
	let programmaticPanzoomUpdate = false;
	let applyingViewState = false;
	let panStartState = null;
	const root = createElement("section", "xmind-viewer");
	root.dataset.viewerDensity = normalizeFileViewerUiDensity((_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.ui) === null || _b === void 0 ? void 0 : _b.density);
	root.dataset.viewerZoomProvider = "xmind";
	const toolbar = createElement("header", "xmind-toolbar");
	const title = createElement("div", "xmind-title");
	title.append(createElement("span", void 0, "XMIND MIND MAP"), createElement("strong", void 0, (context === null || context === void 0 ? void 0 : context.filename) || "XMind"));
	const actions = createElement("div", "xmind-actions");
	const zoomOutButton = createElement("button", void 0, "-");
	const zoomLabel = createElement("span", void 0, "100%");
	const zoomInButton = createElement("button", void 0, "+");
	const resetButton = createElement("button", void 0, t("xmind.toolbar.fit"));
	[
		zoomOutButton,
		zoomInButton,
		resetButton
	].forEach((button) => {
		button.type = "button";
	});
	zoomOutButton.title = t("xmind.toolbar.zoomOut");
	zoomInButton.title = t("xmind.toolbar.zoomIn");
	resetButton.title = t("xmind.toolbar.fitTitle");
	actions.append(zoomOutButton, zoomLabel, zoomInButton, resetButton);
	toolbar.append(title, actions);
	const tabs = createElement("nav", "xmind-tabs");
	const body = createElement("div", "xmind-body");
	const sidebar = createElement("aside", "xmind-sidebar");
	const stage = createElement("main", "xmind-stage");
	const ownerDocument = target.ownerDocument || document;
	const ownerWindow = ownerDocument.defaultView || window;
	stage.tabIndex = 0;
	stage.setAttribute("role", "application");
	stage.setAttribute("aria-label", "XMind canvas. Drag to pan, pinch on touch screens to zoom, double click to fit, use Ctrl or Command with wheel to zoom.");
	stage.setAttribute("aria-keyshortcuts", "Space ArrowLeft ArrowRight ArrowUp ArrowDown Control+0 Meta+0");
	const zoomBox = createElement("div", "xmind-zoom-box");
	const surface = createElement("div", "xmind-surface");
	const state = createElement("div", "xmind-state", t("xmind.state.loading"));
	zoomBox.append(surface);
	stage.append(zoomBox, state);
	body.append(sidebar, stage);
	root.append(toolbar, tabs, body);
	target.replaceChildren(createStyle(), root);
	const getZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < 2.5,
		canZoomOut: zoom > .25,
		canReset: zoom !== 1 || panX !== 0 || panY !== 0,
		minScale: .25,
		maxScale: 2.5
	});
	const getXMindViewState = () => {
		const sheet = sheets[activeSheetIndex];
		return {
			renderer: "mindmap",
			scale: zoom,
			zoom: getZoomState(),
			navigation: { mode: "sheet" },
			extra: {
				status,
				sheetIndex: activeSheetIndex,
				sheetTitle: sheet === null || sheet === void 0 ? void 0 : sheet.title,
				panX,
				panY,
				width: sheet === null || sheet === void 0 ? void 0 : sheet.width,
				height: sheet === null || sheet === void 0 ? void 0 : sheet.height
			}
		};
	};
	const emitViewStateChange = (action, source = "viewer") => {
		const state = getXMindViewState();
		if (!disposed && !applyingViewState) viewStateEmitter.emit(createFileViewerViewStateChange(state, {
			action,
			source
		}));
		return state;
	};
	const waitForFrame = () => new Promise((resolve) => {
		ownerWindow.requestAnimationFrame(() => resolve());
	});
	const clampPan = () => {
		const sheet = sheets[activeSheetIndex];
		if (!sheet) return;
		const viewportWidth = Math.max(1, stage.clientWidth);
		const viewportHeight = Math.max(1, stage.clientHeight);
		const scaledWidth = sheet.width * zoom;
		const scaledHeight = sheet.height * zoom;
		const resolveBounds = (viewportSize, contentSize) => {
			if (contentSize <= viewportSize) {
				const centered = (viewportSize - contentSize) / 2;
				const slack = Math.max(PAN_BOUNDARY_MARGIN, viewportSize * .45);
				return {
					min: centered - slack,
					max: centered + slack
				};
			}
			const visibleEdge = Math.min(Math.max(PAN_MIN_VISIBLE_PX, viewportSize * PAN_MIN_VISIBLE_RATIO), Math.max(PAN_MIN_VISIBLE_PX, contentSize * .35));
			return {
				min: visibleEdge - contentSize,
				max: viewportSize - visibleEdge
			};
		};
		const xBounds = resolveBounds(viewportWidth, scaledWidth);
		const yBounds = resolveBounds(viewportHeight, scaledHeight);
		panX = Math.min(xBounds.max, Math.max(xBounds.min, panX));
		panY = Math.min(yBounds.max, Math.max(yBounds.min, panY));
	};
	const syncPanzoomState = (markUserAdjusted) => {
		if (!panzoom) return;
		const pan = panzoom.getPan();
		panX = Number.isFinite(pan.x) ? pan.x : panX;
		panY = Number.isFinite(pan.y) ? pan.y : panY;
		zoom = clampZoom(panzoom.getScale());
		zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
		if (markUserAdjusted) userAdjustedViewport = true;
		zoomEmitter.emit();
		if (markUserAdjusted) emitViewStateChange("pan", "user");
	};
	const updatePanzoom = (update) => {
		programmaticPanzoomUpdate = true;
		try {
			update();
		} finally {
			programmaticPanzoomUpdate = false;
		}
		syncPanzoomState(false);
	};
	const applyZoom = () => {
		const sheet = sheets[activeSheetIndex];
		if (sheet) {
			zoomBox.style.width = `${sheet.width}px`;
			zoomBox.style.height = `${sheet.height}px`;
			surface.style.width = `${sheet.width}px`;
			surface.style.height = `${sheet.height}px`;
		}
		clampPan();
		surface.style.transform = "";
		if (panzoom) updatePanzoom(() => {
			panzoom === null || panzoom === void 0 || panzoom.zoom(zoom, {
				animate: false,
				force: true
			});
			panzoom === null || panzoom === void 0 || panzoom.pan(panX, panY, {
				animate: false,
				force: true
			});
		});
		else zoomBox.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
		zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
	};
	const setZoom = (scale) => {
		userAdjustedViewport = true;
		zoom = clampZoom(scale);
		applyZoom();
		zoomEmitter.emit();
		emitViewStateChange("zoom-change", "user");
		return getZoomState();
	};
	const setZoomAtPoint = (scale, clientX, clientY) => {
		const nextZoom = clampZoom(scale);
		if (nextZoom === zoom) return getZoomState();
		userAdjustedViewport = true;
		if (panzoom) updatePanzoom(() => {
			panzoom === null || panzoom === void 0 || panzoom.zoomToPoint(nextZoom, {
				clientX,
				clientY
			}, {
				animate: false,
				force: true
			});
		});
		else {
			const rect = stage.getBoundingClientRect();
			const viewportX = clientX - rect.left;
			const viewportY = clientY - rect.top;
			const logicalX = (viewportX - panX) / zoom;
			const logicalY = (viewportY - panY) / zoom;
			zoom = nextZoom;
			panX = viewportX - logicalX * zoom;
			panY = viewportY - logicalY * zoom;
			applyZoom();
			zoomEmitter.emit();
		}
		emitViewStateChange("zoom-change", "user");
		return getZoomState();
	};
	const setZoomAtStageCenter = (scale) => {
		const rect = stage.getBoundingClientRect();
		return setZoomAtPoint(scale, rect.left + rect.width / 2, rect.top + rect.height / 2);
	};
	const fitSheetToStage = (markAsUserReset = false) => {
		const sheet = sheets[activeSheetIndex];
		if (!sheet) return getZoomState();
		userAdjustedViewport = markAsUserReset ? false : userAdjustedViewport;
		const availableWidth = Math.max(1, stage.clientWidth - CANVAS_PADDING);
		const availableHeight = Math.max(1, stage.clientHeight - CANVAS_PADDING);
		zoom = clampZoom(Math.min(1, availableWidth / sheet.width, availableHeight / sheet.height));
		panX = (stage.clientWidth - sheet.width * zoom) / 2;
		panY = (stage.clientHeight - sheet.height * zoom) / 2;
		applyZoom();
		zoomEmitter.emit();
		if (markAsUserReset) emitViewStateChange("zoom-reset", "user");
		return getZoomState();
	};
	const applyXMindFit = (request) => {
		var _a, _b;
		const sheet = sheets[activeSheetIndex];
		if (!sheet) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "not-ready",
			provider: "view-state"
		};
		const availableWidth = Math.max(1, (request.viewportWidth || stage.clientWidth) - CANVAS_PADDING);
		const availableHeight = Math.max(1, (request.viewportHeight || stage.clientHeight) - CANVAS_PADDING);
		const widthScale = availableWidth / sheet.width;
		const heightScale = availableHeight / sheet.height;
		const containScale = Math.min(widthScale, heightScale);
		const requestedScale = (() => {
			switch (request.mode) {
				case "cover": return Math.max(widthScale, heightScale);
				case "width": return widthScale;
				case "height": return heightScale;
				case "actual": return 1;
				case "scale-down": return Math.min(1, containScale);
				default: return containScale;
			}
		})();
		zoom = clampZoom(Math.min((_a = request.maxScale) !== null && _a !== void 0 ? _a : 2.5, Math.max((_b = request.minScale) !== null && _b !== void 0 ? _b : .25, requestedScale)));
		panX = (stage.clientWidth - sheet.width * zoom) / 2;
		panY = (stage.clientHeight - sheet.height * zoom) / 2;
		applyZoom();
		zoomEmitter.emit();
		const state = emitViewStateChange("fit", request.source);
		return {
			applied: true,
			mode: request.mode,
			resize: request.resize,
			scale: state.scale,
			source: request.source,
			provider: "view-state",
			state
		};
	};
	const scrollToNode = (node) => {
		userAdjustedViewport = true;
		panX = stage.clientWidth / 2 - (node.x + node.width / 2) * zoom;
		panY = stage.clientHeight / 2 - (node.y + node.height / 2) * zoom;
		applyZoom();
		zoomEmitter.emit();
		emitViewStateChange("node-click", "user");
	};
	const renderSidebar = (sheet) => {
		sidebar.replaceChildren();
		const stats = createElement("div", "xmind-stats");
		[
			[t("xmind.stats.nodes"), sheet.nodeCount],
			[t("xmind.stats.depth"), sheet.maxDepth + 1],
			[t("xmind.stats.theme"), sheet.theme],
			[t("xmind.stats.template"), sheet.template]
		].forEach(([label, value]) => {
			const cell = document.createElement("div");
			cell.append(createElement("span", void 0, String(label)), createElement("strong", void 0, String(value)));
			stats.append(cell);
		});
		sidebar.append(stats);
		const outline = createElement("div", "xmind-outline");
		walkMindNodes(sheet.root, (node) => {
			const item = createElement("button", void 0, node.title);
			item.type = "button";
			item.style.paddingInlineStart = `${8 + Math.min(node.depth, 4) * 12}px`;
			item.title = node.title;
			item.setAttribute("aria-label", node.title);
			item.addEventListener("click", () => {
				outline.querySelectorAll("button[aria-current=\"true\"]").forEach((current) => {
					current.classList.remove("active");
					current.removeAttribute("aria-current");
				});
				item.classList.add("active");
				item.setAttribute("aria-current", "true");
				scrollToNode(node);
			});
			outline.append(item);
		});
		sidebar.append(outline);
	};
	const renderSheet = () => {
		const sheet = sheets[activeSheetIndex];
		if (!sheet) return;
		surface.replaceChildren();
		userAdjustedViewport = false;
		surface.style.width = `${sheet.width}px`;
		surface.style.height = `${sheet.height}px`;
		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.classList.add("xmind-edges");
		svg.setAttribute("width", String(sheet.width));
		svg.setAttribute("height", String(sheet.height));
		svg.setAttribute("viewBox", `0 0 ${sheet.width} ${sheet.height}`);
		renderEdges(svg, sheet.root);
		surface.append(svg);
		walkMindNodes(sheet.root, (node) => {
			surface.append(createNodeElement(node, scrollToNode, () => suppressNodeClick, t));
		});
		renderSidebar(sheet);
		applyZoom();
		requestAnimationFrame(() => fitSheetToStage());
	};
	const renderTabs = () => {
		tabs.replaceChildren();
		sheets.forEach((sheet, index) => {
			const button = createElement("button", index === activeSheetIndex ? "active" : "", sheet.title);
			button.type = "button";
			button.title = sheet.title;
			button.addEventListener("click", () => {
				activeSheetIndex = index;
				renderTabs();
				renderSheet();
				emitViewStateChange("sheet-change", "user");
			});
			tabs.append(button);
		});
	};
	const syncState = () => {
		state.hidden = status === "ready";
		state.classList.toggle("error", status === "error");
		state.textContent = status === "error" ? errorMessage : t("xmind.state.loading");
	};
	const load = async () => {
		status = "loading";
		errorMessage = "";
		syncState();
		try {
			const parsed = await loadXMindSheets(buffer, t("xmind.error.unrecognized"));
			if (disposed) return;
			if (!Array.isArray(parsed) || !parsed.length) throw new Error(t("xmind.error.noCanvas"));
			sheets = parsed.map(createSheetView);
			activeSheetIndex = 0;
			renderTabs();
			renderSheet();
			status = "ready";
			syncState();
			ownerWindow.requestAnimationFrame(() => emitViewStateChange("init", "viewer"));
		} catch (error) {
			if (disposed) return;
			console.error(error);
			errorMessage = error instanceof Error ? error.message : String(error);
			status = "error";
			syncState();
		}
	};
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoomAtStageCenter(zoom + .15),
		zoomOut: () => setZoomAtStageCenter(zoom - .15),
		resetZoom: () => fitSheetToStage(true),
		setZoom,
		fit: applyXMindFit,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	registerFileViewerViewStateProvider(root, {
		getState: getXMindViewState,
		async applyState(state, applyOptions = {}) {
			var _a, _b, _c, _d, _e;
			const source = applyOptions.source || "api";
			const action = applyOptions.action || "restore";
			const notify = applyOptions.notify !== false;
			const nextSheetIndex = Number((_a = state.extra) === null || _a === void 0 ? void 0 : _a.sheetIndex);
			const nextScale = Number((_b = state.scale) !== null && _b !== void 0 ? _b : (_c = state.zoom) === null || _c === void 0 ? void 0 : _c.scale);
			const nextPanX = Number((_d = state.extra) === null || _d === void 0 ? void 0 : _d.panX);
			const nextPanY = Number((_e = state.extra) === null || _e === void 0 ? void 0 : _e.panY);
			applyingViewState = true;
			try {
				if (Number.isInteger(nextSheetIndex) && sheets[nextSheetIndex] && nextSheetIndex !== activeSheetIndex) {
					activeSheetIndex = nextSheetIndex;
					renderTabs();
					renderSheet();
					await waitForFrame();
					await waitForFrame();
				}
				if (Number.isFinite(nextScale)) zoom = clampZoom(nextScale);
				if (Number.isFinite(nextPanX)) panX = nextPanX;
				if (Number.isFinite(nextPanY)) panY = nextPanY;
				userAdjustedViewport = true;
				applyZoom();
			} finally {
				applyingViewState = false;
			}
			if (notify) return emitViewStateChange(action, source);
			return getXMindViewState();
		},
		fit: applyXMindFit,
		subscribe: viewStateEmitter.subscribe
	});
	const getPanTargetElement = (targetValue) => {
		return targetValue instanceof (ownerWindow.Element || Element) ? targetValue : null;
	};
	const isPanBlockedTarget = (targetValue) => {
		const element = getPanTargetElement(targetValue);
		if (!element) return false;
		if (element.closest(".xmind-toolbar,.xmind-tabs,.xmind-sidebar")) return true;
		const interactive = element.closest("a,button,input,textarea,select,[contenteditable=\"true\"]");
		return Boolean(interactive && !interactive.closest(".xmind-node"));
	};
	const shouldPreventPanStartDefault = (targetValue) => {
		const element = getPanTargetElement(targetValue);
		return !(element === null || element === void 0 ? void 0 : element.closest("a[href],button,input,textarea,select,[contenteditable=\"true\"]"));
	};
	const setSpacePanning = (enabled) => {
		spacePanning = enabled;
		stage.classList.toggle("is-space-panning", enabled);
	};
	const focusStage = () => {
		try {
			stage.focus({ preventScroll: true });
		} catch {
			try {
				stage.focus();
			} catch {}
		}
	};
	const suppressNextNodeClick = () => {
		suppressNodeClick = true;
		ownerWindow.setTimeout(() => {
			suppressNodeClick = false;
		}, CLICK_SUPPRESSION_MS);
	};
	const onPanzoomStart = () => {
		focusStage();
		panStartState = {
			x: panX,
			y: panY,
			scale: zoom
		};
		stage.classList.add("is-panning");
	};
	const onPanzoomChange = () => {
		syncPanzoomState(!programmaticPanzoomUpdate);
	};
	const onPanzoomEnd = () => {
		syncPanzoomState(!programmaticPanzoomUpdate);
		stage.classList.remove("is-panning");
		if (panStartState) {
			if (Math.abs(panX - panStartState.x) + Math.abs(panY - panStartState.y) + Math.abs(zoom - panStartState.scale) * 100 > PAN_CLICK_THRESHOLD) suppressNextNodeClick();
		}
		panStartState = null;
	};
	const initializePanzoom = () => {
		panzoom = Panzoom(zoomBox, {
			canvas: true,
			cursor: "grab",
			minScale: .25,
			maxScale: 2.5,
			step: .15,
			animate: false,
			origin: "0 0",
			touchAction: "none",
			excludeClass: PANZOOM_EXCLUDE_CLASS,
			handleStartEvent: (event) => {
				if (status !== "ready" || !spacePanning && isPanBlockedTarget(event.target)) {
					event.preventDefault();
					event.stopPropagation();
					return;
				}
				if (shouldPreventPanStartDefault(event.target)) event.preventDefault();
				event.stopPropagation();
				focusStage();
			}
		});
		zoomBox.addEventListener("panzoomstart", onPanzoomStart);
		zoomBox.addEventListener("panzoomchange", onPanzoomChange);
		zoomBox.addEventListener("panzoomend", onPanzoomEnd);
		applyZoom();
	};
	const onStageWheel = (event) => {
		if (status !== "ready") return;
		event.preventDefault();
		if (!event.ctrlKey && !event.metaKey) {
			userAdjustedViewport = true;
			if (panzoom) updatePanzoom(() => {
				panzoom === null || panzoom === void 0 || panzoom.pan(-event.deltaX, -event.deltaY, {
					animate: false,
					force: true,
					relative: true
				});
			});
			else {
				panX -= event.deltaX;
				panY -= event.deltaY;
				applyZoom();
				zoomEmitter.emit();
			}
			emitViewStateChange("pan", "user");
			return;
		}
		const direction = event.deltaY > 0 ? -1 : 1;
		setZoomAtPoint(zoom + direction * WHEEL_ZOOM_STEP, event.clientX, event.clientY);
	};
	const onStageKeyDown = (event) => {
		if (status !== "ready") return;
		const step = event.shiftKey ? KEYBOARD_PAN_FAST_STEP : KEYBOARD_PAN_STEP;
		if (event.key === " ") {
			setSpacePanning(true);
			event.preventDefault();
			return;
		}
		if (event.key === "ArrowLeft") {
			userAdjustedViewport = true;
			panX += step;
		} else if (event.key === "ArrowRight") {
			userAdjustedViewport = true;
			panX -= step;
		} else if (event.key === "ArrowUp") {
			userAdjustedViewport = true;
			panY += step;
		} else if (event.key === "ArrowDown") {
			userAdjustedViewport = true;
			panY -= step;
		} else if ((event.key === "0" || event.key === "Home") && (event.ctrlKey || event.metaKey)) {
			fitSheetToStage(true);
			event.preventDefault();
			return;
		} else return;
		if (panzoom) updatePanzoom(() => {
			panzoom === null || panzoom === void 0 || panzoom.pan(panX, panY, {
				animate: false,
				force: true
			});
		});
		else {
			applyZoom();
			zoomEmitter.emit();
		}
		emitViewStateChange("pan", "user");
		event.preventDefault();
	};
	const onStageKeyUp = (event) => {
		if (event.key === " ") {
			setSpacePanning(false);
			event.preventDefault();
		}
	};
	const onStageDblClick = (event) => {
		if (status !== "ready" || isPanBlockedTarget(event.target)) return;
		fitSheetToStage(true);
		event.preventDefault();
	};
	const onStageDragStart = (event) => {
		event.preventDefault();
	};
	const onStageContextMenu = (event) => {
		if (stage.classList.contains("is-panning")) {
			event.preventDefault();
			event.stopPropagation();
		}
	};
	const onStageSelectStart = (event) => {
		if (stage.classList.contains("is-panning")) event.preventDefault();
	};
	const stopPanInteractions = () => {
		panStartState = null;
		stage.classList.remove("is-panning");
		setSpacePanning(false);
	};
	const onDocumentVisibilityChange = () => {
		if (ownerDocument.visibilityState === "hidden") stopPanInteractions();
	};
	const refreshViewport = () => {
		if (disposed || status !== "ready") return;
		if (userAdjustedViewport) {
			applyZoom();
			zoomEmitter.emit();
			return;
		}
		fitSheetToStage();
	};
	const scheduleViewportRefresh = () => {
		if (resizeFrame !== void 0) ownerWindow.cancelAnimationFrame(resizeFrame);
		resizeFrame = ownerWindow.requestAnimationFrame(() => {
			resizeFrame = void 0;
			refreshViewport();
		});
	};
	const resizeObserver = typeof ownerWindow.ResizeObserver === "function" ? new ownerWindow.ResizeObserver(scheduleViewportRefresh) : null;
	resizeObserver === null || resizeObserver === void 0 || resizeObserver.observe(stage);
	ownerWindow.addEventListener("resize", scheduleViewportRefresh);
	initializePanzoom();
	stage.addEventListener("wheel", onStageWheel, { passive: false });
	stage.addEventListener("keydown", onStageKeyDown);
	stage.addEventListener("keyup", onStageKeyUp);
	stage.addEventListener("dblclick", onStageDblClick);
	stage.addEventListener("dragstart", onStageDragStart);
	stage.addEventListener("contextmenu", onStageContextMenu);
	stage.addEventListener("selectstart", onStageSelectStart);
	ownerWindow.addEventListener("keyup", onStageKeyUp);
	ownerWindow.addEventListener("blur", stopPanInteractions);
	ownerDocument.addEventListener("visibilitychange", onDocumentVisibilityChange);
	zoomOutButton.addEventListener("click", () => setZoomAtStageCenter(zoom - .15));
	zoomInButton.addEventListener("click", () => setZoomAtStageCenter(zoom + .15));
	resetButton.addEventListener("click", () => fitSheetToStage(true));
	syncState();
	load();
	return {
		$el: root,
		unmount() {
			disposed = true;
			if (resizeFrame !== void 0) {
				ownerWindow.cancelAnimationFrame(resizeFrame);
				resizeFrame = void 0;
			}
			resizeObserver === null || resizeObserver === void 0 || resizeObserver.disconnect();
			unregisterFileViewerViewStateProvider(root);
			unregisterFileViewerZoomProvider(root);
			zoomBox.removeEventListener("panzoomstart", onPanzoomStart);
			zoomBox.removeEventListener("panzoomchange", onPanzoomChange);
			zoomBox.removeEventListener("panzoomend", onPanzoomEnd);
			panzoom === null || panzoom === void 0 || panzoom.destroy();
			panzoom = null;
			stage.removeEventListener("wheel", onStageWheel);
			stage.removeEventListener("keydown", onStageKeyDown);
			stage.removeEventListener("keyup", onStageKeyUp);
			stage.removeEventListener("dblclick", onStageDblClick);
			stage.removeEventListener("dragstart", onStageDragStart);
			stage.removeEventListener("contextmenu", onStageContextMenu);
			stage.removeEventListener("selectstart", onStageSelectStart);
			ownerWindow.removeEventListener("keyup", onStageKeyUp);
			ownerWindow.removeEventListener("resize", scheduleViewportRefresh);
			ownerWindow.removeEventListener("blur", stopPanInteractions);
			ownerDocument.removeEventListener("visibilitychange", onDocumentVisibilityChange);
			target.replaceChildren();
		}
	};
}
//#endregion
export { require_lib$1 as a, renderFileViewerMindMap as i, mindmapRenderer as n, require_pako as o, mindmapRendererDefinition as r, require___vite_browser_external as s, renderXMind as t };
