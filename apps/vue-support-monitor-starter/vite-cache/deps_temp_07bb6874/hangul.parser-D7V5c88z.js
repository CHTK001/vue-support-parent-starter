import { i as __require } from "./rolldown-runtime-CEgmsyvS.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-hangul@3.1.2/node_modules/@file-viewer/renderer-hangul/dist/hangul.parser.js
var qp = Object.create;
var oo = Object.defineProperty;
var $p = Object.defineProperties;
var Jp = Object.getOwnPropertyDescriptor;
var Vp = Object.getOwnPropertyDescriptors;
var Xp = Object.getOwnPropertyNames;
var hl = Object.getOwnPropertySymbols;
var e0 = Object.getPrototypeOf;
var fl = Object.prototype.hasOwnProperty;
var t0 = Object.prototype.propertyIsEnumerable;
var cl = (e, r, t) => r in e ? oo(e, r, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: t
}) : e[r] = t;
var ht = (e, r) => {
	for (var t in r || (r = {})) fl.call(r, t) && cl(e, t, r[t]);
	if (hl) for (var t of hl(r)) t0.call(r, t) && cl(e, t, r[t]);
	return e;
};
var Gn = (e, r) => $p(e, Vp(r));
var $t = ((e) => typeof __require != "undefined" ? __require : typeof Proxy != "undefined" ? new Proxy(e, { get: (r, t) => (typeof __require != "undefined" ? __require : r)[t] }) : e)(function(e) {
	if (typeof __require != "undefined") return __require.apply(this, arguments);
	throw Error("Dynamic require of \"" + e + "\" is not supported");
});
var _r = (e, r) => () => {
	try {
		return r || e((r = { exports: {} }).exports, r), r.exports;
	} catch (t) {
		throw r = 0, t;
	}
};
var r0 = (e, r, t, n) => {
	if (r && typeof r == "object" || typeof r == "function") for (let i of Xp(r)) !fl.call(e, i) && i !== t && oo(e, i, {
		get: () => r[i],
		enumerable: !(n = Jp(r, i)) || n.enumerable
	});
	return e;
};
var uo = (e, r, t) => (t = e != null ? qp(e0(e)) : {}, r0(r || !e || !e.__esModule ? oo(t, "default", {
	value: e,
	enumerable: !0
}) : t, e));
var pl = _r((dl, lo) => {
	(function(e) {
		typeof dl == "object" && typeof lo != "undefined" ? lo.exports = e() : typeof define == "function" && define.amd ? define([], e) : (typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : this).JSZip = e();
	})(function() {
		return (function e(r, t, n) {
			function i(u, c) {
				if (!t[u]) {
					if (!r[u]) {
						var o = typeof $t == "function" && $t;
						if (!c && o) return o(u, !0);
						if (a) return a(u, !0);
						var l = /* @__PURE__ */ new Error("Cannot find module '" + u + "'");
						throw l.code = "MODULE_NOT_FOUND", l;
					}
					var d = t[u] = { exports: {} };
					r[u][0].call(d.exports, function(p) {
						var h = r[u][1][p];
						return i(h || p);
					}, d, d.exports, e, r, t, n);
				}
				return t[u].exports;
			}
			for (var a = typeof $t == "function" && $t, s = 0; s < n.length; s++) i(n[s]);
			return i;
		})({
			1: [function(e, r, t) {
				"use strict";
				var n = e("./utils"), i = e("./support"), a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
				t.encode = function(s) {
					for (var u, c, o, l, d, p, h, A = [], f = 0, g = s.length, _ = g, v = n.getTypeOf(s) !== "string"; f < s.length;) _ = g - f, o = v ? (u = s[f++], c = f < g ? s[f++] : 0, f < g ? s[f++] : 0) : (u = s.charCodeAt(f++), c = f < g ? s.charCodeAt(f++) : 0, f < g ? s.charCodeAt(f++) : 0), l = u >> 2, d = (3 & u) << 4 | c >> 4, p = 1 < _ ? (15 & c) << 2 | o >> 6 : 64, h = 2 < _ ? 63 & o : 64, A.push(a.charAt(l) + a.charAt(d) + a.charAt(p) + a.charAt(h));
					return A.join("");
				}, t.decode = function(s) {
					var u, c, o, l, d, p, h = 0, A = 0, f = "data:";
					if (s.substr(0, f.length) === f) throw new Error("Invalid base64 input, it looks like a data url.");
					var g, _ = 3 * (s = s.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
					if (s.charAt(s.length - 1) === a.charAt(64) && _--, s.charAt(s.length - 2) === a.charAt(64) && _--, _ % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
					for (g = i.uint8array ? new Uint8Array(0 | _) : new Array(0 | _); h < s.length;) u = a.indexOf(s.charAt(h++)) << 2 | (l = a.indexOf(s.charAt(h++))) >> 4, c = (15 & l) << 4 | (d = a.indexOf(s.charAt(h++))) >> 2, o = (3 & d) << 6 | (p = a.indexOf(s.charAt(h++))), g[A++] = u, d !== 64 && (g[A++] = c), p !== 64 && (g[A++] = o);
					return g;
				};
			}, {
				"./support": 30,
				"./utils": 32
			}],
			2: [function(e, r, t) {
				"use strict";
				var n = e("./external"), i = e("./stream/DataWorker"), a = e("./stream/Crc32Probe"), s = e("./stream/DataLengthProbe");
				function u(c, o, l, d, p) {
					this.compressedSize = c, this.uncompressedSize = o, this.crc32 = l, this.compression = d, this.compressedContent = p;
				}
				u.prototype = {
					getContentWorker: function() {
						var c = new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new s("data_length")), o = this;
						return c.on("end", function() {
							if (this.streamInfo.data_length !== o.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
						}), c;
					},
					getCompressedWorker: function() {
						return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
					}
				}, u.createWorkerFrom = function(c, o, l) {
					return c.pipe(new a()).pipe(new s("uncompressedSize")).pipe(o.compressWorker(l)).pipe(new s("compressedSize")).withStreamInfo("compression", o);
				}, r.exports = u;
			}, {
				"./external": 6,
				"./stream/Crc32Probe": 25,
				"./stream/DataLengthProbe": 26,
				"./stream/DataWorker": 27
			}],
			3: [function(e, r, t) {
				"use strict";
				var n = e("./stream/GenericWorker");
				t.STORE = {
					magic: "\0\0",
					compressWorker: function() {
						return new n("STORE compression");
					},
					uncompressWorker: function() {
						return new n("STORE decompression");
					}
				}, t.DEFLATE = e("./flate");
			}, {
				"./flate": 7,
				"./stream/GenericWorker": 28
			}],
			4: [function(e, r, t) {
				"use strict";
				var n = e("./utils"), i = (function() {
					for (var a, s = [], u = 0; u < 256; u++) {
						a = u;
						for (var c = 0; c < 8; c++) a = 1 & a ? 3988292384 ^ a >>> 1 : a >>> 1;
						s[u] = a;
					}
					return s;
				})();
				r.exports = function(a, s) {
					return a !== void 0 && a.length ? n.getTypeOf(a) !== "string" ? (function(u, c, o, l) {
						var d = i, p = l + o;
						u ^= -1;
						for (var h = l; h < p; h++) u = u >>> 8 ^ d[255 & (u ^ c[h])];
						return -1 ^ u;
					})(0 | s, a, a.length, 0) : (function(u, c, o, l) {
						var d = i, p = l + o;
						u ^= -1;
						for (var h = l; h < p; h++) u = u >>> 8 ^ d[255 & (u ^ c.charCodeAt(h))];
						return -1 ^ u;
					})(0 | s, a, a.length, 0) : 0;
				};
			}, { "./utils": 32 }],
			5: [function(e, r, t) {
				"use strict";
				t.base64 = !1, t.binary = !1, t.dir = !1, t.createFolders = !0, t.date = null, t.compression = null, t.compressionOptions = null, t.comment = null, t.unixPermissions = null, t.dosPermissions = null;
			}, {}],
			6: [function(e, r, t) {
				"use strict";
				var n = null;
				n = typeof Promise != "undefined" ? Promise : e("lie"), r.exports = { Promise: n };
			}, { lie: 37 }],
			7: [function(e, r, t) {
				"use strict";
				var n = typeof Uint8Array != "undefined" && typeof Uint16Array != "undefined" && typeof Uint32Array != "undefined", i = e("pako"), a = e("./utils"), s = e("./stream/GenericWorker"), u = n ? "uint8array" : "array";
				function c(o, l) {
					s.call(this, "FlateWorker/" + o), this._pako = null, this._pakoAction = o, this._pakoOptions = l, this.meta = {};
				}
				t.magic = "\b\0", a.inherits(c, s), c.prototype.processChunk = function(o) {
					this.meta = o.meta, this._pako === null && this._createPako(), this._pako.push(a.transformTo(u, o.data), !1);
				}, c.prototype.flush = function() {
					s.prototype.flush.call(this), this._pako === null && this._createPako(), this._pako.push([], !0);
				}, c.prototype.cleanUp = function() {
					s.prototype.cleanUp.call(this), this._pako = null;
				}, c.prototype._createPako = function() {
					this._pako = new i[this._pakoAction]({
						raw: !0,
						level: this._pakoOptions.level || -1
					});
					var o = this;
					this._pako.onData = function(l) {
						o.push({
							data: l,
							meta: o.meta
						});
					};
				}, t.compressWorker = function(o) {
					return new c("Deflate", o);
				}, t.uncompressWorker = function() {
					return new c("Inflate", {});
				};
			}, {
				"./stream/GenericWorker": 28,
				"./utils": 32,
				pako: 38
			}],
			8: [function(e, r, t) {
				"use strict";
				function n(d, p) {
					var h, A = "";
					for (h = 0; h < p; h++) A += String.fromCharCode(255 & d), d >>>= 8;
					return A;
				}
				function i(d, p, h, A, f, g) {
					var _, v, b = d.file, C = d.compression, T = g !== u.utf8encode, ee = a.transformTo("string", g(b.name)), x = a.transformTo("string", u.utf8encode(b.name)), G = b.comment, O = a.transformTo("string", g(G)), k = a.transformTo("string", u.utf8encode(G)), H = x.length !== b.name.length, m = k.length !== G.length, V = "", y = "", ie = "", xe = b.dir, se = b.date, ae = {
						crc32: 0,
						compressedSize: 0,
						uncompressedSize: 0
					};
					p && !h || (ae.crc32 = d.crc32, ae.compressedSize = d.compressedSize, ae.uncompressedSize = d.uncompressedSize);
					var R = 0;
					p && (R |= 8), T || !H && !m || (R |= 2048);
					var W = 0, q = 0;
					xe && (W |= 16), f === "UNIX" ? (q = 798, W |= (function(ge, Ee) {
						var ye = ge;
						return ge || (ye = Ee ? 16893 : 33204), (65535 & ye) << 16;
					})(b.unixPermissions, xe)) : (q = 20, W |= (function(ge) {
						return 63 & (ge || 0);
					})(b.dosPermissions)), _ = se.getUTCHours(), _ <<= 6, _ |= se.getUTCMinutes(), _ <<= 5, _ |= se.getUTCSeconds() / 2, v = se.getUTCFullYear() - 1980, v <<= 4, v |= se.getUTCMonth() + 1, v <<= 5, v |= se.getUTCDate(), H && (y = n(1, 1) + n(c(ee), 4) + x, V += "up" + n(y.length, 2) + y), m && (ie = n(1, 1) + n(c(O), 4) + k, V += "uc" + n(ie.length, 2) + ie);
					var Z = "";
					return Z += `
\0`, Z += n(R, 2), Z += C.magic, Z += n(_, 2), Z += n(v, 2), Z += n(ae.crc32, 4), Z += n(ae.compressedSize, 4), Z += n(ae.uncompressedSize, 4), Z += n(ee.length, 2), Z += n(V.length, 2), {
						fileRecord: o.LOCAL_FILE_HEADER + Z + ee + V,
						dirRecord: o.CENTRAL_FILE_HEADER + n(q, 2) + Z + n(O.length, 2) + "\0\0\0\0" + n(W, 4) + n(A, 4) + ee + V + O
					};
				}
				var a = e("../utils"), s = e("../stream/GenericWorker"), u = e("../utf8"), c = e("../crc32"), o = e("../signature");
				function l(d, p, h, A) {
					s.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = p, this.zipPlatform = h, this.encodeFileName = A, this.streamFiles = d, this.accumulate = !1, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
				}
				a.inherits(l, s), l.prototype.push = function(d) {
					var p = d.meta.percent || 0, h = this.entriesCount, A = this._sources.length;
					this.accumulate ? this.contentBuffer.push(d) : (this.bytesWritten += d.data.length, s.prototype.push.call(this, {
						data: d.data,
						meta: {
							currentFile: this.currentFile,
							percent: h ? (p + 100 * (h - A - 1)) / h : 100
						}
					}));
				}, l.prototype.openedSource = function(d) {
					this.currentSourceOffset = this.bytesWritten, this.currentFile = d.file.name;
					var p = this.streamFiles && !d.file.dir;
					if (p) {
						var h = i(d, p, !1, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
						this.push({
							data: h.fileRecord,
							meta: { percent: 0 }
						});
					} else this.accumulate = !0;
				}, l.prototype.closedSource = function(d) {
					this.accumulate = !1;
					var p = this.streamFiles && !d.file.dir, h = i(d, p, !0, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
					if (this.dirRecords.push(h.dirRecord), p) this.push({
						data: (function(A) {
							return o.DATA_DESCRIPTOR + n(A.crc32, 4) + n(A.compressedSize, 4) + n(A.uncompressedSize, 4);
						})(d),
						meta: { percent: 100 }
					});
					else for (this.push({
						data: h.fileRecord,
						meta: { percent: 0 }
					}); this.contentBuffer.length;) this.push(this.contentBuffer.shift());
					this.currentFile = null;
				}, l.prototype.flush = function() {
					for (var d = this.bytesWritten, p = 0; p < this.dirRecords.length; p++) this.push({
						data: this.dirRecords[p],
						meta: { percent: 100 }
					});
					var h = this.bytesWritten - d, A = (function(f, g, _, v, b) {
						var C = a.transformTo("string", b(v));
						return o.CENTRAL_DIRECTORY_END + "\0\0\0\0" + n(f, 2) + n(f, 2) + n(g, 4) + n(_, 4) + n(C.length, 2) + C;
					})(this.dirRecords.length, h, d, this.zipComment, this.encodeFileName);
					this.push({
						data: A,
						meta: { percent: 100 }
					});
				}, l.prototype.prepareNextSource = function() {
					this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
				}, l.prototype.registerPrevious = function(d) {
					this._sources.push(d);
					var p = this;
					return d.on("data", function(h) {
						p.processChunk(h);
					}), d.on("end", function() {
						p.closedSource(p.previous.streamInfo), p._sources.length ? p.prepareNextSource() : p.end();
					}), d.on("error", function(h) {
						p.error(h);
					}), this;
				}, l.prototype.resume = function() {
					return !!s.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), !0) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), !0));
				}, l.prototype.error = function(d) {
					var p = this._sources;
					if (!s.prototype.error.call(this, d)) return !1;
					for (var h = 0; h < p.length; h++) try {
						p[h].error(d);
					} catch (A) {}
					return !0;
				}, l.prototype.lock = function() {
					s.prototype.lock.call(this);
					for (var d = this._sources, p = 0; p < d.length; p++) d[p].lock();
				}, r.exports = l;
			}, {
				"../crc32": 4,
				"../signature": 23,
				"../stream/GenericWorker": 28,
				"../utf8": 31,
				"../utils": 32
			}],
			9: [function(e, r, t) {
				"use strict";
				var n = e("../compressions"), i = e("./ZipFileWorker");
				t.generateWorker = function(a, s, u) {
					var c = new i(s.streamFiles, u, s.platform, s.encodeFileName), o = 0;
					try {
						a.forEach(function(l, d) {
							o++;
							var p = (function(g, _) {
								var v = g || _, b = n[v];
								if (!b) throw new Error(v + " is not a valid compression method !");
								return b;
							})(d.options.compression, s.compression), h = d.options.compressionOptions || s.compressionOptions || {}, A = d.dir, f = d.date;
							d._compressWorker(p, h).withStreamInfo("file", {
								name: l,
								dir: A,
								date: f,
								comment: d.comment || "",
								unixPermissions: d.unixPermissions,
								dosPermissions: d.dosPermissions
							}).pipe(c);
						}), c.entriesCount = o;
					} catch (l) {
						c.error(l);
					}
					return c;
				};
			}, {
				"../compressions": 3,
				"./ZipFileWorker": 8
			}],
			10: [function(e, r, t) {
				"use strict";
				function n() {
					if (!(this instanceof n)) return new n();
					if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
					this.files = Object.create(null), this.comment = null, this.root = "", this.clone = function() {
						var i = new n();
						for (var a in this) typeof this[a] != "function" && (i[a] = this[a]);
						return i;
					};
				}
				(n.prototype = e("./object")).loadAsync = e("./load"), n.support = e("./support"), n.defaults = e("./defaults"), n.version = "3.10.2", n.loadAsync = function(i, a) {
					return new n().loadAsync(i, a);
				}, n.external = e("./external"), r.exports = n;
			}, {
				"./defaults": 5,
				"./external": 6,
				"./load": 11,
				"./object": 15,
				"./support": 30
			}],
			11: [function(e, r, t) {
				"use strict";
				var n = e("./utils"), i = e("./external"), a = e("./utf8"), s = e("./zipEntries"), u = e("./stream/Crc32Probe"), c = e("./nodejsUtils");
				function o(l) {
					return new i.Promise(function(d, p) {
						var h = l.decompressed.getContentWorker().pipe(new u());
						h.on("error", function(A) {
							p(A);
						}).on("end", function() {
							h.streamInfo.crc32 !== l.decompressed.crc32 ? p(/* @__PURE__ */ new Error("Corrupted zip : CRC32 mismatch")) : d();
						}).resume();
					});
				}
				r.exports = function(l, d) {
					var p = this;
					return d = n.extend(d || {}, {
						base64: !1,
						checkCRC32: !1,
						optimizedBinaryString: !1,
						createFolders: !1,
						decodeFileName: a.utf8decode
					}), c.isNode && c.isStream(l) ? i.Promise.reject(/* @__PURE__ */ new Error("JSZip can't accept a stream when loading a zip file.")) : n.prepareContent("the loaded zip file", l, !0, d.optimizedBinaryString, d.base64).then(function(h) {
						var A = new s(d);
						return A.load(h), A;
					}).then(function(h) {
						var A = [i.Promise.resolve(h)], f = h.files;
						if (d.checkCRC32) for (var g = 0; g < f.length; g++) A.push(o(f[g]));
						return i.Promise.all(A);
					}).then(function(h) {
						for (var A = h.shift(), f = A.files, g = 0; g < f.length; g++) {
							var _ = f[g], v = _.fileNameStr, b = n.resolve(_.fileNameStr);
							p.file(b, _.decompressed, {
								binary: !0,
								optimizedBinaryString: !0,
								date: _.date,
								dir: _.dir,
								comment: _.fileCommentStr.length ? _.fileCommentStr : null,
								unixPermissions: _.unixPermissions,
								dosPermissions: _.dosPermissions,
								createFolders: d.createFolders
							}), _.dir || (p.file(b).unsafeOriginalName = v);
						}
						return A.zipComment.length && (p.comment = A.zipComment), p;
					});
				};
			}, {
				"./external": 6,
				"./nodejsUtils": 14,
				"./stream/Crc32Probe": 25,
				"./utf8": 31,
				"./utils": 32,
				"./zipEntries": 33
			}],
			12: [function(e, r, t) {
				"use strict";
				var n = e("../utils"), i = e("../stream/GenericWorker");
				function a(s, u) {
					i.call(this, "Nodejs stream input adapter for " + s), this._upstreamEnded = !1, this._bindStream(u);
				}
				n.inherits(a, i), a.prototype._bindStream = function(s) {
					var u = this;
					(this._stream = s).pause(), s.on("data", function(c) {
						u.push({
							data: c,
							meta: { percent: 0 }
						});
					}).on("error", function(c) {
						u.isPaused ? this.generatedError = c : u.error(c);
					}).on("end", function() {
						u.isPaused ? u._upstreamEnded = !0 : u.end();
					});
				}, a.prototype.pause = function() {
					return !!i.prototype.pause.call(this) && (this._stream.pause(), !0);
				}, a.prototype.resume = function() {
					return !!i.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), !0);
				}, r.exports = a;
			}, {
				"../stream/GenericWorker": 28,
				"../utils": 32
			}],
			13: [function(e, r, t) {
				"use strict";
				var n = e("readable-stream").Readable;
				function i(a, s, u) {
					n.call(this, s), this._helper = a;
					var c = this;
					a.on("data", function(o, l) {
						c.push(o) || c._helper.pause(), u && u(l);
					}).on("error", function(o) {
						c.emit("error", o);
					}).on("end", function() {
						c.push(null);
					});
				}
				e("../utils").inherits(i, n), i.prototype._read = function() {
					this._helper.resume();
				}, r.exports = i;
			}, {
				"../utils": 32,
				"readable-stream": 16
			}],
			14: [function(e, r, t) {
				"use strict";
				r.exports = {
					isNode: typeof Buffer != "undefined",
					newBufferFrom: function(n, i) {
						if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(n, i);
						if (typeof n == "number") throw new Error("The \"data\" argument must not be a number");
						return new Buffer(n, i);
					},
					allocBuffer: function(n) {
						if (Buffer.alloc) return Buffer.alloc(n);
						var i = new Buffer(n);
						return i.fill(0), i;
					},
					isBuffer: function(n) {
						return Buffer.isBuffer(n);
					},
					isStream: function(n) {
						return n && typeof n.on == "function" && typeof n.pause == "function" && typeof n.resume == "function";
					}
				};
			}, {}],
			15: [function(e, r, t) {
				"use strict";
				function n(b, C, T) {
					var ee, x = a.getTypeOf(C), G = a.extend(T || {}, c);
					G.date = G.date || /* @__PURE__ */ new Date(), G.compression !== null && (G.compression = G.compression.toUpperCase()), typeof G.unixPermissions == "string" && (G.unixPermissions = parseInt(G.unixPermissions, 8)), G.unixPermissions && 16384 & G.unixPermissions && (G.dir = !0), G.dosPermissions && 16 & G.dosPermissions && (G.dir = !0), G.dir && (b = f(b)), G.createFolders && (ee = A(b)) && g.call(this, ee, !0);
					var O = x === "string" && G.binary === !1 && G.base64 === !1;
					T && T.binary !== void 0 || (G.binary = !O), (C instanceof o && C.uncompressedSize === 0 || G.dir || !C || C.length === 0) && (G.base64 = !1, G.binary = !0, C = "", G.compression = "STORE", x = "string");
					var k = null;
					k = C instanceof o || C instanceof s ? C : p.isNode && p.isStream(C) ? new h(b, C) : a.prepareContent(b, C, G.binary, G.optimizedBinaryString, G.base64);
					var H = new l(b, k, G);
					this.files[b] = H;
				}
				var i = e("./utf8"), a = e("./utils"), s = e("./stream/GenericWorker"), u = e("./stream/StreamHelper"), c = e("./defaults"), o = e("./compressedObject"), l = e("./zipObject"), d = e("./generate"), p = e("./nodejsUtils"), h = e("./nodejs/NodejsStreamInputAdapter"), A = function(b) {
					b.slice(-1) === "/" && (b = b.substring(0, b.length - 1));
					var C = b.lastIndexOf("/");
					return 0 < C ? b.substring(0, C) : "";
				}, f = function(b) {
					return b.slice(-1) !== "/" && (b += "/"), b;
				}, g = function(b, C) {
					return C = C !== void 0 ? C : c.createFolders, b = f(b), this.files[b] || n.call(this, b, null, {
						dir: !0,
						createFolders: C
					}), this.files[b];
				};
				function _(b) {
					return Object.prototype.toString.call(b) === "[object RegExp]";
				}
				r.exports = {
					load: function() {
						throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
					},
					forEach: function(b) {
						var C, T, ee;
						for (C in this.files) ee = this.files[C], (T = C.slice(this.root.length, C.length)) && C.slice(0, this.root.length) === this.root && b(T, ee);
					},
					filter: function(b) {
						var C = [];
						return this.forEach(function(T, ee) {
							b(T, ee) && C.push(ee);
						}), C;
					},
					file: function(b, C, T) {
						if (arguments.length !== 1) return b = this.root + b, n.call(this, b, C, T), this;
						if (_(b)) {
							var ee = b;
							return this.filter(function(G, O) {
								return !O.dir && ee.test(G);
							});
						}
						var x = this.files[this.root + b];
						return x && !x.dir ? x : null;
					},
					folder: function(b) {
						if (!b) return this;
						if (_(b)) return this.filter(function(x, G) {
							return G.dir && b.test(x);
						});
						var C = this.root + b, T = g.call(this, C), ee = this.clone();
						return ee.root = T.name, ee;
					},
					remove: function(b) {
						b = this.root + b;
						var C = this.files[b];
						if (C || (b.slice(-1) !== "/" && (b += "/"), C = this.files[b]), C && !C.dir) delete this.files[b];
						else for (var T = this.filter(function(x, G) {
							return G.name.slice(0, b.length) === b;
						}), ee = 0; ee < T.length; ee++) delete this.files[T[ee].name];
						return this;
					},
					generate: function() {
						throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
					},
					generateInternalStream: function(b) {
						var C, T = {};
						try {
							if ((T = a.extend(b || {}, {
								streamFiles: !1,
								compression: "STORE",
								compressionOptions: null,
								type: "",
								platform: "DOS",
								comment: null,
								mimeType: "application/zip",
								encodeFileName: i.utf8encode
							})).type = T.type.toLowerCase(), T.compression = T.compression.toUpperCase(), T.type === "binarystring" && (T.type = "string"), !T.type) throw new Error("No output type specified.");
							a.checkSupport(T.type), T.platform !== "darwin" && T.platform !== "freebsd" && T.platform !== "linux" && T.platform !== "sunos" || (T.platform = "UNIX"), T.platform === "win32" && (T.platform = "DOS");
							var ee = T.comment || this.comment || "";
							C = d.generateWorker(this, T, ee);
						} catch (x) {
							(C = new s("error")).error(x);
						}
						return new u(C, T.type || "string", T.mimeType);
					},
					generateAsync: function(b, C) {
						return this.generateInternalStream(b).accumulate(C);
					},
					generateNodeStream: function(b, C) {
						return (b = b || {}).type || (b.type = "nodebuffer"), this.generateInternalStream(b).toNodejsStream(C);
					}
				};
			}, {
				"./compressedObject": 2,
				"./defaults": 5,
				"./generate": 9,
				"./nodejs/NodejsStreamInputAdapter": 12,
				"./nodejsUtils": 14,
				"./stream/GenericWorker": 28,
				"./stream/StreamHelper": 29,
				"./utf8": 31,
				"./utils": 32,
				"./zipObject": 35
			}],
			16: [function(e, r, t) {
				"use strict";
				r.exports = e("stream");
			}, { stream: void 0 }],
			17: [function(e, r, t) {
				"use strict";
				var n = e("./DataReader");
				function i(a) {
					n.call(this, a);
					for (var s = 0; s < this.data.length; s++) a[s] = 255 & a[s];
				}
				e("../utils").inherits(i, n), i.prototype.byteAt = function(a) {
					return this.data[this.zero + a];
				}, i.prototype.lastIndexOfSignature = function(a) {
					for (var s = a.charCodeAt(0), u = a.charCodeAt(1), c = a.charCodeAt(2), o = a.charCodeAt(3), l = this.length - 4; 0 <= l; --l) if (this.data[l] === s && this.data[l + 1] === u && this.data[l + 2] === c && this.data[l + 3] === o) return l - this.zero;
					return -1;
				}, i.prototype.readAndCheckSignature = function(a) {
					var s = a.charCodeAt(0), u = a.charCodeAt(1), c = a.charCodeAt(2), o = a.charCodeAt(3), l = this.readData(4);
					return s === l[0] && u === l[1] && c === l[2] && o === l[3];
				}, i.prototype.readData = function(a) {
					if (this.checkOffset(a), a === 0) return [];
					var s = this.data.slice(this.zero + this.index, this.zero + this.index + a);
					return this.index += a, s;
				}, r.exports = i;
			}, {
				"../utils": 32,
				"./DataReader": 18
			}],
			18: [function(e, r, t) {
				"use strict";
				var n = e("../utils");
				function i(a) {
					this.data = a, this.length = a.length, this.index = 0, this.zero = 0;
				}
				i.prototype = {
					checkOffset: function(a) {
						this.checkIndex(this.index + a);
					},
					checkIndex: function(a) {
						if (this.length < this.zero + a || a < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + a + "). Corrupted zip ?");
					},
					setIndex: function(a) {
						this.checkIndex(a), this.index = a;
					},
					skip: function(a) {
						this.setIndex(this.index + a);
					},
					byteAt: function() {},
					readInt: function(a) {
						var s, u = 0;
						for (this.checkOffset(a), s = this.index + a - 1; s >= this.index; s--) u = (u << 8) + this.byteAt(s);
						return this.index += a, u;
					},
					readString: function(a) {
						return n.transformTo("string", this.readData(a));
					},
					readData: function() {},
					lastIndexOfSignature: function() {},
					readAndCheckSignature: function() {},
					readDate: function() {
						var a = this.readInt(4);
						return new Date(Date.UTC(1980 + (a >> 25 & 127), (a >> 21 & 15) - 1, a >> 16 & 31, a >> 11 & 31, a >> 5 & 63, (31 & a) << 1));
					}
				}, r.exports = i;
			}, { "../utils": 32 }],
			19: [function(e, r, t) {
				"use strict";
				var n = e("./Uint8ArrayReader");
				function i(a) {
					n.call(this, a);
				}
				e("../utils").inherits(i, n), i.prototype.readData = function(a) {
					this.checkOffset(a);
					var s = this.data.slice(this.zero + this.index, this.zero + this.index + a);
					return this.index += a, s;
				}, r.exports = i;
			}, {
				"../utils": 32,
				"./Uint8ArrayReader": 21
			}],
			20: [function(e, r, t) {
				"use strict";
				var n = e("./DataReader");
				function i(a) {
					n.call(this, a);
				}
				e("../utils").inherits(i, n), i.prototype.byteAt = function(a) {
					return this.data.charCodeAt(this.zero + a);
				}, i.prototype.lastIndexOfSignature = function(a) {
					return this.data.lastIndexOf(a) - this.zero;
				}, i.prototype.readAndCheckSignature = function(a) {
					return a === this.readData(4);
				}, i.prototype.readData = function(a) {
					this.checkOffset(a);
					var s = this.data.slice(this.zero + this.index, this.zero + this.index + a);
					return this.index += a, s;
				}, r.exports = i;
			}, {
				"../utils": 32,
				"./DataReader": 18
			}],
			21: [function(e, r, t) {
				"use strict";
				var n = e("./ArrayReader");
				function i(a) {
					n.call(this, a);
				}
				e("../utils").inherits(i, n), i.prototype.readData = function(a) {
					if (this.checkOffset(a), a === 0) return /* @__PURE__ */ new Uint8Array(0);
					var s = this.data.subarray(this.zero + this.index, this.zero + this.index + a);
					return this.index += a, s;
				}, r.exports = i;
			}, {
				"../utils": 32,
				"./ArrayReader": 17
			}],
			22: [function(e, r, t) {
				"use strict";
				var n = e("../utils"), i = e("../support"), a = e("./ArrayReader"), s = e("./StringReader"), u = e("./NodeBufferReader"), c = e("./Uint8ArrayReader");
				r.exports = function(o) {
					var l = n.getTypeOf(o);
					return n.checkSupport(l), l !== "string" || i.uint8array ? l === "nodebuffer" ? new u(o) : i.uint8array ? new c(n.transformTo("uint8array", o)) : new a(n.transformTo("array", o)) : new s(o);
				};
			}, {
				"../support": 30,
				"../utils": 32,
				"./ArrayReader": 17,
				"./NodeBufferReader": 19,
				"./StringReader": 20,
				"./Uint8ArrayReader": 21
			}],
			23: [function(e, r, t) {
				"use strict";
				t.LOCAL_FILE_HEADER = "PK", t.CENTRAL_FILE_HEADER = "PK", t.CENTRAL_DIRECTORY_END = "PK", t.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", t.ZIP64_CENTRAL_DIRECTORY_END = "PK", t.DATA_DESCRIPTOR = "PK\x07\b";
			}, {}],
			24: [function(e, r, t) {
				"use strict";
				var n = e("./GenericWorker"), i = e("../utils");
				function a(s) {
					n.call(this, "ConvertWorker to " + s), this.destType = s;
				}
				i.inherits(a, n), a.prototype.processChunk = function(s) {
					this.push({
						data: i.transformTo(this.destType, s.data),
						meta: s.meta
					});
				}, r.exports = a;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			25: [function(e, r, t) {
				"use strict";
				var n = e("./GenericWorker"), i = e("../crc32");
				function a() {
					n.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
				}
				e("../utils").inherits(a, n), a.prototype.processChunk = function(s) {
					this.streamInfo.crc32 = i(s.data, this.streamInfo.crc32 || 0), this.push(s);
				}, r.exports = a;
			}, {
				"../crc32": 4,
				"../utils": 32,
				"./GenericWorker": 28
			}],
			26: [function(e, r, t) {
				"use strict";
				var n = e("../utils"), i = e("./GenericWorker");
				function a(s) {
					i.call(this, "DataLengthProbe for " + s), this.propName = s, this.withStreamInfo(s, 0);
				}
				n.inherits(a, i), a.prototype.processChunk = function(s) {
					if (s) {
						var u = this.streamInfo[this.propName] || 0;
						this.streamInfo[this.propName] = u + s.data.length;
					}
					i.prototype.processChunk.call(this, s);
				}, r.exports = a;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			27: [function(e, r, t) {
				"use strict";
				var n = e("../utils"), i = e("./GenericWorker");
				function a(s) {
					i.call(this, "DataWorker");
					var u = this;
					this.dataIsReady = !1, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = !1, s.then(function(c) {
						u.dataIsReady = !0, u.data = c, u.max = c && c.length || 0, u.type = n.getTypeOf(c), u.isPaused || u._tickAndRepeat();
					}, function(c) {
						u.error(c);
					});
				}
				n.inherits(a, i), a.prototype.cleanUp = function() {
					i.prototype.cleanUp.call(this), this.data = null;
				}, a.prototype.resume = function() {
					return !!i.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = !0, n.delay(this._tickAndRepeat, [], this)), !0);
				}, a.prototype._tickAndRepeat = function() {
					this._tickScheduled = !1, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (n.delay(this._tickAndRepeat, [], this), this._tickScheduled = !0));
				}, a.prototype._tick = function() {
					if (this.isPaused || this.isFinished) return !1;
					var s = null, u = Math.min(this.max, this.index + 16384);
					if (this.index >= this.max) return this.end();
					switch (this.type) {
						case "string":
							s = this.data.substring(this.index, u);
							break;
						case "uint8array":
							s = this.data.subarray(this.index, u);
							break;
						case "array":
						case "nodebuffer": s = this.data.slice(this.index, u);
					}
					return this.index = u, this.push({
						data: s,
						meta: { percent: this.max ? this.index / this.max * 100 : 0 }
					});
				}, r.exports = a;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			28: [function(e, r, t) {
				"use strict";
				function n(i) {
					this.name = i || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = !0, this.isFinished = !1, this.isLocked = !1, this._listeners = {
						data: [],
						end: [],
						error: []
					}, this.previous = null;
				}
				n.prototype = {
					push: function(i) {
						this.emit("data", i);
					},
					end: function() {
						if (this.isFinished) return !1;
						this.flush();
						try {
							this.emit("end"), this.cleanUp(), this.isFinished = !0;
						} catch (i) {
							this.emit("error", i);
						}
						return !0;
					},
					error: function(i) {
						return !this.isFinished && (this.isPaused ? this.generatedError = i : (this.isFinished = !0, this.emit("error", i), this.previous && this.previous.error(i), this.cleanUp()), !0);
					},
					on: function(i, a) {
						return this._listeners[i].push(a), this;
					},
					cleanUp: function() {
						this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
					},
					emit: function(i, a) {
						if (this._listeners[i]) for (var s = 0; s < this._listeners[i].length; s++) this._listeners[i][s].call(this, a);
					},
					pipe: function(i) {
						return i.registerPrevious(this);
					},
					registerPrevious: function(i) {
						if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
						this.streamInfo = i.streamInfo, this.mergeStreamInfo(), this.previous = i;
						var a = this;
						return i.on("data", function(s) {
							a.processChunk(s);
						}), i.on("end", function() {
							a.end();
						}), i.on("error", function(s) {
							a.error(s);
						}), this;
					},
					pause: function() {
						return !this.isPaused && !this.isFinished && (this.isPaused = !0, this.previous && this.previous.pause(), !0);
					},
					resume: function() {
						if (!this.isPaused || this.isFinished) return !1;
						var i = this.isPaused = !1;
						return this.generatedError && (this.error(this.generatedError), i = !0), this.previous && this.previous.resume(), !i;
					},
					flush: function() {},
					processChunk: function(i) {
						this.push(i);
					},
					withStreamInfo: function(i, a) {
						return this.extraStreamInfo[i] = a, this.mergeStreamInfo(), this;
					},
					mergeStreamInfo: function() {
						for (var i in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, i) && (this.streamInfo[i] = this.extraStreamInfo[i]);
					},
					lock: function() {
						if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
						this.isLocked = !0, this.previous && this.previous.lock();
					},
					toString: function() {
						var i = "Worker " + this.name;
						return this.previous ? this.previous + " -> " + i : i;
					}
				}, r.exports = n;
			}, {}],
			29: [function(e, r, t) {
				"use strict";
				var n = e("../utils"), i = e("./ConvertWorker"), a = e("./GenericWorker"), s = e("../base64"), u = e("../support"), c = e("../external"), o = null;
				if (u.nodestream) try {
					o = e("../nodejs/NodejsStreamOutputAdapter");
				} catch (p) {}
				function l(p, h) {
					return new c.Promise(function(A, f) {
						var g = [], _ = p._internalType, v = p._outputType, b = p._mimeType;
						p.on("data", function(C, T) {
							g.push(C), h && h(T);
						}).on("error", function(C) {
							g = [], f(C);
						}).on("end", function() {
							try {
								A((function(T, ee, x) {
									switch (T) {
										case "blob": return n.newBlob(n.transformTo("arraybuffer", ee), x);
										case "base64": return s.encode(ee);
										default: return n.transformTo(T, ee);
									}
								})(v, (function(T, ee) {
									var x, G = 0, O = null, k = 0;
									for (x = 0; x < ee.length; x++) k += ee[x].length;
									switch (T) {
										case "string": return ee.join("");
										case "array": return Array.prototype.concat.apply([], ee);
										case "uint8array":
											for (O = new Uint8Array(k), x = 0; x < ee.length; x++) O.set(ee[x], G), G += ee[x].length;
											return O;
										case "nodebuffer": return Buffer.concat(ee);
										default: throw new Error("concat : unsupported type '" + T + "'");
									}
								})(_, g), b));
							} catch (T) {
								f(T);
							}
							g = [];
						}).resume();
					});
				}
				function d(p, h, A) {
					var f = h;
					switch (h) {
						case "blob":
						case "arraybuffer":
							f = "uint8array";
							break;
						case "base64": f = "string";
					}
					try {
						this._internalType = f, this._outputType = h, this._mimeType = A, n.checkSupport(f), this._worker = p.pipe(new i(f)), p.lock();
					} catch (g) {
						this._worker = new a("error"), this._worker.error(g);
					}
				}
				d.prototype = {
					accumulate: function(p) {
						return l(this, p);
					},
					on: function(p, h) {
						var A = this;
						return p === "data" ? this._worker.on(p, function(f) {
							h.call(A, f.data, f.meta);
						}) : this._worker.on(p, function() {
							n.delay(h, arguments, A);
						}), this;
					},
					resume: function() {
						return n.delay(this._worker.resume, [], this._worker), this;
					},
					pause: function() {
						return this._worker.pause(), this;
					},
					toNodejsStream: function(p) {
						if (n.checkSupport("nodestream"), this._outputType !== "nodebuffer") throw new Error(this._outputType + " is not supported by this method");
						return new o(this, { objectMode: this._outputType !== "nodebuffer" }, p);
					}
				}, r.exports = d;
			}, {
				"../base64": 1,
				"../external": 6,
				"../nodejs/NodejsStreamOutputAdapter": 13,
				"../support": 30,
				"../utils": 32,
				"./ConvertWorker": 24,
				"./GenericWorker": 28
			}],
			30: [function(e, r, t) {
				"use strict";
				if (t.base64 = !0, t.array = !0, t.string = !0, t.arraybuffer = typeof ArrayBuffer != "undefined" && typeof Uint8Array != "undefined", t.nodebuffer = typeof Buffer != "undefined", t.uint8array = typeof Uint8Array != "undefined", typeof ArrayBuffer == "undefined") t.blob = !1;
				else {
					var n = /* @__PURE__ */ new ArrayBuffer(0);
					try {
						t.blob = new Blob([n], { type: "application/zip" }).size === 0;
					} catch (a) {
						try {
							var i = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
							i.append(n), t.blob = i.getBlob("application/zip").size === 0;
						} catch (s) {
							t.blob = !1;
						}
					}
				}
				try {
					t.nodestream = !!e("readable-stream").Readable;
				} catch (a) {
					t.nodestream = !1;
				}
			}, { "readable-stream": 16 }],
			31: [function(e, r, t) {
				"use strict";
				for (var n = e("./utils"), i = e("./support"), a = e("./nodejsUtils"), s = e("./stream/GenericWorker"), u = new Array(256), c = 0; c < 256; c++) u[c] = 252 <= c ? 6 : 248 <= c ? 5 : 240 <= c ? 4 : 224 <= c ? 3 : 192 <= c ? 2 : 1;
				u[254] = u[254] = 1;
				function o() {
					s.call(this, "utf-8 decode"), this.leftOver = null;
				}
				function l() {
					s.call(this, "utf-8 encode");
				}
				t.utf8encode = function(d) {
					return i.nodebuffer ? a.newBufferFrom(d, "utf-8") : (function(p) {
						var h, A, f, g, _, v = p.length, b = 0;
						for (g = 0; g < v; g++) (64512 & (A = p.charCodeAt(g))) == 55296 && g + 1 < v && (64512 & (f = p.charCodeAt(g + 1))) == 56320 && (A = 65536 + (A - 55296 << 10) + (f - 56320), g++), b += A < 128 ? 1 : A < 2048 ? 2 : A < 65536 ? 3 : 4;
						for (h = i.uint8array ? new Uint8Array(b) : new Array(b), g = _ = 0; _ < b; g++) (64512 & (A = p.charCodeAt(g))) == 55296 && g + 1 < v && (64512 & (f = p.charCodeAt(g + 1))) == 56320 && (A = 65536 + (A - 55296 << 10) + (f - 56320), g++), A < 128 ? h[_++] = A : (A < 2048 ? h[_++] = 192 | A >>> 6 : (A < 65536 ? h[_++] = 224 | A >>> 12 : (h[_++] = 240 | A >>> 18, h[_++] = 128 | A >>> 12 & 63), h[_++] = 128 | A >>> 6 & 63), h[_++] = 128 | 63 & A);
						return h;
					})(d);
				}, t.utf8decode = function(d) {
					return i.nodebuffer ? n.transformTo("nodebuffer", d).toString("utf-8") : (function(p) {
						var h, A, f, g, _ = p.length, v = new Array(2 * _);
						for (h = A = 0; h < _;) if ((f = p[h++]) < 128) v[A++] = f;
						else if (4 < (g = u[f])) v[A++] = 65533, h += g - 1;
						else {
							for (f &= g === 2 ? 31 : g === 3 ? 15 : 7; 1 < g && h < _;) f = f << 6 | 63 & p[h++], g--;
							1 < g ? v[A++] = 65533 : f < 65536 ? v[A++] = f : (f -= 65536, v[A++] = 55296 | f >> 10 & 1023, v[A++] = 56320 | 1023 & f);
						}
						return v.length !== A && (v.subarray ? v = v.subarray(0, A) : v.length = A), n.applyFromCharCode(v);
					})(d = n.transformTo(i.uint8array ? "uint8array" : "array", d));
				}, n.inherits(o, s), o.prototype.processChunk = function(d) {
					var p = n.transformTo(i.uint8array ? "uint8array" : "array", d.data);
					if (this.leftOver && this.leftOver.length) {
						if (i.uint8array) {
							var h = p;
							(p = new Uint8Array(h.length + this.leftOver.length)).set(this.leftOver, 0), p.set(h, this.leftOver.length);
						} else p = this.leftOver.concat(p);
						this.leftOver = null;
					}
					var A = (function(g, _) {
						var v;
						for ((_ = _ || g.length) > g.length && (_ = g.length), v = _ - 1; 0 <= v && (192 & g[v]) == 128;) v--;
						return v < 0 || v === 0 ? _ : v + u[g[v]] > _ ? v : _;
					})(p), f = p;
					A !== p.length && (i.uint8array ? (f = p.subarray(0, A), this.leftOver = p.subarray(A, p.length)) : (f = p.slice(0, A), this.leftOver = p.slice(A, p.length))), this.push({
						data: t.utf8decode(f),
						meta: d.meta
					});
				}, o.prototype.flush = function() {
					this.leftOver && this.leftOver.length && (this.push({
						data: t.utf8decode(this.leftOver),
						meta: {}
					}), this.leftOver = null);
				}, t.Utf8DecodeWorker = o, n.inherits(l, s), l.prototype.processChunk = function(d) {
					this.push({
						data: t.utf8encode(d.data),
						meta: d.meta
					});
				}, t.Utf8EncodeWorker = l;
			}, {
				"./nodejsUtils": 14,
				"./stream/GenericWorker": 28,
				"./support": 30,
				"./utils": 32
			}],
			32: [function(e, r, t) {
				"use strict";
				var n = e("./support"), i = e("./base64"), a = e("./nodejsUtils"), s = e("./external");
				function u(h) {
					return h;
				}
				function c(h, A) {
					for (var f = 0; f < h.length; ++f) A[f] = 255 & h.charCodeAt(f);
					return A;
				}
				e("setimmediate"), t.newBlob = function(h, A) {
					t.checkSupport("blob");
					try {
						return new Blob([h], { type: A });
					} catch (g) {
						try {
							var f = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
							return f.append(h), f.getBlob(A);
						} catch (_) {
							throw new Error("Bug : can't construct the Blob.");
						}
					}
				};
				var o = {
					stringifyByChunk: function(h, A, f) {
						var g = [], _ = 0, v = h.length;
						if (v <= f) return String.fromCharCode.apply(null, h);
						for (; _ < v;) A === "array" || A === "nodebuffer" ? g.push(String.fromCharCode.apply(null, h.slice(_, Math.min(_ + f, v)))) : g.push(String.fromCharCode.apply(null, h.subarray(_, Math.min(_ + f, v)))), _ += f;
						return g.join("");
					},
					stringifyByChar: function(h) {
						for (var A = "", f = 0; f < h.length; f++) A += String.fromCharCode(h[f]);
						return A;
					},
					applyCanBeUsed: {
						uint8array: (function() {
							try {
								return n.uint8array && String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1)).length === 1;
							} catch (h) {
								return !1;
							}
						})(),
						nodebuffer: (function() {
							try {
								return n.nodebuffer && String.fromCharCode.apply(null, a.allocBuffer(1)).length === 1;
							} catch (h) {
								return !1;
							}
						})()
					}
				};
				function l(h) {
					var A = 65536, f = t.getTypeOf(h), g = !0;
					if (f === "uint8array" ? g = o.applyCanBeUsed.uint8array : f === "nodebuffer" && (g = o.applyCanBeUsed.nodebuffer), g) for (; 1 < A;) try {
						return o.stringifyByChunk(h, f, A);
					} catch (_) {
						A = Math.floor(A / 2);
					}
					return o.stringifyByChar(h);
				}
				function d(h, A) {
					for (var f = 0; f < h.length; f++) A[f] = h[f];
					return A;
				}
				t.applyFromCharCode = l;
				var p = {};
				p.string = {
					string: u,
					array: function(h) {
						return c(h, new Array(h.length));
					},
					arraybuffer: function(h) {
						return p.string.uint8array(h).buffer;
					},
					uint8array: function(h) {
						return c(h, new Uint8Array(h.length));
					},
					nodebuffer: function(h) {
						return c(h, a.allocBuffer(h.length));
					}
				}, p.array = {
					string: l,
					array: u,
					arraybuffer: function(h) {
						return new Uint8Array(h).buffer;
					},
					uint8array: function(h) {
						return new Uint8Array(h);
					},
					nodebuffer: function(h) {
						return a.newBufferFrom(h);
					}
				}, p.arraybuffer = {
					string: function(h) {
						return l(new Uint8Array(h));
					},
					array: function(h) {
						return d(new Uint8Array(h), new Array(h.byteLength));
					},
					arraybuffer: u,
					uint8array: function(h) {
						return new Uint8Array(h);
					},
					nodebuffer: function(h) {
						return a.newBufferFrom(new Uint8Array(h));
					}
				}, p.uint8array = {
					string: l,
					array: function(h) {
						return d(h, new Array(h.length));
					},
					arraybuffer: function(h) {
						return h.buffer;
					},
					uint8array: u,
					nodebuffer: function(h) {
						return a.newBufferFrom(h);
					}
				}, p.nodebuffer = {
					string: l,
					array: function(h) {
						return d(h, new Array(h.length));
					},
					arraybuffer: function(h) {
						return p.nodebuffer.uint8array(h).buffer;
					},
					uint8array: function(h) {
						return d(h, new Uint8Array(h.length));
					},
					nodebuffer: u
				}, t.transformTo = function(h, A) {
					if (A = A || "", !h) return A;
					t.checkSupport(h);
					return p[t.getTypeOf(A)][h](A);
				}, t.resolve = function(h) {
					for (var A = h.split("/"), f = [], g = 0; g < A.length; g++) {
						var _ = A[g];
						_ === "." || _ === "" && g !== 0 && g !== A.length - 1 || (_ === ".." ? f.pop() : f.push(_));
					}
					return f.join("/");
				}, t.getTypeOf = function(h) {
					if (typeof h == "string") return "string";
					var A = Object.prototype.toString.call(h);
					return A === "[object Array]" ? "array" : n.nodebuffer && a.isBuffer(h) ? "nodebuffer" : n.uint8array && A === "[object Uint8Array]" ? "uint8array" : n.arraybuffer && A === "[object ArrayBuffer]" ? "arraybuffer" : void 0;
				}, t.checkSupport = function(h) {
					if (!n[h.toLowerCase()]) throw new Error(h + " is not supported by this platform");
				}, t.MAX_VALUE_16BITS = 65535, t.MAX_VALUE_32BITS = -1, t.pretty = function(h) {
					var A, f, g = "";
					for (f = 0; f < (h || "").length; f++) g += "\\x" + ((A = h.charCodeAt(f)) < 16 ? "0" : "") + A.toString(16).toUpperCase();
					return g;
				}, t.delay = function(h, A, f) {
					setImmediate(function() {
						h.apply(f || null, A || []);
					});
				}, t.inherits = function(h, A) {
					function f() {}
					f.prototype = A.prototype, h.prototype = new f();
				}, t.extend = function() {
					var h, A, f = {};
					for (h = 0; h < arguments.length; h++) for (A in arguments[h]) Object.prototype.hasOwnProperty.call(arguments[h], A) && f[A] === void 0 && (f[A] = arguments[h][A]);
					return f;
				}, t.prepareContent = function(h, A, f, g, _) {
					return s.Promise.resolve(A).then(function(v) {
						return n.blob && (v instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(v)) !== -1) ? Blob.prototype.arrayBuffer !== void 0 ? v.arrayBuffer() : typeof FileReader != "undefined" ? new s.Promise(function(b, C) {
							var T = new FileReader();
							T.onload = function(ee) {
								b(ee.target.result);
							}, T.onerror = function(ee) {
								C(ee.target.error);
							}, T.readAsArrayBuffer(v);
						}) : s.Promise.reject(/* @__PURE__ */ new Error(h + " is a Blob, but we have no way of reading it.")) : v;
					}).then(function(v) {
						var b = t.getTypeOf(v);
						return b ? (b === "arraybuffer" ? v = t.transformTo("uint8array", v) : b === "string" && (_ ? v = i.decode(v) : f && g !== !0 && (v = (function(C) {
							return c(C, n.uint8array ? new Uint8Array(C.length) : new Array(C.length));
						})(v))), v) : s.Promise.reject(/* @__PURE__ */ new Error("Can't read the data of '" + h + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
					});
				};
			}, {
				"./base64": 1,
				"./external": 6,
				"./nodejsUtils": 14,
				"./support": 30,
				setimmediate: 54
			}],
			33: [function(e, r, t) {
				"use strict";
				var n = e("./reader/readerFor"), i = e("./utils"), a = e("./signature"), s = e("./zipEntry"), u = e("./support");
				function c(o) {
					this.files = [], this.loadOptions = o;
				}
				c.prototype = {
					checkSignature: function(o) {
						if (!this.reader.readAndCheckSignature(o)) {
							this.reader.index -= 4;
							var l = this.reader.readString(4);
							throw new Error("Corrupted zip or bug: unexpected signature (" + i.pretty(l) + ", expected " + i.pretty(o) + ")");
						}
					},
					isSignature: function(o, l) {
						var d = this.reader.index;
						this.reader.setIndex(o);
						var p = this.reader.readString(4) === l;
						return this.reader.setIndex(d), p;
					},
					readBlockEndOfCentral: function() {
						this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
						var o = this.reader.readData(this.zipCommentLength), l = u.uint8array ? "uint8array" : "array", d = i.transformTo(l, o);
						this.zipComment = this.loadOptions.decodeFileName(d);
					},
					readBlockZip64EndOfCentral: function() {
						this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
						for (var o, l, d, p = this.zip64EndOfCentralSize - 44; 0 < p;) o = this.reader.readInt(2), l = this.reader.readInt(4), d = this.reader.readData(l), this.zip64ExtensibleData[o] = {
							id: o,
							length: l,
							value: d
						};
					},
					readBlockZip64EndOfCentralLocator: function() {
						if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
					},
					readLocalFiles: function() {
						var o, l;
						for (o = 0; o < this.files.length; o++) l = this.files[o], this.reader.setIndex(l.localHeaderOffset), this.checkSignature(a.LOCAL_FILE_HEADER), l.readLocalPart(this.reader), l.handleUTF8(), l.processAttributes();
					},
					readCentralDir: function() {
						var o;
						for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(a.CENTRAL_FILE_HEADER);) (o = new s({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(o);
						if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
					},
					readEndOfCentral: function() {
						var o = this.reader.lastIndexOfSignature(a.CENTRAL_DIRECTORY_END);
						if (o < 0) throw this.isSignature(0, a.LOCAL_FILE_HEADER) ? /* @__PURE__ */ new Error("Corrupted zip: can't find end of central directory") : /* @__PURE__ */ new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
						this.reader.setIndex(o);
						var l = o;
						if (this.checkSignature(a.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === i.MAX_VALUE_16BITS || this.diskWithCentralDirStart === i.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === i.MAX_VALUE_16BITS || this.centralDirRecords === i.MAX_VALUE_16BITS || this.centralDirSize === i.MAX_VALUE_32BITS || this.centralDirOffset === i.MAX_VALUE_32BITS) {
							if (this.zip64 = !0, (o = this.reader.lastIndexOfSignature(a.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
							if (this.reader.setIndex(o), this.checkSignature(a.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, a.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(a.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
							this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(a.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
						}
						var d = this.centralDirOffset + this.centralDirSize;
						this.zip64 && (d += 20, d += 12 + this.zip64EndOfCentralSize);
						var p = l - d;
						if (0 < p) this.isSignature(l, a.CENTRAL_FILE_HEADER) || (this.reader.zero = p);
						else if (p < 0) throw new Error("Corrupted zip: missing " + Math.abs(p) + " bytes.");
					},
					prepareReader: function(o) {
						this.reader = n(o);
					},
					load: function(o) {
						this.prepareReader(o), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
					}
				}, r.exports = c;
			}, {
				"./reader/readerFor": 22,
				"./signature": 23,
				"./support": 30,
				"./utils": 32,
				"./zipEntry": 34
			}],
			34: [function(e, r, t) {
				"use strict";
				var n = e("./reader/readerFor"), i = e("./utils"), a = e("./compressedObject"), s = e("./crc32"), u = e("./utf8"), c = e("./compressions"), o = e("./support");
				function l(d, p) {
					this.options = d, this.loadOptions = p;
				}
				l.prototype = {
					isEncrypted: function() {
						return (1 & this.bitFlag) == 1;
					},
					useUTF8: function() {
						return (2048 & this.bitFlag) == 2048;
					},
					readLocalPart: function(d) {
						var p, h;
						if (d.skip(22), this.fileNameLength = d.readInt(2), h = d.readInt(2), this.fileName = d.readData(this.fileNameLength), d.skip(h), this.compressedSize === -1 || this.uncompressedSize === -1) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
						if ((p = (function(A) {
							for (var f in c) if (Object.prototype.hasOwnProperty.call(c, f) && c[f].magic === A) return c[f];
							return null;
						})(this.compressionMethod)) === null) throw new Error("Corrupted zip : compression " + i.pretty(this.compressionMethod) + " unknown (inner file : " + i.transformTo("string", this.fileName) + ")");
						this.decompressed = new a(this.compressedSize, this.uncompressedSize, this.crc32, p, d.readData(this.compressedSize));
					},
					readCentralPart: function(d) {
						this.versionMadeBy = d.readInt(2), d.skip(2), this.bitFlag = d.readInt(2), this.compressionMethod = d.readString(2), this.date = d.readDate(), this.crc32 = d.readInt(4), this.compressedSize = d.readInt(4), this.uncompressedSize = d.readInt(4);
						var p = d.readInt(2);
						if (this.extraFieldsLength = d.readInt(2), this.fileCommentLength = d.readInt(2), this.diskNumberStart = d.readInt(2), this.internalFileAttributes = d.readInt(2), this.externalFileAttributes = d.readInt(4), this.localHeaderOffset = d.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
						d.skip(p), this.readExtraFields(d), this.parseZIP64ExtraField(d), this.fileComment = d.readData(this.fileCommentLength);
					},
					processAttributes: function() {
						this.unixPermissions = null, this.dosPermissions = null;
						var d = this.versionMadeBy >> 8;
						this.dir = !!(16 & this.externalFileAttributes), d == 0 && (this.dosPermissions = 63 & this.externalFileAttributes), d == 3 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || this.fileNameStr.slice(-1) !== "/" || (this.dir = !0);
					},
					parseZIP64ExtraField: function() {
						if (this.extraFields[1]) {
							var d = n(this.extraFields[1].value);
							this.uncompressedSize === i.MAX_VALUE_32BITS && (this.uncompressedSize = d.readInt(8)), this.compressedSize === i.MAX_VALUE_32BITS && (this.compressedSize = d.readInt(8)), this.localHeaderOffset === i.MAX_VALUE_32BITS && (this.localHeaderOffset = d.readInt(8)), this.diskNumberStart === i.MAX_VALUE_32BITS && (this.diskNumberStart = d.readInt(4));
						}
					},
					readExtraFields: function(d) {
						var p, h, A, f = d.index + this.extraFieldsLength;
						for (this.extraFields || (this.extraFields = {}); d.index + 4 < f;) p = d.readInt(2), h = d.readInt(2), A = d.readData(h), this.extraFields[p] = {
							id: p,
							length: h,
							value: A
						};
						d.setIndex(f);
					},
					handleUTF8: function() {
						var d = o.uint8array ? "uint8array" : "array";
						if (this.useUTF8()) this.fileNameStr = u.utf8decode(this.fileName), this.fileCommentStr = u.utf8decode(this.fileComment);
						else {
							var p = this.findExtraFieldUnicodePath();
							if (p !== null) this.fileNameStr = p;
							else {
								var h = i.transformTo(d, this.fileName);
								this.fileNameStr = this.loadOptions.decodeFileName(h);
							}
							var A = this.findExtraFieldUnicodeComment();
							if (A !== null) this.fileCommentStr = A;
							else {
								var f = i.transformTo(d, this.fileComment);
								this.fileCommentStr = this.loadOptions.decodeFileName(f);
							}
						}
					},
					findExtraFieldUnicodePath: function() {
						var d = this.extraFields[28789];
						if (d) {
							var p = n(d.value);
							return p.readInt(1) !== 1 || s(this.fileName) !== p.readInt(4) ? null : u.utf8decode(p.readData(d.length - 5));
						}
						return null;
					},
					findExtraFieldUnicodeComment: function() {
						var d = this.extraFields[25461];
						if (d) {
							var p = n(d.value);
							return p.readInt(1) !== 1 || s(this.fileComment) !== p.readInt(4) ? null : u.utf8decode(p.readData(d.length - 5));
						}
						return null;
					}
				}, r.exports = l;
			}, {
				"./compressedObject": 2,
				"./compressions": 3,
				"./crc32": 4,
				"./reader/readerFor": 22,
				"./support": 30,
				"./utf8": 31,
				"./utils": 32
			}],
			35: [function(e, r, t) {
				"use strict";
				function n(p, h, A) {
					this.name = p, this.dir = A.dir, this.date = A.date, this.comment = A.comment, this.unixPermissions = A.unixPermissions, this.dosPermissions = A.dosPermissions, this._data = h, this._dataBinary = A.binary, this.options = {
						compression: A.compression,
						compressionOptions: A.compressionOptions
					};
				}
				var i = e("./stream/StreamHelper"), a = e("./stream/DataWorker"), s = e("./utf8"), u = e("./compressedObject"), c = e("./stream/GenericWorker");
				n.prototype = {
					internalStream: function(p) {
						var h = null, A = "string";
						try {
							if (!p) throw new Error("No output type specified.");
							var f = (A = p.toLowerCase()) === "string" || A === "text";
							A !== "binarystring" && A !== "text" || (A = "string"), h = this._decompressWorker();
							var g = !this._dataBinary;
							g && !f && (h = h.pipe(new s.Utf8EncodeWorker())), !g && f && (h = h.pipe(new s.Utf8DecodeWorker()));
						} catch (_) {
							(h = new c("error")).error(_);
						}
						return new i(h, A, "");
					},
					async: function(p, h) {
						return this.internalStream(p).accumulate(h);
					},
					nodeStream: function(p, h) {
						return this.internalStream(p || "nodebuffer").toNodejsStream(h);
					},
					_compressWorker: function(p, h) {
						if (this._data instanceof u && this._data.compression.magic === p.magic) return this._data.getCompressedWorker();
						var A = this._decompressWorker();
						return this._dataBinary || (A = A.pipe(new s.Utf8EncodeWorker())), u.createWorkerFrom(A, p, h);
					},
					_decompressWorker: function() {
						return this._data instanceof u ? this._data.getContentWorker() : this._data instanceof c ? this._data : new a(this._data);
					}
				};
				for (var o = [
					"asText",
					"asBinary",
					"asNodeBuffer",
					"asUint8Array",
					"asArrayBuffer"
				], l = function() {
					throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
				}, d = 0; d < o.length; d++) n.prototype[o[d]] = l;
				r.exports = n;
			}, {
				"./compressedObject": 2,
				"./stream/DataWorker": 27,
				"./stream/GenericWorker": 28,
				"./stream/StreamHelper": 29,
				"./utf8": 31
			}],
			36: [function(e, r, t) {
				(function(n) {
					"use strict";
					var i, a, s = n.MutationObserver || n.WebKitMutationObserver;
					if (s) {
						var u = 0, c = new s(p), o = n.document.createTextNode("");
						c.observe(o, { characterData: !0 }), i = function() {
							o.data = u = ++u % 2;
						};
					} else if (n.setImmediate || n.MessageChannel === void 0) i = "document" in n && "onreadystatechange" in n.document.createElement("script") ? function() {
						var h = n.document.createElement("script");
						h.onreadystatechange = function() {
							p(), h.onreadystatechange = null, h.parentNode.removeChild(h), h = null;
						}, n.document.documentElement.appendChild(h);
					} : function() {
						setTimeout(p, 0);
					};
					else {
						var l = new n.MessageChannel();
						l.port1.onmessage = p, i = function() {
							l.port2.postMessage(0);
						};
					}
					var d = [];
					function p() {
						var h, A;
						a = !0;
						for (var f = d.length; f;) {
							for (A = d, d = [], h = -1; ++h < f;) A[h]();
							f = d.length;
						}
						a = !1;
					}
					r.exports = function(h) {
						d.push(h) !== 1 || a || i();
					};
				}).call(this, typeof global != "undefined" ? global : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
			}, {}],
			37: [function(e, r, t) {
				"use strict";
				var n = e("immediate");
				function i() {}
				var a = {}, s = ["REJECTED"], u = ["FULFILLED"], c = ["PENDING"];
				function o(f) {
					if (typeof f != "function") throw new TypeError("resolver must be a function");
					this.state = c, this.queue = [], this.outcome = void 0, f !== i && h(this, f);
				}
				function l(f, g, _) {
					this.promise = f, typeof g == "function" && (this.onFulfilled = g, this.callFulfilled = this.otherCallFulfilled), typeof _ == "function" && (this.onRejected = _, this.callRejected = this.otherCallRejected);
				}
				function d(f, g, _) {
					n(function() {
						var v;
						try {
							v = g(_);
						} catch (b) {
							return a.reject(f, b);
						}
						v === f ? a.reject(f, /* @__PURE__ */ new TypeError("Cannot resolve promise with itself")) : a.resolve(f, v);
					});
				}
				function p(f) {
					var g = f && f.then;
					if (f && (typeof f == "object" || typeof f == "function") && typeof g == "function") return function() {
						g.apply(f, arguments);
					};
				}
				function h(f, g) {
					var _ = !1;
					function v(T) {
						_ || (_ = !0, a.reject(f, T));
					}
					function b(T) {
						_ || (_ = !0, a.resolve(f, T));
					}
					var C = A(function() {
						g(b, v);
					});
					C.status === "error" && v(C.value);
				}
				function A(f, g) {
					var _ = {};
					try {
						_.value = f(g), _.status = "success";
					} catch (v) {
						_.status = "error", _.value = v;
					}
					return _;
				}
				(r.exports = o).prototype.finally = function(f) {
					if (typeof f != "function") return this;
					var g = this.constructor;
					return this.then(function(_) {
						return g.resolve(f()).then(function() {
							return _;
						});
					}, function(_) {
						return g.resolve(f()).then(function() {
							throw _;
						});
					});
				}, o.prototype.catch = function(f) {
					return this.then(null, f);
				}, o.prototype.then = function(f, g) {
					if (typeof f != "function" && this.state === u || typeof g != "function" && this.state === s) return this;
					var _ = new this.constructor(i);
					return this.state !== c ? d(_, this.state === u ? f : g, this.outcome) : this.queue.push(new l(_, f, g)), _;
				}, l.prototype.callFulfilled = function(f) {
					a.resolve(this.promise, f);
				}, l.prototype.otherCallFulfilled = function(f) {
					d(this.promise, this.onFulfilled, f);
				}, l.prototype.callRejected = function(f) {
					a.reject(this.promise, f);
				}, l.prototype.otherCallRejected = function(f) {
					d(this.promise, this.onRejected, f);
				}, a.resolve = function(f, g) {
					var _ = A(p, g);
					if (_.status === "error") return a.reject(f, _.value);
					var v = _.value;
					if (v) h(f, v);
					else {
						f.state = u, f.outcome = g;
						for (var b = -1, C = f.queue.length; ++b < C;) f.queue[b].callFulfilled(g);
					}
					return f;
				}, a.reject = function(f, g) {
					f.state = s, f.outcome = g;
					for (var _ = -1, v = f.queue.length; ++_ < v;) f.queue[_].callRejected(g);
					return f;
				}, o.resolve = function(f) {
					return f instanceof this ? f : a.resolve(new this(i), f);
				}, o.reject = function(f) {
					var g = new this(i);
					return a.reject(g, f);
				}, o.all = function(f) {
					var g = this;
					if (Object.prototype.toString.call(f) !== "[object Array]") return this.reject(/* @__PURE__ */ new TypeError("must be an array"));
					var _ = f.length, v = !1;
					if (!_) return this.resolve([]);
					for (var b = new Array(_), C = 0, T = -1, ee = new this(i); ++T < _;) x(f[T], T);
					return ee;
					function x(G, O) {
						g.resolve(G).then(function(k) {
							b[O] = k, ++C !== _ || v || (v = !0, a.resolve(ee, b));
						}, function(k) {
							v || (v = !0, a.reject(ee, k));
						});
					}
				}, o.race = function(f) {
					var g = this;
					if (Object.prototype.toString.call(f) !== "[object Array]") return this.reject(/* @__PURE__ */ new TypeError("must be an array"));
					var _ = f.length, v = !1;
					if (!_) return this.resolve([]);
					for (var b = -1, C = new this(i); ++b < _;) T = f[b], g.resolve(T).then(function(ee) {
						v || (v = !0, a.resolve(C, ee));
					}, function(ee) {
						v || (v = !0, a.reject(C, ee));
					});
					var T;
					return C;
				};
			}, { immediate: 36 }],
			38: [function(e, r, t) {
				"use strict";
				var n = {};
				(0, e("./lib/utils/common").assign)(n, e("./lib/deflate"), e("./lib/inflate"), e("./lib/zlib/constants")), r.exports = n;
			}, {
				"./lib/deflate": 39,
				"./lib/inflate": 40,
				"./lib/utils/common": 41,
				"./lib/zlib/constants": 44
			}],
			39: [function(e, r, t) {
				"use strict";
				var n = e("./zlib/deflate"), i = e("./utils/common"), a = e("./utils/strings"), s = e("./zlib/messages"), u = e("./zlib/zstream"), c = Object.prototype.toString, o = 0, l = -1, d = 0, p = 8;
				function h(f) {
					if (!(this instanceof h)) return new h(f);
					this.options = i.assign({
						level: l,
						method: p,
						chunkSize: 16384,
						windowBits: 15,
						memLevel: 8,
						strategy: d,
						to: ""
					}, f || {});
					var g = this.options;
					g.raw && 0 < g.windowBits ? g.windowBits = -g.windowBits : g.gzip && 0 < g.windowBits && g.windowBits < 16 && (g.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new u(), this.strm.avail_out = 0;
					var _ = n.deflateInit2(this.strm, g.level, g.method, g.windowBits, g.memLevel, g.strategy);
					if (_ !== o) throw new Error(s[_]);
					if (g.header && n.deflateSetHeader(this.strm, g.header), g.dictionary) {
						var v;
						if (v = typeof g.dictionary == "string" ? a.string2buf(g.dictionary) : c.call(g.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(g.dictionary) : g.dictionary, (_ = n.deflateSetDictionary(this.strm, v)) !== o) throw new Error(s[_]);
						this._dict_set = !0;
					}
				}
				function A(f, g) {
					var _ = new h(g);
					if (_.push(f, !0), _.err) throw _.msg || s[_.err];
					return _.result;
				}
				h.prototype.push = function(f, g) {
					var _, v, b = this.strm, C = this.options.chunkSize;
					if (this.ended) return !1;
					v = g === ~~g ? g : g === !0 ? 4 : 0, typeof f == "string" ? b.input = a.string2buf(f) : c.call(f) === "[object ArrayBuffer]" ? b.input = new Uint8Array(f) : b.input = f, b.next_in = 0, b.avail_in = b.input.length;
					do {
						if (b.avail_out === 0 && (b.output = new i.Buf8(C), b.next_out = 0, b.avail_out = C), (_ = n.deflate(b, v)) !== 1 && _ !== o) return this.onEnd(_), !(this.ended = !0);
						b.avail_out !== 0 && (b.avail_in !== 0 || v !== 4 && v !== 2) || (this.options.to === "string" ? this.onData(a.buf2binstring(i.shrinkBuf(b.output, b.next_out))) : this.onData(i.shrinkBuf(b.output, b.next_out)));
					} while ((0 < b.avail_in || b.avail_out === 0) && _ !== 1);
					return v === 4 ? (_ = n.deflateEnd(this.strm), this.onEnd(_), this.ended = !0, _ === o) : v !== 2 || (this.onEnd(o), !(b.avail_out = 0));
				}, h.prototype.onData = function(f) {
					this.chunks.push(f);
				}, h.prototype.onEnd = function(f) {
					f === o && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = i.flattenChunks(this.chunks)), this.chunks = [], this.err = f, this.msg = this.strm.msg;
				}, t.Deflate = h, t.deflate = A, t.deflateRaw = function(f, g) {
					return (g = g || {}).raw = !0, A(f, g);
				}, t.gzip = function(f, g) {
					return (g = g || {}).gzip = !0, A(f, g);
				};
			}, {
				"./utils/common": 41,
				"./utils/strings": 42,
				"./zlib/deflate": 46,
				"./zlib/messages": 51,
				"./zlib/zstream": 53
			}],
			40: [function(e, r, t) {
				"use strict";
				var n = e("./zlib/inflate"), i = e("./utils/common"), a = e("./utils/strings"), s = e("./zlib/constants"), u = e("./zlib/messages"), c = e("./zlib/zstream"), o = e("./zlib/gzheader"), l = Object.prototype.toString;
				function d(h) {
					if (!(this instanceof d)) return new d(h);
					this.options = i.assign({
						chunkSize: 16384,
						windowBits: 0,
						to: ""
					}, h || {});
					var A = this.options;
					A.raw && 0 <= A.windowBits && A.windowBits < 16 && (A.windowBits = -A.windowBits, A.windowBits === 0 && (A.windowBits = -15)), !(0 <= A.windowBits && A.windowBits < 16) || h && h.windowBits || (A.windowBits += 32), 15 < A.windowBits && A.windowBits < 48 && !(15 & A.windowBits) && (A.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new c(), this.strm.avail_out = 0;
					var f = n.inflateInit2(this.strm, A.windowBits);
					if (f !== s.Z_OK) throw new Error(u[f]);
					this.header = new o(), n.inflateGetHeader(this.strm, this.header);
				}
				function p(h, A) {
					var f = new d(A);
					if (f.push(h, !0), f.err) throw f.msg || u[f.err];
					return f.result;
				}
				d.prototype.push = function(h, A) {
					var f, g, _, v, b, C, T = this.strm, ee = this.options.chunkSize, x = this.options.dictionary, G = !1;
					if (this.ended) return !1;
					g = A === ~~A ? A : A === !0 ? s.Z_FINISH : s.Z_NO_FLUSH, typeof h == "string" ? T.input = a.binstring2buf(h) : l.call(h) === "[object ArrayBuffer]" ? T.input = new Uint8Array(h) : T.input = h, T.next_in = 0, T.avail_in = T.input.length;
					do {
						if (T.avail_out === 0 && (T.output = new i.Buf8(ee), T.next_out = 0, T.avail_out = ee), (f = n.inflate(T, s.Z_NO_FLUSH)) === s.Z_NEED_DICT && x && (C = typeof x == "string" ? a.string2buf(x) : l.call(x) === "[object ArrayBuffer]" ? new Uint8Array(x) : x, f = n.inflateSetDictionary(this.strm, C)), f === s.Z_BUF_ERROR && G === !0 && (f = s.Z_OK, G = !1), f !== s.Z_STREAM_END && f !== s.Z_OK) return this.onEnd(f), !(this.ended = !0);
						T.next_out && (T.avail_out !== 0 && f !== s.Z_STREAM_END && (T.avail_in !== 0 || g !== s.Z_FINISH && g !== s.Z_SYNC_FLUSH) || (this.options.to === "string" ? (_ = a.utf8border(T.output, T.next_out), v = T.next_out - _, b = a.buf2string(T.output, _), T.next_out = v, T.avail_out = ee - v, v && i.arraySet(T.output, T.output, _, v, 0), this.onData(b)) : this.onData(i.shrinkBuf(T.output, T.next_out)))), T.avail_in === 0 && T.avail_out === 0 && (G = !0);
					} while ((0 < T.avail_in || T.avail_out === 0) && f !== s.Z_STREAM_END);
					return f === s.Z_STREAM_END && (g = s.Z_FINISH), g === s.Z_FINISH ? (f = n.inflateEnd(this.strm), this.onEnd(f), this.ended = !0, f === s.Z_OK) : g !== s.Z_SYNC_FLUSH || (this.onEnd(s.Z_OK), !(T.avail_out = 0));
				}, d.prototype.onData = function(h) {
					this.chunks.push(h);
				}, d.prototype.onEnd = function(h) {
					h === s.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = i.flattenChunks(this.chunks)), this.chunks = [], this.err = h, this.msg = this.strm.msg;
				}, t.Inflate = d, t.inflate = p, t.inflateRaw = function(h, A) {
					return (A = A || {}).raw = !0, p(h, A);
				}, t.ungzip = p;
			}, {
				"./utils/common": 41,
				"./utils/strings": 42,
				"./zlib/constants": 44,
				"./zlib/gzheader": 47,
				"./zlib/inflate": 49,
				"./zlib/messages": 51,
				"./zlib/zstream": 53
			}],
			41: [function(e, r, t) {
				"use strict";
				var n = typeof Uint8Array != "undefined" && typeof Uint16Array != "undefined" && typeof Int32Array != "undefined";
				t.assign = function(s) {
					for (var u = Array.prototype.slice.call(arguments, 1); u.length;) {
						var c = u.shift();
						if (c) {
							if (typeof c != "object") throw new TypeError(c + "must be non-object");
							for (var o in c) c.hasOwnProperty(o) && (s[o] = c[o]);
						}
					}
					return s;
				}, t.shrinkBuf = function(s, u) {
					return s.length === u ? s : s.subarray ? s.subarray(0, u) : (s.length = u, s);
				};
				var i = {
					arraySet: function(s, u, c, o, l) {
						if (u.subarray && s.subarray) s.set(u.subarray(c, c + o), l);
						else for (var d = 0; d < o; d++) s[l + d] = u[c + d];
					},
					flattenChunks: function(s) {
						var u, c, o, l, d, p;
						for (u = o = 0, c = s.length; u < c; u++) o += s[u].length;
						for (p = new Uint8Array(o), u = l = 0, c = s.length; u < c; u++) d = s[u], p.set(d, l), l += d.length;
						return p;
					}
				}, a = {
					arraySet: function(s, u, c, o, l) {
						for (var d = 0; d < o; d++) s[l + d] = u[c + d];
					},
					flattenChunks: function(s) {
						return [].concat.apply([], s);
					}
				};
				t.setTyped = function(s) {
					s ? (t.Buf8 = Uint8Array, t.Buf16 = Uint16Array, t.Buf32 = Int32Array, t.assign(t, i)) : (t.Buf8 = Array, t.Buf16 = Array, t.Buf32 = Array, t.assign(t, a));
				}, t.setTyped(n);
			}, {}],
			42: [function(e, r, t) {
				"use strict";
				var n = e("./common"), i = !0, a = !0;
				try {
					String.fromCharCode.apply(null, [0]);
				} catch (o) {
					i = !1;
				}
				try {
					String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1));
				} catch (o) {
					a = !1;
				}
				for (var s = new n.Buf8(256), u = 0; u < 256; u++) s[u] = 252 <= u ? 6 : 248 <= u ? 5 : 240 <= u ? 4 : 224 <= u ? 3 : 192 <= u ? 2 : 1;
				function c(o, l) {
					if (l < 65537 && (o.subarray && a || !o.subarray && i)) return String.fromCharCode.apply(null, n.shrinkBuf(o, l));
					for (var d = "", p = 0; p < l; p++) d += String.fromCharCode(o[p]);
					return d;
				}
				s[254] = s[254] = 1, t.string2buf = function(o) {
					var l, d, p, h, A, f = o.length, g = 0;
					for (h = 0; h < f; h++) (64512 & (d = o.charCodeAt(h))) == 55296 && h + 1 < f && (64512 & (p = o.charCodeAt(h + 1))) == 56320 && (d = 65536 + (d - 55296 << 10) + (p - 56320), h++), g += d < 128 ? 1 : d < 2048 ? 2 : d < 65536 ? 3 : 4;
					for (l = new n.Buf8(g), h = A = 0; A < g; h++) (64512 & (d = o.charCodeAt(h))) == 55296 && h + 1 < f && (64512 & (p = o.charCodeAt(h + 1))) == 56320 && (d = 65536 + (d - 55296 << 10) + (p - 56320), h++), d < 128 ? l[A++] = d : (d < 2048 ? l[A++] = 192 | d >>> 6 : (d < 65536 ? l[A++] = 224 | d >>> 12 : (l[A++] = 240 | d >>> 18, l[A++] = 128 | d >>> 12 & 63), l[A++] = 128 | d >>> 6 & 63), l[A++] = 128 | 63 & d);
					return l;
				}, t.buf2binstring = function(o) {
					return c(o, o.length);
				}, t.binstring2buf = function(o) {
					for (var l = new n.Buf8(o.length), d = 0, p = l.length; d < p; d++) l[d] = o.charCodeAt(d);
					return l;
				}, t.buf2string = function(o, l) {
					var d, p, h, A, f = l || o.length, g = new Array(2 * f);
					for (d = p = 0; d < f;) if ((h = o[d++]) < 128) g[p++] = h;
					else if (4 < (A = s[h])) g[p++] = 65533, d += A - 1;
					else {
						for (h &= A === 2 ? 31 : A === 3 ? 15 : 7; 1 < A && d < f;) h = h << 6 | 63 & o[d++], A--;
						1 < A ? g[p++] = 65533 : h < 65536 ? g[p++] = h : (h -= 65536, g[p++] = 55296 | h >> 10 & 1023, g[p++] = 56320 | 1023 & h);
					}
					return c(g, p);
				}, t.utf8border = function(o, l) {
					var d;
					for ((l = l || o.length) > o.length && (l = o.length), d = l - 1; 0 <= d && (192 & o[d]) == 128;) d--;
					return d < 0 || d === 0 ? l : d + s[o[d]] > l ? d : l;
				};
			}, { "./common": 41 }],
			43: [function(e, r, t) {
				"use strict";
				r.exports = function(n, i, a, s) {
					for (var u = 65535 & n | 0, c = n >>> 16 & 65535 | 0, o = 0; a !== 0;) {
						for (a -= o = 2e3 < a ? 2e3 : a; c = c + (u = u + i[s++] | 0) | 0, --o;);
						u %= 65521, c %= 65521;
					}
					return u | c << 16 | 0;
				};
			}, {}],
			44: [function(e, r, t) {
				"use strict";
				r.exports = {
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
			}, {}],
			45: [function(e, r, t) {
				"use strict";
				var n = (function() {
					for (var i, a = [], s = 0; s < 256; s++) {
						i = s;
						for (var u = 0; u < 8; u++) i = 1 & i ? 3988292384 ^ i >>> 1 : i >>> 1;
						a[s] = i;
					}
					return a;
				})();
				r.exports = function(i, a, s, u) {
					var c = n, o = u + s;
					i ^= -1;
					for (var l = u; l < o; l++) i = i >>> 8 ^ c[255 & (i ^ a[l])];
					return -1 ^ i;
				};
			}, {}],
			46: [function(e, r, t) {
				"use strict";
				var n, i = e("../utils/common"), a = e("./trees"), s = e("./adler32"), u = e("./crc32"), c = e("./messages"), o = 0, l = 4, d = 0, p = -2, h = -1, A = 4, f = 2, g = 8, _ = 9, v = 286, b = 30, C = 19, T = 2 * v + 1, ee = 15, x = 3, G = 258, O = G + x + 1, k = 42, H = 113, m = 1, V = 2, y = 3, ie = 4;
				function xe(E, _e) {
					return E.msg = c[_e], _e;
				}
				function se(E) {
					return (E << 1) - (4 < E ? 9 : 0);
				}
				function ae(E) {
					for (var _e = E.length; 0 <= --_e;) E[_e] = 0;
				}
				function R(E) {
					var _e = E.state, w = _e.pending;
					w > E.avail_out && (w = E.avail_out), w !== 0 && (i.arraySet(E.output, _e.pending_buf, _e.pending_out, w, E.next_out), E.next_out += w, _e.pending_out += w, E.total_out += w, E.avail_out -= w, _e.pending -= w, _e.pending === 0 && (_e.pending_out = 0));
				}
				function W(E, _e) {
					a._tr_flush_block(E, 0 <= E.block_start ? E.block_start : -1, E.strstart - E.block_start, _e), E.block_start = E.strstart, R(E.strm);
				}
				function q(E, _e) {
					E.pending_buf[E.pending++] = _e;
				}
				function Z(E, _e) {
					E.pending_buf[E.pending++] = _e >>> 8 & 255, E.pending_buf[E.pending++] = 255 & _e;
				}
				function ge(E, _e) {
					var w, N, D = E.max_chain_length, I = E.strstart, S = E.prev_length, z = E.nice_match, X = E.strstart > E.w_size - O ? E.strstart - (E.w_size - O) : 0, K = E.window, re = E.w_mask, ne = E.prev, oe = E.strstart + G, me = K[I + S - 1], be = K[I + S];
					E.prev_length >= E.good_match && (D >>= 2), z > E.lookahead && (z = E.lookahead);
					do
						if (K[(w = _e) + S] === be && K[w + S - 1] === me && K[w] === K[I] && K[++w] === K[I + 1]) {
							I += 2, w++;
							do							;
while (K[++I] === K[++w] && K[++I] === K[++w] && K[++I] === K[++w] && K[++I] === K[++w] && K[++I] === K[++w] && K[++I] === K[++w] && K[++I] === K[++w] && K[++I] === K[++w] && I < oe);
							if (N = G - (oe - I), I = oe - G, S < N) {
								if (E.match_start = _e, z <= (S = N)) break;
								me = K[I + S - 1], be = K[I + S];
							}
						}
					while ((_e = ne[_e & re]) > X && --D != 0);
					return S <= E.lookahead ? S : E.lookahead;
				}
				function Ee(E) {
					var _e, w, N, D, I, S, z, X, K, re, ne = E.w_size;
					do {
						if (D = E.window_size - E.lookahead - E.strstart, E.strstart >= ne + (ne - O)) {
							for (i.arraySet(E.window, E.window, ne, ne, 0), E.match_start -= ne, E.strstart -= ne, E.block_start -= ne, _e = w = E.hash_size; N = E.head[--_e], E.head[_e] = ne <= N ? N - ne : 0, --w;);
							for (_e = w = ne; N = E.prev[--_e], E.prev[_e] = ne <= N ? N - ne : 0, --w;);
							D += ne;
						}
						if (E.strm.avail_in === 0) break;
						if (S = E.strm, z = E.window, X = E.strstart + E.lookahead, K = D, re = void 0, re = S.avail_in, K < re && (re = K), w = re === 0 ? 0 : (S.avail_in -= re, i.arraySet(z, S.input, S.next_in, re, X), S.state.wrap === 1 ? S.adler = s(S.adler, z, re, X) : S.state.wrap === 2 && (S.adler = u(S.adler, z, re, X)), S.next_in += re, S.total_in += re, re), E.lookahead += w, E.lookahead + E.insert >= x) for (I = E.strstart - E.insert, E.ins_h = E.window[I], E.ins_h = (E.ins_h << E.hash_shift ^ E.window[I + 1]) & E.hash_mask; E.insert && (E.ins_h = (E.ins_h << E.hash_shift ^ E.window[I + x - 1]) & E.hash_mask, E.prev[I & E.w_mask] = E.head[E.ins_h], E.head[E.ins_h] = I, I++, E.insert--, !(E.lookahead + E.insert < x)););
					} while (E.lookahead < O && E.strm.avail_in !== 0);
				}
				function ye(E, _e) {
					for (var w, N;;) {
						if (E.lookahead < O) {
							if (Ee(E), E.lookahead < O && _e === o) return m;
							if (E.lookahead === 0) break;
						}
						if (w = 0, E.lookahead >= x && (E.ins_h = (E.ins_h << E.hash_shift ^ E.window[E.strstart + x - 1]) & E.hash_mask, w = E.prev[E.strstart & E.w_mask] = E.head[E.ins_h], E.head[E.ins_h] = E.strstart), w !== 0 && E.strstart - w <= E.w_size - O && (E.match_length = ge(E, w)), E.match_length >= x) if (N = a._tr_tally(E, E.strstart - E.match_start, E.match_length - x), E.lookahead -= E.match_length, E.match_length <= E.max_lazy_match && E.lookahead >= x) {
							for (E.match_length--; E.strstart++, E.ins_h = (E.ins_h << E.hash_shift ^ E.window[E.strstart + x - 1]) & E.hash_mask, w = E.prev[E.strstart & E.w_mask] = E.head[E.ins_h], E.head[E.ins_h] = E.strstart, --E.match_length != 0;);
							E.strstart++;
						} else E.strstart += E.match_length, E.match_length = 0, E.ins_h = E.window[E.strstart], E.ins_h = (E.ins_h << E.hash_shift ^ E.window[E.strstart + 1]) & E.hash_mask;
						else N = a._tr_tally(E, 0, E.window[E.strstart]), E.lookahead--, E.strstart++;
						if (N && (W(E, !1), E.strm.avail_out === 0)) return m;
					}
					return E.insert = E.strstart < x - 1 ? E.strstart : x - 1, _e === l ? (W(E, !0), E.strm.avail_out === 0 ? y : ie) : E.last_lit && (W(E, !1), E.strm.avail_out === 0) ? m : V;
				}
				function Ne(E, _e) {
					for (var w, N, D;;) {
						if (E.lookahead < O) {
							if (Ee(E), E.lookahead < O && _e === o) return m;
							if (E.lookahead === 0) break;
						}
						if (w = 0, E.lookahead >= x && (E.ins_h = (E.ins_h << E.hash_shift ^ E.window[E.strstart + x - 1]) & E.hash_mask, w = E.prev[E.strstart & E.w_mask] = E.head[E.ins_h], E.head[E.ins_h] = E.strstart), E.prev_length = E.match_length, E.prev_match = E.match_start, E.match_length = x - 1, w !== 0 && E.prev_length < E.max_lazy_match && E.strstart - w <= E.w_size - O && (E.match_length = ge(E, w), E.match_length <= 5 && (E.strategy === 1 || E.match_length === x && 4096 < E.strstart - E.match_start) && (E.match_length = x - 1)), E.prev_length >= x && E.match_length <= E.prev_length) {
							for (D = E.strstart + E.lookahead - x, N = a._tr_tally(E, E.strstart - 1 - E.prev_match, E.prev_length - x), E.lookahead -= E.prev_length - 1, E.prev_length -= 2; ++E.strstart <= D && (E.ins_h = (E.ins_h << E.hash_shift ^ E.window[E.strstart + x - 1]) & E.hash_mask, w = E.prev[E.strstart & E.w_mask] = E.head[E.ins_h], E.head[E.ins_h] = E.strstart), --E.prev_length != 0;);
							if (E.match_available = 0, E.match_length = x - 1, E.strstart++, N && (W(E, !1), E.strm.avail_out === 0)) return m;
						} else if (E.match_available) {
							if ((N = a._tr_tally(E, 0, E.window[E.strstart - 1])) && W(E, !1), E.strstart++, E.lookahead--, E.strm.avail_out === 0) return m;
						} else E.match_available = 1, E.strstart++, E.lookahead--;
					}
					return E.match_available && (N = a._tr_tally(E, 0, E.window[E.strstart - 1]), E.match_available = 0), E.insert = E.strstart < x - 1 ? E.strstart : x - 1, _e === l ? (W(E, !0), E.strm.avail_out === 0 ? y : ie) : E.last_lit && (W(E, !1), E.strm.avail_out === 0) ? m : V;
				}
				function Oe(E, _e, w, N, D) {
					this.good_length = E, this.max_lazy = _e, this.nice_length = w, this.max_chain = N, this.func = D;
				}
				function Ue() {
					this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = g, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new i.Buf16(2 * T), this.dyn_dtree = new i.Buf16(2 * (2 * b + 1)), this.bl_tree = new i.Buf16(2 * (2 * C + 1)), ae(this.dyn_ltree), ae(this.dyn_dtree), ae(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new i.Buf16(ee + 1), this.heap = new i.Buf16(2 * v + 1), ae(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new i.Buf16(2 * v + 1), ae(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
				}
				function Re(E) {
					var _e;
					return E && E.state ? (E.total_in = E.total_out = 0, E.data_type = f, (_e = E.state).pending = 0, _e.pending_out = 0, _e.wrap < 0 && (_e.wrap = -_e.wrap), _e.status = _e.wrap ? k : H, E.adler = _e.wrap === 2 ? 0 : 1, _e.last_flush = o, a._tr_init(_e), d) : xe(E, p);
				}
				function je(E) {
					var _e = Re(E);
					return _e === d && (function(w) {
						w.window_size = 2 * w.w_size, ae(w.head), w.max_lazy_match = n[w.level].max_lazy, w.good_match = n[w.level].good_length, w.nice_match = n[w.level].nice_length, w.max_chain_length = n[w.level].max_chain, w.strstart = 0, w.block_start = 0, w.lookahead = 0, w.insert = 0, w.match_length = w.prev_length = x - 1, w.match_available = 0, w.ins_h = 0;
					})(E.state), _e;
				}
				function qe(E, _e, w, N, D, I) {
					if (!E) return p;
					var S = 1;
					if (_e === h && (_e = 6), N < 0 ? (S = 0, N = -N) : 15 < N && (S = 2, N -= 16), D < 1 || _ < D || w !== g || N < 8 || 15 < N || _e < 0 || 9 < _e || I < 0 || A < I) return xe(E, p);
					N === 8 && (N = 9);
					var z = new Ue();
					return (E.state = z).strm = E, z.wrap = S, z.gzhead = null, z.w_bits = N, z.w_size = 1 << z.w_bits, z.w_mask = z.w_size - 1, z.hash_bits = D + 7, z.hash_size = 1 << z.hash_bits, z.hash_mask = z.hash_size - 1, z.hash_shift = ~~((z.hash_bits + x - 1) / x), z.window = new i.Buf8(2 * z.w_size), z.head = new i.Buf16(z.hash_size), z.prev = new i.Buf16(z.w_size), z.lit_bufsize = 1 << D + 6, z.pending_buf_size = 4 * z.lit_bufsize, z.pending_buf = new i.Buf8(z.pending_buf_size), z.d_buf = 1 * z.lit_bufsize, z.l_buf = 3 * z.lit_bufsize, z.level = _e, z.strategy = I, z.method = w, je(E);
				}
				n = [
					new Oe(0, 0, 0, 0, function(E, _e) {
						var w = 65535;
						for (w > E.pending_buf_size - 5 && (w = E.pending_buf_size - 5);;) {
							if (E.lookahead <= 1) {
								if (Ee(E), E.lookahead === 0 && _e === o) return m;
								if (E.lookahead === 0) break;
							}
							E.strstart += E.lookahead, E.lookahead = 0;
							var N = E.block_start + w;
							if ((E.strstart === 0 || E.strstart >= N) && (E.lookahead = E.strstart - N, E.strstart = N, W(E, !1), E.strm.avail_out === 0) || E.strstart - E.block_start >= E.w_size - O && (W(E, !1), E.strm.avail_out === 0)) return m;
						}
						return E.insert = 0, _e === l ? (W(E, !0), E.strm.avail_out === 0 ? y : ie) : (E.strstart > E.block_start && (W(E, !1), E.strm.avail_out), m);
					}),
					new Oe(4, 4, 8, 4, ye),
					new Oe(4, 5, 16, 8, ye),
					new Oe(4, 6, 32, 32, ye),
					new Oe(4, 4, 16, 16, Ne),
					new Oe(8, 16, 32, 32, Ne),
					new Oe(8, 16, 128, 128, Ne),
					new Oe(8, 32, 128, 256, Ne),
					new Oe(32, 128, 258, 1024, Ne),
					new Oe(32, 258, 258, 4096, Ne)
				], t.deflateInit = function(E, _e) {
					return qe(E, _e, g, 15, 8, 0);
				}, t.deflateInit2 = qe, t.deflateReset = je, t.deflateResetKeep = Re, t.deflateSetHeader = function(E, _e) {
					return E && E.state ? E.state.wrap !== 2 ? p : (E.state.gzhead = _e, d) : p;
				}, t.deflate = function(E, _e) {
					var w, N, D, I;
					if (!E || !E.state || 5 < _e || _e < 0) return E ? xe(E, p) : p;
					if (N = E.state, !E.output || !E.input && E.avail_in !== 0 || N.status === 666 && _e !== l) return xe(E, E.avail_out === 0 ? -5 : p);
					if (N.strm = E, w = N.last_flush, N.last_flush = _e, N.status === k) if (N.wrap === 2) E.adler = 0, q(N, 31), q(N, 139), q(N, 8), N.gzhead ? (q(N, (N.gzhead.text ? 1 : 0) + (N.gzhead.hcrc ? 2 : 0) + (N.gzhead.extra ? 4 : 0) + (N.gzhead.name ? 8 : 0) + (N.gzhead.comment ? 16 : 0)), q(N, 255 & N.gzhead.time), q(N, N.gzhead.time >> 8 & 255), q(N, N.gzhead.time >> 16 & 255), q(N, N.gzhead.time >> 24 & 255), q(N, N.level === 9 ? 2 : 2 <= N.strategy || N.level < 2 ? 4 : 0), q(N, 255 & N.gzhead.os), N.gzhead.extra && N.gzhead.extra.length && (q(N, 255 & N.gzhead.extra.length), q(N, N.gzhead.extra.length >> 8 & 255)), N.gzhead.hcrc && (E.adler = u(E.adler, N.pending_buf, N.pending, 0)), N.gzindex = 0, N.status = 69) : (q(N, 0), q(N, 0), q(N, 0), q(N, 0), q(N, 0), q(N, N.level === 9 ? 2 : 2 <= N.strategy || N.level < 2 ? 4 : 0), q(N, 3), N.status = H);
					else {
						var S = g + (N.w_bits - 8 << 4) << 8;
						S |= (2 <= N.strategy || N.level < 2 ? 0 : N.level < 6 ? 1 : N.level === 6 ? 2 : 3) << 6, N.strstart !== 0 && (S |= 32), S += 31 - S % 31, N.status = H, Z(N, S), N.strstart !== 0 && (Z(N, E.adler >>> 16), Z(N, 65535 & E.adler)), E.adler = 1;
					}
					if (N.status === 69) if (N.gzhead.extra) {
						for (D = N.pending; N.gzindex < (65535 & N.gzhead.extra.length) && (N.pending !== N.pending_buf_size || (N.gzhead.hcrc && N.pending > D && (E.adler = u(E.adler, N.pending_buf, N.pending - D, D)), R(E), D = N.pending, N.pending !== N.pending_buf_size));) q(N, 255 & N.gzhead.extra[N.gzindex]), N.gzindex++;
						N.gzhead.hcrc && N.pending > D && (E.adler = u(E.adler, N.pending_buf, N.pending - D, D)), N.gzindex === N.gzhead.extra.length && (N.gzindex = 0, N.status = 73);
					} else N.status = 73;
					if (N.status === 73) if (N.gzhead.name) {
						D = N.pending;
						do {
							if (N.pending === N.pending_buf_size && (N.gzhead.hcrc && N.pending > D && (E.adler = u(E.adler, N.pending_buf, N.pending - D, D)), R(E), D = N.pending, N.pending === N.pending_buf_size)) {
								I = 1;
								break;
							}
							I = N.gzindex < N.gzhead.name.length ? 255 & N.gzhead.name.charCodeAt(N.gzindex++) : 0, q(N, I);
						} while (I !== 0);
						N.gzhead.hcrc && N.pending > D && (E.adler = u(E.adler, N.pending_buf, N.pending - D, D)), I === 0 && (N.gzindex = 0, N.status = 91);
					} else N.status = 91;
					if (N.status === 91) if (N.gzhead.comment) {
						D = N.pending;
						do {
							if (N.pending === N.pending_buf_size && (N.gzhead.hcrc && N.pending > D && (E.adler = u(E.adler, N.pending_buf, N.pending - D, D)), R(E), D = N.pending, N.pending === N.pending_buf_size)) {
								I = 1;
								break;
							}
							I = N.gzindex < N.gzhead.comment.length ? 255 & N.gzhead.comment.charCodeAt(N.gzindex++) : 0, q(N, I);
						} while (I !== 0);
						N.gzhead.hcrc && N.pending > D && (E.adler = u(E.adler, N.pending_buf, N.pending - D, D)), I === 0 && (N.status = 103);
					} else N.status = 103;
					if (N.status === 103 && (N.gzhead.hcrc ? (N.pending + 2 > N.pending_buf_size && R(E), N.pending + 2 <= N.pending_buf_size && (q(N, 255 & E.adler), q(N, E.adler >> 8 & 255), E.adler = 0, N.status = H)) : N.status = H), N.pending !== 0) {
						if (R(E), E.avail_out === 0) return N.last_flush = -1, d;
					} else if (E.avail_in === 0 && se(_e) <= se(w) && _e !== l) return xe(E, -5);
					if (N.status === 666 && E.avail_in !== 0) return xe(E, -5);
					if (E.avail_in !== 0 || N.lookahead !== 0 || _e !== o && N.status !== 666) {
						var z = N.strategy === 2 ? (function(X, K) {
							for (var re;;) {
								if (X.lookahead === 0 && (Ee(X), X.lookahead === 0)) {
									if (K === o) return m;
									break;
								}
								if (X.match_length = 0, re = a._tr_tally(X, 0, X.window[X.strstart]), X.lookahead--, X.strstart++, re && (W(X, !1), X.strm.avail_out === 0)) return m;
							}
							return X.insert = 0, K === l ? (W(X, !0), X.strm.avail_out === 0 ? y : ie) : X.last_lit && (W(X, !1), X.strm.avail_out === 0) ? m : V;
						})(N, _e) : N.strategy === 3 ? (function(X, K) {
							for (var re, ne, oe, me, be = X.window;;) {
								if (X.lookahead <= G) {
									if (Ee(X), X.lookahead <= G && K === o) return m;
									if (X.lookahead === 0) break;
								}
								if (X.match_length = 0, X.lookahead >= x && 0 < X.strstart && (ne = be[oe = X.strstart - 1]) === be[++oe] && ne === be[++oe] && ne === be[++oe]) {
									me = X.strstart + G;
									do									;
while (ne === be[++oe] && ne === be[++oe] && ne === be[++oe] && ne === be[++oe] && ne === be[++oe] && ne === be[++oe] && ne === be[++oe] && ne === be[++oe] && oe < me);
									X.match_length = G - (me - oe), X.match_length > X.lookahead && (X.match_length = X.lookahead);
								}
								if (X.match_length >= x ? (re = a._tr_tally(X, 1, X.match_length - x), X.lookahead -= X.match_length, X.strstart += X.match_length, X.match_length = 0) : (re = a._tr_tally(X, 0, X.window[X.strstart]), X.lookahead--, X.strstart++), re && (W(X, !1), X.strm.avail_out === 0)) return m;
							}
							return X.insert = 0, K === l ? (W(X, !0), X.strm.avail_out === 0 ? y : ie) : X.last_lit && (W(X, !1), X.strm.avail_out === 0) ? m : V;
						})(N, _e) : n[N.level].func(N, _e);
						if (z !== y && z !== ie || (N.status = 666), z === m || z === y) return E.avail_out === 0 && (N.last_flush = -1), d;
						if (z === V && (_e === 1 ? a._tr_align(N) : _e !== 5 && (a._tr_stored_block(N, 0, 0, !1), _e === 3 && (ae(N.head), N.lookahead === 0 && (N.strstart = 0, N.block_start = 0, N.insert = 0))), R(E), E.avail_out === 0)) return N.last_flush = -1, d;
					}
					return _e !== l ? d : N.wrap <= 0 ? 1 : (N.wrap === 2 ? (q(N, 255 & E.adler), q(N, E.adler >> 8 & 255), q(N, E.adler >> 16 & 255), q(N, E.adler >> 24 & 255), q(N, 255 & E.total_in), q(N, E.total_in >> 8 & 255), q(N, E.total_in >> 16 & 255), q(N, E.total_in >> 24 & 255)) : (Z(N, E.adler >>> 16), Z(N, 65535 & E.adler)), R(E), 0 < N.wrap && (N.wrap = -N.wrap), N.pending !== 0 ? d : 1);
				}, t.deflateEnd = function(E) {
					var _e;
					return E && E.state ? (_e = E.state.status) !== k && _e !== 69 && _e !== 73 && _e !== 91 && _e !== 103 && _e !== H && _e !== 666 ? xe(E, p) : (E.state = null, _e === H ? xe(E, -3) : d) : p;
				}, t.deflateSetDictionary = function(E, _e) {
					var w, N, D, I, S, z, X, K, re = _e.length;
					if (!E || !E.state || (I = (w = E.state).wrap) === 2 || I === 1 && w.status !== k || w.lookahead) return p;
					for (I === 1 && (E.adler = s(E.adler, _e, re, 0)), w.wrap = 0, re >= w.w_size && (I === 0 && (ae(w.head), w.strstart = 0, w.block_start = 0, w.insert = 0), K = new i.Buf8(w.w_size), i.arraySet(K, _e, re - w.w_size, w.w_size, 0), _e = K, re = w.w_size), S = E.avail_in, z = E.next_in, X = E.input, E.avail_in = re, E.next_in = 0, E.input = _e, Ee(w); w.lookahead >= x;) {
						for (N = w.strstart, D = w.lookahead - (x - 1); w.ins_h = (w.ins_h << w.hash_shift ^ w.window[N + x - 1]) & w.hash_mask, w.prev[N & w.w_mask] = w.head[w.ins_h], w.head[w.ins_h] = N, N++, --D;);
						w.strstart = N, w.lookahead = x - 1, Ee(w);
					}
					return w.strstart += w.lookahead, w.block_start = w.strstart, w.insert = w.lookahead, w.lookahead = 0, w.match_length = w.prev_length = x - 1, w.match_available = 0, E.next_in = z, E.input = X, E.avail_in = S, w.wrap = I, d;
				}, t.deflateInfo = "pako deflate (from Nodeca project)";
			}, {
				"../utils/common": 41,
				"./adler32": 43,
				"./crc32": 45,
				"./messages": 51,
				"./trees": 52
			}],
			47: [function(e, r, t) {
				"use strict";
				r.exports = function() {
					this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
				};
			}, {}],
			48: [function(e, r, t) {
				"use strict";
				r.exports = function(n, i) {
					var a = n.state, s = n.next_in, u, c, o, l, d, p, h, A, f, g, _, v, b, C, T, ee, x, G, O, k, H, m = n.input, V;
					u = s + (n.avail_in - 5), c = n.next_out, V = n.output, o = c - (i - n.avail_out), l = c + (n.avail_out - 257), d = a.dmax, p = a.wsize, h = a.whave, A = a.wnext, f = a.window, g = a.hold, _ = a.bits, v = a.lencode, b = a.distcode, C = (1 << a.lenbits) - 1, T = (1 << a.distbits) - 1;
					e: do {
						_ < 15 && (g += m[s++] << _, _ += 8, g += m[s++] << _, _ += 8), ee = v[g & C];
						t: for (;;) {
							if (g >>>= x = ee >>> 24, _ -= x, (x = ee >>> 16 & 255) === 0) V[c++] = 65535 & ee;
							else {
								if (!(16 & x)) {
									if ((64 & x) == 0) {
										ee = v[(65535 & ee) + (g & (1 << x) - 1)];
										continue t;
									}
									if (32 & x) {
										a.mode = 12;
										break e;
									}
									n.msg = "invalid literal/length code", a.mode = 30;
									break e;
								}
								G = 65535 & ee, (x &= 15) && (_ < x && (g += m[s++] << _, _ += 8), G += g & (1 << x) - 1, g >>>= x, _ -= x), _ < 15 && (g += m[s++] << _, _ += 8, g += m[s++] << _, _ += 8), ee = b[g & T];
								r: for (;;) {
									if (g >>>= x = ee >>> 24, _ -= x, !(16 & (x = ee >>> 16 & 255))) {
										if ((64 & x) == 0) {
											ee = b[(65535 & ee) + (g & (1 << x) - 1)];
											continue r;
										}
										n.msg = "invalid distance code", a.mode = 30;
										break e;
									}
									if (O = 65535 & ee, _ < (x &= 15) && (g += m[s++] << _, (_ += 8) < x && (g += m[s++] << _, _ += 8)), d < (O += g & (1 << x) - 1)) {
										n.msg = "invalid distance too far back", a.mode = 30;
										break e;
									}
									if (g >>>= x, _ -= x, (x = c - o) < O) {
										if (h < (x = O - x) && a.sane) {
											n.msg = "invalid distance too far back", a.mode = 30;
											break e;
										}
										if (H = f, (k = 0) === A) {
											if (k += p - x, x < G) {
												for (G -= x; V[c++] = f[k++], --x;);
												k = c - O, H = V;
											}
										} else if (A < x) {
											if (k += p + A - x, (x -= A) < G) {
												for (G -= x; V[c++] = f[k++], --x;);
												if (k = 0, A < G) {
													for (G -= x = A; V[c++] = f[k++], --x;);
													k = c - O, H = V;
												}
											}
										} else if (k += A - x, x < G) {
											for (G -= x; V[c++] = f[k++], --x;);
											k = c - O, H = V;
										}
										for (; 2 < G;) V[c++] = H[k++], V[c++] = H[k++], V[c++] = H[k++], G -= 3;
										G && (V[c++] = H[k++], 1 < G && (V[c++] = H[k++]));
									} else {
										for (k = c - O; V[c++] = V[k++], V[c++] = V[k++], V[c++] = V[k++], 2 < (G -= 3););
										G && (V[c++] = V[k++], 1 < G && (V[c++] = V[k++]));
									}
									break;
								}
							}
							break;
						}
					} while (s < u && c < l);
					s -= G = _ >> 3, g &= (1 << (_ -= G << 3)) - 1, n.next_in = s, n.next_out = c, n.avail_in = s < u ? u - s + 5 : 5 - (s - u), n.avail_out = c < l ? l - c + 257 : 257 - (c - l), a.hold = g, a.bits = _;
				};
			}, {}],
			49: [function(e, r, t) {
				"use strict";
				var n = e("../utils/common"), i = e("./adler32"), a = e("./crc32"), s = e("./inffast"), u = e("./inftrees"), c = 1, o = 2, l = 0, d = -2, p = 1, h = 852, A = 592;
				function f(k) {
					return (k >>> 24 & 255) + (k >>> 8 & 65280) + ((65280 & k) << 8) + ((255 & k) << 24);
				}
				function g() {
					this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new n.Buf16(320), this.work = new n.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
				}
				function _(k) {
					var H;
					return k && k.state ? (H = k.state, k.total_in = k.total_out = H.total = 0, k.msg = "", H.wrap && (k.adler = 1 & H.wrap), H.mode = p, H.last = 0, H.havedict = 0, H.dmax = 32768, H.head = null, H.hold = 0, H.bits = 0, H.lencode = H.lendyn = new n.Buf32(h), H.distcode = H.distdyn = new n.Buf32(A), H.sane = 1, H.back = -1, l) : d;
				}
				function v(k) {
					var H;
					return k && k.state ? ((H = k.state).wsize = 0, H.whave = 0, H.wnext = 0, _(k)) : d;
				}
				function b(k, H) {
					var m, V;
					return k && k.state ? (V = k.state, H < 0 ? (m = 0, H = -H) : (m = 1 + (H >> 4), H < 48 && (H &= 15)), H && (H < 8 || 15 < H) ? d : (V.window !== null && V.wbits !== H && (V.window = null), V.wrap = m, V.wbits = H, v(k))) : d;
				}
				function C(k, H) {
					var m, V;
					return k ? (V = new g(), (k.state = V).window = null, (m = b(k, H)) !== l && (k.state = null), m) : d;
				}
				var T, ee, x = !0;
				function G(k) {
					if (x) {
						var H;
						for (T = new n.Buf32(512), ee = new n.Buf32(32), H = 0; H < 144;) k.lens[H++] = 8;
						for (; H < 256;) k.lens[H++] = 9;
						for (; H < 280;) k.lens[H++] = 7;
						for (; H < 288;) k.lens[H++] = 8;
						for (u(c, k.lens, 0, 288, T, 0, k.work, { bits: 9 }), H = 0; H < 32;) k.lens[H++] = 5;
						u(o, k.lens, 0, 32, ee, 0, k.work, { bits: 5 }), x = !1;
					}
					k.lencode = T, k.lenbits = 9, k.distcode = ee, k.distbits = 5;
				}
				function O(k, H, m, V) {
					var y, ie = k.state;
					return ie.window === null && (ie.wsize = 1 << ie.wbits, ie.wnext = 0, ie.whave = 0, ie.window = new n.Buf8(ie.wsize)), V >= ie.wsize ? (n.arraySet(ie.window, H, m - ie.wsize, ie.wsize, 0), ie.wnext = 0, ie.whave = ie.wsize) : (V < (y = ie.wsize - ie.wnext) && (y = V), n.arraySet(ie.window, H, m - V, y, ie.wnext), (V -= y) ? (n.arraySet(ie.window, H, m - V, V, 0), ie.wnext = V, ie.whave = ie.wsize) : (ie.wnext += y, ie.wnext === ie.wsize && (ie.wnext = 0), ie.whave < ie.wsize && (ie.whave += y))), 0;
				}
				t.inflateReset = v, t.inflateReset2 = b, t.inflateResetKeep = _, t.inflateInit = function(k) {
					return C(k, 15);
				}, t.inflateInit2 = C, t.inflate = function(k, H) {
					var m, V, y, ie, xe, se, ae, R, W, q, Z, ge, Ee, ye, Ne, Oe, Ue, Re, je, qe, E, _e, w, N, D = 0, I = new n.Buf8(4), S = [
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
					if (!k || !k.state || !k.output || !k.input && k.avail_in !== 0) return d;
					(m = k.state).mode === 12 && (m.mode = 13), xe = k.next_out, y = k.output, ae = k.avail_out, ie = k.next_in, V = k.input, se = k.avail_in, R = m.hold, W = m.bits, q = se, Z = ae, _e = l;
					e: for (;;) switch (m.mode) {
						case p:
							if (m.wrap === 0) {
								m.mode = 13;
								break;
							}
							for (; W < 16;) {
								if (se === 0) break e;
								se--, R += V[ie++] << W, W += 8;
							}
							if (2 & m.wrap && R === 35615) {
								I[m.check = 0] = 255 & R, I[1] = R >>> 8 & 255, m.check = a(m.check, I, 2, 0), W = R = 0, m.mode = 2;
								break;
							}
							if (m.flags = 0, m.head && (m.head.done = !1), !(1 & m.wrap) || (((255 & R) << 8) + (R >> 8)) % 31) {
								k.msg = "incorrect header check", m.mode = 30;
								break;
							}
							if ((15 & R) != 8) {
								k.msg = "unknown compression method", m.mode = 30;
								break;
							}
							if (W -= 4, E = 8 + (15 & (R >>>= 4)), m.wbits === 0) m.wbits = E;
							else if (E > m.wbits) {
								k.msg = "invalid window size", m.mode = 30;
								break;
							}
							m.dmax = 1 << E, k.adler = m.check = 1, m.mode = 512 & R ? 10 : 12, W = R = 0;
							break;
						case 2:
							for (; W < 16;) {
								if (se === 0) break e;
								se--, R += V[ie++] << W, W += 8;
							}
							if (m.flags = R, (255 & m.flags) != 8) {
								k.msg = "unknown compression method", m.mode = 30;
								break;
							}
							if (57344 & m.flags) {
								k.msg = "unknown header flags set", m.mode = 30;
								break;
							}
							m.head && (m.head.text = R >> 8 & 1), 512 & m.flags && (I[0] = 255 & R, I[1] = R >>> 8 & 255, m.check = a(m.check, I, 2, 0)), W = R = 0, m.mode = 3;
						case 3:
							for (; W < 32;) {
								if (se === 0) break e;
								se--, R += V[ie++] << W, W += 8;
							}
							m.head && (m.head.time = R), 512 & m.flags && (I[0] = 255 & R, I[1] = R >>> 8 & 255, I[2] = R >>> 16 & 255, I[3] = R >>> 24 & 255, m.check = a(m.check, I, 4, 0)), W = R = 0, m.mode = 4;
						case 4:
							for (; W < 16;) {
								if (se === 0) break e;
								se--, R += V[ie++] << W, W += 8;
							}
							m.head && (m.head.xflags = 255 & R, m.head.os = R >> 8), 512 & m.flags && (I[0] = 255 & R, I[1] = R >>> 8 & 255, m.check = a(m.check, I, 2, 0)), W = R = 0, m.mode = 5;
						case 5:
							if (1024 & m.flags) {
								for (; W < 16;) {
									if (se === 0) break e;
									se--, R += V[ie++] << W, W += 8;
								}
								m.length = R, m.head && (m.head.extra_len = R), 512 & m.flags && (I[0] = 255 & R, I[1] = R >>> 8 & 255, m.check = a(m.check, I, 2, 0)), W = R = 0;
							} else m.head && (m.head.extra = null);
							m.mode = 6;
						case 6:
							if (1024 & m.flags && (se < (ge = m.length) && (ge = se), ge && (m.head && (E = m.head.extra_len - m.length, m.head.extra || (m.head.extra = new Array(m.head.extra_len)), n.arraySet(m.head.extra, V, ie, ge, E)), 512 & m.flags && (m.check = a(m.check, V, ge, ie)), se -= ge, ie += ge, m.length -= ge), m.length)) break e;
							m.length = 0, m.mode = 7;
						case 7:
							if (2048 & m.flags) {
								if (se === 0) break e;
								for (ge = 0; E = V[ie + ge++], m.head && E && m.length < 65536 && (m.head.name += String.fromCharCode(E)), E && ge < se;);
								if (512 & m.flags && (m.check = a(m.check, V, ge, ie)), se -= ge, ie += ge, E) break e;
							} else m.head && (m.head.name = null);
							m.length = 0, m.mode = 8;
						case 8:
							if (4096 & m.flags) {
								if (se === 0) break e;
								for (ge = 0; E = V[ie + ge++], m.head && E && m.length < 65536 && (m.head.comment += String.fromCharCode(E)), E && ge < se;);
								if (512 & m.flags && (m.check = a(m.check, V, ge, ie)), se -= ge, ie += ge, E) break e;
							} else m.head && (m.head.comment = null);
							m.mode = 9;
						case 9:
							if (512 & m.flags) {
								for (; W < 16;) {
									if (se === 0) break e;
									se--, R += V[ie++] << W, W += 8;
								}
								if (R !== (65535 & m.check)) {
									k.msg = "header crc mismatch", m.mode = 30;
									break;
								}
								W = R = 0;
							}
							m.head && (m.head.hcrc = m.flags >> 9 & 1, m.head.done = !0), k.adler = m.check = 0, m.mode = 12;
							break;
						case 10:
							for (; W < 32;) {
								if (se === 0) break e;
								se--, R += V[ie++] << W, W += 8;
							}
							k.adler = m.check = f(R), W = R = 0, m.mode = 11;
						case 11:
							if (m.havedict === 0) return k.next_out = xe, k.avail_out = ae, k.next_in = ie, k.avail_in = se, m.hold = R, m.bits = W, 2;
							k.adler = m.check = 1, m.mode = 12;
						case 12: if (H === 5 || H === 6) break e;
						case 13:
							if (m.last) {
								R >>>= 7 & W, W -= 7 & W, m.mode = 27;
								break;
							}
							for (; W < 3;) {
								if (se === 0) break e;
								se--, R += V[ie++] << W, W += 8;
							}
							switch (m.last = 1 & R, W -= 1, 3 & (R >>>= 1)) {
								case 0:
									m.mode = 14;
									break;
								case 1:
									if (G(m), m.mode = 20, H !== 6) break;
									R >>>= 2, W -= 2;
									break e;
								case 2:
									m.mode = 17;
									break;
								case 3: k.msg = "invalid block type", m.mode = 30;
							}
							R >>>= 2, W -= 2;
							break;
						case 14:
							for (R >>>= 7 & W, W -= 7 & W; W < 32;) {
								if (se === 0) break e;
								se--, R += V[ie++] << W, W += 8;
							}
							if ((65535 & R) != (R >>> 16 ^ 65535)) {
								k.msg = "invalid stored block lengths", m.mode = 30;
								break;
							}
							if (m.length = 65535 & R, W = R = 0, m.mode = 15, H === 6) break e;
						case 15: m.mode = 16;
						case 16:
							if (ge = m.length) {
								if (se < ge && (ge = se), ae < ge && (ge = ae), ge === 0) break e;
								n.arraySet(y, V, ie, ge, xe), se -= ge, ie += ge, ae -= ge, xe += ge, m.length -= ge;
								break;
							}
							m.mode = 12;
							break;
						case 17:
							for (; W < 14;) {
								if (se === 0) break e;
								se--, R += V[ie++] << W, W += 8;
							}
							if (m.nlen = 257 + (31 & R), R >>>= 5, W -= 5, m.ndist = 1 + (31 & R), R >>>= 5, W -= 5, m.ncode = 4 + (15 & R), R >>>= 4, W -= 4, 286 < m.nlen || 30 < m.ndist) {
								k.msg = "too many length or distance symbols", m.mode = 30;
								break;
							}
							m.have = 0, m.mode = 18;
						case 18:
							for (; m.have < m.ncode;) {
								for (; W < 3;) {
									if (se === 0) break e;
									se--, R += V[ie++] << W, W += 8;
								}
								m.lens[S[m.have++]] = 7 & R, R >>>= 3, W -= 3;
							}
							for (; m.have < 19;) m.lens[S[m.have++]] = 0;
							if (m.lencode = m.lendyn, m.lenbits = 7, w = { bits: m.lenbits }, _e = u(0, m.lens, 0, 19, m.lencode, 0, m.work, w), m.lenbits = w.bits, _e) {
								k.msg = "invalid code lengths set", m.mode = 30;
								break;
							}
							m.have = 0, m.mode = 19;
						case 19:
							for (; m.have < m.nlen + m.ndist;) {
								for (; Oe = (D = m.lencode[R & (1 << m.lenbits) - 1]) >>> 16 & 255, Ue = 65535 & D, !((Ne = D >>> 24) <= W);) {
									if (se === 0) break e;
									se--, R += V[ie++] << W, W += 8;
								}
								if (Ue < 16) R >>>= Ne, W -= Ne, m.lens[m.have++] = Ue;
								else {
									if (Ue === 16) {
										for (N = Ne + 2; W < N;) {
											if (se === 0) break e;
											se--, R += V[ie++] << W, W += 8;
										}
										if (R >>>= Ne, W -= Ne, m.have === 0) {
											k.msg = "invalid bit length repeat", m.mode = 30;
											break;
										}
										E = m.lens[m.have - 1], ge = 3 + (3 & R), R >>>= 2, W -= 2;
									} else if (Ue === 17) {
										for (N = Ne + 3; W < N;) {
											if (se === 0) break e;
											se--, R += V[ie++] << W, W += 8;
										}
										W -= Ne, E = 0, ge = 3 + (7 & (R >>>= Ne)), R >>>= 3, W -= 3;
									} else {
										for (N = Ne + 7; W < N;) {
											if (se === 0) break e;
											se--, R += V[ie++] << W, W += 8;
										}
										W -= Ne, E = 0, ge = 11 + (127 & (R >>>= Ne)), R >>>= 7, W -= 7;
									}
									if (m.have + ge > m.nlen + m.ndist) {
										k.msg = "invalid bit length repeat", m.mode = 30;
										break;
									}
									for (; ge--;) m.lens[m.have++] = E;
								}
							}
							if (m.mode === 30) break;
							if (m.lens[256] === 0) {
								k.msg = "invalid code -- missing end-of-block", m.mode = 30;
								break;
							}
							if (m.lenbits = 9, w = { bits: m.lenbits }, _e = u(c, m.lens, 0, m.nlen, m.lencode, 0, m.work, w), m.lenbits = w.bits, _e) {
								k.msg = "invalid literal/lengths set", m.mode = 30;
								break;
							}
							if (m.distbits = 6, m.distcode = m.distdyn, w = { bits: m.distbits }, _e = u(o, m.lens, m.nlen, m.ndist, m.distcode, 0, m.work, w), m.distbits = w.bits, _e) {
								k.msg = "invalid distances set", m.mode = 30;
								break;
							}
							if (m.mode = 20, H === 6) break e;
						case 20: m.mode = 21;
						case 21:
							if (6 <= se && 258 <= ae) {
								k.next_out = xe, k.avail_out = ae, k.next_in = ie, k.avail_in = se, m.hold = R, m.bits = W, s(k, Z), xe = k.next_out, y = k.output, ae = k.avail_out, ie = k.next_in, V = k.input, se = k.avail_in, R = m.hold, W = m.bits, m.mode === 12 && (m.back = -1);
								break;
							}
							for (m.back = 0; Oe = (D = m.lencode[R & (1 << m.lenbits) - 1]) >>> 16 & 255, Ue = 65535 & D, !((Ne = D >>> 24) <= W);) {
								if (se === 0) break e;
								se--, R += V[ie++] << W, W += 8;
							}
							if (Oe && (240 & Oe) == 0) {
								for (Re = Ne, je = Oe, qe = Ue; Oe = (D = m.lencode[qe + ((R & (1 << Re + je) - 1) >> Re)]) >>> 16 & 255, Ue = 65535 & D, !(Re + (Ne = D >>> 24) <= W);) {
									if (se === 0) break e;
									se--, R += V[ie++] << W, W += 8;
								}
								R >>>= Re, W -= Re, m.back += Re;
							}
							if (R >>>= Ne, W -= Ne, m.back += Ne, m.length = Ue, Oe === 0) {
								m.mode = 26;
								break;
							}
							if (32 & Oe) {
								m.back = -1, m.mode = 12;
								break;
							}
							if (64 & Oe) {
								k.msg = "invalid literal/length code", m.mode = 30;
								break;
							}
							m.extra = 15 & Oe, m.mode = 22;
						case 22:
							if (m.extra) {
								for (N = m.extra; W < N;) {
									if (se === 0) break e;
									se--, R += V[ie++] << W, W += 8;
								}
								m.length += R & (1 << m.extra) - 1, R >>>= m.extra, W -= m.extra, m.back += m.extra;
							}
							m.was = m.length, m.mode = 23;
						case 23:
							for (; Oe = (D = m.distcode[R & (1 << m.distbits) - 1]) >>> 16 & 255, Ue = 65535 & D, !((Ne = D >>> 24) <= W);) {
								if (se === 0) break e;
								se--, R += V[ie++] << W, W += 8;
							}
							if ((240 & Oe) == 0) {
								for (Re = Ne, je = Oe, qe = Ue; Oe = (D = m.distcode[qe + ((R & (1 << Re + je) - 1) >> Re)]) >>> 16 & 255, Ue = 65535 & D, !(Re + (Ne = D >>> 24) <= W);) {
									if (se === 0) break e;
									se--, R += V[ie++] << W, W += 8;
								}
								R >>>= Re, W -= Re, m.back += Re;
							}
							if (R >>>= Ne, W -= Ne, m.back += Ne, 64 & Oe) {
								k.msg = "invalid distance code", m.mode = 30;
								break;
							}
							m.offset = Ue, m.extra = 15 & Oe, m.mode = 24;
						case 24:
							if (m.extra) {
								for (N = m.extra; W < N;) {
									if (se === 0) break e;
									se--, R += V[ie++] << W, W += 8;
								}
								m.offset += R & (1 << m.extra) - 1, R >>>= m.extra, W -= m.extra, m.back += m.extra;
							}
							if (m.offset > m.dmax) {
								k.msg = "invalid distance too far back", m.mode = 30;
								break;
							}
							m.mode = 25;
						case 25:
							if (ae === 0) break e;
							if (ge = Z - ae, m.offset > ge) {
								if ((ge = m.offset - ge) > m.whave && m.sane) {
									k.msg = "invalid distance too far back", m.mode = 30;
									break;
								}
								Ee = ge > m.wnext ? (ge -= m.wnext, m.wsize - ge) : m.wnext - ge, ge > m.length && (ge = m.length), ye = m.window;
							} else ye = y, Ee = xe - m.offset, ge = m.length;
							for (ae < ge && (ge = ae), ae -= ge, m.length -= ge; y[xe++] = ye[Ee++], --ge;);
							m.length === 0 && (m.mode = 21);
							break;
						case 26:
							if (ae === 0) break e;
							y[xe++] = m.length, ae--, m.mode = 21;
							break;
						case 27:
							if (m.wrap) {
								for (; W < 32;) {
									if (se === 0) break e;
									se--, R |= V[ie++] << W, W += 8;
								}
								if (Z -= ae, k.total_out += Z, m.total += Z, Z && (k.adler = m.check = m.flags ? a(m.check, y, Z, xe - Z) : i(m.check, y, Z, xe - Z)), Z = ae, (m.flags ? R : f(R)) !== m.check) {
									k.msg = "incorrect data check", m.mode = 30;
									break;
								}
								W = R = 0;
							}
							m.mode = 28;
						case 28:
							if (m.wrap && m.flags) {
								for (; W < 32;) {
									if (se === 0) break e;
									se--, R += V[ie++] << W, W += 8;
								}
								if (R !== (4294967295 & m.total)) {
									k.msg = "incorrect length check", m.mode = 30;
									break;
								}
								W = R = 0;
							}
							m.mode = 29;
						case 29:
							_e = 1;
							break e;
						case 30:
							_e = -3;
							break e;
						case 31: return -4;
						default: return d;
					}
					return k.next_out = xe, k.avail_out = ae, k.next_in = ie, k.avail_in = se, m.hold = R, m.bits = W, (m.wsize || Z !== k.avail_out && m.mode < 30 && (m.mode < 27 || H !== 4)) && O(k, k.output, k.next_out, Z - k.avail_out) ? (m.mode = 31, -4) : (q -= k.avail_in, Z -= k.avail_out, k.total_in += q, k.total_out += Z, m.total += Z, m.wrap && Z && (k.adler = m.check = m.flags ? a(m.check, y, Z, k.next_out - Z) : i(m.check, y, Z, k.next_out - Z)), k.data_type = m.bits + (m.last ? 64 : 0) + (m.mode === 12 ? 128 : 0) + (m.mode === 20 || m.mode === 15 ? 256 : 0), (q == 0 && Z === 0 || H === 4) && _e === l && (_e = -5), _e);
				}, t.inflateEnd = function(k) {
					if (!k || !k.state) return d;
					var H = k.state;
					return H.window && (H.window = null), k.state = null, l;
				}, t.inflateGetHeader = function(k, H) {
					var m;
					return k && k.state ? (2 & (m = k.state).wrap) == 0 ? d : ((m.head = H).done = !1, l) : d;
				}, t.inflateSetDictionary = function(k, H) {
					var m, V = H.length;
					return k && k.state ? (m = k.state).wrap !== 0 && m.mode !== 11 ? d : m.mode === 11 && i(1, H, V, 0) !== m.check ? -3 : O(k, H, V, V) ? (m.mode = 31, -4) : (m.havedict = 1, l) : d;
				}, t.inflateInfo = "pako inflate (from Nodeca project)";
			}, {
				"../utils/common": 41,
				"./adler32": 43,
				"./crc32": 45,
				"./inffast": 48,
				"./inftrees": 50
			}],
			50: [function(e, r, t) {
				"use strict";
				var n = e("../utils/common"), i = [
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
				], a = [
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
				], s = [
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
				], u = [
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
				r.exports = function(c, o, l, d, p, h, A, f) {
					var g, _, v, b, C, T, ee, x, G, O = f.bits, k = 0, H = 0, m = 0, V = 0, y = 0, ie = 0, xe = 0, se = 0, ae = 0, R = 0, W = null, q = 0, Z = new n.Buf16(16), ge = new n.Buf16(16), Ee = null, ye = 0;
					for (k = 0; k <= 15; k++) Z[k] = 0;
					for (H = 0; H < d; H++) Z[o[l + H]]++;
					for (y = O, V = 15; 1 <= V && Z[V] === 0; V--);
					if (V < y && (y = V), V === 0) return p[h++] = 20971520, p[h++] = 20971520, f.bits = 1, 0;
					for (m = 1; m < V && Z[m] === 0; m++);
					for (y < m && (y = m), k = se = 1; k <= 15; k++) if (se <<= 1, (se -= Z[k]) < 0) return -1;
					if (0 < se && (c === 0 || V !== 1)) return -1;
					for (ge[1] = 0, k = 1; k < 15; k++) ge[k + 1] = ge[k] + Z[k];
					for (H = 0; H < d; H++) o[l + H] !== 0 && (A[ge[o[l + H]]++] = H);
					if (T = c === 0 ? (W = Ee = A, 19) : c === 1 ? (W = i, q -= 257, Ee = a, ye -= 257, 256) : (W = s, Ee = u, -1), k = m, C = h, xe = H = R = 0, v = -1, b = (ae = 1 << (ie = y)) - 1, c === 1 && 852 < ae || c === 2 && 592 < ae) return 1;
					for (;;) {
						for (ee = k - xe, G = A[H] < T ? (x = 0, A[H]) : A[H] > T ? (x = Ee[ye + A[H]], W[q + A[H]]) : (x = 96, 0), g = 1 << k - xe, m = _ = 1 << ie; p[C + (R >> xe) + (_ -= g)] = ee << 24 | x << 16 | G | 0, _ !== 0;);
						for (g = 1 << k - 1; R & g;) g >>= 1;
						if (g !== 0 ? (R &= g - 1, R += g) : R = 0, H++, --Z[k] == 0) {
							if (k === V) break;
							k = o[l + A[H]];
						}
						if (y < k && (R & b) !== v) {
							for (xe === 0 && (xe = y), C += m, se = 1 << (ie = k - xe); ie + xe < V && !((se -= Z[ie + xe]) <= 0);) ie++, se <<= 1;
							if (ae += 1 << ie, c === 1 && 852 < ae || c === 2 && 592 < ae) return 1;
							p[v = R & b] = y << 24 | ie << 16 | C - h | 0;
						}
					}
					return R !== 0 && (p[C + R] = k - xe << 24 | 4194304), f.bits = y, 0;
				};
			}, { "../utils/common": 41 }],
			51: [function(e, r, t) {
				"use strict";
				r.exports = {
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
			}, {}],
			52: [function(e, r, t) {
				"use strict";
				var n = e("../utils/common"), i = 0, a = 1;
				function s(D) {
					for (var I = D.length; 0 <= --I;) D[I] = 0;
				}
				var u = 0, c = 29, o = 256, l = o + 1 + c, d = 30, p = 19, h = 2 * l + 1, A = 15, f = 16, g = 7, _ = 256, v = 16, b = 17, C = 18, T = [
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
				], ee = [
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
				], x = [
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
				], G = [
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
				], O = new Array(2 * (l + 2));
				s(O);
				var k = new Array(2 * d);
				s(k);
				var H = new Array(512);
				s(H);
				var m = new Array(256);
				s(m);
				var V = new Array(c);
				s(V);
				var y, ie, xe, se = new Array(d);
				function ae(D, I, S, z, X) {
					this.static_tree = D, this.extra_bits = I, this.extra_base = S, this.elems = z, this.max_length = X, this.has_stree = D && D.length;
				}
				function R(D, I) {
					this.dyn_tree = D, this.max_code = 0, this.stat_desc = I;
				}
				function W(D) {
					return D < 256 ? H[D] : H[256 + (D >>> 7)];
				}
				function q(D, I) {
					D.pending_buf[D.pending++] = 255 & I, D.pending_buf[D.pending++] = I >>> 8 & 255;
				}
				function Z(D, I, S) {
					D.bi_valid > f - S ? (D.bi_buf |= I << D.bi_valid & 65535, q(D, D.bi_buf), D.bi_buf = I >> f - D.bi_valid, D.bi_valid += S - f) : (D.bi_buf |= I << D.bi_valid & 65535, D.bi_valid += S);
				}
				function ge(D, I, S) {
					Z(D, S[2 * I], S[2 * I + 1]);
				}
				function Ee(D, I) {
					for (var S = 0; S |= 1 & D, D >>>= 1, S <<= 1, 0 < --I;);
					return S >>> 1;
				}
				function ye(D, I, S) {
					var z, X, K = new Array(A + 1), re = 0;
					for (z = 1; z <= A; z++) K[z] = re = re + S[z - 1] << 1;
					for (X = 0; X <= I; X++) {
						var ne = D[2 * X + 1];
						ne !== 0 && (D[2 * X] = Ee(K[ne]++, ne));
					}
				}
				function Ne(D) {
					var I;
					for (I = 0; I < l; I++) D.dyn_ltree[2 * I] = 0;
					for (I = 0; I < d; I++) D.dyn_dtree[2 * I] = 0;
					for (I = 0; I < p; I++) D.bl_tree[2 * I] = 0;
					D.dyn_ltree[2 * _] = 1, D.opt_len = D.static_len = 0, D.last_lit = D.matches = 0;
				}
				function Oe(D) {
					8 < D.bi_valid ? q(D, D.bi_buf) : 0 < D.bi_valid && (D.pending_buf[D.pending++] = D.bi_buf), D.bi_buf = 0, D.bi_valid = 0;
				}
				function Ue(D, I, S, z) {
					var X = 2 * I, K = 2 * S;
					return D[X] < D[K] || D[X] === D[K] && z[I] <= z[S];
				}
				function Re(D, I, S) {
					for (var z = D.heap[S], X = S << 1; X <= D.heap_len && (X < D.heap_len && Ue(I, D.heap[X + 1], D.heap[X], D.depth) && X++, !Ue(I, z, D.heap[X], D.depth));) D.heap[S] = D.heap[X], S = X, X <<= 1;
					D.heap[S] = z;
				}
				function je(D, I, S) {
					var z, X, K, re, ne = 0;
					if (D.last_lit !== 0) for (; z = D.pending_buf[D.d_buf + 2 * ne] << 8 | D.pending_buf[D.d_buf + 2 * ne + 1], X = D.pending_buf[D.l_buf + ne], ne++, z === 0 ? ge(D, X, I) : (ge(D, (K = m[X]) + o + 1, I), (re = T[K]) !== 0 && Z(D, X -= V[K], re), ge(D, K = W(--z), S), (re = ee[K]) !== 0 && Z(D, z -= se[K], re)), ne < D.last_lit;);
					ge(D, _, I);
				}
				function qe(D, I) {
					var S, z, X, K = I.dyn_tree, re = I.stat_desc.static_tree, ne = I.stat_desc.has_stree, oe = I.stat_desc.elems, me = -1;
					for (D.heap_len = 0, D.heap_max = h, S = 0; S < oe; S++) K[2 * S] !== 0 ? (D.heap[++D.heap_len] = me = S, D.depth[S] = 0) : K[2 * S + 1] = 0;
					for (; D.heap_len < 2;) K[2 * (X = D.heap[++D.heap_len] = me < 2 ? ++me : 0)] = 1, D.depth[X] = 0, D.opt_len--, ne && (D.static_len -= re[2 * X + 1]);
					for (I.max_code = me, S = D.heap_len >> 1; 1 <= S; S--) Re(D, K, S);
					for (X = oe; S = D.heap[1], D.heap[1] = D.heap[D.heap_len--], Re(D, K, 1), z = D.heap[1], D.heap[--D.heap_max] = S, D.heap[--D.heap_max] = z, K[2 * X] = K[2 * S] + K[2 * z], D.depth[X] = (D.depth[S] >= D.depth[z] ? D.depth[S] : D.depth[z]) + 1, K[2 * S + 1] = K[2 * z + 1] = X, D.heap[1] = X++, Re(D, K, 1), 2 <= D.heap_len;);
					D.heap[--D.heap_max] = D.heap[1], (function(be, ze) {
						var He, dt, Bt, $e, Ht, et, kt = ze.dyn_tree, Zt = ze.max_code, Wt = ze.stat_desc.static_tree, jr = ze.stat_desc.has_stree, qr = ze.stat_desc.extra_bits, br = ze.stat_desc.extra_base, Gt = ze.stat_desc.max_length, qt = 0;
						for ($e = 0; $e <= A; $e++) be.bl_count[$e] = 0;
						for (kt[2 * be.heap[be.heap_max] + 1] = 0, He = be.heap_max + 1; He < h; He++) Gt < ($e = kt[2 * kt[2 * (dt = be.heap[He]) + 1] + 1] + 1) && ($e = Gt, qt++), kt[2 * dt + 1] = $e, Zt < dt || (be.bl_count[$e]++, Ht = 0, br <= dt && (Ht = qr[dt - br]), et = kt[2 * dt], be.opt_len += et * ($e + Ht), jr && (be.static_len += et * (Wt[2 * dt + 1] + Ht)));
						if (qt !== 0) {
							do {
								for ($e = Gt - 1; be.bl_count[$e] === 0;) $e--;
								be.bl_count[$e]--, be.bl_count[$e + 1] += 2, be.bl_count[Gt]--, qt -= 2;
							} while (0 < qt);
							for ($e = Gt; $e !== 0; $e--) for (dt = be.bl_count[$e]; dt !== 0;) Zt < (Bt = be.heap[--He]) || (kt[2 * Bt + 1] !== $e && (be.opt_len += ($e - kt[2 * Bt + 1]) * kt[2 * Bt], kt[2 * Bt + 1] = $e), dt--);
						}
					})(D, I), ye(K, me, D.bl_count);
				}
				function E(D, I, S) {
					var z, X, K = -1, re = I[1], ne = 0, oe = 7, me = 4;
					for (re === 0 && (oe = 138, me = 3), I[2 * (S + 1) + 1] = 65535, z = 0; z <= S; z++) X = re, re = I[2 * (z + 1) + 1], ++ne < oe && X === re || (ne < me ? D.bl_tree[2 * X] += ne : X !== 0 ? (X !== K && D.bl_tree[2 * X]++, D.bl_tree[2 * v]++) : ne <= 10 ? D.bl_tree[2 * b]++ : D.bl_tree[2 * C]++, K = X, me = (ne = 0) === re ? (oe = 138, 3) : X === re ? (oe = 6, 3) : (oe = 7, 4));
				}
				function _e(D, I, S) {
					var z, X, K = -1, re = I[1], ne = 0, oe = 7, me = 4;
					for (re === 0 && (oe = 138, me = 3), z = 0; z <= S; z++) if (X = re, re = I[2 * (z + 1) + 1], !(++ne < oe && X === re)) {
						if (ne < me) for (; ge(D, X, D.bl_tree), --ne != 0;);
						else X !== 0 ? (X !== K && (ge(D, X, D.bl_tree), ne--), ge(D, v, D.bl_tree), Z(D, ne - 3, 2)) : ne <= 10 ? (ge(D, b, D.bl_tree), Z(D, ne - 3, 3)) : (ge(D, C, D.bl_tree), Z(D, ne - 11, 7));
						K = X, me = (ne = 0) === re ? (oe = 138, 3) : X === re ? (oe = 6, 3) : (oe = 7, 4);
					}
				}
				s(se);
				var w = !1;
				function N(D, I, S, z) {
					Z(D, (u << 1) + (z ? 1 : 0), 3), (function(X, K, re, ne) {
						Oe(X), ne && (q(X, re), q(X, ~re)), n.arraySet(X.pending_buf, X.window, K, re, X.pending), X.pending += re;
					})(D, I, S, !0);
				}
				t._tr_init = function(D) {
					w || ((function() {
						var I, S, z, X, K, re = new Array(A + 1);
						for (X = z = 0; X < c - 1; X++) for (V[X] = z, I = 0; I < 1 << T[X]; I++) m[z++] = X;
						for (m[z - 1] = X, X = K = 0; X < 16; X++) for (se[X] = K, I = 0; I < 1 << ee[X]; I++) H[K++] = X;
						for (K >>= 7; X < d; X++) for (se[X] = K << 7, I = 0; I < 1 << ee[X] - 7; I++) H[256 + K++] = X;
						for (S = 0; S <= A; S++) re[S] = 0;
						for (I = 0; I <= 143;) O[2 * I + 1] = 8, I++, re[8]++;
						for (; I <= 255;) O[2 * I + 1] = 9, I++, re[9]++;
						for (; I <= 279;) O[2 * I + 1] = 7, I++, re[7]++;
						for (; I <= 287;) O[2 * I + 1] = 8, I++, re[8]++;
						for (ye(O, l + 1, re), I = 0; I < d; I++) k[2 * I + 1] = 5, k[2 * I] = Ee(I, 5);
						y = new ae(O, T, o + 1, l, A), ie = new ae(k, ee, 0, d, A), xe = new ae(new Array(0), x, 0, p, g);
					})(), w = !0), D.l_desc = new R(D.dyn_ltree, y), D.d_desc = new R(D.dyn_dtree, ie), D.bl_desc = new R(D.bl_tree, xe), D.bi_buf = 0, D.bi_valid = 0, Ne(D);
				}, t._tr_stored_block = N, t._tr_flush_block = function(D, I, S, z) {
					var X, K, re = 0;
					0 < D.level ? (D.strm.data_type === 2 && (D.strm.data_type = (function(ne) {
						var oe, me = 4093624447;
						for (oe = 0; oe <= 31; oe++, me >>>= 1) if (1 & me && ne.dyn_ltree[2 * oe] !== 0) return i;
						if (ne.dyn_ltree[18] !== 0 || ne.dyn_ltree[20] !== 0 || ne.dyn_ltree[26] !== 0) return a;
						for (oe = 32; oe < o; oe++) if (ne.dyn_ltree[2 * oe] !== 0) return a;
						return i;
					})(D)), qe(D, D.l_desc), qe(D, D.d_desc), re = (function(ne) {
						var oe;
						for (E(ne, ne.dyn_ltree, ne.l_desc.max_code), E(ne, ne.dyn_dtree, ne.d_desc.max_code), qe(ne, ne.bl_desc), oe = p - 1; 3 <= oe && ne.bl_tree[2 * G[oe] + 1] === 0; oe--);
						return ne.opt_len += 3 * (oe + 1) + 5 + 5 + 4, oe;
					})(D), X = D.opt_len + 3 + 7 >>> 3, (K = D.static_len + 3 + 7 >>> 3) <= X && (X = K)) : X = K = S + 5, S + 4 <= X && I !== -1 ? N(D, I, S, z) : D.strategy === 4 || K === X ? (Z(D, 2 + (z ? 1 : 0), 3), je(D, O, k)) : (Z(D, 4 + (z ? 1 : 0), 3), (function(ne, oe, me, be) {
						var ze;
						for (Z(ne, oe - 257, 5), Z(ne, me - 1, 5), Z(ne, be - 4, 4), ze = 0; ze < be; ze++) Z(ne, ne.bl_tree[2 * G[ze] + 1], 3);
						_e(ne, ne.dyn_ltree, oe - 1), _e(ne, ne.dyn_dtree, me - 1);
					})(D, D.l_desc.max_code + 1, D.d_desc.max_code + 1, re + 1), je(D, D.dyn_ltree, D.dyn_dtree)), Ne(D), z && Oe(D);
				}, t._tr_tally = function(D, I, S) {
					return D.pending_buf[D.d_buf + 2 * D.last_lit] = I >>> 8 & 255, D.pending_buf[D.d_buf + 2 * D.last_lit + 1] = 255 & I, D.pending_buf[D.l_buf + D.last_lit] = 255 & S, D.last_lit++, I === 0 ? D.dyn_ltree[2 * S]++ : (D.matches++, I--, D.dyn_ltree[2 * (m[S] + o + 1)]++, D.dyn_dtree[2 * W(I)]++), D.last_lit === D.lit_bufsize - 1;
				}, t._tr_align = function(D) {
					Z(D, 2, 3), ge(D, _, O), (function(I) {
						I.bi_valid === 16 ? (q(I, I.bi_buf), I.bi_buf = 0, I.bi_valid = 0) : 8 <= I.bi_valid && (I.pending_buf[I.pending++] = 255 & I.bi_buf, I.bi_buf >>= 8, I.bi_valid -= 8);
					})(D);
				};
			}, { "../utils/common": 41 }],
			53: [function(e, r, t) {
				"use strict";
				r.exports = function() {
					this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
				};
			}, {}],
			54: [function(e, r, t) {
				(function(n) {
					(function(i, a) {
						"use strict";
						if (!i.setImmediate) {
							var s, u, c, o, l = 1, d = {}, p = !1, h = i.document, A = Object.getPrototypeOf && Object.getPrototypeOf(i);
							A = A && A.setTimeout ? A : i, s = {}.toString.call(i.process) === "[object process]" ? function(v) {
								process.nextTick(function() {
									g(v);
								});
							} : (function() {
								if (i.postMessage && !i.importScripts) {
									var v = !0, b = i.onmessage;
									return i.onmessage = function() {
										v = !1;
									}, i.postMessage("", "*"), i.onmessage = b, v;
								}
							})() ? (o = "setImmediate$" + Math.random() + "$", i.addEventListener ? i.addEventListener("message", _, !1) : i.attachEvent("onmessage", _), function(v) {
								i.postMessage(o + v, "*");
							}) : i.MessageChannel ? ((c = new MessageChannel()).port1.onmessage = function(v) {
								g(v.data);
							}, function(v) {
								c.port2.postMessage(v);
							}) : h && "onreadystatechange" in h.createElement("script") ? (u = h.documentElement, function(v) {
								var b = h.createElement("script");
								b.onreadystatechange = function() {
									g(v), b.onreadystatechange = null, u.removeChild(b), b = null;
								}, u.appendChild(b);
							}) : function(v) {
								setTimeout(g, 0, v);
							}, A.setImmediate = function(v) {
								typeof v != "function" && (v = new Function("" + v));
								for (var b = new Array(arguments.length - 1), C = 0; C < b.length; C++) b[C] = arguments[C + 1];
								return d[l] = {
									callback: v,
									args: b
								}, s(l), l++;
							}, A.clearImmediate = f;
						}
						function f(v) {
							delete d[v];
						}
						function g(v) {
							if (p) setTimeout(g, 0, v);
							else {
								var b = d[v];
								if (b) {
									p = !0;
									try {
										(function(C) {
											var T = C.callback, ee = C.args;
											switch (ee.length) {
												case 0:
													T();
													break;
												case 1:
													T(ee[0]);
													break;
												case 2:
													T(ee[0], ee[1]);
													break;
												case 3:
													T(ee[0], ee[1], ee[2]);
													break;
												default: T.apply(a, ee);
											}
										})(b);
									} finally {
										f(v), p = !1;
									}
								}
							}
						}
						function _(v) {
							v.source === i && typeof v.data == "string" && v.data.indexOf(o) === 0 && g(+v.data.slice(o.length));
						}
					})(typeof self == "undefined" ? n === void 0 ? this : n : self);
				}).call(this, typeof global != "undefined" ? global : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
			}, {}]
		}, {}, [10])(10);
	});
});
var Sn = _r((Lt) => {
	"use strict";
	function Lg(e, r, t) {
		if (t === void 0 && (t = Array.prototype), e && typeof t.find == "function") return t.find.call(e, r);
		for (var n = 0; n < e.length; n++) if (Dn(e, n)) {
			var i = e[n];
			if (r.call(void 0, i, n, e)) return i;
		}
	}
	function ti(e, r) {
		return r === void 0 && (r = Object), r && typeof r.getOwnPropertyDescriptors == "function" && (e = r.create(null, r.getOwnPropertyDescriptors(e))), r && typeof r.freeze == "function" ? r.freeze(e) : e;
	}
	function Dn(e, r) {
		return Object.prototype.hasOwnProperty.call(e, r);
	}
	function Pg(e, r) {
		if (e === null || typeof e != "object") throw new TypeError("target is not an object");
		for (var t in r) Dn(r, t) && (e[t] = r[t]);
		return e;
	}
	var Ph = ti({
		allowfullscreen: !0,
		async: !0,
		autofocus: !0,
		autoplay: !0,
		checked: !0,
		controls: !0,
		default: !0,
		defer: !0,
		disabled: !0,
		formnovalidate: !0,
		hidden: !0,
		ismap: !0,
		itemscope: !0,
		loop: !0,
		multiple: !0,
		muted: !0,
		nomodule: !0,
		novalidate: !0,
		open: !0,
		playsinline: !0,
		readonly: !0,
		required: !0,
		reversed: !0,
		selected: !0
	});
	function Mg(e) {
		return Dn(Ph, e.toLowerCase());
	}
	var Mh = ti({
		area: !0,
		base: !0,
		br: !0,
		col: !0,
		embed: !0,
		hr: !0,
		img: !0,
		input: !0,
		link: !0,
		meta: !0,
		param: !0,
		source: !0,
		track: !0,
		wbr: !0
	});
	function Ug(e) {
		return Dn(Mh, e.toLowerCase());
	}
	var ra = ti({
		script: !1,
		style: !1,
		textarea: !0,
		title: !0
	});
	function zg(e) {
		var r = e.toLowerCase();
		return Dn(ra, r) && !ra[r];
	}
	function Hg(e) {
		var r = e.toLowerCase();
		return Dn(ra, r) && ra[r];
	}
	function Uh(e) {
		return e === na.HTML;
	}
	function Zg(e) {
		return Uh(e) || e === na.XML_XHTML_APPLICATION;
	}
	var na = ti({
		HTML: "text/html",
		XML_APPLICATION: "application/xml",
		XML_TEXT: "text/xml",
		XML_XHTML_APPLICATION: "application/xhtml+xml",
		XML_SVG_IMAGE: "image/svg+xml"
	}), Wg = Object.keys(na).map(function(e) {
		return na[e];
	});
	function Gg(e) {
		return Wg.indexOf(e) > -1;
	}
	var Qg = ti({
		HTML: "http://www.w3.org/1999/xhtml",
		SVG: "http://www.w3.org/2000/svg",
		XML: "http://www.w3.org/XML/1998/namespace",
		XMLNS: "http://www.w3.org/2000/xmlns/"
	});
	Lt.assign = Pg;
	Lt.find = Lg;
	Lt.freeze = ti;
	Lt.HTML_BOOLEAN_ATTRIBUTES = Ph;
	Lt.HTML_RAW_TEXT_ELEMENTS = ra;
	Lt.HTML_VOID_ELEMENTS = Mh;
	Lt.hasDefaultHTMLNamespace = Zg;
	Lt.hasOwn = Dn;
	Lt.isHTMLBooleanAttribute = Mg;
	Lt.isHTMLRawTextElement = zg;
	Lt.isHTMLEscapableRawTextElement = Hg;
	Lt.isHTMLMimeType = Uh;
	Lt.isHTMLVoidElement = Ug;
	Lt.isValidMimeType = Gg;
	Lt.MIME_TYPE = na;
	Lt.NAMESPACE = Qg;
});
var ua = _r((oa) => {
	"use strict";
	var Yg = Sn();
	function Hh(e, r) {
		e.prototype = Object.create(Error.prototype, {
			constructor: { value: e },
			name: {
				value: e.name,
				enumerable: !0,
				writable: r
			}
		});
	}
	var aa = Yg.freeze({
		Error: "Error",
		IndexSizeError: "IndexSizeError",
		DomstringSizeError: "DomstringSizeError",
		HierarchyRequestError: "HierarchyRequestError",
		WrongDocumentError: "WrongDocumentError",
		InvalidCharacterError: "InvalidCharacterError",
		NoDataAllowedError: "NoDataAllowedError",
		NoModificationAllowedError: "NoModificationAllowedError",
		NotFoundError: "NotFoundError",
		NotSupportedError: "NotSupportedError",
		InUseAttributeError: "InUseAttributeError",
		InvalidStateError: "InvalidStateError",
		SyntaxError: "SyntaxError",
		InvalidModificationError: "InvalidModificationError",
		NamespaceError: "NamespaceError",
		InvalidAccessError: "InvalidAccessError",
		ValidationError: "ValidationError",
		TypeMismatchError: "TypeMismatchError",
		SecurityError: "SecurityError",
		NetworkError: "NetworkError",
		AbortError: "AbortError",
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
	}), Zh = Object.keys(aa);
	function Wh(e) {
		return typeof e == "number" && e >= 1 && e <= 25;
	}
	function Kg(e) {
		return typeof e == "string" && e.substring(e.length - aa.Error.length) === aa.Error;
	}
	function sa(e, r) {
		Wh(e) ? (this.name = Zh[e], this.message = r || "") : (this.message = e, this.name = Kg(r) ? r : aa.Error), Error.captureStackTrace && Error.captureStackTrace(this, sa);
	}
	Hh(sa, !0);
	Object.defineProperties(sa.prototype, { code: {
		enumerable: !0,
		get: function() {
			var e = Zh.indexOf(this.name);
			return Wh(e) ? e : 0;
		}
	} });
	var Gh = {
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
	}, Zo = Object.entries(Gh);
	for (ia = 0; ia < Zo.length; ia++) zh = Zo[ia][0], sa[zh] = Zo[ia][1];
	var zh, ia;
	function Wo(e, r, t) {
		this.message = e, this.locator = r, this.cause = t, Error.captureStackTrace && Error.captureStackTrace(this, Wo);
	}
	Hh(Wo);
	oa.DOMException = sa;
	oa.DOMExceptionName = aa;
	oa.ExceptionCode = Gh;
	oa.ParseError = Wo;
});
var $o = _r((Qe) => {
	"use strict";
	function $h(e) {
		try {
			typeof e != "function" && (e = RegExp);
			var r = new e("𝌆", "u").exec("𝌆");
			return !!r && r[0].length === 2;
		} catch (t) {}
		return !1;
	}
	var ii = $h();
	function rn(e) {
		if (e.source[0] !== "[") throw new Error(e + " can not be used with chars");
		return e.source.slice(1, e.source.lastIndexOf("]"));
	}
	function ri(e, r) {
		if (e.source[0] !== "[") throw new Error("/" + e.source + "/ can not be used with chars_without");
		if (!r || typeof r != "string") throw new Error(JSON.stringify(r) + " is not a valid search");
		if (e.source.indexOf(r) === -1) throw new Error("\"" + r + "\" is not is /" + e.source + "/");
		if (r === "-" && e.source.indexOf(r) !== 1) throw new Error("\"" + r + "\" is not at the first postion of /" + e.source + "/");
		return new RegExp(e.source.replace(r, ""), ii ? "u" : "");
	}
	function Je(e) {
		var r = this;
		return new RegExp(Array.prototype.slice.call(arguments).map(function(t) {
			var n = typeof t == "string";
			if (n && r === void 0 && t === "|") throw new Error("use regg instead of reg to wrap expressions with `|`!");
			return n ? t : t.source;
		}).join(""), ii ? "u" : "");
	}
	function We(e) {
		if (arguments.length === 0) throw new Error("no parameters provided");
		return Je.apply(We, ["(?:"].concat(Array.prototype.slice.call(arguments), [")"]));
	}
	var jg = "�", nn = /[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;
	ii && (nn = Je("[", rn(nn), "\\u{10000}-\\u{10FFFF}", "]"));
	var qg = new RegExp("[^" + rn(nn) + "]", ii ? "u" : ""), os = /[\x20\x09\x0D\x0A]/, $g = rn(os), lt = Je(os, "+"), _t = Je(os, "*"), la = /[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
	ii && (la = Je("[", rn(la), "\\u{10000}-\\u{10FFFF}", "]"));
	var Yo = Je("[", rn(la), rn(/[-.0-9\xB7]/), rn(/[\u0300-\u036F\u203F-\u2040]/), "]"), ar = Je(la, Yo, "*"), Vg = Je("^", ar, "$"), Qh = Je(Yo, "+"), ha = We(Je("&", ar, ";"), "|", We(/&#[0-9]+;|&#x[0-9a-fA-F]+;/)), ca = Je("%", ar, ";"), Ko = We(Je("\"", We(/[^%&"]/, "|", ca, "|", ha), "*", "\""), "|", Je("'", We(/[^%&']/, "|", ca, "|", ha), "*", "'")), t1 = We("\"", We(/[^<&"]/, "|", ha), "*", "\"", "|", "'", We(/[^<&']/, "|", ha), "*", "'"), Go = Je(ri(la, ":"), ri(Yo, ":"), "*"), i1 = Je("^", Go, "$"), fa = Je(Go, We(":", Go), "?"), a1 = Je("^", fa, "$"), s1 = Je("(", fa, ")"), ni = We(/"[^"]*"|'[^']*'/), o1 = Je(/^<\?/, "(", ar, ")", We(lt, "(?!", os, ")(", nn, "*?)"), "?", /\?>/), Yh = /[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/, da = We("\"", Yh, "*\"", "|", "'", ri(Yh, "'"), "*'"), Jh = "<!--", Vh = "-->", u1 = Je(Jh, We(ri(nn, "-"), "|", Je("-", ri(nn, "-"))), "*", Vh), Kh = "#PCDATA", f1 = We("EMPTY", "|", "ANY", "|", We(Je(/\(/, _t, Kh, We(_t, /\|/, _t, fa), "*", _t, /\)\*/), "|", Je(/\(/, _t, Kh, _t, /\)/)), "|", Je(/\([^>]+\)/, /[?*+]?/)), p1 = Je("<!ELEMENT", lt, We(fa, "|", ca), lt, We(f1, "|", ca), _t, ">"), y1 = Je("<!ATTLIST", lt, ar, We(lt, ar, lt, We(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/, "|", We(Je("NOTATION", lt, /\(/, _t, ar, We(_t, /\|/, _t, ar), "*", _t, /\)/), "|", Je(/\(/, _t, Qh, We(_t, /\|/, _t, Qh), "*", _t, /\)/))), lt, We(/#REQUIRED|#IMPLIED/, "|", We(We("#FIXED", lt), "?", t1))), "*", _t, ">"), Qo = "about:legacy-compat", E1 = We("\"" + Qo + "\"", "|", "'" + Qo + "'"), jo = "SYSTEM", us = "PUBLIC", ls = We(We(jo, lt, ni), "|", We(us, lt, da, lt, ni)), x1 = Je("^", We(We(jo, lt, "(?<SystemLiteralOnly>", ni, ")"), "|", We(us, lt, "(?<PubidLiteral>", da, ")", lt, "(?<SystemLiteral>", ni, ")"))), C1 = Je("^", da, "$"), I1 = Je("^", ni, "$"), D1 = We(Ko, "|", We(ls, We(lt, "NDATA", lt, ar), "?")), Xh = "<!ENTITY", N1 = We(Je(Xh, lt, ar, lt, D1, _t, ">"), "|", Je(Xh, lt, "%", lt, ar, lt, We(Ko, "|", ls), _t, ">")), R1 = Je("<!NOTATION", lt, ar, lt, We(ls, "|", Je(us, lt, da)), _t, ">"), qo = Je(_t, "=", _t), jh = /1[.]\d+/, O1 = Je(lt, "version", qo, We("'", jh, "'", "|", "\"", jh, "\"")), qh = /[A-Za-z][-A-Za-z0-9._]*/, M1 = Je(/^<\?xml/, O1, We(lt, "encoding", qo, We("\"", qh, "\"", "|", "'", qh, "'")), "?", We(lt, "standalone", qo, We("'", We("yes", "|", "no"), "'", "|", "\"", We("yes", "|", "no"), "\"")), "?", _t, /\?>/), U1 = "<!DOCTYPE", z1 = "<![CDATA[", H1 = "]]>", Q1 = Je(/<!\[CDATA\[/, Je(nn, "*?", /\]\]>/));
	Qe.chars = rn;
	Qe.chars_without = ri;
	Qe.detectUnicodeSupport = $h;
	Qe.reg = Je;
	Qe.regg = We;
	Qe.ABOUT_LEGACY_COMPAT = Qo;
	Qe.ABOUT_LEGACY_COMPAT_SystemLiteral = E1;
	Qe.AttlistDecl = y1;
	Qe.CDATA_START = z1;
	Qe.CDATA_END = H1;
	Qe.CDSect = Q1;
	Qe.Char = nn;
	Qe.Comment = u1;
	Qe.COMMENT_START = Jh;
	Qe.COMMENT_END = Vh;
	Qe.DOCTYPE_DECL_START = U1;
	Qe.elementdecl = p1;
	Qe.EntityDecl = N1;
	Qe.EntityValue = Ko;
	Qe.ExternalID = ls;
	Qe.ExternalID_match = x1;
	Qe.Name = ar;
	Qe.Name_exact = Vg;
	Qe.NCName_exact = i1;
	Qe.NotationDecl = R1;
	Qe.Reference = ha;
	Qe.PEReference = ca;
	Qe.PI = o1;
	Qe.PUBLIC = us;
	Qe.PubidLiteral = da;
	Qe.PubidLiteral_match = C1;
	Qe.QName = fa;
	Qe.QName_exact = a1;
	Qe.QName_group = s1;
	Qe.S = lt;
	Qe.SChar_s = $g;
	Qe.S_OPT = _t;
	Qe.SYSTEM = jo;
	Qe.SystemLiteral = ni;
	Qe.SystemLiteral_match = I1;
	Qe.InvalidChar = qg;
	Qe.UNICODE_REPLACEMENT_CHARACTER = jg;
	Qe.UNICODE_SUPPORT = ii;
	Qe.XMLDecl = M1;
});
var su = _r((yt) => {
	"use strict";
	var cr = Sn(), Sr = cr.find, Y1 = cr.hasDefaultHTMLNamespace, si = cr.hasOwn, K1 = cr.isHTMLMimeType, j1 = cr.isHTMLRawTextElement, q1 = cr.isHTMLVoidElement, pa = cr.MIME_TYPE, Tr = cr.NAMESPACE, Kt = Symbol(), sc = ua(), Le = sc.DOMException, Ut = sc.DOMExceptionName, bt = $o();
	function Vt(e) {
		if (e !== Kt) throw new TypeError("Illegal constructor");
	}
	function $1(e) {
		return e !== "";
	}
	function J1(e) {
		return e ? e.split(/[\t\n\f\r ]+/).filter($1) : [];
	}
	function V1(e, r) {
		return si(e, r) || (e[r] = !0), e;
	}
	function ec(e) {
		if (!e) return [];
		var r = J1(e);
		return Object.keys(r.reduce(V1, {}));
	}
	function X1(e) {
		return function(r) {
			return e && e.indexOf(r) !== -1;
		};
	}
	function oc(e) {
		if (!bt.QName_exact.test(e)) throw new Le(Le.INVALID_CHARACTER_ERR, "invalid character in qualified name \"" + e + "\"");
	}
	function Vo(e, r) {
		oc(r), e = e || null;
		var t = null, n = r;
		if (r.indexOf(":") >= 0) {
			var i = r.split(":");
			t = i[0], n = i[1];
		}
		if (t !== null && e === null) throw new Le(Le.NAMESPACE_ERR, "prefix is non-null and namespace is null");
		if (t === "xml" && e !== cr.NAMESPACE.XML) throw new Le(Le.NAMESPACE_ERR, "prefix is \"xml\" and namespace is not the XML namespace");
		if ((t === "xmlns" || r === "xmlns") && e !== cr.NAMESPACE.XMLNS) throw new Le(Le.NAMESPACE_ERR, "either qualifiedName or prefix is \"xmlns\" and namespace is not the XMLNS namespace");
		if (e === cr.NAMESPACE.XMLNS && t !== "xmlns" && r !== "xmlns") throw new Le(Le.NAMESPACE_ERR, "namespace is the XMLNS namespace and neither qualifiedName nor prefix is \"xmlns\"");
		return [
			e,
			t,
			n
		];
	}
	function li(e, r) {
		for (var t in e) si(e, t) && (r[t] = e[t]);
	}
	function Xt(e, r) {
		var t = e.prototype;
		if (!(t instanceof r)) {
			let n = function() {};
			n.prototype = r.prototype, n = new n(), li(t, n), e.prototype = t = n;
		}
		t.constructor != e && (typeof e != "function" && console.error("unknown Class:" + e), t.constructor = e);
	}
	var er = {}, hr = er.ELEMENT_NODE = 1, oi = er.ATTRIBUTE_NODE = 2, Aa = er.TEXT_NODE = 3, uc = er.CDATA_SECTION_NODE = 4, lc = er.ENTITY_REFERENCE_NODE = 5, em = er.ENTITY_NODE = 6, Xo = er.PROCESSING_INSTRUCTION_NODE = 7, eu = er.COMMENT_NODE = 8, ai = er.DOCUMENT_NODE = 9, hc = er.DOCUMENT_TYPE_NODE = 10, an = er.DOCUMENT_FRAGMENT_NODE = 11, tm = er.NOTATION_NODE = 12, vt = cr.freeze({
		DOCUMENT_POSITION_DISCONNECTED: 1,
		DOCUMENT_POSITION_PRECEDING: 2,
		DOCUMENT_POSITION_FOLLOWING: 4,
		DOCUMENT_POSITION_CONTAINS: 8,
		DOCUMENT_POSITION_CONTAINED_BY: 16,
		DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32
	});
	function cc(e, r) {
		if (r.length < e.length) return cc(r, e);
		var t = null;
		for (var n in e) {
			if (e[n] !== r[n]) return t;
			t = e[n];
		}
		return t;
	}
	function tc(e) {
		return e.guid || (e.guid = Math.random()), e.guid;
	}
	function Dt() {}
	Dt.prototype = {
		length: 0,
		item: function(e) {
			return e >= 0 && e < this.length ? this[e] : null;
		},
		toString: function(e) {
			var r;
			typeof e == "function" ? r = {
				requireWellFormed: !1,
				splitCDATASections: !0,
				nodeFilter: e
			} : e ? r = {
				requireWellFormed: !!e.requireWellFormed,
				splitCDATASections: e.splitCDATASections !== !1,
				nodeFilter: e.nodeFilter || null
			} : r = {
				requireWellFormed: !1,
				splitCDATASections: !0,
				nodeFilter: null
			};
			for (var t = [], n = 0; n < this.length; n++) au(this[n], t, null, r);
			return t.join("");
		},
		filter: function(e) {
			return Array.prototype.filter.call(this, e);
		},
		indexOf: function(e) {
			return Array.prototype.indexOf.call(this, e);
		}
	};
	Dt.prototype[Symbol.iterator] = function() {
		var e = this, r = 0;
		return {
			next: function() {
				return r < e.length ? {
					value: e[r++],
					done: !1
				} : { done: !0 };
			},
			return: function() {
				return { done: !0 };
			}
		};
	};
	function Dr(e, r) {
		this._node = e, this._refresh = r, ds(this);
	}
	function ds(e) {
		var r = e._node._inc || e._node.ownerDocument._inc;
		if (e._inc !== r) {
			var t = e._refresh(e._node);
			if (yc(e, "length", t.length), !e.$$length || t.length < e.$$length) for (var n = t.length; n in e; n++) si(e, n) && delete e[n];
			li(t, e), e._inc = r;
		}
	}
	Dr.prototype.item = function(e) {
		return ds(this), this[e] || null;
	};
	Xt(Dr, Dt);
	function ui() {
		this._nsIndex = Object.create(null), this._noNsIndex = Object.create(null);
	}
	function fc(e, r) {
		for (var t = 0; t < e.length;) {
			if (e[t] === r) return t;
			t++;
		}
	}
	function tu(e, r, t) {
		if (!r) return e._noNsIndex;
		var n = e._nsIndex[r];
		return !n && t && (n = e._nsIndex[r] = Object.create(null)), n;
	}
	function rm(e, r, t) {
		var n = tu(e, r, !1);
		return n && n[t] || null;
	}
	function nm(e, r) {
		tu(e, r.namespaceURI, !0)[r.localName] = r;
	}
	function im(e, r) {
		var t = tu(e, r.namespaceURI, !1);
		t && delete t[r.localName];
	}
	function am(e, r, t, n) {
		if (n ? r[fc(r, n)] = t : (r[r.length] = t, r.length++), nm(r, t), e) {
			t.ownerElement = e;
			var i = e.ownerDocument;
			i && (n && Ac(i, e, n), sm(i, e, t));
		}
	}
	function rc(e, r, t) {
		var n = fc(r, t);
		if (n >= 0) {
			for (var i = r.length - 1; n <= i;) r[n] = r[++n];
			if (r.length = i, im(r, t), e) {
				var a = e.ownerDocument;
				a && Ac(a, e, t), t.ownerElement = null;
			}
		}
	}
	ui.prototype = {
		length: 0,
		item: Dt.prototype.item,
		getNamedItem: function(e) {
			this._ownerElement && this._ownerElement._isInHTMLDocumentAndNamespace() && (e = e.toLowerCase());
			for (var r = 0; r < this.length;) {
				var t = this[r];
				if (t.nodeName === e) return t;
				r++;
			}
			return null;
		},
		setNamedItem: function(e) {
			var r = e.ownerElement;
			if (r && r !== this._ownerElement) throw new Le(Le.INUSE_ATTRIBUTE_ERR);
			var t = rm(this, e.namespaceURI, e.localName);
			return t === e ? e : (am(this._ownerElement, this, e, t), t);
		},
		setNamedItemNS: function(e) {
			return this.setNamedItem(e);
		},
		removeNamedItem: function(e) {
			var r = this.getNamedItem(e);
			if (!r) throw new Le(Le.NOT_FOUND_ERR, e);
			return rc(this._ownerElement, this, r), r;
		},
		removeNamedItemNS: function(e, r) {
			var t = this.getNamedItemNS(e, r);
			if (!t) throw new Le(Le.NOT_FOUND_ERR, e ? e + " : " + r : r);
			return rc(this._ownerElement, this, t), t;
		},
		getNamedItemNS: function(e, r) {
			e || (e = null);
			for (var t = 0; t < this.length;) {
				var n = this[t];
				if (n.localName === r && n.namespaceURI === e) return n;
				t++;
			}
			return null;
		}
	};
	ui.prototype[Symbol.iterator] = function() {
		var e = this, r = 0;
		return {
			next: function() {
				return r < e.length ? {
					value: e[r++],
					done: !1
				} : { done: !0 };
			},
			return: function() {
				return { done: !0 };
			}
		};
	};
	function dc() {}
	dc.prototype = {
		hasFeature: function(e, r) {
			return !0;
		},
		createDocument: function(e, r, t) {
			var n = pa.XML_APPLICATION;
			e === Tr.HTML ? n = pa.XML_XHTML_APPLICATION : e === Tr.SVG && (n = pa.XML_SVG_IMAGE);
			var i = new Wr(Kt, { contentType: n });
			if (i.implementation = this, i.childNodes = new Dt(), i.doctype = t || null, t && i.appendChild(t), r) {
				var a = i.createElementNS(e, r);
				i.appendChild(a);
			}
			return i;
		},
		createDocumentType: function(e, r, t, n) {
			oc(e);
			var i = new gs(Kt);
			return i.name = e, i.nodeName = e, i.publicId = r || "", i.systemId = t || "", i.internalSubset = n || "", i.childNodes = new Dt(), i;
		},
		createHTMLDocument: function(e) {
			var r = new Wr(Kt, { contentType: pa.HTML });
			if (r.implementation = this, r.childNodes = new Dt(), e !== !1) {
				r.doctype = this.createDocumentType("html"), r.doctype.ownerDocument = r, r.appendChild(r.doctype);
				var t = r.createElement("html");
				r.appendChild(t);
				var n = r.createElement("head");
				if (t.appendChild(n), typeof e == "string") {
					var i = r.createElement("title");
					i.appendChild(r.createTextNode(e)), n.appendChild(i);
				}
				t.appendChild(r.createElement("body"));
			}
			return r;
		}
	};
	function tt(e) {
		Vt(e);
	}
	tt.prototype = {
		firstChild: null,
		lastChild: null,
		previousSibling: null,
		nextSibling: null,
		parentNode: null,
		get parentElement() {
			return this.parentNode && this.parentNode.nodeType === this.ELEMENT_NODE ? this.parentNode : null;
		},
		childNodes: null,
		ownerDocument: null,
		nodeValue: null,
		namespaceURI: null,
		prefix: null,
		localName: null,
		baseURI: "about:blank",
		get isConnected() {
			var e = this.getRootNode();
			return e && e.nodeType === e.DOCUMENT_NODE;
		},
		contains: function(e) {
			if (!e) return !1;
			var r = e;
			do {
				if (this === r) return !0;
				r = r.parentNode;
			} while (r);
			return !1;
		},
		getRootNode: function(e) {
			var r = this;
			do {
				if (!r.parentNode) return r;
				r = r.parentNode;
			} while (r);
		},
		isEqualNode: function(e) {
			if (!e) return !1;
			for (var r = [{
				node: this,
				other: e
			}]; r.length > 0;) {
				var t = r.pop(), n = t.node, i = t.other;
				if (n.nodeType !== i.nodeType) return !1;
				switch (n.nodeType) {
					case n.DOCUMENT_TYPE_NODE:
						if (n.name !== i.name || n.publicId !== i.publicId || n.systemId !== i.systemId) return !1;
						break;
					case n.ELEMENT_NODE:
						if (n.namespaceURI !== i.namespaceURI || n.prefix !== i.prefix || n.localName !== i.localName || n.attributes.length !== i.attributes.length) return !1;
						for (var a = 0; a < n.attributes.length; a++) {
							var s = n.attributes.item(a), u = i.getAttributeNodeNS(s.namespaceURI, s.localName);
							if (!u) return !1;
							r.push({
								node: s,
								other: u
							});
						}
						break;
					case n.ATTRIBUTE_NODE:
						if (n.namespaceURI !== i.namespaceURI || n.localName !== i.localName || n.value !== i.value) return !1;
						break;
					case n.PROCESSING_INSTRUCTION_NODE:
						if (n.target !== i.target || n.data !== i.data) return !1;
						break;
					case n.TEXT_NODE:
					case n.CDATA_SECTION_NODE:
					case n.COMMENT_NODE: if (n.data !== i.data) return !1;
				}
				if (n.childNodes.length !== i.childNodes.length) return !1;
				for (var a = n.childNodes.length - 1; a >= 0; a--) r.push({
					node: n.childNodes[a],
					other: i.childNodes[a]
				});
			}
			return !0;
		},
		isSameNode: function(e) {
			return this === e;
		},
		insertBefore: function(e, r) {
			return fs(this, e, r);
		},
		replaceChild: function(e, r) {
			fs(this, e, r, _c), r && this.removeChild(r);
		},
		removeChild: function(e) {
			return gc(this, e);
		},
		appendChild: function(e) {
			return this.insertBefore(e, null);
		},
		hasChildNodes: function() {
			return this.firstChild != null;
		},
		cloneNode: function(e) {
			return bc(this.ownerDocument || this, this, e);
		},
		normalize: function() {
			Pt(this, null, { enter: function(e) {
				for (var r = e.firstChild; r;) {
					var t = r.nextSibling;
					if (t !== null && t.nodeType === Aa && r.nodeType === Aa) {
						for (var n = [], i = t; i !== null && i.nodeType === Aa;) n.push(i.data), i = i.nextSibling;
						for (var a = r.nextSibling; a !== i;) {
							var s = a.nextSibling;
							a.parentNode = null, a.previousSibling = null, a.nextSibling = null, a = s;
						}
						r.nextSibling = i, i !== null ? i.previousSibling = r : e.lastChild = r, r.appendData(n.join("")), ru(e.ownerDocument, e), r = i;
					} else r = t;
				}
				return !0;
			} });
		},
		isSupported: function(e, r) {
			return this.ownerDocument.implementation.hasFeature(e, r);
		},
		lookupPrefix: function(e) {
			for (var r = this; r;) {
				var t = r._nsMap;
				if (t) {
					for (var n in t) if (si(t, n) && t[n] === e) return n;
				}
				r = r.nodeType == oi ? r.ownerDocument : r.parentNode;
			}
			return null;
		},
		lookupNamespaceURI: function(e) {
			for (var r = this; r;) {
				var t = r._nsMap;
				if (t && si(t, e)) return t[e];
				r = r.nodeType == oi ? r.ownerDocument : r.parentNode;
			}
			return null;
		},
		isDefaultNamespace: function(e) {
			return this.lookupPrefix(e) == null;
		},
		compareDocumentPosition: function(e) {
			if (this === e) return 0;
			var r = e, t = this, n = null, i = null;
			if (r instanceof Tn && (n = r, r = n.ownerElement), t instanceof Tn && (i = t, t = i.ownerElement, n && r && t === r)) for (var a = 0, s; s = t.attributes[a]; a++) {
				if (s === n) return vt.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + vt.DOCUMENT_POSITION_PRECEDING;
				if (s === i) return vt.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + vt.DOCUMENT_POSITION_FOLLOWING;
			}
			if (!r || !t || t.ownerDocument !== r.ownerDocument) return vt.DOCUMENT_POSITION_DISCONNECTED + vt.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + (tc(t.ownerDocument) > tc(r.ownerDocument) ? vt.DOCUMENT_POSITION_FOLLOWING : vt.DOCUMENT_POSITION_PRECEDING);
			if (i && r === t) return vt.DOCUMENT_POSITION_CONTAINS + vt.DOCUMENT_POSITION_PRECEDING;
			if (n && r === t) return vt.DOCUMENT_POSITION_CONTAINED_BY + vt.DOCUMENT_POSITION_FOLLOWING;
			for (var u = [], c = r.parentNode; c;) {
				if (!i && c === t) return vt.DOCUMENT_POSITION_CONTAINED_BY + vt.DOCUMENT_POSITION_FOLLOWING;
				u.push(c), c = c.parentNode;
			}
			u.reverse();
			for (var o = [], l = t.parentNode; l;) {
				if (!n && l === r) return vt.DOCUMENT_POSITION_CONTAINS + vt.DOCUMENT_POSITION_PRECEDING;
				o.push(l), l = l.parentNode;
			}
			o.reverse();
			var d = cc(u, o);
			for (var p in d.childNodes) {
				var h = d.childNodes[p];
				if (h === t) return vt.DOCUMENT_POSITION_FOLLOWING;
				if (h === r) return vt.DOCUMENT_POSITION_PRECEDING;
				if (o.indexOf(h) >= 0) return vt.DOCUMENT_POSITION_FOLLOWING;
				if (u.indexOf(h) >= 0) return vt.DOCUMENT_POSITION_PRECEDING;
			}
			return 0;
		}
	};
	function pc(e) {
		return e == "<" && "&lt;" || e == ">" && "&gt;" || e == "&" && "&amp;" || e == "\"" && "&quot;" || "&#" + e.charCodeAt() + ";";
	}
	li(er, tt);
	li(er, tt.prototype);
	li(vt, tt);
	li(vt, tt.prototype);
	function cs(e, r) {
		Pt(e, null, { enter: function(t) {
			return r(t) ? Pt.STOP : !0;
		} });
	}
	function Pt(e, r, t) {
		for (var n = [{
			node: e,
			context: r,
			phase: Pt.ENTER
		}]; n.length > 0;) {
			var i = n.pop();
			if (i.phase === Pt.ENTER) {
				var a = t.enter(i.node, i.context);
				if (a === Pt.STOP) return Pt.STOP;
				if (n.push({
					node: i.node,
					context: a,
					phase: Pt.EXIT
				}), a == null) continue;
				for (var s = i.node.lastChild; s;) n.push({
					node: s,
					context: a,
					phase: Pt.ENTER
				}), s = s.previousSibling;
			} else t.exit && t.exit(i.node, i.context);
		}
	}
	Pt.STOP = Symbol("walkDOM.STOP");
	Pt.ENTER = 0;
	Pt.EXIT = 1;
	function Wr(e, r) {
		Vt(e);
		var t = r || {};
		this.ownerDocument = this, this.contentType = t.contentType || pa.XML_APPLICATION, this.type = K1(this.contentType) ? "html" : "xml";
	}
	function sm(e, r, t) {
		e && e._inc++;
		t.namespaceURI === Tr.XMLNS && (r._nsMap[t.prefix ? t.localName : ""] = t.value);
	}
	function Ac(e, r, t, n) {
		e && e._inc++;
		t.namespaceURI === Tr.XMLNS && delete r._nsMap[t.prefix ? t.localName : ""];
	}
	function ru(e, r, t) {
		if (e && e._inc) {
			e._inc++;
			var n = r.childNodes;
			if (t && !t.nextSibling) n[n.length++] = t;
			else {
				for (var i = r.firstChild, a = 0; i;) n[a++] = i, i = i.nextSibling;
				n.length = a, delete n[n.length];
			}
		}
	}
	function gc(e, r) {
		if (e !== r.parentNode) throw new Le(Le.NOT_FOUND_ERR, "child's parent is not parent");
		var t = r.previousSibling, n = r.nextSibling;
		return t ? t.nextSibling = n : e.firstChild = n, n ? n.previousSibling = t : e.lastChild = t, ru(e.ownerDocument, e), r.parentNode = null, r.previousSibling = null, r.nextSibling = null, r;
	}
	function om(e) {
		return e && (e.nodeType === tt.DOCUMENT_NODE || e.nodeType === tt.DOCUMENT_FRAGMENT_NODE || e.nodeType === tt.ELEMENT_NODE);
	}
	function um(e) {
		return e && (e.nodeType === tt.CDATA_SECTION_NODE || e.nodeType === tt.COMMENT_NODE || e.nodeType === tt.DOCUMENT_FRAGMENT_NODE || e.nodeType === tt.DOCUMENT_TYPE_NODE || e.nodeType === tt.ELEMENT_NODE || e.nodeType === tt.PROCESSING_INSTRUCTION_NODE || e.nodeType === tt.TEXT_NODE);
	}
	function sn(e) {
		return e && e.nodeType === tt.DOCUMENT_TYPE_NODE;
	}
	function Zr(e) {
		return e && e.nodeType === tt.ELEMENT_NODE;
	}
	function mc(e) {
		return e && e.nodeType === tt.TEXT_NODE;
	}
	function nc(e, r) {
		var t = e.childNodes || [];
		if (Sr(t, Zr) || sn(r)) return !1;
		var n = Sr(t, sn);
		return !(r && n && t.indexOf(n) > t.indexOf(r));
	}
	function ic(e, r) {
		var t = e.childNodes || [];
		function n(a) {
			return Zr(a) && a !== r;
		}
		if (Sr(t, n)) return !1;
		var i = Sr(t, sn);
		return !(r && i && t.indexOf(i) > t.indexOf(r));
	}
	function lm(e, r, t) {
		if (!om(e)) throw new Le(Le.HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + e.nodeType);
		if (t && t.parentNode !== e) throw new Le(Le.NOT_FOUND_ERR, "child not in parent");
		if (!um(r) || sn(r) && e.nodeType !== tt.DOCUMENT_NODE) throw new Le(Le.HIERARCHY_REQUEST_ERR, "Unexpected node type " + r.nodeType + " for parent node type " + e.nodeType);
	}
	function hm(e, r, t) {
		var n = e.childNodes || [], i = r.childNodes || [];
		if (r.nodeType === tt.DOCUMENT_FRAGMENT_NODE) {
			var a = i.filter(Zr);
			if (a.length > 1 || Sr(i, mc)) throw new Le(Le.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
			if (a.length === 1 && !nc(e, t)) throw new Le(Le.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
		}
		if (Zr(r) && !nc(e, t)) throw new Le(Le.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
		if (sn(r)) {
			if (Sr(n, sn)) throw new Le(Le.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
			var s = Sr(n, Zr);
			if (t && n.indexOf(s) < n.indexOf(t)) throw new Le(Le.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
			if (!t && s) throw new Le(Le.HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
		}
	}
	function _c(e, r, t) {
		var n = e.childNodes || [], i = r.childNodes || [];
		if (r.nodeType === tt.DOCUMENT_FRAGMENT_NODE) {
			var a = i.filter(Zr);
			if (a.length > 1 || Sr(i, mc)) throw new Le(Le.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
			if (a.length === 1 && !ic(e, t)) throw new Le(Le.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
		}
		if (Zr(r) && !ic(e, t)) throw new Le(Le.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
		if (sn(r)) {
			if (Sr(n, function(c) {
				return sn(c) && c !== t;
			})) throw new Le(Le.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
			var s = Sr(n, Zr);
			if (t && n.indexOf(s) < n.indexOf(t)) throw new Le(Le.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
		}
	}
	function fs(e, r, t, n) {
		lm(e, r, t), e.nodeType === tt.DOCUMENT_NODE && (n || hm)(e, r, t);
		var i = r.parentNode;
		if (i && i.removeChild(r), r.nodeType === an) {
			var a = r.firstChild;
			if (a == null) return r;
			var s = r.lastChild;
		} else a = s = r;
		var u = t ? t.previousSibling : e.lastChild;
		a.previousSibling = u, s.nextSibling = t, u ? u.nextSibling = a : e.firstChild = a, t == null ? e.lastChild = s : t.previousSibling = s;
		do
			a.parentNode = e;
		while (a !== s && (a = a.nextSibling));
		return ru(e.ownerDocument || e, e, r), r.nodeType == an && (r.firstChild = r.lastChild = null), r;
	}
	Wr.prototype = {
		implementation: null,
		nodeName: "#document",
		nodeType: ai,
		doctype: null,
		documentElement: null,
		_inc: 1,
		insertBefore: function(e, r) {
			if (e.nodeType === an) {
				for (var t = e.firstChild; t;) {
					var n = t.nextSibling;
					this.insertBefore(t, r), t = n;
				}
				return e;
			}
			return fs(this, e, r), e.ownerDocument = this, this.documentElement === null && e.nodeType === hr && (this.documentElement = e), e;
		},
		removeChild: function(e) {
			var r = gc(this, e);
			return r === this.documentElement && (this.documentElement = null), r;
		},
		replaceChild: function(e, r) {
			fs(this, e, r, _c), e.ownerDocument = this, r && this.removeChild(r), Zr(e) && (this.documentElement = e);
		},
		importNode: function(e, r) {
			return cm(this, e, r);
		},
		getElementById: function(e) {
			var r = null;
			return cs(this.documentElement, function(t) {
				if (t.nodeType == hr && t.getAttribute("id") == e) return r = t, !0;
			}), r;
		},
		createElement: function(e) {
			var r = new Gr(Kt);
			r.ownerDocument = this, this.type === "html" && (e = e.toLowerCase()), Y1(this.contentType) && (r.namespaceURI = Tr.HTML), r.nodeName = e, r.tagName = e, r.localName = e, r.childNodes = new Dt();
			var t = r.attributes = new ui();
			return t._ownerElement = r, r;
		},
		createDocumentFragment: function() {
			var e = new hi(Kt);
			return e.ownerDocument = this, e.childNodes = new Dt(), e;
		},
		createTextNode: function(e) {
			var r = new ga(Kt);
			return r.ownerDocument = this, r.childNodes = new Dt(), r.appendData(e), r;
		},
		createComment: function(e) {
			var r = new ps(Kt);
			return r.ownerDocument = this, r.childNodes = new Dt(), r.appendData(e), r;
		},
		createCDATASection: function(e) {
			if (e.indexOf("]]>") !== -1) throw new Le(Le.INVALID_CHARACTER_ERR, "data contains \"]]>\"");
			var r = new As(Kt);
			return r.ownerDocument = this, r.childNodes = new Dt(), r.appendData(e), r;
		},
		createProcessingInstruction: function(e, r) {
			var t = new _s(Kt);
			return t.ownerDocument = this, t.childNodes = new Dt(), t.nodeName = t.target = e, t.nodeValue = t.data = r, t;
		},
		createAttribute: function(e) {
			if (!bt.QName_exact.test(e)) throw new Le(Le.INVALID_CHARACTER_ERR, "invalid character in name \"" + e + "\"");
			return this.type === "html" && (e = e.toLowerCase()), this._createAttribute(e);
		},
		_createAttribute: function(e) {
			var r = new Tn(Kt);
			return r.ownerDocument = this, r.childNodes = new Dt(), r.name = e, r.nodeName = e, r.localName = e, r.specified = !0, r;
		},
		createEntityReference: function(e) {
			if (!bt.Name_exact.test(e)) throw new Le(Le.INVALID_CHARACTER_ERR, "not a valid xml name \"" + e + "\"");
			if (this.type === "html") throw new Le("document is an html document", Ut.NotSupportedError);
			var r = new ms(Kt);
			return r.ownerDocument = this, r.childNodes = new Dt(), r.nodeName = e, r;
		},
		createElementNS: function(e, r) {
			var t = Vo(e, r), n = new Gr(Kt), i = n.attributes = new ui();
			return n.childNodes = new Dt(), n.ownerDocument = this, n.nodeName = r, n.tagName = r, n.namespaceURI = t[0], n.prefix = t[1], n.localName = t[2], i._ownerElement = n, n;
		},
		createAttributeNS: function(e, r) {
			var t = Vo(e, r), n = new Tn(Kt);
			return n.ownerDocument = this, n.childNodes = new Dt(), n.nodeName = r, n.name = r, n.specified = !0, n.namespaceURI = t[0], n.prefix = t[1], n.localName = t[2], n;
		}
	};
	Xt(Wr, tt);
	function Gr(e) {
		Vt(e), this._nsMap = Object.create(null);
	}
	Gr.prototype = {
		nodeType: hr,
		attributes: null,
		getQualifiedName: function() {
			return this.prefix ? this.prefix + ":" + this.localName : this.localName;
		},
		_isInHTMLDocumentAndNamespace: function() {
			return this.ownerDocument.type === "html" && this.namespaceURI === Tr.HTML;
		},
		hasAttributes: function() {
			return !!(this.attributes && this.attributes.length);
		},
		hasAttribute: function(e) {
			return !!this.getAttributeNode(e);
		},
		getAttribute: function(e) {
			var r = this.getAttributeNode(e);
			return r ? r.value : null;
		},
		getAttributeNode: function(e) {
			return this._isInHTMLDocumentAndNamespace() && (e = e.toLowerCase()), this.attributes.getNamedItem(e);
		},
		setAttribute: function(e, r) {
			this._isInHTMLDocumentAndNamespace() && (e = e.toLowerCase());
			var t = this.getAttributeNode(e);
			t ? t.value = t.nodeValue = "" + r : (t = this.ownerDocument._createAttribute(e), t.value = t.nodeValue = "" + r, this.setAttributeNode(t));
		},
		removeAttribute: function(e) {
			var r = this.getAttributeNode(e);
			r && this.removeAttributeNode(r);
		},
		setAttributeNode: function(e) {
			return this.attributes.setNamedItem(e);
		},
		setAttributeNodeNS: function(e) {
			return this.attributes.setNamedItemNS(e);
		},
		removeAttributeNode: function(e) {
			return this.attributes.removeNamedItem(e.nodeName);
		},
		removeAttributeNS: function(e, r) {
			var t = this.getAttributeNodeNS(e, r);
			t && this.removeAttributeNode(t);
		},
		hasAttributeNS: function(e, r) {
			return this.getAttributeNodeNS(e, r) != null;
		},
		getAttributeNS: function(e, r) {
			var t = this.getAttributeNodeNS(e, r);
			return t ? t.value : null;
		},
		setAttributeNS: function(e, r, t) {
			var i = Vo(e, r)[2], a = this.getAttributeNodeNS(e, i);
			a ? a.value = a.nodeValue = "" + t : (a = this.ownerDocument.createAttributeNS(e, r), a.value = a.nodeValue = "" + t, this.setAttributeNode(a));
		},
		getAttributeNodeNS: function(e, r) {
			return this.attributes.getNamedItemNS(e, r);
		},
		getElementsByClassName: function(e) {
			var r = ec(e);
			return new Dr(this, function(t) {
				var n = [];
				return r.length > 0 && cs(t, function(i) {
					if (i !== t && i.nodeType === hr) {
						var a = i.getAttribute("class");
						if (a) {
							var s = e === a;
							if (!s) {
								var u = ec(a);
								s = r.every(X1(u));
							}
							s && n.push(i);
						}
					}
				}), n;
			});
		},
		getElementsByTagName: function(e) {
			var r = (this.nodeType === ai ? this : this.ownerDocument).type === "html", t = e.toLowerCase();
			return new Dr(this, function(n) {
				var i = [];
				return cs(n, function(a) {
					if (!(a === n || a.nodeType !== hr)) if (e === "*") i.push(a);
					else a.getQualifiedName() === (r && a.namespaceURI === Tr.HTML ? t : e) && i.push(a);
				}), i;
			});
		},
		getElementsByTagNameNS: function(e, r) {
			return new Dr(this, function(t) {
				var n = [];
				return cs(t, function(i) {
					i !== t && i.nodeType === hr && (e === "*" || i.namespaceURI === e) && (r === "*" || i.localName == r) && n.push(i);
				}), n;
			});
		}
	};
	Wr.prototype.getElementsByClassName = Gr.prototype.getElementsByClassName;
	Wr.prototype.getElementsByTagName = Gr.prototype.getElementsByTagName;
	Wr.prototype.getElementsByTagNameNS = Gr.prototype.getElementsByTagNameNS;
	Xt(Gr, tt);
	function Tn(e) {
		Vt(e), this.namespaceURI = null, this.prefix = null, this.ownerElement = null;
	}
	Tn.prototype.nodeType = oi;
	Xt(Tn, tt);
	function on(e) {
		Vt(e);
	}
	on.prototype = {
		data: "",
		substringData: function(e, r) {
			return this.data.substring(e, e + r);
		},
		appendData: function(e) {
			e = this.data + e, this.nodeValue = this.data = e, this.length = e.length;
		},
		insertData: function(e, r) {
			this.replaceData(e, 0, r);
		},
		deleteData: function(e, r) {
			this.replaceData(e, r, "");
		},
		replaceData: function(e, r, t) {
			var n = this.data.substring(0, e), i = this.data.substring(e + r);
			t = n + t + i, this.nodeValue = this.data = t, this.length = t.length;
		}
	};
	Xt(on, tt);
	function ga(e) {
		Vt(e);
	}
	ga.prototype = {
		nodeName: "#text",
		nodeType: Aa,
		splitText: function(e) {
			var r = this.data, t = r.substring(e);
			r = r.substring(0, e), this.data = this.nodeValue = r, this.length = r.length;
			var n = this.ownerDocument.createTextNode(t);
			return this.parentNode && this.parentNode.insertBefore(n, this.nextSibling), n;
		}
	};
	Xt(ga, on);
	function ps(e) {
		Vt(e);
	}
	ps.prototype = {
		nodeName: "#comment",
		nodeType: eu
	};
	Xt(ps, on);
	function As(e) {
		Vt(e);
	}
	As.prototype = {
		nodeName: "#cdata-section",
		nodeType: uc
	};
	Xt(As, ga);
	function gs(e) {
		Vt(e);
	}
	gs.prototype.nodeType = hc;
	Xt(gs, tt);
	function nu(e) {
		Vt(e);
	}
	nu.prototype.nodeType = tm;
	Xt(nu, tt);
	function iu(e) {
		Vt(e);
	}
	iu.prototype.nodeType = em;
	Xt(iu, tt);
	function ms(e) {
		Vt(e);
	}
	ms.prototype.nodeType = lc;
	Xt(ms, tt);
	function hi(e) {
		Vt(e);
	}
	hi.prototype.nodeName = "#document-fragment";
	hi.prototype.nodeType = an;
	Xt(hi, tt);
	function _s(e) {
		Vt(e);
	}
	_s.prototype.nodeType = Xo;
	Xt(_s, on);
	function wc() {}
	wc.prototype.serializeToString = function(e, r) {
		return vc.call(e, r);
	};
	tt.prototype.toString = vc;
	function vc(e) {
		var r;
		typeof e == "function" ? r = {
			requireWellFormed: !1,
			splitCDATASections: !0,
			nodeFilter: e
		} : e != null ? r = {
			requireWellFormed: !!e.requireWellFormed,
			splitCDATASections: e.splitCDATASections !== !1,
			nodeFilter: e.nodeFilter || null
		} : r = {
			requireWellFormed: !1,
			splitCDATASections: !0,
			nodeFilter: null
		};
		var t = [], n = this.nodeType === ai && this.documentElement || this, i = n.prefix, a = n.namespaceURI;
		if (a && i == null) {
			var i = n.lookupPrefix(a);
			if (i == null) var s = [{
				namespace: a,
				prefix: null
			}];
		}
		return au(this, t, s, r), t.join("");
	}
	function ac(e, r, t) {
		var n = e.prefix || "", i = e.namespaceURI;
		if (!i || n === "xml" && i === Tr.XML || i === Tr.XMLNS) return !1;
		for (var a = t.length; a--;) {
			var s = t[a];
			if (s.prefix === n) return s.namespace !== i;
		}
		return !0;
	}
	function hs(e, r, t, n) {
		if (n && !bt.QName_exact.test(r)) throw new Le("The attribute name \"" + r + "\" is not a valid XML QName", Ut.InvalidStateError);
		e.push(" ", r, "=\"", t.replace(/[<>&"\t\n\r]/g, pc), "\"");
	}
	function au(e, r, t, n) {
		t || (t = []);
		var i = n.nodeFilter, a = n.requireWellFormed, s = n.splitCDATASections, c = (e.nodeType === ai ? e : e.ownerDocument).type === "html";
		Pt(e, { ns: t }, {
			enter: function(o, l) {
				var d = l.ns;
				if (i) if (o = i(o), o) {
					if (typeof o == "string") return r.push(o), null;
				} else return null;
				switch (o.nodeType) {
					case hr:
						var p = o.attributes, h = p.length, A = o.tagName, f = A;
						if (!c && !o.prefix && o.namespaceURI) {
							for (var g, _ = 0; _ < p.length; _++) if (p.item(_).name === "xmlns") {
								g = p.item(_).value;
								break;
							}
							if (!g) for (var v = d.length - 1; v >= 0; v--) {
								var b = d[v];
								if (b.prefix === "" && b.namespace === o.namespaceURI) {
									g = b.namespace;
									break;
								}
							}
							if (g !== o.namespaceURI) for (var v = d.length - 1; v >= 0; v--) {
								var b = d[v];
								if (b.namespace === o.namespaceURI) {
									b.prefix && (f = b.prefix + ":" + A);
									break;
								}
							}
						}
						if (a && !bt.QName_exact.test(f)) throw new Le("The element name \"" + f + "\" is not a valid XML QName", Ut.InvalidStateError);
						r.push("<", f);
						for (var C = d.slice(), T = 0; T < h; T++) {
							var ee = p.item(T);
							ee.prefix == "xmlns" ? C.push({
								prefix: ee.localName,
								namespace: ee.value
							}) : ee.nodeName == "xmlns" && C.push({
								prefix: "",
								namespace: ee.value
							});
						}
						for (var T = 0; T < h; T++) {
							var ee = p.item(T);
							if (ac(ee, c, C)) {
								var x = ee.prefix || "", G = ee.namespaceURI;
								hs(r, x ? "xmlns:" + x : "xmlns", G, a), C.push({
									prefix: x,
									namespace: G
								});
							}
							var O = i ? i(ee) : ee;
							O && (typeof O == "string" ? r.push(O) : hs(r, O.name, O.value, a));
						}
						if (A === f && ac(o, c, C)) {
							var k = o.prefix || "", G = o.namespaceURI;
							hs(r, k ? "xmlns:" + k : "xmlns", G, a), C.push({
								prefix: k,
								namespace: G
							});
						}
						var H = !o.firstChild;
						if (H && (c || o.namespaceURI === Tr.HTML) && (H = q1(A)), H) return r.push("/>"), null;
						if (r.push(">"), c && j1(A)) {
							for (var m = o.firstChild; m;) m.data ? r.push(m.data) : au(m, r, C.slice(), n), m = m.nextSibling;
							return r.push("</", f, ">"), null;
						}
						return {
							ns: C,
							tag: f
						};
					case ai:
					case an:
						if (a && o.nodeType === ai && o.documentElement == null) throw new Le("The Document has no documentElement", Ut.InvalidStateError);
						return { ns: d };
					case oi: return hs(r, o.name, o.value, a), null;
					case Aa:
						if (a && bt.InvalidChar.test(o.data)) throw new Le("The Text node data contains characters outside the XML Char production", Ut.InvalidStateError);
						return r.push(o.data.replace(/[<&>]/g, pc)), null;
					case uc:
						if (a && o.data.indexOf("]]>") !== -1) throw new Le("The CDATASection data contains \"]]>\"", Ut.InvalidStateError);
						return s ? r.push(bt.CDATA_START, o.data.replace(/]]>/g, "]]]]><![CDATA[>"), bt.CDATA_END) : r.push(bt.CDATA_START, o.data, bt.CDATA_END), null;
					case eu:
						if (a) {
							if (bt.InvalidChar.test(o.data)) throw new Le("The comment node data contains characters outside the XML Char production", Ut.InvalidStateError);
							if (o.data.indexOf("--") !== -1 || o.data[o.data.length - 1] === "-") throw new Le("The comment node data contains \"--\" or ends with \"-\"", Ut.InvalidStateError);
						}
						return r.push(bt.COMMENT_START, o.data, bt.COMMENT_END), null;
					case hc:
						var V = o.publicId, y = o.systemId;
						if (a) {
							if (!bt.Name_exact.test(o.name)) throw new Le("The doctype name \"" + o.name + "\" is not a valid XML Name", Ut.InvalidStateError);
							if (V && !bt.PubidLiteral_match.test(V)) throw new Le("DocumentType publicId is not a valid PubidLiteral", Ut.InvalidStateError);
							if (y && y !== "." && !bt.SystemLiteral_match.test(y)) throw new Le("DocumentType systemId is not a valid SystemLiteral", Ut.InvalidStateError);
							if (o.internalSubset && o.internalSubset.indexOf("]>") !== -1) throw new Le("DocumentType internalSubset contains \"]>\"", Ut.InvalidStateError);
						}
						return r.push(bt.DOCTYPE_DECL_START, " ", o.name), V ? (r.push(" ", bt.PUBLIC, " ", V), y && y !== "." && r.push(" ", y)) : y && y !== "." && r.push(" ", bt.SYSTEM, " ", y), o.internalSubset && r.push(" [", o.internalSubset, "]"), r.push(">"), null;
					case Xo:
						if (a) {
							if (!bt.NCName_exact.test(o.target) || o.target.toLowerCase() === "xml") throw new Le("The processing instruction target \"" + o.target + "\" is not a valid XML NCName or is reserved", Ut.InvalidStateError);
							if (bt.InvalidChar.test(o.data)) throw new Le("The ProcessingInstruction data contains characters outside the XML Char production", Ut.InvalidStateError);
							if (o.data.indexOf("?>") !== -1) throw new Le("The ProcessingInstruction data contains \"?>\"", Ut.InvalidStateError);
						}
						return r.push("<?", o.target, " ", o.data, "?>"), null;
					case lc:
						if (a && !bt.Name_exact.test(o.nodeName)) throw new Le("The entity reference name \"" + o.nodeName + "\" is not a valid XML Name", Ut.InvalidStateError);
						return r.push("&", o.nodeName, ";"), null;
					default: return r.push("??", o.nodeName), null;
				}
			},
			exit: function(o, l) {
				l && l.tag && r.push("</", l.tag, ">");
			}
		});
	}
	function cm(e, r, t) {
		var n;
		return Pt(r, null, { enter: function(i, a) {
			var s = i.cloneNode(!1);
			s.ownerDocument = e, s.parentNode = null, a === null ? n = s : a.appendChild(s);
			return i.nodeType === oi || t ? s : null;
		} }), n;
	}
	function bc(e, r, t) {
		var n;
		return Pt(r, null, { enter: function(i, a) {
			var s = new i.constructor(Kt);
			for (var u in i) if (si(i, u)) {
				var c = i[u];
				typeof c != "object" && c != s[u] && (s[u] = c);
			}
			i.childNodes && (s.childNodes = new Dt()), s.ownerDocument = e;
			var o = t;
			switch (s.nodeType) {
				case hr:
					var l = i.attributes, d = s.attributes = new ui(), p = l.length;
					d._ownerElement = s;
					for (var h = 0; h < p; h++) s.setAttributeNode(bc(e, l.item(h), !0));
					break;
				case oi: o = !0;
			}
			return a !== null ? a.appendChild(s) : n = s, o ? s : null;
		} }), n;
	}
	function yc(e, r, t) {
		e[r] = t;
	}
	function Jo(e) {
		for (var r = [], t = e.firstChild; t;) t.nodeType === hr && r.push(t), t = t.nextSibling;
		return r;
	}
	try {
		Object.defineProperty && (Object.defineProperty(Dr.prototype, "length", { get: function() {
			return ds(this), this.$$length;
		} }), Object.defineProperty(tt.prototype, "textContent", {
			get: function() {
				if (this.nodeType === hr || this.nodeType === an) {
					var e = [];
					return Pt(this, null, { enter: function(r) {
						if (r.nodeType === hr || r.nodeType === an) return !0;
						if (r.nodeType === Xo || r.nodeType === eu) return null;
						e.push(r.nodeValue);
					} }), e.join("");
				}
				return this.nodeValue;
			},
			set: function(e) {
				switch (this.nodeType) {
					case hr:
					case an:
						for (; this.firstChild;) this.removeChild(this.firstChild);
						(e || String(e)) && this.appendChild(this.ownerDocument.createTextNode(e));
						break;
					default: this.data = e, this.value = e, this.nodeValue = e;
				}
			}
		}), Object.defineProperty(on.prototype, "data", {
			get: function() {
				return this._data != null ? this._data : "";
			},
			set: function(e) {
				this._data = e, this.length = typeof e == "string" ? e.length : 0;
			}
		}), Object.defineProperty(on.prototype, "nodeValue", {
			get: function() {
				return this.data;
			},
			set: function(e) {
				this.data = e;
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(Gr.prototype, "children", { get: function() {
			return new Dr(this, Jo);
		} }), Object.defineProperty(Wr.prototype, "children", { get: function() {
			return new Dr(this, Jo);
		} }), Object.defineProperty(hi.prototype, "children", { get: function() {
			return new Dr(this, Jo);
		} }), yc = function(e, r, t) {
			e["$$" + r] = t;
		});
	} catch (e) {}
	yt._updateLiveList = ds;
	yt.Attr = Tn;
	yt.CDATASection = As;
	yt.CharacterData = on;
	yt.Comment = ps;
	yt.Document = Wr;
	yt.DocumentFragment = hi;
	yt.DocumentType = gs;
	yt.DOMImplementation = dc;
	yt.Element = Gr;
	yt.Entity = iu;
	yt.EntityReference = ms;
	yt.LiveNodeList = Dr;
	yt.NamedNodeMap = ui;
	yt.Node = tt;
	yt.NodeList = Dt;
	yt.Notation = nu;
	yt.Text = ga;
	yt.ProcessingInstruction = _s;
	yt.walkDOM = Pt;
	yt.XMLSerializer = wc;
});
var xc = _r((ma) => {
	"use strict";
	var Ec = Sn().freeze;
	ma.XML_ENTITIES = Ec({
		amp: "&",
		apos: "'",
		gt: ">",
		lt: "<",
		quot: "\""
	});
	ma.HTML_ENTITIES = Ec({
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
		NewLine: `
`,
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
	ma.entityMap = ma.HTML_ENTITIES;
});
var Fc = _r((vs) => {
	"use strict";
	var Ai = Sn(), Ke = $o(), Dc = ua(), fm = Ai.isHTMLEscapableRawTextElement, dm = Ai.isHTMLMimeType, pm = Ai.isHTMLRawTextElement, va = Ai.hasOwn, Cc = Ai.NAMESPACE, Am = Dc.ParseError, gm = Dc.DOMException, ci = 0, un = 1, fi = 2, _a = 3, di = 4, pi = 5, wa = 6, ws = 7;
	function Sc() {}
	Sc.prototype = { parse: function(e, r, t) {
		var n = this.domBuilder;
		n.startDocument(), vm(r, r = Object.create(null)), mm(e, r, t, n, this.errorHandler), n.endDocument();
	} };
	var ou = /&#?\w+;?/g;
	function mm(e, r, t, n, i) {
		var a = dm(n.mimeType);
		e.indexOf(Ke.UNICODE_REPLACEMENT_CHARACTER) >= 0 && i.warning("Unicode replacement character detected, source encoding issues?");
		function s(q) {
			if (q > 65535) {
				q -= 65536;
				var Z = 55296 + (q >> 10), ge = 56320 + (q & 1023);
				return String.fromCharCode(Z, ge);
			} else return String.fromCharCode(q);
		}
		function u(q) {
			var Z = q[q.length - 1] === ";" ? q : q + ";";
			if (!a && Z !== q) return i.error("EntityRef: expecting ;"), q;
			var ge = Ke.Reference.exec(Z);
			if (!ge || ge[0].length !== Z.length) return i.error("entity not matching Reference production: " + q), q;
			var Ee = Z.slice(1, -1);
			return va(t, Ee) ? t[Ee] : Ee.charAt(0) === "#" ? s(parseInt(Ee.substring(1).replace("x", "0x"))) : (i.error("entity not found:" + q), q);
		}
		function c(q) {
			if (q > g) {
				var Z = e.substring(g, q).replace(ou, u);
				p && h(g), n.characters(Z, 0, q - g), g = q;
			}
		}
		var o = 0, l = 0, d = /\r\n?|\n|$/g, p = n.locator;
		function h(q, Z) {
			for (; q >= l && (Z = d.exec(e));) o = l, l = Z.index + Z[0].length, p.lineNumber++;
			p.columnNumber = q - o + 1;
		}
		for (var A = [{ currentNSMap: r }], f = [], g = 0;;) {
			try {
				var _ = e.indexOf("<", g);
				if (_ < 0) {
					if (!a && f.length > 0) return i.fatalError("unclosed xml tag(s): " + f.join(", "));
					if (!e.substring(g).match(/^\s*$/)) {
						var v = n.doc, b = v.createTextNode(e.substring(g));
						if (v.documentElement) return i.error("Extra content at the end of the document");
						v.appendChild(b), n.currentElement = b;
					}
					return;
				}
				if (_ > g) {
					var C = e.substring(g, _);
					!a && f.length === 0 && (C = C.replace(new RegExp(Ke.S_OPT.source, "g"), ""), C && i.error("Unexpected content outside root element: '" + C + "'")), c(_);
				}
				switch (e.charAt(_ + 1)) {
					case "/":
						var xe = e.indexOf(">", _ + 2), T = e.substring(_ + 2, xe > 0 ? xe : void 0);
						if (!T) return i.fatalError("end tag name missing");
						var ee = Ke.reg("^", Ke.QName_group, Ke.S_OPT, "$"), x = xe > 0 && ee.exec(T);
						if (!x) {
							var G = xe > 0 && Ke.reg("^", Ke.QName_group).exec(T);
							if (a && G) i.warning("end tag name contains invalid trailing characters: \"" + T + "\""), x = G;
							else if (G && new RegExp(ee.source, ee.flags + "m").test(T)) i.error("end tag name is followed by a line break and trailing content: \"" + T + "\""), x = G;
							else return i.fatalError("end tag name contains invalid characters: \"" + T + "\"");
						}
						if (!n.currentElement && !n.doc.documentElement) return;
						var O = f[f.length - 1] || n.currentElement.tagName || n.doc.documentElement.tagName || "";
						if (O !== x[1]) {
							var k = x[1].toLowerCase();
							if (!a || O.toLowerCase() !== k) return i.fatalError("Opening and ending tag mismatch: \"" + O + "\" != \"" + T + "\"");
						}
						var H = A.pop();
						f.pop();
						var m = H.localNSMap;
						if (n.endElement(H.uri, H.localName, O), m) for (var V in m) va(m, V) && n.endPrefixMapping(V);
						xe++;
						break;
					case "?":
						p && h(_), xe = ym(e, _, n, i);
						break;
					case "!":
						p && h(_), xe = Bc(e, _, n, i, a);
						break;
					default:
						p && h(_);
						var y = new Nc(), ie = A[A.length - 1].currentNSMap, xe = _m(e, _, y, ie, u, i, a), se = y.length;
						if (y.closed || (a && Ai.isHTMLVoidElement(y.tagName) ? y.closed = !0 : f.push(y.tagName)), p && se) {
							for (var ae = Ic(p, {}), R = 0; R < se; R++) {
								var W = y[R];
								h(W.offset), W.locator = Ic(p, {});
							}
							n.locator = ae, kc(y, n, ie) && A.push(y), n.locator = p;
						} else kc(y, n, ie) && A.push(y);
						a && !y.closed ? xe = wm(e, xe, y.tagName, u, n) : xe++;
				}
			} catch (q) {
				if (q instanceof Am) throw q;
				if (q instanceof gm) return i.fatalError("Error constructing the DOM: " + q.name + ": " + q.message, q);
				i.error("element parse error: " + q), xe = -1;
			}
			xe > g ? g = xe : c(Math.max(_, g) + 1);
		}
	}
	function Ic(e, r) {
		return r.lineNumber = e.lineNumber, r.columnNumber = e.columnNumber, r;
	}
	function _m(e, r, t, n, i, a, s) {
		function u(h, A, f) {
			if (va(t.attributeNames, h)) return a.fatalError("Attribute " + h + " redefined");
			if (!s && A.indexOf("<") >= 0) return a.fatalError("Unescaped '<' not allowed in attributes values");
			t.addValue(h, A.replace(/[\t\n\r]/g, " ").replace(ou, i), f);
		}
		for (var c, o, l = ++r, d = ci;;) {
			var p = e.charAt(l);
			if (d === ci && p === "<") throw new Error("unexpected < in tag name: " + e.slice(r, l));
			switch (p) {
				case "=":
					if (d === un) c = e.slice(r, l), d = _a;
					else if (d === fi) d = _a;
					else throw new Error("attribute equal must after attrName");
					break;
				case "'":
				case "\"":
					if (d === _a || d === un) if (d === un && (a.warning("attribute value must after \"=\""), c = e.slice(r, l)), r = l + 1, l = e.indexOf(p, r), l > 0) o = e.slice(r, l), u(c, o, r - 1), d = pi;
					else throw new Error("attribute value no end '" + p + "' match");
					else if (d == di) o = e.slice(r, l), u(c, o, r), a.warning("attribute \"" + c + "\" missed start quot(" + p + ")!!"), r = l + 1, d = pi;
					else throw new Error("attribute value must after \"=\"");
					break;
				case "/":
					switch (d) {
						case ci: t.setTagName(e.slice(r, l));
						case pi:
						case wa:
						case ws: d = ws, t.closed = !0;
						case di:
						case un: break;
						case fi:
							t.closed = !0;
							break;
						default: throw new Error("attribute invalid close char('/')");
					}
					break;
				case "": return a.error("unexpected end of input"), d == ci && t.setTagName(e.slice(r, l)), l;
				case ">":
					switch (d) {
						case ci: t.setTagName(e.slice(r, l));
						case pi:
						case wa:
						case ws: break;
						case di:
						case un: o = e.slice(r, l), o.slice(-1) === "/" && (t.closed = !0, o = o.slice(0, -1));
						case fi:
							d === fi && (o = c), d == di ? (a.warning("attribute \"" + o + "\" missed quot(\")!"), u(c, o, r)) : (s || a.warning("attribute \"" + o + "\" missed value!! \"" + o + "\" instead!!"), u(o, o, r));
							break;
						case _a: if (!s) return a.fatalError(`AttValue: ' or " expected`);
					}
					return l;
				case "": p = " ";
				default: if (p <= " ") switch (d) {
					case ci:
						t.setTagName(e.slice(r, l)), d = wa;
						break;
					case un:
						c = e.slice(r, l), d = fi;
						break;
					case di:
						var o = e.slice(r, l);
						a.warning("attribute \"" + o + "\" missed quot(\")!!"), u(c, o, r);
					case pi:
						d = wa;
						break;
				}
				else switch (d) {
					case fi:
						s || a.warning("attribute \"" + c + "\" missed value!! \"" + c + "\" instead2!!"), u(c, c, r), r = l, d = un;
						break;
					case pi: a.warning("attribute space is required\"" + c + "\"!!");
					case wa:
						d = un, r = l;
						break;
					case _a:
						d = di, r = l;
						break;
					case ws: throw new Error("elements closed character '/' and '>' must be connected to");
				}
			}
			l++;
		}
	}
	function kc(e, r, t) {
		for (var n = e.tagName, i = null, d = e.length; d--;) {
			var a = e[d], s = a.qName, u = a.value, p = s.indexOf(":");
			if (p > 0) var c = a.prefix = s.slice(0, p), o = s.slice(p + 1), l = c === "xmlns" && o;
			else o = s, c = null, l = s === "xmlns" && "";
			a.localName = o, l !== !1 && (i ?? (i = Object.create(null), t = Object.create(t)), t[l] = i[l] = u, a.uri = Cc.XMLNS, r.startPrefixMapping(l, u));
		}
		for (var d = e.length; d--;) a = e[d], a.prefix && (a.prefix === "xml" && (a.uri = Cc.XML), a.prefix !== "xmlns" && (a.uri = t[a.prefix]));
		var p = n.indexOf(":");
		p > 0 ? (c = e.prefix = n.slice(0, p), o = e.localName = n.slice(p + 1)) : (c = null, o = e.localName = n);
		var h = e.uri = t[c || ""];
		if (r.startElement(h, o, n, e), e.closed) {
			if (r.endElement(h, o, n), i) for (c in i) va(i, c) && r.endPrefixMapping(c);
		} else return e.currentNSMap = t, e.localNSMap = i, !0;
	}
	function wm(e, r, t, n, i) {
		var a = fm(t);
		if (a || pm(t)) {
			var s = new RegExp("</" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ">", "ig");
			s.lastIndex = r;
			var u = s.exec(e), c = u ? u.index : -1;
			if (c < 0) return r + 1;
			var o = e.substring(r + 1, c);
			return a && (o = o.replace(ou, n)), i.characters(o, 0, o.length), c;
		}
		return r + 1;
	}
	function vm(e, r) {
		for (var t in e) va(e, t) && (r[t] = e[t]);
	}
	function Tc(e, r) {
		var t = r;
		function n(l) {
			return l = l || 0, e.charAt(t + l);
		}
		function i(l) {
			l = l || 1, t += l;
		}
		function a() {
			for (var l = 0; t < e.length;) {
				var d = n();
				if (d !== " " && d !== `
` && d !== "	" && d !== "\r") return l;
				l++, i();
			}
			return -1;
		}
		function s() {
			return e.substring(t);
		}
		function u(l) {
			return e.substring(t, t + l.length) === l;
		}
		function c(l) {
			return e.substring(t, t + l.length).toUpperCase() === l.toUpperCase();
		}
		function o(l) {
			var p = Ke.reg("^", l).exec(s());
			return p ? (i(p[0].length), p[0]) : null;
		}
		return {
			char: n,
			getIndex: function() {
				return t;
			},
			getMatch: o,
			getSource: function() {
				return e;
			},
			skip: i,
			skipBlanks: a,
			substringFromIndex: s,
			substringStartsWith: u,
			substringStartsWithCaseInsensitive: c
		};
	}
	function bm(e, r) {
		function t(u, c) {
			var o = Ke.PI.exec(u.substringFromIndex());
			return o ? o[1].toLowerCase() === "xml" ? c.fatalError("xml declaration is only allowed at the start of the document, but found at position " + u.getIndex()) : (u.skip(o[0].length), o[0]) : c.fatalError("processing instruction is not well-formed at position " + u.getIndex());
		}
		var n = e.getSource();
		if (e.char() === "[") {
			e.skip(1);
			for (var i = e.getIndex(); e.getIndex() < n.length;) {
				if (e.skipBlanks(), e.char() === "]") {
					var a = n.substring(i, e.getIndex());
					return e.skip(1), a;
				}
				var s = null;
				if (e.char() === "<" && e.char(1) === "!") switch (e.char(2)) {
					case "E":
						e.char(3) === "L" ? s = e.getMatch(Ke.elementdecl) : e.char(3) === "N" && (s = e.getMatch(Ke.EntityDecl));
						break;
					case "A":
						s = e.getMatch(Ke.AttlistDecl);
						break;
					case "N":
						s = e.getMatch(Ke.NotationDecl);
						break;
					case "-":
						s = e.getMatch(Ke.Comment);
						break;
				}
				else if (e.char() === "<" && e.char(1) === "?") s = t(e, r);
				else if (e.char() === "%") s = e.getMatch(Ke.PEReference);
				else return r.fatalError("Error detected in Markup declaration");
				if (!s) return r.fatalError("Error in internal subset at position " + e.getIndex());
			}
			return r.fatalError("doctype internal subset is not well-formed, missing ]");
		}
	}
	function Bc(e, r, t, n, i) {
		var a = Tc(e, r);
		switch (i ? a.char(2).toUpperCase() : a.char(2)) {
			case "-":
				var s = a.getMatch(Ke.Comment);
				return s ? (t.comment(s, Ke.COMMENT_START.length, s.length - Ke.COMMENT_START.length - Ke.COMMENT_END.length), a.getIndex()) : n.fatalError("comment is not well-formed at position " + a.getIndex());
			case "[":
				var u = a.getMatch(Ke.CDSect);
				return u ? !i && !t.currentElement ? n.fatalError("CDATA outside of element") : (t.startCDATA(), t.characters(u, Ke.CDATA_START.length, u.length - Ke.CDATA_START.length - Ke.CDATA_END.length), t.endCDATA(), a.getIndex()) : n.fatalError("Invalid CDATA starting at position " + r);
			case "D":
				if (t.doc && t.doc.documentElement) return n.fatalError("Doctype not allowed inside or after documentElement at position " + a.getIndex());
				if (i ? !a.substringStartsWithCaseInsensitive(Ke.DOCTYPE_DECL_START) : !a.substringStartsWith(Ke.DOCTYPE_DECL_START)) return n.fatalError("Expected " + Ke.DOCTYPE_DECL_START + " at position " + a.getIndex());
				if (a.skip(Ke.DOCTYPE_DECL_START.length), a.skipBlanks() < 1) return n.fatalError("Expected whitespace after " + Ke.DOCTYPE_DECL_START + " at position " + a.getIndex());
				var c = {
					name: void 0,
					publicId: void 0,
					systemId: void 0,
					internalSubset: void 0
				};
				if (c.name = a.getMatch(Ke.Name), !c.name) return n.fatalError("doctype name missing or contains unexpected characters at position " + a.getIndex());
				if (i && c.name.toLowerCase() !== "html" && n.warning("Unexpected DOCTYPE in HTML document at position " + a.getIndex()), a.skipBlanks(), a.substringStartsWith(Ke.PUBLIC) || a.substringStartsWith(Ke.SYSTEM)) {
					var o = Ke.ExternalID_match.exec(a.substringFromIndex());
					if (!o) return n.fatalError("doctype external id is not well-formed at position " + a.getIndex());
					o.groups.SystemLiteralOnly !== void 0 ? c.systemId = o.groups.SystemLiteralOnly : (c.systemId = o.groups.SystemLiteral, c.publicId = o.groups.PubidLiteral), a.skip(o[0].length);
				} else if (i && a.substringStartsWithCaseInsensitive(Ke.SYSTEM)) {
					if (a.skip(Ke.SYSTEM.length), a.skipBlanks() < 1) return n.fatalError("Expected whitespace after " + Ke.SYSTEM + " at position " + a.getIndex());
					if (c.systemId = a.getMatch(Ke.ABOUT_LEGACY_COMPAT_SystemLiteral), !c.systemId) return n.fatalError("Expected " + Ke.ABOUT_LEGACY_COMPAT + " in single or double quotes after " + Ke.SYSTEM + " at position " + a.getIndex());
				}
				return i && c.systemId && !Ke.ABOUT_LEGACY_COMPAT_SystemLiteral.test(c.systemId) && n.warning("Unexpected doctype.systemId in HTML document at position " + a.getIndex()), i || (a.skipBlanks(), c.internalSubset = bm(a, n)), a.skipBlanks(), a.char() !== ">" ? n.fatalError("doctype not terminated with > at position " + a.getIndex()) : (a.skip(1), t.startDTD(c.name, c.publicId, c.systemId, c.internalSubset), t.endDTD(), a.getIndex());
			default: return n.fatalError("Not well-formed XML starting with \"<!\" at position " + r);
		}
	}
	function ym(e, r, t, n) {
		var i = e.substring(r).match(Ke.PI);
		if (!i) return n.fatalError("Invalid processing instruction starting at position " + r);
		if (i[1].toLowerCase() === "xml") {
			if (r > 0) return n.fatalError("processing instruction at position " + r + " is an xml declaration which is only at the start of the document");
			if (!Ke.XMLDecl.test(e.substring(r))) return n.fatalError("xml declaration is not well-formed");
		}
		return t.processingInstruction(i[1], i[2]), r + i[0].length;
	}
	function Nc() {
		this.attributeNames = Object.create(null);
	}
	Nc.prototype = {
		setTagName: function(e) {
			if (!Ke.QName_exact.test(e)) throw new Error("invalid tagName:" + e);
			this.tagName = e;
		},
		addValue: function(e, r, t) {
			if (!Ke.QName_exact.test(e)) throw new Error("invalid attribute:" + e);
			this.attributeNames[e] = this.length, this[this.length++] = {
				qName: e,
				value: r,
				offset: t
			};
		},
		length: 0,
		getLocalName: function(e) {
			return this[e].localName;
		},
		getLocator: function(e) {
			return this[e].locator;
		},
		getQName: function(e) {
			return this[e].qName;
		},
		getURI: function(e) {
			return this[e].uri;
		},
		getValue: function(e) {
			return this[e].value;
		}
	};
	vs.XMLReader = Sc;
	vs.parseUtils = Tc;
	vs.parseDoctypeCommentOrCData = Bc;
});
var zc = _r((mi) => {
	"use strict";
	var Bn = Sn(), Em = su(), xm = ua(), Rc = xc(), Cm = Fc(), Im = Em.DOMImplementation, km = Bn.hasDefaultHTMLNamespace, Dm = Bn.isHTMLMimeType, Sm = Bn.isValidMimeType, Pc = Bn.MIME_TYPE, uu = Bn.NAMESPACE, Oc = xm.ParseError, Tm = Cm.XMLReader;
	function Mc(e) {
		return e.replace(/\r[\n\u0085]/g, `
`).replace(/[\r\u0085\u2028\u2029]/g, `
`);
	}
	function Uc(e) {
		if (e = e || {}, e.locator === void 0 && (e.locator = !0), this.assign = e.assign || Bn.assign, this.domHandler = e.domHandler || ys, this.onError = e.onError || e.errorHandler, e.errorHandler && typeof e.errorHandler != "function") throw new TypeError("errorHandler object is no longer supported, switch to onError!");
		e.errorHandler && e.errorHandler("warning", "The `errorHandler` option has been deprecated, use `onError` instead!", this), this.normalizeLineEndings = e.normalizeLineEndings || Mc, this.locator = !!e.locator, this.xmlns = this.assign(Object.create(null), e.xmlns);
	}
	Uc.prototype.parseFromString = function(e, r) {
		if (!Sm(r)) throw new TypeError("DOMParser.parseFromString: the provided mimeType \"" + r + "\" is not valid.");
		var t = this.assign(Object.create(null), this.xmlns), n = Rc.XML_ENTITIES, i = t[""] || null;
		km(r) ? (n = Rc.HTML_ENTITIES, i = uu.HTML) : r === Pc.XML_SVG_IMAGE && (i = uu.SVG), t[""] = i, t.xml = t.xml || uu.XML;
		var a = new this.domHandler({
			mimeType: r,
			defaultNamespace: i,
			onError: this.onError
		}), s = this.locator ? {} : void 0;
		this.locator && a.setDocumentLocator(s);
		var u = new Tm();
		u.errorHandler = a, u.domBuilder = a;
		return !Bn.isHTMLMimeType(r) && typeof e != "string" && u.errorHandler.fatalError("source is not a string"), u.parse(this.normalizeLineEndings(String(e)), t, n), a.doc.documentElement || u.errorHandler.fatalError("missing root element"), a.doc;
	};
	function ys(e) {
		var r = e || {};
		this.mimeType = r.mimeType || Pc.XML_APPLICATION, this.defaultNamespace = r.defaultNamespace || null, this.cdata = !1, this.currentElement = void 0, this.doc = void 0, this.locator = void 0, this.onError = r.onError;
	}
	function gi(e, r) {
		r.lineNumber = e.lineNumber, r.columnNumber = e.columnNumber;
	}
	ys.prototype = {
		startDocument: function() {
			var e = new Im();
			this.doc = Dm(this.mimeType) ? e.createHTMLDocument(!1) : e.createDocument(this.defaultNamespace, "");
		},
		startElement: function(e, r, t, n) {
			var i = this.doc, a = i.createElementNS(e, t || r), s = n.length;
			bs(this, a), this.currentElement = a, this.locator && gi(this.locator, a);
			for (var u = 0; u < s; u++) {
				var e = n.getURI(u), c = n.getValue(u), t = n.getQName(u), o = i.createAttributeNS(e, t);
				this.locator && gi(n.getLocator(u), o), o.value = o.nodeValue = c, a.setAttributeNode(o);
			}
		},
		endElement: function(e, r, t) {
			this.currentElement = this.currentElement.parentNode;
		},
		startPrefixMapping: function(e, r) {},
		endPrefixMapping: function(e) {},
		processingInstruction: function(e, r) {
			var t = this.doc.createProcessingInstruction(e, r);
			this.locator && gi(this.locator, t), bs(this, t);
		},
		ignorableWhitespace: function(e, r, t) {},
		characters: function(e, r, t) {
			if (e = Lc.apply(this, arguments), e) {
				if (this.cdata) var n = this.doc.createCDATASection(e);
				else var n = this.doc.createTextNode(e);
				this.currentElement ? this.currentElement.appendChild(n) : /^\s*$/.test(e) && this.doc.appendChild(n), this.locator && gi(this.locator, n);
			}
		},
		skippedEntity: function(e) {},
		endDocument: function() {
			this.doc.normalize();
		},
		setDocumentLocator: function(e) {
			e && (e.lineNumber = 0), this.locator = e;
		},
		comment: function(e, r, t) {
			e = Lc.apply(this, arguments);
			var n = this.doc.createComment(e);
			this.locator && gi(this.locator, n), bs(this, n);
		},
		startCDATA: function() {
			this.cdata = !0;
		},
		endCDATA: function() {
			this.cdata = !1;
		},
		startDTD: function(e, r, t, n) {
			var i = this.doc.implementation;
			if (i && i.createDocumentType) {
				var a = i.createDocumentType(e, r, t, n);
				this.locator && gi(this.locator, a), bs(this, a), this.doc.doctype = a;
			}
		},
		reportError: function(e, r) {
			if (typeof this.onError == "function") try {
				this.onError(e, r, this);
			} catch (t) {
				throw new Oc("Reporting " + e + " \"" + r + "\" caused " + t, this.locator);
			}
			else console.error("[xmldom " + e + "]	" + r, Bm(this.locator));
		},
		warning: function(e) {
			this.reportError("warning", e);
		},
		error: function(e) {
			this.reportError("error", e);
		},
		fatalError: function(e, r) {
			throw this.reportError("fatalError", e), new Oc(e, this.locator, r);
		}
	};
	function Bm(e) {
		if (e) return `
@#[line:` + e.lineNumber + ",col:" + e.columnNumber + "]";
	}
	function Lc(e, r, t) {
		return typeof e == "string" ? e.substr(r, t) : e.length >= r + t || r ? new java.lang.String(e, r, t) + "" : e;
	}
	"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(e) {
		ys.prototype[e] = function() {
			return null;
		};
	});
	function bs(e, r) {
		e.currentElement ? e.currentElement.appendChild(r) : e.doc.appendChild(r);
	}
	function Nm(e) {
		if (e === "error") throw "onErrorStopParsing";
	}
	function Fm() {
		throw "onWarningStopParsing";
	}
	mi.__DOMHandler = ys;
	mi.DOMParser = Uc;
	mi.normalizeLineEndings = Mc;
	mi.onErrorStopParsing = Nm;
	mi.onWarningStopParsing = Fm;
});
var Hc = _r((rt) => {
	"use strict";
	var _i = Sn();
	rt.assign = _i.assign;
	rt.hasDefaultHTMLNamespace = _i.hasDefaultHTMLNamespace;
	rt.isHTMLMimeType = _i.isHTMLMimeType;
	rt.isValidMimeType = _i.isValidMimeType;
	rt.MIME_TYPE = _i.MIME_TYPE;
	rt.NAMESPACE = _i.NAMESPACE;
	var Es = ua();
	rt.DOMException = Es.DOMException;
	rt.DOMExceptionName = Es.DOMExceptionName;
	rt.ExceptionCode = Es.ExceptionCode;
	rt.ParseError = Es.ParseError;
	var St = su();
	rt.Attr = St.Attr;
	rt.CDATASection = St.CDATASection;
	rt.CharacterData = St.CharacterData;
	rt.Comment = St.Comment;
	rt.Document = St.Document;
	rt.DocumentFragment = St.DocumentFragment;
	rt.DocumentType = St.DocumentType;
	rt.DOMImplementation = St.DOMImplementation;
	rt.Element = St.Element;
	rt.Entity = St.Entity;
	rt.EntityReference = St.EntityReference;
	rt.LiveNodeList = St.LiveNodeList;
	rt.NamedNodeMap = St.NamedNodeMap;
	rt.Node = St.Node;
	rt.NodeList = St.NodeList;
	rt.Notation = St.Notation;
	rt.ProcessingInstruction = St.ProcessingInstruction;
	rt.Text = St.Text;
	rt.XMLSerializer = St.XMLSerializer;
	var xs = zc();
	rt.DOMParser = xs.DOMParser;
	rt.normalizeLineEndings = xs.normalizeLineEndings;
	rt.onErrorStopParsing = xs.onErrorStopParsing;
	rt.onWarningStopParsing = xs.onWarningStopParsing;
});
var Cp = _r(() => {});
var Lp = _r((sx, rl) => {
	var mn = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	function Ip(e) {
		for (var r = "", t = 0, n = 0, i = 0, a = 0, s = 0, u = 0, c = 0, o = 0; o < e.length;) t = e.charCodeAt(o++), a = t >> 2, n = e.charCodeAt(o++), s = (t & 3) << 4 | n >> 4, i = e.charCodeAt(o++), u = (n & 15) << 2 | i >> 6, c = i & 63, isNaN(n) ? u = c = 64 : isNaN(i) && (c = 64), r += mn.charAt(a) + mn.charAt(s) + mn.charAt(u) + mn.charAt(c);
		return r;
	}
	function kp(e) {
		var r = "", t = 0, n = 0, i = 0, a = 0, s = 0, u = 0, c = 0;
		e = e.replace(/[^\w\+\/\=]/g, "");
		for (var o = 0; o < e.length;) a = mn.indexOf(e.charAt(o++)), s = mn.indexOf(e.charAt(o++)), t = a << 2 | s >> 4, r += String.fromCharCode(t), u = mn.indexOf(e.charAt(o++)), n = (s & 15) << 4 | u >> 2, u !== 64 && (r += String.fromCharCode(n)), c = mn.indexOf(e.charAt(o++)), i = (u & 3) << 6 | c, c !== 64 && (r += String.fromCharCode(i));
		return r;
	}
	var Ar = (function() {
		return typeof Buffer != "undefined" && typeof process != "undefined" && typeof process.versions != "undefined" && !!process.versions.node;
	})(), nl = (function() {
		if (typeof Buffer != "undefined") {
			var e = !Buffer.from;
			if (!e) try {
				Buffer.from("foo", "utf8");
			} catch (r) {
				e = !0;
			}
			return e ? function(r, t) {
				return t ? new Buffer(r, t) : new Buffer(r);
			} : Buffer.from.bind(Buffer);
		}
		return function() {};
	})();
	function Bp(e) {
		if (Ar) {
			if (Buffer.alloc) return Buffer.alloc(e);
			var r = new Buffer(e);
			return r.fill(0), r;
		}
		return typeof Uint8Array != "undefined" ? new Uint8Array(e) : new Array(e);
	}
	function Dp(e) {
		return Ar ? Buffer.allocUnsafe ? Buffer.allocUnsafe(e) : new Buffer(e) : typeof Uint8Array != "undefined" ? new Uint8Array(e) : new Array(e);
	}
	var Ti = function(r) {
		return Ar ? nl(r, "binary") : r.split("").map(function(t) {
			return t.charCodeAt(0) & 255;
		});
	}, Ga = /\u0000/g, qs = /[\u0001-\u0006]/g, $s = function(e) {
		for (var r = [], t = 0; t < e[0].length; ++t) r.push.apply(r, e[0][t]);
		return r;
	}, ey = $s, il = function(e, r, t) {
		for (var n = [], i = r; i < t; i += 2) n.push(String.fromCharCode(Fp(e, i)));
		return n.join("").replace(Ga, "");
	}, ty = il, Js = function(e, r, t) {
		for (var n = [], i = r; i < r + t; ++i) n.push(("0" + e[i].toString(16)).slice(-2));
		return n.join("");
	}, ry = Js, Np = function(e) {
		if (Array.isArray(e[0])) return [].concat.apply([], e);
		var r = 0, t = 0;
		for (t = 0; t < e.length; ++t) r += e[t].length;
		var n = new Uint8Array(r);
		for (t = 0, r = 0; t < e.length; r += e[t].length, ++t) n.set(e[t], r);
		return n;
	}, Bi = Np;
	Ar && (il = function(e, r, t) {
		return Buffer.isBuffer(e) ? e.toString("utf16le", r, t).replace(Ga, "") : ty(e, r, t);
	}, Js = function(e, r, t) {
		return Buffer.isBuffer(e) ? e.toString("hex", r, r + t) : ry(e, r, t);
	}, $s = function(e) {
		return e[0].length > 0 && Buffer.isBuffer(e[0][0]) ? Buffer.concat(e[0]) : ey(e);
	}, Ti = function(e) {
		return nl(e, "binary");
	}, Bi = function(e) {
		return Buffer.isBuffer(e[0]) ? Buffer.concat(e) : Np(e);
	});
	var ny = function(e, r) {
		return e[r];
	}, Fp = function(e, r) {
		return e[r + 1] * 256 + e[r];
	}, iy = function(e, r) {
		var t = e[r + 1] * 256 + e[r];
		return t < 32768 ? t : (65535 - t + 1) * -1;
	}, Sp = function(e, r) {
		return e[r + 3] * (1 << 24) + (e[r + 2] << 16) + (e[r + 1] << 8) + e[r];
	}, Ni = function(e, r) {
		return (e[r + 3] << 24) + (e[r + 2] << 16) + (e[r + 1] << 8) + e[r];
	};
	function Rp(e, r) {
		var t, n, i = 0;
		switch (e) {
			case 1:
				t = ny(this, this.l);
				break;
			case 2:
				t = (r !== "i" ? Fp : iy)(this, this.l);
				break;
			case 4:
				t = Ni(this, this.l);
				break;
			case 16: i = 2, n = Js(this, this.l, e);
		}
		return this.l += e, i === 0 ? t : n;
	}
	var ay = function(e, r, t) {
		e[t] = r & 255, e[t + 1] = r >>> 8 & 255, e[t + 2] = r >>> 16 & 255, e[t + 3] = r >>> 24 & 255;
	}, sy = function(e, r, t) {
		e[t] = r & 255, e[t + 1] = r >> 8 & 255, e[t + 2] = r >> 16 & 255, e[t + 3] = r >> 24 & 255;
	};
	function oy(e, r, t) {
		var n = 0, i = 0;
		switch (t) {
			case "hex":
				for (; i < e; ++i) this[this.l++] = parseInt(r.slice(2 * i, 2 * i + 2), 16) || 0;
				return this;
			case "utf16le":
				var a = this.l + e;
				for (i = 0; i < Math.min(r.length, e); ++i) {
					var s = r.charCodeAt(i);
					this[this.l++] = s & 255, this[this.l++] = s >> 8;
				}
				for (; this.l < a;) this[this.l++] = 0;
				return this;
		}
		switch (e) {
			case 1:
				n = 1, this[this.l] = r & 255;
				break;
			case 2:
				n = 2, this[this.l] = r & 255, r >>>= 8, this[this.l + 1] = r & 255;
				break;
			case 4:
				n = 4, ay(this, r, this.l);
				break;
			case -4: n = 4, sy(this, r, this.l);
		}
		return this.l += n, this;
	}
	function Op(e, r) {
		var t = Js(this, this.l, e.length >> 1);
		if (t !== e) throw new Error(r + "Expected " + e + " saw " + t);
		this.l += e.length >> 1;
	}
	function gn(e, r) {
		e.l = r, e.read_shift = Rp, e.chk = Op, e.write_shift = oy;
	}
	function Lr(e) {
		var r = Bp(e);
		return gn(r, 0), r;
	}
	var Tp = (function() {
		var e = {};
		e.version = "1.2.1";
		function r() {
			for (var x = 0, G = new Array(256), O = 0; O != 256; ++O) x = O, x = x & 1 ? -306674912 ^ x >>> 1 : x >>> 1, x = x & 1 ? -306674912 ^ x >>> 1 : x >>> 1, x = x & 1 ? -306674912 ^ x >>> 1 : x >>> 1, x = x & 1 ? -306674912 ^ x >>> 1 : x >>> 1, x = x & 1 ? -306674912 ^ x >>> 1 : x >>> 1, x = x & 1 ? -306674912 ^ x >>> 1 : x >>> 1, x = x & 1 ? -306674912 ^ x >>> 1 : x >>> 1, x = x & 1 ? -306674912 ^ x >>> 1 : x >>> 1, G[O] = x;
			return typeof Int32Array != "undefined" ? new Int32Array(G) : G;
		}
		var t = r();
		function n(x) {
			var G = 0, O = 0, k = 0, H = typeof Int32Array != "undefined" ? /* @__PURE__ */ new Int32Array(4096) : new Array(4096);
			for (k = 0; k != 256; ++k) H[k] = x[k];
			for (k = 0; k != 256; ++k) for (O = x[k], G = 256 + k; G < 4096; G += 256) O = H[G] = O >>> 8 ^ x[O & 255];
			var m = [];
			for (k = 1; k != 16; ++k) m[k - 1] = typeof Int32Array != "undefined" ? H.subarray(k * 256, k * 256 + 256) : H.slice(k * 256, k * 256 + 256);
			return m;
		}
		var i = n(t), a = i[0], s = i[1], u = i[2], c = i[3], o = i[4], l = i[5], d = i[6], p = i[7], h = i[8], A = i[9], f = i[10], g = i[11], _ = i[12], v = i[13], b = i[14];
		function C(x, G) {
			for (var O = G ^ -1, k = 0, H = x.length; k < H;) O = O >>> 8 ^ t[(O ^ x.charCodeAt(k++)) & 255];
			return ~O;
		}
		function T(x, G) {
			for (var O = G ^ -1, k = x.length - 15, H = 0; H < k;) O = b[x[H++] ^ O & 255] ^ v[x[H++] ^ O >> 8 & 255] ^ _[x[H++] ^ O >> 16 & 255] ^ g[x[H++] ^ O >>> 24] ^ f[x[H++]] ^ A[x[H++]] ^ h[x[H++]] ^ p[x[H++]] ^ d[x[H++]] ^ l[x[H++]] ^ o[x[H++]] ^ c[x[H++]] ^ u[x[H++]] ^ s[x[H++]] ^ a[x[H++]] ^ t[x[H++]];
			for (k += 15; H < k;) O = O >>> 8 ^ t[(O ^ x[H++]) & 255];
			return ~O;
		}
		function ee(x, G) {
			for (var O = G ^ -1, k = 0, H = x.length, m = 0, V = 0; k < H;) m = x.charCodeAt(k++), m < 128 ? O = O >>> 8 ^ t[(O ^ m) & 255] : m < 2048 ? (O = O >>> 8 ^ t[(O ^ (192 | m >> 6 & 31)) & 255], O = O >>> 8 ^ t[(O ^ (128 | m & 63)) & 255]) : m >= 55296 && m < 57344 ? (m = (m & 1023) + 64, V = x.charCodeAt(k++) & 1023, O = O >>> 8 ^ t[(O ^ (240 | m >> 8 & 7)) & 255], O = O >>> 8 ^ t[(O ^ (128 | m >> 2 & 63)) & 255], O = O >>> 8 ^ t[(O ^ (128 | V >> 6 & 15 | (m & 3) << 4)) & 255], O = O >>> 8 ^ t[(O ^ (128 | V & 63)) & 255]) : (O = O >>> 8 ^ t[(O ^ (224 | m >> 12 & 15)) & 255], O = O >>> 8 ^ t[(O ^ (128 | m >> 6 & 63)) & 255], O = O >>> 8 ^ t[(O ^ (128 | m & 63)) & 255]);
			return ~O;
		}
		return e.table = t, e.bstr = C, e.buf = T, e.str = ee, e;
	})(), Fi = (function() {
		var r = {};
		r.version = "1.2.2";
		function t(B, Q) {
			for (var L = B.split("/"), M = Q.split("/"), Y = 0, $ = 0, ue = Math.min(L.length, M.length); Y < ue; ++Y) {
				if ($ = L[Y].length - M[Y].length) return $;
				if (L[Y] != M[Y]) return L[Y] < M[Y] ? -1 : 1;
			}
			return L.length - M.length;
		}
		function n(B) {
			if (B.charAt(B.length - 1) == "/") return B.slice(0, -1).indexOf("/") === -1 ? B : n(B.slice(0, -1));
			var Q = B.lastIndexOf("/");
			return Q === -1 ? B : B.slice(0, Q + 1);
		}
		function i(B) {
			if (B.charAt(B.length - 1) == "/") return i(B.slice(0, -1));
			var Q = B.lastIndexOf("/");
			return Q === -1 ? B : B.slice(Q + 1);
		}
		function a(B, Q) {
			typeof Q == "string" && (Q = new Date(Q));
			var L = Q.getHours();
			L = L << 6 | Q.getMinutes(), L = L << 5 | Q.getSeconds() >>> 1, B.write_shift(2, L);
			var M = Q.getFullYear() - 1980;
			M = M << 4 | Q.getMonth() + 1, M = M << 5 | Q.getDate(), B.write_shift(2, M);
		}
		function s(B) {
			var Q = B.read_shift(2) & 65535, L = B.read_shift(2) & 65535, M = /* @__PURE__ */ new Date(), Y = L & 31;
			L >>>= 5;
			var $ = L & 15;
			L >>>= 4, M.setMilliseconds(0), M.setFullYear(L + 1980), M.setMonth($ - 1), M.setDate(Y);
			var ue = Q & 31;
			Q >>>= 5;
			var we = Q & 63;
			return Q >>>= 6, M.setHours(Q), M.setMinutes(we), M.setSeconds(ue << 1), M;
		}
		function u(B) {
			gn(B, 0);
			for (var Q = {}, L = 0; B.l <= B.length - 4;) {
				var M = B.read_shift(2), Y = B.read_shift(2), $ = B.l + Y, ue = {};
				M === 21589 && (L = B.read_shift(1), L & 1 && (ue.mtime = B.read_shift(4)), Y > 5 && (L & 2 && (ue.atime = B.read_shift(4)), L & 4 && (ue.ctime = B.read_shift(4))), ue.mtime && (ue.mt = /* @__PURE__ */ new Date(ue.mtime * 1e3))), B.l = $, Q[M] = ue;
			}
			return Q;
		}
		var c;
		function o() {
			return c || (c = Cp());
		}
		function l(B, Q) {
			if (B[0] == 80 && B[1] == 75) return Gt(B, Q);
			if ((B[0] | 32) == 109 && (B[1] | 32) == 105) return no(B, Q);
			if (B.length < 512) throw new Error("CFB file size " + B.length + " < 512");
			var L = 3, M = 512, Y = 0, $ = 0, ue = 0, we = 0, le = 0, he = [], ce = B.slice(0, 512);
			gn(ce, 0);
			var Ce = d(ce);
			switch (L = Ce[0], L) {
				case 3:
					M = 512;
					break;
				case 4:
					M = 4096;
					break;
				case 0: if (Ce[1] == 0) return Gt(B, Q);
				default: throw new Error("Major Version: Expected 3 or 4 saw " + L);
			}
			M !== 512 && (ce = B.slice(0, M), gn(ce, 28));
			var ke = B.slice(0, M);
			p(ce, L);
			var Pe = ce.read_shift(4, "i");
			if (L === 3 && Pe !== 0) throw new Error("# Directory Sectors: Expected 0 saw " + Pe);
			ce.l += 4, ue = ce.read_shift(4, "i"), ce.l += 4, ce.chk("00100000", "Mini Stream Cutoff Size: "), we = ce.read_shift(4, "i"), Y = ce.read_shift(4, "i"), le = ce.read_shift(4, "i"), $ = ce.read_shift(4, "i");
			for (var Se = -1, Be = 0; Be < 109 && (Se = ce.read_shift(4, "i"), !(Se < 0)); ++Be) he[Be] = Se;
			var Ze = h(B, M);
			g(le, $, Ze, M, he);
			var ut = v(Ze, ue, he, M);
			ut[ue].name = "!Directory", Y > 0 && we !== V && (ut[we].name = "!MiniFAT"), ut[he[0]].name = "!FAT", ut.fat_addrs = he, ut.ssz = M;
			var xt = {}, wt = [], Qt = [], yr = [];
			b(ue, ut, Ze, wt, Y, xt, Qt, we), A(Qt, yr, wt), wt.shift();
			var _n = {
				FileIndex: Qt,
				FullPaths: yr
			};
			return Q && Q.raw && (_n.raw = {
				header: ke,
				sectors: Ze
			}), _n;
		}
		function d(B) {
			if (B[B.l] == 80 && B[B.l + 1] == 75) return [0, 0];
			B.chk(y, "Header Signature: "), B.l += 16;
			var Q = B.read_shift(2, "u");
			return [B.read_shift(2, "u"), Q];
		}
		function p(B, Q) {
			var L = 9;
			switch (B.l += 2, L = B.read_shift(2)) {
				case 9:
					if (Q != 3) throw new Error("Sector Shift: Expected 9 saw " + L);
					break;
				case 12:
					if (Q != 4) throw new Error("Sector Shift: Expected 12 saw " + L);
					break;
				default: throw new Error("Sector Shift: Expected 9 or 12 saw " + L);
			}
			B.chk("0600", "Mini Sector Shift: "), B.chk("000000000000", "Reserved: ");
		}
		function h(B, Q) {
			for (var L = Math.ceil(B.length / Q) - 1, M = [], Y = 1; Y < L; ++Y) M[Y - 1] = B.slice(Y * Q, (Y + 1) * Q);
			return M[L - 1] = B.slice(L * Q), M;
		}
		function A(B, Q, L) {
			for (var M = 0, Y = 0, $ = 0, ue = 0, we = 0, le = L.length, he = [], ce = []; M < le; ++M) he[M] = ce[M] = M, Q[M] = L[M];
			for (; we < ce.length; ++we) M = ce[we], Y = B[M].L, $ = B[M].R, ue = B[M].C, he[M] === M && (Y !== -1 && he[Y] !== Y && (he[M] = he[Y]), $ !== -1 && he[$] !== $ && (he[M] = he[$])), ue !== -1 && (he[ue] = M), Y !== -1 && M != he[M] && (he[Y] = he[M], ce.lastIndexOf(Y) < we && ce.push(Y)), $ !== -1 && M != he[M] && (he[$] = he[M], ce.lastIndexOf($) < we && ce.push($));
			for (M = 1; M < le; ++M) he[M] === M && ($ !== -1 && he[$] !== $ ? he[M] = he[$] : Y !== -1 && he[Y] !== Y && (he[M] = he[Y]));
			for (M = 1; M < le; ++M) if (B[M].type !== 0) {
				if (we = M, we != he[we]) do
					we = he[we], Q[M] = Q[we] + "/" + Q[M];
				while (we !== 0 && he[we] !== -1 && we != he[we]);
				he[M] = -1;
			}
			for (Q[0] += "/", M = 1; M < le; ++M) B[M].type !== 2 && (Q[M] += "/");
		}
		function f(B, Q, L) {
			for (var M = B.start, Y = B.size, $ = [], ue = M; L && Y > 0 && ue >= 0;) $.push(Q.slice(ue * m, ue * m + m)), Y -= m, ue = Ni(L, ue * 4);
			return $.length === 0 ? Lr(0) : Bi($).slice(0, B.size);
		}
		function g(B, Q, L, M, Y) {
			var $ = V;
			if (B === V) {
				if (Q !== 0) throw new Error("DIFAT chain shorter than expected");
			} else if (B !== -1) {
				var ue = L[B], we = (M >>> 2) - 1;
				if (!ue) return;
				for (var le = 0; le < we && ($ = Ni(ue, le * 4)) !== V; ++le) Y.push($);
				Q >= 1 && g(Ni(ue, M - 4), Q - 1, L, M, Y);
			}
		}
		function _(B, Q, L, M, Y) {
			var $ = [], ue = [];
			Y || (Y = []);
			var we = M - 1, le = 0, he = 0;
			for (le = Q; le >= 0;) {
				Y[le] = !0, $[$.length] = le, ue.push(B[le]);
				var ce = L[Math.floor(le * 4 / M)];
				if (he = le * 4 & we, M < 4 + he) throw new Error("FAT boundary crossed: " + le + " 4 " + M);
				if (!B[ce]) break;
				le = Ni(B[ce], he);
			}
			return {
				nodes: $,
				data: $s([ue])
			};
		}
		function v(B, Q, L, M) {
			var Y = B.length, $ = [], ue = [], we = [], le = [], he = M - 1, ce = 0, Ce = 0, ke = 0, Pe = 0;
			for (ce = 0; ce < Y; ++ce) if (we = [], ke = ce + Q, ke >= Y && (ke -= Y), !ue[ke]) {
				le = [];
				var Se = [];
				for (Ce = ke; Ce >= 0;) {
					Se[Ce] = !0, ue[Ce] = !0, we[we.length] = Ce, le.push(B[Ce]);
					var Be = L[Math.floor(Ce * 4 / M)];
					if (Pe = Ce * 4 & he, M < 4 + Pe) throw new Error("FAT boundary crossed: " + Ce + " 4 " + M);
					if (!B[Be] || (Ce = Ni(B[Be], Pe), Se[Ce])) break;
				}
				$[ke] = {
					nodes: we,
					data: $s([le])
				};
			}
			return $;
		}
		function b(B, Q, L, M, Y, $, ue, we) {
			for (var le = 0, he = M.length ? 2 : 0, ce = Q[B].data, Ce = 0, ke = 0, Pe; Ce < ce.length; Ce += 128) {
				var Se = ce.slice(Ce, Ce + 128);
				gn(Se, 64), ke = Se.read_shift(2), Pe = il(Se, 0, ke - he), M.push(Pe);
				var Be = {
					name: Pe,
					type: Se.read_shift(1),
					color: Se.read_shift(1),
					L: Se.read_shift(4, "i"),
					R: Se.read_shift(4, "i"),
					C: Se.read_shift(4, "i"),
					clsid: Se.read_shift(16),
					state: Se.read_shift(4, "i"),
					start: 0,
					size: 0
				};
				Se.read_shift(2) + Se.read_shift(2) + Se.read_shift(2) + Se.read_shift(2) !== 0 && (Be.ct = C(Se, Se.l - 8));
				Se.read_shift(2) + Se.read_shift(2) + Se.read_shift(2) + Se.read_shift(2) !== 0 && (Be.mt = C(Se, Se.l - 8)), Be.start = Se.read_shift(4, "i"), Be.size = Se.read_shift(4, "i"), Be.size < 0 && Be.start < 0 && (Be.size = Be.type = 0, Be.start = V, Be.name = ""), Be.type === 5 ? (le = Be.start, Y > 0 && le !== V && (Q[le].name = "!StreamData")) : Be.size >= 4096 ? (Be.storage = "fat", Q[Be.start] === void 0 && (Q[Be.start] = _(L, Be.start, Q.fat_addrs, Q.ssz)), Q[Be.start].name = Be.name, Be.content = Q[Be.start].data.slice(0, Be.size)) : (Be.storage = "minifat", Be.size < 0 ? Be.size = 0 : le !== V && Be.start !== V && Q[le] && (Be.content = f(Be, Q[le].data, (Q[we] || {}).data))), Be.content && gn(Be.content, 0), $[Pe] = Be, ue.push(Be);
			}
		}
		function C(B, Q) {
			return /* @__PURE__ */ new Date((Sp(B, Q + 4) / 1e7 * Math.pow(2, 32) + Sp(B, Q) / 1e7 - 11644473600) * 1e3);
		}
		function T(B, Q) {
			return o(), l(c.readFileSync(B), Q);
		}
		function ee(B, Q) {
			var L = Q && Q.type;
			switch (L || Ar && Buffer.isBuffer(B) && (L = "buffer"), L || "base64") {
				case "file": return T(B, Q);
				case "base64": return l(Ti(kp(B)), Q);
				case "binary": return l(Ti(B), Q);
			}
			return l(B, Q);
		}
		function x(B, Q) {
			var L = Q || {}, M = L.root || "Root Entry";
			if (B.FullPaths || (B.FullPaths = []), B.FileIndex || (B.FileIndex = []), B.FullPaths.length !== B.FileIndex.length) throw new Error("inconsistent CFB structure");
			B.FullPaths.length === 0 && (B.FullPaths[0] = M + "/", B.FileIndex[0] = {
				name: M,
				type: 5
			}), L.CLSID && (B.FileIndex[0].clsid = L.CLSID), G(B);
		}
		function G(B) {
			var Q = "Sh33tJ5";
			if (!Fi.find(B, "/" + Q)) {
				var L = Lr(4);
				L[0] = 55, L[1] = L[3] = 50, L[2] = 54, B.FileIndex.push({
					name: Q,
					type: 2,
					content: L,
					size: 4,
					L: 69,
					R: 69,
					C: 69
				}), B.FullPaths.push(B.FullPaths[0] + Q), O(B);
			}
		}
		function O(B, Q) {
			x(B);
			for (var L = !1, M = !1, Y = B.FullPaths.length - 1; Y >= 0; --Y) {
				var $ = B.FileIndex[Y];
				switch ($.type) {
					case 0:
						M ? L = !0 : (B.FileIndex.pop(), B.FullPaths.pop());
						break;
					case 1:
					case 2:
					case 5:
						M = !0, isNaN($.R * $.L * $.C) && (L = !0), $.R > -1 && $.L > -1 && $.R == $.L && (L = !0);
						break;
					default: L = !0;
				}
			}
			if (!(!L && !Q)) {
				var ue = new Date(1987, 1, 19), we = 0, le = Object.create ? Object.create(null) : {}, he = [];
				for (Y = 0; Y < B.FullPaths.length; ++Y) le[B.FullPaths[Y]] = !0, B.FileIndex[Y].type !== 0 && he.push([B.FullPaths[Y], B.FileIndex[Y]]);
				for (Y = 0; Y < he.length; ++Y) {
					var ce = n(he[Y][0]);
					for (M = le[ce]; !M;) {
						for (; n(ce) && !le[n(ce)];) ce = n(ce);
						he.push([ce, {
							name: i(ce).replace("/", ""),
							type: 1,
							clsid: xe,
							ct: ue,
							mt: ue,
							content: null
						}]), le[ce] = !0, ce = n(he[Y][0]), M = le[ce];
					}
				}
				for (he.sort(function(Pe, Se) {
					return t(Pe[0], Se[0]);
				}), B.FullPaths = [], B.FileIndex = [], Y = 0; Y < he.length; ++Y) B.FullPaths[Y] = he[Y][0], B.FileIndex[Y] = he[Y][1];
				for (Y = 0; Y < he.length; ++Y) {
					var Ce = B.FileIndex[Y], ke = B.FullPaths[Y];
					if (Ce.name = i(ke).replace("/", ""), Ce.L = Ce.R = Ce.C = -(Ce.color = 1), Ce.size = Ce.content ? Ce.content.length : 0, Ce.start = 0, Ce.clsid = Ce.clsid || xe, Y === 0) Ce.C = he.length > 1 ? 1 : -1, Ce.size = 0, Ce.type = 5;
					else if (ke.slice(-1) == "/") {
						for (we = Y + 1; we < he.length && n(B.FullPaths[we]) != ke; ++we);
						for (Ce.C = we >= he.length ? -1 : we, we = Y + 1; we < he.length && n(B.FullPaths[we]) != n(ke); ++we);
						Ce.R = we >= he.length ? -1 : we, Ce.type = 1;
					} else n(B.FullPaths[Y + 1] || "") == n(ke) && (Ce.R = Y + 1), Ce.type = 2;
				}
			}
		}
		function k(B, Q) {
			var L = Q || {};
			if (L.fileType == "mad") return Ya(B, L);
			if (O(B), L.fileType === "zip") return Pr(B, L);
			var M = (function(Pe) {
				for (var Se = 0, Be = 0, Ze = 0; Ze < Pe.FileIndex.length; ++Ze) {
					var ut = Pe.FileIndex[Ze];
					if (ut.content) {
						var xt = ut.content.length;
						xt > 0 && (xt < 4096 ? Se += xt + 63 >> 6 : Be += xt + 511 >> 9);
					}
				}
				for (var wt = Pe.FullPaths.length + 3 >> 2, Qt = Se + 7 >> 3, yr = Se + 127 >> 7, _n = Qt + Be + wt + yr, Mr = _n + 127 >> 7, Li = Mr <= 109 ? 0 : Math.ceil((Mr - 109) / 127); _n + Mr + Li + 127 >> 7 > Mr;) Li = ++Mr <= 109 ? 0 : Math.ceil((Mr - 109) / 127);
				var mr = [
					1,
					Li,
					Mr,
					yr,
					wt,
					Be,
					Se,
					0
				];
				return Pe.FileIndex[0].size = Se << 6, mr[7] = (Pe.FileIndex[0].start = mr[0] + mr[1] + mr[2] + mr[3] + mr[4] + mr[5]) + (mr[6] + 7 >> 3), mr;
			})(B), Y = Lr(M[7] << 9), $ = 0, ue = 0;
			for ($ = 0; $ < 8; ++$) Y.write_shift(1, ie[$]);
			for ($ = 0; $ < 8; ++$) Y.write_shift(2, 0);
			for (Y.write_shift(2, 62), Y.write_shift(2, 3), Y.write_shift(2, 65534), Y.write_shift(2, 9), Y.write_shift(2, 6), $ = 0; $ < 3; ++$) Y.write_shift(2, 0);
			for (Y.write_shift(4, 0), Y.write_shift(4, M[2]), Y.write_shift(4, M[0] + M[1] + M[2] + M[3] - 1), Y.write_shift(4, 0), Y.write_shift(4, 4096), Y.write_shift(4, M[3] ? M[0] + M[1] + M[2] - 1 : V), Y.write_shift(4, M[3]), Y.write_shift(-4, M[1] ? M[0] - 1 : V), Y.write_shift(4, M[1]), $ = 0; $ < 109; ++$) Y.write_shift(-4, $ < M[2] ? M[1] + $ : -1);
			if (M[1]) for (ue = 0; ue < M[1]; ++ue) {
				for (; $ < 236 + ue * 127; ++$) Y.write_shift(-4, $ < M[2] ? M[1] + $ : -1);
				Y.write_shift(-4, ue === M[1] - 1 ? V : ue + 1);
			}
			var we = function(Pe) {
				for (ue += Pe; $ < ue - 1; ++$) Y.write_shift(-4, $ + 1);
				Pe && (++$, Y.write_shift(-4, V));
			};
			for (ue = $ = 0, ue += M[1]; $ < ue; ++$) Y.write_shift(-4, se.DIFSECT);
			for (ue += M[2]; $ < ue; ++$) Y.write_shift(-4, se.FATSECT);
			we(M[3]), we(M[4]);
			for (var le = 0, he = 0, ce = B.FileIndex[0]; le < B.FileIndex.length; ++le) ce = B.FileIndex[le], ce.content && (he = ce.content.length, !(he < 4096) && (ce.start = ue, we(he + 511 >> 9)));
			for (we(M[6] + 7 >> 3); Y.l & 511;) Y.write_shift(-4, se.ENDOFCHAIN);
			for (ue = $ = 0, le = 0; le < B.FileIndex.length; ++le) ce = B.FileIndex[le], ce.content && (he = ce.content.length, !(!he || he >= 4096) && (ce.start = ue, we(he + 63 >> 6)));
			for (; Y.l & 511;) Y.write_shift(-4, se.ENDOFCHAIN);
			for ($ = 0; $ < M[4] << 2; ++$) {
				var Ce = B.FullPaths[$];
				if (!Ce || Ce.length === 0) {
					for (le = 0; le < 17; ++le) Y.write_shift(4, 0);
					for (le = 0; le < 3; ++le) Y.write_shift(4, -1);
					for (le = 0; le < 12; ++le) Y.write_shift(4, 0);
					continue;
				}
				ce = B.FileIndex[$], $ === 0 && (ce.start = ce.size ? ce.start - 1 : V);
				var ke = $ === 0 && L.root || ce.name;
				if (ke.length > 32 && (console.error("Name " + ke + " will be truncated to " + ke.slice(0, 32)), ke = ke.slice(0, 32)), he = 2 * (ke.length + 1), Y.write_shift(64, ke, "utf16le"), Y.write_shift(2, he), Y.write_shift(1, ce.type), Y.write_shift(1, ce.color), Y.write_shift(-4, ce.L), Y.write_shift(-4, ce.R), Y.write_shift(-4, ce.C), ce.clsid) Y.write_shift(16, ce.clsid, "hex");
				else for (le = 0; le < 4; ++le) Y.write_shift(4, 0);
				Y.write_shift(4, ce.state || 0), Y.write_shift(4, 0), Y.write_shift(4, 0), Y.write_shift(4, 0), Y.write_shift(4, 0), Y.write_shift(4, ce.start), Y.write_shift(4, ce.size), Y.write_shift(4, 0);
			}
			for ($ = 1; $ < B.FileIndex.length; ++$) if (ce = B.FileIndex[$], ce.size >= 4096) if (Y.l = ce.start + 1 << 9, Ar && Buffer.isBuffer(ce.content)) ce.content.copy(Y, Y.l, 0, ce.size), Y.l += ce.size + 511 & -512;
			else {
				for (le = 0; le < ce.size; ++le) Y.write_shift(1, ce.content[le]);
				for (; le & 511; ++le) Y.write_shift(1, 0);
			}
			for ($ = 1; $ < B.FileIndex.length; ++$) if (ce = B.FileIndex[$], ce.size > 0 && ce.size < 4096) if (Ar && Buffer.isBuffer(ce.content)) ce.content.copy(Y, Y.l, 0, ce.size), Y.l += ce.size + 63 & -64;
			else {
				for (le = 0; le < ce.size; ++le) Y.write_shift(1, ce.content[le]);
				for (; le & 63; ++le) Y.write_shift(1, 0);
			}
			if (Ar) Y.l = Y.length;
			else for (; Y.l < Y.length;) Y.write_shift(1, 0);
			return Y;
		}
		function H(B, Q) {
			var L = B.FullPaths.map(function(le) {
				return le.toUpperCase();
			}), M = L.map(function(le) {
				var he = le.split("/");
				return he[he.length - (le.slice(-1) == "/" ? 2 : 1)];
			}), Y = !1;
			Q.charCodeAt(0) === 47 ? (Y = !0, Q = L[0].slice(0, -1) + Q) : Y = Q.indexOf("/") !== -1;
			var $ = Q.toUpperCase(), ue = Y === !0 ? L.indexOf($) : M.indexOf($);
			if (ue !== -1) return B.FileIndex[ue];
			var we = !$.match(qs);
			for ($ = $.replace(Ga, ""), we && ($ = $.replace(qs, "!")), ue = 0; ue < L.length; ++ue) if ((we ? L[ue].replace(qs, "!") : L[ue]).replace(Ga, "") == $ || (we ? M[ue].replace(qs, "!") : M[ue]).replace(Ga, "") == $) return B.FileIndex[ue];
			return null;
		}
		var m = 64, V = -2, y = "d0cf11e0a1b11ae1", ie = [
			208,
			207,
			17,
			224,
			161,
			177,
			26,
			225
		], xe = "00000000000000000000000000000000", se = {
			MAXREGSECT: -6,
			DIFSECT: -4,
			FATSECT: -3,
			ENDOFCHAIN: V,
			FREESECT: -1,
			HEADER_SIGNATURE: y,
			HEADER_MINOR_VERSION: "3e00",
			MAXREGSID: -6,
			NOSTREAM: -1,
			HEADER_CLSID: xe,
			EntryTypes: [
				"unknown",
				"storage",
				"stream",
				"lockbytes",
				"property",
				"root"
			]
		};
		function ae(B, Q, L) {
			o();
			var M = k(B, L);
			c.writeFileSync(Q, M);
		}
		function R(B) {
			for (var Q = new Array(B.length), L = 0; L < B.length; ++L) Q[L] = String.fromCharCode(B[L]);
			return Q.join("");
		}
		function W(B, Q) {
			var L = k(B, Q);
			switch (Q && Q.type || "buffer") {
				case "file": return o(), c.writeFileSync(Q.filename, L), L;
				case "binary": return typeof L == "string" ? L : R(L);
				case "base64": return Ip(typeof L == "string" ? L : R(L));
				case "buffer": if (Ar) return Buffer.isBuffer(L) ? L : nl(L);
				case "array": return typeof L == "string" ? Ti(L) : L;
			}
			return L;
		}
		var q;
		function Z(B) {
			try {
				var Q = B.InflateRaw, L = new Q();
				if (L._processChunk(new Uint8Array([3, 0]), L._finishFlushFlag), L.bytesRead) q = B;
				else throw new Error("zlib does not expose bytesRead");
			} catch (M) {
				console.error("cannot use native zlib: " + (M.message || M));
			}
		}
		function ge(B, Q) {
			if (!q) return qr(B, Q);
			var L = q.InflateRaw, M = new L(), Y = M._processChunk(B.slice(B.l), M._finishFlushFlag);
			return B.l += M.bytesRead, Y;
		}
		function Ee(B) {
			return q ? q.deflateRawSync(B) : Bt(B);
		}
		var ye = [
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
		], Ne = [
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
			258
		], Oe = [
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
			24577
		];
		function Ue(B) {
			var Q = (B << 1 | B << 11) & 139536 | (B << 5 | B << 15) & 558144;
			return (Q >> 16 | Q >> 8 | Q) & 255;
		}
		for (var Re = typeof Uint8Array != "undefined", je = Re ? /* @__PURE__ */ new Uint8Array(256) : [], qe = 0; qe < 256; ++qe) je[qe] = Ue(qe);
		function E(B, Q) {
			var L = je[B & 255];
			return Q <= 8 ? L >>> 8 - Q : (L = L << 8 | je[B >> 8 & 255], Q <= 16 ? L >>> 16 - Q : (L = L << 8 | je[B >> 16 & 255], L >>> 24 - Q));
		}
		function _e(B, Q) {
			var L = Q & 7, M = Q >>> 3;
			return (B[M] | (L <= 6 ? 0 : B[M + 1] << 8)) >>> L & 3;
		}
		function w(B, Q) {
			var L = Q & 7, M = Q >>> 3;
			return (B[M] | (L <= 5 ? 0 : B[M + 1] << 8)) >>> L & 7;
		}
		function N(B, Q) {
			var L = Q & 7, M = Q >>> 3;
			return (B[M] | (L <= 4 ? 0 : B[M + 1] << 8)) >>> L & 15;
		}
		function D(B, Q) {
			var L = Q & 7, M = Q >>> 3;
			return (B[M] | (L <= 3 ? 0 : B[M + 1] << 8)) >>> L & 31;
		}
		function I(B, Q) {
			var L = Q & 7, M = Q >>> 3;
			return (B[M] | (L <= 1 ? 0 : B[M + 1] << 8)) >>> L & 127;
		}
		function S(B, Q, L) {
			var M = Q & 7, Y = Q >>> 3, $ = (1 << L) - 1, ue = B[Y] >>> M;
			return L < 8 - M || (ue |= B[Y + 1] << 8 - M, L < 16 - M) || (ue |= B[Y + 2] << 16 - M, L < 24 - M) || (ue |= B[Y + 3] << 24 - M), ue & $;
		}
		function z(B, Q, L) {
			var M = Q & 7, Y = Q >>> 3;
			return M <= 5 ? B[Y] |= (L & 7) << M : (B[Y] |= L << M & 255, B[Y + 1] = (L & 7) >> 8 - M), Q + 3;
		}
		function X(B, Q, L) {
			var M = Q & 7, Y = Q >>> 3;
			return L = (L & 1) << M, B[Y] |= L, Q + 1;
		}
		function K(B, Q, L) {
			var M = Q & 7, Y = Q >>> 3;
			return L <<= M, B[Y] |= L & 255, L >>>= 8, B[Y + 1] = L, Q + 8;
		}
		function re(B, Q, L) {
			var M = Q & 7, Y = Q >>> 3;
			return L <<= M, B[Y] |= L & 255, L >>>= 8, B[Y + 1] = L & 255, B[Y + 2] = L >>> 8, Q + 16;
		}
		function ne(B, Q) {
			var L = B.length, M = 2 * L > Q ? 2 * L : Q + 5, Y = 0;
			if (L >= Q) return B;
			if (Ar) {
				var $ = Dp(M);
				if (B.copy) B.copy($);
				else for (; Y < B.length; ++Y) $[Y] = B[Y];
				return $;
			} else if (Re) {
				var ue = new Uint8Array(M);
				if (ue.set) ue.set(B);
				else for (; Y < L; ++Y) ue[Y] = B[Y];
				return ue;
			}
			return B.length = M, B;
		}
		function oe(B) {
			for (var Q = new Array(B), L = 0; L < B; ++L) Q[L] = 0;
			return Q;
		}
		function me(B, Q, L) {
			var M = 1, Y = 0, $ = 0, ue = 0, we = 0, le = B.length, he = Re ? /* @__PURE__ */ new Uint16Array(32) : oe(32);
			for ($ = 0; $ < 32; ++$) he[$] = 0;
			for ($ = le; $ < L; ++$) B[$] = 0;
			le = B.length;
			var ce = Re ? new Uint16Array(le) : oe(le);
			for ($ = 0; $ < le; ++$) he[Y = B[$]]++, M < Y && (M = Y), ce[$] = 0;
			for (he[0] = 0, $ = 1; $ <= M; ++$) he[$ + 16] = we = we + he[$ - 1] << 1;
			for ($ = 0; $ < le; ++$) we = B[$], we != 0 && (ce[$] = he[we + 16]++);
			var Ce = 0;
			for ($ = 0; $ < le; ++$) if (Ce = B[$], Ce != 0) for (we = E(ce[$], M) >> M - Ce, ue = (1 << M + 4 - Ce) - 1; ue >= 0; --ue) Q[we | ue << Ce] = Ce & 15 | $ << 4;
			return M;
		}
		var be = Re ? /* @__PURE__ */ new Uint16Array(512) : oe(512), ze = Re ? /* @__PURE__ */ new Uint16Array(32) : oe(32);
		if (!Re) {
			for (var He = 0; He < 512; ++He) be[He] = 0;
			for (He = 0; He < 32; ++He) ze[He] = 0;
		}
		(function() {
			for (var B = [], Q = 0; Q < 32; Q++) B.push(5);
			me(B, ze, 32);
			var L = [];
			for (Q = 0; Q <= 143; Q++) L.push(8);
			for (; Q <= 255; Q++) L.push(9);
			for (; Q <= 279; Q++) L.push(7);
			for (; Q <= 287; Q++) L.push(8);
			me(L, be, 288);
		})();
		var dt = (function() {
			for (var Q = Re ? /* @__PURE__ */ new Uint8Array(32768) : [], L = 0, M = 0; L < Oe.length - 1; ++L) for (; M < Oe[L + 1]; ++M) Q[M] = L;
			for (; M < 32768; ++M) Q[M] = 29;
			var Y = Re ? /* @__PURE__ */ new Uint8Array(259) : [];
			for (L = 0, M = 0; L < Ne.length - 1; ++L) for (; M < Ne[L + 1]; ++M) Y[M] = L;
			function $(we, le) {
				for (var he = 0; he < we.length;) {
					var ce = Math.min(65535, we.length - he), Ce = he + ce == we.length;
					for (le.write_shift(1, +Ce), le.write_shift(2, ce), le.write_shift(2, ~ce & 65535); ce-- > 0;) le[le.l++] = we[he++];
				}
				return le.l;
			}
			function ue(we, le) {
				for (var he = 0, ce = 0, Ce = Re ? /* @__PURE__ */ new Uint16Array(32768) : []; ce < we.length;) {
					var ke = Math.min(65535, we.length - ce);
					if (ke < 10) {
						for (he = z(le, he, +(ce + ke == we.length)), he & 7 && (he += 8 - (he & 7)), le.l = he / 8 | 0, le.write_shift(2, ke), le.write_shift(2, ~ke & 65535); ke-- > 0;) le[le.l++] = we[ce++];
						he = le.l * 8;
						continue;
					}
					he = z(le, he, +(ce + ke == we.length) + 2);
					for (var Pe = 0; ke-- > 0;) {
						var Se = we[ce];
						Pe = (Pe << 5 ^ Se) & 32767;
						var Be = -1, Ze = 0;
						if ((Be = Ce[Pe]) && (Be |= ce & -32768, Be > ce && (Be -= 32768), Be < ce)) for (; we[Be + Ze] == we[ce + Ze] && Ze < 250;) ++Ze;
						if (Ze > 2) {
							Se = Y[Ze], Se <= 22 ? he = K(le, he, je[Se + 1] >> 1) - 1 : (K(le, he, 3), he += 5, K(le, he, je[Se - 23] >> 5), he += 3);
							var ut = Se < 8 ? 0 : Se - 4 >> 2;
							ut > 0 && (re(le, he, Ze - Ne[Se]), he += ut), Se = Q[ce - Be], he = K(le, he, je[Se] >> 3), he -= 3;
							var xt = Se < 4 ? 0 : Se - 2 >> 1;
							xt > 0 && (re(le, he, ce - Be - Oe[Se]), he += xt);
							for (var wt = 0; wt < Ze; ++wt) Ce[Pe] = ce & 32767, Pe = (Pe << 5 ^ we[ce]) & 32767, ++ce;
							ke -= Ze - 1;
						} else Se <= 143 ? Se = Se + 48 : he = X(le, he, 1), he = K(le, he, je[Se]), Ce[Pe] = ce & 32767, ++ce;
					}
					he = K(le, he, 0) - 1;
				}
				return le.l = (he + 7) / 8 | 0, le.l;
			}
			return function(le, he) {
				return le.length < 8 ? $(le, he) : ue(le, he);
			};
		})();
		function Bt(B) {
			var Q = Lr(50 + Math.floor(B.length * 1.1)), L = dt(B, Q);
			return Q.slice(0, L);
		}
		var $e = Re ? /* @__PURE__ */ new Uint16Array(32768) : oe(32768), Ht = Re ? /* @__PURE__ */ new Uint16Array(32768) : oe(32768), et = Re ? /* @__PURE__ */ new Uint16Array(128) : oe(128), kt = 1, Zt = 1;
		function Wt(B, Q) {
			var L = D(B, Q) + 257;
			Q += 5;
			var M = D(B, Q) + 1;
			Q += 5;
			var Y = N(B, Q) + 4;
			Q += 4;
			for (var $ = 0, ue = Re ? /* @__PURE__ */ new Uint8Array(19) : oe(19), we = [
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
				0
			], le = 1, he = Re ? /* @__PURE__ */ new Uint8Array(8) : oe(8), ce = Re ? /* @__PURE__ */ new Uint8Array(8) : oe(8), Ce = ue.length, ke = 0; ke < Y; ++ke) ue[ye[ke]] = $ = w(B, Q), le < $ && (le = $), he[$]++, Q += 3;
			var Pe = 0;
			for (he[0] = 0, ke = 1; ke <= le; ++ke) ce[ke] = Pe = Pe + he[ke - 1] << 1;
			for (ke = 0; ke < Ce; ++ke) (Pe = ue[ke]) != 0 && (we[ke] = ce[Pe]++);
			var Se = 0;
			for (ke = 0; ke < Ce; ++ke) if (Se = ue[ke], Se != 0) {
				Pe = je[we[ke]] >> 8 - Se;
				for (var Be = (1 << 7 - Se) - 1; Be >= 0; --Be) et[Pe | Be << Se] = Se & 7 | ke << 3;
			}
			var Ze = [];
			for (le = 1; Ze.length < L + M;) switch (Pe = et[I(B, Q)], Q += Pe & 7, Pe >>>= 3) {
				case 16:
					for ($ = 3 + _e(B, Q), Q += 2, Pe = Ze[Ze.length - 1]; $-- > 0;) Ze.push(Pe);
					break;
				case 17:
					for ($ = 3 + w(B, Q), Q += 3; $-- > 0;) Ze.push(0);
					break;
				case 18:
					for ($ = 11 + I(B, Q), Q += 7; $-- > 0;) Ze.push(0);
					break;
				default:
					Ze.push(Pe), le < Pe && (le = Pe);
					break;
			}
			var ut = Ze.slice(0, L), xt = Ze.slice(L);
			for (ke = L; ke < 286; ++ke) ut[ke] = 0;
			for (ke = M; ke < 30; ++ke) xt[ke] = 0;
			return kt = me(ut, $e, 286), Zt = me(xt, Ht, 30), Q;
		}
		function jr(B, Q) {
			if (B[0] == 3 && !(B[1] & 3)) return [Bp(Q), 2];
			for (var L = 0, M = 0, Y = Dp(Q || 1 << 18), $ = 0, ue = Y.length >>> 0, we = 0, le = 0; (M & 1) == 0;) {
				if (M = w(B, L), L += 3, M >>> 1) M >> 1 == 1 ? (we = 9, le = 5) : (L = Wt(B, L), we = kt, le = Zt);
				else {
					L & 7 && (L += 8 - (L & 7));
					var he = B[L >>> 3] | B[(L >>> 3) + 1] << 8;
					if (L += 32, he > 0) for (!Q && ue < $ + he && (Y = ne(Y, $ + he), ue = Y.length); he-- > 0;) Y[$++] = B[L >>> 3], L += 8;
					continue;
				}
				for (;;) {
					!Q && ue < $ + 32767 && (Y = ne(Y, $ + 32767), ue = Y.length);
					var ce = S(B, L, we), Ce = M >>> 1 == 1 ? be[ce] : $e[ce];
					if (L += Ce & 15, Ce >>>= 4, (Ce >>> 8 & 255) === 0) Y[$++] = Ce;
					else {
						if (Ce == 256) break;
						Ce -= 257;
						var ke = Ce < 8 ? 0 : Ce - 4 >> 2;
						ke > 5 && (ke = 0);
						var Pe = $ + Ne[Ce];
						ke > 0 && (Pe += S(B, L, ke), L += ke), ce = S(B, L, le), Ce = M >>> 1 == 1 ? ze[ce] : Ht[ce], L += Ce & 15, Ce >>>= 4;
						var Se = Ce < 4 ? 0 : Ce - 2 >> 1, Be = Oe[Ce];
						for (Se > 0 && (Be += S(B, L, Se), L += Se), !Q && ue < Pe && (Y = ne(Y, Pe + 100), ue = Y.length); $ < Pe;) Y[$] = Y[$ - Be], ++$;
					}
				}
			}
			return Q ? [Y, L + 7 >>> 3] : [Y.slice(0, $), L + 7 >>> 3];
		}
		function qr(B, Q) {
			var M = jr(B.slice(B.l || 0), Q);
			return B.l += M[1], M[0];
		}
		function br(B, Q) {
			if (B) typeof console != "undefined" && console.error(Q);
			else throw new Error(Q);
		}
		function Gt(B, Q) {
			var L = B;
			gn(L, 0);
			var $ = {
				FileIndex: [],
				FullPaths: []
			};
			x($, { root: Q.root });
			for (var ue = L.length - 4; (L[ue] != 80 || L[ue + 1] != 75 || L[ue + 2] != 5 || L[ue + 3] != 6) && ue >= 0;) --ue;
			L.l = ue + 4, L.l += 4;
			var we = L.read_shift(2);
			L.l += 6;
			for (L.l = L.read_shift(4), ue = 0; ue < we; ++ue) {
				L.l += 20;
				var he = L.read_shift(4), ce = L.read_shift(4), Ce = L.read_shift(2), ke = L.read_shift(2), Pe = L.read_shift(2);
				L.l += 8;
				var Se = L.read_shift(4), Be = u(L.slice(L.l + Ce, L.l + Ce + ke));
				L.l += Ce + ke + Pe;
				var Ze = L.l;
				L.l = Se + 4, qt(L, he, ce, $, Be), L.l = Ze;
			}
			return $;
		}
		function qt(B, Q, L, M, Y) {
			B.l += 2;
			var $ = B.read_shift(2), ue = B.read_shift(2), we = s(B);
			if ($ & 8257) throw new Error("Unsupported ZIP encryption");
			for (var le = B.read_shift(4), he = B.read_shift(4), ce = B.read_shift(4), Ce = B.read_shift(2), ke = B.read_shift(2), Pe = "", Se = 0; Se < Ce; ++Se) Pe += String.fromCharCode(B[B.l++]);
			if (ke) {
				var Be = u(B.slice(B.l, B.l + ke));
				(Be[21589] || {}).mt && (we = Be[21589].mt), ((Y || {})[21589] || {}).mt && (we = Y[21589].mt);
			}
			B.l += ke;
			var Ze = B.slice(B.l, B.l + he);
			switch (ue) {
				case 8:
					Ze = ge(B, ce);
					break;
				case 0: break;
				default: throw new Error("Unsupported ZIP Compression method " + ue);
			}
			var ut = !1;
			$ & 8 && (le = B.read_shift(4), le == 134695760 && (le = B.read_shift(4), ut = !0), he = B.read_shift(4), ce = B.read_shift(4)), he != Q && br(ut, "Bad compressed size: " + Q + " != " + he), ce != L && br(ut, "Bad uncompressed size: " + L + " != " + ce);
			var xt = Tp.buf(Ze, 0);
			le >> 0 != xt >> 0 && br(ut, "Bad CRC32 checksum: " + le + " != " + xt), $r(M, Pe, Ze, {
				unsafe: !0,
				mt: we
			});
		}
		function Pr(B, Q) {
			var L = Q || {}, M = [], Y = [], $ = Lr(1), ue = L.compression ? 8 : 0, we = 0;
			var he = 0, ce = 0, Ce = 0, ke = 0, Pe = B.FullPaths[0], Se = Pe, Be = B.FileIndex[0], Ze = [], ut = 0;
			for (he = 1; he < B.FullPaths.length; ++he) if (Se = B.FullPaths[he].slice(Pe.length), Be = B.FileIndex[he], !(!Be.size || !Be.content || Se == "Sh33tJ5")) {
				var xt = Ce, wt = Lr(Se.length);
				for (ce = 0; ce < Se.length; ++ce) wt.write_shift(1, Se.charCodeAt(ce) & 127);
				wt = wt.slice(0, wt.l), Ze[ke] = Tp.buf(Be.content, 0);
				var Qt = Be.content;
				ue == 8 && (Qt = Ee(Qt)), $ = Lr(30), $.write_shift(4, 67324752), $.write_shift(2, 20), $.write_shift(2, we), $.write_shift(2, ue), Be.mt ? a($, Be.mt) : $.write_shift(4, 0), $.write_shift(-4, we & 8 ? 0 : Ze[ke]), $.write_shift(4, we & 8 ? 0 : Qt.length), $.write_shift(4, we & 8 ? 0 : Be.content.length), $.write_shift(2, wt.length), $.write_shift(2, 0), Ce += $.length, M.push($), Ce += wt.length, M.push(wt), Ce += Qt.length, M.push(Qt), we & 8 && ($ = Lr(12), $.write_shift(-4, Ze[ke]), $.write_shift(4, Qt.length), $.write_shift(4, Be.content.length), Ce += $.l, M.push($)), $ = Lr(46), $.write_shift(4, 33639248), $.write_shift(2, 0), $.write_shift(2, 20), $.write_shift(2, we), $.write_shift(2, ue), $.write_shift(4, 0), $.write_shift(-4, Ze[ke]), $.write_shift(4, Qt.length), $.write_shift(4, Be.content.length), $.write_shift(2, wt.length), $.write_shift(2, 0), $.write_shift(2, 0), $.write_shift(2, 0), $.write_shift(2, 0), $.write_shift(4, 0), $.write_shift(4, xt), ut += $.l, Y.push($), ut += wt.length, Y.push(wt), ++ke;
			}
			return $ = Lr(22), $.write_shift(4, 101010256), $.write_shift(2, 0), $.write_shift(2, 0), $.write_shift(2, ke), $.write_shift(2, ke), $.write_shift(4, ut), $.write_shift(4, Ce), $.write_shift(2, 0), Bi([
				Bi(M),
				Bi(Y),
				$
			]);
		}
		var pt = {
			htm: "text/html",
			xml: "text/xml",
			gif: "image/gif",
			jpg: "image/jpeg",
			png: "image/png",
			mso: "application/x-mso",
			thmx: "application/vnd.ms-officetheme",
			sh33tj5: "application/octet-stream"
		};
		function gr(B, Q) {
			if (B.ctype) return B.ctype;
			var L = B.name || "", M = L.match(/\.([^\.]+)$/);
			return M && pt[M[1]] || Q && (M = (L = Q).match(/[\.\\]([^\.\\])+$/), M && pt[M[1]]) ? pt[M[1]] : "application/octet-stream";
		}
		function Wn(B) {
			for (var Q = Ip(B), L = [], M = 0; M < Q.length; M += 76) L.push(Q.slice(M, M + 76));
			return L.join(`\r
`) + `\r
`;
		}
		function to(B) {
			var Q = B.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF=]/g, function(he) {
				var ce = he.charCodeAt(0).toString(16).toUpperCase();
				return "=" + (ce.length == 1 ? "0" + ce : ce);
			});
			Q = Q.replace(/ $/gm, "=20").replace(/\t$/gm, "=09"), Q.charAt(0) == `
` && (Q = "=0D" + Q.slice(1)), Q = Q.replace(/\r(?!\n)/gm, "=0D").replace(/\n\n/gm, `
=0A`).replace(/([^\r\n])\n/gm, "$1=0A");
			for (var L = [], M = Q.split(`\r
`), Y = 0; Y < M.length; ++Y) {
				var $ = M[Y];
				if ($.length == 0) {
					L.push("");
					continue;
				}
				for (var ue = 0; ue < $.length;) {
					var we = 76, le = $.slice(ue, ue + we);
					le.charAt(we - 1) == "=" ? we-- : le.charAt(we - 2) == "=" ? we -= 2 : le.charAt(we - 3) == "=" && (we -= 3), le = $.slice(ue, ue + we), ue += we, ue < $.length && (le += "="), L.push(le);
				}
			}
			return L.join(`\r
`);
		}
		function ro(B) {
			for (var Q = [], L = 0; L < B.length; ++L) {
				for (var M = B[L]; L <= B.length && M.charAt(M.length - 1) == "=";) M = M.slice(0, M.length - 1) + B[++L];
				Q.push(M);
			}
			for (var Y = 0; Y < Q.length; ++Y) Q[Y] = Q[Y].replace(/[=][0-9A-Fa-f]{2}/g, function($) {
				return String.fromCharCode(parseInt($.slice(1), 16));
			});
			return Ti(Q.join(`\r
`));
		}
		function Oi(B, Q, L) {
			for (var M = "", Y = "", $ = "", ue, we = 0; we < 10; ++we) {
				var le = Q[we];
				if (!le || le.match(/^\s*$/)) break;
				var he = le.match(/^(.*?):\s*([^\s].*)$/);
				if (he) switch (he[1].toLowerCase()) {
					case "content-location":
						M = he[2].trim();
						break;
					case "content-type":
						$ = he[2].trim();
						break;
					case "content-transfer-encoding":
						Y = he[2].trim();
						break;
				}
			}
			switch (++we, Y.toLowerCase()) {
				case "base64":
					ue = Ti(kp(Q.slice(we).join("")));
					break;
				case "quoted-printable":
					ue = ro(Q.slice(we));
					break;
				default: throw new Error("Unsupported Content-Transfer-Encoding " + Y);
			}
			var ce = $r(B, M.slice(L.length), ue, { unsafe: !0 });
			$ && (ce.ctype = $);
		}
		function no(B, Q) {
			if (R(B.slice(0, 13)).toLowerCase() != "mime-version:") throw new Error("Unsupported MAD header");
			var L = Q && Q.root || "", M = (Ar && Buffer.isBuffer(B) ? B.toString("binary") : R(B)).split(`\r
`), Y = 0, $ = "";
			for (Y = 0; Y < M.length; ++Y) if ($ = M[Y], !!/^Content-Location:/i.test($) && ($ = $.slice($.indexOf("file")), L || (L = $.slice(0, $.lastIndexOf("/") + 1)), $.slice(0, L.length) != L)) for (; L.length > 0 && (L = L.slice(0, L.length - 1), L = L.slice(0, L.lastIndexOf("/") + 1), $.slice(0, L.length) != L););
			var ue = (M[1] || "").match(/boundary="(.*?)"/);
			if (!ue) throw new Error("MAD cannot find boundary");
			var we = "--" + (ue[1] || ""), ce = {
				FileIndex: [],
				FullPaths: []
			};
			x(ce);
			var Ce, ke = 0;
			for (Y = 0; Y < M.length; ++Y) {
				var Pe = M[Y];
				Pe !== we && Pe !== we + "--" || (ke++ && Oi(ce, M.slice(Ce, Y), L), Ce = Y);
			}
			return ce;
		}
		function Ya(B, Q) {
			var L = Q || {}, M = L.boundary || "SheetJS";
			M = "------=" + M;
			for (var Y = [
				"MIME-Version: 1.0",
				"Content-Type: multipart/related; boundary=\"" + M.slice(2) + "\"",
				"",
				"",
				""
			], $ = B.FullPaths[0], ue = $, we = B.FileIndex[0], le = 1; le < B.FullPaths.length; ++le) if (ue = B.FullPaths[le].slice($.length), we = B.FileIndex[le], !(!we.size || !we.content || ue == "Sh33tJ5")) {
				ue = ue.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF]/g, function(Ze) {
					return "_x" + Ze.charCodeAt(0).toString(16) + "_";
				}).replace(/[\u0080-\uFFFF]/g, function(Ze) {
					return "_u" + Ze.charCodeAt(0).toString(16) + "_";
				});
				for (var he = we.content, ce = Ar && Buffer.isBuffer(he) ? he.toString("binary") : R(he), Ce = 0, ke = Math.min(1024, ce.length), Pe = 0, Se = 0; Se <= ke; ++Se) (Pe = ce.charCodeAt(Se)) >= 32 && Pe < 128 && ++Ce;
				var Be = Ce >= ke * 4 / 5;
				Y.push(M), Y.push("Content-Location: " + (L.root || "file:///C:/SheetJS/") + ue), Y.push("Content-Transfer-Encoding: " + (Be ? "quoted-printable" : "base64")), Y.push("Content-Type: " + gr(we, ue)), Y.push(""), Y.push(Be ? to(ce) : Wn(ce));
			}
			return Y.push(M + `--\r
`), Y.join(`\r
`);
		}
		function Ka(B) {
			var Q = {};
			return x(Q, B), Q;
		}
		function $r(B, Q, L, M) {
			var Y = M && M.unsafe;
			Y || x(B);
			var $ = !Y && Fi.find(B, Q);
			if (!$) {
				var ue = B.FullPaths[0];
				Q.slice(0, ue.length) == ue ? ue = Q : (ue.slice(-1) != "/" && (ue += "/"), ue = (ue + Q).replace("//", "/")), $ = {
					name: i(Q),
					type: 2
				}, B.FileIndex.push($), B.FullPaths.push(ue), Y || Fi.utils.cfb_gc(B);
			}
			return $.content = L, $.size = L ? L.length : 0, M && (M.CLSID && ($.clsid = M.CLSID), M.mt && ($.mt = M.mt), M.ct && ($.ct = M.ct)), $;
		}
		function ja(B, Q) {
			x(B);
			var L = Fi.find(B, Q);
			if (L) {
				for (var M = 0; M < B.FileIndex.length; ++M) if (B.FileIndex[M] == L) return B.FileIndex.splice(M, 1), B.FullPaths.splice(M, 1), !0;
			}
			return !1;
		}
		function io(B, Q, L) {
			x(B);
			var M = Fi.find(B, Q);
			if (M) {
				for (var Y = 0; Y < B.FileIndex.length; ++Y) if (B.FileIndex[Y] == M) return B.FileIndex[Y].name = i(L), B.FullPaths[Y] = L, !0;
			}
			return !1;
		}
		function Jr(B) {
			O(B, !0);
		}
		return r.find = H, r.read = ee, r.parse = l, r.write = W, r.writeFile = ae, r.utils = {
			cfb_new: Ka,
			cfb_add: $r,
			cfb_del: ja,
			cfb_mov: io,
			cfb_gc: Jr,
			ReadShift: Rp,
			CheckField: Op,
			prep_blob: gn,
			bconcat: Bi,
			use_zlib: Z,
			_deflateRaw: Bt,
			_inflateRaw: qr,
			consts: se
		}, r;
	})();
	typeof $t != "undefined" && typeof rl != "undefined" && typeof DO_NOT_EXPORT_CFB == "undefined" && (rl.exports = Fi);
});
var Mp = uo(pl(), 1);
function Jn(e) {
	let r = e.length;
	for (; --r >= 0;) e[r] = 0;
}
var n0 = 0;
var th = 1;
var i0 = 2;
var a0 = 3;
var s0 = 258;
var Ro = 29;
var Vi = 256;
var Qi = Vi + 1 + Ro;
var Kn = 30;
var Oo = 19;
var rh = 2 * Qi + 1;
var vn = 15;
var ho = 16;
var o0 = 7;
var Lo = 256;
var nh = 16;
var ih = 17;
var ah = 18;
var Co = new Uint8Array([
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
]);
var es = new Uint8Array([
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
]);
var u0 = new Uint8Array([
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
]);
var sh = new Uint8Array([
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
]);
var l0 = 512;
var Hr = new Array((Qi + 2) * 2);
Jn(Hr);
var Zi = new Array(Kn * 2);
Jn(Zi);
var Yi = new Array(l0);
Jn(Yi);
var Ki = new Array(s0 - a0 + 1);
Jn(Ki);
var Po = new Array(Ro);
Jn(Po);
var ts = new Array(Kn);
Jn(ts);
function co(e, r, t, n, i) {
	this.static_tree = e, this.extra_bits = r, this.extra_base = t, this.elems = n, this.max_length = i, this.has_stree = e && e.length;
}
var oh;
var uh;
var lh;
function fo(e, r) {
	this.dyn_tree = e, this.max_code = 0, this.stat_desc = r;
}
var hh = (e) => e < 256 ? Yi[e] : Yi[256 + (e >>> 7)], ji = (e, r) => {
	e.pending_buf[e.pending++] = r & 255, e.pending_buf[e.pending++] = r >>> 8 & 255;
}, Jt = (e, r, t) => {
	e.bi_valid > ho - t ? (e.bi_buf |= r << e.bi_valid & 65535, ji(e, e.bi_buf), e.bi_buf = r >> ho - e.bi_valid, e.bi_valid += t - ho) : (e.bi_buf |= r << e.bi_valid & 65535, e.bi_valid += t);
}, Cr = (e, r, t) => {
	Jt(e, t[r * 2], t[r * 2 + 1]);
}, ch = (e, r) => {
	let t = 0;
	do
		t |= e & 1, e >>>= 1, t <<= 1;
	while (--r > 0);
	return t >>> 1;
}, h0 = (e) => {
	e.bi_valid === 16 ? (ji(e, e.bi_buf), e.bi_buf = 0, e.bi_valid = 0) : e.bi_valid >= 8 && (e.pending_buf[e.pending++] = e.bi_buf & 255, e.bi_buf >>= 8, e.bi_valid -= 8);
}, c0 = (e, r) => {
	let t = r.dyn_tree, n = r.max_code, i = r.stat_desc.static_tree, a = r.stat_desc.has_stree, s = r.stat_desc.extra_bits, u = r.stat_desc.extra_base, c = r.stat_desc.max_length, o, l, d, p, h, A, f = 0;
	for (p = 0; p <= vn; p++) e.bl_count[p] = 0;
	for (t[e.heap[e.heap_max] * 2 + 1] = 0, o = e.heap_max + 1; o < rh; o++) l = e.heap[o], p = t[t[l * 2 + 1] * 2 + 1] + 1, p > c && (p = c, f++), t[l * 2 + 1] = p, !(l > n) && (e.bl_count[p]++, h = 0, l >= u && (h = s[l - u]), A = t[l * 2], e.opt_len += A * (p + h), a && (e.static_len += A * (i[l * 2 + 1] + h)));
	if (f !== 0) {
		do {
			for (p = c - 1; e.bl_count[p] === 0;) p--;
			e.bl_count[p]--, e.bl_count[p + 1] += 2, e.bl_count[c]--, f -= 2;
		} while (f > 0);
		for (p = c; p !== 0; p--) for (l = e.bl_count[p]; l !== 0;) d = e.heap[--o], !(d > n) && (t[d * 2 + 1] !== p && (e.opt_len += (p - t[d * 2 + 1]) * t[d * 2], t[d * 2 + 1] = p), l--);
	}
}, fh = (e, r, t) => {
	let n = new Array(vn + 1), i = 0, a, s;
	for (a = 1; a <= vn; a++) i = i + t[a - 1] << 1, n[a] = i;
	for (s = 0; s <= r; s++) {
		let u = e[s * 2 + 1];
		u !== 0 && (e[s * 2] = ch(n[u]++, u));
	}
}, f0 = () => {
	let e, r, t, n, i, a = new Array(vn + 1);
	for (t = 0, n = 0; n < Ro - 1; n++) for (Po[n] = t, e = 0; e < 1 << Co[n]; e++) Ki[t++] = n;
	for (Ki[t - 1] = n, i = 0, n = 0; n < 16; n++) for (ts[n] = i, e = 0; e < 1 << es[n]; e++) Yi[i++] = n;
	for (i >>= 7; n < Kn; n++) for (ts[n] = i << 7, e = 0; e < 1 << es[n] - 7; e++) Yi[256 + i++] = n;
	for (r = 0; r <= vn; r++) a[r] = 0;
	for (e = 0; e <= 143;) Hr[e * 2 + 1] = 8, e++, a[8]++;
	for (; e <= 255;) Hr[e * 2 + 1] = 9, e++, a[9]++;
	for (; e <= 279;) Hr[e * 2 + 1] = 7, e++, a[7]++;
	for (; e <= 287;) Hr[e * 2 + 1] = 8, e++, a[8]++;
	for (fh(Hr, Qi + 1, a), e = 0; e < Kn; e++) Zi[e * 2 + 1] = 5, Zi[e * 2] = ch(e, 5);
	oh = new co(Hr, Co, Vi + 1, Qi, vn), uh = new co(Zi, es, 0, Kn, vn), lh = new co(new Array(0), u0, 0, Oo, o0);
}, dh = (e) => {
	let r;
	for (r = 0; r < Qi; r++) e.dyn_ltree[r * 2] = 0;
	for (r = 0; r < Kn; r++) e.dyn_dtree[r * 2] = 0;
	for (r = 0; r < Oo; r++) e.bl_tree[r * 2] = 0;
	e.dyn_ltree[Lo * 2] = 1, e.opt_len = e.static_len = 0, e.sym_next = e.matches = 0;
}, ph = (e) => {
	e.bi_valid > 8 ? ji(e, e.bi_buf) : e.bi_valid > 0 && (e.pending_buf[e.pending++] = e.bi_buf), e.bi_buf = 0, e.bi_valid = 0;
}, Al = (e, r, t, n) => {
	let i = r * 2, a = t * 2;
	return e[i] < e[a] || e[i] === e[a] && n[r] <= n[t];
}, po = (e, r, t) => {
	let n = e.heap[t], i = t << 1;
	for (; i <= e.heap_len && (i < e.heap_len && Al(r, e.heap[i + 1], e.heap[i], e.depth) && i++, !Al(r, n, e.heap[i], e.depth));) e.heap[t] = e.heap[i], t = i, i <<= 1;
	e.heap[t] = n;
}, gl = (e, r, t) => {
	let n, i, a = 0, s, u;
	if (e.sym_next !== 0) do
		n = e.pending_buf[e.sym_buf + a++] & 255, n += (e.pending_buf[e.sym_buf + a++] & 255) << 8, i = e.pending_buf[e.sym_buf + a++], n === 0 ? Cr(e, i, r) : (s = Ki[i], Cr(e, s + Vi + 1, r), u = Co[s], u !== 0 && (i -= Po[s], Jt(e, i, u)), n--, s = hh(n), Cr(e, s, t), u = es[s], u !== 0 && (n -= ts[s], Jt(e, n, u)));
	while (a < e.sym_next);
	Cr(e, Lo, r);
}, Io = (e, r) => {
	let t = r.dyn_tree, n = r.stat_desc.static_tree, i = r.stat_desc.has_stree, a = r.stat_desc.elems, s, u, c = -1, o;
	for (e.heap_len = 0, e.heap_max = rh, s = 0; s < a; s++) t[s * 2] !== 0 ? (e.heap[++e.heap_len] = c = s, e.depth[s] = 0) : t[s * 2 + 1] = 0;
	for (; e.heap_len < 2;) o = e.heap[++e.heap_len] = c < 2 ? ++c : 0, t[o * 2] = 1, e.depth[o] = 0, e.opt_len--, i && (e.static_len -= n[o * 2 + 1]);
	for (r.max_code = c, s = e.heap_len >> 1; s >= 1; s--) po(e, t, s);
	o = a;
	do
		s = e.heap[1], e.heap[1] = e.heap[e.heap_len--], po(e, t, 1), u = e.heap[1], e.heap[--e.heap_max] = s, e.heap[--e.heap_max] = u, t[o * 2] = t[s * 2] + t[u * 2], e.depth[o] = (e.depth[s] >= e.depth[u] ? e.depth[s] : e.depth[u]) + 1, t[s * 2 + 1] = t[u * 2 + 1] = o, e.heap[1] = o++, po(e, t, 1);
	while (e.heap_len >= 2);
	e.heap[--e.heap_max] = e.heap[1], c0(e, r), fh(t, c, e.bl_count);
}, ml = (e, r, t) => {
	let n, i = -1, a, s = r[1], u = 0, c = 7, o = 4;
	for (s === 0 && (c = 138, o = 3), r[(t + 1) * 2 + 1] = 65535, n = 0; n <= t; n++) a = s, s = r[(n + 1) * 2 + 1], !(++u < c && a === s) && (u < o ? e.bl_tree[a * 2] += u : a !== 0 ? (a !== i && e.bl_tree[a * 2]++, e.bl_tree[nh * 2]++) : u <= 10 ? e.bl_tree[ih * 2]++ : e.bl_tree[ah * 2]++, u = 0, i = a, s === 0 ? (c = 138, o = 3) : a === s ? (c = 6, o = 3) : (c = 7, o = 4));
}, _l = (e, r, t) => {
	let n, i = -1, a, s = r[1], u = 0, c = 7, o = 4;
	for (s === 0 && (c = 138, o = 3), n = 0; n <= t; n++) if (a = s, s = r[(n + 1) * 2 + 1], !(++u < c && a === s)) {
		if (u < o) do
			Cr(e, a, e.bl_tree);
		while (--u !== 0);
		else a !== 0 ? (a !== i && (Cr(e, a, e.bl_tree), u--), Cr(e, nh, e.bl_tree), Jt(e, u - 3, 2)) : u <= 10 ? (Cr(e, ih, e.bl_tree), Jt(e, u - 3, 3)) : (Cr(e, ah, e.bl_tree), Jt(e, u - 11, 7));
		u = 0, i = a, s === 0 ? (c = 138, o = 3) : a === s ? (c = 6, o = 3) : (c = 7, o = 4);
	}
}, d0 = (e) => {
	let r;
	for (ml(e, e.dyn_ltree, e.l_desc.max_code), ml(e, e.dyn_dtree, e.d_desc.max_code), Io(e, e.bl_desc), r = Oo - 1; r >= 3 && e.bl_tree[sh[r] * 2 + 1] === 0; r--);
	return e.opt_len += 3 * (r + 1) + 5 + 5 + 4, r;
}, p0 = (e, r, t, n) => {
	let i;
	for (Jt(e, r - 257, 5), Jt(e, t - 1, 5), Jt(e, n - 4, 4), i = 0; i < n; i++) Jt(e, e.bl_tree[sh[i] * 2 + 1], 3);
	_l(e, e.dyn_ltree, r - 1), _l(e, e.dyn_dtree, t - 1);
}, A0 = (e) => {
	let r = 4093624447, t;
	for (t = 0; t <= 31; t++, r >>>= 1) if (r & 1 && e.dyn_ltree[t * 2] !== 0) return 0;
	if (e.dyn_ltree[18] !== 0 || e.dyn_ltree[20] !== 0 || e.dyn_ltree[26] !== 0) return 1;
	for (t = 32; t < Vi; t++) if (e.dyn_ltree[t * 2] !== 0) return 1;
	return 0;
}, wl = !1, g0 = (e) => {
	wl || (f0(), wl = !0), e.l_desc = new fo(e.dyn_ltree, oh), e.d_desc = new fo(e.dyn_dtree, uh), e.bl_desc = new fo(e.bl_tree, lh), e.bi_buf = 0, e.bi_valid = 0, dh(e);
}, Ah = (e, r, t, n) => {
	Jt(e, (n0 << 1) + (n ? 1 : 0), 3), ph(e), ji(e, t), ji(e, ~t), t && e.pending_buf.set(e.window.subarray(r, r + t), e.pending), e.pending += t;
}, m0 = (e) => {
	Jt(e, th << 1, 3), Cr(e, Lo, Hr), h0(e);
}, _0 = (e, r, t, n) => {
	let i, a, s = 0;
	e.level > 0 ? (e.strm.data_type === 2 && (e.strm.data_type = A0(e)), Io(e, e.l_desc), Io(e, e.d_desc), s = d0(e), i = e.opt_len + 3 + 7 >>> 3, a = e.static_len + 3 + 7 >>> 3, a <= i && (i = a)) : i = a = t + 5, t + 4 <= i && r !== -1 ? Ah(e, r, t, n) : e.strategy === 4 || a === i ? (Jt(e, (th << 1) + (n ? 1 : 0), 3), gl(e, Hr, Zi)) : (Jt(e, (i0 << 1) + (n ? 1 : 0), 3), p0(e, e.l_desc.max_code + 1, e.d_desc.max_code + 1, s + 1), gl(e, e.dyn_ltree, e.dyn_dtree)), dh(e), n && ph(e);
}, w0 = (e, r, t) => (e.pending_buf[e.sym_buf + e.sym_next++] = r, e.pending_buf[e.sym_buf + e.sym_next++] = r >> 8, e.pending_buf[e.sym_buf + e.sym_next++] = t, r === 0 ? e.dyn_ltree[t * 2]++ : (e.matches++, r--, e.dyn_ltree[(Ki[t] + Vi + 1) * 2]++, e.dyn_dtree[hh(r) * 2]++), e.sym_next === e.sym_end), C0 = {
	_tr_init: g0,
	_tr_stored_block: Ah,
	_tr_flush_block: _0,
	_tr_tally: w0,
	_tr_align: m0
}, I0 = (e, r, t, n) => {
	let i = e & 65535 | 0, a = e >>> 16 & 65535 | 0, s = 0;
	for (; t !== 0;) {
		s = t > 2e3 ? 2e3 : t, t -= s;
		do
			i = i + r[n++] | 0, a = a + i | 0;
		while (--s);
		i %= 65521, a %= 65521;
	}
	return i | a << 16 | 0;
}, qi = I0, k0 = () => {
	let e, r = [];
	for (var t = 0; t < 256; t++) {
		e = t;
		for (var n = 0; n < 8; n++) e = e & 1 ? 3988292384 ^ e >>> 1 : e >>> 1;
		r[t] = e;
	}
	return r;
}, D0 = new Uint32Array(k0()), S0 = (e, r, t, n) => {
	let i = D0, a = n + t;
	e ^= -1;
	for (let s = n; s < a; s++) e = e >>> 8 ^ i[(e ^ r[s]) & 255];
	return e ^ -1;
}, Nt = S0, En = {
	2: "need dictionary",
	1: "stream end",
	0: "",
	"-1": "file error",
	"-2": "stream error",
	"-3": "data error",
	"-4": "insufficient memory",
	"-5": "buffer error",
	"-6": "incompatible version"
}, Vn = {
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
	Z_MEM_ERROR: -4,
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
}, { _tr_init: T0, _tr_stored_block: ko, _tr_flush_block: B0, _tr_tally: en, _tr_align: N0 } = C0, { Z_NO_FLUSH: tn, Z_PARTIAL_FLUSH: F0, Z_FULL_FLUSH: R0, Z_FINISH: ur, Z_BLOCK: vl, Z_OK: Ot, Z_STREAM_END: bl, Z_STREAM_ERROR: Ir, Z_DATA_ERROR: O0, Z_BUF_ERROR: Ao, Z_DEFAULT_COMPRESSION: L0, Z_FILTERED: P0, Z_HUFFMAN_ONLY: qa, Z_RLE: M0, Z_FIXED: U0, Z_DEFAULT_STRATEGY: z0, Z_UNKNOWN: H0, Z_DEFLATED: is } = Vn, Z0 = 9, W0 = 15, G0 = 8, Do = 286, K0 = 30, j0 = 19, q0 = 2 * Do + 1, $0 = 15, it = 3, Xr = 258, kr = Xr + it + 1, J0 = 32, qn = 42, Mo = 57, So = 69, To = 73, Bo = 91, No = 103, bn = 113, zi = 666, Yt = 1, Xn = 2, xn = 3, ei = 4, V0 = 3, yn = (e, r) => (e.msg = En[r], r), yl = (e) => e * 2 - (e > 4 ? 9 : 0), Vr = (e) => {
	let r = e.length;
	for (; --r >= 0;) e[r] = 0;
}, X0 = (e) => {
	let r, t, n, i = e.w_size;
	r = e.hash_size, n = r;
	do
		t = e.head[--n], e.head[n] = t >= i ? t - i : 0;
	while (--r);
	r = i, n = r;
	do
		t = e.prev[--n], e.prev[n] = t >= i ? t - i : 0;
	while (--r);
}, Uo = (e, r, t) => (r << e.hash_shift ^ t) & e.hash_mask, Cn = (e, r) => {
	let t;
	if (e.legacy_hash) t = e.ins_h = Uo(e, e.ins_h, e.window[r + it - 1]);
	else {
		let i = e.window, a = i[r] | i[r + 1] << 8 | i[r + 2] << 16 | i[r + 3] << 24;
		t = e.ins_h = Math.imul(a, 66521) + 66521 >>> 16 & e.hash_mask;
	}
	let n = e.prev[r & e.w_mask] = e.head[t];
	return e.head[t] = r, n;
}, nr = (e) => {
	let r = e.state, t = r.pending;
	t > e.avail_out && (t = e.avail_out), t !== 0 && (e.output.set(r.pending_buf.subarray(r.pending_out, r.pending_out + t), e.next_out), e.next_out += t, r.pending_out += t, e.total_out += t, e.avail_out -= t, r.pending -= t, r.pending === 0 && (r.pending_out = 0));
}, ir = (e, r) => {
	B0(e, e.block_start >= 0 ? e.block_start : -1, e.strstart - e.block_start, r), e.block_start = e.strstart, nr(e.strm);
}, at = (e, r) => {
	e.pending_buf[e.pending++] = r;
}, Ui = (e, r) => {
	e.pending_buf[e.pending++] = r >>> 8 & 255, e.pending_buf[e.pending++] = r & 255;
}, Fo = (e, r, t, n) => {
	let i = e.avail_in;
	return i > n && (i = n), i === 0 ? 0 : (e.avail_in -= i, r.set(e.input.subarray(e.next_in, e.next_in + i), t), e.state.wrap === 1 ? e.adler = qi(e.adler, r, i, t) : e.state.wrap === 2 && (e.adler = Nt(e.adler, r, i, t)), e.next_in += i, e.total_in += i, i);
}, gh = (e, r) => {
	let t = e.max_chain_length, n = e.strstart, i, a, s = e.prev_length, u = e.nice_match, c = e.strstart > e.w_size - kr ? e.strstart - (e.w_size - kr) : 0, o = e.window, l = e.w_mask, d = e.prev, p = e.strstart + Xr, h = o[n + s - 1], A = o[n + s];
	e.prev_length >= e.good_match && (t >>= 2), u > e.lookahead && (u = e.lookahead);
	do
		if (i = r, !(o[i + s] !== A || o[i + s - 1] !== h || o[i] !== o[n] || o[++i] !== o[n + 1])) {
			n += 2, i++;
			do			;
while (o[++n] === o[++i] && o[++n] === o[++i] && o[++n] === o[++i] && o[++n] === o[++i] && o[++n] === o[++i] && o[++n] === o[++i] && o[++n] === o[++i] && o[++n] === o[++i] && n < p);
			if (a = Xr - (p - n), n = p - Xr, a > s) {
				if (e.match_start = r, s = a, a >= u) break;
				h = o[n + s - 1], A = o[n + s];
			}
		}
	while ((r = d[r & l]) > c && --t !== 0);
	return s <= e.lookahead ? s : e.lookahead;
}, $n = (e) => {
	let r = e.w_size, t, n, i;
	do {
		if (n = e.window_size - e.lookahead - e.strstart, e.strstart >= r + (r - kr) && (e.window.set(e.window.subarray(r, r + r - n), 0), e.match_start -= r, e.strstart -= r, e.block_start -= r, e.insert > e.strstart && (e.insert = e.strstart), X0(e), n += r), e.strm.avail_in === 0) break;
		if (t = Fo(e.strm, e.window, e.strstart + e.lookahead, n), e.lookahead += t, e.legacy_hash) {
			if (e.lookahead + e.insert >= it) for (i = e.strstart - e.insert, e.ins_h = e.window[i], e.ins_h = Uo(e, e.ins_h, e.window[i + 1]); e.insert && (Cn(e, i), i++, e.insert--, !(e.lookahead + e.insert < it)););
		} else if (e.lookahead + e.insert > it) for (i = e.strstart - e.insert; e.insert && (Cn(e, i), i++, e.insert--, !(e.lookahead + e.insert <= it)););
	} while (e.lookahead < kr && e.strm.avail_in !== 0);
}, mh = (e, r) => {
	let t = e.pending_buf_size - 5 > e.w_size ? e.w_size : e.pending_buf_size - 5, n, i, a, s = 0, u = e.strm.avail_in;
	do {
		if (n = 65535, a = e.bi_valid + 42 >> 3, e.strm.avail_out < a || (a = e.strm.avail_out - a, i = e.strstart - e.block_start, n > i + e.strm.avail_in && (n = i + e.strm.avail_in), n > a && (n = a), n < t && (n === 0 && r !== ur || r === tn || n !== i + e.strm.avail_in))) break;
		s = r === ur && n === i + e.strm.avail_in ? 1 : 0, ko(e, 0, 0, s), e.pending_buf[e.pending - 4] = n, e.pending_buf[e.pending - 3] = n >> 8, e.pending_buf[e.pending - 2] = ~n, e.pending_buf[e.pending - 1] = ~n >> 8, nr(e.strm), i && (i > n && (i = n), e.strm.output.set(e.window.subarray(e.block_start, e.block_start + i), e.strm.next_out), e.strm.next_out += i, e.strm.avail_out -= i, e.strm.total_out += i, e.block_start += i, n -= i), n && (Fo(e.strm, e.strm.output, e.strm.next_out, n), e.strm.next_out += n, e.strm.avail_out -= n, e.strm.total_out += n);
	} while (s === 0);
	return u -= e.strm.avail_in, u && (u >= e.w_size ? (e.matches = 2, e.window.set(e.strm.input.subarray(e.strm.next_in - e.w_size, e.strm.next_in), 0), e.strstart = e.w_size, e.insert = e.strstart) : (e.window_size - e.strstart <= u && (e.strstart -= e.w_size, e.window.set(e.window.subarray(e.w_size, e.w_size + e.strstart), 0), e.matches < 2 && e.matches++, e.insert > e.strstart && (e.insert = e.strstart)), e.window.set(e.strm.input.subarray(e.strm.next_in - u, e.strm.next_in), e.strstart), e.strstart += u, e.insert += u > e.w_size - e.insert ? e.w_size - e.insert : u), e.block_start = e.strstart), e.high_water < e.strstart && (e.high_water = e.strstart), s ? ei : r !== tn && r !== ur && e.strm.avail_in === 0 && e.strstart === e.block_start ? Xn : (a = e.window_size - e.strstart, e.strm.avail_in > a && e.block_start >= e.w_size && (e.block_start -= e.w_size, e.strstart -= e.w_size, e.window.set(e.window.subarray(e.w_size, e.w_size + e.strstart), 0), e.matches < 2 && e.matches++, a += e.w_size, e.insert > e.strstart && (e.insert = e.strstart)), a > e.strm.avail_in && (a = e.strm.avail_in), a && (Fo(e.strm, e.window, e.strstart, a), e.strstart += a, e.insert += a > e.w_size - e.insert ? e.w_size - e.insert : a), e.high_water < e.strstart && (e.high_water = e.strstart), a = e.bi_valid + 42 >> 3, a = e.pending_buf_size - a > 65535 ? 65535 : e.pending_buf_size - a, t = a > e.w_size ? e.w_size : a, i = e.strstart - e.block_start, (i >= t || (i || r === ur) && r !== tn && e.strm.avail_in === 0 && i <= a) && (n = i > a ? a : i, s = r === ur && e.strm.avail_in === 0 && n === i ? 1 : 0, ko(e, e.block_start, n, s), e.block_start += n, nr(e.strm)), s ? xn : Yt);
}, go = (e, r) => {
	let t, n;
	for (;;) {
		if (e.lookahead < kr) {
			if ($n(e), e.lookahead < kr && r === tn) return Yt;
			if (e.lookahead === 0) break;
		}
		if (t = 0, e.lookahead >= it && (t = Cn(e, e.strstart)), t !== 0 && e.strstart - t <= e.w_size - kr && (e.match_length = gh(e, t)), e.match_length >= it) if (n = en(e, e.strstart - e.match_start, e.match_length - it), e.lookahead -= e.match_length, e.match_length <= e.max_lazy_match && e.lookahead >= it) {
			e.match_length--;
			do
				e.strstart++, t = Cn(e, e.strstart);
			while (--e.match_length !== 0);
			e.strstart++;
		} else e.strstart += e.match_length, e.match_length = 0, e.legacy_hash && (e.ins_h = e.window[e.strstart], e.ins_h = Uo(e, e.ins_h, e.window[e.strstart + 1]));
		else n = en(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++;
		if (n && (ir(e, !1), e.strm.avail_out === 0)) return Yt;
	}
	return e.insert = e.strstart < it - 1 ? e.strstart : it - 1, r === ur ? (ir(e, !0), e.strm.avail_out === 0 ? xn : ei) : e.sym_next && (ir(e, !1), e.strm.avail_out === 0) ? Yt : Xn;
}, Qn = (e, r) => {
	let t, n, i;
	for (;;) {
		if (e.lookahead < kr) {
			if ($n(e), e.lookahead < kr && r === tn) return Yt;
			if (e.lookahead === 0) break;
		}
		if (t = 0, e.lookahead >= it && (t = Cn(e, e.strstart)), e.prev_length = e.match_length, e.prev_match = e.match_start, e.match_length = it - 1, t !== 0 && e.prev_length < e.max_lazy_match && e.strstart - t <= e.w_size - kr && (e.match_length = gh(e, t), e.match_length <= 5 && (e.strategy === P0 || e.match_length === it && e.strstart - e.match_start > 4096) && (e.match_length = it - 1)), e.prev_length >= it && e.match_length <= e.prev_length) {
			i = e.strstart + e.lookahead - it, n = en(e, e.strstart - 1 - e.prev_match, e.prev_length - it), e.lookahead -= e.prev_length - 1, e.prev_length -= 2;
			do
				++e.strstart <= i && (t = Cn(e, e.strstart));
			while (--e.prev_length !== 0);
			if (e.match_available = 0, e.match_length = it - 1, e.strstart++, n && (ir(e, !1), e.strm.avail_out === 0)) return Yt;
		} else if (e.match_available) {
			if (n = en(e, 0, e.window[e.strstart - 1]), n && ir(e, !1), e.strstart++, e.lookahead--, e.strm.avail_out === 0) return Yt;
		} else e.match_available = 1, e.strstart++, e.lookahead--;
	}
	return e.match_available && (n = en(e, 0, e.window[e.strstart - 1]), e.match_available = 0), e.insert = e.strstart < it - 1 ? e.strstart : it - 1, r === ur ? (ir(e, !0), e.strm.avail_out === 0 ? xn : ei) : e.sym_next && (ir(e, !1), e.strm.avail_out === 0) ? Yt : Xn;
}, eA = (e, r) => {
	let t, n, i, a, s = e.window;
	for (;;) {
		if (e.lookahead <= Xr) {
			if ($n(e), e.lookahead <= Xr && r === tn) return Yt;
			if (e.lookahead === 0) break;
		}
		if (e.match_length = 0, e.lookahead >= it && e.strstart > 0 && (i = e.strstart - 1, n = s[i], n === s[++i] && n === s[++i] && n === s[++i])) {
			a = e.strstart + Xr;
			do			;
while (n === s[++i] && n === s[++i] && n === s[++i] && n === s[++i] && n === s[++i] && n === s[++i] && n === s[++i] && n === s[++i] && i < a);
			e.match_length = Xr - (a - i), e.match_length > e.lookahead && (e.match_length = e.lookahead);
		}
		if (e.match_length >= it ? (t = en(e, 1, e.match_length - it), e.lookahead -= e.match_length, e.strstart += e.match_length, e.match_length = 0) : (t = en(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++), t && (ir(e, !1), e.strm.avail_out === 0)) return Yt;
	}
	return e.insert = 0, r === ur ? (ir(e, !0), e.strm.avail_out === 0 ? xn : ei) : e.sym_next && (ir(e, !1), e.strm.avail_out === 0) ? Yt : Xn;
}, tA = (e, r) => {
	let t;
	for (;;) {
		if (e.lookahead === 0 && ($n(e), e.lookahead === 0)) {
			if (r === tn) return Yt;
			break;
		}
		if (e.match_length = 0, t = en(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++, t && (ir(e, !1), e.strm.avail_out === 0)) return Yt;
	}
	return e.insert = 0, r === ur ? (ir(e, !0), e.strm.avail_out === 0 ? xn : ei) : e.sym_next && (ir(e, !1), e.strm.avail_out === 0) ? Yt : Xn;
};
function Er(e, r, t, n, i) {
	this.good_length = e, this.max_lazy = r, this.nice_length = t, this.max_chain = n, this.func = i;
}
var Hi = [
	new Er(0, 0, 0, 0, mh),
	new Er(4, 4, 8, 4, go),
	new Er(4, 5, 16, 8, go),
	new Er(4, 6, 32, 32, go),
	new Er(4, 4, 16, 16, Qn),
	new Er(8, 16, 32, 32, Qn),
	new Er(8, 16, 128, 128, Qn),
	new Er(8, 32, 128, 256, Qn),
	new Er(32, 128, 258, 1024, Qn),
	new Er(32, 258, 258, 4096, Qn)
];
var rA = (e) => {
	e.window_size = 2 * e.w_size, Vr(e.head), e.max_lazy_match = Hi[e.level].max_lazy, e.good_match = Hi[e.level].good_length, e.nice_match = Hi[e.level].nice_length, e.max_chain_length = Hi[e.level].max_chain, e.strstart = 0, e.block_start = 0, e.lookahead = 0, e.insert = 0, e.match_length = e.prev_length = it - 1, e.match_available = 0, e.ins_h = 0;
};
function nA() {
	this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = is, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.legacy_hash = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(q0 * 2), this.dyn_dtree = new Uint16Array((2 * K0 + 1) * 2), this.bl_tree = new Uint16Array((2 * j0 + 1) * 2), Vr(this.dyn_ltree), Vr(this.dyn_dtree), Vr(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array($0 + 1), this.heap = new Uint16Array(2 * Do + 1), Vr(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(2 * Do + 1), Vr(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
var Xi = (e) => {
	if (!e) return 1;
	let r = e.state;
	return !r || r.strm !== e || r.status !== qn && r.status !== Mo && r.status !== So && r.status !== To && r.status !== Bo && r.status !== No && r.status !== bn && r.status !== zi ? 1 : 0;
};
var _h = (e) => {
	if (Xi(e)) return yn(e, Ir);
	e.total_in = e.total_out = 0, e.data_type = H0;
	let r = e.state;
	return r.pending = 0, r.pending_out = 0, r.wrap < 0 && (r.wrap = -r.wrap), r.status = r.wrap === 2 ? Mo : r.wrap ? qn : bn, e.adler = r.wrap === 2 ? 0 : 1, r.last_flush = -2, T0(r), Ot;
};
var wh = (e) => {
	let r = _h(e);
	return r === Ot && rA(e.state), r;
};
var iA = (e, r) => Xi(e) || e.state.wrap !== 2 ? Ir : (e.state.gzhead = r, Ot);
var vh = (e, r, t, n, i, a, s) => {
	if (!e) return Ir;
	let u = 1;
	if (r === L0 && (r = 6), n < 0 ? (u = 0, n = -n) : n > 15 && (u = 2, n -= 16), i < 1 || i > Z0 || t !== is || n < 8 || n > 15 || r < 0 || r > 9 || a < 0 || a > U0 || n === 8 && u !== 1) return yn(e, Ir);
	n === 8 && (n = 9);
	let c = new nA();
	return e.state = c, c.strm = e, c.status = qn, c.wrap = u, c.gzhead = null, c.w_bits = n, c.w_size = 1 << c.w_bits, c.w_mask = c.w_size - 1, c.legacy_hash = s ? 1 : 0, c.hash_bits = i + 7, !c.legacy_hash && c.hash_bits < 15 && (c.hash_bits = 15), c.hash_size = 1 << c.hash_bits, c.hash_mask = c.hash_size - 1, c.hash_shift = ~~((c.hash_bits + it - 1) / it), c.window = new Uint8Array(c.w_size * 2), c.head = new Uint16Array(c.hash_size), c.prev = new Uint16Array(c.w_size), c.lit_bufsize = 1 << i + 6, c.pending_buf_size = c.lit_bufsize * 4, c.pending_buf = new Uint8Array(c.pending_buf_size), c.sym_buf = c.lit_bufsize, c.sym_end = (c.lit_bufsize - 1) * 3, c.level = r, c.strategy = a, c.method = t, wh(e);
};
var aA = (e, r) => vh(e, r, is, W0, G0, z0);
var sA = (e, r) => {
	if (Xi(e) || r > vl || r < 0) return e ? yn(e, Ir) : Ir;
	let t = e.state;
	if (!e.output || e.avail_in !== 0 && !e.input || t.status === zi && r !== ur) return yn(e, e.avail_out === 0 ? Ao : Ir);
	let n = t.last_flush;
	if (t.last_flush = r, t.pending !== 0) {
		if (nr(e), e.avail_out === 0) return t.last_flush = -1, Ot;
	} else if (e.avail_in === 0 && yl(r) <= yl(n) && r !== ur) return yn(e, Ao);
	if (t.status === zi && e.avail_in !== 0) return yn(e, Ao);
	if (t.status === qn && t.wrap === 0 && (t.status = bn), t.status === qn) {
		let i = is + (t.w_bits - 8 << 4) << 8, a = -1;
		if (t.strategy >= qa || t.level < 2 ? a = 0 : t.level < 6 ? a = 1 : t.level === 6 ? a = 2 : a = 3, i |= a << 6, t.strstart !== 0 && (i |= J0), i += 31 - i % 31, Ui(t, i), t.strstart !== 0 && (Ui(t, e.adler >>> 16), Ui(t, e.adler & 65535)), e.adler = 1, t.status = bn, nr(e), t.pending !== 0) return t.last_flush = -1, Ot;
	}
	if (t.status === Mo) {
		if (e.adler = 0, at(t, 31), at(t, 139), at(t, 8), t.gzhead) at(t, (t.gzhead.text ? 1 : 0) + (t.gzhead.hcrc ? 2 : 0) + (t.gzhead.extra ? 4 : 0) + (t.gzhead.name ? 8 : 0) + (t.gzhead.comment ? 16 : 0)), at(t, t.gzhead.time & 255), at(t, t.gzhead.time >> 8 & 255), at(t, t.gzhead.time >> 16 & 255), at(t, t.gzhead.time >> 24 & 255), at(t, t.level === 9 ? 2 : t.strategy >= qa || t.level < 2 ? 4 : 0), at(t, t.gzhead.os & 255), t.gzhead.extra && t.gzhead.extra.length && (at(t, t.gzhead.extra.length & 255), at(t, t.gzhead.extra.length >> 8 & 255)), t.gzhead.hcrc && (e.adler = Nt(e.adler, t.pending_buf, t.pending, 0)), t.gzindex = 0, t.status = So;
		else if (at(t, 0), at(t, 0), at(t, 0), at(t, 0), at(t, 0), at(t, t.level === 9 ? 2 : t.strategy >= qa || t.level < 2 ? 4 : 0), at(t, V0), t.status = bn, nr(e), t.pending !== 0) return t.last_flush = -1, Ot;
	}
	if (t.status === So) {
		if (t.gzhead.extra) {
			let i = t.pending, a = (t.gzhead.extra.length & 65535) - t.gzindex;
			for (; t.pending + a > t.pending_buf_size;) {
				let u = t.pending_buf_size - t.pending;
				if (t.pending_buf.set(t.gzhead.extra.subarray(t.gzindex, t.gzindex + u), t.pending), t.pending = t.pending_buf_size, t.gzhead.hcrc && t.pending > i && (e.adler = Nt(e.adler, t.pending_buf, t.pending - i, i)), t.gzindex += u, nr(e), t.pending !== 0) return t.last_flush = -1, Ot;
				i = 0, a -= u;
			}
			let s = new Uint8Array(t.gzhead.extra);
			t.pending_buf.set(s.subarray(t.gzindex, t.gzindex + a), t.pending), t.pending += a, t.gzhead.hcrc && t.pending > i && (e.adler = Nt(e.adler, t.pending_buf, t.pending - i, i)), t.gzindex = 0;
		}
		t.status = To;
	}
	if (t.status === To) {
		if (t.gzhead.name) {
			let i = t.pending, a;
			do {
				if (t.pending === t.pending_buf_size) {
					if (t.gzhead.hcrc && t.pending > i && (e.adler = Nt(e.adler, t.pending_buf, t.pending - i, i)), nr(e), t.pending !== 0) return t.last_flush = -1, Ot;
					i = 0;
				}
				t.gzindex < t.gzhead.name.length ? a = t.gzhead.name.charCodeAt(t.gzindex++) & 255 : a = 0, at(t, a);
			} while (a !== 0);
			t.gzhead.hcrc && t.pending > i && (e.adler = Nt(e.adler, t.pending_buf, t.pending - i, i)), t.gzindex = 0;
		}
		t.status = Bo;
	}
	if (t.status === Bo) {
		if (t.gzhead.comment) {
			let i = t.pending, a;
			do {
				if (t.pending === t.pending_buf_size) {
					if (t.gzhead.hcrc && t.pending > i && (e.adler = Nt(e.adler, t.pending_buf, t.pending - i, i)), nr(e), t.pending !== 0) return t.last_flush = -1, Ot;
					i = 0;
				}
				t.gzindex < t.gzhead.comment.length ? a = t.gzhead.comment.charCodeAt(t.gzindex++) & 255 : a = 0, at(t, a);
			} while (a !== 0);
			t.gzhead.hcrc && t.pending > i && (e.adler = Nt(e.adler, t.pending_buf, t.pending - i, i));
		}
		t.status = No;
	}
	if (t.status === No) {
		if (t.gzhead.hcrc) {
			if (t.pending + 2 > t.pending_buf_size && (nr(e), t.pending !== 0)) return t.last_flush = -1, Ot;
			at(t, e.adler & 255), at(t, e.adler >> 8 & 255), e.adler = 0;
		}
		if (t.status = bn, nr(e), t.pending !== 0) return t.last_flush = -1, Ot;
	}
	if (e.avail_in !== 0 || t.lookahead !== 0 || r !== tn && t.status !== zi) {
		let i = t.level === 0 ? mh(t, r) : t.strategy === qa ? tA(t, r) : t.strategy === M0 ? eA(t, r) : Hi[t.level].func(t, r);
		if ((i === xn || i === ei) && (t.status = zi), i === Yt || i === xn) return e.avail_out === 0 && (t.last_flush = -1), Ot;
		if (i === Xn && (r === F0 ? N0(t) : r !== vl && (ko(t, 0, 0, !1), r === R0 && (Vr(t.head), t.lookahead === 0 && (t.strstart = 0, t.block_start = 0, t.insert = 0))), nr(e), e.avail_out === 0)) return t.last_flush = -1, Ot;
	}
	return r !== ur ? Ot : t.wrap <= 0 ? bl : (t.wrap === 2 ? (at(t, e.adler & 255), at(t, e.adler >> 8 & 255), at(t, e.adler >> 16 & 255), at(t, e.adler >> 24 & 255), at(t, e.total_in & 255), at(t, e.total_in >> 8 & 255), at(t, e.total_in >> 16 & 255), at(t, e.total_in >> 24 & 255)) : (Ui(t, e.adler >>> 16), Ui(t, e.adler & 65535)), nr(e), t.wrap > 0 && (t.wrap = -t.wrap), t.pending !== 0 ? Ot : bl);
};
var oA = (e) => {
	if (Xi(e)) return Ir;
	let r = e.state.status;
	return e.state = null, r === bn ? yn(e, O0) : Ot;
};
var uA = (e, r) => {
	let t = r.length;
	if (Xi(e)) return Ir;
	let n = e.state, i = n.wrap;
	if (i === 2 || i === 1 && n.status !== qn || n.lookahead) return Ir;
	if (i === 1 && (e.adler = qi(e.adler, r, t, 0)), n.wrap = 0, t >= n.w_size) {
		i === 0 && (Vr(n.head), n.strstart = 0, n.block_start = 0, n.insert = 0);
		let c = new Uint8Array(n.w_size);
		c.set(r.subarray(t - n.w_size, t), 0), r = c, t = n.w_size;
	}
	let a = e.avail_in, s = e.next_in, u = e.input;
	for (e.avail_in = t, e.next_in = 0, e.input = r, $n(n); n.lookahead >= it;) {
		let c = n.strstart, o = n.lookahead - (it - 1);
		do
			Cn(n, c), c++;
		while (--o);
		n.strstart = c, n.lookahead = it - 1, $n(n);
	}
	return n.strstart += n.lookahead, n.block_start = n.strstart, n.insert = n.lookahead, n.lookahead = 0, n.match_length = n.prev_length = it - 1, n.match_available = 0, e.next_in = s, e.input = u, e.avail_in = a, n.wrap = i, Ot;
};
var Wi = {
	deflateInit: aA,
	deflateInit2: vh,
	deflateReset: wh,
	deflateResetKeep: _h,
	deflateSetHeader: iA,
	deflate: sA,
	deflateEnd: oA,
	deflateSetDictionary: uA,
	deflateInfo: "pako deflate (from Nodeca project)"
};
var _A = (e, r) => Object.prototype.hasOwnProperty.call(e, r);
var wA = function(e) {
	let r = Array.prototype.slice.call(arguments, 1);
	for (; r.length;) {
		let t = r.shift();
		if (t) {
			if (typeof t != "object") throw new TypeError(t + "must be non-object");
			for (let n in t) _A(t, n) && (e[n] = t[n]);
		}
	}
	return e;
};
var vA = (e) => {
	let r = 0;
	for (let n = 0, i = e.length; n < i; n++) r += e[n].length;
	let t = new Uint8Array(r);
	for (let n = 0, i = 0, a = e.length; n < a; n++) {
		let s = e[n];
		t.set(s, i), i += s.length;
	}
	return t;
};
var as = {
	assign: wA,
	flattenChunks: vA
};
var bh = !0;
try {
	String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1));
} catch (e) {
	bh = !1;
}
var $i = /* @__PURE__ */ new Uint8Array(256);
for (let e = 0; e < 256; e++) $i[e] = e >= 252 ? 6 : e >= 248 ? 5 : e >= 240 ? 4 : e >= 224 ? 3 : e >= 192 ? 2 : 1;
$i[254] = $i[255] = 1;
var bA = (e) => {
	if (typeof TextEncoder == "function" && TextEncoder.prototype.encode) return new TextEncoder().encode(e);
	let r, t, n, i, a, s = e.length, u = 0;
	for (i = 0; i < s; i++) t = e.charCodeAt(i), (t & 64512) === 55296 && i + 1 < s && (n = e.charCodeAt(i + 1), (n & 64512) === 56320 && (t = 65536 + (t - 55296 << 10) + (n - 56320), i++)), u += t < 128 ? 1 : t < 2048 ? 2 : t < 65536 ? 3 : 4;
	for (r = new Uint8Array(u), a = 0, i = 0; a < u; i++) t = e.charCodeAt(i), (t & 64512) === 55296 && i + 1 < s && (n = e.charCodeAt(i + 1), (n & 64512) === 56320 && (t = 65536 + (t - 55296 << 10) + (n - 56320), i++)), t < 128 ? r[a++] = t : t < 2048 ? (r[a++] = 192 | t >>> 6, r[a++] = 128 | t & 63) : t < 65536 ? (r[a++] = 224 | t >>> 12, r[a++] = 128 | t >>> 6 & 63, r[a++] = 128 | t & 63) : (r[a++] = 240 | t >>> 18, r[a++] = 128 | t >>> 12 & 63, r[a++] = 128 | t >>> 6 & 63, r[a++] = 128 | t & 63);
	return r;
};
var yA = (e, r) => {
	if (r < 65534 && e.subarray && bh) return String.fromCharCode.apply(null, e.length === r ? e : e.subarray(0, r));
	let t = "";
	for (let n = 0; n < r; n++) t += String.fromCharCode(e[n]);
	return t;
};
var EA = (e, r) => {
	let t = r || e.length;
	if (typeof TextDecoder == "function" && TextDecoder.prototype.decode) return new TextDecoder().decode(e.subarray(0, r));
	let n, i, a = new Array(t * 2);
	for (i = 0, n = 0; n < t;) {
		let s = e[n++];
		if (s < 128) {
			a[i++] = s;
			continue;
		}
		let u = $i[s];
		if (u > 4) {
			a[i++] = 65533, n += u - 1;
			continue;
		}
		for (s &= u === 2 ? 31 : u === 3 ? 15 : 7; u > 1 && n < t;) s = s << 6 | e[n++] & 63, u--;
		if (u > 1) {
			a[i++] = 65533;
			continue;
		}
		s < 65536 ? a[i++] = s : (s -= 65536, a[i++] = 55296 | s >> 10 & 1023, a[i++] = 56320 | s & 1023);
	}
	return yA(a, i);
};
var xA = (e, r) => {
	r = r || e.length, r > e.length && (r = e.length);
	let t = r - 1;
	for (; t >= 0 && (e[t] & 192) === 128;) t--;
	return t < 0 || t === 0 ? r : t + $i[e[t]] > r ? t : r;
};
var Ji = {
	string2buf: bA,
	buf2string: EA,
	utf8border: xA
};
function CA() {
	this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var yh = CA, Eh = Object.prototype.toString, { Z_NO_FLUSH: IA, Z_SYNC_FLUSH: kA, Z_FULL_FLUSH: DA, Z_FINISH: SA, Z_OK: rs, Z_STREAM_END: TA, Z_DEFAULT_COMPRESSION: BA, Z_DEFAULT_STRATEGY: NA, Z_DEFLATED: FA } = Vn, RA = {
	level: BA,
	method: FA,
	chunkSize: 16384,
	windowBits: 15,
	memLevel: 8,
	strategy: NA,
	legacyHash: !0
};
function ea(e) {
	this.options = as.assign({}, RA, e || {});
	let r = this.options;
	r.raw && r.windowBits > 0 ? r.windowBits = -r.windowBits : r.gzip && r.windowBits > 0 && r.windowBits < 16 && (r.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new yh(), this.strm.avail_out = 0;
	let t = Wi.deflateInit2(this.strm, r.level, r.method, r.windowBits, r.memLevel, r.strategy, r.legacyHash);
	if (t !== rs) throw new Error(En[t]);
	if (r.header && Wi.deflateSetHeader(this.strm, r.header), r.dictionary) {
		let n;
		if (typeof r.dictionary == "string" ? n = Ji.string2buf(r.dictionary) : Eh.call(r.dictionary) === "[object ArrayBuffer]" ? n = new Uint8Array(r.dictionary) : n = r.dictionary, t = Wi.deflateSetDictionary(this.strm, n), t !== rs) throw new Error(En[t]);
		this._dict_set = !0;
	}
}
ea.prototype.push = function(e, r) {
	let t = this.strm, n = this.options.chunkSize, i, a;
	if (this.ended) return !1;
	for (r === ~~r ? a = r : a = r === !0 ? SA : IA, typeof e == "string" ? t.input = Ji.string2buf(e) : Eh.call(e) === "[object ArrayBuffer]" ? t.input = new Uint8Array(e) : t.input = e, t.next_in = 0, t.avail_in = t.input.length;;) {
		if (t.avail_out === 0 && (t.output = new Uint8Array(n), t.next_out = 0, t.avail_out = n), (a === kA || a === DA) && t.avail_out <= 6) {
			this.onData(t.output.subarray(0, t.next_out)), t.avail_out = 0;
			continue;
		}
		if (i = Wi.deflate(t, a), i === TA) return t.next_out > 0 && this.onData(t.output.subarray(0, t.next_out)), i = Wi.deflateEnd(this.strm), this.onEnd(i), this.ended = !0, i === rs;
		if (t.avail_out === 0) {
			this.onData(t.output);
			continue;
		}
		if (a > 0 && t.next_out > 0) {
			this.onData(t.output.subarray(0, t.next_out)), t.avail_out = 0;
			continue;
		}
		if (t.avail_in === 0) break;
	}
	return !0;
};
ea.prototype.onData = function(e) {
	this.chunks.push(e);
};
ea.prototype.onEnd = function(e) {
	e === rs && (this.result = as.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
};
function zo(e, r) {
	let t = new ea(r);
	if (t.push(e, !0), t.err) throw t.msg || En[t.err];
	return t.result;
}
function OA(e, r) {
	return r = r || {}, r.raw = !0, zo(e, r);
}
function LA(e, r) {
	return r = r || {}, r.gzip = !0, zo(e, r);
}
var ZA = {
	Deflate: ea,
	deflate: zo,
	deflateRaw: OA,
	gzip: LA,
	constants: Vn
}, $a = 16209, WA = 16191, GA = function(r, t) {
	let n, i, a, s, u, c, o, l, d, p, h, A, f, g, _, v, b, C, T, ee, x, G, O, k, H = r.state;
	n = r.next_in, O = r.input, i = n + (r.avail_in - 5), a = r.next_out, k = r.output, s = a - (t - r.avail_out), u = a + (r.avail_out - 257), c = H.dmax, o = H.wsize, l = H.whave, d = H.wnext, p = H.window, h = H.hold, A = H.bits, f = H.lencode, g = H.distcode, _ = (1 << H.lenbits) - 1, v = (1 << H.distbits) - 1;
	e: do {
		A < 15 && (h += O[n++] << A, A += 8, h += O[n++] << A, A += 8), b = f[h & _];
		t: for (;;) {
			if (C = b >>> 24, h >>>= C, A -= C, C = b >>> 16 & 255, C === 0) k[a++] = b & 65535;
			else if (C & 16) {
				T = b & 65535, C &= 15, C && (A < C && (h += O[n++] << A, A += 8), T += h & (1 << C) - 1, h >>>= C, A -= C), A < 15 && (h += O[n++] << A, A += 8, h += O[n++] << A, A += 8), b = g[h & v];
				r: for (;;) {
					if (C = b >>> 24, h >>>= C, A -= C, C = b >>> 16 & 255, C & 16) {
						if (ee = b & 65535, C &= 15, A < C && (h += O[n++] << A, A += 8, A < C && (h += O[n++] << A, A += 8)), ee += h & (1 << C) - 1, ee > c) {
							r.msg = "invalid distance too far back", H.mode = $a;
							break e;
						}
						if (h >>>= C, A -= C, C = a - s, ee > C) {
							if (C = ee - C, C > l && H.sane) {
								r.msg = "invalid distance too far back", H.mode = $a;
								break e;
							}
							if (x = 0, G = p, d === 0) {
								if (x += o - C, C < T) {
									T -= C;
									do
										k[a++] = p[x++];
									while (--C);
									x = a - ee, G = k;
								}
							} else if (d < C) {
								if (x += o + d - C, C -= d, C < T) {
									T -= C;
									do
										k[a++] = p[x++];
									while (--C);
									if (x = 0, d < T) {
										C = d, T -= C;
										do
											k[a++] = p[x++];
										while (--C);
										x = a - ee, G = k;
									}
								}
							} else if (x += d - C, C < T) {
								T -= C;
								do
									k[a++] = p[x++];
								while (--C);
								x = a - ee, G = k;
							}
							for (; T > 2;) k[a++] = G[x++], k[a++] = G[x++], k[a++] = G[x++], T -= 3;
							T && (k[a++] = G[x++], T > 1 && (k[a++] = G[x++]));
						} else {
							x = a - ee;
							do
								k[a++] = k[x++], k[a++] = k[x++], k[a++] = k[x++], T -= 3;
							while (T > 2);
							T && (k[a++] = k[x++], T > 1 && (k[a++] = k[x++]));
						}
					} else if ((C & 64) === 0) {
						b = g[(b & 65535) + (h & (1 << C) - 1)];
						continue r;
					} else {
						r.msg = "invalid distance code", H.mode = $a;
						break e;
					}
					break;
				}
			} else if ((C & 64) === 0) {
				b = f[(b & 65535) + (h & (1 << C) - 1)];
				continue t;
			} else if (C & 32) {
				H.mode = WA;
				break e;
			} else {
				r.msg = "invalid literal/length code", H.mode = $a;
				break e;
			}
			break;
		}
	} while (n < i && a < u);
	T = A >> 3, n -= T, A -= T << 3, h &= (1 << A) - 1, r.next_in = n, r.next_out = a, r.avail_in = n < i ? 5 + (i - n) : 5 - (n - i), r.avail_out = a < u ? 257 + (u - a) : 257 - (a - u), H.hold = h, H.bits = A;
}, Yn = 15, El = 852, xl = 592, Cl = 0, mo = 1, Il = 2, QA = new Uint16Array([
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
]), YA = new Uint8Array([
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
	199,
	75
]), KA = new Uint16Array([
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
]), jA = new Uint8Array([
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
]), qA = (e, r, t, n, i, a, s, u) => {
	let c = u.bits, o = 0, l = 0, d = 0, p = 0, h = 0, A = 0, f = 0, g = 0, _ = 0, v = 0, b, C, T, ee, x, G = null, O, k = new Uint16Array(Yn + 1), H = new Uint16Array(Yn + 1), m = null, V, y, ie;
	for (o = 0; o <= Yn; o++) k[o] = 0;
	for (l = 0; l < n; l++) k[r[t + l]]++;
	for (h = c, p = Yn; p >= 1 && k[p] === 0; p--);
	if (h > p && (h = p), p === 0) return i[a++] = 20971520, i[a++] = 20971520, u.bits = 1, 0;
	for (d = 1; d < p && k[d] === 0; d++);
	for (h < d && (h = d), g = 1, o = 1; o <= Yn; o++) if (g <<= 1, g -= k[o], g < 0) return -1;
	if (g > 0 && (e === Cl || p !== 1)) return -1;
	for (H[1] = 0, o = 1; o < Yn; o++) H[o + 1] = H[o] + k[o];
	for (l = 0; l < n; l++) r[t + l] !== 0 && (s[H[r[t + l]]++] = l);
	if (e === Cl ? (G = m = s, O = 20) : e === mo ? (G = QA, m = YA, O = 257) : (G = KA, m = jA, O = 0), v = 0, l = 0, o = d, x = a, A = h, f = 0, T = -1, _ = 1 << h, ee = _ - 1, e === mo && _ > El || e === Il && _ > xl) return 1;
	for (;;) {
		V = o - f, s[l] + 1 < O ? (y = 0, ie = s[l]) : s[l] >= O ? (y = m[s[l] - O], ie = G[s[l] - O]) : (y = 96, ie = 0), b = 1 << o - f, C = 1 << A, d = C;
		do
			C -= b, i[x + (v >> f) + C] = V << 24 | y << 16 | ie | 0;
		while (C !== 0);
		for (b = 1 << o - 1; v & b;) b >>= 1;
		if (b !== 0 ? (v &= b - 1, v += b) : v = 0, l++, --k[o] === 0) {
			if (o === p) break;
			o = r[t + s[l]];
		}
		if (o > h && (v & ee) !== T) {
			for (f === 0 && (f = h), x += d, A = o - f, g = 1 << A; A + f < p && (g -= k[A + f], !(g <= 0));) A++, g <<= 1;
			if (_ += 1 << A, e === mo && _ > El || e === Il && _ > xl) return 1;
			T = v & ee, i[T] = h << 24 | A << 16 | x - a | 0;
		}
	}
	return v !== 0 && (i[x + v] = o - f << 24 | 4194304), u.bits = h, 0;
}, Gi = qA, $A = 0, xh = 1, Ch = 2, { Z_FINISH: kl, Z_BLOCK: JA, Z_TREES: Ja, Z_OK: In, Z_STREAM_END: VA, Z_NEED_DICT: XA, Z_STREAM_ERROR: lr, Z_DATA_ERROR: Ih, Z_MEM_ERROR: kh, Z_BUF_ERROR: eg, Z_DEFLATED: Dl } = Vn, ss = 16180, Sl = 16181, Tl = 16182, Bl = 16183, Nl = 16184, Fl = 16185, Rl = 16186, Ol = 16187, Ll = 16188, Pl = 16189, ns = 16190, zr = 16191, _o = 16192, Ml = 16193, wo = 16194, Ul = 16195, zl = 16196, Hl = 16197, Zl = 16198, Va = 16199, Xa = 16200, Wl = 16201, Gl = 16202, Ql = 16203, Yl = 16204, Kl = 16205, vo = 16206, jl = 16207, ql = 16208, gt = 16209, Dh = 16210, Sh = 16211, tg = 852, rg = 592, ig = 15, $l = (e) => (e >>> 24 & 255) + (e >>> 8 & 65280) + ((e & 65280) << 8) + ((e & 255) << 24);
function ag() {
	this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = /* @__PURE__ */ new Uint16Array(320), this.work = /* @__PURE__ */ new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
var kn = (e) => {
	if (!e) return 1;
	let r = e.state;
	return !r || r.strm !== e || r.mode < ss || r.mode > Sh ? 1 : 0;
};
var Th = (e) => {
	if (kn(e)) return lr;
	let r = e.state;
	return e.total_in = e.total_out = r.total = 0, e.msg = "", r.wrap && (e.adler = r.wrap & 1), r.mode = ss, r.last = 0, r.havedict = 0, r.flags = -1, r.dmax = 32768, r.head = null, r.hold = 0, r.bits = 0, r.lencode = r.lendyn = new Int32Array(tg), r.distcode = r.distdyn = new Int32Array(rg), r.sane = 1, r.back = -1, In;
};
var Bh = (e) => {
	if (kn(e)) return lr;
	let r = e.state;
	return r.wsize = 0, r.whave = 0, r.wnext = 0, Th(e);
};
var Nh = (e, r) => {
	let t;
	if (kn(e)) return lr;
	let n = e.state;
	return r < 0 ? (t = 0, r = -r) : (t = (r >> 4) + 5, r < 48 && (r &= 15)), r && (r < 8 || r > 15) ? lr : (n.window !== null && n.wbits !== r && (n.window = null), n.wrap = t, n.wbits = r, Bh(e));
};
var Fh = (e, r) => {
	if (!e) return lr;
	let t = new ag();
	e.state = t, t.strm = e, t.window = null, t.mode = ss;
	let n = Nh(e, r);
	return n !== In && (e.state = null), n;
};
var sg = (e) => Fh(e, ig);
var Jl = !0;
var bo;
var yo;
var og = (e) => {
	if (Jl) {
		bo = /* @__PURE__ */ new Int32Array(512), yo = /* @__PURE__ */ new Int32Array(32);
		let r = 0;
		for (; r < 144;) e.lens[r++] = 8;
		for (; r < 256;) e.lens[r++] = 9;
		for (; r < 280;) e.lens[r++] = 7;
		for (; r < 288;) e.lens[r++] = 8;
		for (Gi(xh, e.lens, 0, 288, bo, 0, e.work, { bits: 9 }), r = 0; r < 32;) e.lens[r++] = 5;
		Gi(Ch, e.lens, 0, 32, yo, 0, e.work, { bits: 5 }), Jl = !1;
	}
	e.lencode = bo, e.lenbits = 9, e.distcode = yo, e.distbits = 5;
};
var Rh = (e, r, t, n) => {
	let i, a = e.state;
	return a.window === null && (a.window = new Uint8Array(1 << a.wbits)), a.wsize === 0 && (a.wsize = 1 << a.wbits, a.wnext = 0, a.whave = 0), n >= a.wsize ? (a.window.set(r.subarray(t - a.wsize, t), 0), a.wnext = 0, a.whave = a.wsize) : (i = a.wsize - a.wnext, i > n && (i = n), a.window.set(r.subarray(t - n, t - n + i), a.wnext), n -= i, n ? (a.window.set(r.subarray(t - n, t), 0), a.wnext = n, a.whave = a.wsize) : (a.wnext += i, a.wnext === a.wsize && (a.wnext = 0), a.whave < a.wsize && (a.whave += i))), 0;
};
var ug = (e, r) => {
	let t, n, i, a, s, u, c, o, l, d, p, h, A, f, g = 0, _, v, b, C, T, ee, x, G, O = /* @__PURE__ */ new Uint8Array(4), k, H, m = new Uint8Array([
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
	]);
	if (kn(e) || !e.output || !e.input && e.avail_in !== 0) return lr;
	t = e.state, t.mode === zr && (t.mode = _o), s = e.next_out, i = e.output, c = e.avail_out, a = e.next_in, n = e.input, u = e.avail_in, o = t.hold, l = t.bits, d = u, p = c, G = In;
	e: for (;;) switch (t.mode) {
		case ss:
			if (t.wrap === 0) {
				t.mode = _o;
				break;
			}
			for (; l < 16;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			if (t.wrap & 2 && o === 35615) {
				t.wbits === 0 && (t.wbits = 15), t.check = 0, O[0] = o & 255, O[1] = o >>> 8 & 255, t.check = Nt(t.check, O, 2, 0), o = 0, l = 0, t.mode = Sl;
				break;
			}
			if (t.head && (t.head.done = !1), !(t.wrap & 1) || (((o & 255) << 8) + (o >> 8)) % 31) {
				e.msg = "incorrect header check", t.mode = gt;
				break;
			}
			if ((o & 15) !== Dl) {
				e.msg = "unknown compression method", t.mode = gt;
				break;
			}
			if (o >>>= 4, l -= 4, x = (o & 15) + 8, t.wbits === 0 && (t.wbits = x), x > 15 || x > t.wbits) {
				e.msg = "invalid window size", t.mode = gt;
				break;
			}
			t.dmax = 1 << t.wbits, t.flags = 0, e.adler = t.check = 1, t.mode = o & 512 ? Pl : zr, o = 0, l = 0;
			break;
		case Sl:
			for (; l < 16;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			if (t.flags = o, (t.flags & 255) !== Dl) {
				e.msg = "unknown compression method", t.mode = gt;
				break;
			}
			if (t.flags & 57344) {
				e.msg = "unknown header flags set", t.mode = gt;
				break;
			}
			t.head && (t.head.text = o >> 8 & 1), t.flags & 512 && t.wrap & 4 && (O[0] = o & 255, O[1] = o >>> 8 & 255, t.check = Nt(t.check, O, 2, 0)), o = 0, l = 0, t.mode = Tl;
		case Tl:
			for (; l < 32;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			t.head && (t.head.time = o), t.flags & 512 && t.wrap & 4 && (O[0] = o & 255, O[1] = o >>> 8 & 255, O[2] = o >>> 16 & 255, O[3] = o >>> 24 & 255, t.check = Nt(t.check, O, 4, 0)), o = 0, l = 0, t.mode = Bl;
		case Bl:
			for (; l < 16;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			t.head && (t.head.xflags = o & 255, t.head.os = o >> 8), t.flags & 512 && t.wrap & 4 && (O[0] = o & 255, O[1] = o >>> 8 & 255, t.check = Nt(t.check, O, 2, 0)), o = 0, l = 0, t.mode = Nl;
		case Nl:
			if (t.flags & 1024) {
				for (; l < 16;) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				t.length = o, t.head && (t.head.extra_len = o), t.flags & 512 && t.wrap & 4 && (O[0] = o & 255, O[1] = o >>> 8 & 255, t.check = Nt(t.check, O, 2, 0)), o = 0, l = 0;
			} else t.head && (t.head.extra = null);
			t.mode = Fl;
		case Fl:
			if (t.flags & 1024 && (h = t.length, h > u && (h = u), h && (t.head && (x = t.head.extra_len - t.length, t.head.extra || (t.head.extra = new Uint8Array(t.head.extra_len)), t.head.extra.set(n.subarray(a, a + h), x)), t.flags & 512 && t.wrap & 4 && (t.check = Nt(t.check, n, h, a)), u -= h, a += h, t.length -= h), t.length)) break e;
			t.length = 0, t.mode = Rl;
		case Rl:
			if (t.flags & 2048) {
				if (u === 0) break e;
				h = 0;
				do
					x = n[a + h++], t.head && x && t.length < 65536 && (t.head.name += String.fromCharCode(x));
				while (x && h < u);
				if (t.flags & 512 && t.wrap & 4 && (t.check = Nt(t.check, n, h, a)), u -= h, a += h, x) break e;
			} else t.head && (t.head.name = null);
			t.length = 0, t.mode = Ol;
		case Ol:
			if (t.flags & 4096) {
				if (u === 0) break e;
				h = 0;
				do
					x = n[a + h++], t.head && x && t.length < 65536 && (t.head.comment += String.fromCharCode(x));
				while (x && h < u);
				if (t.flags & 512 && t.wrap & 4 && (t.check = Nt(t.check, n, h, a)), u -= h, a += h, x) break e;
			} else t.head && (t.head.comment = null);
			t.mode = Ll;
		case Ll:
			if (t.flags & 512) {
				for (; l < 16;) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				if (t.wrap & 4 && o !== (t.check & 65535)) {
					e.msg = "header crc mismatch", t.mode = gt;
					break;
				}
				o = 0, l = 0;
			}
			t.head && (t.head.hcrc = t.flags >> 9 & 1, t.head.done = !0), e.adler = t.check = 0, t.mode = zr;
			break;
		case Pl:
			for (; l < 32;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			e.adler = t.check = $l(o), o = 0, l = 0, t.mode = ns;
		case ns:
			if (t.havedict === 0) return e.next_out = s, e.avail_out = c, e.next_in = a, e.avail_in = u, t.hold = o, t.bits = l, XA;
			e.adler = t.check = 1, t.mode = zr;
		case zr: if (r === JA || r === Ja) break e;
		case _o:
			if (t.last) {
				o >>>= l & 7, l -= l & 7, t.mode = vo;
				break;
			}
			for (; l < 3;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			switch (t.last = o & 1, o >>>= 1, l -= 1, o & 3) {
				case 0:
					t.mode = Ml;
					break;
				case 1:
					if (og(t), t.mode = Va, r === Ja) {
						o >>>= 2, l -= 2;
						break e;
					}
					break;
				case 2:
					t.mode = zl;
					break;
				case 3: e.msg = "invalid block type", t.mode = gt;
			}
			o >>>= 2, l -= 2;
			break;
		case Ml:
			for (o >>>= l & 7, l -= l & 7; l < 32;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			if ((o & 65535) !== (o >>> 16 ^ 65535)) {
				e.msg = "invalid stored block lengths", t.mode = gt;
				break;
			}
			if (t.length = o & 65535, o = 0, l = 0, t.mode = wo, r === Ja) break e;
		case wo: t.mode = Ul;
		case Ul:
			if (h = t.length, h) {
				if (h > u && (h = u), h > c && (h = c), h === 0) break e;
				i.set(n.subarray(a, a + h), s), u -= h, a += h, c -= h, s += h, t.length -= h;
				break;
			}
			t.mode = zr;
			break;
		case zl:
			for (; l < 14;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			if (t.nlen = (o & 31) + 257, o >>>= 5, l -= 5, t.ndist = (o & 31) + 1, o >>>= 5, l -= 5, t.ncode = (o & 15) + 4, o >>>= 4, l -= 4, t.nlen > 286 || t.ndist > 30) {
				e.msg = "too many length or distance symbols", t.mode = gt;
				break;
			}
			t.have = 0, t.mode = Hl;
		case Hl:
			for (; t.have < t.ncode;) {
				for (; l < 3;) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				t.lens[m[t.have++]] = o & 7, o >>>= 3, l -= 3;
			}
			for (; t.have < 19;) t.lens[m[t.have++]] = 0;
			if (t.lencode = t.lendyn, t.lenbits = 7, k = { bits: t.lenbits }, G = Gi($A, t.lens, 0, 19, t.lencode, 0, t.work, k), t.lenbits = k.bits, G) {
				e.msg = "invalid code lengths set", t.mode = gt;
				break;
			}
			t.have = 0, t.mode = Zl;
		case Zl:
			for (; t.have < t.nlen + t.ndist;) {
				for (; g = t.lencode[o & (1 << t.lenbits) - 1], _ = g >>> 24, v = g >>> 16 & 255, b = g & 65535, !(_ <= l);) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				if (b < 16) o >>>= _, l -= _, t.lens[t.have++] = b;
				else {
					if (b === 16) {
						for (H = _ + 2; l < H;) {
							if (u === 0) break e;
							u--, o += n[a++] << l, l += 8;
						}
						if (o >>>= _, l -= _, t.have === 0) {
							e.msg = "invalid bit length repeat", t.mode = gt;
							break;
						}
						x = t.lens[t.have - 1], h = 3 + (o & 3), o >>>= 2, l -= 2;
					} else if (b === 17) {
						for (H = _ + 3; l < H;) {
							if (u === 0) break e;
							u--, o += n[a++] << l, l += 8;
						}
						o >>>= _, l -= _, x = 0, h = 3 + (o & 7), o >>>= 3, l -= 3;
					} else {
						for (H = _ + 7; l < H;) {
							if (u === 0) break e;
							u--, o += n[a++] << l, l += 8;
						}
						o >>>= _, l -= _, x = 0, h = 11 + (o & 127), o >>>= 7, l -= 7;
					}
					if (t.have + h > t.nlen + t.ndist) {
						e.msg = "invalid bit length repeat", t.mode = gt;
						break;
					}
					for (; h--;) t.lens[t.have++] = x;
				}
			}
			if (t.mode === gt) break;
			if (t.lens[256] === 0) {
				e.msg = "invalid code -- missing end-of-block", t.mode = gt;
				break;
			}
			if (t.lenbits = 9, k = { bits: t.lenbits }, G = Gi(xh, t.lens, 0, t.nlen, t.lencode, 0, t.work, k), t.lenbits = k.bits, G) {
				e.msg = "invalid literal/lengths set", t.mode = gt;
				break;
			}
			if (t.distbits = 6, t.distcode = t.distdyn, k = { bits: t.distbits }, G = Gi(Ch, t.lens, t.nlen, t.ndist, t.distcode, 0, t.work, k), t.distbits = k.bits, G) {
				e.msg = "invalid distances set", t.mode = gt;
				break;
			}
			if (t.mode = Va, r === Ja) break e;
		case Va: t.mode = Xa;
		case Xa:
			if (u >= 6 && c >= 258) {
				e.next_out = s, e.avail_out = c, e.next_in = a, e.avail_in = u, t.hold = o, t.bits = l, GA(e, p), s = e.next_out, i = e.output, c = e.avail_out, a = e.next_in, n = e.input, u = e.avail_in, o = t.hold, l = t.bits, t.mode === zr && (t.back = -1);
				break;
			}
			for (t.back = 0; g = t.lencode[o & (1 << t.lenbits) - 1], _ = g >>> 24, v = g >>> 16 & 255, b = g & 65535, !(_ <= l);) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			if (v && (v & 240) === 0) {
				for (C = _, T = v, ee = b; g = t.lencode[ee + ((o & (1 << C + T) - 1) >> C)], _ = g >>> 24, v = g >>> 16 & 255, b = g & 65535, !(C + _ <= l);) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				o >>>= C, l -= C, t.back += C;
			}
			if (o >>>= _, l -= _, t.back += _, t.length = b, v === 0) {
				t.mode = Kl;
				break;
			}
			if (v & 32) {
				t.back = -1, t.mode = zr;
				break;
			}
			if (v & 64) {
				e.msg = "invalid literal/length code", t.mode = gt;
				break;
			}
			t.extra = v & 15, t.mode = Wl;
		case Wl:
			if (t.extra) {
				for (H = t.extra; l < H;) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				t.length += o & (1 << t.extra) - 1, o >>>= t.extra, l -= t.extra, t.back += t.extra;
			}
			t.was = t.length, t.mode = Gl;
		case Gl:
			for (; g = t.distcode[o & (1 << t.distbits) - 1], _ = g >>> 24, v = g >>> 16 & 255, b = g & 65535, !(_ <= l);) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			if ((v & 240) === 0) {
				for (C = _, T = v, ee = b; g = t.distcode[ee + ((o & (1 << C + T) - 1) >> C)], _ = g >>> 24, v = g >>> 16 & 255, b = g & 65535, !(C + _ <= l);) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				o >>>= C, l -= C, t.back += C;
			}
			if (o >>>= _, l -= _, t.back += _, v & 64) {
				e.msg = "invalid distance code", t.mode = gt;
				break;
			}
			t.offset = b, t.extra = v & 15, t.mode = Ql;
		case Ql:
			if (t.extra) {
				for (H = t.extra; l < H;) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				t.offset += o & (1 << t.extra) - 1, o >>>= t.extra, l -= t.extra, t.back += t.extra;
			}
			if (t.offset > t.dmax) {
				e.msg = "invalid distance too far back", t.mode = gt;
				break;
			}
			t.mode = Yl;
		case Yl:
			if (c === 0) break e;
			if (h = p - c, t.offset > h) {
				if (h = t.offset - h, h > t.whave && t.sane) {
					e.msg = "invalid distance too far back", t.mode = gt;
					break;
				}
				h > t.wnext ? (h -= t.wnext, A = t.wsize - h) : A = t.wnext - h, h > t.length && (h = t.length), f = t.window;
			} else f = i, A = s - t.offset, h = t.length;
			h > c && (h = c), c -= h, t.length -= h;
			do
				i[s++] = f[A++];
			while (--h);
			t.length === 0 && (t.mode = Xa);
			break;
		case Kl:
			if (c === 0) break e;
			i[s++] = t.length, c--, t.mode = Xa;
			break;
		case vo:
			if (t.wrap) {
				for (; l < 32;) {
					if (u === 0) break e;
					u--, o |= n[a++] << l, l += 8;
				}
				if (p -= c, e.total_out += p, t.total += p, t.wrap & 4 && p && (e.adler = t.check = t.flags ? Nt(t.check, i, p, s - p) : qi(t.check, i, p, s - p)), p = c, t.wrap & 4 && (t.flags ? o : $l(o)) !== t.check) {
					e.msg = "incorrect data check", t.mode = gt;
					break;
				}
				o = 0, l = 0;
			}
			t.mode = jl;
		case jl:
			if (t.wrap && t.flags) {
				for (; l < 32;) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				if (t.wrap & 4 && o !== (t.total & 4294967295)) {
					e.msg = "incorrect length check", t.mode = gt;
					break;
				}
				o = 0, l = 0;
			}
			t.mode = ql;
		case ql:
			G = VA;
			break e;
		case gt:
			G = Ih;
			break e;
		case Dh: return kh;
		case Sh:
		default: return lr;
	}
	return e.next_out = s, e.avail_out = c, e.next_in = a, e.avail_in = u, t.hold = o, t.bits = l, (t.wsize || p !== e.avail_out && t.mode < gt && (t.mode < vo || r !== kl)) && Rh(e, e.output, e.next_out, p - e.avail_out), d -= e.avail_in, p -= e.avail_out, e.total_in += d, e.total_out += p, t.total += p, t.wrap & 4 && p && (e.adler = t.check = t.flags ? Nt(t.check, i, p, e.next_out - p) : qi(t.check, i, p, e.next_out - p)), e.data_type = t.bits + (t.last ? 64 : 0) + (t.mode === zr ? 128 : 0) + (t.mode === Va || t.mode === wo ? 256 : 0), (d === 0 && p === 0 || r === kl) && G === In && (G = eg), G;
};
var lg = (e) => {
	if (kn(e)) return lr;
	let r = e.state;
	return r.window && (r.window = null), e.state = null, In;
};
var hg = (e, r) => {
	if (kn(e)) return lr;
	let t = e.state;
	return (t.wrap & 2) === 0 ? lr : (t.head = r, r.done = !1, In);
};
var cg = (e, r) => {
	let t = r.length, n, i, a;
	return kn(e) || (n = e.state, n.wrap !== 0 && n.mode !== ns) ? lr : n.mode === ns && (i = 1, i = qi(i, r, t, 0), i !== n.check) ? Ih : (a = Rh(e, r, t, t), a ? (n.mode = Dh, kh) : (n.havedict = 1, In));
};
var xr = {
	inflateReset: Bh,
	inflateReset2: Nh,
	inflateResetKeep: Th,
	inflateInit: sg,
	inflateInit2: Fh,
	inflate: ug,
	inflateEnd: lg,
	inflateGetHeader: hg,
	inflateSetDictionary: cg,
	inflateInfo: "pako inflate (from Nodeca project)"
};
function yg() {
	this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var Eg = yg, Oh = Object.prototype.toString, { Z_NO_FLUSH: xg, Z_FINISH: Vl, Z_OK: jn, Z_STREAM_END: Eo, Z_NEED_DICT: xo, Z_STREAM_ERROR: Cg, Z_DATA_ERROR: Xl, Z_MEM_ERROR: Ig, Z_BUF_ERROR: eh } = Vn, kg = {
	chunkSize: 65536,
	windowBits: 15,
	to: ""
};
function ta(e) {
	this.options = as.assign({}, kg, e || {});
	let r = this.options;
	r.raw && r.windowBits >= 0 && r.windowBits < 16 && (r.windowBits = -r.windowBits, r.windowBits === 0 && (r.windowBits = -15)), r.windowBits >= 0 && r.windowBits < 16 && !(e && e.windowBits) && (r.windowBits += 32), r.windowBits > 15 && r.windowBits < 48 && !(r.windowBits & 15) && (r.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new yh(), this.strm.avail_out = 0;
	let t = xr.inflateInit2(this.strm, r.windowBits);
	if (t !== jn) throw new Error(En[t]);
	if (this.header = new Eg(), xr.inflateGetHeader(this.strm, this.header), r.dictionary && (typeof r.dictionary == "string" ? r.dictionary = Ji.string2buf(r.dictionary) : Oh.call(r.dictionary) === "[object ArrayBuffer]" && (r.dictionary = new Uint8Array(r.dictionary)), r.raw && (t = xr.inflateSetDictionary(this.strm, r.dictionary), t !== jn))) throw new Error(En[t]);
}
ta.prototype.push = function(e, r) {
	let t = this.strm, n = this.options.chunkSize, i = this.options.dictionary, a, s, u;
	if (this.ended) return !1;
	for (r === ~~r ? s = r : s = r === !0 ? Vl : xg, Oh.call(e) === "[object ArrayBuffer]" ? t.input = new Uint8Array(e) : t.input = e, t.next_in = 0, t.avail_in = t.input.length;;) {
		for (t.avail_out === 0 && (t.output = new Uint8Array(n), t.next_out = 0, t.avail_out = n), a = xr.inflate(t, s), a === xo && i && (a = xr.inflateSetDictionary(t, i), a === jn ? a = xr.inflate(t, s) : a === Xl && (a = xo)); t.avail_in > 0 && a === Eo && t.state.wrap & 2 && t.state.flags !== 0 && t.input[t.next_in] !== 0;) xr.inflateReset(t), a = xr.inflate(t, s);
		switch (a) {
			case Cg:
			case Xl:
			case xo:
			case Ig: return this.onEnd(a), this.ended = !0, !1;
		}
		if (u = t.avail_out, t.next_out && (t.avail_out === 0 || a === Eo || s > 0)) if (this.options.to === "string") {
			let c = Ji.utf8border(t.output, t.next_out), o = t.next_out - c, l = Ji.buf2string(t.output, c);
			t.next_out = o, t.avail_out = n - o, o && t.output.set(t.output.subarray(c, c + o), 0), this.onData(l);
		} else this.onData(t.output.length === t.next_out ? t.output : t.output.subarray(0, t.next_out)), t.avail_out = 0, t.next_out = 0;
		if (!((a === jn || a === eh) && u === 0)) {
			if (a === Eo) return a = xr.inflateEnd(this.strm), this.onEnd(a), this.ended = !0, !0;
			if (t.avail_in === 0) {
				if (s === Vl) return a = xr.inflateEnd(this.strm), this.onEnd(a === jn ? eh : a), this.ended = !0, !1;
				break;
			}
		}
	}
	return !0;
};
ta.prototype.onData = function(e) {
	this.chunks.push(e);
};
ta.prototype.onEnd = function(e) {
	e === jn && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = as.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
};
function Ho(e, r) {
	let t = new ta(r);
	if (t.push(e, !0), t.err) throw t.msg || En[t.err];
	return t.result;
}
function Dg(e, r) {
	return r = r || {}, r.raw = !0, Ho(e, r);
}
var Rg = {
	Inflate: ta,
	inflate: Ho,
	inflateRaw: Dg,
	ungzip: Ho,
	constants: Vn
}, { Deflate: By, deflate: Ny, deflateRaw: Fy, gzip: Ry } = ZA, { Inflate: Oy, inflate: Ly, inflateRaw: Og, ungzip: Py } = Rg;
var Lh = Og;
var Up = uo(Hc(), 1);
var Rm = Object.create;
var Ma = Object.defineProperty;
var Om = Object.getOwnPropertyDescriptor;
var Mu = Object.getOwnPropertyNames;
var Lm = Object.getPrototypeOf;
var Pm = Object.prototype.hasOwnProperty;
var Mm = (e, r, t) => r in e ? Ma(e, r, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: t
}) : e[r] = t;
var Ea = ((e) => typeof $t != "undefined" ? $t : typeof Proxy != "undefined" ? new Proxy(e, { get: (r, t) => (typeof $t != "undefined" ? $t : r)[t] }) : e)(function(e) {
	if (typeof $t != "undefined") return $t.apply(this, arguments);
	throw Error("Dynamic require of \"" + e + "\" is not supported");
});
var Um = (e, r) => function() {
	return e && (r = (0, e[Mu(e)[0]])(e = 0)), r;
};
var jf = (e, r) => function() {
	return r || (0, e[Mu(e)[0]])((r = { exports: {} }).exports, r), r.exports;
};
var zm = (e, r) => {
	for (var t in r) Ma(e, t, {
		get: r[t],
		enumerable: !0
	});
};
var qf = (e, r, t, n) => {
	if (r && typeof r == "object" || typeof r == "function") for (let i of Mu(r)) !Pm.call(e, i) && i !== t && Ma(e, i, {
		get: () => r[i],
		enumerable: !(n = Om(r, i)) || n.enumerable
	});
	return e;
};
var Ws = (e, r, t) => (t = e != null ? Rm(Lm(e)) : {}, qf(r || !e || !e.__esModule ? Ma(t, "default", {
	value: e,
	enumerable: !0
}) : t, e));
var Hm = (e) => qf(Ma({}, "__esModule", { value: !0 }), e);
var ot = (e, r, t) => Mm(e, typeof r != "symbol" ? r + "" : r, t);
var Uu = jf({ "node_modules/jszip/dist/jszip.min.js"(e, r) {
	(function(t) {
		typeof e == "object" && typeof r != "undefined" ? r.exports = t() : typeof define == "function" && define.amd ? define([], t) : (typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : this).JSZip = t();
	})(function() {
		return (function t(n, i, a) {
			function s(o, l) {
				if (!i[o]) {
					if (!n[o]) {
						var d = typeof Ea == "function" && Ea;
						if (!l && d) return d(o, !0);
						if (u) return u(o, !0);
						var p = /* @__PURE__ */ new Error("Cannot find module '" + o + "'");
						throw p.code = "MODULE_NOT_FOUND", p;
					}
					var h = i[o] = { exports: {} };
					n[o][0].call(h.exports, function(A) {
						var f = n[o][1][A];
						return s(f || A);
					}, h, h.exports, t, n, i, a);
				}
				return i[o].exports;
			}
			for (var u = typeof Ea == "function" && Ea, c = 0; c < a.length; c++) s(a[c]);
			return s;
		})({
			1: [function(t, n, i) {
				"use strict";
				var a = t("./utils"), s = t("./support"), u = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
				i.encode = function(c) {
					for (var o, l, d, p, h, A, f, g = [], _ = 0, v = c.length, b = v, C = a.getTypeOf(c) !== "string"; _ < c.length;) b = v - _, d = C ? (o = c[_++], l = _ < v ? c[_++] : 0, _ < v ? c[_++] : 0) : (o = c.charCodeAt(_++), l = _ < v ? c.charCodeAt(_++) : 0, _ < v ? c.charCodeAt(_++) : 0), p = o >> 2, h = (3 & o) << 4 | l >> 4, A = 1 < b ? (15 & l) << 2 | d >> 6 : 64, f = 2 < b ? 63 & d : 64, g.push(u.charAt(p) + u.charAt(h) + u.charAt(A) + u.charAt(f));
					return g.join("");
				}, i.decode = function(c) {
					var o, l, d, p, h, A, f = 0, g = 0, _ = "data:";
					if (c.substr(0, _.length) === _) throw new Error("Invalid base64 input, it looks like a data url.");
					var v, b = 3 * (c = c.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
					if (c.charAt(c.length - 1) === u.charAt(64) && b--, c.charAt(c.length - 2) === u.charAt(64) && b--, b % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
					for (v = s.uint8array ? new Uint8Array(0 | b) : new Array(0 | b); f < c.length;) o = u.indexOf(c.charAt(f++)) << 2 | (p = u.indexOf(c.charAt(f++))) >> 4, l = (15 & p) << 4 | (h = u.indexOf(c.charAt(f++))) >> 2, d = (3 & h) << 6 | (A = u.indexOf(c.charAt(f++))), v[g++] = o, h !== 64 && (v[g++] = l), A !== 64 && (v[g++] = d);
					return v;
				};
			}, {
				"./support": 30,
				"./utils": 32
			}],
			2: [function(t, n, i) {
				"use strict";
				var a = t("./external"), s = t("./stream/DataWorker"), u = t("./stream/Crc32Probe"), c = t("./stream/DataLengthProbe");
				function o(l, d, p, h, A) {
					this.compressedSize = l, this.uncompressedSize = d, this.crc32 = p, this.compression = h, this.compressedContent = A;
				}
				o.prototype = {
					getContentWorker: function() {
						var l = new s(a.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new c("data_length")), d = this;
						return l.on("end", function() {
							if (this.streamInfo.data_length !== d.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
						}), l;
					},
					getCompressedWorker: function() {
						return new s(a.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
					}
				}, o.createWorkerFrom = function(l, d, p) {
					return l.pipe(new u()).pipe(new c("uncompressedSize")).pipe(d.compressWorker(p)).pipe(new c("compressedSize")).withStreamInfo("compression", d);
				}, n.exports = o;
			}, {
				"./external": 6,
				"./stream/Crc32Probe": 25,
				"./stream/DataLengthProbe": 26,
				"./stream/DataWorker": 27
			}],
			3: [function(t, n, i) {
				"use strict";
				var a = t("./stream/GenericWorker");
				i.STORE = {
					magic: "\0\0",
					compressWorker: function() {
						return new a("STORE compression");
					},
					uncompressWorker: function() {
						return new a("STORE decompression");
					}
				}, i.DEFLATE = t("./flate");
			}, {
				"./flate": 7,
				"./stream/GenericWorker": 28
			}],
			4: [function(t, n, i) {
				"use strict";
				var a = t("./utils"), s = (function() {
					for (var u, c = [], o = 0; o < 256; o++) {
						u = o;
						for (var l = 0; l < 8; l++) u = 1 & u ? 3988292384 ^ u >>> 1 : u >>> 1;
						c[o] = u;
					}
					return c;
				})();
				n.exports = function(u, c) {
					return u !== void 0 && u.length ? a.getTypeOf(u) !== "string" ? (function(o, l, d, p) {
						var h = s, A = p + d;
						o ^= -1;
						for (var f = p; f < A; f++) o = o >>> 8 ^ h[255 & (o ^ l[f])];
						return -1 ^ o;
					})(0 | c, u, u.length, 0) : (function(o, l, d, p) {
						var h = s, A = p + d;
						o ^= -1;
						for (var f = p; f < A; f++) o = o >>> 8 ^ h[255 & (o ^ l.charCodeAt(f))];
						return -1 ^ o;
					})(0 | c, u, u.length, 0) : 0;
				};
			}, { "./utils": 32 }],
			5: [function(t, n, i) {
				"use strict";
				i.base64 = !1, i.binary = !1, i.dir = !1, i.createFolders = !0, i.date = null, i.compression = null, i.compressionOptions = null, i.comment = null, i.unixPermissions = null, i.dosPermissions = null;
			}, {}],
			6: [function(t, n, i) {
				"use strict";
				var a = null;
				a = typeof Promise != "undefined" ? Promise : t("lie"), n.exports = { Promise: a };
			}, { lie: 37 }],
			7: [function(t, n, i) {
				"use strict";
				var a = typeof Uint8Array != "undefined" && typeof Uint16Array != "undefined" && typeof Uint32Array != "undefined", s = t("pako"), u = t("./utils"), c = t("./stream/GenericWorker"), o = a ? "uint8array" : "array";
				function l(d, p) {
					c.call(this, "FlateWorker/" + d), this._pako = null, this._pakoAction = d, this._pakoOptions = p, this.meta = {};
				}
				i.magic = "\b\0", u.inherits(l, c), l.prototype.processChunk = function(d) {
					this.meta = d.meta, this._pako === null && this._createPako(), this._pako.push(u.transformTo(o, d.data), !1);
				}, l.prototype.flush = function() {
					c.prototype.flush.call(this), this._pako === null && this._createPako(), this._pako.push([], !0);
				}, l.prototype.cleanUp = function() {
					c.prototype.cleanUp.call(this), this._pako = null;
				}, l.prototype._createPako = function() {
					this._pako = new s[this._pakoAction]({
						raw: !0,
						level: this._pakoOptions.level || -1
					});
					var d = this;
					this._pako.onData = function(p) {
						d.push({
							data: p,
							meta: d.meta
						});
					};
				}, i.compressWorker = function(d) {
					return new l("Deflate", d);
				}, i.uncompressWorker = function() {
					return new l("Inflate", {});
				};
			}, {
				"./stream/GenericWorker": 28,
				"./utils": 32,
				pako: 38
			}],
			8: [function(t, n, i) {
				"use strict";
				function a(h, A) {
					var f, g = "";
					for (f = 0; f < A; f++) g += String.fromCharCode(255 & h), h >>>= 8;
					return g;
				}
				function s(h, A, f, g, _, v) {
					var b, C, T = h.file, ee = h.compression, x = v !== o.utf8encode, G = u.transformTo("string", v(T.name)), O = u.transformTo("string", o.utf8encode(T.name)), k = T.comment, H = u.transformTo("string", v(k)), m = u.transformTo("string", o.utf8encode(k)), V = O.length !== T.name.length, y = m.length !== k.length, ie = "", xe = "", se = "", ae = T.dir, R = T.date, W = {
						crc32: 0,
						compressedSize: 0,
						uncompressedSize: 0
					};
					A && !f || (W.crc32 = h.crc32, W.compressedSize = h.compressedSize, W.uncompressedSize = h.uncompressedSize);
					var q = 0;
					A && (q |= 8), x || !V && !y || (q |= 2048);
					var Z = 0, ge = 0;
					ae && (Z |= 16), _ === "UNIX" ? (ge = 798, Z |= (function(ye, Ne) {
						var Oe = ye;
						return ye || (Oe = Ne ? 16893 : 33204), (65535 & Oe) << 16;
					})(T.unixPermissions, ae)) : (ge = 20, Z |= (function(ye) {
						return 63 & (ye || 0);
					})(T.dosPermissions)), b = R.getUTCHours(), b <<= 6, b |= R.getUTCMinutes(), b <<= 5, b |= R.getUTCSeconds() / 2, C = R.getUTCFullYear() - 1980, C <<= 4, C |= R.getUTCMonth() + 1, C <<= 5, C |= R.getUTCDate(), V && (xe = a(1, 1) + a(l(G), 4) + O, ie += "up" + a(xe.length, 2) + xe), y && (se = a(1, 1) + a(l(H), 4) + m, ie += "uc" + a(se.length, 2) + se);
					var Ee = "";
					return Ee += `
\0`, Ee += a(q, 2), Ee += ee.magic, Ee += a(b, 2), Ee += a(C, 2), Ee += a(W.crc32, 4), Ee += a(W.compressedSize, 4), Ee += a(W.uncompressedSize, 4), Ee += a(G.length, 2), Ee += a(ie.length, 2), {
						fileRecord: d.LOCAL_FILE_HEADER + Ee + G + ie,
						dirRecord: d.CENTRAL_FILE_HEADER + a(ge, 2) + Ee + a(H.length, 2) + "\0\0\0\0" + a(Z, 4) + a(g, 4) + G + ie + H
					};
				}
				var u = t("../utils"), c = t("../stream/GenericWorker"), o = t("../utf8"), l = t("../crc32"), d = t("../signature");
				function p(h, A, f, g) {
					c.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = A, this.zipPlatform = f, this.encodeFileName = g, this.streamFiles = h, this.accumulate = !1, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
				}
				u.inherits(p, c), p.prototype.push = function(h) {
					var A = h.meta.percent || 0, f = this.entriesCount, g = this._sources.length;
					this.accumulate ? this.contentBuffer.push(h) : (this.bytesWritten += h.data.length, c.prototype.push.call(this, {
						data: h.data,
						meta: {
							currentFile: this.currentFile,
							percent: f ? (A + 100 * (f - g - 1)) / f : 100
						}
					}));
				}, p.prototype.openedSource = function(h) {
					this.currentSourceOffset = this.bytesWritten, this.currentFile = h.file.name;
					var A = this.streamFiles && !h.file.dir;
					if (A) {
						var f = s(h, A, !1, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
						this.push({
							data: f.fileRecord,
							meta: { percent: 0 }
						});
					} else this.accumulate = !0;
				}, p.prototype.closedSource = function(h) {
					this.accumulate = !1;
					var A = this.streamFiles && !h.file.dir, f = s(h, A, !0, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
					if (this.dirRecords.push(f.dirRecord), A) this.push({
						data: (function(g) {
							return d.DATA_DESCRIPTOR + a(g.crc32, 4) + a(g.compressedSize, 4) + a(g.uncompressedSize, 4);
						})(h),
						meta: { percent: 100 }
					});
					else for (this.push({
						data: f.fileRecord,
						meta: { percent: 0 }
					}); this.contentBuffer.length;) this.push(this.contentBuffer.shift());
					this.currentFile = null;
				}, p.prototype.flush = function() {
					for (var h = this.bytesWritten, A = 0; A < this.dirRecords.length; A++) this.push({
						data: this.dirRecords[A],
						meta: { percent: 100 }
					});
					var f = this.bytesWritten - h, g = (function(_, v, b, C, T) {
						var ee = u.transformTo("string", T(C));
						return d.CENTRAL_DIRECTORY_END + "\0\0\0\0" + a(_, 2) + a(_, 2) + a(v, 4) + a(b, 4) + a(ee.length, 2) + ee;
					})(this.dirRecords.length, f, h, this.zipComment, this.encodeFileName);
					this.push({
						data: g,
						meta: { percent: 100 }
					});
				}, p.prototype.prepareNextSource = function() {
					this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
				}, p.prototype.registerPrevious = function(h) {
					this._sources.push(h);
					var A = this;
					return h.on("data", function(f) {
						A.processChunk(f);
					}), h.on("end", function() {
						A.closedSource(A.previous.streamInfo), A._sources.length ? A.prepareNextSource() : A.end();
					}), h.on("error", function(f) {
						A.error(f);
					}), this;
				}, p.prototype.resume = function() {
					return !!c.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), !0) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), !0));
				}, p.prototype.error = function(h) {
					var A = this._sources;
					if (!c.prototype.error.call(this, h)) return !1;
					for (var f = 0; f < A.length; f++) try {
						A[f].error(h);
					} catch (g) {}
					return !0;
				}, p.prototype.lock = function() {
					c.prototype.lock.call(this);
					for (var h = this._sources, A = 0; A < h.length; A++) h[A].lock();
				}, n.exports = p;
			}, {
				"../crc32": 4,
				"../signature": 23,
				"../stream/GenericWorker": 28,
				"../utf8": 31,
				"../utils": 32
			}],
			9: [function(t, n, i) {
				"use strict";
				var a = t("../compressions"), s = t("./ZipFileWorker");
				i.generateWorker = function(u, c, o) {
					var l = new s(c.streamFiles, o, c.platform, c.encodeFileName), d = 0;
					try {
						u.forEach(function(p, h) {
							d++;
							var A = (function(v, b) {
								var C = v || b, T = a[C];
								if (!T) throw new Error(C + " is not a valid compression method !");
								return T;
							})(h.options.compression, c.compression), f = h.options.compressionOptions || c.compressionOptions || {}, g = h.dir, _ = h.date;
							h._compressWorker(A, f).withStreamInfo("file", {
								name: p,
								dir: g,
								date: _,
								comment: h.comment || "",
								unixPermissions: h.unixPermissions,
								dosPermissions: h.dosPermissions
							}).pipe(l);
						}), l.entriesCount = d;
					} catch (p) {
						l.error(p);
					}
					return l;
				};
			}, {
				"../compressions": 3,
				"./ZipFileWorker": 8
			}],
			10: [function(t, n, i) {
				"use strict";
				function a() {
					if (!(this instanceof a)) return new a();
					if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
					this.files = Object.create(null), this.comment = null, this.root = "", this.clone = function() {
						var s = new a();
						for (var u in this) typeof this[u] != "function" && (s[u] = this[u]);
						return s;
					};
				}
				(a.prototype = t("./object")).loadAsync = t("./load"), a.support = t("./support"), a.defaults = t("./defaults"), a.version = "3.10.1", a.loadAsync = function(s, u) {
					return new a().loadAsync(s, u);
				}, a.external = t("./external"), n.exports = a;
			}, {
				"./defaults": 5,
				"./external": 6,
				"./load": 11,
				"./object": 15,
				"./support": 30
			}],
			11: [function(t, n, i) {
				"use strict";
				var a = t("./utils"), s = t("./external"), u = t("./utf8"), c = t("./zipEntries"), o = t("./stream/Crc32Probe"), l = t("./nodejsUtils");
				function d(p) {
					return new s.Promise(function(h, A) {
						var f = p.decompressed.getContentWorker().pipe(new o());
						f.on("error", function(g) {
							A(g);
						}).on("end", function() {
							f.streamInfo.crc32 !== p.decompressed.crc32 ? A(/* @__PURE__ */ new Error("Corrupted zip : CRC32 mismatch")) : h();
						}).resume();
					});
				}
				n.exports = function(p, h) {
					var A = this;
					return h = a.extend(h || {}, {
						base64: !1,
						checkCRC32: !1,
						optimizedBinaryString: !1,
						createFolders: !1,
						decodeFileName: u.utf8decode
					}), l.isNode && l.isStream(p) ? s.Promise.reject(/* @__PURE__ */ new Error("JSZip can't accept a stream when loading a zip file.")) : a.prepareContent("the loaded zip file", p, !0, h.optimizedBinaryString, h.base64).then(function(f) {
						var g = new c(h);
						return g.load(f), g;
					}).then(function(f) {
						var g = [s.Promise.resolve(f)], _ = f.files;
						if (h.checkCRC32) for (var v = 0; v < _.length; v++) g.push(d(_[v]));
						return s.Promise.all(g);
					}).then(function(f) {
						for (var g = f.shift(), _ = g.files, v = 0; v < _.length; v++) {
							var b = _[v], C = b.fileNameStr, T = a.resolve(b.fileNameStr);
							A.file(T, b.decompressed, {
								binary: !0,
								optimizedBinaryString: !0,
								date: b.date,
								dir: b.dir,
								comment: b.fileCommentStr.length ? b.fileCommentStr : null,
								unixPermissions: b.unixPermissions,
								dosPermissions: b.dosPermissions,
								createFolders: h.createFolders
							}), b.dir || (A.file(T).unsafeOriginalName = C);
						}
						return g.zipComment.length && (A.comment = g.zipComment), A;
					});
				};
			}, {
				"./external": 6,
				"./nodejsUtils": 14,
				"./stream/Crc32Probe": 25,
				"./utf8": 31,
				"./utils": 32,
				"./zipEntries": 33
			}],
			12: [function(t, n, i) {
				"use strict";
				var a = t("../utils"), s = t("../stream/GenericWorker");
				function u(c, o) {
					s.call(this, "Nodejs stream input adapter for " + c), this._upstreamEnded = !1, this._bindStream(o);
				}
				a.inherits(u, s), u.prototype._bindStream = function(c) {
					var o = this;
					(this._stream = c).pause(), c.on("data", function(l) {
						o.push({
							data: l,
							meta: { percent: 0 }
						});
					}).on("error", function(l) {
						o.isPaused ? this.generatedError = l : o.error(l);
					}).on("end", function() {
						o.isPaused ? o._upstreamEnded = !0 : o.end();
					});
				}, u.prototype.pause = function() {
					return !!s.prototype.pause.call(this) && (this._stream.pause(), !0);
				}, u.prototype.resume = function() {
					return !!s.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), !0);
				}, n.exports = u;
			}, {
				"../stream/GenericWorker": 28,
				"../utils": 32
			}],
			13: [function(t, n, i) {
				"use strict";
				var a = t("readable-stream").Readable;
				function s(u, c, o) {
					a.call(this, c), this._helper = u;
					var l = this;
					u.on("data", function(d, p) {
						l.push(d) || l._helper.pause(), o && o(p);
					}).on("error", function(d) {
						l.emit("error", d);
					}).on("end", function() {
						l.push(null);
					});
				}
				t("../utils").inherits(s, a), s.prototype._read = function() {
					this._helper.resume();
				}, n.exports = s;
			}, {
				"../utils": 32,
				"readable-stream": 16
			}],
			14: [function(t, n, i) {
				"use strict";
				n.exports = {
					isNode: typeof Buffer != "undefined",
					newBufferFrom: function(a, s) {
						if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(a, s);
						if (typeof a == "number") throw new Error("The \"data\" argument must not be a number");
						return new Buffer(a, s);
					},
					allocBuffer: function(a) {
						if (Buffer.alloc) return Buffer.alloc(a);
						var s = new Buffer(a);
						return s.fill(0), s;
					},
					isBuffer: function(a) {
						return Buffer.isBuffer(a);
					},
					isStream: function(a) {
						return a && typeof a.on == "function" && typeof a.pause == "function" && typeof a.resume == "function";
					}
				};
			}, {}],
			15: [function(t, n, i) {
				"use strict";
				function a(T, ee, x) {
					var G, O = u.getTypeOf(ee), k = u.extend(x || {}, l);
					k.date = k.date || /* @__PURE__ */ new Date(), k.compression !== null && (k.compression = k.compression.toUpperCase()), typeof k.unixPermissions == "string" && (k.unixPermissions = parseInt(k.unixPermissions, 8)), k.unixPermissions && 16384 & k.unixPermissions && (k.dir = !0), k.dosPermissions && 16 & k.dosPermissions && (k.dir = !0), k.dir && (T = _(T)), k.createFolders && (G = g(T)) && v.call(this, G, !0);
					var H = O === "string" && k.binary === !1 && k.base64 === !1;
					x && x.binary !== void 0 || (k.binary = !H), (ee instanceof d && ee.uncompressedSize === 0 || k.dir || !ee || ee.length === 0) && (k.base64 = !1, k.binary = !0, ee = "", k.compression = "STORE", O = "string");
					var m = null;
					m = ee instanceof d || ee instanceof c ? ee : A.isNode && A.isStream(ee) ? new f(T, ee) : u.prepareContent(T, ee, k.binary, k.optimizedBinaryString, k.base64);
					var V = new p(T, m, k);
					this.files[T] = V;
				}
				var s = t("./utf8"), u = t("./utils"), c = t("./stream/GenericWorker"), o = t("./stream/StreamHelper"), l = t("./defaults"), d = t("./compressedObject"), p = t("./zipObject"), h = t("./generate"), A = t("./nodejsUtils"), f = t("./nodejs/NodejsStreamInputAdapter"), g = function(T) {
					T.slice(-1) === "/" && (T = T.substring(0, T.length - 1));
					var ee = T.lastIndexOf("/");
					return 0 < ee ? T.substring(0, ee) : "";
				}, _ = function(T) {
					return T.slice(-1) !== "/" && (T += "/"), T;
				}, v = function(T, ee) {
					return ee = ee !== void 0 ? ee : l.createFolders, T = _(T), this.files[T] || a.call(this, T, null, {
						dir: !0,
						createFolders: ee
					}), this.files[T];
				};
				function b(T) {
					return Object.prototype.toString.call(T) === "[object RegExp]";
				}
				n.exports = {
					load: function() {
						throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
					},
					forEach: function(T) {
						var ee, x, G;
						for (ee in this.files) G = this.files[ee], (x = ee.slice(this.root.length, ee.length)) && ee.slice(0, this.root.length) === this.root && T(x, G);
					},
					filter: function(T) {
						var ee = [];
						return this.forEach(function(x, G) {
							T(x, G) && ee.push(G);
						}), ee;
					},
					file: function(T, ee, x) {
						if (arguments.length !== 1) return T = this.root + T, a.call(this, T, ee, x), this;
						if (b(T)) {
							var G = T;
							return this.filter(function(k, H) {
								return !H.dir && G.test(k);
							});
						}
						var O = this.files[this.root + T];
						return O && !O.dir ? O : null;
					},
					folder: function(T) {
						if (!T) return this;
						if (b(T)) return this.filter(function(O, k) {
							return k.dir && T.test(O);
						});
						var ee = this.root + T, x = v.call(this, ee), G = this.clone();
						return G.root = x.name, G;
					},
					remove: function(T) {
						T = this.root + T;
						var ee = this.files[T];
						if (ee || (T.slice(-1) !== "/" && (T += "/"), ee = this.files[T]), ee && !ee.dir) delete this.files[T];
						else for (var x = this.filter(function(O, k) {
							return k.name.slice(0, T.length) === T;
						}), G = 0; G < x.length; G++) delete this.files[x[G].name];
						return this;
					},
					generate: function() {
						throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
					},
					generateInternalStream: function(T) {
						var ee, x = {};
						try {
							if ((x = u.extend(T || {}, {
								streamFiles: !1,
								compression: "STORE",
								compressionOptions: null,
								type: "",
								platform: "DOS",
								comment: null,
								mimeType: "application/zip",
								encodeFileName: s.utf8encode
							})).type = x.type.toLowerCase(), x.compression = x.compression.toUpperCase(), x.type === "binarystring" && (x.type = "string"), !x.type) throw new Error("No output type specified.");
							u.checkSupport(x.type), x.platform !== "darwin" && x.platform !== "freebsd" && x.platform !== "linux" && x.platform !== "sunos" || (x.platform = "UNIX"), x.platform === "win32" && (x.platform = "DOS");
							var G = x.comment || this.comment || "";
							ee = h.generateWorker(this, x, G);
						} catch (O) {
							(ee = new c("error")).error(O);
						}
						return new o(ee, x.type || "string", x.mimeType);
					},
					generateAsync: function(T, ee) {
						return this.generateInternalStream(T).accumulate(ee);
					},
					generateNodeStream: function(T, ee) {
						return (T = T || {}).type || (T.type = "nodebuffer"), this.generateInternalStream(T).toNodejsStream(ee);
					}
				};
			}, {
				"./compressedObject": 2,
				"./defaults": 5,
				"./generate": 9,
				"./nodejs/NodejsStreamInputAdapter": 12,
				"./nodejsUtils": 14,
				"./stream/GenericWorker": 28,
				"./stream/StreamHelper": 29,
				"./utf8": 31,
				"./utils": 32,
				"./zipObject": 35
			}],
			16: [function(t, n, i) {
				"use strict";
				n.exports = t("stream");
			}, { stream: void 0 }],
			17: [function(t, n, i) {
				"use strict";
				var a = t("./DataReader");
				function s(u) {
					a.call(this, u);
					for (var c = 0; c < this.data.length; c++) u[c] = 255 & u[c];
				}
				t("../utils").inherits(s, a), s.prototype.byteAt = function(u) {
					return this.data[this.zero + u];
				}, s.prototype.lastIndexOfSignature = function(u) {
					for (var c = u.charCodeAt(0), o = u.charCodeAt(1), l = u.charCodeAt(2), d = u.charCodeAt(3), p = this.length - 4; 0 <= p; --p) if (this.data[p] === c && this.data[p + 1] === o && this.data[p + 2] === l && this.data[p + 3] === d) return p - this.zero;
					return -1;
				}, s.prototype.readAndCheckSignature = function(u) {
					var c = u.charCodeAt(0), o = u.charCodeAt(1), l = u.charCodeAt(2), d = u.charCodeAt(3), p = this.readData(4);
					return c === p[0] && o === p[1] && l === p[2] && d === p[3];
				}, s.prototype.readData = function(u) {
					if (this.checkOffset(u), u === 0) return [];
					var c = this.data.slice(this.zero + this.index, this.zero + this.index + u);
					return this.index += u, c;
				}, n.exports = s;
			}, {
				"../utils": 32,
				"./DataReader": 18
			}],
			18: [function(t, n, i) {
				"use strict";
				var a = t("../utils");
				function s(u) {
					this.data = u, this.length = u.length, this.index = 0, this.zero = 0;
				}
				s.prototype = {
					checkOffset: function(u) {
						this.checkIndex(this.index + u);
					},
					checkIndex: function(u) {
						if (this.length < this.zero + u || u < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + u + "). Corrupted zip ?");
					},
					setIndex: function(u) {
						this.checkIndex(u), this.index = u;
					},
					skip: function(u) {
						this.setIndex(this.index + u);
					},
					byteAt: function() {},
					readInt: function(u) {
						var c, o = 0;
						for (this.checkOffset(u), c = this.index + u - 1; c >= this.index; c--) o = (o << 8) + this.byteAt(c);
						return this.index += u, o;
					},
					readString: function(u) {
						return a.transformTo("string", this.readData(u));
					},
					readData: function() {},
					lastIndexOfSignature: function() {},
					readAndCheckSignature: function() {},
					readDate: function() {
						var u = this.readInt(4);
						return new Date(Date.UTC(1980 + (u >> 25 & 127), (u >> 21 & 15) - 1, u >> 16 & 31, u >> 11 & 31, u >> 5 & 63, (31 & u) << 1));
					}
				}, n.exports = s;
			}, { "../utils": 32 }],
			19: [function(t, n, i) {
				"use strict";
				var a = t("./Uint8ArrayReader");
				function s(u) {
					a.call(this, u);
				}
				t("../utils").inherits(s, a), s.prototype.readData = function(u) {
					this.checkOffset(u);
					var c = this.data.slice(this.zero + this.index, this.zero + this.index + u);
					return this.index += u, c;
				}, n.exports = s;
			}, {
				"../utils": 32,
				"./Uint8ArrayReader": 21
			}],
			20: [function(t, n, i) {
				"use strict";
				var a = t("./DataReader");
				function s(u) {
					a.call(this, u);
				}
				t("../utils").inherits(s, a), s.prototype.byteAt = function(u) {
					return this.data.charCodeAt(this.zero + u);
				}, s.prototype.lastIndexOfSignature = function(u) {
					return this.data.lastIndexOf(u) - this.zero;
				}, s.prototype.readAndCheckSignature = function(u) {
					return u === this.readData(4);
				}, s.prototype.readData = function(u) {
					this.checkOffset(u);
					var c = this.data.slice(this.zero + this.index, this.zero + this.index + u);
					return this.index += u, c;
				}, n.exports = s;
			}, {
				"../utils": 32,
				"./DataReader": 18
			}],
			21: [function(t, n, i) {
				"use strict";
				var a = t("./ArrayReader");
				function s(u) {
					a.call(this, u);
				}
				t("../utils").inherits(s, a), s.prototype.readData = function(u) {
					if (this.checkOffset(u), u === 0) return /* @__PURE__ */ new Uint8Array(0);
					var c = this.data.subarray(this.zero + this.index, this.zero + this.index + u);
					return this.index += u, c;
				}, n.exports = s;
			}, {
				"../utils": 32,
				"./ArrayReader": 17
			}],
			22: [function(t, n, i) {
				"use strict";
				var a = t("../utils"), s = t("../support"), u = t("./ArrayReader"), c = t("./StringReader"), o = t("./NodeBufferReader"), l = t("./Uint8ArrayReader");
				n.exports = function(d) {
					var p = a.getTypeOf(d);
					return a.checkSupport(p), p !== "string" || s.uint8array ? p === "nodebuffer" ? new o(d) : s.uint8array ? new l(a.transformTo("uint8array", d)) : new u(a.transformTo("array", d)) : new c(d);
				};
			}, {
				"../support": 30,
				"../utils": 32,
				"./ArrayReader": 17,
				"./NodeBufferReader": 19,
				"./StringReader": 20,
				"./Uint8ArrayReader": 21
			}],
			23: [function(t, n, i) {
				"use strict";
				i.LOCAL_FILE_HEADER = "PK", i.CENTRAL_FILE_HEADER = "PK", i.CENTRAL_DIRECTORY_END = "PK", i.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", i.ZIP64_CENTRAL_DIRECTORY_END = "PK", i.DATA_DESCRIPTOR = "PK\x07\b";
			}, {}],
			24: [function(t, n, i) {
				"use strict";
				var a = t("./GenericWorker"), s = t("../utils");
				function u(c) {
					a.call(this, "ConvertWorker to " + c), this.destType = c;
				}
				s.inherits(u, a), u.prototype.processChunk = function(c) {
					this.push({
						data: s.transformTo(this.destType, c.data),
						meta: c.meta
					});
				}, n.exports = u;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			25: [function(t, n, i) {
				"use strict";
				var a = t("./GenericWorker"), s = t("../crc32");
				function u() {
					a.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
				}
				t("../utils").inherits(u, a), u.prototype.processChunk = function(c) {
					this.streamInfo.crc32 = s(c.data, this.streamInfo.crc32 || 0), this.push(c);
				}, n.exports = u;
			}, {
				"../crc32": 4,
				"../utils": 32,
				"./GenericWorker": 28
			}],
			26: [function(t, n, i) {
				"use strict";
				var a = t("../utils"), s = t("./GenericWorker");
				function u(c) {
					s.call(this, "DataLengthProbe for " + c), this.propName = c, this.withStreamInfo(c, 0);
				}
				a.inherits(u, s), u.prototype.processChunk = function(c) {
					if (c) {
						var o = this.streamInfo[this.propName] || 0;
						this.streamInfo[this.propName] = o + c.data.length;
					}
					s.prototype.processChunk.call(this, c);
				}, n.exports = u;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			27: [function(t, n, i) {
				"use strict";
				var a = t("../utils"), s = t("./GenericWorker");
				function u(c) {
					s.call(this, "DataWorker");
					var o = this;
					this.dataIsReady = !1, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = !1, c.then(function(l) {
						o.dataIsReady = !0, o.data = l, o.max = l && l.length || 0, o.type = a.getTypeOf(l), o.isPaused || o._tickAndRepeat();
					}, function(l) {
						o.error(l);
					});
				}
				a.inherits(u, s), u.prototype.cleanUp = function() {
					s.prototype.cleanUp.call(this), this.data = null;
				}, u.prototype.resume = function() {
					return !!s.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = !0, a.delay(this._tickAndRepeat, [], this)), !0);
				}, u.prototype._tickAndRepeat = function() {
					this._tickScheduled = !1, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (a.delay(this._tickAndRepeat, [], this), this._tickScheduled = !0));
				}, u.prototype._tick = function() {
					if (this.isPaused || this.isFinished) return !1;
					var c = null, o = Math.min(this.max, this.index + 16384);
					if (this.index >= this.max) return this.end();
					switch (this.type) {
						case "string":
							c = this.data.substring(this.index, o);
							break;
						case "uint8array":
							c = this.data.subarray(this.index, o);
							break;
						case "array":
						case "nodebuffer": c = this.data.slice(this.index, o);
					}
					return this.index = o, this.push({
						data: c,
						meta: { percent: this.max ? this.index / this.max * 100 : 0 }
					});
				}, n.exports = u;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			28: [function(t, n, i) {
				"use strict";
				function a(s) {
					this.name = s || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = !0, this.isFinished = !1, this.isLocked = !1, this._listeners = {
						data: [],
						end: [],
						error: []
					}, this.previous = null;
				}
				a.prototype = {
					push: function(s) {
						this.emit("data", s);
					},
					end: function() {
						if (this.isFinished) return !1;
						this.flush();
						try {
							this.emit("end"), this.cleanUp(), this.isFinished = !0;
						} catch (s) {
							this.emit("error", s);
						}
						return !0;
					},
					error: function(s) {
						return !this.isFinished && (this.isPaused ? this.generatedError = s : (this.isFinished = !0, this.emit("error", s), this.previous && this.previous.error(s), this.cleanUp()), !0);
					},
					on: function(s, u) {
						return this._listeners[s].push(u), this;
					},
					cleanUp: function() {
						this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
					},
					emit: function(s, u) {
						if (this._listeners[s]) for (var c = 0; c < this._listeners[s].length; c++) this._listeners[s][c].call(this, u);
					},
					pipe: function(s) {
						return s.registerPrevious(this);
					},
					registerPrevious: function(s) {
						if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
						this.streamInfo = s.streamInfo, this.mergeStreamInfo(), this.previous = s;
						var u = this;
						return s.on("data", function(c) {
							u.processChunk(c);
						}), s.on("end", function() {
							u.end();
						}), s.on("error", function(c) {
							u.error(c);
						}), this;
					},
					pause: function() {
						return !this.isPaused && !this.isFinished && (this.isPaused = !0, this.previous && this.previous.pause(), !0);
					},
					resume: function() {
						if (!this.isPaused || this.isFinished) return !1;
						var s = this.isPaused = !1;
						return this.generatedError && (this.error(this.generatedError), s = !0), this.previous && this.previous.resume(), !s;
					},
					flush: function() {},
					processChunk: function(s) {
						this.push(s);
					},
					withStreamInfo: function(s, u) {
						return this.extraStreamInfo[s] = u, this.mergeStreamInfo(), this;
					},
					mergeStreamInfo: function() {
						for (var s in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, s) && (this.streamInfo[s] = this.extraStreamInfo[s]);
					},
					lock: function() {
						if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
						this.isLocked = !0, this.previous && this.previous.lock();
					},
					toString: function() {
						var s = "Worker " + this.name;
						return this.previous ? this.previous + " -> " + s : s;
					}
				}, n.exports = a;
			}, {}],
			29: [function(t, n, i) {
				"use strict";
				var a = t("../utils"), s = t("./ConvertWorker"), u = t("./GenericWorker"), c = t("../base64"), o = t("../support"), l = t("../external"), d = null;
				if (o.nodestream) try {
					d = t("../nodejs/NodejsStreamOutputAdapter");
				} catch (A) {}
				function p(A, f) {
					return new l.Promise(function(g, _) {
						var v = [], b = A._internalType, C = A._outputType, T = A._mimeType;
						A.on("data", function(ee, x) {
							v.push(ee), f && f(x);
						}).on("error", function(ee) {
							v = [], _(ee);
						}).on("end", function() {
							try {
								g((function(x, G, O) {
									switch (x) {
										case "blob": return a.newBlob(a.transformTo("arraybuffer", G), O);
										case "base64": return c.encode(G);
										default: return a.transformTo(x, G);
									}
								})(C, (function(x, G) {
									var O, k = 0, H = null, m = 0;
									for (O = 0; O < G.length; O++) m += G[O].length;
									switch (x) {
										case "string": return G.join("");
										case "array": return Array.prototype.concat.apply([], G);
										case "uint8array":
											for (H = new Uint8Array(m), O = 0; O < G.length; O++) H.set(G[O], k), k += G[O].length;
											return H;
										case "nodebuffer": return Buffer.concat(G);
										default: throw new Error("concat : unsupported type '" + x + "'");
									}
								})(b, v), T));
							} catch (x) {
								_(x);
							}
							v = [];
						}).resume();
					});
				}
				function h(A, f, g) {
					var _ = f;
					switch (f) {
						case "blob":
						case "arraybuffer":
							_ = "uint8array";
							break;
						case "base64": _ = "string";
					}
					try {
						this._internalType = _, this._outputType = f, this._mimeType = g, a.checkSupport(_), this._worker = A.pipe(new s(_)), A.lock();
					} catch (v) {
						this._worker = new u("error"), this._worker.error(v);
					}
				}
				h.prototype = {
					accumulate: function(A) {
						return p(this, A);
					},
					on: function(A, f) {
						var g = this;
						return A === "data" ? this._worker.on(A, function(_) {
							f.call(g, _.data, _.meta);
						}) : this._worker.on(A, function() {
							a.delay(f, arguments, g);
						}), this;
					},
					resume: function() {
						return a.delay(this._worker.resume, [], this._worker), this;
					},
					pause: function() {
						return this._worker.pause(), this;
					},
					toNodejsStream: function(A) {
						if (a.checkSupport("nodestream"), this._outputType !== "nodebuffer") throw new Error(this._outputType + " is not supported by this method");
						return new d(this, { objectMode: this._outputType !== "nodebuffer" }, A);
					}
				}, n.exports = h;
			}, {
				"../base64": 1,
				"../external": 6,
				"../nodejs/NodejsStreamOutputAdapter": 13,
				"../support": 30,
				"../utils": 32,
				"./ConvertWorker": 24,
				"./GenericWorker": 28
			}],
			30: [function(t, n, i) {
				"use strict";
				if (i.base64 = !0, i.array = !0, i.string = !0, i.arraybuffer = typeof ArrayBuffer != "undefined" && typeof Uint8Array != "undefined", i.nodebuffer = typeof Buffer != "undefined", i.uint8array = typeof Uint8Array != "undefined", typeof ArrayBuffer == "undefined") i.blob = !1;
				else {
					var a = /* @__PURE__ */ new ArrayBuffer(0);
					try {
						i.blob = new Blob([a], { type: "application/zip" }).size === 0;
					} catch (u) {
						try {
							var s = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
							s.append(a), i.blob = s.getBlob("application/zip").size === 0;
						} catch (c) {
							i.blob = !1;
						}
					}
				}
				try {
					i.nodestream = !!t("readable-stream").Readable;
				} catch (u) {
					i.nodestream = !1;
				}
			}, { "readable-stream": 16 }],
			31: [function(t, n, i) {
				"use strict";
				for (var a = t("./utils"), s = t("./support"), u = t("./nodejsUtils"), c = t("./stream/GenericWorker"), o = new Array(256), l = 0; l < 256; l++) o[l] = 252 <= l ? 6 : 248 <= l ? 5 : 240 <= l ? 4 : 224 <= l ? 3 : 192 <= l ? 2 : 1;
				o[254] = o[254] = 1;
				function d() {
					c.call(this, "utf-8 decode"), this.leftOver = null;
				}
				function p() {
					c.call(this, "utf-8 encode");
				}
				i.utf8encode = function(h) {
					return s.nodebuffer ? u.newBufferFrom(h, "utf-8") : (function(A) {
						var f, g, _, v, b, C = A.length, T = 0;
						for (v = 0; v < C; v++) (64512 & (g = A.charCodeAt(v))) == 55296 && v + 1 < C && (64512 & (_ = A.charCodeAt(v + 1))) == 56320 && (g = 65536 + (g - 55296 << 10) + (_ - 56320), v++), T += g < 128 ? 1 : g < 2048 ? 2 : g < 65536 ? 3 : 4;
						for (f = s.uint8array ? new Uint8Array(T) : new Array(T), v = b = 0; b < T; v++) (64512 & (g = A.charCodeAt(v))) == 55296 && v + 1 < C && (64512 & (_ = A.charCodeAt(v + 1))) == 56320 && (g = 65536 + (g - 55296 << 10) + (_ - 56320), v++), g < 128 ? f[b++] = g : (g < 2048 ? f[b++] = 192 | g >>> 6 : (g < 65536 ? f[b++] = 224 | g >>> 12 : (f[b++] = 240 | g >>> 18, f[b++] = 128 | g >>> 12 & 63), f[b++] = 128 | g >>> 6 & 63), f[b++] = 128 | 63 & g);
						return f;
					})(h);
				}, i.utf8decode = function(h) {
					return s.nodebuffer ? a.transformTo("nodebuffer", h).toString("utf-8") : (function(A) {
						var f, g, _, v, b = A.length, C = new Array(2 * b);
						for (f = g = 0; f < b;) if ((_ = A[f++]) < 128) C[g++] = _;
						else if (4 < (v = o[_])) C[g++] = 65533, f += v - 1;
						else {
							for (_ &= v === 2 ? 31 : v === 3 ? 15 : 7; 1 < v && f < b;) _ = _ << 6 | 63 & A[f++], v--;
							1 < v ? C[g++] = 65533 : _ < 65536 ? C[g++] = _ : (_ -= 65536, C[g++] = 55296 | _ >> 10 & 1023, C[g++] = 56320 | 1023 & _);
						}
						return C.length !== g && (C.subarray ? C = C.subarray(0, g) : C.length = g), a.applyFromCharCode(C);
					})(h = a.transformTo(s.uint8array ? "uint8array" : "array", h));
				}, a.inherits(d, c), d.prototype.processChunk = function(h) {
					var A = a.transformTo(s.uint8array ? "uint8array" : "array", h.data);
					if (this.leftOver && this.leftOver.length) {
						if (s.uint8array) {
							var f = A;
							(A = new Uint8Array(f.length + this.leftOver.length)).set(this.leftOver, 0), A.set(f, this.leftOver.length);
						} else A = this.leftOver.concat(A);
						this.leftOver = null;
					}
					var g = (function(v, b) {
						var C;
						for ((b = b || v.length) > v.length && (b = v.length), C = b - 1; 0 <= C && (192 & v[C]) == 128;) C--;
						return C < 0 || C === 0 ? b : C + o[v[C]] > b ? C : b;
					})(A), _ = A;
					g !== A.length && (s.uint8array ? (_ = A.subarray(0, g), this.leftOver = A.subarray(g, A.length)) : (_ = A.slice(0, g), this.leftOver = A.slice(g, A.length))), this.push({
						data: i.utf8decode(_),
						meta: h.meta
					});
				}, d.prototype.flush = function() {
					this.leftOver && this.leftOver.length && (this.push({
						data: i.utf8decode(this.leftOver),
						meta: {}
					}), this.leftOver = null);
				}, i.Utf8DecodeWorker = d, a.inherits(p, c), p.prototype.processChunk = function(h) {
					this.push({
						data: i.utf8encode(h.data),
						meta: h.meta
					});
				}, i.Utf8EncodeWorker = p;
			}, {
				"./nodejsUtils": 14,
				"./stream/GenericWorker": 28,
				"./support": 30,
				"./utils": 32
			}],
			32: [function(t, n, i) {
				"use strict";
				var a = t("./support"), s = t("./base64"), u = t("./nodejsUtils"), c = t("./external");
				function o(f) {
					return f;
				}
				function l(f, g) {
					for (var _ = 0; _ < f.length; ++_) g[_] = 255 & f.charCodeAt(_);
					return g;
				}
				t("setimmediate"), i.newBlob = function(f, g) {
					i.checkSupport("blob");
					try {
						return new Blob([f], { type: g });
					} catch (v) {
						try {
							var _ = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
							return _.append(f), _.getBlob(g);
						} catch (b) {
							throw new Error("Bug : can't construct the Blob.");
						}
					}
				};
				var d = {
					stringifyByChunk: function(f, g, _) {
						var v = [], b = 0, C = f.length;
						if (C <= _) return String.fromCharCode.apply(null, f);
						for (; b < C;) g === "array" || g === "nodebuffer" ? v.push(String.fromCharCode.apply(null, f.slice(b, Math.min(b + _, C)))) : v.push(String.fromCharCode.apply(null, f.subarray(b, Math.min(b + _, C)))), b += _;
						return v.join("");
					},
					stringifyByChar: function(f) {
						for (var g = "", _ = 0; _ < f.length; _++) g += String.fromCharCode(f[_]);
						return g;
					},
					applyCanBeUsed: {
						uint8array: (function() {
							try {
								return a.uint8array && String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1)).length === 1;
							} catch (f) {
								return !1;
							}
						})(),
						nodebuffer: (function() {
							try {
								return a.nodebuffer && String.fromCharCode.apply(null, u.allocBuffer(1)).length === 1;
							} catch (f) {
								return !1;
							}
						})()
					}
				};
				function p(f) {
					var g = 65536, _ = i.getTypeOf(f), v = !0;
					if (_ === "uint8array" ? v = d.applyCanBeUsed.uint8array : _ === "nodebuffer" && (v = d.applyCanBeUsed.nodebuffer), v) for (; 1 < g;) try {
						return d.stringifyByChunk(f, _, g);
					} catch (b) {
						g = Math.floor(g / 2);
					}
					return d.stringifyByChar(f);
				}
				function h(f, g) {
					for (var _ = 0; _ < f.length; _++) g[_] = f[_];
					return g;
				}
				i.applyFromCharCode = p;
				var A = {};
				A.string = {
					string: o,
					array: function(f) {
						return l(f, new Array(f.length));
					},
					arraybuffer: function(f) {
						return A.string.uint8array(f).buffer;
					},
					uint8array: function(f) {
						return l(f, new Uint8Array(f.length));
					},
					nodebuffer: function(f) {
						return l(f, u.allocBuffer(f.length));
					}
				}, A.array = {
					string: p,
					array: o,
					arraybuffer: function(f) {
						return new Uint8Array(f).buffer;
					},
					uint8array: function(f) {
						return new Uint8Array(f);
					},
					nodebuffer: function(f) {
						return u.newBufferFrom(f);
					}
				}, A.arraybuffer = {
					string: function(f) {
						return p(new Uint8Array(f));
					},
					array: function(f) {
						return h(new Uint8Array(f), new Array(f.byteLength));
					},
					arraybuffer: o,
					uint8array: function(f) {
						return new Uint8Array(f);
					},
					nodebuffer: function(f) {
						return u.newBufferFrom(new Uint8Array(f));
					}
				}, A.uint8array = {
					string: p,
					array: function(f) {
						return h(f, new Array(f.length));
					},
					arraybuffer: function(f) {
						return f.buffer;
					},
					uint8array: o,
					nodebuffer: function(f) {
						return u.newBufferFrom(f);
					}
				}, A.nodebuffer = {
					string: p,
					array: function(f) {
						return h(f, new Array(f.length));
					},
					arraybuffer: function(f) {
						return A.nodebuffer.uint8array(f).buffer;
					},
					uint8array: function(f) {
						return h(f, new Uint8Array(f.length));
					},
					nodebuffer: o
				}, i.transformTo = function(f, g) {
					if (g = g || "", !f) return g;
					i.checkSupport(f);
					return A[i.getTypeOf(g)][f](g);
				}, i.resolve = function(f) {
					for (var g = f.split("/"), _ = [], v = 0; v < g.length; v++) {
						var b = g[v];
						b === "." || b === "" && v !== 0 && v !== g.length - 1 || (b === ".." ? _.pop() : _.push(b));
					}
					return _.join("/");
				}, i.getTypeOf = function(f) {
					return typeof f == "string" ? "string" : Object.prototype.toString.call(f) === "[object Array]" ? "array" : a.nodebuffer && u.isBuffer(f) ? "nodebuffer" : a.uint8array && f instanceof Uint8Array ? "uint8array" : a.arraybuffer && f instanceof ArrayBuffer ? "arraybuffer" : void 0;
				}, i.checkSupport = function(f) {
					if (!a[f.toLowerCase()]) throw new Error(f + " is not supported by this platform");
				}, i.MAX_VALUE_16BITS = 65535, i.MAX_VALUE_32BITS = -1, i.pretty = function(f) {
					var g, _, v = "";
					for (_ = 0; _ < (f || "").length; _++) v += "\\x" + ((g = f.charCodeAt(_)) < 16 ? "0" : "") + g.toString(16).toUpperCase();
					return v;
				}, i.delay = function(f, g, _) {
					setImmediate(function() {
						f.apply(_ || null, g || []);
					});
				}, i.inherits = function(f, g) {
					function _() {}
					_.prototype = g.prototype, f.prototype = new _();
				}, i.extend = function() {
					var f, g, _ = {};
					for (f = 0; f < arguments.length; f++) for (g in arguments[f]) Object.prototype.hasOwnProperty.call(arguments[f], g) && _[g] === void 0 && (_[g] = arguments[f][g]);
					return _;
				}, i.prepareContent = function(f, g, _, v, b) {
					return c.Promise.resolve(g).then(function(C) {
						return a.blob && (C instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(C)) !== -1) && typeof FileReader != "undefined" ? new c.Promise(function(T, ee) {
							var x = new FileReader();
							x.onload = function(G) {
								T(G.target.result);
							}, x.onerror = function(G) {
								ee(G.target.error);
							}, x.readAsArrayBuffer(C);
						}) : C;
					}).then(function(C) {
						var T = i.getTypeOf(C);
						return T ? (T === "arraybuffer" ? C = i.transformTo("uint8array", C) : T === "string" && (b ? C = s.decode(C) : _ && v !== !0 && (C = (function(ee) {
							return l(ee, a.uint8array ? new Uint8Array(ee.length) : new Array(ee.length));
						})(C))), C) : c.Promise.reject(/* @__PURE__ */ new Error("Can't read the data of '" + f + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
					});
				};
			}, {
				"./base64": 1,
				"./external": 6,
				"./nodejsUtils": 14,
				"./support": 30,
				setimmediate: 54
			}],
			33: [function(t, n, i) {
				"use strict";
				var a = t("./reader/readerFor"), s = t("./utils"), u = t("./signature"), c = t("./zipEntry"), o = t("./support");
				function l(d) {
					this.files = [], this.loadOptions = d;
				}
				l.prototype = {
					checkSignature: function(d) {
						if (!this.reader.readAndCheckSignature(d)) {
							this.reader.index -= 4;
							var p = this.reader.readString(4);
							throw new Error("Corrupted zip or bug: unexpected signature (" + s.pretty(p) + ", expected " + s.pretty(d) + ")");
						}
					},
					isSignature: function(d, p) {
						var h = this.reader.index;
						this.reader.setIndex(d);
						var A = this.reader.readString(4) === p;
						return this.reader.setIndex(h), A;
					},
					readBlockEndOfCentral: function() {
						this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
						var d = this.reader.readData(this.zipCommentLength), p = o.uint8array ? "uint8array" : "array", h = s.transformTo(p, d);
						this.zipComment = this.loadOptions.decodeFileName(h);
					},
					readBlockZip64EndOfCentral: function() {
						this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
						for (var d, p, h, A = this.zip64EndOfCentralSize - 44; 0 < A;) d = this.reader.readInt(2), p = this.reader.readInt(4), h = this.reader.readData(p), this.zip64ExtensibleData[d] = {
							id: d,
							length: p,
							value: h
						};
					},
					readBlockZip64EndOfCentralLocator: function() {
						if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
					},
					readLocalFiles: function() {
						var d, p;
						for (d = 0; d < this.files.length; d++) p = this.files[d], this.reader.setIndex(p.localHeaderOffset), this.checkSignature(u.LOCAL_FILE_HEADER), p.readLocalPart(this.reader), p.handleUTF8(), p.processAttributes();
					},
					readCentralDir: function() {
						var d;
						for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(u.CENTRAL_FILE_HEADER);) (d = new c({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(d);
						if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
					},
					readEndOfCentral: function() {
						var d = this.reader.lastIndexOfSignature(u.CENTRAL_DIRECTORY_END);
						if (d < 0) throw this.isSignature(0, u.LOCAL_FILE_HEADER) ? /* @__PURE__ */ new Error("Corrupted zip: can't find end of central directory") : /* @__PURE__ */ new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
						this.reader.setIndex(d);
						var p = d;
						if (this.checkSignature(u.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === s.MAX_VALUE_16BITS || this.diskWithCentralDirStart === s.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === s.MAX_VALUE_16BITS || this.centralDirRecords === s.MAX_VALUE_16BITS || this.centralDirSize === s.MAX_VALUE_32BITS || this.centralDirOffset === s.MAX_VALUE_32BITS) {
							if (this.zip64 = !0, (d = this.reader.lastIndexOfSignature(u.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
							if (this.reader.setIndex(d), this.checkSignature(u.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, u.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(u.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
							this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(u.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
						}
						var h = this.centralDirOffset + this.centralDirSize;
						this.zip64 && (h += 20, h += 12 + this.zip64EndOfCentralSize);
						var A = p - h;
						if (0 < A) this.isSignature(p, u.CENTRAL_FILE_HEADER) || (this.reader.zero = A);
						else if (A < 0) throw new Error("Corrupted zip: missing " + Math.abs(A) + " bytes.");
					},
					prepareReader: function(d) {
						this.reader = a(d);
					},
					load: function(d) {
						this.prepareReader(d), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
					}
				}, n.exports = l;
			}, {
				"./reader/readerFor": 22,
				"./signature": 23,
				"./support": 30,
				"./utils": 32,
				"./zipEntry": 34
			}],
			34: [function(t, n, i) {
				"use strict";
				var a = t("./reader/readerFor"), s = t("./utils"), u = t("./compressedObject"), c = t("./crc32"), o = t("./utf8"), l = t("./compressions"), d = t("./support");
				function p(h, A) {
					this.options = h, this.loadOptions = A;
				}
				p.prototype = {
					isEncrypted: function() {
						return (1 & this.bitFlag) == 1;
					},
					useUTF8: function() {
						return (2048 & this.bitFlag) == 2048;
					},
					readLocalPart: function(h) {
						var A, f;
						if (h.skip(22), this.fileNameLength = h.readInt(2), f = h.readInt(2), this.fileName = h.readData(this.fileNameLength), h.skip(f), this.compressedSize === -1 || this.uncompressedSize === -1) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
						if ((A = (function(g) {
							for (var _ in l) if (Object.prototype.hasOwnProperty.call(l, _) && l[_].magic === g) return l[_];
							return null;
						})(this.compressionMethod)) === null) throw new Error("Corrupted zip : compression " + s.pretty(this.compressionMethod) + " unknown (inner file : " + s.transformTo("string", this.fileName) + ")");
						this.decompressed = new u(this.compressedSize, this.uncompressedSize, this.crc32, A, h.readData(this.compressedSize));
					},
					readCentralPart: function(h) {
						this.versionMadeBy = h.readInt(2), h.skip(2), this.bitFlag = h.readInt(2), this.compressionMethod = h.readString(2), this.date = h.readDate(), this.crc32 = h.readInt(4), this.compressedSize = h.readInt(4), this.uncompressedSize = h.readInt(4);
						var A = h.readInt(2);
						if (this.extraFieldsLength = h.readInt(2), this.fileCommentLength = h.readInt(2), this.diskNumberStart = h.readInt(2), this.internalFileAttributes = h.readInt(2), this.externalFileAttributes = h.readInt(4), this.localHeaderOffset = h.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
						h.skip(A), this.readExtraFields(h), this.parseZIP64ExtraField(h), this.fileComment = h.readData(this.fileCommentLength);
					},
					processAttributes: function() {
						this.unixPermissions = null, this.dosPermissions = null;
						var h = this.versionMadeBy >> 8;
						this.dir = !!(16 & this.externalFileAttributes), h == 0 && (this.dosPermissions = 63 & this.externalFileAttributes), h == 3 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || this.fileNameStr.slice(-1) !== "/" || (this.dir = !0);
					},
					parseZIP64ExtraField: function() {
						if (this.extraFields[1]) {
							var h = a(this.extraFields[1].value);
							this.uncompressedSize === s.MAX_VALUE_32BITS && (this.uncompressedSize = h.readInt(8)), this.compressedSize === s.MAX_VALUE_32BITS && (this.compressedSize = h.readInt(8)), this.localHeaderOffset === s.MAX_VALUE_32BITS && (this.localHeaderOffset = h.readInt(8)), this.diskNumberStart === s.MAX_VALUE_32BITS && (this.diskNumberStart = h.readInt(4));
						}
					},
					readExtraFields: function(h) {
						var A, f, g, _ = h.index + this.extraFieldsLength;
						for (this.extraFields || (this.extraFields = {}); h.index + 4 < _;) A = h.readInt(2), f = h.readInt(2), g = h.readData(f), this.extraFields[A] = {
							id: A,
							length: f,
							value: g
						};
						h.setIndex(_);
					},
					handleUTF8: function() {
						var h = d.uint8array ? "uint8array" : "array";
						if (this.useUTF8()) this.fileNameStr = o.utf8decode(this.fileName), this.fileCommentStr = o.utf8decode(this.fileComment);
						else {
							var A = this.findExtraFieldUnicodePath();
							if (A !== null) this.fileNameStr = A;
							else {
								var f = s.transformTo(h, this.fileName);
								this.fileNameStr = this.loadOptions.decodeFileName(f);
							}
							var g = this.findExtraFieldUnicodeComment();
							if (g !== null) this.fileCommentStr = g;
							else {
								var _ = s.transformTo(h, this.fileComment);
								this.fileCommentStr = this.loadOptions.decodeFileName(_);
							}
						}
					},
					findExtraFieldUnicodePath: function() {
						var h = this.extraFields[28789];
						if (h) {
							var A = a(h.value);
							return A.readInt(1) !== 1 || c(this.fileName) !== A.readInt(4) ? null : o.utf8decode(A.readData(h.length - 5));
						}
						return null;
					},
					findExtraFieldUnicodeComment: function() {
						var h = this.extraFields[25461];
						if (h) {
							var A = a(h.value);
							return A.readInt(1) !== 1 || c(this.fileComment) !== A.readInt(4) ? null : o.utf8decode(A.readData(h.length - 5));
						}
						return null;
					}
				}, n.exports = p;
			}, {
				"./compressedObject": 2,
				"./compressions": 3,
				"./crc32": 4,
				"./reader/readerFor": 22,
				"./support": 30,
				"./utf8": 31,
				"./utils": 32
			}],
			35: [function(t, n, i) {
				"use strict";
				function a(A, f, g) {
					this.name = A, this.dir = g.dir, this.date = g.date, this.comment = g.comment, this.unixPermissions = g.unixPermissions, this.dosPermissions = g.dosPermissions, this._data = f, this._dataBinary = g.binary, this.options = {
						compression: g.compression,
						compressionOptions: g.compressionOptions
					};
				}
				var s = t("./stream/StreamHelper"), u = t("./stream/DataWorker"), c = t("./utf8"), o = t("./compressedObject"), l = t("./stream/GenericWorker");
				a.prototype = {
					internalStream: function(A) {
						var f = null, g = "string";
						try {
							if (!A) throw new Error("No output type specified.");
							var _ = (g = A.toLowerCase()) === "string" || g === "text";
							g !== "binarystring" && g !== "text" || (g = "string"), f = this._decompressWorker();
							var v = !this._dataBinary;
							v && !_ && (f = f.pipe(new c.Utf8EncodeWorker())), !v && _ && (f = f.pipe(new c.Utf8DecodeWorker()));
						} catch (b) {
							(f = new l("error")).error(b);
						}
						return new s(f, g, "");
					},
					async: function(A, f) {
						return this.internalStream(A).accumulate(f);
					},
					nodeStream: function(A, f) {
						return this.internalStream(A || "nodebuffer").toNodejsStream(f);
					},
					_compressWorker: function(A, f) {
						if (this._data instanceof o && this._data.compression.magic === A.magic) return this._data.getCompressedWorker();
						var g = this._decompressWorker();
						return this._dataBinary || (g = g.pipe(new c.Utf8EncodeWorker())), o.createWorkerFrom(g, A, f);
					},
					_decompressWorker: function() {
						return this._data instanceof o ? this._data.getContentWorker() : this._data instanceof l ? this._data : new u(this._data);
					}
				};
				for (var d = [
					"asText",
					"asBinary",
					"asNodeBuffer",
					"asUint8Array",
					"asArrayBuffer"
				], p = function() {
					throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
				}, h = 0; h < d.length; h++) a.prototype[d[h]] = p;
				n.exports = a;
			}, {
				"./compressedObject": 2,
				"./stream/DataWorker": 27,
				"./stream/GenericWorker": 28,
				"./stream/StreamHelper": 29,
				"./utf8": 31
			}],
			36: [function(t, n, i) {
				(function(a) {
					"use strict";
					var s, u, c = a.MutationObserver || a.WebKitMutationObserver;
					if (c) {
						var o = 0, l = new c(A), d = a.document.createTextNode("");
						l.observe(d, { characterData: !0 }), s = function() {
							d.data = o = ++o % 2;
						};
					} else if (a.setImmediate || a.MessageChannel === void 0) s = "document" in a && "onreadystatechange" in a.document.createElement("script") ? function() {
						var f = a.document.createElement("script");
						f.onreadystatechange = function() {
							A(), f.onreadystatechange = null, f.parentNode.removeChild(f), f = null;
						}, a.document.documentElement.appendChild(f);
					} : function() {
						setTimeout(A, 0);
					};
					else {
						var p = new a.MessageChannel();
						p.port1.onmessage = A, s = function() {
							p.port2.postMessage(0);
						};
					}
					var h = [];
					function A() {
						var f, g;
						u = !0;
						for (var _ = h.length; _;) {
							for (g = h, h = [], f = -1; ++f < _;) g[f]();
							_ = h.length;
						}
						u = !1;
					}
					n.exports = function(f) {
						h.push(f) !== 1 || u || s();
					};
				}).call(this, typeof global != "undefined" ? global : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
			}, {}],
			37: [function(t, n, i) {
				"use strict";
				var a = t("immediate");
				function s() {}
				var u = {}, c = ["REJECTED"], o = ["FULFILLED"], l = ["PENDING"];
				function d(_) {
					if (typeof _ != "function") throw new TypeError("resolver must be a function");
					this.state = l, this.queue = [], this.outcome = void 0, _ !== s && f(this, _);
				}
				function p(_, v, b) {
					this.promise = _, typeof v == "function" && (this.onFulfilled = v, this.callFulfilled = this.otherCallFulfilled), typeof b == "function" && (this.onRejected = b, this.callRejected = this.otherCallRejected);
				}
				function h(_, v, b) {
					a(function() {
						var C;
						try {
							C = v(b);
						} catch (T) {
							return u.reject(_, T);
						}
						C === _ ? u.reject(_, /* @__PURE__ */ new TypeError("Cannot resolve promise with itself")) : u.resolve(_, C);
					});
				}
				function A(_) {
					var v = _ && _.then;
					if (_ && (typeof _ == "object" || typeof _ == "function") && typeof v == "function") return function() {
						v.apply(_, arguments);
					};
				}
				function f(_, v) {
					var b = !1;
					function C(x) {
						b || (b = !0, u.reject(_, x));
					}
					function T(x) {
						b || (b = !0, u.resolve(_, x));
					}
					var ee = g(function() {
						v(T, C);
					});
					ee.status === "error" && C(ee.value);
				}
				function g(_, v) {
					var b = {};
					try {
						b.value = _(v), b.status = "success";
					} catch (C) {
						b.status = "error", b.value = C;
					}
					return b;
				}
				(n.exports = d).prototype.finally = function(_) {
					if (typeof _ != "function") return this;
					var v = this.constructor;
					return this.then(function(b) {
						return v.resolve(_()).then(function() {
							return b;
						});
					}, function(b) {
						return v.resolve(_()).then(function() {
							throw b;
						});
					});
				}, d.prototype.catch = function(_) {
					return this.then(null, _);
				}, d.prototype.then = function(_, v) {
					if (typeof _ != "function" && this.state === o || typeof v != "function" && this.state === c) return this;
					var b = new this.constructor(s);
					return this.state !== l ? h(b, this.state === o ? _ : v, this.outcome) : this.queue.push(new p(b, _, v)), b;
				}, p.prototype.callFulfilled = function(_) {
					u.resolve(this.promise, _);
				}, p.prototype.otherCallFulfilled = function(_) {
					h(this.promise, this.onFulfilled, _);
				}, p.prototype.callRejected = function(_) {
					u.reject(this.promise, _);
				}, p.prototype.otherCallRejected = function(_) {
					h(this.promise, this.onRejected, _);
				}, u.resolve = function(_, v) {
					var b = g(A, v);
					if (b.status === "error") return u.reject(_, b.value);
					var C = b.value;
					if (C) f(_, C);
					else {
						_.state = o, _.outcome = v;
						for (var T = -1, ee = _.queue.length; ++T < ee;) _.queue[T].callFulfilled(v);
					}
					return _;
				}, u.reject = function(_, v) {
					_.state = c, _.outcome = v;
					for (var b = -1, C = _.queue.length; ++b < C;) _.queue[b].callRejected(v);
					return _;
				}, d.resolve = function(_) {
					return _ instanceof this ? _ : u.resolve(new this(s), _);
				}, d.reject = function(_) {
					var v = new this(s);
					return u.reject(v, _);
				}, d.all = function(_) {
					var v = this;
					if (Object.prototype.toString.call(_) !== "[object Array]") return this.reject(/* @__PURE__ */ new TypeError("must be an array"));
					var b = _.length, C = !1;
					if (!b) return this.resolve([]);
					for (var T = new Array(b), ee = 0, x = -1, G = new this(s); ++x < b;) O(_[x], x);
					return G;
					function O(k, H) {
						v.resolve(k).then(function(m) {
							T[H] = m, ++ee !== b || C || (C = !0, u.resolve(G, T));
						}, function(m) {
							C || (C = !0, u.reject(G, m));
						});
					}
				}, d.race = function(_) {
					var v = this;
					if (Object.prototype.toString.call(_) !== "[object Array]") return this.reject(/* @__PURE__ */ new TypeError("must be an array"));
					var b = _.length, C = !1;
					if (!b) return this.resolve([]);
					for (var T = -1, ee = new this(s); ++T < b;) x = _[T], v.resolve(x).then(function(G) {
						C || (C = !0, u.resolve(ee, G));
					}, function(G) {
						C || (C = !0, u.reject(ee, G));
					});
					var x;
					return ee;
				};
			}, { immediate: 36 }],
			38: [function(t, n, i) {
				"use strict";
				var a = {};
				(0, t("./lib/utils/common").assign)(a, t("./lib/deflate"), t("./lib/inflate"), t("./lib/zlib/constants")), n.exports = a;
			}, {
				"./lib/deflate": 39,
				"./lib/inflate": 40,
				"./lib/utils/common": 41,
				"./lib/zlib/constants": 44
			}],
			39: [function(t, n, i) {
				"use strict";
				var a = t("./zlib/deflate"), s = t("./utils/common"), u = t("./utils/strings"), c = t("./zlib/messages"), o = t("./zlib/zstream"), l = Object.prototype.toString, d = 0, p = -1, h = 0, A = 8;
				function f(_) {
					if (!(this instanceof f)) return new f(_);
					this.options = s.assign({
						level: p,
						method: A,
						chunkSize: 16384,
						windowBits: 15,
						memLevel: 8,
						strategy: h,
						to: ""
					}, _ || {});
					var v = this.options;
					v.raw && 0 < v.windowBits ? v.windowBits = -v.windowBits : v.gzip && 0 < v.windowBits && v.windowBits < 16 && (v.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new o(), this.strm.avail_out = 0;
					var b = a.deflateInit2(this.strm, v.level, v.method, v.windowBits, v.memLevel, v.strategy);
					if (b !== d) throw new Error(c[b]);
					if (v.header && a.deflateSetHeader(this.strm, v.header), v.dictionary) {
						var C;
						if (C = typeof v.dictionary == "string" ? u.string2buf(v.dictionary) : l.call(v.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(v.dictionary) : v.dictionary, (b = a.deflateSetDictionary(this.strm, C)) !== d) throw new Error(c[b]);
						this._dict_set = !0;
					}
				}
				function g(_, v) {
					var b = new f(v);
					if (b.push(_, !0), b.err) throw b.msg || c[b.err];
					return b.result;
				}
				f.prototype.push = function(_, v) {
					var b, C, T = this.strm, ee = this.options.chunkSize;
					if (this.ended) return !1;
					C = v === ~~v ? v : v === !0 ? 4 : 0, typeof _ == "string" ? T.input = u.string2buf(_) : l.call(_) === "[object ArrayBuffer]" ? T.input = new Uint8Array(_) : T.input = _, T.next_in = 0, T.avail_in = T.input.length;
					do {
						if (T.avail_out === 0 && (T.output = new s.Buf8(ee), T.next_out = 0, T.avail_out = ee), (b = a.deflate(T, C)) !== 1 && b !== d) return this.onEnd(b), !(this.ended = !0);
						T.avail_out !== 0 && (T.avail_in !== 0 || C !== 4 && C !== 2) || (this.options.to === "string" ? this.onData(u.buf2binstring(s.shrinkBuf(T.output, T.next_out))) : this.onData(s.shrinkBuf(T.output, T.next_out)));
					} while ((0 < T.avail_in || T.avail_out === 0) && b !== 1);
					return C === 4 ? (b = a.deflateEnd(this.strm), this.onEnd(b), this.ended = !0, b === d) : C !== 2 || (this.onEnd(d), !(T.avail_out = 0));
				}, f.prototype.onData = function(_) {
					this.chunks.push(_);
				}, f.prototype.onEnd = function(_) {
					_ === d && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = s.flattenChunks(this.chunks)), this.chunks = [], this.err = _, this.msg = this.strm.msg;
				}, i.Deflate = f, i.deflate = g, i.deflateRaw = function(_, v) {
					return (v = v || {}).raw = !0, g(_, v);
				}, i.gzip = function(_, v) {
					return (v = v || {}).gzip = !0, g(_, v);
				};
			}, {
				"./utils/common": 41,
				"./utils/strings": 42,
				"./zlib/deflate": 46,
				"./zlib/messages": 51,
				"./zlib/zstream": 53
			}],
			40: [function(t, n, i) {
				"use strict";
				var a = t("./zlib/inflate"), s = t("./utils/common"), u = t("./utils/strings"), c = t("./zlib/constants"), o = t("./zlib/messages"), l = t("./zlib/zstream"), d = t("./zlib/gzheader"), p = Object.prototype.toString;
				function h(f) {
					if (!(this instanceof h)) return new h(f);
					this.options = s.assign({
						chunkSize: 16384,
						windowBits: 0,
						to: ""
					}, f || {});
					var g = this.options;
					g.raw && 0 <= g.windowBits && g.windowBits < 16 && (g.windowBits = -g.windowBits, g.windowBits === 0 && (g.windowBits = -15)), !(0 <= g.windowBits && g.windowBits < 16) || f && f.windowBits || (g.windowBits += 32), 15 < g.windowBits && g.windowBits < 48 && !(15 & g.windowBits) && (g.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new l(), this.strm.avail_out = 0;
					var _ = a.inflateInit2(this.strm, g.windowBits);
					if (_ !== c.Z_OK) throw new Error(o[_]);
					this.header = new d(), a.inflateGetHeader(this.strm, this.header);
				}
				function A(f, g) {
					var _ = new h(g);
					if (_.push(f, !0), _.err) throw _.msg || o[_.err];
					return _.result;
				}
				h.prototype.push = function(f, g) {
					var _, v, b, C, T, ee, x = this.strm, G = this.options.chunkSize, O = this.options.dictionary, k = !1;
					if (this.ended) return !1;
					v = g === ~~g ? g : g === !0 ? c.Z_FINISH : c.Z_NO_FLUSH, typeof f == "string" ? x.input = u.binstring2buf(f) : p.call(f) === "[object ArrayBuffer]" ? x.input = new Uint8Array(f) : x.input = f, x.next_in = 0, x.avail_in = x.input.length;
					do {
						if (x.avail_out === 0 && (x.output = new s.Buf8(G), x.next_out = 0, x.avail_out = G), (_ = a.inflate(x, c.Z_NO_FLUSH)) === c.Z_NEED_DICT && O && (ee = typeof O == "string" ? u.string2buf(O) : p.call(O) === "[object ArrayBuffer]" ? new Uint8Array(O) : O, _ = a.inflateSetDictionary(this.strm, ee)), _ === c.Z_BUF_ERROR && k === !0 && (_ = c.Z_OK, k = !1), _ !== c.Z_STREAM_END && _ !== c.Z_OK) return this.onEnd(_), !(this.ended = !0);
						x.next_out && (x.avail_out !== 0 && _ !== c.Z_STREAM_END && (x.avail_in !== 0 || v !== c.Z_FINISH && v !== c.Z_SYNC_FLUSH) || (this.options.to === "string" ? (b = u.utf8border(x.output, x.next_out), C = x.next_out - b, T = u.buf2string(x.output, b), x.next_out = C, x.avail_out = G - C, C && s.arraySet(x.output, x.output, b, C, 0), this.onData(T)) : this.onData(s.shrinkBuf(x.output, x.next_out)))), x.avail_in === 0 && x.avail_out === 0 && (k = !0);
					} while ((0 < x.avail_in || x.avail_out === 0) && _ !== c.Z_STREAM_END);
					return _ === c.Z_STREAM_END && (v = c.Z_FINISH), v === c.Z_FINISH ? (_ = a.inflateEnd(this.strm), this.onEnd(_), this.ended = !0, _ === c.Z_OK) : v !== c.Z_SYNC_FLUSH || (this.onEnd(c.Z_OK), !(x.avail_out = 0));
				}, h.prototype.onData = function(f) {
					this.chunks.push(f);
				}, h.prototype.onEnd = function(f) {
					f === c.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = s.flattenChunks(this.chunks)), this.chunks = [], this.err = f, this.msg = this.strm.msg;
				}, i.Inflate = h, i.inflate = A, i.inflateRaw = function(f, g) {
					return (g = g || {}).raw = !0, A(f, g);
				}, i.ungzip = A;
			}, {
				"./utils/common": 41,
				"./utils/strings": 42,
				"./zlib/constants": 44,
				"./zlib/gzheader": 47,
				"./zlib/inflate": 49,
				"./zlib/messages": 51,
				"./zlib/zstream": 53
			}],
			41: [function(t, n, i) {
				"use strict";
				var a = typeof Uint8Array != "undefined" && typeof Uint16Array != "undefined" && typeof Int32Array != "undefined";
				i.assign = function(c) {
					for (var o = Array.prototype.slice.call(arguments, 1); o.length;) {
						var l = o.shift();
						if (l) {
							if (typeof l != "object") throw new TypeError(l + "must be non-object");
							for (var d in l) l.hasOwnProperty(d) && (c[d] = l[d]);
						}
					}
					return c;
				}, i.shrinkBuf = function(c, o) {
					return c.length === o ? c : c.subarray ? c.subarray(0, o) : (c.length = o, c);
				};
				var s = {
					arraySet: function(c, o, l, d, p) {
						if (o.subarray && c.subarray) c.set(o.subarray(l, l + d), p);
						else for (var h = 0; h < d; h++) c[p + h] = o[l + h];
					},
					flattenChunks: function(c) {
						var o, l, d, p, h, A;
						for (o = d = 0, l = c.length; o < l; o++) d += c[o].length;
						for (A = new Uint8Array(d), o = p = 0, l = c.length; o < l; o++) h = c[o], A.set(h, p), p += h.length;
						return A;
					}
				}, u = {
					arraySet: function(c, o, l, d, p) {
						for (var h = 0; h < d; h++) c[p + h] = o[l + h];
					},
					flattenChunks: function(c) {
						return [].concat.apply([], c);
					}
				};
				i.setTyped = function(c) {
					c ? (i.Buf8 = Uint8Array, i.Buf16 = Uint16Array, i.Buf32 = Int32Array, i.assign(i, s)) : (i.Buf8 = Array, i.Buf16 = Array, i.Buf32 = Array, i.assign(i, u));
				}, i.setTyped(a);
			}, {}],
			42: [function(t, n, i) {
				"use strict";
				var a = t("./common"), s = !0, u = !0;
				try {
					String.fromCharCode.apply(null, [0]);
				} catch (d) {
					s = !1;
				}
				try {
					String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1));
				} catch (d) {
					u = !1;
				}
				for (var c = new a.Buf8(256), o = 0; o < 256; o++) c[o] = 252 <= o ? 6 : 248 <= o ? 5 : 240 <= o ? 4 : 224 <= o ? 3 : 192 <= o ? 2 : 1;
				function l(d, p) {
					if (p < 65537 && (d.subarray && u || !d.subarray && s)) return String.fromCharCode.apply(null, a.shrinkBuf(d, p));
					for (var h = "", A = 0; A < p; A++) h += String.fromCharCode(d[A]);
					return h;
				}
				c[254] = c[254] = 1, i.string2buf = function(d) {
					var p, h, A, f, g, _ = d.length, v = 0;
					for (f = 0; f < _; f++) (64512 & (h = d.charCodeAt(f))) == 55296 && f + 1 < _ && (64512 & (A = d.charCodeAt(f + 1))) == 56320 && (h = 65536 + (h - 55296 << 10) + (A - 56320), f++), v += h < 128 ? 1 : h < 2048 ? 2 : h < 65536 ? 3 : 4;
					for (p = new a.Buf8(v), f = g = 0; g < v; f++) (64512 & (h = d.charCodeAt(f))) == 55296 && f + 1 < _ && (64512 & (A = d.charCodeAt(f + 1))) == 56320 && (h = 65536 + (h - 55296 << 10) + (A - 56320), f++), h < 128 ? p[g++] = h : (h < 2048 ? p[g++] = 192 | h >>> 6 : (h < 65536 ? p[g++] = 224 | h >>> 12 : (p[g++] = 240 | h >>> 18, p[g++] = 128 | h >>> 12 & 63), p[g++] = 128 | h >>> 6 & 63), p[g++] = 128 | 63 & h);
					return p;
				}, i.buf2binstring = function(d) {
					return l(d, d.length);
				}, i.binstring2buf = function(d) {
					for (var p = new a.Buf8(d.length), h = 0, A = p.length; h < A; h++) p[h] = d.charCodeAt(h);
					return p;
				}, i.buf2string = function(d, p) {
					var h, A, f, g, _ = p || d.length, v = new Array(2 * _);
					for (h = A = 0; h < _;) if ((f = d[h++]) < 128) v[A++] = f;
					else if (4 < (g = c[f])) v[A++] = 65533, h += g - 1;
					else {
						for (f &= g === 2 ? 31 : g === 3 ? 15 : 7; 1 < g && h < _;) f = f << 6 | 63 & d[h++], g--;
						1 < g ? v[A++] = 65533 : f < 65536 ? v[A++] = f : (f -= 65536, v[A++] = 55296 | f >> 10 & 1023, v[A++] = 56320 | 1023 & f);
					}
					return l(v, A);
				}, i.utf8border = function(d, p) {
					var h;
					for ((p = p || d.length) > d.length && (p = d.length), h = p - 1; 0 <= h && (192 & d[h]) == 128;) h--;
					return h < 0 || h === 0 ? p : h + c[d[h]] > p ? h : p;
				};
			}, { "./common": 41 }],
			43: [function(t, n, i) {
				"use strict";
				n.exports = function(a, s, u, c) {
					for (var o = 65535 & a | 0, l = a >>> 16 & 65535 | 0, d = 0; u !== 0;) {
						for (u -= d = 2e3 < u ? 2e3 : u; l = l + (o = o + s[c++] | 0) | 0, --d;);
						o %= 65521, l %= 65521;
					}
					return o | l << 16 | 0;
				};
			}, {}],
			44: [function(t, n, i) {
				"use strict";
				n.exports = {
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
			}, {}],
			45: [function(t, n, i) {
				"use strict";
				var a = (function() {
					for (var s, u = [], c = 0; c < 256; c++) {
						s = c;
						for (var o = 0; o < 8; o++) s = 1 & s ? 3988292384 ^ s >>> 1 : s >>> 1;
						u[c] = s;
					}
					return u;
				})();
				n.exports = function(s, u, c, o) {
					var l = a, d = o + c;
					s ^= -1;
					for (var p = o; p < d; p++) s = s >>> 8 ^ l[255 & (s ^ u[p])];
					return -1 ^ s;
				};
			}, {}],
			46: [function(t, n, i) {
				"use strict";
				var a, s = t("../utils/common"), u = t("./trees"), c = t("./adler32"), o = t("./crc32"), l = t("./messages"), d = 0, p = 4, h = 0, A = -2, f = -1, g = 4, _ = 2, v = 8, b = 9, C = 286, T = 30, ee = 19, x = 2 * C + 1, G = 15, O = 3, k = 258, H = k + O + 1, m = 42, V = 113, y = 1, ie = 2, xe = 3, se = 4;
				function ae(w, N) {
					return w.msg = l[N], N;
				}
				function R(w) {
					return (w << 1) - (4 < w ? 9 : 0);
				}
				function W(w) {
					for (var N = w.length; 0 <= --N;) w[N] = 0;
				}
				function q(w) {
					var N = w.state, D = N.pending;
					D > w.avail_out && (D = w.avail_out), D !== 0 && (s.arraySet(w.output, N.pending_buf, N.pending_out, D, w.next_out), w.next_out += D, N.pending_out += D, w.total_out += D, w.avail_out -= D, N.pending -= D, N.pending === 0 && (N.pending_out = 0));
				}
				function Z(w, N) {
					u._tr_flush_block(w, 0 <= w.block_start ? w.block_start : -1, w.strstart - w.block_start, N), w.block_start = w.strstart, q(w.strm);
				}
				function ge(w, N) {
					w.pending_buf[w.pending++] = N;
				}
				function Ee(w, N) {
					w.pending_buf[w.pending++] = N >>> 8 & 255, w.pending_buf[w.pending++] = 255 & N;
				}
				function ye(w, N) {
					var D, I, S = w.max_chain_length, z = w.strstart, X = w.prev_length, K = w.nice_match, re = w.strstart > w.w_size - H ? w.strstart - (w.w_size - H) : 0, ne = w.window, oe = w.w_mask, me = w.prev, be = w.strstart + k, ze = ne[z + X - 1], He = ne[z + X];
					w.prev_length >= w.good_match && (S >>= 2), K > w.lookahead && (K = w.lookahead);
					do
						if (ne[(D = N) + X] === He && ne[D + X - 1] === ze && ne[D] === ne[z] && ne[++D] === ne[z + 1]) {
							z += 2, D++;
							do							;
while (ne[++z] === ne[++D] && ne[++z] === ne[++D] && ne[++z] === ne[++D] && ne[++z] === ne[++D] && ne[++z] === ne[++D] && ne[++z] === ne[++D] && ne[++z] === ne[++D] && ne[++z] === ne[++D] && z < be);
							if (I = k - (be - z), z = be - k, X < I) {
								if (w.match_start = N, K <= (X = I)) break;
								ze = ne[z + X - 1], He = ne[z + X];
							}
						}
					while ((N = me[N & oe]) > re && --S != 0);
					return X <= w.lookahead ? X : w.lookahead;
				}
				function Ne(w) {
					var N, D, I, S, z, X, K, re, ne, oe, me = w.w_size;
					do {
						if (S = w.window_size - w.lookahead - w.strstart, w.strstart >= me + (me - H)) {
							for (s.arraySet(w.window, w.window, me, me, 0), w.match_start -= me, w.strstart -= me, w.block_start -= me, N = D = w.hash_size; I = w.head[--N], w.head[N] = me <= I ? I - me : 0, --D;);
							for (N = D = me; I = w.prev[--N], w.prev[N] = me <= I ? I - me : 0, --D;);
							S += me;
						}
						if (w.strm.avail_in === 0) break;
						if (X = w.strm, K = w.window, re = w.strstart + w.lookahead, ne = S, oe = void 0, oe = X.avail_in, ne < oe && (oe = ne), D = oe === 0 ? 0 : (X.avail_in -= oe, s.arraySet(K, X.input, X.next_in, oe, re), X.state.wrap === 1 ? X.adler = c(X.adler, K, oe, re) : X.state.wrap === 2 && (X.adler = o(X.adler, K, oe, re)), X.next_in += oe, X.total_in += oe, oe), w.lookahead += D, w.lookahead + w.insert >= O) for (z = w.strstart - w.insert, w.ins_h = w.window[z], w.ins_h = (w.ins_h << w.hash_shift ^ w.window[z + 1]) & w.hash_mask; w.insert && (w.ins_h = (w.ins_h << w.hash_shift ^ w.window[z + O - 1]) & w.hash_mask, w.prev[z & w.w_mask] = w.head[w.ins_h], w.head[w.ins_h] = z, z++, w.insert--, !(w.lookahead + w.insert < O)););
					} while (w.lookahead < H && w.strm.avail_in !== 0);
				}
				function Oe(w, N) {
					for (var D, I;;) {
						if (w.lookahead < H) {
							if (Ne(w), w.lookahead < H && N === d) return y;
							if (w.lookahead === 0) break;
						}
						if (D = 0, w.lookahead >= O && (w.ins_h = (w.ins_h << w.hash_shift ^ w.window[w.strstart + O - 1]) & w.hash_mask, D = w.prev[w.strstart & w.w_mask] = w.head[w.ins_h], w.head[w.ins_h] = w.strstart), D !== 0 && w.strstart - D <= w.w_size - H && (w.match_length = ye(w, D)), w.match_length >= O) if (I = u._tr_tally(w, w.strstart - w.match_start, w.match_length - O), w.lookahead -= w.match_length, w.match_length <= w.max_lazy_match && w.lookahead >= O) {
							for (w.match_length--; w.strstart++, w.ins_h = (w.ins_h << w.hash_shift ^ w.window[w.strstart + O - 1]) & w.hash_mask, D = w.prev[w.strstart & w.w_mask] = w.head[w.ins_h], w.head[w.ins_h] = w.strstart, --w.match_length != 0;);
							w.strstart++;
						} else w.strstart += w.match_length, w.match_length = 0, w.ins_h = w.window[w.strstart], w.ins_h = (w.ins_h << w.hash_shift ^ w.window[w.strstart + 1]) & w.hash_mask;
						else I = u._tr_tally(w, 0, w.window[w.strstart]), w.lookahead--, w.strstart++;
						if (I && (Z(w, !1), w.strm.avail_out === 0)) return y;
					}
					return w.insert = w.strstart < O - 1 ? w.strstart : O - 1, N === p ? (Z(w, !0), w.strm.avail_out === 0 ? xe : se) : w.last_lit && (Z(w, !1), w.strm.avail_out === 0) ? y : ie;
				}
				function Ue(w, N) {
					for (var D, I, S;;) {
						if (w.lookahead < H) {
							if (Ne(w), w.lookahead < H && N === d) return y;
							if (w.lookahead === 0) break;
						}
						if (D = 0, w.lookahead >= O && (w.ins_h = (w.ins_h << w.hash_shift ^ w.window[w.strstart + O - 1]) & w.hash_mask, D = w.prev[w.strstart & w.w_mask] = w.head[w.ins_h], w.head[w.ins_h] = w.strstart), w.prev_length = w.match_length, w.prev_match = w.match_start, w.match_length = O - 1, D !== 0 && w.prev_length < w.max_lazy_match && w.strstart - D <= w.w_size - H && (w.match_length = ye(w, D), w.match_length <= 5 && (w.strategy === 1 || w.match_length === O && 4096 < w.strstart - w.match_start) && (w.match_length = O - 1)), w.prev_length >= O && w.match_length <= w.prev_length) {
							for (S = w.strstart + w.lookahead - O, I = u._tr_tally(w, w.strstart - 1 - w.prev_match, w.prev_length - O), w.lookahead -= w.prev_length - 1, w.prev_length -= 2; ++w.strstart <= S && (w.ins_h = (w.ins_h << w.hash_shift ^ w.window[w.strstart + O - 1]) & w.hash_mask, D = w.prev[w.strstart & w.w_mask] = w.head[w.ins_h], w.head[w.ins_h] = w.strstart), --w.prev_length != 0;);
							if (w.match_available = 0, w.match_length = O - 1, w.strstart++, I && (Z(w, !1), w.strm.avail_out === 0)) return y;
						} else if (w.match_available) {
							if ((I = u._tr_tally(w, 0, w.window[w.strstart - 1])) && Z(w, !1), w.strstart++, w.lookahead--, w.strm.avail_out === 0) return y;
						} else w.match_available = 1, w.strstart++, w.lookahead--;
					}
					return w.match_available && (I = u._tr_tally(w, 0, w.window[w.strstart - 1]), w.match_available = 0), w.insert = w.strstart < O - 1 ? w.strstart : O - 1, N === p ? (Z(w, !0), w.strm.avail_out === 0 ? xe : se) : w.last_lit && (Z(w, !1), w.strm.avail_out === 0) ? y : ie;
				}
				function Re(w, N, D, I, S) {
					this.good_length = w, this.max_lazy = N, this.nice_length = D, this.max_chain = I, this.func = S;
				}
				function je() {
					this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = v, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new s.Buf16(2 * x), this.dyn_dtree = new s.Buf16(2 * (2 * T + 1)), this.bl_tree = new s.Buf16(2 * (2 * ee + 1)), W(this.dyn_ltree), W(this.dyn_dtree), W(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new s.Buf16(G + 1), this.heap = new s.Buf16(2 * C + 1), W(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new s.Buf16(2 * C + 1), W(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
				}
				function qe(w) {
					var N;
					return w && w.state ? (w.total_in = w.total_out = 0, w.data_type = _, (N = w.state).pending = 0, N.pending_out = 0, N.wrap < 0 && (N.wrap = -N.wrap), N.status = N.wrap ? m : V, w.adler = N.wrap === 2 ? 0 : 1, N.last_flush = d, u._tr_init(N), h) : ae(w, A);
				}
				function E(w) {
					var N = qe(w);
					return N === h && (function(D) {
						D.window_size = 2 * D.w_size, W(D.head), D.max_lazy_match = a[D.level].max_lazy, D.good_match = a[D.level].good_length, D.nice_match = a[D.level].nice_length, D.max_chain_length = a[D.level].max_chain, D.strstart = 0, D.block_start = 0, D.lookahead = 0, D.insert = 0, D.match_length = D.prev_length = O - 1, D.match_available = 0, D.ins_h = 0;
					})(w.state), N;
				}
				function _e(w, N, D, I, S, z) {
					if (!w) return A;
					var X = 1;
					if (N === f && (N = 6), I < 0 ? (X = 0, I = -I) : 15 < I && (X = 2, I -= 16), S < 1 || b < S || D !== v || I < 8 || 15 < I || N < 0 || 9 < N || z < 0 || g < z) return ae(w, A);
					I === 8 && (I = 9);
					var K = new je();
					return (w.state = K).strm = w, K.wrap = X, K.gzhead = null, K.w_bits = I, K.w_size = 1 << K.w_bits, K.w_mask = K.w_size - 1, K.hash_bits = S + 7, K.hash_size = 1 << K.hash_bits, K.hash_mask = K.hash_size - 1, K.hash_shift = ~~((K.hash_bits + O - 1) / O), K.window = new s.Buf8(2 * K.w_size), K.head = new s.Buf16(K.hash_size), K.prev = new s.Buf16(K.w_size), K.lit_bufsize = 1 << S + 6, K.pending_buf_size = 4 * K.lit_bufsize, K.pending_buf = new s.Buf8(K.pending_buf_size), K.d_buf = 1 * K.lit_bufsize, K.l_buf = 3 * K.lit_bufsize, K.level = N, K.strategy = z, K.method = D, E(w);
				}
				a = [
					new Re(0, 0, 0, 0, function(w, N) {
						var D = 65535;
						for (D > w.pending_buf_size - 5 && (D = w.pending_buf_size - 5);;) {
							if (w.lookahead <= 1) {
								if (Ne(w), w.lookahead === 0 && N === d) return y;
								if (w.lookahead === 0) break;
							}
							w.strstart += w.lookahead, w.lookahead = 0;
							var I = w.block_start + D;
							if ((w.strstart === 0 || w.strstart >= I) && (w.lookahead = w.strstart - I, w.strstart = I, Z(w, !1), w.strm.avail_out === 0) || w.strstart - w.block_start >= w.w_size - H && (Z(w, !1), w.strm.avail_out === 0)) return y;
						}
						return w.insert = 0, N === p ? (Z(w, !0), w.strm.avail_out === 0 ? xe : se) : (w.strstart > w.block_start && (Z(w, !1), w.strm.avail_out), y);
					}),
					new Re(4, 4, 8, 4, Oe),
					new Re(4, 5, 16, 8, Oe),
					new Re(4, 6, 32, 32, Oe),
					new Re(4, 4, 16, 16, Ue),
					new Re(8, 16, 32, 32, Ue),
					new Re(8, 16, 128, 128, Ue),
					new Re(8, 32, 128, 256, Ue),
					new Re(32, 128, 258, 1024, Ue),
					new Re(32, 258, 258, 4096, Ue)
				], i.deflateInit = function(w, N) {
					return _e(w, N, v, 15, 8, 0);
				}, i.deflateInit2 = _e, i.deflateReset = E, i.deflateResetKeep = qe, i.deflateSetHeader = function(w, N) {
					return w && w.state ? w.state.wrap !== 2 ? A : (w.state.gzhead = N, h) : A;
				}, i.deflate = function(w, N) {
					var D, I, S, z;
					if (!w || !w.state || 5 < N || N < 0) return w ? ae(w, A) : A;
					if (I = w.state, !w.output || !w.input && w.avail_in !== 0 || I.status === 666 && N !== p) return ae(w, w.avail_out === 0 ? -5 : A);
					if (I.strm = w, D = I.last_flush, I.last_flush = N, I.status === m) if (I.wrap === 2) w.adler = 0, ge(I, 31), ge(I, 139), ge(I, 8), I.gzhead ? (ge(I, (I.gzhead.text ? 1 : 0) + (I.gzhead.hcrc ? 2 : 0) + (I.gzhead.extra ? 4 : 0) + (I.gzhead.name ? 8 : 0) + (I.gzhead.comment ? 16 : 0)), ge(I, 255 & I.gzhead.time), ge(I, I.gzhead.time >> 8 & 255), ge(I, I.gzhead.time >> 16 & 255), ge(I, I.gzhead.time >> 24 & 255), ge(I, I.level === 9 ? 2 : 2 <= I.strategy || I.level < 2 ? 4 : 0), ge(I, 255 & I.gzhead.os), I.gzhead.extra && I.gzhead.extra.length && (ge(I, 255 & I.gzhead.extra.length), ge(I, I.gzhead.extra.length >> 8 & 255)), I.gzhead.hcrc && (w.adler = o(w.adler, I.pending_buf, I.pending, 0)), I.gzindex = 0, I.status = 69) : (ge(I, 0), ge(I, 0), ge(I, 0), ge(I, 0), ge(I, 0), ge(I, I.level === 9 ? 2 : 2 <= I.strategy || I.level < 2 ? 4 : 0), ge(I, 3), I.status = V);
					else {
						var X = v + (I.w_bits - 8 << 4) << 8;
						X |= (2 <= I.strategy || I.level < 2 ? 0 : I.level < 6 ? 1 : I.level === 6 ? 2 : 3) << 6, I.strstart !== 0 && (X |= 32), X += 31 - X % 31, I.status = V, Ee(I, X), I.strstart !== 0 && (Ee(I, w.adler >>> 16), Ee(I, 65535 & w.adler)), w.adler = 1;
					}
					if (I.status === 69) if (I.gzhead.extra) {
						for (S = I.pending; I.gzindex < (65535 & I.gzhead.extra.length) && (I.pending !== I.pending_buf_size || (I.gzhead.hcrc && I.pending > S && (w.adler = o(w.adler, I.pending_buf, I.pending - S, S)), q(w), S = I.pending, I.pending !== I.pending_buf_size));) ge(I, 255 & I.gzhead.extra[I.gzindex]), I.gzindex++;
						I.gzhead.hcrc && I.pending > S && (w.adler = o(w.adler, I.pending_buf, I.pending - S, S)), I.gzindex === I.gzhead.extra.length && (I.gzindex = 0, I.status = 73);
					} else I.status = 73;
					if (I.status === 73) if (I.gzhead.name) {
						S = I.pending;
						do {
							if (I.pending === I.pending_buf_size && (I.gzhead.hcrc && I.pending > S && (w.adler = o(w.adler, I.pending_buf, I.pending - S, S)), q(w), S = I.pending, I.pending === I.pending_buf_size)) {
								z = 1;
								break;
							}
							z = I.gzindex < I.gzhead.name.length ? 255 & I.gzhead.name.charCodeAt(I.gzindex++) : 0, ge(I, z);
						} while (z !== 0);
						I.gzhead.hcrc && I.pending > S && (w.adler = o(w.adler, I.pending_buf, I.pending - S, S)), z === 0 && (I.gzindex = 0, I.status = 91);
					} else I.status = 91;
					if (I.status === 91) if (I.gzhead.comment) {
						S = I.pending;
						do {
							if (I.pending === I.pending_buf_size && (I.gzhead.hcrc && I.pending > S && (w.adler = o(w.adler, I.pending_buf, I.pending - S, S)), q(w), S = I.pending, I.pending === I.pending_buf_size)) {
								z = 1;
								break;
							}
							z = I.gzindex < I.gzhead.comment.length ? 255 & I.gzhead.comment.charCodeAt(I.gzindex++) : 0, ge(I, z);
						} while (z !== 0);
						I.gzhead.hcrc && I.pending > S && (w.adler = o(w.adler, I.pending_buf, I.pending - S, S)), z === 0 && (I.status = 103);
					} else I.status = 103;
					if (I.status === 103 && (I.gzhead.hcrc ? (I.pending + 2 > I.pending_buf_size && q(w), I.pending + 2 <= I.pending_buf_size && (ge(I, 255 & w.adler), ge(I, w.adler >> 8 & 255), w.adler = 0, I.status = V)) : I.status = V), I.pending !== 0) {
						if (q(w), w.avail_out === 0) return I.last_flush = -1, h;
					} else if (w.avail_in === 0 && R(N) <= R(D) && N !== p) return ae(w, -5);
					if (I.status === 666 && w.avail_in !== 0) return ae(w, -5);
					if (w.avail_in !== 0 || I.lookahead !== 0 || N !== d && I.status !== 666) {
						var K = I.strategy === 2 ? (function(re, ne) {
							for (var oe;;) {
								if (re.lookahead === 0 && (Ne(re), re.lookahead === 0)) {
									if (ne === d) return y;
									break;
								}
								if (re.match_length = 0, oe = u._tr_tally(re, 0, re.window[re.strstart]), re.lookahead--, re.strstart++, oe && (Z(re, !1), re.strm.avail_out === 0)) return y;
							}
							return re.insert = 0, ne === p ? (Z(re, !0), re.strm.avail_out === 0 ? xe : se) : re.last_lit && (Z(re, !1), re.strm.avail_out === 0) ? y : ie;
						})(I, N) : I.strategy === 3 ? (function(re, ne) {
							for (var oe, me, be, ze, He = re.window;;) {
								if (re.lookahead <= k) {
									if (Ne(re), re.lookahead <= k && ne === d) return y;
									if (re.lookahead === 0) break;
								}
								if (re.match_length = 0, re.lookahead >= O && 0 < re.strstart && (me = He[be = re.strstart - 1]) === He[++be] && me === He[++be] && me === He[++be]) {
									ze = re.strstart + k;
									do									;
while (me === He[++be] && me === He[++be] && me === He[++be] && me === He[++be] && me === He[++be] && me === He[++be] && me === He[++be] && me === He[++be] && be < ze);
									re.match_length = k - (ze - be), re.match_length > re.lookahead && (re.match_length = re.lookahead);
								}
								if (re.match_length >= O ? (oe = u._tr_tally(re, 1, re.match_length - O), re.lookahead -= re.match_length, re.strstart += re.match_length, re.match_length = 0) : (oe = u._tr_tally(re, 0, re.window[re.strstart]), re.lookahead--, re.strstart++), oe && (Z(re, !1), re.strm.avail_out === 0)) return y;
							}
							return re.insert = 0, ne === p ? (Z(re, !0), re.strm.avail_out === 0 ? xe : se) : re.last_lit && (Z(re, !1), re.strm.avail_out === 0) ? y : ie;
						})(I, N) : a[I.level].func(I, N);
						if (K !== xe && K !== se || (I.status = 666), K === y || K === xe) return w.avail_out === 0 && (I.last_flush = -1), h;
						if (K === ie && (N === 1 ? u._tr_align(I) : N !== 5 && (u._tr_stored_block(I, 0, 0, !1), N === 3 && (W(I.head), I.lookahead === 0 && (I.strstart = 0, I.block_start = 0, I.insert = 0))), q(w), w.avail_out === 0)) return I.last_flush = -1, h;
					}
					return N !== p ? h : I.wrap <= 0 ? 1 : (I.wrap === 2 ? (ge(I, 255 & w.adler), ge(I, w.adler >> 8 & 255), ge(I, w.adler >> 16 & 255), ge(I, w.adler >> 24 & 255), ge(I, 255 & w.total_in), ge(I, w.total_in >> 8 & 255), ge(I, w.total_in >> 16 & 255), ge(I, w.total_in >> 24 & 255)) : (Ee(I, w.adler >>> 16), Ee(I, 65535 & w.adler)), q(w), 0 < I.wrap && (I.wrap = -I.wrap), I.pending !== 0 ? h : 1);
				}, i.deflateEnd = function(w) {
					var N;
					return w && w.state ? (N = w.state.status) !== m && N !== 69 && N !== 73 && N !== 91 && N !== 103 && N !== V && N !== 666 ? ae(w, A) : (w.state = null, N === V ? ae(w, -3) : h) : A;
				}, i.deflateSetDictionary = function(w, N) {
					var D, I, S, z, X, K, re, ne, oe = N.length;
					if (!w || !w.state || (z = (D = w.state).wrap) === 2 || z === 1 && D.status !== m || D.lookahead) return A;
					for (z === 1 && (w.adler = c(w.adler, N, oe, 0)), D.wrap = 0, oe >= D.w_size && (z === 0 && (W(D.head), D.strstart = 0, D.block_start = 0, D.insert = 0), ne = new s.Buf8(D.w_size), s.arraySet(ne, N, oe - D.w_size, D.w_size, 0), N = ne, oe = D.w_size), X = w.avail_in, K = w.next_in, re = w.input, w.avail_in = oe, w.next_in = 0, w.input = N, Ne(D); D.lookahead >= O;) {
						for (I = D.strstart, S = D.lookahead - (O - 1); D.ins_h = (D.ins_h << D.hash_shift ^ D.window[I + O - 1]) & D.hash_mask, D.prev[I & D.w_mask] = D.head[D.ins_h], D.head[D.ins_h] = I, I++, --S;);
						D.strstart = I, D.lookahead = O - 1, Ne(D);
					}
					return D.strstart += D.lookahead, D.block_start = D.strstart, D.insert = D.lookahead, D.lookahead = 0, D.match_length = D.prev_length = O - 1, D.match_available = 0, w.next_in = K, w.input = re, w.avail_in = X, D.wrap = z, h;
				}, i.deflateInfo = "pako deflate (from Nodeca project)";
			}, {
				"../utils/common": 41,
				"./adler32": 43,
				"./crc32": 45,
				"./messages": 51,
				"./trees": 52
			}],
			47: [function(t, n, i) {
				"use strict";
				n.exports = function() {
					this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
				};
			}, {}],
			48: [function(t, n, i) {
				"use strict";
				n.exports = function(a, s) {
					var u = a.state, c = a.next_in, o, l, d, p, h, A, f, g, _, v, b, C, T, ee, x, G, O, k, H, m, V, y = a.input, ie;
					o = c + (a.avail_in - 5), l = a.next_out, ie = a.output, d = l - (s - a.avail_out), p = l + (a.avail_out - 257), h = u.dmax, A = u.wsize, f = u.whave, g = u.wnext, _ = u.window, v = u.hold, b = u.bits, C = u.lencode, T = u.distcode, ee = (1 << u.lenbits) - 1, x = (1 << u.distbits) - 1;
					e: do {
						b < 15 && (v += y[c++] << b, b += 8, v += y[c++] << b, b += 8), G = C[v & ee];
						t: for (;;) {
							if (v >>>= O = G >>> 24, b -= O, (O = G >>> 16 & 255) === 0) ie[l++] = 65535 & G;
							else {
								if (!(16 & O)) {
									if ((64 & O) == 0) {
										G = C[(65535 & G) + (v & (1 << O) - 1)];
										continue t;
									}
									if (32 & O) {
										u.mode = 12;
										break e;
									}
									a.msg = "invalid literal/length code", u.mode = 30;
									break e;
								}
								k = 65535 & G, (O &= 15) && (b < O && (v += y[c++] << b, b += 8), k += v & (1 << O) - 1, v >>>= O, b -= O), b < 15 && (v += y[c++] << b, b += 8, v += y[c++] << b, b += 8), G = T[v & x];
								r: for (;;) {
									if (v >>>= O = G >>> 24, b -= O, !(16 & (O = G >>> 16 & 255))) {
										if ((64 & O) == 0) {
											G = T[(65535 & G) + (v & (1 << O) - 1)];
											continue r;
										}
										a.msg = "invalid distance code", u.mode = 30;
										break e;
									}
									if (H = 65535 & G, b < (O &= 15) && (v += y[c++] << b, (b += 8) < O && (v += y[c++] << b, b += 8)), h < (H += v & (1 << O) - 1)) {
										a.msg = "invalid distance too far back", u.mode = 30;
										break e;
									}
									if (v >>>= O, b -= O, (O = l - d) < H) {
										if (f < (O = H - O) && u.sane) {
											a.msg = "invalid distance too far back", u.mode = 30;
											break e;
										}
										if (V = _, (m = 0) === g) {
											if (m += A - O, O < k) {
												for (k -= O; ie[l++] = _[m++], --O;);
												m = l - H, V = ie;
											}
										} else if (g < O) {
											if (m += A + g - O, (O -= g) < k) {
												for (k -= O; ie[l++] = _[m++], --O;);
												if (m = 0, g < k) {
													for (k -= O = g; ie[l++] = _[m++], --O;);
													m = l - H, V = ie;
												}
											}
										} else if (m += g - O, O < k) {
											for (k -= O; ie[l++] = _[m++], --O;);
											m = l - H, V = ie;
										}
										for (; 2 < k;) ie[l++] = V[m++], ie[l++] = V[m++], ie[l++] = V[m++], k -= 3;
										k && (ie[l++] = V[m++], 1 < k && (ie[l++] = V[m++]));
									} else {
										for (m = l - H; ie[l++] = ie[m++], ie[l++] = ie[m++], ie[l++] = ie[m++], 2 < (k -= 3););
										k && (ie[l++] = ie[m++], 1 < k && (ie[l++] = ie[m++]));
									}
									break;
								}
							}
							break;
						}
					} while (c < o && l < p);
					c -= k = b >> 3, v &= (1 << (b -= k << 3)) - 1, a.next_in = c, a.next_out = l, a.avail_in = c < o ? o - c + 5 : 5 - (c - o), a.avail_out = l < p ? p - l + 257 : 257 - (l - p), u.hold = v, u.bits = b;
				};
			}, {}],
			49: [function(t, n, i) {
				"use strict";
				var a = t("../utils/common"), s = t("./adler32"), u = t("./crc32"), c = t("./inffast"), o = t("./inftrees"), l = 1, d = 2, p = 0, h = -2, A = 1, f = 852, g = 592;
				function _(m) {
					return (m >>> 24 & 255) + (m >>> 8 & 65280) + ((65280 & m) << 8) + ((255 & m) << 24);
				}
				function v() {
					this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new a.Buf16(320), this.work = new a.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
				}
				function b(m) {
					var V;
					return m && m.state ? (V = m.state, m.total_in = m.total_out = V.total = 0, m.msg = "", V.wrap && (m.adler = 1 & V.wrap), V.mode = A, V.last = 0, V.havedict = 0, V.dmax = 32768, V.head = null, V.hold = 0, V.bits = 0, V.lencode = V.lendyn = new a.Buf32(f), V.distcode = V.distdyn = new a.Buf32(g), V.sane = 1, V.back = -1, p) : h;
				}
				function C(m) {
					var V;
					return m && m.state ? ((V = m.state).wsize = 0, V.whave = 0, V.wnext = 0, b(m)) : h;
				}
				function T(m, V) {
					var y, ie;
					return m && m.state ? (ie = m.state, V < 0 ? (y = 0, V = -V) : (y = 1 + (V >> 4), V < 48 && (V &= 15)), V && (V < 8 || 15 < V) ? h : (ie.window !== null && ie.wbits !== V && (ie.window = null), ie.wrap = y, ie.wbits = V, C(m))) : h;
				}
				function ee(m, V) {
					var y, ie;
					return m ? (ie = new v(), (m.state = ie).window = null, (y = T(m, V)) !== p && (m.state = null), y) : h;
				}
				var x, G, O = !0;
				function k(m) {
					if (O) {
						var V;
						for (x = new a.Buf32(512), G = new a.Buf32(32), V = 0; V < 144;) m.lens[V++] = 8;
						for (; V < 256;) m.lens[V++] = 9;
						for (; V < 280;) m.lens[V++] = 7;
						for (; V < 288;) m.lens[V++] = 8;
						for (o(l, m.lens, 0, 288, x, 0, m.work, { bits: 9 }), V = 0; V < 32;) m.lens[V++] = 5;
						o(d, m.lens, 0, 32, G, 0, m.work, { bits: 5 }), O = !1;
					}
					m.lencode = x, m.lenbits = 9, m.distcode = G, m.distbits = 5;
				}
				function H(m, V, y, ie) {
					var xe, se = m.state;
					return se.window === null && (se.wsize = 1 << se.wbits, se.wnext = 0, se.whave = 0, se.window = new a.Buf8(se.wsize)), ie >= se.wsize ? (a.arraySet(se.window, V, y - se.wsize, se.wsize, 0), se.wnext = 0, se.whave = se.wsize) : (ie < (xe = se.wsize - se.wnext) && (xe = ie), a.arraySet(se.window, V, y - ie, xe, se.wnext), (ie -= xe) ? (a.arraySet(se.window, V, y - ie, ie, 0), se.wnext = ie, se.whave = se.wsize) : (se.wnext += xe, se.wnext === se.wsize && (se.wnext = 0), se.whave < se.wsize && (se.whave += xe))), 0;
				}
				i.inflateReset = C, i.inflateReset2 = T, i.inflateResetKeep = b, i.inflateInit = function(m) {
					return ee(m, 15);
				}, i.inflateInit2 = ee, i.inflate = function(m, V) {
					var y, ie, xe, se, ae, R, W, q, Z, ge, Ee, ye, Ne, Oe, Ue, Re, je, qe, E, _e, w, N, D, I, S = 0, z = new a.Buf8(4), X = [
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
					if (!m || !m.state || !m.output || !m.input && m.avail_in !== 0) return h;
					(y = m.state).mode === 12 && (y.mode = 13), ae = m.next_out, xe = m.output, W = m.avail_out, se = m.next_in, ie = m.input, R = m.avail_in, q = y.hold, Z = y.bits, ge = R, Ee = W, N = p;
					e: for (;;) switch (y.mode) {
						case A:
							if (y.wrap === 0) {
								y.mode = 13;
								break;
							}
							for (; Z < 16;) {
								if (R === 0) break e;
								R--, q += ie[se++] << Z, Z += 8;
							}
							if (2 & y.wrap && q === 35615) {
								z[y.check = 0] = 255 & q, z[1] = q >>> 8 & 255, y.check = u(y.check, z, 2, 0), Z = q = 0, y.mode = 2;
								break;
							}
							if (y.flags = 0, y.head && (y.head.done = !1), !(1 & y.wrap) || (((255 & q) << 8) + (q >> 8)) % 31) {
								m.msg = "incorrect header check", y.mode = 30;
								break;
							}
							if ((15 & q) != 8) {
								m.msg = "unknown compression method", y.mode = 30;
								break;
							}
							if (Z -= 4, w = 8 + (15 & (q >>>= 4)), y.wbits === 0) y.wbits = w;
							else if (w > y.wbits) {
								m.msg = "invalid window size", y.mode = 30;
								break;
							}
							y.dmax = 1 << w, m.adler = y.check = 1, y.mode = 512 & q ? 10 : 12, Z = q = 0;
							break;
						case 2:
							for (; Z < 16;) {
								if (R === 0) break e;
								R--, q += ie[se++] << Z, Z += 8;
							}
							if (y.flags = q, (255 & y.flags) != 8) {
								m.msg = "unknown compression method", y.mode = 30;
								break;
							}
							if (57344 & y.flags) {
								m.msg = "unknown header flags set", y.mode = 30;
								break;
							}
							y.head && (y.head.text = q >> 8 & 1), 512 & y.flags && (z[0] = 255 & q, z[1] = q >>> 8 & 255, y.check = u(y.check, z, 2, 0)), Z = q = 0, y.mode = 3;
						case 3:
							for (; Z < 32;) {
								if (R === 0) break e;
								R--, q += ie[se++] << Z, Z += 8;
							}
							y.head && (y.head.time = q), 512 & y.flags && (z[0] = 255 & q, z[1] = q >>> 8 & 255, z[2] = q >>> 16 & 255, z[3] = q >>> 24 & 255, y.check = u(y.check, z, 4, 0)), Z = q = 0, y.mode = 4;
						case 4:
							for (; Z < 16;) {
								if (R === 0) break e;
								R--, q += ie[se++] << Z, Z += 8;
							}
							y.head && (y.head.xflags = 255 & q, y.head.os = q >> 8), 512 & y.flags && (z[0] = 255 & q, z[1] = q >>> 8 & 255, y.check = u(y.check, z, 2, 0)), Z = q = 0, y.mode = 5;
						case 5:
							if (1024 & y.flags) {
								for (; Z < 16;) {
									if (R === 0) break e;
									R--, q += ie[se++] << Z, Z += 8;
								}
								y.length = q, y.head && (y.head.extra_len = q), 512 & y.flags && (z[0] = 255 & q, z[1] = q >>> 8 & 255, y.check = u(y.check, z, 2, 0)), Z = q = 0;
							} else y.head && (y.head.extra = null);
							y.mode = 6;
						case 6:
							if (1024 & y.flags && (R < (ye = y.length) && (ye = R), ye && (y.head && (w = y.head.extra_len - y.length, y.head.extra || (y.head.extra = new Array(y.head.extra_len)), a.arraySet(y.head.extra, ie, se, ye, w)), 512 & y.flags && (y.check = u(y.check, ie, ye, se)), R -= ye, se += ye, y.length -= ye), y.length)) break e;
							y.length = 0, y.mode = 7;
						case 7:
							if (2048 & y.flags) {
								if (R === 0) break e;
								for (ye = 0; w = ie[se + ye++], y.head && w && y.length < 65536 && (y.head.name += String.fromCharCode(w)), w && ye < R;);
								if (512 & y.flags && (y.check = u(y.check, ie, ye, se)), R -= ye, se += ye, w) break e;
							} else y.head && (y.head.name = null);
							y.length = 0, y.mode = 8;
						case 8:
							if (4096 & y.flags) {
								if (R === 0) break e;
								for (ye = 0; w = ie[se + ye++], y.head && w && y.length < 65536 && (y.head.comment += String.fromCharCode(w)), w && ye < R;);
								if (512 & y.flags && (y.check = u(y.check, ie, ye, se)), R -= ye, se += ye, w) break e;
							} else y.head && (y.head.comment = null);
							y.mode = 9;
						case 9:
							if (512 & y.flags) {
								for (; Z < 16;) {
									if (R === 0) break e;
									R--, q += ie[se++] << Z, Z += 8;
								}
								if (q !== (65535 & y.check)) {
									m.msg = "header crc mismatch", y.mode = 30;
									break;
								}
								Z = q = 0;
							}
							y.head && (y.head.hcrc = y.flags >> 9 & 1, y.head.done = !0), m.adler = y.check = 0, y.mode = 12;
							break;
						case 10:
							for (; Z < 32;) {
								if (R === 0) break e;
								R--, q += ie[se++] << Z, Z += 8;
							}
							m.adler = y.check = _(q), Z = q = 0, y.mode = 11;
						case 11:
							if (y.havedict === 0) return m.next_out = ae, m.avail_out = W, m.next_in = se, m.avail_in = R, y.hold = q, y.bits = Z, 2;
							m.adler = y.check = 1, y.mode = 12;
						case 12: if (V === 5 || V === 6) break e;
						case 13:
							if (y.last) {
								q >>>= 7 & Z, Z -= 7 & Z, y.mode = 27;
								break;
							}
							for (; Z < 3;) {
								if (R === 0) break e;
								R--, q += ie[se++] << Z, Z += 8;
							}
							switch (y.last = 1 & q, Z -= 1, 3 & (q >>>= 1)) {
								case 0:
									y.mode = 14;
									break;
								case 1:
									if (k(y), y.mode = 20, V !== 6) break;
									q >>>= 2, Z -= 2;
									break e;
								case 2:
									y.mode = 17;
									break;
								case 3: m.msg = "invalid block type", y.mode = 30;
							}
							q >>>= 2, Z -= 2;
							break;
						case 14:
							for (q >>>= 7 & Z, Z -= 7 & Z; Z < 32;) {
								if (R === 0) break e;
								R--, q += ie[se++] << Z, Z += 8;
							}
							if ((65535 & q) != (q >>> 16 ^ 65535)) {
								m.msg = "invalid stored block lengths", y.mode = 30;
								break;
							}
							if (y.length = 65535 & q, Z = q = 0, y.mode = 15, V === 6) break e;
						case 15: y.mode = 16;
						case 16:
							if (ye = y.length) {
								if (R < ye && (ye = R), W < ye && (ye = W), ye === 0) break e;
								a.arraySet(xe, ie, se, ye, ae), R -= ye, se += ye, W -= ye, ae += ye, y.length -= ye;
								break;
							}
							y.mode = 12;
							break;
						case 17:
							for (; Z < 14;) {
								if (R === 0) break e;
								R--, q += ie[se++] << Z, Z += 8;
							}
							if (y.nlen = 257 + (31 & q), q >>>= 5, Z -= 5, y.ndist = 1 + (31 & q), q >>>= 5, Z -= 5, y.ncode = 4 + (15 & q), q >>>= 4, Z -= 4, 286 < y.nlen || 30 < y.ndist) {
								m.msg = "too many length or distance symbols", y.mode = 30;
								break;
							}
							y.have = 0, y.mode = 18;
						case 18:
							for (; y.have < y.ncode;) {
								for (; Z < 3;) {
									if (R === 0) break e;
									R--, q += ie[se++] << Z, Z += 8;
								}
								y.lens[X[y.have++]] = 7 & q, q >>>= 3, Z -= 3;
							}
							for (; y.have < 19;) y.lens[X[y.have++]] = 0;
							if (y.lencode = y.lendyn, y.lenbits = 7, D = { bits: y.lenbits }, N = o(0, y.lens, 0, 19, y.lencode, 0, y.work, D), y.lenbits = D.bits, N) {
								m.msg = "invalid code lengths set", y.mode = 30;
								break;
							}
							y.have = 0, y.mode = 19;
						case 19:
							for (; y.have < y.nlen + y.ndist;) {
								for (; Re = (S = y.lencode[q & (1 << y.lenbits) - 1]) >>> 16 & 255, je = 65535 & S, !((Ue = S >>> 24) <= Z);) {
									if (R === 0) break e;
									R--, q += ie[se++] << Z, Z += 8;
								}
								if (je < 16) q >>>= Ue, Z -= Ue, y.lens[y.have++] = je;
								else {
									if (je === 16) {
										for (I = Ue + 2; Z < I;) {
											if (R === 0) break e;
											R--, q += ie[se++] << Z, Z += 8;
										}
										if (q >>>= Ue, Z -= Ue, y.have === 0) {
											m.msg = "invalid bit length repeat", y.mode = 30;
											break;
										}
										w = y.lens[y.have - 1], ye = 3 + (3 & q), q >>>= 2, Z -= 2;
									} else if (je === 17) {
										for (I = Ue + 3; Z < I;) {
											if (R === 0) break e;
											R--, q += ie[se++] << Z, Z += 8;
										}
										Z -= Ue, w = 0, ye = 3 + (7 & (q >>>= Ue)), q >>>= 3, Z -= 3;
									} else {
										for (I = Ue + 7; Z < I;) {
											if (R === 0) break e;
											R--, q += ie[se++] << Z, Z += 8;
										}
										Z -= Ue, w = 0, ye = 11 + (127 & (q >>>= Ue)), q >>>= 7, Z -= 7;
									}
									if (y.have + ye > y.nlen + y.ndist) {
										m.msg = "invalid bit length repeat", y.mode = 30;
										break;
									}
									for (; ye--;) y.lens[y.have++] = w;
								}
							}
							if (y.mode === 30) break;
							if (y.lens[256] === 0) {
								m.msg = "invalid code -- missing end-of-block", y.mode = 30;
								break;
							}
							if (y.lenbits = 9, D = { bits: y.lenbits }, N = o(l, y.lens, 0, y.nlen, y.lencode, 0, y.work, D), y.lenbits = D.bits, N) {
								m.msg = "invalid literal/lengths set", y.mode = 30;
								break;
							}
							if (y.distbits = 6, y.distcode = y.distdyn, D = { bits: y.distbits }, N = o(d, y.lens, y.nlen, y.ndist, y.distcode, 0, y.work, D), y.distbits = D.bits, N) {
								m.msg = "invalid distances set", y.mode = 30;
								break;
							}
							if (y.mode = 20, V === 6) break e;
						case 20: y.mode = 21;
						case 21:
							if (6 <= R && 258 <= W) {
								m.next_out = ae, m.avail_out = W, m.next_in = se, m.avail_in = R, y.hold = q, y.bits = Z, c(m, Ee), ae = m.next_out, xe = m.output, W = m.avail_out, se = m.next_in, ie = m.input, R = m.avail_in, q = y.hold, Z = y.bits, y.mode === 12 && (y.back = -1);
								break;
							}
							for (y.back = 0; Re = (S = y.lencode[q & (1 << y.lenbits) - 1]) >>> 16 & 255, je = 65535 & S, !((Ue = S >>> 24) <= Z);) {
								if (R === 0) break e;
								R--, q += ie[se++] << Z, Z += 8;
							}
							if (Re && (240 & Re) == 0) {
								for (qe = Ue, E = Re, _e = je; Re = (S = y.lencode[_e + ((q & (1 << qe + E) - 1) >> qe)]) >>> 16 & 255, je = 65535 & S, !(qe + (Ue = S >>> 24) <= Z);) {
									if (R === 0) break e;
									R--, q += ie[se++] << Z, Z += 8;
								}
								q >>>= qe, Z -= qe, y.back += qe;
							}
							if (q >>>= Ue, Z -= Ue, y.back += Ue, y.length = je, Re === 0) {
								y.mode = 26;
								break;
							}
							if (32 & Re) {
								y.back = -1, y.mode = 12;
								break;
							}
							if (64 & Re) {
								m.msg = "invalid literal/length code", y.mode = 30;
								break;
							}
							y.extra = 15 & Re, y.mode = 22;
						case 22:
							if (y.extra) {
								for (I = y.extra; Z < I;) {
									if (R === 0) break e;
									R--, q += ie[se++] << Z, Z += 8;
								}
								y.length += q & (1 << y.extra) - 1, q >>>= y.extra, Z -= y.extra, y.back += y.extra;
							}
							y.was = y.length, y.mode = 23;
						case 23:
							for (; Re = (S = y.distcode[q & (1 << y.distbits) - 1]) >>> 16 & 255, je = 65535 & S, !((Ue = S >>> 24) <= Z);) {
								if (R === 0) break e;
								R--, q += ie[se++] << Z, Z += 8;
							}
							if ((240 & Re) == 0) {
								for (qe = Ue, E = Re, _e = je; Re = (S = y.distcode[_e + ((q & (1 << qe + E) - 1) >> qe)]) >>> 16 & 255, je = 65535 & S, !(qe + (Ue = S >>> 24) <= Z);) {
									if (R === 0) break e;
									R--, q += ie[se++] << Z, Z += 8;
								}
								q >>>= qe, Z -= qe, y.back += qe;
							}
							if (q >>>= Ue, Z -= Ue, y.back += Ue, 64 & Re) {
								m.msg = "invalid distance code", y.mode = 30;
								break;
							}
							y.offset = je, y.extra = 15 & Re, y.mode = 24;
						case 24:
							if (y.extra) {
								for (I = y.extra; Z < I;) {
									if (R === 0) break e;
									R--, q += ie[se++] << Z, Z += 8;
								}
								y.offset += q & (1 << y.extra) - 1, q >>>= y.extra, Z -= y.extra, y.back += y.extra;
							}
							if (y.offset > y.dmax) {
								m.msg = "invalid distance too far back", y.mode = 30;
								break;
							}
							y.mode = 25;
						case 25:
							if (W === 0) break e;
							if (ye = Ee - W, y.offset > ye) {
								if ((ye = y.offset - ye) > y.whave && y.sane) {
									m.msg = "invalid distance too far back", y.mode = 30;
									break;
								}
								Ne = ye > y.wnext ? (ye -= y.wnext, y.wsize - ye) : y.wnext - ye, ye > y.length && (ye = y.length), Oe = y.window;
							} else Oe = xe, Ne = ae - y.offset, ye = y.length;
							for (W < ye && (ye = W), W -= ye, y.length -= ye; xe[ae++] = Oe[Ne++], --ye;);
							y.length === 0 && (y.mode = 21);
							break;
						case 26:
							if (W === 0) break e;
							xe[ae++] = y.length, W--, y.mode = 21;
							break;
						case 27:
							if (y.wrap) {
								for (; Z < 32;) {
									if (R === 0) break e;
									R--, q |= ie[se++] << Z, Z += 8;
								}
								if (Ee -= W, m.total_out += Ee, y.total += Ee, Ee && (m.adler = y.check = y.flags ? u(y.check, xe, Ee, ae - Ee) : s(y.check, xe, Ee, ae - Ee)), Ee = W, (y.flags ? q : _(q)) !== y.check) {
									m.msg = "incorrect data check", y.mode = 30;
									break;
								}
								Z = q = 0;
							}
							y.mode = 28;
						case 28:
							if (y.wrap && y.flags) {
								for (; Z < 32;) {
									if (R === 0) break e;
									R--, q += ie[se++] << Z, Z += 8;
								}
								if (q !== (4294967295 & y.total)) {
									m.msg = "incorrect length check", y.mode = 30;
									break;
								}
								Z = q = 0;
							}
							y.mode = 29;
						case 29:
							N = 1;
							break e;
						case 30:
							N = -3;
							break e;
						case 31: return -4;
						default: return h;
					}
					return m.next_out = ae, m.avail_out = W, m.next_in = se, m.avail_in = R, y.hold = q, y.bits = Z, (y.wsize || Ee !== m.avail_out && y.mode < 30 && (y.mode < 27 || V !== 4)) && H(m, m.output, m.next_out, Ee - m.avail_out) ? (y.mode = 31, -4) : (ge -= m.avail_in, Ee -= m.avail_out, m.total_in += ge, m.total_out += Ee, y.total += Ee, y.wrap && Ee && (m.adler = y.check = y.flags ? u(y.check, xe, Ee, m.next_out - Ee) : s(y.check, xe, Ee, m.next_out - Ee)), m.data_type = y.bits + (y.last ? 64 : 0) + (y.mode === 12 ? 128 : 0) + (y.mode === 20 || y.mode === 15 ? 256 : 0), (ge == 0 && Ee === 0 || V === 4) && N === p && (N = -5), N);
				}, i.inflateEnd = function(m) {
					if (!m || !m.state) return h;
					var V = m.state;
					return V.window && (V.window = null), m.state = null, p;
				}, i.inflateGetHeader = function(m, V) {
					var y;
					return m && m.state ? (2 & (y = m.state).wrap) == 0 ? h : ((y.head = V).done = !1, p) : h;
				}, i.inflateSetDictionary = function(m, V) {
					var y, ie = V.length;
					return m && m.state ? (y = m.state).wrap !== 0 && y.mode !== 11 ? h : y.mode === 11 && s(1, V, ie, 0) !== y.check ? -3 : H(m, V, ie, ie) ? (y.mode = 31, -4) : (y.havedict = 1, p) : h;
				}, i.inflateInfo = "pako inflate (from Nodeca project)";
			}, {
				"../utils/common": 41,
				"./adler32": 43,
				"./crc32": 45,
				"./inffast": 48,
				"./inftrees": 50
			}],
			50: [function(t, n, i) {
				"use strict";
				var a = t("../utils/common"), s = [
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
				], u = [
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
				], c = [
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
				], o = [
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
				n.exports = function(l, d, p, h, A, f, g, _) {
					var v, b, C, T, ee, x, G, O, k, H = _.bits, m = 0, V = 0, y = 0, ie = 0, xe = 0, se = 0, ae = 0, R = 0, W = 0, q = 0, Z = null, ge = 0, Ee = new a.Buf16(16), ye = new a.Buf16(16), Ne = null, Oe = 0;
					for (m = 0; m <= 15; m++) Ee[m] = 0;
					for (V = 0; V < h; V++) Ee[d[p + V]]++;
					for (xe = H, ie = 15; 1 <= ie && Ee[ie] === 0; ie--);
					if (ie < xe && (xe = ie), ie === 0) return A[f++] = 20971520, A[f++] = 20971520, _.bits = 1, 0;
					for (y = 1; y < ie && Ee[y] === 0; y++);
					for (xe < y && (xe = y), m = R = 1; m <= 15; m++) if (R <<= 1, (R -= Ee[m]) < 0) return -1;
					if (0 < R && (l === 0 || ie !== 1)) return -1;
					for (ye[1] = 0, m = 1; m < 15; m++) ye[m + 1] = ye[m] + Ee[m];
					for (V = 0; V < h; V++) d[p + V] !== 0 && (g[ye[d[p + V]]++] = V);
					if (x = l === 0 ? (Z = Ne = g, 19) : l === 1 ? (Z = s, ge -= 257, Ne = u, Oe -= 257, 256) : (Z = c, Ne = o, -1), m = y, ee = f, ae = V = q = 0, C = -1, T = (W = 1 << (se = xe)) - 1, l === 1 && 852 < W || l === 2 && 592 < W) return 1;
					for (;;) {
						for (G = m - ae, k = g[V] < x ? (O = 0, g[V]) : g[V] > x ? (O = Ne[Oe + g[V]], Z[ge + g[V]]) : (O = 96, 0), v = 1 << m - ae, y = b = 1 << se; A[ee + (q >> ae) + (b -= v)] = G << 24 | O << 16 | k | 0, b !== 0;);
						for (v = 1 << m - 1; q & v;) v >>= 1;
						if (v !== 0 ? (q &= v - 1, q += v) : q = 0, V++, --Ee[m] == 0) {
							if (m === ie) break;
							m = d[p + g[V]];
						}
						if (xe < m && (q & T) !== C) {
							for (ae === 0 && (ae = xe), ee += y, R = 1 << (se = m - ae); se + ae < ie && !((R -= Ee[se + ae]) <= 0);) se++, R <<= 1;
							if (W += 1 << se, l === 1 && 852 < W || l === 2 && 592 < W) return 1;
							A[C = q & T] = xe << 24 | se << 16 | ee - f | 0;
						}
					}
					return q !== 0 && (A[ee + q] = m - ae << 24 | 4194304), _.bits = xe, 0;
				};
			}, { "../utils/common": 41 }],
			51: [function(t, n, i) {
				"use strict";
				n.exports = {
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
			}, {}],
			52: [function(t, n, i) {
				"use strict";
				var a = t("../utils/common"), s = 0, u = 1;
				function c(S) {
					for (var z = S.length; 0 <= --z;) S[z] = 0;
				}
				var o = 0, l = 29, d = 256, p = d + 1 + l, h = 30, A = 19, f = 2 * p + 1, g = 15, _ = 16, v = 7, b = 256, C = 16, T = 17, ee = 18, x = [
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
				], G = [
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
				], O = [
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
				], k = [
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
				], H = new Array(2 * (p + 2));
				c(H);
				var m = new Array(2 * h);
				c(m);
				var V = new Array(512);
				c(V);
				var y = new Array(256);
				c(y);
				var ie = new Array(l);
				c(ie);
				var xe, se, ae, R = new Array(h);
				function W(S, z, X, K, re) {
					this.static_tree = S, this.extra_bits = z, this.extra_base = X, this.elems = K, this.max_length = re, this.has_stree = S && S.length;
				}
				function q(S, z) {
					this.dyn_tree = S, this.max_code = 0, this.stat_desc = z;
				}
				function Z(S) {
					return S < 256 ? V[S] : V[256 + (S >>> 7)];
				}
				function ge(S, z) {
					S.pending_buf[S.pending++] = 255 & z, S.pending_buf[S.pending++] = z >>> 8 & 255;
				}
				function Ee(S, z, X) {
					S.bi_valid > _ - X ? (S.bi_buf |= z << S.bi_valid & 65535, ge(S, S.bi_buf), S.bi_buf = z >> _ - S.bi_valid, S.bi_valid += X - _) : (S.bi_buf |= z << S.bi_valid & 65535, S.bi_valid += X);
				}
				function ye(S, z, X) {
					Ee(S, X[2 * z], X[2 * z + 1]);
				}
				function Ne(S, z) {
					for (var X = 0; X |= 1 & S, S >>>= 1, X <<= 1, 0 < --z;);
					return X >>> 1;
				}
				function Oe(S, z, X) {
					var K, re, ne = new Array(g + 1), oe = 0;
					for (K = 1; K <= g; K++) ne[K] = oe = oe + X[K - 1] << 1;
					for (re = 0; re <= z; re++) {
						var me = S[2 * re + 1];
						me !== 0 && (S[2 * re] = Ne(ne[me]++, me));
					}
				}
				function Ue(S) {
					var z;
					for (z = 0; z < p; z++) S.dyn_ltree[2 * z] = 0;
					for (z = 0; z < h; z++) S.dyn_dtree[2 * z] = 0;
					for (z = 0; z < A; z++) S.bl_tree[2 * z] = 0;
					S.dyn_ltree[2 * b] = 1, S.opt_len = S.static_len = 0, S.last_lit = S.matches = 0;
				}
				function Re(S) {
					8 < S.bi_valid ? ge(S, S.bi_buf) : 0 < S.bi_valid && (S.pending_buf[S.pending++] = S.bi_buf), S.bi_buf = 0, S.bi_valid = 0;
				}
				function je(S, z, X, K) {
					var re = 2 * z, ne = 2 * X;
					return S[re] < S[ne] || S[re] === S[ne] && K[z] <= K[X];
				}
				function qe(S, z, X) {
					for (var K = S.heap[X], re = X << 1; re <= S.heap_len && (re < S.heap_len && je(z, S.heap[re + 1], S.heap[re], S.depth) && re++, !je(z, K, S.heap[re], S.depth));) S.heap[X] = S.heap[re], X = re, re <<= 1;
					S.heap[X] = K;
				}
				function E(S, z, X) {
					var K, re, ne, oe, me = 0;
					if (S.last_lit !== 0) for (; K = S.pending_buf[S.d_buf + 2 * me] << 8 | S.pending_buf[S.d_buf + 2 * me + 1], re = S.pending_buf[S.l_buf + me], me++, K === 0 ? ye(S, re, z) : (ye(S, (ne = y[re]) + d + 1, z), (oe = x[ne]) !== 0 && Ee(S, re -= ie[ne], oe), ye(S, ne = Z(--K), X), (oe = G[ne]) !== 0 && Ee(S, K -= R[ne], oe)), me < S.last_lit;);
					ye(S, b, z);
				}
				function _e(S, z) {
					var X, K, re, ne = z.dyn_tree, oe = z.stat_desc.static_tree, me = z.stat_desc.has_stree, be = z.stat_desc.elems, ze = -1;
					for (S.heap_len = 0, S.heap_max = f, X = 0; X < be; X++) ne[2 * X] !== 0 ? (S.heap[++S.heap_len] = ze = X, S.depth[X] = 0) : ne[2 * X + 1] = 0;
					for (; S.heap_len < 2;) ne[2 * (re = S.heap[++S.heap_len] = ze < 2 ? ++ze : 0)] = 1, S.depth[re] = 0, S.opt_len--, me && (S.static_len -= oe[2 * re + 1]);
					for (z.max_code = ze, X = S.heap_len >> 1; 1 <= X; X--) qe(S, ne, X);
					for (re = be; X = S.heap[1], S.heap[1] = S.heap[S.heap_len--], qe(S, ne, 1), K = S.heap[1], S.heap[--S.heap_max] = X, S.heap[--S.heap_max] = K, ne[2 * re] = ne[2 * X] + ne[2 * K], S.depth[re] = (S.depth[X] >= S.depth[K] ? S.depth[X] : S.depth[K]) + 1, ne[2 * X + 1] = ne[2 * K + 1] = re, S.heap[1] = re++, qe(S, ne, 1), 2 <= S.heap_len;);
					S.heap[--S.heap_max] = S.heap[1], (function(He, dt) {
						var Bt, $e, Ht, et, kt, Zt, Wt = dt.dyn_tree, jr = dt.max_code, qr = dt.stat_desc.static_tree, br = dt.stat_desc.has_stree, Gt = dt.stat_desc.extra_bits, qt = dt.stat_desc.extra_base, Pr = dt.stat_desc.max_length, pt = 0;
						for (et = 0; et <= g; et++) He.bl_count[et] = 0;
						for (Wt[2 * He.heap[He.heap_max] + 1] = 0, Bt = He.heap_max + 1; Bt < f; Bt++) Pr < (et = Wt[2 * Wt[2 * ($e = He.heap[Bt]) + 1] + 1] + 1) && (et = Pr, pt++), Wt[2 * $e + 1] = et, jr < $e || (He.bl_count[et]++, kt = 0, qt <= $e && (kt = Gt[$e - qt]), Zt = Wt[2 * $e], He.opt_len += Zt * (et + kt), br && (He.static_len += Zt * (qr[2 * $e + 1] + kt)));
						if (pt !== 0) {
							do {
								for (et = Pr - 1; He.bl_count[et] === 0;) et--;
								He.bl_count[et]--, He.bl_count[et + 1] += 2, He.bl_count[Pr]--, pt -= 2;
							} while (0 < pt);
							for (et = Pr; et !== 0; et--) for ($e = He.bl_count[et]; $e !== 0;) jr < (Ht = He.heap[--Bt]) || (Wt[2 * Ht + 1] !== et && (He.opt_len += (et - Wt[2 * Ht + 1]) * Wt[2 * Ht], Wt[2 * Ht + 1] = et), $e--);
						}
					})(S, z), Oe(ne, ze, S.bl_count);
				}
				function w(S, z, X) {
					var K, re, ne = -1, oe = z[1], me = 0, be = 7, ze = 4;
					for (oe === 0 && (be = 138, ze = 3), z[2 * (X + 1) + 1] = 65535, K = 0; K <= X; K++) re = oe, oe = z[2 * (K + 1) + 1], ++me < be && re === oe || (me < ze ? S.bl_tree[2 * re] += me : re !== 0 ? (re !== ne && S.bl_tree[2 * re]++, S.bl_tree[2 * C]++) : me <= 10 ? S.bl_tree[2 * T]++ : S.bl_tree[2 * ee]++, ne = re, ze = (me = 0) === oe ? (be = 138, 3) : re === oe ? (be = 6, 3) : (be = 7, 4));
				}
				function N(S, z, X) {
					var K, re, ne = -1, oe = z[1], me = 0, be = 7, ze = 4;
					for (oe === 0 && (be = 138, ze = 3), K = 0; K <= X; K++) if (re = oe, oe = z[2 * (K + 1) + 1], !(++me < be && re === oe)) {
						if (me < ze) for (; ye(S, re, S.bl_tree), --me != 0;);
						else re !== 0 ? (re !== ne && (ye(S, re, S.bl_tree), me--), ye(S, C, S.bl_tree), Ee(S, me - 3, 2)) : me <= 10 ? (ye(S, T, S.bl_tree), Ee(S, me - 3, 3)) : (ye(S, ee, S.bl_tree), Ee(S, me - 11, 7));
						ne = re, ze = (me = 0) === oe ? (be = 138, 3) : re === oe ? (be = 6, 3) : (be = 7, 4);
					}
				}
				c(R);
				var D = !1;
				function I(S, z, X, K) {
					Ee(S, (o << 1) + (K ? 1 : 0), 3), (function(re, ne, oe, me) {
						Re(re), me && (ge(re, oe), ge(re, ~oe)), a.arraySet(re.pending_buf, re.window, ne, oe, re.pending), re.pending += oe;
					})(S, z, X, !0);
				}
				i._tr_init = function(S) {
					D || ((function() {
						var z, X, K, re, ne, oe = new Array(g + 1);
						for (re = K = 0; re < l - 1; re++) for (ie[re] = K, z = 0; z < 1 << x[re]; z++) y[K++] = re;
						for (y[K - 1] = re, re = ne = 0; re < 16; re++) for (R[re] = ne, z = 0; z < 1 << G[re]; z++) V[ne++] = re;
						for (ne >>= 7; re < h; re++) for (R[re] = ne << 7, z = 0; z < 1 << G[re] - 7; z++) V[256 + ne++] = re;
						for (X = 0; X <= g; X++) oe[X] = 0;
						for (z = 0; z <= 143;) H[2 * z + 1] = 8, z++, oe[8]++;
						for (; z <= 255;) H[2 * z + 1] = 9, z++, oe[9]++;
						for (; z <= 279;) H[2 * z + 1] = 7, z++, oe[7]++;
						for (; z <= 287;) H[2 * z + 1] = 8, z++, oe[8]++;
						for (Oe(H, p + 1, oe), z = 0; z < h; z++) m[2 * z + 1] = 5, m[2 * z] = Ne(z, 5);
						xe = new W(H, x, d + 1, p, g), se = new W(m, G, 0, h, g), ae = new W(new Array(0), O, 0, A, v);
					})(), D = !0), S.l_desc = new q(S.dyn_ltree, xe), S.d_desc = new q(S.dyn_dtree, se), S.bl_desc = new q(S.bl_tree, ae), S.bi_buf = 0, S.bi_valid = 0, Ue(S);
				}, i._tr_stored_block = I, i._tr_flush_block = function(S, z, X, K) {
					var re, ne, oe = 0;
					0 < S.level ? (S.strm.data_type === 2 && (S.strm.data_type = (function(me) {
						var be, ze = 4093624447;
						for (be = 0; be <= 31; be++, ze >>>= 1) if (1 & ze && me.dyn_ltree[2 * be] !== 0) return s;
						if (me.dyn_ltree[18] !== 0 || me.dyn_ltree[20] !== 0 || me.dyn_ltree[26] !== 0) return u;
						for (be = 32; be < d; be++) if (me.dyn_ltree[2 * be] !== 0) return u;
						return s;
					})(S)), _e(S, S.l_desc), _e(S, S.d_desc), oe = (function(me) {
						var be;
						for (w(me, me.dyn_ltree, me.l_desc.max_code), w(me, me.dyn_dtree, me.d_desc.max_code), _e(me, me.bl_desc), be = A - 1; 3 <= be && me.bl_tree[2 * k[be] + 1] === 0; be--);
						return me.opt_len += 3 * (be + 1) + 5 + 5 + 4, be;
					})(S), re = S.opt_len + 3 + 7 >>> 3, (ne = S.static_len + 3 + 7 >>> 3) <= re && (re = ne)) : re = ne = X + 5, X + 4 <= re && z !== -1 ? I(S, z, X, K) : S.strategy === 4 || ne === re ? (Ee(S, 2 + (K ? 1 : 0), 3), E(S, H, m)) : (Ee(S, 4 + (K ? 1 : 0), 3), (function(me, be, ze, He) {
						var dt;
						for (Ee(me, be - 257, 5), Ee(me, ze - 1, 5), Ee(me, He - 4, 4), dt = 0; dt < He; dt++) Ee(me, me.bl_tree[2 * k[dt] + 1], 3);
						N(me, me.dyn_ltree, be - 1), N(me, me.dyn_dtree, ze - 1);
					})(S, S.l_desc.max_code + 1, S.d_desc.max_code + 1, oe + 1), E(S, S.dyn_ltree, S.dyn_dtree)), Ue(S), K && Re(S);
				}, i._tr_tally = function(S, z, X) {
					return S.pending_buf[S.d_buf + 2 * S.last_lit] = z >>> 8 & 255, S.pending_buf[S.d_buf + 2 * S.last_lit + 1] = 255 & z, S.pending_buf[S.l_buf + S.last_lit] = 255 & X, S.last_lit++, z === 0 ? S.dyn_ltree[2 * X]++ : (S.matches++, z--, S.dyn_ltree[2 * (y[X] + d + 1)]++, S.dyn_dtree[2 * Z(z)]++), S.last_lit === S.lit_bufsize - 1;
				}, i._tr_align = function(S) {
					Ee(S, 2, 3), ye(S, b, H), (function(z) {
						z.bi_valid === 16 ? (ge(z, z.bi_buf), z.bi_buf = 0, z.bi_valid = 0) : 8 <= z.bi_valid && (z.pending_buf[z.pending++] = 255 & z.bi_buf, z.bi_buf >>= 8, z.bi_valid -= 8);
					})(S);
				};
			}, { "../utils/common": 41 }],
			53: [function(t, n, i) {
				"use strict";
				n.exports = function() {
					this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
				};
			}, {}],
			54: [function(t, n, i) {
				(function(a) {
					(function(s, u) {
						"use strict";
						if (!s.setImmediate) {
							var c, o, l, d, p = 1, h = {}, A = !1, f = s.document, g = Object.getPrototypeOf && Object.getPrototypeOf(s);
							g = g && g.setTimeout ? g : s, c = {}.toString.call(s.process) === "[object process]" ? function(C) {
								process.nextTick(function() {
									v(C);
								});
							} : (function() {
								if (s.postMessage && !s.importScripts) {
									var C = !0, T = s.onmessage;
									return s.onmessage = function() {
										C = !1;
									}, s.postMessage("", "*"), s.onmessage = T, C;
								}
							})() ? (d = "setImmediate$" + Math.random() + "$", s.addEventListener ? s.addEventListener("message", b, !1) : s.attachEvent("onmessage", b), function(C) {
								s.postMessage(d + C, "*");
							}) : s.MessageChannel ? ((l = new MessageChannel()).port1.onmessage = function(C) {
								v(C.data);
							}, function(C) {
								l.port2.postMessage(C);
							}) : f && "onreadystatechange" in f.createElement("script") ? (o = f.documentElement, function(C) {
								var T = f.createElement("script");
								T.onreadystatechange = function() {
									v(C), T.onreadystatechange = null, o.removeChild(T), T = null;
								}, o.appendChild(T);
							}) : function(C) {
								setTimeout(v, 0, C);
							}, g.setImmediate = function(C) {
								typeof C != "function" && (C = new Function("" + C));
								for (var T = new Array(arguments.length - 1), ee = 0; ee < T.length; ee++) T[ee] = arguments[ee + 1];
								return h[p] = {
									callback: C,
									args: T
								}, c(p), p++;
							}, g.clearImmediate = _;
						}
						function _(C) {
							delete h[C];
						}
						function v(C) {
							if (A) setTimeout(v, 0, C);
							else {
								var T = h[C];
								if (T) {
									A = !0;
									try {
										(function(ee) {
											var x = ee.callback, G = ee.args;
											switch (G.length) {
												case 0:
													x();
													break;
												case 1:
													x(G[0]);
													break;
												case 2:
													x(G[0], G[1]);
													break;
												case 3:
													x(G[0], G[1], G[2]);
													break;
												default: x.apply(u, G);
											}
										})(T);
									} finally {
										_(C), A = !1;
									}
								}
							}
						}
						function b(C) {
							C.source === s && typeof C.data == "string" && C.data.indexOf(d) === 0 && v(+C.data.slice(d.length));
						}
					})(typeof self == "undefined" ? a === void 0 ? this : a : self);
				}).call(this, typeof global != "undefined" ? global : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
			}, {}]
		}, {}, [10])(10);
	});
} });
var $f = {};
zm($f, {
	default: () => Jf,
	readFileSync: () => Vf,
	writeFileSync: () => Xf
});
var Jf;
var Vf;
var Xf;
var Zm = Um({ "scripts/empty.mjs"() {
	"use strict";
	Jf = {}, Vf = () => {
		throw new Error("fs not available in browser");
	}, Xf = () => {
		throw new Error("fs not available in browser");
	};
} });
var Wm = jf({ "node_modules/cfb/cfb.js"(e, r) {
	var t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	function n(ae) {
		for (var R = "", W = 0, q = 0, Z = 0, ge = 0, Ee = 0, ye = 0, Ne = 0, Oe = 0; Oe < ae.length;) W = ae.charCodeAt(Oe++), ge = W >> 2, q = ae.charCodeAt(Oe++), Ee = (W & 3) << 4 | q >> 4, Z = ae.charCodeAt(Oe++), ye = (q & 15) << 2 | Z >> 6, Ne = Z & 63, isNaN(q) ? ye = Ne = 64 : isNaN(Z) && (Ne = 64), R += t.charAt(ge) + t.charAt(Ee) + t.charAt(ye) + t.charAt(Ne);
		return R;
	}
	function i(ae) {
		var R = "", W = 0, q = 0, Z = 0, ge = 0, Ee = 0, ye = 0, Ne = 0;
		ae = ae.replace(/[^\w\+\/\=]/g, "");
		for (var Oe = 0; Oe < ae.length;) ge = t.indexOf(ae.charAt(Oe++)), Ee = t.indexOf(ae.charAt(Oe++)), W = ge << 2 | Ee >> 4, R += String.fromCharCode(W), ye = t.indexOf(ae.charAt(Oe++)), q = (Ee & 15) << 4 | ye >> 2, ye !== 64 && (R += String.fromCharCode(q)), Ne = t.indexOf(ae.charAt(Oe++)), Z = (ye & 3) << 6 | Ne, Ne !== 64 && (R += String.fromCharCode(Z));
		return R;
	}
	var a = (function() {
		return typeof Buffer != "undefined" && typeof process != "undefined" && typeof process.versions != "undefined" && !!process.versions.node;
	})(), s = (function() {
		if (typeof Buffer != "undefined") {
			var ae = !Buffer.from;
			if (!ae) try {
				Buffer.from("foo", "utf8");
			} catch (R) {
				ae = !0;
			}
			return ae ? function(R, W) {
				return W ? new Buffer(R, W) : new Buffer(R);
			} : Buffer.from.bind(Buffer);
		}
		return function() {};
	})();
	function u(ae) {
		if (a) {
			if (Buffer.alloc) return Buffer.alloc(ae);
			var R = new Buffer(ae);
			return R.fill(0), R;
		}
		return typeof Uint8Array != "undefined" ? new Uint8Array(ae) : new Array(ae);
	}
	function c(ae) {
		return a ? Buffer.allocUnsafe ? Buffer.allocUnsafe(ae) : new Buffer(ae) : typeof Uint8Array != "undefined" ? new Uint8Array(ae) : new Array(ae);
	}
	var o = function(R) {
		return a ? s(R, "binary") : R.split("").map(function(W) {
			return W.charCodeAt(0) & 255;
		});
	}, l = /\u0000/g, d = /[\u0001-\u0006]/g, p = function(ae) {
		for (var R = [], W = 0; W < ae[0].length; ++W) R.push.apply(R, ae[0][W]);
		return R;
	}, h = p, A = function(ae, R, W) {
		for (var q = [], Z = R; Z < W; Z += 2) q.push(String.fromCharCode(T(ae, Z)));
		return q.join("").replace(l, "");
	}, f = A, g = function(ae, R, W) {
		for (var q = [], Z = R; Z < R + W; ++Z) q.push(("0" + ae[Z].toString(16)).slice(-2));
		return q.join("");
	}, _ = g, v = function(ae) {
		if (Array.isArray(ae[0])) return [].concat.apply([], ae);
		var R = 0, W = 0;
		for (W = 0; W < ae.length; ++W) R += ae[W].length;
		var q = new Uint8Array(R);
		for (W = 0, R = 0; W < ae.length; R += ae[W].length, ++W) q.set(ae[W], R);
		return q;
	}, b = v;
	a && (A = function(ae, R, W) {
		return Buffer.isBuffer(ae) ? ae.toString("utf16le", R, W).replace(l, "") : f(ae, R, W);
	}, g = function(ae, R, W) {
		return Buffer.isBuffer(ae) ? ae.toString("hex", R, R + W) : _(ae, R, W);
	}, p = function(ae) {
		return ae[0].length > 0 && Buffer.isBuffer(ae[0][0]) ? Buffer.concat(ae[0]) : h(ae);
	}, o = function(ae) {
		return s(ae, "binary");
	}, b = function(ae) {
		return Buffer.isBuffer(ae[0]) ? Buffer.concat(ae) : v(ae);
	});
	var C = function(ae, R) {
		return ae[R];
	}, T = function(ae, R) {
		return ae[R + 1] * 256 + ae[R];
	}, ee = function(ae, R) {
		var W = ae[R + 1] * 256 + ae[R];
		return W < 32768 ? W : (65535 - W + 1) * -1;
	}, x = function(ae, R) {
		return ae[R + 3] * (1 << 24) + (ae[R + 2] << 16) + (ae[R + 1] << 8) + ae[R];
	}, G = function(ae, R) {
		return (ae[R + 3] << 24) + (ae[R + 2] << 16) + (ae[R + 1] << 8) + ae[R];
	};
	function O(ae, R) {
		var W, q, Z = 0;
		switch (ae) {
			case 1:
				W = C(this, this.l);
				break;
			case 2:
				W = (R !== "i" ? T : ee)(this, this.l);
				break;
			case 4:
				W = G(this, this.l);
				break;
			case 16: Z = 2, q = g(this, this.l, ae);
		}
		return this.l += ae, Z === 0 ? W : q;
	}
	var k = function(ae, R, W) {
		ae[W] = R & 255, ae[W + 1] = R >>> 8 & 255, ae[W + 2] = R >>> 16 & 255, ae[W + 3] = R >>> 24 & 255;
	}, H = function(ae, R, W) {
		ae[W] = R & 255, ae[W + 1] = R >> 8 & 255, ae[W + 2] = R >> 16 & 255, ae[W + 3] = R >> 24 & 255;
	};
	function m(ae, R, W) {
		var q = 0, Z = 0;
		switch (W) {
			case "hex":
				for (; Z < ae; ++Z) this[this.l++] = parseInt(R.slice(2 * Z, 2 * Z + 2), 16) || 0;
				return this;
			case "utf16le":
				var ge = this.l + ae;
				for (Z = 0; Z < Math.min(R.length, ae); ++Z) {
					var Ee = R.charCodeAt(Z);
					this[this.l++] = Ee & 255, this[this.l++] = Ee >> 8;
				}
				for (; this.l < ge;) this[this.l++] = 0;
				return this;
		}
		switch (ae) {
			case 1:
				q = 1, this[this.l] = R & 255;
				break;
			case 2:
				q = 2, this[this.l] = R & 255, R >>>= 8, this[this.l + 1] = R & 255;
				break;
			case 4:
				q = 4, k(this, R, this.l);
				break;
			case -4: q = 4, H(this, R, this.l);
		}
		return this.l += q, this;
	}
	function V(ae, R) {
		var W = g(this, this.l, ae.length >> 1);
		if (W !== ae) throw new Error(R + "Expected " + ae + " saw " + W);
		this.l += ae.length >> 1;
	}
	function y(ae, R) {
		ae.l = R, ae.read_shift = O, ae.chk = V, ae.write_shift = m;
	}
	function ie(ae) {
		var R = u(ae);
		return y(R, 0), R;
	}
	var xe = (function() {
		var ae = {};
		ae.version = "1.2.1";
		function R() {
			for (var K = 0, re = new Array(256), ne = 0; ne != 256; ++ne) K = ne, K = K & 1 ? -306674912 ^ K >>> 1 : K >>> 1, K = K & 1 ? -306674912 ^ K >>> 1 : K >>> 1, K = K & 1 ? -306674912 ^ K >>> 1 : K >>> 1, K = K & 1 ? -306674912 ^ K >>> 1 : K >>> 1, K = K & 1 ? -306674912 ^ K >>> 1 : K >>> 1, K = K & 1 ? -306674912 ^ K >>> 1 : K >>> 1, K = K & 1 ? -306674912 ^ K >>> 1 : K >>> 1, K = K & 1 ? -306674912 ^ K >>> 1 : K >>> 1, re[ne] = K;
			return typeof Int32Array != "undefined" ? new Int32Array(re) : re;
		}
		var W = R();
		function q(K) {
			var re = 0, ne = 0, oe = 0, me = typeof Int32Array != "undefined" ? /* @__PURE__ */ new Int32Array(4096) : new Array(4096);
			for (oe = 0; oe != 256; ++oe) me[oe] = K[oe];
			for (oe = 0; oe != 256; ++oe) for (ne = K[oe], re = 256 + oe; re < 4096; re += 256) ne = me[re] = ne >>> 8 ^ K[ne & 255];
			var be = [];
			for (oe = 1; oe != 16; ++oe) be[oe - 1] = typeof Int32Array != "undefined" ? me.subarray(oe * 256, oe * 256 + 256) : me.slice(oe * 256, oe * 256 + 256);
			return be;
		}
		var Z = q(W), ge = Z[0], Ee = Z[1], ye = Z[2], Ne = Z[3], Oe = Z[4], Ue = Z[5], Re = Z[6], je = Z[7], qe = Z[8], E = Z[9], _e = Z[10], w = Z[11], N = Z[12], D = Z[13], I = Z[14];
		function S(K, re) {
			for (var ne = re ^ -1, oe = 0, me = K.length; oe < me;) ne = ne >>> 8 ^ W[(ne ^ K.charCodeAt(oe++)) & 255];
			return ~ne;
		}
		function z(K, re) {
			for (var ne = re ^ -1, oe = K.length - 15, me = 0; me < oe;) ne = I[K[me++] ^ ne & 255] ^ D[K[me++] ^ ne >> 8 & 255] ^ N[K[me++] ^ ne >> 16 & 255] ^ w[K[me++] ^ ne >>> 24] ^ _e[K[me++]] ^ E[K[me++]] ^ qe[K[me++]] ^ je[K[me++]] ^ Re[K[me++]] ^ Ue[K[me++]] ^ Oe[K[me++]] ^ Ne[K[me++]] ^ ye[K[me++]] ^ Ee[K[me++]] ^ ge[K[me++]] ^ W[K[me++]];
			for (oe += 15; me < oe;) ne = ne >>> 8 ^ W[(ne ^ K[me++]) & 255];
			return ~ne;
		}
		function X(K, re) {
			for (var ne = re ^ -1, oe = 0, me = K.length, be = 0, ze = 0; oe < me;) be = K.charCodeAt(oe++), be < 128 ? ne = ne >>> 8 ^ W[(ne ^ be) & 255] : be < 2048 ? (ne = ne >>> 8 ^ W[(ne ^ (192 | be >> 6 & 31)) & 255], ne = ne >>> 8 ^ W[(ne ^ (128 | be & 63)) & 255]) : be >= 55296 && be < 57344 ? (be = (be & 1023) + 64, ze = K.charCodeAt(oe++) & 1023, ne = ne >>> 8 ^ W[(ne ^ (240 | be >> 8 & 7)) & 255], ne = ne >>> 8 ^ W[(ne ^ (128 | be >> 2 & 63)) & 255], ne = ne >>> 8 ^ W[(ne ^ (128 | ze >> 6 & 15 | (be & 3) << 4)) & 255], ne = ne >>> 8 ^ W[(ne ^ (128 | ze & 63)) & 255]) : (ne = ne >>> 8 ^ W[(ne ^ (224 | be >> 12 & 15)) & 255], ne = ne >>> 8 ^ W[(ne ^ (128 | be >> 6 & 63)) & 255], ne = ne >>> 8 ^ W[(ne ^ (128 | be & 63)) & 255]);
			return ~ne;
		}
		return ae.table = W, ae.bstr = S, ae.buf = z, ae.str = X, ae;
	})(), se = (function() {
		var R = {};
		R.version = "1.2.2";
		function W(F, j) {
			for (var P = F.split("/"), U = j.split("/"), J = 0, te = 0, de = Math.min(P.length, U.length); J < de; ++J) {
				if (te = P[J].length - U[J].length) return te;
				if (P[J] != U[J]) return P[J] < U[J] ? -1 : 1;
			}
			return P.length - U.length;
		}
		function q(F) {
			if (F.charAt(F.length - 1) == "/") return F.slice(0, -1).indexOf("/") === -1 ? F : q(F.slice(0, -1));
			var j = F.lastIndexOf("/");
			return j === -1 ? F : F.slice(0, j + 1);
		}
		function Z(F) {
			if (F.charAt(F.length - 1) == "/") return Z(F.slice(0, -1));
			var j = F.lastIndexOf("/");
			return j === -1 ? F : F.slice(j + 1);
		}
		function ge(F, j) {
			typeof j == "string" && (j = new Date(j));
			var P = j.getHours();
			P = P << 6 | j.getMinutes(), P = P << 5 | j.getSeconds() >>> 1, F.write_shift(2, P);
			var U = j.getFullYear() - 1980;
			U = U << 4 | j.getMonth() + 1, U = U << 5 | j.getDate(), F.write_shift(2, U);
		}
		function Ee(F) {
			var j = F.read_shift(2) & 65535, P = F.read_shift(2) & 65535, U = /* @__PURE__ */ new Date(), J = P & 31;
			P >>>= 5;
			var te = P & 15;
			P >>>= 4, U.setMilliseconds(0), U.setFullYear(P + 1980), U.setMonth(te - 1), U.setDate(J);
			var de = j & 31;
			j >>>= 5;
			var ve = j & 63;
			return j >>>= 6, U.setHours(j), U.setMinutes(ve), U.setSeconds(de << 1), U;
		}
		function ye(F) {
			y(F, 0);
			for (var j = {}, P = 0; F.l <= F.length - 4;) {
				var U = F.read_shift(2), J = F.read_shift(2), te = F.l + J, de = {};
				U === 21589 && (P = F.read_shift(1), P & 1 && (de.mtime = F.read_shift(4)), J > 5 && (P & 2 && (de.atime = F.read_shift(4)), P & 4 && (de.ctime = F.read_shift(4))), de.mtime && (de.mt = /* @__PURE__ */ new Date(de.mtime * 1e3))), F.l = te, j[U] = de;
			}
			return j;
		}
		var Ne;
		function Oe() {
			return Ne || (Ne = (Zm(), Hm($f)));
		}
		function Ue(F, j) {
			if (F[0] == 80 && F[1] == 75) return xt(F, j);
			if ((F[0] | 32) == 109 && (F[1] | 32) == 105) return Wp(F, j);
			if (F.length < 512) throw new Error("CFB file size " + F.length + " < 512");
			var P = 3, U = 512, J = 0, te = 0, de = 0, ve = 0, fe = 0, pe = [], Ae = F.slice(0, 512);
			y(Ae, 0);
			var Ie = Re(Ae);
			switch (P = Ie[0], P) {
				case 3:
					U = 512;
					break;
				case 4:
					U = 4096;
					break;
				case 0: if (Ie[1] == 0) return xt(F, j);
				default: throw new Error("Major Version: Expected 3 or 4 saw " + P);
			}
			U !== 512 && (Ae = F.slice(0, U), y(Ae, 28));
			var De = F.slice(0, U);
			je(Ae, P);
			var Me = Ae.read_shift(4, "i");
			if (P === 3 && Me !== 0) throw new Error("# Directory Sectors: Expected 0 saw " + Me);
			Ae.l += 4, de = Ae.read_shift(4, "i"), Ae.l += 4, Ae.chk("00100000", "Mini Stream Cutoff Size: "), ve = Ae.read_shift(4, "i"), J = Ae.read_shift(4, "i"), fe = Ae.read_shift(4, "i"), te = Ae.read_shift(4, "i");
			for (var Te = -1, Fe = 0; Fe < 109 && (Te = Ae.read_shift(4, "i"), !(Te < 0)); ++Fe) pe[Fe] = Te;
			var Ge = qe(F, U);
			w(fe, te, Ge, U, pe);
			var At = D(Ge, de, pe, U);
			At[de].name = "!Directory", J > 0 && ve !== ze && (At[ve].name = "!MiniFAT"), At[pe[0]].name = "!FAT", At.fat_addrs = pe, At.ssz = U;
			var Rt = {}, Ct = [], rr = [], Pi = [];
			I(de, At, Ge, Ct, J, Rt, rr, ve), E(rr, Pi, Ct), Ct.shift();
			var Mi = {
				FileIndex: rr,
				FullPaths: Pi
			};
			return j && j.raw && (Mi.raw = {
				header: De,
				sectors: Ge
			}), Mi;
		}
		function Re(F) {
			if (F[F.l] == 80 && F[F.l + 1] == 75) return [0, 0];
			F.chk(He, "Header Signature: "), F.l += 16;
			var j = F.read_shift(2, "u");
			return [F.read_shift(2, "u"), j];
		}
		function je(F, j) {
			var P = 9;
			switch (F.l += 2, P = F.read_shift(2)) {
				case 9:
					if (j != 3) throw new Error("Sector Shift: Expected 9 saw " + P);
					break;
				case 12:
					if (j != 4) throw new Error("Sector Shift: Expected 12 saw " + P);
					break;
				default: throw new Error("Sector Shift: Expected 9 or 12 saw " + P);
			}
			F.chk("0600", "Mini Sector Shift: "), F.chk("000000000000", "Reserved: ");
		}
		function qe(F, j) {
			for (var P = Math.ceil(F.length / j) - 1, U = [], J = 1; J < P; ++J) U[J - 1] = F.slice(J * j, (J + 1) * j);
			return U[P - 1] = F.slice(P * j), U;
		}
		function E(F, j, P) {
			for (var U = 0, J = 0, te = 0, de = 0, ve = 0, fe = P.length, pe = [], Ae = []; U < fe; ++U) pe[U] = Ae[U] = U, j[U] = P[U];
			for (; ve < Ae.length; ++ve) U = Ae[ve], J = F[U].L, te = F[U].R, de = F[U].C, pe[U] === U && (J !== -1 && pe[J] !== J && (pe[U] = pe[J]), te !== -1 && pe[te] !== te && (pe[U] = pe[te])), de !== -1 && (pe[de] = U), J !== -1 && U != pe[U] && (pe[J] = pe[U], Ae.lastIndexOf(J) < ve && Ae.push(J)), te !== -1 && U != pe[U] && (pe[te] = pe[U], Ae.lastIndexOf(te) < ve && Ae.push(te));
			for (U = 1; U < fe; ++U) pe[U] === U && (te !== -1 && pe[te] !== te ? pe[U] = pe[te] : J !== -1 && pe[J] !== J && (pe[U] = pe[J]));
			for (U = 1; U < fe; ++U) if (F[U].type !== 0) {
				if (ve = U, ve != pe[ve]) do
					ve = pe[ve], j[U] = j[ve] + "/" + j[U];
				while (ve !== 0 && pe[ve] !== -1 && ve != pe[ve]);
				pe[U] = -1;
			}
			for (j[0] += "/", U = 1; U < fe; ++U) F[U].type !== 2 && (j[U] += "/");
		}
		function _e(F, j, P) {
			for (var U = F.start, J = F.size, te = [], de = U; P && J > 0 && de >= 0;) te.push(j.slice(de * be, de * be + be)), J -= be, de = G(P, de * 4);
			return te.length === 0 ? ie(0) : b(te).slice(0, F.size);
		}
		function w(F, j, P, U, J) {
			var te = ze;
			if (F === ze) {
				if (j !== 0) throw new Error("DIFAT chain shorter than expected");
			} else if (F !== -1) {
				var de = P[F], ve = (U >>> 2) - 1;
				if (!de) return;
				for (var fe = 0; fe < ve && (te = G(de, fe * 4)) !== ze; ++fe) J.push(te);
				j >= 1 && w(G(de, U - 4), j - 1, P, U, J);
			}
		}
		function N(F, j, P, U, J) {
			var te = [], de = [];
			J || (J = []);
			var ve = U - 1, fe = 0, pe = 0;
			for (fe = j; fe >= 0;) {
				J[fe] = !0, te[te.length] = fe, de.push(F[fe]);
				var Ae = P[Math.floor(fe * 4 / U)];
				if (pe = fe * 4 & ve, U < 4 + pe) throw new Error("FAT boundary crossed: " + fe + " 4 " + U);
				if (!F[Ae]) break;
				fe = G(F[Ae], pe);
			}
			return {
				nodes: te,
				data: p([de])
			};
		}
		function D(F, j, P, U) {
			var J = F.length, te = [], de = [], ve = [], fe = [], pe = U - 1, Ae = 0, Ie = 0, De = 0, Me = 0;
			for (Ae = 0; Ae < J; ++Ae) if (ve = [], De = Ae + j, De >= J && (De -= J), !de[De]) {
				fe = [];
				var Te = [];
				for (Ie = De; Ie >= 0;) {
					Te[Ie] = !0, de[Ie] = !0, ve[ve.length] = Ie, fe.push(F[Ie]);
					var Fe = P[Math.floor(Ie * 4 / U)];
					if (Me = Ie * 4 & pe, U < 4 + Me) throw new Error("FAT boundary crossed: " + Ie + " 4 " + U);
					if (!F[Fe] || (Ie = G(F[Fe], Me), Te[Ie])) break;
				}
				te[De] = {
					nodes: ve,
					data: p([fe])
				};
			}
			return te;
		}
		function I(F, j, P, U, J, te, de, ve) {
			for (var fe = 0, pe = U.length ? 2 : 0, Ae = j[F].data, Ie = 0, De = 0, Me; Ie < Ae.length; Ie += 128) {
				var Te = Ae.slice(Ie, Ie + 128);
				y(Te, 64), De = Te.read_shift(2), Me = A(Te, 0, De - pe), U.push(Me);
				var Fe = {
					name: Me,
					type: Te.read_shift(1),
					color: Te.read_shift(1),
					L: Te.read_shift(4, "i"),
					R: Te.read_shift(4, "i"),
					C: Te.read_shift(4, "i"),
					clsid: Te.read_shift(16),
					state: Te.read_shift(4, "i"),
					start: 0,
					size: 0
				};
				Te.read_shift(2) + Te.read_shift(2) + Te.read_shift(2) + Te.read_shift(2) !== 0 && (Fe.ct = S(Te, Te.l - 8));
				Te.read_shift(2) + Te.read_shift(2) + Te.read_shift(2) + Te.read_shift(2) !== 0 && (Fe.mt = S(Te, Te.l - 8)), Fe.start = Te.read_shift(4, "i"), Fe.size = Te.read_shift(4, "i"), Fe.size < 0 && Fe.start < 0 && (Fe.size = Fe.type = 0, Fe.start = ze, Fe.name = ""), Fe.type === 5 ? (fe = Fe.start, J > 0 && fe !== ze && (j[fe].name = "!StreamData")) : Fe.size >= 4096 ? (Fe.storage = "fat", j[Fe.start] === void 0 && (j[Fe.start] = N(P, Fe.start, j.fat_addrs, j.ssz)), j[Fe.start].name = Fe.name, Fe.content = j[Fe.start].data.slice(0, Fe.size)) : (Fe.storage = "minifat", Fe.size < 0 ? Fe.size = 0 : fe !== ze && Fe.start !== ze && j[fe] && (Fe.content = _e(Fe, j[fe].data, (j[ve] || {}).data))), Fe.content && y(Fe.content, 0), te[Me] = Fe, de.push(Fe);
			}
		}
		function S(F, j) {
			return /* @__PURE__ */ new Date((x(F, j + 4) / 1e7 * Math.pow(2, 32) + x(F, j) / 1e7 - 11644473600) * 1e3);
		}
		function z(F, j) {
			return Oe(), Ue(Ne.readFileSync(F), j);
		}
		function X(F, j) {
			var P = j && j.type;
			switch (P || a && Buffer.isBuffer(F) && (P = "buffer"), P || "base64") {
				case "file": return z(F, j);
				case "base64": return Ue(o(i(F)), j);
				case "binary": return Ue(o(F), j);
			}
			return Ue(F, j);
		}
		function K(F, j) {
			var P = j || {}, U = P.root || "Root Entry";
			if (F.FullPaths || (F.FullPaths = []), F.FileIndex || (F.FileIndex = []), F.FullPaths.length !== F.FileIndex.length) throw new Error("inconsistent CFB structure");
			F.FullPaths.length === 0 && (F.FullPaths[0] = U + "/", F.FileIndex[0] = {
				name: U,
				type: 5
			}), P.CLSID && (F.FileIndex[0].clsid = P.CLSID), re(F);
		}
		function re(F) {
			var j = "Sh33tJ5";
			if (!se.find(F, "/" + j)) {
				var P = ie(4);
				P[0] = 55, P[1] = P[3] = 50, P[2] = 54, F.FileIndex.push({
					name: j,
					type: 2,
					content: P,
					size: 4,
					L: 69,
					R: 69,
					C: 69
				}), F.FullPaths.push(F.FullPaths[0] + j), ne(F);
			}
		}
		function ne(F, j) {
			K(F);
			for (var P = !1, U = !1, J = F.FullPaths.length - 1; J >= 0; --J) {
				var te = F.FileIndex[J];
				switch (te.type) {
					case 0:
						U ? P = !0 : (F.FileIndex.pop(), F.FullPaths.pop());
						break;
					case 1:
					case 2:
					case 5:
						U = !0, isNaN(te.R * te.L * te.C) && (P = !0), te.R > -1 && te.L > -1 && te.R == te.L && (P = !0);
						break;
					default: P = !0;
				}
			}
			if (!(!P && !j)) {
				var de = new Date(1987, 1, 19), ve = 0, fe = Object.create ? Object.create(null) : {}, pe = [];
				for (J = 0; J < F.FullPaths.length; ++J) fe[F.FullPaths[J]] = !0, F.FileIndex[J].type !== 0 && pe.push([F.FullPaths[J], F.FileIndex[J]]);
				for (J = 0; J < pe.length; ++J) {
					var Ae = q(pe[J][0]);
					for (U = fe[Ae]; !U;) {
						for (; q(Ae) && !fe[q(Ae)];) Ae = q(Ae);
						pe.push([Ae, {
							name: Z(Ae).replace("/", ""),
							type: 1,
							clsid: Bt,
							ct: de,
							mt: de,
							content: null
						}]), fe[Ae] = !0, Ae = q(pe[J][0]), U = fe[Ae];
					}
				}
				for (pe.sort(function(Me, Te) {
					return W(Me[0], Te[0]);
				}), F.FullPaths = [], F.FileIndex = [], J = 0; J < pe.length; ++J) F.FullPaths[J] = pe[J][0], F.FileIndex[J] = pe[J][1];
				for (J = 0; J < pe.length; ++J) {
					var Ie = F.FileIndex[J], De = F.FullPaths[J];
					if (Ie.name = Z(De).replace("/", ""), Ie.L = Ie.R = Ie.C = -(Ie.color = 1), Ie.size = Ie.content ? Ie.content.length : 0, Ie.start = 0, Ie.clsid = Ie.clsid || Bt, J === 0) Ie.C = pe.length > 1 ? 1 : -1, Ie.size = 0, Ie.type = 5;
					else if (De.slice(-1) == "/") {
						for (ve = J + 1; ve < pe.length && q(F.FullPaths[ve]) != De; ++ve);
						for (Ie.C = ve >= pe.length ? -1 : ve, ve = J + 1; ve < pe.length && q(F.FullPaths[ve]) != q(De); ++ve);
						Ie.R = ve >= pe.length ? -1 : ve, Ie.type = 1;
					} else q(F.FullPaths[J + 1] || "") == q(De) && (Ie.R = J + 1), Ie.type = 2;
				}
			}
		}
		function oe(F, j) {
			var P = j || {};
			if (P.fileType == "mad") return Gp(F, P);
			if (ne(F), P.fileType === "zip") return Qt(F, P);
			var U = (function(Me) {
				for (var Te = 0, Fe = 0, Ge = 0; Ge < Me.FileIndex.length; ++Ge) {
					var At = Me.FileIndex[Ge];
					if (At.content) {
						var Rt = At.content.length;
						Rt > 0 && (Rt < 4096 ? Te += Rt + 63 >> 6 : Fe += Rt + 511 >> 9);
					}
				}
				for (var Ct = Me.FullPaths.length + 3 >> 2, rr = Te + 7 >> 3, Pi = Te + 127 >> 7, Mi = rr + Fe + Ct + Pi, wn = Mi + 127 >> 7, so = wn <= 109 ? 0 : Math.ceil((wn - 109) / 127); Mi + wn + so + 127 >> 7 > wn;) so = ++wn <= 109 ? 0 : Math.ceil((wn - 109) / 127);
				var Ur = [
					1,
					so,
					wn,
					Pi,
					Ct,
					Fe,
					Te,
					0
				];
				return Me.FileIndex[0].size = Te << 6, Ur[7] = (Me.FileIndex[0].start = Ur[0] + Ur[1] + Ur[2] + Ur[3] + Ur[4] + Ur[5]) + (Ur[6] + 7 >> 3), Ur;
			})(F), J = ie(U[7] << 9), te = 0, de = 0;
			for (te = 0; te < 8; ++te) J.write_shift(1, dt[te]);
			for (te = 0; te < 8; ++te) J.write_shift(2, 0);
			for (J.write_shift(2, 62), J.write_shift(2, 3), J.write_shift(2, 65534), J.write_shift(2, 9), J.write_shift(2, 6), te = 0; te < 3; ++te) J.write_shift(2, 0);
			for (J.write_shift(4, 0), J.write_shift(4, U[2]), J.write_shift(4, U[0] + U[1] + U[2] + U[3] - 1), J.write_shift(4, 0), J.write_shift(4, 4096), J.write_shift(4, U[3] ? U[0] + U[1] + U[2] - 1 : ze), J.write_shift(4, U[3]), J.write_shift(-4, U[1] ? U[0] - 1 : ze), J.write_shift(4, U[1]), te = 0; te < 109; ++te) J.write_shift(-4, te < U[2] ? U[1] + te : -1);
			if (U[1]) for (de = 0; de < U[1]; ++de) {
				for (; te < 236 + de * 127; ++te) J.write_shift(-4, te < U[2] ? U[1] + te : -1);
				J.write_shift(-4, de === U[1] - 1 ? ze : de + 1);
			}
			var ve = function(Me) {
				for (de += Me; te < de - 1; ++te) J.write_shift(-4, te + 1);
				Me && (++te, J.write_shift(-4, ze));
			};
			for (de = te = 0, de += U[1]; te < de; ++te) J.write_shift(-4, $e.DIFSECT);
			for (de += U[2]; te < de; ++te) J.write_shift(-4, $e.FATSECT);
			ve(U[3]), ve(U[4]);
			for (var fe = 0, pe = 0, Ae = F.FileIndex[0]; fe < F.FileIndex.length; ++fe) Ae = F.FileIndex[fe], Ae.content && (pe = Ae.content.length, !(pe < 4096) && (Ae.start = de, ve(pe + 511 >> 9)));
			for (ve(U[6] + 7 >> 3); J.l & 511;) J.write_shift(-4, $e.ENDOFCHAIN);
			for (de = te = 0, fe = 0; fe < F.FileIndex.length; ++fe) Ae = F.FileIndex[fe], Ae.content && (pe = Ae.content.length, !(!pe || pe >= 4096) && (Ae.start = de, ve(pe + 63 >> 6)));
			for (; J.l & 511;) J.write_shift(-4, $e.ENDOFCHAIN);
			for (te = 0; te < U[4] << 2; ++te) {
				var Ie = F.FullPaths[te];
				if (!Ie || Ie.length === 0) {
					for (fe = 0; fe < 17; ++fe) J.write_shift(4, 0);
					for (fe = 0; fe < 3; ++fe) J.write_shift(4, -1);
					for (fe = 0; fe < 12; ++fe) J.write_shift(4, 0);
					continue;
				}
				Ae = F.FileIndex[te], te === 0 && (Ae.start = Ae.size ? Ae.start - 1 : ze);
				var De = te === 0 && P.root || Ae.name;
				if (De.length > 32 && (console.error("Name " + De + " will be truncated to " + De.slice(0, 32)), De = De.slice(0, 32)), pe = 2 * (De.length + 1), J.write_shift(64, De, "utf16le"), J.write_shift(2, pe), J.write_shift(1, Ae.type), J.write_shift(1, Ae.color), J.write_shift(-4, Ae.L), J.write_shift(-4, Ae.R), J.write_shift(-4, Ae.C), Ae.clsid) J.write_shift(16, Ae.clsid, "hex");
				else for (fe = 0; fe < 4; ++fe) J.write_shift(4, 0);
				J.write_shift(4, Ae.state || 0), J.write_shift(4, 0), J.write_shift(4, 0), J.write_shift(4, 0), J.write_shift(4, 0), J.write_shift(4, Ae.start), J.write_shift(4, Ae.size), J.write_shift(4, 0);
			}
			for (te = 1; te < F.FileIndex.length; ++te) if (Ae = F.FileIndex[te], Ae.size >= 4096) if (J.l = Ae.start + 1 << 9, a && Buffer.isBuffer(Ae.content)) Ae.content.copy(J, J.l, 0, Ae.size), J.l += Ae.size + 511 & -512;
			else {
				for (fe = 0; fe < Ae.size; ++fe) J.write_shift(1, Ae.content[fe]);
				for (; fe & 511; ++fe) J.write_shift(1, 0);
			}
			for (te = 1; te < F.FileIndex.length; ++te) if (Ae = F.FileIndex[te], Ae.size > 0 && Ae.size < 4096) if (a && Buffer.isBuffer(Ae.content)) Ae.content.copy(J, J.l, 0, Ae.size), J.l += Ae.size + 63 & -64;
			else {
				for (fe = 0; fe < Ae.size; ++fe) J.write_shift(1, Ae.content[fe]);
				for (; fe & 63; ++fe) J.write_shift(1, 0);
			}
			if (a) J.l = J.length;
			else for (; J.l < J.length;) J.write_shift(1, 0);
			return J;
		}
		function me(F, j) {
			var P = F.FullPaths.map(function(fe) {
				return fe.toUpperCase();
			}), U = P.map(function(fe) {
				var pe = fe.split("/");
				return pe[pe.length - (fe.slice(-1) == "/" ? 2 : 1)];
			}), J = !1;
			j.charCodeAt(0) === 47 ? (J = !0, j = P[0].slice(0, -1) + j) : J = j.indexOf("/") !== -1;
			var te = j.toUpperCase(), de = J === !0 ? P.indexOf(te) : U.indexOf(te);
			if (de !== -1) return F.FileIndex[de];
			var ve = !te.match(d);
			for (te = te.replace(l, ""), ve && (te = te.replace(d, "!")), de = 0; de < P.length; ++de) if ((ve ? P[de].replace(d, "!") : P[de]).replace(l, "") == te || (ve ? U[de].replace(d, "!") : U[de]).replace(l, "") == te) return F.FileIndex[de];
			return null;
		}
		var be = 64, ze = -2, He = "d0cf11e0a1b11ae1", dt = [
			208,
			207,
			17,
			224,
			161,
			177,
			26,
			225
		], Bt = "00000000000000000000000000000000", $e = {
			MAXREGSECT: -6,
			DIFSECT: -4,
			FATSECT: -3,
			ENDOFCHAIN: ze,
			FREESECT: -1,
			HEADER_SIGNATURE: He,
			HEADER_MINOR_VERSION: "3e00",
			MAXREGSID: -6,
			NOSTREAM: -1,
			HEADER_CLSID: Bt,
			EntryTypes: [
				"unknown",
				"storage",
				"stream",
				"lockbytes",
				"property",
				"root"
			]
		};
		function Ht(F, j, P) {
			Oe();
			var U = oe(F, P);
			Ne.writeFileSync(j, U);
		}
		function et(F) {
			for (var j = new Array(F.length), P = 0; P < F.length; ++P) j[P] = String.fromCharCode(F[P]);
			return j.join("");
		}
		function kt(F, j) {
			var P = oe(F, j);
			switch (j && j.type || "buffer") {
				case "file": return Oe(), Ne.writeFileSync(j.filename, P), P;
				case "binary": return typeof P == "string" ? P : et(P);
				case "base64": return n(typeof P == "string" ? P : et(P));
				case "buffer": if (a) return Buffer.isBuffer(P) ? P : s(P);
				case "array": return typeof P == "string" ? o(P) : P;
			}
			return P;
		}
		var Zt;
		function Wt(F) {
			try {
				var j = F.InflateRaw, P = new j();
				if (P._processChunk(new Uint8Array([3, 0]), P._finishFlushFlag), P.bytesRead) Zt = F;
				else throw new Error("zlib does not expose bytesRead");
			} catch (U) {
				console.error("cannot use native zlib: " + (U.message || U));
			}
		}
		function jr(F, j) {
			if (!Zt) return Ze(F, j);
			var P = Zt.InflateRaw, U = new P(), J = U._processChunk(F.slice(F.l), U._finishFlushFlag);
			return F.l += U.bytesRead, J;
		}
		function qr(F) {
			return Zt ? Zt.deflateRawSync(F) : le(F);
		}
		var br = [
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
		], Gt = [
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
			258
		], qt = [
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
			24577
		];
		function Pr(F) {
			var j = (F << 1 | F << 11) & 139536 | (F << 5 | F << 15) & 558144;
			return (j >> 16 | j >> 8 | j) & 255;
		}
		for (var pt = typeof Uint8Array != "undefined", gr = pt ? /* @__PURE__ */ new Uint8Array(256) : [], Wn = 0; Wn < 256; ++Wn) gr[Wn] = Pr(Wn);
		function to(F, j) {
			var P = gr[F & 255];
			return j <= 8 ? P >>> 8 - j : (P = P << 8 | gr[F >> 8 & 255], j <= 16 ? P >>> 16 - j : (P = P << 8 | gr[F >> 16 & 255], P >>> 24 - j));
		}
		function ro(F, j) {
			var P = j & 7, U = j >>> 3;
			return (F[U] | (P <= 6 ? 0 : F[U + 1] << 8)) >>> P & 3;
		}
		function Oi(F, j) {
			var P = j & 7, U = j >>> 3;
			return (F[U] | (P <= 5 ? 0 : F[U + 1] << 8)) >>> P & 7;
		}
		function no(F, j) {
			var P = j & 7, U = j >>> 3;
			return (F[U] | (P <= 4 ? 0 : F[U + 1] << 8)) >>> P & 15;
		}
		function Ya(F, j) {
			var P = j & 7, U = j >>> 3;
			return (F[U] | (P <= 3 ? 0 : F[U + 1] << 8)) >>> P & 31;
		}
		function Ka(F, j) {
			var P = j & 7, U = j >>> 3;
			return (F[U] | (P <= 1 ? 0 : F[U + 1] << 8)) >>> P & 127;
		}
		function $r(F, j, P) {
			var U = j & 7, J = j >>> 3, te = (1 << P) - 1, de = F[J] >>> U;
			return P < 8 - U || (de |= F[J + 1] << 8 - U, P < 16 - U) || (de |= F[J + 2] << 16 - U, P < 24 - U) || (de |= F[J + 3] << 24 - U), de & te;
		}
		function ja(F, j, P) {
			var U = j & 7, J = j >>> 3;
			return U <= 5 ? F[J] |= (P & 7) << U : (F[J] |= P << U & 255, F[J + 1] = (P & 7) >> 8 - U), j + 3;
		}
		function io(F, j, P) {
			var U = j & 7, J = j >>> 3;
			return P = (P & 1) << U, F[J] |= P, j + 1;
		}
		function Jr(F, j, P) {
			var U = j & 7, J = j >>> 3;
			return P <<= U, F[J] |= P & 255, P >>>= 8, F[J + 1] = P, j + 8;
		}
		function B(F, j, P) {
			var U = j & 7, J = j >>> 3;
			return P <<= U, F[J] |= P & 255, P >>>= 8, F[J + 1] = P & 255, F[J + 2] = P >>> 8, j + 16;
		}
		function Q(F, j) {
			var P = F.length, U = 2 * P > j ? 2 * P : j + 5, J = 0;
			if (P >= j) return F;
			if (a) {
				var te = c(U);
				if (F.copy) F.copy(te);
				else for (; J < F.length; ++J) te[J] = F[J];
				return te;
			} else if (pt) {
				var de = new Uint8Array(U);
				if (de.set) de.set(F);
				else for (; J < P; ++J) de[J] = F[J];
				return de;
			}
			return F.length = U, F;
		}
		function L(F) {
			for (var j = new Array(F), P = 0; P < F; ++P) j[P] = 0;
			return j;
		}
		function M(F, j, P) {
			var U = 1, J = 0, te = 0, de = 0, ve = 0, fe = F.length, pe = pt ? /* @__PURE__ */ new Uint16Array(32) : L(32);
			for (te = 0; te < 32; ++te) pe[te] = 0;
			for (te = fe; te < P; ++te) F[te] = 0;
			fe = F.length;
			var Ae = pt ? new Uint16Array(fe) : L(fe);
			for (te = 0; te < fe; ++te) pe[J = F[te]]++, U < J && (U = J), Ae[te] = 0;
			for (pe[0] = 0, te = 1; te <= U; ++te) pe[te + 16] = ve = ve + pe[te - 1] << 1;
			for (te = 0; te < fe; ++te) ve = F[te], ve != 0 && (Ae[te] = pe[ve + 16]++);
			var Ie = 0;
			for (te = 0; te < fe; ++te) if (Ie = F[te], Ie != 0) for (ve = to(Ae[te], U) >> U - Ie, de = (1 << U + 4 - Ie) - 1; de >= 0; --de) j[ve | de << Ie] = Ie & 15 | te << 4;
			return U;
		}
		var Y = pt ? /* @__PURE__ */ new Uint16Array(512) : L(512), $ = pt ? /* @__PURE__ */ new Uint16Array(32) : L(32);
		if (!pt) {
			for (var ue = 0; ue < 512; ++ue) Y[ue] = 0;
			for (ue = 0; ue < 32; ++ue) $[ue] = 0;
		}
		(function() {
			for (var F = [], j = 0; j < 32; j++) F.push(5);
			M(F, $, 32);
			var P = [];
			for (j = 0; j <= 143; j++) P.push(8);
			for (; j <= 255; j++) P.push(9);
			for (; j <= 279; j++) P.push(7);
			for (; j <= 287; j++) P.push(8);
			M(P, Y, 288);
		})();
		var we = (function() {
			for (var j = pt ? /* @__PURE__ */ new Uint8Array(32768) : [], P = 0, U = 0; P < qt.length - 1; ++P) for (; U < qt[P + 1]; ++U) j[U] = P;
			for (; U < 32768; ++U) j[U] = 29;
			var J = pt ? /* @__PURE__ */ new Uint8Array(259) : [];
			for (P = 0, U = 0; P < Gt.length - 1; ++P) for (; U < Gt[P + 1]; ++U) J[U] = P;
			function te(ve, fe) {
				for (var pe = 0; pe < ve.length;) {
					var Ae = Math.min(65535, ve.length - pe), Ie = pe + Ae == ve.length;
					for (fe.write_shift(1, +Ie), fe.write_shift(2, Ae), fe.write_shift(2, ~Ae & 65535); Ae-- > 0;) fe[fe.l++] = ve[pe++];
				}
				return fe.l;
			}
			function de(ve, fe) {
				for (var pe = 0, Ae = 0, Ie = pt ? /* @__PURE__ */ new Uint16Array(32768) : []; Ae < ve.length;) {
					var De = Math.min(65535, ve.length - Ae);
					if (De < 10) {
						for (pe = ja(fe, pe, +(Ae + De == ve.length)), pe & 7 && (pe += 8 - (pe & 7)), fe.l = pe / 8 | 0, fe.write_shift(2, De), fe.write_shift(2, ~De & 65535); De-- > 0;) fe[fe.l++] = ve[Ae++];
						pe = fe.l * 8;
						continue;
					}
					pe = ja(fe, pe, +(Ae + De == ve.length) + 2);
					for (var Me = 0; De-- > 0;) {
						var Te = ve[Ae];
						Me = (Me << 5 ^ Te) & 32767;
						var Fe = -1, Ge = 0;
						if ((Fe = Ie[Me]) && (Fe |= Ae & -32768, Fe > Ae && (Fe -= 32768), Fe < Ae)) for (; ve[Fe + Ge] == ve[Ae + Ge] && Ge < 250;) ++Ge;
						if (Ge > 2) {
							Te = J[Ge], Te <= 22 ? pe = Jr(fe, pe, gr[Te + 1] >> 1) - 1 : (Jr(fe, pe, 3), pe += 5, Jr(fe, pe, gr[Te - 23] >> 5), pe += 3);
							var At = Te < 8 ? 0 : Te - 4 >> 2;
							At > 0 && (B(fe, pe, Ge - Gt[Te]), pe += At), Te = j[Ae - Fe], pe = Jr(fe, pe, gr[Te] >> 3), pe -= 3;
							var Rt = Te < 4 ? 0 : Te - 2 >> 1;
							Rt > 0 && (B(fe, pe, Ae - Fe - qt[Te]), pe += Rt);
							for (var Ct = 0; Ct < Ge; ++Ct) Ie[Me] = Ae & 32767, Me = (Me << 5 ^ ve[Ae]) & 32767, ++Ae;
							De -= Ge - 1;
						} else Te <= 143 ? Te = Te + 48 : pe = io(fe, pe, 1), pe = Jr(fe, pe, gr[Te]), Ie[Me] = Ae & 32767, ++Ae;
					}
					pe = Jr(fe, pe, 0) - 1;
				}
				return fe.l = (pe + 7) / 8 | 0, fe.l;
			}
			return function(fe, pe) {
				return fe.length < 8 ? te(fe, pe) : de(fe, pe);
			};
		})();
		function le(F) {
			var j = ie(50 + Math.floor(F.length * 1.1)), P = we(F, j);
			return j.slice(0, P);
		}
		var he = pt ? /* @__PURE__ */ new Uint16Array(32768) : L(32768), ce = pt ? /* @__PURE__ */ new Uint16Array(32768) : L(32768), Ce = pt ? /* @__PURE__ */ new Uint16Array(128) : L(128), ke = 1, Pe = 1;
		function Se(F, j) {
			var P = Ya(F, j) + 257;
			j += 5;
			var U = Ya(F, j) + 1;
			j += 5;
			var J = no(F, j) + 4;
			j += 4;
			for (var te = 0, de = pt ? /* @__PURE__ */ new Uint8Array(19) : L(19), ve = [
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
				0
			], fe = 1, pe = pt ? /* @__PURE__ */ new Uint8Array(8) : L(8), Ae = pt ? /* @__PURE__ */ new Uint8Array(8) : L(8), Ie = de.length, De = 0; De < J; ++De) de[br[De]] = te = Oi(F, j), fe < te && (fe = te), pe[te]++, j += 3;
			var Me = 0;
			for (pe[0] = 0, De = 1; De <= fe; ++De) Ae[De] = Me = Me + pe[De - 1] << 1;
			for (De = 0; De < Ie; ++De) (Me = de[De]) != 0 && (ve[De] = Ae[Me]++);
			var Te = 0;
			for (De = 0; De < Ie; ++De) if (Te = de[De], Te != 0) {
				Me = gr[ve[De]] >> 8 - Te;
				for (var Fe = (1 << 7 - Te) - 1; Fe >= 0; --Fe) Ce[Me | Fe << Te] = Te & 7 | De << 3;
			}
			var Ge = [];
			for (fe = 1; Ge.length < P + U;) switch (Me = Ce[Ka(F, j)], j += Me & 7, Me >>>= 3) {
				case 16:
					for (te = 3 + ro(F, j), j += 2, Me = Ge[Ge.length - 1]; te-- > 0;) Ge.push(Me);
					break;
				case 17:
					for (te = 3 + Oi(F, j), j += 3; te-- > 0;) Ge.push(0);
					break;
				case 18:
					for (te = 11 + Ka(F, j), j += 7; te-- > 0;) Ge.push(0);
					break;
				default:
					Ge.push(Me), fe < Me && (fe = Me);
					break;
			}
			var At = Ge.slice(0, P), Rt = Ge.slice(P);
			for (De = P; De < 286; ++De) At[De] = 0;
			for (De = U; De < 30; ++De) Rt[De] = 0;
			return ke = M(At, he, 286), Pe = M(Rt, ce, 30), j;
		}
		function Be(F, j) {
			if (F[0] == 3 && !(F[1] & 3)) return [u(j), 2];
			for (var P = 0, U = 0, J = c(j || 1 << 18), te = 0, de = J.length >>> 0, ve = 0, fe = 0; (U & 1) == 0;) {
				if (U = Oi(F, P), P += 3, U >>> 1) U >> 1 == 1 ? (ve = 9, fe = 5) : (P = Se(F, P), ve = ke, fe = Pe);
				else {
					P & 7 && (P += 8 - (P & 7));
					var pe = F[P >>> 3] | F[(P >>> 3) + 1] << 8;
					if (P += 32, pe > 0) for (!j && de < te + pe && (J = Q(J, te + pe), de = J.length); pe-- > 0;) J[te++] = F[P >>> 3], P += 8;
					continue;
				}
				for (;;) {
					!j && de < te + 32767 && (J = Q(J, te + 32767), de = J.length);
					var Ae = $r(F, P, ve), Ie = U >>> 1 == 1 ? Y[Ae] : he[Ae];
					if (P += Ie & 15, Ie >>>= 4, (Ie >>> 8 & 255) === 0) J[te++] = Ie;
					else {
						if (Ie == 256) break;
						Ie -= 257;
						var De = Ie < 8 ? 0 : Ie - 4 >> 2;
						De > 5 && (De = 0);
						var Me = te + Gt[Ie];
						De > 0 && (Me += $r(F, P, De), P += De), Ae = $r(F, P, fe), Ie = U >>> 1 == 1 ? $[Ae] : ce[Ae], P += Ie & 15, Ie >>>= 4;
						var Te = Ie < 4 ? 0 : Ie - 2 >> 1, Fe = qt[Ie];
						for (Te > 0 && (Fe += $r(F, P, Te), P += Te), !j && de < Me && (J = Q(J, Me + 100), de = J.length); te < Me;) J[te] = J[te - Fe], ++te;
					}
				}
			}
			return j ? [J, P + 7 >>> 3] : [J.slice(0, te), P + 7 >>> 3];
		}
		function Ze(F, j) {
			var U = Be(F.slice(F.l || 0), j);
			return F.l += U[1], U[0];
		}
		function ut(F, j) {
			if (F) typeof console != "undefined" && console.error(j);
			else throw new Error(j);
		}
		function xt(F, j) {
			var P = F;
			y(P, 0);
			var te = {
				FileIndex: [],
				FullPaths: []
			};
			K(te, { root: j.root });
			for (var de = P.length - 4; (P[de] != 80 || P[de + 1] != 75 || P[de + 2] != 5 || P[de + 3] != 6) && de >= 0;) --de;
			P.l = de + 4, P.l += 4;
			var ve = P.read_shift(2);
			P.l += 6;
			for (P.l = P.read_shift(4), de = 0; de < ve; ++de) {
				P.l += 20;
				var pe = P.read_shift(4), Ae = P.read_shift(4), Ie = P.read_shift(2), De = P.read_shift(2), Me = P.read_shift(2);
				P.l += 8;
				var Te = P.read_shift(4), Fe = ye(P.slice(P.l + Ie, P.l + Ie + De));
				P.l += Ie + De + Me;
				var Ge = P.l;
				P.l = Te + 4, wt(P, pe, Ae, te, Fe), P.l = Ge;
			}
			return te;
		}
		function wt(F, j, P, U, J) {
			F.l += 2;
			var te = F.read_shift(2), de = F.read_shift(2), ve = Ee(F);
			if (te & 8257) throw new Error("Unsupported ZIP encryption");
			for (var fe = F.read_shift(4), pe = F.read_shift(4), Ae = F.read_shift(4), Ie = F.read_shift(2), De = F.read_shift(2), Me = "", Te = 0; Te < Ie; ++Te) Me += String.fromCharCode(F[F.l++]);
			if (De) {
				var Fe = ye(F.slice(F.l, F.l + De));
				(Fe[21589] || {}).mt && (ve = Fe[21589].mt), ((J || {})[21589] || {}).mt && (ve = J[21589].mt);
			}
			F.l += De;
			var Ge = F.slice(F.l, F.l + pe);
			switch (de) {
				case 8:
					Ge = jr(F, Ae);
					break;
				case 0: break;
				default: throw new Error("Unsupported ZIP Compression method " + de);
			}
			var At = !1;
			te & 8 && (fe = F.read_shift(4), fe == 134695760 && (fe = F.read_shift(4), At = !0), pe = F.read_shift(4), Ae = F.read_shift(4)), pe != j && ut(At, "Bad compressed size: " + j + " != " + pe), Ae != P && ut(At, "Bad uncompressed size: " + P + " != " + Ae);
			var Rt = xe.buf(Ge, 0);
			fe >> 0 != Rt >> 0 && ut(At, "Bad CRC32 checksum: " + fe + " != " + Rt), ao(U, Me, Ge, {
				unsafe: !0,
				mt: ve
			});
		}
		function Qt(F, j) {
			var P = j || {}, U = [], J = [], te = ie(1), de = P.compression ? 8 : 0, ve = 0;
			var pe = 0, Ae = 0, Ie = 0, De = 0, Me = F.FullPaths[0], Te = Me, Fe = F.FileIndex[0], Ge = [], At = 0;
			for (pe = 1; pe < F.FullPaths.length; ++pe) if (Te = F.FullPaths[pe].slice(Me.length), Fe = F.FileIndex[pe], !(!Fe.size || !Fe.content || Te == "Sh33tJ5")) {
				var Rt = Ie, Ct = ie(Te.length);
				for (Ae = 0; Ae < Te.length; ++Ae) Ct.write_shift(1, Te.charCodeAt(Ae) & 127);
				Ct = Ct.slice(0, Ct.l), Ge[De] = xe.buf(Fe.content, 0);
				var rr = Fe.content;
				de == 8 && (rr = qr(rr)), te = ie(30), te.write_shift(4, 67324752), te.write_shift(2, 20), te.write_shift(2, ve), te.write_shift(2, de), Fe.mt ? ge(te, Fe.mt) : te.write_shift(4, 0), te.write_shift(-4, ve & 8 ? 0 : Ge[De]), te.write_shift(4, ve & 8 ? 0 : rr.length), te.write_shift(4, ve & 8 ? 0 : Fe.content.length), te.write_shift(2, Ct.length), te.write_shift(2, 0), Ie += te.length, U.push(te), Ie += Ct.length, U.push(Ct), Ie += rr.length, U.push(rr), ve & 8 && (te = ie(12), te.write_shift(-4, Ge[De]), te.write_shift(4, rr.length), te.write_shift(4, Fe.content.length), Ie += te.l, U.push(te)), te = ie(46), te.write_shift(4, 33639248), te.write_shift(2, 0), te.write_shift(2, 20), te.write_shift(2, ve), te.write_shift(2, de), te.write_shift(4, 0), te.write_shift(-4, Ge[De]), te.write_shift(4, rr.length), te.write_shift(4, Fe.content.length), te.write_shift(2, Ct.length), te.write_shift(2, 0), te.write_shift(2, 0), te.write_shift(2, 0), te.write_shift(2, 0), te.write_shift(4, 0), te.write_shift(4, Rt), At += te.l, J.push(te), At += Ct.length, J.push(Ct), ++De;
			}
			return te = ie(22), te.write_shift(4, 101010256), te.write_shift(2, 0), te.write_shift(2, 0), te.write_shift(2, De), te.write_shift(2, De), te.write_shift(4, At), te.write_shift(4, Ie), te.write_shift(2, 0), b([
				b(U),
				b(J),
				te
			]);
		}
		var yr = {
			htm: "text/html",
			xml: "text/xml",
			gif: "image/gif",
			jpg: "image/jpeg",
			png: "image/png",
			mso: "application/x-mso",
			thmx: "application/vnd.ms-officetheme",
			sh33tj5: "application/octet-stream"
		};
		function _n(F, j) {
			if (F.ctype) return F.ctype;
			var P = F.name || "", U = P.match(/\.([^\.]+)$/);
			return U && yr[U[1]] || j && (U = (P = j).match(/[\.\\]([^\.\\])+$/), U && yr[U[1]]) ? yr[U[1]] : "application/octet-stream";
		}
		function Mr(F) {
			for (var j = n(F), P = [], U = 0; U < j.length; U += 76) P.push(j.slice(U, U + 76));
			return P.join(`\r
`) + `\r
`;
		}
		function Li(F) {
			var j = F.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF=]/g, function(pe) {
				var Ae = pe.charCodeAt(0).toString(16).toUpperCase();
				return "=" + (Ae.length == 1 ? "0" + Ae : Ae);
			});
			j = j.replace(/ $/gm, "=20").replace(/\t$/gm, "=09"), j.charAt(0) == `
` && (j = "=0D" + j.slice(1)), j = j.replace(/\r(?!\n)/gm, "=0D").replace(/\n\n/gm, `
=0A`).replace(/([^\r\n])\n/gm, "$1=0A");
			for (var P = [], U = j.split(`\r
`), J = 0; J < U.length; ++J) {
				var te = U[J];
				if (te.length == 0) {
					P.push("");
					continue;
				}
				for (var de = 0; de < te.length;) {
					var ve = 76, fe = te.slice(de, de + ve);
					fe.charAt(ve - 1) == "=" ? ve-- : fe.charAt(ve - 2) == "=" ? ve -= 2 : fe.charAt(ve - 3) == "=" && (ve -= 3), fe = te.slice(de, de + ve), de += ve, de < te.length && (fe += "="), P.push(fe);
				}
			}
			return P.join(`\r
`);
		}
		function mr(F) {
			for (var j = [], P = 0; P < F.length; ++P) {
				for (var U = F[P]; P <= F.length && U.charAt(U.length - 1) == "=";) U = U.slice(0, U.length - 1) + F[++P];
				j.push(U);
			}
			for (var J = 0; J < j.length; ++J) j[J] = j[J].replace(/[=][0-9A-Fa-f]{2}/g, function(te) {
				return String.fromCharCode(parseInt(te.slice(1), 16));
			});
			return o(j.join(`\r
`));
		}
		function Zp(F, j, P) {
			for (var U = "", J = "", te = "", de, ve = 0; ve < 10; ++ve) {
				var fe = j[ve];
				if (!fe || fe.match(/^\s*$/)) break;
				var pe = fe.match(/^(.*?):\s*([^\s].*)$/);
				if (pe) switch (pe[1].toLowerCase()) {
					case "content-location":
						U = pe[2].trim();
						break;
					case "content-type":
						te = pe[2].trim();
						break;
					case "content-transfer-encoding":
						J = pe[2].trim();
						break;
				}
			}
			switch (++ve, J.toLowerCase()) {
				case "base64":
					de = o(i(j.slice(ve).join("")));
					break;
				case "quoted-printable":
					de = mr(j.slice(ve));
					break;
				default: throw new Error("Unsupported Content-Transfer-Encoding " + J);
			}
			var Ae = ao(F, U.slice(P.length), de, { unsafe: !0 });
			te && (Ae.ctype = te);
		}
		function Wp(F, j) {
			if (et(F.slice(0, 13)).toLowerCase() != "mime-version:") throw new Error("Unsupported MAD header");
			var P = j && j.root || "", U = (a && Buffer.isBuffer(F) ? F.toString("binary") : et(F)).split(`\r
`), J = 0, te = "";
			for (J = 0; J < U.length; ++J) if (te = U[J], !!/^Content-Location:/i.test(te) && (te = te.slice(te.indexOf("file")), P || (P = te.slice(0, te.lastIndexOf("/") + 1)), te.slice(0, P.length) != P)) for (; P.length > 0 && (P = P.slice(0, P.length - 1), P = P.slice(0, P.lastIndexOf("/") + 1), te.slice(0, P.length) != P););
			var de = (U[1] || "").match(/boundary="(.*?)"/);
			if (!de) throw new Error("MAD cannot find boundary");
			var ve = "--" + (de[1] || ""), Ae = {
				FileIndex: [],
				FullPaths: []
			};
			K(Ae);
			var Ie, De = 0;
			for (J = 0; J < U.length; ++J) {
				var Me = U[J];
				Me !== ve && Me !== ve + "--" || (De++ && Zp(Ae, U.slice(Ie, J), P), Ie = J);
			}
			return Ae;
		}
		function Gp(F, j) {
			var P = j || {}, U = P.boundary || "SheetJS";
			U = "------=" + U;
			for (var J = [
				"MIME-Version: 1.0",
				"Content-Type: multipart/related; boundary=\"" + U.slice(2) + "\"",
				"",
				"",
				""
			], te = F.FullPaths[0], de = te, ve = F.FileIndex[0], fe = 1; fe < F.FullPaths.length; ++fe) if (de = F.FullPaths[fe].slice(te.length), ve = F.FileIndex[fe], !(!ve.size || !ve.content || de == "Sh33tJ5")) {
				de = de.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF]/g, function(Ge) {
					return "_x" + Ge.charCodeAt(0).toString(16) + "_";
				}).replace(/[\u0080-\uFFFF]/g, function(Ge) {
					return "_u" + Ge.charCodeAt(0).toString(16) + "_";
				});
				for (var pe = ve.content, Ae = a && Buffer.isBuffer(pe) ? pe.toString("binary") : et(pe), Ie = 0, De = Math.min(1024, Ae.length), Me = 0, Te = 0; Te <= De; ++Te) (Me = Ae.charCodeAt(Te)) >= 32 && Me < 128 && ++Ie;
				var Fe = Ie >= De * 4 / 5;
				J.push(U), J.push("Content-Location: " + (P.root || "file:///C:/SheetJS/") + de), J.push("Content-Transfer-Encoding: " + (Fe ? "quoted-printable" : "base64")), J.push("Content-Type: " + _n(ve, de)), J.push(""), J.push(Fe ? Li(Ae) : Mr(Ae));
			}
			return J.push(U + `--\r
`), J.join(`\r
`);
		}
		function Qp(F) {
			var j = {};
			return K(j, F), j;
		}
		function ao(F, j, P, U) {
			var J = U && U.unsafe;
			J || K(F);
			var te = !J && se.find(F, j);
			if (!te) {
				var de = F.FullPaths[0];
				j.slice(0, de.length) == de ? de = j : (de.slice(-1) != "/" && (de += "/"), de = (de + j).replace("//", "/")), te = {
					name: Z(j),
					type: 2
				}, F.FileIndex.push(te), F.FullPaths.push(de), J || se.utils.cfb_gc(F);
			}
			return te.content = P, te.size = P ? P.length : 0, U && (U.CLSID && (te.clsid = U.CLSID), U.mt && (te.mt = U.mt), U.ct && (te.ct = U.ct)), te;
		}
		function Yp(F, j) {
			K(F);
			var P = se.find(F, j);
			if (P) {
				for (var U = 0; U < F.FileIndex.length; ++U) if (F.FileIndex[U] == P) return F.FileIndex.splice(U, 1), F.FullPaths.splice(U, 1), !0;
			}
			return !1;
		}
		function Kp(F, j, P) {
			K(F);
			var U = se.find(F, j);
			if (U) {
				for (var J = 0; J < F.FileIndex.length; ++J) if (F.FileIndex[J] == U) return F.FileIndex[J].name = Z(P), F.FullPaths[J] = P, !0;
			}
			return !1;
		}
		function jp(F) {
			ne(F, !0);
		}
		return R.find = me, R.read = X, R.parse = Ue, R.write = kt, R.writeFile = Ht, R.utils = {
			cfb_new: Qp,
			cfb_add: ao,
			cfb_del: Yp,
			cfb_mov: Kp,
			cfb_gc: jp,
			ReadShift: O,
			CheckField: V,
			prep_blob: y,
			bconcat: b,
			use_zlib: Wt,
			_deflateRaw: le,
			_inflateRaw: Ze,
			consts: $e
		}, R;
	})();
	typeof Ea != "undefined" && typeof r != "undefined" && typeof DO_NOT_EXPORT_CFB == "undefined" && (r.exports = se);
} });
var ed = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
var Gm = ed + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
var Qm = "[" + ed + "][" + Gm + "]*";
new RegExp("^" + Qm + "$");
new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
ht(ht(ht(ht(ht(ht(ht(ht(ht(ht(ht(ht(ht({}, {
	amp: "&",
	AMP: "&",
	lt: "<",
	LT: "<",
	gt: ">",
	GT: ">",
	quot: "\"",
	QUOT: "\"",
	apos: "'",
	lsquo: "‘",
	rsquo: "’",
	ldquo: "“",
	rdquo: "”",
	lsquor: "‚",
	rsquor: "’",
	ldquor: "„",
	bdquo: "„",
	comma: ",",
	period: ".",
	colon: ":",
	semi: ";",
	excl: "!",
	quest: "?",
	num: "#",
	dollar: "$",
	percent: "%",
	amp: "&",
	ast: "*",
	commat: "@",
	lowbar: "_",
	verbar: "|",
	vert: "|",
	sol: "/",
	bsol: "\\",
	lbrace: "{",
	rbrace: "}",
	lbrack: "[",
	rbrack: "]",
	lpar: "(",
	rpar: ")",
	nbsp: "\xA0",
	iexcl: "¡",
	cent: "¢",
	pound: "£",
	curren: "¤",
	yen: "¥",
	brvbar: "¦",
	sect: "§",
	uml: "¨",
	copy: "©",
	COPY: "©",
	ordf: "ª",
	laquo: "«",
	not: "¬",
	shy: "­",
	reg: "®",
	REG: "®",
	macr: "¯",
	deg: "°",
	plusmn: "±",
	sup2: "²",
	sup3: "³",
	acute: "´",
	micro: "µ",
	para: "¶",
	middot: "·",
	cedil: "¸",
	sup1: "¹",
	ordm: "º",
	raquo: "»",
	frac14: "¼",
	frac12: "½",
	half: "½",
	frac34: "¾",
	iquest: "¿",
	times: "×",
	div: "÷",
	divide: "÷"
}), {
	Agrave: "À",
	agrave: "à",
	Aacute: "Á",
	aacute: "á",
	Acirc: "Â",
	acirc: "â",
	Atilde: "Ã",
	atilde: "ã",
	Auml: "Ä",
	auml: "ä",
	Aring: "Å",
	aring: "å",
	AElig: "Æ",
	aelig: "æ",
	Ccedil: "Ç",
	ccedil: "ç",
	Egrave: "È",
	egrave: "è",
	Eacute: "É",
	eacute: "é",
	Ecirc: "Ê",
	ecirc: "ê",
	Euml: "Ë",
	euml: "ë",
	Igrave: "Ì",
	igrave: "ì",
	Iacute: "Í",
	iacute: "í",
	Icirc: "Î",
	icirc: "î",
	Iuml: "Ï",
	iuml: "ï",
	ETH: "Ð",
	eth: "ð",
	Ntilde: "Ñ",
	ntilde: "ñ",
	Ograve: "Ò",
	ograve: "ò",
	Oacute: "Ó",
	oacute: "ó",
	Ocirc: "Ô",
	ocirc: "ô",
	Otilde: "Õ",
	otilde: "õ",
	Ouml: "Ö",
	ouml: "ö",
	Oslash: "Ø",
	oslash: "ø",
	Ugrave: "Ù",
	ugrave: "ù",
	Uacute: "Ú",
	uacute: "ú",
	Ucirc: "Û",
	ucirc: "û",
	Uuml: "Ü",
	uuml: "ü",
	Yacute: "Ý",
	yacute: "ý",
	THORN: "Þ",
	thorn: "þ",
	szlig: "ß",
	yuml: "ÿ",
	Yuml: "Ÿ"
}), {
	Amacr: "Ā",
	amacr: "ā",
	Abreve: "Ă",
	abreve: "ă",
	Aogon: "Ą",
	aogon: "ą",
	Cacute: "Ć",
	cacute: "ć",
	Ccirc: "Ĉ",
	ccirc: "ĉ",
	Cdot: "Ċ",
	cdot: "ċ",
	Ccaron: "Č",
	ccaron: "č",
	Dcaron: "Ď",
	dcaron: "ď",
	Dstrok: "Đ",
	dstrok: "đ",
	Emacr: "Ē",
	emacr: "ē",
	Ecaron: "Ě",
	ecaron: "ě",
	Edot: "Ė",
	edot: "ė",
	Eogon: "Ę",
	eogon: "ę",
	Gcirc: "Ĝ",
	gcirc: "ĝ",
	Gbreve: "Ğ",
	gbreve: "ğ",
	Gdot: "Ġ",
	gdot: "ġ",
	Gcedil: "Ģ",
	Hcirc: "Ĥ",
	hcirc: "ĥ",
	Hstrok: "Ħ",
	hstrok: "ħ",
	Itilde: "Ĩ",
	itilde: "ĩ",
	Imacr: "Ī",
	imacr: "ī",
	Iogon: "Į",
	iogon: "į",
	Idot: "İ",
	IJlig: "Ĳ",
	ijlig: "ĳ",
	Jcirc: "Ĵ",
	jcirc: "ĵ",
	Kcedil: "Ķ",
	kcedil: "ķ",
	kgreen: "ĸ",
	Lacute: "Ĺ",
	lacute: "ĺ",
	Lcedil: "Ļ",
	lcedil: "ļ",
	Lcaron: "Ľ",
	lcaron: "ľ",
	Lmidot: "Ŀ",
	lmidot: "ŀ",
	Lstrok: "Ł",
	lstrok: "ł",
	Nacute: "Ń",
	nacute: "ń",
	Ncaron: "Ň",
	ncaron: "ň",
	Ncedil: "Ņ",
	ncedil: "ņ",
	ENG: "Ŋ",
	eng: "ŋ",
	Omacr: "Ō",
	omacr: "ō",
	Odblac: "Ő",
	odblac: "ő",
	OElig: "Œ",
	oelig: "œ",
	Racute: "Ŕ",
	racute: "ŕ",
	Rcaron: "Ř",
	rcaron: "ř",
	Rcedil: "Ŗ",
	rcedil: "ŗ",
	Sacute: "Ś",
	sacute: "ś",
	Scirc: "Ŝ",
	scirc: "ŝ",
	Scedil: "Ş",
	scedil: "ş",
	Scaron: "Š",
	scaron: "š",
	Tcedil: "Ţ",
	tcedil: "ţ",
	Tcaron: "Ť",
	tcaron: "ť",
	Tstrok: "Ŧ",
	tstrok: "ŧ",
	Utilde: "Ũ",
	utilde: "ũ",
	Umacr: "Ū",
	umacr: "ū",
	Ubreve: "Ŭ",
	ubreve: "ŭ",
	Uring: "Ů",
	uring: "ů",
	Udblac: "Ű",
	udblac: "ű",
	Uogon: "Ų",
	uogon: "ų",
	Wcirc: "Ŵ",
	wcirc: "ŵ",
	Ycirc: "Ŷ",
	ycirc: "ŷ",
	Zacute: "Ź",
	zacute: "ź",
	Zdot: "Ż",
	zdot: "ż",
	Zcaron: "Ž",
	zcaron: "ž"
}), {
	Alpha: "Α",
	alpha: "α",
	Beta: "Β",
	beta: "β",
	Gamma: "Γ",
	gamma: "γ",
	Delta: "Δ",
	delta: "δ",
	Epsilon: "Ε",
	epsilon: "ε",
	epsiv: "ϵ",
	varepsilon: "ϵ",
	Zeta: "Ζ",
	zeta: "ζ",
	Eta: "Η",
	eta: "η",
	Theta: "Θ",
	theta: "θ",
	thetasym: "ϑ",
	vartheta: "ϑ",
	Iota: "Ι",
	iota: "ι",
	Kappa: "Κ",
	kappa: "κ",
	kappav: "ϰ",
	varkappa: "ϰ",
	Lambda: "Λ",
	lambda: "λ",
	Mu: "Μ",
	mu: "μ",
	Nu: "Ν",
	nu: "ν",
	Xi: "Ξ",
	xi: "ξ",
	Omicron: "Ο",
	omicron: "ο",
	Pi: "Π",
	pi: "π",
	piv: "ϖ",
	varpi: "ϖ",
	Rho: "Ρ",
	rho: "ρ",
	rhov: "ϱ",
	varrho: "ϱ",
	Sigma: "Σ",
	sigma: "σ",
	sigmaf: "ς",
	sigmav: "ς",
	varsigma: "ς",
	Tau: "Τ",
	tau: "τ",
	Upsilon: "Υ",
	upsilon: "υ",
	upsi: "υ",
	Upsi: "ϒ",
	upsih: "ϒ",
	Phi: "Φ",
	phi: "φ",
	phiv: "ϕ",
	varphi: "ϕ",
	Chi: "Χ",
	chi: "χ",
	Psi: "Ψ",
	psi: "ψ",
	Omega: "Ω",
	omega: "ω",
	ohm: "Ω",
	Gammad: "Ϝ",
	gammad: "ϝ",
	digamma: "ϝ"
}), {
	Afr: "𝔄",
	afr: "𝔞",
	Acy: "А",
	acy: "а",
	Bcy: "Б",
	bcy: "б",
	Vcy: "В",
	vcy: "в",
	Gcy: "Г",
	gcy: "г",
	Dcy: "Д",
	dcy: "д",
	IEcy: "Е",
	iecy: "е",
	IOcy: "Ё",
	iocy: "ё",
	ZHcy: "Ж",
	zhcy: "ж",
	Zcy: "З",
	zcy: "з",
	Icy: "И",
	icy: "и",
	Jcy: "Й",
	jcy: "й",
	Kcy: "К",
	kcy: "к",
	Lcy: "Л",
	lcy: "л",
	Mcy: "М",
	mcy: "м",
	Ncy: "Н",
	ncy: "н",
	Ocy: "О",
	ocy: "о",
	Pcy: "П",
	pcy: "п",
	Rcy: "Р",
	rcy: "р",
	Scy: "С",
	scy: "с",
	Tcy: "Т",
	tcy: "т",
	Ucy: "У",
	ucy: "у",
	Fcy: "Ф",
	fcy: "ф",
	KHcy: "Х",
	khcy: "х",
	TScy: "Ц",
	tscy: "ц",
	CHcy: "Ч",
	chcy: "ч",
	SHcy: "Ш",
	shcy: "ш",
	SHCHcy: "Щ",
	shchcy: "щ",
	HARDcy: "Ъ",
	hardcy: "ъ",
	Ycy: "Ы",
	ycy: "ы",
	SOFTcy: "Ь",
	softcy: "ь",
	Ecy: "Э",
	ecy: "э",
	YUcy: "Ю",
	yucy: "ю",
	YAcy: "Я",
	yacy: "я",
	DJcy: "Ђ",
	djcy: "ђ",
	GJcy: "Ѓ",
	gjcy: "ѓ",
	Jukcy: "Є",
	jukcy: "є",
	DScy: "Ѕ",
	dscy: "ѕ",
	Iukcy: "І",
	iukcy: "і",
	YIcy: "Ї",
	yicy: "ї",
	Jsercy: "Ј",
	jsercy: "ј",
	LJcy: "Љ",
	ljcy: "љ",
	NJcy: "Њ",
	njcy: "њ",
	TSHcy: "Ћ",
	tshcy: "ћ",
	KJcy: "Ќ",
	kjcy: "ќ",
	Ubrcy: "Ў",
	ubrcy: "ў",
	DZcy: "Џ",
	dzcy: "џ"
}), {
	plus: "+",
	minus: "−",
	mnplus: "∓",
	mp: "∓",
	pm: "±",
	times: "×",
	div: "÷",
	divide: "÷",
	sdot: "⋅",
	star: "☆",
	starf: "★",
	bigstar: "★",
	lowast: "∗",
	ast: "*",
	midast: "*",
	compfn: "∘",
	smallcircle: "∘",
	bullet: "•",
	bull: "•",
	nbsp: "\xA0",
	hellip: "…",
	mldr: "…",
	prime: "′",
	Prime: "″",
	tprime: "‴",
	bprime: "‵",
	backprime: "‵",
	minus: "−",
	minusd: "∸",
	dotminus: "∸",
	plusdo: "∔",
	dotplus: "∔",
	plusmn: "±",
	minusplus: "∓",
	mnplus: "∓",
	mp: "∓",
	setminus: "∖",
	smallsetminus: "∖",
	Backslash: "∖",
	setmn: "∖",
	ssetmn: "∖",
	lowbar: "_",
	verbar: "|",
	vert: "|",
	VerticalLine: "|",
	colon: ":",
	Colon: "∷",
	Proportion: "∷",
	ratio: "∶",
	equals: "=",
	ne: "≠",
	nequiv: "≢",
	equiv: "≡",
	Congruent: "≡",
	sim: "∼",
	thicksim: "∼",
	thksim: "∼",
	sime: "≃",
	simeq: "≃",
	TildeEqual: "≃",
	asymp: "≈",
	approx: "≈",
	thickapprox: "≈",
	thkap: "≈",
	TildeTilde: "≈",
	ncong: "≇",
	cong: "≅",
	TildeFullEqual: "≅",
	asympeq: "≍",
	CupCap: "≍",
	bump: "≎",
	Bumpeq: "≎",
	HumpDownHump: "≎",
	bumpe: "≏",
	bumpeq: "≏",
	HumpEqual: "≏",
	dotminus: "∸",
	minusd: "∸",
	plusdo: "∔",
	dotplus: "∔",
	le: "≤",
	LessEqual: "≤",
	ge: "≥",
	GreaterEqual: "≥",
	lesseqgtr: "⋚",
	lesseqqgtr: "⪋",
	greater: ">",
	less: "<"
}), {
	alefsym: "ℵ",
	aleph: "ℵ",
	beth: "ℶ",
	gimel: "ℷ",
	daleth: "ℸ",
	forall: "∀",
	ForAll: "∀",
	part: "∂",
	PartialD: "∂",
	exist: "∃",
	Exists: "∃",
	nexist: "∄",
	nexists: "∄",
	empty: "∅",
	emptyset: "∅",
	emptyv: "∅",
	varnothing: "∅",
	nabla: "∇",
	Del: "∇",
	isin: "∈",
	isinv: "∈",
	in: "∈",
	Element: "∈",
	notin: "∉",
	notinva: "∉",
	ni: "∋",
	niv: "∋",
	SuchThat: "∋",
	ReverseElement: "∋",
	notni: "∌",
	notniva: "∌",
	prod: "∏",
	Product: "∏",
	coprod: "∐",
	Coproduct: "∐",
	sum: "∑",
	Sum: "∑",
	minus: "−",
	mp: "∓",
	plusdo: "∔",
	dotplus: "∔",
	setminus: "∖",
	lowast: "∗",
	radic: "√",
	Sqrt: "√",
	prop: "∝",
	propto: "∝",
	Proportional: "∝",
	varpropto: "∝",
	infin: "∞",
	infintie: "⧝",
	ang: "∠",
	angle: "∠",
	angmsd: "∡",
	measuredangle: "∡",
	angsph: "∢",
	mid: "∣",
	VerticalBar: "∣",
	nmid: "∤",
	nsmid: "∤",
	npar: "∦",
	parallel: "∥",
	spar: "∥",
	nparallel: "∦",
	nspar: "∦",
	and: "∧",
	wedge: "∧",
	or: "∨",
	vee: "∨",
	cap: "∩",
	cup: "∪",
	int: "∫",
	Integral: "∫",
	conint: "∮",
	ContourIntegral: "∮",
	Conint: "∯",
	DoubleContourIntegral: "∯",
	Cconint: "∰",
	there4: "∴",
	therefore: "∴",
	Therefore: "∴",
	becaus: "∵",
	because: "∵",
	Because: "∵",
	ratio: "∶",
	Proportion: "∷",
	minusd: "∸",
	dotminus: "∸",
	mDDot: "∺",
	homtht: "∻",
	sim: "∼",
	bsimg: "∽",
	backsim: "∽",
	ac: "∾",
	mstpos: "∾",
	acd: "∿",
	VerticalTilde: "≀",
	wr: "≀",
	wreath: "≀",
	nsime: "≄",
	nsimeq: "≄",
	nsimeq: "≄",
	ncong: "≇",
	simne: "≆",
	ncongdot: "⩭̸",
	ngsim: "≵",
	nsim: "≁",
	napprox: "≉",
	nap: "≉",
	ngeq: "≱",
	nge: "≱",
	nleq: "≰",
	nle: "≰",
	ngtr: "≯",
	ngt: "≯",
	nless: "≮",
	nlt: "≮",
	nprec: "⊀",
	npr: "⊀",
	nsucc: "⊁",
	nsc: "⊁"
}), {
	larr: "←",
	leftarrow: "←",
	LeftArrow: "←",
	uarr: "↑",
	uparrow: "↑",
	UpArrow: "↑",
	rarr: "→",
	rightarrow: "→",
	RightArrow: "→",
	darr: "↓",
	downarrow: "↓",
	DownArrow: "↓",
	harr: "↔",
	leftrightarrow: "↔",
	LeftRightArrow: "↔",
	varr: "↕",
	updownarrow: "↕",
	UpDownArrow: "↕",
	nwarr: "↖",
	nwarrow: "↖",
	UpperLeftArrow: "↖",
	nearr: "↗",
	nearrow: "↗",
	UpperRightArrow: "↗",
	searr: "↘",
	searrow: "↘",
	LowerRightArrow: "↘",
	swarr: "↙",
	swarrow: "↙",
	LowerLeftArrow: "↙",
	lArr: "⇐",
	Leftarrow: "⇐",
	uArr: "⇑",
	Uparrow: "⇑",
	rArr: "⇒",
	Rightarrow: "⇒",
	dArr: "⇓",
	Downarrow: "⇓",
	hArr: "⇔",
	Leftrightarrow: "⇔",
	iff: "⇔",
	vArr: "⇕",
	Updownarrow: "⇕",
	lAarr: "⇚",
	Lleftarrow: "⇚",
	rAarr: "⇛",
	Rrightarrow: "⇛",
	lrarr: "⇆",
	leftrightarrows: "⇆",
	rlarr: "⇄",
	rightleftarrows: "⇄",
	lrhar: "⇋",
	leftrightharpoons: "⇋",
	ReverseEquilibrium: "⇋",
	rlhar: "⇌",
	rightleftharpoons: "⇌",
	Equilibrium: "⇌",
	udarr: "⇅",
	UpArrowDownArrow: "⇅",
	duarr: "⇵",
	DownArrowUpArrow: "⇵",
	llarr: "⇇",
	leftleftarrows: "⇇",
	rrarr: "⇉",
	rightrightarrows: "⇉",
	ddarr: "⇊",
	downdownarrows: "⇊",
	har: "↽",
	lhard: "↽",
	leftharpoondown: "↽",
	lharu: "↼",
	leftharpoonup: "↼",
	rhard: "⇁",
	rightharpoondown: "⇁",
	rharu: "⇀",
	rightharpoonup: "⇀",
	lsh: "↰",
	Lsh: "↰",
	rsh: "↱",
	Rsh: "↱",
	ldsh: "↲",
	rdsh: "↳",
	hookleftarrow: "↩",
	hookrightarrow: "↪",
	mapstoleft: "↤",
	mapstoup: "↥",
	map: "↦",
	mapsto: "↦",
	mapstodown: "↧",
	crarr: "↵",
	nwarrow: "↖",
	nearrow: "↗",
	searrow: "↘",
	swarrow: "↙",
	nleftarrow: "↚",
	nleftrightarrow: "↮",
	nrightarrow: "↛",
	nrarr: "↛",
	larrtl: "↢",
	rarrtl: "↣",
	leftarrowtail: "↢",
	rightarrowtail: "↣",
	twoheadleftarrow: "↞",
	twoheadrightarrow: "↠",
	Larr: "↞",
	Rarr: "↠",
	larrhk: "↩",
	rarrhk: "↪",
	larrlp: "↫",
	looparrowleft: "↫",
	rarrlp: "↬",
	looparrowright: "↬",
	harrw: "↭",
	leftrightsquigarrow: "↭",
	nrarrw: "↝̸",
	rarrw: "↝",
	rightsquigarrow: "↝",
	larrbfs: "⤟",
	rarrbfs: "⤠",
	nvHarr: "⤄",
	nvlArr: "⤂",
	nvrArr: "⤃",
	larrfs: "⤝",
	rarrfs: "⤞",
	Map: "⤅",
	larrsim: "⥳",
	rarrsim: "⥴",
	harrcir: "⥈",
	Uarrocir: "⥉",
	lurdshar: "⥊",
	ldrdhar: "⥧",
	ldrushar: "⥋",
	rdldhar: "⥩",
	lrhard: "⥭",
	rlhar: "⇌",
	uharr: "↾",
	uharl: "↿",
	dharr: "⇂",
	dharl: "⇃",
	Uarr: "↟",
	Darr: "↡",
	zigrarr: "⇝",
	nwArr: "⇖",
	neArr: "⇗",
	seArr: "⇘",
	swArr: "⇙",
	nharr: "↮",
	nhArr: "⇎",
	nlarr: "↚",
	nlArr: "⇍",
	nrarr: "↛",
	nrArr: "⇏",
	larrb: "⇤",
	LeftArrowBar: "⇤",
	rarrb: "⇥",
	RightArrowBar: "⇥"
}), {
	square: "□",
	Square: "□",
	squ: "□",
	squf: "▪",
	squarf: "▪",
	blacksquar: "▪",
	blacksquare: "▪",
	FilledVerySmallSquare: "▪",
	blk34: "▓",
	blk12: "▒",
	blk14: "░",
	block: "█",
	srect: "▭",
	rect: "▭",
	sdot: "⋅",
	sdotb: "⊡",
	dotsquare: "⊡",
	triangle: "▵",
	tri: "▵",
	trine: "▵",
	utri: "▵",
	triangledown: "▿",
	dtri: "▿",
	tridown: "▿",
	triangleleft: "◃",
	ltri: "◃",
	triangleright: "▹",
	rtri: "▹",
	blacktriangle: "▴",
	utrif: "▴",
	blacktriangledown: "▾",
	dtrif: "▾",
	blacktriangleleft: "◂",
	ltrif: "◂",
	blacktriangleright: "▸",
	rtrif: "▸",
	loz: "◊",
	lozenge: "◊",
	blacklozenge: "⧫",
	lozf: "⧫",
	bigcirc: "◯",
	xcirc: "◯",
	circ: "ˆ",
	Circle: "○",
	cir: "○",
	o: "○",
	bullet: "•",
	bull: "•",
	hellip: "…",
	mldr: "…",
	nldr: "‥",
	boxh: "─",
	HorizontalLine: "─",
	boxv: "│",
	boxdr: "┌",
	boxdl: "┐",
	boxur: "└",
	boxul: "┘",
	boxvr: "├",
	boxvl: "┤",
	boxhd: "┬",
	boxhu: "┴",
	boxvh: "┼",
	boxH: "═",
	boxV: "║",
	boxdR: "╒",
	boxDr: "╓",
	boxDR: "╔",
	boxDl: "╕",
	boxdL: "╖",
	boxDL: "╗",
	boxuR: "╘",
	boxUr: "╙",
	boxUR: "╚",
	boxUl: "╜",
	boxuL: "╛",
	boxUL: "╝",
	boxvR: "╞",
	boxVr: "╟",
	boxVR: "╠",
	boxVl: "╢",
	boxvL: "╡",
	boxVL: "╣",
	boxHd: "╤",
	boxhD: "╥",
	boxHD: "╦",
	boxHu: "╧",
	boxhU: "╨",
	boxHU: "╩",
	boxvH: "╪",
	boxVh: "╫",
	boxVH: "╬"
}), {
	excl: "!",
	iexcl: "¡",
	brvbar: "¦",
	sect: "§",
	uml: "¨",
	copy: "©",
	ordf: "ª",
	laquo: "«",
	not: "¬",
	shy: "­",
	reg: "®",
	macr: "¯",
	deg: "°",
	plusmn: "±",
	sup2: "²",
	sup3: "³",
	acute: "´",
	micro: "µ",
	para: "¶",
	middot: "·",
	cedil: "¸",
	sup1: "¹",
	ordm: "º",
	raquo: "»",
	frac14: "¼",
	frac12: "½",
	frac34: "¾",
	iquest: "¿",
	nbsp: "\xA0",
	comma: ",",
	period: ".",
	colon: ":",
	semi: ";",
	vert: "|",
	Verbar: "‖",
	verbar: "|",
	dblac: "˝",
	circ: "ˆ",
	caron: "ˇ",
	breve: "˘",
	dot: "˙",
	ring: "˚",
	ogon: "˛",
	tilde: "˜",
	DiacriticalGrave: "`",
	DiacriticalAcute: "´",
	DiacriticalTilde: "˜",
	DiacriticalDot: "˙",
	DiacriticalDoubleAcute: "˝",
	grave: "`",
	acute: "´"
}), {
	cent: "¢",
	pound: "£",
	curren: "¤",
	yen: "¥",
	euro: "€",
	dollar: "$",
	euro: "€",
	fnof: "ƒ",
	inr: "₹",
	af: "؋",
	birr: "ብር",
	peso: "₱",
	rub: "₽",
	won: "₩",
	yuan: "¥",
	cedil: "¸"
}), {
	frac12: "½",
	half: "½",
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
	frasl: "⁄"
}), {
	trade: "™",
	TRADE: "™",
	telrec: "⌕",
	target: "⌖",
	ulcorn: "⌜",
	ulcorner: "⌜",
	urcorn: "⌝",
	urcorner: "⌝",
	dlcorn: "⌞",
	llcorner: "⌞",
	drcorn: "⌟",
	lrcorner: "⌟",
	intercal: "⊺",
	intcal: "⊺",
	oplus: "⊕",
	CirclePlus: "⊕",
	ominus: "⊖",
	CircleMinus: "⊖",
	otimes: "⊗",
	CircleTimes: "⊗",
	osol: "⊘",
	odot: "⊙",
	CircleDot: "⊙",
	oast: "⊛",
	circledast: "⊛",
	odash: "⊝",
	circleddash: "⊝",
	ocirc: "⊚",
	circledcirc: "⊚",
	boxplus: "⊞",
	plusb: "⊞",
	boxminus: "⊟",
	minusb: "⊟",
	boxtimes: "⊠",
	timesb: "⊠",
	boxdot: "⊡",
	sdotb: "⊡",
	veebar: "⊻",
	vee: "∨",
	barvee: "⊽",
	and: "∧",
	wedge: "∧",
	Cap: "⋒",
	Cup: "⋓",
	Fork: "⋔",
	pitchfork: "⋔",
	epar: "⋕",
	ltlarr: "⥶",
	nvap: "≍⃒",
	nvsim: "∼⃒",
	nvge: "≥⃒",
	nvle: "≤⃒",
	nvlt: "<⃒",
	nvgt: ">⃒",
	nvltrie: "⊴⃒",
	nvrtrie: "⊵⃒",
	Vdash: "⊩",
	dashv: "⊣",
	vDash: "⊨",
	Vdash: "⊩",
	Vvdash: "⊪",
	nvdash: "⊬",
	nvDash: "⊭",
	nVdash: "⊮",
	nVDash: "⊯"
});
Object.freeze({
	allow: 0,
	leave: 1,
	remove: 2,
	throw: 3
});
var Os;
typeof Symbol != "function" ? Os = "@@xmlMetadata" : Os = Symbol("XML Node Metadata");
var a2 = class {
	constructor(e) {
		this.tagname = e, this.child = [], this[":@"] = Object.create(null);
	}
	add(e, r) {
		e === "__proto__" && (e = "#__proto__"), this.child.push({ [e]: r });
	}
	addChild(e, r) {
		e.tagname === "__proto__" && (e.tagname = "#__proto__"), e[":@"] && Object.keys(e[":@"]).length > 0 ? this.child.push({
			[e.tagname]: e.child,
			":@": e[":@"]
		}) : this.child.push({ [e.tagname]: e.child }), r !== void 0 && (this.child[this.child.length - 1][Os] = { startIndex: r });
	}
	static getMetaDataSymbol() {
		return Os;
	}
};
new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
a2.getMetaDataSymbol();
Ws(Uu(), 1);
new TextDecoder("utf-8");
new TextDecoder("utf-16le");
new TextDecoder("utf-16be");
Ws(Uu(), 1);
var s2 = "HWP Document File";
var Zc = 256;
function o2(e) {
	return `${e.major}.${e.minor}.${e.build}.${e.revision}`;
}
function u2(e) {
	return e.major === 5 && (e.minor === 0 || e.minor === 1);
}
function l2(e) {
	return {
		raw: e,
		compressed: (e & 1) !== 0,
		encrypted: (e & 2) !== 0,
		distribution: (e & 4) !== 0,
		script: (e & 8) !== 0,
		drm: (e & 16) !== 0,
		xmlTemplate: (e & 32) !== 0,
		documentHistory: (e & 64) !== 0,
		digitalSignature: (e & 128) !== 0,
		publicKeyEncrypted: (e & 256) !== 0,
		modifiedCertificate: (e & 512) !== 0,
		prepareDistribution: (e & 1024) !== 0
	};
}
var Wc = class extends Error {
	constructor(e) {
		super(e), this.name = "HwpHeaderError";
	}
};
var h2 = new TextDecoder("ascii");
function c2(e) {
	if (e.byteLength < Zc) throw new Wc(`FileHeader \uD06C\uAE30 \uBD80\uC871: ${e.byteLength} (\uCD5C\uC18C ${Zc})`);
	let r = e.subarray(0, 32), t = r.indexOf(0);
	t === -1 && (t = 32);
	let n = h2.decode(r.subarray(0, t));
	if (!n.startsWith(s2)) throw new Wc(`HWP \uC2DC\uADF8\uB2C8\uCC98\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4: "${n}"`);
	return {
		version: {
			revision: e[32],
			build: e[33],
			minor: e[34],
			major: e[35]
		},
		flags: l2(new DataView(e.buffer, e.byteOffset, e.byteLength).getUint32(36, !0))
	};
}
var Gc = Ws(Wm(), 1);
var f2 = 4;
var Qc = 0;
var Yc = 1;
var d2 = 2;
function xi(e) {
	let r = e.length;
	for (; --r >= 0;) e[r] = 0;
}
var p2 = 0;
var td = 1;
var A2 = 2;
var g2 = 3;
var m2 = 258;
var zu = 29;
var Ua = 256;
var Ta = Ua + 1 + zu;
var bi = 30;
var Hu = 19;
var rd = 2 * Ta + 1;
var Fn = 15;
var lu = 16;
var _2 = 7;
var Zu = 256;
var nd = 16;
var id = 17;
var ad = 18;
var Cu = new Uint8Array([
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
]);
var Fs = new Uint8Array([
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
]);
var w2 = new Uint8Array([
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
]);
var sd = new Uint8Array([
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
]);
var v2 = 512;
var Yr = new Array((Ta + 2) * 2);
xi(Yr);
var ka = new Array(bi * 2);
xi(ka);
var Ba = new Array(v2);
xi(Ba);
var Na = new Array(m2 - g2 + 1);
xi(Na);
var Wu = new Array(zu);
xi(Wu);
var Ls = new Array(bi);
xi(Ls);
function hu(e, r, t, n, i) {
	this.static_tree = e, this.extra_bits = r, this.extra_base = t, this.elems = n, this.max_length = i, this.has_stree = e && e.length;
}
var od;
var ud;
var ld;
function cu(e, r) {
	this.dyn_tree = e, this.max_code = 0, this.stat_desc = r;
}
var hd = (e) => e < 256 ? Ba[e] : Ba[256 + (e >>> 7)], Fa = (e, r) => {
	e.pending_buf[e.pending++] = r & 255, e.pending_buf[e.pending++] = r >>> 8 & 255;
}, tr = (e, r, t) => {
	e.bi_valid > lu - t ? (e.bi_buf |= r << e.bi_valid & 65535, Fa(e, e.bi_buf), e.bi_buf = r >> lu - e.bi_valid, e.bi_valid += t - lu) : (e.bi_buf |= r << e.bi_valid & 65535, e.bi_valid += t);
}, Fr = (e, r, t) => {
	tr(e, t[r * 2], t[r * 2 + 1]);
}, cd = (e, r) => {
	let t = 0;
	do
		t |= e & 1, e >>>= 1, t <<= 1;
	while (--r > 0);
	return t >>> 1;
}, b2 = (e) => {
	e.bi_valid === 16 ? (Fa(e, e.bi_buf), e.bi_buf = 0, e.bi_valid = 0) : e.bi_valid >= 8 && (e.pending_buf[e.pending++] = e.bi_buf & 255, e.bi_buf >>= 8, e.bi_valid -= 8);
}, y2 = (e, r) => {
	let t = r.dyn_tree, n = r.max_code, i = r.stat_desc.static_tree, a = r.stat_desc.has_stree, s = r.stat_desc.extra_bits, u = r.stat_desc.extra_base, c = r.stat_desc.max_length, o, l, d, p, h, A, f = 0;
	for (p = 0; p <= Fn; p++) e.bl_count[p] = 0;
	for (t[e.heap[e.heap_max] * 2 + 1] = 0, o = e.heap_max + 1; o < rd; o++) l = e.heap[o], p = t[t[l * 2 + 1] * 2 + 1] + 1, p > c && (p = c, f++), t[l * 2 + 1] = p, !(l > n) && (e.bl_count[p]++, h = 0, l >= u && (h = s[l - u]), A = t[l * 2], e.opt_len += A * (p + h), a && (e.static_len += A * (i[l * 2 + 1] + h)));
	if (f !== 0) {
		do {
			for (p = c - 1; e.bl_count[p] === 0;) p--;
			e.bl_count[p]--, e.bl_count[p + 1] += 2, e.bl_count[c]--, f -= 2;
		} while (f > 0);
		for (p = c; p !== 0; p--) for (l = e.bl_count[p]; l !== 0;) d = e.heap[--o], !(d > n) && (t[d * 2 + 1] !== p && (e.opt_len += (p - t[d * 2 + 1]) * t[d * 2], t[d * 2 + 1] = p), l--);
	}
}, fd = (e, r, t) => {
	let n = new Array(Fn + 1), i = 0, a, s;
	for (a = 1; a <= Fn; a++) i = i + t[a - 1] << 1, n[a] = i;
	for (s = 0; s <= r; s++) {
		let u = e[s * 2 + 1];
		u !== 0 && (e[s * 2] = cd(n[u]++, u));
	}
}, E2 = () => {
	let e, r, t, n, i, a = new Array(Fn + 1);
	for (t = 0, n = 0; n < zu - 1; n++) for (Wu[n] = t, e = 0; e < 1 << Cu[n]; e++) Na[t++] = n;
	for (Na[t - 1] = n, i = 0, n = 0; n < 16; n++) for (Ls[n] = i, e = 0; e < 1 << Fs[n]; e++) Ba[i++] = n;
	for (i >>= 7; n < bi; n++) for (Ls[n] = i << 7, e = 0; e < 1 << Fs[n] - 7; e++) Ba[256 + i++] = n;
	for (r = 0; r <= Fn; r++) a[r] = 0;
	for (e = 0; e <= 143;) Yr[e * 2 + 1] = 8, e++, a[8]++;
	for (; e <= 255;) Yr[e * 2 + 1] = 9, e++, a[9]++;
	for (; e <= 279;) Yr[e * 2 + 1] = 7, e++, a[7]++;
	for (; e <= 287;) Yr[e * 2 + 1] = 8, e++, a[8]++;
	for (fd(Yr, Ta + 1, a), e = 0; e < bi; e++) ka[e * 2 + 1] = 5, ka[e * 2] = cd(e, 5);
	od = new hu(Yr, Cu, Ua + 1, Ta, Fn), ud = new hu(ka, Fs, 0, bi, Fn), ld = new hu(new Array(0), w2, 0, Hu, _2);
}, dd = (e) => {
	let r;
	for (r = 0; r < Ta; r++) e.dyn_ltree[r * 2] = 0;
	for (r = 0; r < bi; r++) e.dyn_dtree[r * 2] = 0;
	for (r = 0; r < Hu; r++) e.bl_tree[r * 2] = 0;
	e.dyn_ltree[Zu * 2] = 1, e.opt_len = e.static_len = 0, e.sym_next = e.matches = 0;
}, pd = (e) => {
	e.bi_valid > 8 ? Fa(e, e.bi_buf) : e.bi_valid > 0 && (e.pending_buf[e.pending++] = e.bi_buf), e.bi_buf = 0, e.bi_valid = 0;
}, Kc = (e, r, t, n) => {
	let i = r * 2, a = t * 2;
	return e[i] < e[a] || e[i] === e[a] && n[r] <= n[t];
}, fu = (e, r, t) => {
	let n = e.heap[t], i = t << 1;
	for (; i <= e.heap_len && (i < e.heap_len && Kc(r, e.heap[i + 1], e.heap[i], e.depth) && i++, !Kc(r, n, e.heap[i], e.depth));) e.heap[t] = e.heap[i], t = i, i <<= 1;
	e.heap[t] = n;
}, jc = (e, r, t) => {
	let n, i, a = 0, s, u;
	if (e.sym_next !== 0) do
		n = e.pending_buf[e.sym_buf + a++] & 255, n += (e.pending_buf[e.sym_buf + a++] & 255) << 8, i = e.pending_buf[e.sym_buf + a++], n === 0 ? Fr(e, i, r) : (s = Na[i], Fr(e, s + Ua + 1, r), u = Cu[s], u !== 0 && (i -= Wu[s], tr(e, i, u)), n--, s = hd(n), Fr(e, s, t), u = Fs[s], u !== 0 && (n -= Ls[s], tr(e, n, u)));
	while (a < e.sym_next);
	Fr(e, Zu, r);
}, Iu = (e, r) => {
	let t = r.dyn_tree, n = r.stat_desc.static_tree, i = r.stat_desc.has_stree, a = r.stat_desc.elems, s, u, c = -1, o;
	for (e.heap_len = 0, e.heap_max = rd, s = 0; s < a; s++) t[s * 2] !== 0 ? (e.heap[++e.heap_len] = c = s, e.depth[s] = 0) : t[s * 2 + 1] = 0;
	for (; e.heap_len < 2;) o = e.heap[++e.heap_len] = c < 2 ? ++c : 0, t[o * 2] = 1, e.depth[o] = 0, e.opt_len--, i && (e.static_len -= n[o * 2 + 1]);
	for (r.max_code = c, s = e.heap_len >> 1; s >= 1; s--) fu(e, t, s);
	o = a;
	do
		s = e.heap[1], e.heap[1] = e.heap[e.heap_len--], fu(e, t, 1), u = e.heap[1], e.heap[--e.heap_max] = s, e.heap[--e.heap_max] = u, t[o * 2] = t[s * 2] + t[u * 2], e.depth[o] = (e.depth[s] >= e.depth[u] ? e.depth[s] : e.depth[u]) + 1, t[s * 2 + 1] = t[u * 2 + 1] = o, e.heap[1] = o++, fu(e, t, 1);
	while (e.heap_len >= 2);
	e.heap[--e.heap_max] = e.heap[1], y2(e, r), fd(t, c, e.bl_count);
}, qc = (e, r, t) => {
	let n, i = -1, a, s = r[1], u = 0, c = 7, o = 4;
	for (s === 0 && (c = 138, o = 3), r[(t + 1) * 2 + 1] = 65535, n = 0; n <= t; n++) a = s, s = r[(n + 1) * 2 + 1], !(++u < c && a === s) && (u < o ? e.bl_tree[a * 2] += u : a !== 0 ? (a !== i && e.bl_tree[a * 2]++, e.bl_tree[nd * 2]++) : u <= 10 ? e.bl_tree[id * 2]++ : e.bl_tree[ad * 2]++, u = 0, i = a, s === 0 ? (c = 138, o = 3) : a === s ? (c = 6, o = 3) : (c = 7, o = 4));
}, $c = (e, r, t) => {
	let n, i = -1, a, s = r[1], u = 0, c = 7, o = 4;
	for (s === 0 && (c = 138, o = 3), n = 0; n <= t; n++) if (a = s, s = r[(n + 1) * 2 + 1], !(++u < c && a === s)) {
		if (u < o) do
			Fr(e, a, e.bl_tree);
		while (--u !== 0);
		else a !== 0 ? (a !== i && (Fr(e, a, e.bl_tree), u--), Fr(e, nd, e.bl_tree), tr(e, u - 3, 2)) : u <= 10 ? (Fr(e, id, e.bl_tree), tr(e, u - 3, 3)) : (Fr(e, ad, e.bl_tree), tr(e, u - 11, 7));
		u = 0, i = a, s === 0 ? (c = 138, o = 3) : a === s ? (c = 6, o = 3) : (c = 7, o = 4);
	}
}, x2 = (e) => {
	let r;
	for (qc(e, e.dyn_ltree, e.l_desc.max_code), qc(e, e.dyn_dtree, e.d_desc.max_code), Iu(e, e.bl_desc), r = Hu - 1; r >= 3 && e.bl_tree[sd[r] * 2 + 1] === 0; r--);
	return e.opt_len += 3 * (r + 1) + 5 + 5 + 4, r;
}, C2 = (e, r, t, n) => {
	let i;
	for (tr(e, r - 257, 5), tr(e, t - 1, 5), tr(e, n - 4, 4), i = 0; i < n; i++) tr(e, e.bl_tree[sd[i] * 2 + 1], 3);
	$c(e, e.dyn_ltree, r - 1), $c(e, e.dyn_dtree, t - 1);
}, I2 = (e) => {
	let r = 4093624447, t;
	for (t = 0; t <= 31; t++, r >>>= 1) if (r & 1 && e.dyn_ltree[t * 2] !== 0) return Qc;
	if (e.dyn_ltree[18] !== 0 || e.dyn_ltree[20] !== 0 || e.dyn_ltree[26] !== 0) return Yc;
	for (t = 32; t < Ua; t++) if (e.dyn_ltree[t * 2] !== 0) return Yc;
	return Qc;
}, Jc = !1, k2 = (e) => {
	Jc || (E2(), Jc = !0), e.l_desc = new cu(e.dyn_ltree, od), e.d_desc = new cu(e.dyn_dtree, ud), e.bl_desc = new cu(e.bl_tree, ld), e.bi_buf = 0, e.bi_valid = 0, dd(e);
}, Ad = (e, r, t, n) => {
	tr(e, (p2 << 1) + (n ? 1 : 0), 3), pd(e), Fa(e, t), Fa(e, ~t), t && e.pending_buf.set(e.window.subarray(r, r + t), e.pending), e.pending += t;
}, D2 = (e) => {
	tr(e, td << 1, 3), Fr(e, Zu, Yr), b2(e);
}, S2 = (e, r, t, n) => {
	let i, a, s = 0;
	e.level > 0 ? (e.strm.data_type === d2 && (e.strm.data_type = I2(e)), Iu(e, e.l_desc), Iu(e, e.d_desc), s = x2(e), i = e.opt_len + 3 + 7 >>> 3, a = e.static_len + 3 + 7 >>> 3, a <= i && (i = a)) : i = a = t + 5, t + 4 <= i && r !== -1 ? Ad(e, r, t, n) : e.strategy === f2 || a === i ? (tr(e, (td << 1) + (n ? 1 : 0), 3), jc(e, Yr, ka)) : (tr(e, (A2 << 1) + (n ? 1 : 0), 3), C2(e, e.l_desc.max_code + 1, e.d_desc.max_code + 1, s + 1), jc(e, e.dyn_ltree, e.dyn_dtree)), dd(e), n && pd(e);
}, T2 = (e, r, t) => (e.pending_buf[e.sym_buf + e.sym_next++] = r, e.pending_buf[e.sym_buf + e.sym_next++] = r >> 8, e.pending_buf[e.sym_buf + e.sym_next++] = t, r === 0 ? e.dyn_ltree[t * 2]++ : (e.matches++, r--, e.dyn_ltree[(Na[t] + Ua + 1) * 2]++, e.dyn_dtree[hd(r) * 2]++), e.sym_next === e.sym_end), L2 = {
	_tr_init: k2,
	_tr_stored_block: Ad,
	_tr_flush_block: S2,
	_tr_tally: T2,
	_tr_align: D2
}, P2 = (e, r, t, n) => {
	let i = e & 65535 | 0, a = e >>> 16 & 65535 | 0, s = 0;
	for (; t !== 0;) {
		s = t > 2e3 ? 2e3 : t, t -= s;
		do
			i = i + r[n++] | 0, a = a + i | 0;
		while (--s);
		i %= 65521, a %= 65521;
	}
	return i | a << 16 | 0;
}, Ra = P2, M2 = () => {
	let e, r = [];
	for (var t = 0; t < 256; t++) {
		e = t;
		for (var n = 0; n < 8; n++) e = e & 1 ? 3988292384 ^ e >>> 1 : e >>> 1;
		r[t] = e;
	}
	return r;
}, U2 = new Uint32Array(M2()), z2 = (e, r, t, n) => {
	let i = U2, a = n + t;
	e ^= -1;
	for (let s = n; s < a; s++) e = e >>> 8 ^ i[(e ^ r[s]) & 255];
	return e ^ -1;
}, Ft = z2, Pn = {
	2: "need dictionary",
	1: "stream end",
	0: "",
	"-1": "file error",
	"-2": "stream error",
	"-3": "data error",
	"-4": "insufficient memory",
	"-5": "buffer error",
	"-6": "incompatible version"
}, Ci = {
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
	Z_MEM_ERROR: -4,
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
}, { _tr_init: H2, _tr_stored_block: ku, _tr_flush_block: Z2, _tr_tally: dn, _tr_align: W2 } = L2, { Z_NO_FLUSH: pn, Z_PARTIAL_FLUSH: G2, Z_FULL_FLUSH: Q2, Z_FINISH: dr, Z_BLOCK: Vc, Z_OK: Mt, Z_STREAM_END: Xc, Z_STREAM_ERROR: Rr, Z_DATA_ERROR: Y2, Z_BUF_ERROR: du, Z_DEFAULT_COMPRESSION: K2, Z_FILTERED: j2, Z_HUFFMAN_ONLY: Cs, Z_RLE: q2, Z_FIXED: $2, Z_DEFAULT_STRATEGY: J2, Z_UNKNOWN: V2, Z_DEFLATED: Gs } = Ci, X2 = 9, e_ = 15, t_ = 8, Du = 286, i_ = 30, a_ = 19, s_ = 2 * Du + 1, o_ = 15, Xe = 3, fn = 258, Or = fn + Xe + 1, u_ = 32, yi = 42, Gu = 57, Su = 69, Tu = 73, Bu = 91, Nu = 103, Rn = 113, xa = 666, jt = 1, Ii = 2, Mn = 3, ki = 4, l_ = 3, On = (e, r) => (e.msg = Pn[r], r), ef = (e) => e * 2 - (e > 4 ? 9 : 0), cn = (e) => {
	let r = e.length;
	for (; --r >= 0;) e[r] = 0;
}, h_ = (e) => {
	let r, t, n, i = e.w_size;
	r = e.hash_size, n = r;
	do
		t = e.head[--n], e.head[n] = t >= i ? t - i : 0;
	while (--r);
	r = i, n = r;
	do
		t = e.prev[--n], e.prev[n] = t >= i ? t - i : 0;
	while (--r);
}, c_ = (e, r, t) => (r << e.hash_shift ^ t) & e.hash_mask, An = c_, sr = (e) => {
	let r = e.state, t = r.pending;
	t > e.avail_out && (t = e.avail_out), t !== 0 && (e.output.set(r.pending_buf.subarray(r.pending_out, r.pending_out + t), e.next_out), e.next_out += t, r.pending_out += t, e.total_out += t, e.avail_out -= t, r.pending -= t, r.pending === 0 && (r.pending_out = 0));
}, or = (e, r) => {
	Z2(e, e.block_start >= 0 ? e.block_start : -1, e.strstart - e.block_start, r), e.block_start = e.strstart, sr(e.strm);
}, st = (e, r) => {
	e.pending_buf[e.pending++] = r;
}, ba = (e, r) => {
	e.pending_buf[e.pending++] = r >>> 8 & 255, e.pending_buf[e.pending++] = r & 255;
}, Fu = (e, r, t, n) => {
	let i = e.avail_in;
	return i > n && (i = n), i === 0 ? 0 : (e.avail_in -= i, r.set(e.input.subarray(e.next_in, e.next_in + i), t), e.state.wrap === 1 ? e.adler = Ra(e.adler, r, i, t) : e.state.wrap === 2 && (e.adler = Ft(e.adler, r, i, t)), e.next_in += i, e.total_in += i, i);
}, gd = (e, r) => {
	let t = e.max_chain_length, n = e.strstart, i, a, s = e.prev_length, u = e.nice_match, c = e.strstart > e.w_size - Or ? e.strstart - (e.w_size - Or) : 0, o = e.window, l = e.w_mask, d = e.prev, p = e.strstart + fn, h = o[n + s - 1], A = o[n + s];
	e.prev_length >= e.good_match && (t >>= 2), u > e.lookahead && (u = e.lookahead);
	do
		if (i = r, !(o[i + s] !== A || o[i + s - 1] !== h || o[i] !== o[n] || o[++i] !== o[n + 1])) {
			n += 2, i++;
			do			;
while (o[++n] === o[++i] && o[++n] === o[++i] && o[++n] === o[++i] && o[++n] === o[++i] && o[++n] === o[++i] && o[++n] === o[++i] && o[++n] === o[++i] && o[++n] === o[++i] && n < p);
			if (a = fn - (p - n), n = p - fn, a > s) {
				if (e.match_start = r, s = a, a >= u) break;
				h = o[n + s - 1], A = o[n + s];
			}
		}
	while ((r = d[r & l]) > c && --t !== 0);
	return s <= e.lookahead ? s : e.lookahead;
}, Ei = (e) => {
	let r = e.w_size, t, n, i;
	do {
		if (n = e.window_size - e.lookahead - e.strstart, e.strstart >= r + (r - Or) && (e.window.set(e.window.subarray(r, r + r - n), 0), e.match_start -= r, e.strstart -= r, e.block_start -= r, e.insert > e.strstart && (e.insert = e.strstart), h_(e), n += r), e.strm.avail_in === 0) break;
		if (t = Fu(e.strm, e.window, e.strstart + e.lookahead, n), e.lookahead += t, e.lookahead + e.insert >= Xe) for (i = e.strstart - e.insert, e.ins_h = e.window[i], e.ins_h = An(e, e.ins_h, e.window[i + 1]); e.insert && (e.ins_h = An(e, e.ins_h, e.window[i + Xe - 1]), e.prev[i & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = i, i++, e.insert--, !(e.lookahead + e.insert < Xe)););
	} while (e.lookahead < Or && e.strm.avail_in !== 0);
}, md = (e, r) => {
	let t = e.pending_buf_size - 5 > e.w_size ? e.w_size : e.pending_buf_size - 5, n, i, a, s = 0, u = e.strm.avail_in;
	do {
		if (n = 65535, a = e.bi_valid + 42 >> 3, e.strm.avail_out < a || (a = e.strm.avail_out - a, i = e.strstart - e.block_start, n > i + e.strm.avail_in && (n = i + e.strm.avail_in), n > a && (n = a), n < t && (n === 0 && r !== dr || r === pn || n !== i + e.strm.avail_in))) break;
		s = r === dr && n === i + e.strm.avail_in ? 1 : 0, ku(e, 0, 0, s), e.pending_buf[e.pending - 4] = n, e.pending_buf[e.pending - 3] = n >> 8, e.pending_buf[e.pending - 2] = ~n, e.pending_buf[e.pending - 1] = ~n >> 8, sr(e.strm), i && (i > n && (i = n), e.strm.output.set(e.window.subarray(e.block_start, e.block_start + i), e.strm.next_out), e.strm.next_out += i, e.strm.avail_out -= i, e.strm.total_out += i, e.block_start += i, n -= i), n && (Fu(e.strm, e.strm.output, e.strm.next_out, n), e.strm.next_out += n, e.strm.avail_out -= n, e.strm.total_out += n);
	} while (s === 0);
	return u -= e.strm.avail_in, u && (u >= e.w_size ? (e.matches = 2, e.window.set(e.strm.input.subarray(e.strm.next_in - e.w_size, e.strm.next_in), 0), e.strstart = e.w_size, e.insert = e.strstart) : (e.window_size - e.strstart <= u && (e.strstart -= e.w_size, e.window.set(e.window.subarray(e.w_size, e.w_size + e.strstart), 0), e.matches < 2 && e.matches++, e.insert > e.strstart && (e.insert = e.strstart)), e.window.set(e.strm.input.subarray(e.strm.next_in - u, e.strm.next_in), e.strstart), e.strstart += u, e.insert += u > e.w_size - e.insert ? e.w_size - e.insert : u), e.block_start = e.strstart), e.high_water < e.strstart && (e.high_water = e.strstart), s ? ki : r !== pn && r !== dr && e.strm.avail_in === 0 && e.strstart === e.block_start ? Ii : (a = e.window_size - e.strstart, e.strm.avail_in > a && e.block_start >= e.w_size && (e.block_start -= e.w_size, e.strstart -= e.w_size, e.window.set(e.window.subarray(e.w_size, e.w_size + e.strstart), 0), e.matches < 2 && e.matches++, a += e.w_size, e.insert > e.strstart && (e.insert = e.strstart)), a > e.strm.avail_in && (a = e.strm.avail_in), a && (Fu(e.strm, e.window, e.strstart, a), e.strstart += a, e.insert += a > e.w_size - e.insert ? e.w_size - e.insert : a), e.high_water < e.strstart && (e.high_water = e.strstart), a = e.bi_valid + 42 >> 3, a = e.pending_buf_size - a > 65535 ? 65535 : e.pending_buf_size - a, t = a > e.w_size ? e.w_size : a, i = e.strstart - e.block_start, (i >= t || (i || r === dr) && r !== pn && e.strm.avail_in === 0 && i <= a) && (n = i > a ? a : i, s = r === dr && e.strm.avail_in === 0 && n === i ? 1 : 0, ku(e, e.block_start, n, s), e.block_start += n, sr(e.strm)), s ? Mn : jt);
}, pu = (e, r) => {
	let t, n;
	for (;;) {
		if (e.lookahead < Or) {
			if (Ei(e), e.lookahead < Or && r === pn) return jt;
			if (e.lookahead === 0) break;
		}
		if (t = 0, e.lookahead >= Xe && (e.ins_h = An(e, e.ins_h, e.window[e.strstart + Xe - 1]), t = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), t !== 0 && e.strstart - t <= e.w_size - Or && (e.match_length = gd(e, t)), e.match_length >= Xe) if (n = dn(e, e.strstart - e.match_start, e.match_length - Xe), e.lookahead -= e.match_length, e.match_length <= e.max_lazy_match && e.lookahead >= Xe) {
			e.match_length--;
			do
				e.strstart++, e.ins_h = An(e, e.ins_h, e.window[e.strstart + Xe - 1]), t = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart;
			while (--e.match_length !== 0);
			e.strstart++;
		} else e.strstart += e.match_length, e.match_length = 0, e.ins_h = e.window[e.strstart], e.ins_h = An(e, e.ins_h, e.window[e.strstart + 1]);
		else n = dn(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++;
		if (n && (or(e, !1), e.strm.avail_out === 0)) return jt;
	}
	return e.insert = e.strstart < Xe - 1 ? e.strstart : Xe - 1, r === dr ? (or(e, !0), e.strm.avail_out === 0 ? Mn : ki) : e.sym_next && (or(e, !1), e.strm.avail_out === 0) ? jt : Ii;
}, wi = (e, r) => {
	let t, n, i;
	for (;;) {
		if (e.lookahead < Or) {
			if (Ei(e), e.lookahead < Or && r === pn) return jt;
			if (e.lookahead === 0) break;
		}
		if (t = 0, e.lookahead >= Xe && (e.ins_h = An(e, e.ins_h, e.window[e.strstart + Xe - 1]), t = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), e.prev_length = e.match_length, e.prev_match = e.match_start, e.match_length = Xe - 1, t !== 0 && e.prev_length < e.max_lazy_match && e.strstart - t <= e.w_size - Or && (e.match_length = gd(e, t), e.match_length <= 5 && (e.strategy === j2 || e.match_length === Xe && e.strstart - e.match_start > 4096) && (e.match_length = Xe - 1)), e.prev_length >= Xe && e.match_length <= e.prev_length) {
			i = e.strstart + e.lookahead - Xe, n = dn(e, e.strstart - 1 - e.prev_match, e.prev_length - Xe), e.lookahead -= e.prev_length - 1, e.prev_length -= 2;
			do
				++e.strstart <= i && (e.ins_h = An(e, e.ins_h, e.window[e.strstart + Xe - 1]), t = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart);
			while (--e.prev_length !== 0);
			if (e.match_available = 0, e.match_length = Xe - 1, e.strstart++, n && (or(e, !1), e.strm.avail_out === 0)) return jt;
		} else if (e.match_available) {
			if (n = dn(e, 0, e.window[e.strstart - 1]), n && or(e, !1), e.strstart++, e.lookahead--, e.strm.avail_out === 0) return jt;
		} else e.match_available = 1, e.strstart++, e.lookahead--;
	}
	return e.match_available && (n = dn(e, 0, e.window[e.strstart - 1]), e.match_available = 0), e.insert = e.strstart < Xe - 1 ? e.strstart : Xe - 1, r === dr ? (or(e, !0), e.strm.avail_out === 0 ? Mn : ki) : e.sym_next && (or(e, !1), e.strm.avail_out === 0) ? jt : Ii;
}, f_ = (e, r) => {
	let t, n, i, a, s = e.window;
	for (;;) {
		if (e.lookahead <= fn) {
			if (Ei(e), e.lookahead <= fn && r === pn) return jt;
			if (e.lookahead === 0) break;
		}
		if (e.match_length = 0, e.lookahead >= Xe && e.strstart > 0 && (i = e.strstart - 1, n = s[i], n === s[++i] && n === s[++i] && n === s[++i])) {
			a = e.strstart + fn;
			do			;
while (n === s[++i] && n === s[++i] && n === s[++i] && n === s[++i] && n === s[++i] && n === s[++i] && n === s[++i] && n === s[++i] && i < a);
			e.match_length = fn - (a - i), e.match_length > e.lookahead && (e.match_length = e.lookahead);
		}
		if (e.match_length >= Xe ? (t = dn(e, 1, e.match_length - Xe), e.lookahead -= e.match_length, e.strstart += e.match_length, e.match_length = 0) : (t = dn(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++), t && (or(e, !1), e.strm.avail_out === 0)) return jt;
	}
	return e.insert = 0, r === dr ? (or(e, !0), e.strm.avail_out === 0 ? Mn : ki) : e.sym_next && (or(e, !1), e.strm.avail_out === 0) ? jt : Ii;
}, d_ = (e, r) => {
	let t;
	for (;;) {
		if (e.lookahead === 0 && (Ei(e), e.lookahead === 0)) {
			if (r === pn) return jt;
			break;
		}
		if (e.match_length = 0, t = dn(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++, t && (or(e, !1), e.strm.avail_out === 0)) return jt;
	}
	return e.insert = 0, r === dr ? (or(e, !0), e.strm.avail_out === 0 ? Mn : ki) : e.sym_next && (or(e, !1), e.strm.avail_out === 0) ? jt : Ii;
};
function Br(e, r, t, n, i) {
	this.good_length = e, this.max_lazy = r, this.nice_length = t, this.max_chain = n, this.func = i;
}
var Ca = [
	new Br(0, 0, 0, 0, md),
	new Br(4, 4, 8, 4, pu),
	new Br(4, 5, 16, 8, pu),
	new Br(4, 6, 32, 32, pu),
	new Br(4, 4, 16, 16, wi),
	new Br(8, 16, 32, 32, wi),
	new Br(8, 16, 128, 128, wi),
	new Br(8, 32, 128, 256, wi),
	new Br(32, 128, 258, 1024, wi),
	new Br(32, 258, 258, 4096, wi)
];
var p_ = (e) => {
	e.window_size = 2 * e.w_size, cn(e.head), e.max_lazy_match = Ca[e.level].max_lazy, e.good_match = Ca[e.level].good_length, e.nice_match = Ca[e.level].nice_length, e.max_chain_length = Ca[e.level].max_chain, e.strstart = 0, e.block_start = 0, e.lookahead = 0, e.insert = 0, e.match_length = e.prev_length = Xe - 1, e.match_available = 0, e.ins_h = 0;
};
function A_() {
	this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Gs, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(s_ * 2), this.dyn_dtree = new Uint16Array((2 * i_ + 1) * 2), this.bl_tree = new Uint16Array((2 * a_ + 1) * 2), cn(this.dyn_ltree), cn(this.dyn_dtree), cn(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(o_ + 1), this.heap = new Uint16Array(2 * Du + 1), cn(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(2 * Du + 1), cn(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
var za = (e) => {
	if (!e) return 1;
	let r = e.state;
	return !r || r.strm !== e || r.status !== yi && r.status !== Gu && r.status !== Su && r.status !== Tu && r.status !== Bu && r.status !== Nu && r.status !== Rn && r.status !== xa ? 1 : 0;
};
var _d = (e) => {
	if (za(e)) return On(e, Rr);
	e.total_in = e.total_out = 0, e.data_type = V2;
	let r = e.state;
	return r.pending = 0, r.pending_out = 0, r.wrap < 0 && (r.wrap = -r.wrap), r.status = r.wrap === 2 ? Gu : r.wrap ? yi : Rn, e.adler = r.wrap === 2 ? 0 : 1, r.last_flush = -2, H2(r), Mt;
};
var wd = (e) => {
	let r = _d(e);
	return r === Mt && p_(e.state), r;
};
var g_ = (e, r) => za(e) || e.state.wrap !== 2 ? Rr : (e.state.gzhead = r, Mt);
var vd = (e, r, t, n, i, a) => {
	if (!e) return Rr;
	let s = 1;
	if (r === K2 && (r = 6), n < 0 ? (s = 0, n = -n) : n > 15 && (s = 2, n -= 16), i < 1 || i > X2 || t !== Gs || n < 8 || n > 15 || r < 0 || r > 9 || a < 0 || a > $2 || n === 8 && s !== 1) return On(e, Rr);
	n === 8 && (n = 9);
	let u = new A_();
	return e.state = u, u.strm = e, u.status = yi, u.wrap = s, u.gzhead = null, u.w_bits = n, u.w_size = 1 << u.w_bits, u.w_mask = u.w_size - 1, u.hash_bits = i + 7, u.hash_size = 1 << u.hash_bits, u.hash_mask = u.hash_size - 1, u.hash_shift = ~~((u.hash_bits + Xe - 1) / Xe), u.window = new Uint8Array(u.w_size * 2), u.head = new Uint16Array(u.hash_size), u.prev = new Uint16Array(u.w_size), u.lit_bufsize = 1 << i + 6, u.pending_buf_size = u.lit_bufsize * 4, u.pending_buf = new Uint8Array(u.pending_buf_size), u.sym_buf = u.lit_bufsize, u.sym_end = (u.lit_bufsize - 1) * 3, u.level = r, u.strategy = a, u.method = t, wd(e);
};
var m_ = (e, r) => vd(e, r, Gs, e_, t_, J2);
var __ = (e, r) => {
	if (za(e) || r > Vc || r < 0) return e ? On(e, Rr) : Rr;
	let t = e.state;
	if (!e.output || e.avail_in !== 0 && !e.input || t.status === xa && r !== dr) return On(e, e.avail_out === 0 ? du : Rr);
	let n = t.last_flush;
	if (t.last_flush = r, t.pending !== 0) {
		if (sr(e), e.avail_out === 0) return t.last_flush = -1, Mt;
	} else if (e.avail_in === 0 && ef(r) <= ef(n) && r !== dr) return On(e, du);
	if (t.status === xa && e.avail_in !== 0) return On(e, du);
	if (t.status === yi && t.wrap === 0 && (t.status = Rn), t.status === yi) {
		let i = Gs + (t.w_bits - 8 << 4) << 8, a = -1;
		if (t.strategy >= Cs || t.level < 2 ? a = 0 : t.level < 6 ? a = 1 : t.level === 6 ? a = 2 : a = 3, i |= a << 6, t.strstart !== 0 && (i |= u_), i += 31 - i % 31, ba(t, i), t.strstart !== 0 && (ba(t, e.adler >>> 16), ba(t, e.adler & 65535)), e.adler = 1, t.status = Rn, sr(e), t.pending !== 0) return t.last_flush = -1, Mt;
	}
	if (t.status === Gu) {
		if (e.adler = 0, st(t, 31), st(t, 139), st(t, 8), t.gzhead) st(t, (t.gzhead.text ? 1 : 0) + (t.gzhead.hcrc ? 2 : 0) + (t.gzhead.extra ? 4 : 0) + (t.gzhead.name ? 8 : 0) + (t.gzhead.comment ? 16 : 0)), st(t, t.gzhead.time & 255), st(t, t.gzhead.time >> 8 & 255), st(t, t.gzhead.time >> 16 & 255), st(t, t.gzhead.time >> 24 & 255), st(t, t.level === 9 ? 2 : t.strategy >= Cs || t.level < 2 ? 4 : 0), st(t, t.gzhead.os & 255), t.gzhead.extra && t.gzhead.extra.length && (st(t, t.gzhead.extra.length & 255), st(t, t.gzhead.extra.length >> 8 & 255)), t.gzhead.hcrc && (e.adler = Ft(e.adler, t.pending_buf, t.pending, 0)), t.gzindex = 0, t.status = Su;
		else if (st(t, 0), st(t, 0), st(t, 0), st(t, 0), st(t, 0), st(t, t.level === 9 ? 2 : t.strategy >= Cs || t.level < 2 ? 4 : 0), st(t, l_), t.status = Rn, sr(e), t.pending !== 0) return t.last_flush = -1, Mt;
	}
	if (t.status === Su) {
		if (t.gzhead.extra) {
			let i = t.pending, a = (t.gzhead.extra.length & 65535) - t.gzindex;
			for (; t.pending + a > t.pending_buf_size;) {
				let u = t.pending_buf_size - t.pending;
				if (t.pending_buf.set(t.gzhead.extra.subarray(t.gzindex, t.gzindex + u), t.pending), t.pending = t.pending_buf_size, t.gzhead.hcrc && t.pending > i && (e.adler = Ft(e.adler, t.pending_buf, t.pending - i, i)), t.gzindex += u, sr(e), t.pending !== 0) return t.last_flush = -1, Mt;
				i = 0, a -= u;
			}
			let s = new Uint8Array(t.gzhead.extra);
			t.pending_buf.set(s.subarray(t.gzindex, t.gzindex + a), t.pending), t.pending += a, t.gzhead.hcrc && t.pending > i && (e.adler = Ft(e.adler, t.pending_buf, t.pending - i, i)), t.gzindex = 0;
		}
		t.status = Tu;
	}
	if (t.status === Tu) {
		if (t.gzhead.name) {
			let i = t.pending, a;
			do {
				if (t.pending === t.pending_buf_size) {
					if (t.gzhead.hcrc && t.pending > i && (e.adler = Ft(e.adler, t.pending_buf, t.pending - i, i)), sr(e), t.pending !== 0) return t.last_flush = -1, Mt;
					i = 0;
				}
				t.gzindex < t.gzhead.name.length ? a = t.gzhead.name.charCodeAt(t.gzindex++) & 255 : a = 0, st(t, a);
			} while (a !== 0);
			t.gzhead.hcrc && t.pending > i && (e.adler = Ft(e.adler, t.pending_buf, t.pending - i, i)), t.gzindex = 0;
		}
		t.status = Bu;
	}
	if (t.status === Bu) {
		if (t.gzhead.comment) {
			let i = t.pending, a;
			do {
				if (t.pending === t.pending_buf_size) {
					if (t.gzhead.hcrc && t.pending > i && (e.adler = Ft(e.adler, t.pending_buf, t.pending - i, i)), sr(e), t.pending !== 0) return t.last_flush = -1, Mt;
					i = 0;
				}
				t.gzindex < t.gzhead.comment.length ? a = t.gzhead.comment.charCodeAt(t.gzindex++) & 255 : a = 0, st(t, a);
			} while (a !== 0);
			t.gzhead.hcrc && t.pending > i && (e.adler = Ft(e.adler, t.pending_buf, t.pending - i, i));
		}
		t.status = Nu;
	}
	if (t.status === Nu) {
		if (t.gzhead.hcrc) {
			if (t.pending + 2 > t.pending_buf_size && (sr(e), t.pending !== 0)) return t.last_flush = -1, Mt;
			st(t, e.adler & 255), st(t, e.adler >> 8 & 255), e.adler = 0;
		}
		if (t.status = Rn, sr(e), t.pending !== 0) return t.last_flush = -1, Mt;
	}
	if (e.avail_in !== 0 || t.lookahead !== 0 || r !== pn && t.status !== xa) {
		let i = t.level === 0 ? md(t, r) : t.strategy === Cs ? d_(t, r) : t.strategy === q2 ? f_(t, r) : Ca[t.level].func(t, r);
		if ((i === Mn || i === ki) && (t.status = xa), i === jt || i === Mn) return e.avail_out === 0 && (t.last_flush = -1), Mt;
		if (i === Ii && (r === G2 ? W2(t) : r !== Vc && (ku(t, 0, 0, !1), r === Q2 && (cn(t.head), t.lookahead === 0 && (t.strstart = 0, t.block_start = 0, t.insert = 0))), sr(e), e.avail_out === 0)) return t.last_flush = -1, Mt;
	}
	return r !== dr ? Mt : t.wrap <= 0 ? Xc : (t.wrap === 2 ? (st(t, e.adler & 255), st(t, e.adler >> 8 & 255), st(t, e.adler >> 16 & 255), st(t, e.adler >> 24 & 255), st(t, e.total_in & 255), st(t, e.total_in >> 8 & 255), st(t, e.total_in >> 16 & 255), st(t, e.total_in >> 24 & 255)) : (ba(t, e.adler >>> 16), ba(t, e.adler & 65535)), sr(e), t.wrap > 0 && (t.wrap = -t.wrap), t.pending !== 0 ? Mt : Xc);
};
var w_ = (e) => {
	if (za(e)) return Rr;
	let r = e.state.status;
	return e.state = null, r === Rn ? On(e, Y2) : Mt;
};
var v_ = (e, r) => {
	let t = r.length;
	if (za(e)) return Rr;
	let n = e.state, i = n.wrap;
	if (i === 2 || i === 1 && n.status !== yi || n.lookahead) return Rr;
	if (i === 1 && (e.adler = Ra(e.adler, r, t, 0)), n.wrap = 0, t >= n.w_size) {
		i === 0 && (cn(n.head), n.strstart = 0, n.block_start = 0, n.insert = 0);
		let c = new Uint8Array(n.w_size);
		c.set(r.subarray(t - n.w_size, t), 0), r = c, t = n.w_size;
	}
	let a = e.avail_in, s = e.next_in, u = e.input;
	for (e.avail_in = t, e.next_in = 0, e.input = r, Ei(n); n.lookahead >= Xe;) {
		let c = n.strstart, o = n.lookahead - (Xe - 1);
		do
			n.ins_h = An(n, n.ins_h, n.window[c + Xe - 1]), n.prev[c & n.w_mask] = n.head[n.ins_h], n.head[n.ins_h] = c, c++;
		while (--o);
		n.strstart = c, n.lookahead = Xe - 1, Ei(n);
	}
	return n.strstart += n.lookahead, n.block_start = n.strstart, n.insert = n.lookahead, n.lookahead = 0, n.match_length = n.prev_length = Xe - 1, n.match_available = 0, e.next_in = s, e.input = u, e.avail_in = a, n.wrap = i, Mt;
};
var Da = {
	deflateInit: m_,
	deflateInit2: vd,
	deflateReset: wd,
	deflateResetKeep: _d,
	deflateSetHeader: g_,
	deflate: __,
	deflateEnd: w_,
	deflateSetDictionary: v_,
	deflateInfo: "pako deflate (from Nodeca project)"
};
var T_ = (e, r) => Object.prototype.hasOwnProperty.call(e, r);
var B_ = function(e) {
	let r = Array.prototype.slice.call(arguments, 1);
	for (; r.length;) {
		let t = r.shift();
		if (t) {
			if (typeof t != "object") throw new TypeError(t + "must be non-object");
			for (let n in t) T_(t, n) && (e[n] = t[n]);
		}
	}
	return e;
};
var N_ = (e) => {
	let r = 0;
	for (let n = 0, i = e.length; n < i; n++) r += e[n].length;
	let t = new Uint8Array(r);
	for (let n = 0, i = 0, a = e.length; n < a; n++) {
		let s = e[n];
		t.set(s, i), i += s.length;
	}
	return t;
};
var Qs = {
	assign: B_,
	flattenChunks: N_
};
var bd = !0;
try {
	String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1));
} catch (e) {
	bd = !1;
}
var Oa = /* @__PURE__ */ new Uint8Array(256);
for (let e = 0; e < 256; e++) Oa[e] = e >= 252 ? 6 : e >= 248 ? 5 : e >= 240 ? 4 : e >= 224 ? 3 : e >= 192 ? 2 : 1;
Oa[254] = Oa[254] = 1;
var F_ = (e) => {
	if (typeof TextEncoder == "function" && TextEncoder.prototype.encode) return new TextEncoder().encode(e);
	let r, t, n, i, a, s = e.length, u = 0;
	for (i = 0; i < s; i++) t = e.charCodeAt(i), (t & 64512) === 55296 && i + 1 < s && (n = e.charCodeAt(i + 1), (n & 64512) === 56320 && (t = 65536 + (t - 55296 << 10) + (n - 56320), i++)), u += t < 128 ? 1 : t < 2048 ? 2 : t < 65536 ? 3 : 4;
	for (r = new Uint8Array(u), a = 0, i = 0; a < u; i++) t = e.charCodeAt(i), (t & 64512) === 55296 && i + 1 < s && (n = e.charCodeAt(i + 1), (n & 64512) === 56320 && (t = 65536 + (t - 55296 << 10) + (n - 56320), i++)), t < 128 ? r[a++] = t : t < 2048 ? (r[a++] = 192 | t >>> 6, r[a++] = 128 | t & 63) : t < 65536 ? (r[a++] = 224 | t >>> 12, r[a++] = 128 | t >>> 6 & 63, r[a++] = 128 | t & 63) : (r[a++] = 240 | t >>> 18, r[a++] = 128 | t >>> 12 & 63, r[a++] = 128 | t >>> 6 & 63, r[a++] = 128 | t & 63);
	return r;
};
var R_ = (e, r) => {
	if (r < 65534 && e.subarray && bd) return String.fromCharCode.apply(null, e.length === r ? e : e.subarray(0, r));
	let t = "";
	for (let n = 0; n < r; n++) t += String.fromCharCode(e[n]);
	return t;
};
var O_ = (e, r) => {
	let t = r || e.length;
	if (typeof TextDecoder == "function" && TextDecoder.prototype.decode) return new TextDecoder().decode(e.subarray(0, r));
	let n, i, a = new Array(t * 2);
	for (i = 0, n = 0; n < t;) {
		let s = e[n++];
		if (s < 128) {
			a[i++] = s;
			continue;
		}
		let u = Oa[s];
		if (u > 4) {
			a[i++] = 65533, n += u - 1;
			continue;
		}
		for (s &= u === 2 ? 31 : u === 3 ? 15 : 7; u > 1 && n < t;) s = s << 6 | e[n++] & 63, u--;
		if (u > 1) {
			a[i++] = 65533;
			continue;
		}
		s < 65536 ? a[i++] = s : (s -= 65536, a[i++] = 55296 | s >> 10 & 1023, a[i++] = 56320 | s & 1023);
	}
	return R_(a, i);
};
var L_ = (e, r) => {
	r = r || e.length, r > e.length && (r = e.length);
	let t = r - 1;
	for (; t >= 0 && (e[t] & 192) === 128;) t--;
	return t < 0 || t === 0 ? r : t + Oa[e[t]] > r ? t : r;
};
var La = {
	string2buf: F_,
	buf2string: O_,
	utf8border: L_
};
function P_() {
	this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var yd = P_, Ed = Object.prototype.toString, { Z_NO_FLUSH: M_, Z_SYNC_FLUSH: U_, Z_FULL_FLUSH: z_, Z_FINISH: H_, Z_OK: Ps, Z_STREAM_END: Z_, Z_DEFAULT_COMPRESSION: W_, Z_DEFAULT_STRATEGY: G_, Z_DEFLATED: Q_ } = Ci;
function Ha(e) {
	this.options = Qs.assign({
		level: W_,
		method: Q_,
		chunkSize: 16384,
		windowBits: 15,
		memLevel: 8,
		strategy: G_
	}, e || {});
	let r = this.options;
	r.raw && r.windowBits > 0 ? r.windowBits = -r.windowBits : r.gzip && r.windowBits > 0 && r.windowBits < 16 && (r.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new yd(), this.strm.avail_out = 0;
	let t = Da.deflateInit2(this.strm, r.level, r.method, r.windowBits, r.memLevel, r.strategy);
	if (t !== Ps) throw new Error(Pn[t]);
	if (r.header && Da.deflateSetHeader(this.strm, r.header), r.dictionary) {
		let n;
		if (typeof r.dictionary == "string" ? n = La.string2buf(r.dictionary) : Ed.call(r.dictionary) === "[object ArrayBuffer]" ? n = new Uint8Array(r.dictionary) : n = r.dictionary, t = Da.deflateSetDictionary(this.strm, n), t !== Ps) throw new Error(Pn[t]);
		this._dict_set = !0;
	}
}
Ha.prototype.push = function(e, r) {
	let t = this.strm, n = this.options.chunkSize, i, a;
	if (this.ended) return !1;
	for (r === ~~r ? a = r : a = r === !0 ? H_ : M_, typeof e == "string" ? t.input = La.string2buf(e) : Ed.call(e) === "[object ArrayBuffer]" ? t.input = new Uint8Array(e) : t.input = e, t.next_in = 0, t.avail_in = t.input.length;;) {
		if (t.avail_out === 0 && (t.output = new Uint8Array(n), t.next_out = 0, t.avail_out = n), (a === U_ || a === z_) && t.avail_out <= 6) {
			this.onData(t.output.subarray(0, t.next_out)), t.avail_out = 0;
			continue;
		}
		if (i = Da.deflate(t, a), i === Z_) return t.next_out > 0 && this.onData(t.output.subarray(0, t.next_out)), i = Da.deflateEnd(this.strm), this.onEnd(i), this.ended = !0, i === Ps;
		if (t.avail_out === 0) {
			this.onData(t.output);
			continue;
		}
		if (a > 0 && t.next_out > 0) {
			this.onData(t.output.subarray(0, t.next_out)), t.avail_out = 0;
			continue;
		}
		if (t.avail_in === 0) break;
	}
	return !0;
};
Ha.prototype.onData = function(e) {
	this.chunks.push(e);
};
Ha.prototype.onEnd = function(e) {
	e === Ps && (this.result = Qs.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
};
function Qu(e, r) {
	let t = new Ha(r);
	if (t.push(e, !0), t.err) throw t.msg || Pn[t.err];
	return t.result;
}
function Y_(e, r) {
	return r = r || {}, r.raw = !0, Qu(e, r);
}
function K_(e, r) {
	return r = r || {}, r.gzip = !0, Qu(e, r);
}
var X_ = {
	Deflate: Ha,
	deflate: Qu,
	deflateRaw: Y_,
	gzip: K_,
	constants: Ci
}, Is = 16209, ew = 16191, tw = function(r, t) {
	let n, i, a, s, u, c, o, l, d, p, h, A, f, g, _, v, b, C, T, ee, x, G, O, k, H = r.state;
	n = r.next_in, O = r.input, i = n + (r.avail_in - 5), a = r.next_out, k = r.output, s = a - (t - r.avail_out), u = a + (r.avail_out - 257), c = H.dmax, o = H.wsize, l = H.whave, d = H.wnext, p = H.window, h = H.hold, A = H.bits, f = H.lencode, g = H.distcode, _ = (1 << H.lenbits) - 1, v = (1 << H.distbits) - 1;
	e: do {
		A < 15 && (h += O[n++] << A, A += 8, h += O[n++] << A, A += 8), b = f[h & _];
		t: for (;;) {
			if (C = b >>> 24, h >>>= C, A -= C, C = b >>> 16 & 255, C === 0) k[a++] = b & 65535;
			else if (C & 16) {
				T = b & 65535, C &= 15, C && (A < C && (h += O[n++] << A, A += 8), T += h & (1 << C) - 1, h >>>= C, A -= C), A < 15 && (h += O[n++] << A, A += 8, h += O[n++] << A, A += 8), b = g[h & v];
				r: for (;;) {
					if (C = b >>> 24, h >>>= C, A -= C, C = b >>> 16 & 255, C & 16) {
						if (ee = b & 65535, C &= 15, A < C && (h += O[n++] << A, A += 8, A < C && (h += O[n++] << A, A += 8)), ee += h & (1 << C) - 1, ee > c) {
							r.msg = "invalid distance too far back", H.mode = Is;
							break e;
						}
						if (h >>>= C, A -= C, C = a - s, ee > C) {
							if (C = ee - C, C > l && H.sane) {
								r.msg = "invalid distance too far back", H.mode = Is;
								break e;
							}
							if (x = 0, G = p, d === 0) {
								if (x += o - C, C < T) {
									T -= C;
									do
										k[a++] = p[x++];
									while (--C);
									x = a - ee, G = k;
								}
							} else if (d < C) {
								if (x += o + d - C, C -= d, C < T) {
									T -= C;
									do
										k[a++] = p[x++];
									while (--C);
									if (x = 0, d < T) {
										C = d, T -= C;
										do
											k[a++] = p[x++];
										while (--C);
										x = a - ee, G = k;
									}
								}
							} else if (x += d - C, C < T) {
								T -= C;
								do
									k[a++] = p[x++];
								while (--C);
								x = a - ee, G = k;
							}
							for (; T > 2;) k[a++] = G[x++], k[a++] = G[x++], k[a++] = G[x++], T -= 3;
							T && (k[a++] = G[x++], T > 1 && (k[a++] = G[x++]));
						} else {
							x = a - ee;
							do
								k[a++] = k[x++], k[a++] = k[x++], k[a++] = k[x++], T -= 3;
							while (T > 2);
							T && (k[a++] = k[x++], T > 1 && (k[a++] = k[x++]));
						}
					} else if ((C & 64) === 0) {
						b = g[(b & 65535) + (h & (1 << C) - 1)];
						continue r;
					} else {
						r.msg = "invalid distance code", H.mode = Is;
						break e;
					}
					break;
				}
			} else if ((C & 64) === 0) {
				b = f[(b & 65535) + (h & (1 << C) - 1)];
				continue t;
			} else if (C & 32) {
				H.mode = ew;
				break e;
			} else {
				r.msg = "invalid literal/length code", H.mode = Is;
				break e;
			}
			break;
		}
	} while (n < i && a < u);
	T = A >> 3, n -= T, A -= T << 3, h &= (1 << A) - 1, r.next_in = n, r.next_out = a, r.avail_in = n < i ? 5 + (i - n) : 5 - (n - i), r.avail_out = a < u ? 257 + (u - a) : 257 - (a - u), H.hold = h, H.bits = A;
}, vi = 15, tf = 852, rf = 592, nf = 0, Au = 1, af = 2, rw = new Uint16Array([
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
]), nw = new Uint8Array([
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
]), iw = new Uint16Array([
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
]), aw = new Uint8Array([
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
]), sw = (e, r, t, n, i, a, s, u) => {
	let c = u.bits, o = 0, l = 0, d = 0, p = 0, h = 0, A = 0, f = 0, g = 0, _ = 0, v = 0, b, C, T, ee, x, G = null, O, k = new Uint16Array(vi + 1), H = new Uint16Array(vi + 1), m = null, V, y, ie;
	for (o = 0; o <= vi; o++) k[o] = 0;
	for (l = 0; l < n; l++) k[r[t + l]]++;
	for (h = c, p = vi; p >= 1 && k[p] === 0; p--);
	if (h > p && (h = p), p === 0) return i[a++] = 20971520, i[a++] = 20971520, u.bits = 1, 0;
	for (d = 1; d < p && k[d] === 0; d++);
	for (h < d && (h = d), g = 1, o = 1; o <= vi; o++) if (g <<= 1, g -= k[o], g < 0) return -1;
	if (g > 0 && (e === nf || p !== 1)) return -1;
	for (H[1] = 0, o = 1; o < vi; o++) H[o + 1] = H[o] + k[o];
	for (l = 0; l < n; l++) r[t + l] !== 0 && (s[H[r[t + l]]++] = l);
	if (e === nf ? (G = m = s, O = 20) : e === Au ? (G = rw, m = nw, O = 257) : (G = iw, m = aw, O = 0), v = 0, l = 0, o = d, x = a, A = h, f = 0, T = -1, _ = 1 << h, ee = _ - 1, e === Au && _ > tf || e === af && _ > rf) return 1;
	for (;;) {
		V = o - f, s[l] + 1 < O ? (y = 0, ie = s[l]) : s[l] >= O ? (y = m[s[l] - O], ie = G[s[l] - O]) : (y = 96, ie = 0), b = 1 << o - f, C = 1 << A, d = C;
		do
			C -= b, i[x + (v >> f) + C] = V << 24 | y << 16 | ie | 0;
		while (C !== 0);
		for (b = 1 << o - 1; v & b;) b >>= 1;
		if (b !== 0 ? (v &= b - 1, v += b) : v = 0, l++, --k[o] === 0) {
			if (o === p) break;
			o = r[t + s[l]];
		}
		if (o > h && (v & ee) !== T) {
			for (f === 0 && (f = h), x += d, A = o - f, g = 1 << A; A + f < p && (g -= k[A + f], !(g <= 0));) A++, g <<= 1;
			if (_ += 1 << A, e === Au && _ > tf || e === af && _ > rf) return 1;
			T = v & ee, i[T] = h << 24 | A << 16 | x - a | 0;
		}
	}
	return v !== 0 && (i[x + v] = o - f << 24 | 4194304), u.bits = h, 0;
}, Sa = sw, ow = 0, xd = 1, Cd = 2, { Z_FINISH: sf, Z_BLOCK: uw, Z_TREES: ks, Z_OK: Un, Z_STREAM_END: lw, Z_NEED_DICT: hw, Z_STREAM_ERROR: pr, Z_DATA_ERROR: Id, Z_MEM_ERROR: kd, Z_BUF_ERROR: cw, Z_DEFLATED: of } = Ci, Ys = 16180, uf = 16181, lf = 16182, hf = 16183, cf = 16184, ff = 16185, df = 16186, pf = 16187, Af = 16188, gf = 16189, Ms = 16190, Qr = 16191, gu = 16192, mf = 16193, mu = 16194, _f = 16195, wf = 16196, vf = 16197, bf = 16198, Ds = 16199, Ss = 16200, yf = 16201, Ef = 16202, xf = 16203, Cf = 16204, If = 16205, _u = 16206, kf = 16207, Df = 16208, mt = 16209, Dd = 16210, Sd = 16211, fw = 852, dw = 592, Aw = 15, Sf = (e) => (e >>> 24 & 255) + (e >>> 8 & 65280) + ((e & 65280) << 8) + ((e & 255) << 24);
function gw() {
	this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = /* @__PURE__ */ new Uint16Array(320), this.work = /* @__PURE__ */ new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
var Hn = (e) => {
	if (!e) return 1;
	let r = e.state;
	return !r || r.strm !== e || r.mode < Ys || r.mode > Sd ? 1 : 0;
};
var Td = (e) => {
	if (Hn(e)) return pr;
	let r = e.state;
	return e.total_in = e.total_out = r.total = 0, e.msg = "", r.wrap && (e.adler = r.wrap & 1), r.mode = Ys, r.last = 0, r.havedict = 0, r.flags = -1, r.dmax = 32768, r.head = null, r.hold = 0, r.bits = 0, r.lencode = r.lendyn = new Int32Array(fw), r.distcode = r.distdyn = new Int32Array(dw), r.sane = 1, r.back = -1, Un;
};
var Bd = (e) => {
	if (Hn(e)) return pr;
	let r = e.state;
	return r.wsize = 0, r.whave = 0, r.wnext = 0, Td(e);
};
var Nd = (e, r) => {
	let t;
	if (Hn(e)) return pr;
	let n = e.state;
	return r < 0 ? (t = 0, r = -r) : (t = (r >> 4) + 5, r < 48 && (r &= 15)), r && (r < 8 || r > 15) ? pr : (n.window !== null && n.wbits !== r && (n.window = null), n.wrap = t, n.wbits = r, Bd(e));
};
var Fd = (e, r) => {
	if (!e) return pr;
	let t = new gw();
	e.state = t, t.strm = e, t.window = null, t.mode = Ys;
	let n = Nd(e, r);
	return n !== Un && (e.state = null), n;
};
var mw = (e) => Fd(e, Aw);
var Tf = !0;
var wu;
var vu;
var _w = (e) => {
	if (Tf) {
		wu = /* @__PURE__ */ new Int32Array(512), vu = /* @__PURE__ */ new Int32Array(32);
		let r = 0;
		for (; r < 144;) e.lens[r++] = 8;
		for (; r < 256;) e.lens[r++] = 9;
		for (; r < 280;) e.lens[r++] = 7;
		for (; r < 288;) e.lens[r++] = 8;
		for (Sa(xd, e.lens, 0, 288, wu, 0, e.work, { bits: 9 }), r = 0; r < 32;) e.lens[r++] = 5;
		Sa(Cd, e.lens, 0, 32, vu, 0, e.work, { bits: 5 }), Tf = !1;
	}
	e.lencode = wu, e.lenbits = 9, e.distcode = vu, e.distbits = 5;
};
var Rd = (e, r, t, n) => {
	let i, a = e.state;
	return a.window === null && (a.wsize = 1 << a.wbits, a.wnext = 0, a.whave = 0, a.window = new Uint8Array(a.wsize)), n >= a.wsize ? (a.window.set(r.subarray(t - a.wsize, t), 0), a.wnext = 0, a.whave = a.wsize) : (i = a.wsize - a.wnext, i > n && (i = n), a.window.set(r.subarray(t - n, t - n + i), a.wnext), n -= i, n ? (a.window.set(r.subarray(t - n, t), 0), a.wnext = n, a.whave = a.wsize) : (a.wnext += i, a.wnext === a.wsize && (a.wnext = 0), a.whave < a.wsize && (a.whave += i))), 0;
};
var ww = (e, r) => {
	let t, n, i, a, s, u, c, o, l, d, p, h, A, f, g = 0, _, v, b, C, T, ee, x, G, O = /* @__PURE__ */ new Uint8Array(4), k, H, m = new Uint8Array([
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
	]);
	if (Hn(e) || !e.output || !e.input && e.avail_in !== 0) return pr;
	t = e.state, t.mode === Qr && (t.mode = gu), s = e.next_out, i = e.output, c = e.avail_out, a = e.next_in, n = e.input, u = e.avail_in, o = t.hold, l = t.bits, d = u, p = c, G = Un;
	e: for (;;) switch (t.mode) {
		case Ys:
			if (t.wrap === 0) {
				t.mode = gu;
				break;
			}
			for (; l < 16;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			if (t.wrap & 2 && o === 35615) {
				t.wbits === 0 && (t.wbits = 15), t.check = 0, O[0] = o & 255, O[1] = o >>> 8 & 255, t.check = Ft(t.check, O, 2, 0), o = 0, l = 0, t.mode = uf;
				break;
			}
			if (t.head && (t.head.done = !1), !(t.wrap & 1) || (((o & 255) << 8) + (o >> 8)) % 31) {
				e.msg = "incorrect header check", t.mode = mt;
				break;
			}
			if ((o & 15) !== of) {
				e.msg = "unknown compression method", t.mode = mt;
				break;
			}
			if (o >>>= 4, l -= 4, x = (o & 15) + 8, t.wbits === 0 && (t.wbits = x), x > 15 || x > t.wbits) {
				e.msg = "invalid window size", t.mode = mt;
				break;
			}
			t.dmax = 1 << t.wbits, t.flags = 0, e.adler = t.check = 1, t.mode = o & 512 ? gf : Qr, o = 0, l = 0;
			break;
		case uf:
			for (; l < 16;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			if (t.flags = o, (t.flags & 255) !== of) {
				e.msg = "unknown compression method", t.mode = mt;
				break;
			}
			if (t.flags & 57344) {
				e.msg = "unknown header flags set", t.mode = mt;
				break;
			}
			t.head && (t.head.text = o >> 8 & 1), t.flags & 512 && t.wrap & 4 && (O[0] = o & 255, O[1] = o >>> 8 & 255, t.check = Ft(t.check, O, 2, 0)), o = 0, l = 0, t.mode = lf;
		case lf:
			for (; l < 32;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			t.head && (t.head.time = o), t.flags & 512 && t.wrap & 4 && (O[0] = o & 255, O[1] = o >>> 8 & 255, O[2] = o >>> 16 & 255, O[3] = o >>> 24 & 255, t.check = Ft(t.check, O, 4, 0)), o = 0, l = 0, t.mode = hf;
		case hf:
			for (; l < 16;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			t.head && (t.head.xflags = o & 255, t.head.os = o >> 8), t.flags & 512 && t.wrap & 4 && (O[0] = o & 255, O[1] = o >>> 8 & 255, t.check = Ft(t.check, O, 2, 0)), o = 0, l = 0, t.mode = cf;
		case cf:
			if (t.flags & 1024) {
				for (; l < 16;) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				t.length = o, t.head && (t.head.extra_len = o), t.flags & 512 && t.wrap & 4 && (O[0] = o & 255, O[1] = o >>> 8 & 255, t.check = Ft(t.check, O, 2, 0)), o = 0, l = 0;
			} else t.head && (t.head.extra = null);
			t.mode = ff;
		case ff:
			if (t.flags & 1024 && (h = t.length, h > u && (h = u), h && (t.head && (x = t.head.extra_len - t.length, t.head.extra || (t.head.extra = new Uint8Array(t.head.extra_len)), t.head.extra.set(n.subarray(a, a + h), x)), t.flags & 512 && t.wrap & 4 && (t.check = Ft(t.check, n, h, a)), u -= h, a += h, t.length -= h), t.length)) break e;
			t.length = 0, t.mode = df;
		case df:
			if (t.flags & 2048) {
				if (u === 0) break e;
				h = 0;
				do
					x = n[a + h++], t.head && x && t.length < 65536 && (t.head.name += String.fromCharCode(x));
				while (x && h < u);
				if (t.flags & 512 && t.wrap & 4 && (t.check = Ft(t.check, n, h, a)), u -= h, a += h, x) break e;
			} else t.head && (t.head.name = null);
			t.length = 0, t.mode = pf;
		case pf:
			if (t.flags & 4096) {
				if (u === 0) break e;
				h = 0;
				do
					x = n[a + h++], t.head && x && t.length < 65536 && (t.head.comment += String.fromCharCode(x));
				while (x && h < u);
				if (t.flags & 512 && t.wrap & 4 && (t.check = Ft(t.check, n, h, a)), u -= h, a += h, x) break e;
			} else t.head && (t.head.comment = null);
			t.mode = Af;
		case Af:
			if (t.flags & 512) {
				for (; l < 16;) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				if (t.wrap & 4 && o !== (t.check & 65535)) {
					e.msg = "header crc mismatch", t.mode = mt;
					break;
				}
				o = 0, l = 0;
			}
			t.head && (t.head.hcrc = t.flags >> 9 & 1, t.head.done = !0), e.adler = t.check = 0, t.mode = Qr;
			break;
		case gf:
			for (; l < 32;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			e.adler = t.check = Sf(o), o = 0, l = 0, t.mode = Ms;
		case Ms:
			if (t.havedict === 0) return e.next_out = s, e.avail_out = c, e.next_in = a, e.avail_in = u, t.hold = o, t.bits = l, hw;
			e.adler = t.check = 1, t.mode = Qr;
		case Qr: if (r === uw || r === ks) break e;
		case gu:
			if (t.last) {
				o >>>= l & 7, l -= l & 7, t.mode = _u;
				break;
			}
			for (; l < 3;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			switch (t.last = o & 1, o >>>= 1, l -= 1, o & 3) {
				case 0:
					t.mode = mf;
					break;
				case 1:
					if (_w(t), t.mode = Ds, r === ks) {
						o >>>= 2, l -= 2;
						break e;
					}
					break;
				case 2:
					t.mode = wf;
					break;
				case 3: e.msg = "invalid block type", t.mode = mt;
			}
			o >>>= 2, l -= 2;
			break;
		case mf:
			for (o >>>= l & 7, l -= l & 7; l < 32;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			if ((o & 65535) !== (o >>> 16 ^ 65535)) {
				e.msg = "invalid stored block lengths", t.mode = mt;
				break;
			}
			if (t.length = o & 65535, o = 0, l = 0, t.mode = mu, r === ks) break e;
		case mu: t.mode = _f;
		case _f:
			if (h = t.length, h) {
				if (h > u && (h = u), h > c && (h = c), h === 0) break e;
				i.set(n.subarray(a, a + h), s), u -= h, a += h, c -= h, s += h, t.length -= h;
				break;
			}
			t.mode = Qr;
			break;
		case wf:
			for (; l < 14;) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			if (t.nlen = (o & 31) + 257, o >>>= 5, l -= 5, t.ndist = (o & 31) + 1, o >>>= 5, l -= 5, t.ncode = (o & 15) + 4, o >>>= 4, l -= 4, t.nlen > 286 || t.ndist > 30) {
				e.msg = "too many length or distance symbols", t.mode = mt;
				break;
			}
			t.have = 0, t.mode = vf;
		case vf:
			for (; t.have < t.ncode;) {
				for (; l < 3;) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				t.lens[m[t.have++]] = o & 7, o >>>= 3, l -= 3;
			}
			for (; t.have < 19;) t.lens[m[t.have++]] = 0;
			if (t.lencode = t.lendyn, t.lenbits = 7, k = { bits: t.lenbits }, G = Sa(ow, t.lens, 0, 19, t.lencode, 0, t.work, k), t.lenbits = k.bits, G) {
				e.msg = "invalid code lengths set", t.mode = mt;
				break;
			}
			t.have = 0, t.mode = bf;
		case bf:
			for (; t.have < t.nlen + t.ndist;) {
				for (; g = t.lencode[o & (1 << t.lenbits) - 1], _ = g >>> 24, v = g >>> 16 & 255, b = g & 65535, !(_ <= l);) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				if (b < 16) o >>>= _, l -= _, t.lens[t.have++] = b;
				else {
					if (b === 16) {
						for (H = _ + 2; l < H;) {
							if (u === 0) break e;
							u--, o += n[a++] << l, l += 8;
						}
						if (o >>>= _, l -= _, t.have === 0) {
							e.msg = "invalid bit length repeat", t.mode = mt;
							break;
						}
						x = t.lens[t.have - 1], h = 3 + (o & 3), o >>>= 2, l -= 2;
					} else if (b === 17) {
						for (H = _ + 3; l < H;) {
							if (u === 0) break e;
							u--, o += n[a++] << l, l += 8;
						}
						o >>>= _, l -= _, x = 0, h = 3 + (o & 7), o >>>= 3, l -= 3;
					} else {
						for (H = _ + 7; l < H;) {
							if (u === 0) break e;
							u--, o += n[a++] << l, l += 8;
						}
						o >>>= _, l -= _, x = 0, h = 11 + (o & 127), o >>>= 7, l -= 7;
					}
					if (t.have + h > t.nlen + t.ndist) {
						e.msg = "invalid bit length repeat", t.mode = mt;
						break;
					}
					for (; h--;) t.lens[t.have++] = x;
				}
			}
			if (t.mode === mt) break;
			if (t.lens[256] === 0) {
				e.msg = "invalid code -- missing end-of-block", t.mode = mt;
				break;
			}
			if (t.lenbits = 9, k = { bits: t.lenbits }, G = Sa(xd, t.lens, 0, t.nlen, t.lencode, 0, t.work, k), t.lenbits = k.bits, G) {
				e.msg = "invalid literal/lengths set", t.mode = mt;
				break;
			}
			if (t.distbits = 6, t.distcode = t.distdyn, k = { bits: t.distbits }, G = Sa(Cd, t.lens, t.nlen, t.ndist, t.distcode, 0, t.work, k), t.distbits = k.bits, G) {
				e.msg = "invalid distances set", t.mode = mt;
				break;
			}
			if (t.mode = Ds, r === ks) break e;
		case Ds: t.mode = Ss;
		case Ss:
			if (u >= 6 && c >= 258) {
				e.next_out = s, e.avail_out = c, e.next_in = a, e.avail_in = u, t.hold = o, t.bits = l, tw(e, p), s = e.next_out, i = e.output, c = e.avail_out, a = e.next_in, n = e.input, u = e.avail_in, o = t.hold, l = t.bits, t.mode === Qr && (t.back = -1);
				break;
			}
			for (t.back = 0; g = t.lencode[o & (1 << t.lenbits) - 1], _ = g >>> 24, v = g >>> 16 & 255, b = g & 65535, !(_ <= l);) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			if (v && (v & 240) === 0) {
				for (C = _, T = v, ee = b; g = t.lencode[ee + ((o & (1 << C + T) - 1) >> C)], _ = g >>> 24, v = g >>> 16 & 255, b = g & 65535, !(C + _ <= l);) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				o >>>= C, l -= C, t.back += C;
			}
			if (o >>>= _, l -= _, t.back += _, t.length = b, v === 0) {
				t.mode = If;
				break;
			}
			if (v & 32) {
				t.back = -1, t.mode = Qr;
				break;
			}
			if (v & 64) {
				e.msg = "invalid literal/length code", t.mode = mt;
				break;
			}
			t.extra = v & 15, t.mode = yf;
		case yf:
			if (t.extra) {
				for (H = t.extra; l < H;) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				t.length += o & (1 << t.extra) - 1, o >>>= t.extra, l -= t.extra, t.back += t.extra;
			}
			t.was = t.length, t.mode = Ef;
		case Ef:
			for (; g = t.distcode[o & (1 << t.distbits) - 1], _ = g >>> 24, v = g >>> 16 & 255, b = g & 65535, !(_ <= l);) {
				if (u === 0) break e;
				u--, o += n[a++] << l, l += 8;
			}
			if ((v & 240) === 0) {
				for (C = _, T = v, ee = b; g = t.distcode[ee + ((o & (1 << C + T) - 1) >> C)], _ = g >>> 24, v = g >>> 16 & 255, b = g & 65535, !(C + _ <= l);) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				o >>>= C, l -= C, t.back += C;
			}
			if (o >>>= _, l -= _, t.back += _, v & 64) {
				e.msg = "invalid distance code", t.mode = mt;
				break;
			}
			t.offset = b, t.extra = v & 15, t.mode = xf;
		case xf:
			if (t.extra) {
				for (H = t.extra; l < H;) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				t.offset += o & (1 << t.extra) - 1, o >>>= t.extra, l -= t.extra, t.back += t.extra;
			}
			if (t.offset > t.dmax) {
				e.msg = "invalid distance too far back", t.mode = mt;
				break;
			}
			t.mode = Cf;
		case Cf:
			if (c === 0) break e;
			if (h = p - c, t.offset > h) {
				if (h = t.offset - h, h > t.whave && t.sane) {
					e.msg = "invalid distance too far back", t.mode = mt;
					break;
				}
				h > t.wnext ? (h -= t.wnext, A = t.wsize - h) : A = t.wnext - h, h > t.length && (h = t.length), f = t.window;
			} else f = i, A = s - t.offset, h = t.length;
			h > c && (h = c), c -= h, t.length -= h;
			do
				i[s++] = f[A++];
			while (--h);
			t.length === 0 && (t.mode = Ss);
			break;
		case If:
			if (c === 0) break e;
			i[s++] = t.length, c--, t.mode = Ss;
			break;
		case _u:
			if (t.wrap) {
				for (; l < 32;) {
					if (u === 0) break e;
					u--, o |= n[a++] << l, l += 8;
				}
				if (p -= c, e.total_out += p, t.total += p, t.wrap & 4 && p && (e.adler = t.check = t.flags ? Ft(t.check, i, p, s - p) : Ra(t.check, i, p, s - p)), p = c, t.wrap & 4 && (t.flags ? o : Sf(o)) !== t.check) {
					e.msg = "incorrect data check", t.mode = mt;
					break;
				}
				o = 0, l = 0;
			}
			t.mode = kf;
		case kf:
			if (t.wrap && t.flags) {
				for (; l < 32;) {
					if (u === 0) break e;
					u--, o += n[a++] << l, l += 8;
				}
				if (t.wrap & 4 && o !== (t.total & 4294967295)) {
					e.msg = "incorrect length check", t.mode = mt;
					break;
				}
				o = 0, l = 0;
			}
			t.mode = Df;
		case Df:
			G = lw;
			break e;
		case mt:
			G = Id;
			break e;
		case Dd: return kd;
		case Sd:
		default: return pr;
	}
	return e.next_out = s, e.avail_out = c, e.next_in = a, e.avail_in = u, t.hold = o, t.bits = l, (t.wsize || p !== e.avail_out && t.mode < mt && (t.mode < _u || r !== sf)) && Rd(e, e.output, e.next_out, p - e.avail_out), d -= e.avail_in, p -= e.avail_out, e.total_in += d, e.total_out += p, t.total += p, t.wrap & 4 && p && (e.adler = t.check = t.flags ? Ft(t.check, i, p, e.next_out - p) : Ra(t.check, i, p, e.next_out - p)), e.data_type = t.bits + (t.last ? 64 : 0) + (t.mode === Qr ? 128 : 0) + (t.mode === Ds || t.mode === mu ? 256 : 0), (d === 0 && p === 0 || r === sf) && G === Un && (G = cw), G;
};
var vw = (e) => {
	if (Hn(e)) return pr;
	let r = e.state;
	return r.window && (r.window = null), e.state = null, Un;
};
var bw = (e, r) => {
	if (Hn(e)) return pr;
	let t = e.state;
	return (t.wrap & 2) === 0 ? pr : (t.head = r, r.done = !1, Un);
};
var yw = (e, r) => {
	let t = r.length, n, i, a;
	return Hn(e) || (n = e.state, n.wrap !== 0 && n.mode !== Ms) ? pr : n.mode === Ms && (i = 1, i = Ra(i, r, t, 0), i !== n.check) ? Id : (a = Rd(e, r, t, t), a ? (n.mode = Dd, kd) : (n.havedict = 1, Un));
};
var Kr = {
	inflateReset: Bd,
	inflateReset2: Nd,
	inflateResetKeep: Td,
	inflateInit: mw,
	inflateInit2: Fd,
	inflate: ww,
	inflateEnd: vw,
	inflateGetHeader: bw,
	inflateSetDictionary: yw,
	inflateInfo: "pako inflate (from Nodeca project)"
};
function Fw() {
	this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var Rw = Fw, Od = Object.prototype.toString, { Z_NO_FLUSH: Ow, Z_FINISH: Lw, Z_OK: Pa, Z_STREAM_END: bu, Z_NEED_DICT: yu, Z_STREAM_ERROR: Pw, Z_DATA_ERROR: Bf, Z_MEM_ERROR: Mw } = Ci;
function Za(e) {
	this.options = Qs.assign({
		chunkSize: 65536,
		windowBits: 15,
		to: ""
	}, e || {});
	let r = this.options;
	r.raw && r.windowBits >= 0 && r.windowBits < 16 && (r.windowBits = -r.windowBits, r.windowBits === 0 && (r.windowBits = -15)), r.windowBits >= 0 && r.windowBits < 16 && !(e && e.windowBits) && (r.windowBits += 32), r.windowBits > 15 && r.windowBits < 48 && !(r.windowBits & 15) && (r.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new yd(), this.strm.avail_out = 0;
	let t = Kr.inflateInit2(this.strm, r.windowBits);
	if (t !== Pa) throw new Error(Pn[t]);
	if (this.header = new Rw(), Kr.inflateGetHeader(this.strm, this.header), r.dictionary && (typeof r.dictionary == "string" ? r.dictionary = La.string2buf(r.dictionary) : Od.call(r.dictionary) === "[object ArrayBuffer]" && (r.dictionary = new Uint8Array(r.dictionary)), r.raw && (t = Kr.inflateSetDictionary(this.strm, r.dictionary), t !== Pa))) throw new Error(Pn[t]);
}
Za.prototype.push = function(e, r) {
	let t = this.strm, n = this.options.chunkSize, i = this.options.dictionary, a, s, u;
	if (this.ended) return !1;
	for (r === ~~r ? s = r : s = r === !0 ? Lw : Ow, Od.call(e) === "[object ArrayBuffer]" ? t.input = new Uint8Array(e) : t.input = e, t.next_in = 0, t.avail_in = t.input.length;;) {
		for (t.avail_out === 0 && (t.output = new Uint8Array(n), t.next_out = 0, t.avail_out = n), a = Kr.inflate(t, s), a === yu && i && (a = Kr.inflateSetDictionary(t, i), a === Pa ? a = Kr.inflate(t, s) : a === Bf && (a = yu)); t.avail_in > 0 && a === bu && t.state.wrap > 0 && e[t.next_in] !== 0;) Kr.inflateReset(t), a = Kr.inflate(t, s);
		switch (a) {
			case Pw:
			case Bf:
			case yu:
			case Mw: return this.onEnd(a), this.ended = !0, !1;
		}
		if (u = t.avail_out, t.next_out && (t.avail_out === 0 || a === bu)) if (this.options.to === "string") {
			let c = La.utf8border(t.output, t.next_out), o = t.next_out - c, l = La.buf2string(t.output, c);
			t.next_out = o, t.avail_out = n - o, o && t.output.set(t.output.subarray(c, c + o), 0), this.onData(l);
		} else this.onData(t.output.length === t.next_out ? t.output : t.output.subarray(0, t.next_out));
		if (!(a === Pa && u === 0)) {
			if (a === bu) return a = Kr.inflateEnd(this.strm), this.onEnd(a), this.ended = !0, !0;
			if (t.avail_in === 0) break;
		}
	}
	return !0;
};
Za.prototype.onData = function(e) {
	this.chunks.push(e);
};
Za.prototype.onEnd = function(e) {
	e === Pa && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = Qs.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
};
function Yu(e, r) {
	let t = new Za(r);
	if (t.push(e), t.err) throw t.msg || Pn[t.err];
	return t.result;
}
function Uw(e, r) {
	return r = r || {}, r.raw = !0, Yu(e, r);
}
var Qw = {
	Inflate: Za,
	inflate: Yu,
	inflateRaw: Uw,
	ungzip: Yu,
	constants: Ci
}, { Deflate: aE, deflate: sE, deflateRaw: oE, gzip: uE } = X_, { Inflate: lE, inflate: hE, inflateRaw: Yw, ungzip: cE } = Qw, Kw = Yw, Ts = class extends Error {
	constructor(e) {
		super(e), this.name = "CfbError";
	}
}, jw = class Rs {
	constructor(r) {
		ot(this, "container");
		try {
			this.container = Gc.read(r, { type: "buffer" });
		} catch (t) {
			throw new Ts(`CFB \uD30C\uC2F1 \uC2E4\uD328: ${t instanceof Error ? t.message : String(t)}`);
		}
	}
	readStreamRaw(r) {
		let t = r.startsWith("/") ? r : `/${r}`, n = Gc.find(this.container, t);
		return !n || n.type !== 2 ? null : qw(n.content);
	}
	static decompress(r) {
		if (r.byteLength === 0) return r;
		try {
			return Kw(r);
		} catch (t) {
			throw new Ts(`deflate \uD574\uC81C \uC2E4\uD328: ${t instanceof Error ? t.message : String(t)}`);
		}
	}
	readFileHeader() {
		let r = this.readStreamRaw("/FileHeader");
		if (!r) throw new Ts("/FileHeader 스트림이 없습니다");
		return r;
	}
	readDocInfo(r) {
		let t = this.readStreamRaw("/DocInfo");
		if (!t) throw new Ts("/DocInfo 스트림이 없습니다");
		return r ? Rs.decompress(t) : t;
	}
	readBodySection(r, t, n) {
		let i = n ? "ViewText" : "BodyText", a = this.readStreamRaw(`/${i}/Section${r}`);
		return a ? n ? a : t ? Rs.decompress(a) : a : null;
	}
	sectionCount(r = !1) {
		let n = new RegExp(`(?:^|/)${r ? "ViewText" : "BodyText"}/Section\\d+$`), i = 0;
		for (let a of this.container.FullPaths) n.test(a) && i++;
		return i;
	}
	listBinData() {
		let r = [], t = /(?:^|\/)BinData\/BIN([0-9A-Fa-f]{4})\.([^/]+)$/;
		for (let n of this.container.FullPaths) {
			let i = t.exec(n);
			i && r.push({
				name: n,
				storageId: parseInt(i[1], 16),
				extension: i[2].toLowerCase()
			});
		}
		return r;
	}
	readBinData(r) {
		let t = this.readStreamRaw(r);
		if (!t) return null;
		try {
			return Rs.decompress(t);
		} catch (n) {
			return t;
		}
	}
	listStreams() {
		let r = [];
		for (let t = 0; t < this.container.FileIndex.length; t++) this.container.FileIndex[t].type === 2 && r.push(this.container.FullPaths[t]);
		return r;
	}
};
function qw(e) {
	return e instanceof Uint8Array ? e : Uint8Array.from(e);
}
var $w = new TextDecoder("utf-16le");
var Tt = class {
	constructor(e, r = 0, t) {
		ot(this, "view"), ot(this, "offset"), ot(this, "end"), this.view = new DataView(e.buffer, e.byteOffset, e.byteLength), this.offset = r, this.end = t === void 0 ? e.byteLength : r + t;
	}
	position() {
		return this.offset;
	}
	remaining() {
		return Math.max(0, this.end - this.offset);
	}
	isEmpty() {
		return this.remaining() === 0;
	}
	setPosition(e) {
		if (e < 0 || e > this.end) throw new RangeError(`setPosition out of range: ${e} (end=${this.end})`);
		this.offset = e;
	}
	skip(e) {
		if (this.offset + e > this.end) throw new RangeError(`skip exceeds end: pos=${this.offset}+${e} > ${this.end}`);
		this.offset += e;
	}
	readU8() {
		return this.ensure(1), this.view.getUint8(this.offset++);
	}
	readU16() {
		this.ensure(2);
		let e = this.view.getUint16(this.offset, !0);
		return this.offset += 2, e;
	}
	readU32() {
		this.ensure(4);
		let e = this.view.getUint32(this.offset, !0);
		return this.offset += 4, e;
	}
	readI8() {
		return this.ensure(1), this.view.getInt8(this.offset++);
	}
	readI16() {
		this.ensure(2);
		let e = this.view.getInt16(this.offset, !0);
		return this.offset += 2, e;
	}
	readI32() {
		this.ensure(4);
		let e = this.view.getInt32(this.offset, !0);
		return this.offset += 4, e;
	}
	readI64() {
		this.ensure(8);
		let e = this.view.getBigInt64(this.offset, !0);
		return this.offset += 8, e;
	}
	readBytes(e) {
		this.ensure(e);
		let r = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, e);
		return this.offset += e, new Uint8Array(r);
	}
	readRemaining() {
		return this.readBytes(this.remaining());
	}
	readHwpString() {
		let e = this.readU16();
		return e === 0 ? "" : this.readUtf16(e);
	}
	readUtf16(e) {
		let r = e * 2;
		this.ensure(r);
		let t = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, r);
		return this.offset += r, $w.decode(t);
	}
	readColorRef() {
		return this.readU32();
	}
	ensure(e) {
		if (this.offset + e > this.end) throw new RangeError(`ByteReader: not enough bytes. need=${e}, have=${this.end - this.offset}, pos=${this.offset}`);
	}
};
var Ye = 16;
var Ld = Ye + 0;
var Pd = Ye + 1;
var Md = Ye + 2;
var Ud = Ye + 3;
var zd = Ye + 4;
var Hd = Ye + 5;
var Zd = Ye + 6;
var Wd = Ye + 7;
var Gd = Ye + 8;
var Qd = Ye + 9;
var Yd = Ye + 10;
var Jw = Ye + 11;
var Vw = Ye + 12;
var Xw = Ye + 14;
var ev = Ye + 15;
var tv = Ye + 16;
var Kd = Ye + 50;
var jd = Ye + 51;
var qd = Ye + 52;
var rv = Ye + 53;
var nv = Ye + 54;
var $d = Ye + 55;
var Us = Ye + 56;
var iv = Ye + 57;
var av = Ye + 58;
var sv = Ye + 59;
var ov = Ye + 60;
var Ru = Ye + 61;
var Jd = Ye + 62;
var Vd = Ye + 63;
var Xd = Ye + 64;
var ep = Ye + 65;
var tp = Ye + 66;
var rp = Ye + 67;
var uv = Ye + 68;
var np = Ye + 69;
var lv = Ye + 70;
var hv = Ye + 71;
var ip = Ye + 72;
var cv = Ye + 74;
var fv = Ye + 75;
var dv = Ye + 76;
var pv = Ye + 77;
var Av = Ye + 78;
var gv = Ye + 79;
function Ve(e) {
	if (e.length !== 4) throw new Error(`ctrlId requires 4 chars, got "${e}"`);
	return (e.charCodeAt(0) << 24 | e.charCodeAt(1) << 16 | e.charCodeAt(2) << 8 | e.charCodeAt(3)) >>> 0;
}
Ve("secd");
Ve("cold");
var ap = Ve("tbl ");
var sp = Ve("eqed");
var op = Ve("gso ");
Ve("$pic");
Ve("$rec");
Ve("$lin");
Ve("$ell");
Ve("$pol");
Ve("$arc");
Ve("$cur");
Ve("$col");
var up = Ve("head");
var lp = Ve("foot");
var hp = Ve("fn  ");
Ve("en  ");
Ve("atno");
Ve("nwno");
Ve("pgnp");
Ve("pghd");
Ve("idxm");
Ve("bokm");
Ve("tcps");
Ve("form");
Ve("tdut");
Ve("tcmt");
Ve("%clk");
Ve("%hlk");
Ve("%bmk");
Ve("%dte");
Ve("%ddt");
Ve("%pat");
Ve("%mmg");
Ve("%xrf");
Ve("%fmu");
Ve("%smr");
Ve("%usr");
function Tv(e) {
	return (e >>> 24 & 255) === 37;
}
var Bv = {
	[Ld]: "DOCUMENT_PROPERTIES",
	[Pd]: "ID_MAPPINGS",
	[Md]: "BIN_DATA",
	[Ud]: "FACE_NAME",
	[zd]: "BORDER_FILL",
	[Hd]: "CHAR_SHAPE",
	[Zd]: "TAB_DEF",
	[Wd]: "NUMBERING",
	[Gd]: "BULLET",
	[Qd]: "PARA_SHAPE",
	[Yd]: "STYLE",
	[Jw]: "DOC_DATA",
	[Vw]: "DISTRIBUTE_DOC_DATA",
	[Xw]: "COMPATIBLE_DOCUMENT",
	[ev]: "LAYOUT_COMPATIBILITY",
	[tv]: "TRACKCHANGE",
	[Kd]: "PARA_HEADER",
	[jd]: "PARA_TEXT",
	[qd]: "PARA_CHAR_SHAPE",
	[rv]: "PARA_LINE_SEG",
	[nv]: "PARA_RANGE_TAG",
	[$d]: "CTRL_HEADER",
	[Us]: "LIST_HEADER",
	[iv]: "PAGE_DEF",
	[av]: "FOOTNOTE_SHAPE",
	[sv]: "PAGE_BORDER_FILL",
	[ov]: "SHAPE_COMPONENT",
	[Ru]: "TABLE",
	[Jd]: "SHAPE_LINE",
	[Vd]: "SHAPE_RECTANGLE",
	[Xd]: "SHAPE_ELLIPSE",
	[ep]: "SHAPE_ARC",
	[tp]: "SHAPE_POLYGON",
	[rp]: "SHAPE_CURVE",
	[uv]: "SHAPE_OLE",
	[np]: "SHAPE_PICTURE",
	[lv]: "SHAPE_CONTAINER",
	[hv]: "CTRL_DATA",
	[ip]: "EQEDIT",
	[cv]: "SHAPE_TEXTART",
	[fv]: "FORM_OBJECT",
	[dv]: "MEMO_SHAPE",
	[pv]: "MEMO_LIST",
	[Av]: "FORBIDDEN_CHAR",
	[gv]: "CHART_DATA"
};
function Nv(e) {
	var r;
	return (r = Bv[e]) != null ? r : "UNKNOWN";
}
function cp(e) {
	return String.fromCharCode(e >>> 24 & 255, e >>> 16 & 255, e >>> 8 & 255, e & 255);
}
var Nf = class extends Error {
	constructor(e) {
		super(e), this.name = "RecordError";
	}
};
function fp(e) {
	let r = new DataView(e.buffer, e.byteOffset, e.byteLength), t = [], n = 0, i = e.byteLength;
	for (; n < i && !(i - n < 4);) {
		let a = r.getUint32(n, !0);
		n += 4;
		let s = a & 1023, u = a >>> 10 & 1023, c = a >>> 20;
		if (c === 4095) {
			if (i - n < 4) throw new Nf(`extended size \uD5E4\uB354 \uC911\uAC04 EOF (tag=${s})`);
			c = r.getUint32(n, !0), n += 4;
		}
		if (n + c > i) throw new Nf(`\uB808\uCF54\uB4DC \uB370\uC774\uD130 \uBD80\uC871: tag=${s}/${Nv(s)}, \uD544\uC694=${c}, \uAC00\uC6A9=${i - n}`);
		let o = new Uint8Array(e.buffer, e.byteOffset + n, c);
		n += c, t.push({
			tagId: s,
			level: u,
			size: c,
			data: new Uint8Array(o)
		});
	}
	return t;
}
var Fv = {
	sectionCount: 1,
	pageStartNum: 1,
	footnoteStartNum: 1,
	endnoteStartNum: 1,
	pictureStartNum: 1,
	tableStartNum: 1,
	equationStartNum: 1
};
function Rv(e) {
	let r = fp(e), t = [], n = Array.from({ length: 7 }, () => []), i = [], a = [], s = [], u = [], c = [], o = [], l = [], d = ht({}, Fv), p = null, h = 0, A = [
		0,
		0,
		0,
		0,
		0,
		0,
		0
	];
	for (let f of r) switch (f.tagId) {
		case Ld:
			d = zv(f.data);
			break;
		case Pd:
			p = Uv(f.data);
			break;
		case Md:
			t.push(Hv(f.data));
			break;
		case Ud: {
			let g = Zv(f.data);
			if (p) {
				for (; h < 7 && A[h] >= p.fontCounts[h];) h++;
				h < 7 ? (n[h].push(g), A[h]++) : n[6].push(g);
			} else n[0].push(g);
			break;
		}
		case zd:
			u.push(Ov(f.data));
			break;
		case Hd:
			i.push(Wv(f.data));
			break;
		case Zd:
			l.push(Lv(f.data));
			break;
		case Wd:
			c.push(Pv(f.data));
			break;
		case Gd:
			o.push(Mv(f.data));
			break;
		case Qd:
			a.push(Gv(f.data));
			break;
		case Yd:
			s.push(Qv(f.data));
			break;
		default: break;
	}
	return {
		docInfo: {
			fontFaces: n,
			charShapes: i,
			paraShapes: a,
			styles: s,
			binData: t,
			borderFills: u,
			numberings: c,
			bullets: o,
			tabDefs: l
		},
		docProperties: d
	};
}
function Ov(e) {
	let r = new Tt(e), t = r.remaining() >= 2 ? r.readU16() : 0, n = () => {
		if (r.remaining() < 6) return {
			lineType: 1,
			widthIndex: 0,
			color: 0
		};
		return {
			lineType: r.readU8(),
			widthIndex: r.readU8(),
			color: r.readColorRef()
		};
	}, i = [
		n(),
		n(),
		n(),
		n()
	], a = {
		diagonalType: 0,
		widthIndex: 0,
		color: 0
	};
	r.remaining() >= 6 && (a = {
		diagonalType: r.readU8(),
		widthIndex: r.readU8(),
		color: r.readColorRef()
	});
	let s;
	if (r.remaining() >= 4) {
		let u = r.readU32();
		u === 0 ? r.remaining() >= 4 && r.skip(4) : u & 1 && r.remaining() >= 12 && (s = {
			backgroundColor: r.readColorRef(),
			patternColor: r.readColorRef(),
			patternType: r.readI32()
		});
	}
	return {
		attr: t,
		borders: i,
		diagonal: a,
		fill: s
	};
}
function Lv(e) {
	let r = new Tt(e), t = r.remaining() >= 4 ? r.readU32() : 0;
	return {
		attr: t,
		autoTabLeft: (t & 1) !== 0,
		autoTabRight: (t & 2) !== 0
	};
}
function Pv(e) {
	let r = new Tt(e), t = [
		"",
		"",
		"",
		"",
		"",
		"",
		""
	];
	for (let i = 0; i < 7 && !(r.remaining() < 12 || (r.readU32(), r.readI16(), r.readI16(), r.readU32(), r.remaining() < 2)); i++) {
		let a = r.readU16();
		if (a > 0 && r.remaining() >= a * 2) try {
			t[i] = r.readUtf16(a);
		} catch (s) {}
	}
	return {
		startNumber: r.remaining() >= 2 ? r.readU16() : 1,
		levelFormats: t
	};
}
function Mv(e) {
	let r = new Tt(e);
	if (r.remaining() < 12) return { bulletChar: "●" };
	if (r.readU32(), r.readI16(), r.readI16(), r.readU32(), r.remaining() < 2) return { bulletChar: "●" };
	let t = r.readU16();
	return { bulletChar: t > 0 ? String.fromCharCode(t) : "●" };
}
function Uv(e) {
	let r = new Tt(e), t = (n) => r.remaining() >= 4 ? r.readU32() : n;
	return {
		binDataCount: t(0),
		fontCounts: [
			t(0),
			t(0),
			t(0),
			t(0),
			t(0),
			t(0),
			t(0)
		],
		borderFillCount: t(0),
		charShapeCount: t(0),
		tabDefCount: t(0),
		numberingCount: t(0),
		bulletCount: t(0),
		paraShapeCount: t(0),
		styleCount: t(0)
	};
}
function zv(e) {
	let r = new Tt(e), t = (n) => r.remaining() >= 2 ? r.readU16() : n;
	return {
		sectionCount: t(1),
		pageStartNum: t(1),
		footnoteStartNum: t(1),
		endnoteStartNum: t(1),
		pictureStartNum: t(1),
		tableStartNum: t(1),
		equationStartNum: t(1)
	};
}
function Hv(e) {
	let r = new Tt(e), n = r.readU16() & 15, i;
	switch (n) {
		case 0:
			i = "link";
			break;
		case 1:
			i = "embedding";
			break;
		case 2:
			i = "storage";
			break;
		default: i = "link";
	}
	if (i === "link") return Ln(r), Ln(r), {
		storageId: 0,
		type: i
	};
	return {
		storageId: r.remaining() >= 2 ? r.readU16() : 0,
		extension: Ln(r),
		type: i
	};
}
function Zv(e) {
	var a;
	let r = new Tt(e), t = r.readU8(), n = (a = Ln(r)) != null ? a : "", i;
	return t & 128 && (i = Ln(r)), {
		name: n,
		substituteName: i
	};
}
function Wv(e) {
	let r = new Tt(e), t = [];
	for (let o = 0; o < 7; o++) t.push(r.readU16());
	for (let o = 0; o < 7; o++) r.readU8();
	for (let o = 0; o < 7; o++) r.readI8();
	for (let o = 0; o < 7; o++) r.readU8();
	for (let o = 0; o < 7; o++) r.readI8();
	let n = r.readI32(), i = r.readU32();
	r.readI8(), r.readI8();
	let a = r.readColorRef(), s = r.readColorRef(), u = r.readColorRef(), c = r.readColorRef();
	return {
		faceNameIds: {
			hangul: t[0],
			latin: t[1],
			hanja: t[2],
			japanese: t[3],
			other: t[4],
			symbol: t[5],
			user: t[6]
		},
		baseSize: n,
		property: i,
		textColor: a,
		shadeColor: u,
		underlineColor: s,
		shadowColor: c,
		bold: (i & 2) !== 0,
		italic: (i & 1) !== 0,
		underline: (i >>> 2 & 3) !== 0,
		strikeout: (i >>> 18 & 7) > 1
	};
}
function Gv(e) {
	let r = new Tt(e), t = r.readU32(), n = r.readI32(), i = r.readI32(), a = r.readI32(), s = r.readI32(), u = r.readI32(), c = r.readI32(), o = t >>> 2 & 7, l;
	switch (o) {
		case 0:
			l = "justify";
			break;
		case 1:
			l = "left";
			break;
		case 2:
			l = "right";
			break;
		case 3:
			l = "center";
			break;
		case 4:
			l = "distribute";
			break;
		case 5:
			l = "distributeSpace";
			break;
		default: l = "unknown";
	}
	return {
		alignment: l,
		property: t,
		leftMargin: n,
		rightMargin: i,
		indent: a,
		prevSpacing: s,
		nextSpacing: u,
		lineSpacing: c
	};
}
function Qv(e) {
	var s;
	let r = new Tt(e), t = (s = Ln(r)) != null ? s : "", n = Ln(r);
	r.remaining() >= 3 && (r.readU8(), r.readU8(), r.readU8());
	return {
		name: t,
		engName: n,
		paraShapeId: r.remaining() >= 2 ? r.readU16() : 0,
		charShapeId: r.remaining() >= 2 ? r.readU16() : 0
	};
}
function Ln(e) {
	if (!(e.remaining() < 2)) try {
		return e.readHwpString();
	} catch (r) {
		return;
	}
}
function Yv(e, r, t) {
	if (e.data.byteLength < 4) return {
		kind: "unknown",
		ctrlId: ""
	};
	let i = new Tt(e.data).readU32(), a = e.data.subarray(4);
	switch (i) {
		case ap: return Kv(e, r, t);
		case op: return $v(e, r);
		case up: return {
			kind: "header",
			paragraphs: Eu(e, r, t)
		};
		case lp: return {
			kind: "footer",
			paragraphs: Eu(e, r, t)
		};
		case hp: return {
			kind: "footnote",
			paragraphs: Eu(e, r, t)
		};
		case sp: return Vv(e, r);
		default: return Tv(i) ? tb(i, a) : {
			kind: "unknown",
			ctrlId: cp(i)
		};
	}
}
function Kv(e, r, t) {
	let n = e.level, i = 0, a = 0, s = [], u = !1;
	for (let c = 0; c < r.length; c++) {
		let o = r[c];
		if (o.level === n + 1) {
			if (o.tagId === Ru) {
				u = !0;
				let l = jv(o.data);
				i = l.rowCount, a = l.colCount;
			} else if (o.tagId === Us) {
				if (!u) continue;
				let l = qv(o.data), d = [];
				for (let h = c + 1; h < r.length; h++) {
					let A = r[h];
					if (A.level < n + 1 || A.level === n + 1 && (A.tagId === Us || A.tagId === Ru)) break;
					d.push(A);
				}
				let p = t(d, n + 1);
				s.push({
					col: l.col,
					row: l.row,
					colSpan: l.colSpan,
					rowSpan: l.rowSpan,
					paragraphs: p
				});
			}
		}
	}
	return {
		kind: "table",
		rowCount: i,
		colCount: a,
		cells: s
	};
}
function jv(e) {
	let r = new Tt(e);
	if (r.remaining() < 8) return {
		rowCount: 0,
		colCount: 0
	};
	r.readU32();
	return {
		rowCount: r.readU16(),
		colCount: r.readU16()
	};
}
function qv(e) {
	let r = new Tt(e);
	if (r.remaining() < 8) return {
		col: 0,
		row: 0,
		colSpan: 1,
		rowSpan: 1
	};
	if (r.readU16(), r.readU32(), r.readU16(), r.remaining() < 8) return {
		col: 0,
		row: 0,
		colSpan: 1,
		rowSpan: 1
	};
	let t = r.readU16(), n = r.readU16(), i = r.readU16(), a = r.readU16();
	return {
		col: t,
		row: n,
		colSpan: i === 0 ? 1 : i,
		rowSpan: a === 0 ? 1 : a
	};
}
function $v(e, r) {
	let t = e.level;
	for (let n of r) if (n.tagId === np && n.level <= t + 3) {
		let i = eb(n.data);
		if (i !== void 0) return {
			kind: "picture",
			binDataId: i
		};
	}
	for (let n of r) if (!(n.level > t + 3)) switch (n.tagId) {
		case Jd: return Jv(n.data);
		case Vd: return {
			kind: "shape",
			shapeType: "rectangle"
		};
		case Xd: return {
			kind: "shape",
			shapeType: "ellipse"
		};
		case ep: return {
			kind: "shape",
			shapeType: "arc"
		};
		case tp: return {
			kind: "shape",
			shapeType: "polygon"
		};
		case rp: return {
			kind: "shape",
			shapeType: "curve"
		};
	}
	return {
		kind: "unknown",
		ctrlId: "gso "
	};
}
function Jv(e) {
	if (e.byteLength < 16) return {
		kind: "shape",
		shapeType: "line"
	};
	let r = new Tt(e);
	return {
		kind: "shape",
		shapeType: "line",
		x1: r.readI32(),
		y1: r.readI32(),
		x2: r.readI32(),
		y2: r.readI32()
	};
}
function Vv(e, r) {
	for (let t of r) if (t.tagId === ip) return {
		kind: "equation",
		script: Xv(t.data)
	};
	return {
		kind: "equation",
		script: ""
	};
}
function Xv(e) {
	let r = new Tt(e);
	if (r.remaining() < 4 || (r.readU32(), r.remaining() < 11) || (r.skip(11), r.remaining() < 2)) return "";
	let t = r.readU16();
	if (t === 0 || t > 1e4) return "";
	let n = t * 2;
	if (r.remaining() < n) return "";
	try {
		return r.readUtf16(t);
	} catch (i) {
		return "";
	}
}
function eb(e) {
	return e.byteLength < 73 ? void 0 : new DataView(e.buffer, e.byteOffset, e.byteLength).getUint16(71, !0);
}
function Eu(e, r, t) {
	let n = e.level, i = r.findIndex((s) => s.tagId === Us && s.level === n + 1);
	if (i < 0) return [];
	let a = [];
	for (let s = i + 1; s < r.length && !(r[s].level <= n + 1); s++) a.push(r[s]);
	return t(a, n + 2);
}
function tb(e, r) {
	let t = cp(e);
	if (r.byteLength < 7) return {
		kind: "field",
		ctrlId: t
	};
	let n = new Tt(r);
	n.readU32(), n.readU8();
	let i = n.readU16(), a;
	if (i > 0 && n.remaining() >= i * 2) try {
		a = n.readUtf16(i);
	} catch (s) {
		a = void 0;
	}
	return {
		kind: "field",
		ctrlId: t,
		command: a
	};
}
function rb(e) {
	let r = fp(e);
	return { paragraphs: dp(r, r.length > 0 ? r[0].level : 0) };
}
function dp(e, r) {
	let t = [];
	for (let n = 0; n < e.length; n++) {
		let i = e[n];
		if (i.tagId !== Kd || i.level !== r) continue;
		let a = n + 1;
		for (; a < e.length && e[a].level > r;) a++;
		let s = e.slice(n, a);
		t.push(nb(s)), n = a - 1;
	}
	return t;
}
function nb(e) {
	let r = e[0], t = ib(r.data), n = r.level, i = "", a = [], s = [];
	for (let u = 1; u < e.length; u++) {
		let c = e[u];
		if (c.level === n + 1) switch (c.tagId) {
			case jd:
				i = ab(c.data);
				break;
			case qd:
				a = ob(c.data);
				break;
			case $d: {
				let o = [];
				for (let d = u + 1; d < e.length && !(e[d].level <= n + 1); d++) o.push(e[d]);
				let l = Yv(c, o, dp);
				s.push(l);
				break;
			}
			default: break;
		}
	}
	return {
		paraShapeId: t.paraShapeId,
		styleId: t.styleId,
		text: i,
		runs: ub(i, a),
		controls: s
	};
}
function ib(e) {
	let r = new Tt(e);
	return {
		charCount: (r.remaining() >= 4 ? r.readU32() : 0) & 2147483647,
		controlMask: r.remaining() >= 4 ? r.readU32() : 0,
		paraShapeId: r.remaining() >= 2 ? r.readU16() : 0,
		styleId: r.remaining() >= 1 ? r.readU8() : 0
	};
}
function ab(e) {
	let r = "", t = 0, n = e.byteLength;
	for (; t + 1 < n;) {
		let i = e[t] | e[t + 1] << 8;
		if (i === 0) t += 2;
		else if (i === 9) r += "	", t += 16;
		else if (i === 10) r += `
`, t += 2;
		else {
			if (i === 13) break;
			if (sb(i)) t += 16;
			else if (i < 32) {
				switch (i) {
					case 24:
						r += " ";
						break;
					case 25:
						r += " ";
						break;
					case 30:
						r += "-";
						break;
					case 31: r += " ";
				}
				t += 2;
			} else {
				if (i >= 55296 && i <= 56319 && t + 3 < n) {
					let a = e[t + 2] | e[t + 3] << 8;
					if (a >= 56320 && a <= 57343) {
						r += String.fromCharCode(i, a), t += 4;
						continue;
					}
				}
				r += String.fromCharCode(i), t += 2;
			}
		}
	}
	return r;
}
function sb(e) {
	return e >= 1 && e <= 8 || e === 11 || e === 12 || e >= 14 && e <= 23;
}
function ob(e) {
	let r = new Tt(e), t = [];
	for (; r.remaining() >= 8;) {
		let n = r.readU32(), i = r.readU32();
		t.push({
			charPos: n,
			charShapeId: i
		});
	}
	return t;
}
function ub(e, r) {
	if (e.length === 0) return [];
	if (r.length === 0) return [{
		charShapeId: 0,
		text: e
	}];
	let t = [...r].sort((i, a) => i.charPos - a.charPos), n = [];
	for (let i = 0; i < t.length; i++) {
		let a = t[i].charPos, s = i + 1 < t.length ? t[i + 1].charPos : e.length;
		s > a && n.push({
			charShapeId: t[i].charShapeId,
			text: e.slice(a, s)
		});
	}
	return n;
}
var ln = [
	208,
	207,
	17,
	224,
	161,
	177,
	26,
	225
];
function lb(e, r) {
	var n;
	let t = /* @__PURE__ */ new Map();
	for (let i of r) {
		if (i.type === "link") continue;
		let a = i.type === "storage", s = (n = i.extension) != null ? n : a ? "OLE" : "dat", u = i.storageId.toString(16).padStart(4, "0"), c = [`/BinData/BIN${u.toUpperCase()}.${s}`, `/BinData/BIN${u.toLowerCase()}.${s}`], o = null;
		for (let l of c) if (o = e.readBinData(l), o) break;
		if (o) {
			if (a && o.byteLength > 12) {
				let l = o[0] === ln[0] && o[1] === ln[1] && o[2] === ln[2] && o[3] === ln[3], d = o[4] === ln[0] && o[5] === ln[1] && o[6] === ln[2] && o[7] === ln[3];
				!l && d && (o = o.subarray(4));
			}
			t.set(i.storageId, {
				data: new Uint8Array(o),
				extension: s
			});
		}
	}
	return t;
}
Ws(Uu(), 1);
function Ku() {
	return {
		async: !1,
		breaks: !1,
		extensions: null,
		gfm: !0,
		hooks: null,
		pedantic: !1,
		renderer: null,
		silent: !1,
		tokenizer: null,
		walkTokens: null
	};
}
var Zn = Ku();
function pp(e) {
	Zn = e;
}
var Nn = { exec: () => null };
function nt(e, r = "") {
	let t = typeof e == "string" ? e : e.source, n = {
		replace: (i, a) => {
			let s = typeof a == "string" ? a : a.source;
			return s = s.replace(zt.caret, "$1"), t = t.replace(i, s), n;
		},
		getRegex: () => new RegExp(t, r)
	};
	return n;
}
var hb = ((e = "") => {
	try {
		return !!new RegExp("(?<=1)(?<!1)" + e);
	} catch (r) {
		return !1;
	}
})();
var zt = {
	codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
	outputLinkReplace: /\\([\[\]])/g,
	indentCodeCompensation: /^(\s+)(?:```)/,
	beginningSpace: /^\s+/,
	endingHash: /#$/,
	startingSpaceChar: /^ /,
	endingSpaceChar: / $/,
	nonSpaceChar: /[^ ]/,
	newLineCharGlobal: /\n/g,
	tabCharGlobal: /\t/g,
	multipleSpaceGlobal: /\s+/g,
	blankLine: /^[ \t]*$/,
	doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
	blockquoteStart: /^ {0,3}>/,
	blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
	blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
	listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
	listIsTask: /^\[[ xX]\] +\S/,
	listReplaceTask: /^\[[ xX]\] +/,
	listTaskCheckbox: /\[[ xX]\]/,
	anyLine: /\n.*\n/,
	hrefBrackets: /^<(.*)>$/,
	tableDelimiter: /[:|]/,
	tableAlignChars: /^\||\| *$/g,
	tableRowBlankLine: /\n[ \t]*$/,
	tableAlignRight: /^ *-+: *$/,
	tableAlignCenter: /^ *:-+: *$/,
	tableAlignLeft: /^ *:-+ *$/,
	startATag: /^<a /i,
	endATag: /^<\/a>/i,
	startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
	endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
	startAngleBracket: /^</,
	endAngleBracket: />$/,
	pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
	unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
	escapeTest: /[&<>"']/,
	escapeReplace: /[&<>"']/g,
	escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
	escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
	caret: /(^|[^\[])\^/g,
	percentDecode: /%25/g,
	findPipe: /\|/g,
	splitPipe: / \|/,
	slashPipe: /\\\|/g,
	carriageReturn: /\r\n|\r/g,
	spaceLine: /^ +$/gm,
	notSpaceStart: /^\S*/,
	endingNewline: /\n$/,
	listItemRegex: (e) => new RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),
	nextBulletRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
	hrRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
	fencesBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}(?:\`\`\`|~~~)`),
	headingBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}#`),
	htmlBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}<(?:[a-z].*>|!--)`, "i"),
	blockquoteBeginRegex: (e) => new RegExp(`^ {0,${Math.min(3, e - 1)}}>`)
};
var cb = /^(?:[ \t]*(?:\n|$))+/;
var fb = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
var db = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
var Wa = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var pb = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var ju = / {0,3}(?:[*+-]|\d{1,9}[.)])/;
var Ap = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
var gp = nt(Ap).replace(/bull/g, ju).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
var Ab = nt(Ap).replace(/bull/g, ju).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
var qu = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
var gb = /^[^\n]+/;
var $u = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
var mb = nt(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", $u).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
var _b = nt(/^(bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, ju).getRegex();
var Ks = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var Ju = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
var wb = nt("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", Ju).replace("tag", Ks).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
var mp = nt(qu).replace("hr", Wa).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Ks).getRegex();
var Vu = {
	blockquote: nt(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", mp).getRegex(),
	code: fb,
	def: mb,
	fences: db,
	heading: pb,
	hr: Wa,
	html: wb,
	lheading: gp,
	list: _b,
	newline: cb,
	paragraph: mp,
	table: Nn,
	text: gb
};
var Ff = nt("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Wa).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Ks).getRegex();
var bb = Gn(ht({}, Vu), {
	lheading: Ab,
	table: Ff,
	paragraph: nt(qu).replace("hr", Wa).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Ff).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Ks).getRegex()
});
var yb = Gn(ht({}, Vu), {
	html: nt(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", Ju).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
	def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
	heading: /^(#{1,6})(.*)(?:\n+|$)/,
	fences: Nn,
	lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
	paragraph: nt(qu).replace("hr", Wa).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", gp).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
});
var Eb = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var xb = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var _p = /^( {2,}|\\)\n(?!\s*$)/;
var Cb = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var Di = /[\p{P}\p{S}]/u;
var js = /[\s\p{P}\p{S}]/u;
var Xu = /[^\s\p{P}\p{S}]/u;
var Ib = nt(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, js).getRegex();
var wp = /(?!~)[\p{P}\p{S}]/u;
var kb = /(?!~)[\s\p{P}\p{S}]/u;
var Db = /(?:[^\s\p{P}\p{S}]|~)/u;
var Sb = nt(/link|precode-code|html/, "g").replace("link", /* @__PURE__ */ new RegExp("\\[(?:[^\\[\\]`]|(?<a>`+)[^`]+\\k<a>(?!`))*?\\]\\((?:\\\\[\\s\\S]|[^\\\\\\(\\)]|\\((?:\\\\[\\s\\S]|[^\\\\\\(\\)])*\\))*\\)")).replace("precode-", hb ? "(?<!`)()" : "(^^|[^`])").replace("code", /* @__PURE__ */ new RegExp("(?<b>`+)[^`]+\\k<b>(?!`)")).replace("html", /<(?! )[^<>]*?>/).getRegex();
var vp = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/;
var Tb = nt(vp, "u").replace(/punct/g, Di).getRegex();
var Bb = nt(vp, "u").replace(/punct/g, wp).getRegex();
var bp = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
var Nb = nt(bp, "gu").replace(/notPunctSpace/g, Xu).replace(/punctSpace/g, js).replace(/punct/g, Di).getRegex();
var Fb = nt(bp, "gu").replace(/notPunctSpace/g, Db).replace(/punctSpace/g, kb).replace(/punct/g, wp).getRegex();
var Rb = nt("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, Xu).replace(/punctSpace/g, js).replace(/punct/g, Di).getRegex();
var Ob = nt(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, Di).getRegex();
var Pb = nt("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)", "gu").replace(/notPunctSpace/g, Xu).replace(/punctSpace/g, js).replace(/punct/g, Di).getRegex();
var Mb = nt(/\\(punct)/, "gu").replace(/punct/g, Di).getRegex();
var Ub = nt(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
var zb = nt(Ju).replace("(?:-->|$)", "-->").getRegex();
var Hb = nt("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", zb).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
var zs = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/;
var Zb = nt(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", zs).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
var yp = nt(/^!?\[(label)\]\[(ref)\]/).replace("label", zs).replace("ref", $u).getRegex();
var Ep = nt(/^!?\[(ref)\](?:\[\])?/).replace("ref", $u).getRegex();
var Wb = nt("reflink|nolink(?!\\()", "g").replace("reflink", yp).replace("nolink", Ep).getRegex();
var Rf = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
var el = {
	_backpedal: Nn,
	anyPunctuation: Mb,
	autolink: Ub,
	blockSkip: Sb,
	br: _p,
	code: xb,
	del: Nn,
	delLDelim: Nn,
	delRDelim: Nn,
	emStrongLDelim: Tb,
	emStrongRDelimAst: Nb,
	emStrongRDelimUnd: Rb,
	escape: Eb,
	link: Zb,
	nolink: Ep,
	punctuation: Ib,
	reflink: yp,
	reflinkSearch: Wb,
	tag: Hb,
	text: Cb,
	url: Nn
};
var Gb = Gn(ht({}, el), {
	link: nt(/^!?\[(label)\]\((.*?)\)/).replace("label", zs).getRegex(),
	reflink: nt(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", zs).getRegex()
});
var Ou = Gn(ht({}, el), {
	emStrongRDelimAst: Fb,
	emStrongLDelim: Bb,
	delLDelim: Ob,
	delRDelim: Pb,
	url: nt(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", Rf).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
	_backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
	del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
	text: nt(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", Rf).getRegex()
});
var Qb = Gn(ht({}, Ou), {
	br: nt(_p).replace("{2,}", "*").getRegex(),
	text: nt(Ou.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
});
var Bs = {
	normal: Vu,
	gfm: bb,
	pedantic: yb
};
var ya = {
	normal: el,
	gfm: Ou,
	breaks: Qb,
	pedantic: Gb
};
var Yb = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
};
var Of = (e) => Yb[e];
function Nr(e, r) {
	if (r) {
		if (zt.escapeTest.test(e)) return e.replace(zt.escapeReplace, Of);
	} else if (zt.escapeTestNoEncode.test(e)) return e.replace(zt.escapeReplaceNoEncode, Of);
	return e;
}
function Lf(e) {
	try {
		e = encodeURI(e).replace(zt.percentDecode, "%");
	} catch (r) {
		return null;
	}
	return e;
}
function Pf(e, r) {
	var a;
	let n = e.replace(zt.findPipe, (s, u, c) => {
		let o = !1, l = u;
		for (; --l >= 0 && c[l] === "\\";) o = !o;
		return o ? "|" : " |";
	}).split(zt.splitPipe), i = 0;
	if (n[0].trim() || n.shift(), n.length > 0 && !((a = n.at(-1)) != null && a.trim()) && n.pop(), r) if (n.length > r) n.splice(r);
	else for (; n.length < r;) n.push("");
	for (; i < n.length; i++) n[i] = n[i].trim().replace(zt.slashPipe, "|");
	return n;
}
function hn(e, r, t) {
	let n = e.length;
	if (n === 0) return "";
	let i = 0;
	for (; i < n;) {
		let a = e.charAt(n - i - 1);
		if (a === r && !t) i++;
		else if (a !== r && t) i++;
		else break;
	}
	return e.slice(0, n - i);
}
function Mf(e) {
	let r = e.split(`
`), t = r.length - 1;
	for (; t >= 0 && zt.blankLine.test(r[t]);) t--;
	return r.length - t <= 2 ? e : r.slice(0, t + 1).join(`
`);
}
function Kb(e, r) {
	if (e.indexOf(r[1]) === -1) return -1;
	let t = 0;
	for (let n = 0; n < e.length; n++) if (e[n] === "\\") n++;
	else if (e[n] === r[0]) t++;
	else if (e[n] === r[1] && (t--, t < 0)) return n;
	return t > 0 ? -2 : -1;
}
function jb(e, r = 0) {
	let t = r, n = "";
	for (let i of e) if (i === "	") {
		let a = 4 - t % 4;
		n += " ".repeat(a), t += a;
	} else n += i, t++;
	return n;
}
function Uf(e, r, t, n, i) {
	let a = r.href, s = r.title || null, u = e[1].replace(i.other.outputLinkReplace, "$1");
	n.state.inLink = !0;
	let c = {
		type: e[0].charAt(0) === "!" ? "image" : "link",
		raw: t,
		href: a,
		title: s,
		text: u,
		tokens: n.inlineTokens(u)
	};
	return n.state.inLink = !1, c;
}
function qb(e, r, t) {
	let n = e.match(t.other.indentCodeCompensation);
	if (n === null) return r;
	let i = n[1];
	return r.split(`
`).map((a) => {
		let s = a.match(t.other.beginningSpace);
		if (s === null) return a;
		let [u] = s;
		return u.length >= i.length ? a.slice(i.length) : a;
	}).join(`
`);
}
var Hs = class {
	constructor(e) {
		ot(this, "options"), ot(this, "rules"), ot(this, "lexer"), this.options = e || Zn;
	}
	space(e) {
		let r = this.rules.block.newline.exec(e);
		if (r && r[0].length > 0) return {
			type: "space",
			raw: r[0]
		};
	}
	code(e) {
		let r = this.rules.block.code.exec(e);
		if (r) {
			let t = this.options.pedantic ? r[0] : Mf(r[0]);
			return {
				type: "code",
				raw: t,
				codeBlockStyle: "indented",
				text: t.replace(this.rules.other.codeRemoveIndent, "")
			};
		}
	}
	fences(e) {
		let r = this.rules.block.fences.exec(e);
		if (r) {
			let t = r[0], n = qb(t, r[3] || "", this.rules);
			return {
				type: "code",
				raw: t,
				lang: r[2] ? r[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : r[2],
				text: n
			};
		}
	}
	heading(e) {
		let r = this.rules.block.heading.exec(e);
		if (r) {
			let t = r[2].trim();
			if (this.rules.other.endingHash.test(t)) {
				let n = hn(t, "#");
				(this.options.pedantic || !n || this.rules.other.endingSpaceChar.test(n)) && (t = n.trim());
			}
			return {
				type: "heading",
				raw: hn(r[0], `
`),
				depth: r[1].length,
				text: t,
				tokens: this.lexer.inline(t)
			};
		}
	}
	hr(e) {
		let r = this.rules.block.hr.exec(e);
		if (r) return {
			type: "hr",
			raw: hn(r[0], `
`)
		};
	}
	blockquote(e) {
		let r = this.rules.block.blockquote.exec(e);
		if (r) {
			let t = hn(r[0], `
`).split(`
`), n = "", i = "", a = [];
			for (; t.length > 0;) {
				let s = !1, u = [], c;
				for (c = 0; c < t.length; c++) if (this.rules.other.blockquoteStart.test(t[c])) u.push(t[c]), s = !0;
				else if (!s) u.push(t[c]);
				else break;
				t = t.slice(c);
				let o = u.join(`
`), l = o.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
				n = n ? `${n}
${o}` : o, i = i ? `${i}
${l}` : l;
				let d = this.lexer.state.top;
				if (this.lexer.state.top = !0, this.lexer.blockTokens(l, a, !0), this.lexer.state.top = d, t.length === 0) break;
				let p = a.at(-1);
				if ((p == null ? void 0 : p.type) === "code") break;
				if ((p == null ? void 0 : p.type) === "blockquote") {
					let h = p, A = h.raw + `
` + t.join(`
`), f = this.blockquote(A);
					a[a.length - 1] = f, n = n.substring(0, n.length - h.raw.length) + f.raw, i = i.substring(0, i.length - h.text.length) + f.text;
					break;
				} else if ((p == null ? void 0 : p.type) === "list") {
					let h = p, A = h.raw + `
` + t.join(`
`), f = this.list(A);
					a[a.length - 1] = f, n = n.substring(0, n.length - p.raw.length) + f.raw, i = i.substring(0, i.length - h.raw.length) + f.raw, t = A.substring(a.at(-1).raw.length).split(`
`);
					continue;
				}
			}
			return {
				type: "blockquote",
				raw: n,
				tokens: a,
				text: i
			};
		}
	}
	list(e) {
		var t, n;
		let r = this.rules.block.list.exec(e);
		if (r) {
			let i = r[1].trim(), a = i.length > 1, s = {
				type: "list",
				raw: "",
				ordered: a,
				start: a ? +i.slice(0, -1) : "",
				loose: !1,
				items: []
			};
			i = a ? `\\d{1,9}\\${i.slice(-1)}` : `\\${i}`, this.options.pedantic && (i = a ? i : "[*+-]");
			let u = this.rules.other.listItemRegex(i), c = !1;
			for (; e;) {
				let l = !1, d = "", p = "";
				if (!(r = u.exec(e)) || this.rules.block.hr.test(e)) break;
				d = r[0], e = e.substring(d.length);
				let h = jb(r[2].split(`
`, 1)[0], r[1].length), A = e.split(`
`, 1)[0], f = !h.trim(), g = 0;
				if (this.options.pedantic ? (g = 2, p = h.trimStart()) : f ? g = r[1].length + 1 : (g = h.search(this.rules.other.nonSpaceChar), g = g > 4 ? 1 : g, p = h.slice(g), g += r[1].length), f && this.rules.other.blankLine.test(A) && (d += A + `
`, e = e.substring(A.length + 1), l = !0), !l) {
					let _ = this.rules.other.nextBulletRegex(g), v = this.rules.other.hrRegex(g), b = this.rules.other.fencesBeginRegex(g), C = this.rules.other.headingBeginRegex(g), T = this.rules.other.htmlBeginRegex(g), ee = this.rules.other.blockquoteBeginRegex(g);
					for (; e;) {
						let x = e.split(`
`, 1)[0], G;
						if (A = x, this.options.pedantic ? (A = A.replace(this.rules.other.listReplaceNesting, "  "), G = A) : G = A.replace(this.rules.other.tabCharGlobal, "    "), b.test(A) || C.test(A) || T.test(A) || ee.test(A) || _.test(A) || v.test(A)) break;
						if (G.search(this.rules.other.nonSpaceChar) >= g || !A.trim()) p += `
` + G.slice(g);
						else {
							if (f || h.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || b.test(h) || C.test(h) || v.test(h)) break;
							p += `
` + A;
						}
						f = !A.trim(), d += x + `
`, e = e.substring(x.length + 1), h = G.slice(g);
					}
				}
				s.loose || (c ? s.loose = !0 : this.rules.other.doubleBlankLine.test(d) && (c = !0)), s.items.push({
					type: "list_item",
					raw: d,
					task: !!this.options.gfm && this.rules.other.listIsTask.test(p),
					loose: !1,
					text: p,
					tokens: []
				}), s.raw += d;
			}
			let o = s.items.at(-1);
			if (o) o.raw = o.raw.trimEnd(), o.text = o.text.trimEnd();
			else return;
			s.raw = s.raw.trimEnd();
			for (let l of s.items) {
				if (this.lexer.state.top = !1, l.tokens = this.lexer.blockTokens(l.text, []), l.task) {
					if (l.text = l.text.replace(this.rules.other.listReplaceTask, ""), ((t = l.tokens[0]) == null ? void 0 : t.type) === "text" || ((n = l.tokens[0]) == null ? void 0 : n.type) === "paragraph") {
						l.tokens[0].raw = l.tokens[0].raw.replace(this.rules.other.listReplaceTask, ""), l.tokens[0].text = l.tokens[0].text.replace(this.rules.other.listReplaceTask, "");
						for (let p = this.lexer.inlineQueue.length - 1; p >= 0; p--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[p].src)) {
							this.lexer.inlineQueue[p].src = this.lexer.inlineQueue[p].src.replace(this.rules.other.listReplaceTask, "");
							break;
						}
					}
					let d = this.rules.other.listTaskCheckbox.exec(l.raw);
					if (d) {
						let p = {
							type: "checkbox",
							raw: d[0] + " ",
							checked: d[0] !== "[ ]"
						};
						l.checked = p.checked, s.loose ? l.tokens[0] && ["paragraph", "text"].includes(l.tokens[0].type) && "tokens" in l.tokens[0] && l.tokens[0].tokens ? (l.tokens[0].raw = p.raw + l.tokens[0].raw, l.tokens[0].text = p.raw + l.tokens[0].text, l.tokens[0].tokens.unshift(p)) : l.tokens.unshift({
							type: "paragraph",
							raw: p.raw,
							text: p.raw,
							tokens: [p]
						}) : l.tokens.unshift(p);
					}
				}
				if (!s.loose) {
					let d = l.tokens.filter((h) => h.type === "space");
					s.loose = d.length > 0 && d.some((h) => this.rules.other.anyLine.test(h.raw));
				}
			}
			if (s.loose) for (let l of s.items) {
				l.loose = !0;
				for (let d of l.tokens) d.type === "text" && (d.type = "paragraph");
			}
			return s;
		}
	}
	html(e) {
		let r = this.rules.block.html.exec(e);
		if (r) {
			let t = Mf(r[0]);
			return {
				type: "html",
				block: !0,
				raw: t,
				pre: r[1] === "pre" || r[1] === "script" || r[1] === "style",
				text: t
			};
		}
	}
	def(e) {
		let r = this.rules.block.def.exec(e);
		if (r) {
			let t = r[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), n = r[2] ? r[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i = r[3] ? r[3].substring(1, r[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : r[3];
			return {
				type: "def",
				tag: t,
				raw: hn(r[0], `
`),
				href: n,
				title: i
			};
		}
	}
	table(e) {
		var s;
		let r = this.rules.block.table.exec(e);
		if (!r || !this.rules.other.tableDelimiter.test(r[2])) return;
		let t = Pf(r[1]), n = r[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = (s = r[3]) != null && s.trim() ? r[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], a = {
			type: "table",
			raw: hn(r[0], `
`),
			header: [],
			align: [],
			rows: []
		};
		if (t.length === n.length) {
			for (let u of n) this.rules.other.tableAlignRight.test(u) ? a.align.push("right") : this.rules.other.tableAlignCenter.test(u) ? a.align.push("center") : this.rules.other.tableAlignLeft.test(u) ? a.align.push("left") : a.align.push(null);
			for (let u = 0; u < t.length; u++) a.header.push({
				text: t[u],
				tokens: this.lexer.inline(t[u]),
				header: !0,
				align: a.align[u]
			});
			for (let u of i) a.rows.push(Pf(u, a.header.length).map((c, o) => ({
				text: c,
				tokens: this.lexer.inline(c),
				header: !1,
				align: a.align[o]
			})));
			return a;
		}
	}
	lheading(e) {
		let r = this.rules.block.lheading.exec(e);
		if (r) {
			let t = r[1].trim();
			return {
				type: "heading",
				raw: hn(r[0], `
`),
				depth: r[2].charAt(0) === "=" ? 1 : 2,
				text: t,
				tokens: this.lexer.inline(t)
			};
		}
	}
	paragraph(e) {
		let r = this.rules.block.paragraph.exec(e);
		if (r) {
			let t = r[1].charAt(r[1].length - 1) === `
` ? r[1].slice(0, -1) : r[1];
			return {
				type: "paragraph",
				raw: r[0],
				text: t,
				tokens: this.lexer.inline(t)
			};
		}
	}
	text(e) {
		let r = this.rules.block.text.exec(e);
		if (r) return {
			type: "text",
			raw: r[0],
			text: r[0],
			tokens: this.lexer.inline(r[0])
		};
	}
	escape(e) {
		let r = this.rules.inline.escape.exec(e);
		if (r) return {
			type: "escape",
			raw: r[0],
			text: r[1]
		};
	}
	tag(e) {
		let r = this.rules.inline.tag.exec(e);
		if (r) return !this.lexer.state.inLink && this.rules.other.startATag.test(r[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(r[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(r[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(r[0]) && (this.lexer.state.inRawBlock = !1), {
			type: "html",
			raw: r[0],
			inLink: this.lexer.state.inLink,
			inRawBlock: this.lexer.state.inRawBlock,
			block: !1,
			text: r[0]
		};
	}
	link(e) {
		let r = this.rules.inline.link.exec(e);
		if (r) {
			let t = r[2].trim();
			if (!this.options.pedantic && this.rules.other.startAngleBracket.test(t)) {
				if (!this.rules.other.endAngleBracket.test(t)) return;
				let a = hn(t.slice(0, -1), "\\");
				if ((t.length - a.length) % 2 === 0) return;
			} else {
				let a = Kb(r[2], "()");
				if (a === -2) return;
				if (a > -1) {
					let s = (r[0].indexOf("!") === 0 ? 5 : 4) + r[1].length + a;
					r[2] = r[2].substring(0, a), r[0] = r[0].substring(0, s).trim(), r[3] = "";
				}
			}
			let n = r[2], i = "";
			if (this.options.pedantic) {
				let a = this.rules.other.pedanticHrefTitle.exec(n);
				a && (n = a[1], i = a[3]);
			} else i = r[3] ? r[3].slice(1, -1) : "";
			return n = n.trim(), this.rules.other.startAngleBracket.test(n) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(t) ? n = n.slice(1) : n = n.slice(1, -1)), Uf(r, {
				href: n && n.replace(this.rules.inline.anyPunctuation, "$1"),
				title: i && i.replace(this.rules.inline.anyPunctuation, "$1")
			}, r[0], this.lexer, this.rules);
		}
	}
	reflink(e, r) {
		let t;
		if ((t = this.rules.inline.reflink.exec(e)) || (t = this.rules.inline.nolink.exec(e))) {
			let i = r[(t[2] || t[1]).replace(this.rules.other.multipleSpaceGlobal, " ").toLowerCase()];
			if (!i) {
				let a = t[0].charAt(0);
				return {
					type: "text",
					raw: a,
					text: a
				};
			}
			return Uf(t, i, t[0], this.lexer, this.rules);
		}
	}
	emStrong(e, r, t = "") {
		let n = this.rules.inline.emStrongLDelim.exec(e);
		if (!(!n || !n[1] && !n[2] && !n[3] && !n[4] || n[4] && t.match(this.rules.other.unicodeAlphaNumeric)) && (!(n[1] || n[3]) || !t || this.rules.inline.punctuation.exec(t))) {
			let i = [...n[0]].length - 1, a, s, u = i, c = 0, o = n[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
			for (o.lastIndex = 0, r = r.slice(-1 * e.length + i); (n = o.exec(r)) !== null;) {
				if (a = n[1] || n[2] || n[3] || n[4] || n[5] || n[6], !a) continue;
				if (s = [...a].length, n[3] || n[4]) {
					u += s;
					continue;
				} else if ((n[5] || n[6]) && i % 3 && !((i + s) % 3)) {
					c += s;
					continue;
				}
				if (u -= s, u > 0) continue;
				s = Math.min(s, s + u + c);
				let l = [...n[0]][0].length, d = e.slice(0, i + n.index + l + s);
				if (Math.min(i, s) % 2) {
					let h = d.slice(1, -1);
					return {
						type: "em",
						raw: d,
						text: h,
						tokens: this.lexer.inlineTokens(h)
					};
				}
				let p = d.slice(2, -2);
				return {
					type: "strong",
					raw: d,
					text: p,
					tokens: this.lexer.inlineTokens(p)
				};
			}
		}
	}
	codespan(e) {
		let r = this.rules.inline.code.exec(e);
		if (r) {
			let t = r[2].replace(this.rules.other.newLineCharGlobal, " "), n = this.rules.other.nonSpaceChar.test(t), i = this.rules.other.startingSpaceChar.test(t) && this.rules.other.endingSpaceChar.test(t);
			return n && i && (t = t.substring(1, t.length - 1)), {
				type: "codespan",
				raw: r[0],
				text: t
			};
		}
	}
	br(e) {
		let r = this.rules.inline.br.exec(e);
		if (r) return {
			type: "br",
			raw: r[0]
		};
	}
	del(e, r, t = "") {
		let n = this.rules.inline.delLDelim.exec(e);
		if (n && (!n[1] || !t || this.rules.inline.punctuation.exec(t))) {
			let i = [...n[0]].length - 1, a, s, u = i, c = this.rules.inline.delRDelim;
			for (c.lastIndex = 0, r = r.slice(-1 * e.length + i); (n = c.exec(r)) !== null;) {
				if (a = n[1] || n[2] || n[3] || n[4] || n[5] || n[6], !a || (s = [...a].length, s !== i)) continue;
				if (n[3] || n[4]) {
					u += s;
					continue;
				}
				if (u -= s, u > 0) continue;
				s = Math.min(s, s + u);
				let o = [...n[0]][0].length, l = e.slice(0, i + n.index + o + s), d = l.slice(i, -i);
				return {
					type: "del",
					raw: l,
					text: d,
					tokens: this.lexer.inlineTokens(d)
				};
			}
		}
	}
	autolink(e) {
		let r = this.rules.inline.autolink.exec(e);
		if (r) {
			let t, n;
			return r[2] === "@" ? (t = r[1], n = "mailto:" + t) : (t = r[1], n = t), {
				type: "link",
				raw: r[0],
				text: t,
				href: n,
				tokens: [{
					type: "text",
					raw: t,
					text: t
				}]
			};
		}
	}
	url(e) {
		var t, n;
		let r;
		if (r = this.rules.inline.url.exec(e)) {
			let i, a;
			if (r[2] === "@") i = r[0], a = "mailto:" + i;
			else {
				let s;
				do
					s = r[0], r[0] = (n = (t = this.rules.inline._backpedal.exec(r[0])) == null ? void 0 : t[0]) != null ? n : "";
				while (s !== r[0]);
				i = r[0], r[1] === "www." ? a = "http://" + r[0] : a = r[0];
			}
			return {
				type: "link",
				raw: r[0],
				text: i,
				href: a,
				tokens: [{
					type: "text",
					raw: i,
					text: i
				}]
			};
		}
	}
	inlineText(e) {
		let r = this.rules.inline.text.exec(e);
		if (r) {
			let t = this.lexer.state.inRawBlock;
			return {
				type: "text",
				raw: r[0],
				text: r[0],
				escaped: t
			};
		}
	}
};
var wr = class Lu {
	constructor(r) {
		ot(this, "tokens"), ot(this, "options"), ot(this, "state"), ot(this, "inlineQueue"), ot(this, "tokenizer"), this.tokens = [], this.tokens.links = Object.create(null), this.options = r || Zn, this.options.tokenizer = this.options.tokenizer || new Hs(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
			inLink: !1,
			inRawBlock: !1,
			top: !0
		};
		let t = {
			other: zt,
			block: Bs.normal,
			inline: ya.normal
		};
		this.options.pedantic ? (t.block = Bs.pedantic, t.inline = ya.pedantic) : this.options.gfm && (t.block = Bs.gfm, this.options.breaks ? t.inline = ya.breaks : t.inline = ya.gfm), this.tokenizer.rules = t;
	}
	static get rules() {
		return {
			block: Bs,
			inline: ya
		};
	}
	static lex(r, t) {
		return new Lu(t).lex(r);
	}
	static lexInline(r, t) {
		return new Lu(t).inlineTokens(r);
	}
	lex(r) {
		r = r.replace(zt.carriageReturn, `
`), this.blockTokens(r, this.tokens);
		for (let t = 0; t < this.inlineQueue.length; t++) {
			let n = this.inlineQueue[t];
			this.inlineTokens(n.src, n.tokens);
		}
		return this.inlineQueue = [], this.tokens;
	}
	blockTokens(r, t = [], n = !1) {
		var a, s, u;
		this.tokenizer.lexer = this, this.options.pedantic && (r = r.replace(zt.tabCharGlobal, "    ").replace(zt.spaceLine, ""));
		let i = Infinity;
		for (; r;) {
			if (r.length < i) i = r.length;
			else {
				this.infiniteLoopError(r.charCodeAt(0));
				break;
			}
			let c;
			if ((s = (a = this.options.extensions) == null ? void 0 : a.block) != null && s.some((l) => (c = l.call({ lexer: this }, r, t)) ? (r = r.substring(c.raw.length), t.push(c), !0) : !1)) continue;
			if (c = this.tokenizer.space(r)) {
				r = r.substring(c.raw.length);
				let l = t.at(-1);
				c.raw.length === 1 && l !== void 0 ? l.raw += `
` : t.push(c);
				continue;
			}
			if (c = this.tokenizer.code(r)) {
				r = r.substring(c.raw.length);
				let l = t.at(-1);
				(l == null ? void 0 : l.type) === "paragraph" || (l == null ? void 0 : l.type) === "text" ? (l.raw += (l.raw.endsWith(`
`) ? "" : `
`) + c.raw, l.text += `
` + c.text, this.inlineQueue.at(-1).src = l.text) : t.push(c);
				continue;
			}
			if (c = this.tokenizer.fences(r)) {
				r = r.substring(c.raw.length), t.push(c);
				continue;
			}
			if (c = this.tokenizer.heading(r)) {
				r = r.substring(c.raw.length), t.push(c);
				continue;
			}
			if (c = this.tokenizer.hr(r)) {
				r = r.substring(c.raw.length), t.push(c);
				continue;
			}
			if (c = this.tokenizer.blockquote(r)) {
				r = r.substring(c.raw.length), t.push(c);
				continue;
			}
			if (c = this.tokenizer.list(r)) {
				r = r.substring(c.raw.length), t.push(c);
				continue;
			}
			if (c = this.tokenizer.html(r)) {
				r = r.substring(c.raw.length), t.push(c);
				continue;
			}
			if (c = this.tokenizer.def(r)) {
				r = r.substring(c.raw.length);
				let l = t.at(-1);
				(l == null ? void 0 : l.type) === "paragraph" || (l == null ? void 0 : l.type) === "text" ? (l.raw += (l.raw.endsWith(`
`) ? "" : `
`) + c.raw, l.text += `
` + c.raw, this.inlineQueue.at(-1).src = l.text) : this.tokens.links[c.tag] || (this.tokens.links[c.tag] = {
					href: c.href,
					title: c.title
				}, t.push(c));
				continue;
			}
			if (c = this.tokenizer.table(r)) {
				r = r.substring(c.raw.length), t.push(c);
				continue;
			}
			if (c = this.tokenizer.lheading(r)) {
				r = r.substring(c.raw.length), t.push(c);
				continue;
			}
			let o = r;
			if ((u = this.options.extensions) != null && u.startBlock) {
				let l = Infinity, d = r.slice(1), p;
				this.options.extensions.startBlock.forEach((h) => {
					p = h.call({ lexer: this }, d), typeof p == "number" && p >= 0 && (l = Math.min(l, p));
				}), l < Infinity && l >= 0 && (o = r.substring(0, l + 1));
			}
			if (this.state.top && (c = this.tokenizer.paragraph(o))) {
				let l = t.at(-1);
				n && (l == null ? void 0 : l.type) === "paragraph" ? (l.raw += (l.raw.endsWith(`
`) ? "" : `
`) + c.raw, l.text += `
` + c.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = l.text) : t.push(c), n = o.length !== r.length, r = r.substring(c.raw.length);
				continue;
			}
			if (c = this.tokenizer.text(r)) {
				r = r.substring(c.raw.length);
				let l = t.at(-1);
				(l == null ? void 0 : l.type) === "text" ? (l.raw += (l.raw.endsWith(`
`) ? "" : `
`) + c.raw, l.text += `
` + c.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = l.text) : t.push(c);
				continue;
			}
			if (r) {
				this.infiniteLoopError(r.charCodeAt(0));
				break;
			}
		}
		return this.state.top = !0, t;
	}
	inline(r, t = []) {
		return this.inlineQueue.push({
			src: r,
			tokens: t
		}), t;
	}
	inlineTokens(r, t = []) {
		var o, l, d, p, h, A;
		this.tokenizer.lexer = this;
		let n = r, i = null;
		if (this.tokens.links) {
			let f = Object.keys(this.tokens.links);
			if (f.length > 0) for (; (i = this.tokenizer.rules.inline.reflinkSearch.exec(n)) !== null;) f.includes(i[0].slice(i[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
		}
		for (; (i = this.tokenizer.rules.inline.anyPunctuation.exec(n)) !== null;) n = n.slice(0, i.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
		let a;
		for (; (i = this.tokenizer.rules.inline.blockSkip.exec(n)) !== null;) a = i[2] ? i[2].length : 0, n = n.slice(0, i.index + a) + "[" + "a".repeat(i[0].length - a - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
		n = (d = (l = (o = this.options.hooks) == null ? void 0 : o.emStrongMask) == null ? void 0 : l.call({ lexer: this }, n)) != null ? d : n;
		let s = !1, u = "", c = Infinity;
		for (; r;) {
			if (r.length < c) c = r.length;
			else {
				this.infiniteLoopError(r.charCodeAt(0));
				break;
			}
			s || (u = ""), s = !1;
			let f;
			if ((h = (p = this.options.extensions) == null ? void 0 : p.inline) != null && h.some((_) => (f = _.call({ lexer: this }, r, t)) ? (r = r.substring(f.raw.length), t.push(f), !0) : !1)) continue;
			if (f = this.tokenizer.escape(r)) {
				r = r.substring(f.raw.length), t.push(f);
				continue;
			}
			if (f = this.tokenizer.tag(r)) {
				r = r.substring(f.raw.length), t.push(f);
				continue;
			}
			if (f = this.tokenizer.link(r)) {
				r = r.substring(f.raw.length), t.push(f);
				continue;
			}
			if (f = this.tokenizer.reflink(r, this.tokens.links)) {
				r = r.substring(f.raw.length);
				let _ = t.at(-1);
				f.type === "text" && (_ == null ? void 0 : _.type) === "text" ? (_.raw += f.raw, _.text += f.text) : t.push(f);
				continue;
			}
			if (f = this.tokenizer.emStrong(r, n, u)) {
				r = r.substring(f.raw.length), t.push(f);
				continue;
			}
			if (f = this.tokenizer.codespan(r)) {
				r = r.substring(f.raw.length), t.push(f);
				continue;
			}
			if (f = this.tokenizer.br(r)) {
				r = r.substring(f.raw.length), t.push(f);
				continue;
			}
			if (f = this.tokenizer.del(r, n, u)) {
				r = r.substring(f.raw.length), t.push(f);
				continue;
			}
			if (f = this.tokenizer.autolink(r)) {
				r = r.substring(f.raw.length), t.push(f);
				continue;
			}
			if (!this.state.inLink && (f = this.tokenizer.url(r))) {
				r = r.substring(f.raw.length), t.push(f);
				continue;
			}
			let g = r;
			if ((A = this.options.extensions) != null && A.startInline) {
				let _ = Infinity, v = r.slice(1), b;
				this.options.extensions.startInline.forEach((C) => {
					b = C.call({ lexer: this }, v), typeof b == "number" && b >= 0 && (_ = Math.min(_, b));
				}), _ < Infinity && _ >= 0 && (g = r.substring(0, _ + 1));
			}
			if (f = this.tokenizer.inlineText(g)) {
				r = r.substring(f.raw.length), f.raw.slice(-1) !== "_" && (u = f.raw.slice(-1)), s = !0;
				let _ = t.at(-1);
				(_ == null ? void 0 : _.type) === "text" ? (_.raw += f.raw, _.text += f.text) : t.push(f);
				continue;
			}
			if (r) {
				this.infiniteLoopError(r.charCodeAt(0));
				break;
			}
		}
		return t;
	}
	infiniteLoopError(r) {
		let t = "Infinite loop on byte: " + r;
		if (this.options.silent) console.error(t);
		else throw new Error(t);
	}
};
var Zs = class {
	constructor(e) {
		ot(this, "options"), ot(this, "parser"), this.options = e || Zn;
	}
	space(e) {
		return "";
	}
	code({ text: e, lang: r, escaped: t }) {
		var a;
		let n = (a = (r || "").match(zt.notSpaceStart)) == null ? void 0 : a[0], i = e.replace(zt.endingNewline, "") + `
`;
		return n ? "<pre><code class=\"language-" + Nr(n) + "\">" + (t ? i : Nr(i, !0)) + `</code></pre>
` : "<pre><code>" + (t ? i : Nr(i, !0)) + `</code></pre>
`;
	}
	blockquote({ tokens: e }) {
		return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
	}
	html({ text: e }) {
		return e;
	}
	def(e) {
		return "";
	}
	heading({ tokens: e, depth: r }) {
		return `<h${r}>${this.parser.parseInline(e)}</h${r}>
`;
	}
	hr(e) {
		return `<hr>
`;
	}
	list(e) {
		let r = e.ordered, t = e.start, n = "";
		for (let s = 0; s < e.items.length; s++) {
			let u = e.items[s];
			n += this.listitem(u);
		}
		let i = r ? "ol" : "ul", a = r && t !== 1 ? " start=\"" + t + "\"" : "";
		return "<" + i + a + `>
` + n + "</" + i + `>
`;
	}
	listitem(e) {
		return `<li>${this.parser.parse(e.tokens)}</li>
`;
	}
	checkbox({ checked: e }) {
		return "<input " + (e ? "checked=\"\" " : "") + "disabled=\"\" type=\"checkbox\"> ";
	}
	paragraph({ tokens: e }) {
		return `<p>${this.parser.parseInline(e)}</p>
`;
	}
	table(e) {
		let r = "", t = "";
		for (let i = 0; i < e.header.length; i++) t += this.tablecell(e.header[i]);
		r += this.tablerow({ text: t });
		let n = "";
		for (let i = 0; i < e.rows.length; i++) {
			let a = e.rows[i];
			t = "";
			for (let s = 0; s < a.length; s++) t += this.tablecell(a[s]);
			n += this.tablerow({ text: t });
		}
		return n && (n = `<tbody>${n}</tbody>`), `<table>
<thead>
` + r + `</thead>
` + n + `</table>
`;
	}
	tablerow({ text: e }) {
		return `<tr>
${e}</tr>
`;
	}
	tablecell(e) {
		let r = this.parser.parseInline(e.tokens), t = e.header ? "th" : "td";
		return (e.align ? `<${t} align="${e.align}">` : `<${t}>`) + r + `</${t}>
`;
	}
	strong({ tokens: e }) {
		return `<strong>${this.parser.parseInline(e)}</strong>`;
	}
	em({ tokens: e }) {
		return `<em>${this.parser.parseInline(e)}</em>`;
	}
	codespan({ text: e }) {
		return `<code>${Nr(e, !0)}</code>`;
	}
	br(e) {
		return "<br>";
	}
	del({ tokens: e }) {
		return `<del>${this.parser.parseInline(e)}</del>`;
	}
	link({ href: e, title: r, tokens: t }) {
		let n = this.parser.parseInline(t), i = Lf(e);
		if (i === null) return n;
		e = i;
		let a = "<a href=\"" + e + "\"";
		return r && (a += " title=\"" + Nr(r) + "\""), a += ">" + n + "</a>", a;
	}
	image({ href: e, title: r, text: t, tokens: n }) {
		n && (t = this.parser.parseInline(n, this.parser.textRenderer));
		let i = Lf(e);
		if (i === null) return Nr(t);
		e = i;
		let a = `<img src="${e}" alt="${Nr(t)}"`;
		return r && (a += ` title="${Nr(r)}"`), a += ">", a;
	}
	text(e) {
		return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : Nr(e.text);
	}
};
var tl = class {
	strong({ text: e }) {
		return e;
	}
	em({ text: e }) {
		return e;
	}
	codespan({ text: e }) {
		return e;
	}
	del({ text: e }) {
		return e;
	}
	html({ text: e }) {
		return e;
	}
	text({ text: e }) {
		return e;
	}
	link({ text: e }) {
		return "" + e;
	}
	image({ text: e }) {
		return "" + e;
	}
	br() {
		return "";
	}
	checkbox({ raw: e }) {
		return e;
	}
};
var vr = class Pu {
	constructor(r) {
		ot(this, "options"), ot(this, "renderer"), ot(this, "textRenderer"), this.options = r || Zn, this.options.renderer = this.options.renderer || new Zs(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new tl();
	}
	static parse(r, t) {
		return new Pu(t).parse(r);
	}
	static parseInline(r, t) {
		return new Pu(t).parseInline(r);
	}
	parse(r) {
		var n, i;
		this.renderer.parser = this;
		let t = "";
		for (let a = 0; a < r.length; a++) {
			let s = r[a];
			if ((i = (n = this.options.extensions) == null ? void 0 : n.renderers) != null && i[s.type]) {
				let c = s, o = this.options.extensions.renderers[c.type].call({ parser: this }, c);
				if (o !== !1 || ![
					"space",
					"hr",
					"heading",
					"code",
					"table",
					"blockquote",
					"list",
					"html",
					"def",
					"paragraph",
					"text"
				].includes(c.type)) {
					t += o || "";
					continue;
				}
			}
			let u = s;
			switch (u.type) {
				case "space":
					t += this.renderer.space(u);
					break;
				case "hr":
					t += this.renderer.hr(u);
					break;
				case "heading":
					t += this.renderer.heading(u);
					break;
				case "code":
					t += this.renderer.code(u);
					break;
				case "table":
					t += this.renderer.table(u);
					break;
				case "blockquote":
					t += this.renderer.blockquote(u);
					break;
				case "list":
					t += this.renderer.list(u);
					break;
				case "checkbox":
					t += this.renderer.checkbox(u);
					break;
				case "html":
					t += this.renderer.html(u);
					break;
				case "def":
					t += this.renderer.def(u);
					break;
				case "paragraph":
					t += this.renderer.paragraph(u);
					break;
				case "text":
					t += this.renderer.text(u);
					break;
				default: {
					let c = "Token with \"" + u.type + "\" type was not found.";
					if (this.options.silent) return console.error(c), "";
					throw new Error(c);
				}
			}
		}
		return t;
	}
	parseInline(r, t = this.renderer) {
		var i, a;
		this.renderer.parser = this;
		let n = "";
		for (let s = 0; s < r.length; s++) {
			let u = r[s];
			if ((a = (i = this.options.extensions) == null ? void 0 : i.renderers) != null && a[u.type]) {
				let o = this.options.extensions.renderers[u.type].call({ parser: this }, u);
				if (o !== !1 || ![
					"escape",
					"html",
					"link",
					"image",
					"strong",
					"em",
					"codespan",
					"br",
					"del",
					"text"
				].includes(u.type)) {
					n += o || "";
					continue;
				}
			}
			let c = u;
			switch (c.type) {
				case "escape":
					n += t.text(c);
					break;
				case "html":
					n += t.html(c);
					break;
				case "link":
					n += t.link(c);
					break;
				case "image":
					n += t.image(c);
					break;
				case "checkbox":
					n += t.checkbox(c);
					break;
				case "strong":
					n += t.strong(c);
					break;
				case "em":
					n += t.em(c);
					break;
				case "codespan":
					n += t.codespan(c);
					break;
				case "br":
					n += t.br(c);
					break;
				case "del":
					n += t.del(c);
					break;
				case "text":
					n += t.text(c);
					break;
				default: {
					let o = "Token with \"" + c.type + "\" type was not found.";
					if (this.options.silent) return console.error(o), "";
					throw new Error(o);
				}
			}
		}
		return n;
	}
};
var Ns;
var Ia = (Ns = class {
	constructor(e) {
		ot(this, "options"), ot(this, "block"), this.options = e || Zn;
	}
	preprocess(e) {
		return e;
	}
	postprocess(e) {
		return e;
	}
	processAllTokens(e) {
		return e;
	}
	emStrongMask(e) {
		return e;
	}
	provideLexer(e = this.block) {
		return e ? wr.lex : wr.lexInline;
	}
	provideParser(e = this.block) {
		return e ? vr.parse : vr.parseInline;
	}
}, ot(Ns, "passThroughHooks", /* @__PURE__ */ new Set([
	"preprocess",
	"postprocess",
	"processAllTokens",
	"emStrongMask"
])), ot(Ns, "passThroughHooksRespectAsync", /* @__PURE__ */ new Set([
	"preprocess",
	"postprocess",
	"processAllTokens"
])), Ns);
var $b = class {
	constructor(...e) {
		ot(this, "defaults", Ku()), ot(this, "options", this.setOptions), ot(this, "parse", this.parseMarkdown(!0)), ot(this, "parseInline", this.parseMarkdown(!1)), ot(this, "Parser", vr), ot(this, "Renderer", Zs), ot(this, "TextRenderer", tl), ot(this, "Lexer", wr), ot(this, "Tokenizer", Hs), ot(this, "Hooks", Ia), this.use(...e);
	}
	walkTokens(e, r) {
		var n, i;
		let t = [];
		for (let a of e) switch (t = t.concat(r.call(this, a)), a.type) {
			case "table": {
				let s = a;
				for (let u of s.header) t = t.concat(this.walkTokens(u.tokens, r));
				for (let u of s.rows) for (let c of u) t = t.concat(this.walkTokens(c.tokens, r));
				break;
			}
			case "list": {
				let s = a;
				t = t.concat(this.walkTokens(s.items, r));
				break;
			}
			default: {
				let s = a;
				(i = (n = this.defaults.extensions) == null ? void 0 : n.childTokens) != null && i[s.type] ? this.defaults.extensions.childTokens[s.type].forEach((u) => {
					let c = s[u].flat(Infinity);
					t = t.concat(this.walkTokens(c, r));
				}) : s.tokens && (t = t.concat(this.walkTokens(s.tokens, r)));
			}
		}
		return t;
	}
	use(...e) {
		let r = this.defaults.extensions || {
			renderers: {},
			childTokens: {}
		};
		return e.forEach((t) => {
			let n = ht({}, t);
			if (n.async = this.defaults.async || n.async || !1, t.extensions && (t.extensions.forEach((i) => {
				if (!i.name) throw new Error("extension name required");
				if ("renderer" in i) {
					let a = r.renderers[i.name];
					a ? r.renderers[i.name] = function(...s) {
						let u = i.renderer.apply(this, s);
						return u === !1 && (u = a.apply(this, s)), u;
					} : r.renderers[i.name] = i.renderer;
				}
				if ("tokenizer" in i) {
					if (!i.level || i.level !== "block" && i.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
					let a = r[i.level];
					a ? a.unshift(i.tokenizer) : r[i.level] = [i.tokenizer], i.start && (i.level === "block" ? r.startBlock ? r.startBlock.push(i.start) : r.startBlock = [i.start] : i.level === "inline" && (r.startInline ? r.startInline.push(i.start) : r.startInline = [i.start]));
				}
				"childTokens" in i && i.childTokens && (r.childTokens[i.name] = i.childTokens);
			}), n.extensions = r), t.renderer) {
				let i = this.defaults.renderer || new Zs(this.defaults);
				for (let a in t.renderer) {
					if (!(a in i)) throw new Error(`renderer '${a}' does not exist`);
					if (["options", "parser"].includes(a)) continue;
					let s = a, u = t.renderer[s], c = i[s];
					i[s] = (...o) => {
						let l = u.apply(i, o);
						return l === !1 && (l = c.apply(i, o)), l || "";
					};
				}
				n.renderer = i;
			}
			if (t.tokenizer) {
				let i = this.defaults.tokenizer || new Hs(this.defaults);
				for (let a in t.tokenizer) {
					if (!(a in i)) throw new Error(`tokenizer '${a}' does not exist`);
					if ([
						"options",
						"rules",
						"lexer"
					].includes(a)) continue;
					let s = a, u = t.tokenizer[s], c = i[s];
					i[s] = (...o) => {
						let l = u.apply(i, o);
						return l === !1 && (l = c.apply(i, o)), l;
					};
				}
				n.tokenizer = i;
			}
			if (t.hooks) {
				let i = this.defaults.hooks || new Ia();
				for (let a in t.hooks) {
					if (!(a in i)) throw new Error(`hook '${a}' does not exist`);
					if (["options", "block"].includes(a)) continue;
					let s = a, u = t.hooks[s], c = i[s];
					Ia.passThroughHooks.has(a) ? i[s] = (o) => {
						if (this.defaults.async && Ia.passThroughHooksRespectAsync.has(a)) return (async () => {
							let d = await u.call(i, o);
							return c.call(i, d);
						})();
						let l = u.call(i, o);
						return c.call(i, l);
					} : i[s] = (...o) => {
						if (this.defaults.async) return (async () => {
							let d = await u.apply(i, o);
							return d === !1 && (d = await c.apply(i, o)), d;
						})();
						let l = u.apply(i, o);
						return l === !1 && (l = c.apply(i, o)), l;
					};
				}
				n.hooks = i;
			}
			if (t.walkTokens) {
				let i = this.defaults.walkTokens, a = t.walkTokens;
				n.walkTokens = function(s) {
					let u = [];
					return u.push(a.call(this, s)), i && (u = u.concat(i.call(this, s))), u;
				};
			}
			this.defaults = ht(ht({}, this.defaults), n);
		}), this;
	}
	setOptions(e) {
		return this.defaults = ht(ht({}, this.defaults), e), this;
	}
	lexer(e, r) {
		return wr.lex(e, r != null ? r : this.defaults);
	}
	parser(e, r) {
		return vr.parse(e, r != null ? r : this.defaults);
	}
	parseMarkdown(e) {
		return (r, t) => {
			let n = ht({}, t), i = ht(ht({}, this.defaults), n), a = this.onError(!!i.silent, !!i.async);
			if (this.defaults.async === !0 && n.async === !1) return a(/* @__PURE__ */ new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
			if (typeof r > "u" || r === null) return a(/* @__PURE__ */ new Error("marked(): input parameter is undefined or null"));
			if (typeof r != "string") return a(/* @__PURE__ */ new Error("marked(): input parameter is of type " + Object.prototype.toString.call(r) + ", string expected"));
			if (i.hooks && (i.hooks.options = i, i.hooks.block = e), i.async) return (async () => {
				let s = i.hooks ? await i.hooks.preprocess(r) : r, u = await (i.hooks ? await i.hooks.provideLexer(e) : e ? wr.lex : wr.lexInline)(s, i), c = i.hooks ? await i.hooks.processAllTokens(u) : u;
				i.walkTokens && await Promise.all(this.walkTokens(c, i.walkTokens));
				let o = await (i.hooks ? await i.hooks.provideParser(e) : e ? vr.parse : vr.parseInline)(c, i);
				return i.hooks ? await i.hooks.postprocess(o) : o;
			})().catch(a);
			try {
				i.hooks && (r = i.hooks.preprocess(r));
				let s = (i.hooks ? i.hooks.provideLexer(e) : e ? wr.lex : wr.lexInline)(r, i);
				i.hooks && (s = i.hooks.processAllTokens(s)), i.walkTokens && this.walkTokens(s, i.walkTokens);
				let u = (i.hooks ? i.hooks.provideParser(e) : e ? vr.parse : vr.parseInline)(s, i);
				return i.hooks && (u = i.hooks.postprocess(u)), u;
			} catch (s) {
				return a(s);
			}
		};
	}
	onError(e, r) {
		return (t) => {
			if (t.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
				let n = "<p>An error occurred:</p><pre>" + Nr(t.message + "", !0) + "</pre>";
				return r ? Promise.resolve(n) : n;
			}
			if (r) return Promise.reject(t);
			throw t;
		};
	}
};
var zn = new $b();
function ct(e, r) {
	return zn.parse(e, r);
}
ct.options = ct.setOptions = function(e) {
	return zn.setOptions(e), ct.defaults = zn.defaults, pp(ct.defaults), ct;
};
ct.getDefaults = Ku;
ct.defaults = Zn;
ct.use = function(...e) {
	return zn.use(...e), ct.defaults = zn.defaults, pp(ct.defaults), ct;
};
ct.walkTokens = function(e, r) {
	return zn.walkTokens(e, r);
};
ct.parseInline = zn.parseInline;
ct.Parser = vr;
ct.parser = vr.parse;
ct.Renderer = Zs;
ct.TextRenderer = tl;
ct.Lexer = wr;
ct.lexer = wr.lex;
ct.Tokenizer = Hs;
ct.Hooks = Ia;
ct.parse = ct;
ct.options;
ct.setOptions;
ct.use;
ct.walkTokens;
ct.parseInline;
vr.parse;
wr.lex;
var zf;
(function(e) {
	e[e.VALUE_LENGTH = 49152] = "VALUE_LENGTH", e[e.FLAG13 = 8192] = "FLAG13", e[e.BRANCH_LENGTH = 8064] = "BRANCH_LENGTH", e[e.JUMP_TABLE = 127] = "JUMP_TABLE";
})(zf || (zf = {}));
var Hf;
(function(e) {
	e[e.NUM = 35] = "NUM", e[e.SEMI = 59] = "SEMI", e[e.EQUALS = 61] = "EQUALS", e[e.ZERO = 48] = "ZERO", e[e.NINE = 57] = "NINE", e[e.LOWER_A = 97] = "LOWER_A", e[e.LOWER_F = 102] = "LOWER_F", e[e.LOWER_X = 120] = "LOWER_X", e[e.LOWER_Z = 122] = "LOWER_Z", e[e.UPPER_A = 65] = "UPPER_A", e[e.UPPER_F = 70] = "UPPER_F", e[e.UPPER_Z = 90] = "UPPER_Z";
})(Hf || (Hf = {}));
var Zf;
(function(e) {
	e[e.EntityStart = 0] = "EntityStart", e[e.NumericStart = 1] = "NumericStart", e[e.NumericDecimal = 2] = "NumericDecimal", e[e.NumericHex = 3] = "NumericHex", e[e.NamedEntity = 4] = "NamedEntity";
})(Zf || (Zf = {}));
var Wf;
(function(e) {
	e[e.Legacy = 0] = "Legacy", e[e.Strict = 1] = "Strict", e[e.Attribute = 2] = "Attribute";
})(Wf || (Wf = {}));
var Gf;
(function(e) {
	e[e.Tab = 9] = "Tab", e[e.NewLine = 10] = "NewLine", e[e.FormFeed = 12] = "FormFeed", e[e.CarriageReturn = 13] = "CarriageReturn", e[e.Space = 32] = "Space", e[e.ExclamationMark = 33] = "ExclamationMark", e[e.Number = 35] = "Number", e[e.Amp = 38] = "Amp", e[e.SingleQuote = 39] = "SingleQuote", e[e.DoubleQuote = 34] = "DoubleQuote", e[e.Dash = 45] = "Dash", e[e.Slash = 47] = "Slash", e[e.Zero = 48] = "Zero", e[e.Nine = 57] = "Nine", e[e.Semi = 59] = "Semi", e[e.Lt = 60] = "Lt", e[e.Eq = 61] = "Eq", e[e.Gt = 62] = "Gt", e[e.Questionmark = 63] = "Questionmark", e[e.UpperA = 65] = "UpperA", e[e.LowerA = 97] = "LowerA", e[e.UpperF = 70] = "UpperF", e[e.LowerF = 102] = "LowerF", e[e.UpperZ = 90] = "UpperZ", e[e.LowerZ = 122] = "LowerZ", e[e.LowerX = 120] = "LowerX", e[e.OpeningSquareBracket = 91] = "OpeningSquareBracket";
})(Gf || (Gf = {}));
var Qf;
(function(e) {
	e[e.Text = 1] = "Text", e[e.BeforeTagName = 2] = "BeforeTagName", e[e.InTagName = 3] = "InTagName", e[e.InSelfClosingTag = 4] = "InSelfClosingTag", e[e.BeforeClosingTagName = 5] = "BeforeClosingTagName", e[e.InClosingTagName = 6] = "InClosingTagName", e[e.AfterClosingTagName = 7] = "AfterClosingTagName", e[e.BeforeAttributeName = 8] = "BeforeAttributeName", e[e.InAttributeName = 9] = "InAttributeName", e[e.AfterAttributeName = 10] = "AfterAttributeName", e[e.BeforeAttributeValue = 11] = "BeforeAttributeValue", e[e.InAttributeValueDq = 12] = "InAttributeValueDq", e[e.InAttributeValueSq = 13] = "InAttributeValueSq", e[e.InAttributeValueNq = 14] = "InAttributeValueNq", e[e.BeforeDeclaration = 15] = "BeforeDeclaration", e[e.InDeclaration = 16] = "InDeclaration", e[e.InProcessingInstruction = 17] = "InProcessingInstruction", e[e.BeforeComment = 18] = "BeforeComment", e[e.CDATASequence = 19] = "CDATASequence", e[e.DeclarationSequence = 20] = "DeclarationSequence", e[e.InSpecialComment = 21] = "InSpecialComment", e[e.InCommentLike = 22] = "InCommentLike", e[e.SpecialStartSequence = 23] = "SpecialStartSequence", e[e.InSpecialTag = 24] = "InSpecialTag", e[e.InPlainText = 25] = "InPlainText", e[e.InEntity = 26] = "InEntity";
})(Qf || (Qf = {}));
var Yf;
(function(e) {
	e[e.NoValue = 0] = "NoValue", e[e.Unquoted = 1] = "Unquoted", e[e.Single = 2] = "Single", e[e.Double = 3] = "Double";
})(Yf || (Yf = {}));
var fr = {
	Empty: /* @__PURE__ */ new Uint8Array(0),
	Cdata: new Uint8Array([
		67,
		68,
		65,
		84,
		65,
		91
	]),
	CdataEnd: new Uint8Array([
		93,
		93,
		62
	]),
	CommentEnd: new Uint8Array([
		45,
		45,
		33,
		62
	]),
	Doctype: new Uint8Array([
		100,
		111,
		99,
		116,
		121,
		112,
		101
	]),
	IframeEnd: new Uint8Array([
		60,
		47,
		105,
		102,
		114,
		97,
		109,
		101
	]),
	NoembedEnd: new Uint8Array([
		60,
		47,
		110,
		111,
		101,
		109,
		98,
		101,
		100
	]),
	NoframesEnd: new Uint8Array([
		60,
		47,
		110,
		111,
		102,
		114,
		97,
		109,
		101,
		115
	]),
	Plaintext: new Uint8Array([
		60,
		47,
		112,
		108,
		97,
		105,
		110,
		116,
		101,
		120,
		116
	]),
	ScriptEnd: new Uint8Array([
		60,
		47,
		115,
		99,
		114,
		105,
		112,
		116
	]),
	StyleEnd: new Uint8Array([
		60,
		47,
		115,
		116,
		121,
		108,
		101
	]),
	TitleEnd: new Uint8Array([
		60,
		47,
		116,
		105,
		116,
		108,
		101
	]),
	TextareaEnd: new Uint8Array([
		60,
		47,
		116,
		101,
		120,
		116,
		97,
		114,
		101,
		97
	]),
	XmpEnd: new Uint8Array([
		60,
		47,
		120,
		109,
		112
	])
};
fr.IframeEnd[2], fr.IframeEnd, fr.NoembedEnd[2], fr.NoembedEnd, fr.Plaintext[2], fr.Plaintext, fr.ScriptEnd[2], fr.ScriptEnd, fr.TitleEnd[2], fr.TitleEnd, fr.XmpEnd[2], fr.XmpEnd;
var { fromCodePoint: HE } = String;
var Kf;
(function(e) {
	e[e.None = 0] = "None", e[e.Svg = 1] = "Svg", e[e.MathML = 2] = "MathML";
})(Kf || (Kf = {}));
var xu = class extends Error {
	constructor(e) {
		super(e), this.name = "HwpUnsupportedError";
	}
};
var Jb = class extends Error {
	constructor() {
		super("암호화된 HWP 문서는 현재 지원하지 않습니다."), this.name = "HwpEncryptedError";
	}
};
var Vb = class extends Error {
	constructor(e = "유효한 HWP 5.0 파일이 아닙니다.") {
		super(e), this.name = "HwpInvalidFormatError";
	}
};
function Xb(e) {
	if (e.byteLength >= 8) {
		if (e[0] === 208 && e[1] === 207 && e[2] === 17 && e[3] === 224 && e[4] === 161 && e[5] === 177 && e[6] === 26 && e[7] === 225) return "hwp";
		if (e[0] === 80 && e[1] === 75 && e[2] === 3 && e[3] === 4) return "hwpx";
	}
	return e.byteLength >= 17 && String.fromCharCode(...e.subarray(0, 17)) === "HWP Document File" ? "hwp3" : "unknown";
}
function xp(e) {
	let r = Xb(e);
	if (r === "hwp3") throw new xu("HWP 3.0 포맷은 지원하지 않습니다. 한컴오피스/LibreOffice 에서 HWP 5.0 으로 다시 저장해 주세요.");
	if (r !== "hwp") throw new Vb(`HWP 5.0(CFB) \uC2DC\uADF8\uB2C8\uCC98\uAC00 \uC544\uB2D9\uB2C8\uB2E4 (\uAC10\uC9C0: ${r}).`);
	let t = new jw(e), i = c2(t.readFileHeader());
	if (i.flags.encrypted) throw new Jb();
	if (!u2(i.version)) throw new xu(`\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 HWP \uBC84\uC804: ${o2(i.version)} (5.0 ~ 5.1 \uC9C0\uC6D0)`);
	if (i.flags.distribution) throw new xu("배포용 문서(ViewText)는 현재 지원하지 않습니다. 일반 HWP 로 저장 후 시도해 주세요.");
	let a = i.flags.compressed, { docInfo: u } = Rv(t.readDocInfo(a)), c = t.sectionCount(!1), o = [];
	for (let d = 0; d < c; d++) {
		let p = t.readBodySection(d, a, !1);
		if (p) try {
			o.push(rb(p));
		} catch (h) {
			o.push({ paragraphs: [] });
		}
	}
	return {
		header: i,
		docInfo: u,
		sections: o,
		binData: lb(t, u.binData)
	};
}
var Si = {
	maxUncompressedBytes: 268435456,
	maxCompressionRatio: 200,
	maxEntries: 25e3,
	maxRecords: 25e4
};
var uy = [
	208,
	207,
	17,
	224,
	161,
	177,
	26,
	225
];
var ly = "HWP Document File";
var hy = 67;
var sl = (e) => new Uint8Array(e);
var cy = (e) => uy.every((r, t) => e[t] === r);
var fy = (e) => e[0] === 80 && e[1] === 75;
var Vs = (e) => Uint8Array.from(e);
var Qa = (e) => (e.localName || e.nodeName).split(":").pop().toLowerCase();
var eo = (e, r) => Array.from(e.childNodes).filter((t) => t.nodeType === 1).filter((t) => !r || Qa(t) === r);
var ft = (e, r) => {
	let t = [], n = (i) => eo(i).forEach((a) => {
		Qa(a) === r && t.push(a), n(a);
	});
	return n(e), t;
};
var dy = (e, r) => {
	let t = e.parentNode;
	for (; t;) {
		if (t.nodeType === 1 && r.has(Qa(t))) return !0;
		t = t.parentNode;
	}
	return !1;
};
var ol = (e, r) => {
	let t = e.parentNode;
	for (; t;) {
		if (t.nodeType === 1 && Qa(t) === r) return t;
		t = t.parentNode;
	}
};
var py = (e) => ((e == null ? void 0 : e.textContent) || "").replace(/[\t\r ]+/g, " ").replace(/\n{3,}/g, `

`).trim();
var ll = (e) => ((e == null ? void 0 : e.textContent) || "").replace(/[\t\r\n ]+/g, " ");
var Ri = (e) => e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
var Ay = (e) => e.replace(/[;{}<>]/g, "").trim();
var It = (e) => {
	let r = Number(e);
	return Number.isFinite(r) && r >= 0 ? r : void 0;
};
var Et = (e) => e / 75;
var zp = (e, r) => {
	let t = [], n = (i) => eo(i).forEach((a) => {
		let s = Qa(a);
		if (!r.has(s)) {
			if (s === "t") {
				let u = ll(a);
				u && t.push(u);
				return;
			}
			n(a);
		}
	});
	return n(e), t.join("").replace(/\s+/g, " ").trim();
};
var Xs = (e, r) => ft(e.documentElement, r).flatMap((t) => ft(t, "p")).map((t) => zp(t, /* @__PURE__ */ new Set(["tbl"]))).filter(Boolean);
var gy = (e) => {
	let r = /* @__PURE__ */ new Map(), t = /* @__PURE__ */ new Map();
	return ft(e.documentElement, "charpr").forEach((n) => {
		var p, h;
		let i = n.getAttribute("id");
		if (i == null) return;
		let a = [], s = It(n.getAttribute("height")), u = n.getAttribute("textColor"), c = n.getAttribute("shadeColor");
		s && a.push(`font-size:${Math.max(1, s / 100)}pt`), u && /^#[0-9a-f]{6}$/i.test(u) && a.push(`color:${u}`), c && /^#[0-9a-f]{6}$/i.test(c) && a.push(`background-color:${c}`), ft(n, "bold").length && a.push("font-weight:700"), ft(n, "italic").length && a.push("font-style:italic");
		let o = ft(n, "underline")[0], l = ft(n, "strikeout")[0], d = [];
		o && ((p = o.getAttribute("type")) == null ? void 0 : p.toUpperCase()) !== "NONE" && d.push("underline"), l && ((h = l.getAttribute("shape")) == null ? void 0 : h.toUpperCase()) !== "NONE" && d.push("line-through"), d.length && a.push(`text-decoration:${d.join(" ")}`), r.set(i, a.join(";"));
	}), ft(e.documentElement, "parapr").forEach((n) => {
		var A, f;
		let i = n.getAttribute("id");
		if (i == null) return;
		let a = [], s = (f = (A = ft(n, "align")[0]) == null ? void 0 : A.getAttribute("horizontal")) == null ? void 0 : f.toLowerCase();
		s && [
			"left",
			"right",
			"center",
			"justify"
		].includes(s) && a.push(`text-align:${s}`);
		let u = ft(n, "margin")[0], c = (g) => {
			var _;
			return It((_ = ft(u || n, g)[0]) == null ? void 0 : _.getAttribute("value"));
		}, o = c("left"), l = c("right"), d = c("indent"), p = c("prev"), h = c("next");
		o && a.push(`margin-left:${Et(o)}px`), l && a.push(`margin-right:${Et(l)}px`), d && a.push(`text-indent:${Et(d)}px`), p && a.push(`margin-top:${Et(p)}px`), h && a.push(`margin-bottom:${Et(h)}px`), t.set(i, a.join(";"));
	}), {
		character: r,
		paragraph: t
	};
};
var my = (e, r) => {
	let t = eo(e, "run").map((i) => {
		let a = eo(i, "t").map(ll).filter(Boolean).join("");
		if (!a) return "";
		let s = r.character.get(i.getAttribute("charPrIDRef") || "") || "";
		return `<span${s ? ` style="${Ri(s)}"` : ""}>${Ri(a)}</span>`;
	}).filter(Boolean);
	if (!t.length) return "";
	let n = r.paragraph.get(e.getAttribute("paraPrIDRef") || "") || "";
	return `<p${n ? ` style="${Ri(n)}"` : ""}>${t.join("")}</p>`;
};
var _y = (e) => {
	let r = ft(e, "sz")[0], n = ft(e, "tr").filter((i) => ol(i, "tbl") === e).map((i) => ft(i, "tc").filter((a) => ol(a, "tr") === i).map((a) => {
		let s = ft(a, "cellspan")[0], u = ft(a, "cellsz")[0], c = ft(a, "cellmargin")[0], o = (l) => Et(It(c == null ? void 0 : c.getAttribute(l)) || 0);
		return {
			text: ft(a, "t").map(ll).filter(Boolean).join("").replace(/\s+/g, " ").trim(),
			colSpan: It(s == null ? void 0 : s.getAttribute("colSpan")) || 1,
			rowSpan: It(s == null ? void 0 : s.getAttribute("rowSpan")) || 1,
			widthPx: It(u == null ? void 0 : u.getAttribute("width")) != null ? Et(It(u == null ? void 0 : u.getAttribute("width")) || 0) : void 0,
			heightPx: It(u == null ? void 0 : u.getAttribute("height")) != null ? Et(It(u == null ? void 0 : u.getAttribute("height")) || 0) : void 0,
			padding: c ? {
				topPx: o("top"),
				rightPx: o("right"),
				bottomPx: o("bottom"),
				leftPx: o("left")
			} : void 0
		};
	}));
	return {
		rows: n.map((i) => i.map((a) => a.text)),
		cells: n,
		widthPx: It(r == null ? void 0 : r.getAttribute("width")) != null ? Et(It(r == null ? void 0 : r.getAttribute("width")) || 0) : void 0,
		heightPx: It(r == null ? void 0 : r.getAttribute("height")) != null ? Et(It(r == null ? void 0 : r.getAttribute("height")) || 0) : void 0
	};
};
var wy = (e) => ft(e.documentElement, "pic").flatMap((r) => {
	var p, h, A;
	let t = ft(r, "img")[0], n = (p = t == null ? void 0 : t.getAttribute("binaryItemIDRef")) == null ? void 0 : p.trim();
	if (!n) return [];
	let i = ft(r, "cursz")[0] || ft(r, "sz")[0], a = ft(r, "pos").find((f) => f.hasAttribute("treatAsChar")), s = py(ft(r, "shapecomment")[0]), u = It(i == null ? void 0 : i.getAttribute("width")), c = It(i == null ? void 0 : i.getAttribute("height")), o = It(a == null ? void 0 : a.getAttribute("horzOffset")), l = It(a == null ? void 0 : a.getAttribute("vertOffset")), d = (a == null ? void 0 : a.getAttribute("treatAsChar")) !== "1" && ["paper", "page"].includes(((h = a == null ? void 0 : a.getAttribute("horzRelTo")) == null ? void 0 : h.toLowerCase()) || "") && ["paper", "page"].includes(((A = a == null ? void 0 : a.getAttribute("vertRelTo")) == null ? void 0 : A.toLowerCase()) || "");
	return [{
		mediaId: n,
		alt: s || void 0,
		widthPx: u != null ? Et(u) : void 0,
		heightPx: c != null ? Et(c) : void 0,
		xPx: d && o != null ? Et(o) : void 0,
		yPx: d && l != null ? Et(l) : void 0,
		position: d ? "page" : "flow"
	}];
});
var vy = (e) => {
	let r = ft(e.documentElement, "pagepr")[0], t = It(r == null ? void 0 : r.getAttribute("width")), n = It(r == null ? void 0 : r.getAttribute("height"));
	if (!t || !n) return;
	let i = ft(r, "margin")[0], a = (s) => Et(It(i == null ? void 0 : i.getAttribute(s)) || 0);
	return {
		widthPx: Et(t),
		heightPx: Et(n),
		margins: {
			topPx: a("top"),
			rightPx: a("right"),
			bottomPx: a("bottom"),
			leftPx: a("left")
		}
	};
};
var ul = (e) => {
	var t;
	return {
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		gif: "image/gif",
		bmp: "image/bmp",
		svg: "image/svg+xml"
	}[((t = e.split(".").pop()) == null ? void 0 : t.toLowerCase()) || ""] || "application/octet-stream";
};
var by = (e = {}) => {
	var r, t, n, i;
	return {
		maxUncompressedBytes: Math.max(1, (r = e.maxUncompressedBytes) != null ? r : Si.maxUncompressedBytes),
		maxCompressionRatio: Math.max(1, (t = e.maxCompressionRatio) != null ? t : Si.maxCompressionRatio),
		maxEntries: Math.max(1, (n = e.maxEntries) != null ? n : Si.maxEntries),
		maxRecords: Math.max(1, (i = e.maxRecords) != null ? i : Si.maxRecords)
	};
};
var yy = async (e, r, t) => {
	var d, p;
	let n = await Mp.default.loadAsync(e), i = Object.values(n.files);
	if (i.length > t.maxEntries) throw new Error(`HWPX contains too many ZIP entries (${i.length}).`);
	let a = 0;
	for (let h of i) {
		if (h.dir) continue;
		let A = Number(((d = h._data) == null ? void 0 : d.compressedSize) || 0), f = Number(((p = h._data) == null ? void 0 : p.uncompressedSize) || 0);
		if (a += f, f > t.maxUncompressedBytes || a > t.maxUncompressedBytes) throw new Error("HWPX uncompressed data exceeds the configured safe limit.");
		if (A > 0 && f / A > t.maxCompressionRatio) throw new Error(`HWPX ZIP entry exceeds the configured compression ratio: ${h.name}`);
	}
	if (n.file("EncryptionInfo") || n.file("EncryptedPackage")) throw new Error("Encrypted HWPX documents are detected but cannot be decrypted.");
	let s = i.filter((h) => !h.dir && /(?:^|\/)section\d+\.xml$/i.test(h.name)).sort((h, A) => h.name.localeCompare(A.name, void 0, { numeric: !0 }));
	if (!s.length) throw new Error("HWPX section XML was not found.");
	let u = n.file(/(?:^|\/)header\.xml$/i)[0], c = {
		character: /* @__PURE__ */ new Map(),
		paragraph: /* @__PURE__ */ new Map()
	};
	if (u) {
		let h = await u.async("text"), A = r().parseFromString(h, "application/xml");
		A.getElementsByTagName("parsererror").length || (c = gy(A));
	}
	let o = [];
	for (let [h, A] of s.entries()) {
		let f = await A.async("text"), g = r().parseFromString(f, "application/xml");
		if (g.getElementsByTagName("parsererror").length) throw new Error(`Malformed HWPX XML: ${A.name}`);
		let _ = /* @__PURE__ */ new Set([
			"tc",
			"header",
			"footer",
			"footnote",
			"endnote"
		]), v = /* @__PURE__ */ new Set([
			"tbl",
			"header",
			"footer",
			"footnote",
			"endnote"
		]), b = ft(g.documentElement, "p").filter((x) => !dy(x, _)), C = b.map((x) => zp(x, v)).filter(Boolean), T = ft(g.documentElement, "tbl").filter((x) => !ol(x, "tbl")).map(_y).filter((x) => x.rows.length), ee = b.map((x) => my(x, c)).filter(Boolean).join("");
		o.push({
			id: A.name || `section-${h + 1}`,
			paragraphs: C,
			tables: T,
			html: ee || void 0,
			headers: Xs(g, "header"),
			footers: Xs(g, "footer"),
			notes: [...Xs(g, "footnote"), ...Xs(g, "endnote")],
			page: vy(g),
			placedMedia: wy(g)
		});
	}
	let l = [];
	for (let h of i.filter((A) => !A.dir && /(?:^|\/)bindata\//i.test(A.name))) {
		let A = await h.async("uint8array");
		l.push({
			id: h.name,
			mimeType: ul(h.name),
			bytes: A
		});
	}
	return {
		format: "hwpx",
		sections: o,
		media: l,
		warnings: ["HWPX is rendered as a static structured preview; charts, OLE objects and advanced drawing effects remain limited."]
	};
};
var Hp = (e) => {
	let r = e.length - e.length % 2, t = new TextDecoder("utf-16le").decode(e.slice(0, r));
	return Array.from(t, (i) => {
		let a = i.charCodeAt(0);
		return a <= 8 || a === 11 || a === 12 || a >= 14 && a <= 31 ? " " : i;
	}).join("").replace(/[\t ]+/g, " ").trim();
};
var Ey = (e, r) => {
	let t = [], n = 0, i = 0, a = new DataView(e.buffer, e.byteOffset, e.byteLength);
	for (; n + 4 <= e.length && i < r;) {
		let s = a.getUint32(n, !0);
		n += 4;
		let u = s & 1023, c = s >>> 20;
		if (c === 4095) {
			if (n + 4 > e.length) break;
			c = a.getUint32(n, !0), n += 4;
		}
		if (c > e.length - n) break;
		if (u === hy) {
			let o = Hp(e.slice(n, n + c));
			o && t.push(o);
		}
		n += c, i += 1;
	}
	return t;
};
var Pp = (e) => {
	if (e == null || !Number.isFinite(e) || e === 4294967295) return;
	return `#${[
		e & 255,
		e >>> 8 & 255,
		e >>> 16 & 255
	].map((i) => i.toString(16).padStart(2, "0")).join("")}`;
};
var xy = (e, r) => {
	let t = r.docInfo.paraShapes[e.paraShapeId], n = [];
	t && ([
		"left",
		"right",
		"center",
		"justify"
	].includes(t.alignment) && n.push(`text-align:${t.alignment}`), t.leftMargin && n.push(`margin-left:${Et(t.leftMargin)}px`), t.rightMargin && n.push(`margin-right:${Et(t.rightMargin)}px`), t.indent && n.push(`text-indent:${Et(t.indent)}px`), t.prevSpacing && n.push(`margin-top:${Et(t.prevSpacing)}px`), t.nextSpacing && n.push(`margin-bottom:${Et(t.nextSpacing)}px`));
	let i = e.runs.map((a) => {
		var c, o, l, d;
		if (!a.text) return "";
		let s = r.docInfo.charShapes[a.charShapeId], u = [];
		if (s) {
			s.baseSize && u.push(`font-size:${Math.max(1, s.baseSize / 100)}pt`);
			let p = Pp(s.textColor), h = Pp(s.shadeColor);
			p && u.push(`color:${p}`), h && h !== "#ffffff" && u.push(`background-color:${h}`), s.bold && u.push("font-weight:700"), s.italic && u.push("font-style:italic");
			let A = [s.underline ? "underline" : "", s.strikeout ? "line-through" : ""].filter(Boolean);
			A.length && u.push(`text-decoration:${A.join(" ")}`);
			let f = (o = (c = r.docInfo.fontFaces[0]) == null ? void 0 : c[s.faceNameIds.hangul]) == null ? void 0 : o.name, g = (d = (l = r.docInfo.fontFaces[1]) == null ? void 0 : l[s.faceNameIds.latin]) == null ? void 0 : d.name, _ = f || g;
			_ && u.push(`font-family:'${Ay(_).replace(/'/g, "")}'`);
		}
		return `<span${u.length ? ` style="${Ri(u.join(";"))}"` : ""}>${Ri(a.text)}</span>`;
	}).filter(Boolean).join("");
	return i ? `<p${n.length ? ` style="${Ri(n.join(";"))}"` : ""}>${i}</p>` : "";
};
var Cy = (e) => {
	let r = Array.from({ length: e.rowCount }, (t, n) => e.cells.filter((i) => i.row === n).sort((i, a) => i.col - a.col).map((i) => ({
		text: i.paragraphs.map((a) => a.text).filter(Boolean).join(`
`),
		colSpan: Math.max(1, i.colSpan || 1),
		rowSpan: Math.max(1, i.rowSpan || 1)
	})));
	return {
		rows: r.map((t) => t.map((n) => n.text)),
		cells: r
	};
};
var al = (e, r) => e.flatMap((t) => t.controls.flatMap((n) => n.kind === r ? n.paragraphs.map((i) => i.text).filter(Boolean) : []));
var Iy = (e) => e.flatMap((r) => r.controls.flatMap((t) => t.kind === "picture" ? [{
	mediaId: `BinData/${t.binDataId}`,
	position: "flow"
}] : []));
var ky = async (e, r) => {
	if (e.byteLength > r.maxUncompressedBytes) throw new Error("HWP container exceeds the configured safe limit.");
	let t = await Promise.resolve().then(() => uo(Lp(), 1)), n = t.parse(sl(e), { type: "array" }), i = (g) => t.find(n, g) || t.find(n, `Root Entry/${g}`), a = i("FileHeader");
	if (!(a != null && a.content)) throw new Error("HWP FileHeader stream was not found.");
	let s = Vs(a.content);
	if (!new TextDecoder("ascii").decode(s.slice(0, 32)).replace(/\0+$/, "").startsWith(ly)) throw new Error("The CFB file is not an HWP v5 document.");
	let c = s.length >= 40 ? new DataView(s.buffer, s.byteOffset, s.byteLength).getUint32(36, !0) : 0;
	if (c & 2) throw new Error("Encrypted HWP documents are detected but cannot be decrypted.");
	if (c & 4) throw new Error("Distribution HWP documents are detected but are not decrypted.");
	let o = (c & 1) !== 0, l = s.length >= 36 ? Array.from(s.slice(32, 36)).reverse().join(".") : void 0, d = [], p = n.FileIndex.map((g, _) => ({
		entry: g,
		path: n.FullPaths[_] || g.name
	})).filter((g) => /(?:^|\/)BodyText\/Section\d+$/i.test(g.path) && g.entry.content).sort((g, _) => g.path.localeCompare(_.path, void 0, { numeric: !0 }));
	for (let g of p) {
		let _ = Vs(g.entry.content);
		if (_.length > r.maxUncompressedBytes) throw new Error(`HWP stream exceeds the safe limit: ${g.path}`);
		let v = _;
		if (o) try {
			v = Lh(_);
		} catch (b) {
			throw new Error(`HWP compressed stream is malformed: ${g.path}`);
		}
		if (v.length > r.maxUncompressedBytes) throw new Error(`HWP decompressed stream exceeds the safe limit: ${g.path}`);
		d.push({
			id: g.path,
			paragraphs: Ey(v, r.maxRecords),
			tables: []
		});
	}
	if (!d.some((g) => g.paragraphs.length)) {
		let g = i("PrvText");
		g != null && g.content && d.push({
			id: "PrvText",
			paragraphs: [Hp(Vs(g.content))].filter(Boolean),
			tables: []
		});
	}
	let h = /* @__PURE__ */ new Map();
	n.FileIndex.map((g, _) => ({
		entry: g,
		path: n.FullPaths[_] || g.name
	})).filter((g) => g.entry.type === 2 && g.entry.size > 0 && /(?:^|\/)BinData\//i.test(g.path) && g.entry.content).forEach((g) => h.set(g.path.toLowerCase(), {
		id: g.path,
		mimeType: ul(g.path),
		bytes: Vs(g.entry.content)
	}));
	let A = [...h.values()], f = o ? ["BodyText streams were decompressed in the browser."] : [];
	try {
		let g = xp(sl(e));
		d.splice(0, d.length, ...g.sections.map((_, v) => ({
			id: `BodyText/Section${v}`,
			paragraphs: _.paragraphs.map((b) => b.text).filter(Boolean),
			tables: _.paragraphs.flatMap((b) => b.controls.filter((C) => C.kind === "table").map((C) => Cy(C))),
			html: _.paragraphs.map((b) => xy(b, g)).filter(Boolean).join("") || void 0,
			headers: al(_.paragraphs, "header"),
			footers: al(_.paragraphs, "footer"),
			notes: al(_.paragraphs, "footnote"),
			placedMedia: Iy(_.paragraphs)
		}))), A.splice(0, A.length, ...[...g.binData.entries()].map(([_, v]) => ({
			id: `BinData/${_}.${v.extension}`,
			mimeType: ul(`file.${v.extension}`),
			bytes: v.data
		}))), f.push("Parsed HWP v5 structure, tables, inline styles and embedded binary data with the MIT-licensed structured parser.");
	} catch (g) {
		f.push(`Structured HWP parser was unavailable for this document: ${g instanceof Error ? g.message : String(g)}. Used the bounded record fallback.`);
	}
	return {
		format: "hwp",
		version: l,
		sections: d,
		media: A,
		warnings: f
	};
};
var Dy = async (e, r, t = () => new Up.DOMParser(), n = {}) => {
	let i = sl(e), a = (r || "").toLowerCase(), s = by(n);
	if (fy(i)) return yy(e, t, s);
	if (cy(i)) return ky(e, s);
	throw new Error(`The ${a || "Hangul"} extension does not match an HWP/HWPX container.`);
};
/*! Bundled license information:

jszip/dist/jszip.min.js:
(*!

JSZip v3.10.2 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*)

cfb/cfb.js:
(*! crc32.js (C) 2014-present SheetJS -- http://sheetjs.com *)

pako/dist/pako.esm.mjs:
(*! pako 2.2.0 https://github.com/nodeca/pako @license (MIT AND Zlib) *)

@ssabrojs/hwpxjs/dist/browser/hwpxjs.browser.mjs:
(*! Bundled license information:

jszip/dist/jszip.min.js:
(*!

JSZip v3.10.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*)

cfb/cfb.js:
(*! crc32.js (C) 2014-present SheetJS -- http://sheetjs.com *)

pako/dist/pako.esm.mjs:
(*! pako 2.1.0 https://github.com/nodeca/pako @license (MIT AND Zlib) *)
*)
*/
//#endregion
export { Dy as parseHangulDocument };
