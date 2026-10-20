import { i as __require, o as __toESM, r as __exportAll, t as __commonJSMin } from "./rolldown-runtime-CEgmsyvS.js";
import { b as DEFAULT_THEME, c as getConfig, y as CACHE_PREFIX } from "./src-DzQcKxHP.js";
import { s as require___vite_browser_external } from "./file-viewer-mindmap-DFVq45rQ.js";
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/core.js
var require_core = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof exports === "object") module.exports = exports = factory();
		else if (typeof define === "function" && define.amd) define([], factory);
		else root.CryptoJS = factory();
	})(exports, function() {
		/**
		* CryptoJS core components.
		*/
		var CryptoJS = CryptoJS || function(Math, undefined) {
			var crypto;
			if (typeof window !== "undefined" && window.crypto) crypto = window.crypto;
			if (typeof self !== "undefined" && self.crypto) crypto = self.crypto;
			if (typeof globalThis !== "undefined" && globalThis.crypto) crypto = globalThis.crypto;
			if (!crypto && typeof window !== "undefined" && window.msCrypto) crypto = window.msCrypto;
			if (!crypto && typeof global !== "undefined" && global.crypto) crypto = global.crypto;
			if (!crypto && typeof __require === "function") try {
				crypto = require___vite_browser_external();
			} catch (err) {}
			var cryptoSecureRandomInt = function() {
				if (crypto) {
					if (typeof crypto.getRandomValues === "function") try {
						return crypto.getRandomValues(/* @__PURE__ */ new Uint32Array(1))[0];
					} catch (err) {}
					if (typeof crypto.randomBytes === "function") try {
						return crypto.randomBytes(4).readInt32LE();
					} catch (err) {}
				}
				throw new Error("Native crypto module could not be used to get secure random number.");
			};
			var create = Object.create || function() {
				function F() {}
				return function(obj) {
					var subtype;
					F.prototype = obj;
					subtype = new F();
					F.prototype = null;
					return subtype;
				};
			}();
			/**
			* CryptoJS namespace.
			*/
			var C = {};
			/**
			* Library namespace.
			*/
			var C_lib = C.lib = {};
			/**
			* Base object for prototypal inheritance.
			*/
			var Base = C_lib.Base = function() {
				return {
					/**
					* Creates a new object that inherits from this object.
					*
					* @param {Object} overrides Properties to copy into the new object.
					*
					* @return {Object} The new object.
					*
					* @static
					*
					* @example
					*
					*     var MyType = CryptoJS.lib.Base.extend({
					*         field: 'value',
					*
					*         method: function () {
					*         }
					*     });
					*/
					extend: function(overrides) {
						var subtype = create(this);
						if (overrides) subtype.mixIn(overrides);
						if (!subtype.hasOwnProperty("init") || this.init === subtype.init) subtype.init = function() {
							subtype.$super.init.apply(this, arguments);
						};
						subtype.init.prototype = subtype;
						subtype.$super = this;
						return subtype;
					},
					/**
					* Extends this object and runs the init method.
					* Arguments to create() will be passed to init().
					*
					* @return {Object} The new object.
					*
					* @static
					*
					* @example
					*
					*     var instance = MyType.create();
					*/
					create: function() {
						var instance = this.extend();
						instance.init.apply(instance, arguments);
						return instance;
					},
					/**
					* Initializes a newly created object.
					* Override this method to add some logic when your objects are created.
					*
					* @example
					*
					*     var MyType = CryptoJS.lib.Base.extend({
					*         init: function () {
					*             // ...
					*         }
					*     });
					*/
					init: function() {},
					/**
					* Copies properties into this object.
					*
					* @param {Object} properties The properties to mix in.
					*
					* @example
					*
					*     MyType.mixIn({
					*         field: 'value'
					*     });
					*/
					mixIn: function(properties) {
						for (var propertyName in properties) if (properties.hasOwnProperty(propertyName)) this[propertyName] = properties[propertyName];
						if (properties.hasOwnProperty("toString")) this.toString = properties.toString;
					},
					/**
					* Creates a copy of this object.
					*
					* @return {Object} The clone.
					*
					* @example
					*
					*     var clone = instance.clone();
					*/
					clone: function() {
						return this.init.prototype.extend(this);
					}
				};
			}();
			/**
			* An array of 32-bit words.
			*
			* @property {Array} words The array of 32-bit words.
			* @property {number} sigBytes The number of significant bytes in this word array.
			*/
			var WordArray = C_lib.WordArray = Base.extend({
				/**
				* Initializes a newly created word array.
				*
				* @param {Array} words (Optional) An array of 32-bit words.
				* @param {number} sigBytes (Optional) The number of significant bytes in the words.
				*
				* @example
				*
				*     var wordArray = CryptoJS.lib.WordArray.create();
				*     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
				*     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
				*/
				init: function(words, sigBytes) {
					words = this.words = words || [];
					if (sigBytes != undefined) this.sigBytes = sigBytes;
					else this.sigBytes = words.length * 4;
				},
				/**
				* Converts this word array to a string.
				*
				* @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
				*
				* @return {string} The stringified word array.
				*
				* @example
				*
				*     var string = wordArray + '';
				*     var string = wordArray.toString();
				*     var string = wordArray.toString(CryptoJS.enc.Utf8);
				*/
				toString: function(encoder) {
					return (encoder || Hex).stringify(this);
				},
				/**
				* Concatenates a word array to this word array.
				*
				* @param {WordArray} wordArray The word array to append.
				*
				* @return {WordArray} This word array.
				*
				* @example
				*
				*     wordArray1.concat(wordArray2);
				*/
				concat: function(wordArray) {
					var thisWords = this.words;
					var thatWords = wordArray.words;
					var thisSigBytes = this.sigBytes;
					var thatSigBytes = wordArray.sigBytes;
					this.clamp();
					if (thisSigBytes % 4) for (var i = 0; i < thatSigBytes; i++) {
						var thatByte = thatWords[i >>> 2] >>> 24 - i % 4 * 8 & 255;
						thisWords[thisSigBytes + i >>> 2] |= thatByte << 24 - (thisSigBytes + i) % 4 * 8;
					}
					else for (var j = 0; j < thatSigBytes; j += 4) thisWords[thisSigBytes + j >>> 2] = thatWords[j >>> 2];
					this.sigBytes += thatSigBytes;
					return this;
				},
				/**
				* Removes insignificant bits.
				*
				* @example
				*
				*     wordArray.clamp();
				*/
				clamp: function() {
					var words = this.words;
					var sigBytes = this.sigBytes;
					words[sigBytes >>> 2] &= 4294967295 << 32 - sigBytes % 4 * 8;
					words.length = Math.ceil(sigBytes / 4);
				},
				/**
				* Creates a copy of this word array.
				*
				* @return {WordArray} The clone.
				*
				* @example
				*
				*     var clone = wordArray.clone();
				*/
				clone: function() {
					var clone = Base.clone.call(this);
					clone.words = this.words.slice(0);
					return clone;
				},
				/**
				* Creates a word array filled with random bytes.
				*
				* @param {number} nBytes The number of random bytes to generate.
				*
				* @return {WordArray} The random word array.
				*
				* @static
				*
				* @example
				*
				*     var wordArray = CryptoJS.lib.WordArray.random(16);
				*/
				random: function(nBytes) {
					var words = [];
					for (var i = 0; i < nBytes; i += 4) words.push(cryptoSecureRandomInt());
					return new WordArray.init(words, nBytes);
				}
			});
			/**
			* Encoder namespace.
			*/
			var C_enc = C.enc = {};
			/**
			* Hex encoding strategy.
			*/
			var Hex = C_enc.Hex = {
				/**
				* Converts a word array to a hex string.
				*
				* @param {WordArray} wordArray The word array.
				*
				* @return {string} The hex string.
				*
				* @static
				*
				* @example
				*
				*     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
				*/
				stringify: function(wordArray) {
					var words = wordArray.words;
					var sigBytes = wordArray.sigBytes;
					var hexChars = [];
					for (var i = 0; i < sigBytes; i++) {
						var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
						hexChars.push((bite >>> 4).toString(16));
						hexChars.push((bite & 15).toString(16));
					}
					return hexChars.join("");
				},
				/**
				* Converts a hex string to a word array.
				*
				* @param {string} hexStr The hex string.
				*
				* @return {WordArray} The word array.
				*
				* @static
				*
				* @example
				*
				*     var wordArray = CryptoJS.enc.Hex.parse(hexString);
				*/
				parse: function(hexStr) {
					var hexStrLength = hexStr.length;
					var words = [];
					for (var i = 0; i < hexStrLength; i += 2) words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << 24 - i % 8 * 4;
					return new WordArray.init(words, hexStrLength / 2);
				}
			};
			/**
			* Latin1 encoding strategy.
			*/
			var Latin1 = C_enc.Latin1 = {
				/**
				* Converts a word array to a Latin1 string.
				*
				* @param {WordArray} wordArray The word array.
				*
				* @return {string} The Latin1 string.
				*
				* @static
				*
				* @example
				*
				*     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
				*/
				stringify: function(wordArray) {
					var words = wordArray.words;
					var sigBytes = wordArray.sigBytes;
					var latin1Chars = [];
					for (var i = 0; i < sigBytes; i++) {
						var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
						latin1Chars.push(String.fromCharCode(bite));
					}
					return latin1Chars.join("");
				},
				/**
				* Converts a Latin1 string to a word array.
				*
				* @param {string} latin1Str The Latin1 string.
				*
				* @return {WordArray} The word array.
				*
				* @static
				*
				* @example
				*
				*     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
				*/
				parse: function(latin1Str) {
					var latin1StrLength = latin1Str.length;
					var words = [];
					for (var i = 0; i < latin1StrLength; i++) words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
					return new WordArray.init(words, latin1StrLength);
				}
			};
			/**
			* UTF-8 encoding strategy.
			*/
			var Utf8 = C_enc.Utf8 = {
				/**
				* Converts a word array to a UTF-8 string.
				*
				* @param {WordArray} wordArray The word array.
				*
				* @return {string} The UTF-8 string.
				*
				* @static
				*
				* @example
				*
				*     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
				*/
				stringify: function(wordArray) {
					try {
						return decodeURIComponent(escape(Latin1.stringify(wordArray)));
					} catch (e) {
						throw new Error("Malformed UTF-8 data");
					}
				},
				/**
				* Converts a UTF-8 string to a word array.
				*
				* @param {string} utf8Str The UTF-8 string.
				*
				* @return {WordArray} The word array.
				*
				* @static
				*
				* @example
				*
				*     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
				*/
				parse: function(utf8Str) {
					return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
				}
			};
			/**
			* Abstract buffered block algorithm template.
			*
			* The property blockSize must be implemented in a concrete subtype.
			*
			* @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
			*/
			var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
				/**
				* Resets this block algorithm's data buffer to its initial state.
				*
				* @example
				*
				*     bufferedBlockAlgorithm.reset();
				*/
				reset: function() {
					this._data = new WordArray.init();
					this._nDataBytes = 0;
				},
				/**
				* Adds new data to this block algorithm's buffer.
				*
				* @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
				*
				* @example
				*
				*     bufferedBlockAlgorithm._append('data');
				*     bufferedBlockAlgorithm._append(wordArray);
				*/
				_append: function(data) {
					if (typeof data == "string") data = Utf8.parse(data);
					this._data.concat(data);
					this._nDataBytes += data.sigBytes;
				},
				/**
				* Processes available data blocks.
				*
				* This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
				*
				* @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
				*
				* @return {WordArray} The processed data.
				*
				* @example
				*
				*     var processedData = bufferedBlockAlgorithm._process();
				*     var processedData = bufferedBlockAlgorithm._process(!!'flush');
				*/
				_process: function(doFlush) {
					var processedWords;
					var data = this._data;
					var dataWords = data.words;
					var dataSigBytes = data.sigBytes;
					var blockSize = this.blockSize;
					var nBlocksReady = dataSigBytes / (blockSize * 4);
					if (doFlush) nBlocksReady = Math.ceil(nBlocksReady);
					else nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
					var nWordsReady = nBlocksReady * blockSize;
					var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);
					if (nWordsReady) {
						for (var offset = 0; offset < nWordsReady; offset += blockSize) this._doProcessBlock(dataWords, offset);
						processedWords = dataWords.splice(0, nWordsReady);
						data.sigBytes -= nBytesReady;
					}
					return new WordArray.init(processedWords, nBytesReady);
				},
				/**
				* Creates a copy of this object.
				*
				* @return {Object} The clone.
				*
				* @example
				*
				*     var clone = bufferedBlockAlgorithm.clone();
				*/
				clone: function() {
					var clone = Base.clone.call(this);
					clone._data = this._data.clone();
					return clone;
				},
				_minBufferSize: 0
			});
			C_lib.Hasher = BufferedBlockAlgorithm.extend({
				/**
				* Configuration options.
				*/
				cfg: Base.extend(),
				/**
				* Initializes a newly created hasher.
				*
				* @param {Object} cfg (Optional) The configuration options to use for this hash computation.
				*
				* @example
				*
				*     var hasher = CryptoJS.algo.SHA256.create();
				*/
				init: function(cfg) {
					this.cfg = this.cfg.extend(cfg);
					this.reset();
				},
				/**
				* Resets this hasher to its initial state.
				*
				* @example
				*
				*     hasher.reset();
				*/
				reset: function() {
					BufferedBlockAlgorithm.reset.call(this);
					this._doReset();
				},
				/**
				* Updates this hasher with a message.
				*
				* @param {WordArray|string} messageUpdate The message to append.
				*
				* @return {Hasher} This hasher.
				*
				* @example
				*
				*     hasher.update('message');
				*     hasher.update(wordArray);
				*/
				update: function(messageUpdate) {
					this._append(messageUpdate);
					this._process();
					return this;
				},
				/**
				* Finalizes the hash computation.
				* Note that the finalize operation is effectively a destructive, read-once operation.
				*
				* @param {WordArray|string} messageUpdate (Optional) A final message update.
				*
				* @return {WordArray} The hash.
				*
				* @example
				*
				*     var hash = hasher.finalize();
				*     var hash = hasher.finalize('message');
				*     var hash = hasher.finalize(wordArray);
				*/
				finalize: function(messageUpdate) {
					if (messageUpdate) this._append(messageUpdate);
					return this._doFinalize();
				},
				blockSize: 512 / 32,
				/**
				* Creates a shortcut function to a hasher's object interface.
				*
				* @param {Hasher} hasher The hasher to create a helper for.
				*
				* @return {Function} The shortcut function.
				*
				* @static
				*
				* @example
				*
				*     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
				*/
				_createHelper: function(hasher) {
					return function(message, cfg) {
						return new hasher.init(cfg).finalize(message);
					};
				},
				/**
				* Creates a shortcut function to the HMAC's object interface.
				*
				* @param {Hasher} hasher The hasher to use in this HMAC helper.
				*
				* @return {Function} The shortcut function.
				*
				* @static
				*
				* @example
				*
				*     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
				*/
				_createHmacHelper: function(hasher) {
					return function(message, key) {
						return new C_algo.HMAC.init(hasher, key).finalize(message);
					};
				}
			});
			/**
			* Algorithm namespace.
			*/
			var C_algo = C.algo = {};
			return C;
		}(Math);
		return CryptoJS;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/x64-core.js
var require_x64_core = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof exports === "object") module.exports = exports = factory(require_core());
		else if (typeof define === "function" && define.amd) define(["./core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function(undefined) {
			var C = CryptoJS;
			var C_lib = C.lib;
			var Base = C_lib.Base;
			var X32WordArray = C_lib.WordArray;
			/**
			* x64 namespace.
			*/
			var C_x64 = C.x64 = {};
			C_x64.Word = Base.extend({ 
			/**
			* Initializes a newly created 64-bit word.
			*
			* @param {number} high The high 32 bits.
			* @param {number} low The low 32 bits.
			*
			* @example
			*
			*     var x64Word = CryptoJS.x64.Word.create(0x00010203, 0x04050607);
			*/
init: function(high, low) {
				this.high = high;
				this.low = low;
			} });
			C_x64.WordArray = Base.extend({
				/**
				* Initializes a newly created word array.
				*
				* @param {Array} words (Optional) An array of CryptoJS.x64.Word objects.
				* @param {number} sigBytes (Optional) The number of significant bytes in the words.
				*
				* @example
				*
				*     var wordArray = CryptoJS.x64.WordArray.create();
				*
				*     var wordArray = CryptoJS.x64.WordArray.create([
				*         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
				*         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
				*     ]);
				*
				*     var wordArray = CryptoJS.x64.WordArray.create([
				*         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
				*         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
				*     ], 10);
				*/
				init: function(words, sigBytes) {
					words = this.words = words || [];
					if (sigBytes != undefined) this.sigBytes = sigBytes;
					else this.sigBytes = words.length * 8;
				},
				/**
				* Converts this 64-bit word array to a 32-bit word array.
				*
				* @return {CryptoJS.lib.WordArray} This word array's data as a 32-bit word array.
				*
				* @example
				*
				*     var x32WordArray = x64WordArray.toX32();
				*/
				toX32: function() {
					var x64Words = this.words;
					var x64WordsLength = x64Words.length;
					var x32Words = [];
					for (var i = 0; i < x64WordsLength; i++) {
						var x64Word = x64Words[i];
						x32Words.push(x64Word.high);
						x32Words.push(x64Word.low);
					}
					return X32WordArray.create(x32Words, this.sigBytes);
				},
				/**
				* Creates a copy of this word array.
				*
				* @return {X64WordArray} The clone.
				*
				* @example
				*
				*     var clone = x64WordArray.clone();
				*/
				clone: function() {
					var clone = Base.clone.call(this);
					var words = clone.words = this.words.slice(0);
					var wordsLength = words.length;
					for (var i = 0; i < wordsLength; i++) words[i] = words[i].clone();
					return clone;
				}
			});
		})();
		return CryptoJS;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/lib-typedarrays.js
var require_lib_typedarrays = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof exports === "object") module.exports = exports = factory(require_core());
		else if (typeof define === "function" && define.amd) define(["./core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			if (typeof ArrayBuffer != "function") return;
			var WordArray = CryptoJS.lib.WordArray;
			var superInit = WordArray.init;
			var subInit = WordArray.init = function(typedArray) {
				if (typedArray instanceof ArrayBuffer) typedArray = new Uint8Array(typedArray);
				if (typedArray instanceof Int8Array || typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray || typedArray instanceof Int16Array || typedArray instanceof Uint16Array || typedArray instanceof Int32Array || typedArray instanceof Uint32Array || typedArray instanceof Float32Array || typedArray instanceof Float64Array) typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
				if (typedArray instanceof Uint8Array) {
					var typedArrayByteLength = typedArray.byteLength;
					var words = [];
					for (var i = 0; i < typedArrayByteLength; i++) words[i >>> 2] |= typedArray[i] << 24 - i % 4 * 8;
					superInit.call(this, words, typedArrayByteLength);
				} else superInit.apply(this, arguments);
			};
			subInit.prototype = WordArray;
		})();
		return CryptoJS.lib.WordArray;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/enc-utf16.js
var require_enc_utf16 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof exports === "object") module.exports = exports = factory(require_core());
		else if (typeof define === "function" && define.amd) define(["./core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var WordArray = C.lib.WordArray;
			var C_enc = C.enc;
			C_enc.Utf16 = C_enc.Utf16BE = {
				/**
				* Converts a word array to a UTF-16 BE string.
				*
				* @param {WordArray} wordArray The word array.
				*
				* @return {string} The UTF-16 BE string.
				*
				* @static
				*
				* @example
				*
				*     var utf16String = CryptoJS.enc.Utf16.stringify(wordArray);
				*/
				stringify: function(wordArray) {
					var words = wordArray.words;
					var sigBytes = wordArray.sigBytes;
					var utf16Chars = [];
					for (var i = 0; i < sigBytes; i += 2) {
						var codePoint = words[i >>> 2] >>> 16 - i % 4 * 8 & 65535;
						utf16Chars.push(String.fromCharCode(codePoint));
					}
					return utf16Chars.join("");
				},
				/**
				* Converts a UTF-16 BE string to a word array.
				*
				* @param {string} utf16Str The UTF-16 BE string.
				*
				* @return {WordArray} The word array.
				*
				* @static
				*
				* @example
				*
				*     var wordArray = CryptoJS.enc.Utf16.parse(utf16String);
				*/
				parse: function(utf16Str) {
					var utf16StrLength = utf16Str.length;
					var words = [];
					for (var i = 0; i < utf16StrLength; i++) words[i >>> 1] |= utf16Str.charCodeAt(i) << 16 - i % 2 * 16;
					return WordArray.create(words, utf16StrLength * 2);
				}
			};
			/**
			* UTF-16 LE encoding strategy.
			*/
			C_enc.Utf16LE = {
				/**
				* Converts a word array to a UTF-16 LE string.
				*
				* @param {WordArray} wordArray The word array.
				*
				* @return {string} The UTF-16 LE string.
				*
				* @static
				*
				* @example
				*
				*     var utf16Str = CryptoJS.enc.Utf16LE.stringify(wordArray);
				*/
				stringify: function(wordArray) {
					var words = wordArray.words;
					var sigBytes = wordArray.sigBytes;
					var utf16Chars = [];
					for (var i = 0; i < sigBytes; i += 2) {
						var codePoint = swapEndian(words[i >>> 2] >>> 16 - i % 4 * 8 & 65535);
						utf16Chars.push(String.fromCharCode(codePoint));
					}
					return utf16Chars.join("");
				},
				/**
				* Converts a UTF-16 LE string to a word array.
				*
				* @param {string} utf16Str The UTF-16 LE string.
				*
				* @return {WordArray} The word array.
				*
				* @static
				*
				* @example
				*
				*     var wordArray = CryptoJS.enc.Utf16LE.parse(utf16Str);
				*/
				parse: function(utf16Str) {
					var utf16StrLength = utf16Str.length;
					var words = [];
					for (var i = 0; i < utf16StrLength; i++) words[i >>> 1] |= swapEndian(utf16Str.charCodeAt(i) << 16 - i % 2 * 16);
					return WordArray.create(words, utf16StrLength * 2);
				}
			};
			function swapEndian(word) {
				return word << 8 & 4278255360 | word >>> 8 & 16711935;
			}
		})();
		return CryptoJS.enc.Utf16;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/enc-base64.js
var require_enc_base64 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof exports === "object") module.exports = exports = factory(require_core());
		else if (typeof define === "function" && define.amd) define(["./core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var WordArray = C.lib.WordArray;
			var C_enc = C.enc;
			C_enc.Base64 = {
				/**
				* Converts a word array to a Base64 string.
				*
				* @param {WordArray} wordArray The word array.
				*
				* @return {string} The Base64 string.
				*
				* @static
				*
				* @example
				*
				*     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
				*/
				stringify: function(wordArray) {
					var words = wordArray.words;
					var sigBytes = wordArray.sigBytes;
					var map = this._map;
					wordArray.clamp();
					var base64Chars = [];
					for (var i = 0; i < sigBytes; i += 3) {
						var byte1 = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
						var byte2 = words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
						var byte3 = words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
						var triplet = byte1 << 16 | byte2 << 8 | byte3;
						for (var j = 0; j < 4 && i + j * .75 < sigBytes; j++) base64Chars.push(map.charAt(triplet >>> 6 * (3 - j) & 63));
					}
					var paddingChar = map.charAt(64);
					if (paddingChar) while (base64Chars.length % 4) base64Chars.push(paddingChar);
					return base64Chars.join("");
				},
				/**
				* Converts a Base64 string to a word array.
				*
				* @param {string} base64Str The Base64 string.
				*
				* @return {WordArray} The word array.
				*
				* @static
				*
				* @example
				*
				*     var wordArray = CryptoJS.enc.Base64.parse(base64String);
				*/
				parse: function(base64Str) {
					var base64StrLength = base64Str.length;
					var map = this._map;
					var reverseMap = this._reverseMap;
					if (!reverseMap) {
						reverseMap = this._reverseMap = [];
						for (var j = 0; j < map.length; j++) reverseMap[map.charCodeAt(j)] = j;
					}
					var paddingChar = map.charAt(64);
					if (paddingChar) {
						var paddingIndex = base64Str.indexOf(paddingChar);
						if (paddingIndex !== -1) base64StrLength = paddingIndex;
					}
					return parseLoop(base64Str, base64StrLength, reverseMap);
				},
				_map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
			};
			function parseLoop(base64Str, base64StrLength, reverseMap) {
				var words = [];
				var nBytes = 0;
				for (var i = 0; i < base64StrLength; i++) if (i % 4) {
					var bitsCombined = reverseMap[base64Str.charCodeAt(i - 1)] << i % 4 * 2 | reverseMap[base64Str.charCodeAt(i)] >>> 6 - i % 4 * 2;
					words[nBytes >>> 2] |= bitsCombined << 24 - nBytes % 4 * 8;
					nBytes++;
				}
				return WordArray.create(words, nBytes);
			}
		})();
		return CryptoJS.enc.Base64;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/enc-base64url.js
var require_enc_base64url = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof exports === "object") module.exports = exports = factory(require_core());
		else if (typeof define === "function" && define.amd) define(["./core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var WordArray = C.lib.WordArray;
			var C_enc = C.enc;
			C_enc.Base64url = {
				/**
				* Converts a word array to a Base64url string.
				*
				* @param {WordArray} wordArray The word array.
				*
				* @param {boolean} urlSafe Whether to use url safe
				*
				* @return {string} The Base64url string.
				*
				* @static
				*
				* @example
				*
				*     var base64String = CryptoJS.enc.Base64url.stringify(wordArray);
				*/
				stringify: function(wordArray, urlSafe) {
					if (urlSafe === void 0) urlSafe = true;
					var words = wordArray.words;
					var sigBytes = wordArray.sigBytes;
					var map = urlSafe ? this._safe_map : this._map;
					wordArray.clamp();
					var base64Chars = [];
					for (var i = 0; i < sigBytes; i += 3) {
						var byte1 = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
						var byte2 = words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
						var byte3 = words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
						var triplet = byte1 << 16 | byte2 << 8 | byte3;
						for (var j = 0; j < 4 && i + j * .75 < sigBytes; j++) base64Chars.push(map.charAt(triplet >>> 6 * (3 - j) & 63));
					}
					var paddingChar = map.charAt(64);
					if (paddingChar) while (base64Chars.length % 4) base64Chars.push(paddingChar);
					return base64Chars.join("");
				},
				/**
				* Converts a Base64url string to a word array.
				*
				* @param {string} base64Str The Base64url string.
				*
				* @param {boolean} urlSafe Whether to use url safe
				*
				* @return {WordArray} The word array.
				*
				* @static
				*
				* @example
				*
				*     var wordArray = CryptoJS.enc.Base64url.parse(base64String);
				*/
				parse: function(base64Str, urlSafe) {
					if (urlSafe === void 0) urlSafe = true;
					var base64StrLength = base64Str.length;
					var map = urlSafe ? this._safe_map : this._map;
					var reverseMap = this._reverseMap;
					if (!reverseMap) {
						reverseMap = this._reverseMap = [];
						for (var j = 0; j < map.length; j++) reverseMap[map.charCodeAt(j)] = j;
					}
					var paddingChar = map.charAt(64);
					if (paddingChar) {
						var paddingIndex = base64Str.indexOf(paddingChar);
						if (paddingIndex !== -1) base64StrLength = paddingIndex;
					}
					return parseLoop(base64Str, base64StrLength, reverseMap);
				},
				_map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
				_safe_map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
			};
			function parseLoop(base64Str, base64StrLength, reverseMap) {
				var words = [];
				var nBytes = 0;
				for (var i = 0; i < base64StrLength; i++) if (i % 4) {
					var bitsCombined = reverseMap[base64Str.charCodeAt(i - 1)] << i % 4 * 2 | reverseMap[base64Str.charCodeAt(i)] >>> 6 - i % 4 * 2;
					words[nBytes >>> 2] |= bitsCombined << 24 - nBytes % 4 * 8;
					nBytes++;
				}
				return WordArray.create(words, nBytes);
			}
		})();
		return CryptoJS.enc.Base64url;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/md5.js
var require_md5 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof exports === "object") module.exports = exports = factory(require_core());
		else if (typeof define === "function" && define.amd) define(["./core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function(Math) {
			var C = CryptoJS;
			var C_lib = C.lib;
			var WordArray = C_lib.WordArray;
			var Hasher = C_lib.Hasher;
			var C_algo = C.algo;
			var T = [];
			(function() {
				for (var i = 0; i < 64; i++) T[i] = Math.abs(Math.sin(i + 1)) * 4294967296 | 0;
			})();
			/**
			* MD5 hash algorithm.
			*/
			var MD5 = C_algo.MD5 = Hasher.extend({
				_doReset: function() {
					this._hash = new WordArray.init([
						1732584193,
						4023233417,
						2562383102,
						271733878
					]);
				},
				_doProcessBlock: function(M, offset) {
					for (var i = 0; i < 16; i++) {
						var offset_i = offset + i;
						var M_offset_i = M[offset_i];
						M[offset_i] = (M_offset_i << 8 | M_offset_i >>> 24) & 16711935 | (M_offset_i << 24 | M_offset_i >>> 8) & 4278255360;
					}
					var H = this._hash.words;
					var M_offset_0 = M[offset + 0];
					var M_offset_1 = M[offset + 1];
					var M_offset_2 = M[offset + 2];
					var M_offset_3 = M[offset + 3];
					var M_offset_4 = M[offset + 4];
					var M_offset_5 = M[offset + 5];
					var M_offset_6 = M[offset + 6];
					var M_offset_7 = M[offset + 7];
					var M_offset_8 = M[offset + 8];
					var M_offset_9 = M[offset + 9];
					var M_offset_10 = M[offset + 10];
					var M_offset_11 = M[offset + 11];
					var M_offset_12 = M[offset + 12];
					var M_offset_13 = M[offset + 13];
					var M_offset_14 = M[offset + 14];
					var M_offset_15 = M[offset + 15];
					var a = H[0];
					var b = H[1];
					var c = H[2];
					var d = H[3];
					a = FF(a, b, c, d, M_offset_0, 7, T[0]);
					d = FF(d, a, b, c, M_offset_1, 12, T[1]);
					c = FF(c, d, a, b, M_offset_2, 17, T[2]);
					b = FF(b, c, d, a, M_offset_3, 22, T[3]);
					a = FF(a, b, c, d, M_offset_4, 7, T[4]);
					d = FF(d, a, b, c, M_offset_5, 12, T[5]);
					c = FF(c, d, a, b, M_offset_6, 17, T[6]);
					b = FF(b, c, d, a, M_offset_7, 22, T[7]);
					a = FF(a, b, c, d, M_offset_8, 7, T[8]);
					d = FF(d, a, b, c, M_offset_9, 12, T[9]);
					c = FF(c, d, a, b, M_offset_10, 17, T[10]);
					b = FF(b, c, d, a, M_offset_11, 22, T[11]);
					a = FF(a, b, c, d, M_offset_12, 7, T[12]);
					d = FF(d, a, b, c, M_offset_13, 12, T[13]);
					c = FF(c, d, a, b, M_offset_14, 17, T[14]);
					b = FF(b, c, d, a, M_offset_15, 22, T[15]);
					a = GG(a, b, c, d, M_offset_1, 5, T[16]);
					d = GG(d, a, b, c, M_offset_6, 9, T[17]);
					c = GG(c, d, a, b, M_offset_11, 14, T[18]);
					b = GG(b, c, d, a, M_offset_0, 20, T[19]);
					a = GG(a, b, c, d, M_offset_5, 5, T[20]);
					d = GG(d, a, b, c, M_offset_10, 9, T[21]);
					c = GG(c, d, a, b, M_offset_15, 14, T[22]);
					b = GG(b, c, d, a, M_offset_4, 20, T[23]);
					a = GG(a, b, c, d, M_offset_9, 5, T[24]);
					d = GG(d, a, b, c, M_offset_14, 9, T[25]);
					c = GG(c, d, a, b, M_offset_3, 14, T[26]);
					b = GG(b, c, d, a, M_offset_8, 20, T[27]);
					a = GG(a, b, c, d, M_offset_13, 5, T[28]);
					d = GG(d, a, b, c, M_offset_2, 9, T[29]);
					c = GG(c, d, a, b, M_offset_7, 14, T[30]);
					b = GG(b, c, d, a, M_offset_12, 20, T[31]);
					a = HH(a, b, c, d, M_offset_5, 4, T[32]);
					d = HH(d, a, b, c, M_offset_8, 11, T[33]);
					c = HH(c, d, a, b, M_offset_11, 16, T[34]);
					b = HH(b, c, d, a, M_offset_14, 23, T[35]);
					a = HH(a, b, c, d, M_offset_1, 4, T[36]);
					d = HH(d, a, b, c, M_offset_4, 11, T[37]);
					c = HH(c, d, a, b, M_offset_7, 16, T[38]);
					b = HH(b, c, d, a, M_offset_10, 23, T[39]);
					a = HH(a, b, c, d, M_offset_13, 4, T[40]);
					d = HH(d, a, b, c, M_offset_0, 11, T[41]);
					c = HH(c, d, a, b, M_offset_3, 16, T[42]);
					b = HH(b, c, d, a, M_offset_6, 23, T[43]);
					a = HH(a, b, c, d, M_offset_9, 4, T[44]);
					d = HH(d, a, b, c, M_offset_12, 11, T[45]);
					c = HH(c, d, a, b, M_offset_15, 16, T[46]);
					b = HH(b, c, d, a, M_offset_2, 23, T[47]);
					a = II(a, b, c, d, M_offset_0, 6, T[48]);
					d = II(d, a, b, c, M_offset_7, 10, T[49]);
					c = II(c, d, a, b, M_offset_14, 15, T[50]);
					b = II(b, c, d, a, M_offset_5, 21, T[51]);
					a = II(a, b, c, d, M_offset_12, 6, T[52]);
					d = II(d, a, b, c, M_offset_3, 10, T[53]);
					c = II(c, d, a, b, M_offset_10, 15, T[54]);
					b = II(b, c, d, a, M_offset_1, 21, T[55]);
					a = II(a, b, c, d, M_offset_8, 6, T[56]);
					d = II(d, a, b, c, M_offset_15, 10, T[57]);
					c = II(c, d, a, b, M_offset_6, 15, T[58]);
					b = II(b, c, d, a, M_offset_13, 21, T[59]);
					a = II(a, b, c, d, M_offset_4, 6, T[60]);
					d = II(d, a, b, c, M_offset_11, 10, T[61]);
					c = II(c, d, a, b, M_offset_2, 15, T[62]);
					b = II(b, c, d, a, M_offset_9, 21, T[63]);
					H[0] = H[0] + a | 0;
					H[1] = H[1] + b | 0;
					H[2] = H[2] + c | 0;
					H[3] = H[3] + d | 0;
				},
				_doFinalize: function() {
					var data = this._data;
					var dataWords = data.words;
					var nBitsTotal = this._nDataBytes * 8;
					var nBitsLeft = data.sigBytes * 8;
					dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
					var nBitsTotalH = Math.floor(nBitsTotal / 4294967296);
					var nBitsTotalL = nBitsTotal;
					dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = (nBitsTotalH << 8 | nBitsTotalH >>> 24) & 16711935 | (nBitsTotalH << 24 | nBitsTotalH >>> 8) & 4278255360;
					dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = (nBitsTotalL << 8 | nBitsTotalL >>> 24) & 16711935 | (nBitsTotalL << 24 | nBitsTotalL >>> 8) & 4278255360;
					data.sigBytes = (dataWords.length + 1) * 4;
					this._process();
					var hash = this._hash;
					var H = hash.words;
					for (var i = 0; i < 4; i++) {
						var H_i = H[i];
						H[i] = (H_i << 8 | H_i >>> 24) & 16711935 | (H_i << 24 | H_i >>> 8) & 4278255360;
					}
					return hash;
				},
				clone: function() {
					var clone = Hasher.clone.call(this);
					clone._hash = this._hash.clone();
					return clone;
				}
			});
			function FF(a, b, c, d, x, s, t) {
				var n = a + (b & c | ~b & d) + x + t;
				return (n << s | n >>> 32 - s) + b;
			}
			function GG(a, b, c, d, x, s, t) {
				var n = a + (b & d | c & ~d) + x + t;
				return (n << s | n >>> 32 - s) + b;
			}
			function HH(a, b, c, d, x, s, t) {
				var n = a + (b ^ c ^ d) + x + t;
				return (n << s | n >>> 32 - s) + b;
			}
			function II(a, b, c, d, x, s, t) {
				var n = a + (c ^ (b | ~d)) + x + t;
				return (n << s | n >>> 32 - s) + b;
			}
			/**
			* Shortcut function to the hasher's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			*
			* @return {WordArray} The hash.
			*
			* @static
			*
			* @example
			*
			*     var hash = CryptoJS.MD5('message');
			*     var hash = CryptoJS.MD5(wordArray);
			*/
			C.MD5 = Hasher._createHelper(MD5);
			/**
			* Shortcut function to the HMAC's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			* @param {WordArray|string} key The secret key.
			*
			* @return {WordArray} The HMAC.
			*
			* @static
			*
			* @example
			*
			*     var hmac = CryptoJS.HmacMD5(message, key);
			*/
			C.HmacMD5 = Hasher._createHmacHelper(MD5);
		})(Math);
		return CryptoJS.MD5;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/sha1.js
var require_sha1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof exports === "object") module.exports = exports = factory(require_core());
		else if (typeof define === "function" && define.amd) define(["./core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var C_lib = C.lib;
			var WordArray = C_lib.WordArray;
			var Hasher = C_lib.Hasher;
			var C_algo = C.algo;
			var W = [];
			/**
			* SHA-1 hash algorithm.
			*/
			var SHA1 = C_algo.SHA1 = Hasher.extend({
				_doReset: function() {
					this._hash = new WordArray.init([
						1732584193,
						4023233417,
						2562383102,
						271733878,
						3285377520
					]);
				},
				_doProcessBlock: function(M, offset) {
					var H = this._hash.words;
					var a = H[0];
					var b = H[1];
					var c = H[2];
					var d = H[3];
					var e = H[4];
					for (var i = 0; i < 80; i++) {
						if (i < 16) W[i] = M[offset + i] | 0;
						else {
							var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
							W[i] = n << 1 | n >>> 31;
						}
						var t = (a << 5 | a >>> 27) + e + W[i];
						if (i < 20) t += (b & c | ~b & d) + 1518500249;
						else if (i < 40) t += (b ^ c ^ d) + 1859775393;
						else if (i < 60) t += (b & c | b & d | c & d) - 1894007588;
						else t += (b ^ c ^ d) - 899497514;
						e = d;
						d = c;
						c = b << 30 | b >>> 2;
						b = a;
						a = t;
					}
					H[0] = H[0] + a | 0;
					H[1] = H[1] + b | 0;
					H[2] = H[2] + c | 0;
					H[3] = H[3] + d | 0;
					H[4] = H[4] + e | 0;
				},
				_doFinalize: function() {
					var data = this._data;
					var dataWords = data.words;
					var nBitsTotal = this._nDataBytes * 8;
					var nBitsLeft = data.sigBytes * 8;
					dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
					dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(nBitsTotal / 4294967296);
					dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
					data.sigBytes = dataWords.length * 4;
					this._process();
					return this._hash;
				},
				clone: function() {
					var clone = Hasher.clone.call(this);
					clone._hash = this._hash.clone();
					return clone;
				}
			});
			/**
			* Shortcut function to the hasher's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			*
			* @return {WordArray} The hash.
			*
			* @static
			*
			* @example
			*
			*     var hash = CryptoJS.SHA1('message');
			*     var hash = CryptoJS.SHA1(wordArray);
			*/
			C.SHA1 = Hasher._createHelper(SHA1);
			/**
			* Shortcut function to the HMAC's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			* @param {WordArray|string} key The secret key.
			*
			* @return {WordArray} The HMAC.
			*
			* @static
			*
			* @example
			*
			*     var hmac = CryptoJS.HmacSHA1(message, key);
			*/
			C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
		})();
		return CryptoJS.SHA1;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/sha256.js
var require_sha256 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof exports === "object") module.exports = exports = factory(require_core());
		else if (typeof define === "function" && define.amd) define(["./core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function(Math) {
			var C = CryptoJS;
			var C_lib = C.lib;
			var WordArray = C_lib.WordArray;
			var Hasher = C_lib.Hasher;
			var C_algo = C.algo;
			var H = [];
			var K = [];
			(function() {
				function isPrime(n) {
					var sqrtN = Math.sqrt(n);
					for (var factor = 2; factor <= sqrtN; factor++) if (!(n % factor)) return false;
					return true;
				}
				function getFractionalBits(n) {
					return (n - (n | 0)) * 4294967296 | 0;
				}
				var n = 2;
				var nPrime = 0;
				while (nPrime < 64) {
					if (isPrime(n)) {
						if (nPrime < 8) H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
						K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));
						nPrime++;
					}
					n++;
				}
			})();
			var W = [];
			/**
			* SHA-256 hash algorithm.
			*/
			var SHA256 = C_algo.SHA256 = Hasher.extend({
				_doReset: function() {
					this._hash = new WordArray.init(H.slice(0));
				},
				_doProcessBlock: function(M, offset) {
					var H = this._hash.words;
					var a = H[0];
					var b = H[1];
					var c = H[2];
					var d = H[3];
					var e = H[4];
					var f = H[5];
					var g = H[6];
					var h = H[7];
					for (var i = 0; i < 64; i++) {
						if (i < 16) W[i] = M[offset + i] | 0;
						else {
							var gamma0x = W[i - 15];
							var gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
							var gamma1x = W[i - 2];
							var gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
							W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
						}
						var ch = e & f ^ ~e & g;
						var maj = a & b ^ a & c ^ b & c;
						var sigma0 = (a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22);
						var sigma1 = (e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25);
						var t1 = h + sigma1 + ch + K[i] + W[i];
						var t2 = sigma0 + maj;
						h = g;
						g = f;
						f = e;
						e = d + t1 | 0;
						d = c;
						c = b;
						b = a;
						a = t1 + t2 | 0;
					}
					H[0] = H[0] + a | 0;
					H[1] = H[1] + b | 0;
					H[2] = H[2] + c | 0;
					H[3] = H[3] + d | 0;
					H[4] = H[4] + e | 0;
					H[5] = H[5] + f | 0;
					H[6] = H[6] + g | 0;
					H[7] = H[7] + h | 0;
				},
				_doFinalize: function() {
					var data = this._data;
					var dataWords = data.words;
					var nBitsTotal = this._nDataBytes * 8;
					var nBitsLeft = data.sigBytes * 8;
					dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
					dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(nBitsTotal / 4294967296);
					dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
					data.sigBytes = dataWords.length * 4;
					this._process();
					return this._hash;
				},
				clone: function() {
					var clone = Hasher.clone.call(this);
					clone._hash = this._hash.clone();
					return clone;
				}
			});
			/**
			* Shortcut function to the hasher's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			*
			* @return {WordArray} The hash.
			*
			* @static
			*
			* @example
			*
			*     var hash = CryptoJS.SHA256('message');
			*     var hash = CryptoJS.SHA256(wordArray);
			*/
			C.SHA256 = Hasher._createHelper(SHA256);
			/**
			* Shortcut function to the HMAC's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			* @param {WordArray|string} key The secret key.
			*
			* @return {WordArray} The HMAC.
			*
			* @static
			*
			* @example
			*
			*     var hmac = CryptoJS.HmacSHA256(message, key);
			*/
			C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
		})(Math);
		return CryptoJS.SHA256;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/sha224.js
var require_sha224 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_sha256());
		else if (typeof define === "function" && define.amd) define(["./core", "./sha256"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var WordArray = C.lib.WordArray;
			var C_algo = C.algo;
			var SHA256 = C_algo.SHA256;
			/**
			* SHA-224 hash algorithm.
			*/
			var SHA224 = C_algo.SHA224 = SHA256.extend({
				_doReset: function() {
					this._hash = new WordArray.init([
						3238371032,
						914150663,
						812702999,
						4144912697,
						4290775857,
						1750603025,
						1694076839,
						3204075428
					]);
				},
				_doFinalize: function() {
					var hash = SHA256._doFinalize.call(this);
					hash.sigBytes -= 4;
					return hash;
				}
			});
			/**
			* Shortcut function to the hasher's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			*
			* @return {WordArray} The hash.
			*
			* @static
			*
			* @example
			*
			*     var hash = CryptoJS.SHA224('message');
			*     var hash = CryptoJS.SHA224(wordArray);
			*/
			C.SHA224 = SHA256._createHelper(SHA224);
			/**
			* Shortcut function to the HMAC's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			* @param {WordArray|string} key The secret key.
			*
			* @return {WordArray} The HMAC.
			*
			* @static
			*
			* @example
			*
			*     var hmac = CryptoJS.HmacSHA224(message, key);
			*/
			C.HmacSHA224 = SHA256._createHmacHelper(SHA224);
		})();
		return CryptoJS.SHA224;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/sha512.js
var require_sha512 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_x64_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./x64-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var Hasher = C.lib.Hasher;
			var C_x64 = C.x64;
			var X64Word = C_x64.Word;
			var X64WordArray = C_x64.WordArray;
			var C_algo = C.algo;
			function X64Word_create() {
				return X64Word.create.apply(X64Word, arguments);
			}
			var K = [
				X64Word_create(1116352408, 3609767458),
				X64Word_create(1899447441, 602891725),
				X64Word_create(3049323471, 3964484399),
				X64Word_create(3921009573, 2173295548),
				X64Word_create(961987163, 4081628472),
				X64Word_create(1508970993, 3053834265),
				X64Word_create(2453635748, 2937671579),
				X64Word_create(2870763221, 3664609560),
				X64Word_create(3624381080, 2734883394),
				X64Word_create(310598401, 1164996542),
				X64Word_create(607225278, 1323610764),
				X64Word_create(1426881987, 3590304994),
				X64Word_create(1925078388, 4068182383),
				X64Word_create(2162078206, 991336113),
				X64Word_create(2614888103, 633803317),
				X64Word_create(3248222580, 3479774868),
				X64Word_create(3835390401, 2666613458),
				X64Word_create(4022224774, 944711139),
				X64Word_create(264347078, 2341262773),
				X64Word_create(604807628, 2007800933),
				X64Word_create(770255983, 1495990901),
				X64Word_create(1249150122, 1856431235),
				X64Word_create(1555081692, 3175218132),
				X64Word_create(1996064986, 2198950837),
				X64Word_create(2554220882, 3999719339),
				X64Word_create(2821834349, 766784016),
				X64Word_create(2952996808, 2566594879),
				X64Word_create(3210313671, 3203337956),
				X64Word_create(3336571891, 1034457026),
				X64Word_create(3584528711, 2466948901),
				X64Word_create(113926993, 3758326383),
				X64Word_create(338241895, 168717936),
				X64Word_create(666307205, 1188179964),
				X64Word_create(773529912, 1546045734),
				X64Word_create(1294757372, 1522805485),
				X64Word_create(1396182291, 2643833823),
				X64Word_create(1695183700, 2343527390),
				X64Word_create(1986661051, 1014477480),
				X64Word_create(2177026350, 1206759142),
				X64Word_create(2456956037, 344077627),
				X64Word_create(2730485921, 1290863460),
				X64Word_create(2820302411, 3158454273),
				X64Word_create(3259730800, 3505952657),
				X64Word_create(3345764771, 106217008),
				X64Word_create(3516065817, 3606008344),
				X64Word_create(3600352804, 1432725776),
				X64Word_create(4094571909, 1467031594),
				X64Word_create(275423344, 851169720),
				X64Word_create(430227734, 3100823752),
				X64Word_create(506948616, 1363258195),
				X64Word_create(659060556, 3750685593),
				X64Word_create(883997877, 3785050280),
				X64Word_create(958139571, 3318307427),
				X64Word_create(1322822218, 3812723403),
				X64Word_create(1537002063, 2003034995),
				X64Word_create(1747873779, 3602036899),
				X64Word_create(1955562222, 1575990012),
				X64Word_create(2024104815, 1125592928),
				X64Word_create(2227730452, 2716904306),
				X64Word_create(2361852424, 442776044),
				X64Word_create(2428436474, 593698344),
				X64Word_create(2756734187, 3733110249),
				X64Word_create(3204031479, 2999351573),
				X64Word_create(3329325298, 3815920427),
				X64Word_create(3391569614, 3928383900),
				X64Word_create(3515267271, 566280711),
				X64Word_create(3940187606, 3454069534),
				X64Word_create(4118630271, 4000239992),
				X64Word_create(116418474, 1914138554),
				X64Word_create(174292421, 2731055270),
				X64Word_create(289380356, 3203993006),
				X64Word_create(460393269, 320620315),
				X64Word_create(685471733, 587496836),
				X64Word_create(852142971, 1086792851),
				X64Word_create(1017036298, 365543100),
				X64Word_create(1126000580, 2618297676),
				X64Word_create(1288033470, 3409855158),
				X64Word_create(1501505948, 4234509866),
				X64Word_create(1607167915, 987167468),
				X64Word_create(1816402316, 1246189591)
			];
			var W = [];
			(function() {
				for (var i = 0; i < 80; i++) W[i] = X64Word_create();
			})();
			/**
			* SHA-512 hash algorithm.
			*/
			var SHA512 = C_algo.SHA512 = Hasher.extend({
				_doReset: function() {
					this._hash = new X64WordArray.init([
						new X64Word.init(1779033703, 4089235720),
						new X64Word.init(3144134277, 2227873595),
						new X64Word.init(1013904242, 4271175723),
						new X64Word.init(2773480762, 1595750129),
						new X64Word.init(1359893119, 2917565137),
						new X64Word.init(2600822924, 725511199),
						new X64Word.init(528734635, 4215389547),
						new X64Word.init(1541459225, 327033209)
					]);
				},
				_doProcessBlock: function(M, offset) {
					var H = this._hash.words;
					var H0 = H[0];
					var H1 = H[1];
					var H2 = H[2];
					var H3 = H[3];
					var H4 = H[4];
					var H5 = H[5];
					var H6 = H[6];
					var H7 = H[7];
					var H0h = H0.high;
					var H0l = H0.low;
					var H1h = H1.high;
					var H1l = H1.low;
					var H2h = H2.high;
					var H2l = H2.low;
					var H3h = H3.high;
					var H3l = H3.low;
					var H4h = H4.high;
					var H4l = H4.low;
					var H5h = H5.high;
					var H5l = H5.low;
					var H6h = H6.high;
					var H6l = H6.low;
					var H7h = H7.high;
					var H7l = H7.low;
					var ah = H0h;
					var al = H0l;
					var bh = H1h;
					var bl = H1l;
					var ch = H2h;
					var cl = H2l;
					var dh = H3h;
					var dl = H3l;
					var eh = H4h;
					var el = H4l;
					var fh = H5h;
					var fl = H5l;
					var gh = H6h;
					var gl = H6l;
					var hh = H7h;
					var hl = H7l;
					for (var i = 0; i < 80; i++) {
						var Wil;
						var Wih;
						var Wi = W[i];
						if (i < 16) {
							Wih = Wi.high = M[offset + i * 2] | 0;
							Wil = Wi.low = M[offset + i * 2 + 1] | 0;
						} else {
							var gamma0x = W[i - 15];
							var gamma0xh = gamma0x.high;
							var gamma0xl = gamma0x.low;
							var gamma0h = (gamma0xh >>> 1 | gamma0xl << 31) ^ (gamma0xh >>> 8 | gamma0xl << 24) ^ gamma0xh >>> 7;
							var gamma0l = (gamma0xl >>> 1 | gamma0xh << 31) ^ (gamma0xl >>> 8 | gamma0xh << 24) ^ (gamma0xl >>> 7 | gamma0xh << 25);
							var gamma1x = W[i - 2];
							var gamma1xh = gamma1x.high;
							var gamma1xl = gamma1x.low;
							var gamma1h = (gamma1xh >>> 19 | gamma1xl << 13) ^ (gamma1xh << 3 | gamma1xl >>> 29) ^ gamma1xh >>> 6;
							var gamma1l = (gamma1xl >>> 19 | gamma1xh << 13) ^ (gamma1xl << 3 | gamma1xh >>> 29) ^ (gamma1xl >>> 6 | gamma1xh << 26);
							var Wi7 = W[i - 7];
							var Wi7h = Wi7.high;
							var Wi7l = Wi7.low;
							var Wi16 = W[i - 16];
							var Wi16h = Wi16.high;
							var Wi16l = Wi16.low;
							Wil = gamma0l + Wi7l;
							Wih = gamma0h + Wi7h + (Wil >>> 0 < gamma0l >>> 0 ? 1 : 0);
							Wil = Wil + gamma1l;
							Wih = Wih + gamma1h + (Wil >>> 0 < gamma1l >>> 0 ? 1 : 0);
							Wil = Wil + Wi16l;
							Wih = Wih + Wi16h + (Wil >>> 0 < Wi16l >>> 0 ? 1 : 0);
							Wi.high = Wih;
							Wi.low = Wil;
						}
						var chh = eh & fh ^ ~eh & gh;
						var chl = el & fl ^ ~el & gl;
						var majh = ah & bh ^ ah & ch ^ bh & ch;
						var majl = al & bl ^ al & cl ^ bl & cl;
						var sigma0h = (ah >>> 28 | al << 4) ^ (ah << 30 | al >>> 2) ^ (ah << 25 | al >>> 7);
						var sigma0l = (al >>> 28 | ah << 4) ^ (al << 30 | ah >>> 2) ^ (al << 25 | ah >>> 7);
						var sigma1h = (eh >>> 14 | el << 18) ^ (eh >>> 18 | el << 14) ^ (eh << 23 | el >>> 9);
						var sigma1l = (el >>> 14 | eh << 18) ^ (el >>> 18 | eh << 14) ^ (el << 23 | eh >>> 9);
						var Ki = K[i];
						var Kih = Ki.high;
						var Kil = Ki.low;
						var t1l = hl + sigma1l;
						var t1h = hh + sigma1h + (t1l >>> 0 < hl >>> 0 ? 1 : 0);
						var t1l = t1l + chl;
						var t1h = t1h + chh + (t1l >>> 0 < chl >>> 0 ? 1 : 0);
						var t1l = t1l + Kil;
						var t1h = t1h + Kih + (t1l >>> 0 < Kil >>> 0 ? 1 : 0);
						var t1l = t1l + Wil;
						var t1h = t1h + Wih + (t1l >>> 0 < Wil >>> 0 ? 1 : 0);
						var t2l = sigma0l + majl;
						var t2h = sigma0h + majh + (t2l >>> 0 < sigma0l >>> 0 ? 1 : 0);
						hh = gh;
						hl = gl;
						gh = fh;
						gl = fl;
						fh = eh;
						fl = el;
						el = dl + t1l | 0;
						eh = dh + t1h + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
						dh = ch;
						dl = cl;
						ch = bh;
						cl = bl;
						bh = ah;
						bl = al;
						al = t1l + t2l | 0;
						ah = t1h + t2h + (al >>> 0 < t1l >>> 0 ? 1 : 0) | 0;
					}
					H0l = H0.low = H0l + al;
					H0.high = H0h + ah + (H0l >>> 0 < al >>> 0 ? 1 : 0);
					H1l = H1.low = H1l + bl;
					H1.high = H1h + bh + (H1l >>> 0 < bl >>> 0 ? 1 : 0);
					H2l = H2.low = H2l + cl;
					H2.high = H2h + ch + (H2l >>> 0 < cl >>> 0 ? 1 : 0);
					H3l = H3.low = H3l + dl;
					H3.high = H3h + dh + (H3l >>> 0 < dl >>> 0 ? 1 : 0);
					H4l = H4.low = H4l + el;
					H4.high = H4h + eh + (H4l >>> 0 < el >>> 0 ? 1 : 0);
					H5l = H5.low = H5l + fl;
					H5.high = H5h + fh + (H5l >>> 0 < fl >>> 0 ? 1 : 0);
					H6l = H6.low = H6l + gl;
					H6.high = H6h + gh + (H6l >>> 0 < gl >>> 0 ? 1 : 0);
					H7l = H7.low = H7l + hl;
					H7.high = H7h + hh + (H7l >>> 0 < hl >>> 0 ? 1 : 0);
				},
				_doFinalize: function() {
					var data = this._data;
					var dataWords = data.words;
					var nBitsTotal = this._nDataBytes * 8;
					var nBitsLeft = data.sigBytes * 8;
					dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
					dataWords[(nBitsLeft + 128 >>> 10 << 5) + 30] = Math.floor(nBitsTotal / 4294967296);
					dataWords[(nBitsLeft + 128 >>> 10 << 5) + 31] = nBitsTotal;
					data.sigBytes = dataWords.length * 4;
					this._process();
					return this._hash.toX32();
				},
				clone: function() {
					var clone = Hasher.clone.call(this);
					clone._hash = this._hash.clone();
					return clone;
				},
				blockSize: 1024 / 32
			});
			/**
			* Shortcut function to the hasher's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			*
			* @return {WordArray} The hash.
			*
			* @static
			*
			* @example
			*
			*     var hash = CryptoJS.SHA512('message');
			*     var hash = CryptoJS.SHA512(wordArray);
			*/
			C.SHA512 = Hasher._createHelper(SHA512);
			/**
			* Shortcut function to the HMAC's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			* @param {WordArray|string} key The secret key.
			*
			* @return {WordArray} The HMAC.
			*
			* @static
			*
			* @example
			*
			*     var hmac = CryptoJS.HmacSHA512(message, key);
			*/
			C.HmacSHA512 = Hasher._createHmacHelper(SHA512);
		})();
		return CryptoJS.SHA512;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/sha384.js
var require_sha384 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_x64_core(), require_sha512());
		else if (typeof define === "function" && define.amd) define([
			"./core",
			"./x64-core",
			"./sha512"
		], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var C_x64 = C.x64;
			var X64Word = C_x64.Word;
			var X64WordArray = C_x64.WordArray;
			var C_algo = C.algo;
			var SHA512 = C_algo.SHA512;
			/**
			* SHA-384 hash algorithm.
			*/
			var SHA384 = C_algo.SHA384 = SHA512.extend({
				_doReset: function() {
					this._hash = new X64WordArray.init([
						new X64Word.init(3418070365, 3238371032),
						new X64Word.init(1654270250, 914150663),
						new X64Word.init(2438529370, 812702999),
						new X64Word.init(355462360, 4144912697),
						new X64Word.init(1731405415, 4290775857),
						new X64Word.init(2394180231, 1750603025),
						new X64Word.init(3675008525, 1694076839),
						new X64Word.init(1203062813, 3204075428)
					]);
				},
				_doFinalize: function() {
					var hash = SHA512._doFinalize.call(this);
					hash.sigBytes -= 16;
					return hash;
				}
			});
			/**
			* Shortcut function to the hasher's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			*
			* @return {WordArray} The hash.
			*
			* @static
			*
			* @example
			*
			*     var hash = CryptoJS.SHA384('message');
			*     var hash = CryptoJS.SHA384(wordArray);
			*/
			C.SHA384 = SHA512._createHelper(SHA384);
			/**
			* Shortcut function to the HMAC's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			* @param {WordArray|string} key The secret key.
			*
			* @return {WordArray} The HMAC.
			*
			* @static
			*
			* @example
			*
			*     var hmac = CryptoJS.HmacSHA384(message, key);
			*/
			C.HmacSHA384 = SHA512._createHmacHelper(SHA384);
		})();
		return CryptoJS.SHA384;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/sha3.js
var require_sha3 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_x64_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./x64-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function(Math) {
			var C = CryptoJS;
			var C_lib = C.lib;
			var WordArray = C_lib.WordArray;
			var Hasher = C_lib.Hasher;
			var X64Word = C.x64.Word;
			var C_algo = C.algo;
			var RHO_OFFSETS = [];
			var PI_INDEXES = [];
			var ROUND_CONSTANTS = [];
			(function() {
				var x = 1, y = 0;
				for (var t = 0; t < 24; t++) {
					RHO_OFFSETS[x + 5 * y] = (t + 1) * (t + 2) / 2 % 64;
					var newX = y % 5;
					var newY = (2 * x + 3 * y) % 5;
					x = newX;
					y = newY;
				}
				for (var x = 0; x < 5; x++) for (var y = 0; y < 5; y++) PI_INDEXES[x + 5 * y] = y + (2 * x + 3 * y) % 5 * 5;
				var LFSR = 1;
				for (var i = 0; i < 24; i++) {
					var roundConstantMsw = 0;
					var roundConstantLsw = 0;
					for (var j = 0; j < 7; j++) {
						if (LFSR & 1) {
							var bitPosition = (1 << j) - 1;
							if (bitPosition < 32) roundConstantLsw ^= 1 << bitPosition;
							else roundConstantMsw ^= 1 << bitPosition - 32;
						}
						if (LFSR & 128) LFSR = LFSR << 1 ^ 113;
						else LFSR <<= 1;
					}
					ROUND_CONSTANTS[i] = X64Word.create(roundConstantMsw, roundConstantLsw);
				}
			})();
			var T = [];
			(function() {
				for (var i = 0; i < 25; i++) T[i] = X64Word.create();
			})();
			/**
			* SHA-3 hash algorithm.
			*/
			var SHA3 = C_algo.SHA3 = Hasher.extend({
				/**
				* Configuration options.
				*
				* @property {number} outputLength
				*   The desired number of bits in the output hash.
				*   Only values permitted are: 224, 256, 384, 512.
				*   Default: 512
				*/
				cfg: Hasher.cfg.extend({ outputLength: 512 }),
				_doReset: function() {
					var state = this._state = [];
					for (var i = 0; i < 25; i++) state[i] = new X64Word.init();
					this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
				},
				_doProcessBlock: function(M, offset) {
					var state = this._state;
					var nBlockSizeLanes = this.blockSize / 2;
					for (var i = 0; i < nBlockSizeLanes; i++) {
						var M2i = M[offset + 2 * i];
						var M2i1 = M[offset + 2 * i + 1];
						M2i = (M2i << 8 | M2i >>> 24) & 16711935 | (M2i << 24 | M2i >>> 8) & 4278255360;
						M2i1 = (M2i1 << 8 | M2i1 >>> 24) & 16711935 | (M2i1 << 24 | M2i1 >>> 8) & 4278255360;
						var lane = state[i];
						lane.high ^= M2i1;
						lane.low ^= M2i;
					}
					for (var round = 0; round < 24; round++) {
						for (var x = 0; x < 5; x++) {
							var tMsw = 0, tLsw = 0;
							for (var y = 0; y < 5; y++) {
								var lane = state[x + 5 * y];
								tMsw ^= lane.high;
								tLsw ^= lane.low;
							}
							var Tx = T[x];
							Tx.high = tMsw;
							Tx.low = tLsw;
						}
						for (var x = 0; x < 5; x++) {
							var Tx4 = T[(x + 4) % 5];
							var Tx1 = T[(x + 1) % 5];
							var Tx1Msw = Tx1.high;
							var Tx1Lsw = Tx1.low;
							var tMsw = Tx4.high ^ (Tx1Msw << 1 | Tx1Lsw >>> 31);
							var tLsw = Tx4.low ^ (Tx1Lsw << 1 | Tx1Msw >>> 31);
							for (var y = 0; y < 5; y++) {
								var lane = state[x + 5 * y];
								lane.high ^= tMsw;
								lane.low ^= tLsw;
							}
						}
						for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
							var tMsw;
							var tLsw;
							var lane = state[laneIndex];
							var laneMsw = lane.high;
							var laneLsw = lane.low;
							var rhoOffset = RHO_OFFSETS[laneIndex];
							if (rhoOffset < 32) {
								tMsw = laneMsw << rhoOffset | laneLsw >>> 32 - rhoOffset;
								tLsw = laneLsw << rhoOffset | laneMsw >>> 32 - rhoOffset;
							} else {
								tMsw = laneLsw << rhoOffset - 32 | laneMsw >>> 64 - rhoOffset;
								tLsw = laneMsw << rhoOffset - 32 | laneLsw >>> 64 - rhoOffset;
							}
							var TPiLane = T[PI_INDEXES[laneIndex]];
							TPiLane.high = tMsw;
							TPiLane.low = tLsw;
						}
						var T0 = T[0];
						var state0 = state[0];
						T0.high = state0.high;
						T0.low = state0.low;
						for (var x = 0; x < 5; x++) for (var y = 0; y < 5; y++) {
							var laneIndex = x + 5 * y;
							var lane = state[laneIndex];
							var TLane = T[laneIndex];
							var Tx1Lane = T[(x + 1) % 5 + 5 * y];
							var Tx2Lane = T[(x + 2) % 5 + 5 * y];
							lane.high = TLane.high ^ ~Tx1Lane.high & Tx2Lane.high;
							lane.low = TLane.low ^ ~Tx1Lane.low & Tx2Lane.low;
						}
						var lane = state[0];
						var roundConstant = ROUND_CONSTANTS[round];
						lane.high ^= roundConstant.high;
						lane.low ^= roundConstant.low;
					}
				},
				_doFinalize: function() {
					var data = this._data;
					var dataWords = data.words;
					this._nDataBytes * 8;
					var nBitsLeft = data.sigBytes * 8;
					var blockSizeBits = this.blockSize * 32;
					dataWords[nBitsLeft >>> 5] |= 1 << 24 - nBitsLeft % 32;
					dataWords[(Math.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits >>> 5) - 1] |= 128;
					data.sigBytes = dataWords.length * 4;
					this._process();
					var state = this._state;
					var outputLengthBytes = this.cfg.outputLength / 8;
					var outputLengthLanes = outputLengthBytes / 8;
					var hashWords = [];
					for (var i = 0; i < outputLengthLanes; i++) {
						var lane = state[i];
						var laneMsw = lane.high;
						var laneLsw = lane.low;
						laneMsw = (laneMsw << 8 | laneMsw >>> 24) & 16711935 | (laneMsw << 24 | laneMsw >>> 8) & 4278255360;
						laneLsw = (laneLsw << 8 | laneLsw >>> 24) & 16711935 | (laneLsw << 24 | laneLsw >>> 8) & 4278255360;
						hashWords.push(laneLsw);
						hashWords.push(laneMsw);
					}
					return new WordArray.init(hashWords, outputLengthBytes);
				},
				clone: function() {
					var clone = Hasher.clone.call(this);
					var state = clone._state = this._state.slice(0);
					for (var i = 0; i < 25; i++) state[i] = state[i].clone();
					return clone;
				}
			});
			/**
			* Shortcut function to the hasher's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			*
			* @return {WordArray} The hash.
			*
			* @static
			*
			* @example
			*
			*     var hash = CryptoJS.SHA3('message');
			*     var hash = CryptoJS.SHA3(wordArray);
			*/
			C.SHA3 = Hasher._createHelper(SHA3);
			/**
			* Shortcut function to the HMAC's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			* @param {WordArray|string} key The secret key.
			*
			* @return {WordArray} The HMAC.
			*
			* @static
			*
			* @example
			*
			*     var hmac = CryptoJS.HmacSHA3(message, key);
			*/
			C.HmacSHA3 = Hasher._createHmacHelper(SHA3);
		})(Math);
		return CryptoJS.SHA3;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/ripemd160.js
var require_ripemd160 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof exports === "object") module.exports = exports = factory(require_core());
		else if (typeof define === "function" && define.amd) define(["./core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		/** @preserve
		(c) 2012 by Cédric Mesnil. All rights reserved.
		
		Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
		
		- Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
		- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
		
		THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
		*/
		(function(Math) {
			var C = CryptoJS;
			var C_lib = C.lib;
			var WordArray = C_lib.WordArray;
			var Hasher = C_lib.Hasher;
			var C_algo = C.algo;
			var _zl = WordArray.create([
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				9,
				10,
				11,
				12,
				13,
				14,
				15,
				7,
				4,
				13,
				1,
				10,
				6,
				15,
				3,
				12,
				0,
				9,
				5,
				2,
				14,
				11,
				8,
				3,
				10,
				14,
				4,
				9,
				15,
				8,
				1,
				2,
				7,
				0,
				6,
				13,
				11,
				5,
				12,
				1,
				9,
				11,
				10,
				0,
				8,
				12,
				4,
				13,
				3,
				7,
				15,
				14,
				5,
				6,
				2,
				4,
				0,
				5,
				9,
				7,
				12,
				2,
				10,
				14,
				1,
				3,
				8,
				11,
				6,
				15,
				13
			]);
			var _zr = WordArray.create([
				5,
				14,
				7,
				0,
				9,
				2,
				11,
				4,
				13,
				6,
				15,
				8,
				1,
				10,
				3,
				12,
				6,
				11,
				3,
				7,
				0,
				13,
				5,
				10,
				14,
				15,
				8,
				12,
				4,
				9,
				1,
				2,
				15,
				5,
				1,
				3,
				7,
				14,
				6,
				9,
				11,
				8,
				12,
				2,
				10,
				0,
				4,
				13,
				8,
				6,
				4,
				1,
				3,
				11,
				15,
				0,
				5,
				12,
				2,
				13,
				9,
				7,
				10,
				14,
				12,
				15,
				10,
				4,
				1,
				5,
				8,
				7,
				6,
				2,
				13,
				14,
				0,
				3,
				9,
				11
			]);
			var _sl = WordArray.create([
				11,
				14,
				15,
				12,
				5,
				8,
				7,
				9,
				11,
				13,
				14,
				15,
				6,
				7,
				9,
				8,
				7,
				6,
				8,
				13,
				11,
				9,
				7,
				15,
				7,
				12,
				15,
				9,
				11,
				7,
				13,
				12,
				11,
				13,
				6,
				7,
				14,
				9,
				13,
				15,
				14,
				8,
				13,
				6,
				5,
				12,
				7,
				5,
				11,
				12,
				14,
				15,
				14,
				15,
				9,
				8,
				9,
				14,
				5,
				6,
				8,
				6,
				5,
				12,
				9,
				15,
				5,
				11,
				6,
				8,
				13,
				12,
				5,
				12,
				13,
				14,
				11,
				8,
				5,
				6
			]);
			var _sr = WordArray.create([
				8,
				9,
				9,
				11,
				13,
				15,
				15,
				5,
				7,
				7,
				8,
				11,
				14,
				14,
				12,
				6,
				9,
				13,
				15,
				7,
				12,
				8,
				9,
				11,
				7,
				7,
				12,
				7,
				6,
				15,
				13,
				11,
				9,
				7,
				15,
				11,
				8,
				6,
				6,
				14,
				12,
				13,
				5,
				14,
				13,
				13,
				7,
				5,
				15,
				5,
				8,
				11,
				14,
				14,
				6,
				14,
				6,
				9,
				12,
				9,
				12,
				5,
				15,
				8,
				8,
				5,
				12,
				9,
				12,
				5,
				14,
				6,
				8,
				13,
				6,
				5,
				15,
				13,
				11,
				11
			]);
			var _hl = WordArray.create([
				0,
				1518500249,
				1859775393,
				2400959708,
				2840853838
			]);
			var _hr = WordArray.create([
				1352829926,
				1548603684,
				1836072691,
				2053994217,
				0
			]);
			/**
			* RIPEMD160 hash algorithm.
			*/
			var RIPEMD160 = C_algo.RIPEMD160 = Hasher.extend({
				_doReset: function() {
					this._hash = WordArray.create([
						1732584193,
						4023233417,
						2562383102,
						271733878,
						3285377520
					]);
				},
				_doProcessBlock: function(M, offset) {
					for (var i = 0; i < 16; i++) {
						var offset_i = offset + i;
						var M_offset_i = M[offset_i];
						M[offset_i] = (M_offset_i << 8 | M_offset_i >>> 24) & 16711935 | (M_offset_i << 24 | M_offset_i >>> 8) & 4278255360;
					}
					var H = this._hash.words;
					var hl = _hl.words;
					var hr = _hr.words;
					var zl = _zl.words;
					var zr = _zr.words;
					var sl = _sl.words;
					var sr = _sr.words;
					var al, bl, cl, dl, el;
					var ar = al = H[0], br = bl = H[1], cr = cl = H[2], dr = dl = H[3], er = el = H[4];
					var t;
					for (var i = 0; i < 80; i += 1) {
						t = al + M[offset + zl[i]] | 0;
						if (i < 16) t += f1(bl, cl, dl) + hl[0];
						else if (i < 32) t += f2(bl, cl, dl) + hl[1];
						else if (i < 48) t += f3(bl, cl, dl) + hl[2];
						else if (i < 64) t += f4(bl, cl, dl) + hl[3];
						else t += f5(bl, cl, dl) + hl[4];
						t = t | 0;
						t = rotl(t, sl[i]);
						t = t + el | 0;
						al = el;
						el = dl;
						dl = rotl(cl, 10);
						cl = bl;
						bl = t;
						t = ar + M[offset + zr[i]] | 0;
						if (i < 16) t += f5(br, cr, dr) + hr[0];
						else if (i < 32) t += f4(br, cr, dr) + hr[1];
						else if (i < 48) t += f3(br, cr, dr) + hr[2];
						else if (i < 64) t += f2(br, cr, dr) + hr[3];
						else t += f1(br, cr, dr) + hr[4];
						t = t | 0;
						t = rotl(t, sr[i]);
						t = t + er | 0;
						ar = er;
						er = dr;
						dr = rotl(cr, 10);
						cr = br;
						br = t;
					}
					t = H[1] + cl + dr | 0;
					H[1] = H[2] + dl + er | 0;
					H[2] = H[3] + el + ar | 0;
					H[3] = H[4] + al + br | 0;
					H[4] = H[0] + bl + cr | 0;
					H[0] = t;
				},
				_doFinalize: function() {
					var data = this._data;
					var dataWords = data.words;
					var nBitsTotal = this._nDataBytes * 8;
					var nBitsLeft = data.sigBytes * 8;
					dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
					dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = (nBitsTotal << 8 | nBitsTotal >>> 24) & 16711935 | (nBitsTotal << 24 | nBitsTotal >>> 8) & 4278255360;
					data.sigBytes = (dataWords.length + 1) * 4;
					this._process();
					var hash = this._hash;
					var H = hash.words;
					for (var i = 0; i < 5; i++) {
						var H_i = H[i];
						H[i] = (H_i << 8 | H_i >>> 24) & 16711935 | (H_i << 24 | H_i >>> 8) & 4278255360;
					}
					return hash;
				},
				clone: function() {
					var clone = Hasher.clone.call(this);
					clone._hash = this._hash.clone();
					return clone;
				}
			});
			function f1(x, y, z) {
				return x ^ y ^ z;
			}
			function f2(x, y, z) {
				return x & y | ~x & z;
			}
			function f3(x, y, z) {
				return (x | ~y) ^ z;
			}
			function f4(x, y, z) {
				return x & z | y & ~z;
			}
			function f5(x, y, z) {
				return x ^ (y | ~z);
			}
			function rotl(x, n) {
				return x << n | x >>> 32 - n;
			}
			/**
			* Shortcut function to the hasher's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			*
			* @return {WordArray} The hash.
			*
			* @static
			*
			* @example
			*
			*     var hash = CryptoJS.RIPEMD160('message');
			*     var hash = CryptoJS.RIPEMD160(wordArray);
			*/
			C.RIPEMD160 = Hasher._createHelper(RIPEMD160);
			/**
			* Shortcut function to the HMAC's object interface.
			*
			* @param {WordArray|string} message The message to hash.
			* @param {WordArray|string} key The secret key.
			*
			* @return {WordArray} The HMAC.
			*
			* @static
			*
			* @example
			*
			*     var hmac = CryptoJS.HmacRIPEMD160(message, key);
			*/
			C.HmacRIPEMD160 = Hasher._createHmacHelper(RIPEMD160);
		})(Math);
		return CryptoJS.RIPEMD160;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/hmac.js
var require_hmac = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		if (typeof exports === "object") module.exports = exports = factory(require_core());
		else if (typeof define === "function" && define.amd) define(["./core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var Base = C.lib.Base;
			var Utf8 = C.enc.Utf8;
			var C_algo = C.algo;
			C_algo.HMAC = Base.extend({
				/**
				* Initializes a newly created HMAC.
				*
				* @param {Hasher} hasher The hash algorithm to use.
				* @param {WordArray|string} key The secret key.
				*
				* @example
				*
				*     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
				*/
				init: function(hasher, key) {
					hasher = this._hasher = new hasher.init();
					if (typeof key == "string") key = Utf8.parse(key);
					var hasherBlockSize = hasher.blockSize;
					var hasherBlockSizeBytes = hasherBlockSize * 4;
					if (key.sigBytes > hasherBlockSizeBytes) key = hasher.finalize(key);
					key.clamp();
					var oKey = this._oKey = key.clone();
					var iKey = this._iKey = key.clone();
					var oKeyWords = oKey.words;
					var iKeyWords = iKey.words;
					for (var i = 0; i < hasherBlockSize; i++) {
						oKeyWords[i] ^= 1549556828;
						iKeyWords[i] ^= 909522486;
					}
					oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;
					this.reset();
				},
				/**
				* Resets this HMAC to its initial state.
				*
				* @example
				*
				*     hmacHasher.reset();
				*/
				reset: function() {
					var hasher = this._hasher;
					hasher.reset();
					hasher.update(this._iKey);
				},
				/**
				* Updates this HMAC with a message.
				*
				* @param {WordArray|string} messageUpdate The message to append.
				*
				* @return {HMAC} This HMAC instance.
				*
				* @example
				*
				*     hmacHasher.update('message');
				*     hmacHasher.update(wordArray);
				*/
				update: function(messageUpdate) {
					this._hasher.update(messageUpdate);
					return this;
				},
				/**
				* Finalizes the HMAC computation.
				* Note that the finalize operation is effectively a destructive, read-once operation.
				*
				* @param {WordArray|string} messageUpdate (Optional) A final message update.
				*
				* @return {WordArray} The HMAC.
				*
				* @example
				*
				*     var hmac = hmacHasher.finalize();
				*     var hmac = hmacHasher.finalize('message');
				*     var hmac = hmacHasher.finalize(wordArray);
				*/
				finalize: function(messageUpdate) {
					var hasher = this._hasher;
					var innerHash = hasher.finalize(messageUpdate);
					hasher.reset();
					return hasher.finalize(this._oKey.clone().concat(innerHash));
				}
			});
		})();
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/pbkdf2.js
var require_pbkdf2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_sha256(), require_hmac());
		else if (typeof define === "function" && define.amd) define([
			"./core",
			"./sha256",
			"./hmac"
		], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var C_lib = C.lib;
			var Base = C_lib.Base;
			var WordArray = C_lib.WordArray;
			var C_algo = C.algo;
			var SHA256 = C_algo.SHA256;
			var HMAC = C_algo.HMAC;
			/**
			* Password-Based Key Derivation Function 2 algorithm.
			*/
			var PBKDF2 = C_algo.PBKDF2 = Base.extend({
				/**
				* Configuration options.
				*
				* @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
				* @property {Hasher} hasher The hasher to use. Default: SHA256
				* @property {number} iterations The number of iterations to perform. Default: 250000
				*/
				cfg: Base.extend({
					keySize: 128 / 32,
					hasher: SHA256,
					iterations: 25e4
				}),
				/**
				* Initializes a newly created key derivation function.
				*
				* @param {Object} cfg (Optional) The configuration options to use for the derivation.
				*
				* @example
				*
				*     var kdf = CryptoJS.algo.PBKDF2.create();
				*     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8 });
				*     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8, iterations: 1000 });
				*/
				init: function(cfg) {
					this.cfg = this.cfg.extend(cfg);
				},
				/**
				* Computes the Password-Based Key Derivation Function 2.
				*
				* @param {WordArray|string} password The password.
				* @param {WordArray|string} salt A salt.
				*
				* @return {WordArray} The derived key.
				*
				* @example
				*
				*     var key = kdf.compute(password, salt);
				*/
				compute: function(password, salt) {
					var cfg = this.cfg;
					var hmac = HMAC.create(cfg.hasher, password);
					var derivedKey = WordArray.create();
					var blockIndex = WordArray.create([1]);
					var derivedKeyWords = derivedKey.words;
					var blockIndexWords = blockIndex.words;
					var keySize = cfg.keySize;
					var iterations = cfg.iterations;
					while (derivedKeyWords.length < keySize) {
						var block = hmac.update(salt).finalize(blockIndex);
						hmac.reset();
						var blockWords = block.words;
						var blockWordsLength = blockWords.length;
						var intermediate = block;
						for (var i = 1; i < iterations; i++) {
							intermediate = hmac.finalize(intermediate);
							hmac.reset();
							var intermediateWords = intermediate.words;
							for (var j = 0; j < blockWordsLength; j++) blockWords[j] ^= intermediateWords[j];
						}
						derivedKey.concat(block);
						blockIndexWords[0]++;
					}
					derivedKey.sigBytes = keySize * 4;
					return derivedKey;
				}
			});
			/**
			* Computes the Password-Based Key Derivation Function 2.
			*
			* @param {WordArray|string} password The password.
			* @param {WordArray|string} salt A salt.
			* @param {Object} cfg (Optional) The configuration options to use for this computation.
			*
			* @return {WordArray} The derived key.
			*
			* @static
			*
			* @example
			*
			*     var key = CryptoJS.PBKDF2(password, salt);
			*     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8 });
			*     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8, iterations: 1000 });
			*/
			C.PBKDF2 = function(password, salt, cfg) {
				return PBKDF2.create(cfg).compute(password, salt);
			};
		})();
		return CryptoJS.PBKDF2;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/evpkdf.js
var require_evpkdf = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_sha1(), require_hmac());
		else if (typeof define === "function" && define.amd) define([
			"./core",
			"./sha1",
			"./hmac"
		], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var C_lib = C.lib;
			var Base = C_lib.Base;
			var WordArray = C_lib.WordArray;
			var C_algo = C.algo;
			var MD5 = C_algo.MD5;
			/**
			* This key derivation function is meant to conform with EVP_BytesToKey.
			* www.openssl.org/docs/crypto/EVP_BytesToKey.html
			*/
			var EvpKDF = C_algo.EvpKDF = Base.extend({
				/**
				* Configuration options.
				*
				* @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
				* @property {Hasher} hasher The hash algorithm to use. Default: MD5
				* @property {number} iterations The number of iterations to perform. Default: 1
				*/
				cfg: Base.extend({
					keySize: 128 / 32,
					hasher: MD5,
					iterations: 1
				}),
				/**
				* Initializes a newly created key derivation function.
				*
				* @param {Object} cfg (Optional) The configuration options to use for the derivation.
				*
				* @example
				*
				*     var kdf = CryptoJS.algo.EvpKDF.create();
				*     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
				*     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
				*/
				init: function(cfg) {
					this.cfg = this.cfg.extend(cfg);
				},
				/**
				* Derives a key from a password.
				*
				* @param {WordArray|string} password The password.
				* @param {WordArray|string} salt A salt.
				*
				* @return {WordArray} The derived key.
				*
				* @example
				*
				*     var key = kdf.compute(password, salt);
				*/
				compute: function(password, salt) {
					var block;
					var cfg = this.cfg;
					var hasher = cfg.hasher.create();
					var derivedKey = WordArray.create();
					var derivedKeyWords = derivedKey.words;
					var keySize = cfg.keySize;
					var iterations = cfg.iterations;
					while (derivedKeyWords.length < keySize) {
						if (block) hasher.update(block);
						block = hasher.update(password).finalize(salt);
						hasher.reset();
						for (var i = 1; i < iterations; i++) {
							block = hasher.finalize(block);
							hasher.reset();
						}
						derivedKey.concat(block);
					}
					derivedKey.sigBytes = keySize * 4;
					return derivedKey;
				}
			});
			/**
			* Derives a key from a password.
			*
			* @param {WordArray|string} password The password.
			* @param {WordArray|string} salt A salt.
			* @param {Object} cfg (Optional) The configuration options to use for this computation.
			*
			* @return {WordArray} The derived key.
			*
			* @static
			*
			* @example
			*
			*     var key = CryptoJS.EvpKDF(password, salt);
			*     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8 });
			*     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8, iterations: 1000 });
			*/
			C.EvpKDF = function(password, salt, cfg) {
				return EvpKDF.create(cfg).compute(password, salt);
			};
		})();
		return CryptoJS.EvpKDF;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/cipher-core.js
var require_cipher_core = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_evpkdf());
		else if (typeof define === "function" && define.amd) define(["./core", "./evpkdf"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		/**
		* Cipher core components.
		*/
		CryptoJS.lib.Cipher || function(undefined) {
			var C = CryptoJS;
			var C_lib = C.lib;
			var Base = C_lib.Base;
			var WordArray = C_lib.WordArray;
			var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
			var C_enc = C.enc;
			C_enc.Utf8;
			var Base64 = C_enc.Base64;
			var EvpKDF = C.algo.EvpKDF;
			/**
			* Abstract base cipher template.
			*
			* @property {number} keySize This cipher's key size. Default: 4 (128 bits)
			* @property {number} ivSize This cipher's IV size. Default: 4 (128 bits)
			* @property {number} _ENC_XFORM_MODE A constant representing encryption mode.
			* @property {number} _DEC_XFORM_MODE A constant representing decryption mode.
			*/
			var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
				/**
				* Configuration options.
				*
				* @property {WordArray} iv The IV to use for this operation.
				*/
				cfg: Base.extend(),
				/**
				* Creates this cipher in encryption mode.
				*
				* @param {WordArray} key The key.
				* @param {Object} cfg (Optional) The configuration options to use for this operation.
				*
				* @return {Cipher} A cipher instance.
				*
				* @static
				*
				* @example
				*
				*     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
				*/
				createEncryptor: function(key, cfg) {
					return this.create(this._ENC_XFORM_MODE, key, cfg);
				},
				/**
				* Creates this cipher in decryption mode.
				*
				* @param {WordArray} key The key.
				* @param {Object} cfg (Optional) The configuration options to use for this operation.
				*
				* @return {Cipher} A cipher instance.
				*
				* @static
				*
				* @example
				*
				*     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
				*/
				createDecryptor: function(key, cfg) {
					return this.create(this._DEC_XFORM_MODE, key, cfg);
				},
				/**
				* Initializes a newly created cipher.
				*
				* @param {number} xformMode Either the encryption or decryption transormation mode constant.
				* @param {WordArray} key The key.
				* @param {Object} cfg (Optional) The configuration options to use for this operation.
				*
				* @example
				*
				*     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
				*/
				init: function(xformMode, key, cfg) {
					this.cfg = this.cfg.extend(cfg);
					this._xformMode = xformMode;
					this._key = key;
					this.reset();
				},
				/**
				* Resets this cipher to its initial state.
				*
				* @example
				*
				*     cipher.reset();
				*/
				reset: function() {
					BufferedBlockAlgorithm.reset.call(this);
					this._doReset();
				},
				/**
				* Adds data to be encrypted or decrypted.
				*
				* @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
				*
				* @return {WordArray} The data after processing.
				*
				* @example
				*
				*     var encrypted = cipher.process('data');
				*     var encrypted = cipher.process(wordArray);
				*/
				process: function(dataUpdate) {
					this._append(dataUpdate);
					return this._process();
				},
				/**
				* Finalizes the encryption or decryption process.
				* Note that the finalize operation is effectively a destructive, read-once operation.
				*
				* @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
				*
				* @return {WordArray} The data after final processing.
				*
				* @example
				*
				*     var encrypted = cipher.finalize();
				*     var encrypted = cipher.finalize('data');
				*     var encrypted = cipher.finalize(wordArray);
				*/
				finalize: function(dataUpdate) {
					if (dataUpdate) this._append(dataUpdate);
					return this._doFinalize();
				},
				keySize: 128 / 32,
				ivSize: 128 / 32,
				_ENC_XFORM_MODE: 1,
				_DEC_XFORM_MODE: 2,
				/**
				* Creates shortcut functions to a cipher's object interface.
				*
				* @param {Cipher} cipher The cipher to create a helper for.
				*
				* @return {Object} An object with encrypt and decrypt shortcut functions.
				*
				* @static
				*
				* @example
				*
				*     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
				*/
				_createHelper: function() {
					function selectCipherStrategy(key) {
						if (typeof key == "string") return PasswordBasedCipher;
						else return SerializableCipher;
					}
					return function(cipher) {
						return {
							encrypt: function(message, key, cfg) {
								return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
							},
							decrypt: function(ciphertext, key, cfg) {
								return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
							}
						};
					};
				}()
			});
			C_lib.StreamCipher = Cipher.extend({
				_doFinalize: function() {
					return this._process(true);
				},
				blockSize: 1
			});
			/**
			* Mode namespace.
			*/
			var C_mode = C.mode = {};
			/**
			* Abstract base block cipher mode template.
			*/
			var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
				/**
				* Creates this mode for encryption.
				*
				* @param {Cipher} cipher A block cipher instance.
				* @param {Array} iv The IV words.
				*
				* @static
				*
				* @example
				*
				*     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
				*/
				createEncryptor: function(cipher, iv) {
					return this.Encryptor.create(cipher, iv);
				},
				/**
				* Creates this mode for decryption.
				*
				* @param {Cipher} cipher A block cipher instance.
				* @param {Array} iv The IV words.
				*
				* @static
				*
				* @example
				*
				*     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
				*/
				createDecryptor: function(cipher, iv) {
					return this.Decryptor.create(cipher, iv);
				},
				/**
				* Initializes a newly created mode.
				*
				* @param {Cipher} cipher A block cipher instance.
				* @param {Array} iv The IV words.
				*
				* @example
				*
				*     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
				*/
				init: function(cipher, iv) {
					this._cipher = cipher;
					this._iv = iv;
				}
			});
			/**
			* Cipher Block Chaining mode.
			*/
			var CBC = C_mode.CBC = function() {
				/**
				* Abstract base CBC mode.
				*/
				var CBC = BlockCipherMode.extend();
				/**
				* CBC encryptor.
				*/
				CBC.Encryptor = CBC.extend({ 
				/**
				* Processes the data block at offset.
				*
				* @param {Array} words The data words to operate on.
				* @param {number} offset The offset where the block starts.
				*
				* @example
				*
				*     mode.processBlock(data.words, offset);
				*/
processBlock: function(words, offset) {
					var cipher = this._cipher;
					var blockSize = cipher.blockSize;
					xorBlock.call(this, words, offset, blockSize);
					cipher.encryptBlock(words, offset);
					this._prevBlock = words.slice(offset, offset + blockSize);
				} });
				/**
				* CBC decryptor.
				*/
				CBC.Decryptor = CBC.extend({ 
				/**
				* Processes the data block at offset.
				*
				* @param {Array} words The data words to operate on.
				* @param {number} offset The offset where the block starts.
				*
				* @example
				*
				*     mode.processBlock(data.words, offset);
				*/
processBlock: function(words, offset) {
					var cipher = this._cipher;
					var blockSize = cipher.blockSize;
					var thisBlock = words.slice(offset, offset + blockSize);
					cipher.decryptBlock(words, offset);
					xorBlock.call(this, words, offset, blockSize);
					this._prevBlock = thisBlock;
				} });
				function xorBlock(words, offset, blockSize) {
					var block;
					var iv = this._iv;
					if (iv) {
						block = iv;
						this._iv = undefined;
					} else block = this._prevBlock;
					for (var i = 0; i < blockSize; i++) words[offset + i] ^= block[i];
				}
				return CBC;
			}();
			/**
			* Padding namespace.
			*/
			var C_pad = C.pad = {};
			/**
			* PKCS #5/7 padding strategy.
			*/
			var Pkcs7 = C_pad.Pkcs7 = {
				/**
				* Pads data using the algorithm defined in PKCS #5/7.
				*
				* @param {WordArray} data The data to pad.
				* @param {number} blockSize The multiple that the data should be padded to.
				*
				* @static
				*
				* @example
				*
				*     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
				*/
				pad: function(data, blockSize) {
					var blockSizeBytes = blockSize * 4;
					var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
					var paddingWord = nPaddingBytes << 24 | nPaddingBytes << 16 | nPaddingBytes << 8 | nPaddingBytes;
					var paddingWords = [];
					for (var i = 0; i < nPaddingBytes; i += 4) paddingWords.push(paddingWord);
					var padding = WordArray.create(paddingWords, nPaddingBytes);
					data.concat(padding);
				},
				/**
				* Unpads data that had been padded using the algorithm defined in PKCS #5/7.
				*
				* @param {WordArray} data The data to unpad.
				*
				* @static
				*
				* @example
				*
				*     CryptoJS.pad.Pkcs7.unpad(wordArray);
				*/
				unpad: function(data) {
					var nPaddingBytes = data.words[data.sigBytes - 1 >>> 2] & 255;
					data.sigBytes -= nPaddingBytes;
				}
			};
			C_lib.BlockCipher = Cipher.extend({
				/**
				* Configuration options.
				*
				* @property {Mode} mode The block mode to use. Default: CBC
				* @property {Padding} padding The padding strategy to use. Default: Pkcs7
				*/
				cfg: Cipher.cfg.extend({
					mode: CBC,
					padding: Pkcs7
				}),
				reset: function() {
					var modeCreator;
					Cipher.reset.call(this);
					var cfg = this.cfg;
					var iv = cfg.iv;
					var mode = cfg.mode;
					if (this._xformMode == this._ENC_XFORM_MODE) modeCreator = mode.createEncryptor;
					else {
						modeCreator = mode.createDecryptor;
						this._minBufferSize = 1;
					}
					if (this._mode && this._mode.__creator == modeCreator) this._mode.init(this, iv && iv.words);
					else {
						this._mode = modeCreator.call(mode, this, iv && iv.words);
						this._mode.__creator = modeCreator;
					}
				},
				_doProcessBlock: function(words, offset) {
					this._mode.processBlock(words, offset);
				},
				_doFinalize: function() {
					var finalProcessedBlocks;
					var padding = this.cfg.padding;
					if (this._xformMode == this._ENC_XFORM_MODE) {
						padding.pad(this._data, this.blockSize);
						finalProcessedBlocks = this._process(true);
					} else {
						finalProcessedBlocks = this._process(true);
						padding.unpad(finalProcessedBlocks);
					}
					return finalProcessedBlocks;
				},
				blockSize: 128 / 32
			});
			/**
			* A collection of cipher parameters.
			*
			* @property {WordArray} ciphertext The raw ciphertext.
			* @property {WordArray} key The key to this ciphertext.
			* @property {WordArray} iv The IV used in the ciphering operation.
			* @property {WordArray} salt The salt used with a key derivation function.
			* @property {Cipher} algorithm The cipher algorithm.
			* @property {Mode} mode The block mode used in the ciphering operation.
			* @property {Padding} padding The padding scheme used in the ciphering operation.
			* @property {number} blockSize The block size of the cipher.
			* @property {Format} formatter The default formatting strategy to convert this cipher params object to a string.
			*/
			var CipherParams = C_lib.CipherParams = Base.extend({
				/**
				* Initializes a newly created cipher params object.
				*
				* @param {Object} cipherParams An object with any of the possible cipher parameters.
				*
				* @example
				*
				*     var cipherParams = CryptoJS.lib.CipherParams.create({
				*         ciphertext: ciphertextWordArray,
				*         key: keyWordArray,
				*         iv: ivWordArray,
				*         salt: saltWordArray,
				*         algorithm: CryptoJS.algo.AES,
				*         mode: CryptoJS.mode.CBC,
				*         padding: CryptoJS.pad.PKCS7,
				*         blockSize: 4,
				*         formatter: CryptoJS.format.OpenSSL
				*     });
				*/
				init: function(cipherParams) {
					this.mixIn(cipherParams);
				},
				/**
				* Converts this cipher params object to a string.
				*
				* @param {Format} formatter (Optional) The formatting strategy to use.
				*
				* @return {string} The stringified cipher params.
				*
				* @throws Error If neither the formatter nor the default formatter is set.
				*
				* @example
				*
				*     var string = cipherParams + '';
				*     var string = cipherParams.toString();
				*     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
				*/
				toString: function(formatter) {
					return (formatter || this.formatter).stringify(this);
				}
			});
			/**
			* Format namespace.
			*/
			var C_format = C.format = {};
			/**
			* OpenSSL formatting strategy.
			*/
			var OpenSSLFormatter = C_format.OpenSSL = {
				/**
				* Converts a cipher params object to an OpenSSL-compatible string.
				*
				* @param {CipherParams} cipherParams The cipher params object.
				*
				* @return {string} The OpenSSL-compatible string.
				*
				* @static
				*
				* @example
				*
				*     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
				*/
				stringify: function(cipherParams) {
					var wordArray;
					var ciphertext = cipherParams.ciphertext;
					var salt = cipherParams.salt;
					if (salt) wordArray = WordArray.create([1398893684, 1701076831]).concat(salt).concat(ciphertext);
					else wordArray = ciphertext;
					return wordArray.toString(Base64);
				},
				/**
				* Converts an OpenSSL-compatible string to a cipher params object.
				*
				* @param {string} openSSLStr The OpenSSL-compatible string.
				*
				* @return {CipherParams} The cipher params object.
				*
				* @static
				*
				* @example
				*
				*     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
				*/
				parse: function(openSSLStr) {
					var salt;
					var ciphertext = Base64.parse(openSSLStr);
					var ciphertextWords = ciphertext.words;
					if (ciphertextWords[0] == 1398893684 && ciphertextWords[1] == 1701076831) {
						salt = WordArray.create(ciphertextWords.slice(2, 4));
						ciphertextWords.splice(0, 4);
						ciphertext.sigBytes -= 16;
					}
					return CipherParams.create({
						ciphertext,
						salt
					});
				}
			};
			/**
			* A cipher wrapper that returns ciphertext as a serializable cipher params object.
			*/
			var SerializableCipher = C_lib.SerializableCipher = Base.extend({
				/**
				* Configuration options.
				*
				* @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
				*/
				cfg: Base.extend({ format: OpenSSLFormatter }),
				/**
				* Encrypts a message.
				*
				* @param {Cipher} cipher The cipher algorithm to use.
				* @param {WordArray|string} message The message to encrypt.
				* @param {WordArray} key The key.
				* @param {Object} cfg (Optional) The configuration options to use for this operation.
				*
				* @return {CipherParams} A cipher params object.
				*
				* @static
				*
				* @example
				*
				*     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
				*     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
				*     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
				*/
				encrypt: function(cipher, message, key, cfg) {
					cfg = this.cfg.extend(cfg);
					var encryptor = cipher.createEncryptor(key, cfg);
					var ciphertext = encryptor.finalize(message);
					var cipherCfg = encryptor.cfg;
					return CipherParams.create({
						ciphertext,
						key,
						iv: cipherCfg.iv,
						algorithm: cipher,
						mode: cipherCfg.mode,
						padding: cipherCfg.padding,
						blockSize: cipher.blockSize,
						formatter: cfg.format
					});
				},
				/**
				* Decrypts serialized ciphertext.
				*
				* @param {Cipher} cipher The cipher algorithm to use.
				* @param {CipherParams|string} ciphertext The ciphertext to decrypt.
				* @param {WordArray} key The key.
				* @param {Object} cfg (Optional) The configuration options to use for this operation.
				*
				* @return {WordArray} The plaintext.
				*
				* @static
				*
				* @example
				*
				*     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
				*     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
				*/
				decrypt: function(cipher, ciphertext, key, cfg) {
					cfg = this.cfg.extend(cfg);
					ciphertext = this._parse(ciphertext, cfg.format);
					return cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);
				},
				/**
				* Converts serialized ciphertext to CipherParams,
				* else assumed CipherParams already and returns ciphertext unchanged.
				*
				* @param {CipherParams|string} ciphertext The ciphertext.
				* @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
				*
				* @return {CipherParams} The unserialized ciphertext.
				*
				* @static
				*
				* @example
				*
				*     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
				*/
				_parse: function(ciphertext, format) {
					if (typeof ciphertext == "string") return format.parse(ciphertext, this);
					else return ciphertext;
				}
			});
			/**
			* Key derivation function namespace.
			*/
			var C_kdf = C.kdf = {};
			/**
			* OpenSSL key derivation function.
			*/
			var OpenSSLKdf = C_kdf.OpenSSL = { 
			/**
			* Derives a key and IV from a password.
			*
			* @param {string} password The password to derive from.
			* @param {number} keySize The size in words of the key to generate.
			* @param {number} ivSize The size in words of the IV to generate.
			* @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
			*
			* @return {CipherParams} A cipher params object with the key, IV, and salt.
			*
			* @static
			*
			* @example
			*
			*     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
			*     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
			*/
execute: function(password, keySize, ivSize, salt, hasher) {
				if (!salt) salt = WordArray.random(64 / 8);
				if (!hasher) var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);
				else var key = EvpKDF.create({
					keySize: keySize + ivSize,
					hasher
				}).compute(password, salt);
				var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
				key.sigBytes = keySize * 4;
				return CipherParams.create({
					key,
					iv,
					salt
				});
			} };
			/**
			* A serializable cipher wrapper that derives the key from a password,
			* and returns ciphertext as a serializable cipher params object.
			*/
			var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
				/**
				* Configuration options.
				*
				* @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
				*/
				cfg: SerializableCipher.cfg.extend({ kdf: OpenSSLKdf }),
				/**
				* Encrypts a message using a password.
				*
				* @param {Cipher} cipher The cipher algorithm to use.
				* @param {WordArray|string} message The message to encrypt.
				* @param {string} password The password.
				* @param {Object} cfg (Optional) The configuration options to use for this operation.
				*
				* @return {CipherParams} A cipher params object.
				*
				* @static
				*
				* @example
				*
				*     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
				*     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
				*/
				encrypt: function(cipher, message, password, cfg) {
					cfg = this.cfg.extend(cfg);
					var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, cfg.salt, cfg.hasher);
					cfg.iv = derivedParams.iv;
					var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);
					ciphertext.mixIn(derivedParams);
					return ciphertext;
				},
				/**
				* Decrypts serialized ciphertext using a password.
				*
				* @param {Cipher} cipher The cipher algorithm to use.
				* @param {CipherParams|string} ciphertext The ciphertext to decrypt.
				* @param {string} password The password.
				* @param {Object} cfg (Optional) The configuration options to use for this operation.
				*
				* @return {WordArray} The plaintext.
				*
				* @static
				*
				* @example
				*
				*     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
				*     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
				*/
				decrypt: function(cipher, ciphertext, password, cfg) {
					cfg = this.cfg.extend(cfg);
					ciphertext = this._parse(ciphertext, cfg.format);
					var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt, cfg.hasher);
					cfg.iv = derivedParams.iv;
					return SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);
				}
			});
		}();
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/mode-cfb.js
var require_mode_cfb = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./cipher-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		/**
		* Cipher Feedback block mode.
		*/
		CryptoJS.mode.CFB = function() {
			var CFB = CryptoJS.lib.BlockCipherMode.extend();
			CFB.Encryptor = CFB.extend({ processBlock: function(words, offset) {
				var cipher = this._cipher;
				var blockSize = cipher.blockSize;
				generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);
				this._prevBlock = words.slice(offset, offset + blockSize);
			} });
			CFB.Decryptor = CFB.extend({ processBlock: function(words, offset) {
				var cipher = this._cipher;
				var blockSize = cipher.blockSize;
				var thisBlock = words.slice(offset, offset + blockSize);
				generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);
				this._prevBlock = thisBlock;
			} });
			function generateKeystreamAndEncrypt(words, offset, blockSize, cipher) {
				var keystream;
				var iv = this._iv;
				if (iv) {
					keystream = iv.slice(0);
					this._iv = void 0;
				} else keystream = this._prevBlock;
				cipher.encryptBlock(keystream, 0);
				for (var i = 0; i < blockSize; i++) words[offset + i] ^= keystream[i];
			}
			return CFB;
		}();
		return CryptoJS.mode.CFB;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/mode-ctr.js
var require_mode_ctr = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./cipher-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		/**
		* Counter block mode.
		*/
		CryptoJS.mode.CTR = function() {
			var CTR = CryptoJS.lib.BlockCipherMode.extend();
			CTR.Decryptor = CTR.Encryptor = CTR.extend({ processBlock: function(words, offset) {
				var cipher = this._cipher;
				var blockSize = cipher.blockSize;
				var iv = this._iv;
				var counter = this._counter;
				if (iv) {
					counter = this._counter = iv.slice(0);
					this._iv = void 0;
				}
				var keystream = counter.slice(0);
				cipher.encryptBlock(keystream, 0);
				counter[blockSize - 1] = counter[blockSize - 1] + 1 | 0;
				for (var i = 0; i < blockSize; i++) words[offset + i] ^= keystream[i];
			} });
			return CTR;
		}();
		return CryptoJS.mode.CTR;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/mode-ctr-gladman.js
var require_mode_ctr_gladman = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./cipher-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		/** @preserve
		* Counter block mode compatible with  Dr Brian Gladman fileenc.c
		* derived from CryptoJS.mode.CTR
		* Jan Hruby jhruby.web@gmail.com
		*/
		CryptoJS.mode.CTRGladman = function() {
			var CTRGladman = CryptoJS.lib.BlockCipherMode.extend();
			function incWord(word) {
				if ((word >> 24 & 255) === 255) {
					var b1 = word >> 16 & 255;
					var b2 = word >> 8 & 255;
					var b3 = word & 255;
					if (b1 === 255) {
						b1 = 0;
						if (b2 === 255) {
							b2 = 0;
							if (b3 === 255) b3 = 0;
							else ++b3;
						} else ++b2;
					} else ++b1;
					word = 0;
					word += b1 << 16;
					word += b2 << 8;
					word += b3;
				} else word += 1 << 24;
				return word;
			}
			function incCounter(counter) {
				if ((counter[0] = incWord(counter[0])) === 0) counter[1] = incWord(counter[1]);
				return counter;
			}
			CTRGladman.Decryptor = CTRGladman.Encryptor = CTRGladman.extend({ processBlock: function(words, offset) {
				var cipher = this._cipher;
				var blockSize = cipher.blockSize;
				var iv = this._iv;
				var counter = this._counter;
				if (iv) {
					counter = this._counter = iv.slice(0);
					this._iv = void 0;
				}
				incCounter(counter);
				var keystream = counter.slice(0);
				cipher.encryptBlock(keystream, 0);
				for (var i = 0; i < blockSize; i++) words[offset + i] ^= keystream[i];
			} });
			return CTRGladman;
		}();
		return CryptoJS.mode.CTRGladman;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/mode-ofb.js
var require_mode_ofb = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./cipher-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		/**
		* Output Feedback block mode.
		*/
		CryptoJS.mode.OFB = function() {
			var OFB = CryptoJS.lib.BlockCipherMode.extend();
			OFB.Decryptor = OFB.Encryptor = OFB.extend({ processBlock: function(words, offset) {
				var cipher = this._cipher;
				var blockSize = cipher.blockSize;
				var iv = this._iv;
				var keystream = this._keystream;
				if (iv) {
					keystream = this._keystream = iv.slice(0);
					this._iv = void 0;
				}
				cipher.encryptBlock(keystream, 0);
				for (var i = 0; i < blockSize; i++) words[offset + i] ^= keystream[i];
			} });
			return OFB;
		}();
		return CryptoJS.mode.OFB;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/mode-ecb.js
var require_mode_ecb = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./cipher-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		/**
		* Electronic Codebook block mode.
		*/
		CryptoJS.mode.ECB = function() {
			var ECB = CryptoJS.lib.BlockCipherMode.extend();
			ECB.Encryptor = ECB.extend({ processBlock: function(words, offset) {
				this._cipher.encryptBlock(words, offset);
			} });
			ECB.Decryptor = ECB.extend({ processBlock: function(words, offset) {
				this._cipher.decryptBlock(words, offset);
			} });
			return ECB;
		}();
		return CryptoJS.mode.ECB;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/pad-ansix923.js
var require_pad_ansix923 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./cipher-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		/**
		* ANSI X.923 padding strategy.
		*/
		CryptoJS.pad.AnsiX923 = {
			pad: function(data, blockSize) {
				var dataSigBytes = data.sigBytes;
				var blockSizeBytes = blockSize * 4;
				var nPaddingBytes = blockSizeBytes - dataSigBytes % blockSizeBytes;
				var lastBytePos = dataSigBytes + nPaddingBytes - 1;
				data.clamp();
				data.words[lastBytePos >>> 2] |= nPaddingBytes << 24 - lastBytePos % 4 * 8;
				data.sigBytes += nPaddingBytes;
			},
			unpad: function(data) {
				var nPaddingBytes = data.words[data.sigBytes - 1 >>> 2] & 255;
				data.sigBytes -= nPaddingBytes;
			}
		};
		return CryptoJS.pad.Ansix923;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/pad-iso10126.js
var require_pad_iso10126 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./cipher-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		/**
		* ISO 10126 padding strategy.
		*/
		CryptoJS.pad.Iso10126 = {
			pad: function(data, blockSize) {
				var blockSizeBytes = blockSize * 4;
				var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;
				data.concat(CryptoJS.lib.WordArray.random(nPaddingBytes - 1)).concat(CryptoJS.lib.WordArray.create([nPaddingBytes << 24], 1));
			},
			unpad: function(data) {
				var nPaddingBytes = data.words[data.sigBytes - 1 >>> 2] & 255;
				data.sigBytes -= nPaddingBytes;
			}
		};
		return CryptoJS.pad.Iso10126;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/pad-iso97971.js
var require_pad_iso97971 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./cipher-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		/**
		* ISO/IEC 9797-1 Padding Method 2.
		*/
		CryptoJS.pad.Iso97971 = {
			pad: function(data, blockSize) {
				data.concat(CryptoJS.lib.WordArray.create([2147483648], 1));
				CryptoJS.pad.ZeroPadding.pad(data, blockSize);
			},
			unpad: function(data) {
				CryptoJS.pad.ZeroPadding.unpad(data);
				data.sigBytes--;
			}
		};
		return CryptoJS.pad.Iso97971;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/pad-zeropadding.js
var require_pad_zeropadding = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./cipher-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		/**
		* Zero padding strategy.
		*/
		CryptoJS.pad.ZeroPadding = {
			pad: function(data, blockSize) {
				var blockSizeBytes = blockSize * 4;
				data.clamp();
				data.sigBytes += blockSizeBytes - (data.sigBytes % blockSizeBytes || blockSizeBytes);
			},
			unpad: function(data) {
				var dataWords = data.words;
				var i = data.sigBytes - 1;
				for (var i = data.sigBytes - 1; i >= 0; i--) if (dataWords[i >>> 2] >>> 24 - i % 4 * 8 & 255) {
					data.sigBytes = i + 1;
					break;
				}
			}
		};
		return CryptoJS.pad.ZeroPadding;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/pad-nopadding.js
var require_pad_nopadding = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./cipher-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		/**
		* A noop padding strategy.
		*/
		CryptoJS.pad.NoPadding = {
			pad: function() {},
			unpad: function() {}
		};
		return CryptoJS.pad.NoPadding;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/format-hex.js
var require_format_hex = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define(["./core", "./cipher-core"], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function(undefined) {
			var C = CryptoJS;
			var CipherParams = C.lib.CipherParams;
			var Hex = C.enc.Hex;
			var C_format = C.format;
			C_format.Hex = {
				/**
				* Converts the ciphertext of a cipher params object to a hexadecimally encoded string.
				*
				* @param {CipherParams} cipherParams The cipher params object.
				*
				* @return {string} The hexadecimally encoded string.
				*
				* @static
				*
				* @example
				*
				*     var hexString = CryptoJS.format.Hex.stringify(cipherParams);
				*/
				stringify: function(cipherParams) {
					return cipherParams.ciphertext.toString(Hex);
				},
				/**
				* Converts a hexadecimally encoded ciphertext string to a cipher params object.
				*
				* @param {string} input The hexadecimally encoded string.
				*
				* @return {CipherParams} The cipher params object.
				*
				* @static
				*
				* @example
				*
				*     var cipherParams = CryptoJS.format.Hex.parse(hexString);
				*/
				parse: function(input) {
					var ciphertext = Hex.parse(input);
					return CipherParams.create({ ciphertext });
				}
			};
		})();
		return CryptoJS.format.Hex;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/aes.js
var require_aes = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define([
			"./core",
			"./enc-base64",
			"./md5",
			"./evpkdf",
			"./cipher-core"
		], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var BlockCipher = C.lib.BlockCipher;
			var C_algo = C.algo;
			var SBOX = [];
			var INV_SBOX = [];
			var SUB_MIX_0 = [];
			var SUB_MIX_1 = [];
			var SUB_MIX_2 = [];
			var SUB_MIX_3 = [];
			var INV_SUB_MIX_0 = [];
			var INV_SUB_MIX_1 = [];
			var INV_SUB_MIX_2 = [];
			var INV_SUB_MIX_3 = [];
			(function() {
				var d = [];
				for (var i = 0; i < 256; i++) if (i < 128) d[i] = i << 1;
				else d[i] = i << 1 ^ 283;
				var x = 0;
				var xi = 0;
				for (var i = 0; i < 256; i++) {
					var sx = xi ^ xi << 1 ^ xi << 2 ^ xi << 3 ^ xi << 4;
					sx = sx >>> 8 ^ sx & 255 ^ 99;
					SBOX[x] = sx;
					INV_SBOX[sx] = x;
					var x2 = d[x];
					var x4 = d[x2];
					var x8 = d[x4];
					var t = d[sx] * 257 ^ sx * 16843008;
					SUB_MIX_0[x] = t << 24 | t >>> 8;
					SUB_MIX_1[x] = t << 16 | t >>> 16;
					SUB_MIX_2[x] = t << 8 | t >>> 24;
					SUB_MIX_3[x] = t;
					var t = x8 * 16843009 ^ x4 * 65537 ^ x2 * 257 ^ x * 16843008;
					INV_SUB_MIX_0[sx] = t << 24 | t >>> 8;
					INV_SUB_MIX_1[sx] = t << 16 | t >>> 16;
					INV_SUB_MIX_2[sx] = t << 8 | t >>> 24;
					INV_SUB_MIX_3[sx] = t;
					if (!x) x = xi = 1;
					else {
						x = x2 ^ d[d[d[x8 ^ x2]]];
						xi ^= d[d[xi]];
					}
				}
			})();
			var RCON = [
				0,
				1,
				2,
				4,
				8,
				16,
				32,
				64,
				128,
				27,
				54
			];
			/**
			* AES block cipher algorithm.
			*/
			var AES = C_algo.AES = BlockCipher.extend({
				_doReset: function() {
					var t;
					if (this._nRounds && this._keyPriorReset === this._key) return;
					var key = this._keyPriorReset = this._key;
					var keyWords = key.words;
					var keySize = key.sigBytes / 4;
					var ksRows = ((this._nRounds = keySize + 6) + 1) * 4;
					var keySchedule = this._keySchedule = [];
					for (var ksRow = 0; ksRow < ksRows; ksRow++) if (ksRow < keySize) keySchedule[ksRow] = keyWords[ksRow];
					else {
						t = keySchedule[ksRow - 1];
						if (!(ksRow % keySize)) {
							t = t << 8 | t >>> 24;
							t = SBOX[t >>> 24] << 24 | SBOX[t >>> 16 & 255] << 16 | SBOX[t >>> 8 & 255] << 8 | SBOX[t & 255];
							t ^= RCON[ksRow / keySize | 0] << 24;
						} else if (keySize > 6 && ksRow % keySize == 4) t = SBOX[t >>> 24] << 24 | SBOX[t >>> 16 & 255] << 16 | SBOX[t >>> 8 & 255] << 8 | SBOX[t & 255];
						keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
					}
					var invKeySchedule = this._invKeySchedule = [];
					for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
						var ksRow = ksRows - invKsRow;
						if (invKsRow % 4) var t = keySchedule[ksRow];
						else var t = keySchedule[ksRow - 4];
						if (invKsRow < 4 || ksRow <= 4) invKeySchedule[invKsRow] = t;
						else invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[t >>> 16 & 255]] ^ INV_SUB_MIX_2[SBOX[t >>> 8 & 255]] ^ INV_SUB_MIX_3[SBOX[t & 255]];
					}
				},
				encryptBlock: function(M, offset) {
					this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
				},
				decryptBlock: function(M, offset) {
					var t = M[offset + 1];
					M[offset + 1] = M[offset + 3];
					M[offset + 3] = t;
					this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);
					var t = M[offset + 1];
					M[offset + 1] = M[offset + 3];
					M[offset + 3] = t;
				},
				_doCryptBlock: function(M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
					var nRounds = this._nRounds;
					var s0 = M[offset] ^ keySchedule[0];
					var s1 = M[offset + 1] ^ keySchedule[1];
					var s2 = M[offset + 2] ^ keySchedule[2];
					var s3 = M[offset + 3] ^ keySchedule[3];
					var ksRow = 4;
					for (var round = 1; round < nRounds; round++) {
						var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[s1 >>> 16 & 255] ^ SUB_MIX_2[s2 >>> 8 & 255] ^ SUB_MIX_3[s3 & 255] ^ keySchedule[ksRow++];
						var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[s2 >>> 16 & 255] ^ SUB_MIX_2[s3 >>> 8 & 255] ^ SUB_MIX_3[s0 & 255] ^ keySchedule[ksRow++];
						var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[s3 >>> 16 & 255] ^ SUB_MIX_2[s0 >>> 8 & 255] ^ SUB_MIX_3[s1 & 255] ^ keySchedule[ksRow++];
						var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[s0 >>> 16 & 255] ^ SUB_MIX_2[s1 >>> 8 & 255] ^ SUB_MIX_3[s2 & 255] ^ keySchedule[ksRow++];
						s0 = t0;
						s1 = t1;
						s2 = t2;
						s3 = t3;
					}
					var t0 = (SBOX[s0 >>> 24] << 24 | SBOX[s1 >>> 16 & 255] << 16 | SBOX[s2 >>> 8 & 255] << 8 | SBOX[s3 & 255]) ^ keySchedule[ksRow++];
					var t1 = (SBOX[s1 >>> 24] << 24 | SBOX[s2 >>> 16 & 255] << 16 | SBOX[s3 >>> 8 & 255] << 8 | SBOX[s0 & 255]) ^ keySchedule[ksRow++];
					var t2 = (SBOX[s2 >>> 24] << 24 | SBOX[s3 >>> 16 & 255] << 16 | SBOX[s0 >>> 8 & 255] << 8 | SBOX[s1 & 255]) ^ keySchedule[ksRow++];
					var t3 = (SBOX[s3 >>> 24] << 24 | SBOX[s0 >>> 16 & 255] << 16 | SBOX[s1 >>> 8 & 255] << 8 | SBOX[s2 & 255]) ^ keySchedule[ksRow++];
					M[offset] = t0;
					M[offset + 1] = t1;
					M[offset + 2] = t2;
					M[offset + 3] = t3;
				},
				keySize: 256 / 32
			});
			/**
			* Shortcut functions to the cipher's object interface.
			*
			* @example
			*
			*     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
			*     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
			*/
			C.AES = BlockCipher._createHelper(AES);
		})();
		return CryptoJS.AES;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/tripledes.js
var require_tripledes = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define([
			"./core",
			"./enc-base64",
			"./md5",
			"./evpkdf",
			"./cipher-core"
		], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var C_lib = C.lib;
			var WordArray = C_lib.WordArray;
			var BlockCipher = C_lib.BlockCipher;
			var C_algo = C.algo;
			var PC1 = [
				57,
				49,
				41,
				33,
				25,
				17,
				9,
				1,
				58,
				50,
				42,
				34,
				26,
				18,
				10,
				2,
				59,
				51,
				43,
				35,
				27,
				19,
				11,
				3,
				60,
				52,
				44,
				36,
				63,
				55,
				47,
				39,
				31,
				23,
				15,
				7,
				62,
				54,
				46,
				38,
				30,
				22,
				14,
				6,
				61,
				53,
				45,
				37,
				29,
				21,
				13,
				5,
				28,
				20,
				12,
				4
			];
			var PC2 = [
				14,
				17,
				11,
				24,
				1,
				5,
				3,
				28,
				15,
				6,
				21,
				10,
				23,
				19,
				12,
				4,
				26,
				8,
				16,
				7,
				27,
				20,
				13,
				2,
				41,
				52,
				31,
				37,
				47,
				55,
				30,
				40,
				51,
				45,
				33,
				48,
				44,
				49,
				39,
				56,
				34,
				53,
				46,
				42,
				50,
				36,
				29,
				32
			];
			var BIT_SHIFTS = [
				1,
				2,
				4,
				6,
				8,
				10,
				12,
				14,
				15,
				17,
				19,
				21,
				23,
				25,
				27,
				28
			];
			var SBOX_P = [
				{
					0: 8421888,
					268435456: 32768,
					536870912: 8421378,
					805306368: 2,
					1073741824: 512,
					1342177280: 8421890,
					1610612736: 8389122,
					1879048192: 8388608,
					2147483648: 514,
					2415919104: 8389120,
					2684354560: 33280,
					2952790016: 8421376,
					3221225472: 32770,
					3489660928: 8388610,
					3758096384: 0,
					4026531840: 33282,
					134217728: 0,
					402653184: 8421890,
					671088640: 33282,
					939524096: 32768,
					1207959552: 8421888,
					1476395008: 512,
					1744830464: 8421378,
					2013265920: 2,
					2281701376: 8389120,
					2550136832: 33280,
					2818572288: 8421376,
					3087007744: 8389122,
					3355443200: 8388610,
					3623878656: 32770,
					3892314112: 514,
					4160749568: 8388608,
					1: 32768,
					268435457: 2,
					536870913: 8421888,
					805306369: 8388608,
					1073741825: 8421378,
					1342177281: 33280,
					1610612737: 512,
					1879048193: 8389122,
					2147483649: 8421890,
					2415919105: 8421376,
					2684354561: 8388610,
					2952790017: 33282,
					3221225473: 514,
					3489660929: 8389120,
					3758096385: 32770,
					4026531841: 0,
					134217729: 8421890,
					402653185: 8421376,
					671088641: 8388608,
					939524097: 512,
					1207959553: 32768,
					1476395009: 8388610,
					1744830465: 2,
					2013265921: 33282,
					2281701377: 32770,
					2550136833: 8389122,
					2818572289: 514,
					3087007745: 8421888,
					3355443201: 8389120,
					3623878657: 0,
					3892314113: 33280,
					4160749569: 8421378
				},
				{
					0: 1074282512,
					16777216: 16384,
					33554432: 524288,
					50331648: 1074266128,
					67108864: 1073741840,
					83886080: 1074282496,
					100663296: 1073758208,
					117440512: 16,
					134217728: 540672,
					150994944: 1073758224,
					167772160: 1073741824,
					184549376: 540688,
					201326592: 524304,
					218103808: 0,
					234881024: 16400,
					251658240: 1074266112,
					8388608: 1073758208,
					25165824: 540688,
					41943040: 16,
					58720256: 1073758224,
					75497472: 1074282512,
					92274688: 1073741824,
					109051904: 524288,
					125829120: 1074266128,
					142606336: 524304,
					159383552: 0,
					176160768: 16384,
					192937984: 1074266112,
					209715200: 1073741840,
					226492416: 540672,
					243269632: 1074282496,
					260046848: 16400,
					268435456: 0,
					285212672: 1074266128,
					301989888: 1073758224,
					318767104: 1074282496,
					335544320: 1074266112,
					352321536: 16,
					369098752: 540688,
					385875968: 16384,
					402653184: 16400,
					419430400: 524288,
					436207616: 524304,
					452984832: 1073741840,
					469762048: 540672,
					486539264: 1073758208,
					503316480: 1073741824,
					520093696: 1074282512,
					276824064: 540688,
					293601280: 524288,
					310378496: 1074266112,
					327155712: 16384,
					343932928: 1073758208,
					360710144: 1074282512,
					377487360: 16,
					394264576: 1073741824,
					411041792: 1074282496,
					427819008: 1073741840,
					444596224: 1073758224,
					461373440: 524304,
					478150656: 0,
					494927872: 16400,
					511705088: 1074266128,
					528482304: 540672
				},
				{
					0: 260,
					1048576: 0,
					2097152: 67109120,
					3145728: 65796,
					4194304: 65540,
					5242880: 67108868,
					6291456: 67174660,
					7340032: 67174400,
					8388608: 67108864,
					9437184: 67174656,
					10485760: 65792,
					11534336: 67174404,
					12582912: 67109124,
					13631488: 65536,
					14680064: 4,
					15728640: 256,
					524288: 67174656,
					1572864: 67174404,
					2621440: 0,
					3670016: 67109120,
					4718592: 67108868,
					5767168: 65536,
					6815744: 65540,
					7864320: 260,
					8912896: 4,
					9961472: 256,
					11010048: 67174400,
					12058624: 65796,
					13107200: 65792,
					14155776: 67109124,
					15204352: 67174660,
					16252928: 67108864,
					16777216: 67174656,
					17825792: 65540,
					18874368: 65536,
					19922944: 67109120,
					20971520: 256,
					22020096: 67174660,
					23068672: 67108868,
					24117248: 0,
					25165824: 67109124,
					26214400: 67108864,
					27262976: 4,
					28311552: 65792,
					29360128: 67174400,
					30408704: 260,
					31457280: 65796,
					32505856: 67174404,
					17301504: 67108864,
					18350080: 260,
					19398656: 67174656,
					20447232: 0,
					21495808: 65540,
					22544384: 67109120,
					23592960: 256,
					24641536: 67174404,
					25690112: 65536,
					26738688: 67174660,
					27787264: 65796,
					28835840: 67108868,
					29884416: 67109124,
					30932992: 67174400,
					31981568: 4,
					33030144: 65792
				},
				{
					0: 2151682048,
					65536: 2147487808,
					131072: 4198464,
					196608: 2151677952,
					262144: 0,
					327680: 4198400,
					393216: 2147483712,
					458752: 4194368,
					524288: 2147483648,
					589824: 4194304,
					655360: 64,
					720896: 2147487744,
					786432: 2151678016,
					851968: 4160,
					917504: 4096,
					983040: 2151682112,
					32768: 2147487808,
					98304: 64,
					163840: 2151678016,
					229376: 2147487744,
					294912: 4198400,
					360448: 2151682112,
					425984: 0,
					491520: 2151677952,
					557056: 4096,
					622592: 2151682048,
					688128: 4194304,
					753664: 4160,
					819200: 2147483648,
					884736: 4194368,
					950272: 4198464,
					1015808: 2147483712,
					1048576: 4194368,
					1114112: 4198400,
					1179648: 2147483712,
					1245184: 0,
					1310720: 4160,
					1376256: 2151678016,
					1441792: 2151682048,
					1507328: 2147487808,
					1572864: 2151682112,
					1638400: 2147483648,
					1703936: 2151677952,
					1769472: 4198464,
					1835008: 2147487744,
					1900544: 4194304,
					1966080: 64,
					2031616: 4096,
					1081344: 2151677952,
					1146880: 2151682112,
					1212416: 0,
					1277952: 4198400,
					1343488: 4194368,
					1409024: 2147483648,
					1474560: 2147487808,
					1540096: 64,
					1605632: 2147483712,
					1671168: 4096,
					1736704: 2147487744,
					1802240: 2151678016,
					1867776: 4160,
					1933312: 2151682048,
					1998848: 4194304,
					2064384: 4198464
				},
				{
					0: 128,
					4096: 17039360,
					8192: 262144,
					12288: 536870912,
					16384: 537133184,
					20480: 16777344,
					24576: 553648256,
					28672: 262272,
					32768: 16777216,
					36864: 537133056,
					40960: 536871040,
					45056: 553910400,
					49152: 553910272,
					53248: 0,
					57344: 17039488,
					61440: 553648128,
					2048: 17039488,
					6144: 553648256,
					10240: 128,
					14336: 17039360,
					18432: 262144,
					22528: 537133184,
					26624: 553910272,
					30720: 536870912,
					34816: 537133056,
					38912: 0,
					43008: 553910400,
					47104: 16777344,
					51200: 536871040,
					55296: 553648128,
					59392: 16777216,
					63488: 262272,
					65536: 262144,
					69632: 128,
					73728: 536870912,
					77824: 553648256,
					81920: 16777344,
					86016: 553910272,
					90112: 537133184,
					94208: 16777216,
					98304: 553910400,
					102400: 553648128,
					106496: 17039360,
					110592: 537133056,
					114688: 262272,
					118784: 536871040,
					122880: 0,
					126976: 17039488,
					67584: 553648256,
					71680: 16777216,
					75776: 17039360,
					79872: 537133184,
					83968: 536870912,
					88064: 17039488,
					92160: 128,
					96256: 553910272,
					100352: 262272,
					104448: 553910400,
					108544: 0,
					112640: 553648128,
					116736: 16777344,
					120832: 262144,
					124928: 537133056,
					129024: 536871040
				},
				{
					0: 268435464,
					256: 8192,
					512: 270532608,
					768: 270540808,
					1024: 268443648,
					1280: 2097152,
					1536: 2097160,
					1792: 268435456,
					2048: 0,
					2304: 268443656,
					2560: 2105344,
					2816: 8,
					3072: 270532616,
					3328: 2105352,
					3584: 8200,
					3840: 270540800,
					128: 270532608,
					384: 270540808,
					640: 8,
					896: 2097152,
					1152: 2105352,
					1408: 268435464,
					1664: 268443648,
					1920: 8200,
					2176: 2097160,
					2432: 8192,
					2688: 268443656,
					2944: 270532616,
					3200: 0,
					3456: 270540800,
					3712: 2105344,
					3968: 268435456,
					4096: 268443648,
					4352: 270532616,
					4608: 270540808,
					4864: 8200,
					5120: 2097152,
					5376: 268435456,
					5632: 268435464,
					5888: 2105344,
					6144: 2105352,
					6400: 0,
					6656: 8,
					6912: 270532608,
					7168: 8192,
					7424: 268443656,
					7680: 270540800,
					7936: 2097160,
					4224: 8,
					4480: 2105344,
					4736: 2097152,
					4992: 268435464,
					5248: 268443648,
					5504: 8200,
					5760: 270540808,
					6016: 270532608,
					6272: 270540800,
					6528: 270532616,
					6784: 8192,
					7040: 2105352,
					7296: 2097160,
					7552: 0,
					7808: 268435456,
					8064: 268443656
				},
				{
					0: 1048576,
					16: 33555457,
					32: 1024,
					48: 1049601,
					64: 34604033,
					80: 0,
					96: 1,
					112: 34603009,
					128: 33555456,
					144: 1048577,
					160: 33554433,
					176: 34604032,
					192: 34603008,
					208: 1025,
					224: 1049600,
					240: 33554432,
					8: 34603009,
					24: 0,
					40: 33555457,
					56: 34604032,
					72: 1048576,
					88: 33554433,
					104: 33554432,
					120: 1025,
					136: 1049601,
					152: 33555456,
					168: 34603008,
					184: 1048577,
					200: 1024,
					216: 34604033,
					232: 1,
					248: 1049600,
					256: 33554432,
					272: 1048576,
					288: 33555457,
					304: 34603009,
					320: 1048577,
					336: 33555456,
					352: 34604032,
					368: 1049601,
					384: 1025,
					400: 34604033,
					416: 1049600,
					432: 1,
					448: 0,
					464: 34603008,
					480: 33554433,
					496: 1024,
					264: 1049600,
					280: 33555457,
					296: 34603009,
					312: 1,
					328: 33554432,
					344: 1048576,
					360: 1025,
					376: 34604032,
					392: 33554433,
					408: 34603008,
					424: 0,
					440: 34604033,
					456: 1049601,
					472: 1024,
					488: 33555456,
					504: 1048577
				},
				{
					0: 134219808,
					1: 131072,
					2: 134217728,
					3: 32,
					4: 131104,
					5: 134350880,
					6: 134350848,
					7: 2048,
					8: 134348800,
					9: 134219776,
					10: 133120,
					11: 134348832,
					12: 2080,
					13: 0,
					14: 134217760,
					15: 133152,
					2147483648: 2048,
					2147483649: 134350880,
					2147483650: 134219808,
					2147483651: 134217728,
					2147483652: 134348800,
					2147483653: 133120,
					2147483654: 133152,
					2147483655: 32,
					2147483656: 134217760,
					2147483657: 2080,
					2147483658: 131104,
					2147483659: 134350848,
					2147483660: 0,
					2147483661: 134348832,
					2147483662: 134219776,
					2147483663: 131072,
					16: 133152,
					17: 134350848,
					18: 32,
					19: 2048,
					20: 134219776,
					21: 134217760,
					22: 134348832,
					23: 131072,
					24: 0,
					25: 131104,
					26: 134348800,
					27: 134219808,
					28: 134350880,
					29: 133120,
					30: 2080,
					31: 134217728,
					2147483664: 131072,
					2147483665: 2048,
					2147483666: 134348832,
					2147483667: 133152,
					2147483668: 32,
					2147483669: 134348800,
					2147483670: 134217728,
					2147483671: 134219808,
					2147483672: 134350880,
					2147483673: 134217760,
					2147483674: 134219776,
					2147483675: 0,
					2147483676: 133120,
					2147483677: 2080,
					2147483678: 131104,
					2147483679: 134350848
				}
			];
			var SBOX_MASK = [
				4160749569,
				528482304,
				33030144,
				2064384,
				129024,
				8064,
				504,
				2147483679
			];
			/**
			* DES block cipher algorithm.
			*/
			var DES = C_algo.DES = BlockCipher.extend({
				_doReset: function() {
					var keyWords = this._key.words;
					var keyBits = [];
					for (var i = 0; i < 56; i++) {
						var keyBitPos = PC1[i] - 1;
						keyBits[i] = keyWords[keyBitPos >>> 5] >>> 31 - keyBitPos % 32 & 1;
					}
					var subKeys = this._subKeys = [];
					for (var nSubKey = 0; nSubKey < 16; nSubKey++) {
						var subKey = subKeys[nSubKey] = [];
						var bitShift = BIT_SHIFTS[nSubKey];
						for (var i = 0; i < 24; i++) {
							subKey[i / 6 | 0] |= keyBits[(PC2[i] - 1 + bitShift) % 28] << 31 - i % 6;
							subKey[4 + (i / 6 | 0)] |= keyBits[28 + (PC2[i + 24] - 1 + bitShift) % 28] << 31 - i % 6;
						}
						subKey[0] = subKey[0] << 1 | subKey[0] >>> 31;
						for (var i = 1; i < 7; i++) subKey[i] = subKey[i] >>> (i - 1) * 4 + 3;
						subKey[7] = subKey[7] << 5 | subKey[7] >>> 27;
					}
					var invSubKeys = this._invSubKeys = [];
					for (var i = 0; i < 16; i++) invSubKeys[i] = subKeys[15 - i];
				},
				encryptBlock: function(M, offset) {
					this._doCryptBlock(M, offset, this._subKeys);
				},
				decryptBlock: function(M, offset) {
					this._doCryptBlock(M, offset, this._invSubKeys);
				},
				_doCryptBlock: function(M, offset, subKeys) {
					this._lBlock = M[offset];
					this._rBlock = M[offset + 1];
					exchangeLR.call(this, 4, 252645135);
					exchangeLR.call(this, 16, 65535);
					exchangeRL.call(this, 2, 858993459);
					exchangeRL.call(this, 8, 16711935);
					exchangeLR.call(this, 1, 1431655765);
					for (var round = 0; round < 16; round++) {
						var subKey = subKeys[round];
						var lBlock = this._lBlock;
						var rBlock = this._rBlock;
						var f = 0;
						for (var i = 0; i < 8; i++) f |= SBOX_P[i][((rBlock ^ subKey[i]) & SBOX_MASK[i]) >>> 0];
						this._lBlock = rBlock;
						this._rBlock = lBlock ^ f;
					}
					var t = this._lBlock;
					this._lBlock = this._rBlock;
					this._rBlock = t;
					exchangeLR.call(this, 1, 1431655765);
					exchangeRL.call(this, 8, 16711935);
					exchangeRL.call(this, 2, 858993459);
					exchangeLR.call(this, 16, 65535);
					exchangeLR.call(this, 4, 252645135);
					M[offset] = this._lBlock;
					M[offset + 1] = this._rBlock;
				},
				keySize: 64 / 32,
				ivSize: 64 / 32,
				blockSize: 64 / 32
			});
			function exchangeLR(offset, mask) {
				var t = (this._lBlock >>> offset ^ this._rBlock) & mask;
				this._rBlock ^= t;
				this._lBlock ^= t << offset;
			}
			function exchangeRL(offset, mask) {
				var t = (this._rBlock >>> offset ^ this._lBlock) & mask;
				this._lBlock ^= t;
				this._rBlock ^= t << offset;
			}
			/**
			* Shortcut functions to the cipher's object interface.
			*
			* @example
			*
			*     var ciphertext = CryptoJS.DES.encrypt(message, key, cfg);
			*     var plaintext  = CryptoJS.DES.decrypt(ciphertext, key, cfg);
			*/
			C.DES = BlockCipher._createHelper(DES);
			/**
			* Triple-DES block cipher algorithm.
			*/
			var TripleDES = C_algo.TripleDES = BlockCipher.extend({
				_doReset: function() {
					var keyWords = this._key.words;
					if (keyWords.length !== 2 && keyWords.length !== 4 && keyWords.length < 6) throw new Error("Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.");
					var key1 = keyWords.slice(0, 2);
					var key2 = keyWords.length < 4 ? keyWords.slice(0, 2) : keyWords.slice(2, 4);
					var key3 = keyWords.length < 6 ? keyWords.slice(0, 2) : keyWords.slice(4, 6);
					this._des1 = DES.createEncryptor(WordArray.create(key1));
					this._des2 = DES.createEncryptor(WordArray.create(key2));
					this._des3 = DES.createEncryptor(WordArray.create(key3));
				},
				encryptBlock: function(M, offset) {
					this._des1.encryptBlock(M, offset);
					this._des2.decryptBlock(M, offset);
					this._des3.encryptBlock(M, offset);
				},
				decryptBlock: function(M, offset) {
					this._des3.decryptBlock(M, offset);
					this._des2.encryptBlock(M, offset);
					this._des1.decryptBlock(M, offset);
				},
				keySize: 192 / 32,
				ivSize: 64 / 32,
				blockSize: 64 / 32
			});
			/**
			* Shortcut functions to the cipher's object interface.
			*
			* @example
			*
			*     var ciphertext = CryptoJS.TripleDES.encrypt(message, key, cfg);
			*     var plaintext  = CryptoJS.TripleDES.decrypt(ciphertext, key, cfg);
			*/
			C.TripleDES = BlockCipher._createHelper(TripleDES);
		})();
		return CryptoJS.TripleDES;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/rc4.js
var require_rc4 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define([
			"./core",
			"./enc-base64",
			"./md5",
			"./evpkdf",
			"./cipher-core"
		], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var StreamCipher = C.lib.StreamCipher;
			var C_algo = C.algo;
			/**
			* RC4 stream cipher algorithm.
			*/
			var RC4 = C_algo.RC4 = StreamCipher.extend({
				_doReset: function() {
					var key = this._key;
					var keyWords = key.words;
					var keySigBytes = key.sigBytes;
					var S = this._S = [];
					for (var i = 0; i < 256; i++) S[i] = i;
					for (var i = 0, j = 0; i < 256; i++) {
						var keyByteIndex = i % keySigBytes;
						var keyByte = keyWords[keyByteIndex >>> 2] >>> 24 - keyByteIndex % 4 * 8 & 255;
						j = (j + S[i] + keyByte) % 256;
						var t = S[i];
						S[i] = S[j];
						S[j] = t;
					}
					this._i = this._j = 0;
				},
				_doProcessBlock: function(M, offset) {
					M[offset] ^= generateKeystreamWord.call(this);
				},
				keySize: 256 / 32,
				ivSize: 0
			});
			function generateKeystreamWord() {
				var S = this._S;
				var i = this._i;
				var j = this._j;
				var keystreamWord = 0;
				for (var n = 0; n < 4; n++) {
					i = (i + 1) % 256;
					j = (j + S[i]) % 256;
					var t = S[i];
					S[i] = S[j];
					S[j] = t;
					keystreamWord |= S[(S[i] + S[j]) % 256] << 24 - n * 8;
				}
				this._i = i;
				this._j = j;
				return keystreamWord;
			}
			/**
			* Shortcut functions to the cipher's object interface.
			*
			* @example
			*
			*     var ciphertext = CryptoJS.RC4.encrypt(message, key, cfg);
			*     var plaintext  = CryptoJS.RC4.decrypt(ciphertext, key, cfg);
			*/
			C.RC4 = StreamCipher._createHelper(RC4);
			/**
			* Modified RC4 stream cipher algorithm.
			*/
			var RC4Drop = C_algo.RC4Drop = RC4.extend({
				/**
				* Configuration options.
				*
				* @property {number} drop The number of keystream words to drop. Default 192
				*/
				cfg: RC4.cfg.extend({ drop: 192 }),
				_doReset: function() {
					RC4._doReset.call(this);
					for (var i = this.cfg.drop; i > 0; i--) generateKeystreamWord.call(this);
				}
			});
			/**
			* Shortcut functions to the cipher's object interface.
			*
			* @example
			*
			*     var ciphertext = CryptoJS.RC4Drop.encrypt(message, key, cfg);
			*     var plaintext  = CryptoJS.RC4Drop.decrypt(ciphertext, key, cfg);
			*/
			C.RC4Drop = StreamCipher._createHelper(RC4Drop);
		})();
		return CryptoJS.RC4;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/rabbit.js
var require_rabbit = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define([
			"./core",
			"./enc-base64",
			"./md5",
			"./evpkdf",
			"./cipher-core"
		], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var StreamCipher = C.lib.StreamCipher;
			var C_algo = C.algo;
			var S = [];
			var C_ = [];
			var G = [];
			/**
			* Rabbit stream cipher algorithm
			*/
			var Rabbit = C_algo.Rabbit = StreamCipher.extend({
				_doReset: function() {
					var K = this._key.words;
					var iv = this.cfg.iv;
					for (var i = 0; i < 4; i++) K[i] = (K[i] << 8 | K[i] >>> 24) & 16711935 | (K[i] << 24 | K[i] >>> 8) & 4278255360;
					var X = this._X = [
						K[0],
						K[3] << 16 | K[2] >>> 16,
						K[1],
						K[0] << 16 | K[3] >>> 16,
						K[2],
						K[1] << 16 | K[0] >>> 16,
						K[3],
						K[2] << 16 | K[1] >>> 16
					];
					var C = this._C = [
						K[2] << 16 | K[2] >>> 16,
						K[0] & 4294901760 | K[1] & 65535,
						K[3] << 16 | K[3] >>> 16,
						K[1] & 4294901760 | K[2] & 65535,
						K[0] << 16 | K[0] >>> 16,
						K[2] & 4294901760 | K[3] & 65535,
						K[1] << 16 | K[1] >>> 16,
						K[3] & 4294901760 | K[0] & 65535
					];
					this._b = 0;
					for (var i = 0; i < 4; i++) nextState.call(this);
					for (var i = 0; i < 8; i++) C[i] ^= X[i + 4 & 7];
					if (iv) {
						var IV = iv.words;
						var IV_0 = IV[0];
						var IV_1 = IV[1];
						var i0 = (IV_0 << 8 | IV_0 >>> 24) & 16711935 | (IV_0 << 24 | IV_0 >>> 8) & 4278255360;
						var i2 = (IV_1 << 8 | IV_1 >>> 24) & 16711935 | (IV_1 << 24 | IV_1 >>> 8) & 4278255360;
						var i1 = i0 >>> 16 | i2 & 4294901760;
						var i3 = i2 << 16 | i0 & 65535;
						C[0] ^= i0;
						C[1] ^= i1;
						C[2] ^= i2;
						C[3] ^= i3;
						C[4] ^= i0;
						C[5] ^= i1;
						C[6] ^= i2;
						C[7] ^= i3;
						for (var i = 0; i < 4; i++) nextState.call(this);
					}
				},
				_doProcessBlock: function(M, offset) {
					var X = this._X;
					nextState.call(this);
					S[0] = X[0] ^ X[5] >>> 16 ^ X[3] << 16;
					S[1] = X[2] ^ X[7] >>> 16 ^ X[5] << 16;
					S[2] = X[4] ^ X[1] >>> 16 ^ X[7] << 16;
					S[3] = X[6] ^ X[3] >>> 16 ^ X[1] << 16;
					for (var i = 0; i < 4; i++) {
						S[i] = (S[i] << 8 | S[i] >>> 24) & 16711935 | (S[i] << 24 | S[i] >>> 8) & 4278255360;
						M[offset + i] ^= S[i];
					}
				},
				blockSize: 128 / 32,
				ivSize: 64 / 32
			});
			function nextState() {
				var X = this._X;
				var C = this._C;
				for (var i = 0; i < 8; i++) C_[i] = C[i];
				C[0] = C[0] + 1295307597 + this._b | 0;
				C[1] = C[1] + 3545052371 + (C[0] >>> 0 < C_[0] >>> 0 ? 1 : 0) | 0;
				C[2] = C[2] + 886263092 + (C[1] >>> 0 < C_[1] >>> 0 ? 1 : 0) | 0;
				C[3] = C[3] + 1295307597 + (C[2] >>> 0 < C_[2] >>> 0 ? 1 : 0) | 0;
				C[4] = C[4] + 3545052371 + (C[3] >>> 0 < C_[3] >>> 0 ? 1 : 0) | 0;
				C[5] = C[5] + 886263092 + (C[4] >>> 0 < C_[4] >>> 0 ? 1 : 0) | 0;
				C[6] = C[6] + 1295307597 + (C[5] >>> 0 < C_[5] >>> 0 ? 1 : 0) | 0;
				C[7] = C[7] + 3545052371 + (C[6] >>> 0 < C_[6] >>> 0 ? 1 : 0) | 0;
				this._b = C[7] >>> 0 < C_[7] >>> 0 ? 1 : 0;
				for (var i = 0; i < 8; i++) {
					var gx = X[i] + C[i];
					var ga = gx & 65535;
					var gb = gx >>> 16;
					var gh = ((ga * ga >>> 17) + ga * gb >>> 15) + gb * gb;
					var gl = ((gx & 4294901760) * gx | 0) + ((gx & 65535) * gx | 0);
					G[i] = gh ^ gl;
				}
				X[0] = G[0] + (G[7] << 16 | G[7] >>> 16) + (G[6] << 16 | G[6] >>> 16) | 0;
				X[1] = G[1] + (G[0] << 8 | G[0] >>> 24) + G[7] | 0;
				X[2] = G[2] + (G[1] << 16 | G[1] >>> 16) + (G[0] << 16 | G[0] >>> 16) | 0;
				X[3] = G[3] + (G[2] << 8 | G[2] >>> 24) + G[1] | 0;
				X[4] = G[4] + (G[3] << 16 | G[3] >>> 16) + (G[2] << 16 | G[2] >>> 16) | 0;
				X[5] = G[5] + (G[4] << 8 | G[4] >>> 24) + G[3] | 0;
				X[6] = G[6] + (G[5] << 16 | G[5] >>> 16) + (G[4] << 16 | G[4] >>> 16) | 0;
				X[7] = G[7] + (G[6] << 8 | G[6] >>> 24) + G[5] | 0;
			}
			/**
			* Shortcut functions to the cipher's object interface.
			*
			* @example
			*
			*     var ciphertext = CryptoJS.Rabbit.encrypt(message, key, cfg);
			*     var plaintext  = CryptoJS.Rabbit.decrypt(ciphertext, key, cfg);
			*/
			C.Rabbit = StreamCipher._createHelper(Rabbit);
		})();
		return CryptoJS.Rabbit;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/rabbit-legacy.js
var require_rabbit_legacy = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define([
			"./core",
			"./enc-base64",
			"./md5",
			"./evpkdf",
			"./cipher-core"
		], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var StreamCipher = C.lib.StreamCipher;
			var C_algo = C.algo;
			var S = [];
			var C_ = [];
			var G = [];
			/**
			* Rabbit stream cipher algorithm.
			*
			* This is a legacy version that neglected to convert the key to little-endian.
			* This error doesn't affect the cipher's security,
			* but it does affect its compatibility with other implementations.
			*/
			var RabbitLegacy = C_algo.RabbitLegacy = StreamCipher.extend({
				_doReset: function() {
					var K = this._key.words;
					var iv = this.cfg.iv;
					var X = this._X = [
						K[0],
						K[3] << 16 | K[2] >>> 16,
						K[1],
						K[0] << 16 | K[3] >>> 16,
						K[2],
						K[1] << 16 | K[0] >>> 16,
						K[3],
						K[2] << 16 | K[1] >>> 16
					];
					var C = this._C = [
						K[2] << 16 | K[2] >>> 16,
						K[0] & 4294901760 | K[1] & 65535,
						K[3] << 16 | K[3] >>> 16,
						K[1] & 4294901760 | K[2] & 65535,
						K[0] << 16 | K[0] >>> 16,
						K[2] & 4294901760 | K[3] & 65535,
						K[1] << 16 | K[1] >>> 16,
						K[3] & 4294901760 | K[0] & 65535
					];
					this._b = 0;
					for (var i = 0; i < 4; i++) nextState.call(this);
					for (var i = 0; i < 8; i++) C[i] ^= X[i + 4 & 7];
					if (iv) {
						var IV = iv.words;
						var IV_0 = IV[0];
						var IV_1 = IV[1];
						var i0 = (IV_0 << 8 | IV_0 >>> 24) & 16711935 | (IV_0 << 24 | IV_0 >>> 8) & 4278255360;
						var i2 = (IV_1 << 8 | IV_1 >>> 24) & 16711935 | (IV_1 << 24 | IV_1 >>> 8) & 4278255360;
						var i1 = i0 >>> 16 | i2 & 4294901760;
						var i3 = i2 << 16 | i0 & 65535;
						C[0] ^= i0;
						C[1] ^= i1;
						C[2] ^= i2;
						C[3] ^= i3;
						C[4] ^= i0;
						C[5] ^= i1;
						C[6] ^= i2;
						C[7] ^= i3;
						for (var i = 0; i < 4; i++) nextState.call(this);
					}
				},
				_doProcessBlock: function(M, offset) {
					var X = this._X;
					nextState.call(this);
					S[0] = X[0] ^ X[5] >>> 16 ^ X[3] << 16;
					S[1] = X[2] ^ X[7] >>> 16 ^ X[5] << 16;
					S[2] = X[4] ^ X[1] >>> 16 ^ X[7] << 16;
					S[3] = X[6] ^ X[3] >>> 16 ^ X[1] << 16;
					for (var i = 0; i < 4; i++) {
						S[i] = (S[i] << 8 | S[i] >>> 24) & 16711935 | (S[i] << 24 | S[i] >>> 8) & 4278255360;
						M[offset + i] ^= S[i];
					}
				},
				blockSize: 128 / 32,
				ivSize: 64 / 32
			});
			function nextState() {
				var X = this._X;
				var C = this._C;
				for (var i = 0; i < 8; i++) C_[i] = C[i];
				C[0] = C[0] + 1295307597 + this._b | 0;
				C[1] = C[1] + 3545052371 + (C[0] >>> 0 < C_[0] >>> 0 ? 1 : 0) | 0;
				C[2] = C[2] + 886263092 + (C[1] >>> 0 < C_[1] >>> 0 ? 1 : 0) | 0;
				C[3] = C[3] + 1295307597 + (C[2] >>> 0 < C_[2] >>> 0 ? 1 : 0) | 0;
				C[4] = C[4] + 3545052371 + (C[3] >>> 0 < C_[3] >>> 0 ? 1 : 0) | 0;
				C[5] = C[5] + 886263092 + (C[4] >>> 0 < C_[4] >>> 0 ? 1 : 0) | 0;
				C[6] = C[6] + 1295307597 + (C[5] >>> 0 < C_[5] >>> 0 ? 1 : 0) | 0;
				C[7] = C[7] + 3545052371 + (C[6] >>> 0 < C_[6] >>> 0 ? 1 : 0) | 0;
				this._b = C[7] >>> 0 < C_[7] >>> 0 ? 1 : 0;
				for (var i = 0; i < 8; i++) {
					var gx = X[i] + C[i];
					var ga = gx & 65535;
					var gb = gx >>> 16;
					var gh = ((ga * ga >>> 17) + ga * gb >>> 15) + gb * gb;
					var gl = ((gx & 4294901760) * gx | 0) + ((gx & 65535) * gx | 0);
					G[i] = gh ^ gl;
				}
				X[0] = G[0] + (G[7] << 16 | G[7] >>> 16) + (G[6] << 16 | G[6] >>> 16) | 0;
				X[1] = G[1] + (G[0] << 8 | G[0] >>> 24) + G[7] | 0;
				X[2] = G[2] + (G[1] << 16 | G[1] >>> 16) + (G[0] << 16 | G[0] >>> 16) | 0;
				X[3] = G[3] + (G[2] << 8 | G[2] >>> 24) + G[1] | 0;
				X[4] = G[4] + (G[3] << 16 | G[3] >>> 16) + (G[2] << 16 | G[2] >>> 16) | 0;
				X[5] = G[5] + (G[4] << 8 | G[4] >>> 24) + G[3] | 0;
				X[6] = G[6] + (G[5] << 16 | G[5] >>> 16) + (G[4] << 16 | G[4] >>> 16) | 0;
				X[7] = G[7] + (G[6] << 8 | G[6] >>> 24) + G[5] | 0;
			}
			/**
			* Shortcut functions to the cipher's object interface.
			*
			* @example
			*
			*     var ciphertext = CryptoJS.RabbitLegacy.encrypt(message, key, cfg);
			*     var plaintext  = CryptoJS.RabbitLegacy.decrypt(ciphertext, key, cfg);
			*/
			C.RabbitLegacy = StreamCipher._createHelper(RabbitLegacy);
		})();
		return CryptoJS.RabbitLegacy;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/crypto-js@4.2.0/node_modules/crypto-js/blowfish.js
var require_blowfish = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_enc_base64(), require_md5(), require_evpkdf(), require_cipher_core());
		else if (typeof define === "function" && define.amd) define([
			"./core",
			"./enc-base64",
			"./md5",
			"./evpkdf",
			"./cipher-core"
		], factory);
		else factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		(function() {
			var C = CryptoJS;
			var BlockCipher = C.lib.BlockCipher;
			var C_algo = C.algo;
			const N = 16;
			const ORIG_P = [
				608135816,
				2242054355,
				320440878,
				57701188,
				2752067618,
				698298832,
				137296536,
				3964562569,
				1160258022,
				953160567,
				3193202383,
				887688300,
				3232508343,
				3380367581,
				1065670069,
				3041331479,
				2450970073,
				2306472731
			];
			const ORIG_S = [
				[
					3509652390,
					2564797868,
					805139163,
					3491422135,
					3101798381,
					1780907670,
					3128725573,
					4046225305,
					614570311,
					3012652279,
					134345442,
					2240740374,
					1667834072,
					1901547113,
					2757295779,
					4103290238,
					227898511,
					1921955416,
					1904987480,
					2182433518,
					2069144605,
					3260701109,
					2620446009,
					720527379,
					3318853667,
					677414384,
					3393288472,
					3101374703,
					2390351024,
					1614419982,
					1822297739,
					2954791486,
					3608508353,
					3174124327,
					2024746970,
					1432378464,
					3864339955,
					2857741204,
					1464375394,
					1676153920,
					1439316330,
					715854006,
					3033291828,
					289532110,
					2706671279,
					2087905683,
					3018724369,
					1668267050,
					732546397,
					1947742710,
					3462151702,
					2609353502,
					2950085171,
					1814351708,
					2050118529,
					680887927,
					999245976,
					1800124847,
					3300911131,
					1713906067,
					1641548236,
					4213287313,
					1216130144,
					1575780402,
					4018429277,
					3917837745,
					3693486850,
					3949271944,
					596196993,
					3549867205,
					258830323,
					2213823033,
					772490370,
					2760122372,
					1774776394,
					2652871518,
					566650946,
					4142492826,
					1728879713,
					2882767088,
					1783734482,
					3629395816,
					2517608232,
					2874225571,
					1861159788,
					326777828,
					3124490320,
					2130389656,
					2716951837,
					967770486,
					1724537150,
					2185432712,
					2364442137,
					1164943284,
					2105845187,
					998989502,
					3765401048,
					2244026483,
					1075463327,
					1455516326,
					1322494562,
					910128902,
					469688178,
					1117454909,
					936433444,
					3490320968,
					3675253459,
					1240580251,
					122909385,
					2157517691,
					634681816,
					4142456567,
					3825094682,
					3061402683,
					2540495037,
					79693498,
					3249098678,
					1084186820,
					1583128258,
					426386531,
					1761308591,
					1047286709,
					322548459,
					995290223,
					1845252383,
					2603652396,
					3431023940,
					2942221577,
					3202600964,
					3727903485,
					1712269319,
					422464435,
					3234572375,
					1170764815,
					3523960633,
					3117677531,
					1434042557,
					442511882,
					3600875718,
					1076654713,
					1738483198,
					4213154764,
					2393238008,
					3677496056,
					1014306527,
					4251020053,
					793779912,
					2902807211,
					842905082,
					4246964064,
					1395751752,
					1040244610,
					2656851899,
					3396308128,
					445077038,
					3742853595,
					3577915638,
					679411651,
					2892444358,
					2354009459,
					1767581616,
					3150600392,
					3791627101,
					3102740896,
					284835224,
					4246832056,
					1258075500,
					768725851,
					2589189241,
					3069724005,
					3532540348,
					1274779536,
					3789419226,
					2764799539,
					1660621633,
					3471099624,
					4011903706,
					913787905,
					3497959166,
					737222580,
					2514213453,
					2928710040,
					3937242737,
					1804850592,
					3499020752,
					2949064160,
					2386320175,
					2390070455,
					2415321851,
					4061277028,
					2290661394,
					2416832540,
					1336762016,
					1754252060,
					3520065937,
					3014181293,
					791618072,
					3188594551,
					3933548030,
					2332172193,
					3852520463,
					3043980520,
					413987798,
					3465142937,
					3030929376,
					4245938359,
					2093235073,
					3534596313,
					375366246,
					2157278981,
					2479649556,
					555357303,
					3870105701,
					2008414854,
					3344188149,
					4221384143,
					3956125452,
					2067696032,
					3594591187,
					2921233993,
					2428461,
					544322398,
					577241275,
					1471733935,
					610547355,
					4027169054,
					1432588573,
					1507829418,
					2025931657,
					3646575487,
					545086370,
					48609733,
					2200306550,
					1653985193,
					298326376,
					1316178497,
					3007786442,
					2064951626,
					458293330,
					2589141269,
					3591329599,
					3164325604,
					727753846,
					2179363840,
					146436021,
					1461446943,
					4069977195,
					705550613,
					3059967265,
					3887724982,
					4281599278,
					3313849956,
					1404054877,
					2845806497,
					146425753,
					1854211946
				],
				[
					1266315497,
					3048417604,
					3681880366,
					3289982499,
					290971e4,
					1235738493,
					2632868024,
					2414719590,
					3970600049,
					1771706367,
					1449415276,
					3266420449,
					422970021,
					1963543593,
					2690192192,
					3826793022,
					1062508698,
					1531092325,
					1804592342,
					2583117782,
					2714934279,
					4024971509,
					1294809318,
					4028980673,
					1289560198,
					2221992742,
					1669523910,
					35572830,
					157838143,
					1052438473,
					1016535060,
					1802137761,
					1753167236,
					1386275462,
					3080475397,
					2857371447,
					1040679964,
					2145300060,
					2390574316,
					1461121720,
					2956646967,
					4031777805,
					4028374788,
					33600511,
					2920084762,
					1018524850,
					629373528,
					3691585981,
					3515945977,
					2091462646,
					2486323059,
					586499841,
					988145025,
					935516892,
					3367335476,
					2599673255,
					2839830854,
					265290510,
					3972581182,
					2759138881,
					3795373465,
					1005194799,
					847297441,
					406762289,
					1314163512,
					1332590856,
					1866599683,
					4127851711,
					750260880,
					613907577,
					1450815602,
					3165620655,
					3734664991,
					3650291728,
					3012275730,
					3704569646,
					1427272223,
					778793252,
					1343938022,
					2676280711,
					2052605720,
					1946737175,
					3164576444,
					3914038668,
					3967478842,
					3682934266,
					1661551462,
					3294938066,
					4011595847,
					840292616,
					3712170807,
					616741398,
					312560963,
					711312465,
					1351876610,
					322626781,
					1910503582,
					271666773,
					2175563734,
					1594956187,
					70604529,
					3617834859,
					1007753275,
					1495573769,
					4069517037,
					2549218298,
					2663038764,
					504708206,
					2263041392,
					3941167025,
					2249088522,
					1514023603,
					1998579484,
					1312622330,
					694541497,
					2582060303,
					2151582166,
					1382467621,
					776784248,
					2618340202,
					3323268794,
					2497899128,
					2784771155,
					503983604,
					4076293799,
					907881277,
					423175695,
					432175456,
					1378068232,
					4145222326,
					3954048622,
					3938656102,
					3820766613,
					2793130115,
					2977904593,
					26017576,
					3274890735,
					3194772133,
					1700274565,
					1756076034,
					4006520079,
					3677328699,
					720338349,
					1533947780,
					354530856,
					688349552,
					3973924725,
					1637815568,
					332179504,
					3949051286,
					53804574,
					2852348879,
					3044236432,
					1282449977,
					3583942155,
					3416972820,
					4006381244,
					1617046695,
					2628476075,
					3002303598,
					1686838959,
					431878346,
					2686675385,
					1700445008,
					1080580658,
					1009431731,
					832498133,
					3223435511,
					2605976345,
					2271191193,
					2516031870,
					1648197032,
					4164389018,
					2548247927,
					300782431,
					375919233,
					238389289,
					3353747414,
					2531188641,
					2019080857,
					1475708069,
					455242339,
					2609103871,
					448939670,
					3451063019,
					1395535956,
					2413381860,
					1841049896,
					1491858159,
					885456874,
					4264095073,
					4001119347,
					1565136089,
					3898914787,
					1108368660,
					540939232,
					1173283510,
					2745871338,
					3681308437,
					4207628240,
					3343053890,
					4016749493,
					1699691293,
					1103962373,
					3625875870,
					2256883143,
					3830138730,
					1031889488,
					3479347698,
					1535977030,
					4236805024,
					3251091107,
					2132092099,
					1774941330,
					1199868427,
					1452454533,
					157007616,
					2904115357,
					342012276,
					595725824,
					1480756522,
					206960106,
					497939518,
					591360097,
					863170706,
					2375253569,
					3596610801,
					1814182875,
					2094937945,
					3421402208,
					1082520231,
					3463918190,
					2785509508,
					435703966,
					3908032597,
					1641649973,
					2842273706,
					3305899714,
					1510255612,
					2148256476,
					2655287854,
					3276092548,
					4258621189,
					236887753,
					3681803219,
					274041037,
					1734335097,
					3815195456,
					3317970021,
					1899903192,
					1026095262,
					4050517792,
					356393447,
					2410691914,
					3873677099,
					3682840055
				],
				[
					3913112168,
					2491498743,
					4132185628,
					2489919796,
					1091903735,
					1979897079,
					3170134830,
					3567386728,
					3557303409,
					857797738,
					1136121015,
					1342202287,
					507115054,
					2535736646,
					337727348,
					3213592640,
					1301675037,
					2528481711,
					1895095763,
					1721773893,
					3216771564,
					62756741,
					2142006736,
					835421444,
					2531993523,
					1442658625,
					3659876326,
					2882144922,
					676362277,
					1392781812,
					170690266,
					3921047035,
					1759253602,
					3611846912,
					1745797284,
					664899054,
					1329594018,
					3901205900,
					3045908486,
					2062866102,
					2865634940,
					3543621612,
					3464012697,
					1080764994,
					553557557,
					3656615353,
					3996768171,
					991055499,
					499776247,
					1265440854,
					648242737,
					3940784050,
					980351604,
					3713745714,
					1749149687,
					3396870395,
					4211799374,
					3640570775,
					1161844396,
					3125318951,
					1431517754,
					545492359,
					4268468663,
					3499529547,
					1437099964,
					2702547544,
					3433638243,
					2581715763,
					2787789398,
					1060185593,
					1593081372,
					2418618748,
					4260947970,
					69676912,
					2159744348,
					86519011,
					2512459080,
					3838209314,
					1220612927,
					3339683548,
					133810670,
					1090789135,
					1078426020,
					1569222167,
					845107691,
					3583754449,
					4072456591,
					1091646820,
					628848692,
					1613405280,
					3757631651,
					526609435,
					236106946,
					48312990,
					2942717905,
					3402727701,
					1797494240,
					859738849,
					992217954,
					4005476642,
					2243076622,
					3870952857,
					3732016268,
					765654824,
					3490871365,
					2511836413,
					1685915746,
					3888969200,
					1414112111,
					2273134842,
					3281911079,
					4080962846,
					172450625,
					2569994100,
					980381355,
					4109958455,
					2819808352,
					2716589560,
					2568741196,
					3681446669,
					3329971472,
					1835478071,
					660984891,
					3704678404,
					4045999559,
					3422617507,
					3040415634,
					1762651403,
					1719377915,
					3470491036,
					2693910283,
					3642056355,
					3138596744,
					1364962596,
					2073328063,
					1983633131,
					926494387,
					3423689081,
					2150032023,
					4096667949,
					1749200295,
					3328846651,
					309677260,
					2016342300,
					1779581495,
					3079819751,
					111262694,
					1274766160,
					443224088,
					298511866,
					1025883608,
					3806446537,
					1145181785,
					168956806,
					3641502830,
					3584813610,
					1689216846,
					3666258015,
					3200248200,
					1692713982,
					2646376535,
					4042768518,
					1618508792,
					1610833997,
					3523052358,
					4130873264,
					2001055236,
					3610705100,
					2202168115,
					4028541809,
					2961195399,
					1006657119,
					2006996926,
					3186142756,
					1430667929,
					3210227297,
					1314452623,
					4074634658,
					4101304120,
					2273951170,
					1399257539,
					3367210612,
					3027628629,
					1190975929,
					2062231137,
					2333990788,
					2221543033,
					2438960610,
					1181637006,
					548689776,
					2362791313,
					3372408396,
					3104550113,
					3145860560,
					296247880,
					1970579870,
					3078560182,
					3769228297,
					1714227617,
					3291629107,
					3898220290,
					166772364,
					1251581989,
					493813264,
					448347421,
					195405023,
					2709975567,
					677966185,
					3703036547,
					1463355134,
					2715995803,
					1338867538,
					1343315457,
					2802222074,
					2684532164,
					233230375,
					2599980071,
					2000651841,
					3277868038,
					1638401717,
					4028070440,
					3237316320,
					6314154,
					819756386,
					300326615,
					590932579,
					1405279636,
					3267499572,
					3150704214,
					2428286686,
					3959192993,
					3461946742,
					1862657033,
					1266418056,
					963775037,
					2089974820,
					2263052895,
					1917689273,
					448879540,
					3550394620,
					3981727096,
					150775221,
					3627908307,
					1303187396,
					508620638,
					2975983352,
					2726630617,
					1817252668,
					1876281319,
					1457606340,
					908771278,
					3720792119,
					3617206836,
					2455994898,
					1729034894,
					1080033504
				],
				[
					976866871,
					3556439503,
					2881648439,
					1522871579,
					1555064734,
					1336096578,
					3548522304,
					2579274686,
					3574697629,
					3205460757,
					3593280638,
					3338716283,
					3079412587,
					564236357,
					2993598910,
					1781952180,
					1464380207,
					3163844217,
					3332601554,
					1699332808,
					1393555694,
					1183702653,
					3581086237,
					1288719814,
					691649499,
					2847557200,
					2895455976,
					3193889540,
					2717570544,
					1781354906,
					1676643554,
					2592534050,
					3230253752,
					1126444790,
					2770207658,
					2633158820,
					2210423226,
					2615765581,
					2414155088,
					3127139286,
					673620729,
					2805611233,
					1269405062,
					4015350505,
					3341807571,
					4149409754,
					1057255273,
					2012875353,
					2162469141,
					2276492801,
					2601117357,
					993977747,
					3918593370,
					2654263191,
					753973209,
					36408145,
					2530585658,
					25011837,
					3520020182,
					2088578344,
					530523599,
					2918365339,
					1524020338,
					1518925132,
					3760827505,
					3759777254,
					1202760957,
					3985898139,
					3906192525,
					674977740,
					4174734889,
					2031300136,
					2019492241,
					3983892565,
					4153806404,
					3822280332,
					352677332,
					2297720250,
					60907813,
					90501309,
					3286998549,
					1016092578,
					2535922412,
					2839152426,
					457141659,
					509813237,
					4120667899,
					652014361,
					1966332200,
					2975202805,
					55981186,
					2327461051,
					676427537,
					3255491064,
					2882294119,
					3433927263,
					1307055953,
					942726286,
					933058658,
					2468411793,
					3933900994,
					4215176142,
					1361170020,
					2001714738,
					2830558078,
					3274259782,
					1222529897,
					1679025792,
					2729314320,
					3714953764,
					1770335741,
					151462246,
					3013232138,
					1682292957,
					1483529935,
					471910574,
					1539241949,
					458788160,
					3436315007,
					1807016891,
					3718408830,
					978976581,
					1043663428,
					3165965781,
					1927990952,
					4200891579,
					2372276910,
					3208408903,
					3533431907,
					1412390302,
					2931980059,
					4132332400,
					1947078029,
					3881505623,
					4168226417,
					2941484381,
					1077988104,
					1320477388,
					886195818,
					18198404,
					3786409e3,
					2509781533,
					112762804,
					3463356488,
					1866414978,
					891333506,
					18488651,
					661792760,
					1628790961,
					3885187036,
					3141171499,
					876946877,
					2693282273,
					1372485963,
					791857591,
					2686433993,
					3759982718,
					3167212022,
					3472953795,
					2716379847,
					445679433,
					3561995674,
					3504004811,
					3574258232,
					54117162,
					3331405415,
					2381918588,
					3769707343,
					4154350007,
					1140177722,
					4074052095,
					668550556,
					3214352940,
					367459370,
					261225585,
					2610173221,
					4209349473,
					3468074219,
					3265815641,
					314222801,
					3066103646,
					3808782860,
					282218597,
					3406013506,
					3773591054,
					379116347,
					1285071038,
					846784868,
					2669647154,
					3771962079,
					3550491691,
					2305946142,
					453669953,
					1268987020,
					3317592352,
					3279303384,
					3744833421,
					2610507566,
					3859509063,
					266596637,
					3847019092,
					517658769,
					3462560207,
					3443424879,
					370717030,
					4247526661,
					2224018117,
					4143653529,
					4112773975,
					2788324899,
					2477274417,
					1456262402,
					2901442914,
					1517677493,
					1846949527,
					2295493580,
					3734397586,
					2176403920,
					1280348187,
					1908823572,
					3871786941,
					846861322,
					1172426758,
					3287448474,
					3383383037,
					1655181056,
					3139813346,
					901632758,
					1897031941,
					2986607138,
					3066810236,
					3447102507,
					1393639104,
					373351379,
					950779232,
					625454576,
					3124240540,
					4148612726,
					2007998917,
					544563296,
					2244738638,
					2330496472,
					2058025392,
					1291430526,
					424198748,
					50039436,
					29584100,
					3605783033,
					2429876329,
					2791104160,
					1057563949,
					3255363231,
					3075367218,
					3463963227,
					1469046755,
					985887462
				]
			];
			var BLOWFISH_CTX = {
				pbox: [],
				sbox: []
			};
			function F(ctx, x) {
				let a = x >> 24 & 255;
				let b = x >> 16 & 255;
				let c = x >> 8 & 255;
				let d = x & 255;
				let y = ctx.sbox[0][a] + ctx.sbox[1][b];
				y = y ^ ctx.sbox[2][c];
				y = y + ctx.sbox[3][d];
				return y;
			}
			function BlowFish_Encrypt(ctx, left, right) {
				let Xl = left;
				let Xr = right;
				let temp;
				for (let i = 0; i < N; ++i) {
					Xl = Xl ^ ctx.pbox[i];
					Xr = F(ctx, Xl) ^ Xr;
					temp = Xl;
					Xl = Xr;
					Xr = temp;
				}
				temp = Xl;
				Xl = Xr;
				Xr = temp;
				Xr = Xr ^ ctx.pbox[N];
				Xl = Xl ^ ctx.pbox[17];
				return {
					left: Xl,
					right: Xr
				};
			}
			function BlowFish_Decrypt(ctx, left, right) {
				let Xl = left;
				let Xr = right;
				let temp;
				for (let i = 17; i > 1; --i) {
					Xl = Xl ^ ctx.pbox[i];
					Xr = F(ctx, Xl) ^ Xr;
					temp = Xl;
					Xl = Xr;
					Xr = temp;
				}
				temp = Xl;
				Xl = Xr;
				Xr = temp;
				Xr = Xr ^ ctx.pbox[1];
				Xl = Xl ^ ctx.pbox[0];
				return {
					left: Xl,
					right: Xr
				};
			}
			/**
			* Initialization ctx's pbox and sbox.
			*
			* @param {Object} ctx The object has pbox and sbox.
			* @param {Array} key An array of 32-bit words.
			* @param {int} keysize The length of the key.
			*
			* @example
			*
			*     BlowFishInit(BLOWFISH_CTX, key, 128/32);
			*/
			function BlowFishInit(ctx, key, keysize) {
				for (let Row = 0; Row < 4; Row++) {
					ctx.sbox[Row] = [];
					for (let Col = 0; Col < 256; Col++) ctx.sbox[Row][Col] = ORIG_S[Row][Col];
				}
				let keyIndex = 0;
				for (let index = 0; index < 18; index++) {
					ctx.pbox[index] = ORIG_P[index] ^ key[keyIndex];
					keyIndex++;
					if (keyIndex >= keysize) keyIndex = 0;
				}
				let Data1 = 0;
				let Data2 = 0;
				let res = 0;
				for (let i = 0; i < 18; i += 2) {
					res = BlowFish_Encrypt(ctx, Data1, Data2);
					Data1 = res.left;
					Data2 = res.right;
					ctx.pbox[i] = Data1;
					ctx.pbox[i + 1] = Data2;
				}
				for (let i = 0; i < 4; i++) for (let j = 0; j < 256; j += 2) {
					res = BlowFish_Encrypt(ctx, Data1, Data2);
					Data1 = res.left;
					Data2 = res.right;
					ctx.sbox[i][j] = Data1;
					ctx.sbox[i][j + 1] = Data2;
				}
				return true;
			}
			/**
			* Blowfish block cipher algorithm.
			*/
			var Blowfish = C_algo.Blowfish = BlockCipher.extend({
				_doReset: function() {
					if (this._keyPriorReset === this._key) return;
					var key = this._keyPriorReset = this._key;
					var keyWords = key.words;
					BlowFishInit(BLOWFISH_CTX, keyWords, key.sigBytes / 4);
				},
				encryptBlock: function(M, offset) {
					var res = BlowFish_Encrypt(BLOWFISH_CTX, M[offset], M[offset + 1]);
					M[offset] = res.left;
					M[offset + 1] = res.right;
				},
				decryptBlock: function(M, offset) {
					var res = BlowFish_Decrypt(BLOWFISH_CTX, M[offset], M[offset + 1]);
					M[offset] = res.left;
					M[offset + 1] = res.right;
				},
				blockSize: 64 / 32,
				keySize: 128 / 32,
				ivSize: 64 / 32
			});
			/**
			* Shortcut functions to the cipher's object interface.
			*
			* @example
			*
			*     var ciphertext = CryptoJS.Blowfish.encrypt(message, key, cfg);
			*     var plaintext  = CryptoJS.Blowfish.decrypt(ciphertext, key, cfg);
			*/
			C.Blowfish = BlockCipher._createHelper(Blowfish);
		})();
		return CryptoJS.Blowfish;
	});
}));
//#endregion
//#region ../../packages/utils/src/modules/aes.ts
var import_crypto_js = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory, undef) {
		if (typeof exports === "object") module.exports = exports = factory(require_core(), require_x64_core(), require_lib_typedarrays(), require_enc_utf16(), require_enc_base64(), require_enc_base64url(), require_md5(), require_sha1(), require_sha256(), require_sha224(), require_sha512(), require_sha384(), require_sha3(), require_ripemd160(), require_hmac(), require_pbkdf2(), require_evpkdf(), require_cipher_core(), require_mode_cfb(), require_mode_ctr(), require_mode_ctr_gladman(), require_mode_ofb(), require_mode_ecb(), require_pad_ansix923(), require_pad_iso10126(), require_pad_iso97971(), require_pad_zeropadding(), require_pad_nopadding(), require_format_hex(), require_aes(), require_tripledes(), require_rc4(), require_rabbit(), require_rabbit_legacy(), require_blowfish());
		else if (typeof define === "function" && define.amd) define([
			"./core",
			"./x64-core",
			"./lib-typedarrays",
			"./enc-utf16",
			"./enc-base64",
			"./enc-base64url",
			"./md5",
			"./sha1",
			"./sha256",
			"./sha224",
			"./sha512",
			"./sha384",
			"./sha3",
			"./ripemd160",
			"./hmac",
			"./pbkdf2",
			"./evpkdf",
			"./cipher-core",
			"./mode-cfb",
			"./mode-ctr",
			"./mode-ctr-gladman",
			"./mode-ofb",
			"./mode-ecb",
			"./pad-ansix923",
			"./pad-iso10126",
			"./pad-iso97971",
			"./pad-zeropadding",
			"./pad-nopadding",
			"./format-hex",
			"./aes",
			"./tripledes",
			"./rc4",
			"./rabbit",
			"./rabbit-legacy",
			"./blowfish"
		], factory);
		else root.CryptoJS = factory(root.CryptoJS);
	})(exports, function(CryptoJS) {
		return CryptoJS;
	});
})))(), 1);
/** AES/ECB/Pkcs7 加密 */
function encrypt(data, key) {
	const secret = import_crypto_js.default.enc.Utf8.parse(key);
	const plain = import_crypto_js.default.enc.Utf8.parse(data);
	return import_crypto_js.default.AES.encrypt(plain, secret, {
		mode: import_crypto_js.default.mode.ECB,
		padding: import_crypto_js.default.pad.Pkcs7
	}).toString();
}
/** AES/ECB/Pkcs7 解密 */
function decrypt(data, key) {
	const secret = import_crypto_js.default.enc.Utf8.parse(key);
	const decrypted = import_crypto_js.default.AES.decrypt(data, secret, {
		mode: import_crypto_js.default.mode.ECB,
		padding: import_crypto_js.default.pad.Pkcs7
	});
	return import_crypto_js.default.enc.Utf8.stringify(decrypted).toString();
}
//#endregion
//#region ../../packages/utils/src/storage.ts
/** 过期标记 */
var EXPIRES_KEY_SUFFIX = "__expires__";
var StorageWrapper = class {
	store;
	options;
	prefix;
	noPrefixKeys;
	userScopeKeys;
	/** userId getter（运行时调用，避免循环依赖） */
	resolveUserId;
	/** 显式传入的 encode 覆盖（优先级最高）；未传时实时从 config.storage.encode 读 */
	encodeOverride;
	/** 显式注入的加解密函数（用于 wasm 等外部算法） */
	encodeFnOverride;
	decodeFnOverride;
	constructor(store, options = {}) {
		this.store = store;
		this.options = options;
		this.prefix = options.prefix ?? "";
		this.noPrefixKeys = options.noPrefixKeys ?? [];
		this.userScopeKeys = options.userScopeKeys ?? [];
		this.resolveUserId = options.resolveUserId;
		this.encodeOverride = options.encode;
		this.encodeFnOverride = options.encodeFn;
		this.decodeFnOverride = options.decodeFn;
	}
	/**
	* 实时读取加解密开关。
	* 优先级：显式 encodeOverride > config.storage.encode（每次实时读，响应 yaml/远程/热更新）
	* 这样 piniaStorage / tokenStorage / buildStorage 等实例无需重建，
	* yaml 里改了 encode 后下次 set/get 自动走新规则。
	*/
	get encode() {
		if (this.encodeOverride !== void 0) return this.encodeOverride;
		return getConfig()?.storage?.encode ?? false;
	}
	/**
	* 实时读取加密函数。
	* 显式注入优先；否则按当前 encode + config.storage.key 内部用 AES。
	* decode 同理（对称封装）。
	*/
	get encodeFn() {
		if (this.encodeFnOverride) return this.encodeFnOverride;
		if (this.encode) {
			const key = getConfig()?.storage?.key;
			if (key) return (plain) => encrypt(plain, key);
		}
	}
	get decodeFn() {
		if (this.decodeFnOverride) return this.decodeFnOverride;
		if (this.encode) {
			const key = getConfig()?.storage?.key;
			if (key) return (encrypted) => decrypt(encrypted, key);
		}
	}
	/** 写入前编码（JSON 序列化 + 可选加密）；加密失败降级明文，防止写入异常导致系统崩溃 */
	encodeValue(value) {
		const json = JSON.stringify(value);
		if (this.encode && this.encodeFn) try {
			return this.encodeFn(json);
		} catch {
			return json;
		}
		return json;
	}
	/**
	* 读取后解码（可选解密 + JSON 反序列化）
	* 解密失败自动降级：先按明文 JSON 尝试，仍失败返回原文串，防止系统崩溃。
	*/
	decodeValue(raw) {
		if (this.encode && this.decodeFn) try {
			return JSON.parse(this.decodeFn(raw));
		} catch {
			try {
				return JSON.parse(raw);
			} catch {
				return raw;
			}
		}
		return JSON.parse(raw);
	}
	/**
	* 带前缀的完整 key
	*   - noPrefixKeys 列表内的 key：不加前缀（跨应用共享）
	*   - userScopeKeys 列表内的 key：自动注入当前 userId（按账号隔离）
	*   - 其余：${prefix}:${key}
	*/
	buildKey(key) {
		if (this.noPrefixKeys.includes(key)) return key;
		if (this.userScopeKeys.includes(key) && this.resolveUserId) {
			const uid = this.resolveUserId();
			return this.prefix ? `${this.prefix}:${uid}:${key}` : `${uid}:${key}`;
		}
		return this.prefix ? `${this.prefix}:${key}` : key;
	}
	/** 是否为不添加前缀的 key */
	isNoPrefixKey(key) {
		return this.noPrefixKeys.includes(key);
	}
	/**
	* 写入（自动 JSON 序列化，可选加密，可选 TTL）
	* @returns 写入是否成功（异常时返回 false，如隐私模式）
	*/
	set(key, value, expires) {
		try {
			const fullKey = this.buildKey(key);
			this.store.setItem(fullKey, this.encodeValue(value));
			const ttl = expires ?? this.options.expires;
			if (ttl) this.store.setItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`, String(Date.now() + ttl));
			else this.store.removeItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`);
			return true;
		} catch {
			return false;
		}
	}
	/**
	* 读取（自动解密与 JSON 反序列化，已过期返回 null 并清除）
	* @param defaultValue 不存在、已过期或解析失败时返回的默认值
	*/
	get(key, defaultValue = null) {
		const fullKey = this.buildKey(key);
		try {
			const raw = this.store.getItem(fullKey);
			if (raw === null || raw === void 0) return defaultValue;
			const expiresAt = Number(this.store.getItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`));
			if (expiresAt && Date.now() > expiresAt) {
				this.remove(key);
				return defaultValue;
			}
			return this.decodeValue(raw);
		} catch {
			return defaultValue;
		}
	}
	/** 删除 */
	remove(key) {
		const fullKey = this.buildKey(key);
		this.store.removeItem(fullKey);
		this.store.removeItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`);
	}
	/** 是否存在（未过期才算存在） */
	has(key) {
		const fullKey = this.buildKey(key);
		const raw = this.store.getItem(fullKey);
		if (raw === null || raw === void 0) return false;
		const expiresAt = Number(this.store.getItem(`${fullKey}${EXPIRES_KEY_SUFFIX}`));
		return !(expiresAt && Date.now() > expiresAt);
	}
	/** 清空当前命名空间下的所有 key */
	clear() {
		const prefix = this.prefix ? `${this.prefix}:` : "";
		const keysToRemove = [];
		for (let i = 0; i < this.store.length; i++) {
			const storeKey = this.store.key(i);
			if (!storeKey) continue;
			if (storeKey.startsWith(prefix) || this.isNoPrefixKey(storeKey)) keysToRemove.push(storeKey);
		}
		keysToRemove.forEach((k) => this.store.removeItem(k));
	}
	/**
	* 清空用户级存储（登录跳转时调用）
	* 保留 noPrefixKeys（如 sys-fingerprint），删除所有带前缀的用户/应用级 key
	*/
	clearUserStorage() {
		const prefix = this.prefix ? `${this.prefix}:` : "";
		for (let i = 0; i < this.store.length; i++) {
			const storeKey = this.store.key(i);
			if (!storeKey) continue;
			if (storeKey.startsWith(prefix)) {
				this.store.removeItem(storeKey);
				const expiresKey = storeKey + EXPIRES_KEY_SUFFIX;
				this.store.removeItem(expiresKey);
			}
		}
	}
	/** 当前命名空间下的业务 key 列表（不含内部过期元数据 key） */
	keys() {
		const prefix = this.prefix ? `${this.prefix}:` : "";
		const result = [];
		for (let i = 0; i < this.store.length; i++) {
			const storeKey = this.store.key(i);
			if (storeKey && !storeKey.endsWith(EXPIRES_KEY_SUFFIX) && (storeKey.startsWith(prefix) || this.isNoPrefixKey(storeKey))) result.push(storeKey.slice(prefix.length));
		}
		return result;
	}
	/** StorageLike 兼容接口：加密读取（返回 JSON 字符串） */
	getItem(key) {
		const val = this.get(key);
		return val === null ? null : JSON.stringify(val);
	}
	/** StorageLike 兼容接口：加密写入（接收 JSON 字符串） */
	setItem(key, value) {
		try {
			this.set(key, JSON.parse(value));
		} catch {
			this.set(key, value);
		}
	}
	/** StorageLike 兼容接口：删除 */
	removeItem(key) {
		this.remove(key);
	}
	/** StorageLike 兼容接口：按索引获取 key */
	key(index) {
		return this.keys()[index] ?? null;
	}
	/** StorageLike 兼容接口：长度 */
	get length() {
		return this.keys().length;
	}
};
/** SSR/Node 环境下使用的空实现，避免模块加载时访问 window 崩溃 */
var emptyStorage = {
	length: 0,
	getItem: () => null,
	setItem: () => void 0,
	removeItem: () => void 0,
	key: () => null
};
/** 浏览器 localStorage（SSR/Node 下为安全的空实现） */
var browserLocalStorage = typeof window !== "undefined" ? window.localStorage : emptyStorage;
/** 浏览器 sessionStorage（SSR/Node 下为安全的空实现） */
var browserSessionStorage = typeof window !== "undefined" ? window.sessionStorage : emptyStorage;
new StorageWrapper(browserLocalStorage);
new StorageWrapper(browserSessionStorage);
/** 创建带命名空间 / 过期时间的独立实例 */
function createStorage(store, options) {
	return new StorageWrapper(store, options);
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/bind.js
/**
* Create a bound version of a function with a specified `this` context
*
* @param {Function} fn - The function to bind
* @param {*} thisArg - The value to be passed as the `this` parameter
* @returns {Function} A new function that will call the original function with the specified `this` context
*/
function bind(fn, thisArg) {
	return function wrap() {
		return fn.apply(thisArg, arguments);
	};
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/utils.js
var { toString } = Object.prototype;
var { getPrototypeOf } = Object;
var { iterator, toStringTag } = Symbol;
var hasOwnProperty = (({ hasOwnProperty }) => (obj, prop) => hasOwnProperty.call(obj, prop))(Object.prototype);
/**
* Walk the prototype chain (excluding the shared Object.prototype) looking for
* an own `prop`. This distinguishes genuine own/inherited members — including
* class accessors and template prototypes — from members injected via
* Object.prototype pollution (e.g. `Object.prototype.username = '...'`), which
* live on Object.prototype itself and are therefore never matched.
*
* @param {*} thing The value whose chain to inspect
* @param {string|symbol} prop The property key to look for
*
* @returns {boolean} True when `prop` is owned below Object.prototype
*/
var hasOwnInPrototypeChain = (thing, prop) => {
	let obj = thing;
	const seen = [];
	while (obj != null && obj !== Object.prototype) {
		if (seen.indexOf(obj) !== -1) return false;
		seen.push(obj);
		if (hasOwnProperty(obj, prop)) return true;
		obj = getPrototypeOf(obj);
	}
	return false;
};
/**
* Read `obj[prop]` only when it is safe from Object.prototype pollution. Own
* properties and members inherited from a non-Object.prototype source (a class
* instance or template object) are honored; a value reachable only through a
* polluted Object.prototype is ignored and `undefined` is returned.
*
* @param {*} obj The source object
* @param {string|symbol} prop The property key to read
*
* @returns {*} The resolved value, or undefined when unsafe/absent
*/
var getSafeProp = (obj, prop) => obj != null && hasOwnInPrototypeChain(obj, prop) ? obj[prop] : void 0;
var kindOf = ((cache) => (thing) => {
	const str = toString.call(thing);
	return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(Object.create(null));
var kindOfTest = (type) => {
	type = type.toLowerCase();
	return (thing) => kindOf(thing) === type;
};
var typeOfTest = (type) => (thing) => typeof thing === type;
/**
* Determine if a value is a non-null object
*
* @param {Object} val The value to test
*
* @returns {boolean} True if value is an Array, otherwise false
*/
var { isArray } = Array;
/**
* Determine if a value is undefined
*
* @param {*} val The value to test
*
* @returns {boolean} True if the value is undefined, otherwise false
*/
var isUndefined = typeOfTest("undefined");
/**
* Determine if a value is a Buffer
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is a Buffer, otherwise false
*/
function isBuffer(val) {
	return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction$1(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
/**
* Determine if a value is an ArrayBuffer
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is an ArrayBuffer, otherwise false
*/
var isArrayBuffer = kindOfTest("ArrayBuffer");
/**
* Determine if a value is a view on an ArrayBuffer
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
*/
function isArrayBufferView(val) {
	let result;
	if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) result = ArrayBuffer.isView(val);
	else result = val && val.buffer && isArrayBuffer(val.buffer);
	return result;
}
/**
* Determine if a value is a String
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is a String, otherwise false
*/
var isString = typeOfTest("string");
/**
* Determine if a value is a Function
*
* @param {*} val The value to test
* @returns {boolean} True if value is a Function, otherwise false
*/
var isFunction$1 = typeOfTest("function");
/**
* Determine if a value is a Number
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is a Number, otherwise false
*/
var isNumber = typeOfTest("number");
/**
* Determine if a value is an Object
*
* @param {*} thing The value to test
*
* @returns {boolean} True if value is an Object, otherwise false
*/
var isObject = (thing) => thing !== null && typeof thing === "object";
/**
* Determine if a value is a Boolean
*
* @param {*} thing The value to test
* @returns {boolean} True if value is a Boolean, otherwise false
*/
var isBoolean = (thing) => thing === true || thing === false;
/**
* Determine if a value is a plain Object
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is a plain Object, otherwise false
*/
var isPlainObject = (val) => {
	if (!isObject(val)) return false;
	const prototype = getPrototypeOf(val);
	return (prototype === null || prototype === Object.prototype || getPrototypeOf(prototype) === null) && !hasOwnInPrototypeChain(val, toStringTag) && !hasOwnInPrototypeChain(val, iterator);
};
/**
* Determine if a value is an empty object (safely handles Buffers)
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is an empty object, otherwise false
*/
var isEmptyObject = (val) => {
	if (!isObject(val) || isBuffer(val)) return false;
	try {
		return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
	} catch (e) {
		return false;
	}
};
/**
* Determine if a value is a Date
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is a Date, otherwise false
*/
var isDate = kindOfTest("Date");
/**
* Determine if a value is a File
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is a File, otherwise false
*/
var isFile = kindOfTest("File");
/**
* Determine if a value is a React Native Blob
* React Native "blob": an object with a `uri` attribute. Optionally, it can
* also have a `name` and `type` attribute to specify filename and content type
*
* @see https://github.com/facebook/react-native/blob/26684cf3adf4094eb6c405d345a75bf8c7c0bf88/Libraries/Network/FormData.js#L68-L71
*
* @param {*} value The value to test
*
* @returns {boolean} True if value is a React Native Blob, otherwise false
*/
var isReactNativeBlob = (value) => {
	return !!(value && typeof value.uri !== "undefined");
};
/**
* Determine if environment is React Native
* ReactNative `FormData` has a non-standard `getParts()` method
*
* @param {*} formData The formData to test
*
* @returns {boolean} True if environment is React Native, otherwise false
*/
var isReactNative = (formData) => formData && typeof formData.getParts !== "undefined";
/**
* Determine if a value is a Blob
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is a Blob, otherwise false
*/
var isBlob = kindOfTest("Blob");
/**
* Determine if a value is a FileList
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is a FileList, otherwise false
*/
var isFileList = kindOfTest("FileList");
var isSet = kindOfTest("Set");
/**
* Determine if a value is a Stream
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is a Stream, otherwise false
*/
var isStream = (val) => isObject(val) && isFunction$1(val.pipe);
/**
* Determine if a value is a FormData
*
* @param {*} thing The value to test
*
* @returns {boolean} True if value is an FormData, otherwise false
*/
function getGlobal() {
	if (typeof globalThis !== "undefined") return globalThis;
	if (typeof self !== "undefined") return self;
	if (typeof window !== "undefined") return window;
	if (typeof global !== "undefined") return global;
	return {};
}
var G = getGlobal();
var FormDataCtor = typeof G.FormData !== "undefined" ? G.FormData : void 0;
var isFormData = (thing) => {
	if (!thing) return false;
	if (FormDataCtor && thing instanceof FormDataCtor) return true;
	const proto = getPrototypeOf(thing);
	if (!proto || proto === Object.prototype) return false;
	if (!isFunction$1(thing.append)) return false;
	const kind = kindOf(thing);
	return kind === "formdata" || kind === "object" && isFunction$1(thing.toString) && thing.toString() === "[object FormData]";
};
/**
* Determine if a value is a URLSearchParams object
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is a URLSearchParams object, otherwise false
*/
var isURLSearchParams = kindOfTest("URLSearchParams");
var [isReadableStream, isRequest, isResponse, isHeaders] = [
	"ReadableStream",
	"Request",
	"Response",
	"Headers"
].map(kindOfTest);
/**
* Trim excess whitespace off the beginning and end of a string
*
* @param {String} str The String to trim
*
* @returns {String} The String freed of excess whitespace
*/
var trim = (str) => {
	return str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
};
/**
* Iterate over an Array or an Object invoking a function for each item.
*
* If `obj` is an Array callback will be called passing
* the value, index, and complete array for each item.
*
* If 'obj' is an Object callback will be called passing
* the value, key, and complete object for each property.
*
* @param {Object|Array<unknown>} obj The object to iterate
* @param {Function} fn The callback to invoke for each item
*
* @param {Object} [options]
* @param {Boolean} [options.allOwnKeys = false]
* @returns {any}
*/
function forEach(obj, fn, { allOwnKeys = false } = {}) {
	if (obj === null || typeof obj === "undefined") return;
	let i;
	let l;
	if (typeof obj !== "object") obj = [obj];
	if (isArray(obj)) for (i = 0, l = obj.length; i < l; i++) fn.call(null, obj[i], i, obj);
	else {
		if (isBuffer(obj)) return;
		const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
		const len = keys.length;
		let key;
		for (i = 0; i < len; i++) {
			key = keys[i];
			fn.call(null, obj[key], key, obj);
		}
	}
}
/**
* Finds a key in an object, case-insensitive, returning the actual key name.
* Returns null if the object is a Buffer or if no match is found.
*
* @param {Object} obj - The object to search.
* @param {string} key - The key to find (case-insensitive).
* @returns {?string} The actual key name if found, otherwise null.
*/
function findKey(obj, key) {
	if (isBuffer(obj)) return null;
	key = key.toLowerCase();
	const keys = Object.keys(obj);
	let i = keys.length;
	let _key;
	while (i-- > 0) {
		_key = keys[i];
		if (key === _key.toLowerCase()) return _key;
	}
	return null;
}
var _global = (() => {
	if (typeof globalThis !== "undefined") return globalThis;
	return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
})();
var isContextDefined = (context) => !isUndefined(context) && context !== _global;
/**
* Accepts varargs expecting each argument to be an object, then
* immutably merges the properties of each object and returns result.
*
* When multiple objects contain the same key the later object in
* the arguments list will take precedence.
*
* Example:
*
* ```js
* const result = merge({foo: 123}, {foo: 456});
* console.log(result.foo); // outputs 456
* ```
*
* @param {Object} obj1 Object to merge
*
* @returns {Object} Result of all merge properties
*/
function merge(...objs) {
	const { caseless, skipUndefined } = isContextDefined(this) && this || {};
	const result = {};
	const assignValue = (val, key) => {
		if (key === "__proto__" || key === "constructor" || key === "prototype") return;
		const targetKey = caseless && typeof key === "string" && findKey(result, key) || key;
		const existing = hasOwnProperty(result, targetKey) ? result[targetKey] : void 0;
		if (isPlainObject(existing) && isPlainObject(val)) result[targetKey] = merge(existing, val);
		else if (isPlainObject(val)) result[targetKey] = merge({}, val);
		else if (isArray(val)) result[targetKey] = val.slice();
		else if (!skipUndefined || !isUndefined(val)) result[targetKey] = val;
	};
	for (let i = 0, l = objs.length; i < l; i++) {
		const source = objs[i];
		if (!source || isBuffer(source)) continue;
		forEach(source, assignValue);
		if (typeof source !== "object" || isArray(source)) continue;
		const symbols = Object.getOwnPropertySymbols(source);
		for (let j = 0; j < symbols.length; j++) {
			const symbol = symbols[j];
			if (propertyIsEnumerable.call(source, symbol)) assignValue(source[symbol], symbol);
		}
	}
	return result;
}
/**
* Extends object a by mutably adding to it the properties of object b.
*
* @param {Object} a The object to be extended
* @param {Object} b The object to copy properties from
* @param {Object} thisArg The object to bind function to
*
* @param {Object} [options]
* @param {Boolean} [options.allOwnKeys]
* @returns {Object} The resulting value of object a
*/
var extend = (a, b, thisArg, { allOwnKeys } = {}) => {
	forEach(b, (val, key) => {
		if (thisArg && isFunction$1(val)) Object.defineProperty(a, key, {
			__proto__: null,
			value: bind(val, thisArg),
			writable: true,
			enumerable: true,
			configurable: true
		});
		else Object.defineProperty(a, key, {
			__proto__: null,
			value: val,
			writable: true,
			enumerable: true,
			configurable: true
		});
	}, { allOwnKeys });
	return a;
};
/**
* Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
*
* @param {string} content with BOM
*
* @returns {string} content value without BOM
*/
var stripBOM = (content) => {
	if (content.charCodeAt(0) === 65279) content = content.slice(1);
	return content;
};
/**
* Inherit the prototype methods from one constructor into another
* @param {function} constructor
* @param {function} superConstructor
* @param {object} [props]
* @param {object} [descriptors]
*
* @returns {void}
*/
var inherits = (constructor, superConstructor, props, descriptors) => {
	constructor.prototype = Object.create(superConstructor.prototype, descriptors);
	Object.defineProperty(constructor.prototype, "constructor", {
		__proto__: null,
		value: constructor,
		writable: true,
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(constructor, "super", {
		__proto__: null,
		value: superConstructor.prototype
	});
	props && Object.assign(constructor.prototype, props);
};
/**
* Resolve object with deep prototype chain to a flat object
* @param {Object} sourceObj source object
* @param {Object} [destObj]
* @param {Function|Boolean} [filter]
* @param {Function} [propFilter]
*
* @returns {Object}
*/
var toFlatObject = (sourceObj, destObj, filter, propFilter) => {
	let props;
	let i;
	let prop;
	const merged = {};
	destObj = destObj || {};
	if (sourceObj == null) return destObj;
	do {
		props = Object.getOwnPropertyNames(sourceObj);
		i = props.length;
		while (i-- > 0) {
			prop = props[i];
			if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
				destObj[prop] = sourceObj[prop];
				merged[prop] = true;
			}
		}
		sourceObj = filter !== false && getPrototypeOf(sourceObj);
	} while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);
	return destObj;
};
/**
* Determines whether a string ends with the characters of a specified string
*
* @param {String} str
* @param {String} searchString
* @param {Number} [position= 0]
*
* @returns {boolean}
*/
var endsWith = (str, searchString, position) => {
	str = String(str);
	if (position === void 0 || position > str.length) position = str.length;
	position -= searchString.length;
	const lastIndex = str.indexOf(searchString, position);
	return lastIndex !== -1 && lastIndex === position;
};
/**
* Returns new array from array like object or null if failed
*
* @param {*} [thing]
*
* @returns {?Array}
*/
var toArray = (thing) => {
	if (!thing) return null;
	if (isArray(thing)) return thing;
	let i = thing.length;
	if (!isNumber(i)) return null;
	const arr = new Array(i);
	while (i-- > 0) arr[i] = thing[i];
	return arr;
};
/**
* Checking if the Uint8Array exists and if it does, it returns a function that checks if the
* thing passed in is an instance of Uint8Array
*
* @param {TypedArray}
*
* @returns {Array}
*/
var isTypedArray = ((TypedArray) => {
	return (thing) => {
		return TypedArray && thing instanceof TypedArray;
	};
})(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
/**
* For each entry in the object, call the function with the key and value.
*
* @param {Object<any, any>} obj - The object to iterate over.
* @param {Function} fn - The function to call for each entry.
*
* @returns {void}
*/
var forEachEntry = (obj, fn) => {
	const _iterator = (obj && obj[iterator]).call(obj);
	let result;
	while ((result = _iterator.next()) && !result.done) {
		const pair = result.value;
		fn.call(obj, pair[0], pair[1]);
	}
};
/**
* It takes a regular expression and a string, and returns an array of all the matches
*
* @param {string} regExp - The regular expression to match against.
* @param {string} str - The string to search.
*
* @returns {Array<boolean>}
*/
var matchAll = (regExp, str) => {
	let matches;
	const arr = [];
	while ((matches = regExp.exec(str)) !== null) arr.push(matches);
	return arr;
};
var isHTMLForm = kindOfTest("HTMLFormElement");
var toCamelCase = (str) => {
	return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function replacer(m, p1, p2) {
		return p1.toUpperCase() + p2;
	});
};
var { propertyIsEnumerable } = Object.prototype;
/**
* Determine if a value is a RegExp object
*
* @param {*} val The value to test
*
* @returns {boolean} True if value is a RegExp object, otherwise false
*/
var isRegExp = kindOfTest("RegExp");
var reduceDescriptors = (obj, reducer) => {
	const descriptors = Object.getOwnPropertyDescriptors(obj);
	const reducedDescriptors = {};
	forEach(descriptors, (descriptor, name) => {
		let ret;
		if ((ret = reducer(descriptor, name, obj)) !== false) reducedDescriptors[name] = ret || descriptor;
	});
	Object.defineProperties(obj, reducedDescriptors);
};
/**
* Makes all methods read-only
* @param {Object} obj
*/
var freezeMethods = (obj) => {
	reduceDescriptors(obj, (descriptor, name) => {
		if (isFunction$1(obj) && [
			"arguments",
			"caller",
			"callee"
		].includes(name)) return false;
		const value = obj[name];
		if (!isFunction$1(value)) return;
		descriptor.enumerable = false;
		if ("writable" in descriptor) {
			descriptor.writable = false;
			return;
		}
		if (!descriptor.set) descriptor.set = () => {
			throw Error("Can not rewrite read-only method '" + name + "'");
		};
	});
};
/**
* Converts an array or a delimited string into an object set with values as keys and true as values.
* Useful for fast membership checks.
*
* @param {Array|string} arrayOrString - The array or string to convert.
* @param {string} delimiter - The delimiter to use if input is a string.
* @returns {Object} An object with keys from the array or string, values set to true.
*/
var toObjectSet = (arrayOrString, delimiter) => {
	const obj = {};
	const define = (arr) => {
		arr.forEach((value) => {
			obj[value] = true;
		});
	};
	isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
	return obj;
};
var noop = () => {};
var toFiniteNumber = (value, defaultValue) => {
	return value != null && Number.isFinite(value = +value) ? value : defaultValue;
};
/**
* If the thing is a FormData object, return true, otherwise return false.
*
* @param {unknown} thing - The thing to check.
*
* @returns {boolean}
*/
function isSpecCompliantForm(thing) {
	return !!(thing && isFunction$1(thing.append) && thing[toStringTag] === "FormData" && thing[iterator]);
}
/**
* Recursively converts an object to a JSON-compatible object, handling circular references and Buffers.
*
* @param {Object} obj - The object to convert.
* @returns {Object} The JSON-compatible object.
*/
var toJSONObject = (obj) => {
	const visited = /* @__PURE__ */ new WeakSet();
	const visit = (source) => {
		if (isObject(source)) {
			if (visited.has(source)) return;
			if (isBuffer(source)) return source;
			if (!("toJSON" in source)) {
				visited.add(source);
				let target;
				if (isSet(source)) {
					target = [];
					for (const value of source) {
						const reducedValue = visit(value);
						!isUndefined(reducedValue) && target.push(reducedValue);
					}
				} else {
					target = isArray(source) ? [] : {};
					forEach(source, (value, key) => {
						const reducedValue = visit(value);
						!isUndefined(reducedValue) && (target[key] = reducedValue);
					});
				}
				visited.delete(source);
				return target;
			}
		}
		return source;
	};
	return visit(obj);
};
/**
* Determines if a value is an async function.
*
* @param {*} thing - The value to test.
* @returns {boolean} True if value is an async function, otherwise false.
*/
var isAsyncFn = kindOfTest("AsyncFunction");
/**
* Determines if a value is thenable (has then and catch methods).
*
* @param {*} thing - The value to test.
* @returns {boolean} True if value is thenable, otherwise false.
*/
var isThenable = (thing) => thing && (isObject(thing) || isFunction$1(thing)) && isFunction$1(thing.then) && isFunction$1(thing.catch);
/**
* Provides a cross-platform setImmediate implementation.
* Uses native setImmediate if available, otherwise falls back to postMessage or setTimeout.
*
* @param {boolean} setImmediateSupported - Whether setImmediate is supported.
* @param {boolean} postMessageSupported - Whether postMessage is supported.
* @returns {Function} A function to schedule a callback asynchronously.
*/
var _setImmediate = ((setImmediateSupported, postMessageSupported) => {
	if (setImmediateSupported) return setImmediate;
	return postMessageSupported ? ((token, callbacks) => {
		_global.addEventListener("message", ({ source, data }) => {
			if (source === _global && data === token) callbacks.length && callbacks.shift()();
		}, false);
		return (cb) => {
			callbacks.push(cb);
			_global.postMessage(token, "*");
		};
	})(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
})(typeof setImmediate === "function", isFunction$1(_global.postMessage));
/**
* Schedules a microtask or asynchronous callback as soon as possible.
* Uses queueMicrotask if available, otherwise falls back to process.nextTick or _setImmediate.
*
* @type {Function}
*/
var asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
var isIterable = (thing) => thing != null && isFunction$1(thing[iterator]);
/**
* Determine if a value is iterable via an iterator that is NOT sourced solely
* from a polluted Object.prototype. Use this instead of `isIterable` whenever
* the iterable comes from untrusted input (e.g. user-supplied header sources),
* so `Object.prototype[Symbol.iterator] = ...` cannot turn an ordinary object
* into an attacker-controlled entries iterator.
*
* @param {*} thing The value to test
*
* @returns {boolean} True if value has a non-polluted iterator
*/
var isSafeIterable = (thing) => thing != null && hasOwnInPrototypeChain(thing, iterator) && isIterable(thing);
var utils_default = {
	isArray,
	isArrayBuffer,
	isBuffer,
	isFormData,
	isArrayBufferView,
	isString,
	isNumber,
	isBoolean,
	isObject,
	isPlainObject,
	isEmptyObject,
	isReadableStream,
	isRequest,
	isResponse,
	isHeaders,
	isUndefined,
	isDate,
	isFile,
	isReactNativeBlob,
	isReactNative,
	isBlob,
	isRegExp,
	isFunction: isFunction$1,
	isStream,
	isURLSearchParams,
	isTypedArray,
	isFileList,
	forEach,
	merge,
	extend,
	trim,
	stripBOM,
	inherits,
	toFlatObject,
	kindOf,
	kindOfTest,
	endsWith,
	toArray,
	forEachEntry,
	matchAll,
	isHTMLForm,
	hasOwnProperty,
	hasOwnProp: hasOwnProperty,
	hasOwnInPrototypeChain,
	getSafeProp,
	reduceDescriptors,
	freezeMethods,
	toObjectSet,
	toCamelCase,
	noop,
	toFiniteNumber,
	findKey,
	global: _global,
	isContextDefined,
	isSpecCompliantForm,
	toJSONObject,
	isAsyncFn,
	isThenable,
	setImmediate: _setImmediate,
	asap,
	isIterable,
	isSafeIterable
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/parseHeaders.js
var ignoreDuplicateOf = utils_default.toObjectSet([
	"age",
	"authorization",
	"content-length",
	"content-type",
	"etag",
	"expires",
	"from",
	"host",
	"if-modified-since",
	"if-unmodified-since",
	"last-modified",
	"location",
	"max-forwards",
	"proxy-authorization",
	"referer",
	"retry-after",
	"user-agent"
]);
/**
* Parse headers into an object
*
* ```
* Date: Wed, 27 Aug 2014 08:58:49 GMT
* Content-Type: application/json
* Connection: keep-alive
* Transfer-Encoding: chunked
* ```
*
* @param {String} rawHeaders Headers needing to be parsed
*
* @returns {Object} Headers parsed into an object
*/
var parseHeaders_default = (rawHeaders) => {
	const parsed = {};
	let key;
	let val;
	let i;
	rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
		i = line.indexOf(":");
		key = line.substring(0, i).trim().toLowerCase();
		val = line.substring(i + 1).trim();
		const hasKey = utils_default.hasOwnProp(parsed, key);
		if (!key || hasKey && utils_default.hasOwnProp(ignoreDuplicateOf, key)) return;
		if (key === "set-cookie") if (hasKey) parsed[key].push(val);
		else parsed[key] = [val];
		else parsed[key] = hasKey ? parsed[key] + ", " + val : val;
	});
	return parsed;
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/sanitizeHeaderValue.js
function trimSPorHTAB(str) {
	let start = 0;
	let end = str.length;
	while (start < end) {
		const code = str.charCodeAt(start);
		if (code !== 9 && code !== 32) break;
		start += 1;
	}
	while (end > start) {
		const code = str.charCodeAt(end - 1);
		if (code !== 9 && code !== 32) break;
		end -= 1;
	}
	return start === 0 && end === str.length ? str : str.slice(start, end);
}
var INVALID_UNICODE_HEADER_VALUE_CHARS = /* @__PURE__ */ new RegExp("[\\u0000-\\u0008\\u000a-\\u001f\\u007f]+", "g");
var INVALID_BYTE_STRING_HEADER_VALUE_CHARS = /* @__PURE__ */ new RegExp("[^\\u0009\\u0020-\\u007e\\u0080-\\u00ff]+", "g");
function sanitizeValue(value, invalidChars) {
	if (utils_default.isArray(value)) return value.map((item) => sanitizeValue(item, invalidChars));
	return trimSPorHTAB(String(value).replace(invalidChars, ""));
}
var sanitizeHeaderValue = (value) => sanitizeValue(value, INVALID_UNICODE_HEADER_VALUE_CHARS);
var sanitizeByteStringHeaderValue = (value) => sanitizeValue(value, INVALID_BYTE_STRING_HEADER_VALUE_CHARS);
function toByteStringHeaderObject(headers) {
	const byteStringHeaders = Object.create(null);
	utils_default.forEach(headers.toJSON(), (value, header) => {
		byteStringHeaders[header] = sanitizeByteStringHeaderValue(value);
	});
	return byteStringHeaders;
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/core/AxiosHeaders.js
var $internals = Symbol("internals");
function normalizeHeader(header) {
	return header && String(header).trim().toLowerCase();
}
function normalizeValue(value) {
	if (value === false || value == null) return value;
	return utils_default.isArray(value) ? value.map(normalizeValue) : sanitizeHeaderValue(String(value));
}
function parseTokens(str) {
	const tokens = Object.create(null);
	const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
	let match;
	while (match = tokensRE.exec(str)) tokens[match[1]] = match[2];
	return tokens;
}
var parameterNameRE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
function trimOWS(value) {
	let start = 0;
	let end = value.length;
	while (start < end) {
		const code = value.charCodeAt(start);
		if (code !== 9 && code !== 32) break;
		start += 1;
	}
	while (end > start) {
		const code = value.charCodeAt(end - 1);
		if (code !== 9 && code !== 32) break;
		end -= 1;
	}
	return start === 0 && end === value.length ? value : value.slice(start, end);
}
function decodeQuotedString(value) {
	const last = value.length - 1;
	if (last < 1 || value.charCodeAt(0) !== 34 || value.charCodeAt(last) !== 34) return value;
	let decoded = "";
	for (let i = 1; i < last; i++) {
		const code = value.charCodeAt(i);
		if (code === 34) return value;
		if (code === 92) {
			i += 1;
			if (i >= last) return value;
		}
		decoded += value[i];
	}
	return decoded;
}
function parseParameters(value) {
	const parameters = Object.create(null);
	const str = String(value);
	let start = 0;
	let quoted = false;
	let escaped = false;
	function parseParameter(end) {
		const part = trimOWS(str.slice(start, end));
		const equals = part.indexOf("=");
		if (equals < 1) return;
		const name = trimOWS(part.slice(0, equals));
		if (!parameterNameRE.test(name)) return;
		const normalizedName = name.toLowerCase();
		if (normalizedName === "__proto__" || normalizedName === "constructor" || normalizedName === "prototype") return;
		const parameterValue = trimOWS(part.slice(equals + 1));
		parameters[normalizedName] = decodeQuotedString(parameterValue);
	}
	for (let i = 0; i < str.length; i++) {
		const code = str.charCodeAt(i);
		if (quoted) {
			if (escaped) escaped = false;
			else if (code === 92) escaped = true;
			else if (code === 34) quoted = false;
		} else if (code === 34) quoted = true;
		else if (code === 44 || code === 59) {
			parseParameter(i);
			start = i + 1;
		}
	}
	parseParameter(str.length);
	return parameters;
}
var isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
	if (utils_default.isFunction(filter)) return filter.call(this, value, header);
	if (isHeaderNameFilter) value = header;
	if (!utils_default.isString(value)) return;
	if (utils_default.isString(filter)) return value.indexOf(filter) !== -1;
	if (utils_default.isRegExp(filter)) return filter.test(value);
}
function formatHeader(header) {
	return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
		return char.toUpperCase() + str;
	});
}
function buildAccessors(obj, header) {
	const accessorName = utils_default.toCamelCase(" " + header);
	[
		"get",
		"set",
		"has"
	].forEach((methodName) => {
		Object.defineProperty(obj, methodName + accessorName, {
			__proto__: null,
			value: function(arg1, arg2, arg3) {
				return this[methodName].call(this, header, arg1, arg2, arg3);
			},
			configurable: true
		});
	});
}
var AxiosHeaders$1 = class {
	constructor(headers) {
		headers && this.set(headers);
	}
	set(header, valueOrRewrite, rewrite) {
		const self = this;
		function setHeader(_value, _header, _rewrite) {
			const lHeader = normalizeHeader(_header);
			if (!lHeader) return;
			const key = utils_default.findKey(self, lHeader);
			if (!key || self[key] === void 0 || _rewrite === true || _rewrite === void 0 && self[key] !== false) self[key || _header] = normalizeValue(_value);
		}
		const setHeaders = (headers, _rewrite) => utils_default.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
		if (utils_default.isPlainObject(header) || header instanceof this.constructor) setHeaders(header, valueOrRewrite);
		else if (utils_default.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) setHeaders(parseHeaders_default(header), valueOrRewrite);
		else if (utils_default.isObject(header) && utils_default.isSafeIterable(header)) {
			let obj = Object.create(null), dest, key;
			for (const entry of header) {
				if (!utils_default.isArray(entry)) throw new TypeError("Object iterator must return a key-value pair");
				key = entry[0];
				if (utils_default.hasOwnProp(obj, key)) {
					dest = obj[key];
					obj[key] = utils_default.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]];
				} else obj[key] = entry[1];
			}
			setHeaders(obj, valueOrRewrite);
		} else header != null && setHeader(valueOrRewrite, header, rewrite);
		return this;
	}
	get(header, parser) {
		header = normalizeHeader(header);
		if (header) {
			const key = utils_default.findKey(this, header);
			if (key) {
				const value = this[key];
				if (!parser) return value;
				if (parser === true) return parseTokens(value);
				if (utils_default.isFunction(parser)) return parser.call(this, value, key);
				if (utils_default.isRegExp(parser)) return parser.exec(value);
				throw new TypeError("parser must be boolean|regexp|function");
			}
		}
	}
	has(header, matcher) {
		header = normalizeHeader(header);
		if (header) {
			const key = utils_default.findKey(this, header);
			return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
		}
		return false;
	}
	delete(header, matcher) {
		const self = this;
		let deleted = false;
		function deleteHeader(_header) {
			_header = normalizeHeader(_header);
			if (_header) {
				const key = utils_default.findKey(self, _header);
				if (key && (!matcher || matchHeaderValue(self, self[key], key, matcher))) {
					delete self[key];
					deleted = true;
				}
			}
		}
		if (utils_default.isArray(header)) header.forEach(deleteHeader);
		else deleteHeader(header);
		return deleted;
	}
	clear(matcher) {
		const keys = Object.keys(this);
		let i = keys.length;
		let deleted = false;
		while (i--) {
			const key = keys[i];
			if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
				delete this[key];
				deleted = true;
			}
		}
		return deleted;
	}
	normalize(format) {
		const self = this;
		const headers = {};
		utils_default.forEach(this, (value, header) => {
			const key = utils_default.findKey(headers, header);
			if (key) {
				self[key] = normalizeValue(value);
				delete self[header];
				return;
			}
			const normalized = format ? formatHeader(header) : String(header).trim();
			if (normalized !== header) delete self[header];
			self[normalized] = normalizeValue(value);
			headers[normalized] = true;
		});
		return this;
	}
	concat(...targets) {
		return this.constructor.concat(this, ...targets);
	}
	toJSON(asStrings) {
		const obj = Object.create(null);
		utils_default.forEach(this, (value, header) => {
			value != null && value !== false && (obj[header] = asStrings && utils_default.isArray(value) ? value.join(", ") : value);
		});
		return obj;
	}
	[Symbol.iterator]() {
		return Object.entries(this.toJSON())[Symbol.iterator]();
	}
	toString() {
		return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
	}
	getSetCookie() {
		const value = this.get("set-cookie");
		return utils_default.isArray(value) ? value : value == null || value === false ? [] : [value];
	}
	get [Symbol.toStringTag]() {
		return "AxiosHeaders";
	}
	static from(thing) {
		return thing instanceof this ? thing : new this(thing);
	}
	static parseParameters(value) {
		return parseParameters(value);
	}
	static concat(first, ...targets) {
		const computed = new this(first);
		targets.forEach((target) => computed.set(target));
		return computed;
	}
	static accessor(header) {
		const accessors = (this[$internals] = this[$internals] = { accessors: {} }).accessors;
		const prototype = this.prototype;
		function defineAccessor(_header) {
			const lHeader = normalizeHeader(_header);
			if (!accessors[lHeader]) {
				buildAccessors(prototype, _header);
				accessors[lHeader] = true;
			}
		}
		utils_default.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
		return this;
	}
};
AxiosHeaders$1.accessor([
	"Content-Type",
	"Content-Length",
	"Accept",
	"Accept-Encoding",
	"User-Agent",
	"Authorization"
]);
utils_default.reduceDescriptors(AxiosHeaders$1.prototype, ({ value }, key) => {
	let mapped = key[0].toUpperCase() + key.slice(1);
	return {
		get: () => value,
		set(headerValue) {
			this[mapped] = headerValue;
		}
	};
});
utils_default.freezeMethods(AxiosHeaders$1);
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/core/AxiosError.js
var REDACTED = "[REDACTED ****]";
function hasOwnOrPrototypeToJSON(source) {
	if (utils_default.hasOwnProp(source, "toJSON")) return true;
	let prototype = Object.getPrototypeOf(source);
	while (prototype && prototype !== Object.prototype) {
		if (utils_default.hasOwnProp(prototype, "toJSON")) return true;
		prototype = Object.getPrototypeOf(prototype);
	}
	return false;
}
function redactConfig(config, redactKeys) {
	const lowerKeys = new Set(redactKeys.map((k) => String(k).toLowerCase()));
	const seen = [];
	const visit = (source) => {
		if (source === null || typeof source !== "object") return source;
		if (utils_default.isBuffer(source)) return source;
		if (seen.indexOf(source) !== -1) return void 0;
		if (source instanceof AxiosHeaders$1) source = source.toJSON();
		seen.push(source);
		let result;
		if (utils_default.isArray(source)) {
			result = [];
			source.forEach((v, i) => {
				const reducedValue = visit(v);
				if (!utils_default.isUndefined(reducedValue)) result[i] = reducedValue;
			});
		} else {
			if (!utils_default.isPlainObject(source) && hasOwnOrPrototypeToJSON(source)) {
				seen.pop();
				return source;
			}
			result = Object.create(null);
			for (const [key, value] of Object.entries(source)) {
				const reducedValue = lowerKeys.has(key.toLowerCase()) ? REDACTED : visit(value);
				if (!utils_default.isUndefined(reducedValue)) result[key] = reducedValue;
			}
		}
		seen.pop();
		return result;
	};
	return visit(config);
}
function stringifySafely$1(value) {
	try {
		return String(value);
	} catch (err) {
		return "";
	}
}
function aggregateErrorMessage(error) {
	return error.errors.map((entry) => {
		try {
			return entry && entry.message ? stringifySafely$1(entry.message) : stringifySafely$1(entry);
		} catch (err) {
			return "";
		}
	}).filter(Boolean).join("; ") || error.name || "AggregateError";
}
var AxiosError$1 = class AxiosError$1 extends Error {
	static from(error, code, config, request, response, customProps) {
		let message = error.message;
		if (!message && utils_default.isArray(error.errors) && error.errors.length) message = aggregateErrorMessage(error);
		const axiosError = new AxiosError$1(message, code || error.code, config, request, response);
		Object.defineProperty(axiosError, "cause", {
			__proto__: null,
			value: error,
			writable: true,
			enumerable: false,
			configurable: true
		});
		axiosError.name = error.name;
		if (error.status != null && axiosError.status == null) axiosError.status = error.status;
		customProps && Object.assign(axiosError, customProps);
		return axiosError;
	}
	/**
	* Create an Error with the specified message, config, error code, request and response.
	*
	* @param {string} message The error message.
	* @param {string} [code] The error code (for example, 'ECONNABORTED').
	* @param {Object} [config] The config.
	* @param {Object} [request] The request.
	* @param {Object} [response] The response.
	*
	* @returns {Error} The created error.
	*/
	constructor(message, code, config, request, response) {
		super(message);
		Object.defineProperty(this, "message", {
			__proto__: null,
			value: message,
			enumerable: true,
			writable: true,
			configurable: true
		});
		this.name = "AxiosError";
		this.isAxiosError = true;
		code && (this.code = code);
		config && (this.config = config);
		request && (this.request = request);
		if (response) {
			this.response = response;
			this.status = response.status;
		}
	}
	toJSON() {
		const config = this.config;
		const redactKeys = config && utils_default.hasOwnProp(config, "redact") ? config.redact : void 0;
		const serializedConfig = utils_default.isArray(redactKeys) && redactKeys.length > 0 ? redactConfig(config, redactKeys) : utils_default.toJSONObject(config);
		return {
			message: this.message,
			name: this.name,
			description: this.description,
			number: this.number,
			fileName: this.fileName,
			lineNumber: this.lineNumber,
			columnNumber: this.columnNumber,
			stack: this.stack,
			config: serializedConfig,
			code: this.code,
			status: this.status
		};
	}
};
AxiosError$1.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
AxiosError$1.ERR_BAD_OPTION = "ERR_BAD_OPTION";
AxiosError$1.ECONNABORTED = "ECONNABORTED";
AxiosError$1.ETIMEDOUT = "ETIMEDOUT";
AxiosError$1.ECONNREFUSED = "ECONNREFUSED";
AxiosError$1.ERR_NETWORK = "ERR_NETWORK";
AxiosError$1.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
AxiosError$1.ERR_DEPRECATED = "ERR_DEPRECATED";
AxiosError$1.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
AxiosError$1.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
AxiosError$1.ERR_CANCELED = "ERR_CANCELED";
AxiosError$1.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
AxiosError$1.ERR_INVALID_URL = "ERR_INVALID_URL";
AxiosError$1.ERR_FORM_DATA_DEPTH_EXCEEDED = "ERR_FORM_DATA_DEPTH_EXCEEDED";
/**
* Determines if the given thing is a array or js object.
*
* @param {string} thing - The object or array to be visited.
*
* @returns {boolean}
*/
function isVisitable(thing) {
	return utils_default.isPlainObject(thing) || utils_default.isArray(thing);
}
/**
* It removes the brackets from the end of a string
*
* @param {string} key - The key of the parameter.
*
* @returns {string} the key without the brackets.
*/
function removeBrackets(key) {
	return utils_default.endsWith(key, "[]") ? key.slice(0, -2) : key;
}
/**
* It takes a path, a key, and a boolean, and returns a string
*
* @param {string} path - The path to the current key.
* @param {string} key - The key of the current object being iterated over.
* @param {string} dots - If true, the key will be rendered with dots instead of brackets.
*
* @returns {string} The path to the current key.
*/
function renderKey(path, key, dots) {
	if (!path) return key;
	return path.concat(key).map(function each(token, i) {
		token = removeBrackets(token);
		return !dots && i ? "[" + token + "]" : token;
	}).join(dots ? "." : "");
}
/**
* If the array is an array and none of its elements are visitable, then it's a flat array.
*
* @param {Array<any>} arr - The array to check
*
* @returns {boolean}
*/
function isFlatArray(arr) {
	return utils_default.isArray(arr) && !arr.some(isVisitable);
}
var predicates = utils_default.toFlatObject(utils_default, {}, null, function filter(prop) {
	return /^is[A-Z]/.test(prop);
});
/**
* Convert a data object to FormData
*
* @param {Object} obj
* @param {?Object} [formData]
* @param {?Object} [options]
* @param {Function} [options.visitor]
* @param {Boolean} [options.metaTokens = true]
* @param {Boolean} [options.dots = false]
* @param {?Boolean} [options.indexes = false]
*
* @returns {Object}
**/
/**
* It converts an object into a FormData object
*
* @param {Object<any, any>} obj - The object to convert to form data.
* @param {string} formData - The FormData object to append to.
* @param {Object<string, any>} options
*
* @returns
*/
function toFormData$1(obj, formData, options) {
	if (!utils_default.isObject(obj)) throw new TypeError("target must be an object");
	formData = formData || new FormData();
	options = utils_default.toFlatObject(options, {
		metaTokens: true,
		dots: false,
		indexes: false
	}, false, function defined(option, source) {
		return !utils_default.isUndefined(source[option]);
	});
	const metaTokens = options.metaTokens;
	const visitor = options.visitor || defaultVisitor;
	const dots = options.dots;
	const indexes = options.indexes;
	const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
	const maxDepth = options.maxDepth === void 0 ? 100 : options.maxDepth;
	const useBlob = _Blob && utils_default.isSpecCompliantForm(formData);
	const stack = [];
	if (!utils_default.isFunction(visitor)) throw new TypeError("visitor must be a function");
	function convertValue(value) {
		if (value === null) return "";
		if (utils_default.isDate(value)) return value.toISOString();
		if (utils_default.isBoolean(value)) return value.toString();
		if (!useBlob && utils_default.isBlob(value)) throw new AxiosError$1("Blob is not supported. Use a Buffer instead.");
		if (utils_default.isArrayBuffer(value) || utils_default.isTypedArray(value)) {
			if (useBlob && typeof _Blob === "function") return new _Blob([value]);
			throw new AxiosError$1("Blob is not supported. Use a Buffer instead.", AxiosError$1.ERR_NOT_SUPPORT);
		}
		return value;
	}
	function throwIfMaxDepthExceeded(depth) {
		if (depth > maxDepth) throw new AxiosError$1("Object is too deeply nested (" + depth + " levels). Max depth: " + maxDepth, AxiosError$1.ERR_FORM_DATA_DEPTH_EXCEEDED);
	}
	function stringifyWithDepthLimit(value, depth) {
		if (maxDepth === Infinity) return JSON.stringify(value);
		const ancestors = [];
		return JSON.stringify(value, function limitDepth(_key, currentValue) {
			if (!utils_default.isObject(currentValue)) return currentValue;
			while (ancestors.length && ancestors[ancestors.length - 1] !== this) ancestors.pop();
			ancestors.push(currentValue);
			throwIfMaxDepthExceeded(depth + ancestors.length - 1);
			return currentValue;
		});
	}
	/**
	* Default visitor.
	*
	* @param {*} value
	* @param {String|Number} key
	* @param {Array<String|Number>} path
	* @this {FormData}
	*
	* @returns {boolean} return true to visit the each prop of the value recursively
	*/
	function defaultVisitor(value, key, path) {
		let arr = value;
		if (utils_default.isReactNative(formData) && utils_default.isReactNativeBlob(value)) {
			formData.append(renderKey(path, key, dots), convertValue(value));
			return false;
		}
		if (value && !path && typeof value === "object") {
			if (utils_default.endsWith(key, "{}")) {
				key = metaTokens ? key : key.slice(0, -2);
				value = stringifyWithDepthLimit(value, 1);
			} else if (utils_default.isArray(value) && isFlatArray(value) || (utils_default.isFileList(value) || utils_default.endsWith(key, "[]")) && (arr = utils_default.toArray(value))) {
				key = removeBrackets(key);
				arr.forEach(function each(el, index) {
					!(utils_default.isUndefined(el) || el === null) && formData.append(indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]", convertValue(el));
				});
				return false;
			}
		}
		if (isVisitable(value)) return true;
		formData.append(renderKey(path, key, dots), convertValue(value));
		return false;
	}
	const exposedHelpers = Object.assign(predicates, {
		defaultVisitor,
		convertValue,
		isVisitable
	});
	function build(value, path, depth = 0) {
		if (utils_default.isUndefined(value)) return;
		throwIfMaxDepthExceeded(depth);
		if (stack.indexOf(value) !== -1) throw new Error("Circular reference detected in " + path.join("."));
		stack.push(value);
		utils_default.forEach(value, function each(el, key) {
			if ((!(utils_default.isUndefined(el) || el === null) && visitor.call(formData, el, utils_default.isString(key) ? key.trim() : key, path, exposedHelpers)) === true) build(el, path ? path.concat(key) : [key], depth + 1);
		});
		stack.pop();
	}
	if (!utils_default.isObject(obj)) throw new TypeError("data must be an object");
	build(obj);
	return formData;
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/AxiosURLSearchParams.js
/**
* It encodes a string by replacing all characters that are not in the unreserved set with
* their percent-encoded equivalents
*
* @param {string} str - The string to encode.
*
* @returns {string} The encoded string.
*/
function encode$1(str) {
	const charMap = {
		"!": "%21",
		"'": "%27",
		"(": "%28",
		")": "%29",
		"~": "%7E",
		"%20": "+"
	};
	return encodeURIComponent(str).replace(/[!'()~]|%20/g, function replacer(match) {
		return charMap[match];
	});
}
/**
* It takes a params object and converts it to a FormData object
*
* @param {Object<string, any>} params - The parameters to be converted to a FormData object.
* @param {Object<string, any>} options - The options object passed to the Axios constructor.
*
* @returns {void}
*/
function AxiosURLSearchParams(params, options) {
	this._pairs = [];
	params && toFormData$1(params, this, options);
}
var prototype = AxiosURLSearchParams.prototype;
prototype.append = function append(name, value) {
	this._pairs.push([name, value]);
};
prototype.toString = function toString(encoder) {
	const _encode = encoder ? (value) => encoder.call(this, value, encode$1) : encode$1;
	return this._pairs.map(function each(pair) {
		return _encode(pair[0]) + "=" + _encode(pair[1]);
	}, "").join("&");
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/buildURL.js
/**
* It replaces URL-encoded forms of `:`, `$`, `,`, and spaces with
* their plain counterparts (`:`, `$`, `,`, `+`).
*
* @param {string} val The value to be encoded.
*
* @returns {string} The encoded value.
*/
function encode(val) {
	return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
}
/**
* Build a URL by appending params to the end
*
* @param {string} url The base of the url (e.g., http://www.google.com)
* @param {object} [params] The params to be appended
* @param {?(object|Function)} options
*
* @returns {string} The formatted url
*/
function buildURL(url, params, options) {
	if (!params) return url;
	url = url || "";
	const _options = utils_default.isFunction(options) ? { serialize: options } : options;
	const _encode = utils_default.getSafeProp(_options, "encode") || encode;
	const serializeFn = utils_default.getSafeProp(_options, "serialize");
	let serializedParams;
	if (serializeFn) serializedParams = serializeFn(params, _options);
	else serializedParams = utils_default.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams(params, _options).toString(_encode);
	if (serializedParams) {
		const hashmarkIndex = url.indexOf("#");
		if (hashmarkIndex !== -1) url = url.slice(0, hashmarkIndex);
		url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
	}
	return url;
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/core/InterceptorManager.js
var InterceptorManager = class {
	constructor() {
		this.handlers = [];
	}
	/**
	* Add a new interceptor to the stack
	*
	* @param {Function} fulfilled The function to handle `then` for a `Promise`
	* @param {Function} rejected The function to handle `reject` for a `Promise`
	* @param {Object} options The options for the interceptor, synchronous and runWhen
	*
	* @return {Number} An ID used to remove interceptor later
	*/
	use(fulfilled, rejected, options) {
		this.handlers.push({
			fulfilled,
			rejected,
			synchronous: options ? options.synchronous : false,
			runWhen: options ? options.runWhen : null
		});
		return this.handlers.length - 1;
	}
	/**
	* Remove an interceptor from the stack
	*
	* @param {Number} id The ID that was returned by `use`
	*
	* @returns {void}
	*/
	eject(id) {
		if (this.handlers[id]) this.handlers[id] = null;
	}
	/**
	* Clear all interceptors from the stack
	*
	* @returns {void}
	*/
	clear() {
		if (this.handlers) this.handlers = [];
	}
	/**
	* Iterate over all the registered interceptors
	*
	* This method is particularly useful for skipping over any
	* interceptors that may have become `null` calling `eject`.
	*
	* @param {Function} fn The function to call for each interceptor
	*
	* @returns {void}
	*/
	forEach(fn) {
		utils_default.forEach(this.handlers, function forEachHandler(h) {
			if (h !== null) fn(h);
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/defaults/transitional.js
var transitional_default = {
	silentJSONParsing: true,
	forcedJSONParsing: true,
	clarifyTimeoutError: false,
	legacyInterceptorReqResOrdering: true,
	advertiseZstdAcceptEncoding: false,
	validateStatusUndefinedResolves: true
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/platform/browser/index.js
var browser_default = {
	isBrowser: true,
	classes: {
		URLSearchParams: typeof URLSearchParams !== "undefined" ? URLSearchParams : AxiosURLSearchParams,
		FormData: typeof FormData !== "undefined" ? FormData : null,
		Blob: typeof Blob !== "undefined" ? Blob : null
	},
	protocols: [
		"http",
		"https",
		"file",
		"blob",
		"url",
		"data"
	]
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/platform/common/utils.js
var utils_exports = /* @__PURE__ */ __exportAll({
	hasBrowserEnv: () => hasBrowserEnv,
	hasStandardBrowserEnv: () => hasStandardBrowserEnv,
	hasStandardBrowserWebWorkerEnv: () => hasStandardBrowserWebWorkerEnv,
	navigator: () => _navigator,
	origin: () => origin
});
var hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
var _navigator = typeof navigator === "object" && navigator || void 0;
/**
* Determine if we're running in a standard browser environment
*
* This allows axios to run in a web worker, and react-native.
* Both environments support XMLHttpRequest, but not fully standard globals.
*
* web workers:
*  typeof window -> undefined
*  typeof document -> undefined
*
* react-native:
*  navigator.product -> 'ReactNative'
* nativescript
*  navigator.product -> 'NativeScript' or 'NS'
*
* @returns {boolean}
*/
var hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || [
	"ReactNative",
	"NativeScript",
	"NS"
].indexOf(_navigator.product) < 0);
/**
* Determine if we're running in a standard browser webWorker environment
*
* Although the `isStandardBrowserEnv` method indicates that
* `allows axios to run in a web worker`, the WebWorker will still be
* filtered out due to its judgment standard
* `typeof window !== 'undefined' && typeof document !== 'undefined'`.
* This leads to a problem when axios post `FormData` in webWorker
*/
var hasStandardBrowserWebWorkerEnv = (() => {
	return typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
})();
var origin = hasBrowserEnv && window.location.href || "http://localhost";
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/platform/index.js
var platform_default = {
	...utils_exports,
	...browser_default
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/toURLEncodedForm.js
function toURLEncodedForm(data, options) {
	return toFormData$1(data, new platform_default.classes.URLSearchParams(), {
		visitor: function(value, key, path, helpers) {
			if (platform_default.isNode && utils_default.isBuffer(value)) {
				this.append(key, value.toString("base64"));
				return false;
			}
			return helpers.defaultVisitor.apply(this, arguments);
		},
		...options
	});
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/formDataToJSON.js
var MAX_DEPTH = 100;
function throwIfDepthExceeded(index) {
	if (index > MAX_DEPTH) throw new AxiosError$1("FormData field is too deeply nested (" + index + " levels). Max depth: " + MAX_DEPTH, AxiosError$1.ERR_FORM_DATA_DEPTH_EXCEEDED);
}
/**
* It takes a string like `foo[x][y][z]` and returns an array like `['foo', 'x', 'y', 'z']
*
* @param {string} name - The name of the property to get.
*
* @returns An array of strings.
*/
function parsePropPath(name) {
	const path = [];
	const pattern = /[^.[\]]+|\[([^.[\]]*)]/g;
	let match;
	while ((match = pattern.exec(name)) !== null) {
		throwIfDepthExceeded(path.length);
		path.push(match[0] === "[]" ? "" : match[1] || match[0]);
	}
	return path;
}
/**
* Convert an array to an object.
*
* @param {Array<any>} arr - The array to convert to an object.
*
* @returns An object with the same keys and values as the array.
*/
function arrayToObject(arr) {
	const obj = {};
	const keys = Object.keys(arr);
	let i;
	const len = keys.length;
	let key;
	for (i = 0; i < len; i++) {
		key = keys[i];
		obj[key] = arr[key];
	}
	return obj;
}
/**
* It takes a FormData object and returns a JavaScript object
*
* @param {string} formData The FormData object to convert to JSON.
*
* @returns {Object<string, any> | null} The converted object.
*/
function formDataToJSON(formData) {
	function buildPath(path, value, target, index) {
		throwIfDepthExceeded(index);
		let name = path[index++];
		if (name === "__proto__") return true;
		const isNumericKey = Number.isFinite(+name);
		const isLast = index >= path.length;
		name = !name && utils_default.isArray(target) ? target.length : name;
		if (isLast) {
			if (utils_default.hasOwnProp(target, name)) target[name] = utils_default.isArray(target[name]) ? target[name].concat(value) : [target[name], value];
			else target[name] = value;
			return !isNumericKey;
		}
		if (!utils_default.hasOwnProp(target, name) || !utils_default.isObject(target[name])) target[name] = [];
		if (buildPath(path, value, target[name], index) && utils_default.isArray(target[name])) target[name] = arrayToObject(target[name]);
		return !isNumericKey;
	}
	if (utils_default.isFormData(formData) && utils_default.isFunction(formData.entries)) {
		const obj = {};
		utils_default.forEachEntry(formData, (name, value) => {
			buildPath(parsePropPath(name), value, obj, 0);
		});
		return obj;
	}
	return null;
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/defaults/index.js
var own = (obj, key) => obj != null && utils_default.hasOwnProp(obj, key) ? obj[key] : void 0;
/**
* It takes a string, tries to parse it, and if it fails, it returns the stringified version
* of the input
*
* @param {any} rawValue - The value to be stringified.
* @param {Function} parser - A function that parses a string into a JavaScript object.
* @param {Function} encoder - A function that takes a value and returns a string.
*
* @returns {string} A stringified version of the rawValue.
*/
function stringifySafely(rawValue, parser, encoder) {
	if (utils_default.isString(rawValue)) try {
		(parser || JSON.parse)(rawValue);
		return utils_default.trim(rawValue);
	} catch (e) {
		if (e.name !== "SyntaxError") throw e;
	}
	return (encoder || JSON.stringify)(rawValue);
}
var defaults = {
	transitional: transitional_default,
	adapter: [
		"xhr",
		"http",
		"fetch"
	],
	transformRequest: [function transformRequest(data, headers) {
		const contentType = headers.getContentType() || "";
		const hasJSONContentType = contentType.indexOf("application/json") > -1;
		const isObjectPayload = utils_default.isObject(data);
		if (isObjectPayload && utils_default.isHTMLForm(data)) data = new FormData(data);
		if (utils_default.isFormData(data)) return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
		if (utils_default.isArrayBuffer(data) || utils_default.isBuffer(data) || utils_default.isStream(data) || utils_default.isFile(data) || utils_default.isBlob(data) || utils_default.isReadableStream(data)) return data;
		if (utils_default.isArrayBufferView(data)) return data.buffer;
		if (utils_default.isURLSearchParams(data)) {
			headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
			return data.toString();
		}
		let isFileList;
		if (isObjectPayload) {
			const formSerializer = own(this, "formSerializer");
			if (contentType.indexOf("application/x-www-form-urlencoded") > -1) return toURLEncodedForm(data, formSerializer).toString();
			if ((isFileList = utils_default.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
				const env = own(this, "env");
				const _FormData = env && env.FormData;
				return toFormData$1(isFileList ? { "files[]": data } : data, _FormData && new _FormData(), formSerializer);
			}
		}
		if (isObjectPayload || hasJSONContentType) {
			headers.setContentType("application/json", false);
			return stringifySafely(data);
		}
		return data;
	}],
	transformResponse: [function transformResponse(data) {
		const transitional = own(this, "transitional") || defaults.transitional;
		const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
		const responseType = own(this, "responseType");
		const JSONRequested = responseType === "json";
		if (utils_default.isResponse(data) || utils_default.isReadableStream(data)) return data;
		if (data && utils_default.isString(data) && (forcedJSONParsing && !responseType || JSONRequested)) {
			const strictJSONParsing = !(transitional && transitional.silentJSONParsing) && JSONRequested;
			try {
				return JSON.parse(data, own(this, "parseReviver"));
			} catch (e) {
				if (strictJSONParsing) {
					if (e.name === "SyntaxError") throw AxiosError$1.from(e, AxiosError$1.ERR_BAD_RESPONSE, this, null, own(this, "response"));
					throw e;
				}
			}
		}
		return data;
	}],
	/**
	* A timeout in milliseconds to abort a request. If set to 0 (default) a
	* timeout is not created.
	*/
	timeout: 0,
	xsrfCookieName: "XSRF-TOKEN",
	xsrfHeaderName: "X-XSRF-TOKEN",
	maxContentLength: -1,
	maxBodyLength: -1,
	env: {
		FormData: platform_default.classes.FormData,
		Blob: platform_default.classes.Blob
	},
	validateStatus: function validateStatus(status) {
		return status >= 200 && status < 300;
	},
	headers: { common: {
		Accept: "application/json, text/plain, */*",
		"Content-Type": void 0
	} }
};
utils_default.forEach([
	"delete",
	"get",
	"head",
	"post",
	"put",
	"patch",
	"query"
], (method) => {
	defaults.headers[method] = {};
});
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/core/transformData.js
/**
* Transform the data for a request or a response
*
* @param {Array|Function} fns A single function or Array of functions
* @param {?Object} response The response object
*
* @returns {*} The resulting transformed data
*/
function transformData(fns, response) {
	const config = this || defaults;
	const context = response || config;
	const headers = AxiosHeaders$1.from(context.headers);
	let data = context.data;
	utils_default.forEach(fns, function transform(fn) {
		data = fn.call(config, data, headers.normalize(), response ? response.status : void 0);
	});
	headers.normalize();
	return data;
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/cancel/isCancel.js
function isCancel$1(value) {
	return !!(value && value.__CANCEL__);
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/cancel/CanceledError.js
var CanceledError$1 = class extends AxiosError$1 {
	/**
	* A `CanceledError` is an object that is thrown when an operation is canceled.
	*
	* @param {string=} message The message.
	* @param {Object=} config The config.
	* @param {Object=} request The request.
	*
	* @returns {CanceledError} The created error.
	*/
	constructor(message, config, request) {
		super(message == null ? "canceled" : message, AxiosError$1.ERR_CANCELED, config, request);
		this.name = "CanceledError";
		this.__CANCEL__ = true;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/core/settle.js
/**
* Resolve or reject a Promise based on response status.
*
* @param {Function} resolve A function that resolves the promise.
* @param {Function} reject A function that rejects the promise.
* @param {object} response The response.
*
* @returns {object} The response.
*/
function settle(resolve, reject, response) {
	const validateStatus = response.config.validateStatus;
	if (!response.status || !validateStatus || validateStatus(response.status)) resolve(response);
	else reject(new AxiosError$1("Request failed with status code " + response.status, response.status >= 400 && response.status < 500 ? AxiosError$1.ERR_BAD_REQUEST : AxiosError$1.ERR_BAD_RESPONSE, response.config, response.request, response));
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/parseProtocol.js
function parseProtocol(url) {
	const match = /^([-+\w]{1,25}):(?:\/\/)?/.exec(url);
	return match && match[1] || "";
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/speedometer.js
/**
* Calculate data maxRate
* @param {Number} [samplesCount= 10]
* @param {Number} [min= 1000]
* @returns {Function}
*/
function speedometer(samplesCount, min) {
	samplesCount = samplesCount || 10;
	const bytes = new Array(samplesCount);
	const timestamps = new Array(samplesCount);
	let head = 0;
	let tail = 0;
	let firstSampleTS;
	min = min !== void 0 ? min : 1e3;
	return function push(chunkLength) {
		const now = Date.now();
		const startedAt = timestamps[tail];
		if (!firstSampleTS) firstSampleTS = now;
		bytes[head] = chunkLength;
		timestamps[head] = now;
		let i = tail;
		let bytesCount = 0;
		while (i !== head) {
			bytesCount += bytes[i++];
			i = i % samplesCount;
		}
		head = (head + 1) % samplesCount;
		if (head === tail) tail = (tail + 1) % samplesCount;
		if (now - firstSampleTS < min) return;
		const passed = startedAt && now - startedAt;
		return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
	};
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/throttle.js
/**
* Throttle decorator
* @param {Function} fn
* @param {Number} freq
* @return {Function}
*/
function throttle(fn, freq) {
	let timestamp = 0;
	let threshold = 1e3 / freq;
	let lastArgs;
	let timer;
	const invoke = (args, now = Date.now()) => {
		timestamp = now;
		lastArgs = null;
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		fn(...args);
	};
	const throttled = (...args) => {
		const now = Date.now();
		const passed = now - timestamp;
		if (passed >= threshold) invoke(args, now);
		else {
			lastArgs = args;
			if (!timer) timer = setTimeout(() => {
				timer = null;
				invoke(lastArgs);
			}, threshold - passed);
		}
	};
	const flush = () => lastArgs && invoke(lastArgs);
	return [throttled, flush];
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/progressEventReducer.js
var progressEventReducer = (listener, isDownloadStream, freq = 3) => {
	let bytesNotified = 0;
	const _speedometer = speedometer(50, 250);
	return throttle((e) => {
		if (!e || typeof e.loaded !== "number") return;
		const rawLoaded = e.loaded;
		const total = e.lengthComputable ? e.total : void 0;
		const loaded = Math.max(0, total != null ? Math.min(rawLoaded, total) : rawLoaded);
		const progressBytes = Math.max(0, loaded - bytesNotified);
		const rate = _speedometer(progressBytes);
		bytesNotified = Math.max(bytesNotified, loaded);
		listener({
			loaded,
			total,
			progress: total ? loaded / total : void 0,
			bytes: progressBytes,
			rate: rate ? rate : void 0,
			estimated: rate && total ? (total - loaded) / rate : void 0,
			event: e,
			lengthComputable: total != null,
			[isDownloadStream ? "download" : "upload"]: true
		});
	}, freq);
};
var progressEventDecorator = (total, throttled) => {
	const lengthComputable = total != null;
	return [(loaded) => throttled[0]({
		lengthComputable,
		total,
		loaded
	}), throttled[1]];
};
var asyncDecorator = (fn, scheduler = utils_default.asap) => (...args) => scheduler(() => fn(...args));
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/isURLSameOrigin.js
var isURLSameOrigin_default = platform_default.hasStandardBrowserEnv ? ((origin, isMSIE) => (url) => {
	url = new URL(url, platform_default.origin);
	return origin.protocol === url.protocol && origin.host === url.host && (isMSIE || origin.port === url.port);
})(new URL(platform_default.origin), platform_default.navigator && /(msie|trident)/i.test(platform_default.navigator.userAgent)) : () => true;
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/cookies.js
var cookies_default = platform_default.hasStandardBrowserEnv ? {
	write(name, value, expires, path, domain, secure, sameSite) {
		if (typeof document === "undefined") return;
		const cookie = [`${name}=${encodeURIComponent(value)}`];
		if (utils_default.isNumber(expires)) cookie.push(`expires=${new Date(expires).toUTCString()}`);
		if (utils_default.isString(path)) cookie.push(`path=${path}`);
		if (utils_default.isString(domain)) cookie.push(`domain=${domain}`);
		if (secure === true) cookie.push("secure");
		if (utils_default.isString(sameSite)) cookie.push(`SameSite=${sameSite}`);
		document.cookie = cookie.join("; ");
	},
	read(name) {
		if (typeof document === "undefined") return null;
		const cookies = document.cookie.split(";");
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].replace(/^\s+/, "");
			const eq = cookie.indexOf("=");
			if (eq !== -1 && cookie.slice(0, eq) === name) try {
				return decodeURIComponent(cookie.slice(eq + 1));
			} catch (e) {
				return cookie.slice(eq + 1);
			}
		}
		return null;
	},
	remove(name) {
		this.write(name, "", Date.now() - 864e5, "/");
	}
} : {
	write() {},
	read() {
		return null;
	},
	remove() {}
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/isAbsoluteURL.js
/**
* Determines whether the specified URL is absolute
*
* @param {string} url The URL to test
*
* @returns {boolean} True if the specified URL is absolute, otherwise false
*/
function isAbsoluteURL(url) {
	if (typeof url !== "string") return false;
	return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/combineURLs.js
/**
* Creates a new URL by combining the specified URLs
*
* @param {string} baseURL The base URL
* @param {string} relativeURL The relative URL
*
* @returns {string} The combined URL
*/
function combineURLs(baseURL, relativeURL) {
	if (!relativeURL) return baseURL;
	let end = baseURL.length;
	while (end > 0 && baseURL.charCodeAt(end - 1) === 47) end--;
	return baseURL.slice(0, end) + "/" + relativeURL.replace(/^\/+/, "");
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/core/buildFullPath.js
var malformedHttpProtocol = /^https?:(?!\/\/)/i;
var httpProtocolControlCharacters = /[\t\n\r]/g;
function stripLeadingC0ControlOrSpace(url) {
	let i = 0;
	while (i < url.length && url.charCodeAt(i) <= 32) i++;
	return url.slice(i);
}
function normalizeURLForProtocolCheck(url) {
	return stripLeadingC0ControlOrSpace(url).replace(httpProtocolControlCharacters, "");
}
function redactFragment(fragment) {
	if (!fragment) return fragment;
	return fragment.replace(/(^|&)([^=&]*=)?[^&]+/g, (match, separator, parameterName = "") => {
		return `${separator}${parameterName}${REDACTED}`;
	});
}
function redactSensitiveURLParts(url) {
	const redactedURL = url.replace(/^(https?:\/{0,2})[^/?#]*@/i, `$1${REDACTED}@`);
	const fragmentIndex = redactedURL.indexOf("#");
	const redactedURLWithoutFragment = (fragmentIndex === -1 ? redactedURL : redactedURL.slice(0, fragmentIndex)).replace(/([?&][^=&#]*=)[^&#]*/g, `$1${REDACTED}`);
	if (fragmentIndex === -1) return redactedURLWithoutFragment;
	return `${redactedURLWithoutFragment}#${redactFragment(redactedURL.slice(fragmentIndex + 1))}`;
}
function assertValidHttpProtocolURL(url, config) {
	if (typeof url === "string") {
		const normalizedURL = normalizeURLForProtocolCheck(url);
		if (malformedHttpProtocol.test(normalizedURL)) throw new AxiosError$1(`Invalid URL ${JSON.stringify(redactSensitiveURLParts(normalizedURL))}: missing "//" after protocol`, AxiosError$1.ERR_INVALID_URL, config);
	}
}
/**
* Creates a new URL by combining the baseURL with the requestedURL,
* only when the requestedURL is not already an absolute URL.
* If the requestURL is absolute, this function returns the requestedURL untouched.
*
* @param {string} baseURL The base URL
* @param {string} requestedURL Absolute or relative URL to combine
*
* @returns {string} The combined full path
*/
function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls, config) {
	assertValidHttpProtocolURL(requestedURL, config);
	let isRelativeUrl = !isAbsoluteURL(requestedURL);
	if (baseURL && (isRelativeUrl || allowAbsoluteUrls === false)) {
		assertValidHttpProtocolURL(baseURL, config);
		return combineURLs(baseURL, requestedURL);
	}
	return requestedURL;
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/core/mergeConfig.js
var headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;
var ownEnumerableKeys = (thing) => {
	if (Object.getOwnPropertySymbols && Object.getOwnPropertyDescriptor) return Object.keys(thing).concat(Object.getOwnPropertySymbols(thing).filter((symbol) => Object.getOwnPropertyDescriptor(thing, symbol).enumerable));
	return Object.keys(thing);
};
/**
* Config-specific merge-function which creates a new config-object
* by merging two configuration objects together.
*
* @param {Object} config1
* @param {Object} config2
*
* @returns {Object} New object resulting from merging config2 to config1
*/
function mergeConfig$1(config1, config2) {
	config1 = config1 || {};
	config2 = config2 || {};
	const config = Object.create(null);
	Object.defineProperty(config, "hasOwnProperty", {
		__proto__: null,
		value: Object.prototype.hasOwnProperty,
		enumerable: false,
		writable: true,
		configurable: true
	});
	function getMergedValue(target, source, prop, caseless) {
		if (utils_default.isPlainObject(target) && utils_default.isPlainObject(source)) return utils_default.merge.call({ caseless }, target, source);
		else if (utils_default.isPlainObject(source)) return utils_default.merge({}, source);
		else if (utils_default.isArray(source)) return source.slice();
		return source;
	}
	function mergeDeepProperties(a, b, prop, caseless) {
		if (!utils_default.isUndefined(b)) return getMergedValue(a, b, prop, caseless);
		else if (!utils_default.isUndefined(a)) return getMergedValue(void 0, a, prop, caseless);
	}
	function valueFromConfig2(a, b) {
		if (!utils_default.isUndefined(b)) return getMergedValue(void 0, b);
	}
	function defaultToConfig2(a, b) {
		if (!utils_default.isUndefined(b)) return getMergedValue(void 0, b);
		else if (!utils_default.isUndefined(a)) return getMergedValue(void 0, a);
	}
	function getMergedTransitionalOption(prop) {
		const transitional2 = utils_default.hasOwnProp(config2, "transitional") ? config2.transitional : void 0;
		if (!utils_default.isUndefined(transitional2)) if (utils_default.isPlainObject(transitional2)) {
			if (utils_default.hasOwnProp(transitional2, prop)) return transitional2[prop];
		} else return;
		const transitional1 = utils_default.hasOwnProp(config1, "transitional") ? config1.transitional : void 0;
		if (utils_default.isPlainObject(transitional1) && utils_default.hasOwnProp(transitional1, prop)) return transitional1[prop];
	}
	function mergeDirectKeys(a, b, prop) {
		if (utils_default.hasOwnProp(config2, prop)) return getMergedValue(a, b);
		else if (utils_default.hasOwnProp(config1, prop)) return getMergedValue(void 0, a);
	}
	const mergeMap = {
		url: valueFromConfig2,
		method: valueFromConfig2,
		data: valueFromConfig2,
		baseURL: defaultToConfig2,
		transformRequest: defaultToConfig2,
		transformResponse: defaultToConfig2,
		paramsSerializer: defaultToConfig2,
		timeout: defaultToConfig2,
		timeoutMessage: defaultToConfig2,
		withCredentials: defaultToConfig2,
		withXSRFToken: defaultToConfig2,
		adapter: defaultToConfig2,
		responseType: defaultToConfig2,
		xsrfCookieName: defaultToConfig2,
		xsrfHeaderName: defaultToConfig2,
		onUploadProgress: defaultToConfig2,
		onDownloadProgress: defaultToConfig2,
		decompress: defaultToConfig2,
		maxContentLength: defaultToConfig2,
		maxBodyLength: defaultToConfig2,
		beforeRedirect: defaultToConfig2,
		transport: defaultToConfig2,
		httpAgent: defaultToConfig2,
		httpsAgent: defaultToConfig2,
		cancelToken: defaultToConfig2,
		socketPath: defaultToConfig2,
		allowedSocketPaths: defaultToConfig2,
		responseEncoding: defaultToConfig2,
		validateStatus: mergeDirectKeys,
		headers: (a, b, prop) => mergeDeepProperties(headersToObject(a), headersToObject(b), prop, true)
	};
	utils_default.forEach(ownEnumerableKeys({
		...config1,
		...config2
	}), function computeConfigValue(prop) {
		if (prop === "__proto__" || prop === "constructor" || prop === "prototype") return;
		const merge = utils_default.hasOwnProp(mergeMap, prop) ? mergeMap[prop] : mergeDeepProperties;
		const configValue = merge(utils_default.hasOwnProp(config1, prop) ? config1[prop] : void 0, utils_default.hasOwnProp(config2, prop) ? config2[prop] : void 0, prop);
		utils_default.isUndefined(configValue) && merge !== mergeDirectKeys || (config[prop] = configValue);
	});
	if (utils_default.hasOwnProp(config2, "validateStatus") && utils_default.isUndefined(config2.validateStatus) && getMergedTransitionalOption("validateStatusUndefinedResolves") === false) if (utils_default.hasOwnProp(config1, "validateStatus")) config.validateStatus = getMergedValue(void 0, config1.validateStatus);
	else delete config.validateStatus;
	return config;
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/core/setFormDataHeaders.js
var FORM_DATA_CONTENT_HEADERS = ["content-type", "content-length"];
/**
* Apply the headers generated by a FormData implementation to the request headers,
* honoring the `formDataHeaderPolicy` option: with 'content-only', copy only the
* content-* headers; otherwise merge all of them.
*
* @param {AxiosHeaders} headers - the request headers to mutate
* @param {Object | null | undefined} formHeaders - headers produced by the FormData implementation
* @param {String} [policy] - the resolved `formDataHeaderPolicy` config value
*
* @returns {void}
*/
function setFormDataHeaders(headers, formHeaders, policy) {
	if (policy !== "content-only") {
		headers.set(formHeaders);
		return;
	}
	Object.entries(formHeaders || {}).forEach(([key, val]) => {
		if (FORM_DATA_CONTENT_HEADERS.includes(key.toLowerCase())) headers.set(key, val);
	});
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/resolveConfig.js
/**
* Encode a UTF-8 string to a Latin-1 byte string for use with btoa().
* This is a modern replacement for the deprecated unescape(encodeURIComponent(str)) pattern.
*
* @param {string} str The string to encode
*
* @returns {string} UTF-8 bytes as a Latin-1 string
*/
var encodeUTF8$1 = (str) => encodeURIComponent(str).replace(/%([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
function resolveConfig(config) {
	const newConfig = mergeConfig$1({}, config);
	const own = (key) => utils_default.hasOwnProp(newConfig, key) ? newConfig[key] : void 0;
	const data = own("data");
	let withXSRFToken = own("withXSRFToken");
	const xsrfHeaderName = own("xsrfHeaderName");
	const xsrfCookieName = own("xsrfCookieName");
	let headers = own("headers");
	const auth = own("auth");
	const baseURL = own("baseURL");
	const allowAbsoluteUrls = own("allowAbsoluteUrls");
	const url = own("url");
	newConfig.headers = headers = AxiosHeaders$1.from(headers);
	newConfig.url = buildURL(buildFullPath(baseURL, url, allowAbsoluteUrls, newConfig), own("params"), own("paramsSerializer"));
	if (auth) {
		const username = utils_default.getSafeProp(auth, "username") || "";
		const password = utils_default.getSafeProp(auth, "password") || "";
		try {
			headers.set("Authorization", "Basic " + btoa(username + ":" + (password ? encodeUTF8$1(password) : "")));
		} catch (e) {
			throw AxiosError$1.from(e, AxiosError$1.ERR_BAD_OPTION_VALUE, config);
		}
	}
	if (utils_default.isFormData(data)) {
		if (platform_default.hasStandardBrowserEnv || platform_default.hasStandardBrowserWebWorkerEnv || utils_default.isReactNative(data)) headers.setContentType(void 0);
		else if (utils_default.isFunction(data.getHeaders)) setFormDataHeaders(headers, data.getHeaders(), own("formDataHeaderPolicy"));
	}
	if (platform_default.hasStandardBrowserEnv) {
		if (utils_default.isFunction(withXSRFToken)) withXSRFToken = withXSRFToken(newConfig);
		if (withXSRFToken === true || withXSRFToken == null && isURLSameOrigin_default(newConfig.url)) {
			const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies_default.read(xsrfCookieName);
			if (xsrfValue) headers.set(xsrfHeaderName, xsrfValue);
		}
	}
	return newConfig;
}
var xhr_default = typeof XMLHttpRequest !== "undefined" && function(config) {
	return new Promise(function dispatchXhrRequest(resolve, reject) {
		const _config = resolveConfig(config);
		let requestData = _config.data;
		const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
		let { responseType, onUploadProgress, onDownloadProgress } = _config;
		let onCanceled;
		let uploadThrottled, downloadThrottled;
		let flushUpload, flushDownload;
		function done() {
			flushUpload && flushUpload();
			flushDownload && flushDownload();
			_config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
			_config.signal && _config.signal.removeEventListener("abort", onCanceled);
		}
		let request = new XMLHttpRequest();
		request.open(_config.method.toUpperCase(), _config.url, true);
		request.timeout = _config.timeout;
		function onloadend() {
			if (!request) return;
			const responseHeaders = AxiosHeaders$1.from("getAllResponseHeaders" in request && request.getAllResponseHeaders());
			settle(function _resolve(value) {
				resolve(value);
				done();
			}, function _reject(err) {
				reject(err);
				done();
			}, {
				data: !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response,
				status: request.status,
				statusText: request.statusText,
				headers: responseHeaders,
				config,
				request
			});
			request = null;
		}
		if ("onloadend" in request) request.onloadend = onloadend;
		else request.onreadystatechange = function handleLoad() {
			if (!request || request.readyState !== 4) return;
			if (request.status === 0 && !(request.responseURL && request.responseURL.startsWith("file:"))) return;
			setTimeout(onloadend);
		};
		request.onabort = function handleAbort() {
			if (!request) return;
			reject(new AxiosError$1("Request aborted", AxiosError$1.ECONNABORTED, config, request));
			done();
			request = null;
		};
		request.onerror = function handleError(event) {
			const err = new AxiosError$1(event && event.message ? event.message : "Network Error", AxiosError$1.ERR_NETWORK, config, request);
			err.event = event || null;
			reject(err);
			done();
			request = null;
		};
		request.ontimeout = function handleTimeout() {
			let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
			const transitional = _config.transitional || transitional_default;
			if (_config.timeoutErrorMessage) timeoutErrorMessage = _config.timeoutErrorMessage;
			reject(new AxiosError$1(timeoutErrorMessage, transitional.clarifyTimeoutError ? AxiosError$1.ETIMEDOUT : AxiosError$1.ECONNABORTED, config, request));
			done();
			request = null;
		};
		requestData === void 0 && requestHeaders.setContentType(null);
		if ("setRequestHeader" in request) utils_default.forEach(toByteStringHeaderObject(requestHeaders), function setRequestHeader(val, key) {
			request.setRequestHeader(key, val);
		});
		if (!utils_default.isUndefined(_config.withCredentials)) request.withCredentials = !!_config.withCredentials;
		if (responseType && responseType !== "json") request.responseType = _config.responseType;
		if (onDownloadProgress) {
			[downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true);
			request.addEventListener("progress", downloadThrottled);
		}
		if (onUploadProgress && request.upload) {
			[uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
			request.upload.addEventListener("progress", uploadThrottled);
			request.upload.addEventListener("loadend", flushUpload);
		}
		if (_config.cancelToken || _config.signal) {
			onCanceled = (cancel) => {
				if (!request) return;
				reject(!cancel || cancel.type ? new CanceledError$1(null, config, request) : cancel);
				request.abort();
				done();
				request = null;
			};
			_config.cancelToken && _config.cancelToken.subscribe(onCanceled);
			if (_config.signal) _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
		}
		const protocol = parseProtocol(_config.url);
		if (protocol && !platform_default.protocols.includes(protocol)) {
			reject(new AxiosError$1("Unsupported protocol " + protocol + ":", AxiosError$1.ERR_BAD_REQUEST, config));
			done();
			return;
		}
		request.send(requestData || null);
	});
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/composeSignals.js
var composeSignals = (signals, timeout) => {
	signals = signals ? signals.filter(Boolean) : [];
	if (!timeout && !signals.length) return;
	const controller = new AbortController();
	let aborted = false;
	const onabort = function(reason) {
		if (!aborted) {
			aborted = true;
			unsubscribe();
			const err = reason instanceof Error ? reason : this.reason;
			controller.abort(err instanceof AxiosError$1 ? err : new CanceledError$1(err instanceof Error ? err.message : err));
		}
	};
	let timer = timeout && setTimeout(() => {
		timer = null;
		onabort(new AxiosError$1(`timeout of ${timeout}ms exceeded`, AxiosError$1.ETIMEDOUT));
	}, timeout);
	const unsubscribe = () => {
		if (!signals) return;
		timer && clearTimeout(timer);
		timer = null;
		signals.forEach((signal) => {
			signal.unsubscribe ? signal.unsubscribe(onabort) : signal.removeEventListener("abort", onabort);
		});
		signals = null;
	};
	signals.forEach((signal) => {
		if (aborted) return;
		if (signal.aborted) {
			onabort.call(signal);
			return;
		}
		signal.addEventListener("abort", onabort, { once: true });
	});
	const { signal } = controller;
	signal.unsubscribe = () => utils_default.asap(unsubscribe);
	return signal;
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/trackStream.js
var streamChunk = function* (chunk, chunkSize) {
	let len = chunk.byteLength;
	if (!chunkSize || len < chunkSize) {
		yield chunk;
		return;
	}
	let pos = 0;
	let end;
	while (pos < len) {
		end = pos + chunkSize;
		yield chunk.slice(pos, end);
		pos = end;
	}
};
var readBytes = async function* (iterable, chunkSize) {
	for await (const chunk of readStream(iterable)) yield* streamChunk(chunk, chunkSize);
};
var readStream = async function* (stream) {
	if (stream[Symbol.asyncIterator]) {
		yield* stream;
		return;
	}
	const reader = stream.getReader();
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			yield value;
		}
	} finally {
		await reader.cancel();
	}
};
var trackStream = (stream, chunkSize, onProgress, onFinish) => {
	const iterator = readBytes(stream, chunkSize);
	let bytes = 0;
	let done;
	let _onFinish = (e) => {
		if (!done) {
			done = true;
			onFinish && onFinish(e);
		}
	};
	return new ReadableStream({
		async pull(controller) {
			try {
				const { done, value } = await iterator.next();
				if (done) {
					_onFinish();
					controller.close();
					return;
				}
				let len = value.byteLength;
				if (onProgress) onProgress(bytes += len);
				controller.enqueue(new Uint8Array(value));
			} catch (err) {
				_onFinish(err);
				throw err;
			}
		},
		cancel(reason) {
			_onFinish(reason);
			return iterator.return();
		}
	}, { highWaterMark: 2 });
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/estimateDataURLDecodedBytes.js
/**
* Estimate data: URL byte lengths *without* allocating large buffers.
* - Fetch percent-decodes a base64 body before decoding it.
* - Node's Buffer.from(body, 'base64') sizes its backing allocation from the
*   raw body, including ignored characters and content after padding.
* - Non-base64 data is percent-decoded and then encoded as UTF-8.
*/
var isHexDigit = (charCode) => charCode >= 48 && charCode <= 57 || charCode >= 65 && charCode <= 70 || charCode >= 97 && charCode <= 102;
var isPercentEncodedByte = (str, i, len) => i + 2 < len && isHexDigit(str.charCodeAt(i + 1)) && isHexDigit(str.charCodeAt(i + 2));
var hexValue = (charCode) => charCode <= 57 ? charCode - 48 : (charCode & 223) - 55;
var isBase64Char = (charCode) => charCode >= 65 && charCode <= 90 || charCode >= 97 && charCode <= 122 || charCode >= 48 && charCode <= 57 || charCode === 43 || charCode === 47 || charCode === 45 || charCode === 95;
var isBase64Whitespace = (charCode) => charCode === 9 || charCode === 10 || charCode === 12 || charCode === 13 || charCode === 32;
var base64Bytes = (significant) => {
	const groups = Math.floor(significant / 4);
	const remainder = significant % 4;
	return groups * 3 + (remainder === 2 ? 1 : remainder === 3 ? 2 : 0);
};
var estimateBase64BufferAllocation = (body) => {
	const len = body.length;
	let padding = 0;
	if (len > 0 && body.charCodeAt(len - 1) === 61) {
		padding++;
		if (len > 1 && body.charCodeAt(len - 2) === 61) padding++;
	}
	return Math.floor((len - padding) * 3 / 4);
};
var estimatePercentDecodedBase64Bytes = (body) => {
	const len = body.length;
	let significant = 0;
	let padding = 0;
	let invalid = false;
	for (let i = 0; i < len; i++) {
		let code = body.charCodeAt(i);
		if (code === 37 && isPercentEncodedByte(body, i, len)) {
			code = hexValue(body.charCodeAt(i + 1)) * 16 + hexValue(body.charCodeAt(i + 2));
			i += 2;
		}
		if (isBase64Whitespace(code)) continue;
		if (code === 61) {
			padding++;
			continue;
		}
		if (!isBase64Char(code) || padding > 0) {
			invalid = true;
			continue;
		}
		significant++;
	}
	if (invalid || padding > 2 || padding > 0 && (significant + padding) % 4 !== 0 || significant % 4 === 1) return estimateBase64BufferAllocation(body);
	return base64Bytes(significant);
};
var estimateDataURLBytes = (url, estimateBase64) => {
	if (!url || typeof url !== "string") return 0;
	if (!url.startsWith("data:")) return 0;
	const comma = url.indexOf(",");
	if (comma < 0) return 0;
	const meta = url.slice(5, comma);
	const body = url.slice(comma + 1);
	if (/;base64/i.test(meta)) return estimateBase64(body);
	let bytes = 0;
	for (let i = 0, len = body.length; i < len; i++) {
		const c = body.charCodeAt(i);
		if (c === 37 && isPercentEncodedByte(body, i, len)) {
			bytes += 1;
			i += 2;
		} else if (c < 128) bytes += 1;
		else if (c < 2048) bytes += 2;
		else if (c >= 55296 && c <= 56319 && i + 1 < len) {
			const next = body.charCodeAt(i + 1);
			if (next >= 56320 && next <= 57343) {
				bytes += 4;
				i++;
			} else bytes += 3;
		} else bytes += 3;
	}
	return bytes;
};
/**
* Estimate the percent-decoded payload size used by Fetch data: URLs.
*
* @param {string} url
* @returns {number}
*/
function estimateDataURLDecodedBytes(url) {
	const fragmentIndex = typeof url === "string" ? url.indexOf("#") : -1;
	return estimateDataURLBytes(fragmentIndex === -1 ? url : url.slice(0, fragmentIndex), estimatePercentDecodedBase64Bytes);
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/env/data.js
var VERSION$1 = "1.19.0";
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/adapters/fetch.js
var DEFAULT_CHUNK_SIZE = 65536;
var { isFunction } = utils_default;
/**
* Encode a UTF-8 string to a Latin-1 byte string for use with btoa().
* This is a modern replacement for the deprecated unescape(encodeURIComponent(str)) pattern.
*
* @param {string} str The string to encode
*
* @returns {string} UTF-8 bytes as a Latin-1 string
*/
var encodeUTF8 = (str) => encodeURIComponent(str).replace(/%([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
var decodeURIComponentSafe = (value) => {
	if (!utils_default.isString(value)) return value;
	try {
		return decodeURIComponent(value);
	} catch (error) {
		return value;
	}
};
var test = (fn, ...args) => {
	try {
		return !!fn(...args);
	} catch (e) {
		return false;
	}
};
var maybeWithAuthCredentials = (url) => {
	const protocolIndex = url.indexOf("://");
	let urlToCheck = url;
	if (protocolIndex !== -1) urlToCheck = urlToCheck.slice(protocolIndex + 3);
	return urlToCheck.includes("@") || urlToCheck.includes(":");
};
var factory = (env) => {
	const globalObject = utils_default.global !== void 0 && utils_default.global !== null ? utils_default.global : globalThis;
	const { ReadableStream, TextEncoder } = globalObject;
	env = utils_default.merge.call({ skipUndefined: true }, {
		Request: globalObject.Request,
		Response: globalObject.Response
	}, env);
	const { fetch: envFetch, Request, Response } = env;
	const isFetchSupported = envFetch ? isFunction(envFetch) : typeof fetch === "function";
	const isRequestSupported = isFunction(Request);
	const isResponseSupported = isFunction(Response);
	if (!isFetchSupported) return false;
	const isReadableStreamSupported = isFetchSupported && isFunction(ReadableStream);
	const encodeText = isFetchSupported && (typeof TextEncoder === "function" ? ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) : async (str) => new Uint8Array(await new Request(str).arrayBuffer()));
	const supportsRequestStream = isRequestSupported && isReadableStreamSupported && test(() => {
		let duplexAccessed = false;
		const request = new Request(platform_default.origin, {
			body: new ReadableStream(),
			method: "POST",
			get duplex() {
				duplexAccessed = true;
				return "half";
			}
		});
		const hasContentType = request.headers.has("Content-Type");
		if (request.body != null) request.body.cancel();
		return duplexAccessed && !hasContentType;
	});
	const supportsResponseStream = isResponseSupported && isReadableStreamSupported && test(() => utils_default.isReadableStream(new Response("").body));
	const resolvers = { stream: supportsResponseStream && ((res) => res.body) };
	isFetchSupported && (() => {
		[
			"text",
			"arrayBuffer",
			"blob",
			"formData",
			"stream"
		].forEach((type) => {
			!resolvers[type] && (resolvers[type] = (res, config) => {
				let method = res && res[type];
				if (method) return method.call(res);
				throw new AxiosError$1(`Response type '${type}' is not supported`, AxiosError$1.ERR_NOT_SUPPORT, config);
			});
		});
	})();
	const getBodyLength = async (body) => {
		if (body == null) return 0;
		if (utils_default.isBlob(body)) return body.size;
		if (utils_default.isSpecCompliantForm(body)) return (await new Request(platform_default.origin, {
			method: "POST",
			body
		}).arrayBuffer()).byteLength;
		if (utils_default.isArrayBufferView(body) || utils_default.isArrayBuffer(body)) return body.byteLength;
		if (utils_default.isURLSearchParams(body)) body = body + "";
		if (utils_default.isString(body)) return (await encodeText(body)).byteLength;
	};
	const resolveBodyLength = async (headers, body) => {
		const length = utils_default.toFiniteNumber(headers.getContentLength());
		return length == null ? getBodyLength(body) : length;
	};
	return async (config) => {
		let { url, method, data, signal, cancelToken, timeout, onDownloadProgress, onUploadProgress, responseType, headers, withCredentials = "same-origin", fetchOptions, maxContentLength, maxBodyLength } = resolveConfig(config);
		const hasMaxContentLength = utils_default.isNumber(maxContentLength) && maxContentLength > -1;
		const hasMaxBodyLength = utils_default.isNumber(maxBodyLength) && maxBodyLength > -1;
		const own = (key) => utils_default.hasOwnProp(config, key) ? config[key] : void 0;
		let _fetch = envFetch || fetch;
		responseType = responseType ? (responseType + "").toLowerCase() : "text";
		let composedSignal = composeSignals([signal, cancelToken && cancelToken.toAbortSignal()], timeout);
		let request = null;
		const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
			composedSignal.unsubscribe();
		});
		let requestContentLength;
		let pendingBodyError = null;
		const maxBodyLengthError = () => new AxiosError$1("Request body larger than maxBodyLength limit", AxiosError$1.ERR_BAD_REQUEST, config, request);
		try {
			let auth = void 0;
			const configAuth = own("auth");
			if (configAuth) auth = {
				username: utils_default.getSafeProp(configAuth, "username") || "",
				password: utils_default.getSafeProp(configAuth, "password") || ""
			};
			if (maybeWithAuthCredentials(url)) {
				const parsedURL = new URL(url, platform_default.origin);
				if (!auth && (parsedURL.username || parsedURL.password)) auth = {
					username: decodeURIComponentSafe(parsedURL.username),
					password: decodeURIComponentSafe(parsedURL.password)
				};
				if (parsedURL.username || parsedURL.password) {
					parsedURL.username = "";
					parsedURL.password = "";
					url = parsedURL.href;
				}
			}
			if (auth) {
				headers.delete("authorization");
				headers.set("Authorization", "Basic " + btoa(encodeUTF8((auth.username || "") + ":" + (auth.password || ""))));
			}
			if (hasMaxContentLength && typeof url === "string" && url.startsWith("data:")) {
				if (estimateDataURLDecodedBytes(url) > maxContentLength) throw new AxiosError$1("maxContentLength size of " + maxContentLength + " exceeded", AxiosError$1.ERR_BAD_RESPONSE, config, request);
			}
			if (hasMaxBodyLength && method !== "get" && method !== "head") {
				const outboundLength = await getBodyLength(data);
				if (typeof outboundLength === "number" && isFinite(outboundLength)) {
					requestContentLength = outboundLength;
					if (outboundLength > maxBodyLength) throw maxBodyLengthError();
				}
			}
			const mustEnforceStreamBody = hasMaxBodyLength && (utils_default.isReadableStream(data) || utils_default.isStream(data));
			const trackRequestStream = (stream, onProgress, flush) => trackStream(stream, DEFAULT_CHUNK_SIZE, (loadedBytes) => {
				if (hasMaxBodyLength && loadedBytes > maxBodyLength) throw pendingBodyError = maxBodyLengthError();
				onProgress && onProgress(loadedBytes);
			}, flush);
			if (supportsRequestStream && method !== "get" && method !== "head" && (onUploadProgress || mustEnforceStreamBody)) {
				requestContentLength = requestContentLength == null ? await resolveBodyLength(headers, data) : requestContentLength;
				if (requestContentLength !== 0 || mustEnforceStreamBody) {
					let _request = new Request(url, {
						method: "POST",
						body: data,
						duplex: "half"
					});
					let contentTypeHeader;
					if (utils_default.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) headers.setContentType(contentTypeHeader);
					if (_request.body) {
						const [onProgress, flush] = onUploadProgress && progressEventDecorator(requestContentLength, progressEventReducer(asyncDecorator(onUploadProgress))) || [];
						data = trackRequestStream(_request.body, onProgress, flush);
					}
				}
			} else if (mustEnforceStreamBody && !isRequestSupported && isReadableStreamSupported && method !== "get" && method !== "head") data = trackRequestStream(data);
			else if (mustEnforceStreamBody && isRequestSupported && !supportsRequestStream && method !== "get" && method !== "head") throw new AxiosError$1("Stream request bodies are not supported by the current fetch implementation", AxiosError$1.ERR_NOT_SUPPORT, config, request);
			if (!utils_default.isString(withCredentials)) withCredentials = withCredentials ? "include" : "omit";
			const isCredentialsSupported = isRequestSupported && "credentials" in Request.prototype;
			if (utils_default.isFormData(data)) {
				const contentType = headers.getContentType();
				if (contentType && /^multipart\/form-data/i.test(contentType) && !/boundary=/i.test(contentType)) headers.delete("content-type");
			}
			headers.set("User-Agent", "axios/" + VERSION$1, false);
			const resolvedOptions = {
				...fetchOptions,
				signal: composedSignal,
				method: method.toUpperCase(),
				headers: toByteStringHeaderObject(headers.normalize()),
				body: data,
				duplex: "half",
				credentials: isCredentialsSupported ? withCredentials : void 0
			};
			request = isRequestSupported && new Request(url, resolvedOptions);
			let response = await (isRequestSupported ? _fetch(request, fetchOptions) : _fetch(url, resolvedOptions));
			const responseHeaders = AxiosHeaders$1.from(response.headers);
			if (hasMaxContentLength) {
				const declaredLength = utils_default.toFiniteNumber(responseHeaders.getContentLength());
				if (declaredLength != null && declaredLength > maxContentLength) throw new AxiosError$1("maxContentLength size of " + maxContentLength + " exceeded", AxiosError$1.ERR_BAD_RESPONSE, config, request);
			}
			const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
			if (supportsResponseStream && response.body && (onDownloadProgress || hasMaxContentLength || isStreamResponse && unsubscribe)) {
				const options = {};
				[
					"status",
					"statusText",
					"headers"
				].forEach((prop) => {
					options[prop] = response[prop];
				});
				const responseContentLength = utils_default.toFiniteNumber(responseHeaders.getContentLength());
				const [onProgress, flush] = onDownloadProgress && progressEventDecorator(responseContentLength, progressEventReducer(asyncDecorator(onDownloadProgress), true)) || [];
				let bytesRead = 0;
				const onChunkProgress = (loadedBytes) => {
					if (hasMaxContentLength) {
						bytesRead = loadedBytes;
						if (bytesRead > maxContentLength) throw new AxiosError$1("maxContentLength size of " + maxContentLength + " exceeded", AxiosError$1.ERR_BAD_RESPONSE, config, request);
					}
					onProgress && onProgress(loadedBytes);
				};
				response = new Response(trackStream(response.body, DEFAULT_CHUNK_SIZE, onChunkProgress, () => {
					flush && flush();
					unsubscribe && unsubscribe();
				}), options);
			}
			responseType = responseType || "text";
			let responseData = await resolvers[utils_default.findKey(resolvers, responseType) || "text"](response, config);
			if (hasMaxContentLength && !supportsResponseStream && !isStreamResponse) {
				let materializedSize;
				if (responseData != null) {
					if (typeof responseData.byteLength === "number") materializedSize = responseData.byteLength;
					else if (typeof responseData.size === "number") materializedSize = responseData.size;
					else if (typeof responseData === "string") materializedSize = typeof TextEncoder === "function" ? new TextEncoder().encode(responseData).byteLength : responseData.length;
				}
				if (typeof materializedSize === "number" && materializedSize > maxContentLength) throw new AxiosError$1("maxContentLength size of " + maxContentLength + " exceeded", AxiosError$1.ERR_BAD_RESPONSE, config, request);
			}
			!isStreamResponse && unsubscribe && unsubscribe();
			return await new Promise((resolve, reject) => {
				settle(resolve, reject, {
					data: responseData,
					headers: AxiosHeaders$1.from(response.headers),
					status: response.status,
					statusText: response.statusText,
					config,
					request
				});
			});
		} catch (err) {
			unsubscribe && unsubscribe();
			if (composedSignal && composedSignal.aborted && composedSignal.reason instanceof AxiosError$1) {
				const canceledError = composedSignal.reason;
				canceledError.config = config;
				request && (canceledError.request = request);
				if (err !== canceledError) Object.defineProperty(canceledError, "cause", {
					__proto__: null,
					value: err,
					writable: true,
					enumerable: false,
					configurable: true
				});
				throw canceledError;
			}
			if (pendingBodyError) {
				request && !pendingBodyError.request && (pendingBodyError.request = request);
				throw pendingBodyError;
			}
			if (err instanceof AxiosError$1) {
				request && !err.request && (err.request = request);
				throw err;
			}
			if (err && err.name === "TypeError" && /Load failed|fetch/i.test(err.message)) {
				const networkError = new AxiosError$1("Network Error", AxiosError$1.ERR_NETWORK, config, request, err && err.response);
				Object.defineProperty(networkError, "cause", {
					__proto__: null,
					value: err.cause || err,
					writable: true,
					enumerable: false,
					configurable: true
				});
				throw networkError;
			}
			throw AxiosError$1.from(err, err && err.code, config, request, err && err.response);
		}
	};
};
var seedCache = /* @__PURE__ */ new Map();
var getFetch = (config) => {
	let env = config && config.env || {};
	const { fetch, Request, Response } = env;
	const seeds = [
		Request,
		Response,
		fetch
	];
	let i = seeds.length, seed, target, map = seedCache;
	while (i--) {
		seed = seeds[i];
		target = map.get(seed);
		target === void 0 && map.set(seed, target = i ? /* @__PURE__ */ new Map() : factory(env));
		map = target;
	}
	return target;
};
getFetch();
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/adapters/adapters.js
/**
* Known adapters mapping.
* Provides environment-specific adapters for Axios:
* - `http` for Node.js
* - `xhr` for browsers
* - `fetch` for fetch API-based requests
*
* @type {Object<string, Function|Object>}
*/
var knownAdapters = {
	http: null,
	xhr: xhr_default,
	fetch: { get: getFetch }
};
utils_default.forEach(knownAdapters, (fn, value) => {
	if (fn) {
		try {
			Object.defineProperty(fn, "name", {
				__proto__: null,
				value
			});
		} catch (e) {}
		Object.defineProperty(fn, "adapterName", {
			__proto__: null,
			value
		});
	}
});
/**
* Render a rejection reason string for unknown or unsupported adapters
*
* @param {string} reason
* @returns {string}
*/
var renderReason = (reason) => `- ${reason}`;
/**
* Check if the adapter is resolved (function, null, or false)
*
* @param {Function|null|false} adapter
* @returns {boolean}
*/
var isResolvedHandle = (adapter) => utils_default.isFunction(adapter) || adapter === null || adapter === false;
/**
* Get the first suitable adapter from the provided list.
* Tries each adapter in order until a supported one is found.
* Throws an AxiosError if no adapter is suitable.
*
* @param {Array<string|Function>|string|Function} adapters - Adapter(s) by name or function.
* @param {Object} config - Axios request configuration
* @throws {AxiosError} If no suitable adapter is available
* @returns {Function} The resolved adapter function
*/
function getAdapter$1(adapters, config) {
	adapters = utils_default.isArray(adapters) ? adapters : [adapters];
	const { length } = adapters;
	let nameOrAdapter;
	let adapter;
	const rejectedReasons = {};
	for (let i = 0; i < length; i++) {
		nameOrAdapter = adapters[i];
		let id;
		adapter = nameOrAdapter;
		if (!isResolvedHandle(nameOrAdapter)) {
			adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
			if (adapter === void 0) throw new AxiosError$1(`Unknown adapter '${id}'`);
		}
		if (adapter && (utils_default.isFunction(adapter) || (adapter = adapter.get(config)))) break;
		rejectedReasons[id || "#" + i] = adapter;
	}
	if (!adapter) {
		const reasons = Object.entries(rejectedReasons).map(([id, state]) => `adapter ${id} ` + (state === false ? "is not supported by the environment" : "is not available in the build"));
		throw new AxiosError$1(`There is no suitable adapter to dispatch the request ` + (length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified"), AxiosError$1.ERR_NOT_SUPPORT);
	}
	return adapter;
}
/**
* Exports Axios adapters and utility to resolve an adapter
*/
var adapters_default = {
	/**
	* Resolve an adapter from a list of adapter names or functions.
	* @type {Function}
	*/
	getAdapter: getAdapter$1,
	/**
	* Exposes all known adapters
	* @type {Object<string, Function|Object>}
	*/
	adapters: knownAdapters
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/core/dispatchRequest.js
/**
* Throws a `CanceledError` if cancellation has been requested.
*
* @param {Object} config The config that is to be used for the request
*
* @returns {void}
*/
function throwIfCancellationRequested(config) {
	if (config.cancelToken) config.cancelToken.throwIfRequested();
	if (config.signal && config.signal.aborted) throw new CanceledError$1(null, config);
}
/**
* Dispatch a request to the server using the configured adapter.
*
* @param {object} config The config that is to be used for the request
*
* @returns {Promise} The Promise to be fulfilled
*/
function dispatchRequest(config) {
	throwIfCancellationRequested(config);
	config.headers = AxiosHeaders$1.from(config.headers);
	config.data = transformData.call(config, config.transformRequest);
	if ([
		"post",
		"put",
		"patch"
	].indexOf(config.method) !== -1) config.headers.setContentType("application/x-www-form-urlencoded", false);
	return adapters_default.getAdapter(config.adapter || defaults.adapter, config)(config).then(function onAdapterResolution(response) {
		throwIfCancellationRequested(config);
		config.response = response;
		try {
			response.data = transformData.call(config, config.transformResponse, response);
		} finally {
			delete config.response;
		}
		response.headers = AxiosHeaders$1.from(response.headers);
		return response;
	}, function onAdapterRejection(reason) {
		if (!isCancel$1(reason)) {
			throwIfCancellationRequested(config);
			if (reason && reason.response) {
				config.response = reason.response;
				try {
					reason.response.data = transformData.call(config, config.transformResponse, reason.response);
				} finally {
					delete config.response;
				}
				reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
			}
		}
		return Promise.reject(reason);
	});
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/validator.js
var validators$1 = {};
[
	"object",
	"boolean",
	"number",
	"function",
	"string",
	"symbol"
].forEach((type, i) => {
	validators$1[type] = function validator(thing) {
		return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
	};
});
var deprecatedWarnings = {};
/**
* Transitional option validator
*
* @param {function|boolean?} validator - set to false if the transitional option has been removed
* @param {string?} version - deprecated version / removed since version
* @param {string?} message - some message with additional info
*
* @returns {function}
*/
validators$1.transitional = function transitional(validator, version, message) {
	function formatMessage(opt, desc) {
		return "[Axios v" + VERSION$1 + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
	}
	return (value, opt, opts) => {
		if (validator === false) throw new AxiosError$1(formatMessage(opt, " has been removed" + (version ? " in " + version : "")), AxiosError$1.ERR_DEPRECATED);
		if (version && !deprecatedWarnings[opt]) {
			deprecatedWarnings[opt] = true;
			console.warn(formatMessage(opt, " has been deprecated since v" + version + " and will be removed in the near future"));
		}
		return validator ? validator(value, opt, opts) : true;
	};
};
validators$1.spelling = function spelling(correctSpelling) {
	return (value, opt) => {
		console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
		return true;
	};
};
/**
* Assert object's properties type
*
* @param {object} options
* @param {object} schema
* @param {boolean?} allowUnknown
*
* @returns {object}
*/
function assertOptions(options, schema, allowUnknown) {
	if (typeof options !== "object" || options === null) throw new AxiosError$1("options must be an object", AxiosError$1.ERR_BAD_OPTION_VALUE);
	const keys = Object.keys(options);
	let i = keys.length;
	while (i-- > 0) {
		const opt = keys[i];
		const validator = Object.prototype.hasOwnProperty.call(schema, opt) ? schema[opt] : void 0;
		if (validator) {
			const value = options[opt];
			const result = value === void 0 || validator(value, opt, options);
			if (result !== true) throw new AxiosError$1("option " + opt + " must be " + result, AxiosError$1.ERR_BAD_OPTION_VALUE);
			continue;
		}
		if (allowUnknown !== true) throw new AxiosError$1("Unknown option " + opt, AxiosError$1.ERR_BAD_OPTION);
	}
}
var validator_default = {
	assertOptions,
	validators: validators$1
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/core/Axios.js
var validators = validator_default.validators;
/**
* Create a new instance of Axios
*
* @param {Object} instanceConfig The default config for the instance
*
* @return {Axios} A new instance of Axios
*/
var Axios$1 = class {
	constructor(instanceConfig) {
		this.defaults = instanceConfig || {};
		this.interceptors = {
			request: new InterceptorManager(),
			response: new InterceptorManager()
		};
	}
	/**
	* Dispatch a request
	*
	* @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
	* @param {?Object} config
	*
	* @returns {Promise} The Promise to be fulfilled
	*/
	async request(configOrUrl, config) {
		try {
			return await this._request(configOrUrl, config);
		} catch (err) {
			if (err instanceof Error) {
				let dummy = {};
				Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = /* @__PURE__ */ new Error();
				const stack = (() => {
					if (!dummy.stack) return "";
					const firstNewlineIndex = dummy.stack.indexOf("\n");
					return firstNewlineIndex === -1 ? "" : dummy.stack.slice(firstNewlineIndex + 1);
				})();
				try {
					if (!err.stack) err.stack = stack;
					else if (stack) {
						const firstNewlineIndex = stack.indexOf("\n");
						const secondNewlineIndex = firstNewlineIndex === -1 ? -1 : stack.indexOf("\n", firstNewlineIndex + 1);
						const stackWithoutTwoTopLines = secondNewlineIndex === -1 ? "" : stack.slice(secondNewlineIndex + 1);
						if (!String(err.stack).endsWith(stackWithoutTwoTopLines)) err.stack += "\n" + stack;
					}
				} catch (e) {}
			}
			throw err;
		}
	}
	_request(configOrUrl, config) {
		if (typeof configOrUrl === "string") {
			config = config || {};
			config.url = configOrUrl;
		} else config = configOrUrl || {};
		config = mergeConfig$1(this.defaults, config);
		const { transitional, paramsSerializer, headers } = config;
		if (transitional !== void 0) validator_default.assertOptions(transitional, {
			silentJSONParsing: validators.transitional(validators.boolean),
			forcedJSONParsing: validators.transitional(validators.boolean),
			clarifyTimeoutError: validators.transitional(validators.boolean),
			legacyInterceptorReqResOrdering: validators.transitional(validators.boolean),
			advertiseZstdAcceptEncoding: validators.transitional(validators.boolean),
			validateStatusUndefinedResolves: validators.transitional(validators.boolean)
		}, false);
		if (paramsSerializer != null) if (utils_default.isFunction(paramsSerializer)) config.paramsSerializer = { serialize: paramsSerializer };
		else validator_default.assertOptions(paramsSerializer, {
			encode: validators.function,
			serialize: validators.function
		}, true);
		if (config.allowAbsoluteUrls !== void 0) {} else if (this.defaults.allowAbsoluteUrls !== void 0) config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
		else config.allowAbsoluteUrls = true;
		validator_default.assertOptions(config, {
			baseUrl: validators.spelling("baseURL"),
			withXsrfToken: validators.spelling("withXSRFToken")
		}, true);
		config.method = (config.method || this.defaults.method || "get").toLowerCase();
		let contextHeaders = headers && utils_default.merge(headers.common, headers[config.method]);
		headers && utils_default.forEach([
			"delete",
			"get",
			"head",
			"post",
			"put",
			"patch",
			"query",
			"common"
		], (method) => {
			delete headers[method];
		});
		config.headers = AxiosHeaders$1.concat(contextHeaders, headers);
		const requestInterceptorChain = [];
		let synchronousRequestInterceptors = true;
		this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
			if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config) === false) return;
			synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
			const transitional = config.transitional || transitional_default;
			if (transitional && transitional.legacyInterceptorReqResOrdering) requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
			else requestInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
		});
		const responseInterceptorChain = [];
		this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
			responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
		});
		let promise;
		let i = 0;
		let len;
		if (!synchronousRequestInterceptors) {
			const chain = [dispatchRequest.bind(this), void 0];
			chain.unshift(...requestInterceptorChain);
			chain.push(...responseInterceptorChain);
			len = chain.length;
			promise = Promise.resolve(config);
			while (i < len) promise = promise.then(chain[i++], chain[i++]);
			return promise;
		}
		len = requestInterceptorChain.length;
		let newConfig = config;
		while (i < len) {
			const onFulfilled = requestInterceptorChain[i++];
			const onRejected = requestInterceptorChain[i++];
			try {
				newConfig = onFulfilled ? onFulfilled(newConfig) : newConfig;
			} catch (error) {
				if (!onRejected) {
					promise = Promise.reject(error);
					break;
				}
				try {
					const rejectedResult = onRejected.call(this, error);
					if (utils_default.isThenable(rejectedResult)) promise = Promise.resolve(rejectedResult).then(() => dispatchRequest.call(this, newConfig));
				} catch (rejectedError) {
					promise = Promise.reject(rejectedError);
				}
				break;
			}
		}
		if (!promise) try {
			promise = dispatchRequest.call(this, newConfig);
		} catch (error) {
			promise = Promise.reject(error);
		}
		i = 0;
		len = responseInterceptorChain.length;
		while (i < len) promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
		return promise;
	}
	getUri(config) {
		config = mergeConfig$1(this.defaults, config);
		return buildURL(buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls, config), config.params, config.paramsSerializer);
	}
};
utils_default.forEach([
	"delete",
	"get",
	"head",
	"options"
], function forEachMethodNoData(method) {
	Axios$1.prototype[method] = function(url, config) {
		return this.request(mergeConfig$1(config || {}, {
			method,
			url,
			data: config && utils_default.hasOwnProp(config, "data") ? config.data : void 0
		}));
	};
});
utils_default.forEach([
	"post",
	"put",
	"patch",
	"query"
], function forEachMethodWithData(method) {
	function generateHTTPMethod(isForm) {
		return function httpMethod(url, data, config) {
			return this.request(mergeConfig$1(config || {}, {
				method,
				headers: isForm ? { "Content-Type": "multipart/form-data" } : {},
				url,
				data
			}));
		};
	}
	Axios$1.prototype[method] = generateHTTPMethod();
	if (method !== "query") Axios$1.prototype[method + "Form"] = generateHTTPMethod(true);
});
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/cancel/CancelToken.js
/**
* A `CancelToken` is an object that can be used to request cancellation of an operation.
*
* @param {Function} executor The executor function.
*
* @returns {CancelToken}
*/
var CancelToken$1 = class CancelToken$1 {
	constructor(executor) {
		if (typeof executor !== "function") throw new TypeError("executor must be a function.");
		let resolvePromise;
		this.promise = new Promise(function promiseExecutor(resolve) {
			resolvePromise = resolve;
		});
		const token = this;
		this.promise.then((cancel) => {
			if (!token._listeners) return;
			let i = token._listeners.length;
			while (i-- > 0) token._listeners[i](cancel);
			token._listeners = null;
		});
		this.promise.then = (onfulfilled) => {
			let _resolve;
			const promise = new Promise((resolve) => {
				token.subscribe(resolve);
				_resolve = resolve;
			}).then(onfulfilled);
			promise.cancel = function reject() {
				token.unsubscribe(_resolve);
			};
			return promise;
		};
		executor(function cancel(message, config, request) {
			if (token.reason) return;
			token.reason = new CanceledError$1(message, config, request);
			resolvePromise(token.reason);
		});
	}
	/**
	* Throws a `CanceledError` if cancellation has been requested.
	*/
	throwIfRequested() {
		if (this.reason) throw this.reason;
	}
	/**
	* Subscribe to the cancel signal
	*/
	subscribe(listener) {
		if (this.reason) {
			listener(this.reason);
			return;
		}
		if (this._listeners) this._listeners.push(listener);
		else this._listeners = [listener];
	}
	/**
	* Unsubscribe from the cancel signal
	*/
	unsubscribe(listener) {
		if (!this._listeners) return;
		const index = this._listeners.indexOf(listener);
		if (index !== -1) this._listeners.splice(index, 1);
	}
	toAbortSignal() {
		const controller = new AbortController();
		const abort = (err) => {
			controller.abort(err);
		};
		this.subscribe(abort);
		controller.signal.unsubscribe = () => this.unsubscribe(abort);
		return controller.signal;
	}
	/**
	* Returns an object that contains a new `CancelToken` and a function that, when called,
	* cancels the `CancelToken`.
	*/
	static source() {
		let cancel;
		return {
			token: new CancelToken$1(function executor(c) {
				cancel = c;
			}),
			cancel
		};
	}
};
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/spread.js
/**
* Syntactic sugar for invoking a function and expanding an array for arguments.
*
* Common use case would be to use `Function.prototype.apply`.
*
*  ```js
*  function f(x, y, z) {}
*  const args = [1, 2, 3];
*  f.apply(null, args);
*  ```
*
* With `spread` this example can be re-written.
*
*  ```js
*  spread(function(x, y, z) {})([1, 2, 3]);
*  ```
*
* @param {Function} callback
*
* @returns {Function}
*/
function spread$1(callback) {
	return function wrap(arr) {
		return callback.apply(null, arr);
	};
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/isAxiosError.js
/**
* Determines whether the payload is an error thrown by Axios
*
* @param {*} payload The value to test
*
* @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
*/
function isAxiosError$1(payload) {
	return utils_default.isObject(payload) && payload.isAxiosError === true;
}
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/helpers/HttpStatusCode.js
var HttpStatusCode$1 = {
	Continue: 100,
	SwitchingProtocols: 101,
	Processing: 102,
	EarlyHints: 103,
	Ok: 200,
	Created: 201,
	Accepted: 202,
	NonAuthoritativeInformation: 203,
	NoContent: 204,
	ResetContent: 205,
	PartialContent: 206,
	MultiStatus: 207,
	AlreadyReported: 208,
	ImUsed: 226,
	MultipleChoices: 300,
	MovedPermanently: 301,
	Found: 302,
	SeeOther: 303,
	NotModified: 304,
	UseProxy: 305,
	Unused: 306,
	TemporaryRedirect: 307,
	PermanentRedirect: 308,
	BadRequest: 400,
	Unauthorized: 401,
	PaymentRequired: 402,
	Forbidden: 403,
	NotFound: 404,
	MethodNotAllowed: 405,
	NotAcceptable: 406,
	ProxyAuthenticationRequired: 407,
	RequestTimeout: 408,
	Conflict: 409,
	Gone: 410,
	LengthRequired: 411,
	PreconditionFailed: 412,
	PayloadTooLarge: 413,
	UriTooLong: 414,
	UnsupportedMediaType: 415,
	RangeNotSatisfiable: 416,
	ExpectationFailed: 417,
	ImATeapot: 418,
	MisdirectedRequest: 421,
	UnprocessableEntity: 422,
	Locked: 423,
	FailedDependency: 424,
	TooEarly: 425,
	UpgradeRequired: 426,
	PreconditionRequired: 428,
	TooManyRequests: 429,
	RequestHeaderFieldsTooLarge: 431,
	UnavailableForLegalReasons: 451,
	InternalServerError: 500,
	NotImplemented: 501,
	BadGateway: 502,
	ServiceUnavailable: 503,
	GatewayTimeout: 504,
	HttpVersionNotSupported: 505,
	VariantAlsoNegotiates: 506,
	InsufficientStorage: 507,
	LoopDetected: 508,
	NotExtended: 510,
	NetworkAuthenticationRequired: 511,
	WebServerReturnsAnUnknownError: 520,
	WebServerIsDown: 521,
	ConnectionTimedOut: 522,
	OriginIsUnreachable: 523,
	TimeoutOccurred: 524,
	SslHandshakeFailed: 525,
	InvalidSslCertificate: 526
};
Object.entries(HttpStatusCode$1).forEach(([key, value]) => {
	HttpStatusCode$1[value] = key;
});
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/lib/axios.js
/**
* Create an instance of Axios
*
* @param {Object} defaultConfig The default config for the instance
*
* @returns {Axios} A new instance of Axios
*/
function createInstance(defaultConfig) {
	const context = new Axios$1(defaultConfig);
	const instance = bind(Axios$1.prototype.request, context);
	utils_default.extend(instance, Axios$1.prototype, context, { allOwnKeys: true });
	utils_default.extend(instance, context, null, { allOwnKeys: true });
	instance.create = function create(instanceConfig) {
		return createInstance(mergeConfig$1(defaultConfig, instanceConfig));
	};
	return instance;
}
var axios = createInstance(defaults);
axios.Axios = Axios$1;
axios.CanceledError = CanceledError$1;
axios.CancelToken = CancelToken$1;
axios.isCancel = isCancel$1;
axios.VERSION = VERSION$1;
axios.toFormData = toFormData$1;
axios.AxiosError = AxiosError$1;
axios.Cancel = axios.CanceledError;
axios.all = function all(promises) {
	return Promise.all(promises);
};
axios.spread = spread$1;
axios.isAxiosError = isAxiosError$1;
axios.mergeConfig = mergeConfig$1;
axios.AxiosHeaders = AxiosHeaders$1;
axios.formToJSON = (thing) => formDataToJSON(utils_default.isHTMLForm(thing) ? new FormData(thing) : thing);
axios.getAdapter = adapters_default.getAdapter;
axios.HttpStatusCode = HttpStatusCode$1;
axios.default = axios;
//#endregion
//#region ../../node_modules/.pnpm/axios@1.19.0/node_modules/axios/index.js
var { Axios, AxiosError, CanceledError, isCancel, CancelToken, VERSION, all, Cancel, isAxiosError, spread, toFormData, AxiosHeaders, HttpStatusCode, formToJSON, getAdapter, mergeConfig, create } = axios;
//#endregion
//#region ../../node_modules/.pnpm/@microsoft+fetch-event-source@2.0.1/node_modules/@microsoft/fetch-event-source/lib/esm/parse.js
async function getBytes(stream, onChunk) {
	const reader = stream.getReader();
	let result;
	while (!(result = await reader.read()).done) onChunk(result.value);
}
function getLines(onLine) {
	let buffer;
	let position;
	let fieldLength;
	let discardTrailingNewline = false;
	return function onChunk(arr) {
		if (buffer === void 0) {
			buffer = arr;
			position = 0;
			fieldLength = -1;
		} else buffer = concat(buffer, arr);
		const bufLength = buffer.length;
		let lineStart = 0;
		while (position < bufLength) {
			if (discardTrailingNewline) {
				if (buffer[position] === 10) lineStart = ++position;
				discardTrailingNewline = false;
			}
			let lineEnd = -1;
			for (; position < bufLength && lineEnd === -1; ++position) switch (buffer[position]) {
				case 58:
					if (fieldLength === -1) fieldLength = position - lineStart;
					break;
				case 13: discardTrailingNewline = true;
				case 10: lineEnd = position;
			}
			if (lineEnd === -1) break;
			onLine(buffer.subarray(lineStart, lineEnd), fieldLength);
			lineStart = position;
			fieldLength = -1;
		}
		if (lineStart === bufLength) buffer = void 0;
		else if (lineStart !== 0) {
			buffer = buffer.subarray(lineStart);
			position -= lineStart;
		}
	};
}
function getMessages(onId, onRetry, onMessage) {
	let message = newMessage();
	const decoder = new TextDecoder();
	return function onLine(line, fieldLength) {
		if (line.length === 0) {
			onMessage === null || onMessage === void 0 || onMessage(message);
			message = newMessage();
		} else if (fieldLength > 0) {
			const field = decoder.decode(line.subarray(0, fieldLength));
			const valueOffset = fieldLength + (line[fieldLength + 1] === 32 ? 2 : 1);
			const value = decoder.decode(line.subarray(valueOffset));
			switch (field) {
				case "data":
					message.data = message.data ? message.data + "\n" + value : value;
					break;
				case "event":
					message.event = value;
					break;
				case "id":
					onId(message.id = value);
					break;
				case "retry":
					const retry = parseInt(value, 10);
					if (!isNaN(retry)) onRetry(message.retry = retry);
			}
		}
	};
}
function concat(a, b) {
	const res = new Uint8Array(a.length + b.length);
	res.set(a);
	res.set(b, a.length);
	return res;
}
function newMessage() {
	return {
		data: "",
		event: "",
		id: "",
		retry: void 0
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@microsoft+fetch-event-source@2.0.1/node_modules/@microsoft/fetch-event-source/lib/esm/fetch.js
var __rest = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var EventStreamContentType = "text/event-stream";
var DefaultRetryInterval = 1e3;
var LastEventId = "last-event-id";
function fetchEventSource(input, _a) {
	var { signal: inputSignal, headers: inputHeaders, onopen: inputOnOpen, onmessage, onclose, onerror, openWhenHidden, fetch: inputFetch } = _a, rest = __rest(_a, [
		"signal",
		"headers",
		"onopen",
		"onmessage",
		"onclose",
		"onerror",
		"openWhenHidden",
		"fetch"
	]);
	return new Promise((resolve, reject) => {
		const headers = Object.assign({}, inputHeaders);
		if (!headers.accept) headers.accept = EventStreamContentType;
		let curRequestController;
		function onVisibilityChange() {
			curRequestController.abort();
			if (!document.hidden) create();
		}
		if (!openWhenHidden) document.addEventListener("visibilitychange", onVisibilityChange);
		let retryInterval = DefaultRetryInterval;
		let retryTimer = 0;
		function dispose() {
			document.removeEventListener("visibilitychange", onVisibilityChange);
			window.clearTimeout(retryTimer);
			curRequestController.abort();
		}
		inputSignal === null || inputSignal === void 0 || inputSignal.addEventListener("abort", () => {
			dispose();
			resolve();
		});
		const fetch = inputFetch !== null && inputFetch !== void 0 ? inputFetch : window.fetch;
		const onopen = inputOnOpen !== null && inputOnOpen !== void 0 ? inputOnOpen : defaultOnOpen;
		async function create() {
			var _a;
			curRequestController = new AbortController();
			try {
				const response = await fetch(input, Object.assign(Object.assign({}, rest), {
					headers,
					signal: curRequestController.signal
				}));
				await onopen(response);
				await getBytes(response.body, getLines(getMessages((id) => {
					if (id) headers[LastEventId] = id;
					else delete headers[LastEventId];
				}, (retry) => {
					retryInterval = retry;
				}, onmessage)));
				onclose === null || onclose === void 0 || onclose();
				dispose();
				resolve();
			} catch (err) {
				if (!curRequestController.signal.aborted) try {
					const interval = (_a = onerror === null || onerror === void 0 ? void 0 : onerror(err)) !== null && _a !== void 0 ? _a : retryInterval;
					window.clearTimeout(retryTimer);
					retryTimer = window.setTimeout(create, interval);
				} catch (innerErr) {
					dispose();
					reject(innerErr);
				}
			}
		}
		create();
	});
}
function defaultOnOpen(response) {
	const contentType = response.headers.get("content-type");
	if (!(contentType === null || contentType === void 0 ? void 0 : contentType.startsWith("text/event-stream"))) throw new Error(`Expected content-type to be ${EventStreamContentType}, Actual: ${contentType}`);
}
//#endregion
//#region ../../packages/utils/src/modules/token.ts
/**
* token 统一读写（@repo/utils）
*
* accessToken / refreshToken / userInfo 都由框架写入框架 storage（StorageWrapper），
* 本模块复用框架 storage 读写，供 SSE、HTTP、TokenManager 等使用，不依赖 core。
*
* 同时提供用户级缓存读写（菜单 / 布局），采用 cache-aside 策略：
* 调用方先读缓存（getMenuCache / getLayoutCache），有就直接返回，
* 没有再请求接口并写回（setMenuCache / setLayoutCache）。登出 / 强制重登时
* 调用 clearAuthCache() 静默清除，避免跨账号串数据。
*/
/** 用户信息存储 key（与 core/permission 的 USER_INFO_KEY 保持一致） */
var USER_INFO_KEY = "userInfo";
/** 用户远程菜单缓存 key */
var MENU_CACHE_KEY = "menu";
/** 用户布局缓存 key */
var LAYOUT_CACHE_KEY = "layout";
/** 当前生效的 token storage（懒初始化，key 规则与写入方一致） */
var tokenStorage = null;
/**
* 解析当前登录 userId（未登录 / 解析失败 → "anonymous"）
*
* 与 config.getStorageKey 内部的 getCurrentUserId 实现一致，避免循环。
*/
function resolveUserId() {
	if (typeof window === "undefined") return "anonymous";
	try {
		const data = getUserInfo();
		if (!data) return "anonymous";
		const id = data?.userId ?? data?.sysUserId;
		if (id === void 0 || id === null || id === "") return "anonymous";
		return String(id);
	} catch {
		return "anonymous";
	}
}
/**
* 构建与写入方一致的框架 storage 实例
*
* 使用 config.storage 的前缀与 noPrefixKeys 规则。
* 加解密由 StorageWrapper 内部实时从 getConfig() 读取（见 storage.ts），
* 无需在 setConfig 后重建实例。
*/
function getTokenStorage() {
	if (tokenStorage) return tokenStorage;
	const cfg = getConfig();
	tokenStorage = createStorage(browserLocalStorage, {
		prefix: cfg.storage?.prefix || cfg.app?.systemCode || "system",
		noPrefixKeys: cfg.storage?.noPrefixKeys,
		userScopeKeys: cfg.storage?.userScopeKeys,
		resolveUserId
	});
	return tokenStorage;
}
/**
* 通用框架 storage（与 token / userInfo / 菜单写入方完全一致）
*
* 所有前端缓存读写都应使用本实例，禁止直接调用 localStorage：
* 前缀 / noPrefixKeys / userScopeKeys / 加解密均实时从 getConfig() 获取，
* 避免直接用 localStorage 造成加密、前缀、按账号隔离规则不统一。
*/
function getFrameworkStorage() {
	return getTokenStorage();
}
/** accessToken 存储 key */
function accessKey() {
	return getConfig().token?.accessTokenKey || "accessToken";
}
/** refreshToken 存储 key */
function refreshKey() {
	return getConfig().token?.refreshTokenKey || "refreshToken";
}
/**
* 代入令牌的 sessionStorage key。
*
* 刻意不走框架 storage（localStorage）：代入令牌是按标签页临时借用的身份，
* 而框架 storage 是全标签共享的，写进去会覆盖管理员自己标签页里的登录态 ——
* 管理员点一下「代入该学生」，自己的后台就在下一次请求时变成学生身份了。
* sessionStorage 天然按标签页隔离，正好承载这种「只在本页生效」的凭据。
*/
var IMPERSONATE_TOKEN_KEY = "__impersonateAccessToken__";
/**
* 读取代入令牌。
*
* @returns 本标签页的代入令牌；没有则返回空串
*/
function getImpersonateToken() {
	try {
		if (typeof window === "undefined") return "";
		return window.sessionStorage.getItem(IMPERSONATE_TOKEN_KEY) ?? "";
	} catch {
		return "";
	}
}
/** 清除本标签页的代入令牌（退出代入 / 完整登出时调用） */
function clearImpersonateToken() {
	try {
		if (typeof window === "undefined") return;
		window.sessionStorage.removeItem(IMPERSONATE_TOKEN_KEY);
	} catch {}
}
/**
* 获取当前 accessToken
*
* 从框架 storage 读取（key = tokenConfig.accessTokenKey，默认 "accessToken"）。
* 代入令牌优先：它只在本标签页存在，取到就说明本页正以被代入的身份工作。
*/
function getAccessToken() {
	try {
		if (typeof window === "undefined") return "";
		const impersonate = getImpersonateToken();
		if (impersonate) return impersonate;
		const token = getTokenStorage().get(accessKey()) ?? "";
		if (token) return token;
		return "";
	} catch {
		return "";
	}
}
/** 写入 accessToken（框架 storage） */
function setAccessToken(token) {
	try {
		if (typeof window === "undefined") return;
		getTokenStorage().set(accessKey(), token);
	} catch {}
}
/** 写入 refreshToken（框架 storage） */
function setRefreshToken(token) {
	try {
		if (typeof window === "undefined") return;
		getTokenStorage().set(refreshKey(), token);
	} catch {}
}
/**
* 获取用户信息（框架 storage，key = "userInfo"）
*/
function getUserInfo() {
	try {
		if (typeof window === "undefined") return null;
		return getTokenStorage().get(USER_INFO_KEY);
	} catch {
		return null;
	}
}
/** 写入用户信息（框架 storage，key = "userInfo"） */
function setUserInfo(userInfo) {
	try {
		if (typeof window === "undefined") return;
		getTokenStorage().set(USER_INFO_KEY, userInfo);
	} catch {}
}
/**
* 写布局缓存，**返回是否真的写成功**。
*
* <p>{@link setLayoutCache} 的签名是 void，内部 {@code catch { /* ignore *\/ }}
* 把 {@code StorageWrapper.set()} 的 boolean 丢掉了，调用方无法区分
* 「写成功」与「配额满 / 隐私模式 / 存储被禁用」。home 的布局保存原先就吃了
* 这个亏：写失败时界面照样提示「布局已保存」，用户刷新后布局全无，且无任何线索。
*
* <p>与 {@link setLayoutCache} 的区别仅在于把成功与否透出给调用方，
* 两者写入的键与编码规则完全一致（同一个 tokenStorage）。</p>
*
* @param layout 要缓存的布局
* @returns 写入是否成功
*/
function writeLayoutCache(layout) {
	try {
		if (typeof window === "undefined") return false;
		return getTokenStorage().set(LAYOUT_CACHE_KEY, layout);
	} catch {
		return false;
	}
}
/** 读取用户远程菜单缓存（按 userId 隔离，由 createStorage 内部 buildKey 自动注入） */
function getMenuCache() {
	try {
		if (typeof window === "undefined") return null;
		return getTokenStorage().get(MENU_CACHE_KEY);
	} catch {
		return null;
	}
}
/** 写入用户远程菜单缓存（拉取成功后调用） */
function setMenuCache(menu) {
	try {
		if (typeof window === "undefined") return;
		getTokenStorage().set(MENU_CACHE_KEY, menu);
	} catch {}
}
/** 读取用户布局缓存（按 userId 隔离） */
function getLayoutCache() {
	try {
		if (typeof window === "undefined") return null;
		return getTokenStorage().get(LAYOUT_CACHE_KEY);
	} catch {
		return null;
	}
}
/** 写入用户布局缓存（拉取成功后调用） */
function setLayoutCache(layout) {
	try {
		if (typeof window === "undefined") return;
		getTokenStorage().set(LAYOUT_CACHE_KEY, layout);
	} catch {}
}
/** 静默清除用户级缓存（登出 / 强制重登 / 切换账号时调用） */
function clearAuthCache() {
	try {
		if (typeof window === "undefined") return;
		const storage = getTokenStorage();
		storage.remove(MENU_CACHE_KEY);
		storage.remove(LAYOUT_CACHE_KEY);
	} catch {}
}
/** 清除令牌（accessToken / refreshToken / userInfo 全部移除） */
function clearAuthToken() {
	try {
		if (typeof window === "undefined") return;
		clearImpersonateToken();
		const storage = getTokenStorage();
		storage.remove(accessKey());
		storage.remove(refreshKey());
		storage.remove(USER_INFO_KEY);
		storage.remove(CACHE_PREFIX + "user");
	} catch {}
}
/** 完整登出清理：令牌 + 菜单缓存 + 布局缓存 */
function clearAllAuthData() {
	clearAuthToken();
	clearAuthCache();
}
/**
* 刷新清理：清菜单 / 布局 / 用户信息缓存，但保留 accessToken / refreshToken
*
* 供「路由缓存刷新」等场景调用：清空本地缓存后 reload，让守卫重新拉取远程菜单、
* 布局设置与用户信息，而无需重新登录。
*/
function clearAuthCacheKeepToken() {
	try {
		if (typeof window === "undefined") return;
		const storage = getTokenStorage();
		storage.remove(MENU_CACHE_KEY);
		storage.remove(LAYOUT_CACHE_KEY);
		storage.remove(USER_INFO_KEY);
	} catch {}
}
//#endregion
//#region ../../packages/utils/src/sse/client.ts
/**
* 创建 SSE 客户端
*
* 基于 @microsoft/fetch-event-source，封装为客户端。
* 支持自动重连、自动解析 JSON data。
*   const client = createSseClient('/api/chat/stream', { onMessage: (e) => console.log(e.data) })
*   client.close()
*/
/**
* 为相对路径补齐统一 API 前缀（与 http.ts 的 baseUrl 策略一致），
* 绝对地址（http(s):// 或 //）原样返回。
*/
function resolveSseUrl(url) {
	const u = (url ?? "").trim();
	if (!u || /^([a-z][a-z0-9+.-]*:)?\/\//i.test(u)) return u;
	const base = getConfig().http.baseUrl ?? "";
	if (!base) return u;
	return `${base.replace(/\/+$/, "")}/${u.replace(/^\/+/, "")}`;
}
/** 默认 JSON 解析 */
var defaultParse = (raw) => {
	if (raw === "" || raw === "[DONE]") return raw;
	try {
		return JSON.parse(raw);
	} catch {
		return raw;
	}
};
/** 将鉴权 token 拼入 URL query（与 socket 的 x-oauth-token 约定一致） */
function injectAuthQuery(url, token) {
	if (!token) return url;
	try {
		const parsed = new URL(url, typeof window !== "undefined" ? window.location.href : void 0);
		parsed.searchParams.set("x-oauth-token", token);
		return parsed.toString();
	} catch {
		return url;
	}
}
function createSseClient(url, options = {}) {
	const { method = "POST", headers = {}, body, credentials = "include", auth = true, reconnect = true, maxReconnectAttempts = 5, reconnectInterval = 2e3, parseData = defaultParse, onMessage, onOpen, onError, onClose } = options;
	const controller = new AbortController();
	let attempts = 0;
	let closed = false;
	/** 组装请求头：auth 开启时自动注入 Authorization: Bearer <token> */
	const buildHeaders = () => {
		const result = {
			"Content-Type": "application/json",
			Accept: "text/event-stream",
			...headers
		};
		if (auth) {
			const token = typeof auth === "string" ? auth : getAccessToken();
			if (token) result.Authorization = `Bearer ${token}`;
		}
		return result;
	};
	const start = () => {
		if (closed) return;
		const authToken = auth ? typeof auth === "string" ? auth : getAccessToken() : "";
		fetchEventSource(injectAuthQuery(resolveSseUrl(url), authToken), {
			method,
			headers: buildHeaders(),
			credentials,
			body: body !== void 0 ? JSON.stringify(body) : void 0,
			signal: controller.signal,
			openWhenHidden: true,
			onopen: async (response) => {
				if (response.ok && response.headers.get("content-type")?.includes("text/event-stream")) {
					attempts = 0;
					onOpen?.();
					return;
				}
				if (response.status === 401 || response.status === 403) {
					onError?.(/* @__PURE__ */ new Error(`SSE 鉴权失败: ${response.status}`));
					closed = true;
					controller.abort();
					return;
				}
				throw new Error(`SSE 连接失败: ${response.status}`);
			},
			onmessage: (msg) => {
				if (msg.data === void 0 || msg.data === null || msg.data === "") return;
				const data = parseData(msg.data);
				onMessage?.({
					event: msg.event || "message",
					data,
					id: msg.id,
					retry: msg.retry
				});
			},
			onerror: (err) => {
				onError?.(err);
				attempts++;
				if (attempts > maxReconnectAttempts || !reconnect) throw err;
				return new Promise((resolve) => {
					setTimeout(resolve, reconnectInterval);
				});
			},
			onclose: () => {
				onClose?.();
			}
		}).catch((err) => {
			onError?.(err);
		});
	};
	start();
	return { close: () => {
		closed = true;
		controller.abort();
	} };
}
//#endregion
//#region ../../packages/utils/src/sse/openai.ts
/**
* OpenAI 协议 SSE 客户端
*
* 适配 OpenAI /v1/chat/completions 的流式响应格式。
* 兼容后端 AI 服务的 OpenAI 协议实现。
*   const client = createOpenAiSseClient('/v1/chat/completions', { onChunk: (chunk) => {...} })
*/
/**
* OpenAI SSE 解析：data: {...} 与结束标记 [DONE]
*/
var openAiParseData = (raw) => {
	if (!raw || raw === "[DONE]") return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
};
function createOpenAiSseClient(url, options = {}) {
	let fullContent = "";
	let started = false;
	return createSseClient(url, {
		...options,
		parseData: openAiParseData,
		onOpen: () => {
			started = true;
			options.onStart?.();
			options.onOpen?.();
		},
		onMessage: (event) => {
			const chunk = event.data;
			if (!chunk) {
				options.onEnd?.(fullContent);
				return;
			}
			const choice = chunk.choices?.[0];
			const content = choice?.delta?.content;
			if (content) fullContent += content;
			if (started) options.onChunk?.(chunk, JSON.stringify(chunk));
			if (choice?.finish_reason === "stop") options.onEnd?.(fullContent);
		}
	});
}
//#endregion
//#region ../../packages/utils/src/sse/spring-ai.ts
/**
* 针对后端 Spring AI 服务的 SSE 客户端
*
* 适配 Spring AI 的 MediaType.APPLICATION_NDJSON_VALUE / TEXT_EVENT_STREAM_VALUE
* 支持 ChatClient 流式响应。
*   const client = createSpringAiSseClient('/api/chat', { onChunk: (chunk) => {...} })
*/
function createSpringAiSseClient(url, options = {}) {
	let fullContent = "";
	let started = false;
	return createSseClient(url, {
		...options,
		onOpen: () => {
			started = true;
			options.onStart?.();
			options.onOpen?.();
		},
		onMessage: (event) => {
			const chunk = event.data;
			if (chunk?.done) {
				options.onEnd?.(fullContent);
				return;
			}
			if (chunk?.error) {
				options.onError?.(new Error(chunk.error));
				return;
			}
			if (chunk?.content) fullContent += chunk.content;
			if (started) options.onChunk?.(chunk, JSON.stringify(chunk));
		}
	});
}
//#endregion
//#region ../../packages/utils/src/http.ts
var defaultOptions = {
	useAppConfig: true,
	timeout: void 0
};
/**
* 第一方客户端标识 —— 字段一：承载请求头名
*
* <p>服务端「消息头拦截」默认会拦掉爬虫与自动化客户端的 User-Agent，特征清单里
* 也含 curl / axios / okhttp 这类通用 HTTP 客户端 —— 用 UA 根本分不出「脚本」与
* 「爬虫」。自家前端如果不做标识，会被自己刚上线的规则挡在门外。</p>
*
* <p>选 X-Trace-Id 是因为它本来就该出现在每个请求里（本系统的 MDC 链路追踪
* 就在读它），标记藏在取值末尾不显眼。</p>
*/
var FIRST_PARTY_HEADER_A = "X-Trace-Id";
/**
* 第一方客户端标识 —— 字段二：承载请求头名
*
* <p>X-Requested-With 是 AJAX 的事实标准头（jQuery / axios 都发这个），
* 一个不带它的请求本身就可疑，所以标记放在这里同样不显眼。</p>
*
* <p>服务端要求<b>两个字段同时</b>满足才豁免，只满足一个不算。</p>
*/
var FIRST_PARTY_HEADER_B = "X-Requested-With";
/**
* 第一方标记（两个字段的取值都要以它结尾）
*
* <p>刻意是个短小、无语义、看起来像随机后缀的串，而不是 "chua-console"
* 这种一眼看出用途的明文。</p>
*/
var FIRST_PARTY_MARKER = "-7f3a";
/**
* 造一个「看起来正常」的 X-Requested-With 取值
*
* @returns 形如 `XMLHttpRequest-7f3a` 的取值
*/
function firstPartyRequestedWith() {
	return `XMLHttpRequest${FIRST_PARTY_MARKER}`;
}
/**
* 造一个「看起来正常」的 X-Trace-Id 取值
*
* <p>32 位十六进制 + 标记，形态与真实链路追踪 id 一致，不引人注意。</p>
*
* @returns 形如 `3f2a9c1b8e7d4056a2c1b9f3e8d70561-7f3a` 的取值
*/
function firstPartyTraceId() {
	let hex = "";
	for (let i = 0; i < 32; i++) hex += Math.floor(Math.random() * 16).toString(16);
	return `${hex}${FIRST_PARTY_MARKER}`;
}
/**
* 第一方标识请求头
*
* <p><b>不是安全凭证</b>：两个头的取值都能伪造，凑齐即可整体绕过。
* 双字段只是把「要绕过就得同时注意到两处」的成本抬高一点。
* 不接受任何后门的部署，服务端把 first-party-enabled 关掉即可。</p>
*
* <p><b>刻意不写进 User-Agent</b>：浏览器不允许 JS 设置 User-Agent
* （Fetch 规范把它列为 forbidden header name，axios/XHR 写入会被静默丢弃），
* 写了也发不出去。</p>
*
* @returns 带两个标识字段的请求头
*/
function firstPartyHeaders() {
	return {
		[FIRST_PARTY_HEADER_A]: firstPartyTraceId(),
		[FIRST_PARTY_HEADER_B]: firstPartyRequestedWith()
	};
}
/**
* 模块级默认 axios 实例（拦截器所在）。
*
* 业务侧统一 `import { http } from "@repo/utils"` 使用本模块的 http()，
* 但无参 http() 创建新 Http 时默认挂到全局 axios 上，会丢失 createApp
* 注入的加密/签名/401/loading 拦截器。createApp 构建 HTTP 客户端后会调用
* {@link setDefaultHttpInstance} 把带拦截器的实例回写到这里，
* 使业务侧 http() 复用同一请求管线。
*/
var defaultInstance = axios;
/** 注入全局默认 axios 实例（createApp 构建 HTTP 客户端后调用） */
function setDefaultHttpInstance(instance) {
	defaultInstance = instance ?? axios;
}
/**
* 标准化 URL：拼接 baseUrl 与相对路径，并统一处理斜杠。
*
* 规则：
* - url 已为绝对地址（http(s):// 或 //）时原样返回（不拼接 baseUrl）；
* - baseUrl 为空时原样返回 url（调用方传入的就是完整地址）；
* - 其余情况拼接 baseUrl + url，自动去除多余的斜杠。
*/
function normalizeUrl(baseUrl, url) {
	const u = (url ?? "").trim();
	if (!u) return u;
	if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(u)) return u;
	const b = (baseUrl ?? "").trim().replace(/\/+$/, "");
	if (!b) return u;
	return `${b}/${u.replace(/^\/+/, "")}`;
}
var RequestBuilder = class {
	config;
	instance;
	constructor(baseURL, method, url, defaults, instance) {
		this.instance = instance;
		this.config = {
			method,
			url: normalizeUrl(baseURL, url),
			timeout: defaults.timeout,
			headers: new AxiosHeaders(defaults.headers)
		};
	}
	query(params) {
		this.config.params = {
			...this.config.params,
			...params
		};
		return this;
	}
	headers(headers) {
		Object.assign(this.config.headers, headers);
		return this;
	}
	data(body) {
		this.config.data = body;
		return this;
	}
	responseType(type) {
		this.config.responseType = type;
		return this;
	}
	timeout(ms) {
		this.config.timeout = ms;
		return this;
	}
	loading(show) {
		this.config.hc = {
			...this.config.hc,
			showLoading: show
		};
		return this;
	}
	encrypt(on) {
		this.config.hc = {
			...this.config.hc,
			encrypt: on
		};
		return this;
	}
	codec(on) {
		this.config.hc = {
			...this.config.hc,
			codec: on
		};
		return this;
	}
	retry(on) {
		this.config.hc = {
			...this.config.hc,
			retry: on
		};
		return this;
	}
	noToast(on) {
		this.config.hc = {
			...this.config.hc,
			noToast: on
		};
		return this;
	}
	uploadProgress(handler) {
		this.config.onUploadProgress = handler;
		return this;
	}
	/**
	* 把当前链式请求转换为 SSE 客户端。
	*
	* 复用已设置的 method / url / headers / data / params，
	* 额外选项（onMessage、reconnect、auth、parseData 等）通过 sseOptions 覆盖。
	*
	* 注意：调用 sse() 后本构建器不再用于发起普通 HTTP 请求；
	*       若需要同时保留普通链式 + SSE 入口，请使用 `http.createSse()`。
	*
	* 典型用法：
	* ```ts
	* http.post('/api/chat').data({ prompt }).sse({
	*   onMessage: (e) => console.log(e.data),
	* });
	* ```
	*
	* @param sseOptions 额外的 SSE 客户端选项（method/headers/body 字段会被本构建器的值覆盖）
	* @returns SSE 客户端实例，调用 close() 终止连接
	*/
	sse(sseOptions = {}) {
		const finalUrl = (() => {
			const u = this.config.url ?? "";
			if (!this.config.params) return u;
			try {
				const parsed = new URL(u, typeof window !== "undefined" ? window.location.href : void 0);
				for (const [k, v] of Object.entries(this.config.params)) {
					if (v === void 0 || v === null) continue;
					parsed.searchParams.set(k, String(v));
				}
				return parsed.toString();
			} catch {
				return u;
			}
		})();
		const headers = {};
		const rawHeaders = this.config.headers;
		if (rawHeaders) {
			if (typeof rawHeaders.toJSON === "function") {
				for (const [k, v] of Object.entries(rawHeaders.toJSON())) if (typeof v === "string") headers[k] = v;
			} else for (const [k, v] of Object.entries(rawHeaders)) if (typeof v === "string") headers[k] = v;
		}
		return createSseClient(finalUrl, {
			...sseOptions,
			method: this.config.method === "GET" ? "GET" : "POST",
			headers,
			body: this.config.data
		});
	}
	execute() {
		return this.instance.request(this.config);
	}
	then(onfulfilled, onrejected) {
		return this.execute().then(onfulfilled, onrejected);
	}
	catch(onrejected) {
		return this.execute().catch(onrejected);
	}
	finally(onfinally) {
		return this.execute().finally(onfinally);
	}
};
var Http = class {
	baseURL;
	options;
	instance;
	constructor(options = {}) {
		this.options = {
			...defaultOptions,
			...options
		};
		this.instance = options.instance ?? defaultInstance;
		this.baseURL = this.resolveBaseURL();
	}
	/** 判断 API 响应是否成功（根据 code 或 success 字段） */
	static isSuccessful(data, successCode = "00000") {
		if (!data || typeof data !== "object") return false;
		const d = data;
		if (d.success === false || d.ok === false) return false;
		if (d.code && d.code !== successCode) return false;
		return true;
	}
	/** HTTP 2xx 且 API 响应成功的快捷判断 */
	static is200Successful(data, successCode = "00000") {
		return this.isSuccessful(data, successCode);
	}
	/** 解析最终 baseURL：手动 baseUrl > config.http.baseUrl */
	resolveBaseURL() {
		if (this.options.baseUrl !== void 0) return this.options.baseUrl;
		if (this.options.useAppConfig) return getConfig().http.baseUrl;
		return "";
	}
	setBaseURL(url) {
		this.baseURL = url;
	}
	/** 暴露底层 axios 实例（拦截器所在），供模块复用同一请求管线（如 device/spider 自定义 baseUrl） */
	getInstance() {
		return this.instance;
	}
	buildDefaults() {
		let timeout = this.options.timeout;
		const headers = {
			...firstPartyHeaders(),
			...this.options.headers
		};
		let apiVersion;
		if (this.options.useAppConfig) {
			const cfg = getConfig();
			if (timeout === void 0) timeout = cfg.http?.timeout;
			apiVersion = cfg.http?.apiVersion;
		}
		return {
			timeout,
			headers,
			apiVersion
		};
	}
	request(method, url) {
		const defaults = this.buildDefaults();
		const builder = new RequestBuilder(/^https?:\/\//i.test(url) ? "" : this.baseURL, method, url, defaults, this.instance);
		if (defaults.apiVersion) builder.query({ version: defaults.apiVersion });
		return builder;
	}
	get(url) {
		return this.request("GET", url);
	}
	post(url) {
		return this.request("POST", url);
	}
	put(url) {
		return this.request("PUT", url);
	}
	delete(url) {
		return this.request("DELETE", url);
	}
	patch(url) {
		return this.request("PATCH", url);
	}
	head(url) {
		return this.request("HEAD", url);
	}
	/**
	* 创建通用 SSE 客户端（基于 @microsoft/fetch-event-source）。
	*
	* 复用本 Http 实例的 baseURL 解析策略与全局 headers/auth 行为，
	* 内部委托给 `./sse/client.ts` 的 createSseClient。
	*
	* 典型用法：
	* ```ts
	* const client = http.createSse('/api/chat', {
	*   method: 'POST',
	*   body: { prompt: 'hi' },
	*   onMessage: (e) => console.log(e.data),
	* });
	* // 终止
	* client.close();
	* ```
	*
	* @param url 相对路径（走 baseURL）或完整 URL
	* @param options SSE 客户端选项，method/headers/body 在此显式传入
	* @returns SSE 客户端实例
	*/
	createSse(url, options = {}) {
		const { method = "POST", headers = {}, body, ...rest } = options;
		return createSseClient(this.resolveRequestUrl(url), {
			...rest,
			method,
			headers: this.buildSseHeaders(headers),
			body
		});
	}
	/**
	* 创建 OpenAI 协议 SSE 客户端（/v1/chat/completions 流式响应）。
	*
	* 自动处理 [DONE] 结束标记、finish_reason='stop'、content 增量累积。
	* 复用本 Http 实例的 baseURL 与全局 headers。
	*
	* 典型用法：
	* ```ts
	* const client = http.createOpenAiSse('/v1/chat/completions', {
	*   body: { model: 'gpt-4', stream: true, messages: [...] },
	*   onChunk: (chunk) => process.stdout.write(chunk.choices[0]?.delta?.content ?? ''),
	*   onEnd: (full) => console.log('\n[done]', full.length, 'chars'),
	* });
	* ```
	*/
	createOpenAiSse(url, options = {}) {
		const { method = "POST", headers = {}, body, ...rest } = options;
		return createOpenAiSseClient(this.resolveRequestUrl(url), {
			...rest,
			method,
			headers: this.buildSseHeaders(headers),
			body
		});
	}
	/**
	* 创建 Spring AI 协议 SSE 客户端（适配后端 AI 服务的流式响应）。
	*
	* 自动处理 chunk.done / chunk.error 收尾、content 增量累积。
	* 复用本 Http 实例的 baseURL 与全局 headers。
	*/
	createSpringAiSse(url, options = {}) {
		const { method = "POST", headers = {}, body, ...rest } = options;
		return createSpringAiSseClient(this.resolveRequestUrl(url), {
			...rest,
			method,
			headers: this.buildSseHeaders(headers),
			body
		});
	}
	/**
	* SSE 请求头：同样带上第一方标识。
	*
	* <p>SSE 不走 {@link buildDefaults}（它自己拼 headers），所以第一方标识必须
	* 在这里补一次，否则只有 REST 请求带标识、流式请求不带 —— 那种「列表页正常、
	* 实时推送 403」的分裂现象极难排查。</p>
	*
	* @param extra 调用方本次显式传入的请求头（优先级高于默认值）
	* @returns 合并后的请求头
	*/
	buildSseHeaders(extra) {
		return {
			...firstPartyHeaders(),
			...this.options.headers,
			...extra
		};
	}
	/**
	* 解析请求 URL：完整地址（http(s)://）原样返回，否则拼接 baseURL。
	* 与 normalizeUrl 行为一致；提取为实例方法供 createSse 等复用。
	*/
	resolveRequestUrl(url) {
		return normalizeUrl(this.baseURL, url);
	}
};
/** 创建请求实例，默认从 @repo/config 读取 baseUrl 与 request 配置 */
function createHttp(options) {
	return new Http(options);
}
/**
* 解包标准后端返回结构 { code, data, msg }，直接取业务数据。
*
* 兼容两种 axios 包装层级：
* - 拦截器已剥离一层：res 即 { code, data, msg }；
* - 未剥离：res 为 AxiosResponse，业务结构位于 res.data。
*
* 成功码判定复用 {@link Http.isSuccessful}（'00000' 或 success/ok 标记），
* 失败时抛出携带后端 msg 的 Error，供页面统一 ElMessage 提示。
*
* @param res 请求返回值（AxiosResponse 或裸响应体）
* @param successCode 成功码，默认 '00000'
* @returns 业务数据
*/
function unwrapResult(res, successCode = "00000") {
	const body = res?.data ?? res;
	if (Http.isSuccessful(body, successCode)) return body.data ?? body;
	const msg = body?.msg;
	const httpStatus = res?.status;
	const bizCode = body?.code;
	const err = new Error(msg || "请求失败");
	if (httpStatus !== void 0) err.status = httpStatus;
	if (bizCode !== void 0) err.code = bizCode;
	const savedData = body.data;
	if (savedData !== void 0) err.data = savedData;
	throw err;
}
/** 快捷别名：http() === createHttp() */
var http = createHttp;
//#endregion
//#region ../../packages/utils/src/log.ts
var LEVEL_STYLES = {
	trace: "color:#94a3b8;font-weight:400",
	debug: "color:#6366f1;font-weight:600",
	info: "color:#22c55e;font-weight:600",
	warn: "color:#f59e0b;font-weight:600;background:#fffbeb",
	error: "color:#ef4444;font-weight:700;background:#fef2f2"
};
var LEVEL_LABELS = {
	trace: "TRACE",
	debug: "DEBUG",
	info: "INFO",
	warn: "WARN",
	error: "ERROR"
};
var LEVEL_RANK = {
	trace: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4
};
var listeners = [];
var configuredLevel = "info";
function readLevelFromStorage() {
	try {
		const cfg = localStorage.getItem("app-config");
		if (cfg) {
			const lvl = JSON.parse(cfg)?.other?.logLevel;
			if (lvl && lvl in LEVEL_RANK) configuredLevel = lvl;
		}
	} catch {}
}
readLevelFromStorage();
function shouldLog(level) {
	return LEVEL_RANK[level] >= LEVEL_RANK[configuredLevel];
}
function emit(entry) {
	for (const fn of listeners) try {
		fn(entry);
	} catch {}
}
function writeLog(level, module, message, data) {
	if (!shouldLog(level)) return;
	emit({
		level,
		module,
		message,
		data,
		timestamp: Date.now()
	});
}
/**
* 解析调用参数：兼容 (module, message) 与 (message, data?) 两种形态
*
* @returns { module, message, data }
*/
function parseArgs(a, b, c) {
	if (typeof a !== "string") return {
		module: "log",
		message: String(a ?? "")
	};
	if (typeof b === "string") return {
		module: a,
		message: b,
		data: c
	};
	return {
		module: "log",
		message: a,
		data: b
	};
}
/** 默认 console 监听器：带颜色、时间戳输出 */
function consoleListener(entry) {
	const { level, module, message, data, timestamp } = entry;
	const style = LEVEL_STYLES[level];
	const label = LEVEL_LABELS[level];
	const ts = new Date(timestamp).toLocaleTimeString("zh-CN", { hour12: false });
	if (data !== void 0) console.log(`%c[${ts}][${label}][${module}] ${message}`, style, data);
	else console.log(`%c[${ts}][${label}][${module}] ${message}`, style);
}
listeners.push(consoleListener);
var log = {
	trace(a, b, c) {
		const { module, message, data } = parseArgs(a, b, c);
		writeLog("trace", module, message, data);
	},
	debug(a, b, c) {
		const { module, message, data } = parseArgs(a, b, c);
		writeLog("debug", module, message, data);
	},
	info(a, b, c) {
		const { module, message, data } = parseArgs(a, b, c);
		writeLog("info", module, message, data);
	},
	warn(a, b, c) {
		const { module, message, data } = parseArgs(a, b, c);
		writeLog("warn", module, message, data);
	},
	error(a, b, c) {
		const { module, message, data } = parseArgs(a, b, c);
		writeLog("error", module, message, data);
	},
	/** 订阅日志事件 */
	on(fn) {
		listeners.push(fn);
	},
	/** 取消订阅 */
	off(fn) {
		const i = listeners.indexOf(fn);
		if (i >= 0) listeners.splice(i, 1);
	},
	/** 移除默认 console 监听器，完全接管输出 */
	removeConsole() {
		const i = listeners.indexOf(consoleListener);
		if (i >= 0) listeners.splice(i, 1);
	},
	/** 动态更新日志级别 */
	setLevel(level) {
		configuredLevel = level;
	}
};
//#endregion
//#region ../../packages/utils/src/modules/random.ts
var hexList = [];
for (let i = 0; i <= 15; i++) hexList[i] = i.toString(16);
/** 每日动态问候语（每时段 14 句，按当天 yyyy-mm-dd 选不同一句） */
var DAY_GREETINGS = {
	dawn: [
		"凌晨好，夜已深，注意身体，早点睡吧。",
		"夜深人静，记得给自己倒杯温水，别熬太晚。",
		"万籁俱寂的夜晚，适合发呆与整理思绪。",
		"夜很长，星星也在陪你，请你好好休息。",
		"抬头看看窗外，月色刚好，安心入眠吧。",
		"如果还在电脑前，建议起身拉伸一下肩颈。",
		"夜深了，一句'辛苦了'送给自己。",
		"把手机放下，闭眼深呼吸三次，你能睡得更好。",
		"凌晨的咖啡最易上头，不如换成温水。",
		"这个世界还在等你醒来，先好好休息。",
		"夜无声，灯未灭，小心眼睛，别再盯屏幕了。",
		"记一笔明日清单，把今夜留给睡眠。",
		"如果已睡，那便很好；如果未睡，请对自己温柔。",
		"星夜安好，明天会是值得期待的一天。"
	],
	morning: [
		"早上好，新的一天开始了，愿您充满活力！",
		"早安，愿第一缕阳光带给你整日的好心情。",
		"新的一天，不慌不忙，按自己的节奏来。",
		"起床啦！先喝杯水，再给今天定个小目标。",
		"早安，世界温柔待你，你也温柔待自己。",
		"今天也请加油，一切尽在掌握。",
		"晨光熹微，先深呼吸三下，再开始工作。",
		"早安，又是值得期待的一天。",
		"愿今天所有的小目标，都能稳稳落地。",
		"新的一天，从一个微笑开始。",
		"别忘了吃早餐，照顾好胃才能乘风破浪。",
		"凡是过往，皆为序章，今天是新的开始。",
		"早安，先给自己一个大大的拥抱。",
		"阳光正好，今天也要元气满满哦。"
	],
	noon: [
		"中午好，记得好好吃饭，小憩一下～",
		"正午啦！别错过这顿能量满满的午餐。",
		"午间半小时，闭眼养神，下午会更清醒。",
		"今天食堂 / 外卖 / 自带？选个爱吃的犒劳自己。",
		"饭后走一走，比趴着刷手机更舒坦。",
		"把没回的消息，下午再处理也不迟。",
		"中午好，留给自己一段不被打扰的时光。",
		"把桌面收拾干净，下午效率翻倍。",
		"午餐不必奢华，但务必吃饱。",
		"午后阳光正好，记得给自己倒杯茶。",
		"别让繁忙吞掉你吃午饭的权利。",
		"吃到一半的菜，是最香的时候。",
		"今天有什么想偷笑的瞬间吗？记录一下。",
		"趁中午，给重要的人发一句问候。"
	],
	afternoon: [
		"下午好，继续加油，今天依然美好！",
		"下午是个容易犯困的时段，起身接杯水吧。",
		"做一件小事当作奖励，给自己续上能量。",
		"距下班还有多久？数数更开心的小目标。",
		"下午茶时间，吃点点心犒劳努力的自己。",
		"再坚持一下，下午的任务完成就能喘口气。",
		"心情有点闷？来，把窗开一条缝。",
		"下午过半，复盘一下今天的进展，挺有成就感。",
		"给自己一点肯定，今天已经做了很多。",
		"眼睛累了？远眺 6 米外的物体，看 20 秒。",
		"把待办清单分成 3 块，一块块来。",
		"深呼吸一次，迎接下半天。",
		"若今日不顺，没关系，还有明天。",
		"做点不一样的小事，给下午添点新鲜感。"
	],
	evening: [
		"晚上好，放下疲惫，早点休息哟。",
		"晚餐吃了吗？辛苦了，记得好好吃饭。",
		"晚上是和自己对话的好时光，复盘一下今天。",
		"夜里散步五公里，是最便宜的好心情。",
		"今晚想看什么？读几页书、追一集剧都好。",
		"给自己泡个脚、冲杯热饮，温暖一整晚。",
		"把明天的第一件事记下来，安心入梦。",
		"晚上好，别再盯着屏幕太久，护眼要紧。",
		"和家人聊聊天，是最好的充电方式。",
		"一天结束了，给今天的自己打个合格。",
		"愿你今晚做个好梦。",
		"关掉闹钟的焦虑，让今天安静收尾。",
		"深呼吸三次，今晚或许能睡得更香。",
		"晚风轻拂，愿所有的好，都向你靠近。"
	],
	night: []
};
/** 把今天日期转成一个稳定整数 seed */
var todaySeed = () => {
	const d = /* @__PURE__ */ new Date();
	return d.getFullYear() * 1e4 + (d.getMonth() + 1) * 100 + d.getDate();
};
/** 字符串 hash（djb2） */
var hash = (s) => {
	let h = 5381;
	for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i) | 0;
	return Math.abs(h);
};
/** 时间段问候语（每天同一时段不同一句话，14 天一轮） */
var getDayText = () => {
	const hours = (/* @__PURE__ */ new Date()).getHours();
	const period = hours >= 0 && hours < 6 ? "dawn" : hours >= 6 && hours < 10 ? "morning" : hours >= 10 && hours < 14 ? "noon" : hours >= 14 && hours < 18 ? "afternoon" : hours >= 18 && hours < 24 ? "evening" : "dawn";
	const list = DAY_GREETINGS[period];
	return list[(todaySeed() ^ hash(period)) % list.length];
};
//#endregion
//#region ../../packages/utils/src/modules/codec.ts
/**
* 请求体编解码（对齐后端 ApiRequestDecodeRegister / Codec / AesCodec 协议）
*
* 后端 `plugin.api.decode` 开启后，`ApiRequestDecodeBodyAdvice` 对携带
* `access-control-origin-key` 头的请求体做解密：
*  - codecType 含 "aes" → `AesCodec`：aesKey = SHA-256(key)（32 字节，AES-256），
*    iv = SHA-256(key) 前 16 字节，AES/CBC/PKCS5Padding 解密，线上载荷为 hex 字符串；
*  - 其余（sm4/des）→ `Codec` 仅做 hex 编解码（无真实加密）。
*
* 载荷形态（后端 `extractEncryptedPayload`）：不以 `{` / `[` 开头的原始 body 文本
* 即视为密文，故前端直接发送 hex 字符串即可，无需 `{"data": "..."}` 包装。
*
* 为何不用 wasm 的 aesEncrypt：wasm 侧 AES 仅支持 16 字节密钥（AES-128，
* 24/32 字节密钥会 panic），与后端 AES-256 口径不符；CryptoJS 已在
* `@repo/utils`（storage 加密同款依赖），显式 key/IV + PKCS7 输出与
* Java AES/CBC/PKCS5Padding 逐字节一致（已用 Node 标准实现交叉验证）。
*/
/** SHA-256 摘要（hex，与 Java MessageDigest SHA-256 一致；不依赖 crypto.subtle，非安全上下文可用） */
function sha256Hex(input) {
	return import_crypto_js.default.SHA256(input).toString();
}
/**
* 按后端协议编码请求体，返回线上传输的 hex 字符串。
*
* @param plaintext JSON 明文字符串
* @param options  编解码配置
* @returns hex 编码的载荷（后端 decodeHex 的输入）
*/
function encodeRequestBody(plaintext, options) {
	if (!(options.type ?? "").toLowerCase().includes("aes")) return import_crypto_js.default.enc.Hex.stringify(import_crypto_js.default.enc.Utf8.parse(plaintext));
	const digest = sha256Hex(options.key);
	return import_crypto_js.default.AES.encrypt(import_crypto_js.default.enc.Utf8.parse(plaintext), import_crypto_js.default.enc.Hex.parse(digest), {
		mode: import_crypto_js.default.mode.CBC,
		iv: import_crypto_js.default.enc.Hex.parse(digest.slice(0, 32)),
		padding: import_crypto_js.default.pad.Pkcs7
	}).ciphertext.toString();
}
//#endregion
//#region ../../packages/utils/src/modules/themeColor.ts
/**
* 主题色计算工具（迁移自 koi/utils/themeColor.ts）
*
* 与 Element Plus 官方一致：mix(primary, white|black, level * 0.1)。
*/
/** hex 转 rgb 数组 */
function hexToRgb(hex) {
	const normalized = hex.replace("#", "");
	if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) return null;
	return [
		parseInt(normalized.slice(0, 2), 16),
		parseInt(normalized.slice(2, 4), 16),
		parseInt(normalized.slice(4, 6), 16)
	];
}
/** 展开 #RGB 为 #RRGGBB */
function expandShortHex(hex) {
	if (/^#([0-9A-Fa-f]{3})$/.test(hex)) {
		const s = hex.slice(1);
		return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
	}
	return hex;
}
/** 校验并规范化主题色，非法值回退 fallback */
function normalizeThemeColor(color, fallback = DEFAULT_THEME) {
	const expanded = expandShortHex((color || "").trim());
	return /^#([0-9A-Fa-f]{6})$/.test(expanded) ? expanded : fallback;
}
/** 两色线性混合，weight 为 color2 权重（0~1） */
function mixColor(color1, color2, weight) {
	const w = Math.max(0, Math.min(1, weight));
	const c1 = hexToRgb(color1);
	const c2 = hexToRgb(color2);
	if (!c1 || !c2) return color1;
	return `#${[
		Math.round(c1[0] * (1 - w) + c2[0] * w),
		Math.round(c1[1] * (1 - w) + c2[1] * w),
		Math.round(c1[2] * (1 - w) + c2[2] * w)
	].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}
/** 亮色模式色阶：向白色靠拢 */
function getLightColor(color, level) {
	return mixColor(color, "#ffffff", level * .1);
}
/** 暗色模式色阶：向黑色靠拢 */
function getDarkColor(color, level) {
	return mixColor(color, "#000000", level * .1);
}
/** 写入 Element Plus 主题色及 9 级色阶 */
function applyPrimaryColorVars(target, color, isDark) {
	const safeColor = normalizeThemeColor(color);
	target.style.setProperty("--el-color-primary", safeColor);
	const rgb = hexToRgb(safeColor);
	if (rgb) target.style.setProperty("--el-color-primary-rgb", `${rgb[0]},${rgb[1]},${rgb[2]}`);
	if (isDark) {
		target.style.setProperty("--el-color-primary-dark-2", getLightColor(safeColor, 2));
		for (let i = 1; i <= 9; i++) target.style.setProperty(`--el-color-primary-light-${i}`, getDarkColor(safeColor, i));
	} else {
		target.style.setProperty("--el-color-primary-dark-2", getDarkColor(safeColor, 2));
		for (let i = 1; i <= 9; i++) target.style.setProperty(`--el-color-primary-light-${i}`, getLightColor(safeColor, i));
	}
}
/** 写入 Element Plus 单个状态色变量及 9 级色阶（success / warning / danger / info） */
function applyStateColorVars(target, varName, color, isDark) {
	const safeColor = normalizeThemeColor(color);
	target.style.setProperty(`--el-color-${varName}`, safeColor);
	const rgb = hexToRgb(safeColor);
	if (rgb) target.style.setProperty(`--el-color-${varName}-rgb`, `${rgb[0]},${rgb[1]},${rgb[2]}`);
	if (isDark) {
		target.style.setProperty(`--el-color-${varName}-dark-2`, getLightColor(safeColor, 2));
		for (let i = 1; i <= 9; i++) target.style.setProperty(`--el-color-${varName}-light-${i}`, getDarkColor(safeColor, i));
	} else {
		target.style.setProperty(`--el-color-${varName}-dark-2`, getDarkColor(safeColor, 2));
		for (let i = 1; i <= 9; i++) target.style.setProperty(`--el-color-${varName}-light-${i}`, getLightColor(safeColor, i));
	}
}
/**
* 实时写入消息状态色 CSS 变量，控制全局 el-message / el-notification 颜色。
* @param colors type → hex，缺省项不覆盖
*/
function applyMessageColorVars(target, colors, isDark) {
	const varMap = {
		success: "success",
		warning: "warning",
		danger: "error",
		info: "info"
	};
	Object.keys(colors).forEach((type) => {
		const color = colors[type];
		if (color) applyStateColorVars(target, varMap[type], color, isDark);
	});
}
//#endregion
//#region ../../packages/utils/src/modules/cache.ts
/** 清空整个 sessionStorage */
function clearSessionStorage() {
	window.sessionStorage.clear();
}
//#endregion
//#region ../../packages/utils/src/modules/userDisplay.ts
/**
* 用户展示信息工具（@repo/utils）
*
* 统一从多数据源（authStore.loginUser + 框架 storage.getUserInfo + userStore.userInfo）
* 解析用户展示字段（昵称、头像、手机、邮箱、角色、协议版本等）。
*
* <p>使用场景：个人中心页（/system/personage）、koi 主题 mine 页等需要展示当前登录用户信息的页面。</p>
*
* <h3>字段优先级（按从高到低）：</h3>
* <ol>
*   <li>authStore.loginUser（最近一次 {@code getLoginUserInfo()} 调用写入）</li>
*   <li>框架 storage.getUserInfo()（登录响应或持久化缓存）</li>
*   <li>userStore.userInfo（登录时写入的冗余快照）</li>
* </ol>
*
* @author CH
* @since 2026/4
*/
/**
* 合并多数据源解析当前登录用户的展示信息。
*
* <p>字段优先级：{@code authLoginUser} > {@code storage getUserInfo()} > {@code userStoreInfo}</p>
*
* @param sources 可选的数据源（不传则自动从 storage 读取）
* @return 标准化后的展示信息对象（字段可能为空字符串）
*
* @example
* ```ts
* const display = resolveUserDisplayInfo({
*   authLoginUser: authStore.loginUser,
*   userStoreInfo: userStore.userInfo,
* });
* console.log(display.nickname, display.avatar);
* ```
*/
function resolveUserDisplayInfo(sources) {
	const authLoginUser = sources?.authLoginUser ?? {};
	const userStoreInfo = sources?.userStoreInfo ?? {};
	const storage = getUserInfo() ?? {};
	const merged = {
		...userStoreInfo,
		...storage,
		...authLoginUser
	};
	return {
		userId: merged.userId ?? merged.sysUserId,
		username: merged.sysUserUsername ?? merged.username ?? authLoginUser.loginName ?? "",
		nickname: merged.sysUserNickname ?? merged.nickname ?? "",
		avatar: merged.avatar ?? merged.sysUserAvatar ?? "",
		phone: merged.sysUserPhone ?? merged.phone ?? "",
		email: merged.sysUserEmail ?? merged.email ?? "",
		sex: merged.sysUserSex ?? merged.sex ?? 0,
		roles: merged.roles ?? [],
		avatarFrame: merged.sysUserAvatarFrame ?? merged.avatarFrame ?? 0,
		avatarFrameShow: merged.sysUserAvatarFrameShow ?? merged.avatarFrameShow ?? 0,
		birthday: merged.sysUserBirthday ?? merged.birthday ?? "",
		idCard: merged.sysUserIdCard ?? merged.idCard ?? ""
	};
}
//#endregion
//#region ../../node_modules/.pnpm/dexie@4.4.6/node_modules/dexie/import-wrapper-prod.mjs
var import_dexie_min = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	((e, t) => {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).Dexie = t();
	})(exports, function() {
		var B = function(e, t) {
			return (B = Object.setPrototypeOf || ({ __proto__: [] } instanceof Array ? function(e, t) {
				e.__proto__ = t;
			} : function(e, t) {
				for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
			}))(e, t);
		};
		var _ = function() {
			return (_ = Object.assign || function(e) {
				for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n]) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
				return e;
			}).apply(this, arguments);
		};
		function R(e, t, n) {
			if (n || 2 === arguments.length) for (var r, i = 0, o = t.length; i < o; i++) !r && i in t || ((r = r || Array.prototype.slice.call(t, 0, i))[i] = t[i]);
			return e.concat(r || Array.prototype.slice.call(t));
		}
		var f = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : "undefined" != typeof window ? window : global, O = Object.keys, x = Array.isArray;
		function a(t, n) {
			return "object" == typeof n && O(n).forEach(function(e) {
				t[e] = n[e];
			}), t;
		}
		"undefined" == typeof Promise || f.Promise || (f.Promise = Promise);
		var F = Object.getPrototypeOf, N = {}.hasOwnProperty;
		function m(e, t) {
			return N.call(e, t);
		}
		function M(t, n) {
			"function" == typeof n && (n = n(F(t))), ("undefined" == typeof Reflect ? O : Reflect.ownKeys)(n).forEach(function(e) {
				u(t, e, n[e]);
			});
		}
		var L = Object.defineProperty;
		function u(e, t, n, r) {
			L(e, t, a(n && m(n, "get") && "function" == typeof n.get ? {
				get: n.get,
				set: n.set,
				configurable: !0
			} : {
				value: n,
				configurable: !0,
				writable: !0
			}, r));
		}
		function U(t) {
			return { from: function(e) {
				return t.prototype = Object.create(e.prototype), u(t.prototype, "constructor", t), { extend: M.bind(null, t.prototype) };
			} };
		}
		var z = Object.getOwnPropertyDescriptor;
		var V = [].slice;
		function W(e, t, n) {
			return V.call(e, t, n);
		}
		function Y(e, t) {
			return t(e);
		}
		function $(e) {
			if (!e) throw new Error("Assertion Failed");
		}
		function Q(e) {
			f.setImmediate ? setImmediate(e) : setTimeout(e, 0);
		}
		function c(e, t) {
			if ("string" == typeof t && m(e, t)) return e[t];
			if (!t) return e;
			if ("string" != typeof t) {
				for (var n = [], r = 0, i = t.length; r < i; ++r) {
					var o = c(e, t[r]);
					n.push(o);
				}
				return n;
			}
			var a, u = t.indexOf(".");
			return -1 === u || null == (a = e[t.substr(0, u)]) ? void 0 : c(a, t.substr(u + 1));
		}
		function b(e, t, n) {
			if (e && void 0 !== t && !("isFrozen" in Object && Object.isFrozen(e))) if ("string" != typeof t && "length" in t) {
				$("string" != typeof n && "length" in n);
				for (var r = 0, i = t.length; r < i; ++r) b(e, t[r], n[r]);
			} else {
				var o = t.indexOf(".");
				if (-1 !== o) {
					var a = t.substr(0, o), o = t.substr(o + 1);
					if ("" === o) void 0 === n ? x(e) && !isNaN(parseInt(a)) ? e.splice(a, 1) : delete e[a] : e[a] = n;
					else {
						var u = e[a];
						if (!u || !m(e, a)) {
							if (void 0 === n) return;
							u = e[a] = {};
						}
						b(u, o, n);
					}
				} else void 0 === n ? x(e) && !isNaN(parseInt(t)) ? e.splice(t, 1) : delete e[t] : e[t] = n;
			}
		}
		function G(e) {
			var t, n = {};
			for (t in e) m(e, t) && (n[t] = e[t]);
			return n;
		}
		var X = [].concat;
		function H(e) {
			return X.apply([], e);
		}
		var e = "BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey".split(",").concat(H([
			8,
			16,
			32,
			64
		].map(function(t) {
			return [
				"Int",
				"Uint",
				"Float"
			].map(function(e) {
				return e + t + "Array";
			});
		}))).filter(function(e) {
			return f[e];
		}), J = new Set(e.map(function(e) {
			return f[e];
		}));
		var Z = null;
		function ee(e) {
			Z = /* @__PURE__ */ new WeakMap();
			e = function e(t) {
				if (!t || "object" != typeof t) return t;
				var n = Z.get(t);
				if (n) return n;
				if (x(t)) {
					n = [], Z.set(t, n);
					for (var r = 0, i = t.length; r < i; ++r) n.push(e(t[r]));
				} else if (J.has(t.constructor)) n = t;
				else {
					var o, a = F(t);
					for (o in n = a === Object.prototype ? {} : Object.create(a), Z.set(t, n), t) m(t, o) && (n[o] = e(t[o]));
				}
				return n;
			}(e);
			return Z = null, e;
		}
		var te = {}.toString;
		function ne(e) {
			return te.call(e).slice(8, -1);
		}
		var re = "undefined" != typeof Symbol ? Symbol.iterator : "@@iterator", ie = "symbol" == typeof re ? function(e) {
			var t;
			return null != e && (t = e[re]) && t.apply(e);
		} : function() {
			return null;
		};
		function oe(e, t) {
			t = e.indexOf(t);
			0 <= t && e.splice(t, 1);
		}
		var ae = {};
		function n(e) {
			var t, n, r, i;
			if (1 === arguments.length) {
				if (x(e)) return e.slice();
				if (this === ae && "string" == typeof e) return [e];
				if (i = ie(e)) for (n = []; !(r = i.next()).done;) n.push(r.value);
				else {
					if (null == e) return [e];
					if ("number" != typeof (t = e.length)) return [e];
					for (n = new Array(t); t--;) n[t] = e[t];
				}
			} else for (t = arguments.length, n = new Array(t); t--;) n[t] = arguments[t];
			return n;
		}
		var ue = "undefined" != typeof Symbol ? function(e) {
			return "AsyncFunction" === e[Symbol.toStringTag];
		} : function() {
			return !1;
		}, e = [
			"Unknown",
			"Constraint",
			"Data",
			"TransactionInactive",
			"ReadOnly",
			"Version",
			"NotFound",
			"InvalidState",
			"InvalidAccess",
			"Abort",
			"Timeout",
			"QuotaExceeded",
			"Syntax",
			"DataClone"
		], t = [
			"Modify",
			"Bulk",
			"OpenFailed",
			"VersionChange",
			"Schema",
			"Upgrade",
			"InvalidTable",
			"MissingAPI",
			"NoSuchDatabase",
			"InvalidArgument",
			"SubTransaction",
			"Unsupported",
			"Internal",
			"DatabaseClosed",
			"PrematureCommit",
			"ForeignAwait"
		].concat(e), se = {
			VersionChanged: "Database version changed by other database connection",
			DatabaseClosed: "Database has been closed",
			Abort: "Transaction aborted",
			TransactionInactive: "Transaction has already completed or failed",
			MissingAPI: "IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb"
		};
		function ce(e, t) {
			this.name = e, this.message = t;
		}
		function le(e, t) {
			return e + ". Errors: " + Object.keys(t).map(function(e) {
				return t[e].toString();
			}).filter(function(e, t, n) {
				return n.indexOf(e) === t;
			}).join("\n");
		}
		function fe(e, t, n, r) {
			this.failures = t, this.failedKeys = r, this.successCount = n, this.message = le(e, t);
		}
		function he(e, t) {
			this.name = "BulkError", this.failures = Object.keys(t).map(function(e) {
				return t[e];
			}), this.failuresByPos = t, this.message = le(e, this.failures);
		}
		U(ce).from(Error).extend({ toString: function() {
			return this.name + ": " + this.message;
		} }), U(fe).from(ce), U(he).from(ce);
		var de = t.reduce(function(e, t) {
			return e[t] = t + "Error", e;
		}, {}), pe = ce, k = t.reduce(function(e, n) {
			var r = n + "Error";
			function t(e, t) {
				this.name = r, e ? "string" == typeof e ? (this.message = "".concat(e).concat(t ? "\n " + t : ""), this.inner = t || null) : "object" == typeof e && (this.message = "".concat(e.name, " ").concat(e.message), this.inner = e) : (this.message = se[n] || r, this.inner = null);
			}
			return U(t).from(pe), e[n] = t, e;
		}, {}), ye = (k.Syntax = SyntaxError, k.Type = TypeError, k.Range = RangeError, e.reduce(function(e, t) {
			return e[t + "Error"] = k[t], e;
		}, {}));
		e = t.reduce(function(e, t) {
			return -1 === [
				"Syntax",
				"Type",
				"Range"
			].indexOf(t) && (e[t + "Error"] = k[t]), e;
		}, {});
		function g() {}
		function ve(e) {
			return e;
		}
		function me(t, n) {
			return null == t || t === ve ? n : function(e) {
				return n(t(e));
			};
		}
		function be(e, t) {
			return function() {
				e.apply(this, arguments), t.apply(this, arguments);
			};
		}
		function ge(i, o) {
			return i === g ? o : function() {
				var e = i.apply(this, arguments), t = (void 0 !== e && (arguments[0] = e), this.onsuccess), n = this.onerror, r = (this.onsuccess = null, this.onerror = null, o.apply(this, arguments));
				return t && (this.onsuccess = this.onsuccess ? be(t, this.onsuccess) : t), n && (this.onerror = this.onerror ? be(n, this.onerror) : n), void 0 !== r ? r : e;
			};
		}
		function we(n, r) {
			return n === g ? r : function() {
				n.apply(this, arguments);
				var e = this.onsuccess, t = this.onerror;
				this.onsuccess = this.onerror = null, r.apply(this, arguments), e && (this.onsuccess = this.onsuccess ? be(e, this.onsuccess) : e), t && (this.onerror = this.onerror ? be(t, this.onerror) : t);
			};
		}
		function _e(i, o) {
			return i === g ? o : function() {
				var e = i.apply(this, arguments), t = (a(arguments[0], e), this.onsuccess), n = this.onerror, r = (this.onsuccess = null, this.onerror = null, o.apply(this, arguments));
				return t && (this.onsuccess = this.onsuccess ? be(t, this.onsuccess) : t), n && (this.onerror = this.onerror ? be(n, this.onerror) : n), void 0 === e ? void 0 === r ? void 0 : r : a(e, r);
			};
		}
		function xe(e, t) {
			return e === g ? t : function() {
				return !1 !== t.apply(this, arguments) && e.apply(this, arguments);
			};
		}
		function ke(i, o) {
			return i === g ? o : function() {
				var e = i.apply(this, arguments);
				if (e && "function" == typeof e.then) {
					for (var t = this, n = arguments.length, r = new Array(n); n--;) r[n] = arguments[n];
					return e.then(function() {
						return o.apply(t, r);
					});
				}
				return o.apply(this, arguments);
			};
		}
		e.ModifyError = fe, e.DexieError = ce, e.BulkError = he;
		var l = "undefined" != typeof location && /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
		function Oe(e) {
			l = e;
		}
		var Pe = {}, Ke = 100, Ee = "undefined" == typeof Promise ? [] : (t = Promise.resolve(), "undefined" != typeof crypto && crypto.subtle ? [
			Ee = crypto.subtle.digest("SHA-512", new Uint8Array([0])),
			F(Ee),
			t
		] : [
			t,
			F(t),
			t
		]), t = Ee[0], Se = Ee[1], Se = Se && Se.then, Ae = t && t.constructor, je = !!Ee[2];
		var Ce = function(e, t) {
			Re.push([e, t]), Ie && (queueMicrotask(Ye), Ie = !1);
		}, Te = !0, Ie = !0, qe = [], De = [], Be = ve, s = {
			id: "global",
			global: !0,
			ref: 0,
			unhandleds: [],
			onunhandled: g,
			pgp: !1,
			env: {},
			finalize: g
		}, P = s, Re = [], Fe = 0, Ne = [];
		function K(e) {
			if ("object" != typeof this) throw new TypeError("Promises must be constructed via new");
			this._listeners = [], this._lib = !1;
			var t = this._PSD = P;
			if ("function" != typeof e) {
				if (e !== Pe) throw new TypeError("Not a function");
				this._state = arguments[1], this._value = arguments[2], !1 === this._state && Ue(this, this._value);
			} else this._state = null, this._value = null, ++t.ref, function t(r, e) {
				try {
					e(function(n) {
						if (null === r._state) {
							if (n === r) throw new TypeError("A promise cannot be resolved with itself.");
							var e = r._lib && $e();
							n && "function" == typeof n.then ? t(r, function(e, t) {
								n instanceof K ? n._then(e, t) : n.then(e, t);
							}) : (r._state = !0, r._value = n, ze(r)), e && Qe();
						}
					}, Ue.bind(null, r));
				} catch (e) {
					Ue(r, e);
				}
			}(this, e);
		}
		var Me = {
			get: function() {
				var u = P, t = et;
				function e(n, r) {
					var i = this, o = !u.global && (u !== P || t !== et), a = o && !w(), e = new K(function(e, t) {
						Ve(i, new Le(ut(n, u, o, a), ut(r, u, o, a), e, t, u));
					});
					return this._consoleTask && (e._consoleTask = this._consoleTask), e;
				}
				return e.prototype = Pe, e;
			},
			set: function(e) {
				u(this, "then", e && e.prototype === Pe ? Me : {
					get: function() {
						return e;
					},
					set: Me.set
				});
			}
		};
		function Le(e, t, n, r, i) {
			this.onFulfilled = "function" == typeof e ? e : null, this.onRejected = "function" == typeof t ? t : null, this.resolve = n, this.reject = r, this.psd = i;
		}
		function Ue(e, t) {
			var n, r;
			De.push(t), null === e._state && (n = e._lib && $e(), t = Be(t), e._state = !1, e._value = t, r = e, qe.some(function(e) {
				return e._value === r._value;
			}) || qe.push(r), ze(e), n) && Qe();
		}
		function ze(e) {
			var t = e._listeners;
			e._listeners = [];
			for (var n = 0, r = t.length; n < r; ++n) Ve(e, t[n]);
			var i = e._PSD;
			--i.ref || i.finalize(), 0 === Fe && (++Fe, Ce(function() {
				0 == --Fe && Ge();
			}, []));
		}
		function Ve(e, t) {
			if (null === e._state) e._listeners.push(t);
			else {
				var n = e._state ? t.onFulfilled : t.onRejected;
				if (null === n) return (e._state ? t.resolve : t.reject)(e._value);
				++t.psd.ref, ++Fe, Ce(We, [
					n,
					e,
					t
				]);
			}
		}
		function We(e, t, n) {
			try {
				var r, i = t._value;
				!t._state && De.length && (De = []), r = l && t._consoleTask ? t._consoleTask.run(function() {
					return e(i);
				}) : e(i), t._state || -1 !== De.indexOf(i) || ((e) => {
					for (var t = qe.length; t;) if (qe[--t]._value === e._value) return qe.splice(t, 1);
				})(t), n.resolve(r);
			} catch (e) {
				n.reject(e);
			} finally {
				0 == --Fe && Ge(), --n.psd.ref || n.psd.finalize();
			}
		}
		function Ye() {
			at(s, function() {
				$e() && Qe();
			});
		}
		function $e() {
			var e = Te;
			return Ie = Te = !1, e;
		}
		function Qe() {
			var e, t, n;
			do
				for (; 0 < Re.length;) for (e = Re, Re = [], n = e.length, t = 0; t < n; ++t) {
					var r = e[t];
					r[0].apply(null, r[1]);
				}
			while (0 < Re.length);
			Ie = Te = !0;
		}
		function Ge() {
			for (var e = qe, t = (qe = [], e.forEach(function(e) {
				e._PSD.onunhandled.call(null, e._value, e);
			}), Ne.slice(0)), n = t.length; n;) t[--n]();
		}
		function Xe(e) {
			return new K(Pe, !1, e);
		}
		function E(n, r) {
			var i = P;
			return function() {
				var e = $e(), t = P;
				try {
					return h(i, !0), n.apply(this, arguments);
				} catch (e) {
					r && r(e);
				} finally {
					h(t, !1), e && Qe();
				}
			};
		}
		M(K.prototype, {
			then: Me,
			_then: function(e, t) {
				Ve(this, new Le(null, null, e, t, P));
			},
			catch: function(e) {
				var t, n;
				return 1 === arguments.length ? this.then(null, e) : (t = e, n = arguments[1], "function" == typeof t ? this.then(null, function(e) {
					return (e instanceof t ? n : Xe)(e);
				}) : this.then(null, function(e) {
					return (e && e.name === t ? n : Xe)(e);
				}));
			},
			finally: function(t) {
				return this.then(function(e) {
					return K.resolve(t()).then(function() {
						return e;
					});
				}, function(e) {
					return K.resolve(t()).then(function() {
						return Xe(e);
					});
				});
			},
			timeout: function(r, i) {
				var o = this;
				return r < Infinity ? new K(function(e, t) {
					var n = setTimeout(function() {
						return t(new k.Timeout(i));
					}, r);
					o.then(e, t).finally(clearTimeout.bind(null, n));
				}) : this;
			}
		}), "undefined" != typeof Symbol && Symbol.toStringTag && u(K.prototype, Symbol.toStringTag, "Dexie.Promise"), s.env = ot(), M(K, {
			all: function() {
				var o = n.apply(null, arguments).map(rt);
				return new K(function(n, r) {
					0 === o.length && n([]);
					var i = o.length;
					o.forEach(function(e, t) {
						return K.resolve(e).then(function(e) {
							o[t] = e, --i || n(o);
						}, r);
					});
				});
			},
			resolve: function(n) {
				return n instanceof K ? n : n && "function" == typeof n.then ? new K(function(e, t) {
					n.then(e, t);
				}) : new K(Pe, !0, n);
			},
			reject: Xe,
			race: function() {
				var e = n.apply(null, arguments).map(rt);
				return new K(function(t, n) {
					e.map(function(e) {
						return K.resolve(e).then(t, n);
					});
				});
			},
			PSD: {
				get: function() {
					return P;
				},
				set: function(e) {
					return P = e;
				}
			},
			totalEchoes: { get: function() {
				return et;
			} },
			newPSD: v,
			usePSD: at,
			scheduler: {
				get: function() {
					return Ce;
				},
				set: function(e) {
					Ce = e;
				}
			},
			rejectionMapper: {
				get: function() {
					return Be;
				},
				set: function(e) {
					Be = e;
				}
			},
			follow: function(i, n) {
				return new K(function(e, t) {
					return v(function(n, r) {
						var e = P;
						e.unhandleds = [], e.onunhandled = r, e.finalize = be(function() {
							var t, e = this;
							t = function() {
								0 === e.unhandleds.length ? n() : r(e.unhandleds[0]);
							}, Ne.push(function e() {
								t(), Ne.splice(Ne.indexOf(e), 1);
							}), ++Fe, Ce(function() {
								0 == --Fe && Ge();
							}, []);
						}, e.finalize), i();
					}, n, e, t);
				});
			}
		}), Ae && (Ae.allSettled && u(K, "allSettled", function() {
			var e = n.apply(null, arguments).map(rt);
			return new K(function(n) {
				0 === e.length && n([]);
				var r = e.length, i = new Array(r);
				e.forEach(function(e, t) {
					return K.resolve(e).then(function(e) {
						return i[t] = {
							status: "fulfilled",
							value: e
						};
					}, function(e) {
						return i[t] = {
							status: "rejected",
							reason: e
						};
					}).then(function() {
						return --r || n(i);
					});
				});
			});
		}), Ae.any && "undefined" != typeof AggregateError && u(K, "any", function() {
			var e = n.apply(null, arguments).map(rt);
			return new K(function(n, r) {
				0 === e.length && r(/* @__PURE__ */ new AggregateError([]));
				var i = e.length, o = new Array(i);
				e.forEach(function(e, t) {
					return K.resolve(e).then(function(e) {
						return n(e);
					}, function(e) {
						o[t] = e, --i || r(new AggregateError(o));
					});
				});
			});
		}), Ae.withResolvers) && (K.withResolvers = Ae.withResolvers);
		var o = {
			awaits: 0,
			echoes: 0,
			id: 0
		}, He = 0, Je = [], Ze = 0, et = 0, tt = 0;
		function v(e, t, n, r) {
			var i = P, o = Object.create(i), t = (o.parent = i, o.ref = 0, o.global = !1, o.id = ++tt, s.env, o.env = je ? {
				Promise: K,
				PromiseProp: {
					value: K,
					configurable: !0,
					writable: !0
				},
				all: K.all,
				race: K.race,
				allSettled: K.allSettled,
				any: K.any,
				resolve: K.resolve,
				reject: K.reject
			} : {}, t && a(o, t), ++i.ref, o.finalize = function() {
				--this.parent.ref || this.parent.finalize();
			}, at(o, e, n, r));
			return 0 === o.ref && o.finalize(), t;
		}
		function nt() {
			return o.id || (o.id = ++He), ++o.awaits, o.echoes += Ke, o.id;
		}
		function w() {
			return !!o.awaits && (0 == --o.awaits && (o.id = 0), o.echoes = o.awaits * Ke, !0);
		}
		function rt(e) {
			return o.echoes && e && e.constructor === Ae ? (nt(), e.then(function(e) {
				return w(), e;
			}, function(e) {
				return w(), S(e);
			})) : e;
		}
		function it() {
			var e = Je[Je.length - 1];
			Je.pop(), h(e, !1);
		}
		function h(e, t) {
			var n, r, i = P;
			(t ? !o.echoes || Ze++ && e === P : !Ze || --Ze && e === P) || queueMicrotask(t ? function(e) {
				++et, o.echoes && 0 != --o.echoes || (o.echoes = o.awaits = o.id = 0), Je.push(P), h(e, !0);
			}.bind(null, e) : it), e !== P && (P = e, i === s && (s.env = ot()), je) && (n = s.env.Promise, r = e.env, i.global || e.global) && (Object.defineProperty(f, "Promise", r.PromiseProp), n.all = r.all, n.race = r.race, n.resolve = r.resolve, n.reject = r.reject, r.allSettled && (n.allSettled = r.allSettled), r.any) && (n.any = r.any);
		}
		function ot() {
			var e = f.Promise;
			return je ? {
				Promise: e,
				PromiseProp: Object.getOwnPropertyDescriptor(f, "Promise"),
				all: e.all,
				race: e.race,
				allSettled: e.allSettled,
				any: e.any,
				resolve: e.resolve,
				reject: e.reject
			} : {};
		}
		function at(e, t, n, r, i) {
			var o = P;
			try {
				return h(e, !0), t(n, r, i);
			} finally {
				h(o, !1);
			}
		}
		function ut(t, n, r, i) {
			return "function" != typeof t ? t : function() {
				var e = P;
				r && nt(), h(n, !0);
				try {
					return t.apply(this, arguments);
				} finally {
					h(e, !1), i && queueMicrotask(w);
				}
			};
		}
		function st(e) {
			Promise === Ae && 0 === o.echoes ? 0 === Ze ? e() : enqueueNativeMicroTask(e) : setTimeout(e, 0);
		}
		-1 === ("" + Se).indexOf("[native code]") && (nt = w = g);
		var S = K.reject;
		var ct = String.fromCharCode(65535), A = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.", lt = "String expected.", ft = "__dbnames", ht = "readonly", dt = "readwrite";
		function pt(e, t) {
			return e ? t ? function() {
				return e.apply(this, arguments) && t.apply(this, arguments);
			} : e : t;
		}
		var yt = {
			type: 3,
			lower: -Infinity,
			lowerOpen: !1,
			upper: [[]],
			upperOpen: !1
		};
		function vt(t) {
			return "string" != typeof t || /\./.test(t) ? function(e) {
				return e;
			} : function(e) {
				return void 0 === e[t] && t in e && delete (e = ee(e))[t], e;
			};
		}
		function mt() {
			throw k.Type("Entity instances must never be new:ed. Instances are generated by the framework bypassing the constructor.");
		}
		function j(e, t) {
			try {
				var n = bt(e), r = bt(t);
				if (n !== r) return "Array" === n ? 1 : "Array" === r ? -1 : "binary" === n ? 1 : "binary" === r ? -1 : "string" === n ? 1 : "string" === r ? -1 : "Date" === n ? 1 : "Date" !== r ? NaN : -1;
				switch (n) {
					case "number":
					case "Date":
					case "string": return t < e ? 1 : e < t ? -1 : 0;
					case "binary":
						for (var i = gt(e), o = gt(t), a = i.length, u = o.length, s = a < u ? a : u, c = 0; c < s; ++c) if (i[c] !== o[c]) return i[c] < o[c] ? -1 : 1;
						return a === u ? 0 : a < u ? -1 : 1;
					case "Array":
						for (var l = e, f = t, h = l.length, d = f.length, p = h < d ? h : d, y = 0; y < p; ++y) {
							var v = j(l[y], f[y]);
							if (0 !== v) return v;
						}
						return h === d ? 0 : h < d ? -1 : 1;
				}
			} catch (e) {}
			return NaN;
		}
		function bt(e) {
			var t = typeof e;
			return "object" == t && (ArrayBuffer.isView(e) || "ArrayBuffer" === (t = ne(e))) ? "binary" : t;
		}
		function gt(e) {
			return e instanceof Uint8Array ? e : ArrayBuffer.isView(e) ? new Uint8Array(e.buffer, e.byteOffset, e.byteLength) : new Uint8Array(e);
		}
		function wt(t, n, r) {
			var e = t.schema.yProps;
			return e ? (n && 0 < r.numFailures && (n = n.filter(function(e, t) {
				return !r.failures[t];
			})), Promise.all(e.map(function(e) {
				e = e.updatesTable;
				return n ? t.db.table(e).where("k").anyOf(n).delete() : t.db.table(e).clear();
			})).then(function() {
				return r;
			})) : r;
		}
		xt.prototype.execute = function(e) {
			var t = this["@@propmod"];
			if (void 0 !== t.add) {
				var n = t.add;
				if (x(n)) return R(R([], x(e) ? e : [], !0), n, !0).sort();
				if ("number" == typeof n) return (Number(e) || 0) + n;
				if ("bigint" == typeof n) try {
					return BigInt(e) + n;
				} catch (e) {
					return BigInt(0) + n;
				}
				throw new TypeError("Invalid term ".concat(n));
			}
			if (void 0 !== t.remove) {
				var r = t.remove;
				if (x(r)) return x(e) ? e.filter(function(e) {
					return !r.includes(e);
				}).sort() : [];
				if ("number" == typeof r) return Number(e) - r;
				if ("bigint" == typeof r) try {
					return BigInt(e) - r;
				} catch (e) {
					return BigInt(0) - r;
				}
				throw new TypeError("Invalid subtrahend ".concat(r));
			}
			n = null == (n = t.replacePrefix) ? void 0 : n[0];
			return n && "string" == typeof e && e.startsWith(n) ? t.replacePrefix[1] + e.substring(n.length) : e;
		};
		var _t = xt;
		function xt(e) {
			this["@@propmod"] = e;
		}
		function kt(e, t) {
			for (var n = O(t), r = n.length, i = !1, o = 0; o < r; ++o) {
				var a = n[o], u = t[a], s = c(e, a);
				u instanceof _t ? (b(e, a, u.execute(s)), i = !0) : s !== u && (b(e, a, u), i = !0);
			}
			return i;
		}
		r.prototype._trans = function(e, r, t) {
			var n = this._tx || P.trans, i = this.name, o = l && "undefined" != typeof console && console.createTask && console.createTask("Dexie: ".concat("readonly" === e ? "read" : "write", " ").concat(this.name));
			function a(e, t, n) {
				if (n.schema[i]) return r(n.idbtrans, n);
				throw new k.NotFound("Table " + i + " not part of transaction");
			}
			var u = $e();
			try {
				var s = n && n.db._novip === this.db._novip ? n === P.trans ? n._promise(e, a, t) : v(function() {
					return n._promise(e, a, t);
				}, {
					trans: n,
					transless: P.transless || P
				}) : function t(n, r, i, o) {
					if (n.idbdb && (n._state.openComplete || P.letThrough || n._vip)) {
						var a = n._createTransaction(r, i, n._dbSchema);
						try {
							a.create(), n._state.PR1398_maxLoop = 3;
						} catch (e) {
							return e.name === de.InvalidState && n.isOpen() && 0 < --n._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), n.close({ disableAutoOpen: !1 }), n.open().then(function() {
								return t(n, r, i, o);
							})) : S(e);
						}
						return a._promise(r, function(e, t) {
							return v(function() {
								return P.trans = a, o(e, t, a);
							});
						}).then(function(e) {
							if ("readwrite" === r) try {
								a.idbtrans.commit();
							} catch (e) {}
							return "readonly" === r ? e : a._completion.then(function() {
								return e;
							});
						});
					}
					if (n._state.openComplete) return S(new k.DatabaseClosed(n._state.dbOpenError));
					if (!n._state.isBeingOpened) {
						if (!n._state.autoOpen) return S(new k.DatabaseClosed());
						n.open().catch(g);
					}
					return n._state.dbReadyPromise.then(function() {
						return t(n, r, i, o);
					});
				}(this.db, e, [this.name], a);
				return o && (s._consoleTask = o, s = s.catch(function(e) {
					return console.trace(e), S(e);
				})), s;
			} finally {
				u && Qe();
			}
		}, r.prototype.get = function(t, e) {
			var n = this;
			return t && t.constructor === Object ? this.where(t).first(e) : null == t ? S(new k.Type("Invalid argument to Table.get()")) : this._trans("readonly", function(e) {
				return n.core.get({
					trans: e,
					key: t
				}).then(function(e) {
					return n.hook.reading.fire(e);
				});
			}).then(e);
		}, r.prototype.where = function(o) {
			if ("string" == typeof o) return new this.db.WhereClause(this, o);
			if (x(o)) return new this.db.WhereClause(this, "[".concat(o.join("+"), "]"));
			var n = O(o);
			if (1 === n.length) return this.where(n[0]).equals(o[n[0]]);
			var e = this.schema.indexes.concat(this.schema.primKey).filter(function(t) {
				if (t.compound && n.every(function(e) {
					return 0 <= t.keyPath.indexOf(e);
				})) {
					for (var e = 0; e < n.length; ++e) if (-1 === n.indexOf(t.keyPath[e])) return !1;
					return !0;
				}
				return !1;
			}).sort(function(e, t) {
				return e.keyPath.length - t.keyPath.length;
			})[0];
			if (e && this.db._maxKey !== ct) return t = e.keyPath.slice(0, n.length), this.where(t).equals(t.map(function(e) {
				return o[e];
			}));
			!e && l && console.warn("The query ".concat(JSON.stringify(o), " on ").concat(this.name, " would benefit from a ") + "compound index [".concat(n.join("+"), "]"));
			var a = this.schema.idxByName;
			function u(e, t) {
				return 0 === j(e, t);
			}
			var t = n.reduce(function(e, t) {
				var n = e[0], e = e[1], r = a[t], i = o[t];
				return [n || r, n || !r ? pt(e, r && r.multi ? function(e) {
					e = c(e, t);
					return x(e) && e.some(function(e) {
						return u(i, e);
					});
				} : function(e) {
					return u(i, c(e, t));
				}) : e];
			}, [null, null]), r = t[0], t = t[1];
			return r ? this.where(r.name).equals(o[r.keyPath]).filter(t) : e ? this.filter(t) : this.where(n).equals("");
		}, r.prototype.filter = function(e) {
			return this.toCollection().and(e);
		}, r.prototype.count = function(e) {
			return this.toCollection().count(e);
		}, r.prototype.offset = function(e) {
			return this.toCollection().offset(e);
		}, r.prototype.limit = function(e) {
			return this.toCollection().limit(e);
		}, r.prototype.each = function(e) {
			return this.toCollection().each(e);
		}, r.prototype.toArray = function(e) {
			return this.toCollection().toArray(e);
		}, r.prototype.toCollection = function() {
			return new this.db.Collection(new this.db.WhereClause(this));
		}, r.prototype.orderBy = function(e) {
			return new this.db.Collection(new this.db.WhereClause(this, x(e) ? "[".concat(e.join("+"), "]") : e));
		}, r.prototype.reverse = function() {
			return this.toCollection().reverse();
		}, r.prototype.mapToClass = function(r) {
			for (var o = this.db, a = this.name, i = ((this.schema.mappedClass = r).prototype instanceof mt && (r = ((e) => {
				var t = i, n = e;
				if ("function" != typeof n && null !== n) throw new TypeError("Class extends value " + String(n) + " is not a constructor or null");
				function r() {
					this.constructor = t;
				}
				function i() {
					return null !== e && e.apply(this, arguments) || this;
				}
				return B(t, n), t.prototype = null === n ? Object.create(n) : (r.prototype = n.prototype, new r()), Object.defineProperty(i.prototype, "db", {
					get: function() {
						return o;
					},
					enumerable: !1,
					configurable: !0
				}), i.prototype.table = function() {
					return a;
				}, i;
			})(r)), /* @__PURE__ */ new Set()), e = r.prototype; e; e = F(e)) Object.getOwnPropertyNames(e).forEach(function(e) {
				return i.add(e);
			});
			function t(e) {
				if (!e) return e;
				var t, n = Object.create(r.prototype);
				for (t in e) if (!i.has(t)) try {
					n[t] = e[t];
				} catch (e) {}
				return n;
			}
			return this.schema.readHook && this.hook.reading.unsubscribe(this.schema.readHook), this.schema.readHook = t, this.hook("reading", t), r;
		}, r.prototype.defineClass = function() {
			return this.mapToClass(function(e) {
				a(this, e);
			});
		}, r.prototype.add = function(t, n) {
			var r = this, e = this.schema.primKey, i = e.auto, o = e.keyPath, a = t;
			return o && i && (a = vt(o)(t)), this._trans("readwrite", function(e) {
				return r.core.mutate({
					trans: e,
					type: "add",
					keys: null != n ? [n] : null,
					values: [a]
				});
			}).then(function(e) {
				return e.numFailures ? K.reject(e.failures[0]) : e.lastResult;
			}).then(function(e) {
				if (o) try {
					b(t, o, e);
				} catch (e) {}
				return e;
			});
		}, r.prototype.upsert = function(r, i) {
			var o = this, a = this.schema.primKey.keyPath;
			return this._trans("readwrite", function(n) {
				return o.core.get({
					trans: n,
					key: r
				}).then(function(t) {
					var e = null != t ? t : {};
					return kt(e, i), a && b(e, a, r), o.core.mutate({
						trans: n,
						type: "put",
						values: [e],
						keys: [r],
						upsert: !0,
						updates: {
							keys: [r],
							changeSpecs: [i]
						}
					}).then(function(e) {
						return e.numFailures ? K.reject(e.failures[0]) : !!t;
					});
				});
			});
		}, r.prototype.update = function(e, t) {
			return "object" != typeof e || x(e) ? this.where(":id").equals(e).modify(t) : void 0 === (e = c(e, this.schema.primKey.keyPath)) ? S(new k.InvalidArgument("Given object does not contain its primary key")) : this.where(":id").equals(e).modify(t);
		}, r.prototype.put = function(t, n) {
			var r = this, e = this.schema.primKey, i = e.auto, o = e.keyPath, a = t;
			return o && i && (a = vt(o)(t)), this._trans("readwrite", function(e) {
				return r.core.mutate({
					trans: e,
					type: "put",
					values: [a],
					keys: null != n ? [n] : null
				});
			}).then(function(e) {
				return e.numFailures ? K.reject(e.failures[0]) : e.lastResult;
			}).then(function(e) {
				if (o) try {
					b(t, o, e);
				} catch (e) {}
				return e;
			});
		}, r.prototype.delete = function(t) {
			var n = this;
			return this._trans("readwrite", function(e) {
				return n.core.mutate({
					trans: e,
					type: "delete",
					keys: [t]
				}).then(function(e) {
					return wt(n, [t], e);
				}).then(function(e) {
					return e.numFailures ? K.reject(e.failures[0]) : void 0;
				});
			});
		}, r.prototype.clear = function() {
			var t = this;
			return this._trans("readwrite", function(e) {
				return t.core.mutate({
					trans: e,
					type: "deleteRange",
					range: yt
				}).then(function(e) {
					return wt(t, null, e);
				});
			}).then(function(e) {
				return e.numFailures ? K.reject(e.failures[0]) : void 0;
			});
		}, r.prototype.bulkGet = function(t) {
			var n = this;
			return this._trans("readonly", function(e) {
				return n.core.getMany({
					keys: t,
					trans: e
				}).then(function(e) {
					return e.map(function(e) {
						return n.hook.reading.fire(e);
					});
				});
			});
		}, r.prototype.bulkAdd = function(i, e, t) {
			var o = this, a = Array.isArray(e) ? e : void 0, u = (t = t || (a ? void 0 : e)) ? t.allKeys : void 0;
			return this._trans("readwrite", function(e) {
				var t = o.schema.primKey, n = t.auto, t = t.keyPath;
				if (t && a) throw new k.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
				if (a && a.length !== i.length) throw new k.InvalidArgument("Arguments objects and keys must have the same length");
				var r = i.length, n = t && n ? i.map(vt(t)) : i;
				return o.core.mutate({
					trans: e,
					type: "add",
					keys: a,
					values: n,
					wantResults: u
				}).then(function(e) {
					var t = e.numFailures, n = e.failures;
					if (0 === t) return u ? e.results : e.lastResult;
					throw new he("".concat(o.name, ".bulkAdd(): ").concat(t, " of ").concat(r, " operations failed"), n);
				});
			});
		}, r.prototype.bulkPut = function(i, e, t) {
			var o = this, a = Array.isArray(e) ? e : void 0, u = (t = t || (a ? void 0 : e)) ? t.allKeys : void 0;
			return this._trans("readwrite", function(e) {
				var t = o.schema.primKey, n = t.auto, t = t.keyPath;
				if (t && a) throw new k.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
				if (a && a.length !== i.length) throw new k.InvalidArgument("Arguments objects and keys must have the same length");
				var r = i.length, n = t && n ? i.map(vt(t)) : i;
				return o.core.mutate({
					trans: e,
					type: "put",
					keys: a,
					values: n,
					wantResults: u
				}).then(function(e) {
					var t = e.numFailures, n = e.failures;
					if (0 === t) return u ? e.results : e.lastResult;
					throw new he("".concat(o.name, ".bulkPut(): ").concat(t, " of ").concat(r, " operations failed"), n);
				});
			});
		}, r.prototype.bulkUpdate = function(t) {
			var h = this, n = this.core, r = t.map(function(e) {
				return e.key;
			}), i = t.map(function(e) {
				return e.changes;
			}), d = [];
			return this._trans("readwrite", function(e) {
				return n.getMany({
					trans: e,
					keys: r,
					cache: "clone"
				}).then(function(c) {
					var l = [], f = [], s = (t.forEach(function(e, t) {
						var n = e.key, r = e.changes, i = c[t];
						if (i) {
							for (var o = 0, a = Object.keys(r); o < a.length; o++) {
								var u = a[o], s = r[u];
								if (u === h.schema.primKey.keyPath) {
									if (0 !== j(s, n)) throw new k.Constraint("Cannot update primary key in bulkUpdate()");
								} else b(i, u, s);
							}
							d.push(t), l.push(n), f.push(i);
						}
					}), l.length);
					return n.mutate({
						trans: e,
						type: "put",
						keys: l,
						values: f,
						updates: {
							keys: r,
							changeSpecs: i
						}
					}).then(function(e) {
						var t = e.numFailures, n = e.failures;
						if (0 === t) return s;
						for (var r = 0, i = Object.keys(n); r < i.length; r++) {
							var o, a = i[r], u = d[Number(a)];
							null != u && (o = n[a], delete n[a], n[u] = o);
						}
						throw new he("".concat(h.name, ".bulkUpdate(): ").concat(t, " of ").concat(s, " operations failed"), n);
					});
				});
			});
		}, r.prototype.bulkDelete = function(t) {
			var r = this, i = t.length;
			return this._trans("readwrite", function(e) {
				return r.core.mutate({
					trans: e,
					type: "delete",
					keys: t
				}).then(function(e) {
					return wt(r, t, e);
				});
			}).then(function(e) {
				var t = e.numFailures, n = e.failures;
				if (0 === t) return e.lastResult;
				throw new he("".concat(r.name, ".bulkDelete(): ").concat(t, " of ").concat(i, " operations failed"), n);
			});
		};
		var Ot = r;
		function r() {}
		function Pt(i) {
			function t(e, t) {
				if (t) {
					for (var n = arguments.length, r = new Array(n - 1); --n;) r[n - 1] = arguments[n];
					return a[e].subscribe.apply(null, r), i;
				}
				if ("string" == typeof e) return a[e];
			}
			var a = {};
			t.addEventType = u;
			for (var e = 1, n = arguments.length; e < n; ++e) u(arguments[e]);
			return t;
			function u(e, n, r) {
				var i, o;
				if ("object" != typeof e) return n = n || xe, o = {
					subscribers: [],
					fire: r = r || g,
					subscribe: function(e) {
						-1 === o.subscribers.indexOf(e) && (o.subscribers.push(e), o.fire = n(o.fire, e));
					},
					unsubscribe: function(t) {
						o.subscribers = o.subscribers.filter(function(e) {
							return e !== t;
						}), o.fire = o.subscribers.reduce(n, r);
					}
				}, a[e] = t[e] = o;
				O(i = e).forEach(function(e) {
					var t = i[e];
					if (x(t)) u(e, i[e][0], i[e][1]);
					else {
						if ("asap" !== t) throw new k.InvalidArgument("Invalid event config");
						var n = u(e, ve, function() {
							for (var e = arguments.length, t = new Array(e); e--;) t[e] = arguments[e];
							n.subscribers.forEach(function(e) {
								Q(function() {
									e.apply(null, t);
								});
							});
						});
					}
				});
			}
		}
		function Kt(e, t) {
			return U(t).from({ prototype: e }), t;
		}
		function Et(e, t) {
			return !(e.filter || e.algorithm || e.or) && (t ? e.justLimit : !e.replayFilter);
		}
		function St(e, t) {
			e.filter = pt(e.filter, t);
		}
		function At(e, t, n) {
			var r = e.replayFilter;
			e.replayFilter = r ? function() {
				return pt(r(), t());
			} : t, e.justLimit = n && !r;
		}
		function jt(e, t) {
			if (e.isPrimKey) return t.primaryKey;
			var n = t.getIndexByKeyPath(e.index);
			if (n) return n;
			throw new k.Schema("KeyPath " + e.index + " on object store " + t.name + " is not indexed");
		}
		function Ct(e, t, n) {
			var r = jt(e, t.schema);
			return t.openCursor({
				trans: n,
				values: !e.keysOnly,
				reverse: "prev" === e.dir,
				unique: !!e.unique,
				query: {
					index: r,
					range: e.range
				}
			});
		}
		function Tt(e, o, t, n) {
			var a, r, u = e.replayFilter ? pt(e.filter, e.replayFilter()) : e.filter;
			return e.or ? (a = {}, r = function(e, t, n) {
				var r, i;
				u && !u(t, n, function(e) {
					return t.stop(e);
				}, function(e) {
					return t.fail(e);
				}) || ("[object ArrayBuffer]" === (i = "" + (r = t.primaryKey)) && (i = "" + new Uint8Array(r)), m(a, i)) || (a[i] = !0, o(e, t, n));
			}, Promise.all([e.or._iterate(r, t), It(Ct(e, n, t), e.algorithm, r, !e.keysOnly && e.valueMapper)])) : It(Ct(e, n, t), pt(e.algorithm, u), o, !e.keysOnly && e.valueMapper);
		}
		function It(e, r, i, o) {
			var a = E(o ? function(e, t, n) {
				return i(o(e), t, n);
			} : i);
			return e.then(function(n) {
				if (n) return n.start(function() {
					var t = function() {
						return n.continue();
					};
					r && !r(n, function(e) {
						return t = e;
					}, function(e) {
						n.stop(e), t = g;
					}, function(e) {
						n.fail(e), t = g;
					}) || a(n.value, n, function(e) {
						return t = e;
					}), t();
				});
			});
		}
		i.prototype._read = function(e, t) {
			var n = this._ctx;
			return n.error ? n.table._trans(null, S.bind(null, n.error)) : n.table._trans("readonly", e).then(t);
		}, i.prototype._write = function(e) {
			var t = this._ctx;
			return t.error ? t.table._trans(null, S.bind(null, t.error)) : t.table._trans("readwrite", e, "locked");
		}, i.prototype._addAlgorithm = function(e) {
			var t = this._ctx;
			t.algorithm = pt(t.algorithm, e);
		}, i.prototype._iterate = function(e, t) {
			return Tt(this._ctx, e, t, this._ctx.table.core);
		}, i.prototype.clone = function(e) {
			var t = Object.create(this.constructor.prototype), n = Object.create(this._ctx);
			return e && a(n, e), t._ctx = n, t;
		}, i.prototype.raw = function() {
			return this._ctx.valueMapper = null, this;
		}, i.prototype.each = function(t) {
			var n = this._ctx;
			return this._read(function(e) {
				return Tt(n, t, e, n.table.core);
			});
		}, i.prototype.count = function(e) {
			var i = this;
			return this._read(function(e) {
				var t, n = i._ctx, r = n.table.core;
				return Et(n, !0) ? r.count({
					trans: e,
					query: {
						index: jt(n, r.schema),
						range: n.range
					}
				}).then(function(e) {
					return Math.min(e, n.limit);
				}) : (t = 0, Tt(n, function() {
					return ++t, !1;
				}, e, r).then(function() {
					return t;
				}));
			}).then(e);
		}, i.prototype.sortBy = function(e, t) {
			var n = e.split(".").reverse(), r = n[0], i = n.length - 1;
			function o(e, t) {
				return t ? o(e[n[t]], t - 1) : e[r];
			}
			var a = "next" === this._ctx.dir ? 1 : -1;
			function u(e, t) {
				return j(o(e, i), o(t, i)) * a;
			}
			return this.toArray(function(e) {
				return e.slice().sort(u);
			}).then(t);
		}, i.prototype.toArray = function(e) {
			var o = this;
			return this._read(function(e) {
				var t, n, r, i = o._ctx;
				return Et(i, !0) && 0 < i.limit ? (t = i.valueMapper, n = jt(i, i.table.core.schema), i.table.core.query({
					trans: e,
					limit: i.limit,
					values: !0,
					direction: "prev" === i.dir ? "prev" : void 0,
					query: {
						index: n,
						range: i.range
					}
				}).then(function(e) {
					e = e.result;
					return t ? e.map(t) : e;
				})) : (r = [], Tt(i, function(e) {
					return r.push(e);
				}, e, i.table.core).then(function() {
					return r;
				}));
			}, e);
		}, i.prototype.offset = function(t) {
			var e = this._ctx;
			return t <= 0 || (e.offset += t, Et(e) ? At(e, function() {
				var n = t;
				return function(e, t) {
					return 0 === n || (1 === n ? --n : t(function() {
						e.advance(n), n = 0;
					}), !1);
				};
			}) : At(e, function() {
				var e = t;
				return function() {
					return --e < 0;
				};
			})), this;
		}, i.prototype.limit = function(e) {
			return this._ctx.limit = Math.min(this._ctx.limit, e), At(this._ctx, function() {
				var r = e;
				return function(e, t, n) {
					return --r <= 0 && t(n), 0 <= r;
				};
			}, !0), this;
		}, i.prototype.until = function(r, i) {
			return St(this._ctx, function(e, t, n) {
				return !r(e.value) || (t(n), i);
			}), this;
		}, i.prototype.first = function(e) {
			return this.limit(1).toArray(function(e) {
				return e[0];
			}).then(e);
		}, i.prototype.last = function(e) {
			return this.reverse().first(e);
		}, i.prototype.filter = function(t) {
			var e;
			return St(this._ctx, function(e) {
				return t(e.value);
			}), (e = this._ctx).isMatch = pt(e.isMatch, t), this;
		}, i.prototype.and = function(e) {
			return this.filter(e);
		}, i.prototype.or = function(e) {
			return new this.db.WhereClause(this._ctx.table, e, this);
		}, i.prototype.reverse = function() {
			return this._ctx.dir = "prev" === this._ctx.dir ? "next" : "prev", this._ondirectionchange && this._ondirectionchange(this._ctx.dir), this;
		}, i.prototype.desc = function() {
			return this.reverse();
		}, i.prototype.eachKey = function(n) {
			var e = this._ctx;
			return e.keysOnly = !e.isMatch, this.each(function(e, t) {
				n(t.key, t);
			});
		}, i.prototype.eachUniqueKey = function(e) {
			return this._ctx.unique = "unique", this.eachKey(e);
		}, i.prototype.eachPrimaryKey = function(n) {
			var e = this._ctx;
			return e.keysOnly = !e.isMatch, this.each(function(e, t) {
				n(t.primaryKey, t);
			});
		}, i.prototype.keys = function(e) {
			var t = this._ctx, n = (t.keysOnly = !t.isMatch, []);
			return this.each(function(e, t) {
				n.push(t.key);
			}).then(function() {
				return n;
			}).then(e);
		}, i.prototype.primaryKeys = function(e) {
			var n = this._ctx;
			if (Et(n, !0) && 0 < n.limit) return this._read(function(e) {
				var t = jt(n, n.table.core.schema);
				return n.table.core.query({
					trans: e,
					values: !1,
					limit: n.limit,
					direction: "prev" === n.dir ? "prev" : void 0,
					query: {
						index: t,
						range: n.range
					}
				});
			}).then(function(e) {
				return e.result;
			}).then(e);
			n.keysOnly = !n.isMatch;
			var r = [];
			return this.each(function(e, t) {
				r.push(t.primaryKey);
			}).then(function() {
				return r;
			}).then(e);
		}, i.prototype.uniqueKeys = function(e) {
			return this._ctx.unique = "unique", this.keys(e);
		}, i.prototype.firstKey = function(e) {
			return this.limit(1).keys(function(e) {
				return e[0];
			}).then(e);
		}, i.prototype.lastKey = function(e) {
			return this.reverse().firstKey(e);
		}, i.prototype.distinct = function() {
			var n, e = this._ctx, e = e.index && e.table.schema.idxByName[e.index];
			return e && e.multi && (n = {}, St(this._ctx, function(e) {
				var e = e.primaryKey.toString(), t = m(n, e);
				return n[e] = !0, !t;
			})), this;
		}, i.prototype.modify = function(x) {
			var n = this, k = this._ctx;
			return this._write(function(p) {
				function y(e, t) {
					var n = t.failures;
					u += e - t.numFailures;
					for (var r = 0, i = O(n); r < i.length; r++) {
						var o = i[r];
						a.push(n[o]);
					}
				}
				var v = "function" == typeof x ? x : function(e) {
					return kt(e, x);
				}, m = k.table.core, e = m.schema.primaryKey, b = e.outbound, g = e.extractKey, w = 200, e = n.db._options.modifyChunkSize, a = (e && (w = "object" == typeof e ? e[m.name] || e["*"] || 200 : e), []), u = 0, t = [], _ = x === Dt;
				return n.clone().primaryKeys().then(function(f) {
					function h(s) {
						var c = Math.min(w, f.length - s), l = f.slice(s, s + c);
						return (_ ? Promise.resolve([]) : m.getMany({
							trans: p,
							keys: l,
							cache: "immutable"
						})).then(function(e) {
							var n = [], t = [], r = b ? [] : null, i = _ ? l : [];
							if (!_) for (var o = 0; o < c; ++o) {
								var a = e[o], u = {
									value: ee(a),
									primKey: f[s + o]
								};
								!1 !== v.call(u, u.value, u) && (null == u.value ? i.push(f[s + o]) : b || 0 === j(g(a), g(u.value)) ? (t.push(u.value), b && r.push(f[s + o])) : (i.push(f[s + o]), n.push(u.value)));
							}
							return Promise.resolve(0 < n.length && m.mutate({
								trans: p,
								type: "add",
								values: n
							}).then(function(e) {
								for (var t in e.failures) i.splice(parseInt(t), 1);
								y(n.length, e);
							})).then(function() {
								return (0 < t.length || d && "object" == typeof x) && m.mutate({
									trans: p,
									type: "put",
									keys: r,
									values: t,
									criteria: d,
									changeSpec: "function" != typeof x && x,
									isAdditionalChunk: 0 < s
								}).then(function(e) {
									return y(t.length, e);
								});
							}).then(function() {
								return (0 < i.length || d && _) && m.mutate({
									trans: p,
									type: "delete",
									keys: i,
									criteria: d,
									isAdditionalChunk: 0 < s
								}).then(function(e) {
									return wt(k.table, i, e);
								}).then(function(e) {
									return y(i.length, e);
								});
							}).then(function() {
								return f.length > s + c && h(s + w);
							});
						});
					}
					var d = Et(k) && k.limit === Infinity && ("function" != typeof x || _) && {
						index: k.index,
						range: k.range
					};
					return h(0).then(function() {
						if (0 < a.length) throw new fe("Error modifying one or more objects", a, u, t);
						return f.length;
					});
				});
			});
		}, i.prototype.delete = function() {
			var i = this._ctx, n = i.range;
			return !Et(i) || i.table.schema.yProps || !i.isPrimKey && 3 !== n.type ? this.modify(Dt) : this._write(function(e) {
				var t = i.table.core.schema.primaryKey, r = n;
				return i.table.core.count({
					trans: e,
					query: {
						index: t,
						range: r
					}
				}).then(function(n) {
					return i.table.core.mutate({
						trans: e,
						type: "deleteRange",
						range: r
					}).then(function(e) {
						var t = e.failures, e = e.numFailures;
						if (e) throw new fe("Could not delete some values", Object.keys(t).map(function(e) {
							return t[e];
						}), n - e);
						return n - e;
					});
				});
			});
		};
		var qt = i;
		function i() {}
		var Dt = function(e, t) {
			return t.value = null;
		};
		function Bt(e, t) {
			return e < t ? -1 : e === t ? 0 : 1;
		}
		function Rt(e, t) {
			return t < e ? -1 : e === t ? 0 : 1;
		}
		function C(e, t, n) {
			e = e instanceof Lt ? new e.Collection(e) : e;
			return e._ctx.error = new (n || TypeError)(t), e;
		}
		function Ft(e) {
			return new e.Collection(e, function() {
				return Mt("");
			}).limit(0);
		}
		function Nt(e, s, n, r) {
			var i, c, l, f, h, d, p, y = n.length;
			if (!n.every(function(e) {
				return "string" == typeof e;
			})) return C(e, lt);
			function t(e) {
				i = "next" === e ? function(e) {
					return e.toUpperCase();
				} : function(e) {
					return e.toLowerCase();
				}, c = "next" === e ? function(e) {
					return e.toLowerCase();
				} : function(e) {
					return e.toUpperCase();
				}, l = "next" === e ? Bt : Rt;
				var t = n.map(function(e) {
					return {
						lower: c(e),
						upper: i(e)
					};
				}).sort(function(e, t) {
					return l(e.lower, t.lower);
				});
				f = t.map(function(e) {
					return e.upper;
				}), h = t.map(function(e) {
					return e.lower;
				}), p = "next" === (d = e) ? "" : r;
			}
			t("next");
			var e = new e.Collection(e, function() {
				return T(f[0], h[y - 1] + r);
			}), v = (e._ondirectionchange = function(e) {
				t(e);
			}, 0);
			return e._addAlgorithm(function(e, t, n) {
				var r = e.key;
				if ("string" == typeof r) {
					var i = c(r);
					if (s(i, h, v)) return !0;
					for (var o = null, a = v; a < y; ++a) {
						var u = ((e, t, n, r, i, o) => {
							for (var a = Math.min(e.length, r.length), u = -1, s = 0; s < a; ++s) {
								var c = t[s];
								if (c !== r[s]) return i(e[s], n[s]) < 0 ? e.substr(0, s) + n[s] + n.substr(s + 1) : i(e[s], r[s]) < 0 ? e.substr(0, s) + r[s] + n.substr(s + 1) : 0 <= u ? e.substr(0, u) + t[u] + n.substr(u + 1) : null;
								i(e[s], c) < 0 && (u = s);
							}
							return a < r.length && "next" === o ? e + n.substr(e.length) : a < e.length && "prev" === o ? e.substr(0, n.length) : u < 0 ? null : e.substr(0, u) + r[u] + n.substr(u + 1);
						})(r, i, f[a], h[a], l, d);
						null === u && null === o ? v = a + 1 : (null === o || 0 < l(o, u)) && (o = u);
					}
					t(null !== o ? function() {
						e.continue(o + p);
					} : n);
				}
				return !1;
			}), e;
		}
		function T(e, t, n, r) {
			return {
				type: 2,
				lower: e,
				upper: t,
				lowerOpen: n,
				upperOpen: r
			};
		}
		function Mt(e) {
			return {
				type: 1,
				lower: e,
				upper: e
			};
		}
		Object.defineProperty(d.prototype, "Collection", {
			get: function() {
				return this._ctx.table.db.Collection;
			},
			enumerable: !1,
			configurable: !0
		}), d.prototype.between = function(e, t, n, r) {
			n = !1 !== n, r = !0 === r;
			try {
				return 0 < this._cmp(e, t) || 0 === this._cmp(e, t) && (n || r) && (!n || !r) ? Ft(this) : new this.Collection(this, function() {
					return T(e, t, !n, !r);
				});
			} catch (e) {
				return C(this, A);
			}
		}, d.prototype.equals = function(e) {
			return null == e ? C(this, A) : new this.Collection(this, function() {
				return Mt(e);
			});
		}, d.prototype.above = function(e) {
			return null == e ? C(this, A) : new this.Collection(this, function() {
				return T(e, void 0, !0);
			});
		}, d.prototype.aboveOrEqual = function(e) {
			return null == e ? C(this, A) : new this.Collection(this, function() {
				return T(e, void 0, !1);
			});
		}, d.prototype.below = function(e) {
			return null == e ? C(this, A) : new this.Collection(this, function() {
				return T(void 0, e, !1, !0);
			});
		}, d.prototype.belowOrEqual = function(e) {
			return null == e ? C(this, A) : new this.Collection(this, function() {
				return T(void 0, e);
			});
		}, d.prototype.startsWith = function(e) {
			return "string" != typeof e ? C(this, lt) : this.between(e, e + ct, !0, !0);
		}, d.prototype.startsWithIgnoreCase = function(e) {
			return "" === e ? this.startsWith(e) : Nt(this, function(e, t) {
				return 0 === e.indexOf(t[0]);
			}, [e], ct);
		}, d.prototype.equalsIgnoreCase = function(e) {
			return Nt(this, function(e, t) {
				return e === t[0];
			}, [e], "");
		}, d.prototype.anyOfIgnoreCase = function() {
			var e = n.apply(ae, arguments);
			return 0 === e.length ? Ft(this) : Nt(this, function(e, t) {
				return -1 !== t.indexOf(e);
			}, e, "");
		}, d.prototype.startsWithAnyOfIgnoreCase = function() {
			var e = n.apply(ae, arguments);
			return 0 === e.length ? Ft(this) : Nt(this, function(t, e) {
				return e.some(function(e) {
					return 0 === t.indexOf(e);
				});
			}, e, ct);
		}, d.prototype.anyOf = function() {
			var e, i, t = this, o = n.apply(ae, arguments), a = this._cmp;
			try {
				o.sort(a);
			} catch (e) {
				return C(this, A);
			}
			return 0 === o.length ? Ft(this) : ((e = new this.Collection(this, function() {
				return T(o[0], o[o.length - 1]);
			}))._ondirectionchange = function(e) {
				a = "next" === e ? t._ascending : t._descending, o.sort(a);
			}, i = 0, e._addAlgorithm(function(e, t, n) {
				for (var r = e.key; 0 < a(r, o[i]);) if (++i === o.length) return t(n), !1;
				return 0 === a(r, o[i]) || (t(function() {
					e.continue(o[i]);
				}), !1);
			}), e);
		}, d.prototype.notEqual = function(e) {
			return this.inAnyRange([[-Infinity, e], [e, this.db._maxKey]], {
				includeLowers: !1,
				includeUppers: !1
			});
		}, d.prototype.noneOf = function() {
			var e = n.apply(ae, arguments);
			if (0 === e.length) return new this.Collection(this);
			try {
				e.sort(this._ascending);
			} catch (e) {
				return C(this, A);
			}
			var t = e.reduce(function(e, t) {
				return e ? e.concat([[e[e.length - 1][1], t]]) : [[-Infinity, t]];
			}, null);
			return t.push([e[e.length - 1], this.db._maxKey]), this.inAnyRange(t, {
				includeLowers: !1,
				includeUppers: !1
			});
		}, d.prototype.inAnyRange = function(e, t) {
			var o = this, a = this._cmp, u = this._ascending, n = this._descending, s = this._min, c = this._max;
			if (0 === e.length) return Ft(this);
			if (!e.every(function(e) {
				return void 0 !== e[0] && void 0 !== e[1] && u(e[0], e[1]) <= 0;
			})) return C(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", k.InvalidArgument);
			var r = !t || !1 !== t.includeLowers, i = t && !0 === t.includeUppers;
			var l, f = u;
			function h(e, t) {
				return f(e[0], t[0]);
			}
			try {
				(l = e.reduce(function(e, t) {
					for (var n = 0, r = e.length; n < r; ++n) {
						var i = e[n];
						if (a(t[0], i[1]) < 0 && 0 < a(t[1], i[0])) {
							i[0] = s(i[0], t[0]), i[1] = c(i[1], t[1]);
							break;
						}
					}
					return n === r && e.push(t), e;
				}, [])).sort(h);
			} catch (e) {
				return C(this, A);
			}
			var d = 0, p = i ? function(e) {
				return 0 < u(e, l[d][1]);
			} : function(e) {
				return 0 <= u(e, l[d][1]);
			}, y = r ? function(e) {
				return 0 < n(e, l[d][0]);
			} : function(e) {
				return 0 <= n(e, l[d][0]);
			};
			var v = p, t = new this.Collection(this, function() {
				return T(l[0][0], l[l.length - 1][1], !r, !i);
			});
			return t._ondirectionchange = function(e) {
				f = "next" === e ? (v = p, u) : (v = y, n), l.sort(h);
			}, t._addAlgorithm(function(e, t, n) {
				for (var r, i = e.key; v(i);) if (++d === l.length) return t(n), !1;
				return !p(r = i) && !y(r) || (0 === o._cmp(i, l[d][1]) || 0 === o._cmp(i, l[d][0]) || t(function() {
					f === u ? e.continue(l[d][0]) : e.continue(l[d][1]);
				}), !1);
			}), t;
		}, d.prototype.startsWithAnyOf = function() {
			var e = n.apply(ae, arguments);
			return e.every(function(e) {
				return "string" == typeof e;
			}) ? 0 === e.length ? Ft(this) : this.inAnyRange(e.map(function(e) {
				return [e, e + ct];
			})) : C(this, "startsWithAnyOf() only works with strings");
		};
		var Lt = d;
		function d() {}
		function I(t) {
			return E(function(e) {
				return Ut(e), t(e.target.error), !1;
			});
		}
		function Ut(e) {
			e.stopPropagation && e.stopPropagation(), e.preventDefault && e.preventDefault();
		}
		var zt = "storagemutated", Vt = "x-storagemutated-1", Wt = Pt(null, zt), Yt = (p.prototype._lock = function() {
			return $(!P.global), ++this._reculock, 1 !== this._reculock || P.global || (P.lockOwnerFor = this), this;
		}, p.prototype._unlock = function() {
			if ($(!P.global), 0 == --this._reculock) for (P.global || (P.lockOwnerFor = null); 0 < this._blockedFuncs.length && !this._locked();) {
				var e = this._blockedFuncs.shift();
				try {
					at(e[1], e[0]);
				} catch (e) {}
			}
			return this;
		}, p.prototype._locked = function() {
			return this._reculock && P.lockOwnerFor !== this;
		}, p.prototype.create = function(t) {
			var n = this;
			if (this.mode) {
				var e = this.db.idbdb, r = this.db._state.dbOpenError;
				if ($(!this.idbtrans), !t && !e) switch (r && r.name) {
					case "DatabaseClosedError": throw new k.DatabaseClosed(r);
					case "MissingAPIError": throw new k.MissingAPI(r.message, r);
					default: throw new k.OpenFailed(r);
				}
				if (!this.active) throw new k.TransactionInactive();
				$(null === this._completion._state), (t = this.idbtrans = t || (this.db.core || e).transaction(this.storeNames, this.mode, { durability: this.chromeTransactionDurability })).onerror = E(function(e) {
					Ut(e), n._reject(t.error);
				}), t.onabort = E(function(e) {
					Ut(e), n.active && n._reject(new k.Abort(t.error)), n.active = !1, n.on("abort").fire(e);
				}), t.oncomplete = E(function() {
					n.active = !1, n._resolve(), "mutatedParts" in t && Wt.storagemutated.fire(t.mutatedParts);
				});
			}
			return this;
		}, p.prototype._promise = function(n, r, i) {
			var e, o = this;
			return "readwrite" === n && "readwrite" !== this.mode ? S(new k.ReadOnly("Transaction is readonly")) : this.active ? this._locked() ? new K(function(e, t) {
				o._blockedFuncs.push([function() {
					o._promise(n, r, i).then(e, t);
				}, P]);
			}) : i ? v(function() {
				var e = new K(function(e, t) {
					o._lock();
					var n = r(e, t, o);
					n && n.then && n.then(e, t);
				});
				return e.finally(function() {
					return o._unlock();
				}), e._lib = !0, e;
			}) : ((e = new K(function(e, t) {
				var n = r(e, t, o);
				n && n.then && n.then(e, t);
			}))._lib = !0, e) : S(new k.TransactionInactive());
		}, p.prototype._root = function() {
			return this.parent ? this.parent._root() : this;
		}, p.prototype.waitFor = function(e) {
			var t, r = this._root(), i = K.resolve(e), o = (r._waitingFor ? r._waitingFor = r._waitingFor.then(function() {
				return i;
			}) : (r._waitingFor = i, r._waitingQueue = [], t = r.idbtrans.objectStore(r.storeNames[0]), function e() {
				for (++r._spinCount; r._waitingQueue.length;) r._waitingQueue.shift()();
				r._waitingFor && (t.get(-Infinity).onsuccess = e);
			}()), r._waitingFor);
			return new K(function(t, n) {
				i.then(function(e) {
					return r._waitingQueue.push(E(t.bind(null, e)));
				}, function(e) {
					return r._waitingQueue.push(E(n.bind(null, e)));
				}).finally(function() {
					r._waitingFor === o && (r._waitingFor = null);
				});
			});
		}, p.prototype.abort = function() {
			this.active && (this.active = !1, this.idbtrans && this.idbtrans.abort(), this._reject(new k.Abort()));
		}, p.prototype.table = function(e) {
			var t = this._memoizedTables || (this._memoizedTables = {});
			if (m(t, e)) return t[e];
			var n = this.schema[e];
			if (n) return (n = new this.db.Table(e, n, this)).core = this.db.core.table(e), t[e] = n;
			throw new k.NotFound("Table " + e + " not part of transaction");
		}, p);
		function p() {}
		function $t(e, t, n, r, i, o, a, u) {
			return {
				name: e,
				keyPath: t,
				unique: n,
				multi: r,
				auto: i,
				compound: o,
				src: (n && !a ? "&" : "") + (r ? "*" : "") + (i ? "++" : "") + Qt(t),
				type: u
			};
		}
		function Qt(e) {
			return "string" == typeof e ? e : e ? "[" + [].join.call(e, "+") + "]" : "";
		}
		function Gt(e, t, n) {
			return {
				name: e,
				primKey: t,
				indexes: n,
				mappedClass: null,
				idxByName: (r = function(e) {
					return [e.name, e];
				}, n.reduce(function(e, t, n) {
					t = r(t, n);
					return t && (e[t[0]] = t[1]), e;
				}, {}))
			};
			var r;
		}
		var Xt = function(e) {
			try {
				return e.only([[]]), Xt = function() {
					return [[]];
				}, [[]];
			} catch (e) {
				return Xt = function() {
					return ct;
				}, ct;
			}
		};
		function Ht(t) {
			return null == t ? function() {} : "string" == typeof t ? 1 === (n = t).split(".").length ? function(e) {
				return e[n];
			} : function(e) {
				return c(e, n);
			} : function(e) {
				return c(e, t);
			};
			var n;
		}
		function Jt(e) {
			return [].slice.call(e);
		}
		var Zt = 0;
		function en(e) {
			return null == e ? ":id" : "string" == typeof e ? e : "[".concat(e.join("+"), "]");
		}
		function tn(e, i, t) {
			function _(e) {
				if (3 === e.type) return null;
				if (4 === e.type) throw new Error("Cannot convert never type to IDBKeyRange");
				var t = e.lower, n = e.upper, r = e.lowerOpen, e = e.upperOpen;
				return void 0 === t ? void 0 === n ? null : i.upperBound(n, !!e) : void 0 === n ? i.lowerBound(t, !!r) : i.bound(t, n, !!r, !!e);
			}
			function n(e) {
				var p, y, w = e.name;
				return {
					name: w,
					schema: e,
					mutate: function(e) {
						var y = e.trans, v = e.type, m = e.keys, b = e.values, g = e.range;
						return new Promise(function(t, e) {
							t = E(t);
							var n = y.objectStore(w), r = null == n.keyPath, i = "put" === v || "add" === v;
							if (!i && "delete" !== v && "deleteRange" !== v) throw new Error("Invalid operation type: " + v);
							var o, a = (m || b || { length: 1 }).length;
							if (m && b && m.length !== b.length) throw new Error("Given keys array must have same length as given values array.");
							if (0 === a) return t({
								numFailures: 0,
								failures: {},
								results: [],
								lastResult: void 0
							});
							function u(e) {
								++l, Ut(e);
							}
							var s = [], c = [], l = 0;
							if ("deleteRange" === v) {
								if (4 === g.type) return t({
									numFailures: l,
									failures: c,
									results: [],
									lastResult: void 0
								});
								3 === g.type ? s.push(o = n.clear()) : s.push(o = n.delete(_(g)));
							} else {
								var r = i ? r ? [b, m] : [b, null] : [m, null], f = r[0], h = r[1];
								if (i) for (var d = 0; d < a; ++d) s.push(o = h && void 0 !== h[d] ? n[v](f[d], h[d]) : n[v](f[d])), o.onerror = u;
								else for (d = 0; d < a; ++d) s.push(o = n[v](f[d])), o.onerror = u;
							}
							function p(e) {
								e = e.target.result, s.forEach(function(e, t) {
									return null != e.error && (c[t] = e.error);
								}), t({
									numFailures: l,
									failures: c,
									results: "delete" === v ? m : s.map(function(e) {
										return e.result;
									}),
									lastResult: e
								});
							}
							o.onerror = function(e) {
								u(e), p(e);
							}, o.onsuccess = p;
						});
					},
					getMany: function(e) {
						var f = e.trans, h = e.keys;
						return new Promise(function(t, e) {
							t = E(t);
							for (var n, r = f.objectStore(w), i = h.length, o = new Array(i), a = 0, u = 0, s = function(e) {
								e = e.target;
								o[e._pos] = e.result, ++u === a && t(o);
							}, c = I(e), l = 0; l < i; ++l) null != h[l] && ((n = r.get(h[l]))._pos = l, n.onsuccess = s, n.onerror = c, ++a);
							0 === a && t(o);
						});
					},
					get: function(e) {
						var r = e.trans, i = e.key;
						return new Promise(function(t, e) {
							t = E(t);
							var n = r.objectStore(w).get(i);
							n.onsuccess = function(e) {
								return t(e.target.result);
							}, n.onerror = I(e);
						});
					},
					query: (p = a, y = u, function(d) {
						return new Promise(function(t, e) {
							t = E(t);
							var n, r, i, o, a = d.trans, u = d.values, s = d.limit, c = d.query, l = null != (l = d.direction) ? l : "next", f = s === Infinity ? void 0 : s, h = c.index, c = c.range, a = a.objectStore(w), a = h.isPrimaryKey ? a : a.index(h.name), h = _(c);
							if (0 === s) return t({ result: [] });
							y ? (c = {
								query: h,
								count: f,
								direction: l
							}, (n = u ? a.getAll(c) : a.getAllKeys(c)).onsuccess = function(e) {
								return t({ result: e.target.result });
							}, n.onerror = I(e)) : p && "next" === l ? ((n = u ? a.getAll(h, f) : a.getAllKeys(h, f)).onsuccess = function(e) {
								return t({ result: e.target.result });
							}, n.onerror = I(e)) : (r = 0, i = !u && "openKeyCursor" in a ? a.openKeyCursor(h, l) : a.openCursor(h, l), o = [], i.onsuccess = function() {
								var e = i.result;
								return !e || (o.push(u ? e.value : e.primaryKey), ++r === s) ? t({ result: o }) : void e.continue();
							}, i.onerror = I(e));
						});
					}),
					openCursor: function(e) {
						var c = e.trans, o = e.values, a = e.query, u = e.reverse, l = e.unique;
						return new Promise(function(t, n) {
							t = E(t);
							var e = a.index, r = a.range, i = c.objectStore(w), i = e.isPrimaryKey ? i : i.index(e.name), e = u ? l ? "prevunique" : "prev" : l ? "nextunique" : "next", s = !o && "openKeyCursor" in i ? i.openKeyCursor(_(r), e) : i.openCursor(_(r), e);
							s.onerror = I(n), s.onsuccess = E(function(e) {
								var r, i, o, a, u = s.result;
								u ? (u.___id = ++Zt, u.done = !1, r = u.continue.bind(u), i = (i = u.continuePrimaryKey) && i.bind(u), o = u.advance.bind(u), a = function() {
									throw new Error("Cursor not stopped");
								}, u.trans = c, u.stop = u.continue = u.continuePrimaryKey = u.advance = function() {
									throw new Error("Cursor not started");
								}, u.fail = E(n), u.next = function() {
									var e = this, t = 1;
									return this.start(function() {
										return t-- ? e.continue() : e.stop();
									}).then(function() {
										return e;
									});
								}, u.start = function(e) {
									function t() {
										if (s.result) try {
											e();
										} catch (e) {
											u.fail(e);
										}
										else u.done = !0, u.start = function() {
											throw new Error("Cursor behind last entry");
										}, u.stop();
									}
									var n = new Promise(function(t, e) {
										t = E(t), s.onerror = I(e), u.fail = e, u.stop = function(e) {
											u.stop = u.continue = u.continuePrimaryKey = u.advance = a, t(e);
										};
									});
									return s.onsuccess = E(function(e) {
										s.onsuccess = t, t();
									}), u.continue = r, u.continuePrimaryKey = i, u.advance = o, t(), n;
								}, t(u)) : t(null);
							}, n);
						});
					},
					count: function(e) {
						var t = e.query, i = e.trans, o = t.index, a = t.range;
						return new Promise(function(t, e) {
							var n = i.objectStore(w), n = o.isPrimaryKey ? n : n.index(o.name), r = _(a), r = r ? n.count(r) : n.count();
							r.onsuccess = E(function(e) {
								return t(e.target.result);
							}), r.onerror = I(e);
						});
					}
				};
			}
			r = t, o = Jt((t = e).objectStoreNames), s = 0 < o.length ? r.objectStore(o[0]) : {};
			var r, t = {
				schema: {
					name: t.name,
					tables: o.map(function(e) {
						return r.objectStore(e);
					}).map(function(t) {
						var e = t.keyPath, n = t.autoIncrement, r = x(e), i = {}, r = {
							name: t.name,
							primaryKey: {
								name: null,
								isPrimaryKey: !0,
								outbound: null == e,
								compound: r,
								keyPath: e,
								autoIncrement: n,
								unique: !0,
								extractKey: Ht(e)
							},
							indexes: Jt(t.indexNames).map(function(e) {
								return t.index(e);
							}).map(function(e) {
								var t = e.name, n = e.unique, r = e.multiEntry, e = e.keyPath, t = {
									name: t,
									compound: x(e),
									keyPath: e,
									unique: n,
									multiEntry: r,
									extractKey: Ht(e)
								};
								return i[en(e)] = t;
							}),
							getIndexByKeyPath: function(e) {
								return i[en(e)];
							}
						};
						return i[":id"] = r.primaryKey, null != e && (i[en(e)] = r.primaryKey), r;
					})
				},
				hasGetAll: 0 < o.length && "getAll" in s && !("undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604),
				hasIdb3Features: "getAllRecords" in s
			}, o = t.schema, a = t.hasGetAll, u = t.hasIdb3Features, s = o.tables.map(n), c = {};
			return s.forEach(function(e) {
				return c[e.name] = e;
			}), {
				stack: "dbcore",
				transaction: e.transaction.bind(e),
				table: function(e) {
					if (c[e]) return c[e];
					throw new Error("Table '".concat(e, "' not found"));
				},
				MIN_KEY: -Infinity,
				MAX_KEY: Xt(i),
				schema: o
			};
		}
		function nn(e, t, n, r) {
			n = n.IDBKeyRange;
			return t = tn(t, n, r), { dbcore: e.dbcore.reduce(function(e, t) {
				t = t.create;
				return _(_({}, e), t(e));
			}, t) };
		}
		function rn(n, e) {
			var t = e.db, t = nn(n._middlewares, t, n._deps, e);
			n.core = t.dbcore, n.tables.forEach(function(e) {
				var t = e.name;
				n.core.schema.tables.some(function(e) {
					return e.name === t;
				}) && (e.core = n.core.table(t), n[t] instanceof n.Table) && (n[t].core = e.core);
			});
		}
		function on(i, e, t, o) {
			t.forEach(function(n) {
				var r = o[n];
				e.forEach(function(e) {
					var t = function e(t, n) {
						return z(t, n) || (t = F(t)) && e(t, n);
					}(e, n);
					(!t || "value" in t && void 0 === t.value) && (e === i.Transaction.prototype || e instanceof i.Transaction ? u(e, n, {
						get: function() {
							return this.table(n);
						},
						set: function(e) {
							L(this, n, {
								value: e,
								writable: !0,
								configurable: !0,
								enumerable: !0
							});
						}
					}) : e[n] = new i.Table(n, r));
				});
			});
		}
		function an(n, e) {
			e.forEach(function(e) {
				for (var t in e) e[t] instanceof n.Table && delete e[t];
			});
		}
		function un(e, t) {
			return e._cfg.version - t._cfg.version;
		}
		function sn(n, r, i, e) {
			var o = n._dbSchema, a = (i.objectStoreNames.contains("$meta") && !o.$meta && (o.$meta = Gt("$meta", vn("")[0], []), n._storeNames.push("$meta")), n._createTransaction("readwrite", n._storeNames, o)), u = (a.create(i), a._completion.catch(e), a._reject.bind(a)), s = P.transless || P;
			v(function() {
				if (P.trans = a, P.transless = s, 0 !== r) return rn(n, i), t = r, ((e = a).storeNames.includes("$meta") ? e.table("$meta").get("version").then(function(e) {
					return null != e ? e : t;
				}) : K.resolve(t)).then(function(e) {
					var s = n, c = e, l = a, f = i, t = [], e = s._versions, h = s._dbSchema = pn(0, s.idbdb, f);
					return 0 === (e = e.filter(function(e) {
						return e._cfg.version >= c;
					})).length ? K.resolve() : (e.forEach(function(u) {
						t.push(function() {
							var t, n, r, i = h, e = u._cfg.dbschema, o = (yn(s, i, f), yn(s, e, f), h = s._dbSchema = e, ln(i, e)), a = (o.add.forEach(function(e) {
								fn(f, e[0], e[1].primKey, e[1].indexes);
							}), o.change.forEach(function(e) {
								if (e.recreate) throw new k.Upgrade("Not yet support for changing primary key");
								var t = f.objectStore(e.name);
								e.add.forEach(function(e) {
									return dn(t, e);
								}), e.change.forEach(function(e) {
									t.deleteIndex(e.name), dn(t, e);
								}), e.del.forEach(function(e) {
									return t.deleteIndex(e);
								});
							}), u._cfg.contentUpgrade);
							if (a && u._cfg.version > c) return rn(s, f), l._memoizedTables = {}, t = G(e), o.del.forEach(function(e) {
								t[e] = i[e];
							}), an(s, [s.Transaction.prototype]), on(s, [s.Transaction.prototype], O(t), t), l.schema = t, (n = ue(a)) && nt(), e = K.follow(function() {
								var e;
								(r = a(l)) && n && (e = w.bind(null, null), r.then(e, e));
							}), r && "function" == typeof r.then ? K.resolve(r) : e.then(function() {
								return r;
							});
						}), t.push(function(e) {
							var t = u._cfg.dbschema, n = e;
							[].slice.call(n.db.objectStoreNames).forEach(function(e) {
								return null == t[e] && n.db.deleteObjectStore(e);
							}), an(s, [s.Transaction.prototype]), on(s, [s.Transaction.prototype], s._storeNames, s._dbSchema), l.schema = s._dbSchema;
						}), t.push(function(e) {
							s.idbdb.objectStoreNames.contains("$meta") && (Math.ceil(s.idbdb.version / 10) === u._cfg.version ? (s.idbdb.deleteObjectStore("$meta"), delete s._dbSchema.$meta, s._storeNames = s._storeNames.filter(function(e) {
								return "$meta" !== e;
							})) : e.objectStore("$meta").put(u._cfg.version, "version"));
						});
					}), function e() {
						return t.length ? K.resolve(t.shift()(l.idbtrans)).then(e) : K.resolve();
					}().then(function() {
						hn(h, f);
					}));
				}).catch(u);
				var e, t;
				O(o).forEach(function(e) {
					fn(i, e, o[e].primKey, o[e].indexes);
				}), rn(n, i), K.follow(function() {
					return n.on.populate.fire(a);
				}).catch(u);
			});
		}
		function cn(e, r) {
			hn(e._dbSchema, r), r.db.version % 10 != 0 || r.objectStoreNames.contains("$meta") || r.db.createObjectStore("$meta").add(Math.ceil(r.db.version / 10 - 1), "version");
			var t = pn(0, e.idbdb, r);
			yn(e, e._dbSchema, r);
			for (var n = 0, i = ln(t, e._dbSchema).change; n < i.length; n++) {
				var o = ((t) => {
					if (t.change.length || t.recreate) return console.warn("Unable to patch indexes of table ".concat(t.name, " because it has changes on the type of index or primary key.")), { value: void 0 };
					var n = r.objectStore(t.name);
					t.add.forEach(function(e) {
						l && console.debug("Dexie upgrade patch: Creating missing index ".concat(t.name, ".").concat(e.src)), dn(n, e);
					});
				})(i[n]);
				if ("object" == typeof o) return o.value;
			}
		}
		function ln(e, t) {
			var n, r = {
				del: [],
				add: [],
				change: []
			};
			for (n in e) t[n] || r.del.push(n);
			for (n in t) {
				var i = e[n], o = t[n];
				if (i) {
					var a = {
						name: n,
						def: o,
						recreate: !1,
						del: [],
						add: [],
						change: []
					};
					if ("" + (i.primKey.keyPath || "") != "" + (o.primKey.keyPath || "") || i.primKey.auto !== o.primKey.auto) a.recreate = !0, r.change.push(a);
					else {
						var u = i.idxByName, s = o.idxByName, c = void 0;
						for (c in u) s[c] || a.del.push(c);
						for (c in s) {
							var l = u[c], f = s[c];
							l ? l.src !== f.src && a.change.push(f) : a.add.push(f);
						}
						(0 < a.del.length || 0 < a.add.length || 0 < a.change.length) && r.change.push(a);
					}
				} else r.add.push([n, o]);
			}
			return r;
		}
		function fn(e, t, n, r) {
			var i = e.db.createObjectStore(t, n.keyPath ? {
				keyPath: n.keyPath,
				autoIncrement: n.auto
			} : { autoIncrement: n.auto });
			r.forEach(function(e) {
				return dn(i, e);
			});
		}
		function hn(t, n) {
			O(t).forEach(function(e) {
				n.db.objectStoreNames.contains(e) || (l && console.debug("Dexie: Creating missing table", e), fn(n, e, t[e].primKey, t[e].indexes));
			});
		}
		function dn(e, t) {
			e.createIndex(t.name, t.keyPath, {
				unique: t.unique,
				multiEntry: t.multi
			});
		}
		function pn(e, t, u) {
			var s = {};
			return W(t.objectStoreNames, 0).forEach(function(e) {
				for (var t = u.objectStore(e), n = $t(Qt(a = t.keyPath), a || "", !0, !1, !!t.autoIncrement, a && "string" != typeof a, !0), r = [], i = 0; i < t.indexNames.length; ++i) {
					var o = t.index(t.indexNames[i]), a = o.keyPath, o = $t(o.name, a, !!o.unique, !!o.multiEntry, !1, a && "string" != typeof a, !1);
					r.push(o);
				}
				s[e] = Gt(e, n, r);
			}), s;
		}
		function yn(e, t, n) {
			for (var r = n.db.objectStoreNames, i = 0; i < r.length; ++i) {
				var o = r[i], a = n.objectStore(o);
				e._hasGetAll = "getAll" in a;
				for (var u = 0; u < a.indexNames.length; ++u) {
					var s, c = a.indexNames[u], l = a.index(c).keyPath, l = "string" == typeof l ? l : "[" + W(l).join("+") + "]";
					t[o] && (s = t[o].idxByName[l]) && (s.name = c, delete t[o].idxByName[l], t[o].idxByName[c] = s);
				}
			}
			"undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && f.WorkerGlobalScope && f instanceof f.WorkerGlobalScope && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604 && (e._hasGetAll = !1);
		}
		function vn(e) {
			return e.split(",").map(function(e, t) {
				var n = e.split(":"), r = null == (r = n[1]) ? void 0 : r.trim(), n = (e = n[0].trim()).replace(/([&*]|\+\+)/g, ""), i = /^\[/.test(n) ? n.match(/^\[(.*)\]$/)[1].split("+") : n;
				return $t(n, i || null, /\&/.test(e), /\*/.test(e), /\+\+/.test(e), x(i), 0 === t, r);
			});
		}
		bn.prototype._createTableSchema = Gt, bn.prototype._parseIndexSyntax = vn, bn.prototype._parseStoresSpec = function(r, i) {
			var o = this;
			O(r).forEach(function(e) {
				if (null !== r[e]) {
					var t = o._parseIndexSyntax(r[e]), n = t.shift();
					if (!n) throw new k.Schema("Invalid schema for table " + e + ": " + r[e]);
					if (n.unique = !0, n.multi) throw new k.Schema("Primary key cannot be multiEntry*");
					t.forEach(function(e) {
						if (e.auto) throw new k.Schema("Only primary key can be marked as autoIncrement (++)");
						if (!e.keyPath) throw new k.Schema("Index must have a name and cannot be an empty string");
					});
					n = o._createTableSchema(e, n, t);
					i[e] = n;
				}
			});
		}, bn.prototype.stores = function(e) {
			var t = this.db, e = (this._cfg.storesSource = this._cfg.storesSource ? a(this._cfg.storesSource, e) : e, t._versions), n = {}, r = {};
			return e.forEach(function(e) {
				a(n, e._cfg.storesSource), r = e._cfg.dbschema = {}, e._parseStoresSpec(n, r);
			}), t._dbSchema = r, an(t, [
				t._allTables,
				t,
				t.Transaction.prototype
			]), on(t, [
				t._allTables,
				t,
				t.Transaction.prototype,
				this._cfg.tables
			], O(r), r), t._storeNames = O(r), this;
		}, bn.prototype.upgrade = function(e) {
			return this._cfg.contentUpgrade = ke(this._cfg.contentUpgrade || g, e), this;
		};
		var mn = bn;
		function bn() {}
		var gn = (() => {
			var i, o, t;
			return "undefined" != typeof FinalizationRegistry && "undefined" != typeof WeakRef ? (i = /* @__PURE__ */ new Set(), o = new FinalizationRegistry(function(e) {
				i.delete(e);
			}), {
				toArray: function() {
					return Array.from(i).map(function(e) {
						return e.deref();
					}).filter(function(e) {
						return void 0 !== e;
					});
				},
				add: function(e) {
					var t = new WeakRef(e._novip);
					i.add(t), o.register(e._novip, t, t), i.size > e._options.maxConnections && (t = i.values().next().value, i.delete(t), o.unregister(t));
				},
				remove: function(e) {
					if (e) for (var t = i.values(), n = t.next(); !n.done;) {
						var r = n.value;
						if (r.deref() === e._novip) return i.delete(r), void o.unregister(r);
						n = t.next();
					}
				}
			}) : (t = [], {
				toArray: function() {
					return t;
				},
				add: function(e) {
					t.push(e._novip);
				},
				remove: function(e) {
					e && -1 !== (e = t.indexOf(e._novip)) && t.splice(e, 1);
				}
			});
		})();
		function wn(e, t) {
			var n = e._dbNamesDB;
			return n || (n = e._dbNamesDB = new y(ft, {
				addons: [],
				indexedDB: e,
				IDBKeyRange: t
			})).version(1).stores({ dbnames: "name" }), n.table("dbnames");
		}
		function _n(e) {
			return e && "function" == typeof e.databases;
		}
		function xn(e) {
			return v(function() {
				return P.letThrough = !0, e();
			});
		}
		function kn(e) {
			return !("from" in e);
		}
		var q = function(e, t) {
			var n;
			if (!this) return n = new q(), e && "d" in e && a(n, e), n;
			a(this, arguments.length ? {
				d: 1,
				from: e,
				to: 1 < arguments.length ? t : e
			} : { d: 0 });
		};
		function On(e, t, n) {
			var r = j(t, n);
			if (!isNaN(r)) {
				if (0 < r) throw RangeError();
				if (kn(e)) return a(e, {
					from: t,
					to: n,
					d: 1
				});
				var r = e.l, i = e.r;
				if (j(n, e.from) < 0) return r ? On(r, t, n) : e.l = {
					from: t,
					to: n,
					d: 1,
					l: null,
					r: null
				}, Sn(e);
				if (0 < j(t, e.to)) return i ? On(i, t, n) : e.r = {
					from: t,
					to: n,
					d: 1,
					l: null,
					r: null
				}, Sn(e);
				j(t, e.from) < 0 && (e.from = t, e.l = null, e.d = i ? i.d + 1 : 1), 0 < j(n, e.to) && (e.to = n, e.r = null, e.d = e.l ? e.l.d + 1 : 1);
				t = !e.r;
				r && !e.l && Pn(e, r), i && t && Pn(e, i);
			}
		}
		function Pn(e, t) {
			kn(t) || function e(t, n) {
				var r = n.from, i = n.l, o = n.r;
				On(t, r, n.to), i && e(t, i), o && e(t, o);
			}(e, t);
		}
		function Kn(e, t) {
			var n = En(t), r = n.next();
			if (!r.done) for (var i = r.value, o = En(e), a = o.next(i.from), u = a.value; !r.done && !a.done;) {
				if (j(u.from, i.to) <= 0 && 0 <= j(u.to, i.from)) return !0;
				j(i.from, u.from) < 0 ? i = (r = n.next(u.from)).value : u = (a = o.next(i.from)).value;
			}
			return !1;
		}
		function En(e) {
			var n = kn(e) ? null : {
				s: 0,
				n: e
			};
			return { next: function(e) {
				for (var t = 0 < arguments.length; n;) switch (n.s) {
					case 0: if (n.s = 1, t) for (; n.n.l && j(e, n.n.from) < 0;) n = {
						up: n,
						n: n.n.l,
						s: 1
					};
					else for (; n.n.l;) n = {
						up: n,
						n: n.n.l,
						s: 1
					};
					case 1: if (n.s = 2, !t || j(e, n.n.to) <= 0) return {
						value: n.n,
						done: !1
					};
					case 2: if (n.n.r) {
						n.s = 3, n = {
							up: n,
							n: n.n.r,
							s: 0
						};
						continue;
					}
					case 3: n = n.up;
				}
				return { done: !0 };
			} };
		}
		function Sn(e) {
			var t, n, r, i = ((null == (i = e.r) ? void 0 : i.d) || 0) - ((null == (i = e.l) ? void 0 : i.d) || 0), i = 1 < i ? "r" : i < -1 ? "l" : "";
			i && (t = "r" == i ? "l" : "r", n = _({}, e), r = e[i], e.from = r.from, e.to = r.to, e[i] = r[i], n[i] = r[t], (e[t] = n).d = An(n)), e.d = An(e);
		}
		function An(e) {
			var t = e.r, e = e.l;
			return (t ? e ? Math.max(t.d, e.d) : t.d : e ? e.d : 0) + 1;
		}
		function jn(t, n) {
			return O(n).forEach(function(e) {
				t[e] ? Pn(t[e], n[e]) : t[e] = function e(t) {
					var n, r, i = {};
					for (n in t) m(t, n) && (r = t[n], i[n] = !r || "object" != typeof r || J.has(r.constructor) ? r : e(r));
					return i;
				}(n[e]);
			}), t;
		}
		function Cn(t, n) {
			return t.all || n.all || Object.keys(t).some(function(e) {
				return n[e] && Kn(n[e], t[e]);
			});
		}
		M(q.prototype, ((t = {
			add: function(e) {
				return Pn(this, e), this;
			},
			addKey: function(e) {
				return On(this, e, e), this;
			},
			addKeys: function(e) {
				var t = this;
				return e.forEach(function(e) {
					return On(t, e, e);
				}), this;
			},
			hasKey: function(e) {
				var t = En(this).next(e).value;
				return t && j(t.from, e) <= 0 && 0 <= j(t.to, e);
			}
		})[re] = function() {
			return En(this);
		}, t));
		var Tn = {}, In = {}, qn = !1;
		function Dn(e) {
			jn(In, e), qn || (qn = !0, setTimeout(function() {
				qn = !1, Bn(In, !(In = {}));
			}, 0));
		}
		function Bn(e, t) {
			void 0 === t && (t = !1);
			var n = /* @__PURE__ */ new Set();
			if (e.all) for (var r = 0, i = Object.values(Tn); r < i.length; r++) Rn(u = i[r], e, n, t);
			else for (var o in e) {
				var a, u, o = /^idb\:\/\/(.*)\/(.*)\//.exec(o);
				o && (a = o[1], o = o[2], u = Tn["idb://".concat(a, "/").concat(o)]) && Rn(u, e, n, t);
			}
			n.forEach(function(e) {
				return e();
			});
		}
		function Rn(e, t, n, r) {
			for (var i = [], o = 0, a = Object.entries(e.queries.query); o < a.length; o++) {
				for (var u = a[o], s = u[0], c = [], l = 0, f = u[1]; l < f.length; l++) {
					var h = f[l];
					Cn(t, h.obsSet) ? h.subscribers.forEach(function(e) {
						return n.add(e);
					}) : r && c.push(h);
				}
				r && i.push([s, c]);
			}
			if (r) for (var d = 0, p = i; d < p.length; d++) {
				var y = p[d], s = y[0], c = y[1];
				e.queries.query[s] = c;
			}
		}
		function Fn(h) {
			var d = h._state, r = h._deps.indexedDB;
			if (d.isBeingOpened || h.idbdb) return d.dbReadyPromise.then(function() {
				return d.dbOpenError ? S(d.dbOpenError) : h;
			});
			d.isBeingOpened = !0, d.dbOpenError = null, d.openComplete = !1;
			var t = d.openCanceller, p = Math.round(10 * h.verno), y = !1;
			function e() {
				if (d.openCanceller !== t) throw new k.DatabaseClosed("db.open() was cancelled");
			}
			function v() {
				return new K(function(c, n) {
					if (e(), !r) throw new k.MissingAPI();
					var l = h.name, f = d.autoSchema || !p ? r.open(l) : r.open(l, p);
					if (!f) throw new k.MissingAPI();
					f.onerror = I(n), f.onblocked = E(h._fireOnBlocked), f.onupgradeneeded = E(function(e) {
						var t;
						m = f.transaction, d.autoSchema && !h._options.allowEmptyDB ? (f.onerror = Ut, m.abort(), f.result.close(), (t = r.deleteDatabase(l)).onsuccess = t.onerror = E(function() {
							n(new k.NoSuchDatabase("Database ".concat(l, " doesnt exist")));
						})) : (m.onerror = I(n), t = e.oldVersion > Math.pow(2, 62) ? 0 : e.oldVersion, b = t < 1, h.idbdb = f.result, y && cn(h, m), sn(h, t / 10, m, n));
					}, n), f.onsuccess = E(function() {
						m = null;
						var e, t, n, r, i, o, a = h.idbdb = f.result, u = W(a.objectStoreNames);
						if (0 < u.length) try {
							var s = a.transaction(1 === (i = u).length ? i[0] : i, "readonly");
							if (d.autoSchema) o = a, r = s, (n = h).verno = o.version / 10, r = n._dbSchema = pn(0, o, r), n._storeNames = W(o.objectStoreNames, 0), on(n, [n._allTables], O(r), r);
							else if (yn(h, h._dbSchema, s), t = s, ((t = ln(pn(0, (e = h).idbdb, t), e._dbSchema)).add.length || t.change.some(function(e) {
								return e.add.length || e.change.length;
							})) && !y) return console.warn("Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Dexie will add missing parts and increment native version number to workaround this."), a.close(), p = a.version + 1, y = !0, c(v());
							rn(h, s);
						} catch (e) {}
						gn.add(h), a.onversionchange = E(function(e) {
							d.vcFired = !0, h.on("versionchange").fire(e);
						}), a.onclose = E(function() {
							h.close({ disableAutoOpen: !1 });
						}), b && (u = h._deps, i = l, _n(o = u.indexedDB) || i === ft || wn(o, u.IDBKeyRange).put({ name: i }).catch(g)), c();
					}, n);
				}).catch(function(e) {
					switch (null == e ? void 0 : e.name) {
						case "UnknownError":
							if (0 < d.PR1398_maxLoop) return d.PR1398_maxLoop--, console.warn("Dexie: Workaround for Chrome UnknownError on open()"), v();
							break;
						case "VersionError": if (0 < p) return p = 0, v();
					}
					return K.reject(e);
				});
			}
			var n, i = d.dbReadyResolve, m = null, b = !1;
			return K.race([t, ("undefined" == typeof navigator ? K.resolve() : !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent) && indexedDB.databases ? new Promise(function(e) {
				function t() {
					return indexedDB.databases().finally(e);
				}
				n = setInterval(t, 100), t();
			}).finally(function() {
				return clearInterval(n);
			}) : Promise.resolve()).then(v)]).then(function() {
				return e(), d.onReadyBeingFired = [], K.resolve(xn(function() {
					return h.on.ready.fire(h.vip);
				})).then(function e() {
					var t;
					if (0 < d.onReadyBeingFired.length) return t = d.onReadyBeingFired.reduce(ke, g), d.onReadyBeingFired = [], K.resolve(xn(function() {
						return t(h.vip);
					})).then(e);
				});
			}).finally(function() {
				d.openCanceller === t && (d.onReadyBeingFired = null, d.isBeingOpened = !1);
			}).catch(function(e) {
				d.dbOpenError = e;
				try {
					m && m.abort();
				} catch (e) {}
				return t === d.openCanceller && h._close(), S(e);
			}).finally(function() {
				d.openComplete = !0, i();
			}).then(function() {
				var n;
				return b && (n = {}, h.tables.forEach(function(t) {
					t.schema.indexes.forEach(function(e) {
						e.name && (n["idb://".concat(h.name, "/").concat(t.name, "/").concat(e.name)] = new q(-Infinity, [[[]]]));
					}), n["idb://".concat(h.name, "/").concat(t.name, "/")] = n["idb://".concat(h.name, "/").concat(t.name, "/:dels")] = new q(-Infinity, [[[]]]);
				}), Wt(zt).fire(n), Bn(n, !0)), h;
			});
		}
		function Nn(t) {
			function e(e) {
				return t.next(e);
			}
			var r = n(e), i = n(function(e) {
				return t.throw(e);
			});
			function n(n) {
				return function(e) {
					var e = n(e), t = e.value;
					return e.done ? t : t && "function" == typeof t.then ? t.then(r, i) : x(t) ? Promise.all(t).then(r, i) : r(t);
				};
			}
			return n(e)();
		}
		function Mn(e, t, n) {
			for (var r = x(e) ? e.slice() : [e], i = 0; i < n; ++i) r.push(t);
			return r;
		}
		var Ln = {
			stack: "dbcore",
			name: "VirtualIndexMiddleware",
			level: 1,
			create: function(l) {
				return _(_({}, l), { table: function(e) {
					var o = l.table(e), e = o.schema, u = Object.create(null), s = [];
					function c(e, t, n) {
						var r = en(e), i = u[r] = u[r] || [], o = null == e ? 0 : "string" == typeof e ? 1 : e.length, a = 0 < t, r = _(_({}, n), {
							name: a ? "".concat(r, "(virtual-from:").concat(n.name, ")") : n.name,
							lowLevelIndex: n,
							isVirtual: a,
							keyTail: t,
							keyLength: o,
							extractKey: Ht(e),
							unique: !a && n.unique
						});
						return i.push(r), r.isPrimaryKey || s.push(r), 1 < o && c(2 === o ? e[0] : e.slice(0, o - 1), t + 1, n), i.sort(function(e, t) {
							return e.keyTail - t.keyTail;
						}), r;
					}
					var t = c(e.primaryKey.keyPath, 0, e.primaryKey);
					u[":id"] = [t];
					for (var n = 0, r = e.indexes; n < r.length; n++) {
						var i = r[n];
						c(i.keyPath, 0, i);
					}
					function a(e) {
						var t, n = e.query.index;
						return n.isVirtual ? _(_({}, e), { query: {
							index: n.lowLevelIndex,
							range: (t = e.query.range, n = n.keyTail, {
								type: 1 === t.type ? 2 : t.type,
								lower: Mn(t.lower, t.lowerOpen ? l.MAX_KEY : l.MIN_KEY, n),
								lowerOpen: !0,
								upper: Mn(t.upper, t.upperOpen ? l.MIN_KEY : l.MAX_KEY, n),
								upperOpen: !0
							})
						} }) : e;
					}
					return _(_({}, o), {
						schema: _(_({}, e), {
							primaryKey: t,
							indexes: s,
							getIndexByKeyPath: function(e) {
								return (e = u[en(e)]) && e[0];
							}
						}),
						count: function(e) {
							return o.count(a(e));
						},
						query: function(e) {
							return o.query(a(e));
						},
						openCursor: function(t) {
							var e = t.query.index, r = e.keyTail, i = e.keyLength;
							return e.isVirtual ? o.openCursor(a(t)).then(function(e) {
								return e && n(e);
							}) : o.openCursor(t);
							function n(n) {
								return Object.create(n, {
									continue: { value: function(e) {
										null != e ? n.continue(Mn(e, t.reverse ? l.MAX_KEY : l.MIN_KEY, r)) : t.unique ? n.continue(n.key.slice(0, i).concat(t.reverse ? l.MIN_KEY : l.MAX_KEY, r)) : n.continue();
									} },
									continuePrimaryKey: { value: function(e, t) {
										n.continuePrimaryKey(Mn(e, l.MAX_KEY, r), t);
									} },
									primaryKey: { get: function() {
										return n.primaryKey;
									} },
									key: { get: function() {
										var e = n.key;
										return 1 === i ? e[0] : e.slice(0, i);
									} },
									value: { get: function() {
										return n.value;
									} }
								});
							}
						}
					});
				} });
			}
		};
		function Un(i, o, a, u) {
			return a = a || {}, u = u || "", O(i).forEach(function(e) {
				var t, n, r;
				m(o, e) ? (t = i[e], n = o[e], "object" == typeof t && "object" == typeof n && t && n ? (r = ne(t)) !== ne(n) ? a[u + e] = o[e] : "Object" === r ? Un(t, n, a, u + e + ".") : t !== n && (a[u + e] = o[e]) : t !== n && (a[u + e] = o[e])) : a[u + e] = void 0;
			}), O(o).forEach(function(e) {
				m(i, e) || (a[u + e] = o[e]);
			}), a;
		}
		function zn(e, t) {
			return "delete" === t.type ? t.keys : t.keys || t.values.map(e.extractKey);
		}
		var Vn = {
			stack: "dbcore",
			name: "HooksMiddleware",
			level: 2,
			create: function(e) {
				return _(_({}, e), { table: function(r) {
					var y = e.table(r), v = y.schema.primaryKey;
					return _(_({}, y), { mutate: function(e) {
						var t = P.trans, n = t.table(r).hook, h = n.deleting, d = n.creating, p = n.updating;
						switch (e.type) {
							case "add":
								if (d.fire === g) break;
								return t._promise("readwrite", function() {
									return a(e);
								}, !0);
							case "put":
								if (d.fire === g && p.fire === g) break;
								return t._promise("readwrite", function() {
									return a(e);
								}, !0);
							case "delete":
								if (h.fire === g) break;
								return t._promise("readwrite", function() {
									return a(e);
								}, !0);
							case "deleteRange":
								if (h.fire === g) break;
								return t._promise("readwrite", function() {
									return function n(r, i, o) {
										return y.query({
											trans: r,
											values: !1,
											query: {
												index: v,
												range: i
											},
											limit: o
										}).then(function(e) {
											var t = e.result;
											return a({
												type: "delete",
												keys: t,
												trans: r
											}).then(function(e) {
												return 0 < e.numFailures ? Promise.reject(e.failures[0]) : t.length < o ? {
													failures: [],
													numFailures: 0,
													lastResult: void 0
												} : n(r, _(_({}, i), {
													lower: t[t.length - 1],
													lowerOpen: !0
												}), o);
											});
										});
									}(e.trans, e.range, 1e4);
								}, !0);
						}
						return y.mutate(e);
						function a(c) {
							var e, t, n, l = P.trans, f = c.keys || zn(v, c);
							if (f) return "delete" !== (c = "add" === c.type || "put" === c.type ? _(_({}, c), { keys: f }) : _({}, c)).type && (c.values = R([], c.values, !0)), c.keys && (c.keys = R([], c.keys, !0)), e = y, n = f, ("add" === (t = c).type ? Promise.resolve([]) : e.getMany({
								trans: t.trans,
								keys: n,
								cache: "immutable"
							})).then(function(u) {
								var s = f.map(function(e, t) {
									var n, r, i, o = u[t], a = {
										onerror: null,
										onsuccess: null
									};
									return "delete" === c.type ? h.fire.call(a, e, o, l) : "add" === c.type || void 0 === o ? (n = d.fire.call(a, e, c.values[t], l), null == e && null != n && (c.keys[t] = e = n, v.outbound || b(c.values[t], v.keyPath, e))) : (n = Un(o, c.values[t]), (r = p.fire.call(a, n, e, o, l)) && (i = c.values[t], Object.keys(r).forEach(function(e) {
										m(i, e) ? i[e] = r[e] : b(i, e, r[e]);
									}))), a;
								});
								return y.mutate(c).then(function(e) {
									for (var t = e.failures, n = e.results, r = e.numFailures, e = e.lastResult, i = 0; i < f.length; ++i) {
										var o = (n || f)[i], a = s[i];
										null == o ? a.onerror && a.onerror(t[i]) : a.onsuccess && a.onsuccess("put" === c.type && u[i] ? c.values[i] : o);
									}
									return {
										failures: t,
										results: n,
										numFailures: r,
										lastResult: e
									};
								}).catch(function(t) {
									return s.forEach(function(e) {
										return e.onerror && e.onerror(t);
									}), Promise.reject(t);
								});
							});
							throw new Error("Keys missing");
						}
					} });
				} });
			}
		};
		function Wn(e, t, n) {
			try {
				if (!t) return null;
				if (t.keys.length < e.length) return null;
				for (var r = [], i = 0, o = 0; i < t.keys.length && o < e.length; ++i) 0 === j(t.keys[i], e[o]) && (r.push(n ? ee(t.values[i]) : t.values[i]), ++o);
				return r.length === e.length ? r : null;
			} catch (e) {
				return null;
			}
		}
		var Yn = {
			stack: "dbcore",
			level: -1,
			create: function(t) {
				return { table: function(e) {
					var n = t.table(e);
					return _(_({}, n), {
						getMany: function(t) {
							var e;
							return t.cache ? (e = Wn(t.keys, t.trans._cache, "clone" === t.cache)) ? K.resolve(e) : n.getMany(t).then(function(e) {
								return t.trans._cache = {
									keys: t.keys,
									values: "clone" === t.cache ? ee(e) : e
								}, e;
							}) : n.getMany(t);
						},
						mutate: function(e) {
							return "add" !== e.type && (e.trans._cache = null), n.mutate(e);
						}
					});
				} };
			}
		};
		function $n(e, t) {
			return "readonly" === e.trans.mode && !!e.subscr && !e.trans.explicit && "disabled" !== e.trans.db._options.cache && !t.schema.primaryKey.outbound;
		}
		function Qn(e, t) {
			switch (e) {
				case "query": return t.values && !t.unique;
				case "get":
				case "getMany":
				case "count":
				case "openCursor": return !1;
			}
		}
		var Gn = {
			stack: "dbcore",
			level: 0,
			name: "Observability",
			create: function(b) {
				var g = b.schema.name, w = new q(b.MIN_KEY, b.MAX_KEY);
				return _(_({}, b), {
					transaction: function(e, t, n) {
						if (P.subscr && "readonly" !== t) throw new k.ReadOnly("Readwrite transaction in liveQuery context. Querier source: ".concat(P.querier));
						return b.transaction(e, t, n);
					},
					table: function(d) {
						function e(e) {
							var t, e = e.query;
							return [t = e.index, new q(null != (t = (e = e.range).lower) ? t : b.MIN_KEY, null != (t = e.upper) ? t : b.MAX_KEY)];
						}
						var p = b.table(d), y = p.schema, v = y.primaryKey, t = y.indexes, c = v.extractKey, l = v.outbound, m = v.autoIncrement && t.filter(function(e) {
							return e.compound && e.keyPath.includes(v.keyPath);
						}), n = _(_({}, p), { mutate: function(a) {
							function u(e) {
								return e = "idb://".concat(g, "/").concat(d, "/").concat(e), n[e] || (n[e] = new q());
							}
							var e, o, s, t = a.trans, n = a.mutatedParts || (a.mutatedParts = {}), r = u(""), i = u(":dels"), c = a.type, l = "deleteRange" === a.type ? [a.range] : "delete" === a.type ? [a.keys] : a.values.length < 50 ? [zn(v, a).filter(function(e) {
								return e;
							}), a.values] : [], f = l[0], l = l[1], h = a.trans._cache;
							return x(f) ? (r.addKeys(f), (c = "delete" === c || f.length === l.length ? Wn(f, h) : null) || i.addKeys(f), (c || l) && (e = u, o = c, s = l, y.indexes.forEach(function(t) {
								var n = e(t.name || "");
								function r(e) {
									return null != e ? t.extractKey(e) : null;
								}
								function i(e) {
									t.multiEntry && x(e) ? e.forEach(function(e) {
										return n.addKey(e);
									}) : n.addKey(e);
								}
								(o || s).forEach(function(e, t) {
									var n = o && r(o[t]), t = s && r(s[t]);
									0 !== j(n, t) && (null != n && i(n), null != t) && i(t);
								});
							}))) : f ? (l = {
								from: null != (h = f.lower) ? h : b.MIN_KEY,
								to: null != (c = f.upper) ? c : b.MAX_KEY
							}, i.add(l), r.add(l)) : (r.add(w), i.add(w), y.indexes.forEach(function(e) {
								return u(e.name).add(w);
							})), p.mutate(a).then(function(o) {
								return !f || "add" !== a.type && "put" !== a.type || (r.addKeys(o.results), m && m.forEach(function(t) {
									for (var e = a.values.map(function(e) {
										return t.extractKey(e);
									}), n = t.keyPath.findIndex(function(e) {
										return e === v.keyPath;
									}), r = 0, i = o.results.length; r < i; ++r) e[r][n] = o.results[r];
									u(t.name).addKeys(e);
								})), t.mutatedParts = jn(t.mutatedParts || {}, n), o;
							});
						} }), f = {
							get: function(e) {
								return [v, new q(e.key)];
							},
							getMany: function(e) {
								return [v, new q().addKeys(e.keys)];
							},
							count: e,
							query: e,
							openCursor: e
						};
						return O(f).forEach(function(s) {
							n[s] = function(i) {
								var e = P.subscr, t = !!e, n = $n(P, p) && Qn(s, i) ? i.obsSet = {} : e;
								if (t) {
									var o, e = function(e) {
										e = "idb://".concat(g, "/").concat(d, "/").concat(e);
										return n[e] || (n[e] = new q());
									}, a = e(""), u = e(":dels"), t = f[s](i), r = t[0], t = t[1];
									if (("query" === s && r.isPrimaryKey && !i.values ? u : e(r.name || "")).add(t), !r.isPrimaryKey) {
										if ("count" !== s) return o = "query" === s && l && i.values && p.query(_(_({}, i), { values: !1 })), p[s].apply(this, arguments).then(function(t) {
											if ("query" === s) {
												if (l && i.values) return o.then(function(e) {
													e = e.result;
													return a.addKeys(e), t;
												});
												var e = i.values ? t.result.map(c) : t.result;
												(i.values ? a : u).addKeys(e);
											} else {
												var n, r;
												if ("openCursor" === s) return r = i.values, (n = t) && Object.create(n, {
													key: { get: function() {
														return u.addKey(n.primaryKey), n.key;
													} },
													primaryKey: { get: function() {
														var e = n.primaryKey;
														return u.addKey(e), e;
													} },
													value: { get: function() {
														return r && a.addKey(n.primaryKey), n.value;
													} }
												});
											}
											return t;
										});
										u.add(w);
									}
								}
								return p[s].apply(this, arguments);
							};
						}), n;
					}
				});
			}
		};
		function Xn(e, t, n) {
			var r;
			return 0 === n.numFailures ? t : "deleteRange" === t.type || (r = t.keys ? t.keys.length : "values" in t && t.values ? t.values.length : 1, n.numFailures === r) ? null : (r = _({}, t), x(r.keys) && (r.keys = r.keys.filter(function(e, t) {
				return !(t in n.failures);
			})), "values" in r && x(r.values) && (r.values = r.values.filter(function(e, t) {
				return !(t in n.failures);
			})), r);
		}
		function Hn(e, t) {
			return n = e, (void 0 === (r = t).lower || (r.lowerOpen ? 0 < j(n, r.lower) : 0 <= j(n, r.lower))) && (n = e, void 0 === (r = t).upper || (r.upperOpen ? j(n, r.upper) < 0 : j(n, r.upper) <= 0));
			var n, r;
		}
		function Jn(e, d, t, n, r, i) {
			var o, p, y, v, m, a, u;
			return !t || 0 === t.length || (o = d.query.index, p = o.multiEntry, y = d.query.range, v = n.schema.primaryKey.extractKey, m = o.extractKey, a = (o.lowLevelIndex || o).extractKey, (n = t.reduce(function(e, t) {
				var n = e, r = [];
				if ("add" === t.type || "put" === t.type) for (var i = new q(), o = t.values.length - 1; 0 <= o; --o) {
					var a, u = t.values[o], s = v(u);
					!i.hasKey(s) && (a = m(u), p && x(a) ? a.some(function(e) {
						return Hn(e, y);
					}) : Hn(a, y)) && (i.addKey(s), r.push(u));
				}
				switch (t.type) {
					case "add":
						var c = new q().addKeys(d.values ? e.map(function(e) {
							return v(e);
						}) : e), n = e.concat(d.values ? r.filter(function(e) {
							e = v(e);
							return !c.hasKey(e) && (c.addKey(e), !0);
						}) : r.map(function(e) {
							return v(e);
						}).filter(function(e) {
							return !c.hasKey(e) && (c.addKey(e), !0);
						}));
						break;
					case "put":
						var l = new q().addKeys(t.values.map(function(e) {
							return v(e);
						}));
						n = e.filter(function(e) {
							return !l.hasKey(d.values ? v(e) : e);
						}).concat(d.values ? r : r.map(function(e) {
							return v(e);
						}));
						break;
					case "delete":
						var f = new q().addKeys(t.keys);
						n = e.filter(function(e) {
							return !f.hasKey(d.values ? v(e) : e);
						});
						break;
					case "deleteRange":
						var h = t.range;
						n = e.filter(function(e) {
							return !Hn(v(e), h);
						});
				}
				return n;
			}, e)) === e) ? e : (u = function(e, t) {
				return j(a(e), a(t)) || j(v(e), v(t));
			}, n.sort("prev" === d.direction || "prevunique" === d.direction ? function(e, t) {
				return u(t, e);
			} : u), d.limit && d.limit < Infinity && (n.length > d.limit ? n.length = d.limit : e.length === d.limit && n.length < d.limit && (r.dirty = !0)), i ? Object.freeze(n) : n);
		}
		function Zn(e, t) {
			return 0 === j(e.lower, t.lower) && 0 === j(e.upper, t.upper) && !!e.lowerOpen == !!t.lowerOpen && !!e.upperOpen == !!t.upperOpen;
		}
		function er(e, t) {
			return ((e, t, n, r) => {
				if (void 0 === e) return void 0 !== t ? -1 : 0;
				if (void 0 === t) return 1;
				if (0 === (e = j(e, t))) {
					if (n && r) return 0;
					if (n) return 1;
					if (r) return -1;
				}
				return e;
			})(e.lower, t.lower, e.lowerOpen, t.lowerOpen) <= 0 && 0 <= ((e, t, n, r) => {
				if (void 0 === e) return void 0 !== t ? 1 : 0;
				if (void 0 === t) return -1;
				if (0 === (e = j(e, t))) {
					if (n && r) return 0;
					if (n) return -1;
					if (r) return 1;
				}
				return e;
			})(e.upper, t.upper, e.upperOpen, t.upperOpen);
		}
		function tr(n, r, i, e) {
			n.subscribers.add(i), e.addEventListener("abort", function() {
				var e, t;
				n.subscribers.delete(i), 0 === n.subscribers.size && (e = n, t = r, setTimeout(function() {
					0 === e.subscribers.size && oe(t, e);
				}, 3e3));
			});
		}
		var nr = {
			stack: "dbcore",
			level: 0,
			name: "Cache",
			create: function(k) {
				var O = k.schema.name;
				return _(_({}, k), {
					transaction: function(g, w, e) {
						var _, t, x = k.transaction(g, w, e);
						return "readwrite" === w && (e = (_ = new AbortController()).signal, x.addEventListener("abort", (t = function(b) {
							return function() {
								if (_.abort(), "readwrite" === w) {
									for (var t = /* @__PURE__ */ new Set(), e = 0, n = g; e < n.length; e++) {
										var r = n[e], i = Tn["idb://".concat(O, "/").concat(r)];
										if (i) {
											var o = k.table(r), a = i.optimisticOps.filter(function(e) {
												return e.trans === x;
											});
											if (x._explicit && b && x.mutatedParts) for (var u = 0, s = Object.values(i.queries.query); u < s.length; u++) for (var c = 0, l = (d = s[u]).slice(); c < l.length; c++) Cn((p = l[c]).obsSet, x.mutatedParts) && (oe(d, p), p.subscribers.forEach(function(e) {
												return t.add(e);
											}));
											else if (0 < a.length) {
												i.optimisticOps = i.optimisticOps.filter(function(e) {
													return e.trans !== x;
												});
												for (var f = 0, h = Object.values(i.queries.query); f < h.length; f++) for (var d, p, y, v = 0, m = (d = h[f]).slice(); v < m.length; v++) null != (p = m[v]).res && x.mutatedParts && (b && !p.dirty ? (y = Object.isFrozen(p.res), y = Jn(p.res, p.req, a, o, p, y), p.dirty ? (oe(d, p), p.subscribers.forEach(function(e) {
													return t.add(e);
												})) : y !== p.res && (p.res = y, p.promise = K.resolve({ result: y }))) : (p.dirty && oe(d, p), p.subscribers.forEach(function(e) {
													return t.add(e);
												})));
											}
										}
									}
									t.forEach(function(e) {
										return e();
									});
								}
							};
						})(!1), { signal: e }), x.addEventListener("error", t(!1), { signal: e }), x.addEventListener("complete", t(!0), { signal: e })), x;
					},
					table: function(s) {
						var c = k.table(s), i = c.schema.primaryKey;
						return _(_({}, c), {
							mutate: function(t) {
								var n, e = P.trans;
								return !i.outbound && "disabled" !== e.db._options.cache && !e.explicit && "readwrite" === e.idbtrans.mode && (n = Tn["idb://".concat(O, "/").concat(s)]) ? (e = c.mutate(t), "add" !== t.type && "put" !== t.type || !(50 <= t.values.length || zn(i, t).some(function(e) {
									return null == e;
								})) ? (n.optimisticOps.push(t), t.mutatedParts && Dn(t.mutatedParts), e.then(function(e) {
									0 < e.numFailures && (oe(n.optimisticOps, t), (e = Xn(0, t, e)) && n.optimisticOps.push(e), t.mutatedParts) && Dn(t.mutatedParts);
								}), e.catch(function() {
									oe(n.optimisticOps, t), t.mutatedParts && Dn(t.mutatedParts);
								})) : e.then(function(r) {
									var e = Xn(0, _(_({}, t), { values: t.values.map(function(e, t) {
										var n;
										return r.failures[t] ? e : (b(n = null != (n = i.keyPath) && n.includes(".") ? ee(e) : _({}, e), i.keyPath, r.results[t]), n);
									}) }), r);
									n.optimisticOps.push(e), queueMicrotask(function() {
										return t.mutatedParts && Dn(t.mutatedParts);
									});
								}), e) : c.mutate(t);
							},
							query: function(t) {
								var i, e, n, r, o, a, u;
								return $n(P, c) && Qn("query", t) ? (i = "immutable" === (null == (n = P.trans) ? void 0 : n.db._options.cache), e = (n = P).requery, n = n.signal, a = ((e, t, n, r) => {
									var i = Tn["idb://".concat(e, "/").concat(t)];
									if (!i) return [];
									if (!(e = i.queries[n])) return [
										null,
										!1,
										i,
										null
									];
									var o = e[(r.query ? r.query.index.name : null) || ""];
									if (!o) return [
										null,
										!1,
										i,
										null
									];
									switch (n) {
										case "query":
											var a = null != (u = r.direction) ? u : "next", u = o.find(function(e) {
												var t;
												return e.req.limit === r.limit && e.req.values === r.values && (null != (t = e.req.direction) ? t : "next") === a && Zn(e.req.query.range, r.query.range);
											});
											return u ? [
												u,
												!0,
												i,
												o
											] : [
												o.find(function(e) {
													var t;
													return ("limit" in e.req ? e.req.limit : Infinity) >= r.limit && (null != (t = e.req.direction) ? t : "next") === a && (!r.values || e.req.values) && er(e.req.query.range, r.query.range);
												}),
												!1,
												i,
												o
											];
										case "count":
											u = o.find(function(e) {
												return Zn(e.req.query.range, r.query.range);
											});
											return [
												u,
												!!u,
												i,
												o
											];
									}
								})(O, s, "query", t), u = a[0], r = a[2], o = a[3], u && a[1] ? u.obsSet = t.obsSet : (a = c.query(t).then(function(e) {
									var t = e.result;
									if (u && (u.res = t), i) {
										for (var n = 0, r = t.length; n < r; ++n) Object.freeze(t[n]);
										Object.freeze(t);
									}
									return e;
								}).catch(function(e) {
									return o && u && oe(o, u), Promise.reject(e);
								}), u = {
									obsSet: t.obsSet,
									promise: a,
									subscribers: /* @__PURE__ */ new Set(),
									type: "query",
									req: t,
									dirty: !1
								}, o ? o.push(u) : (o = [u], (r = r || (Tn["idb://".concat(O, "/").concat(s)] = {
									queries: {
										query: {},
										count: {}
									},
									objs: /* @__PURE__ */ new Map(),
									optimisticOps: [],
									unsignaledParts: {}
								})).queries.query[t.query.index.name || ""] = o)), tr(u, o, e, n), u.promise.then(function(e) {
									e = Jn(e.result, t, null == r ? void 0 : r.optimisticOps, c, u, i);
									return { result: i ? e : ee(e) };
								})) : c.query(t);
							}
						});
					}
				});
			}
		};
		function rr(e, r) {
			return new Proxy(e, { get: function(e, t, n) {
				return "db" === t ? r : Reflect.get(e, t, n);
			} });
		}
		D.prototype.version = function(t) {
			if (isNaN(t) || t < .1) throw new k.Type("Given version is not a positive number");
			if (t = Math.round(10 * t) / 10, this.idbdb || this._state.isBeingOpened) throw new k.Schema("Cannot add version when database is open");
			this.verno = Math.max(this.verno, t);
			var e = this._versions, n = e.filter(function(e) {
				return e._cfg.version === t;
			})[0];
			return n || (n = new this.Version(t), e.push(n), e.sort(un), n.stores({}), this._state.autoSchema = !1), n;
		}, D.prototype._whenReady = function(e) {
			var n = this;
			return this.idbdb && (this._state.openComplete || P.letThrough || this._vip) ? e() : new K(function(e, t) {
				if (n._state.openComplete) return t(new k.DatabaseClosed(n._state.dbOpenError));
				if (!n._state.isBeingOpened) {
					if (!n._state.autoOpen) return void t(new k.DatabaseClosed());
					n.open().catch(g);
				}
				n._state.dbReadyPromise.then(e, t);
			}).then(e);
		}, D.prototype.use = function(e) {
			var t = e.stack, n = e.create, r = e.level, e = e.name, i = (e && this.unuse({
				stack: t,
				name: e
			}), this._middlewares[t] || (this._middlewares[t] = []));
			return i.push({
				stack: t,
				create: n,
				level: null == r ? 10 : r,
				name: e
			}), i.sort(function(e, t) {
				return e.level - t.level;
			}), this;
		}, D.prototype.unuse = function(e) {
			var t = e.stack, n = e.name, r = e.create;
			return t && this._middlewares[t] && (this._middlewares[t] = this._middlewares[t].filter(function(e) {
				return r ? e.create !== r : !!n && e.name !== n;
			})), this;
		}, D.prototype.open = function() {
			var e = this;
			return at(s, function() {
				return Fn(e);
			});
		}, D.prototype._close = function() {
			this.on.close.fire(new CustomEvent("close"));
			var n = this._state;
			if (gn.remove(this), this.idbdb) {
				try {
					this.idbdb.close();
				} catch (e) {}
				this.idbdb = null;
			}
			n.isBeingOpened || (n.dbReadyPromise = new K(function(e) {
				n.dbReadyResolve = e;
			}), n.openCanceller = new K(function(e, t) {
				n.cancelOpen = t;
			}));
		}, D.prototype.close = function(e) {
			var e = (void 0 === e ? { disableAutoOpen: !0 } : e).disableAutoOpen, t = this._state;
			e ? (t.isBeingOpened && t.cancelOpen(new k.DatabaseClosed()), this._close(), t.autoOpen = !1, t.dbOpenError = new k.DatabaseClosed()) : (this._close(), t.autoOpen = this._options.autoOpen || t.isBeingOpened, t.openComplete = !1, t.dbOpenError = null);
		}, D.prototype.delete = function(n) {
			var i = this, o = (void 0 === n && (n = { disableAutoOpen: !0 }), 0 < arguments.length && "object" != typeof arguments[0]), a = this._state;
			return new K(function(r, t) {
				function e() {
					i.close(n);
					var e = i._deps.indexedDB.deleteDatabase(i.name);
					e.onsuccess = E(function() {
						var e = i._deps, t = i.name, n;
						_n(n = e.indexedDB) || t === ft || wn(n, e.IDBKeyRange).delete(t).catch(g), r();
					}), e.onerror = I(t), e.onblocked = i._fireOnBlocked;
				}
				if (o) throw new k.InvalidArgument("Invalid closeOptions argument to db.delete()");
				a.isBeingOpened ? a.dbReadyPromise.then(e) : e();
			});
		}, D.prototype.backendDB = function() {
			return this.idbdb;
		}, D.prototype.isOpen = function() {
			return null !== this.idbdb;
		}, D.prototype.hasBeenClosed = function() {
			var e = this._state.dbOpenError;
			return e && "DatabaseClosed" === e.name;
		}, D.prototype.hasFailed = function() {
			return null !== this._state.dbOpenError;
		}, D.prototype.dynamicallyOpened = function() {
			return this._state.autoSchema;
		}, Object.defineProperty(D.prototype, "tables", {
			get: function() {
				var t = this;
				return O(this._allTables).map(function(e) {
					return t._allTables[e];
				});
			},
			enumerable: !1,
			configurable: !0
		}), D.prototype.transaction = function() {
			var e = function(e, t, n) {
				var r = arguments.length;
				if (r < 2) throw new k.InvalidArgument("Too few arguments");
				for (var i = new Array(r - 1); --r;) i[r - 1] = arguments[r];
				return n = i.pop(), [
					e,
					H(i),
					n
				];
			}.apply(this, arguments);
			return this._transaction.apply(this, e);
		}, D.prototype._transaction = function(e, t, n) {
			var r, i, o = this, a = P.trans, u = (a && a.db === this && -1 === e.indexOf("!") || (a = null), -1 !== e.indexOf("?"));
			e = e.replace("!", "").replace("?", "");
			try {
				if (i = t.map(function(e) {
					e = e instanceof o.Table ? e.name : e;
					if ("string" != typeof e) throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
					return e;
				}), "r" == e || e === ht) r = ht;
				else {
					if ("rw" != e && e != dt) throw new k.InvalidArgument("Invalid transaction mode: " + e);
					r = dt;
				}
				if (a) {
					if (a.mode === ht && r === dt) {
						if (!u) throw new k.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
						a = null;
					}
					a && i.forEach(function(e) {
						if (a && -1 === a.storeNames.indexOf(e)) {
							if (!u) throw new k.SubTransaction("Table " + e + " not included in parent transaction.");
							a = null;
						}
					}), u && a && !a.active && (a = null);
				}
			} catch (n) {
				return a ? a._promise(null, function(e, t) {
					t(n);
				}) : S(n);
			}
			var s = function i(o, a, u, s, c) {
				return K.resolve().then(function() {
					var e = P.transless || P, t = o._createTransaction(a, u, o._dbSchema, s), e = (t.explicit = !0, {
						trans: t,
						transless: e
					});
					if (s) t.idbtrans = s.idbtrans;
					else try {
						t.create(), t.idbtrans._explicit = !0, o._state.PR1398_maxLoop = 3;
					} catch (e) {
						return e.name === de.InvalidState && o.isOpen() && 0 < --o._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), o.close({ disableAutoOpen: !1 }), o.open().then(function() {
							return i(o, a, u, null, c);
						})) : S(e);
					}
					var n, r = ue(c), e = (r && nt(), K.follow(function() {
						var e;
						(n = c.call(t, t)) && (r ? (e = w.bind(null, null), n.then(e, e)) : "function" == typeof n.next && "function" == typeof n.throw && (n = Nn(n)));
					}, e));
					return (n && "function" == typeof n.then ? K.resolve(n).then(function(e) {
						return t.active ? e : S(new k.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn"));
					}) : e.then(function() {
						return n;
					})).then(function(e) {
						return s && t._resolve(), t._completion.then(function() {
							return e;
						});
					}).catch(function(e) {
						return t._reject(e), S(e);
					});
				});
			}.bind(null, this, r, i, a, n);
			return a ? a._promise(r, s, "lock") : P.trans ? at(P.transless, function() {
				return o._whenReady(s);
			}) : this._whenReady(s);
		}, D.prototype.table = function(e) {
			if (m(this._allTables, e)) return this._allTables[e];
			throw new k.InvalidTable("Table ".concat(e, " does not exist"));
		};
		var y = D;
		function D(e, t) {
			var o, r, a, n, i, u = this, s = (this._middlewares = {}, this.verno = 0, D.dependencies), s = (this._options = t = _({
				addons: D.addons,
				autoOpen: !0,
				indexedDB: s.indexedDB,
				IDBKeyRange: s.IDBKeyRange,
				cache: "cloned",
				maxConnections: 1e3
			}, t), this._deps = {
				indexedDB: t.indexedDB,
				IDBKeyRange: t.IDBKeyRange
			}, t.addons), c = (this._dbSchema = {}, this._versions = [], this._storeNames = [], this._allTables = {}, this.idbdb = null, this._novip = this, {
				dbOpenError: null,
				isBeingOpened: !1,
				onReadyBeingFired: null,
				openComplete: !1,
				dbReadyResolve: g,
				dbReadyPromise: null,
				cancelOpen: g,
				openCanceller: null,
				autoSchema: !0,
				PR1398_maxLoop: 3,
				autoOpen: t.autoOpen
			}), l = (c.dbReadyPromise = new K(function(e) {
				c.dbReadyResolve = e;
			}), c.openCanceller = new K(function(e, t) {
				c.cancelOpen = t;
			}), this._state = c, this.name = e, this.on = Pt(this, "populate", "blocked", "versionchange", "close", { ready: [ke, g] }), this.once = function(n, r) {
				var i = function() {
					for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
					u.on(n).unsubscribe(i), r.apply(u, e);
				};
				return u.on(n, i);
			}, this.on.ready.subscribe = Y(this.on.ready.subscribe, function(i) {
				return function(n, r) {
					D.vip(function() {
						var t, e = u._state;
						e.openComplete ? (e.dbOpenError || K.resolve().then(n), r && i(n)) : e.onReadyBeingFired ? (e.onReadyBeingFired.push(n), r && i(n)) : (i(n), t = u, r || i(function e() {
							t.on.ready.unsubscribe(n), t.on.ready.unsubscribe(e);
						}));
					});
				};
			}), this.Collection = (o = this, Kt(qt.prototype, function(e, t) {
				this.db = o;
				var n = yt, r = null;
				if (t) try {
					n = t();
				} catch (e) {
					r = e;
				}
				var t = e._ctx, e = t.table, i = e.hook.reading.fire;
				this._ctx = {
					table: e,
					index: t.index,
					isPrimKey: !t.index || e.schema.primKey.keyPath && t.index === e.schema.primKey.name,
					range: n,
					keysOnly: !1,
					dir: "next",
					unique: "",
					algorithm: null,
					filter: null,
					replayFilter: null,
					justLimit: !0,
					isMatch: null,
					offset: 0,
					limit: Infinity,
					error: r,
					or: t.or,
					valueMapper: i !== ve ? i : null
				};
			})), this.Table = (r = this, Kt(Ot.prototype, function(e, t, n) {
				this.db = r, this._tx = n, this.name = e, this.schema = t, this.hook = r._allTables[e] ? r._allTables[e].hook : Pt(null, {
					creating: [ge, g],
					reading: [me, ve],
					updating: [_e, g],
					deleting: [we, g]
				});
			})), this.Transaction = (a = this, Kt(Yt.prototype, function(e, t, n, r, i) {
				var o = this;
				"readonly" !== e && t.forEach(function(e) {
					e = null == (e = n[e]) ? void 0 : e.yProps;
					e && (t = t.concat(e.map(function(e) {
						return e.updatesTable;
					})));
				}), this.db = a, this.mode = e, this.storeNames = t, this.schema = n, this.chromeTransactionDurability = r, this.idbtrans = null, this.on = Pt(this, "complete", "error", "abort"), this.parent = i || null, this.active = !0, this._reculock = 0, this._blockedFuncs = [], this._resolve = null, this._reject = null, this._waitingFor = null, this._waitingQueue = null, this._spinCount = 0, this._completion = new K(function(e, t) {
					o._resolve = e, o._reject = t;
				}), this._completion.then(function() {
					o.active = !1, o.on.complete.fire();
				}, function(e) {
					var t = o.active;
					return o.active = !1, o.on.error.fire(e), o.parent ? o.parent._reject(e) : t && o.idbtrans && o.idbtrans.abort(), S(e);
				});
			})), this.Version = (n = this, Kt(mn.prototype, function(e) {
				this.db = n, this._cfg = {
					version: e,
					storesSource: null,
					dbschema: {},
					tables: {},
					contentUpgrade: null
				};
			})), this.WhereClause = (i = this, Kt(Lt.prototype, function(e, t, n) {
				if (this.db = i, this._ctx = {
					table: e,
					index: ":id" === t ? null : t,
					or: n
				}, this._cmp = this._ascending = j, this._descending = function(e, t) {
					return j(t, e);
				}, this._max = function(e, t) {
					return 0 < j(e, t) ? e : t;
				}, this._min = function(e, t) {
					return j(e, t) < 0 ? e : t;
				}, this._IDBKeyRange = i._deps.IDBKeyRange, !this._IDBKeyRange) throw new k.MissingAPI();
			})), this.on("versionchange", function(e) {
				0 < e.newVersion ? console.warn("Another connection wants to upgrade database '".concat(u.name, "'. Closing db now to resume the upgrade.")) : console.warn("Another connection wants to delete database '".concat(u.name, "'. Closing db now to resume the delete request.")), u.close({ disableAutoOpen: !1 });
			}), this.on("blocked", function(e) {
				!e.newVersion || e.newVersion < e.oldVersion ? console.warn("Dexie.delete('".concat(u.name, "') was blocked")) : console.warn("Upgrade '".concat(u.name, "' blocked by other connection holding version ").concat(e.oldVersion / 10));
			}), this._maxKey = Xt(t.IDBKeyRange), this._createTransaction = function(e, t, n, r) {
				return new u.Transaction(e, t, n, u._options.chromeTransactionDurability, r);
			}, this._fireOnBlocked = function(t) {
				u.on("blocked").fire(t), gn.toArray().filter(function(e) {
					return e.name === u.name && e !== u && !e._state.vcFired;
				}).map(function(e) {
					return e.on("versionchange").fire(t);
				});
			}, this.use(Yn), this.use(nr), this.use(Gn), this.use(Ln), this.use(Vn), new Proxy(this, { get: function(e, t, n) {
				var r;
				return "_vip" === t || ("table" === t ? function(e) {
					return rr(u.table(e), l);
				} : (r = Reflect.get(e, t, n)) instanceof Ot ? rr(r, l) : "tables" === t ? r.map(function(e) {
					return rr(e, l);
				}) : "_createTransaction" === t ? function() {
					return rr(r.apply(this, arguments), l);
				} : r);
			} }));
			this.vip = l, s.forEach(function(e) {
				return e(u);
			});
		}
		var ir, Se = "undefined" != typeof Symbol && "observable" in Symbol ? Symbol.observable : "@@observable", or = (ar.prototype.subscribe = function(e, t, n) {
			return this._subscribe(e && "function" != typeof e ? e : {
				next: e,
				error: t,
				complete: n
			});
		}, ar.prototype[Se] = function() {
			return this;
		}, ar);
		function ar(e) {
			this._subscribe = e;
		}
		try {
			ir = {
				indexedDB: f.indexedDB || f.mozIndexedDB || f.webkitIndexedDB || f.msIndexedDB,
				IDBKeyRange: f.IDBKeyRange || f.webkitIDBKeyRange
			};
		} catch (e) {
			ir = {
				indexedDB: null,
				IDBKeyRange: null
			};
		}
		function ur(d) {
			var p, y = !1, e = new or(function(r) {
				var i = ue(d);
				var o, a = !1, u = {}, s = {}, e = {
					get closed() {
						return a;
					},
					unsubscribe: function() {
						a || (a = !0, o && o.abort(), c && Wt.storagemutated.unsubscribe(h));
					}
				}, c = (r.start && r.start(e), !1), l = function() {
					return st(t);
				};
				function f() {
					return Cn(s, u);
				}
				var h = function(e) {
					jn(u, e), f() && l();
				}, t = function() {
					var t, n, e;
					!a && ir.indexedDB && (u = {}, t = {}, o && o.abort(), o = new AbortController(), e = ((e) => {
						var t = $e();
						try {
							i && nt();
							var n = v(d, e);
							return n = i ? n.finally(w) : n;
						} finally {
							t && Qe();
						}
					})(n = {
						subscr: t,
						signal: o.signal,
						requery: l,
						querier: d,
						trans: null
					}), c || (Wt.storagemutated.subscribe(h), c = !0), Promise.resolve(e).then(function(e) {
						y = !0, p = e, a || n.signal.aborted || (f() || (s = t, f()) ? l() : (u = {}, st(function() {
							return !a && r.next && r.next(e);
						})));
					}, function(e) {
						y = !1, ["DatabaseClosedError", "AbortError"].includes(null == e ? void 0 : e.name) || a || st(function() {
							a || r.error && r.error(e);
						});
					}));
				};
				return setTimeout(l, 0), e;
			});
			return e.hasValue = function() {
				return y;
			}, e.getValue = function() {
				return p;
			}, e;
		}
		var sr = y;
		function cr(e) {
			var t = fr;
			try {
				fr = !0, Wt.storagemutated.fire(e), Bn(e, !0);
			} finally {
				fr = t;
			}
		}
		M(sr, _(_({}, e), {
			delete: function(e) {
				return new sr(e, { addons: [] }).delete();
			},
			exists: function(e) {
				return new sr(e, { addons: [] }).open().then(function(e) {
					return e.close(), !0;
				}).catch("NoSuchDatabaseError", function() {
					return !1;
				});
			},
			getDatabaseNames: function(e) {
				try {
					return t = sr.dependencies, n = t.indexedDB, t = t.IDBKeyRange, (_n(n) ? Promise.resolve(n.databases()).then(function(e) {
						return e.map(function(e) {
							return e.name;
						}).filter(function(e) {
							return e !== ft;
						});
					}) : wn(n, t).toCollection().primaryKeys()).then(e);
				} catch (e) {
					return S(new k.MissingAPI());
				}
				var t, n;
			},
			defineClass: function() {
				return function(e) {
					a(this, e);
				};
			},
			ignoreTransaction: function(e) {
				return P.trans ? at(P.transless || s, e) : e();
			},
			vip: xn,
			async: function(t) {
				return function() {
					try {
						var e = Nn(t.apply(this, arguments));
						return e && "function" == typeof e.then ? e : K.resolve(e);
					} catch (e) {
						return S(e);
					}
				};
			},
			spawn: function(e, t, n) {
				try {
					var r = Nn(e.apply(n, t || []));
					return r && "function" == typeof r.then ? r : K.resolve(r);
				} catch (e) {
					return S(e);
				}
			},
			currentTransaction: { get: function() {
				return P.trans || null;
			} },
			waitFor: function(e, t) {
				e = K.resolve("function" == typeof e ? sr.ignoreTransaction(e) : e).timeout(t || 6e4);
				return P.trans ? P.trans.waitFor(e) : e;
			},
			Promise: K,
			debug: {
				get: function() {
					return l;
				},
				set: function(e) {
					Oe(e);
				}
			},
			derive: U,
			extend: a,
			props: M,
			override: Y,
			Events: Pt,
			on: Wt,
			liveQuery: ur,
			extendObservabilitySet: jn,
			getByKeyPath: c,
			setByKeyPath: b,
			delByKeyPath: function(t, e) {
				"string" == typeof e ? b(t, e, void 0) : "length" in e && [].map.call(e, function(e) {
					b(t, e, void 0);
				});
			},
			shallowClone: G,
			deepClone: ee,
			getObjectDiff: Un,
			cmp: j,
			asap: Q,
			minKey: -Infinity,
			addons: [],
			connections: { get: gn.toArray },
			errnames: de,
			dependencies: ir,
			cache: Tn,
			semVer: "4.4.6",
			version: "4.4.6".split(".").map(function(e) {
				return parseInt(e);
			}).reduce(function(e, t, n) {
				return e + t / Math.pow(10, 2 * n);
			})
		})), sr.maxKey = Xt(sr.dependencies.IDBKeyRange), "undefined" != typeof dispatchEvent && "undefined" != typeof addEventListener && (Wt(zt, function(e) {
			fr || (e = new CustomEvent(Vt, { detail: e }), fr = !0, dispatchEvent(e), fr = !1);
		}), addEventListener(Vt, function(e) {
			e = e.detail;
			fr || cr(e);
		}));
		var lr, fr = !1, hr = function() {};
		return "undefined" != typeof BroadcastChannel && ((hr = function() {
			(lr = new BroadcastChannel(Vt)).onmessage = function(e) {
				return e.data && cr(e.data);
			};
		})(), "function" == typeof lr.unref && lr.unref(), Wt(zt, function(e) {
			fr || lr.postMessage(e);
		})), "undefined" != typeof addEventListener && (addEventListener("pagehide", function(e) {
			if (!y.disableBfCache && e.persisted) {
				l && console.debug("Dexie: handling persisted pagehide"), lr?.close();
				for (var t = 0, n = gn.toArray(); t < n.length; t++) n[t].close({ disableAutoOpen: !1 });
			}
		}), addEventListener("pageshow", function(e) {
			!y.disableBfCache && e.persisted && (l && console.debug("Dexie: handling persisted pageshow"), hr(), cr({ all: new q(-Infinity, [[]]) }));
		})), K.rejectionMapper = function(e, t) {
			return !e || e instanceof ce || e instanceof TypeError || e instanceof SyntaxError || !e.name || !ye[e.name] ? e : (t = new ye[e.name](t || e.message, e), "stack" in e && u(t, "stack", { get: function() {
				return this.inner.stack;
			} }), t);
		}, Oe(l), _(y, Object.freeze({
			__proto__: null,
			DEFAULT_MAX_CONNECTIONS: 1e3,
			Dexie: y,
			Entity: mt,
			PropModification: _t,
			RangeSet: q,
			add: function(e) {
				return new _t({ add: e });
			},
			cmp: j,
			default: y,
			liveQuery: ur,
			mergeRanges: Pn,
			rangesOverlap: Kn,
			remove: function(e) {
				return new _t({ remove: e });
			},
			replacePrefix: function(e, t) {
				return new _t({ replacePrefix: [e, t] });
			}
		}), { default: y }), y;
	});
})))(), 1);
var DexieSymbol = Symbol.for("Dexie");
var Dexie = globalThis[DexieSymbol] || (globalThis[DexieSymbol] = import_dexie_min.default);
if (import_dexie_min.default.semVer !== Dexie.semVer) throw new Error(`Two different versions of Dexie loaded in the same app: ${import_dexie_min.default.semVer} and ${Dexie.semVer}`);
var { liveQuery, mergeRanges, rangesOverlap, RangeSet, cmp, Entity, PropModification, replacePrefix, add, remove, DexieYProvider } = Dexie;
//#endregion
//#region ../../node_modules/.pnpm/mitt@3.0.1/node_modules/mitt/dist/mitt.mjs
function mitt_default(n) {
	return {
		all: n = n || /* @__PURE__ */ new Map(),
		on: function(t, e) {
			var i = n.get(t);
			i ? i.push(e) : n.set(t, [e]);
		},
		off: function(t, e) {
			var i = n.get(t);
			i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t, []));
		},
		emit: function(t, e) {
			var i = n.get(t);
			i && i.slice().map(function(n) {
				n(e);
			}), (i = n.get("*")) && i.slice().map(function(n) {
				n(t, e);
			});
		}
	};
}
//#endregion
//#region ../../packages/utils/src/modules/mitt.ts
/**
* 全局事件总线（迁移自 koi/utils/mittBus.ts）
*/
var mittBus = mitt_default();
//#endregion
export { StorageWrapper as $, MENU_CACHE_KEY as A, getLayoutCache as B, setDefaultHttpInstance as C, createSseClient as D, createOpenAiSseClient as E, clearAuthToken as F, setMenuCache as G, getUserInfo as H, clearImpersonateToken as I, writeLayoutCache as J, setRefreshToken as K, getAccessToken as L, clearAllAuthData as M, clearAuthCache as N, defaultParse as O, clearAuthCacheKeepToken as P, axios as Q, getFrameworkStorage as R, normalizeUrl as S, createSpringAiSseClient as T, setAccessToken as U, getMenuCache as V, setLayoutCache as W, fetchEventSource as X, EventStreamContentType as Y, AxiosError as Z, FIRST_PARTY_HEADER_B as _, applyPrimaryColorVars as a, encrypt as at, createHttp as b, getLightColor as c, normalizeThemeColor as d, browserLocalStorage as et, encodeRequestBody as f, FIRST_PARTY_HEADER_A as g, log as h, applyMessageColorVars as i, decrypt as it, USER_INFO_KEY as j, LAYOUT_CACHE_KEY as k, hexToRgb as l, getDayText as m, resolveUserDisplayInfo as n, createStorage as nt, expandShortHex as o, sha256Hex as p, setUserInfo as q, clearSessionStorage as r, emptyStorage as rt, getDarkColor as s, mittBus as t, browserSessionStorage as tt, mixColor as u, FIRST_PARTY_MARKER as v, unwrapResult as w, http as x, Http as y, getImpersonateToken as z };
