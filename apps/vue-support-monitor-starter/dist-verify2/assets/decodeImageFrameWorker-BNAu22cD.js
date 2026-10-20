(function() {
	//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp$1 = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __esmMin = (fn, res, err) => () => {
		if (err) throw err[0];
		try {
			return fn && (res = fn(fn = 0)), res;
		} catch (e) {
			throw err = [e], e;
		}
	};
	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
	var __exportAll = (all, no_symbols) => {
		let target = {};
		for (var name in all) __defProp$1(target, name, {
			get: all[name],
			enumerable: true
		});
		if (!no_symbols) __defProp$1(target, Symbol.toStringTag, { value: "Module" });
		return target;
	};
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp$1(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp$1(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/scaling/bilinear.js
	function bilinear(src, dest) {
		const { rows: srcRows, columns: srcColumns, data: srcData } = src;
		const { rows, columns, data } = dest;
		const xSrc1Off = [];
		const xSrc2Off = [];
		const xFrac = [];
		for (let x = 0; x < columns; x++) {
			const xSrc = x * (srcColumns - 1) / (columns - 1);
			xSrc1Off[x] = Math.floor(xSrc);
			xSrc2Off[x] = Math.min(xSrc1Off[x] + 1, srcColumns - 1);
			xFrac[x] = xSrc - xSrc1Off[x];
		}
		for (let y = 0; y < rows; y++) {
			const ySrc = y * (srcRows - 1) / (rows - 1);
			const ySrc1Off = Math.floor(ySrc) * srcColumns;
			const ySrc2Off = Math.min(ySrc1Off + srcColumns, (srcRows - 1) * srcColumns);
			const yFrac = ySrc - Math.floor(ySrc);
			const yFracInv = 1 - yFrac;
			const yOff = y * columns;
			for (let x = 0; x < columns; x++) {
				const p00 = srcData[ySrc1Off + xSrc1Off[x]];
				const p10 = srcData[ySrc1Off + xSrc2Off[x]];
				const p01 = srcData[ySrc2Off + xSrc1Off[x]];
				const p11 = srcData[ySrc2Off + xSrc2Off[x]];
				const xFracInv = 1 - xFrac[x];
				data[yOff + x] = (p00 * xFracInv + p10 * xFrac[x]) * yFracInv + (p01 * xFracInv + p11 * xFrac[x]) * yFrac;
			}
		}
		return data;
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/scaling/replicate.js
	function replicate(src, dest) {
		const { rows: srcRows, columns: srcColumns, pixelData: srcData, samplesPerPixel = 1 } = src;
		const { rows, columns, pixelData } = dest;
		const xSrc1Off = [];
		for (let x = 0; x < columns; x++) {
			const xSrc = x * (srcColumns - 1) / (columns - 1);
			xSrc1Off[x] = Math.floor(xSrc) * samplesPerPixel;
		}
		for (let y = 0; y < rows; y++) {
			const ySrc = y * (srcRows - 1) / (rows - 1);
			const ySrc1Off = Math.floor(ySrc) * srcColumns * samplesPerPixel;
			const yOff = y * columns;
			for (let x = 0; x < columns; x++) for (let sample = 0; sample < samplesPerPixel; sample++) pixelData[yOff + x + sample] = srcData[ySrc1Off + xSrc1Off[x] + sample];
		}
		return pixelData;
	}
	//#endregion
	//#region ../../node_modules/.pnpm/comlink@4.4.2/node_modules/comlink/dist/esm/comlink.mjs
	/**
	* @license
	* Copyright 2019 Google LLC
	* SPDX-License-Identifier: Apache-2.0
	*/
	const proxyMarker = Symbol("Comlink.proxy");
	const createEndpoint = Symbol("Comlink.endpoint");
	const releaseProxy = Symbol("Comlink.releaseProxy");
	const finalizer = Symbol("Comlink.finalizer");
	const throwMarker = Symbol("Comlink.thrown");
	const isObject = (val) => typeof val === "object" && val !== null || typeof val === "function";
	/**
	* Allows customizing the serialization of certain values.
	*/
	const transferHandlers = /* @__PURE__ */ new Map([["proxy", {
		canHandle: (val) => isObject(val) && val[proxyMarker],
		serialize(obj) {
			const { port1, port2 } = new MessageChannel();
			expose(obj, port1);
			return [port2, [port2]];
		},
		deserialize(port) {
			port.start();
			return wrap(port);
		}
	}], ["throw", {
		canHandle: (value) => isObject(value) && throwMarker in value,
		serialize({ value }) {
			let serialized;
			if (value instanceof Error) serialized = {
				isError: true,
				value: {
					message: value.message,
					name: value.name,
					stack: value.stack
				}
			};
			else serialized = {
				isError: false,
				value
			};
			return [serialized, []];
		},
		deserialize(serialized) {
			if (serialized.isError) throw Object.assign(new Error(serialized.value.message), serialized.value);
			throw serialized.value;
		}
	}]]);
	function isAllowedOrigin(allowedOrigins, origin) {
		for (const allowedOrigin of allowedOrigins) {
			if (origin === allowedOrigin || allowedOrigin === "*") return true;
			if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) return true;
		}
		return false;
	}
	function expose(obj, ep = globalThis, allowedOrigins = ["*"]) {
		ep.addEventListener("message", function callback(ev) {
			if (!ev || !ev.data) return;
			if (!isAllowedOrigin(allowedOrigins, ev.origin)) {
				console.warn(`Invalid origin '${ev.origin}' for comlink proxy`);
				return;
			}
			const { id, type, path } = Object.assign({ path: [] }, ev.data);
			const argumentList = (ev.data.argumentList || []).map(fromWireValue);
			let returnValue;
			try {
				const parent = path.slice(0, -1).reduce((obj, prop) => obj[prop], obj);
				const rawValue = path.reduce((obj, prop) => obj[prop], obj);
				switch (type) {
					case "GET":
						returnValue = rawValue;
						break;
					case "SET":
						parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
						returnValue = true;
						break;
					case "APPLY":
						returnValue = rawValue.apply(parent, argumentList);
						break;
					case "CONSTRUCT":
						returnValue = proxy(new rawValue(...argumentList));
						break;
					case "ENDPOINT":
						{
							const { port1, port2 } = new MessageChannel();
							expose(obj, port2);
							returnValue = transfer(port1, [port1]);
						}
						break;
					case "RELEASE":
						returnValue = void 0;
						break;
					default: return;
				}
			} catch (value) {
				returnValue = {
					value,
					[throwMarker]: 0
				};
			}
			Promise.resolve(returnValue).catch((value) => {
				return {
					value,
					[throwMarker]: 0
				};
			}).then((returnValue) => {
				const [wireValue, transferables] = toWireValue(returnValue);
				ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
				if (type === "RELEASE") {
					ep.removeEventListener("message", callback);
					closeEndPoint(ep);
					if (finalizer in obj && typeof obj[finalizer] === "function") obj[finalizer]();
				}
			}).catch((error) => {
				const [wireValue, transferables] = toWireValue({
					value: /* @__PURE__ */ new TypeError("Unserializable return value"),
					[throwMarker]: 0
				});
				ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
			});
		});
		if (ep.start) ep.start();
	}
	function isMessagePort(endpoint) {
		return endpoint.constructor.name === "MessagePort";
	}
	function closeEndPoint(endpoint) {
		if (isMessagePort(endpoint)) endpoint.close();
	}
	function wrap(ep, target) {
		const pendingListeners = /* @__PURE__ */ new Map();
		ep.addEventListener("message", function handleMessage(ev) {
			const { data } = ev;
			if (!data || !data.id) return;
			const resolver = pendingListeners.get(data.id);
			if (!resolver) return;
			try {
				resolver(data);
			} finally {
				pendingListeners.delete(data.id);
			}
		});
		return createProxy(ep, pendingListeners, [], target);
	}
	function throwIfProxyReleased(isReleased) {
		if (isReleased) throw new Error("Proxy has been released and is not useable");
	}
	function releaseEndpoint(ep) {
		return requestResponseMessage(ep, /* @__PURE__ */ new Map(), { type: "RELEASE" }).then(() => {
			closeEndPoint(ep);
		});
	}
	const proxyCounter = /* @__PURE__ */ new WeakMap();
	const proxyFinalizers = "FinalizationRegistry" in globalThis && new FinalizationRegistry((ep) => {
		const newCount = (proxyCounter.get(ep) || 0) - 1;
		proxyCounter.set(ep, newCount);
		if (newCount === 0) releaseEndpoint(ep);
	});
	function registerProxy(proxy, ep) {
		const newCount = (proxyCounter.get(ep) || 0) + 1;
		proxyCounter.set(ep, newCount);
		if (proxyFinalizers) proxyFinalizers.register(proxy, ep, proxy);
	}
	function unregisterProxy(proxy) {
		if (proxyFinalizers) proxyFinalizers.unregister(proxy);
	}
	function createProxy(ep, pendingListeners, path = [], target = function() {}) {
		let isProxyReleased = false;
		const proxy = new Proxy(target, {
			get(_target, prop) {
				throwIfProxyReleased(isProxyReleased);
				if (prop === releaseProxy) return () => {
					unregisterProxy(proxy);
					releaseEndpoint(ep);
					pendingListeners.clear();
					isProxyReleased = true;
				};
				if (prop === "then") {
					if (path.length === 0) return { then: () => proxy };
					const r = requestResponseMessage(ep, pendingListeners, {
						type: "GET",
						path: path.map((p) => p.toString())
					}).then(fromWireValue);
					return r.then.bind(r);
				}
				return createProxy(ep, pendingListeners, [...path, prop]);
			},
			set(_target, prop, rawValue) {
				throwIfProxyReleased(isProxyReleased);
				const [value, transferables] = toWireValue(rawValue);
				return requestResponseMessage(ep, pendingListeners, {
					type: "SET",
					path: [...path, prop].map((p) => p.toString()),
					value
				}, transferables).then(fromWireValue);
			},
			apply(_target, _thisArg, rawArgumentList) {
				throwIfProxyReleased(isProxyReleased);
				const last = path[path.length - 1];
				if (last === createEndpoint) return requestResponseMessage(ep, pendingListeners, { type: "ENDPOINT" }).then(fromWireValue);
				if (last === "bind") return createProxy(ep, pendingListeners, path.slice(0, -1));
				const [argumentList, transferables] = processArguments(rawArgumentList);
				return requestResponseMessage(ep, pendingListeners, {
					type: "APPLY",
					path: path.map((p) => p.toString()),
					argumentList
				}, transferables).then(fromWireValue);
			},
			construct(_target, rawArgumentList) {
				throwIfProxyReleased(isProxyReleased);
				const [argumentList, transferables] = processArguments(rawArgumentList);
				return requestResponseMessage(ep, pendingListeners, {
					type: "CONSTRUCT",
					path: path.map((p) => p.toString()),
					argumentList
				}, transferables).then(fromWireValue);
			}
		});
		registerProxy(proxy, ep);
		return proxy;
	}
	function myFlat(arr) {
		return Array.prototype.concat.apply([], arr);
	}
	function processArguments(argumentList) {
		const processed = argumentList.map(toWireValue);
		return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
	}
	const transferCache = /* @__PURE__ */ new WeakMap();
	function transfer(obj, transfers) {
		transferCache.set(obj, transfers);
		return obj;
	}
	function proxy(obj) {
		return Object.assign(obj, { [proxyMarker]: true });
	}
	function toWireValue(value) {
		for (const [name, handler] of transferHandlers) if (handler.canHandle(value)) {
			const [serializedValue, transferables] = handler.serialize(value);
			return [{
				type: "HANDLER",
				name,
				value: serializedValue
			}, transferables];
		}
		return [{
			type: "RAW",
			value
		}, transferCache.get(value) || []];
	}
	function fromWireValue(value) {
		switch (value.type) {
			case "HANDLER": return transferHandlers.get(value.name).deserialize(value.value);
			case "RAW": return value.value;
		}
	}
	function requestResponseMessage(ep, pendingListeners, msg, transfers) {
		return new Promise((resolve) => {
			const id = generateUUID();
			pendingListeners.set(id, resolve);
			if (ep.start) ep.start();
			ep.postMessage(Object.assign({ id }, msg), transfers);
		});
	}
	function generateUUID() {
		return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/decoders/decodeLittleEndian.js
	async function decodeLittleEndian(imageFrame, pixelData) {
		let arrayBuffer = pixelData.buffer;
		let offset = pixelData.byteOffset;
		const length = pixelData.length;
		if (imageFrame.bitsAllocated === 16) {
			if (offset % 2) {
				arrayBuffer = arrayBuffer.slice(offset);
				offset = 0;
			}
			if (imageFrame.pixelRepresentation === 0) imageFrame.pixelData = new Uint16Array(arrayBuffer, offset, length / 2);
			else imageFrame.pixelData = new Int16Array(arrayBuffer, offset, length / 2);
		} else if (imageFrame.bitsAllocated === 8 || imageFrame.bitsAllocated === 1) imageFrame.pixelData = pixelData;
		else if (imageFrame.bitsAllocated === 32) {
			if (offset % 2) {
				arrayBuffer = arrayBuffer.slice(offset);
				offset = 0;
			}
			if (imageFrame.floatPixelData || imageFrame.doubleFloatPixelData) throw new Error("Float pixel data is not supported for parsing into ImageFrame");
			if (imageFrame.pixelRepresentation === 0) imageFrame.pixelData = new Uint32Array(arrayBuffer, offset, length / 4);
			else if (imageFrame.pixelRepresentation === 1) imageFrame.pixelData = new Int32Array(arrayBuffer, offset, length / 4);
			else imageFrame.pixelData = new Float32Array(arrayBuffer, offset, length / 4);
		}
		return imageFrame;
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/decoders/decodeBigEndian.js
	function swap16(val) {
		return (val & 255) << 8 | val >> 8 & 255;
	}
	async function decodeBigEndian(imageFrame, pixelData) {
		if (imageFrame.bitsAllocated === 16) {
			let arrayBuffer = pixelData.buffer;
			let offset = pixelData.byteOffset;
			const length = pixelData.length;
			if (offset % 2) {
				arrayBuffer = arrayBuffer.slice(offset);
				offset = 0;
			}
			if (imageFrame.pixelRepresentation === 0) imageFrame.pixelData = new Uint16Array(arrayBuffer, offset, length / 2);
			else imageFrame.pixelData = new Int16Array(arrayBuffer, offset, length / 2);
			for (let i = 0; i < imageFrame.pixelData.length; i++) imageFrame.pixelData[i] = swap16(imageFrame.pixelData[i]);
		} else if (imageFrame.bitsAllocated === 8) imageFrame.pixelData = pixelData;
		return imageFrame;
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/decoders/decodeRLE.js
	async function decodeRLE(imageFrame, pixelData) {
		if (imageFrame.bitsAllocated === 8) {
			if (imageFrame.planarConfiguration) return decode8Planar(imageFrame, pixelData);
			return decode8(imageFrame, pixelData);
		} else if (imageFrame.bitsAllocated === 16) return decode16(imageFrame, pixelData);
		else if (imageFrame.bitsAllocated === 1) return decode8Planar(imageFrame, pixelData, true);
		throw new Error("unsupported pixel format for RLE");
	}
	function getFrameSize(imageFrame, isOneBit = false) {
		const pixelCount = imageFrame.rows * imageFrame.columns;
		return isOneBit ? Math.ceil(pixelCount / 8) : pixelCount;
	}
	function unpackOneBitPlanar(packed, imageFrame, frameSize) {
		const pixelsPerPlane = imageFrame.rows * imageFrame.columns;
		const unpacked = new Uint8Array(pixelsPerPlane * imageFrame.samplesPerPixel);
		for (let s = 0; s < imageFrame.samplesPerPixel; s++) {
			const planeOffset = s * frameSize;
			for (let i = 0; i < pixelsPerPlane; i++) {
				const bytePos = planeOffset + Math.floor(i / 8);
				const bitPos = i % 8;
				unpacked[s * pixelsPerPlane + i] = packed[bytePos] & 1 << bitPos ? 1 : 0;
			}
		}
		return unpacked;
	}
	function decode8(imageFrame, pixelData, isOneBit = false) {
		const frameData = pixelData;
		const frameSize = getFrameSize(imageFrame, isOneBit);
		const outFrame = new ArrayBuffer(frameSize * imageFrame.samplesPerPixel);
		const header = new DataView(frameData.buffer, frameData.byteOffset);
		const data = new Int8Array(frameData.buffer, frameData.byteOffset);
		const out = new Int8Array(outFrame);
		let outIndex = 0;
		const numSegments = header.getInt32(0, true);
		for (let s = 0; s < numSegments; ++s) {
			outIndex = s;
			let inIndex = header.getInt32((s + 1) * 4, true);
			let maxIndex = header.getInt32((s + 2) * 4, true);
			if (maxIndex === 0) maxIndex = frameData.length;
			const endOfSegment = frameSize * numSegments;
			while (inIndex < maxIndex) {
				const n = data[inIndex++];
				if (n >= 0 && n <= 127) for (let i = 0; i < n + 1 && outIndex < endOfSegment; ++i) {
					out[outIndex] = data[inIndex++];
					outIndex += imageFrame.samplesPerPixel;
				}
				else if (n <= -1 && n >= -127) {
					const value = data[inIndex++];
					for (let j = 0; j < -n + 1 && outIndex < endOfSegment; ++j) {
						out[outIndex] = value;
						outIndex += imageFrame.samplesPerPixel;
					}
				}
			}
		}
		imageFrame.pixelData = new Uint8Array(outFrame);
		return imageFrame;
	}
	function decode8Planar(imageFrame, pixelData, isOneBit = false) {
		const frameData = pixelData;
		const frameSize = getFrameSize(imageFrame, isOneBit);
		const outFrame = new ArrayBuffer(frameSize * imageFrame.samplesPerPixel);
		const header = new DataView(frameData.buffer, frameData.byteOffset);
		const data = new Int8Array(frameData.buffer, frameData.byteOffset);
		const out = new Int8Array(outFrame);
		let outIndex = 0;
		const numSegments = header.getInt32(0, true);
		for (let s = 0; s < numSegments; ++s) {
			outIndex = s * frameSize;
			let inIndex = header.getInt32((s + 1) * 4, true);
			let maxIndex = header.getInt32((s + 2) * 4, true);
			if (maxIndex === 0) maxIndex = frameData.length;
			const endOfSegment = frameSize * numSegments;
			while (inIndex < maxIndex) {
				const n = data[inIndex++];
				if (n >= 0 && n <= 127) for (let i = 0; i < n + 1 && outIndex < endOfSegment; ++i) {
					out[outIndex] = data[inIndex++];
					outIndex++;
				}
				else if (n <= -1 && n >= -127) {
					const value = data[inIndex++];
					for (let j = 0; j < -n + 1 && outIndex < endOfSegment; ++j) {
						out[outIndex] = value;
						outIndex++;
					}
				}
			}
		}
		imageFrame.pixelData = new Uint8Array(outFrame);
		if (isOneBit) imageFrame.pixelData = unpackOneBitPlanar(imageFrame.pixelData, imageFrame, frameSize);
		return imageFrame;
	}
	function decode16(imageFrame, pixelData) {
		const frameData = pixelData;
		const frameSize = imageFrame.rows * imageFrame.columns;
		const outFrame = /* @__PURE__ */ new ArrayBuffer(frameSize * imageFrame.samplesPerPixel * 2);
		const header = new DataView(frameData.buffer, frameData.byteOffset);
		const data = new Int8Array(frameData.buffer, frameData.byteOffset);
		const out = new Int8Array(outFrame);
		const numSegments = header.getInt32(0, true);
		for (let s = 0; s < numSegments; ++s) {
			let outIndex = 0;
			const highByte = s === 0 ? 1 : 0;
			let inIndex = header.getInt32((s + 1) * 4, true);
			let maxIndex = header.getInt32((s + 2) * 4, true);
			if (maxIndex === 0) maxIndex = frameData.length;
			while (inIndex < maxIndex) {
				const n = data[inIndex++];
				if (n >= 0 && n <= 127) for (let i = 0; i < n + 1 && outIndex < frameSize; ++i) {
					out[outIndex * 2 + highByte] = data[inIndex++];
					outIndex++;
				}
				else if (n <= -1 && n >= -127) {
					const value = data[inIndex++];
					for (let j = 0; j < -n + 1 && outIndex < frameSize; ++j) {
						out[outIndex * 2 + highByte] = value;
						outIndex++;
					}
				}
			}
		}
		if (imageFrame.pixelRepresentation === 0) imageFrame.pixelData = new Uint16Array(outFrame);
		else imageFrame.pixelData = new Int16Array(outFrame);
		return imageFrame;
	}
	//#endregion
	//#region __vite-browser-external
	var require___vite_browser_external = /* @__PURE__ */ __commonJSMin(((exports, module) => {
		module.exports = {};
	}));
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/decoders/isSignedPixelData.js
	var import_libjpegturbowasm_decode = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
		var libjpegturbowasm_decode = (() => {
			var _scriptName = typeof document != "undefined" ? document.currentScript?.src : void 0;
			if (typeof __filename != "undefined") _scriptName = _scriptName || __filename;
			return (function(moduleArg = {}) {
				var moduleRtn;
				var Module = moduleArg;
				var readyPromiseResolve, readyPromiseReject;
				var readyPromise = new Promise((resolve, reject) => {
					readyPromiseResolve = resolve;
					readyPromiseReject = reject;
				});
				var ENVIRONMENT_IS_WEB = typeof window == "object";
				var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != "undefined";
				var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string" && process.type != "renderer";
				if (ENVIRONMENT_IS_NODE) {}
				var moduleOverrides = Object.assign({}, Module);
				var thisProgram = "./this.program";
				var quit_ = (status, toThrow) => {
					throw toThrow;
				};
				var scriptDirectory = "";
				function locateFile(path) {
					if (Module["locateFile"]) return Module["locateFile"](path, scriptDirectory);
					return scriptDirectory + path;
				}
				var readAsync, readBinary;
				if (ENVIRONMENT_IS_NODE) {
					var fs = require___vite_browser_external();
					require___vite_browser_external();
					scriptDirectory = __dirname + "/";
					readBinary = (filename) => {
						filename = isFileURI(filename) ? new URL(filename) : filename;
						return fs.readFileSync(filename);
					};
					readAsync = async (filename, binary = true) => {
						filename = isFileURI(filename) ? new URL(filename) : filename;
						return fs.readFileSync(filename, binary ? void 0 : "utf8");
					};
					if (!Module["thisProgram"] && process.argv.length > 1) thisProgram = process.argv[1].replace(/\\/g, "/");
					process.argv.slice(2);
					quit_ = (status, toThrow) => {
						process.exitCode = status;
						throw toThrow;
					};
				} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
					if (ENVIRONMENT_IS_WORKER) scriptDirectory = self.location.href;
					else if (typeof document != "undefined" && document.currentScript) scriptDirectory = document.currentScript.src;
					if (_scriptName) scriptDirectory = _scriptName;
					if (scriptDirectory.startsWith("blob:")) scriptDirectory = "";
					else scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
					if (ENVIRONMENT_IS_WORKER) readBinary = (url) => {
						var xhr = new XMLHttpRequest();
						xhr.open("GET", url, false);
						xhr.responseType = "arraybuffer";
						xhr.send(null);
						return new Uint8Array(xhr.response);
					};
					readAsync = async (url) => {
						if (isFileURI(url)) return new Promise((resolve, reject) => {
							var xhr = new XMLHttpRequest();
							xhr.open("GET", url, true);
							xhr.responseType = "arraybuffer";
							xhr.onload = () => {
								if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
									resolve(xhr.response);
									return;
								}
								reject(xhr.status);
							};
							xhr.onerror = reject;
							xhr.send(null);
						});
						var response = await fetch(url, { credentials: "same-origin" });
						if (response.ok) return response.arrayBuffer();
						throw new Error(response.status + " : " + response.url);
					};
				}
				var out = Module["print"] || console.log.bind(console);
				var err = Module["printErr"] || console.error.bind(console);
				Object.assign(Module, moduleOverrides);
				moduleOverrides = null;
				if (Module["arguments"]) Module["arguments"];
				if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
				var wasmBinary = Module["wasmBinary"];
				var wasmMemory;
				var ABORT = false;
				var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
				function updateMemoryViews() {
					var b = wasmMemory.buffer;
					Module["HEAP8"] = HEAP8 = new Int8Array(b);
					Module["HEAP16"] = HEAP16 = new Int16Array(b);
					Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
					Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
					Module["HEAP32"] = HEAP32 = new Int32Array(b);
					Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
					Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
					Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
				}
				var __ATPRERUN__ = [];
				var __ATINIT__ = [];
				var __ATPOSTRUN__ = [];
				function preRun() {
					if (Module["preRun"]) {
						if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
						while (Module["preRun"].length) addOnPreRun(Module["preRun"].shift());
					}
					callRuntimeCallbacks(__ATPRERUN__);
				}
				function initRuntime() {
					callRuntimeCallbacks(__ATINIT__);
				}
				function postRun() {
					if (Module["postRun"]) {
						if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
						while (Module["postRun"].length) addOnPostRun(Module["postRun"].shift());
					}
					callRuntimeCallbacks(__ATPOSTRUN__);
				}
				function addOnPreRun(cb) {
					__ATPRERUN__.unshift(cb);
				}
				function addOnInit(cb) {
					__ATINIT__.unshift(cb);
				}
				function addOnPostRun(cb) {
					__ATPOSTRUN__.unshift(cb);
				}
				var runDependencies = 0;
				var dependenciesFulfilled = null;
				function addRunDependency(id) {
					runDependencies++;
					Module["monitorRunDependencies"]?.(runDependencies);
				}
				function removeRunDependency(id) {
					runDependencies--;
					Module["monitorRunDependencies"]?.(runDependencies);
					if (runDependencies == 0) {
						if (dependenciesFulfilled) {
							var callback = dependenciesFulfilled;
							dependenciesFulfilled = null;
							callback();
						}
					}
				}
				function abort(what) {
					Module["onAbort"]?.(what);
					what = "Aborted(" + what + ")";
					err(what);
					ABORT = true;
					what += ". Build with -sASSERTIONS for more info.";
					var e = new WebAssembly.RuntimeError(what);
					readyPromiseReject(e);
					throw e;
				}
				var dataURIPrefix = "data:application/octet-stream;base64,";
				var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
				var isFileURI = (filename) => filename.startsWith("file://");
				function findWasmBinary() {
					var f = "libjpegturbowasm_decode.wasm";
					if (!isDataURI(f)) return locateFile(f);
					return f;
				}
				var wasmBinaryFile;
				function getBinarySync(file) {
					if (file == wasmBinaryFile && wasmBinary) return new Uint8Array(wasmBinary);
					if (readBinary) return readBinary(file);
					throw "both async and sync fetching of the wasm failed";
				}
				async function getWasmBinary(binaryFile) {
					if (!wasmBinary) try {
						var response = await readAsync(binaryFile);
						return new Uint8Array(response);
					} catch {}
					return getBinarySync(binaryFile);
				}
				async function instantiateArrayBuffer(binaryFile, imports) {
					try {
						var binary = await getWasmBinary(binaryFile);
						return await WebAssembly.instantiate(binary, imports);
					} catch (reason) {
						err(`failed to asynchronously prepare wasm: ${reason}`);
						abort(reason);
					}
				}
				async function instantiateAsync(binary, binaryFile, imports) {
					if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") try {
						var response = fetch(binaryFile, { credentials: "same-origin" });
						return await WebAssembly.instantiateStreaming(response, imports);
					} catch (reason) {
						err(`wasm streaming compile failed: ${reason}`);
						err("falling back to ArrayBuffer instantiation");
					}
					return instantiateArrayBuffer(binaryFile, imports);
				}
				function getWasmImports() {
					return { a: wasmImports };
				}
				async function createWasm() {
					function receiveInstance(instance, module$4) {
						wasmExports = instance.exports;
						wasmMemory = wasmExports["L"];
						updateMemoryViews();
						wasmTable = wasmExports["O"];
						addOnInit(wasmExports["M"]);
						removeRunDependency("wasm-instantiate");
						return wasmExports;
					}
					addRunDependency("wasm-instantiate");
					function receiveInstantiationResult(result) {
						receiveInstance(result["instance"]);
					}
					var info = getWasmImports();
					if (Module["instantiateWasm"]) try {
						return Module["instantiateWasm"](info, receiveInstance);
					} catch (e) {
						err(`Module.instantiateWasm callback failed with error: ${e}`);
						readyPromiseReject(e);
					}
					wasmBinaryFile ??= findWasmBinary();
					try {
						var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
						receiveInstantiationResult(result);
						return result;
					} catch (e) {
						readyPromiseReject(e);
						return;
					}
				}
				class ExitStatus {
					name = "ExitStatus";
					constructor(status) {
						this.message = `Program terminated with exit(${status})`;
						this.status = status;
					}
				}
				var callRuntimeCallbacks = (callbacks) => {
					while (callbacks.length > 0) callbacks.shift()(Module);
				};
				var noExitRuntime = Module["noExitRuntime"] || true;
				var stackRestore = (val) => __emscripten_stack_restore(val);
				var stackSave = () => _emscripten_stack_get_current();
				class ExceptionInfo {
					constructor(excPtr) {
						this.excPtr = excPtr;
						this.ptr = excPtr - 24;
					}
					set_type(type) {
						HEAPU32[this.ptr + 4 >> 2] = type;
					}
					get_type() {
						return HEAPU32[this.ptr + 4 >> 2];
					}
					set_destructor(destructor) {
						HEAPU32[this.ptr + 8 >> 2] = destructor;
					}
					get_destructor() {
						return HEAPU32[this.ptr + 8 >> 2];
					}
					set_caught(caught) {
						caught = caught ? 1 : 0;
						HEAP8[this.ptr + 12] = caught;
					}
					get_caught() {
						return HEAP8[this.ptr + 12] != 0;
					}
					set_rethrown(rethrown) {
						rethrown = rethrown ? 1 : 0;
						HEAP8[this.ptr + 13] = rethrown;
					}
					get_rethrown() {
						return HEAP8[this.ptr + 13] != 0;
					}
					init(type, destructor) {
						this.set_adjusted_ptr(0);
						this.set_type(type);
						this.set_destructor(destructor);
					}
					set_adjusted_ptr(adjustedPtr) {
						HEAPU32[this.ptr + 16 >> 2] = adjustedPtr;
					}
					get_adjusted_ptr() {
						return HEAPU32[this.ptr + 16 >> 2];
					}
				}
				var exceptionLast = 0;
				var uncaughtExceptionCount = 0;
				var ___cxa_throw = (ptr, type, destructor) => {
					new ExceptionInfo(ptr).init(type, destructor);
					exceptionLast = ptr;
					uncaughtExceptionCount++;
					throw exceptionLast;
				};
				var __abort_js = () => abort("");
				var structRegistrations = {};
				var runDestructors = (destructors) => {
					while (destructors.length) {
						var ptr = destructors.pop();
						destructors.pop()(ptr);
					}
				};
				function readPointer(pointer) {
					return this["fromWireType"](HEAPU32[pointer >> 2]);
				}
				var awaitingDependencies = {};
				var registeredTypes = {};
				var typeDependencies = {};
				var InternalError;
				var throwInternalError = (message) => {
					throw new InternalError(message);
				};
				var whenDependentTypesAreResolved = (myTypes, dependentTypes, getTypeConverters) => {
					myTypes.forEach((type) => typeDependencies[type] = dependentTypes);
					function onComplete(typeConverters) {
						var myTypeConverters = getTypeConverters(typeConverters);
						if (myTypeConverters.length !== myTypes.length) throwInternalError("Mismatched type converter count");
						for (var i = 0; i < myTypes.length; ++i) registerType(myTypes[i], myTypeConverters[i]);
					}
					var typeConverters = new Array(dependentTypes.length);
					var unregisteredTypes = [];
					var registered = 0;
					dependentTypes.forEach((dt, i) => {
						if (registeredTypes.hasOwnProperty(dt)) typeConverters[i] = registeredTypes[dt];
						else {
							unregisteredTypes.push(dt);
							if (!awaitingDependencies.hasOwnProperty(dt)) awaitingDependencies[dt] = [];
							awaitingDependencies[dt].push(() => {
								typeConverters[i] = registeredTypes[dt];
								++registered;
								if (registered === unregisteredTypes.length) onComplete(typeConverters);
							});
						}
					});
					if (0 === unregisteredTypes.length) onComplete(typeConverters);
				};
				var __embind_finalize_value_object = (structType) => {
					var reg = structRegistrations[structType];
					delete structRegistrations[structType];
					var rawConstructor = reg.rawConstructor;
					var rawDestructor = reg.rawDestructor;
					var fieldRecords = reg.fields;
					var fieldTypes = fieldRecords.map((field) => field.getterReturnType).concat(fieldRecords.map((field) => field.setterArgumentType));
					whenDependentTypesAreResolved([structType], fieldTypes, (fieldTypes) => {
						var fields = {};
						fieldRecords.forEach((field, i) => {
							var fieldName = field.fieldName;
							var getterReturnType = fieldTypes[i];
							var getter = field.getter;
							var getterContext = field.getterContext;
							var setterArgumentType = fieldTypes[i + fieldRecords.length];
							var setter = field.setter;
							var setterContext = field.setterContext;
							fields[fieldName] = {
								read: (ptr) => getterReturnType["fromWireType"](getter(getterContext, ptr)),
								write: (ptr, o) => {
									var destructors = [];
									setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
									runDestructors(destructors);
								}
							};
						});
						return [{
							name: reg.name,
							fromWireType: (ptr) => {
								var rv = {};
								for (var i in fields) rv[i] = fields[i].read(ptr);
								rawDestructor(ptr);
								return rv;
							},
							toWireType: (destructors, o) => {
								for (var fieldName in fields) if (!(fieldName in o)) throw new TypeError(`Missing field: "${fieldName}"`);
								var ptr = rawConstructor();
								for (fieldName in fields) fields[fieldName].write(ptr, o[fieldName]);
								if (destructors !== null) destructors.push(rawDestructor, ptr);
								return ptr;
							},
							argPackAdvance: GenericWireTypeSize,
							readValueFromPointer: readPointer,
							destructorFunction: rawDestructor
						}];
					});
				};
				var __embind_register_bigint = (primitiveType, name, size, minRange, maxRange) => {};
				var embind_init_charCodes = () => {
					var codes = new Array(256);
					for (var i = 0; i < 256; ++i) codes[i] = String.fromCharCode(i);
					embind_charCodes = codes;
				};
				var embind_charCodes;
				var readLatin1String = (ptr) => {
					var ret = "";
					var c = ptr;
					while (HEAPU8[c]) ret += embind_charCodes[HEAPU8[c++]];
					return ret;
				};
				var BindingError;
				var throwBindingError = (message) => {
					throw new BindingError(message);
				};
				function sharedRegisterType(rawType, registeredInstance, options = {}) {
					var name = registeredInstance.name;
					if (!rawType) throwBindingError(`type "${name}" must have a positive integer typeid pointer`);
					if (registeredTypes.hasOwnProperty(rawType)) if (options.ignoreDuplicateRegistrations) return;
					else throwBindingError(`Cannot register type '${name}' twice`);
					registeredTypes[rawType] = registeredInstance;
					delete typeDependencies[rawType];
					if (awaitingDependencies.hasOwnProperty(rawType)) {
						var callbacks = awaitingDependencies[rawType];
						delete awaitingDependencies[rawType];
						callbacks.forEach((cb) => cb());
					}
				}
				function registerType(rawType, registeredInstance, options = {}) {
					return sharedRegisterType(rawType, registeredInstance, options);
				}
				var GenericWireTypeSize = 8;
				var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
					name = readLatin1String(name);
					registerType(rawType, {
						name,
						fromWireType: function(wt) {
							return !!wt;
						},
						toWireType: function(destructors, o) {
							return o ? trueValue : falseValue;
						},
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: function(pointer) {
							return this["fromWireType"](HEAPU8[pointer]);
						},
						destructorFunction: null
					});
				};
				var shallowCopyInternalPointer = (o) => ({
					count: o.count,
					deleteScheduled: o.deleteScheduled,
					preservePointerOnDelete: o.preservePointerOnDelete,
					ptr: o.ptr,
					ptrType: o.ptrType,
					smartPtr: o.smartPtr,
					smartPtrType: o.smartPtrType
				});
				var throwInstanceAlreadyDeleted = (obj) => {
					function getInstanceTypeName(handle) {
						return handle.$$.ptrType.registeredClass.name;
					}
					throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
				};
				var finalizationRegistry = false;
				var detachFinalizer = (handle) => {};
				var runDestructor = ($$) => {
					if ($$.smartPtr) $$.smartPtrType.rawDestructor($$.smartPtr);
					else $$.ptrType.registeredClass.rawDestructor($$.ptr);
				};
				var releaseClassHandle = ($$) => {
					$$.count.value -= 1;
					if (0 === $$.count.value) runDestructor($$);
				};
				var downcastPointer = (ptr, ptrClass, desiredClass) => {
					if (ptrClass === desiredClass) return ptr;
					if (void 0 === desiredClass.baseClass) return null;
					var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
					if (rv === null) return null;
					return desiredClass.downcast(rv);
				};
				var registeredPointers = {};
				var registeredInstances = {};
				var getBasestPointer = (class_, ptr) => {
					if (ptr === void 0) throwBindingError("ptr should not be undefined");
					while (class_.baseClass) {
						ptr = class_.upcast(ptr);
						class_ = class_.baseClass;
					}
					return ptr;
				};
				var getInheritedInstance = (class_, ptr) => {
					ptr = getBasestPointer(class_, ptr);
					return registeredInstances[ptr];
				};
				var makeClassHandle = (prototype, record) => {
					if (!record.ptrType || !record.ptr) throwInternalError("makeClassHandle requires ptr and ptrType");
					if (!!record.smartPtrType !== !!record.smartPtr) throwInternalError("Both smartPtrType and smartPtr must be specified");
					record.count = { value: 1 };
					return attachFinalizer(Object.create(prototype, { $$: {
						value: record,
						writable: true
					} }));
				};
				function RegisteredPointer_fromWireType(ptr) {
					var rawPointer = this.getPointee(ptr);
					if (!rawPointer) {
						this.destructor(ptr);
						return null;
					}
					var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
					if (void 0 !== registeredInstance) if (0 === registeredInstance.$$.count.value) {
						registeredInstance.$$.ptr = rawPointer;
						registeredInstance.$$.smartPtr = ptr;
						return registeredInstance["clone"]();
					} else {
						var rv = registeredInstance["clone"]();
						this.destructor(ptr);
						return rv;
					}
					function makeDefaultHandle() {
						if (this.isSmartPointer) return makeClassHandle(this.registeredClass.instancePrototype, {
							ptrType: this.pointeeType,
							ptr: rawPointer,
							smartPtrType: this,
							smartPtr: ptr
						});
						else return makeClassHandle(this.registeredClass.instancePrototype, {
							ptrType: this,
							ptr
						});
					}
					var registeredPointerRecord = registeredPointers[this.registeredClass.getActualType(rawPointer)];
					if (!registeredPointerRecord) return makeDefaultHandle.call(this);
					var toType;
					if (this.isConst) toType = registeredPointerRecord.constPointerType;
					else toType = registeredPointerRecord.pointerType;
					var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
					if (dp === null) return makeDefaultHandle.call(this);
					if (this.isSmartPointer) return makeClassHandle(toType.registeredClass.instancePrototype, {
						ptrType: toType,
						ptr: dp,
						smartPtrType: this,
						smartPtr: ptr
					});
					else return makeClassHandle(toType.registeredClass.instancePrototype, {
						ptrType: toType,
						ptr: dp
					});
				}
				var attachFinalizer = (handle) => {
					if ("undefined" === typeof FinalizationRegistry) {
						attachFinalizer = (handle) => handle;
						return handle;
					}
					finalizationRegistry = new FinalizationRegistry((info) => {
						releaseClassHandle(info.$$);
					});
					attachFinalizer = (handle) => {
						var $$ = handle.$$;
						if (!!$$.smartPtr) {
							var info = { $$ };
							finalizationRegistry.register(handle, info, handle);
						}
						return handle;
					};
					detachFinalizer = (handle) => finalizationRegistry.unregister(handle);
					return attachFinalizer(handle);
				};
				var deletionQueue = [];
				var flushPendingDeletes = () => {
					while (deletionQueue.length) {
						var obj = deletionQueue.pop();
						obj.$$.deleteScheduled = false;
						obj["delete"]();
					}
				};
				var delayFunction;
				var init_ClassHandle = () => {
					Object.assign(ClassHandle.prototype, {
						isAliasOf(other) {
							if (!(this instanceof ClassHandle)) return false;
							if (!(other instanceof ClassHandle)) return false;
							var leftClass = this.$$.ptrType.registeredClass;
							var left = this.$$.ptr;
							other.$$ = other.$$;
							var rightClass = other.$$.ptrType.registeredClass;
							var right = other.$$.ptr;
							while (leftClass.baseClass) {
								left = leftClass.upcast(left);
								leftClass = leftClass.baseClass;
							}
							while (rightClass.baseClass) {
								right = rightClass.upcast(right);
								rightClass = rightClass.baseClass;
							}
							return leftClass === rightClass && left === right;
						},
						clone() {
							if (!this.$$.ptr) throwInstanceAlreadyDeleted(this);
							if (this.$$.preservePointerOnDelete) {
								this.$$.count.value += 1;
								return this;
							} else {
								var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), { $$: { value: shallowCopyInternalPointer(this.$$) } }));
								clone.$$.count.value += 1;
								clone.$$.deleteScheduled = false;
								return clone;
							}
						},
						delete() {
							if (!this.$$.ptr) throwInstanceAlreadyDeleted(this);
							if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) throwBindingError("Object already scheduled for deletion");
							detachFinalizer(this);
							releaseClassHandle(this.$$);
							if (!this.$$.preservePointerOnDelete) {
								this.$$.smartPtr = void 0;
								this.$$.ptr = void 0;
							}
						},
						isDeleted() {
							return !this.$$.ptr;
						},
						deleteLater() {
							if (!this.$$.ptr) throwInstanceAlreadyDeleted(this);
							if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) throwBindingError("Object already scheduled for deletion");
							deletionQueue.push(this);
							if (deletionQueue.length === 1 && delayFunction) delayFunction(flushPendingDeletes);
							this.$$.deleteScheduled = true;
							return this;
						}
					});
				};
				function ClassHandle() {}
				var createNamedFunction = (name, body) => Object.defineProperty(body, "name", { value: name });
				var ensureOverloadTable = (proto, methodName, humanName) => {
					if (void 0 === proto[methodName].overloadTable) {
						var prevFunc = proto[methodName];
						proto[methodName] = function(...args) {
							if (!proto[methodName].overloadTable.hasOwnProperty(args.length)) throwBindingError(`Function '${humanName}' called with an invalid number of arguments (${args.length}) - expects one of (${proto[methodName].overloadTable})!`);
							return proto[methodName].overloadTable[args.length].apply(this, args);
						};
						proto[methodName].overloadTable = [];
						proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
					}
				};
				var exposePublicSymbol = (name, value, numArguments) => {
					if (Module.hasOwnProperty(name)) {
						if (void 0 === numArguments || void 0 !== Module[name].overloadTable && void 0 !== Module[name].overloadTable[numArguments]) throwBindingError(`Cannot register public name '${name}' twice`);
						ensureOverloadTable(Module, name, name);
						if (Module[name].overloadTable.hasOwnProperty(numArguments)) throwBindingError(`Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`);
						Module[name].overloadTable[numArguments] = value;
					} else {
						Module[name] = value;
						Module[name].argCount = numArguments;
					}
				};
				var char_0 = 48;
				var char_9 = 57;
				var makeLegalFunctionName = (name) => {
					name = name.replace(/[^a-zA-Z0-9_]/g, "$");
					var f = name.charCodeAt(0);
					if (f >= char_0 && f <= char_9) return `_${name}`;
					return name;
				};
				function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
					this.name = name;
					this.constructor = constructor;
					this.instancePrototype = instancePrototype;
					this.rawDestructor = rawDestructor;
					this.baseClass = baseClass;
					this.getActualType = getActualType;
					this.upcast = upcast;
					this.downcast = downcast;
					this.pureVirtualFunctions = [];
				}
				var upcastPointer = (ptr, ptrClass, desiredClass) => {
					while (ptrClass !== desiredClass) {
						if (!ptrClass.upcast) throwBindingError(`Expected null or instance of ${desiredClass.name}, got an instance of ${ptrClass.name}`);
						ptr = ptrClass.upcast(ptr);
						ptrClass = ptrClass.baseClass;
					}
					return ptr;
				};
				function constNoSmartPtrRawPointerToWireType(destructors, handle) {
					if (handle === null) {
						if (this.isReference) throwBindingError(`null is not a valid ${this.name}`);
						return 0;
					}
					if (!handle.$$) throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
					if (!handle.$$.ptr) throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
					var handleClass = handle.$$.ptrType.registeredClass;
					return upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
				}
				function genericPointerToWireType(destructors, handle) {
					var ptr;
					if (handle === null) {
						if (this.isReference) throwBindingError(`null is not a valid ${this.name}`);
						if (this.isSmartPointer) {
							ptr = this.rawConstructor();
							if (destructors !== null) destructors.push(this.rawDestructor, ptr);
							return ptr;
						} else return 0;
					}
					if (!handle || !handle.$$) throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
					if (!handle.$$.ptr) throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
					if (!this.isConst && handle.$$.ptrType.isConst) throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name} to parameter type ${this.name}`);
					var handleClass = handle.$$.ptrType.registeredClass;
					ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
					if (this.isSmartPointer) {
						if (void 0 === handle.$$.smartPtr) throwBindingError("Passing raw pointer to smart pointer is illegal");
						switch (this.sharingPolicy) {
							case 0:
								if (handle.$$.smartPtrType === this) ptr = handle.$$.smartPtr;
								else throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name} to parameter type ${this.name}`);
								break;
							case 1:
								ptr = handle.$$.smartPtr;
								break;
							case 2:
								if (handle.$$.smartPtrType === this) ptr = handle.$$.smartPtr;
								else {
									var clonedHandle = handle["clone"]();
									ptr = this.rawShare(ptr, Emval.toHandle(() => clonedHandle["delete"]()));
									if (destructors !== null) destructors.push(this.rawDestructor, ptr);
								}
								break;
							default: throwBindingError("Unsupporting sharing policy");
						}
					}
					return ptr;
				}
				function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
					if (handle === null) {
						if (this.isReference) throwBindingError(`null is not a valid ${this.name}`);
						return 0;
					}
					if (!handle.$$) throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
					if (!handle.$$.ptr) throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
					if (handle.$$.ptrType.isConst) throwBindingError(`Cannot convert argument of type ${handle.$$.ptrType.name} to parameter type ${this.name}`);
					var handleClass = handle.$$.ptrType.registeredClass;
					return upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
				}
				var init_RegisteredPointer = () => {
					Object.assign(RegisteredPointer.prototype, {
						getPointee(ptr) {
							if (this.rawGetPointee) ptr = this.rawGetPointee(ptr);
							return ptr;
						},
						destructor(ptr) {
							this.rawDestructor?.(ptr);
						},
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: readPointer,
						fromWireType: RegisteredPointer_fromWireType
					});
				};
				function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
					this.name = name;
					this.registeredClass = registeredClass;
					this.isReference = isReference;
					this.isConst = isConst;
					this.isSmartPointer = isSmartPointer;
					this.pointeeType = pointeeType;
					this.sharingPolicy = sharingPolicy;
					this.rawGetPointee = rawGetPointee;
					this.rawConstructor = rawConstructor;
					this.rawShare = rawShare;
					this.rawDestructor = rawDestructor;
					if (!isSmartPointer && registeredClass.baseClass === void 0) if (isConst) {
						this["toWireType"] = constNoSmartPtrRawPointerToWireType;
						this.destructorFunction = null;
					} else {
						this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
						this.destructorFunction = null;
					}
					else this["toWireType"] = genericPointerToWireType;
				}
				var replacePublicSymbol = (name, value, numArguments) => {
					if (!Module.hasOwnProperty(name)) throwInternalError("Replacing nonexistent public symbol");
					if (void 0 !== Module[name].overloadTable && void 0 !== numArguments) Module[name].overloadTable[numArguments] = value;
					else {
						Module[name] = value;
						Module[name].argCount = numArguments;
					}
				};
				var dynCallLegacy = (sig, ptr, args) => {
					sig = sig.replace(/p/g, "i");
					var f = Module["dynCall_" + sig];
					return f(ptr, ...args);
				};
				var wasmTableMirror = [];
				var wasmTable;
				var getWasmTableEntry = (funcPtr) => {
					var func = wasmTableMirror[funcPtr];
					if (!func) {
						if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
						wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
					}
					return func;
				};
				var dynCall = (sig, ptr, args = []) => {
					if (sig.includes("j")) return dynCallLegacy(sig, ptr, args);
					return getWasmTableEntry(ptr)(...args);
				};
				var getDynCaller = (sig, ptr) => (...args) => dynCall(sig, ptr, args);
				var embind__requireFunction = (signature, rawFunction) => {
					signature = readLatin1String(signature);
					function makeDynCaller() {
						if (signature.includes("j")) return getDynCaller(signature, rawFunction);
						return getWasmTableEntry(rawFunction);
					}
					var fp = makeDynCaller();
					if (typeof fp != "function") throwBindingError(`unknown function pointer with signature ${signature}: ${rawFunction}`);
					return fp;
				};
				var extendError = (baseErrorType, errorName) => {
					var errorClass = createNamedFunction(errorName, function(message) {
						this.name = errorName;
						this.message = message;
						var stack = new Error(message).stack;
						if (stack !== void 0) this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
					});
					errorClass.prototype = Object.create(baseErrorType.prototype);
					errorClass.prototype.constructor = errorClass;
					errorClass.prototype.toString = function() {
						if (this.message === void 0) return this.name;
						else return `${this.name}: ${this.message}`;
					};
					return errorClass;
				};
				var UnboundTypeError;
				var getTypeName = (type) => {
					var ptr = ___getTypeName(type);
					var rv = readLatin1String(ptr);
					_free(ptr);
					return rv;
				};
				var throwUnboundTypeError = (message, types) => {
					var unboundTypes = [];
					var seen = {};
					function visit(type) {
						if (seen[type]) return;
						if (registeredTypes[type]) return;
						if (typeDependencies[type]) {
							typeDependencies[type].forEach(visit);
							return;
						}
						unboundTypes.push(type);
						seen[type] = true;
					}
					types.forEach(visit);
					throw new UnboundTypeError(`${message}: ` + unboundTypes.map(getTypeName).join([", "]));
				};
				var __embind_register_class = (rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) => {
					name = readLatin1String(name);
					getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
					upcast &&= embind__requireFunction(upcastSignature, upcast);
					downcast &&= embind__requireFunction(downcastSignature, downcast);
					rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
					var legalFunctionName = makeLegalFunctionName(name);
					exposePublicSymbol(legalFunctionName, function() {
						throwUnboundTypeError(`Cannot construct ${name} due to unbound types`, [baseClassRawType]);
					});
					whenDependentTypesAreResolved([
						rawType,
						rawPointerType,
						rawConstPointerType
					], baseClassRawType ? [baseClassRawType] : [], (base) => {
						base = base[0];
						var baseClass;
						var basePrototype;
						if (baseClassRawType) {
							baseClass = base.registeredClass;
							basePrototype = baseClass.instancePrototype;
						} else basePrototype = ClassHandle.prototype;
						var constructor = createNamedFunction(name, function(...args) {
							if (Object.getPrototypeOf(this) !== instancePrototype) throw new BindingError("Use 'new' to construct " + name);
							if (void 0 === registeredClass.constructor_body) throw new BindingError(name + " has no accessible constructor");
							var body = registeredClass.constructor_body[args.length];
							if (void 0 === body) throw new BindingError(`Tried to invoke ctor of ${name} with invalid number of parameters (${args.length}) - expected (${Object.keys(registeredClass.constructor_body).toString()}) parameters instead!`);
							return body.apply(this, args);
						});
						var instancePrototype = Object.create(basePrototype, { constructor: { value: constructor } });
						constructor.prototype = instancePrototype;
						var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
						if (registeredClass.baseClass) {
							registeredClass.baseClass.__derivedClasses ??= [];
							registeredClass.baseClass.__derivedClasses.push(registeredClass);
						}
						var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
						var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
						var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
						registeredPointers[rawType] = {
							pointerType: pointerConverter,
							constPointerType: constPointerConverter
						};
						replacePublicSymbol(legalFunctionName, constructor);
						return [
							referenceConverter,
							pointerConverter,
							constPointerConverter
						];
					});
				};
				var heap32VectorToArray = (count, firstElement) => {
					var array = [];
					for (var i = 0; i < count; i++) array.push(HEAPU32[firstElement + i * 4 >> 2]);
					return array;
				};
				function usesDestructorStack(argTypes) {
					for (var i = 1; i < argTypes.length; ++i) if (argTypes[i] !== null && argTypes[i].destructorFunction === void 0) return true;
					return false;
				}
				var InvokerFunctions = {
					ftf: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam) {
						return function() {
							var rv = invoker(fn);
							return retType["fromWireType"](rv);
						};
					},
					ttfnn: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam, argType0) {
						return function(arg0) {
							var rv = invoker(fn, classParam["toWireType"](null, this), argType0["toWireType"](null, arg0));
							return retType["fromWireType"](rv);
						};
					},
					ttfn: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam) {
						return function() {
							var rv = invoker(fn, classParam["toWireType"](null, this));
							return retType["fromWireType"](rv);
						};
					},
					tffn: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam) {
						return function() {
							invoker(fn, classParam["toWireType"](null, this));
						};
					}
				};
				function createJsInvokerSignature(argTypes, isClassMethodFunc, returns, isAsync) {
					const signature = [
						isClassMethodFunc ? "t" : "f",
						returns ? "t" : "f",
						isAsync ? "t" : "f"
					];
					for (let i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
						const arg = argTypes[i];
						let destructorSig = "";
						if (arg.destructorFunction === void 0) destructorSig = "u";
						else if (arg.destructorFunction === null) destructorSig = "n";
						else destructorSig = "t";
						signature.push(destructorSig);
					}
					return signature.join("");
				}
				function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc, isAsync) {
					var argCount = argTypes.length;
					if (argCount < 2) throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
					var isClassMethodFunc = argTypes[1] !== null && classType !== null;
					var needsDestructorStack = usesDestructorStack(argTypes);
					var returns = argTypes[0].name !== "void";
					var closureArgs = [
						humanName,
						throwBindingError,
						cppInvokerFunc,
						cppTargetFunc,
						runDestructors,
						argTypes[0],
						argTypes[1]
					];
					for (var i = 0; i < argCount - 2; ++i) closureArgs.push(argTypes[i + 2]);
					if (!needsDestructorStack) {
						for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) if (argTypes[i].destructorFunction !== null) closureArgs.push(argTypes[i].destructorFunction);
					}
					return createNamedFunction(humanName, InvokerFunctions[createJsInvokerSignature(argTypes, isClassMethodFunc, returns, isAsync)](...closureArgs));
				}
				var __embind_register_class_constructor = (rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) => {
					var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
					invoker = embind__requireFunction(invokerSignature, invoker);
					whenDependentTypesAreResolved([], [rawClassType], (classType) => {
						classType = classType[0];
						var humanName = `constructor ${classType.name}`;
						if (void 0 === classType.registeredClass.constructor_body) classType.registeredClass.constructor_body = [];
						if (void 0 !== classType.registeredClass.constructor_body[argCount - 1]) throw new BindingError(`Cannot register multiple constructors with identical number of parameters (${argCount - 1}) for class '${classType.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`);
						classType.registeredClass.constructor_body[argCount - 1] = () => {
							throwUnboundTypeError(`Cannot construct ${classType.name} due to unbound types`, rawArgTypes);
						};
						whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
							argTypes.splice(1, 0, null);
							classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor);
							return [];
						});
						return [];
					});
				};
				var getFunctionName = (signature) => {
					signature = signature.trim();
					const argsIndex = signature.indexOf("(");
					if (argsIndex !== -1) return signature.substr(0, argsIndex);
					else return signature;
				};
				var __embind_register_class_function = (rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual, isAsync, isNonnullReturn) => {
					var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
					methodName = readLatin1String(methodName);
					methodName = getFunctionName(methodName);
					rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
					whenDependentTypesAreResolved([], [rawClassType], (classType) => {
						classType = classType[0];
						var humanName = `${classType.name}.${methodName}`;
						if (methodName.startsWith("@@")) methodName = Symbol[methodName.substring(2)];
						if (isPureVirtual) classType.registeredClass.pureVirtualFunctions.push(methodName);
						function unboundTypesHandler() {
							throwUnboundTypeError(`Cannot call ${humanName} due to unbound types`, rawArgTypes);
						}
						var proto = classType.registeredClass.instancePrototype;
						var method = proto[methodName];
						if (void 0 === method || void 0 === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
							unboundTypesHandler.argCount = argCount - 2;
							unboundTypesHandler.className = classType.name;
							proto[methodName] = unboundTypesHandler;
						} else {
							ensureOverloadTable(proto, methodName, humanName);
							proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
						}
						whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
							var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context, isAsync);
							if (void 0 === proto[methodName].overloadTable) {
								memberFunction.argCount = argCount - 2;
								proto[methodName] = memberFunction;
							} else proto[methodName].overloadTable[argCount - 2] = memberFunction;
							return [];
						});
						return [];
					});
				};
				var emval_freelist = [];
				var emval_handles = [];
				var __emval_decref = (handle) => {
					if (handle > 9 && 0 === --emval_handles[handle + 1]) {
						emval_handles[handle] = void 0;
						emval_freelist.push(handle);
					}
				};
				var count_emval_handles = () => emval_handles.length / 2 - 5 - emval_freelist.length;
				var init_emval = () => {
					emval_handles.push(0, 1, void 0, 1, null, 1, true, 1, false, 1);
					Module["count_emval_handles"] = count_emval_handles;
				};
				var Emval = {
					toValue: (handle) => {
						if (!handle) throwBindingError("Cannot use deleted val. handle = " + handle);
						return emval_handles[handle];
					},
					toHandle: (value) => {
						switch (value) {
							case void 0: return 2;
							case null: return 4;
							case true: return 6;
							case false: return 8;
							default: {
								const handle = emval_freelist.pop() || emval_handles.length;
								emval_handles[handle] = value;
								emval_handles[handle + 1] = 1;
								return handle;
							}
						}
					}
				};
				var EmValType = {
					name: "emscripten::val",
					fromWireType: (handle) => {
						var rv = Emval.toValue(handle);
						__emval_decref(handle);
						return rv;
					},
					toWireType: (destructors, value) => Emval.toHandle(value),
					argPackAdvance: GenericWireTypeSize,
					readValueFromPointer: readPointer,
					destructorFunction: null
				};
				var __embind_register_emval = (rawType) => registerType(rawType, EmValType);
				var embindRepr = (v) => {
					if (v === null) return "null";
					var t = typeof v;
					if (t === "object" || t === "array" || t === "function") return v.toString();
					else return "" + v;
				};
				var floatReadValueFromPointer = (name, width) => {
					switch (width) {
						case 4: return function(pointer) {
							return this["fromWireType"](HEAPF32[pointer >> 2]);
						};
						case 8: return function(pointer) {
							return this["fromWireType"](HEAPF64[pointer >> 3]);
						};
						default: throw new TypeError(`invalid float width (${width}): ${name}`);
					}
				};
				var __embind_register_float = (rawType, name, size) => {
					name = readLatin1String(name);
					registerType(rawType, {
						name,
						fromWireType: (value) => value,
						toWireType: (destructors, value) => value,
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: floatReadValueFromPointer(name, size),
						destructorFunction: null
					});
				};
				var integerReadValueFromPointer = (name, width, signed) => {
					switch (width) {
						case 1: return signed ? (pointer) => HEAP8[pointer] : (pointer) => HEAPU8[pointer];
						case 2: return signed ? (pointer) => HEAP16[pointer >> 1] : (pointer) => HEAPU16[pointer >> 1];
						case 4: return signed ? (pointer) => HEAP32[pointer >> 2] : (pointer) => HEAPU32[pointer >> 2];
						default: throw new TypeError(`invalid integer width (${width}): ${name}`);
					}
				};
				var __embind_register_integer = (primitiveType, name, size, minRange, maxRange) => {
					name = readLatin1String(name);
					if (maxRange === -1) maxRange = 4294967295;
					var fromWireType = (value) => value;
					if (minRange === 0) {
						var bitshift = 32 - 8 * size;
						fromWireType = (value) => value << bitshift >>> bitshift;
					}
					var isUnsignedType = name.includes("unsigned");
					var toWireType;
					if (isUnsignedType) toWireType = function(destructors, value) {
						this.name;
						return value >>> 0;
					};
					else toWireType = function(destructors, value) {
						this.name;
						return value;
					};
					registerType(primitiveType, {
						name,
						fromWireType,
						toWireType,
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: integerReadValueFromPointer(name, size, minRange !== 0),
						destructorFunction: null
					});
				};
				var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
					var TA = [
						Int8Array,
						Uint8Array,
						Int16Array,
						Uint16Array,
						Int32Array,
						Uint32Array,
						Float32Array,
						Float64Array
					][dataTypeIndex];
					function decodeMemoryView(handle) {
						var size = HEAPU32[handle >> 2];
						var data = HEAPU32[handle + 4 >> 2];
						return new TA(HEAP8.buffer, data, size);
					}
					name = readLatin1String(name);
					registerType(rawType, {
						name,
						fromWireType: decodeMemoryView,
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: decodeMemoryView
					}, { ignoreDuplicateRegistrations: true });
				};
				var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
					if (!(maxBytesToWrite > 0)) return 0;
					var startIdx = outIdx;
					var endIdx = outIdx + maxBytesToWrite - 1;
					for (var i = 0; i < str.length; ++i) {
						var u = str.charCodeAt(i);
						if (u >= 55296 && u <= 57343) {
							var u1 = str.charCodeAt(++i);
							u = 65536 + ((u & 1023) << 10) | u1 & 1023;
						}
						if (u <= 127) {
							if (outIdx >= endIdx) break;
							heap[outIdx++] = u;
						} else if (u <= 2047) {
							if (outIdx + 1 >= endIdx) break;
							heap[outIdx++] = 192 | u >> 6;
							heap[outIdx++] = 128 | u & 63;
						} else if (u <= 65535) {
							if (outIdx + 2 >= endIdx) break;
							heap[outIdx++] = 224 | u >> 12;
							heap[outIdx++] = 128 | u >> 6 & 63;
							heap[outIdx++] = 128 | u & 63;
						} else {
							if (outIdx + 3 >= endIdx) break;
							heap[outIdx++] = 240 | u >> 18;
							heap[outIdx++] = 128 | u >> 12 & 63;
							heap[outIdx++] = 128 | u >> 6 & 63;
							heap[outIdx++] = 128 | u & 63;
						}
					}
					heap[outIdx] = 0;
					return outIdx - startIdx;
				};
				var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
				var lengthBytesUTF8 = (str) => {
					var len = 0;
					for (var i = 0; i < str.length; ++i) {
						var c = str.charCodeAt(i);
						if (c <= 127) len++;
						else if (c <= 2047) len += 2;
						else if (c >= 55296 && c <= 57343) {
							len += 4;
							++i;
						} else len += 3;
					}
					return len;
				};
				var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder() : void 0;
				var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
					var endIdx = idx + maxBytesToRead;
					var endPtr = idx;
					while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
					if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
					var str = "";
					while (idx < endPtr) {
						var u0 = heapOrArray[idx++];
						if (!(u0 & 128)) {
							str += String.fromCharCode(u0);
							continue;
						}
						var u1 = heapOrArray[idx++] & 63;
						if ((u0 & 224) == 192) {
							str += String.fromCharCode((u0 & 31) << 6 | u1);
							continue;
						}
						var u2 = heapOrArray[idx++] & 63;
						if ((u0 & 240) == 224) u0 = (u0 & 15) << 12 | u1 << 6 | u2;
						else u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
						if (u0 < 65536) str += String.fromCharCode(u0);
						else {
							var ch = u0 - 65536;
							str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
						}
					}
					return str;
				};
				var UTF8ToString = (ptr, maxBytesToRead) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
				var __embind_register_std_string = (rawType, name) => {
					name = readLatin1String(name);
					var stdStringIsUTF8 = true;
					registerType(rawType, {
						name,
						fromWireType(value) {
							var length = HEAPU32[value >> 2];
							var payload = value + 4;
							var str;
							if (stdStringIsUTF8) {
								var decodeStartPtr = payload;
								for (var i = 0; i <= length; ++i) {
									var currentBytePtr = payload + i;
									if (i == length || HEAPU8[currentBytePtr] == 0) {
										var maxRead = currentBytePtr - decodeStartPtr;
										var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
										if (str === void 0) str = stringSegment;
										else {
											str += String.fromCharCode(0);
											str += stringSegment;
										}
										decodeStartPtr = currentBytePtr + 1;
									}
								}
							} else {
								var a = new Array(length);
								for (var i = 0; i < length; ++i) a[i] = String.fromCharCode(HEAPU8[payload + i]);
								str = a.join("");
							}
							_free(value);
							return str;
						},
						toWireType(destructors, value) {
							if (value instanceof ArrayBuffer) value = new Uint8Array(value);
							var length;
							var valueIsOfTypeString = typeof value == "string";
							if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) throwBindingError("Cannot pass non-string to std::string");
							if (stdStringIsUTF8 && valueIsOfTypeString) length = lengthBytesUTF8(value);
							else length = value.length;
							var base = _malloc(4 + length + 1);
							var ptr = base + 4;
							HEAPU32[base >> 2] = length;
							if (stdStringIsUTF8 && valueIsOfTypeString) stringToUTF8(value, ptr, length + 1);
							else if (valueIsOfTypeString) for (var i = 0; i < length; ++i) {
								var charCode = value.charCodeAt(i);
								if (charCode > 255) {
									_free(ptr);
									throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
								}
								HEAPU8[ptr + i] = charCode;
							}
							else for (var i = 0; i < length; ++i) HEAPU8[ptr + i] = value[i];
							if (destructors !== null) destructors.push(_free, base);
							return base;
						},
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: readPointer,
						destructorFunction(ptr) {
							_free(ptr);
						}
					});
				};
				var UTF16Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf-16le") : void 0;
				var UTF16ToString = (ptr, maxBytesToRead) => {
					var endPtr = ptr;
					var idx = endPtr >> 1;
					var maxIdx = idx + maxBytesToRead / 2;
					while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
					endPtr = idx << 1;
					if (endPtr - ptr > 32 && UTF16Decoder) return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
					var str = "";
					for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
						var codeUnit = HEAP16[ptr + i * 2 >> 1];
						if (codeUnit == 0) break;
						str += String.fromCharCode(codeUnit);
					}
					return str;
				};
				var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
					maxBytesToWrite ??= 2147483647;
					if (maxBytesToWrite < 2) return 0;
					maxBytesToWrite -= 2;
					var startPtr = outPtr;
					var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
					for (var i = 0; i < numCharsToWrite; ++i) {
						var codeUnit = str.charCodeAt(i);
						HEAP16[outPtr >> 1] = codeUnit;
						outPtr += 2;
					}
					HEAP16[outPtr >> 1] = 0;
					return outPtr - startPtr;
				};
				var lengthBytesUTF16 = (str) => str.length * 2;
				var UTF32ToString = (ptr, maxBytesToRead) => {
					var i = 0;
					var str = "";
					while (!(i >= maxBytesToRead / 4)) {
						var utf32 = HEAP32[ptr + i * 4 >> 2];
						if (utf32 == 0) break;
						++i;
						if (utf32 >= 65536) {
							var ch = utf32 - 65536;
							str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
						} else str += String.fromCharCode(utf32);
					}
					return str;
				};
				var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
					maxBytesToWrite ??= 2147483647;
					if (maxBytesToWrite < 4) return 0;
					var startPtr = outPtr;
					var endPtr = startPtr + maxBytesToWrite - 4;
					for (var i = 0; i < str.length; ++i) {
						var codeUnit = str.charCodeAt(i);
						if (codeUnit >= 55296 && codeUnit <= 57343) {
							var trailSurrogate = str.charCodeAt(++i);
							codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
						}
						HEAP32[outPtr >> 2] = codeUnit;
						outPtr += 4;
						if (outPtr + 4 > endPtr) break;
					}
					HEAP32[outPtr >> 2] = 0;
					return outPtr - startPtr;
				};
				var lengthBytesUTF32 = (str) => {
					var len = 0;
					for (var i = 0; i < str.length; ++i) {
						var codeUnit = str.charCodeAt(i);
						if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
						len += 4;
					}
					return len;
				};
				var __embind_register_std_wstring = (rawType, charSize, name) => {
					name = readLatin1String(name);
					var decodeString, encodeString, readCharAt, lengthBytesUTF;
					if (charSize === 2) {
						decodeString = UTF16ToString;
						encodeString = stringToUTF16;
						lengthBytesUTF = lengthBytesUTF16;
						readCharAt = (pointer) => HEAPU16[pointer >> 1];
					} else if (charSize === 4) {
						decodeString = UTF32ToString;
						encodeString = stringToUTF32;
						lengthBytesUTF = lengthBytesUTF32;
						readCharAt = (pointer) => HEAPU32[pointer >> 2];
					}
					registerType(rawType, {
						name,
						fromWireType: (value) => {
							var length = HEAPU32[value >> 2];
							var str;
							var decodeStartPtr = value + 4;
							for (var i = 0; i <= length; ++i) {
								var currentBytePtr = value + 4 + i * charSize;
								if (i == length || readCharAt(currentBytePtr) == 0) {
									var maxReadBytes = currentBytePtr - decodeStartPtr;
									var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
									if (str === void 0) str = stringSegment;
									else {
										str += String.fromCharCode(0);
										str += stringSegment;
									}
									decodeStartPtr = currentBytePtr + charSize;
								}
							}
							_free(value);
							return str;
						},
						toWireType: (destructors, value) => {
							if (!(typeof value == "string")) throwBindingError(`Cannot pass non-string to C++ string type ${name}`);
							var length = lengthBytesUTF(value);
							var ptr = _malloc(4 + length + charSize);
							HEAPU32[ptr >> 2] = length / charSize;
							encodeString(value, ptr + 4, length + charSize);
							if (destructors !== null) destructors.push(_free, ptr);
							return ptr;
						},
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: readPointer,
						destructorFunction(ptr) {
							_free(ptr);
						}
					});
				};
				var __embind_register_value_object = (rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) => {
					structRegistrations[rawType] = {
						name: readLatin1String(name),
						rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
						rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
						fields: []
					};
				};
				var __embind_register_value_object_field = (structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) => {
					structRegistrations[structType].fields.push({
						fieldName: readLatin1String(fieldName),
						getterReturnType,
						getter: embind__requireFunction(getterSignature, getter),
						getterContext,
						setterArgumentType,
						setter: embind__requireFunction(setterSignature, setter),
						setterContext
					});
				};
				var __embind_register_void = (rawType, name) => {
					name = readLatin1String(name);
					registerType(rawType, {
						isVoid: true,
						name,
						argPackAdvance: 0,
						fromWireType: () => void 0,
						toWireType: (destructors, o) => void 0
					});
				};
				var __emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);
				var __emscripten_throw_longjmp = () => {
					throw Infinity;
				};
				var emval_methodCallers = [];
				var __emval_call = (caller, handle, destructorsRef, args) => {
					caller = emval_methodCallers[caller];
					handle = Emval.toValue(handle);
					return caller(null, handle, destructorsRef, args);
				};
				var emval_symbols = {};
				var getStringOrSymbol = (address) => {
					var symbol = emval_symbols[address];
					if (symbol === void 0) return readLatin1String(address);
					return symbol;
				};
				var emval_get_global = () => {
					if (typeof globalThis == "object") return globalThis;
					function testGlobal(obj) {
						obj["$$$embind_global$$$"] = obj;
						var success = typeof $$$embind_global$$$ == "object" && obj["$$$embind_global$$$"] == obj;
						if (!success) delete obj["$$$embind_global$$$"];
						return success;
					}
					if (typeof $$$embind_global$$$ == "object") return $$$embind_global$$$;
					if (typeof global == "object" && testGlobal(global)) $$$embind_global$$$ = global;
					else if (typeof self == "object" && testGlobal(self)) $$$embind_global$$$ = self;
					if (typeof $$$embind_global$$$ == "object") return $$$embind_global$$$;
					throw Error("unable to get global object.");
				};
				var __emval_get_global = (name) => {
					if (name === 0) return Emval.toHandle(emval_get_global());
					else {
						name = getStringOrSymbol(name);
						return Emval.toHandle(emval_get_global()[name]);
					}
				};
				var emval_addMethodCaller = (caller) => {
					var id = emval_methodCallers.length;
					emval_methodCallers.push(caller);
					return id;
				};
				var requireRegisteredType = (rawType, humanName) => {
					var impl = registeredTypes[rawType];
					if (void 0 === impl) throwBindingError(`${humanName} has unknown type ${getTypeName(rawType)}`);
					return impl;
				};
				var emval_lookupTypes = (argCount, argTypes) => {
					var a = new Array(argCount);
					for (var i = 0; i < argCount; ++i) a[i] = requireRegisteredType(HEAPU32[argTypes + i * 4 >> 2], "parameter " + i);
					return a;
				};
				var reflectConstruct = Reflect.construct;
				var emval_returnValue = (returnType, destructorsRef, handle) => {
					var destructors = [];
					var result = returnType["toWireType"](destructors, handle);
					if (destructors.length) HEAPU32[destructorsRef >> 2] = Emval.toHandle(destructors);
					return result;
				};
				var __emval_get_method_caller = (argCount, argTypes, kind) => {
					var types = emval_lookupTypes(argCount, argTypes);
					var retType = types.shift();
					argCount--;
					var argN = new Array(argCount);
					var invokerFunction = (obj, func, destructorsRef, args) => {
						var offset = 0;
						for (var i = 0; i < argCount; ++i) {
							argN[i] = types[i]["readValueFromPointer"](args + offset);
							offset += types[i].argPackAdvance;
						}
						return emval_returnValue(retType, destructorsRef, kind === 1 ? reflectConstruct(func, argN) : func.apply(obj, argN));
					};
					return emval_addMethodCaller(createNamedFunction(`methodCaller<(${types.map((t) => t.name).join(", ")}) => ${retType.name}>`, invokerFunction));
				};
				var __emval_run_destructors = (handle) => {
					runDestructors(Emval.toValue(handle));
					__emval_decref(handle);
				};
				var __emval_take_value = (type, arg) => {
					type = requireRegisteredType(type, "_emval_take_value");
					var v = type["readValueFromPointer"](arg);
					return Emval.toHandle(v);
				};
				var getHeapMax = () => 2147483648;
				var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
				var growMemory = (size) => {
					var pages = (size - wasmMemory.buffer.byteLength + 65535) / 65536 | 0;
					try {
						wasmMemory.grow(pages);
						updateMemoryViews();
						return 1;
					} catch (e) {}
				};
				var _emscripten_resize_heap = (requestedSize) => {
					var oldSize = HEAPU8.length;
					requestedSize >>>= 0;
					var maxHeapSize = getHeapMax();
					if (requestedSize > maxHeapSize) return false;
					for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
						var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
						overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
						if (growMemory(Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536)))) return true;
					}
					return false;
				};
				var ENV = {};
				var getExecutableName = () => thisProgram || "./this.program";
				var getEnvStrings = () => {
					if (!getEnvStrings.strings) {
						var env = {
							USER: "web_user",
							LOGNAME: "web_user",
							PATH: "/",
							PWD: "/",
							HOME: "/home/web_user",
							LANG: (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
							_: getExecutableName()
						};
						for (var x in ENV) if (ENV[x] === void 0) delete env[x];
						else env[x] = ENV[x];
						var strings = [];
						for (var x in env) strings.push(`${x}=${env[x]}`);
						getEnvStrings.strings = strings;
					}
					return getEnvStrings.strings;
				};
				var stringToAscii = (str, buffer) => {
					for (var i = 0; i < str.length; ++i) HEAP8[buffer++] = str.charCodeAt(i);
					HEAP8[buffer] = 0;
				};
				var _environ_get = (__environ, environ_buf) => {
					var bufSize = 0;
					getEnvStrings().forEach((string, i) => {
						var ptr = environ_buf + bufSize;
						HEAPU32[__environ + i * 4 >> 2] = ptr;
						stringToAscii(string, ptr);
						bufSize += string.length + 1;
					});
					return 0;
				};
				var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
					var strings = getEnvStrings();
					HEAPU32[penviron_count >> 2] = strings.length;
					var bufSize = 0;
					strings.forEach((string) => bufSize += string.length + 1);
					HEAPU32[penviron_buf_size >> 2] = bufSize;
					return 0;
				};
				var runtimeKeepaliveCounter = 0;
				var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
				var _proc_exit = (code) => {
					if (!keepRuntimeAlive()) {
						Module["onExit"]?.(code);
						ABORT = true;
					}
					quit_(code, new ExitStatus(code));
				};
				var exitJS = (status, implicit) => {
					_proc_exit(status);
				};
				var _exit = exitJS;
				var _fd_close = (fd) => 52;
				var convertI32PairToI53Checked = (lo, hi) => hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
				function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
					convertI32PairToI53Checked(offset_low, offset_high);
					return 70;
				}
				var printCharBuffers = [
					null,
					[],
					[]
				];
				var printChar = (stream, curr) => {
					var buffer = printCharBuffers[stream];
					if (curr === 0 || curr === 10) {
						(stream === 1 ? out : err)(UTF8ArrayToString(buffer));
						buffer.length = 0;
					} else buffer.push(curr);
				};
				var _fd_write = (fd, iov, iovcnt, pnum) => {
					var num = 0;
					for (var i = 0; i < iovcnt; i++) {
						var ptr = HEAPU32[iov >> 2];
						var len = HEAPU32[iov + 4 >> 2];
						iov += 8;
						for (var j = 0; j < len; j++) printChar(fd, HEAPU8[ptr + j]);
						num += len;
					}
					HEAPU32[pnum >> 2] = num;
					return 0;
				};
				var getCFunc = (ident) => {
					return Module["_" + ident];
				};
				var writeArrayToMemory = (array, buffer) => {
					HEAP8.set(array, buffer);
				};
				var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
				var stringToUTF8OnStack = (str) => {
					var size = lengthBytesUTF8(str) + 1;
					var ret = stackAlloc(size);
					stringToUTF8(str, ret, size);
					return ret;
				};
				var ccall = (ident, returnType, argTypes, args, opts) => {
					var toC = {
						string: (str) => {
							var ret = 0;
							if (str !== null && str !== void 0 && str !== 0) ret = stringToUTF8OnStack(str);
							return ret;
						},
						array: (arr) => {
							var ret = stackAlloc(arr.length);
							writeArrayToMemory(arr, ret);
							return ret;
						}
					};
					function convertReturnValue(ret) {
						if (returnType === "string") return UTF8ToString(ret);
						if (returnType === "boolean") return Boolean(ret);
						return ret;
					}
					var func = getCFunc(ident);
					var cArgs = [];
					var stack = 0;
					if (args) for (var i = 0; i < args.length; i++) {
						var converter = toC[argTypes[i]];
						if (converter) {
							if (stack === 0) stack = stackSave();
							cArgs[i] = converter(args[i]);
						} else cArgs[i] = args[i];
					}
					var ret = func(...cArgs);
					function onDone(ret) {
						if (stack !== 0) stackRestore(stack);
						return convertReturnValue(ret);
					}
					ret = onDone(ret);
					return ret;
				};
				InternalError = Module["InternalError"] = class InternalError extends Error {
					constructor(message) {
						super(message);
						this.name = "InternalError";
					}
				};
				embind_init_charCodes();
				BindingError = Module["BindingError"] = class BindingError extends Error {
					constructor(message) {
						super(message);
						this.name = "BindingError";
					}
				};
				init_ClassHandle();
				init_RegisteredPointer();
				UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
				init_emval();
				var wasmImports = {
					g: ___cxa_throw,
					t: __abort_js,
					q: __embind_finalize_value_object,
					s: __embind_register_bigint,
					F: __embind_register_bool,
					p: __embind_register_class,
					o: __embind_register_class_constructor,
					c: __embind_register_class_function,
					D: __embind_register_emval,
					l: __embind_register_float,
					b: __embind_register_integer,
					a: __embind_register_memory_view,
					E: __embind_register_std_string,
					h: __embind_register_std_wstring,
					C: __embind_register_value_object,
					d: __embind_register_value_object_field,
					G: __embind_register_void,
					z: __emscripten_memcpy_js,
					u: __emscripten_throw_longjmp,
					I: __emval_call,
					J: __emval_decref,
					K: __emval_get_global,
					m: __emval_get_method_caller,
					H: __emval_run_destructors,
					n: __emval_take_value,
					v: _emscripten_resize_heap,
					w: _environ_get,
					x: _environ_sizes_get,
					B: _exit,
					y: _fd_close,
					r: _fd_seek,
					i: _fd_write,
					k: invoke_ii,
					j: invoke_iii,
					A: invoke_iiii,
					f: invoke_vi,
					e: invoke_viii
				};
				var wasmExports;
				createWasm();
				var ___getTypeName = (a0) => (___getTypeName = wasmExports["N"])(a0);
				var _malloc = (a0) => (_malloc = wasmExports["P"])(a0);
				var _free = (a0) => (_free = wasmExports["Q"])(a0);
				var _setThrew = (a0, a1) => (_setThrew = wasmExports["R"])(a0, a1);
				var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports["S"])(a0);
				var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports["T"])(a0);
				var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["U"])();
				var dynCall_jiji = Module["dynCall_jiji"] = (a0, a1, a2, a3, a4) => (dynCall_jiji = Module["dynCall_jiji"] = wasmExports["V"])(a0, a1, a2, a3, a4);
				function invoke_vi(index, a1) {
					var sp = stackSave();
					try {
						getWasmTableEntry(index)(a1);
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				function invoke_ii(index, a1) {
					var sp = stackSave();
					try {
						return getWasmTableEntry(index)(a1);
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				function invoke_viii(index, a1, a2, a3) {
					var sp = stackSave();
					try {
						getWasmTableEntry(index)(a1, a2, a3);
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				function invoke_iiii(index, a1, a2, a3) {
					var sp = stackSave();
					try {
						return getWasmTableEntry(index)(a1, a2, a3);
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				function invoke_iii(index, a1, a2) {
					var sp = stackSave();
					try {
						return getWasmTableEntry(index)(a1, a2);
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				Module["ccall"] = ccall;
				var calledRun;
				dependenciesFulfilled = function runCaller() {
					if (!calledRun) run();
					if (!calledRun) dependenciesFulfilled = runCaller;
				};
				function run() {
					if (runDependencies > 0) return;
					preRun();
					if (runDependencies > 0) return;
					function doRun() {
						if (calledRun) return;
						calledRun = true;
						Module["calledRun"] = true;
						if (ABORT) return;
						initRuntime();
						readyPromiseResolve(Module);
						Module["onRuntimeInitialized"]?.();
						postRun();
					}
					if (Module["setStatus"]) {
						Module["setStatus"]("Running...");
						setTimeout(() => {
							setTimeout(() => Module["setStatus"](""), 1);
							doRun();
						}, 1);
					} else doRun();
				}
				if (Module["preInit"]) {
					if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
					while (Module["preInit"].length > 0) Module["preInit"].pop()();
				}
				run();
				moduleRtn = readyPromise;
				return moduleRtn;
			});
		})();
		if (typeof exports === "object" && typeof module === "object") {
			module.exports = libjpegturbowasm_decode;
			module.exports.default = libjpegturbowasm_decode;
		} else if (typeof define === "function" && define["amd"]) define([], () => libjpegturbowasm_decode);
	})))());
	function isSignedPixelData(frameInfo) {
		return (frameInfo?.isSigned === true || frameInfo?.isSigned === 1) && frameInfo.componentCount === 1;
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/decoders/getPixelData.js
	function getPixelData(frameInfo, decodedBuffer, signedOverride) {
		const signed = isSignedPixelData({
			isSigned: signedOverride ?? frameInfo?.isSigned,
			componentCount: frameInfo?.componentCount
		});
		if (frameInfo?.bitsPerSample > 8) {
			if (signed) return new Int16Array(decodedBuffer.buffer, decodedBuffer.byteOffset, decodedBuffer.byteLength / 2);
			return new Uint16Array(decodedBuffer.buffer, decodedBuffer.byteOffset, decodedBuffer.byteLength / 2);
		}
		if (signed) return new Int8Array(decodedBuffer.buffer, decodedBuffer.byteOffset, decodedBuffer.byteLength);
		return new Uint8Array(decodedBuffer.buffer, decodedBuffer.byteOffset, decodedBuffer.byteLength);
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/wasmBasePath.js
	let wasmBasePath;
	function setWasmBasePath(basePath) {
		wasmBasePath = basePath || void 0;
	}
	function setWasmBasePathFromConfig(decodeConfig) {
		if (decodeConfig?.wasmBasePath !== void 0) setWasmBasePath(decodeConfig.wasmBasePath);
	}
	function resolveWasmUrl(fileName, defaultUrl) {
		if (!wasmBasePath) return defaultUrl.toString();
		const path = `${wasmBasePath.endsWith("/") ? wasmBasePath : `${wasmBasePath}/`}${fileName}`;
		const href = typeof self !== "undefined" ? self.location?.href : void 0;
		if (!href) return path;
		try {
			return new URL(path, href).toString();
		} catch {
			return path;
		}
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/decoders/decodeJPEGBaseline8Bit.js
	const libjpegTurboWasm = new URL("/assets/libjpegturbowasm_decode-7ZJ2wGuU.wasm", "" + self.location.href);
	const local$5 = {
		codec: void 0,
		decoder: void 0
	};
	function initLibjpegTurbo(decodeConfig) {
		setWasmBasePathFromConfig(decodeConfig);
		if (local$5.codec) return Promise.resolve();
		const libjpegTurboModule = (0, import_libjpegturbowasm_decode.default)({ locateFile: (f) => {
			if (f.endsWith(".wasm")) return resolveWasmUrl("libjpegturbowasm_decode.wasm", libjpegTurboWasm);
			return f;
		} });
		return new Promise((resolve, reject) => {
			libjpegTurboModule.then((instance) => {
				local$5.codec = instance;
				local$5.decoder = new instance.JPEGDecoder();
				resolve();
			}, reject);
		});
	}
	async function decodeAsync$3(compressedImageFrame, imageInfo) {
		await initLibjpegTurbo();
		const decoder = local$5.decoder;
		decoder.getEncodedBuffer(compressedImageFrame.length).set(compressedImageFrame);
		decoder.decode();
		const frameInfo = decoder.getFrameInfo();
		const decodedPixelsInWASM = decoder.getDecodedBuffer();
		const encodedImageInfo = {
			columns: frameInfo.width,
			rows: frameInfo.height,
			bitsPerPixel: frameInfo.bitsPerSample,
			signed: imageInfo.signed,
			bytesPerPixel: imageInfo.bytesPerPixel,
			componentsPerPixel: frameInfo.componentCount
		};
		const pixelData = getPixelData(frameInfo, decodedPixelsInWASM);
		const encodeOptions = { frameInfo };
		return {
			...imageInfo,
			pixelData,
			imageInfo: encodedImageInfo,
			encodeOptions,
			...encodeOptions,
			...encodedImageInfo
		};
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/codecs/jpeg.js
	var jpeg_exports = /* @__PURE__ */ __exportAll({ default: () => JpegImage });
	function buildHuffmanTable(codeLengths, values) {
		var k = 0, code = [], i, j, length = 16;
		while (length > 0 && !codeLengths[length - 1]) length--;
		code.push({
			children: [],
			index: 0
		});
		var p = code[0], q;
		for (i = 0; i < length; i++) {
			for (j = 0; j < codeLengths[i]; j++) {
				p = code.pop();
				p.children[p.index] = values[k];
				while (p.index > 0) p = code.pop();
				p.index++;
				code.push(p);
				while (code.length <= i) {
					code.push(q = {
						children: [],
						index: 0
					});
					p.children[p.index] = q.children;
					p = q;
				}
				k++;
			}
			if (i + 1 < length) {
				code.push(q = {
					children: [],
					index: 0
				});
				p.children[p.index] = q.children;
				p = q;
			}
		}
		return code[0].children;
	}
	function getBlockBufferOffset(component, row, col) {
		return 64 * ((component.blocksPerLine + 1) * row + col);
	}
	function decodeScan(data, offset, frame, components, resetInterval, spectralStart, spectralEnd, successivePrev, successive) {
		frame.precision;
		frame.samplesPerLine;
		frame.scanLines;
		var mcusPerLine = frame.mcusPerLine;
		var progressive = frame.progressive;
		frame.maxH;
		frame.maxV;
		var startOffset = offset, bitsData = 0, bitsCount = 0;
		function readBit() {
			if (bitsCount > 0) {
				bitsCount--;
				return bitsData >> bitsCount & 1;
			}
			bitsData = data[offset++];
			if (bitsData == 255) {
				var nextByte = data[offset++];
				if (nextByte) throw "unexpected marker: " + (bitsData << 8 | nextByte).toString(16);
			}
			bitsCount = 7;
			return bitsData >>> 7;
		}
		function decodeHuffman(tree) {
			var node = tree;
			var bit;
			while ((bit = readBit()) !== null) {
				node = node[bit];
				if (typeof node === "number") return node;
				if (typeof node !== "object") throw "invalid huffman sequence";
			}
			return null;
		}
		function receive(length) {
			var n = 0;
			while (length > 0) {
				var bit = readBit();
				if (bit === null) return;
				n = n << 1 | bit;
				length--;
			}
			return n;
		}
		function receiveAndExtend(length) {
			var n = receive(length);
			if (n >= 1 << length - 1) return n;
			return n + (-1 << length) + 1;
		}
		function decodeBaseline(component, offset) {
			var t = decodeHuffman(component.huffmanTableDC);
			var diff = t === 0 ? 0 : receiveAndExtend(t);
			component.blockData[offset] = component.pred += diff;
			var k = 1;
			while (k < 64) {
				var rs = decodeHuffman(component.huffmanTableAC);
				var s = rs & 15, r = rs >> 4;
				if (s === 0) {
					if (r < 15) break;
					k += 16;
					continue;
				}
				k += r;
				var z = dctZigZag[k];
				component.blockData[offset + z] = receiveAndExtend(s);
				k++;
			}
		}
		function decodeDCFirst(component, offset) {
			var t = decodeHuffman(component.huffmanTableDC);
			var diff = t === 0 ? 0 : receiveAndExtend(t) << successive;
			component.blockData[offset] = component.pred += diff;
		}
		function decodeDCSuccessive(component, offset) {
			component.blockData[offset] |= readBit() << successive;
		}
		var eobrun = 0;
		function decodeACFirst(component, offset) {
			if (eobrun > 0) {
				eobrun--;
				return;
			}
			var k = spectralStart, e = spectralEnd;
			while (k <= e) {
				var rs = decodeHuffman(component.huffmanTableAC);
				var s = rs & 15, r = rs >> 4;
				if (s === 0) {
					if (r < 15) {
						eobrun = receive(r) + (1 << r) - 1;
						break;
					}
					k += 16;
					continue;
				}
				k += r;
				var z = dctZigZag[k];
				component.blockData[offset + z] = receiveAndExtend(s) * (1 << successive);
				k++;
			}
		}
		var successiveACState = 0, successiveACNextValue;
		function decodeACSuccessive(component, offset) {
			var k = spectralStart, e = spectralEnd, r = 0;
			while (k <= e) {
				var z = dctZigZag[k];
				switch (successiveACState) {
					case 0:
						var rs = decodeHuffman(component.huffmanTableAC);
						var s = rs & 15;
						r = rs >> 4;
						if (s === 0) if (r < 15) {
							eobrun = receive(r) + (1 << r);
							successiveACState = 4;
						} else {
							r = 16;
							successiveACState = 1;
						}
						else {
							if (s !== 1) throw "invalid ACn encoding";
							successiveACNextValue = receiveAndExtend(s);
							successiveACState = r ? 2 : 3;
						}
						continue;
					case 1:
					case 2:
						if (component.blockData[offset + z]) component.blockData[offset + z] += readBit() << successive;
						else {
							r--;
							if (r === 0) successiveACState = successiveACState == 2 ? 3 : 0;
						}
						break;
					case 3:
						if (component.blockData[offset + z]) component.blockData[offset + z] += readBit() << successive;
						else {
							component.blockData[offset + z] = successiveACNextValue << successive;
							successiveACState = 0;
						}
						break;
					case 4: if (component.blockData[offset + z]) component.blockData[offset + z] += readBit() << successive;
				}
				k++;
			}
			if (successiveACState === 4) {
				eobrun--;
				if (eobrun === 0) successiveACState = 0;
			}
		}
		function decodeMcu(component, decode, mcu, row, col) {
			var mcuRow = mcu / mcusPerLine | 0;
			var mcuCol = mcu % mcusPerLine;
			decode(component, getBlockBufferOffset(component, mcuRow * component.v + row, mcuCol * component.h + col));
		}
		function decodeBlock(component, decode, mcu) {
			decode(component, getBlockBufferOffset(component, mcu / component.blocksPerLine | 0, mcu % component.blocksPerLine));
		}
		var componentsLength = components.length;
		var component, i, j, k, n;
		var decodeFn;
		if (progressive) if (spectralStart === 0) decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
		else decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
		else decodeFn = decodeBaseline;
		var mcu = 0, marker;
		var mcuExpected;
		if (componentsLength == 1) mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
		else mcuExpected = mcusPerLine * frame.mcusPerColumn;
		if (!resetInterval) resetInterval = mcuExpected;
		var h, v;
		while (mcu < mcuExpected) {
			for (i = 0; i < componentsLength; i++) components[i].pred = 0;
			eobrun = 0;
			if (componentsLength == 1) {
				component = components[0];
				for (n = 0; n < resetInterval; n++) {
					decodeBlock(component, decodeFn, mcu);
					mcu++;
				}
			} else for (n = 0; n < resetInterval; n++) {
				for (i = 0; i < componentsLength; i++) {
					component = components[i];
					h = component.h;
					v = component.v;
					for (j = 0; j < v; j++) for (k = 0; k < h; k++) decodeMcu(component, decodeFn, mcu, j, k);
				}
				mcu++;
			}
			bitsCount = 0;
			marker = data[offset] << 8 | data[offset + 1];
			if (marker <= 65280) throw "marker was not found";
			if (marker >= 65488 && marker <= 65495) offset += 2;
			else break;
		}
		return offset - startOffset;
	}
	function quantizeAndInverse(component, blockBufferOffset, p) {
		var qt = component.quantizationTable;
		var v0, v1, v2, v3, v4, v5, v6, v7, t;
		var i;
		for (i = 0; i < 64; i++) p[i] = component.blockData[blockBufferOffset + i] * qt[i];
		for (i = 0; i < 8; ++i) {
			var row = 8 * i;
			if (p[1 + row] === 0 && p[2 + row] === 0 && p[3 + row] === 0 && p[4 + row] === 0 && p[5 + row] === 0 && p[6 + row] === 0 && p[7 + row] === 0) {
				t = dctSqrt2 * p[0 + row] + 512 >> 10;
				p[0 + row] = t;
				p[1 + row] = t;
				p[2 + row] = t;
				p[3 + row] = t;
				p[4 + row] = t;
				p[5 + row] = t;
				p[6 + row] = t;
				p[7 + row] = t;
				continue;
			}
			v0 = dctSqrt2 * p[0 + row] + 128 >> 8;
			v1 = dctSqrt2 * p[4 + row] + 128 >> 8;
			v2 = p[2 + row];
			v3 = p[6 + row];
			v4 = dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128 >> 8;
			v7 = dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128 >> 8;
			v5 = p[3 + row] << 4;
			v6 = p[5 + row] << 4;
			t = v0 - v1 + 1 >> 1;
			v0 = v0 + v1 + 1 >> 1;
			v1 = t;
			t = v2 * dctSin6 + v3 * dctCos6 + 128 >> 8;
			v2 = v2 * dctCos6 - v3 * dctSin6 + 128 >> 8;
			v3 = t;
			t = v4 - v6 + 1 >> 1;
			v4 = v4 + v6 + 1 >> 1;
			v6 = t;
			t = v7 + v5 + 1 >> 1;
			v5 = v7 - v5 + 1 >> 1;
			v7 = t;
			t = v0 - v3 + 1 >> 1;
			v0 = v0 + v3 + 1 >> 1;
			v3 = t;
			t = v1 - v2 + 1 >> 1;
			v1 = v1 + v2 + 1 >> 1;
			v2 = t;
			t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
			v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
			v7 = t;
			t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
			v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
			v6 = t;
			p[0 + row] = v0 + v7;
			p[7 + row] = v0 - v7;
			p[1 + row] = v1 + v6;
			p[6 + row] = v1 - v6;
			p[2 + row] = v2 + v5;
			p[5 + row] = v2 - v5;
			p[3 + row] = v3 + v4;
			p[4 + row] = v3 - v4;
		}
		for (i = 0; i < 8; ++i) {
			var col = i;
			if (p[8 + col] === 0 && p[16 + col] === 0 && p[24 + col] === 0 && p[32 + col] === 0 && p[40 + col] === 0 && p[48 + col] === 0 && p[56 + col] === 0) {
				t = dctSqrt2 * p[i + 0] + 8192 >> 14;
				p[0 + col] = t;
				p[8 + col] = t;
				p[16 + col] = t;
				p[24 + col] = t;
				p[32 + col] = t;
				p[40 + col] = t;
				p[48 + col] = t;
				p[56 + col] = t;
				continue;
			}
			v0 = dctSqrt2 * p[0 + col] + 2048 >> 12;
			v1 = dctSqrt2 * p[32 + col] + 2048 >> 12;
			v2 = p[16 + col];
			v3 = p[48 + col];
			v4 = dctSqrt1d2 * (p[8 + col] - p[56 + col]) + 2048 >> 12;
			v7 = dctSqrt1d2 * (p[8 + col] + p[56 + col]) + 2048 >> 12;
			v5 = p[24 + col];
			v6 = p[40 + col];
			t = v0 - v1 + 1 >> 1;
			v0 = v0 + v1 + 1 >> 1;
			v1 = t;
			t = v2 * dctSin6 + v3 * dctCos6 + 2048 >> 12;
			v2 = v2 * dctCos6 - v3 * dctSin6 + 2048 >> 12;
			v3 = t;
			t = v4 - v6 + 1 >> 1;
			v4 = v4 + v6 + 1 >> 1;
			v6 = t;
			t = v7 + v5 + 1 >> 1;
			v5 = v7 - v5 + 1 >> 1;
			v7 = t;
			t = v0 - v3 + 1 >> 1;
			v0 = v0 + v3 + 1 >> 1;
			v3 = t;
			t = v1 - v2 + 1 >> 1;
			v1 = v1 + v2 + 1 >> 1;
			v2 = t;
			t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
			v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
			v7 = t;
			t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
			v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
			v6 = t;
			p[0 + col] = v0 + v7;
			p[56 + col] = v0 - v7;
			p[8 + col] = v1 + v6;
			p[48 + col] = v1 - v6;
			p[16 + col] = v2 + v5;
			p[40 + col] = v2 - v5;
			p[24 + col] = v3 + v4;
			p[32 + col] = v3 - v4;
		}
		for (i = 0; i < 64; ++i) {
			var index = blockBufferOffset + i;
			var q = p[i];
			q = q <= -2056 / component.bitConversion ? 0 : q >= 2024 / component.bitConversion ? 255 / component.bitConversion : q + 2056 / component.bitConversion >> 4;
			component.blockData[index] = q;
		}
	}
	function buildComponentData(frame, component) {
		var blocksPerLine = component.blocksPerLine;
		var blocksPerColumn = component.blocksPerColumn;
		blocksPerLine << 3;
		var computationBuffer = /* @__PURE__ */ new Int32Array(64);
		for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) quantizeAndInverse(component, getBlockBufferOffset(component, blockRow, blockCol), computationBuffer);
		return component.blockData;
	}
	function clampToUint8(a) {
		return a <= 0 ? 0 : a >= 255 ? 255 : a | 0;
	}
	var ColorSpace, dctZigZag, dctCos1, dctSin1, dctCos3, dctSin3, dctCos6, dctSin6, dctSqrt2, dctSqrt1d2, JpegImage;
	var init_jpeg = __esmMin((() => {
		ColorSpace = {
			Unkown: 0,
			Grayscale: 1,
			AdobeRGB: 2,
			RGB: 3,
			CYMK: 4
		};
		dctZigZag = new Int32Array([
			0,
			1,
			8,
			16,
			9,
			2,
			3,
			10,
			17,
			24,
			32,
			25,
			18,
			11,
			4,
			5,
			12,
			19,
			26,
			33,
			40,
			48,
			41,
			34,
			27,
			20,
			13,
			6,
			7,
			14,
			21,
			28,
			35,
			42,
			49,
			56,
			57,
			50,
			43,
			36,
			29,
			22,
			15,
			23,
			30,
			37,
			44,
			51,
			58,
			59,
			52,
			45,
			38,
			31,
			39,
			46,
			53,
			60,
			61,
			54,
			47,
			55,
			62,
			63
		]);
		dctCos1 = 4017;
		dctSin1 = 799;
		dctCos3 = 3406;
		dctSin3 = 2276;
		dctCos6 = 1567;
		dctSin6 = 3784;
		dctSqrt2 = 5793;
		dctSqrt1d2 = 2896;
		JpegImage = class {
			constructor() {}
			load(path) {
				var handleData = function(data) {
					this.parse(data);
					if (this.onload) this.onload();
				}.bind(this);
				if (path.indexOf("data:") > -1) {
					var offset = path.indexOf("base64,") + 7;
					var data = atob(path.substring(offset));
					var arr = new Uint8Array(data.length);
					for (var i = data.length - 1; i >= 0; i--) arr[i] = data.charCodeAt(i);
					handleData(data);
				} else {
					var xhr = new XMLHttpRequest();
					xhr.open("GET", path, true);
					xhr.responseType = "arraybuffer";
					xhr.onload = function() {
						handleData(new Uint8Array(xhr.response));
					}.bind(this);
					xhr.send(null);
				}
			}
			parse(data) {
				function readUint16() {
					var value = data[offset] << 8 | data[offset + 1];
					offset += 2;
					return value;
				}
				function readDataBlock() {
					var length = readUint16();
					var array = data.subarray(offset, offset + length - 2);
					offset += array.length;
					return array;
				}
				function prepareComponents(frame) {
					var mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / frame.maxH);
					var mcusPerColumn = Math.ceil(frame.scanLines / 8 / frame.maxV);
					for (var i = 0; i < frame.components.length; i++) {
						component = frame.components[i];
						var blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / frame.maxH);
						var blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines / 8) * component.v / frame.maxV);
						var blocksPerLineForMcu = mcusPerLine * component.h;
						var blocksBufferSize = 64 * (mcusPerColumn * component.v) * (blocksPerLineForMcu + 1);
						component.blockData = new Int16Array(blocksBufferSize);
						component.blocksPerLine = blocksPerLine;
						component.blocksPerColumn = blocksPerColumn;
					}
					frame.mcusPerLine = mcusPerLine;
					frame.mcusPerColumn = mcusPerColumn;
				}
				var offset = 0;
				data.length;
				var jfif = null;
				var adobe = null;
				var frame, resetInterval;
				var quantizationTables = [];
				var huffmanTablesAC = [], huffmanTablesDC = [];
				var fileMarker = readUint16();
				if (fileMarker != 65496) throw "SOI not found";
				fileMarker = readUint16();
				while (fileMarker != 65497) {
					var i, j, l;
					switch (fileMarker) {
						case 65504:
						case 65505:
						case 65506:
						case 65507:
						case 65508:
						case 65509:
						case 65510:
						case 65511:
						case 65512:
						case 65513:
						case 65514:
						case 65515:
						case 65516:
						case 65517:
						case 65518:
						case 65519:
						case 65534:
							var appData = readDataBlock();
							if (fileMarker === 65504) {
								if (appData[0] === 74 && appData[1] === 70 && appData[2] === 73 && appData[3] === 70 && appData[4] === 0) jfif = {
									version: {
										major: appData[5],
										minor: appData[6]
									},
									densityUnits: appData[7],
									xDensity: appData[8] << 8 | appData[9],
									yDensity: appData[10] << 8 | appData[11],
									thumbWidth: appData[12],
									thumbHeight: appData[13],
									thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
								};
							}
							if (fileMarker === 65518) {
								if (appData[0] === 65 && appData[1] === 100 && appData[2] === 111 && appData[3] === 98 && appData[4] === 101 && appData[5] === 0) adobe = {
									version: appData[6],
									flags0: appData[7] << 8 | appData[8],
									flags1: appData[9] << 8 | appData[10],
									transformCode: appData[11]
								};
							}
							break;
						case 65499:
							var quantizationTablesEnd = readUint16() + offset - 2;
							while (offset < quantizationTablesEnd) {
								var quantizationTableSpec = data[offset++];
								var tableData = /* @__PURE__ */ new Int32Array(64);
								if (quantizationTableSpec >> 4 === 0) for (j = 0; j < 64; j++) {
									var z = dctZigZag[j];
									tableData[z] = data[offset++];
								}
								else if (quantizationTableSpec >> 4 === 1) for (j = 0; j < 64; j++) {
									var zz = dctZigZag[j];
									tableData[zz] = readUint16();
								}
								else throw "DQT: invalid table spec";
								quantizationTables[quantizationTableSpec & 15] = tableData;
							}
							break;
						case 65472:
						case 65473:
						case 65474:
							if (frame) throw "Only single frame JPEGs supported";
							readUint16();
							frame = {};
							frame.extended = fileMarker === 65473;
							frame.progressive = fileMarker === 65474;
							frame.precision = data[offset++];
							frame.scanLines = readUint16();
							frame.samplesPerLine = readUint16();
							frame.components = [];
							frame.componentIds = {};
							var componentsCount = data[offset++], componentId;
							var maxH = 0, maxV = 0;
							for (i = 0; i < componentsCount; i++) {
								componentId = data[offset];
								var h = data[offset + 1] >> 4;
								var v = data[offset + 1] & 15;
								if (maxH < h) maxH = h;
								if (maxV < v) maxV = v;
								var qId = data[offset + 2];
								l = frame.components.push({
									h,
									v,
									quantizationTable: quantizationTables[qId],
									quantizationTableId: qId,
									bitConversion: 255 / ((1 << frame.precision) - 1)
								});
								frame.componentIds[componentId] = l - 1;
								offset += 3;
							}
							frame.maxH = maxH;
							frame.maxV = maxV;
							prepareComponents(frame);
							break;
						case 65476:
							var huffmanLength = readUint16();
							for (i = 2; i < huffmanLength;) {
								var huffmanTableSpec = data[offset++];
								var codeLengths = /* @__PURE__ */ new Uint8Array(16);
								var codeLengthSum = 0;
								for (j = 0; j < 16; j++, offset++) codeLengthSum += codeLengths[j] = data[offset];
								var huffmanValues = new Uint8Array(codeLengthSum);
								for (j = 0; j < codeLengthSum; j++, offset++) huffmanValues[j] = data[offset];
								i += 17 + codeLengthSum;
								(huffmanTableSpec >> 4 === 0 ? huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] = buildHuffmanTable(codeLengths, huffmanValues);
							}
							break;
						case 65501:
							readUint16();
							resetInterval = readUint16();
							break;
						case 65498:
							readUint16();
							var selectorsCount = data[offset++];
							var components = [], component;
							for (i = 0; i < selectorsCount; i++) {
								var componentIndex = frame.componentIds[data[offset++]];
								component = frame.components[componentIndex];
								var tableSpec = data[offset++];
								component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
								component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
								components.push(component);
							}
							var spectralStart = data[offset++];
							var spectralEnd = data[offset++];
							var successiveApproximation = data[offset++];
							var processed = decodeScan(data, offset, frame, components, resetInterval, spectralStart, spectralEnd, successiveApproximation >> 4, successiveApproximation & 15);
							offset += processed;
							break;
						case 65535:
							if (data[offset] !== 255) offset--;
							break;
						default:
							if (data[offset - 3] == 255 && data[offset - 2] >= 192 && data[offset - 2] <= 254) {
								offset -= 3;
								break;
							}
							throw "unknown JPEG marker " + fileMarker.toString(16);
					}
					fileMarker = readUint16();
				}
				this.width = frame.samplesPerLine;
				this.height = frame.scanLines;
				this.jfif = jfif;
				this.adobe = adobe;
				this.components = [];
				switch (frame.components.length) {
					case 1:
						this.colorspace = ColorSpace.Grayscale;
						break;
					case 3:
						if (this.adobe) this.colorspace = ColorSpace.AdobeRGB;
						else this.colorspace = ColorSpace.RGB;
						break;
					case 4:
						this.colorspace = ColorSpace.CYMK;
						break;
					default: this.colorspace = ColorSpace.Unknown;
				}
				for (var i = 0; i < frame.components.length; i++) {
					var component = frame.components[i];
					if (!component.quantizationTable && component.quantizationTableId !== null) component.quantizationTable = quantizationTables[component.quantizationTableId];
					this.components.push({
						output: buildComponentData(frame, component),
						scaleX: component.h / frame.maxH,
						scaleY: component.v / frame.maxV,
						blocksPerLine: component.blocksPerLine,
						blocksPerColumn: component.blocksPerColumn,
						bitConversion: component.bitConversion
					});
				}
			}
			getData16(width, height) {
				if (this.components.length !== 1) throw "Unsupported color mode";
				var scaleX = this.width / width, scaleY = this.height / height;
				var component, componentScaleX, componentScaleY;
				var x, y, i;
				var offset = 0;
				var numComponents = this.components.length;
				var dataLength = width * height * numComponents;
				var data = new Uint16Array(dataLength);
				var lineData = new Uint16Array((this.components[0].blocksPerLine << 3) * this.components[0].blocksPerColumn * 8);
				for (i = 0; i < numComponents; i++) {
					component = this.components[i];
					var blocksPerLine = component.blocksPerLine;
					var blocksPerColumn = component.blocksPerColumn;
					var samplesPerLine = blocksPerLine << 3, j, k;
					var lineOffset = 0;
					for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
						var scanLine = blockRow << 3;
						for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
							var bufferOffset = getBlockBufferOffset(component, blockRow, blockCol);
							var offset = 0, sample = blockCol << 3;
							for (j = 0; j < 8; j++) {
								var lineOffset = (scanLine + j) * samplesPerLine;
								for (k = 0; k < 8; k++) lineData[lineOffset + sample + k] = component.output[bufferOffset + offset++];
							}
						}
					}
					componentScaleX = component.scaleX * scaleX;
					componentScaleY = component.scaleY * scaleY;
					offset = i;
					var cx, cy;
					var index;
					for (y = 0; y < height; y++) for (x = 0; x < width; x++) {
						cy = 0 | y * componentScaleY;
						cx = 0 | x * componentScaleX;
						index = cy * samplesPerLine + cx;
						data[offset] = lineData[index];
						offset += numComponents;
					}
				}
				return data;
			}
			getData(width, height) {
				var scaleX = this.width / width, scaleY = this.height / height;
				var component, componentScaleX, componentScaleY;
				var x, y, i;
				var offset = 0, Y, Cb, Cr, C, M, R, G, B;
				var colorTransform;
				var numComponents = this.components.length;
				var dataLength = width * height * numComponents;
				var data = new Uint8Array(dataLength);
				var lineData = new Uint8Array((this.components[0].blocksPerLine << 3) * this.components[0].blocksPerColumn * 8);
				for (i = 0; i < numComponents; i++) {
					component = this.components[i];
					var blocksPerLine = component.blocksPerLine;
					var blocksPerColumn = component.blocksPerColumn;
					var samplesPerLine = blocksPerLine << 3, j, k;
					var lineOffset = 0;
					for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
						var scanLine = blockRow << 3;
						for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
							var bufferOffset = getBlockBufferOffset(component, blockRow, blockCol);
							var offset = 0, sample = blockCol << 3;
							for (j = 0; j < 8; j++) {
								var lineOffset = (scanLine + j) * samplesPerLine;
								for (k = 0; k < 8; k++) lineData[lineOffset + sample + k] = component.output[bufferOffset + offset++] * component.bitConversion;
							}
						}
					}
					componentScaleX = component.scaleX * scaleX;
					componentScaleY = component.scaleY * scaleY;
					offset = i;
					var cx, cy;
					var index;
					for (y = 0; y < height; y++) for (x = 0; x < width; x++) {
						cy = 0 | y * componentScaleY;
						cx = 0 | x * componentScaleX;
						index = cy * samplesPerLine + cx;
						data[offset] = lineData[index];
						offset += numComponents;
					}
				}
				switch (numComponents) {
					case 1:
					case 2: break;
					case 3:
						colorTransform = true;
						if (this.adobe && this.adobe.transformCode) colorTransform = true;
						else if (typeof this.colorTransform !== "undefined") colorTransform = !!this.colorTransform;
						if (colorTransform) for (i = 0; i < dataLength; i += numComponents) {
							Y = data[i];
							Cb = data[i + 1];
							Cr = data[i + 2];
							R = clampToUint8(Y - 179.456 + 1.402 * Cr);
							G = clampToUint8(Y + 135.459 - .344 * Cb - .714 * Cr);
							B = clampToUint8(Y - 226.816 + 1.772 * Cb);
							data[i] = R;
							data[i + 1] = G;
							data[i + 2] = B;
						}
						break;
					case 4:
						if (!this.adobe) throw "Unsupported color mode (4 components)";
						colorTransform = false;
						if (this.adobe && this.adobe.transformCode) colorTransform = true;
						else if (typeof this.colorTransform !== "undefined") colorTransform = !!this.colorTransform;
						if (colorTransform) for (i = 0; i < dataLength; i += numComponents) {
							Y = data[i];
							Cb = data[i + 1];
							Cr = data[i + 2];
							C = clampToUint8(434.456 - Y - 1.402 * Cr);
							M = clampToUint8(119.541 - Y + .344 * Cb + .714 * Cr);
							Y = clampToUint8(481.816 - Y - 1.772 * Cb);
							data[i] = C;
							data[i + 1] = M;
							data[i + 2] = Y;
						}
						break;
					default: throw "Unsupported color mode";
				}
				return data;
			}
		};
	}));
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/decoders/decodeJPEGBaseline12Bit-js.js
	const local$4 = {
		JpegImage: void 0,
		decodeConfig: {}
	};
	function initialize$4(decodeConfig) {
		local$4.decodeConfig = decodeConfig;
		if (local$4.JpegImage) return Promise.resolve();
		return new Promise((resolve, reject) => {
			Promise.resolve().then(() => (init_jpeg(), jpeg_exports)).then((module) => {
				local$4.JpegImage = module.default;
				resolve();
			}).catch(reject);
		});
	}
	async function decodeJPEGBaseline12BitAsync(imageFrame, pixelData) {
		await initialize$4();
		if (typeof local$4.JpegImage === "undefined") throw new Error("No JPEG Baseline decoder loaded");
		const jpeg = new local$4.JpegImage();
		jpeg.parse(pixelData);
		jpeg.colorTransform = false;
		if (imageFrame.bitsAllocated === 8) {
			imageFrame.pixelData = jpeg.getData(imageFrame.columns, imageFrame.rows);
			return imageFrame;
		} else if (imageFrame.bitsAllocated === 16) {
			imageFrame.pixelData = jpeg.getData16(imageFrame.columns, imageFrame.rows);
			return imageFrame;
		}
	}
	//#endregion
	//#region ../../node_modules/.pnpm/jpeg-lossless-decoder-js@2.1.2/node_modules/jpeg-lossless-decoder-js/release/lossless.js
	var lossless_exports = /* @__PURE__ */ __exportAll({
		ComponentSpec: () => ComponentSpec,
		DataStream: () => DataStream,
		Decoder: () => Decoder,
		FrameHeader: () => FrameHeader,
		HuffmanTable: () => HuffmanTable,
		QuantizationTable: () => QuantizationTable,
		ScanComponent: () => ScanComponent,
		ScanHeader: () => ScanHeader,
		Utils: () => utils_exports
	});
	var __defProp, __export, ComponentSpec, DataStream, FrameHeader, utils_exports, createArray, makeCRCTable, crcTable, crc32, HuffmanTable, QuantizationTable, ScanComponent, ScanHeader, littleEndian, Decoder;
	var init_lossless = __esmMin((() => {
		__defProp = Object.defineProperty;
		__export = (target, all) => {
			for (var name in all) __defProp(target, name, {
				get: all[name],
				enumerable: true
			});
		};
		ComponentSpec = {
			hSamp: 0,
			quantTableSel: 0,
			vSamp: 0
		};
		DataStream = class {
			buffer;
			index;
			constructor(data, offset, length) {
				this.buffer = new Uint8Array(data, offset, length);
				this.index = 0;
			}
			get16() {
				const value = (this.buffer[this.index] << 8) + this.buffer[this.index + 1];
				this.index += 2;
				return value;
			}
			get8() {
				const value = this.buffer[this.index];
				this.index += 1;
				return value;
			}
		};
		FrameHeader = class {
			dimX = 0;
			dimY = 0;
			numComp = 0;
			precision = 0;
			components = [];
			read(data) {
				let count = 0;
				let temp;
				const length = data.get16();
				count += 2;
				this.precision = data.get8();
				count += 1;
				this.dimY = data.get16();
				count += 2;
				this.dimX = data.get16();
				count += 2;
				this.numComp = data.get8();
				count += 1;
				for (let i = 1; i <= this.numComp; i += 1) {
					if (count > length) throw new Error("ERROR: frame format error");
					const c = data.get8();
					count += 1;
					if (count >= length) throw new Error("ERROR: frame format error [c>=Lf]");
					temp = data.get8();
					count += 1;
					if (!this.components[c]) this.components[c] = { ...ComponentSpec };
					this.components[c].hSamp = temp >> 4;
					this.components[c].vSamp = temp & 15;
					this.components[c].quantTableSel = data.get8();
					count += 1;
				}
				if (count !== length) throw new Error("ERROR: frame format error [Lf!=count]");
				return 1;
			}
		};
		utils_exports = {};
		__export(utils_exports, {
			crc32: () => crc32,
			crcTable: () => crcTable,
			createArray: () => createArray,
			makeCRCTable: () => makeCRCTable
		});
		createArray = (...dimensions) => {
			if (dimensions.length > 1) {
				const dim = dimensions[0];
				const rest = dimensions.slice(1);
				const newArray = [];
				for (let i = 0; i < dim; i++) newArray[i] = createArray(...rest);
				return newArray;
			} else return Array(dimensions[0]).fill(void 0);
		};
		makeCRCTable = function() {
			let c;
			const crcTable2 = [];
			for (let n = 0; n < 256; n++) {
				c = n;
				for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
				crcTable2[n] = c;
			}
			return crcTable2;
		};
		crcTable = makeCRCTable();
		crc32 = function(buffer) {
			const uint8view = new Uint8Array(buffer);
			let crc = -1;
			for (let i = 0; i < uint8view.length; i++) crc = crc >>> 8 ^ crcTable[(crc ^ uint8view[i]) & 255];
			return (crc ^ -1) >>> 0;
		};
		HuffmanTable = class _HuffmanTable {
			static MSB = 2147483648;
			l;
			th;
			v;
			tc;
			constructor() {
				this.l = createArray(4, 2, 16);
				this.th = [
					0,
					0,
					0,
					0
				];
				this.v = createArray(4, 2, 16, 200);
				this.tc = [
					[0, 0],
					[0, 0],
					[0, 0],
					[0, 0]
				];
			}
			read(data, HuffTab) {
				let count = 0;
				let temp;
				let t;
				let c;
				let i;
				let j;
				const length = data.get16();
				count += 2;
				while (count < length) {
					temp = data.get8();
					count += 1;
					t = temp & 15;
					if (t > 3) throw new Error("ERROR: Huffman table ID > 3");
					c = temp >> 4;
					if (c > 2) throw new Error("ERROR: Huffman table [Table class > 2 ]");
					this.th[t] = 1;
					this.tc[t][c] = 1;
					for (i = 0; i < 16; i += 1) {
						this.l[t][c][i] = data.get8();
						count += 1;
					}
					for (i = 0; i < 16; i += 1) for (j = 0; j < this.l[t][c][i]; j += 1) {
						if (count > length) throw new Error("ERROR: Huffman table format error [count>Lh]");
						this.v[t][c][i][j] = data.get8();
						count += 1;
					}
				}
				if (count !== length) throw new Error("ERROR: Huffman table format error [count!=Lf]");
				for (i = 0; i < 4; i += 1) for (j = 0; j < 2; j += 1) if (this.tc[i][j] !== 0) this.buildHuffTable(HuffTab[i][j], this.l[i][j], this.v[i][j]);
				return 1;
			}
			buildHuffTable(tab, L, V) {
				let currentTable, k, i, j, n;
				const temp = 256;
				k = 0;
				for (i = 0; i < 8; i += 1) for (j = 0; j < L[i]; j += 1) for (n = 0; n < temp >> i + 1; n += 1) {
					tab[k] = V[i][j] | i + 1 << 8;
					k += 1;
				}
				for (i = 1; k < 256; i += 1, k += 1) tab[k] = i | _HuffmanTable.MSB;
				currentTable = 1;
				k = 0;
				for (i = 8; i < 16; i += 1) for (j = 0; j < L[i]; j += 1) {
					for (n = 0; n < temp >> i - 7; n += 1) {
						tab[currentTable * 256 + k] = V[i][j] | i + 1 << 8;
						k += 1;
					}
					if (k >= 256) {
						if (k > 256) throw new Error("ERROR: Huffman table error(1)!");
						k = 0;
						currentTable += 1;
					}
				}
			}
		};
		QuantizationTable = class _QuantizationTable {
			precision = [];
			tq = [
				0,
				0,
				0,
				0
			];
			quantTables = createArray(4, 64);
			static enhanceQuantizationTable = function(qtab, table) {
				for (let i = 0; i < 8; i += 1) {
					qtab[table[0 + i]] *= 90;
					qtab[table[32 + i]] *= 90;
					qtab[table[16 + i]] *= 118;
					qtab[table[48 + i]] *= 49;
					qtab[table[40 + i]] *= 71;
					qtab[table[8 + i]] *= 126;
					qtab[table[56 + i]] *= 25;
					qtab[table[24 + i]] *= 106;
				}
				for (let i = 0; i < 8; i += 1) {
					qtab[table[0 + 8 * i]] *= 90;
					qtab[table[4 + 8 * i]] *= 90;
					qtab[table[2 + 8 * i]] *= 118;
					qtab[table[6 + 8 * i]] *= 49;
					qtab[table[5 + 8 * i]] *= 71;
					qtab[table[1 + 8 * i]] *= 126;
					qtab[table[7 + 8 * i]] *= 25;
					qtab[table[3 + 8 * i]] *= 106;
				}
				for (let i = 0; i < 64; i += 1) qtab[i] >>= 6;
			};
			read(data, table) {
				let count = 0;
				let temp;
				let t;
				let i;
				const length = data.get16();
				count += 2;
				while (count < length) {
					temp = data.get8();
					count += 1;
					t = temp & 15;
					if (t > 3) throw new Error("ERROR: Quantization table ID > 3");
					this.precision[t] = temp >> 4;
					if (this.precision[t] === 0) this.precision[t] = 8;
					else if (this.precision[t] === 1) this.precision[t] = 16;
					else throw new Error("ERROR: Quantization table precision error");
					this.tq[t] = 1;
					if (this.precision[t] === 8) {
						for (i = 0; i < 64; i += 1) {
							if (count > length) throw new Error("ERROR: Quantization table format error");
							this.quantTables[t][i] = data.get8();
							count += 1;
						}
						_QuantizationTable.enhanceQuantizationTable(this.quantTables[t], table);
					} else {
						for (i = 0; i < 64; i += 1) {
							if (count > length) throw new Error("ERROR: Quantization table format error");
							this.quantTables[t][i] = data.get16();
							count += 2;
						}
						_QuantizationTable.enhanceQuantizationTable(this.quantTables[t], table);
					}
				}
				if (count !== length) throw new Error("ERROR: Quantization table error [count!=Lq]");
				return 1;
			}
		};
		ScanComponent = {
			acTabSel: 0,
			dcTabSel: 0,
			scanCompSel: 0
		};
		ScanHeader = class {
			ah = 0;
			al = 0;
			numComp = 0;
			selection = 0;
			spectralEnd = 0;
			components = [];
			read(data) {
				let count = 0;
				let i;
				let temp;
				const length = data.get16();
				count += 2;
				this.numComp = data.get8();
				count += 1;
				for (i = 0; i < this.numComp; i += 1) {
					this.components[i] = { ...ScanComponent };
					if (count > length) throw new Error("ERROR: scan header format error");
					this.components[i].scanCompSel = data.get8();
					count += 1;
					temp = data.get8();
					count += 1;
					this.components[i].dcTabSel = temp >> 4;
					this.components[i].acTabSel = temp & 15;
				}
				this.selection = data.get8();
				count += 1;
				this.spectralEnd = data.get8();
				count += 1;
				temp = data.get8();
				this.ah = temp >> 4;
				this.al = temp & 15;
				count += 1;
				if (count !== length) throw new Error("ERROR: scan header format error [count!=Ns]");
				return 1;
			}
		};
		littleEndian = function() {
			const buffer = /* @__PURE__ */ new ArrayBuffer(2);
			new DataView(buffer).setInt16(0, 256, true);
			return new Int16Array(buffer)[0] === 256;
		}();
		Decoder = class _Decoder {
			static IDCT_P = [
				0,
				5,
				40,
				16,
				45,
				2,
				7,
				42,
				21,
				56,
				8,
				61,
				18,
				47,
				1,
				4,
				41,
				23,
				58,
				13,
				32,
				24,
				37,
				10,
				63,
				17,
				44,
				3,
				6,
				43,
				20,
				57,
				15,
				34,
				29,
				48,
				53,
				26,
				39,
				9,
				60,
				19,
				46,
				22,
				59,
				12,
				33,
				31,
				50,
				55,
				25,
				36,
				11,
				62,
				14,
				35,
				28,
				49,
				52,
				27,
				38,
				30,
				51,
				54
			];
			static TABLE = [
				0,
				1,
				5,
				6,
				14,
				15,
				27,
				28,
				2,
				4,
				7,
				13,
				16,
				26,
				29,
				42,
				3,
				8,
				12,
				17,
				25,
				30,
				41,
				43,
				9,
				11,
				18,
				24,
				31,
				40,
				44,
				53,
				10,
				19,
				23,
				32,
				39,
				45,
				52,
				54,
				20,
				22,
				33,
				38,
				46,
				51,
				55,
				60,
				21,
				34,
				37,
				47,
				50,
				56,
				59,
				61,
				35,
				36,
				48,
				49,
				57,
				58,
				62,
				63
			];
			static MAX_HUFFMAN_SUBTREE = 50;
			static MSB = 2147483648;
			static RESTART_MARKER_BEGIN = 65488;
			static RESTART_MARKER_END = 65495;
			buffer = null;
			stream = null;
			frame = new FrameHeader();
			huffTable = new HuffmanTable();
			quantTable = new QuantizationTable();
			scan = new ScanHeader();
			DU = createArray(10, 4, 64);
			HuffTab = createArray(4, 2, 12800);
			IDCT_Source = [];
			nBlock = [];
			acTab = createArray(10, 1);
			dcTab = createArray(10, 1);
			qTab = createArray(10, 1);
			marker = 0;
			markerIndex = 0;
			numComp = 0;
			restartInterval = 0;
			selection = 0;
			xDim = 0;
			yDim = 0;
			xLoc = 0;
			yLoc = 0;
			outputData = null;
			restarting = false;
			mask = 0;
			numBytes = 0;
			precision = void 0;
			components = [];
			getter = null;
			setter = null;
			output = null;
			selector = null;
			/**
			* The Decoder constructor.
			* @property {number} numBytes - number of bytes per component
			* @type {Function}
			*/
			constructor(buffer, numBytes) {
				this.buffer = buffer ?? null;
				this.numBytes = numBytes ?? 0;
			}
			/**
			* Returns decompressed data.
			*/
			decompress(buffer, offset, length) {
				return this.decode(buffer, offset, length).buffer;
			}
			decode(buffer, offset, length, numBytes) {
				let scanNum = 0;
				const pred = [];
				let i;
				let compN;
				const temp = [];
				const index = [];
				let mcuNum;
				if (buffer) this.buffer = buffer;
				if (numBytes !== void 0) this.numBytes = numBytes;
				this.stream = new DataStream(this.buffer, offset, length);
				this.buffer = null;
				this.xLoc = 0;
				this.yLoc = 0;
				let current = this.stream.get16();
				if (current !== 65496) throw new Error("Not a JPEG file");
				current = this.stream.get16();
				while (current >> 4 !== 4092 || current === 65476) {
					switch (current) {
						case 65476:
							this.huffTable.read(this.stream, this.HuffTab);
							break;
						case 65484: throw new Error("Program doesn't support arithmetic coding. (format throw new IOException)");
						case 65499:
							this.quantTable.read(this.stream, _Decoder.TABLE);
							break;
						case 65501:
							this.restartInterval = this.readNumber() ?? 0;
							break;
						case 65504:
						case 65505:
						case 65506:
						case 65507:
						case 65508:
						case 65509:
						case 65510:
						case 65511:
						case 65512:
						case 65513:
						case 65514:
						case 65515:
						case 65516:
						case 65517:
						case 65518:
						case 65519:
							this.readApp();
							break;
						case 65534:
							this.readComment();
							break;
						default: if (current >> 8 !== 255) throw new Error("ERROR: format throw new IOException! (decode)");
					}
					current = this.stream.get16();
				}
				if (current < 65472 || current > 65479) throw new Error("ERROR: could not handle arithmetic code!");
				this.frame.read(this.stream);
				current = this.stream.get16();
				do {
					while (current !== 65498) {
						switch (current) {
							case 65476:
								this.huffTable.read(this.stream, this.HuffTab);
								break;
							case 65484: throw new Error("Program doesn't support arithmetic coding. (format throw new IOException)");
							case 65499:
								this.quantTable.read(this.stream, _Decoder.TABLE);
								break;
							case 65501:
								this.restartInterval = this.readNumber() ?? 0;
								break;
							case 65504:
							case 65505:
							case 65506:
							case 65507:
							case 65508:
							case 65509:
							case 65510:
							case 65511:
							case 65512:
							case 65513:
							case 65514:
							case 65515:
							case 65516:
							case 65517:
							case 65518:
							case 65519:
								this.readApp();
								break;
							case 65534:
								this.readComment();
								break;
							default: if (current >> 8 !== 255) throw new Error("ERROR: format throw new IOException! (Parser.decode)");
						}
						current = this.stream.get16();
					}
					this.precision = this.frame.precision;
					this.components = this.frame.components;
					if (!this.numBytes) this.numBytes = Math.round(Math.ceil(this.precision / 8));
					if (this.numBytes === 1) this.mask = 255;
					else this.mask = 65535;
					this.scan.read(this.stream);
					this.numComp = this.scan.numComp;
					this.selection = this.scan.selection;
					if (this.numBytes === 1) if (this.numComp === 3) {
						this.getter = this.getValueRGB;
						this.setter = this.setValueRGB;
						this.output = this.outputRGB;
					} else {
						this.getter = this.getValue8;
						this.setter = this.setValue8;
						this.output = this.outputSingle;
					}
					else {
						this.getter = this.getValue8;
						this.setter = this.setValue8;
						this.output = this.outputSingle;
					}
					switch (this.selection) {
						case 2:
							this.selector = this.select2;
							break;
						case 3:
							this.selector = this.select3;
							break;
						case 4:
							this.selector = this.select4;
							break;
						case 5:
							this.selector = this.select5;
							break;
						case 6:
							this.selector = this.select6;
							break;
						case 7:
							this.selector = this.select7;
							break;
						default: this.selector = this.select1;
					}
					for (i = 0; i < this.numComp; i += 1) {
						compN = this.scan.components[i].scanCompSel;
						this.qTab[i] = this.quantTable.quantTables[this.components[compN].quantTableSel];
						this.nBlock[i] = this.components[compN].vSamp * this.components[compN].hSamp;
						this.dcTab[i] = this.HuffTab[this.scan.components[i].dcTabSel][0];
						this.acTab[i] = this.HuffTab[this.scan.components[i].acTabSel][1];
					}
					this.xDim = this.frame.dimX;
					this.yDim = this.frame.dimY;
					if (this.numBytes === 1) this.outputData = new Uint8Array(new ArrayBuffer(this.xDim * this.yDim * this.numBytes * this.numComp));
					else this.outputData = new Uint16Array(new ArrayBuffer(this.xDim * this.yDim * this.numBytes * this.numComp));
					scanNum += 1;
					while (true) {
						temp[0] = 0;
						index[0] = 0;
						for (i = 0; i < 10; i += 1) pred[i] = 1 << this.precision - 1;
						if (this.restartInterval === 0) {
							current = this.decodeUnit(pred, temp, index);
							while (current === 0 && this.xLoc < this.xDim && this.yLoc < this.yDim) {
								this.output(pred);
								current = this.decodeUnit(pred, temp, index);
							}
							break;
						}
						for (mcuNum = 0; mcuNum < this.restartInterval; mcuNum += 1) {
							this.restarting = mcuNum === 0;
							current = this.decodeUnit(pred, temp, index);
							this.output(pred);
							if (current !== 0) break;
						}
						if (current === 0) if (this.markerIndex !== 0) {
							current = 65280 | this.marker;
							this.markerIndex = 0;
						} else current = this.stream.get16();
						if (!(current >= _Decoder.RESTART_MARKER_BEGIN && current <= _Decoder.RESTART_MARKER_END)) break;
					}
					if (current === 65500 && scanNum === 1) {
						this.readNumber();
						current = this.stream.get16();
					}
				} while (current !== 65497 && this.xLoc < this.xDim && this.yLoc < this.yDim && scanNum === 0);
				return this.outputData;
			}
			decodeUnit(prev, temp, index) {
				if (this.numComp === 1) return this.decodeSingle(prev, temp, index);
				else if (this.numComp === 3) return this.decodeRGB(prev, temp, index);
				else return -1;
			}
			select1(compOffset) {
				return this.getPreviousX(compOffset);
			}
			select2(compOffset) {
				return this.getPreviousY(compOffset);
			}
			select3(compOffset) {
				return this.getPreviousXY(compOffset);
			}
			select4(compOffset) {
				return this.getPreviousX(compOffset) + this.getPreviousY(compOffset) - this.getPreviousXY(compOffset);
			}
			select5(compOffset) {
				return this.getPreviousX(compOffset) + (this.getPreviousY(compOffset) - this.getPreviousXY(compOffset) >> 1);
			}
			select6(compOffset) {
				return this.getPreviousY(compOffset) + (this.getPreviousX(compOffset) - this.getPreviousXY(compOffset) >> 1);
			}
			select7(compOffset) {
				return (this.getPreviousX(compOffset) + this.getPreviousY(compOffset)) / 2;
			}
			decodeRGB(prev, temp, index) {
				if (this.selector === null) throw new Error("decode hasn't run yet");
				let actab, dctab, qtab, ctrC, i, k, j;
				prev[0] = this.selector(0);
				prev[1] = this.selector(1);
				prev[2] = this.selector(2);
				for (ctrC = 0; ctrC < this.numComp; ctrC += 1) {
					qtab = this.qTab[ctrC];
					actab = this.acTab[ctrC];
					dctab = this.dcTab[ctrC];
					for (i = 0; i < this.nBlock[ctrC]; i += 1) {
						for (k = 0; k < this.IDCT_Source.length; k += 1) this.IDCT_Source[k] = 0;
						let value = this.getHuffmanValue(dctab, temp, index);
						if (value >= 65280) return value;
						prev[ctrC] = this.IDCT_Source[0] = prev[ctrC] + this.getn(index, value, temp, index);
						this.IDCT_Source[0] *= qtab[0];
						for (j = 1; j < 64; j += 1) {
							value = this.getHuffmanValue(actab, temp, index);
							if (value >= 65280) return value;
							j += value >> 4;
							if ((value & 15) === 0) {
								if (value >> 4 === 0) break;
							} else this.IDCT_Source[_Decoder.IDCT_P[j]] = this.getn(index, value & 15, temp, index) * qtab[j];
						}
					}
				}
				return 0;
			}
			decodeSingle(prev, temp, index) {
				if (this.selector === null) throw new Error("decode hasn't run yet");
				let value, i, n, nRestart;
				if (this.restarting) {
					this.restarting = false;
					prev[0] = 1 << this.frame.precision - 1;
				} else prev[0] = this.selector();
				for (i = 0; i < this.nBlock[0]; i += 1) {
					value = this.getHuffmanValue(this.dcTab[0], temp, index);
					if (value >= 65280) return value;
					n = this.getn(prev, value, temp, index);
					nRestart = n >> 8;
					if (nRestart >= _Decoder.RESTART_MARKER_BEGIN && nRestart <= _Decoder.RESTART_MARKER_END) return nRestart;
					prev[0] += n;
				}
				return 0;
			}
			getHuffmanValue(table, temp, index) {
				let code, input;
				const mask = 65535;
				if (!this.stream) throw new Error("stream not initialized");
				if (index[0] < 8) {
					temp[0] <<= 8;
					input = this.stream.get8();
					if (input === 255) {
						this.marker = this.stream.get8();
						if (this.marker !== 0) this.markerIndex = 9;
					}
					temp[0] |= input;
				} else index[0] -= 8;
				code = table[temp[0] >> index[0]];
				if ((code & _Decoder.MSB) !== 0) {
					if (this.markerIndex !== 0) {
						this.markerIndex = 0;
						return 65280 | this.marker;
					}
					temp[0] &= mask >> 16 - index[0];
					temp[0] <<= 8;
					input = this.stream.get8();
					if (input === 255) {
						this.marker = this.stream.get8();
						if (this.marker !== 0) this.markerIndex = 9;
					}
					temp[0] |= input;
					code = table[(code & 255) * 256 + (temp[0] >> index[0])];
					index[0] += 8;
				}
				index[0] += 8 - (code >> 8);
				if (index[0] < 0) throw new Error("index=" + index[0] + " temp=" + temp[0] + " code=" + code + " in HuffmanValue()");
				if (index[0] < this.markerIndex) {
					this.markerIndex = 0;
					return 65280 | this.marker;
				}
				temp[0] &= mask >> 16 - index[0];
				return code & 255;
			}
			getn(PRED, n, temp, index) {
				let result, input;
				const one = 1;
				const n_one = -1;
				const mask = 65535;
				if (this.stream === null) throw new Error("stream not initialized");
				if (n === 0) return 0;
				if (n === 16) if (PRED[0] >= 0) return -32768;
				else return 32768;
				index[0] -= n;
				if (index[0] >= 0) {
					if (index[0] < this.markerIndex && !this.isLastPixel()) {
						this.markerIndex = 0;
						return (65280 | this.marker) << 8;
					}
					result = temp[0] >> index[0];
					temp[0] &= mask >> 16 - index[0];
				} else {
					temp[0] <<= 8;
					input = this.stream.get8();
					if (input === 255) {
						this.marker = this.stream.get8();
						if (this.marker !== 0) this.markerIndex = 9;
					}
					temp[0] |= input;
					index[0] += 8;
					if (index[0] < 0) {
						if (this.markerIndex !== 0) {
							this.markerIndex = 0;
							return (65280 | this.marker) << 8;
						}
						temp[0] <<= 8;
						input = this.stream.get8();
						if (input === 255) {
							this.marker = this.stream.get8();
							if (this.marker !== 0) this.markerIndex = 9;
						}
						temp[0] |= input;
						index[0] += 8;
					}
					if (index[0] < 0) throw new Error("index=" + index[0] + " in getn()");
					if (index[0] < this.markerIndex) {
						this.markerIndex = 0;
						return (65280 | this.marker) << 8;
					}
					result = temp[0] >> index[0];
					temp[0] &= mask >> 16 - index[0];
				}
				if (result < one << n - 1) result += (n_one << n) + 1;
				return result;
			}
			getPreviousX(compOffset = 0) {
				if (this.getter === null) throw new Error("decode hasn't run yet");
				if (this.xLoc > 0) return this.getter(this.yLoc * this.xDim + this.xLoc - 1, compOffset);
				else if (this.yLoc > 0) return this.getPreviousY(compOffset);
				else return 1 << this.frame.precision - 1;
			}
			getPreviousXY(compOffset = 0) {
				if (this.getter === null) throw new Error("decode hasn't run yet");
				if (this.xLoc > 0 && this.yLoc > 0) return this.getter((this.yLoc - 1) * this.xDim + this.xLoc - 1, compOffset);
				else return this.getPreviousY(compOffset);
			}
			getPreviousY(compOffset = 0) {
				if (this.getter === null) throw new Error("decode hasn't run yet");
				if (this.yLoc > 0) return this.getter((this.yLoc - 1) * this.xDim + this.xLoc, compOffset);
				else return this.getPreviousX(compOffset);
			}
			isLastPixel() {
				return this.xLoc === this.xDim - 1 && this.yLoc === this.yDim - 1;
			}
			outputSingle(PRED) {
				if (this.setter === null) throw new Error("decode hasn't run yet");
				if (this.xLoc < this.xDim && this.yLoc < this.yDim) {
					this.setter(this.yLoc * this.xDim + this.xLoc, this.mask & PRED[0]);
					this.xLoc += 1;
					if (this.xLoc >= this.xDim) {
						this.yLoc += 1;
						this.xLoc = 0;
					}
				}
			}
			outputRGB(PRED) {
				if (this.setter === null) throw new Error("decode hasn't run yet");
				const offset = this.yLoc * this.xDim + this.xLoc;
				if (this.xLoc < this.xDim && this.yLoc < this.yDim) {
					this.setter(offset, PRED[0], 0);
					this.setter(offset, PRED[1], 1);
					this.setter(offset, PRED[2], 2);
					this.xLoc += 1;
					if (this.xLoc >= this.xDim) {
						this.yLoc += 1;
						this.xLoc = 0;
					}
				}
			}
			setValue8(index, val) {
				if (!this.outputData) throw new Error("output data not ready");
				if (littleEndian) this.outputData[index] = val;
				else this.outputData[index] = (val & 255) << 8 | val >> 8 & 255;
			}
			getValue8(index) {
				if (this.outputData === null) throw new Error("output data not ready");
				if (littleEndian) return this.outputData[index];
				else {
					const val = this.outputData[index];
					return (val & 255) << 8 | val >> 8 & 255;
				}
			}
			setValueRGB(index, val, compOffset = 0) {
				if (this.outputData === null) return;
				this.outputData[index * 3 + compOffset] = val;
			}
			getValueRGB(index, compOffset) {
				if (this.outputData === null) throw new Error("output data not ready");
				return this.outputData[index * 3 + compOffset];
			}
			readApp() {
				if (this.stream === null) return null;
				let count = 0;
				const length = this.stream.get16();
				count += 2;
				while (count < length) {
					this.stream.get8();
					count += 1;
				}
				return length;
			}
			readComment() {
				if (this.stream === null) return null;
				let sb = "";
				let count = 0;
				const length = this.stream.get16();
				count += 2;
				while (count < length) {
					sb += this.stream.get8();
					count += 1;
				}
				return sb;
			}
			readNumber() {
				if (this.stream === null) return null;
				if (this.stream.get16() !== 4) throw new Error("ERROR: Define number format throw new IOException [Ld!=4]");
				return this.stream.get16();
			}
		};
	}));
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/decoders/decodeJPEGLossless.js
	const local$3 = {
		DecoderClass: void 0,
		decodeConfig: {}
	};
	function initialize$3(decodeConfig) {
		local$3.decodeConfig = decodeConfig;
		if (local$3.DecoderClass) return Promise.resolve();
		return new Promise((resolve, reject) => {
			Promise.resolve().then(() => (init_lossless(), lossless_exports)).then(({ Decoder }) => {
				local$3.DecoderClass = Decoder;
				resolve();
			}, reject);
		});
	}
	async function decodeJPEGLossless(imageFrame, pixelData) {
		await initialize$3();
		if (typeof local$3.DecoderClass === "undefined") throw new Error("No JPEG Lossless decoder loaded");
		const decoder = new local$3.DecoderClass();
		const byteOutput = imageFrame.bitsAllocated <= 8 ? 1 : 2;
		const buffer = pixelData.buffer;
		const decompressedData = decoder.decode(buffer, pixelData.byteOffset, pixelData.length, byteOutput);
		imageFrame.planarConfiguration = 0;
		if (imageFrame.pixelRepresentation === 0) {
			if (imageFrame.bitsAllocated === 16) {
				imageFrame.pixelData = new Uint16Array(decompressedData.buffer);
				return imageFrame;
			}
			imageFrame.pixelData = new Uint8Array(decompressedData.buffer);
			return imageFrame;
		}
		imageFrame.pixelData = new Int16Array(decompressedData.buffer);
		return imageFrame;
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/decoders/decodeJPEGLS.js
	var import_charlswasm_decode = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
		var CharLSWASM = (() => {
			var _scriptName = typeof document != "undefined" ? document.currentScript?.src : void 0;
			if (typeof __filename != "undefined") _scriptName = _scriptName || __filename;
			return (function(moduleArg = {}) {
				var moduleRtn;
				var Module = moduleArg;
				var readyPromiseResolve, readyPromiseReject;
				var readyPromise = new Promise((resolve, reject) => {
					readyPromiseResolve = resolve;
					readyPromiseReject = reject;
				});
				var ENVIRONMENT_IS_WEB = typeof window == "object";
				var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != "undefined";
				var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string" && process.type != "renderer";
				if (ENVIRONMENT_IS_NODE) {}
				var moduleOverrides = Object.assign({}, Module);
				var scriptDirectory = "";
				function locateFile(path) {
					if (Module["locateFile"]) return Module["locateFile"](path, scriptDirectory);
					return scriptDirectory + path;
				}
				var readAsync, readBinary;
				if (ENVIRONMENT_IS_NODE) {
					var fs = require___vite_browser_external();
					require___vite_browser_external();
					scriptDirectory = __dirname + "/";
					readBinary = (filename) => {
						filename = isFileURI(filename) ? new URL(filename) : filename;
						return fs.readFileSync(filename);
					};
					readAsync = async (filename, binary = true) => {
						filename = isFileURI(filename) ? new URL(filename) : filename;
						return fs.readFileSync(filename, binary ? void 0 : "utf8");
					};
					if (!Module["thisProgram"] && process.argv.length > 1) process.argv[1].replace(/\\/g, "/");
					process.argv.slice(2);
				} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
					if (ENVIRONMENT_IS_WORKER) scriptDirectory = self.location.href;
					else if (typeof document != "undefined" && document.currentScript) scriptDirectory = document.currentScript.src;
					if (_scriptName) scriptDirectory = _scriptName;
					if (scriptDirectory.startsWith("blob:")) scriptDirectory = "";
					else scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
					if (ENVIRONMENT_IS_WORKER) readBinary = (url) => {
						var xhr = new XMLHttpRequest();
						xhr.open("GET", url, false);
						xhr.responseType = "arraybuffer";
						xhr.send(null);
						return new Uint8Array(xhr.response);
					};
					readAsync = async (url) => {
						if (isFileURI(url)) return new Promise((resolve, reject) => {
							var xhr = new XMLHttpRequest();
							xhr.open("GET", url, true);
							xhr.responseType = "arraybuffer";
							xhr.onload = () => {
								if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
									resolve(xhr.response);
									return;
								}
								reject(xhr.status);
							};
							xhr.onerror = reject;
							xhr.send(null);
						});
						var response = await fetch(url, { credentials: "same-origin" });
						if (response.ok) return response.arrayBuffer();
						throw new Error(response.status + " : " + response.url);
					};
				}
				Module["print"] || console.log.bind(console);
				var err = Module["printErr"] || console.error.bind(console);
				Object.assign(Module, moduleOverrides);
				moduleOverrides = null;
				if (Module["arguments"]) Module["arguments"];
				if (Module["thisProgram"]) Module["thisProgram"];
				var wasmBinary = Module["wasmBinary"];
				var wasmMemory;
				var ABORT = false;
				var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
				function updateMemoryViews() {
					var b = wasmMemory.buffer;
					Module["HEAP8"] = HEAP8 = new Int8Array(b);
					Module["HEAP16"] = HEAP16 = new Int16Array(b);
					Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
					Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
					Module["HEAP32"] = HEAP32 = new Int32Array(b);
					Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
					Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
					Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
				}
				var __ATPRERUN__ = [];
				var __ATINIT__ = [];
				var __ATPOSTRUN__ = [];
				function preRun() {
					if (Module["preRun"]) {
						if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
						while (Module["preRun"].length) addOnPreRun(Module["preRun"].shift());
					}
					callRuntimeCallbacks(__ATPRERUN__);
				}
				function initRuntime() {
					callRuntimeCallbacks(__ATINIT__);
				}
				function postRun() {
					if (Module["postRun"]) {
						if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
						while (Module["postRun"].length) addOnPostRun(Module["postRun"].shift());
					}
					callRuntimeCallbacks(__ATPOSTRUN__);
				}
				function addOnPreRun(cb) {
					__ATPRERUN__.unshift(cb);
				}
				function addOnInit(cb) {
					__ATINIT__.unshift(cb);
				}
				function addOnPostRun(cb) {
					__ATPOSTRUN__.unshift(cb);
				}
				var runDependencies = 0;
				var dependenciesFulfilled = null;
				function addRunDependency(id) {
					runDependencies++;
					Module["monitorRunDependencies"]?.(runDependencies);
				}
				function removeRunDependency(id) {
					runDependencies--;
					Module["monitorRunDependencies"]?.(runDependencies);
					if (runDependencies == 0) {
						if (dependenciesFulfilled) {
							var callback = dependenciesFulfilled;
							dependenciesFulfilled = null;
							callback();
						}
					}
				}
				function abort(what) {
					Module["onAbort"]?.(what);
					what = "Aborted(" + what + ")";
					err(what);
					ABORT = true;
					what += ". Build with -sASSERTIONS for more info.";
					var e = new WebAssembly.RuntimeError(what);
					readyPromiseReject(e);
					throw e;
				}
				var dataURIPrefix = "data:application/octet-stream;base64,";
				var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
				var isFileURI = (filename) => filename.startsWith("file://");
				function findWasmBinary() {
					var f = "charlswasm_decode.wasm";
					if (!isDataURI(f)) return locateFile(f);
					return f;
				}
				var wasmBinaryFile;
				function getBinarySync(file) {
					if (file == wasmBinaryFile && wasmBinary) return new Uint8Array(wasmBinary);
					if (readBinary) return readBinary(file);
					throw "both async and sync fetching of the wasm failed";
				}
				async function getWasmBinary(binaryFile) {
					if (!wasmBinary) try {
						var response = await readAsync(binaryFile);
						return new Uint8Array(response);
					} catch {}
					return getBinarySync(binaryFile);
				}
				async function instantiateArrayBuffer(binaryFile, imports) {
					try {
						var binary = await getWasmBinary(binaryFile);
						return await WebAssembly.instantiate(binary, imports);
					} catch (reason) {
						err(`failed to asynchronously prepare wasm: ${reason}`);
						abort(reason);
					}
				}
				async function instantiateAsync(binary, binaryFile, imports) {
					if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") try {
						var response = fetch(binaryFile, { credentials: "same-origin" });
						return await WebAssembly.instantiateStreaming(response, imports);
					} catch (reason) {
						err(`wasm streaming compile failed: ${reason}`);
						err("falling back to ArrayBuffer instantiation");
					}
					return instantiateArrayBuffer(binaryFile, imports);
				}
				function getWasmImports() {
					return { a: wasmImports };
				}
				async function createWasm() {
					function receiveInstance(instance, module$3) {
						wasmExports = instance.exports;
						wasmMemory = wasmExports["A"];
						updateMemoryViews();
						wasmTable = wasmExports["D"];
						addOnInit(wasmExports["B"]);
						removeRunDependency("wasm-instantiate");
						return wasmExports;
					}
					addRunDependency("wasm-instantiate");
					function receiveInstantiationResult(result) {
						receiveInstance(result["instance"]);
					}
					var info = getWasmImports();
					if (Module["instantiateWasm"]) try {
						return Module["instantiateWasm"](info, receiveInstance);
					} catch (e) {
						err(`Module.instantiateWasm callback failed with error: ${e}`);
						readyPromiseReject(e);
					}
					wasmBinaryFile ??= findWasmBinary();
					try {
						var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
						receiveInstantiationResult(result);
						return result;
					} catch (e) {
						readyPromiseReject(e);
						return;
					}
				}
				var callRuntimeCallbacks = (callbacks) => {
					while (callbacks.length > 0) callbacks.shift()(Module);
				};
				Module["noExitRuntime"];
				var stackRestore = (val) => __emscripten_stack_restore(val);
				var stackSave = () => _emscripten_stack_get_current();
				class ExceptionInfo {
					constructor(excPtr) {
						this.excPtr = excPtr;
						this.ptr = excPtr - 24;
					}
					set_type(type) {
						HEAPU32[this.ptr + 4 >> 2] = type;
					}
					get_type() {
						return HEAPU32[this.ptr + 4 >> 2];
					}
					set_destructor(destructor) {
						HEAPU32[this.ptr + 8 >> 2] = destructor;
					}
					get_destructor() {
						return HEAPU32[this.ptr + 8 >> 2];
					}
					set_caught(caught) {
						caught = caught ? 1 : 0;
						HEAP8[this.ptr + 12] = caught;
					}
					get_caught() {
						return HEAP8[this.ptr + 12] != 0;
					}
					set_rethrown(rethrown) {
						rethrown = rethrown ? 1 : 0;
						HEAP8[this.ptr + 13] = rethrown;
					}
					get_rethrown() {
						return HEAP8[this.ptr + 13] != 0;
					}
					init(type, destructor) {
						this.set_adjusted_ptr(0);
						this.set_type(type);
						this.set_destructor(destructor);
					}
					set_adjusted_ptr(adjustedPtr) {
						HEAPU32[this.ptr + 16 >> 2] = adjustedPtr;
					}
					get_adjusted_ptr() {
						return HEAPU32[this.ptr + 16 >> 2];
					}
				}
				var exceptionLast = 0;
				var uncaughtExceptionCount = 0;
				var ___cxa_throw = (ptr, type, destructor) => {
					new ExceptionInfo(ptr).init(type, destructor);
					exceptionLast = ptr;
					uncaughtExceptionCount++;
					throw exceptionLast;
				};
				var __abort_js = () => abort("");
				var structRegistrations = {};
				var runDestructors = (destructors) => {
					while (destructors.length) {
						var ptr = destructors.pop();
						destructors.pop()(ptr);
					}
				};
				function readPointer(pointer) {
					return this["fromWireType"](HEAPU32[pointer >> 2]);
				}
				var awaitingDependencies = {};
				var registeredTypes = {};
				var typeDependencies = {};
				var InternalError;
				var throwInternalError = (message) => {
					throw new InternalError(message);
				};
				var whenDependentTypesAreResolved = (myTypes, dependentTypes, getTypeConverters) => {
					myTypes.forEach((type) => typeDependencies[type] = dependentTypes);
					function onComplete(typeConverters) {
						var myTypeConverters = getTypeConverters(typeConverters);
						if (myTypeConverters.length !== myTypes.length) throwInternalError("Mismatched type converter count");
						for (var i = 0; i < myTypes.length; ++i) registerType(myTypes[i], myTypeConverters[i]);
					}
					var typeConverters = new Array(dependentTypes.length);
					var unregisteredTypes = [];
					var registered = 0;
					dependentTypes.forEach((dt, i) => {
						if (registeredTypes.hasOwnProperty(dt)) typeConverters[i] = registeredTypes[dt];
						else {
							unregisteredTypes.push(dt);
							if (!awaitingDependencies.hasOwnProperty(dt)) awaitingDependencies[dt] = [];
							awaitingDependencies[dt].push(() => {
								typeConverters[i] = registeredTypes[dt];
								++registered;
								if (registered === unregisteredTypes.length) onComplete(typeConverters);
							});
						}
					});
					if (0 === unregisteredTypes.length) onComplete(typeConverters);
				};
				var __embind_finalize_value_object = (structType) => {
					var reg = structRegistrations[structType];
					delete structRegistrations[structType];
					var rawConstructor = reg.rawConstructor;
					var rawDestructor = reg.rawDestructor;
					var fieldRecords = reg.fields;
					var fieldTypes = fieldRecords.map((field) => field.getterReturnType).concat(fieldRecords.map((field) => field.setterArgumentType));
					whenDependentTypesAreResolved([structType], fieldTypes, (fieldTypes) => {
						var fields = {};
						fieldRecords.forEach((field, i) => {
							var fieldName = field.fieldName;
							var getterReturnType = fieldTypes[i];
							var getter = field.getter;
							var getterContext = field.getterContext;
							var setterArgumentType = fieldTypes[i + fieldRecords.length];
							var setter = field.setter;
							var setterContext = field.setterContext;
							fields[fieldName] = {
								read: (ptr) => getterReturnType["fromWireType"](getter(getterContext, ptr)),
								write: (ptr, o) => {
									var destructors = [];
									setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
									runDestructors(destructors);
								}
							};
						});
						return [{
							name: reg.name,
							fromWireType: (ptr) => {
								var rv = {};
								for (var i in fields) rv[i] = fields[i].read(ptr);
								rawDestructor(ptr);
								return rv;
							},
							toWireType: (destructors, o) => {
								for (var fieldName in fields) if (!(fieldName in o)) throw new TypeError(`Missing field: "${fieldName}"`);
								var ptr = rawConstructor();
								for (fieldName in fields) fields[fieldName].write(ptr, o[fieldName]);
								if (destructors !== null) destructors.push(rawDestructor, ptr);
								return ptr;
							},
							argPackAdvance: GenericWireTypeSize,
							readValueFromPointer: readPointer,
							destructorFunction: rawDestructor
						}];
					});
				};
				var __embind_register_bigint = (primitiveType, name, size, minRange, maxRange) => {};
				var embind_init_charCodes = () => {
					var codes = new Array(256);
					for (var i = 0; i < 256; ++i) codes[i] = String.fromCharCode(i);
					embind_charCodes = codes;
				};
				var embind_charCodes;
				var readLatin1String = (ptr) => {
					var ret = "";
					var c = ptr;
					while (HEAPU8[c]) ret += embind_charCodes[HEAPU8[c++]];
					return ret;
				};
				var BindingError;
				var throwBindingError = (message) => {
					throw new BindingError(message);
				};
				function sharedRegisterType(rawType, registeredInstance, options = {}) {
					var name = registeredInstance.name;
					if (!rawType) throwBindingError(`type "${name}" must have a positive integer typeid pointer`);
					if (registeredTypes.hasOwnProperty(rawType)) if (options.ignoreDuplicateRegistrations) return;
					else throwBindingError(`Cannot register type '${name}' twice`);
					registeredTypes[rawType] = registeredInstance;
					delete typeDependencies[rawType];
					if (awaitingDependencies.hasOwnProperty(rawType)) {
						var callbacks = awaitingDependencies[rawType];
						delete awaitingDependencies[rawType];
						callbacks.forEach((cb) => cb());
					}
				}
				function registerType(rawType, registeredInstance, options = {}) {
					return sharedRegisterType(rawType, registeredInstance, options);
				}
				var GenericWireTypeSize = 8;
				var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
					name = readLatin1String(name);
					registerType(rawType, {
						name,
						fromWireType: function(wt) {
							return !!wt;
						},
						toWireType: function(destructors, o) {
							return o ? trueValue : falseValue;
						},
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: function(pointer) {
							return this["fromWireType"](HEAPU8[pointer]);
						},
						destructorFunction: null
					});
				};
				var shallowCopyInternalPointer = (o) => ({
					count: o.count,
					deleteScheduled: o.deleteScheduled,
					preservePointerOnDelete: o.preservePointerOnDelete,
					ptr: o.ptr,
					ptrType: o.ptrType,
					smartPtr: o.smartPtr,
					smartPtrType: o.smartPtrType
				});
				var throwInstanceAlreadyDeleted = (obj) => {
					function getInstanceTypeName(handle) {
						return handle.$$.ptrType.registeredClass.name;
					}
					throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
				};
				var finalizationRegistry = false;
				var detachFinalizer = (handle) => {};
				var runDestructor = ($$) => {
					if ($$.smartPtr) $$.smartPtrType.rawDestructor($$.smartPtr);
					else $$.ptrType.registeredClass.rawDestructor($$.ptr);
				};
				var releaseClassHandle = ($$) => {
					$$.count.value -= 1;
					if (0 === $$.count.value) runDestructor($$);
				};
				var downcastPointer = (ptr, ptrClass, desiredClass) => {
					if (ptrClass === desiredClass) return ptr;
					if (void 0 === desiredClass.baseClass) return null;
					var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
					if (rv === null) return null;
					return desiredClass.downcast(rv);
				};
				var registeredPointers = {};
				var registeredInstances = {};
				var getBasestPointer = (class_, ptr) => {
					if (ptr === void 0) throwBindingError("ptr should not be undefined");
					while (class_.baseClass) {
						ptr = class_.upcast(ptr);
						class_ = class_.baseClass;
					}
					return ptr;
				};
				var getInheritedInstance = (class_, ptr) => {
					ptr = getBasestPointer(class_, ptr);
					return registeredInstances[ptr];
				};
				var makeClassHandle = (prototype, record) => {
					if (!record.ptrType || !record.ptr) throwInternalError("makeClassHandle requires ptr and ptrType");
					if (!!record.smartPtrType !== !!record.smartPtr) throwInternalError("Both smartPtrType and smartPtr must be specified");
					record.count = { value: 1 };
					return attachFinalizer(Object.create(prototype, { $$: {
						value: record,
						writable: true
					} }));
				};
				function RegisteredPointer_fromWireType(ptr) {
					var rawPointer = this.getPointee(ptr);
					if (!rawPointer) {
						this.destructor(ptr);
						return null;
					}
					var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
					if (void 0 !== registeredInstance) if (0 === registeredInstance.$$.count.value) {
						registeredInstance.$$.ptr = rawPointer;
						registeredInstance.$$.smartPtr = ptr;
						return registeredInstance["clone"]();
					} else {
						var rv = registeredInstance["clone"]();
						this.destructor(ptr);
						return rv;
					}
					function makeDefaultHandle() {
						if (this.isSmartPointer) return makeClassHandle(this.registeredClass.instancePrototype, {
							ptrType: this.pointeeType,
							ptr: rawPointer,
							smartPtrType: this,
							smartPtr: ptr
						});
						else return makeClassHandle(this.registeredClass.instancePrototype, {
							ptrType: this,
							ptr
						});
					}
					var registeredPointerRecord = registeredPointers[this.registeredClass.getActualType(rawPointer)];
					if (!registeredPointerRecord) return makeDefaultHandle.call(this);
					var toType;
					if (this.isConst) toType = registeredPointerRecord.constPointerType;
					else toType = registeredPointerRecord.pointerType;
					var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
					if (dp === null) return makeDefaultHandle.call(this);
					if (this.isSmartPointer) return makeClassHandle(toType.registeredClass.instancePrototype, {
						ptrType: toType,
						ptr: dp,
						smartPtrType: this,
						smartPtr: ptr
					});
					else return makeClassHandle(toType.registeredClass.instancePrototype, {
						ptrType: toType,
						ptr: dp
					});
				}
				var attachFinalizer = (handle) => {
					if ("undefined" === typeof FinalizationRegistry) {
						attachFinalizer = (handle) => handle;
						return handle;
					}
					finalizationRegistry = new FinalizationRegistry((info) => {
						releaseClassHandle(info.$$);
					});
					attachFinalizer = (handle) => {
						var $$ = handle.$$;
						if (!!$$.smartPtr) {
							var info = { $$ };
							finalizationRegistry.register(handle, info, handle);
						}
						return handle;
					};
					detachFinalizer = (handle) => finalizationRegistry.unregister(handle);
					return attachFinalizer(handle);
				};
				var deletionQueue = [];
				var flushPendingDeletes = () => {
					while (deletionQueue.length) {
						var obj = deletionQueue.pop();
						obj.$$.deleteScheduled = false;
						obj["delete"]();
					}
				};
				var delayFunction;
				var init_ClassHandle = () => {
					Object.assign(ClassHandle.prototype, {
						isAliasOf(other) {
							if (!(this instanceof ClassHandle)) return false;
							if (!(other instanceof ClassHandle)) return false;
							var leftClass = this.$$.ptrType.registeredClass;
							var left = this.$$.ptr;
							other.$$ = other.$$;
							var rightClass = other.$$.ptrType.registeredClass;
							var right = other.$$.ptr;
							while (leftClass.baseClass) {
								left = leftClass.upcast(left);
								leftClass = leftClass.baseClass;
							}
							while (rightClass.baseClass) {
								right = rightClass.upcast(right);
								rightClass = rightClass.baseClass;
							}
							return leftClass === rightClass && left === right;
						},
						clone() {
							if (!this.$$.ptr) throwInstanceAlreadyDeleted(this);
							if (this.$$.preservePointerOnDelete) {
								this.$$.count.value += 1;
								return this;
							} else {
								var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), { $$: { value: shallowCopyInternalPointer(this.$$) } }));
								clone.$$.count.value += 1;
								clone.$$.deleteScheduled = false;
								return clone;
							}
						},
						delete() {
							if (!this.$$.ptr) throwInstanceAlreadyDeleted(this);
							if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) throwBindingError("Object already scheduled for deletion");
							detachFinalizer(this);
							releaseClassHandle(this.$$);
							if (!this.$$.preservePointerOnDelete) {
								this.$$.smartPtr = void 0;
								this.$$.ptr = void 0;
							}
						},
						isDeleted() {
							return !this.$$.ptr;
						},
						deleteLater() {
							if (!this.$$.ptr) throwInstanceAlreadyDeleted(this);
							if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) throwBindingError("Object already scheduled for deletion");
							deletionQueue.push(this);
							if (deletionQueue.length === 1 && delayFunction) delayFunction(flushPendingDeletes);
							this.$$.deleteScheduled = true;
							return this;
						}
					});
				};
				function ClassHandle() {}
				var createNamedFunction = (name, body) => Object.defineProperty(body, "name", { value: name });
				var ensureOverloadTable = (proto, methodName, humanName) => {
					if (void 0 === proto[methodName].overloadTable) {
						var prevFunc = proto[methodName];
						proto[methodName] = function(...args) {
							if (!proto[methodName].overloadTable.hasOwnProperty(args.length)) throwBindingError(`Function '${humanName}' called with an invalid number of arguments (${args.length}) - expects one of (${proto[methodName].overloadTable})!`);
							return proto[methodName].overloadTable[args.length].apply(this, args);
						};
						proto[methodName].overloadTable = [];
						proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
					}
				};
				var exposePublicSymbol = (name, value, numArguments) => {
					if (Module.hasOwnProperty(name)) {
						if (void 0 === numArguments || void 0 !== Module[name].overloadTable && void 0 !== Module[name].overloadTable[numArguments]) throwBindingError(`Cannot register public name '${name}' twice`);
						ensureOverloadTable(Module, name, name);
						if (Module[name].overloadTable.hasOwnProperty(numArguments)) throwBindingError(`Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`);
						Module[name].overloadTable[numArguments] = value;
					} else {
						Module[name] = value;
						Module[name].argCount = numArguments;
					}
				};
				var char_0 = 48;
				var char_9 = 57;
				var makeLegalFunctionName = (name) => {
					name = name.replace(/[^a-zA-Z0-9_]/g, "$");
					var f = name.charCodeAt(0);
					if (f >= char_0 && f <= char_9) return `_${name}`;
					return name;
				};
				function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
					this.name = name;
					this.constructor = constructor;
					this.instancePrototype = instancePrototype;
					this.rawDestructor = rawDestructor;
					this.baseClass = baseClass;
					this.getActualType = getActualType;
					this.upcast = upcast;
					this.downcast = downcast;
					this.pureVirtualFunctions = [];
				}
				var upcastPointer = (ptr, ptrClass, desiredClass) => {
					while (ptrClass !== desiredClass) {
						if (!ptrClass.upcast) throwBindingError(`Expected null or instance of ${desiredClass.name}, got an instance of ${ptrClass.name}`);
						ptr = ptrClass.upcast(ptr);
						ptrClass = ptrClass.baseClass;
					}
					return ptr;
				};
				function constNoSmartPtrRawPointerToWireType(destructors, handle) {
					if (handle === null) {
						if (this.isReference) throwBindingError(`null is not a valid ${this.name}`);
						return 0;
					}
					if (!handle.$$) throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
					if (!handle.$$.ptr) throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
					var handleClass = handle.$$.ptrType.registeredClass;
					return upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
				}
				function genericPointerToWireType(destructors, handle) {
					var ptr;
					if (handle === null) {
						if (this.isReference) throwBindingError(`null is not a valid ${this.name}`);
						if (this.isSmartPointer) {
							ptr = this.rawConstructor();
							if (destructors !== null) destructors.push(this.rawDestructor, ptr);
							return ptr;
						} else return 0;
					}
					if (!handle || !handle.$$) throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
					if (!handle.$$.ptr) throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
					if (!this.isConst && handle.$$.ptrType.isConst) throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name} to parameter type ${this.name}`);
					var handleClass = handle.$$.ptrType.registeredClass;
					ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
					if (this.isSmartPointer) {
						if (void 0 === handle.$$.smartPtr) throwBindingError("Passing raw pointer to smart pointer is illegal");
						switch (this.sharingPolicy) {
							case 0:
								if (handle.$$.smartPtrType === this) ptr = handle.$$.smartPtr;
								else throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name} to parameter type ${this.name}`);
								break;
							case 1:
								ptr = handle.$$.smartPtr;
								break;
							case 2:
								if (handle.$$.smartPtrType === this) ptr = handle.$$.smartPtr;
								else {
									var clonedHandle = handle["clone"]();
									ptr = this.rawShare(ptr, Emval.toHandle(() => clonedHandle["delete"]()));
									if (destructors !== null) destructors.push(this.rawDestructor, ptr);
								}
								break;
							default: throwBindingError("Unsupporting sharing policy");
						}
					}
					return ptr;
				}
				function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
					if (handle === null) {
						if (this.isReference) throwBindingError(`null is not a valid ${this.name}`);
						return 0;
					}
					if (!handle.$$) throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
					if (!handle.$$.ptr) throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
					if (handle.$$.ptrType.isConst) throwBindingError(`Cannot convert argument of type ${handle.$$.ptrType.name} to parameter type ${this.name}`);
					var handleClass = handle.$$.ptrType.registeredClass;
					return upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
				}
				var init_RegisteredPointer = () => {
					Object.assign(RegisteredPointer.prototype, {
						getPointee(ptr) {
							if (this.rawGetPointee) ptr = this.rawGetPointee(ptr);
							return ptr;
						},
						destructor(ptr) {
							this.rawDestructor?.(ptr);
						},
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: readPointer,
						fromWireType: RegisteredPointer_fromWireType
					});
				};
				function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
					this.name = name;
					this.registeredClass = registeredClass;
					this.isReference = isReference;
					this.isConst = isConst;
					this.isSmartPointer = isSmartPointer;
					this.pointeeType = pointeeType;
					this.sharingPolicy = sharingPolicy;
					this.rawGetPointee = rawGetPointee;
					this.rawConstructor = rawConstructor;
					this.rawShare = rawShare;
					this.rawDestructor = rawDestructor;
					if (!isSmartPointer && registeredClass.baseClass === void 0) if (isConst) {
						this["toWireType"] = constNoSmartPtrRawPointerToWireType;
						this.destructorFunction = null;
					} else {
						this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
						this.destructorFunction = null;
					}
					else this["toWireType"] = genericPointerToWireType;
				}
				var replacePublicSymbol = (name, value, numArguments) => {
					if (!Module.hasOwnProperty(name)) throwInternalError("Replacing nonexistent public symbol");
					if (void 0 !== Module[name].overloadTable && void 0 !== numArguments) Module[name].overloadTable[numArguments] = value;
					else {
						Module[name] = value;
						Module[name].argCount = numArguments;
					}
				};
				var dynCallLegacy = (sig, ptr, args) => {
					sig = sig.replace(/p/g, "i");
					var f = Module["dynCall_" + sig];
					return f(ptr, ...args);
				};
				var wasmTableMirror = [];
				var wasmTable;
				var getWasmTableEntry = (funcPtr) => {
					var func = wasmTableMirror[funcPtr];
					if (!func) {
						if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
						wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
					}
					return func;
				};
				var dynCall = (sig, ptr, args = []) => {
					if (sig.includes("j")) return dynCallLegacy(sig, ptr, args);
					return getWasmTableEntry(ptr)(...args);
				};
				var getDynCaller = (sig, ptr) => (...args) => dynCall(sig, ptr, args);
				var embind__requireFunction = (signature, rawFunction) => {
					signature = readLatin1String(signature);
					function makeDynCaller() {
						if (signature.includes("j")) return getDynCaller(signature, rawFunction);
						return getWasmTableEntry(rawFunction);
					}
					var fp = makeDynCaller();
					if (typeof fp != "function") throwBindingError(`unknown function pointer with signature ${signature}: ${rawFunction}`);
					return fp;
				};
				var extendError = (baseErrorType, errorName) => {
					var errorClass = createNamedFunction(errorName, function(message) {
						this.name = errorName;
						this.message = message;
						var stack = new Error(message).stack;
						if (stack !== void 0) this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
					});
					errorClass.prototype = Object.create(baseErrorType.prototype);
					errorClass.prototype.constructor = errorClass;
					errorClass.prototype.toString = function() {
						if (this.message === void 0) return this.name;
						else return `${this.name}: ${this.message}`;
					};
					return errorClass;
				};
				var UnboundTypeError;
				var getTypeName = (type) => {
					var ptr = ___getTypeName(type);
					var rv = readLatin1String(ptr);
					_free(ptr);
					return rv;
				};
				var throwUnboundTypeError = (message, types) => {
					var unboundTypes = [];
					var seen = {};
					function visit(type) {
						if (seen[type]) return;
						if (registeredTypes[type]) return;
						if (typeDependencies[type]) {
							typeDependencies[type].forEach(visit);
							return;
						}
						unboundTypes.push(type);
						seen[type] = true;
					}
					types.forEach(visit);
					throw new UnboundTypeError(`${message}: ` + unboundTypes.map(getTypeName).join([", "]));
				};
				var __embind_register_class = (rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) => {
					name = readLatin1String(name);
					getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
					upcast &&= embind__requireFunction(upcastSignature, upcast);
					downcast &&= embind__requireFunction(downcastSignature, downcast);
					rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
					var legalFunctionName = makeLegalFunctionName(name);
					exposePublicSymbol(legalFunctionName, function() {
						throwUnboundTypeError(`Cannot construct ${name} due to unbound types`, [baseClassRawType]);
					});
					whenDependentTypesAreResolved([
						rawType,
						rawPointerType,
						rawConstPointerType
					], baseClassRawType ? [baseClassRawType] : [], (base) => {
						base = base[0];
						var baseClass;
						var basePrototype;
						if (baseClassRawType) {
							baseClass = base.registeredClass;
							basePrototype = baseClass.instancePrototype;
						} else basePrototype = ClassHandle.prototype;
						var constructor = createNamedFunction(name, function(...args) {
							if (Object.getPrototypeOf(this) !== instancePrototype) throw new BindingError("Use 'new' to construct " + name);
							if (void 0 === registeredClass.constructor_body) throw new BindingError(name + " has no accessible constructor");
							var body = registeredClass.constructor_body[args.length];
							if (void 0 === body) throw new BindingError(`Tried to invoke ctor of ${name} with invalid number of parameters (${args.length}) - expected (${Object.keys(registeredClass.constructor_body).toString()}) parameters instead!`);
							return body.apply(this, args);
						});
						var instancePrototype = Object.create(basePrototype, { constructor: { value: constructor } });
						constructor.prototype = instancePrototype;
						var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
						if (registeredClass.baseClass) {
							registeredClass.baseClass.__derivedClasses ??= [];
							registeredClass.baseClass.__derivedClasses.push(registeredClass);
						}
						var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
						var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
						var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
						registeredPointers[rawType] = {
							pointerType: pointerConverter,
							constPointerType: constPointerConverter
						};
						replacePublicSymbol(legalFunctionName, constructor);
						return [
							referenceConverter,
							pointerConverter,
							constPointerConverter
						];
					});
				};
				var heap32VectorToArray = (count, firstElement) => {
					var array = [];
					for (var i = 0; i < count; i++) array.push(HEAPU32[firstElement + i * 4 >> 2]);
					return array;
				};
				function usesDestructorStack(argTypes) {
					for (var i = 1; i < argTypes.length; ++i) if (argTypes[i] !== null && argTypes[i].destructorFunction === void 0) return true;
					return false;
				}
				var InvokerFunctions = {
					ftf: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam) {
						return function() {
							var rv = invoker(fn);
							return retType["fromWireType"](rv);
						};
					},
					ttfnn: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam, argType0) {
						return function(arg0) {
							var rv = invoker(fn, classParam["toWireType"](null, this), argType0["toWireType"](null, arg0));
							return retType["fromWireType"](rv);
						};
					},
					ttfn: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam) {
						return function() {
							var rv = invoker(fn, classParam["toWireType"](null, this));
							return retType["fromWireType"](rv);
						};
					},
					tffn: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam) {
						return function() {
							invoker(fn, classParam["toWireType"](null, this));
						};
					},
					ftfn: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam, argType0) {
						return function(arg0) {
							var rv = invoker(fn, argType0["toWireType"](null, arg0));
							return retType["fromWireType"](rv);
						};
					}
				};
				function createJsInvokerSignature(argTypes, isClassMethodFunc, returns, isAsync) {
					const signature = [
						isClassMethodFunc ? "t" : "f",
						returns ? "t" : "f",
						isAsync ? "t" : "f"
					];
					for (let i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
						const arg = argTypes[i];
						let destructorSig = "";
						if (arg.destructorFunction === void 0) destructorSig = "u";
						else if (arg.destructorFunction === null) destructorSig = "n";
						else destructorSig = "t";
						signature.push(destructorSig);
					}
					return signature.join("");
				}
				function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc, isAsync) {
					var argCount = argTypes.length;
					if (argCount < 2) throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
					var isClassMethodFunc = argTypes[1] !== null && classType !== null;
					var needsDestructorStack = usesDestructorStack(argTypes);
					var returns = argTypes[0].name !== "void";
					var closureArgs = [
						humanName,
						throwBindingError,
						cppInvokerFunc,
						cppTargetFunc,
						runDestructors,
						argTypes[0],
						argTypes[1]
					];
					for (var i = 0; i < argCount - 2; ++i) closureArgs.push(argTypes[i + 2]);
					if (!needsDestructorStack) {
						for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) if (argTypes[i].destructorFunction !== null) closureArgs.push(argTypes[i].destructorFunction);
					}
					return createNamedFunction(humanName, InvokerFunctions[createJsInvokerSignature(argTypes, isClassMethodFunc, returns, isAsync)](...closureArgs));
				}
				var __embind_register_class_constructor = (rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) => {
					var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
					invoker = embind__requireFunction(invokerSignature, invoker);
					whenDependentTypesAreResolved([], [rawClassType], (classType) => {
						classType = classType[0];
						var humanName = `constructor ${classType.name}`;
						if (void 0 === classType.registeredClass.constructor_body) classType.registeredClass.constructor_body = [];
						if (void 0 !== classType.registeredClass.constructor_body[argCount - 1]) throw new BindingError(`Cannot register multiple constructors with identical number of parameters (${argCount - 1}) for class '${classType.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`);
						classType.registeredClass.constructor_body[argCount - 1] = () => {
							throwUnboundTypeError(`Cannot construct ${classType.name} due to unbound types`, rawArgTypes);
						};
						whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
							argTypes.splice(1, 0, null);
							classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor);
							return [];
						});
						return [];
					});
				};
				var getFunctionName = (signature) => {
					signature = signature.trim();
					const argsIndex = signature.indexOf("(");
					if (argsIndex !== -1) return signature.substr(0, argsIndex);
					else return signature;
				};
				var __embind_register_class_function = (rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual, isAsync, isNonnullReturn) => {
					var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
					methodName = readLatin1String(methodName);
					methodName = getFunctionName(methodName);
					rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
					whenDependentTypesAreResolved([], [rawClassType], (classType) => {
						classType = classType[0];
						var humanName = `${classType.name}.${methodName}`;
						if (methodName.startsWith("@@")) methodName = Symbol[methodName.substring(2)];
						if (isPureVirtual) classType.registeredClass.pureVirtualFunctions.push(methodName);
						function unboundTypesHandler() {
							throwUnboundTypeError(`Cannot call ${humanName} due to unbound types`, rawArgTypes);
						}
						var proto = classType.registeredClass.instancePrototype;
						var method = proto[methodName];
						if (void 0 === method || void 0 === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
							unboundTypesHandler.argCount = argCount - 2;
							unboundTypesHandler.className = classType.name;
							proto[methodName] = unboundTypesHandler;
						} else {
							ensureOverloadTable(proto, methodName, humanName);
							proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
						}
						whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
							var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context, isAsync);
							if (void 0 === proto[methodName].overloadTable) {
								memberFunction.argCount = argCount - 2;
								proto[methodName] = memberFunction;
							} else proto[methodName].overloadTable[argCount - 2] = memberFunction;
							return [];
						});
						return [];
					});
				};
				var emval_freelist = [];
				var emval_handles = [];
				var __emval_decref = (handle) => {
					if (handle > 9 && 0 === --emval_handles[handle + 1]) {
						emval_handles[handle] = void 0;
						emval_freelist.push(handle);
					}
				};
				var count_emval_handles = () => emval_handles.length / 2 - 5 - emval_freelist.length;
				var init_emval = () => {
					emval_handles.push(0, 1, void 0, 1, null, 1, true, 1, false, 1);
					Module["count_emval_handles"] = count_emval_handles;
				};
				var Emval = {
					toValue: (handle) => {
						if (!handle) throwBindingError("Cannot use deleted val. handle = " + handle);
						return emval_handles[handle];
					},
					toHandle: (value) => {
						switch (value) {
							case void 0: return 2;
							case null: return 4;
							case true: return 6;
							case false: return 8;
							default: {
								const handle = emval_freelist.pop() || emval_handles.length;
								emval_handles[handle] = value;
								emval_handles[handle + 1] = 1;
								return handle;
							}
						}
					}
				};
				var EmValType = {
					name: "emscripten::val",
					fromWireType: (handle) => {
						var rv = Emval.toValue(handle);
						__emval_decref(handle);
						return rv;
					},
					toWireType: (destructors, value) => Emval.toHandle(value),
					argPackAdvance: GenericWireTypeSize,
					readValueFromPointer: readPointer,
					destructorFunction: null
				};
				var __embind_register_emval = (rawType) => registerType(rawType, EmValType);
				var embindRepr = (v) => {
					if (v === null) return "null";
					var t = typeof v;
					if (t === "object" || t === "array" || t === "function") return v.toString();
					else return "" + v;
				};
				var floatReadValueFromPointer = (name, width) => {
					switch (width) {
						case 4: return function(pointer) {
							return this["fromWireType"](HEAPF32[pointer >> 2]);
						};
						case 8: return function(pointer) {
							return this["fromWireType"](HEAPF64[pointer >> 3]);
						};
						default: throw new TypeError(`invalid float width (${width}): ${name}`);
					}
				};
				var __embind_register_float = (rawType, name, size) => {
					name = readLatin1String(name);
					registerType(rawType, {
						name,
						fromWireType: (value) => value,
						toWireType: (destructors, value) => value,
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: floatReadValueFromPointer(name, size),
						destructorFunction: null
					});
				};
				var __embind_register_function = (name, argCount, rawArgTypesAddr, signature, rawInvoker, fn, isAsync, isNonnullReturn) => {
					var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
					name = readLatin1String(name);
					name = getFunctionName(name);
					rawInvoker = embind__requireFunction(signature, rawInvoker);
					exposePublicSymbol(name, function() {
						throwUnboundTypeError(`Cannot call ${name} due to unbound types`, argTypes);
					}, argCount - 1);
					whenDependentTypesAreResolved([], argTypes, (argTypes) => {
						var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
						replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn, isAsync), argCount - 1);
						return [];
					});
				};
				var integerReadValueFromPointer = (name, width, signed) => {
					switch (width) {
						case 1: return signed ? (pointer) => HEAP8[pointer] : (pointer) => HEAPU8[pointer];
						case 2: return signed ? (pointer) => HEAP16[pointer >> 1] : (pointer) => HEAPU16[pointer >> 1];
						case 4: return signed ? (pointer) => HEAP32[pointer >> 2] : (pointer) => HEAPU32[pointer >> 2];
						default: throw new TypeError(`invalid integer width (${width}): ${name}`);
					}
				};
				var __embind_register_integer = (primitiveType, name, size, minRange, maxRange) => {
					name = readLatin1String(name);
					if (maxRange === -1) maxRange = 4294967295;
					var fromWireType = (value) => value;
					if (minRange === 0) {
						var bitshift = 32 - 8 * size;
						fromWireType = (value) => value << bitshift >>> bitshift;
					}
					var isUnsignedType = name.includes("unsigned");
					var toWireType;
					if (isUnsignedType) toWireType = function(destructors, value) {
						this.name;
						return value >>> 0;
					};
					else toWireType = function(destructors, value) {
						this.name;
						return value;
					};
					registerType(primitiveType, {
						name,
						fromWireType,
						toWireType,
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: integerReadValueFromPointer(name, size, minRange !== 0),
						destructorFunction: null
					});
				};
				var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
					var TA = [
						Int8Array,
						Uint8Array,
						Int16Array,
						Uint16Array,
						Int32Array,
						Uint32Array,
						Float32Array,
						Float64Array
					][dataTypeIndex];
					function decodeMemoryView(handle) {
						var size = HEAPU32[handle >> 2];
						var data = HEAPU32[handle + 4 >> 2];
						return new TA(HEAP8.buffer, data, size);
					}
					name = readLatin1String(name);
					registerType(rawType, {
						name,
						fromWireType: decodeMemoryView,
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: decodeMemoryView
					}, { ignoreDuplicateRegistrations: true });
				};
				var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
					if (!(maxBytesToWrite > 0)) return 0;
					var startIdx = outIdx;
					var endIdx = outIdx + maxBytesToWrite - 1;
					for (var i = 0; i < str.length; ++i) {
						var u = str.charCodeAt(i);
						if (u >= 55296 && u <= 57343) {
							var u1 = str.charCodeAt(++i);
							u = 65536 + ((u & 1023) << 10) | u1 & 1023;
						}
						if (u <= 127) {
							if (outIdx >= endIdx) break;
							heap[outIdx++] = u;
						} else if (u <= 2047) {
							if (outIdx + 1 >= endIdx) break;
							heap[outIdx++] = 192 | u >> 6;
							heap[outIdx++] = 128 | u & 63;
						} else if (u <= 65535) {
							if (outIdx + 2 >= endIdx) break;
							heap[outIdx++] = 224 | u >> 12;
							heap[outIdx++] = 128 | u >> 6 & 63;
							heap[outIdx++] = 128 | u & 63;
						} else {
							if (outIdx + 3 >= endIdx) break;
							heap[outIdx++] = 240 | u >> 18;
							heap[outIdx++] = 128 | u >> 12 & 63;
							heap[outIdx++] = 128 | u >> 6 & 63;
							heap[outIdx++] = 128 | u & 63;
						}
					}
					heap[outIdx] = 0;
					return outIdx - startIdx;
				};
				var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
				var lengthBytesUTF8 = (str) => {
					var len = 0;
					for (var i = 0; i < str.length; ++i) {
						var c = str.charCodeAt(i);
						if (c <= 127) len++;
						else if (c <= 2047) len += 2;
						else if (c >= 55296 && c <= 57343) {
							len += 4;
							++i;
						} else len += 3;
					}
					return len;
				};
				var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder() : void 0;
				var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
					var endIdx = idx + maxBytesToRead;
					var endPtr = idx;
					while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
					if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
					var str = "";
					while (idx < endPtr) {
						var u0 = heapOrArray[idx++];
						if (!(u0 & 128)) {
							str += String.fromCharCode(u0);
							continue;
						}
						var u1 = heapOrArray[idx++] & 63;
						if ((u0 & 224) == 192) {
							str += String.fromCharCode((u0 & 31) << 6 | u1);
							continue;
						}
						var u2 = heapOrArray[idx++] & 63;
						if ((u0 & 240) == 224) u0 = (u0 & 15) << 12 | u1 << 6 | u2;
						else u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
						if (u0 < 65536) str += String.fromCharCode(u0);
						else {
							var ch = u0 - 65536;
							str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
						}
					}
					return str;
				};
				var UTF8ToString = (ptr, maxBytesToRead) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
				var __embind_register_std_string = (rawType, name) => {
					name = readLatin1String(name);
					var stdStringIsUTF8 = true;
					registerType(rawType, {
						name,
						fromWireType(value) {
							var length = HEAPU32[value >> 2];
							var payload = value + 4;
							var str;
							if (stdStringIsUTF8) {
								var decodeStartPtr = payload;
								for (var i = 0; i <= length; ++i) {
									var currentBytePtr = payload + i;
									if (i == length || HEAPU8[currentBytePtr] == 0) {
										var maxRead = currentBytePtr - decodeStartPtr;
										var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
										if (str === void 0) str = stringSegment;
										else {
											str += String.fromCharCode(0);
											str += stringSegment;
										}
										decodeStartPtr = currentBytePtr + 1;
									}
								}
							} else {
								var a = new Array(length);
								for (var i = 0; i < length; ++i) a[i] = String.fromCharCode(HEAPU8[payload + i]);
								str = a.join("");
							}
							_free(value);
							return str;
						},
						toWireType(destructors, value) {
							if (value instanceof ArrayBuffer) value = new Uint8Array(value);
							var length;
							var valueIsOfTypeString = typeof value == "string";
							if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) throwBindingError("Cannot pass non-string to std::string");
							if (stdStringIsUTF8 && valueIsOfTypeString) length = lengthBytesUTF8(value);
							else length = value.length;
							var base = _malloc(4 + length + 1);
							var ptr = base + 4;
							HEAPU32[base >> 2] = length;
							if (stdStringIsUTF8 && valueIsOfTypeString) stringToUTF8(value, ptr, length + 1);
							else if (valueIsOfTypeString) for (var i = 0; i < length; ++i) {
								var charCode = value.charCodeAt(i);
								if (charCode > 255) {
									_free(ptr);
									throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
								}
								HEAPU8[ptr + i] = charCode;
							}
							else for (var i = 0; i < length; ++i) HEAPU8[ptr + i] = value[i];
							if (destructors !== null) destructors.push(_free, base);
							return base;
						},
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: readPointer,
						destructorFunction(ptr) {
							_free(ptr);
						}
					});
				};
				var UTF16Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf-16le") : void 0;
				var UTF16ToString = (ptr, maxBytesToRead) => {
					var endPtr = ptr;
					var idx = endPtr >> 1;
					var maxIdx = idx + maxBytesToRead / 2;
					while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
					endPtr = idx << 1;
					if (endPtr - ptr > 32 && UTF16Decoder) return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
					var str = "";
					for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
						var codeUnit = HEAP16[ptr + i * 2 >> 1];
						if (codeUnit == 0) break;
						str += String.fromCharCode(codeUnit);
					}
					return str;
				};
				var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
					maxBytesToWrite ??= 2147483647;
					if (maxBytesToWrite < 2) return 0;
					maxBytesToWrite -= 2;
					var startPtr = outPtr;
					var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
					for (var i = 0; i < numCharsToWrite; ++i) {
						var codeUnit = str.charCodeAt(i);
						HEAP16[outPtr >> 1] = codeUnit;
						outPtr += 2;
					}
					HEAP16[outPtr >> 1] = 0;
					return outPtr - startPtr;
				};
				var lengthBytesUTF16 = (str) => str.length * 2;
				var UTF32ToString = (ptr, maxBytesToRead) => {
					var i = 0;
					var str = "";
					while (!(i >= maxBytesToRead / 4)) {
						var utf32 = HEAP32[ptr + i * 4 >> 2];
						if (utf32 == 0) break;
						++i;
						if (utf32 >= 65536) {
							var ch = utf32 - 65536;
							str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
						} else str += String.fromCharCode(utf32);
					}
					return str;
				};
				var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
					maxBytesToWrite ??= 2147483647;
					if (maxBytesToWrite < 4) return 0;
					var startPtr = outPtr;
					var endPtr = startPtr + maxBytesToWrite - 4;
					for (var i = 0; i < str.length; ++i) {
						var codeUnit = str.charCodeAt(i);
						if (codeUnit >= 55296 && codeUnit <= 57343) {
							var trailSurrogate = str.charCodeAt(++i);
							codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
						}
						HEAP32[outPtr >> 2] = codeUnit;
						outPtr += 4;
						if (outPtr + 4 > endPtr) break;
					}
					HEAP32[outPtr >> 2] = 0;
					return outPtr - startPtr;
				};
				var lengthBytesUTF32 = (str) => {
					var len = 0;
					for (var i = 0; i < str.length; ++i) {
						var codeUnit = str.charCodeAt(i);
						if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
						len += 4;
					}
					return len;
				};
				var __embind_register_std_wstring = (rawType, charSize, name) => {
					name = readLatin1String(name);
					var decodeString, encodeString, readCharAt, lengthBytesUTF;
					if (charSize === 2) {
						decodeString = UTF16ToString;
						encodeString = stringToUTF16;
						lengthBytesUTF = lengthBytesUTF16;
						readCharAt = (pointer) => HEAPU16[pointer >> 1];
					} else if (charSize === 4) {
						decodeString = UTF32ToString;
						encodeString = stringToUTF32;
						lengthBytesUTF = lengthBytesUTF32;
						readCharAt = (pointer) => HEAPU32[pointer >> 2];
					}
					registerType(rawType, {
						name,
						fromWireType: (value) => {
							var length = HEAPU32[value >> 2];
							var str;
							var decodeStartPtr = value + 4;
							for (var i = 0; i <= length; ++i) {
								var currentBytePtr = value + 4 + i * charSize;
								if (i == length || readCharAt(currentBytePtr) == 0) {
									var maxReadBytes = currentBytePtr - decodeStartPtr;
									var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
									if (str === void 0) str = stringSegment;
									else {
										str += String.fromCharCode(0);
										str += stringSegment;
									}
									decodeStartPtr = currentBytePtr + charSize;
								}
							}
							_free(value);
							return str;
						},
						toWireType: (destructors, value) => {
							if (!(typeof value == "string")) throwBindingError(`Cannot pass non-string to C++ string type ${name}`);
							var length = lengthBytesUTF(value);
							var ptr = _malloc(4 + length + charSize);
							HEAPU32[ptr >> 2] = length / charSize;
							encodeString(value, ptr + 4, length + charSize);
							if (destructors !== null) destructors.push(_free, ptr);
							return ptr;
						},
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: readPointer,
						destructorFunction(ptr) {
							_free(ptr);
						}
					});
				};
				var __embind_register_value_object = (rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) => {
					structRegistrations[rawType] = {
						name: readLatin1String(name),
						rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
						rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
						fields: []
					};
				};
				var __embind_register_value_object_field = (structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) => {
					structRegistrations[structType].fields.push({
						fieldName: readLatin1String(fieldName),
						getterReturnType,
						getter: embind__requireFunction(getterSignature, getter),
						getterContext,
						setterArgumentType,
						setter: embind__requireFunction(setterSignature, setter),
						setterContext
					});
				};
				var __embind_register_void = (rawType, name) => {
					name = readLatin1String(name);
					registerType(rawType, {
						isVoid: true,
						name,
						argPackAdvance: 0,
						fromWireType: () => void 0,
						toWireType: (destructors, o) => void 0
					});
				};
				var __emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);
				var emval_methodCallers = [];
				var __emval_call = (caller, handle, destructorsRef, args) => {
					caller = emval_methodCallers[caller];
					handle = Emval.toValue(handle);
					return caller(null, handle, destructorsRef, args);
				};
				var emval_symbols = {};
				var getStringOrSymbol = (address) => {
					var symbol = emval_symbols[address];
					if (symbol === void 0) return readLatin1String(address);
					return symbol;
				};
				var emval_get_global = () => {
					if (typeof globalThis == "object") return globalThis;
					function testGlobal(obj) {
						obj["$$$embind_global$$$"] = obj;
						var success = typeof $$$embind_global$$$ == "object" && obj["$$$embind_global$$$"] == obj;
						if (!success) delete obj["$$$embind_global$$$"];
						return success;
					}
					if (typeof $$$embind_global$$$ == "object") return $$$embind_global$$$;
					if (typeof global == "object" && testGlobal(global)) $$$embind_global$$$ = global;
					else if (typeof self == "object" && testGlobal(self)) $$$embind_global$$$ = self;
					if (typeof $$$embind_global$$$ == "object") return $$$embind_global$$$;
					throw Error("unable to get global object.");
				};
				var __emval_get_global = (name) => {
					if (name === 0) return Emval.toHandle(emval_get_global());
					else {
						name = getStringOrSymbol(name);
						return Emval.toHandle(emval_get_global()[name]);
					}
				};
				var emval_addMethodCaller = (caller) => {
					var id = emval_methodCallers.length;
					emval_methodCallers.push(caller);
					return id;
				};
				var requireRegisteredType = (rawType, humanName) => {
					var impl = registeredTypes[rawType];
					if (void 0 === impl) throwBindingError(`${humanName} has unknown type ${getTypeName(rawType)}`);
					return impl;
				};
				var emval_lookupTypes = (argCount, argTypes) => {
					var a = new Array(argCount);
					for (var i = 0; i < argCount; ++i) a[i] = requireRegisteredType(HEAPU32[argTypes + i * 4 >> 2], "parameter " + i);
					return a;
				};
				var reflectConstruct = Reflect.construct;
				var emval_returnValue = (returnType, destructorsRef, handle) => {
					var destructors = [];
					var result = returnType["toWireType"](destructors, handle);
					if (destructors.length) HEAPU32[destructorsRef >> 2] = Emval.toHandle(destructors);
					return result;
				};
				var __emval_get_method_caller = (argCount, argTypes, kind) => {
					var types = emval_lookupTypes(argCount, argTypes);
					var retType = types.shift();
					argCount--;
					var argN = new Array(argCount);
					var invokerFunction = (obj, func, destructorsRef, args) => {
						var offset = 0;
						for (var i = 0; i < argCount; ++i) {
							argN[i] = types[i]["readValueFromPointer"](args + offset);
							offset += types[i].argPackAdvance;
						}
						return emval_returnValue(retType, destructorsRef, kind === 1 ? reflectConstruct(func, argN) : func.apply(obj, argN));
					};
					return emval_addMethodCaller(createNamedFunction(`methodCaller<(${types.map((t) => t.name).join(", ")}) => ${retType.name}>`, invokerFunction));
				};
				var __emval_run_destructors = (handle) => {
					runDestructors(Emval.toValue(handle));
					__emval_decref(handle);
				};
				var __emval_take_value = (type, arg) => {
					type = requireRegisteredType(type, "_emval_take_value");
					var v = type["readValueFromPointer"](arg);
					return Emval.toHandle(v);
				};
				var getHeapMax = () => 2147483648;
				var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
				var growMemory = (size) => {
					var pages = (size - wasmMemory.buffer.byteLength + 65535) / 65536 | 0;
					try {
						wasmMemory.grow(pages);
						updateMemoryViews();
						return 1;
					} catch (e) {}
				};
				var _emscripten_resize_heap = (requestedSize) => {
					var oldSize = HEAPU8.length;
					requestedSize >>>= 0;
					var maxHeapSize = getHeapMax();
					if (requestedSize > maxHeapSize) return false;
					for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
						var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
						overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
						if (growMemory(Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536)))) return true;
					}
					return false;
				};
				var getCFunc = (ident) => {
					return Module["_" + ident];
				};
				var writeArrayToMemory = (array, buffer) => {
					HEAP8.set(array, buffer);
				};
				var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
				var stringToUTF8OnStack = (str) => {
					var size = lengthBytesUTF8(str) + 1;
					var ret = stackAlloc(size);
					stringToUTF8(str, ret, size);
					return ret;
				};
				var ccall = (ident, returnType, argTypes, args, opts) => {
					var toC = {
						string: (str) => {
							var ret = 0;
							if (str !== null && str !== void 0 && str !== 0) ret = stringToUTF8OnStack(str);
							return ret;
						},
						array: (arr) => {
							var ret = stackAlloc(arr.length);
							writeArrayToMemory(arr, ret);
							return ret;
						}
					};
					function convertReturnValue(ret) {
						if (returnType === "string") return UTF8ToString(ret);
						if (returnType === "boolean") return Boolean(ret);
						return ret;
					}
					var func = getCFunc(ident);
					var cArgs = [];
					var stack = 0;
					if (args) for (var i = 0; i < args.length; i++) {
						var converter = toC[argTypes[i]];
						if (converter) {
							if (stack === 0) stack = stackSave();
							cArgs[i] = converter(args[i]);
						} else cArgs[i] = args[i];
					}
					var ret = func(...cArgs);
					function onDone(ret) {
						if (stack !== 0) stackRestore(stack);
						return convertReturnValue(ret);
					}
					ret = onDone(ret);
					return ret;
				};
				InternalError = Module["InternalError"] = class InternalError extends Error {
					constructor(message) {
						super(message);
						this.name = "InternalError";
					}
				};
				embind_init_charCodes();
				BindingError = Module["BindingError"] = class BindingError extends Error {
					constructor(message) {
						super(message);
						this.name = "BindingError";
					}
				};
				init_ClassHandle();
				init_RegisteredPointer();
				UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
				init_emval();
				var wasmImports = {
					g: ___cxa_throw,
					o: __abort_js,
					l: __embind_finalize_value_object,
					n: __embind_register_bigint,
					t: __embind_register_bool,
					k: __embind_register_class,
					j: __embind_register_class_constructor,
					c: __embind_register_class_function,
					r: __embind_register_emval,
					h: __embind_register_float,
					e: __embind_register_function,
					b: __embind_register_integer,
					a: __embind_register_memory_view,
					s: __embind_register_std_string,
					f: __embind_register_std_wstring,
					m: __embind_register_value_object,
					d: __embind_register_value_object_field,
					u: __embind_register_void,
					q: __emscripten_memcpy_js,
					w: __emval_call,
					y: __emval_decref,
					z: __emval_get_global,
					x: __emval_get_method_caller,
					v: __emval_run_destructors,
					i: __emval_take_value,
					p: _emscripten_resize_heap
				};
				var wasmExports;
				createWasm();
				var ___getTypeName = (a0) => (___getTypeName = wasmExports["C"])(a0);
				var _malloc = (a0) => (_malloc = wasmExports["E"])(a0);
				var _free = (a0) => (_free = wasmExports["F"])(a0);
				var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports["G"])(a0);
				var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports["H"])(a0);
				var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["I"])();
				Module["ccall"] = ccall;
				var calledRun;
				dependenciesFulfilled = function runCaller() {
					if (!calledRun) run();
					if (!calledRun) dependenciesFulfilled = runCaller;
				};
				function run() {
					if (runDependencies > 0) return;
					preRun();
					if (runDependencies > 0) return;
					function doRun() {
						if (calledRun) return;
						calledRun = true;
						Module["calledRun"] = true;
						if (ABORT) return;
						initRuntime();
						readyPromiseResolve(Module);
						Module["onRuntimeInitialized"]?.();
						postRun();
					}
					if (Module["setStatus"]) {
						Module["setStatus"]("Running...");
						setTimeout(() => {
							setTimeout(() => Module["setStatus"](""), 1);
							doRun();
						}, 1);
					} else doRun();
				}
				if (Module["preInit"]) {
					if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
					while (Module["preInit"].length > 0) Module["preInit"].pop()();
				}
				run();
				moduleRtn = readyPromise;
				return moduleRtn;
			});
		})();
		if (typeof exports === "object" && typeof module === "object") {
			module.exports = CharLSWASM;
			module.exports.default = CharLSWASM;
		} else if (typeof define === "function" && define["amd"]) define([], () => CharLSWASM);
	})))());
	const charlsWasm = new URL("/assets/charlswasm_decode-BrO4esUm.wasm", "" + self.location.href);
	const local$2 = {
		codec: void 0,
		decoder: void 0,
		decodeConfig: {}
	};
	function getExceptionMessage(exception) {
		return typeof exception === "number" ? local$2.codec.getExceptionMessage(exception) : exception;
	}
	function initialize$2(decodeConfig) {
		local$2.decodeConfig = decodeConfig;
		setWasmBasePathFromConfig(decodeConfig);
		if (local$2.codec) return Promise.resolve();
		const charlsModule = (0, import_charlswasm_decode.default)({ locateFile: (f) => {
			if (f.endsWith(".wasm")) return resolveWasmUrl("charlswasm_decode.wasm", charlsWasm);
			return f;
		} });
		return new Promise((resolve, reject) => {
			charlsModule.then((instance) => {
				local$2.codec = instance;
				local$2.decoder = new instance.JpegLSDecoder();
				resolve();
			}, reject);
		});
	}
	async function decodeAsync$2(compressedImageFrame, imageInfo) {
		try {
			await initialize$2();
			const decoder = local$2.decoder;
			decoder.getEncodedBuffer(compressedImageFrame.length).set(compressedImageFrame);
			decoder.decode();
			const frameInfo = decoder.getFrameInfo();
			const interleaveMode = decoder.getInterleaveMode();
			const nearLossless = decoder.getNearLossless();
			const decodedPixelsInWASM = decoder.getDecodedBuffer();
			const encodedImageInfo = {
				columns: frameInfo.width,
				rows: frameInfo.height,
				bitsPerPixel: frameInfo.bitsPerSample,
				signed: imageInfo.signed,
				bytesPerPixel: imageInfo.bytesPerPixel,
				componentsPerPixel: frameInfo.componentCount
			};
			const pixelData = getPixelData(frameInfo, decodedPixelsInWASM, imageInfo.signed);
			const encodeOptions = {
				nearLossless,
				interleaveMode,
				frameInfo
			};
			return {
				...imageInfo,
				pixelData,
				imageInfo: encodedImageInfo,
				encodeOptions,
				...encodeOptions,
				...encodedImageInfo
			};
		} catch (error) {
			throw getExceptionMessage(error);
		}
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/decoders/decodeJPEG2000.js
	var import_openjpegwasm_decode = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
		var OpenJPEGWASM = (() => {
			var _scriptName = typeof document != "undefined" ? document.currentScript?.src : void 0;
			if (typeof __filename != "undefined") _scriptName = _scriptName || __filename;
			return (function(moduleArg = {}) {
				var moduleRtn;
				var Module = moduleArg;
				var readyPromiseResolve, readyPromiseReject;
				var readyPromise = new Promise((resolve, reject) => {
					readyPromiseResolve = resolve;
					readyPromiseReject = reject;
				});
				var ENVIRONMENT_IS_WEB = typeof window == "object";
				var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != "undefined";
				var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string" && process.type != "renderer";
				if (ENVIRONMENT_IS_NODE) {}
				var moduleOverrides = Object.assign({}, Module);
				var thisProgram = "./this.program";
				var scriptDirectory = "";
				function locateFile(path) {
					if (Module["locateFile"]) return Module["locateFile"](path, scriptDirectory);
					return scriptDirectory + path;
				}
				var readAsync, readBinary;
				if (ENVIRONMENT_IS_NODE) {
					var fs = require___vite_browser_external();
					require___vite_browser_external();
					scriptDirectory = __dirname + "/";
					readBinary = (filename) => {
						filename = isFileURI(filename) ? new URL(filename) : filename;
						return fs.readFileSync(filename);
					};
					readAsync = async (filename, binary = true) => {
						filename = isFileURI(filename) ? new URL(filename) : filename;
						return fs.readFileSync(filename, binary ? void 0 : "utf8");
					};
					if (!Module["thisProgram"] && process.argv.length > 1) thisProgram = process.argv[1].replace(/\\/g, "/");
					process.argv.slice(2);
				} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
					if (ENVIRONMENT_IS_WORKER) scriptDirectory = self.location.href;
					else if (typeof document != "undefined" && document.currentScript) scriptDirectory = document.currentScript.src;
					if (_scriptName) scriptDirectory = _scriptName;
					if (scriptDirectory.startsWith("blob:")) scriptDirectory = "";
					else scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
					if (ENVIRONMENT_IS_WORKER) readBinary = (url) => {
						var xhr = new XMLHttpRequest();
						xhr.open("GET", url, false);
						xhr.responseType = "arraybuffer";
						xhr.send(null);
						return new Uint8Array(xhr.response);
					};
					readAsync = async (url) => {
						if (isFileURI(url)) return new Promise((resolve, reject) => {
							var xhr = new XMLHttpRequest();
							xhr.open("GET", url, true);
							xhr.responseType = "arraybuffer";
							xhr.onload = () => {
								if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
									resolve(xhr.response);
									return;
								}
								reject(xhr.status);
							};
							xhr.onerror = reject;
							xhr.send(null);
						});
						var response = await fetch(url, { credentials: "same-origin" });
						if (response.ok) return response.arrayBuffer();
						throw new Error(response.status + " : " + response.url);
					};
				}
				var out = Module["print"] || console.log.bind(console);
				var err = Module["printErr"] || console.error.bind(console);
				Object.assign(Module, moduleOverrides);
				moduleOverrides = null;
				if (Module["arguments"]) Module["arguments"];
				if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
				var wasmBinary = Module["wasmBinary"];
				var wasmMemory;
				var ABORT = false;
				var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
				function updateMemoryViews() {
					var b = wasmMemory.buffer;
					Module["HEAP8"] = HEAP8 = new Int8Array(b);
					Module["HEAP16"] = HEAP16 = new Int16Array(b);
					Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
					Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
					Module["HEAP32"] = HEAP32 = new Int32Array(b);
					Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
					Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
					Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
				}
				var __ATPRERUN__ = [];
				var __ATINIT__ = [];
				var __ATPOSTRUN__ = [];
				function preRun() {
					if (Module["preRun"]) {
						if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
						while (Module["preRun"].length) addOnPreRun(Module["preRun"].shift());
					}
					callRuntimeCallbacks(__ATPRERUN__);
				}
				function initRuntime() {
					callRuntimeCallbacks(__ATINIT__);
				}
				function postRun() {
					if (Module["postRun"]) {
						if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
						while (Module["postRun"].length) addOnPostRun(Module["postRun"].shift());
					}
					callRuntimeCallbacks(__ATPOSTRUN__);
				}
				function addOnPreRun(cb) {
					__ATPRERUN__.unshift(cb);
				}
				function addOnInit(cb) {
					__ATINIT__.unshift(cb);
				}
				function addOnPostRun(cb) {
					__ATPOSTRUN__.unshift(cb);
				}
				var runDependencies = 0;
				var dependenciesFulfilled = null;
				function addRunDependency(id) {
					runDependencies++;
					Module["monitorRunDependencies"]?.(runDependencies);
				}
				function removeRunDependency(id) {
					runDependencies--;
					Module["monitorRunDependencies"]?.(runDependencies);
					if (runDependencies == 0) {
						if (dependenciesFulfilled) {
							var callback = dependenciesFulfilled;
							dependenciesFulfilled = null;
							callback();
						}
					}
				}
				function abort(what) {
					Module["onAbort"]?.(what);
					what = "Aborted(" + what + ")";
					err(what);
					ABORT = true;
					what += ". Build with -sASSERTIONS for more info.";
					var e = new WebAssembly.RuntimeError(what);
					readyPromiseReject(e);
					throw e;
				}
				var dataURIPrefix = "data:application/octet-stream;base64,";
				var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
				var isFileURI = (filename) => filename.startsWith("file://");
				function findWasmBinary() {
					var f = "openjpegwasm_decode.wasm";
					if (!isDataURI(f)) return locateFile(f);
					return f;
				}
				var wasmBinaryFile;
				function getBinarySync(file) {
					if (file == wasmBinaryFile && wasmBinary) return new Uint8Array(wasmBinary);
					if (readBinary) return readBinary(file);
					throw "both async and sync fetching of the wasm failed";
				}
				async function getWasmBinary(binaryFile) {
					if (!wasmBinary) try {
						var response = await readAsync(binaryFile);
						return new Uint8Array(response);
					} catch {}
					return getBinarySync(binaryFile);
				}
				async function instantiateArrayBuffer(binaryFile, imports) {
					try {
						var binary = await getWasmBinary(binaryFile);
						return await WebAssembly.instantiate(binary, imports);
					} catch (reason) {
						err(`failed to asynchronously prepare wasm: ${reason}`);
						abort(reason);
					}
				}
				async function instantiateAsync(binary, binaryFile, imports) {
					if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") try {
						var response = fetch(binaryFile, { credentials: "same-origin" });
						return await WebAssembly.instantiateStreaming(response, imports);
					} catch (reason) {
						err(`wasm streaming compile failed: ${reason}`);
						err("falling back to ArrayBuffer instantiation");
					}
					return instantiateArrayBuffer(binaryFile, imports);
				}
				function getWasmImports() {
					return { a: wasmImports };
				}
				async function createWasm() {
					function receiveInstance(instance, module$2) {
						wasmExports = instance.exports;
						wasmMemory = wasmExports["F"];
						updateMemoryViews();
						wasmTable = wasmExports["I"];
						addOnInit(wasmExports["G"]);
						removeRunDependency("wasm-instantiate");
						return wasmExports;
					}
					addRunDependency("wasm-instantiate");
					function receiveInstantiationResult(result) {
						receiveInstance(result["instance"]);
					}
					var info = getWasmImports();
					if (Module["instantiateWasm"]) try {
						return Module["instantiateWasm"](info, receiveInstance);
					} catch (e) {
						err(`Module.instantiateWasm callback failed with error: ${e}`);
						readyPromiseReject(e);
					}
					wasmBinaryFile ??= findWasmBinary();
					try {
						var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
						receiveInstantiationResult(result);
						return result;
					} catch (e) {
						readyPromiseReject(e);
						return;
					}
				}
				var callRuntimeCallbacks = (callbacks) => {
					while (callbacks.length > 0) callbacks.shift()(Module);
				};
				Module["noExitRuntime"];
				var stackRestore = (val) => __emscripten_stack_restore(val);
				var stackSave = () => _emscripten_stack_get_current();
				class ExceptionInfo {
					constructor(excPtr) {
						this.excPtr = excPtr;
						this.ptr = excPtr - 24;
					}
					set_type(type) {
						HEAPU32[this.ptr + 4 >> 2] = type;
					}
					get_type() {
						return HEAPU32[this.ptr + 4 >> 2];
					}
					set_destructor(destructor) {
						HEAPU32[this.ptr + 8 >> 2] = destructor;
					}
					get_destructor() {
						return HEAPU32[this.ptr + 8 >> 2];
					}
					set_caught(caught) {
						caught = caught ? 1 : 0;
						HEAP8[this.ptr + 12] = caught;
					}
					get_caught() {
						return HEAP8[this.ptr + 12] != 0;
					}
					set_rethrown(rethrown) {
						rethrown = rethrown ? 1 : 0;
						HEAP8[this.ptr + 13] = rethrown;
					}
					get_rethrown() {
						return HEAP8[this.ptr + 13] != 0;
					}
					init(type, destructor) {
						this.set_adjusted_ptr(0);
						this.set_type(type);
						this.set_destructor(destructor);
					}
					set_adjusted_ptr(adjustedPtr) {
						HEAPU32[this.ptr + 16 >> 2] = adjustedPtr;
					}
					get_adjusted_ptr() {
						return HEAPU32[this.ptr + 16 >> 2];
					}
				}
				var exceptionLast = 0;
				var uncaughtExceptionCount = 0;
				var ___cxa_throw = (ptr, type, destructor) => {
					new ExceptionInfo(ptr).init(type, destructor);
					exceptionLast = ptr;
					uncaughtExceptionCount++;
					throw exceptionLast;
				};
				var __abort_js = () => abort("");
				var structRegistrations = {};
				var runDestructors = (destructors) => {
					while (destructors.length) {
						var ptr = destructors.pop();
						destructors.pop()(ptr);
					}
				};
				function readPointer(pointer) {
					return this["fromWireType"](HEAPU32[pointer >> 2]);
				}
				var awaitingDependencies = {};
				var registeredTypes = {};
				var typeDependencies = {};
				var InternalError;
				var throwInternalError = (message) => {
					throw new InternalError(message);
				};
				var whenDependentTypesAreResolved = (myTypes, dependentTypes, getTypeConverters) => {
					myTypes.forEach((type) => typeDependencies[type] = dependentTypes);
					function onComplete(typeConverters) {
						var myTypeConverters = getTypeConverters(typeConverters);
						if (myTypeConverters.length !== myTypes.length) throwInternalError("Mismatched type converter count");
						for (var i = 0; i < myTypes.length; ++i) registerType(myTypes[i], myTypeConverters[i]);
					}
					var typeConverters = new Array(dependentTypes.length);
					var unregisteredTypes = [];
					var registered = 0;
					dependentTypes.forEach((dt, i) => {
						if (registeredTypes.hasOwnProperty(dt)) typeConverters[i] = registeredTypes[dt];
						else {
							unregisteredTypes.push(dt);
							if (!awaitingDependencies.hasOwnProperty(dt)) awaitingDependencies[dt] = [];
							awaitingDependencies[dt].push(() => {
								typeConverters[i] = registeredTypes[dt];
								++registered;
								if (registered === unregisteredTypes.length) onComplete(typeConverters);
							});
						}
					});
					if (0 === unregisteredTypes.length) onComplete(typeConverters);
				};
				var __embind_finalize_value_object = (structType) => {
					var reg = structRegistrations[structType];
					delete structRegistrations[structType];
					var rawConstructor = reg.rawConstructor;
					var rawDestructor = reg.rawDestructor;
					var fieldRecords = reg.fields;
					var fieldTypes = fieldRecords.map((field) => field.getterReturnType).concat(fieldRecords.map((field) => field.setterArgumentType));
					whenDependentTypesAreResolved([structType], fieldTypes, (fieldTypes) => {
						var fields = {};
						fieldRecords.forEach((field, i) => {
							var fieldName = field.fieldName;
							var getterReturnType = fieldTypes[i];
							var getter = field.getter;
							var getterContext = field.getterContext;
							var setterArgumentType = fieldTypes[i + fieldRecords.length];
							var setter = field.setter;
							var setterContext = field.setterContext;
							fields[fieldName] = {
								read: (ptr) => getterReturnType["fromWireType"](getter(getterContext, ptr)),
								write: (ptr, o) => {
									var destructors = [];
									setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
									runDestructors(destructors);
								}
							};
						});
						return [{
							name: reg.name,
							fromWireType: (ptr) => {
								var rv = {};
								for (var i in fields) rv[i] = fields[i].read(ptr);
								rawDestructor(ptr);
								return rv;
							},
							toWireType: (destructors, o) => {
								for (var fieldName in fields) if (!(fieldName in o)) throw new TypeError(`Missing field: "${fieldName}"`);
								var ptr = rawConstructor();
								for (fieldName in fields) fields[fieldName].write(ptr, o[fieldName]);
								if (destructors !== null) destructors.push(rawDestructor, ptr);
								return ptr;
							},
							argPackAdvance: GenericWireTypeSize,
							readValueFromPointer: readPointer,
							destructorFunction: rawDestructor
						}];
					});
				};
				var __embind_register_bigint = (primitiveType, name, size, minRange, maxRange) => {};
				var embind_init_charCodes = () => {
					var codes = new Array(256);
					for (var i = 0; i < 256; ++i) codes[i] = String.fromCharCode(i);
					embind_charCodes = codes;
				};
				var embind_charCodes;
				var readLatin1String = (ptr) => {
					var ret = "";
					var c = ptr;
					while (HEAPU8[c]) ret += embind_charCodes[HEAPU8[c++]];
					return ret;
				};
				var BindingError;
				var throwBindingError = (message) => {
					throw new BindingError(message);
				};
				function sharedRegisterType(rawType, registeredInstance, options = {}) {
					var name = registeredInstance.name;
					if (!rawType) throwBindingError(`type "${name}" must have a positive integer typeid pointer`);
					if (registeredTypes.hasOwnProperty(rawType)) if (options.ignoreDuplicateRegistrations) return;
					else throwBindingError(`Cannot register type '${name}' twice`);
					registeredTypes[rawType] = registeredInstance;
					delete typeDependencies[rawType];
					if (awaitingDependencies.hasOwnProperty(rawType)) {
						var callbacks = awaitingDependencies[rawType];
						delete awaitingDependencies[rawType];
						callbacks.forEach((cb) => cb());
					}
				}
				function registerType(rawType, registeredInstance, options = {}) {
					return sharedRegisterType(rawType, registeredInstance, options);
				}
				var GenericWireTypeSize = 8;
				var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
					name = readLatin1String(name);
					registerType(rawType, {
						name,
						fromWireType: function(wt) {
							return !!wt;
						},
						toWireType: function(destructors, o) {
							return o ? trueValue : falseValue;
						},
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: function(pointer) {
							return this["fromWireType"](HEAPU8[pointer]);
						},
						destructorFunction: null
					});
				};
				var shallowCopyInternalPointer = (o) => ({
					count: o.count,
					deleteScheduled: o.deleteScheduled,
					preservePointerOnDelete: o.preservePointerOnDelete,
					ptr: o.ptr,
					ptrType: o.ptrType,
					smartPtr: o.smartPtr,
					smartPtrType: o.smartPtrType
				});
				var throwInstanceAlreadyDeleted = (obj) => {
					function getInstanceTypeName(handle) {
						return handle.$$.ptrType.registeredClass.name;
					}
					throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
				};
				var finalizationRegistry = false;
				var detachFinalizer = (handle) => {};
				var runDestructor = ($$) => {
					if ($$.smartPtr) $$.smartPtrType.rawDestructor($$.smartPtr);
					else $$.ptrType.registeredClass.rawDestructor($$.ptr);
				};
				var releaseClassHandle = ($$) => {
					$$.count.value -= 1;
					if (0 === $$.count.value) runDestructor($$);
				};
				var downcastPointer = (ptr, ptrClass, desiredClass) => {
					if (ptrClass === desiredClass) return ptr;
					if (void 0 === desiredClass.baseClass) return null;
					var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
					if (rv === null) return null;
					return desiredClass.downcast(rv);
				};
				var registeredPointers = {};
				var registeredInstances = {};
				var getBasestPointer = (class_, ptr) => {
					if (ptr === void 0) throwBindingError("ptr should not be undefined");
					while (class_.baseClass) {
						ptr = class_.upcast(ptr);
						class_ = class_.baseClass;
					}
					return ptr;
				};
				var getInheritedInstance = (class_, ptr) => {
					ptr = getBasestPointer(class_, ptr);
					return registeredInstances[ptr];
				};
				var makeClassHandle = (prototype, record) => {
					if (!record.ptrType || !record.ptr) throwInternalError("makeClassHandle requires ptr and ptrType");
					if (!!record.smartPtrType !== !!record.smartPtr) throwInternalError("Both smartPtrType and smartPtr must be specified");
					record.count = { value: 1 };
					return attachFinalizer(Object.create(prototype, { $$: {
						value: record,
						writable: true
					} }));
				};
				function RegisteredPointer_fromWireType(ptr) {
					var rawPointer = this.getPointee(ptr);
					if (!rawPointer) {
						this.destructor(ptr);
						return null;
					}
					var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
					if (void 0 !== registeredInstance) if (0 === registeredInstance.$$.count.value) {
						registeredInstance.$$.ptr = rawPointer;
						registeredInstance.$$.smartPtr = ptr;
						return registeredInstance["clone"]();
					} else {
						var rv = registeredInstance["clone"]();
						this.destructor(ptr);
						return rv;
					}
					function makeDefaultHandle() {
						if (this.isSmartPointer) return makeClassHandle(this.registeredClass.instancePrototype, {
							ptrType: this.pointeeType,
							ptr: rawPointer,
							smartPtrType: this,
							smartPtr: ptr
						});
						else return makeClassHandle(this.registeredClass.instancePrototype, {
							ptrType: this,
							ptr
						});
					}
					var registeredPointerRecord = registeredPointers[this.registeredClass.getActualType(rawPointer)];
					if (!registeredPointerRecord) return makeDefaultHandle.call(this);
					var toType;
					if (this.isConst) toType = registeredPointerRecord.constPointerType;
					else toType = registeredPointerRecord.pointerType;
					var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
					if (dp === null) return makeDefaultHandle.call(this);
					if (this.isSmartPointer) return makeClassHandle(toType.registeredClass.instancePrototype, {
						ptrType: toType,
						ptr: dp,
						smartPtrType: this,
						smartPtr: ptr
					});
					else return makeClassHandle(toType.registeredClass.instancePrototype, {
						ptrType: toType,
						ptr: dp
					});
				}
				var attachFinalizer = (handle) => {
					if ("undefined" === typeof FinalizationRegistry) {
						attachFinalizer = (handle) => handle;
						return handle;
					}
					finalizationRegistry = new FinalizationRegistry((info) => {
						releaseClassHandle(info.$$);
					});
					attachFinalizer = (handle) => {
						var $$ = handle.$$;
						if (!!$$.smartPtr) {
							var info = { $$ };
							finalizationRegistry.register(handle, info, handle);
						}
						return handle;
					};
					detachFinalizer = (handle) => finalizationRegistry.unregister(handle);
					return attachFinalizer(handle);
				};
				var deletionQueue = [];
				var flushPendingDeletes = () => {
					while (deletionQueue.length) {
						var obj = deletionQueue.pop();
						obj.$$.deleteScheduled = false;
						obj["delete"]();
					}
				};
				var delayFunction;
				var init_ClassHandle = () => {
					Object.assign(ClassHandle.prototype, {
						isAliasOf(other) {
							if (!(this instanceof ClassHandle)) return false;
							if (!(other instanceof ClassHandle)) return false;
							var leftClass = this.$$.ptrType.registeredClass;
							var left = this.$$.ptr;
							other.$$ = other.$$;
							var rightClass = other.$$.ptrType.registeredClass;
							var right = other.$$.ptr;
							while (leftClass.baseClass) {
								left = leftClass.upcast(left);
								leftClass = leftClass.baseClass;
							}
							while (rightClass.baseClass) {
								right = rightClass.upcast(right);
								rightClass = rightClass.baseClass;
							}
							return leftClass === rightClass && left === right;
						},
						clone() {
							if (!this.$$.ptr) throwInstanceAlreadyDeleted(this);
							if (this.$$.preservePointerOnDelete) {
								this.$$.count.value += 1;
								return this;
							} else {
								var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), { $$: { value: shallowCopyInternalPointer(this.$$) } }));
								clone.$$.count.value += 1;
								clone.$$.deleteScheduled = false;
								return clone;
							}
						},
						delete() {
							if (!this.$$.ptr) throwInstanceAlreadyDeleted(this);
							if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) throwBindingError("Object already scheduled for deletion");
							detachFinalizer(this);
							releaseClassHandle(this.$$);
							if (!this.$$.preservePointerOnDelete) {
								this.$$.smartPtr = void 0;
								this.$$.ptr = void 0;
							}
						},
						isDeleted() {
							return !this.$$.ptr;
						},
						deleteLater() {
							if (!this.$$.ptr) throwInstanceAlreadyDeleted(this);
							if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) throwBindingError("Object already scheduled for deletion");
							deletionQueue.push(this);
							if (deletionQueue.length === 1 && delayFunction) delayFunction(flushPendingDeletes);
							this.$$.deleteScheduled = true;
							return this;
						}
					});
				};
				function ClassHandle() {}
				var createNamedFunction = (name, body) => Object.defineProperty(body, "name", { value: name });
				var ensureOverloadTable = (proto, methodName, humanName) => {
					if (void 0 === proto[methodName].overloadTable) {
						var prevFunc = proto[methodName];
						proto[methodName] = function(...args) {
							if (!proto[methodName].overloadTable.hasOwnProperty(args.length)) throwBindingError(`Function '${humanName}' called with an invalid number of arguments (${args.length}) - expects one of (${proto[methodName].overloadTable})!`);
							return proto[methodName].overloadTable[args.length].apply(this, args);
						};
						proto[methodName].overloadTable = [];
						proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
					}
				};
				var exposePublicSymbol = (name, value, numArguments) => {
					if (Module.hasOwnProperty(name)) {
						if (void 0 === numArguments || void 0 !== Module[name].overloadTable && void 0 !== Module[name].overloadTable[numArguments]) throwBindingError(`Cannot register public name '${name}' twice`);
						ensureOverloadTable(Module, name, name);
						if (Module[name].overloadTable.hasOwnProperty(numArguments)) throwBindingError(`Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`);
						Module[name].overloadTable[numArguments] = value;
					} else {
						Module[name] = value;
						Module[name].argCount = numArguments;
					}
				};
				var char_0 = 48;
				var char_9 = 57;
				var makeLegalFunctionName = (name) => {
					name = name.replace(/[^a-zA-Z0-9_]/g, "$");
					var f = name.charCodeAt(0);
					if (f >= char_0 && f <= char_9) return `_${name}`;
					return name;
				};
				function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
					this.name = name;
					this.constructor = constructor;
					this.instancePrototype = instancePrototype;
					this.rawDestructor = rawDestructor;
					this.baseClass = baseClass;
					this.getActualType = getActualType;
					this.upcast = upcast;
					this.downcast = downcast;
					this.pureVirtualFunctions = [];
				}
				var upcastPointer = (ptr, ptrClass, desiredClass) => {
					while (ptrClass !== desiredClass) {
						if (!ptrClass.upcast) throwBindingError(`Expected null or instance of ${desiredClass.name}, got an instance of ${ptrClass.name}`);
						ptr = ptrClass.upcast(ptr);
						ptrClass = ptrClass.baseClass;
					}
					return ptr;
				};
				function constNoSmartPtrRawPointerToWireType(destructors, handle) {
					if (handle === null) {
						if (this.isReference) throwBindingError(`null is not a valid ${this.name}`);
						return 0;
					}
					if (!handle.$$) throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
					if (!handle.$$.ptr) throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
					var handleClass = handle.$$.ptrType.registeredClass;
					return upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
				}
				function genericPointerToWireType(destructors, handle) {
					var ptr;
					if (handle === null) {
						if (this.isReference) throwBindingError(`null is not a valid ${this.name}`);
						if (this.isSmartPointer) {
							ptr = this.rawConstructor();
							if (destructors !== null) destructors.push(this.rawDestructor, ptr);
							return ptr;
						} else return 0;
					}
					if (!handle || !handle.$$) throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
					if (!handle.$$.ptr) throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
					if (!this.isConst && handle.$$.ptrType.isConst) throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name} to parameter type ${this.name}`);
					var handleClass = handle.$$.ptrType.registeredClass;
					ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
					if (this.isSmartPointer) {
						if (void 0 === handle.$$.smartPtr) throwBindingError("Passing raw pointer to smart pointer is illegal");
						switch (this.sharingPolicy) {
							case 0:
								if (handle.$$.smartPtrType === this) ptr = handle.$$.smartPtr;
								else throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name} to parameter type ${this.name}`);
								break;
							case 1:
								ptr = handle.$$.smartPtr;
								break;
							case 2:
								if (handle.$$.smartPtrType === this) ptr = handle.$$.smartPtr;
								else {
									var clonedHandle = handle["clone"]();
									ptr = this.rawShare(ptr, Emval.toHandle(() => clonedHandle["delete"]()));
									if (destructors !== null) destructors.push(this.rawDestructor, ptr);
								}
								break;
							default: throwBindingError("Unsupporting sharing policy");
						}
					}
					return ptr;
				}
				function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
					if (handle === null) {
						if (this.isReference) throwBindingError(`null is not a valid ${this.name}`);
						return 0;
					}
					if (!handle.$$) throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
					if (!handle.$$.ptr) throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
					if (handle.$$.ptrType.isConst) throwBindingError(`Cannot convert argument of type ${handle.$$.ptrType.name} to parameter type ${this.name}`);
					var handleClass = handle.$$.ptrType.registeredClass;
					return upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
				}
				var init_RegisteredPointer = () => {
					Object.assign(RegisteredPointer.prototype, {
						getPointee(ptr) {
							if (this.rawGetPointee) ptr = this.rawGetPointee(ptr);
							return ptr;
						},
						destructor(ptr) {
							this.rawDestructor?.(ptr);
						},
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: readPointer,
						fromWireType: RegisteredPointer_fromWireType
					});
				};
				function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
					this.name = name;
					this.registeredClass = registeredClass;
					this.isReference = isReference;
					this.isConst = isConst;
					this.isSmartPointer = isSmartPointer;
					this.pointeeType = pointeeType;
					this.sharingPolicy = sharingPolicy;
					this.rawGetPointee = rawGetPointee;
					this.rawConstructor = rawConstructor;
					this.rawShare = rawShare;
					this.rawDestructor = rawDestructor;
					if (!isSmartPointer && registeredClass.baseClass === void 0) if (isConst) {
						this["toWireType"] = constNoSmartPtrRawPointerToWireType;
						this.destructorFunction = null;
					} else {
						this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
						this.destructorFunction = null;
					}
					else this["toWireType"] = genericPointerToWireType;
				}
				var replacePublicSymbol = (name, value, numArguments) => {
					if (!Module.hasOwnProperty(name)) throwInternalError("Replacing nonexistent public symbol");
					if (void 0 !== Module[name].overloadTable && void 0 !== numArguments) Module[name].overloadTable[numArguments] = value;
					else {
						Module[name] = value;
						Module[name].argCount = numArguments;
					}
				};
				var dynCallLegacy = (sig, ptr, args) => {
					sig = sig.replace(/p/g, "i");
					var f = Module["dynCall_" + sig];
					return f(ptr, ...args);
				};
				var wasmTableMirror = [];
				var wasmTable;
				var getWasmTableEntry = (funcPtr) => {
					var func = wasmTableMirror[funcPtr];
					if (!func) {
						if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
						wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
					}
					return func;
				};
				var dynCall = (sig, ptr, args = []) => {
					if (sig.includes("j")) return dynCallLegacy(sig, ptr, args);
					return getWasmTableEntry(ptr)(...args);
				};
				var getDynCaller = (sig, ptr) => (...args) => dynCall(sig, ptr, args);
				var embind__requireFunction = (signature, rawFunction) => {
					signature = readLatin1String(signature);
					function makeDynCaller() {
						if (signature.includes("j")) return getDynCaller(signature, rawFunction);
						return getWasmTableEntry(rawFunction);
					}
					var fp = makeDynCaller();
					if (typeof fp != "function") throwBindingError(`unknown function pointer with signature ${signature}: ${rawFunction}`);
					return fp;
				};
				var extendError = (baseErrorType, errorName) => {
					var errorClass = createNamedFunction(errorName, function(message) {
						this.name = errorName;
						this.message = message;
						var stack = new Error(message).stack;
						if (stack !== void 0) this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
					});
					errorClass.prototype = Object.create(baseErrorType.prototype);
					errorClass.prototype.constructor = errorClass;
					errorClass.prototype.toString = function() {
						if (this.message === void 0) return this.name;
						else return `${this.name}: ${this.message}`;
					};
					return errorClass;
				};
				var UnboundTypeError;
				var getTypeName = (type) => {
					var ptr = ___getTypeName(type);
					var rv = readLatin1String(ptr);
					_free(ptr);
					return rv;
				};
				var throwUnboundTypeError = (message, types) => {
					var unboundTypes = [];
					var seen = {};
					function visit(type) {
						if (seen[type]) return;
						if (registeredTypes[type]) return;
						if (typeDependencies[type]) {
							typeDependencies[type].forEach(visit);
							return;
						}
						unboundTypes.push(type);
						seen[type] = true;
					}
					types.forEach(visit);
					throw new UnboundTypeError(`${message}: ` + unboundTypes.map(getTypeName).join([", "]));
				};
				var __embind_register_class = (rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) => {
					name = readLatin1String(name);
					getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
					upcast &&= embind__requireFunction(upcastSignature, upcast);
					downcast &&= embind__requireFunction(downcastSignature, downcast);
					rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
					var legalFunctionName = makeLegalFunctionName(name);
					exposePublicSymbol(legalFunctionName, function() {
						throwUnboundTypeError(`Cannot construct ${name} due to unbound types`, [baseClassRawType]);
					});
					whenDependentTypesAreResolved([
						rawType,
						rawPointerType,
						rawConstPointerType
					], baseClassRawType ? [baseClassRawType] : [], (base) => {
						base = base[0];
						var baseClass;
						var basePrototype;
						if (baseClassRawType) {
							baseClass = base.registeredClass;
							basePrototype = baseClass.instancePrototype;
						} else basePrototype = ClassHandle.prototype;
						var constructor = createNamedFunction(name, function(...args) {
							if (Object.getPrototypeOf(this) !== instancePrototype) throw new BindingError("Use 'new' to construct " + name);
							if (void 0 === registeredClass.constructor_body) throw new BindingError(name + " has no accessible constructor");
							var body = registeredClass.constructor_body[args.length];
							if (void 0 === body) throw new BindingError(`Tried to invoke ctor of ${name} with invalid number of parameters (${args.length}) - expected (${Object.keys(registeredClass.constructor_body).toString()}) parameters instead!`);
							return body.apply(this, args);
						});
						var instancePrototype = Object.create(basePrototype, { constructor: { value: constructor } });
						constructor.prototype = instancePrototype;
						var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
						if (registeredClass.baseClass) {
							registeredClass.baseClass.__derivedClasses ??= [];
							registeredClass.baseClass.__derivedClasses.push(registeredClass);
						}
						var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
						var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
						var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
						registeredPointers[rawType] = {
							pointerType: pointerConverter,
							constPointerType: constPointerConverter
						};
						replacePublicSymbol(legalFunctionName, constructor);
						return [
							referenceConverter,
							pointerConverter,
							constPointerConverter
						];
					});
				};
				var heap32VectorToArray = (count, firstElement) => {
					var array = [];
					for (var i = 0; i < count; i++) array.push(HEAPU32[firstElement + i * 4 >> 2]);
					return array;
				};
				function usesDestructorStack(argTypes) {
					for (var i = 1; i < argTypes.length; ++i) if (argTypes[i] !== null && argTypes[i].destructorFunction === void 0) return true;
					return false;
				}
				var InvokerFunctions = {
					ftf: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam) {
						return function() {
							var rv = invoker(fn);
							return retType["fromWireType"](rv);
						};
					},
					ttfnn: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam, argType0) {
						return function(arg0) {
							var rv = invoker(fn, classParam["toWireType"](null, this), argType0["toWireType"](null, arg0));
							return retType["fromWireType"](rv);
						};
					},
					ttfn: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam) {
						return function() {
							var rv = invoker(fn, classParam["toWireType"](null, this));
							return retType["fromWireType"](rv);
						};
					},
					tffn: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam) {
						return function() {
							invoker(fn, classParam["toWireType"](null, this));
						};
					},
					tffnnn: function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam, argType0, argType1) {
						return function(arg0, arg1) {
							invoker(fn, classParam["toWireType"](null, this), argType0["toWireType"](null, arg0), argType1["toWireType"](null, arg1));
						};
					}
				};
				function createJsInvokerSignature(argTypes, isClassMethodFunc, returns, isAsync) {
					const signature = [
						isClassMethodFunc ? "t" : "f",
						returns ? "t" : "f",
						isAsync ? "t" : "f"
					];
					for (let i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
						const arg = argTypes[i];
						let destructorSig = "";
						if (arg.destructorFunction === void 0) destructorSig = "u";
						else if (arg.destructorFunction === null) destructorSig = "n";
						else destructorSig = "t";
						signature.push(destructorSig);
					}
					return signature.join("");
				}
				function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc, isAsync) {
					var argCount = argTypes.length;
					if (argCount < 2) throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
					var isClassMethodFunc = argTypes[1] !== null && classType !== null;
					var needsDestructorStack = usesDestructorStack(argTypes);
					var returns = argTypes[0].name !== "void";
					var closureArgs = [
						humanName,
						throwBindingError,
						cppInvokerFunc,
						cppTargetFunc,
						runDestructors,
						argTypes[0],
						argTypes[1]
					];
					for (var i = 0; i < argCount - 2; ++i) closureArgs.push(argTypes[i + 2]);
					if (!needsDestructorStack) {
						for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) if (argTypes[i].destructorFunction !== null) closureArgs.push(argTypes[i].destructorFunction);
					}
					return createNamedFunction(humanName, InvokerFunctions[createJsInvokerSignature(argTypes, isClassMethodFunc, returns, isAsync)](...closureArgs));
				}
				var __embind_register_class_constructor = (rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) => {
					var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
					invoker = embind__requireFunction(invokerSignature, invoker);
					whenDependentTypesAreResolved([], [rawClassType], (classType) => {
						classType = classType[0];
						var humanName = `constructor ${classType.name}`;
						if (void 0 === classType.registeredClass.constructor_body) classType.registeredClass.constructor_body = [];
						if (void 0 !== classType.registeredClass.constructor_body[argCount - 1]) throw new BindingError(`Cannot register multiple constructors with identical number of parameters (${argCount - 1}) for class '${classType.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`);
						classType.registeredClass.constructor_body[argCount - 1] = () => {
							throwUnboundTypeError(`Cannot construct ${classType.name} due to unbound types`, rawArgTypes);
						};
						whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
							argTypes.splice(1, 0, null);
							classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor);
							return [];
						});
						return [];
					});
				};
				var getFunctionName = (signature) => {
					signature = signature.trim();
					const argsIndex = signature.indexOf("(");
					if (argsIndex !== -1) return signature.substr(0, argsIndex);
					else return signature;
				};
				var __embind_register_class_function = (rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual, isAsync, isNonnullReturn) => {
					var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
					methodName = readLatin1String(methodName);
					methodName = getFunctionName(methodName);
					rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
					whenDependentTypesAreResolved([], [rawClassType], (classType) => {
						classType = classType[0];
						var humanName = `${classType.name}.${methodName}`;
						if (methodName.startsWith("@@")) methodName = Symbol[methodName.substring(2)];
						if (isPureVirtual) classType.registeredClass.pureVirtualFunctions.push(methodName);
						function unboundTypesHandler() {
							throwUnboundTypeError(`Cannot call ${humanName} due to unbound types`, rawArgTypes);
						}
						var proto = classType.registeredClass.instancePrototype;
						var method = proto[methodName];
						if (void 0 === method || void 0 === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
							unboundTypesHandler.argCount = argCount - 2;
							unboundTypesHandler.className = classType.name;
							proto[methodName] = unboundTypesHandler;
						} else {
							ensureOverloadTable(proto, methodName, humanName);
							proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
						}
						whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
							var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context, isAsync);
							if (void 0 === proto[methodName].overloadTable) {
								memberFunction.argCount = argCount - 2;
								proto[methodName] = memberFunction;
							} else proto[methodName].overloadTable[argCount - 2] = memberFunction;
							return [];
						});
						return [];
					});
				};
				var emval_freelist = [];
				var emval_handles = [];
				var __emval_decref = (handle) => {
					if (handle > 9 && 0 === --emval_handles[handle + 1]) {
						emval_handles[handle] = void 0;
						emval_freelist.push(handle);
					}
				};
				var count_emval_handles = () => emval_handles.length / 2 - 5 - emval_freelist.length;
				var init_emval = () => {
					emval_handles.push(0, 1, void 0, 1, null, 1, true, 1, false, 1);
					Module["count_emval_handles"] = count_emval_handles;
				};
				var Emval = {
					toValue: (handle) => {
						if (!handle) throwBindingError("Cannot use deleted val. handle = " + handle);
						return emval_handles[handle];
					},
					toHandle: (value) => {
						switch (value) {
							case void 0: return 2;
							case null: return 4;
							case true: return 6;
							case false: return 8;
							default: {
								const handle = emval_freelist.pop() || emval_handles.length;
								emval_handles[handle] = value;
								emval_handles[handle + 1] = 1;
								return handle;
							}
						}
					}
				};
				var EmValType = {
					name: "emscripten::val",
					fromWireType: (handle) => {
						var rv = Emval.toValue(handle);
						__emval_decref(handle);
						return rv;
					},
					toWireType: (destructors, value) => Emval.toHandle(value),
					argPackAdvance: GenericWireTypeSize,
					readValueFromPointer: readPointer,
					destructorFunction: null
				};
				var __embind_register_emval = (rawType) => registerType(rawType, EmValType);
				var embindRepr = (v) => {
					if (v === null) return "null";
					var t = typeof v;
					if (t === "object" || t === "array" || t === "function") return v.toString();
					else return "" + v;
				};
				var floatReadValueFromPointer = (name, width) => {
					switch (width) {
						case 4: return function(pointer) {
							return this["fromWireType"](HEAPF32[pointer >> 2]);
						};
						case 8: return function(pointer) {
							return this["fromWireType"](HEAPF64[pointer >> 3]);
						};
						default: throw new TypeError(`invalid float width (${width}): ${name}`);
					}
				};
				var __embind_register_float = (rawType, name, size) => {
					name = readLatin1String(name);
					registerType(rawType, {
						name,
						fromWireType: (value) => value,
						toWireType: (destructors, value) => value,
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: floatReadValueFromPointer(name, size),
						destructorFunction: null
					});
				};
				var integerReadValueFromPointer = (name, width, signed) => {
					switch (width) {
						case 1: return signed ? (pointer) => HEAP8[pointer] : (pointer) => HEAPU8[pointer];
						case 2: return signed ? (pointer) => HEAP16[pointer >> 1] : (pointer) => HEAPU16[pointer >> 1];
						case 4: return signed ? (pointer) => HEAP32[pointer >> 2] : (pointer) => HEAPU32[pointer >> 2];
						default: throw new TypeError(`invalid integer width (${width}): ${name}`);
					}
				};
				var __embind_register_integer = (primitiveType, name, size, minRange, maxRange) => {
					name = readLatin1String(name);
					if (maxRange === -1) maxRange = 4294967295;
					var fromWireType = (value) => value;
					if (minRange === 0) {
						var bitshift = 32 - 8 * size;
						fromWireType = (value) => value << bitshift >>> bitshift;
					}
					var isUnsignedType = name.includes("unsigned");
					var toWireType;
					if (isUnsignedType) toWireType = function(destructors, value) {
						this.name;
						return value >>> 0;
					};
					else toWireType = function(destructors, value) {
						this.name;
						return value;
					};
					registerType(primitiveType, {
						name,
						fromWireType,
						toWireType,
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: integerReadValueFromPointer(name, size, minRange !== 0),
						destructorFunction: null
					});
				};
				var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
					var TA = [
						Int8Array,
						Uint8Array,
						Int16Array,
						Uint16Array,
						Int32Array,
						Uint32Array,
						Float32Array,
						Float64Array
					][dataTypeIndex];
					function decodeMemoryView(handle) {
						var size = HEAPU32[handle >> 2];
						var data = HEAPU32[handle + 4 >> 2];
						return new TA(HEAP8.buffer, data, size);
					}
					name = readLatin1String(name);
					registerType(rawType, {
						name,
						fromWireType: decodeMemoryView,
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: decodeMemoryView
					}, { ignoreDuplicateRegistrations: true });
				};
				var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
					if (!(maxBytesToWrite > 0)) return 0;
					var startIdx = outIdx;
					var endIdx = outIdx + maxBytesToWrite - 1;
					for (var i = 0; i < str.length; ++i) {
						var u = str.charCodeAt(i);
						if (u >= 55296 && u <= 57343) {
							var u1 = str.charCodeAt(++i);
							u = 65536 + ((u & 1023) << 10) | u1 & 1023;
						}
						if (u <= 127) {
							if (outIdx >= endIdx) break;
							heap[outIdx++] = u;
						} else if (u <= 2047) {
							if (outIdx + 1 >= endIdx) break;
							heap[outIdx++] = 192 | u >> 6;
							heap[outIdx++] = 128 | u & 63;
						} else if (u <= 65535) {
							if (outIdx + 2 >= endIdx) break;
							heap[outIdx++] = 224 | u >> 12;
							heap[outIdx++] = 128 | u >> 6 & 63;
							heap[outIdx++] = 128 | u & 63;
						} else {
							if (outIdx + 3 >= endIdx) break;
							heap[outIdx++] = 240 | u >> 18;
							heap[outIdx++] = 128 | u >> 12 & 63;
							heap[outIdx++] = 128 | u >> 6 & 63;
							heap[outIdx++] = 128 | u & 63;
						}
					}
					heap[outIdx] = 0;
					return outIdx - startIdx;
				};
				var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
				var lengthBytesUTF8 = (str) => {
					var len = 0;
					for (var i = 0; i < str.length; ++i) {
						var c = str.charCodeAt(i);
						if (c <= 127) len++;
						else if (c <= 2047) len += 2;
						else if (c >= 55296 && c <= 57343) {
							len += 4;
							++i;
						} else len += 3;
					}
					return len;
				};
				var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder() : void 0;
				var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
					var endIdx = idx + maxBytesToRead;
					var endPtr = idx;
					while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
					if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
					var str = "";
					while (idx < endPtr) {
						var u0 = heapOrArray[idx++];
						if (!(u0 & 128)) {
							str += String.fromCharCode(u0);
							continue;
						}
						var u1 = heapOrArray[idx++] & 63;
						if ((u0 & 224) == 192) {
							str += String.fromCharCode((u0 & 31) << 6 | u1);
							continue;
						}
						var u2 = heapOrArray[idx++] & 63;
						if ((u0 & 240) == 224) u0 = (u0 & 15) << 12 | u1 << 6 | u2;
						else u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
						if (u0 < 65536) str += String.fromCharCode(u0);
						else {
							var ch = u0 - 65536;
							str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
						}
					}
					return str;
				};
				var UTF8ToString = (ptr, maxBytesToRead) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
				var __embind_register_std_string = (rawType, name) => {
					name = readLatin1String(name);
					var stdStringIsUTF8 = true;
					registerType(rawType, {
						name,
						fromWireType(value) {
							var length = HEAPU32[value >> 2];
							var payload = value + 4;
							var str;
							if (stdStringIsUTF8) {
								var decodeStartPtr = payload;
								for (var i = 0; i <= length; ++i) {
									var currentBytePtr = payload + i;
									if (i == length || HEAPU8[currentBytePtr] == 0) {
										var maxRead = currentBytePtr - decodeStartPtr;
										var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
										if (str === void 0) str = stringSegment;
										else {
											str += String.fromCharCode(0);
											str += stringSegment;
										}
										decodeStartPtr = currentBytePtr + 1;
									}
								}
							} else {
								var a = new Array(length);
								for (var i = 0; i < length; ++i) a[i] = String.fromCharCode(HEAPU8[payload + i]);
								str = a.join("");
							}
							_free(value);
							return str;
						},
						toWireType(destructors, value) {
							if (value instanceof ArrayBuffer) value = new Uint8Array(value);
							var length;
							var valueIsOfTypeString = typeof value == "string";
							if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) throwBindingError("Cannot pass non-string to std::string");
							if (stdStringIsUTF8 && valueIsOfTypeString) length = lengthBytesUTF8(value);
							else length = value.length;
							var base = _malloc(4 + length + 1);
							var ptr = base + 4;
							HEAPU32[base >> 2] = length;
							if (stdStringIsUTF8 && valueIsOfTypeString) stringToUTF8(value, ptr, length + 1);
							else if (valueIsOfTypeString) for (var i = 0; i < length; ++i) {
								var charCode = value.charCodeAt(i);
								if (charCode > 255) {
									_free(ptr);
									throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
								}
								HEAPU8[ptr + i] = charCode;
							}
							else for (var i = 0; i < length; ++i) HEAPU8[ptr + i] = value[i];
							if (destructors !== null) destructors.push(_free, base);
							return base;
						},
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: readPointer,
						destructorFunction(ptr) {
							_free(ptr);
						}
					});
				};
				var UTF16Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf-16le") : void 0;
				var UTF16ToString = (ptr, maxBytesToRead) => {
					var endPtr = ptr;
					var idx = endPtr >> 1;
					var maxIdx = idx + maxBytesToRead / 2;
					while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
					endPtr = idx << 1;
					if (endPtr - ptr > 32 && UTF16Decoder) return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
					var str = "";
					for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
						var codeUnit = HEAP16[ptr + i * 2 >> 1];
						if (codeUnit == 0) break;
						str += String.fromCharCode(codeUnit);
					}
					return str;
				};
				var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
					maxBytesToWrite ??= 2147483647;
					if (maxBytesToWrite < 2) return 0;
					maxBytesToWrite -= 2;
					var startPtr = outPtr;
					var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
					for (var i = 0; i < numCharsToWrite; ++i) {
						var codeUnit = str.charCodeAt(i);
						HEAP16[outPtr >> 1] = codeUnit;
						outPtr += 2;
					}
					HEAP16[outPtr >> 1] = 0;
					return outPtr - startPtr;
				};
				var lengthBytesUTF16 = (str) => str.length * 2;
				var UTF32ToString = (ptr, maxBytesToRead) => {
					var i = 0;
					var str = "";
					while (!(i >= maxBytesToRead / 4)) {
						var utf32 = HEAP32[ptr + i * 4 >> 2];
						if (utf32 == 0) break;
						++i;
						if (utf32 >= 65536) {
							var ch = utf32 - 65536;
							str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
						} else str += String.fromCharCode(utf32);
					}
					return str;
				};
				var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
					maxBytesToWrite ??= 2147483647;
					if (maxBytesToWrite < 4) return 0;
					var startPtr = outPtr;
					var endPtr = startPtr + maxBytesToWrite - 4;
					for (var i = 0; i < str.length; ++i) {
						var codeUnit = str.charCodeAt(i);
						if (codeUnit >= 55296 && codeUnit <= 57343) {
							var trailSurrogate = str.charCodeAt(++i);
							codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
						}
						HEAP32[outPtr >> 2] = codeUnit;
						outPtr += 4;
						if (outPtr + 4 > endPtr) break;
					}
					HEAP32[outPtr >> 2] = 0;
					return outPtr - startPtr;
				};
				var lengthBytesUTF32 = (str) => {
					var len = 0;
					for (var i = 0; i < str.length; ++i) {
						var codeUnit = str.charCodeAt(i);
						if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
						len += 4;
					}
					return len;
				};
				var __embind_register_std_wstring = (rawType, charSize, name) => {
					name = readLatin1String(name);
					var decodeString, encodeString, readCharAt, lengthBytesUTF;
					if (charSize === 2) {
						decodeString = UTF16ToString;
						encodeString = stringToUTF16;
						lengthBytesUTF = lengthBytesUTF16;
						readCharAt = (pointer) => HEAPU16[pointer >> 1];
					} else if (charSize === 4) {
						decodeString = UTF32ToString;
						encodeString = stringToUTF32;
						lengthBytesUTF = lengthBytesUTF32;
						readCharAt = (pointer) => HEAPU32[pointer >> 2];
					}
					registerType(rawType, {
						name,
						fromWireType: (value) => {
							var length = HEAPU32[value >> 2];
							var str;
							var decodeStartPtr = value + 4;
							for (var i = 0; i <= length; ++i) {
								var currentBytePtr = value + 4 + i * charSize;
								if (i == length || readCharAt(currentBytePtr) == 0) {
									var maxReadBytes = currentBytePtr - decodeStartPtr;
									var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
									if (str === void 0) str = stringSegment;
									else {
										str += String.fromCharCode(0);
										str += stringSegment;
									}
									decodeStartPtr = currentBytePtr + charSize;
								}
							}
							_free(value);
							return str;
						},
						toWireType: (destructors, value) => {
							if (!(typeof value == "string")) throwBindingError(`Cannot pass non-string to C++ string type ${name}`);
							var length = lengthBytesUTF(value);
							var ptr = _malloc(4 + length + charSize);
							HEAPU32[ptr >> 2] = length / charSize;
							encodeString(value, ptr + 4, length + charSize);
							if (destructors !== null) destructors.push(_free, ptr);
							return ptr;
						},
						argPackAdvance: GenericWireTypeSize,
						readValueFromPointer: readPointer,
						destructorFunction(ptr) {
							_free(ptr);
						}
					});
				};
				var __embind_register_value_object = (rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) => {
					structRegistrations[rawType] = {
						name: readLatin1String(name),
						rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
						rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
						fields: []
					};
				};
				var __embind_register_value_object_field = (structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) => {
					structRegistrations[structType].fields.push({
						fieldName: readLatin1String(fieldName),
						getterReturnType,
						getter: embind__requireFunction(getterSignature, getter),
						getterContext,
						setterArgumentType,
						setter: embind__requireFunction(setterSignature, setter),
						setterContext
					});
				};
				var __embind_register_void = (rawType, name) => {
					name = readLatin1String(name);
					registerType(rawType, {
						isVoid: true,
						name,
						argPackAdvance: 0,
						fromWireType: () => void 0,
						toWireType: (destructors, o) => void 0
					});
				};
				var __emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);
				var emval_methodCallers = [];
				var __emval_call = (caller, handle, destructorsRef, args) => {
					caller = emval_methodCallers[caller];
					handle = Emval.toValue(handle);
					return caller(null, handle, destructorsRef, args);
				};
				var emval_symbols = {};
				var getStringOrSymbol = (address) => {
					var symbol = emval_symbols[address];
					if (symbol === void 0) return readLatin1String(address);
					return symbol;
				};
				var emval_get_global = () => {
					if (typeof globalThis == "object") return globalThis;
					function testGlobal(obj) {
						obj["$$$embind_global$$$"] = obj;
						var success = typeof $$$embind_global$$$ == "object" && obj["$$$embind_global$$$"] == obj;
						if (!success) delete obj["$$$embind_global$$$"];
						return success;
					}
					if (typeof $$$embind_global$$$ == "object") return $$$embind_global$$$;
					if (typeof global == "object" && testGlobal(global)) $$$embind_global$$$ = global;
					else if (typeof self == "object" && testGlobal(self)) $$$embind_global$$$ = self;
					if (typeof $$$embind_global$$$ == "object") return $$$embind_global$$$;
					throw Error("unable to get global object.");
				};
				var __emval_get_global = (name) => {
					if (name === 0) return Emval.toHandle(emval_get_global());
					else {
						name = getStringOrSymbol(name);
						return Emval.toHandle(emval_get_global()[name]);
					}
				};
				var emval_addMethodCaller = (caller) => {
					var id = emval_methodCallers.length;
					emval_methodCallers.push(caller);
					return id;
				};
				var requireRegisteredType = (rawType, humanName) => {
					var impl = registeredTypes[rawType];
					if (void 0 === impl) throwBindingError(`${humanName} has unknown type ${getTypeName(rawType)}`);
					return impl;
				};
				var emval_lookupTypes = (argCount, argTypes) => {
					var a = new Array(argCount);
					for (var i = 0; i < argCount; ++i) a[i] = requireRegisteredType(HEAPU32[argTypes + i * 4 >> 2], "parameter " + i);
					return a;
				};
				var reflectConstruct = Reflect.construct;
				var emval_returnValue = (returnType, destructorsRef, handle) => {
					var destructors = [];
					var result = returnType["toWireType"](destructors, handle);
					if (destructors.length) HEAPU32[destructorsRef >> 2] = Emval.toHandle(destructors);
					return result;
				};
				var __emval_get_method_caller = (argCount, argTypes, kind) => {
					var types = emval_lookupTypes(argCount, argTypes);
					var retType = types.shift();
					argCount--;
					var argN = new Array(argCount);
					var invokerFunction = (obj, func, destructorsRef, args) => {
						var offset = 0;
						for (var i = 0; i < argCount; ++i) {
							argN[i] = types[i]["readValueFromPointer"](args + offset);
							offset += types[i].argPackAdvance;
						}
						return emval_returnValue(retType, destructorsRef, kind === 1 ? reflectConstruct(func, argN) : func.apply(obj, argN));
					};
					return emval_addMethodCaller(createNamedFunction(`methodCaller<(${types.map((t) => t.name).join(", ")}) => ${retType.name}>`, invokerFunction));
				};
				var __emval_run_destructors = (handle) => {
					runDestructors(Emval.toValue(handle));
					__emval_decref(handle);
				};
				var __emval_take_value = (type, arg) => {
					type = requireRegisteredType(type, "_emval_take_value");
					var v = type["readValueFromPointer"](arg);
					return Emval.toHandle(v);
				};
				var getHeapMax = () => 2147483648;
				var _emscripten_get_heap_max = () => getHeapMax();
				var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
				var growMemory = (size) => {
					var pages = (size - wasmMemory.buffer.byteLength + 65535) / 65536 | 0;
					try {
						wasmMemory.grow(pages);
						updateMemoryViews();
						return 1;
					} catch (e) {}
				};
				var _emscripten_resize_heap = (requestedSize) => {
					var oldSize = HEAPU8.length;
					requestedSize >>>= 0;
					var maxHeapSize = getHeapMax();
					if (requestedSize > maxHeapSize) return false;
					for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
						var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
						overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
						if (growMemory(Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536)))) return true;
					}
					return false;
				};
				var ENV = {};
				var getExecutableName = () => thisProgram || "./this.program";
				var getEnvStrings = () => {
					if (!getEnvStrings.strings) {
						var env = {
							USER: "web_user",
							LOGNAME: "web_user",
							PATH: "/",
							PWD: "/",
							HOME: "/home/web_user",
							LANG: (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
							_: getExecutableName()
						};
						for (var x in ENV) if (ENV[x] === void 0) delete env[x];
						else env[x] = ENV[x];
						var strings = [];
						for (var x in env) strings.push(`${x}=${env[x]}`);
						getEnvStrings.strings = strings;
					}
					return getEnvStrings.strings;
				};
				var stringToAscii = (str, buffer) => {
					for (var i = 0; i < str.length; ++i) HEAP8[buffer++] = str.charCodeAt(i);
					HEAP8[buffer] = 0;
				};
				var _environ_get = (__environ, environ_buf) => {
					var bufSize = 0;
					getEnvStrings().forEach((string, i) => {
						var ptr = environ_buf + bufSize;
						HEAPU32[__environ + i * 4 >> 2] = ptr;
						stringToAscii(string, ptr);
						bufSize += string.length + 1;
					});
					return 0;
				};
				var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
					var strings = getEnvStrings();
					HEAPU32[penviron_count >> 2] = strings.length;
					var bufSize = 0;
					strings.forEach((string) => bufSize += string.length + 1);
					HEAPU32[penviron_buf_size >> 2] = bufSize;
					return 0;
				};
				var _fd_close = (fd) => 52;
				var convertI32PairToI53Checked = (lo, hi) => hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
				function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
					convertI32PairToI53Checked(offset_low, offset_high);
					return 70;
				}
				var printCharBuffers = [
					null,
					[],
					[]
				];
				var printChar = (stream, curr) => {
					var buffer = printCharBuffers[stream];
					if (curr === 0 || curr === 10) {
						(stream === 1 ? out : err)(UTF8ArrayToString(buffer));
						buffer.length = 0;
					} else buffer.push(curr);
				};
				var _fd_write = (fd, iov, iovcnt, pnum) => {
					var num = 0;
					for (var i = 0; i < iovcnt; i++) {
						var ptr = HEAPU32[iov >> 2];
						var len = HEAPU32[iov + 4 >> 2];
						iov += 8;
						for (var j = 0; j < len; j++) printChar(fd, HEAPU8[ptr + j]);
						num += len;
					}
					HEAPU32[pnum >> 2] = num;
					return 0;
				};
				var getCFunc = (ident) => {
					return Module["_" + ident];
				};
				var writeArrayToMemory = (array, buffer) => {
					HEAP8.set(array, buffer);
				};
				var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
				var stringToUTF8OnStack = (str) => {
					var size = lengthBytesUTF8(str) + 1;
					var ret = stackAlloc(size);
					stringToUTF8(str, ret, size);
					return ret;
				};
				var ccall = (ident, returnType, argTypes, args, opts) => {
					var toC = {
						string: (str) => {
							var ret = 0;
							if (str !== null && str !== void 0 && str !== 0) ret = stringToUTF8OnStack(str);
							return ret;
						},
						array: (arr) => {
							var ret = stackAlloc(arr.length);
							writeArrayToMemory(arr, ret);
							return ret;
						}
					};
					function convertReturnValue(ret) {
						if (returnType === "string") return UTF8ToString(ret);
						if (returnType === "boolean") return Boolean(ret);
						return ret;
					}
					var func = getCFunc(ident);
					var cArgs = [];
					var stack = 0;
					if (args) for (var i = 0; i < args.length; i++) {
						var converter = toC[argTypes[i]];
						if (converter) {
							if (stack === 0) stack = stackSave();
							cArgs[i] = converter(args[i]);
						} else cArgs[i] = args[i];
					}
					var ret = func(...cArgs);
					function onDone(ret) {
						if (stack !== 0) stackRestore(stack);
						return convertReturnValue(ret);
					}
					ret = onDone(ret);
					return ret;
				};
				InternalError = Module["InternalError"] = class InternalError extends Error {
					constructor(message) {
						super(message);
						this.name = "InternalError";
					}
				};
				embind_init_charCodes();
				BindingError = Module["BindingError"] = class BindingError extends Error {
					constructor(message) {
						super(message);
						this.name = "BindingError";
					}
				};
				init_ClassHandle();
				init_RegisteredPointer();
				UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
				init_emval();
				var wasmImports = {
					A: ___cxa_throw,
					p: __abort_js,
					e: __embind_finalize_value_object,
					o: __embind_register_bigint,
					y: __embind_register_bool,
					m: __embind_register_class,
					l: __embind_register_class_constructor,
					b: __embind_register_class_function,
					w: __embind_register_emval,
					i: __embind_register_float,
					d: __embind_register_integer,
					a: __embind_register_memory_view,
					x: __embind_register_std_string,
					g: __embind_register_std_wstring,
					f: __embind_register_value_object,
					c: __embind_register_value_object_field,
					z: __embind_register_void,
					v: __emscripten_memcpy_js,
					C: __emval_call,
					D: __emval_decref,
					E: __emval_get_global,
					j: __emval_get_method_caller,
					B: __emval_run_destructors,
					k: __emval_take_value,
					r: _emscripten_get_heap_max,
					q: _emscripten_resize_heap,
					s: _environ_get,
					t: _environ_sizes_get,
					u: _fd_close,
					n: _fd_seek,
					h: _fd_write
				};
				var wasmExports;
				createWasm();
				var ___getTypeName = (a0) => (___getTypeName = wasmExports["H"])(a0);
				var _malloc = (a0) => (_malloc = wasmExports["J"])(a0);
				var _free = (a0) => (_free = wasmExports["K"])(a0);
				var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports["L"])(a0);
				var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports["M"])(a0);
				var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["N"])();
				var dynCall_iji = Module["dynCall_iji"] = (a0, a1, a2, a3) => (dynCall_iji = Module["dynCall_iji"] = wasmExports["O"])(a0, a1, a2, a3);
				var dynCall_jji = Module["dynCall_jji"] = (a0, a1, a2, a3) => (dynCall_jji = Module["dynCall_jji"] = wasmExports["P"])(a0, a1, a2, a3);
				var dynCall_iiji = Module["dynCall_iiji"] = (a0, a1, a2, a3, a4) => (dynCall_iiji = Module["dynCall_iiji"] = wasmExports["Q"])(a0, a1, a2, a3, a4);
				var dynCall_jiji = Module["dynCall_jiji"] = (a0, a1, a2, a3, a4) => (dynCall_jiji = Module["dynCall_jiji"] = wasmExports["R"])(a0, a1, a2, a3, a4);
				Module["ccall"] = ccall;
				var calledRun;
				dependenciesFulfilled = function runCaller() {
					if (!calledRun) run();
					if (!calledRun) dependenciesFulfilled = runCaller;
				};
				function run() {
					if (runDependencies > 0) return;
					preRun();
					if (runDependencies > 0) return;
					function doRun() {
						if (calledRun) return;
						calledRun = true;
						Module["calledRun"] = true;
						if (ABORT) return;
						initRuntime();
						readyPromiseResolve(Module);
						Module["onRuntimeInitialized"]?.();
						postRun();
					}
					if (Module["setStatus"]) {
						Module["setStatus"]("Running...");
						setTimeout(() => {
							setTimeout(() => Module["setStatus"](""), 1);
							doRun();
						}, 1);
					} else doRun();
				}
				if (Module["preInit"]) {
					if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
					while (Module["preInit"].length > 0) Module["preInit"].pop()();
				}
				run();
				moduleRtn = readyPromise;
				return moduleRtn;
			});
		})();
		if (typeof exports === "object" && typeof module === "object") {
			module.exports = OpenJPEGWASM;
			module.exports.default = OpenJPEGWASM;
		} else if (typeof define === "function" && define["amd"]) define([], () => OpenJPEGWASM);
	})))());
	const openjpegWasm = new URL("/assets/openjpegwasm_decode-B3gWTHpv.wasm", "" + self.location.href);
	const local$1 = {
		codec: void 0,
		decoder: void 0,
		decodeConfig: {}
	};
	function initialize$1(decodeConfig) {
		local$1.decodeConfig = decodeConfig;
		setWasmBasePathFromConfig(decodeConfig);
		if (local$1.codec) return Promise.resolve();
		const openJpegModule = (0, import_openjpegwasm_decode.default)({ locateFile: (f) => {
			if (f.endsWith(".wasm")) return resolveWasmUrl("openjpegwasm_decode.wasm", openjpegWasm);
			return f;
		} });
		return new Promise((resolve, reject) => {
			openJpegModule.then((instance) => {
				local$1.codec = instance;
				local$1.decoder = new instance.J2KDecoder();
				resolve();
			}, reject);
		});
	}
	async function decodeAsync$1(compressedImageFrame, imageInfo) {
		await initialize$1();
		const decoder = local$1.decoder;
		const encodedBufferInWASM = decoder.getEncodedBuffer(compressedImageFrame.length);
		encodedBufferInWASM.set(compressedImageFrame);
		decoder.decode();
		const frameInfo = decoder.getFrameInfo();
		const decodedBufferInWASM = decoder.getDecodedBuffer();
		new Uint8Array(decodedBufferInWASM.length).set(decodedBufferInWASM);
		const imageOffset = `x: ${decoder.getImageOffset().x}, y: ${decoder.getImageOffset().y}`;
		const numDecompositions = decoder.getNumDecompositions();
		const numLayers = decoder.getNumLayers();
		const progessionOrder = [
			"unknown",
			"LRCP",
			"RLCP",
			"RPCL",
			"PCRL",
			"CPRL"
		][decoder.getProgressionOrder() + 1];
		const reversible = decoder.getIsReversible();
		const blockDimensions = `${decoder.getBlockDimensions().width} x ${decoder.getBlockDimensions().height}`;
		const tileSize = `${decoder.getTileSize().width} x ${decoder.getTileSize().height}`;
		const tileOffset = `${decoder.getTileOffset().x}, ${decoder.getTileOffset().y}`;
		const colorTransform = decoder.getColorSpace();
		const decodedSize = `${decodedBufferInWASM.length.toLocaleString()} bytes`;
		const compressionRatio = `${(decodedBufferInWASM.length / encodedBufferInWASM.length).toFixed(2)}:1`;
		const encodedImageInfo = {
			columns: frameInfo.width,
			rows: frameInfo.height,
			bitsPerPixel: frameInfo.bitsPerSample,
			signed: frameInfo.isSigned,
			bytesPerPixel: imageInfo.bytesPerPixel,
			componentsPerPixel: frameInfo.componentCount
		};
		const pixelData = getPixelData(frameInfo, decodedBufferInWASM);
		const encodeOptions = {
			imageOffset,
			numDecompositions,
			numLayers,
			progessionOrder,
			reversible,
			blockDimensions,
			tileSize,
			tileOffset,
			colorTransform,
			decodedSize,
			compressionRatio
		};
		return {
			...imageInfo,
			pixelData,
			imageInfo: encodedImageInfo,
			encodeOptions,
			...encodeOptions,
			...encodedImageInfo
		};
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/decoders/decodeHTJ2K.js
	var import_openjphjs = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
		var Module = (() => {
			var _scriptName = typeof document != "undefined" ? document.currentScript?.src : void 0;
			if (typeof __filename != "undefined") _scriptName = _scriptName || __filename;
			return (function(moduleArg = {}) {
				var moduleRtn;
				var Module = moduleArg;
				var readyPromiseResolve, readyPromiseReject;
				var readyPromise = new Promise((resolve, reject) => {
					readyPromiseResolve = resolve;
					readyPromiseReject = reject;
				});
				var ENVIRONMENT_IS_WEB = typeof window == "object";
				var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != "undefined";
				var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string" && process.type != "renderer";
				if (ENVIRONMENT_IS_NODE) {}
				var moduleOverrides = Object.assign({}, Module);
				var scriptDirectory = "";
				function locateFile(path) {
					if (Module["locateFile"]) return Module["locateFile"](path, scriptDirectory);
					return scriptDirectory + path;
				}
				var readAsync, readBinary;
				if (ENVIRONMENT_IS_NODE) {
					var fs = require___vite_browser_external();
					require___vite_browser_external();
					scriptDirectory = __dirname + "/";
					readBinary = (filename) => {
						filename = isFileURI(filename) ? new URL(filename) : filename;
						return fs.readFileSync(filename);
					};
					readAsync = async (filename, binary = true) => {
						filename = isFileURI(filename) ? new URL(filename) : filename;
						return fs.readFileSync(filename, binary ? void 0 : "utf8");
					};
					if (!Module["thisProgram"] && process.argv.length > 1) process.argv[1].replace(/\\/g, "/");
					process.argv.slice(2);
				} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
					if (ENVIRONMENT_IS_WORKER) scriptDirectory = self.location.href;
					else if (typeof document != "undefined" && document.currentScript) scriptDirectory = document.currentScript.src;
					if (_scriptName) scriptDirectory = _scriptName;
					if (scriptDirectory.startsWith("blob:")) scriptDirectory = "";
					else scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
					if (ENVIRONMENT_IS_WORKER) readBinary = (url) => {
						var xhr = new XMLHttpRequest();
						xhr.open("GET", url, false);
						xhr.responseType = "arraybuffer";
						xhr.send(null);
						return new Uint8Array(xhr.response);
					};
					readAsync = async (url) => {
						if (isFileURI(url)) return new Promise((resolve, reject) => {
							var xhr = new XMLHttpRequest();
							xhr.open("GET", url, true);
							xhr.responseType = "arraybuffer";
							xhr.onload = () => {
								if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
									resolve(xhr.response);
									return;
								}
								reject(xhr.status);
							};
							xhr.onerror = reject;
							xhr.send(null);
						});
						var response = await fetch(url, { credentials: "same-origin" });
						if (response.ok) return response.arrayBuffer();
						throw new Error(response.status + " : " + response.url);
					};
				}
				var out = Module["print"] || console.log.bind(console);
				var err = Module["printErr"] || console.error.bind(console);
				Object.assign(Module, moduleOverrides);
				moduleOverrides = null;
				if (Module["arguments"]) Module["arguments"];
				if (Module["thisProgram"]) Module["thisProgram"];
				var wasmBinary = Module["wasmBinary"];
				var wasmMemory;
				var ABORT = false, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
				function updateMemoryViews() {
					var b = wasmMemory.buffer;
					Module["HEAP8"] = HEAP8 = new Int8Array(b);
					Module["HEAP16"] = HEAP16 = new Int16Array(b);
					Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
					Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
					Module["HEAP32"] = HEAP32 = new Int32Array(b);
					Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
					Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
					Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
				}
				var __ATPRERUN__ = [];
				var __ATINIT__ = [];
				var __ATPOSTRUN__ = [];
				function preRun() {
					if (Module["preRun"]) {
						if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
						while (Module["preRun"].length) addOnPreRun(Module["preRun"].shift());
					}
					callRuntimeCallbacks(__ATPRERUN__);
				}
				function initRuntime() {
					callRuntimeCallbacks(__ATINIT__);
				}
				function postRun() {
					if (Module["postRun"]) {
						if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
						while (Module["postRun"].length) addOnPostRun(Module["postRun"].shift());
					}
					callRuntimeCallbacks(__ATPOSTRUN__);
				}
				function addOnPreRun(cb) {
					__ATPRERUN__.unshift(cb);
				}
				function addOnInit(cb) {
					__ATINIT__.unshift(cb);
				}
				function addOnPostRun(cb) {
					__ATPOSTRUN__.unshift(cb);
				}
				var runDependencies = 0;
				var dependenciesFulfilled = null;
				function addRunDependency(id) {
					runDependencies++;
					Module["monitorRunDependencies"]?.(runDependencies);
				}
				function removeRunDependency(id) {
					runDependencies--;
					Module["monitorRunDependencies"]?.(runDependencies);
					if (runDependencies == 0) {
						if (dependenciesFulfilled) {
							var callback = dependenciesFulfilled;
							dependenciesFulfilled = null;
							callback();
						}
					}
				}
				/** @param {string|number=} what */
				function abort(what) {
					Module["onAbort"]?.(what);
					what = "Aborted(" + what + ")";
					err(what);
					ABORT = true;
					what += ". Build with -sASSERTIONS for more info.";
					/** @suppress {checkTypes} */
					var e = new WebAssembly.RuntimeError(what);
					readyPromiseReject(e);
					throw e;
				}
				var dataURIPrefix = "data:application/octet-stream;base64,";
				/**
				* Indicates whether filename is a base64 data URI.
				* @noinline
				*/
				var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
				/**
				* Indicates whether filename is delivered via file protocol (as opposed to http/https)
				* @noinline
				*/
				var isFileURI = (filename) => filename.startsWith("file://");
				function findWasmBinary() {
					var f = "openjphjs.wasm";
					if (!isDataURI(f)) return locateFile(f);
					return f;
				}
				var wasmBinaryFile;
				function getBinarySync(file) {
					if (file == wasmBinaryFile && wasmBinary) return new Uint8Array(wasmBinary);
					if (readBinary) return readBinary(file);
					throw "both async and sync fetching of the wasm failed";
				}
				async function getWasmBinary(binaryFile) {
					if (!wasmBinary) try {
						var response = await readAsync(binaryFile);
						return new Uint8Array(response);
					} catch {}
					return getBinarySync(binaryFile);
				}
				async function instantiateArrayBuffer(binaryFile, imports) {
					try {
						var binary = await getWasmBinary(binaryFile);
						return await WebAssembly.instantiate(binary, imports);
					} catch (reason) {
						err(`failed to asynchronously prepare wasm: ${reason}`);
						abort(reason);
					}
				}
				async function instantiateAsync(binary, binaryFile, imports) {
					if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") try {
						var response = fetch(binaryFile, { credentials: "same-origin" });
						return await WebAssembly.instantiateStreaming(response, imports);
					} catch (reason) {
						err(`wasm streaming compile failed: ${reason}`);
						err("falling back to ArrayBuffer instantiation");
					}
					return instantiateArrayBuffer(binaryFile, imports);
				}
				function getWasmImports() {
					return {
						"env": wasmImports,
						"wasi_snapshot_preview1": wasmImports
					};
				}
				async function createWasm() {
					/** @param {WebAssembly.Module=} module*/
					function receiveInstance(instance, module$1) {
						wasmExports = instance.exports;
						wasmMemory = wasmExports["memory"];
						updateMemoryViews();
						wasmTable = wasmExports["__indirect_function_table"];
						addOnInit(wasmExports["__wasm_call_ctors"]);
						removeRunDependency("wasm-instantiate");
						return wasmExports;
					}
					addRunDependency("wasm-instantiate");
					function receiveInstantiationResult(result) {
						receiveInstance(result["instance"]);
					}
					var info = getWasmImports();
					if (Module["instantiateWasm"]) try {
						return Module["instantiateWasm"](info, receiveInstance);
					} catch (e) {
						err(`Module.instantiateWasm callback failed with error: ${e}`);
						readyPromiseReject(e);
					}
					wasmBinaryFile ??= findWasmBinary();
					try {
						var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
						receiveInstantiationResult(result);
						return result;
					} catch (e) {
						readyPromiseReject(e);
						return;
					}
				}
				var callRuntimeCallbacks = (callbacks) => {
					while (callbacks.length > 0) callbacks.shift()(Module);
				};
				Module["noExitRuntime"];
				var stackRestore = (val) => __emscripten_stack_restore(val);
				var stackSave = () => _emscripten_stack_get_current();
				var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder() : void 0;
				/**
				* Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
				* array that contains uint8 values, returns a copy of that string as a
				* Javascript String object.
				* heapOrArray is either a regular array, or a JavaScript typed array view.
				* @param {number=} idx
				* @param {number=} maxBytesToRead
				* @return {string}
				*/
				var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
					var endIdx = idx + maxBytesToRead;
					var endPtr = idx;
					while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
					if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
					var str = "";
					while (idx < endPtr) {
						var u0 = heapOrArray[idx++];
						if (!(u0 & 128)) {
							str += String.fromCharCode(u0);
							continue;
						}
						var u1 = heapOrArray[idx++] & 63;
						if ((u0 & 224) == 192) {
							str += String.fromCharCode((u0 & 31) << 6 | u1);
							continue;
						}
						var u2 = heapOrArray[idx++] & 63;
						if ((u0 & 240) == 224) u0 = (u0 & 15) << 12 | u1 << 6 | u2;
						else u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
						if (u0 < 65536) str += String.fromCharCode(u0);
						else {
							var ch = u0 - 65536;
							str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
						}
					}
					return str;
				};
				/**
				* Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
				* emscripten HEAP, returns a copy of that string as a Javascript String object.
				*
				* @param {number} ptr
				* @param {number=} maxBytesToRead - An optional length that specifies the
				*   maximum number of bytes to read. You can omit this parameter to scan the
				*   string until the first 0 byte. If maxBytesToRead is passed, and the string
				*   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
				*   string will cut short at that byte index (i.e. maxBytesToRead will not
				*   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
				*   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
				*   JS JIT optimizations off, so it is worth to consider consistently using one
				* @return {string}
				*/
				var UTF8ToString = (ptr, maxBytesToRead) => {
					return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
				};
				var ___assert_fail = (condition, filename, line, func) => abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [
					filename ? UTF8ToString(filename) : "unknown filename",
					line,
					func ? UTF8ToString(func) : "unknown function"
				]);
				var exceptionCaught = [];
				var uncaughtExceptionCount = 0;
				var ___cxa_begin_catch = (ptr) => {
					var info = new ExceptionInfo(ptr);
					if (!info.get_caught()) {
						info.set_caught(true);
						uncaughtExceptionCount--;
					}
					info.set_rethrown(false);
					exceptionCaught.push(info);
					___cxa_increment_exception_refcount(ptr);
					return ___cxa_get_exception_ptr(ptr);
				};
				var exceptionLast = 0;
				var ___cxa_end_catch = () => {
					_setThrew(0, 0);
					var info = exceptionCaught.pop();
					___cxa_decrement_exception_refcount(info.excPtr);
					exceptionLast = 0;
				};
				class ExceptionInfo {
					constructor(excPtr) {
						this.excPtr = excPtr;
						this.ptr = excPtr - 24;
					}
					set_type(type) {
						HEAPU32[this.ptr + 4 >> 2] = type;
					}
					get_type() {
						return HEAPU32[this.ptr + 4 >> 2];
					}
					set_destructor(destructor) {
						HEAPU32[this.ptr + 8 >> 2] = destructor;
					}
					get_destructor() {
						return HEAPU32[this.ptr + 8 >> 2];
					}
					set_caught(caught) {
						caught = caught ? 1 : 0;
						HEAP8[this.ptr + 12] = caught;
					}
					get_caught() {
						return HEAP8[this.ptr + 12] != 0;
					}
					set_rethrown(rethrown) {
						rethrown = rethrown ? 1 : 0;
						HEAP8[this.ptr + 13] = rethrown;
					}
					get_rethrown() {
						return HEAP8[this.ptr + 13] != 0;
					}
					init(type, destructor) {
						this.set_adjusted_ptr(0);
						this.set_type(type);
						this.set_destructor(destructor);
					}
					set_adjusted_ptr(adjustedPtr) {
						HEAPU32[this.ptr + 16 >> 2] = adjustedPtr;
					}
					get_adjusted_ptr() {
						return HEAPU32[this.ptr + 16 >> 2];
					}
				}
				var ___resumeException = (ptr) => {
					if (!exceptionLast) exceptionLast = ptr;
					throw exceptionLast;
				};
				var setTempRet0 = (val) => __emscripten_tempret_set(val);
				var findMatchingCatch = (args) => {
					var thrown = exceptionLast;
					if (!thrown) {
						setTempRet0(0);
						return 0;
					}
					var info = new ExceptionInfo(thrown);
					info.set_adjusted_ptr(thrown);
					var thrownType = info.get_type();
					if (!thrownType) {
						setTempRet0(0);
						return thrown;
					}
					for (var caughtType of args) {
						if (caughtType === 0 || caughtType === thrownType) break;
						var adjusted_ptr_addr = info.ptr + 16;
						if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
							setTempRet0(caughtType);
							return thrown;
						}
					}
					setTempRet0(thrownType);
					return thrown;
				};
				var ___cxa_find_matching_catch_2 = () => findMatchingCatch([]);
				var ___cxa_find_matching_catch_3 = (arg0) => findMatchingCatch([arg0]);
				var ___cxa_throw = (ptr, type, destructor) => {
					new ExceptionInfo(ptr).init(type, destructor);
					exceptionLast = ptr;
					uncaughtExceptionCount++;
					throw exceptionLast;
				};
				var __abort_js = () => abort("");
				var structRegistrations = {};
				var runDestructors = (destructors) => {
					while (destructors.length) {
						var ptr = destructors.pop();
						destructors.pop()(ptr);
					}
				};
				/** @suppress {globalThis} */
				function readPointer(pointer) {
					return this["fromWireType"](HEAPU32[pointer >> 2]);
				}
				var awaitingDependencies = {};
				var registeredTypes = {};
				var typeDependencies = {};
				var InternalError;
				var throwInternalError = (message) => {
					throw new InternalError(message);
				};
				var whenDependentTypesAreResolved = (myTypes, dependentTypes, getTypeConverters) => {
					myTypes.forEach((type) => typeDependencies[type] = dependentTypes);
					function onComplete(typeConverters) {
						var myTypeConverters = getTypeConverters(typeConverters);
						if (myTypeConverters.length !== myTypes.length) throwInternalError("Mismatched type converter count");
						for (var i = 0; i < myTypes.length; ++i) registerType(myTypes[i], myTypeConverters[i]);
					}
					var typeConverters = new Array(dependentTypes.length);
					var unregisteredTypes = [];
					var registered = 0;
					dependentTypes.forEach((dt, i) => {
						if (registeredTypes.hasOwnProperty(dt)) typeConverters[i] = registeredTypes[dt];
						else {
							unregisteredTypes.push(dt);
							if (!awaitingDependencies.hasOwnProperty(dt)) awaitingDependencies[dt] = [];
							awaitingDependencies[dt].push(() => {
								typeConverters[i] = registeredTypes[dt];
								++registered;
								if (registered === unregisteredTypes.length) onComplete(typeConverters);
							});
						}
					});
					if (0 === unregisteredTypes.length) onComplete(typeConverters);
				};
				var __embind_finalize_value_object = (structType) => {
					var reg = structRegistrations[structType];
					delete structRegistrations[structType];
					var rawConstructor = reg.rawConstructor;
					var rawDestructor = reg.rawDestructor;
					var fieldRecords = reg.fields;
					var fieldTypes = fieldRecords.map((field) => field.getterReturnType).concat(fieldRecords.map((field) => field.setterArgumentType));
					whenDependentTypesAreResolved([structType], fieldTypes, (fieldTypes) => {
						var fields = {};
						fieldRecords.forEach((field, i) => {
							var fieldName = field.fieldName;
							var getterReturnType = fieldTypes[i];
							var getter = field.getter;
							var getterContext = field.getterContext;
							var setterArgumentType = fieldTypes[i + fieldRecords.length];
							var setter = field.setter;
							var setterContext = field.setterContext;
							fields[fieldName] = {
								read: (ptr) => getterReturnType["fromWireType"](getter(getterContext, ptr)),
								write: (ptr, o) => {
									var destructors = [];
									setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
									runDestructors(destructors);
								}
							};
						});
						return [{
							name: reg.name,
							"fromWireType": (ptr) => {
								var rv = {};
								for (var i in fields) rv[i] = fields[i].read(ptr);
								rawDestructor(ptr);
								return rv;
							},
							"toWireType": (destructors, o) => {
								for (var fieldName in fields) if (!(fieldName in o)) throw new TypeError(`Missing field: "${fieldName}"`);
								var ptr = rawConstructor();
								for (fieldName in fields) fields[fieldName].write(ptr, o[fieldName]);
								if (destructors !== null) destructors.push(rawDestructor, ptr);
								return ptr;
							},
							argPackAdvance: GenericWireTypeSize,
							"readValueFromPointer": readPointer,
							destructorFunction: rawDestructor
						}];
					});
				};
				var __embind_register_bigint = (primitiveType, name, size, minRange, maxRange) => {};
				var embind_init_charCodes = () => {
					var codes = new Array(256);
					for (var i = 0; i < 256; ++i) codes[i] = String.fromCharCode(i);
					embind_charCodes = codes;
				};
				var embind_charCodes;
				var readLatin1String = (ptr) => {
					var ret = "";
					var c = ptr;
					while (HEAPU8[c]) ret += embind_charCodes[HEAPU8[c++]];
					return ret;
				};
				var BindingError;
				var throwBindingError = (message) => {
					throw new BindingError(message);
				};
				/** @param {Object=} options */
				function sharedRegisterType(rawType, registeredInstance, options = {}) {
					var name = registeredInstance.name;
					if (!rawType) throwBindingError(`type "${name}" must have a positive integer typeid pointer`);
					if (registeredTypes.hasOwnProperty(rawType)) if (options.ignoreDuplicateRegistrations) return;
					else throwBindingError(`Cannot register type '${name}' twice`);
					registeredTypes[rawType] = registeredInstance;
					delete typeDependencies[rawType];
					if (awaitingDependencies.hasOwnProperty(rawType)) {
						var callbacks = awaitingDependencies[rawType];
						delete awaitingDependencies[rawType];
						callbacks.forEach((cb) => cb());
					}
				}
				/** @param {Object=} options */
				function registerType(rawType, registeredInstance, options = {}) {
					return sharedRegisterType(rawType, registeredInstance, options);
				}
				var GenericWireTypeSize = 8;
				/** @suppress {globalThis} */
				var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
					name = readLatin1String(name);
					registerType(rawType, {
						name,
						"fromWireType": function(wt) {
							return !!wt;
						},
						"toWireType": function(destructors, o) {
							return o ? trueValue : falseValue;
						},
						argPackAdvance: GenericWireTypeSize,
						"readValueFromPointer": function(pointer) {
							return this["fromWireType"](HEAPU8[pointer]);
						},
						destructorFunction: null
					});
				};
				var shallowCopyInternalPointer = (o) => {
					return {
						count: o.count,
						deleteScheduled: o.deleteScheduled,
						preservePointerOnDelete: o.preservePointerOnDelete,
						ptr: o.ptr,
						ptrType: o.ptrType,
						smartPtr: o.smartPtr,
						smartPtrType: o.smartPtrType
					};
				};
				var throwInstanceAlreadyDeleted = (obj) => {
					function getInstanceTypeName(handle) {
						return handle.$$.ptrType.registeredClass.name;
					}
					throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
				};
				var finalizationRegistry = false;
				var detachFinalizer = (handle) => {};
				var runDestructor = ($$) => {
					if ($$.smartPtr) $$.smartPtrType.rawDestructor($$.smartPtr);
					else $$.ptrType.registeredClass.rawDestructor($$.ptr);
				};
				var releaseClassHandle = ($$) => {
					$$.count.value -= 1;
					if (0 === $$.count.value) runDestructor($$);
				};
				var downcastPointer = (ptr, ptrClass, desiredClass) => {
					if (ptrClass === desiredClass) return ptr;
					if (void 0 === desiredClass.baseClass) return null;
					var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
					if (rv === null) return null;
					return desiredClass.downcast(rv);
				};
				var registeredPointers = {};
				var registeredInstances = {};
				var getBasestPointer = (class_, ptr) => {
					if (ptr === void 0) throwBindingError("ptr should not be undefined");
					while (class_.baseClass) {
						ptr = class_.upcast(ptr);
						class_ = class_.baseClass;
					}
					return ptr;
				};
				var getInheritedInstance = (class_, ptr) => {
					ptr = getBasestPointer(class_, ptr);
					return registeredInstances[ptr];
				};
				var makeClassHandle = (prototype, record) => {
					if (!record.ptrType || !record.ptr) throwInternalError("makeClassHandle requires ptr and ptrType");
					if (!!record.smartPtrType !== !!record.smartPtr) throwInternalError("Both smartPtrType and smartPtr must be specified");
					record.count = { value: 1 };
					return attachFinalizer(Object.create(prototype, { $$: {
						value: record,
						writable: true
					} }));
				};
				/** @suppress {globalThis} */
				function RegisteredPointer_fromWireType(ptr) {
					var rawPointer = this.getPointee(ptr);
					if (!rawPointer) {
						this.destructor(ptr);
						return null;
					}
					var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
					if (void 0 !== registeredInstance) if (0 === registeredInstance.$$.count.value) {
						registeredInstance.$$.ptr = rawPointer;
						registeredInstance.$$.smartPtr = ptr;
						return registeredInstance["clone"]();
					} else {
						var rv = registeredInstance["clone"]();
						this.destructor(ptr);
						return rv;
					}
					function makeDefaultHandle() {
						if (this.isSmartPointer) return makeClassHandle(this.registeredClass.instancePrototype, {
							ptrType: this.pointeeType,
							ptr: rawPointer,
							smartPtrType: this,
							smartPtr: ptr
						});
						else return makeClassHandle(this.registeredClass.instancePrototype, {
							ptrType: this,
							ptr
						});
					}
					var registeredPointerRecord = registeredPointers[this.registeredClass.getActualType(rawPointer)];
					if (!registeredPointerRecord) return makeDefaultHandle.call(this);
					var toType;
					if (this.isConst) toType = registeredPointerRecord.constPointerType;
					else toType = registeredPointerRecord.pointerType;
					var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
					if (dp === null) return makeDefaultHandle.call(this);
					if (this.isSmartPointer) return makeClassHandle(toType.registeredClass.instancePrototype, {
						ptrType: toType,
						ptr: dp,
						smartPtrType: this,
						smartPtr: ptr
					});
					else return makeClassHandle(toType.registeredClass.instancePrototype, {
						ptrType: toType,
						ptr: dp
					});
				}
				var attachFinalizer = (handle) => {
					if ("undefined" === typeof FinalizationRegistry) {
						attachFinalizer = (handle) => handle;
						return handle;
					}
					finalizationRegistry = new FinalizationRegistry((info) => {
						releaseClassHandle(info.$$);
					});
					attachFinalizer = (handle) => {
						var $$ = handle.$$;
						if (!!$$.smartPtr) {
							var info = { $$ };
							finalizationRegistry.register(handle, info, handle);
						}
						return handle;
					};
					detachFinalizer = (handle) => finalizationRegistry.unregister(handle);
					return attachFinalizer(handle);
				};
				var deletionQueue = [];
				var flushPendingDeletes = () => {
					while (deletionQueue.length) {
						var obj = deletionQueue.pop();
						obj.$$.deleteScheduled = false;
						obj["delete"]();
					}
				};
				var delayFunction;
				var init_ClassHandle = () => {
					Object.assign(ClassHandle.prototype, {
						"isAliasOf"(other) {
							if (!(this instanceof ClassHandle)) return false;
							if (!(other instanceof ClassHandle)) return false;
							var leftClass = this.$$.ptrType.registeredClass;
							var left = this.$$.ptr;
							other.$$ = other.$$;
							var rightClass = other.$$.ptrType.registeredClass;
							var right = other.$$.ptr;
							while (leftClass.baseClass) {
								left = leftClass.upcast(left);
								leftClass = leftClass.baseClass;
							}
							while (rightClass.baseClass) {
								right = rightClass.upcast(right);
								rightClass = rightClass.baseClass;
							}
							return leftClass === rightClass && left === right;
						},
						"clone"() {
							if (!this.$$.ptr) throwInstanceAlreadyDeleted(this);
							if (this.$$.preservePointerOnDelete) {
								this.$$.count.value += 1;
								return this;
							} else {
								var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), { $$: { value: shallowCopyInternalPointer(this.$$) } }));
								clone.$$.count.value += 1;
								clone.$$.deleteScheduled = false;
								return clone;
							}
						},
						"delete"() {
							if (!this.$$.ptr) throwInstanceAlreadyDeleted(this);
							if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) throwBindingError("Object already scheduled for deletion");
							detachFinalizer(this);
							releaseClassHandle(this.$$);
							if (!this.$$.preservePointerOnDelete) {
								this.$$.smartPtr = void 0;
								this.$$.ptr = void 0;
							}
						},
						"isDeleted"() {
							return !this.$$.ptr;
						},
						"deleteLater"() {
							if (!this.$$.ptr) throwInstanceAlreadyDeleted(this);
							if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) throwBindingError("Object already scheduled for deletion");
							deletionQueue.push(this);
							if (deletionQueue.length === 1 && delayFunction) delayFunction(flushPendingDeletes);
							this.$$.deleteScheduled = true;
							return this;
						}
					});
				};
				/** @constructor */
				function ClassHandle() {}
				var createNamedFunction = (name, body) => Object.defineProperty(body, "name", { value: name });
				var ensureOverloadTable = (proto, methodName, humanName) => {
					if (void 0 === proto[methodName].overloadTable) {
						var prevFunc = proto[methodName];
						proto[methodName] = function(...args) {
							if (!proto[methodName].overloadTable.hasOwnProperty(args.length)) throwBindingError(`Function '${humanName}' called with an invalid number of arguments (${args.length}) - expects one of (${proto[methodName].overloadTable})!`);
							return proto[methodName].overloadTable[args.length].apply(this, args);
						};
						proto[methodName].overloadTable = [];
						proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
					}
				};
				/** @param {number=} numArguments */
				var exposePublicSymbol = (name, value, numArguments) => {
					if (Module.hasOwnProperty(name)) {
						if (void 0 === numArguments || void 0 !== Module[name].overloadTable && void 0 !== Module[name].overloadTable[numArguments]) throwBindingError(`Cannot register public name '${name}' twice`);
						ensureOverloadTable(Module, name, name);
						if (Module[name].overloadTable.hasOwnProperty(numArguments)) throwBindingError(`Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`);
						Module[name].overloadTable[numArguments] = value;
					} else {
						Module[name] = value;
						Module[name].argCount = numArguments;
					}
				};
				var char_0 = 48;
				var char_9 = 57;
				var makeLegalFunctionName = (name) => {
					name = name.replace(/[^a-zA-Z0-9_]/g, "$");
					var f = name.charCodeAt(0);
					if (f >= char_0 && f <= char_9) return `_${name}`;
					return name;
				};
				/** @constructor */
				function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
					this.name = name;
					this.constructor = constructor;
					this.instancePrototype = instancePrototype;
					this.rawDestructor = rawDestructor;
					this.baseClass = baseClass;
					this.getActualType = getActualType;
					this.upcast = upcast;
					this.downcast = downcast;
					this.pureVirtualFunctions = [];
				}
				var upcastPointer = (ptr, ptrClass, desiredClass) => {
					while (ptrClass !== desiredClass) {
						if (!ptrClass.upcast) throwBindingError(`Expected null or instance of ${desiredClass.name}, got an instance of ${ptrClass.name}`);
						ptr = ptrClass.upcast(ptr);
						ptrClass = ptrClass.baseClass;
					}
					return ptr;
				};
				/** @suppress {globalThis} */
				function constNoSmartPtrRawPointerToWireType(destructors, handle) {
					if (handle === null) {
						if (this.isReference) throwBindingError(`null is not a valid ${this.name}`);
						return 0;
					}
					if (!handle.$$) throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
					if (!handle.$$.ptr) throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
					var handleClass = handle.$$.ptrType.registeredClass;
					return upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
				}
				/** @suppress {globalThis} */
				function genericPointerToWireType(destructors, handle) {
					var ptr;
					if (handle === null) {
						if (this.isReference) throwBindingError(`null is not a valid ${this.name}`);
						if (this.isSmartPointer) {
							ptr = this.rawConstructor();
							if (destructors !== null) destructors.push(this.rawDestructor, ptr);
							return ptr;
						} else return 0;
					}
					if (!handle || !handle.$$) throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
					if (!handle.$$.ptr) throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
					if (!this.isConst && handle.$$.ptrType.isConst) throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name} to parameter type ${this.name}`);
					var handleClass = handle.$$.ptrType.registeredClass;
					ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
					if (this.isSmartPointer) {
						if (void 0 === handle.$$.smartPtr) throwBindingError("Passing raw pointer to smart pointer is illegal");
						switch (this.sharingPolicy) {
							case 0:
								if (handle.$$.smartPtrType === this) ptr = handle.$$.smartPtr;
								else throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name} to parameter type ${this.name}`);
								break;
							case 1:
								ptr = handle.$$.smartPtr;
								break;
							case 2:
								if (handle.$$.smartPtrType === this) ptr = handle.$$.smartPtr;
								else {
									var clonedHandle = handle["clone"]();
									ptr = this.rawShare(ptr, Emval.toHandle(() => clonedHandle["delete"]()));
									if (destructors !== null) destructors.push(this.rawDestructor, ptr);
								}
								break;
							default: throwBindingError("Unsupporting sharing policy");
						}
					}
					return ptr;
				}
				/** @suppress {globalThis} */
				function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
					if (handle === null) {
						if (this.isReference) throwBindingError(`null is not a valid ${this.name}`);
						return 0;
					}
					if (!handle.$$) throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
					if (!handle.$$.ptr) throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);
					if (handle.$$.ptrType.isConst) throwBindingError(`Cannot convert argument of type ${handle.$$.ptrType.name} to parameter type ${this.name}`);
					var handleClass = handle.$$.ptrType.registeredClass;
					return upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
				}
				var init_RegisteredPointer = () => {
					Object.assign(RegisteredPointer.prototype, {
						getPointee(ptr) {
							if (this.rawGetPointee) ptr = this.rawGetPointee(ptr);
							return ptr;
						},
						destructor(ptr) {
							this.rawDestructor?.(ptr);
						},
						argPackAdvance: GenericWireTypeSize,
						"readValueFromPointer": readPointer,
						"fromWireType": RegisteredPointer_fromWireType
					});
				};
				/** @constructor
				@param {*=} pointeeType,
				@param {*=} sharingPolicy,
				@param {*=} rawGetPointee,
				@param {*=} rawConstructor,
				@param {*=} rawShare,
				@param {*=} rawDestructor,
				*/
				function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
					this.name = name;
					this.registeredClass = registeredClass;
					this.isReference = isReference;
					this.isConst = isConst;
					this.isSmartPointer = isSmartPointer;
					this.pointeeType = pointeeType;
					this.sharingPolicy = sharingPolicy;
					this.rawGetPointee = rawGetPointee;
					this.rawConstructor = rawConstructor;
					this.rawShare = rawShare;
					this.rawDestructor = rawDestructor;
					if (!isSmartPointer && registeredClass.baseClass === void 0) if (isConst) {
						this["toWireType"] = constNoSmartPtrRawPointerToWireType;
						this.destructorFunction = null;
					} else {
						this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
						this.destructorFunction = null;
					}
					else this["toWireType"] = genericPointerToWireType;
				}
				/** @param {number=} numArguments */
				var replacePublicSymbol = (name, value, numArguments) => {
					if (!Module.hasOwnProperty(name)) throwInternalError("Replacing nonexistent public symbol");
					if (void 0 !== Module[name].overloadTable && void 0 !== numArguments) Module[name].overloadTable[numArguments] = value;
					else {
						Module[name] = value;
						Module[name].argCount = numArguments;
					}
				};
				var dynCallLegacy = (sig, ptr, args) => {
					sig = sig.replace(/p/g, "i");
					var f = Module["dynCall_" + sig];
					return f(ptr, ...args);
				};
				var wasmTableMirror = [];
				/** @type {WebAssembly.Table} */
				var wasmTable;
				var getWasmTableEntry = (funcPtr) => {
					var func = wasmTableMirror[funcPtr];
					if (!func) {
						if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
						/** @suppress {checkTypes} */
						wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
					}
					return func;
				};
				var dynCall = (sig, ptr, args = []) => {
					if (sig.includes("j")) return dynCallLegacy(sig, ptr, args);
					return getWasmTableEntry(ptr)(...args);
				};
				var getDynCaller = (sig, ptr) => {
					return (...args) => dynCall(sig, ptr, args);
				};
				var embind__requireFunction = (signature, rawFunction) => {
					signature = readLatin1String(signature);
					function makeDynCaller() {
						if (signature.includes("j")) return getDynCaller(signature, rawFunction);
						return getWasmTableEntry(rawFunction);
					}
					var fp = makeDynCaller();
					if (typeof fp != "function") throwBindingError(`unknown function pointer with signature ${signature}: ${rawFunction}`);
					return fp;
				};
				var extendError = (baseErrorType, errorName) => {
					var errorClass = createNamedFunction(errorName, function(message) {
						this.name = errorName;
						this.message = message;
						var stack = new Error(message).stack;
						if (stack !== void 0) this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
					});
					errorClass.prototype = Object.create(baseErrorType.prototype);
					errorClass.prototype.constructor = errorClass;
					errorClass.prototype.toString = function() {
						if (this.message === void 0) return this.name;
						else return `${this.name}: ${this.message}`;
					};
					return errorClass;
				};
				var UnboundTypeError;
				var getTypeName = (type) => {
					var ptr = ___getTypeName(type);
					var rv = readLatin1String(ptr);
					_free(ptr);
					return rv;
				};
				var throwUnboundTypeError = (message, types) => {
					var unboundTypes = [];
					var seen = {};
					function visit(type) {
						if (seen[type]) return;
						if (registeredTypes[type]) return;
						if (typeDependencies[type]) {
							typeDependencies[type].forEach(visit);
							return;
						}
						unboundTypes.push(type);
						seen[type] = true;
					}
					types.forEach(visit);
					throw new UnboundTypeError(`${message}: ` + unboundTypes.map(getTypeName).join([", "]));
				};
				var __embind_register_class = (rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) => {
					name = readLatin1String(name);
					getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
					upcast &&= embind__requireFunction(upcastSignature, upcast);
					downcast &&= embind__requireFunction(downcastSignature, downcast);
					rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
					var legalFunctionName = makeLegalFunctionName(name);
					exposePublicSymbol(legalFunctionName, function() {
						throwUnboundTypeError(`Cannot construct ${name} due to unbound types`, [baseClassRawType]);
					});
					whenDependentTypesAreResolved([
						rawType,
						rawPointerType,
						rawConstPointerType
					], baseClassRawType ? [baseClassRawType] : [], (base) => {
						base = base[0];
						var baseClass;
						var basePrototype;
						if (baseClassRawType) {
							baseClass = base.registeredClass;
							basePrototype = baseClass.instancePrototype;
						} else basePrototype = ClassHandle.prototype;
						var constructor = createNamedFunction(name, function(...args) {
							if (Object.getPrototypeOf(this) !== instancePrototype) throw new BindingError("Use 'new' to construct " + name);
							if (void 0 === registeredClass.constructor_body) throw new BindingError(name + " has no accessible constructor");
							var body = registeredClass.constructor_body[args.length];
							if (void 0 === body) throw new BindingError(`Tried to invoke ctor of ${name} with invalid number of parameters (${args.length}) - expected (${Object.keys(registeredClass.constructor_body).toString()}) parameters instead!`);
							return body.apply(this, args);
						});
						var instancePrototype = Object.create(basePrototype, { constructor: { value: constructor } });
						constructor.prototype = instancePrototype;
						var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
						if (registeredClass.baseClass) {
							registeredClass.baseClass.__derivedClasses ??= [];
							registeredClass.baseClass.__derivedClasses.push(registeredClass);
						}
						var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
						var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
						var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
						registeredPointers[rawType] = {
							pointerType: pointerConverter,
							constPointerType: constPointerConverter
						};
						replacePublicSymbol(legalFunctionName, constructor);
						return [
							referenceConverter,
							pointerConverter,
							constPointerConverter
						];
					});
				};
				var heap32VectorToArray = (count, firstElement) => {
					var array = [];
					for (var i = 0; i < count; i++) array.push(HEAPU32[firstElement + i * 4 >> 2]);
					return array;
				};
				function usesDestructorStack(argTypes) {
					for (var i = 1; i < argTypes.length; ++i) if (argTypes[i] !== null && argTypes[i].destructorFunction === void 0) return true;
					return false;
				}
				var InvokerFunctions = {
					"ftf": function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam) {
						return function() {
							var rv = invoker(fn);
							return retType["fromWireType"](rv);
						};
					},
					"ttfnn": function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam, argType0) {
						return function(arg0) {
							var rv = invoker(fn, classParam["toWireType"](null, this), argType0["toWireType"](null, arg0));
							return retType["fromWireType"](rv);
						};
					},
					"ttfn": function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam) {
						return function() {
							var rv = invoker(fn, classParam["toWireType"](null, this));
							return retType["fromWireType"](rv);
						};
					},
					"tffn": function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam) {
						return function() {
							invoker(fn, classParam["toWireType"](null, this));
						};
					},
					"tffnn": function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam, argType0) {
						return function(arg0) {
							invoker(fn, classParam["toWireType"](null, this), argType0["toWireType"](null, arg0));
						};
					},
					"ttfnt": function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam, argType0, arg0Wired_dtor) {
						return function(arg0) {
							var thisWired = classParam["toWireType"](null, this);
							var arg0Wired = argType0["toWireType"](null, arg0);
							var rv = invoker(fn, thisWired, arg0Wired);
							arg0Wired_dtor(arg0Wired);
							return retType["fromWireType"](rv);
						};
					},
					"tffnnn": function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam, argType0, argType1) {
						return function(arg0, arg1) {
							invoker(fn, classParam["toWireType"](null, this), argType0["toWireType"](null, arg0), argType1["toWireType"](null, arg1));
						};
					},
					"tffnnt": function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam, argType0, argType1, arg1Wired_dtor) {
						return function(arg0, arg1) {
							var thisWired = classParam["toWireType"](null, this);
							var arg0Wired = argType0["toWireType"](null, arg0);
							var arg1Wired = argType1["toWireType"](null, arg1);
							invoker(fn, thisWired, arg0Wired, arg1Wired);
							arg1Wired_dtor(arg1Wired);
						};
					},
					"tffnt": function(humanName, throwBindingError, invoker, fn, runDestructors, retType, classParam, argType0, arg0Wired_dtor) {
						return function(arg0) {
							var thisWired = classParam["toWireType"](null, this);
							var arg0Wired = argType0["toWireType"](null, arg0);
							invoker(fn, thisWired, arg0Wired);
							arg0Wired_dtor(arg0Wired);
						};
					}
				};
				function createJsInvokerSignature(argTypes, isClassMethodFunc, returns, isAsync) {
					const signature = [
						isClassMethodFunc ? "t" : "f",
						returns ? "t" : "f",
						isAsync ? "t" : "f"
					];
					for (let i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
						const arg = argTypes[i];
						let destructorSig = "";
						if (arg.destructorFunction === void 0) destructorSig = "u";
						else if (arg.destructorFunction === null) destructorSig = "n";
						else destructorSig = "t";
						signature.push(destructorSig);
					}
					return signature.join("");
				}
				function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc, isAsync) {
					var argCount = argTypes.length;
					if (argCount < 2) throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
					var isClassMethodFunc = argTypes[1] !== null && classType !== null;
					var needsDestructorStack = usesDestructorStack(argTypes);
					var returns = argTypes[0].name !== "void";
					argCount - 2;
					var closureArgs = [
						humanName,
						throwBindingError,
						cppInvokerFunc,
						cppTargetFunc,
						runDestructors,
						argTypes[0],
						argTypes[1]
					];
					for (var i = 0; i < argCount - 2; ++i) closureArgs.push(argTypes[i + 2]);
					if (!needsDestructorStack) {
						for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) if (argTypes[i].destructorFunction !== null) closureArgs.push(argTypes[i].destructorFunction);
					}
					return createNamedFunction(humanName, InvokerFunctions[createJsInvokerSignature(argTypes, isClassMethodFunc, returns, isAsync)](...closureArgs));
				}
				var __embind_register_class_constructor = (rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) => {
					var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
					invoker = embind__requireFunction(invokerSignature, invoker);
					whenDependentTypesAreResolved([], [rawClassType], (classType) => {
						classType = classType[0];
						var humanName = `constructor ${classType.name}`;
						if (void 0 === classType.registeredClass.constructor_body) classType.registeredClass.constructor_body = [];
						if (void 0 !== classType.registeredClass.constructor_body[argCount - 1]) throw new BindingError(`Cannot register multiple constructors with identical number of parameters (${argCount - 1}) for class '${classType.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`);
						classType.registeredClass.constructor_body[argCount - 1] = () => {
							throwUnboundTypeError(`Cannot construct ${classType.name} due to unbound types`, rawArgTypes);
						};
						whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
							argTypes.splice(1, 0, null);
							classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor);
							return [];
						});
						return [];
					});
				};
				var getFunctionName = (signature) => {
					signature = signature.trim();
					const argsIndex = signature.indexOf("(");
					if (argsIndex !== -1) return signature.substr(0, argsIndex);
					else return signature;
				};
				var __embind_register_class_function = (rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual, isAsync, isNonnullReturn) => {
					var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
					methodName = readLatin1String(methodName);
					methodName = getFunctionName(methodName);
					rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
					whenDependentTypesAreResolved([], [rawClassType], (classType) => {
						classType = classType[0];
						var humanName = `${classType.name}.${methodName}`;
						if (methodName.startsWith("@@")) methodName = Symbol[methodName.substring(2)];
						if (isPureVirtual) classType.registeredClass.pureVirtualFunctions.push(methodName);
						function unboundTypesHandler() {
							throwUnboundTypeError(`Cannot call ${humanName} due to unbound types`, rawArgTypes);
						}
						var proto = classType.registeredClass.instancePrototype;
						var method = proto[methodName];
						if (void 0 === method || void 0 === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
							unboundTypesHandler.argCount = argCount - 2;
							unboundTypesHandler.className = classType.name;
							proto[methodName] = unboundTypesHandler;
						} else {
							ensureOverloadTable(proto, methodName, humanName);
							proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
						}
						whenDependentTypesAreResolved([], rawArgTypes, (argTypes) => {
							var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context, isAsync);
							if (void 0 === proto[methodName].overloadTable) {
								memberFunction.argCount = argCount - 2;
								proto[methodName] = memberFunction;
							} else proto[methodName].overloadTable[argCount - 2] = memberFunction;
							return [];
						});
						return [];
					});
				};
				var emval_freelist = [];
				var emval_handles = [];
				var __emval_decref = (handle) => {
					if (handle > 9 && 0 === --emval_handles[handle + 1]) {
						emval_handles[handle] = void 0;
						emval_freelist.push(handle);
					}
				};
				var count_emval_handles = () => {
					return emval_handles.length / 2 - 5 - emval_freelist.length;
				};
				var init_emval = () => {
					emval_handles.push(0, 1, void 0, 1, null, 1, true, 1, false, 1);
					Module["count_emval_handles"] = count_emval_handles;
				};
				var Emval = {
					toValue: (handle) => {
						if (!handle) throwBindingError("Cannot use deleted val. handle = " + handle);
						return emval_handles[handle];
					},
					toHandle: (value) => {
						switch (value) {
							case void 0: return 2;
							case null: return 4;
							case true: return 6;
							case false: return 8;
							default: {
								const handle = emval_freelist.pop() || emval_handles.length;
								emval_handles[handle] = value;
								emval_handles[handle + 1] = 1;
								return handle;
							}
						}
					}
				};
				var EmValType = {
					name: "emscripten::val",
					"fromWireType": (handle) => {
						var rv = Emval.toValue(handle);
						__emval_decref(handle);
						return rv;
					},
					"toWireType": (destructors, value) => Emval.toHandle(value),
					argPackAdvance: GenericWireTypeSize,
					"readValueFromPointer": readPointer,
					destructorFunction: null
				};
				var __embind_register_emval = (rawType) => registerType(rawType, EmValType);
				var embindRepr = (v) => {
					if (v === null) return "null";
					var t = typeof v;
					if (t === "object" || t === "array" || t === "function") return v.toString();
					else return "" + v;
				};
				var floatReadValueFromPointer = (name, width) => {
					switch (width) {
						case 4: return function(pointer) {
							return this["fromWireType"](HEAPF32[pointer >> 2]);
						};
						case 8: return function(pointer) {
							return this["fromWireType"](HEAPF64[pointer >> 3]);
						};
						default: throw new TypeError(`invalid float width (${width}): ${name}`);
					}
				};
				var __embind_register_float = (rawType, name, size) => {
					name = readLatin1String(name);
					registerType(rawType, {
						name,
						"fromWireType": (value) => value,
						"toWireType": (destructors, value) => {
							return value;
						},
						argPackAdvance: GenericWireTypeSize,
						"readValueFromPointer": floatReadValueFromPointer(name, size),
						destructorFunction: null
					});
				};
				var __embind_register_function = (name, argCount, rawArgTypesAddr, signature, rawInvoker, fn, isAsync, isNonnullReturn) => {
					var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
					name = readLatin1String(name);
					name = getFunctionName(name);
					rawInvoker = embind__requireFunction(signature, rawInvoker);
					exposePublicSymbol(name, function() {
						throwUnboundTypeError(`Cannot call ${name} due to unbound types`, argTypes);
					}, argCount - 1);
					whenDependentTypesAreResolved([], argTypes, (argTypes) => {
						var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
						replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn, isAsync), argCount - 1);
						return [];
					});
				};
				var integerReadValueFromPointer = (name, width, signed) => {
					switch (width) {
						case 1: return signed ? (pointer) => HEAP8[pointer] : (pointer) => HEAPU8[pointer];
						case 2: return signed ? (pointer) => HEAP16[pointer >> 1] : (pointer) => HEAPU16[pointer >> 1];
						case 4: return signed ? (pointer) => HEAP32[pointer >> 2] : (pointer) => HEAPU32[pointer >> 2];
						default: throw new TypeError(`invalid integer width (${width}): ${name}`);
					}
				};
				/** @suppress {globalThis} */
				var __embind_register_integer = (primitiveType, name, size, minRange, maxRange) => {
					name = readLatin1String(name);
					if (maxRange === -1) maxRange = 4294967295;
					var fromWireType = (value) => value;
					if (minRange === 0) {
						var bitshift = 32 - 8 * size;
						fromWireType = (value) => value << bitshift >>> bitshift;
					}
					var isUnsignedType = name.includes("unsigned");
					var toWireType;
					if (isUnsignedType) toWireType = function(destructors, value) {
						this.name;
						return value >>> 0;
					};
					else toWireType = function(destructors, value) {
						this.name;
						return value;
					};
					registerType(primitiveType, {
						name,
						"fromWireType": fromWireType,
						"toWireType": toWireType,
						argPackAdvance: GenericWireTypeSize,
						"readValueFromPointer": integerReadValueFromPointer(name, size, minRange !== 0),
						destructorFunction: null
					});
				};
				var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
					var TA = [
						Int8Array,
						Uint8Array,
						Int16Array,
						Uint16Array,
						Int32Array,
						Uint32Array,
						Float32Array,
						Float64Array
					][dataTypeIndex];
					function decodeMemoryView(handle) {
						var size = HEAPU32[handle >> 2];
						var data = HEAPU32[handle + 4 >> 2];
						return new TA(HEAP8.buffer, data, size);
					}
					name = readLatin1String(name);
					registerType(rawType, {
						name,
						"fromWireType": decodeMemoryView,
						argPackAdvance: GenericWireTypeSize,
						"readValueFromPointer": decodeMemoryView
					}, { ignoreDuplicateRegistrations: true });
				};
				var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
					if (!(maxBytesToWrite > 0)) return 0;
					var startIdx = outIdx;
					var endIdx = outIdx + maxBytesToWrite - 1;
					for (var i = 0; i < str.length; ++i) {
						var u = str.charCodeAt(i);
						if (u >= 55296 && u <= 57343) {
							var u1 = str.charCodeAt(++i);
							u = 65536 + ((u & 1023) << 10) | u1 & 1023;
						}
						if (u <= 127) {
							if (outIdx >= endIdx) break;
							heap[outIdx++] = u;
						} else if (u <= 2047) {
							if (outIdx + 1 >= endIdx) break;
							heap[outIdx++] = 192 | u >> 6;
							heap[outIdx++] = 128 | u & 63;
						} else if (u <= 65535) {
							if (outIdx + 2 >= endIdx) break;
							heap[outIdx++] = 224 | u >> 12;
							heap[outIdx++] = 128 | u >> 6 & 63;
							heap[outIdx++] = 128 | u & 63;
						} else {
							if (outIdx + 3 >= endIdx) break;
							heap[outIdx++] = 240 | u >> 18;
							heap[outIdx++] = 128 | u >> 12 & 63;
							heap[outIdx++] = 128 | u >> 6 & 63;
							heap[outIdx++] = 128 | u & 63;
						}
					}
					heap[outIdx] = 0;
					return outIdx - startIdx;
				};
				var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
					return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
				};
				var lengthBytesUTF8 = (str) => {
					var len = 0;
					for (var i = 0; i < str.length; ++i) {
						var c = str.charCodeAt(i);
						if (c <= 127) len++;
						else if (c <= 2047) len += 2;
						else if (c >= 55296 && c <= 57343) {
							len += 4;
							++i;
						} else len += 3;
					}
					return len;
				};
				var __embind_register_std_string = (rawType, name) => {
					name = readLatin1String(name);
					var stdStringIsUTF8 = true;
					registerType(rawType, {
						name,
						"fromWireType"(value) {
							var length = HEAPU32[value >> 2];
							var payload = value + 4;
							var str;
							if (stdStringIsUTF8) {
								var decodeStartPtr = payload;
								for (var i = 0; i <= length; ++i) {
									var currentBytePtr = payload + i;
									if (i == length || HEAPU8[currentBytePtr] == 0) {
										var maxRead = currentBytePtr - decodeStartPtr;
										var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
										if (str === void 0) str = stringSegment;
										else {
											str += String.fromCharCode(0);
											str += stringSegment;
										}
										decodeStartPtr = currentBytePtr + 1;
									}
								}
							} else {
								var a = new Array(length);
								for (var i = 0; i < length; ++i) a[i] = String.fromCharCode(HEAPU8[payload + i]);
								str = a.join("");
							}
							_free(value);
							return str;
						},
						"toWireType"(destructors, value) {
							if (value instanceof ArrayBuffer) value = new Uint8Array(value);
							var length;
							var valueIsOfTypeString = typeof value == "string";
							if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) throwBindingError("Cannot pass non-string to std::string");
							if (stdStringIsUTF8 && valueIsOfTypeString) length = lengthBytesUTF8(value);
							else length = value.length;
							var base = _malloc(4 + length + 1);
							var ptr = base + 4;
							HEAPU32[base >> 2] = length;
							if (stdStringIsUTF8 && valueIsOfTypeString) stringToUTF8(value, ptr, length + 1);
							else if (valueIsOfTypeString) for (var i = 0; i < length; ++i) {
								var charCode = value.charCodeAt(i);
								if (charCode > 255) {
									_free(ptr);
									throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
								}
								HEAPU8[ptr + i] = charCode;
							}
							else for (var i = 0; i < length; ++i) HEAPU8[ptr + i] = value[i];
							if (destructors !== null) destructors.push(_free, base);
							return base;
						},
						argPackAdvance: GenericWireTypeSize,
						"readValueFromPointer": readPointer,
						destructorFunction(ptr) {
							_free(ptr);
						}
					});
				};
				var UTF16Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf-16le") : void 0;
				var UTF16ToString = (ptr, maxBytesToRead) => {
					var endPtr = ptr;
					var idx = endPtr >> 1;
					var maxIdx = idx + maxBytesToRead / 2;
					while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
					endPtr = idx << 1;
					if (endPtr - ptr > 32 && UTF16Decoder) return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
					var str = "";
					for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
						var codeUnit = HEAP16[ptr + i * 2 >> 1];
						if (codeUnit == 0) break;
						str += String.fromCharCode(codeUnit);
					}
					return str;
				};
				var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
					maxBytesToWrite ??= 2147483647;
					if (maxBytesToWrite < 2) return 0;
					maxBytesToWrite -= 2;
					var startPtr = outPtr;
					var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
					for (var i = 0; i < numCharsToWrite; ++i) {
						var codeUnit = str.charCodeAt(i);
						HEAP16[outPtr >> 1] = codeUnit;
						outPtr += 2;
					}
					HEAP16[outPtr >> 1] = 0;
					return outPtr - startPtr;
				};
				var lengthBytesUTF16 = (str) => str.length * 2;
				var UTF32ToString = (ptr, maxBytesToRead) => {
					var i = 0;
					var str = "";
					while (!(i >= maxBytesToRead / 4)) {
						var utf32 = HEAP32[ptr + i * 4 >> 2];
						if (utf32 == 0) break;
						++i;
						if (utf32 >= 65536) {
							var ch = utf32 - 65536;
							str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
						} else str += String.fromCharCode(utf32);
					}
					return str;
				};
				var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
					maxBytesToWrite ??= 2147483647;
					if (maxBytesToWrite < 4) return 0;
					var startPtr = outPtr;
					var endPtr = startPtr + maxBytesToWrite - 4;
					for (var i = 0; i < str.length; ++i) {
						var codeUnit = str.charCodeAt(i);
						if (codeUnit >= 55296 && codeUnit <= 57343) {
							var trailSurrogate = str.charCodeAt(++i);
							codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
						}
						HEAP32[outPtr >> 2] = codeUnit;
						outPtr += 4;
						if (outPtr + 4 > endPtr) break;
					}
					HEAP32[outPtr >> 2] = 0;
					return outPtr - startPtr;
				};
				var lengthBytesUTF32 = (str) => {
					var len = 0;
					for (var i = 0; i < str.length; ++i) {
						var codeUnit = str.charCodeAt(i);
						if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
						len += 4;
					}
					return len;
				};
				var __embind_register_std_wstring = (rawType, charSize, name) => {
					name = readLatin1String(name);
					var decodeString, encodeString, readCharAt, lengthBytesUTF;
					if (charSize === 2) {
						decodeString = UTF16ToString;
						encodeString = stringToUTF16;
						lengthBytesUTF = lengthBytesUTF16;
						readCharAt = (pointer) => HEAPU16[pointer >> 1];
					} else if (charSize === 4) {
						decodeString = UTF32ToString;
						encodeString = stringToUTF32;
						lengthBytesUTF = lengthBytesUTF32;
						readCharAt = (pointer) => HEAPU32[pointer >> 2];
					}
					registerType(rawType, {
						name,
						"fromWireType": (value) => {
							var length = HEAPU32[value >> 2];
							var str;
							var decodeStartPtr = value + 4;
							for (var i = 0; i <= length; ++i) {
								var currentBytePtr = value + 4 + i * charSize;
								if (i == length || readCharAt(currentBytePtr) == 0) {
									var maxReadBytes = currentBytePtr - decodeStartPtr;
									var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
									if (str === void 0) str = stringSegment;
									else {
										str += String.fromCharCode(0);
										str += stringSegment;
									}
									decodeStartPtr = currentBytePtr + charSize;
								}
							}
							_free(value);
							return str;
						},
						"toWireType": (destructors, value) => {
							if (!(typeof value == "string")) throwBindingError(`Cannot pass non-string to C++ string type ${name}`);
							var length = lengthBytesUTF(value);
							var ptr = _malloc(4 + length + charSize);
							HEAPU32[ptr >> 2] = length / charSize;
							encodeString(value, ptr + 4, length + charSize);
							if (destructors !== null) destructors.push(_free, ptr);
							return ptr;
						},
						argPackAdvance: GenericWireTypeSize,
						"readValueFromPointer": readPointer,
						destructorFunction(ptr) {
							_free(ptr);
						}
					});
				};
				var __embind_register_value_object = (rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) => {
					structRegistrations[rawType] = {
						name: readLatin1String(name),
						rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
						rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
						fields: []
					};
				};
				var __embind_register_value_object_field = (structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) => {
					structRegistrations[structType].fields.push({
						fieldName: readLatin1String(fieldName),
						getterReturnType,
						getter: embind__requireFunction(getterSignature, getter),
						getterContext,
						setterArgumentType,
						setter: embind__requireFunction(setterSignature, setter),
						setterContext
					});
				};
				var __embind_register_void = (rawType, name) => {
					name = readLatin1String(name);
					registerType(rawType, {
						isVoid: true,
						name,
						argPackAdvance: 0,
						"fromWireType": () => void 0,
						"toWireType": (destructors, o) => void 0
					});
				};
				var __emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);
				var requireRegisteredType = (rawType, humanName) => {
					var impl = registeredTypes[rawType];
					if (void 0 === impl) throwBindingError(`${humanName} has unknown type ${getTypeName(rawType)}`);
					return impl;
				};
				var __emval_take_value = (type, arg) => {
					type = requireRegisteredType(type, "_emval_take_value");
					var v = type["readValueFromPointer"](arg);
					return Emval.toHandle(v);
				};
				var getHeapMax = () => 2147483648;
				var alignMemory = (size, alignment) => {
					return Math.ceil(size / alignment) * alignment;
				};
				var growMemory = (size) => {
					var pages = (size - wasmMemory.buffer.byteLength + 65535) / 65536 | 0;
					try {
						wasmMemory.grow(pages);
						updateMemoryViews();
						return 1;
					} catch (e) {}
				};
				var _emscripten_resize_heap = (requestedSize) => {
					var oldSize = HEAPU8.length;
					requestedSize >>>= 0;
					var maxHeapSize = getHeapMax();
					if (requestedSize > maxHeapSize) return false;
					for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
						var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
						overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
						if (growMemory(Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536)))) return true;
					}
					return false;
				};
				var _fd_close = (fd) => {
					return 52;
				};
				var convertI32PairToI53Checked = (lo, hi) => {
					return hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
				};
				function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
					convertI32PairToI53Checked(offset_low, offset_high);
					return 70;
				}
				var printCharBuffers = [
					null,
					[],
					[]
				];
				var printChar = (stream, curr) => {
					var buffer = printCharBuffers[stream];
					if (curr === 0 || curr === 10) {
						(stream === 1 ? out : err)(UTF8ArrayToString(buffer));
						buffer.length = 0;
					} else buffer.push(curr);
				};
				var _fd_write = (fd, iov, iovcnt, pnum) => {
					var num = 0;
					for (var i = 0; i < iovcnt; i++) {
						var ptr = HEAPU32[iov >> 2];
						var len = HEAPU32[iov + 4 >> 2];
						iov += 8;
						for (var j = 0; j < len; j++) printChar(fd, HEAPU8[ptr + j]);
						num += len;
					}
					HEAPU32[pnum >> 2] = num;
					return 0;
				};
				var _llvm_eh_typeid_for = (type) => type;
				var getCFunc = (ident) => {
					return Module["_" + ident];
				};
				var writeArrayToMemory = (array, buffer) => {
					HEAP8.set(array, buffer);
				};
				var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
				var stringToUTF8OnStack = (str) => {
					var size = lengthBytesUTF8(str) + 1;
					var ret = stackAlloc(size);
					stringToUTF8(str, ret, size);
					return ret;
				};
				/**
				* @param {string|null=} returnType
				* @param {Array=} argTypes
				* @param {Arguments|Array=} args
				* @param {Object=} opts
				*/
				var ccall = (ident, returnType, argTypes, args, opts) => {
					var toC = {
						"string": (str) => {
							var ret = 0;
							if (str !== null && str !== void 0 && str !== 0) ret = stringToUTF8OnStack(str);
							return ret;
						},
						"array": (arr) => {
							var ret = stackAlloc(arr.length);
							writeArrayToMemory(arr, ret);
							return ret;
						}
					};
					function convertReturnValue(ret) {
						if (returnType === "string") return UTF8ToString(ret);
						if (returnType === "boolean") return Boolean(ret);
						return ret;
					}
					var func = getCFunc(ident);
					var cArgs = [];
					var stack = 0;
					if (args) for (var i = 0; i < args.length; i++) {
						var converter = toC[argTypes[i]];
						if (converter) {
							if (stack === 0) stack = stackSave();
							cArgs[i] = converter(args[i]);
						} else cArgs[i] = args[i];
					}
					var ret = func(...cArgs);
					function onDone(ret) {
						if (stack !== 0) stackRestore(stack);
						return convertReturnValue(ret);
					}
					ret = onDone(ret);
					return ret;
				};
				InternalError = Module["InternalError"] = class InternalError extends Error {
					constructor(message) {
						super(message);
						this.name = "InternalError";
					}
				};
				embind_init_charCodes();
				BindingError = Module["BindingError"] = class BindingError extends Error {
					constructor(message) {
						super(message);
						this.name = "BindingError";
					}
				};
				init_ClassHandle();
				init_RegisteredPointer();
				UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
				init_emval();
				var wasmImports = {
					/** @export */
					__assert_fail: ___assert_fail,
					/** @export */
					__cxa_begin_catch: ___cxa_begin_catch,
					/** @export */
					__cxa_end_catch: ___cxa_end_catch,
					/** @export */
					__cxa_find_matching_catch_2: ___cxa_find_matching_catch_2,
					/** @export */
					__cxa_find_matching_catch_3: ___cxa_find_matching_catch_3,
					/** @export */
					__cxa_throw: ___cxa_throw,
					/** @export */
					__resumeException: ___resumeException,
					/** @export */
					_abort_js: __abort_js,
					/** @export */
					_embind_finalize_value_object: __embind_finalize_value_object,
					/** @export */
					_embind_register_bigint: __embind_register_bigint,
					/** @export */
					_embind_register_bool: __embind_register_bool,
					/** @export */
					_embind_register_class: __embind_register_class,
					/** @export */
					_embind_register_class_constructor: __embind_register_class_constructor,
					/** @export */
					_embind_register_class_function: __embind_register_class_function,
					/** @export */
					_embind_register_emval: __embind_register_emval,
					/** @export */
					_embind_register_float: __embind_register_float,
					/** @export */
					_embind_register_function: __embind_register_function,
					/** @export */
					_embind_register_integer: __embind_register_integer,
					/** @export */
					_embind_register_memory_view: __embind_register_memory_view,
					/** @export */
					_embind_register_std_string: __embind_register_std_string,
					/** @export */
					_embind_register_std_wstring: __embind_register_std_wstring,
					/** @export */
					_embind_register_value_object: __embind_register_value_object,
					/** @export */
					_embind_register_value_object_field: __embind_register_value_object_field,
					/** @export */
					_embind_register_void: __embind_register_void,
					/** @export */
					_emscripten_memcpy_js: __emscripten_memcpy_js,
					/** @export */
					_emval_decref: __emval_decref,
					/** @export */
					_emval_take_value: __emval_take_value,
					/** @export */
					emscripten_resize_heap: _emscripten_resize_heap,
					/** @export */
					fd_close: _fd_close,
					/** @export */
					fd_seek: _fd_seek,
					/** @export */
					fd_write: _fd_write,
					/** @export */
					invoke_i,
					/** @export */
					invoke_ii,
					/** @export */
					invoke_iii,
					/** @export */
					invoke_iiii,
					/** @export */
					invoke_v,
					/** @export */
					invoke_vi,
					/** @export */
					invoke_viiii,
					/** @export */
					invoke_viiiiii,
					/** @export */
					llvm_eh_typeid_for: _llvm_eh_typeid_for
				};
				var wasmExports;
				createWasm();
				var ___getTypeName = (a0) => (___getTypeName = wasmExports["__getTypeName"])(a0);
				var _malloc = (a0) => (_malloc = wasmExports["malloc"])(a0);
				var _free = (a0) => (_free = wasmExports["free"])(a0);
				var _setThrew = (a0, a1) => (_setThrew = wasmExports["setThrew"])(a0, a1);
				var __emscripten_tempret_set = (a0) => (__emscripten_tempret_set = wasmExports["_emscripten_tempret_set"])(a0);
				var __emscripten_stack_restore = (a0) => (__emscripten_stack_restore = wasmExports["_emscripten_stack_restore"])(a0);
				var __emscripten_stack_alloc = (a0) => (__emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"])(a0);
				var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"])();
				var ___cxa_increment_exception_refcount = (a0) => (___cxa_increment_exception_refcount = wasmExports["__cxa_increment_exception_refcount"])(a0);
				var ___cxa_decrement_exception_refcount = (a0) => (___cxa_decrement_exception_refcount = wasmExports["__cxa_decrement_exception_refcount"])(a0);
				var ___cxa_can_catch = (a0, a1, a2) => (___cxa_can_catch = wasmExports["__cxa_can_catch"])(a0, a1, a2);
				var ___cxa_get_exception_ptr = (a0) => (___cxa_get_exception_ptr = wasmExports["__cxa_get_exception_ptr"])(a0);
				var dynCall_ji = Module["dynCall_ji"] = (a0, a1) => (dynCall_ji = Module["dynCall_ji"] = wasmExports["dynCall_ji"])(a0, a1);
				var dynCall_iiji = Module["dynCall_iiji"] = (a0, a1, a2, a3, a4) => (dynCall_iiji = Module["dynCall_iiji"] = wasmExports["dynCall_iiji"])(a0, a1, a2, a3, a4);
				var dynCall_jiji = Module["dynCall_jiji"] = (a0, a1, a2, a3, a4) => (dynCall_jiji = Module["dynCall_jiji"] = wasmExports["dynCall_jiji"])(a0, a1, a2, a3, a4);
				function invoke_ii(index, a1) {
					var sp = stackSave();
					try {
						return getWasmTableEntry(index)(a1);
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				function invoke_vi(index, a1) {
					var sp = stackSave();
					try {
						getWasmTableEntry(index)(a1);
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				function invoke_viiii(index, a1, a2, a3, a4) {
					var sp = stackSave();
					try {
						getWasmTableEntry(index)(a1, a2, a3, a4);
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				function invoke_v(index) {
					var sp = stackSave();
					try {
						getWasmTableEntry(index)();
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				function invoke_iiii(index, a1, a2, a3) {
					var sp = stackSave();
					try {
						return getWasmTableEntry(index)(a1, a2, a3);
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				function invoke_i(index) {
					var sp = stackSave();
					try {
						return getWasmTableEntry(index)();
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
					var sp = stackSave();
					try {
						getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				function invoke_iii(index, a1, a2) {
					var sp = stackSave();
					try {
						return getWasmTableEntry(index)(a1, a2);
					} catch (e) {
						stackRestore(sp);
						if (e !== e + 0) throw e;
						_setThrew(1, 0);
					}
				}
				Module["ccall"] = ccall;
				var calledRun;
				dependenciesFulfilled = function runCaller() {
					if (!calledRun) run();
					if (!calledRun) dependenciesFulfilled = runCaller;
				};
				function run() {
					if (runDependencies > 0) return;
					preRun();
					if (runDependencies > 0) return;
					function doRun() {
						if (calledRun) return;
						calledRun = true;
						Module["calledRun"] = true;
						if (ABORT) return;
						initRuntime();
						readyPromiseResolve(Module);
						Module["onRuntimeInitialized"]?.();
						postRun();
					}
					if (Module["setStatus"]) {
						Module["setStatus"]("Running...");
						setTimeout(() => {
							setTimeout(() => Module["setStatus"](""), 1);
							doRun();
						}, 1);
					} else doRun();
				}
				if (Module["preInit"]) {
					if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
					while (Module["preInit"].length > 0) Module["preInit"].pop()();
				}
				run();
				moduleRtn = readyPromise;
				return moduleRtn;
			});
		})();
		if (typeof exports === "object" && typeof module === "object") {
			module.exports = Module;
			module.exports.default = Module;
		} else if (typeof define === "function" && define["amd"]) define([], () => Module);
	})))());
	const openjphWasm = new URL("/assets/openjphjs-B5O5ikHp.wasm", "" + self.location.href);
	const local = {
		codec: void 0,
		decoder: void 0,
		decodeConfig: {}
	};
	function calculateSizeAtDecompositionLevel(decompositionLevel, frameWidth, frameHeight) {
		const result = {
			width: frameWidth,
			height: frameHeight
		};
		while (decompositionLevel > 0) {
			result.width = Math.ceil(result.width / 2);
			result.height = Math.ceil(result.height / 2);
			decompositionLevel--;
		}
		return result;
	}
	function initialize(decodeConfig) {
		local.decodeConfig = decodeConfig;
		setWasmBasePathFromConfig(decodeConfig);
		if (local.codec) return Promise.resolve();
		const openJphModule = (0, import_openjphjs.default)({ locateFile: (f) => {
			if (f.endsWith(".wasm")) return resolveWasmUrl("openjphjs.wasm", openjphWasm);
			return f;
		} });
		return new Promise((resolve, reject) => {
			openJphModule.then((instance) => {
				local.codec = instance;
				local.decoder = new instance.HTJ2KDecoder();
				resolve();
			}, reject);
		});
	}
	async function decodeAsync(compressedImageFrame, imageInfo) {
		await initialize();
		const decoder = new local.codec.HTJ2KDecoder();
		const encodedBufferInWASM = decoder.getEncodedBuffer(compressedImageFrame.length);
		encodedBufferInWASM.set(compressedImageFrame);
		const decodeLevel = imageInfo.decodeLevel || 0;
		decoder.decodeSubResolution(decodeLevel);
		const frameInfo = decoder.getFrameInfo();
		if (imageInfo.decodeLevel > 0) {
			const { width, height } = calculateSizeAtDecompositionLevel(imageInfo.decodeLevel, frameInfo.width, frameInfo.height);
			frameInfo.width = width;
			frameInfo.height = height;
		}
		const decodedBufferInWASM = decoder.getDecodedBuffer();
		new Uint8Array(decodedBufferInWASM.length).set(decodedBufferInWASM);
		const imageOffset = `x: ${decoder.getImageOffset().x}, y: ${decoder.getImageOffset().y}`;
		const numDecompositions = decoder.getNumDecompositions();
		const numLayers = decoder.getNumLayers();
		const progessionOrder = [
			"unknown",
			"LRCP",
			"RLCP",
			"RPCL",
			"PCRL",
			"CPRL"
		][decoder.getProgressionOrder() + 1];
		const reversible = decoder.getIsReversible();
		const blockDimensions = `${decoder.getBlockDimensions().width} x ${decoder.getBlockDimensions().height}`;
		const tileSize = `${decoder.getTileSize().width} x ${decoder.getTileSize().height}`;
		const tileOffset = `${decoder.getTileOffset().x}, ${decoder.getTileOffset().y}`;
		const decodedSize = `${decodedBufferInWASM.length.toLocaleString()} bytes`;
		const compressionRatio = `${(decodedBufferInWASM.length / encodedBufferInWASM.length).toFixed(2)}:1`;
		const encodedImageInfo = {
			columns: frameInfo.width,
			rows: frameInfo.height,
			bitsPerPixel: frameInfo.bitsPerSample,
			signed: frameInfo.isSigned,
			bytesPerPixel: imageInfo.bytesPerPixel,
			componentsPerPixel: frameInfo.componentCount
		};
		let pixelData = getPixelData(frameInfo, decodedBufferInWASM);
		const { buffer: b, byteOffset, byteLength } = pixelData;
		const pixelDataArrayBuffer = b.slice(byteOffset, byteOffset + byteLength);
		pixelData = new pixelData.constructor(pixelDataArrayBuffer);
		const encodeOptions = {
			imageOffset,
			numDecompositions,
			numLayers,
			progessionOrder,
			reversible,
			blockDimensions,
			tileSize,
			tileOffset,
			decodedSize,
			compressionRatio
		};
		return {
			...imageInfo,
			pixelData,
			imageInfo: encodedImageInfo,
			encodeOptions,
			...encodeOptions,
			...encodedImageInfo
		};
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/scaling/scaleArray.js
	function scaleArray(array, scalingParameters) {
		const arrayLength = array.length;
		const { rescaleSlope, rescaleIntercept, suvbw, doseGridScaling } = scalingParameters;
		if (scalingParameters.modality === "PT" && typeof suvbw === "number" && !isNaN(suvbw)) for (let i = 0; i < arrayLength; i++) array[i] = suvbw * (array[i] * rescaleSlope + rescaleIntercept);
		else if (scalingParameters.modality === "RTDOSE" && typeof doseGridScaling === "number" && !isNaN(doseGridScaling)) for (let i = 0; i < arrayLength; i++) array[i] = array[i] * doseGridScaling;
		else for (let i = 0; i < arrayLength; i++) array[i] = array[i] * rescaleSlope + rescaleIntercept;
		return true;
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/getMinMax.js
	function getMinMax(storedPixelData) {
		let min = storedPixelData[0];
		let max = storedPixelData[0];
		let storedPixel;
		const numPixels = storedPixelData.length;
		for (let index = 1; index < numPixels; index++) {
			storedPixel = storedPixelData[index];
			min = Math.min(min, storedPixel);
			max = Math.max(max, storedPixel);
		}
		return {
			min,
			max
		};
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/getPixelDataTypeFromMinMax.js
	function getPixelDataTypeFromMinMax(min, max) {
		let pixelDataType;
		if (Number.isInteger(min) && Number.isInteger(max)) {
			if (min >= 0) {
				if (max <= 255) pixelDataType = Uint8Array;
				else if (max <= 65535) pixelDataType = Uint16Array;
				else if (max <= 4294967295) pixelDataType = Uint32Array;
			} else if (min >= -128 && max <= 127) pixelDataType = Int8Array;
			else if (min >= -32768 && max <= 32767) pixelDataType = Int16Array;
		}
		return pixelDataType || Float32Array;
	}
	function validatePixelDataType(min, max, type) {
		return getPixelDataTypeFromMinMax(min, max) === type;
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/shared/isColorImage.js
	function isColorImage_default(photoMetricInterpretation) {
		return photoMetricInterpretation === "RGB" || photoMetricInterpretation === "PALETTE COLOR" || photoMetricInterpretation === "YBR_FULL" || photoMetricInterpretation === "YBR_FULL_422" || photoMetricInterpretation === "YBR_PARTIAL_422" || photoMetricInterpretation === "YBR_PARTIAL_420" || photoMetricInterpretation === "YBR_RCT" || photoMetricInterpretation === "YBR_ICT";
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@cornerstonejs+dicom-image-loader@5.8.2_@cornerstonejs+core@5.8.2_@cornerstonejs+metadata@5.8_g6czkbacayqdfgmx3247huhsqi/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/decodeImageFrameWorker.js
	const imageUtils = {
		bilinear,
		replicate
	};
	const typedArrayConstructors = {
		Uint8Array,
		Uint16Array,
		Int16Array,
		Float32Array,
		Uint32Array
	};
	function postProcessDecodedPixels(imageFrame, options, start, decodeConfig) {
		const shouldShift = imageFrame.pixelRepresentation !== void 0 && imageFrame.pixelRepresentation === 1;
		const shift = shouldShift && imageFrame.bitsStored !== void 0 ? 32 - imageFrame.bitsStored : void 0;
		if (shouldShift && shift !== void 0) for (let i = 0; i < imageFrame.pixelData.length; i++) imageFrame.pixelData[i] = imageFrame.pixelData[i] << shift >> shift;
		let pixelDataArray = imageFrame.pixelData;
		imageFrame.pixelDataLength = imageFrame.pixelData.length;
		const { min: minBeforeScale, max: maxBeforeScale } = getMinMax(imageFrame.pixelData);
		const canRenderFloat = typeof options.allowFloatRendering !== "undefined" ? options.allowFloatRendering : true;
		let invalidType = isColorImage_default(imageFrame.photometricInterpretation) && options.targetBuffer?.offset === void 0;
		const hasFloatRescale = options.preScale?.enabled && Object.values(options.preScale.scalingParameters).some((v) => typeof v === "number" && !Number.isInteger(v));
		const disableScale = !options.preScale.enabled || !canRenderFloat && hasFloatRescale;
		const type = options.targetBuffer?.type;
		if (type && options.preScale.enabled && !disableScale) {
			const scalingParameters = options.preScale.scalingParameters;
			const scaledValues = _calculateScaledMinMax(minBeforeScale, maxBeforeScale, scalingParameters);
			invalidType = !validatePixelDataType(scaledValues.min, scaledValues.max, typedArrayConstructors[type]);
		}
		if (type && !invalidType) pixelDataArray = _handleTargetBuffer(options, imageFrame, typedArrayConstructors, pixelDataArray);
		else if (options.preScale.enabled && !disableScale) pixelDataArray = _handlePreScaleSetup(options, minBeforeScale, maxBeforeScale, imageFrame);
		else pixelDataArray = _getDefaultPixelDataArray(minBeforeScale, maxBeforeScale, imageFrame);
		let minAfterScale = minBeforeScale;
		let maxAfterScale = maxBeforeScale;
		if (options.preScale.enabled && !disableScale) {
			const scalingParameters = options.preScale.scalingParameters;
			_validateScalingParameters(scalingParameters);
			if (_isRequiredScaling(scalingParameters)) {
				scaleArray(pixelDataArray, scalingParameters);
				imageFrame.preScale = {
					...options.preScale,
					scaled: true
				};
				const scaledValues = _calculateScaledMinMax(minBeforeScale, maxBeforeScale, scalingParameters);
				minAfterScale = scaledValues.min;
				maxAfterScale = scaledValues.max;
			}
		} else if (disableScale) {
			minAfterScale = minBeforeScale;
			maxAfterScale = maxBeforeScale;
		}
		imageFrame.pixelData = pixelDataArray;
		imageFrame.smallestPixelValue = minAfterScale;
		imageFrame.largestPixelValue = maxAfterScale;
		imageFrame.decodeTimeInMS = (/* @__PURE__ */ new Date()).getTime() - start;
		return imageFrame;
	}
	function _isRequiredScaling(scalingParameters) {
		const { rescaleSlope, rescaleIntercept, modality, doseGridScaling, suvbw } = scalingParameters;
		return typeof rescaleSlope === "number" && typeof rescaleIntercept === "number" || modality === "RTDOSE" && typeof doseGridScaling === "number" || modality === "PT" && typeof suvbw === "number";
	}
	function _handleTargetBuffer(options, imageFrame, typedArrayConstructors, pixelDataArray) {
		const { arrayBuffer, type, offset: rawOffset = 0, length: rawLength, rows } = options.targetBuffer;
		const TypedArrayConstructor = typedArrayConstructors[type];
		if (!TypedArrayConstructor) throw new Error(`target array ${type} is not supported, or doesn't exist.`);
		if (rows && rows != imageFrame.rows) scaleImageFrame(imageFrame, options.targetBuffer, TypedArrayConstructor);
		const imageFrameLength = imageFrame.pixelDataLength;
		const offset = rawOffset;
		const length = rawLength !== null && rawLength !== void 0 ? rawLength : imageFrameLength - offset;
		const imageFramePixelData = imageFrame.pixelData;
		if (length !== imageFramePixelData.length) throw new Error(`target array for image does not have the same length (${length}) as the decoded image length (${imageFramePixelData.length}).`);
		const typedArray = arrayBuffer ? new TypedArrayConstructor(arrayBuffer, offset, length) : new TypedArrayConstructor(length);
		typedArray.set(imageFramePixelData, 0);
		pixelDataArray = typedArray;
		return pixelDataArray;
	}
	function _handlePreScaleSetup(options, minBeforeScale, maxBeforeScale, imageFrame) {
		const scalingParameters = options.preScale.scalingParameters;
		_validateScalingParameters(scalingParameters);
		const scaledValues = _calculateScaledMinMax(minBeforeScale, maxBeforeScale, scalingParameters);
		return _getDefaultPixelDataArray(scaledValues.min, scaledValues.max, imageFrame);
	}
	function _getDefaultPixelDataArray(min, max, imageFrame) {
		const typedArray = new (getPixelDataTypeFromMinMax(min, max))(imageFrame.pixelData.length);
		typedArray.set(imageFrame.pixelData, 0);
		return typedArray;
	}
	function _calculateScaledMinMax(minValue, maxValue, scalingParameters) {
		const { rescaleSlope, rescaleIntercept, modality, doseGridScaling, suvbw } = scalingParameters;
		if (modality === "PT" && typeof suvbw === "number" && !isNaN(suvbw)) return {
			min: suvbw * (minValue * rescaleSlope + rescaleIntercept),
			max: suvbw * (maxValue * rescaleSlope + rescaleIntercept)
		};
		else if (modality === "RTDOSE" && typeof doseGridScaling === "number" && !isNaN(doseGridScaling)) return {
			min: minValue * doseGridScaling,
			max: maxValue * doseGridScaling
		};
		else if (typeof rescaleSlope === "number" && typeof rescaleIntercept === "number") return {
			min: rescaleSlope * minValue + rescaleIntercept,
			max: rescaleSlope * maxValue + rescaleIntercept
		};
		else return {
			min: minValue,
			max: maxValue
		};
	}
	function _validateScalingParameters(scalingParameters) {
		if (!scalingParameters) throw new Error("options.preScale.scalingParameters must be defined if preScale.enabled is true, and scalingParameters cannot be derived from the metadata providers.");
	}
	function createDestinationImage(imageFrame, targetBuffer, TypedArrayConstructor) {
		const { samplesPerPixel } = imageFrame;
		const { rows, columns } = targetBuffer;
		const typedLength = rows * columns * samplesPerPixel;
		const pixelData = new TypedArrayConstructor(typedLength);
		const bytesPerPixel = pixelData.byteLength / typedLength;
		return {
			pixelData,
			rows,
			columns,
			frameInfo: {
				...imageFrame.frameInfo,
				rows,
				columns
			},
			imageInfo: {
				...imageFrame.imageInfo,
				rows,
				columns,
				bytesPerPixel
			}
		};
	}
	function scaleImageFrame(imageFrame, targetBuffer, TypedArrayConstructor) {
		const dest = createDestinationImage(imageFrame, targetBuffer, TypedArrayConstructor);
		const { scalingType = "replicate" } = targetBuffer;
		imageUtils[scalingType](imageFrame, dest);
		Object.assign(imageFrame, dest);
		imageFrame.pixelDataLength = imageFrame.pixelData.length;
		return imageFrame;
	}
	async function decodeImageFrame(imageFrame, transferSyntax, pixelData, decodeConfig, options, callbackFn) {
		const start = (/* @__PURE__ */ new Date()).getTime();
		setWasmBasePathFromConfig(decodeConfig);
		let decodePromise = null;
		let opts;
		switch (transferSyntax) {
			case "1.2.840.10008.1.2":
			case "1.2.840.10008.1.2.1":
				decodePromise = decodeLittleEndian(imageFrame, pixelData);
				break;
			case "1.2.840.10008.1.2.2":
				decodePromise = decodeBigEndian(imageFrame, pixelData);
				break;
			case "1.2.840.10008.1.2.1.99":
				decodePromise = decodeLittleEndian(imageFrame, pixelData);
				break;
			case "1.2.840.10008.1.2.5":
				decodePromise = decodeRLE(imageFrame, pixelData);
				break;
			case "1.2.840.10008.1.2.4.50":
				opts = { ...imageFrame };
				decodePromise = decodeAsync$3(pixelData, opts);
				break;
			case "1.2.840.10008.1.2.4.51":
				decodePromise = decodeJPEGBaseline12BitAsync(imageFrame, pixelData);
				break;
			case "1.2.840.10008.1.2.4.57":
				decodePromise = decodeJPEGLossless(imageFrame, pixelData);
				break;
			case "1.2.840.10008.1.2.4.70":
				decodePromise = decodeJPEGLossless(imageFrame, pixelData);
				break;
			case "1.2.840.10008.1.2.4.80":
				opts = {
					signed: imageFrame.pixelRepresentation === 1,
					bytesPerPixel: imageFrame.bitsAllocated <= 8 ? 1 : 2,
					...imageFrame
				};
				decodePromise = decodeAsync$2(pixelData, opts);
				break;
			case "1.2.840.10008.1.2.4.81":
				opts = {
					signed: imageFrame.pixelRepresentation === 1,
					bytesPerPixel: imageFrame.bitsAllocated <= 8 ? 1 : 2,
					...imageFrame
				};
				decodePromise = decodeAsync$2(pixelData, opts);
				break;
			case "1.2.840.10008.1.2.4.90":
				opts = { ...imageFrame };
				decodePromise = decodeAsync$1(pixelData, opts);
				break;
			case "1.2.840.10008.1.2.4.91":
				opts = { ...imageFrame };
				decodePromise = decodeAsync$1(pixelData, opts);
				break;
			case "3.2.840.10008.1.2.4.96":
			case "1.2.840.10008.1.2.4.201":
			case "1.2.840.10008.1.2.4.202":
			case "1.2.840.10008.1.2.4.203":
				opts = { ...imageFrame };
				decodePromise = decodeAsync(pixelData, opts);
				break;
			default: throw new Error(`no decoder for transfer syntax ${transferSyntax}`);
		}
		if (!decodePromise) throw new Error("decodePromise not defined");
		const postProcessed = postProcessDecodedPixels(await decodePromise, options, start, decodeConfig);
		callbackFn?.(postProcessed);
		return postProcessed;
	}
	const obj = { decodeTask({ imageFrame, transferSyntax, decodeConfig, options, pixelData, callbackFn }) {
		return decodeImageFrame(imageFrame, transferSyntax, pixelData, decodeConfig, options, callbackFn);
	} };
	const workerEndpoint = typeof self !== "undefined" && typeof self.addEventListener === "function" && typeof self.postMessage === "function" && typeof self.document === "undefined" ? self : void 0;
	if (workerEndpoint) expose(obj, workerEndpoint);
	//#endregion
})();
