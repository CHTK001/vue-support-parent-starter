(function() {
	//#region \0rolldown/runtime.js
	var __defProp = Object.defineProperty;
	var __esmMin = (fn, res, err) => () => {
		if (err) throw err[0];
		try {
			return fn && (res = fn(fn = 0)), res;
		} catch (e) {
			throw err = [e], e;
		}
	};
	var __exportAll = (all, no_symbols) => {
		let target = {};
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
		if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
		return target;
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/rpgp-wasm/rpgp_wrapper.js
	var rpgp_wrapper_exports = /* @__PURE__ */ __exportAll({
		classify_openpgp: () => classify_openpgp,
		default: () => __wbg_init,
		initSync: () => initSync,
		inspect_openpgp: () => inspect_openpgp,
		verify_detached_signature: () => verify_detached_signature
	});
	/**
	* @param {Uint8Array} input
	* @param {any} limits
	* @returns {any}
	*/
	function classify_openpgp(input, limits) {
		try {
			const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
			const ptr0 = passArray8ToWasm0(input, wasm.__wbindgen_export);
			const len0 = WASM_VECTOR_LEN;
			wasm.classify_openpgp(retptr, ptr0, len0, addHeapObject(limits));
			var r0 = getDataViewMemory0().getInt32(retptr + 0, true);
			var r1 = getDataViewMemory0().getInt32(retptr + 4, true);
			if (getDataViewMemory0().getInt32(retptr + 8, true)) throw takeObject(r1);
			return takeObject(r0);
		} finally {
			wasm.__wbindgen_add_to_stack_pointer(16);
		}
	}
	/**
	* @param {Uint8Array} input
	* @param {any} public_keys
	* @param {any} limits
	* @returns {any}
	*/
	function inspect_openpgp(input, public_keys, limits) {
		try {
			const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
			const ptr0 = passArray8ToWasm0(input, wasm.__wbindgen_export);
			const len0 = WASM_VECTOR_LEN;
			wasm.inspect_openpgp(retptr, ptr0, len0, addHeapObject(public_keys), addHeapObject(limits));
			var r0 = getDataViewMemory0().getInt32(retptr + 0, true);
			var r1 = getDataViewMemory0().getInt32(retptr + 4, true);
			if (getDataViewMemory0().getInt32(retptr + 8, true)) throw takeObject(r1);
			return takeObject(r0);
		} finally {
			wasm.__wbindgen_add_to_stack_pointer(16);
		}
	}
	/**
	* @param {Uint8Array} content
	* @param {Uint8Array} signature
	* @param {any} public_keys
	* @param {any} limits
	* @returns {any}
	*/
	function verify_detached_signature(content, signature, public_keys, limits) {
		try {
			const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
			const ptr0 = passArray8ToWasm0(content, wasm.__wbindgen_export);
			const len0 = WASM_VECTOR_LEN;
			const ptr1 = passArray8ToWasm0(signature, wasm.__wbindgen_export);
			const len1 = WASM_VECTOR_LEN;
			wasm.verify_detached_signature(retptr, ptr0, len0, ptr1, len1, addHeapObject(public_keys), addHeapObject(limits));
			var r0 = getDataViewMemory0().getInt32(retptr + 0, true);
			var r1 = getDataViewMemory0().getInt32(retptr + 4, true);
			if (getDataViewMemory0().getInt32(retptr + 8, true)) throw takeObject(r1);
			return takeObject(r0);
		} finally {
			wasm.__wbindgen_add_to_stack_pointer(16);
		}
	}
	function __wbg_get_imports() {
		return {
			__proto__: null,
			"./rpgp_wrapper_bg.js": {
				__proto__: null,
				__wbg_Error_408e67f47ca7b58b: function(arg0, arg1) {
					return addHeapObject(Error(getStringFromWasm0(arg0, arg1)));
				},
				__wbg_Number_3890faa6d3ff057d: function(arg0) {
					return Number(getObject(arg0));
				},
				__wbg_String_8564e559799eccda: function(arg0, arg1) {
					const ptr1 = passStringToWasm0(String(getObject(arg1)), wasm.__wbindgen_export, wasm.__wbindgen_export2);
					const len1 = WASM_VECTOR_LEN;
					getDataViewMemory0().setInt32(arg0 + 4, len1, true);
					getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
				},
				__wbg___wbindgen_bigint_get_as_i64_c4ecf48528083721: function(arg0, arg1) {
					const v = getObject(arg1);
					const ret = typeof v === "bigint" ? v : void 0;
					getDataViewMemory0().setBigInt64(arg0 + 8, isLikeNone(ret) ? BigInt(0) : ret, true);
					getDataViewMemory0().setInt32(arg0 + 0, !isLikeNone(ret), true);
				},
				__wbg___wbindgen_boolean_get_c9c83ebd41b34df3: function(arg0) {
					const v = getObject(arg0);
					const ret = typeof v === "boolean" ? v : void 0;
					return isLikeNone(ret) ? 16777215 : ret ? 1 : 0;
				},
				__wbg___wbindgen_debug_string_a57024b9c6e4a48b: function(arg0, arg1) {
					const ptr1 = passStringToWasm0(debugString(getObject(arg1)), wasm.__wbindgen_export, wasm.__wbindgen_export2);
					const len1 = WASM_VECTOR_LEN;
					getDataViewMemory0().setInt32(arg0 + 4, len1, true);
					getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
				},
				__wbg___wbindgen_in_ac983077f137f2e6: function(arg0, arg1) {
					return getObject(arg0) in getObject(arg1);
				},
				__wbg___wbindgen_is_bigint_8ffbbef442139384: function(arg0) {
					return typeof getObject(arg0) === "bigint";
				},
				__wbg___wbindgen_is_function_5e4570eb24ffa122: function(arg0) {
					return typeof getObject(arg0) === "function";
				},
				__wbg___wbindgen_is_object_a2790eb24c211ea0: function(arg0) {
					const val = getObject(arg0);
					return typeof val === "object" && val !== null;
				},
				__wbg___wbindgen_is_undefined_6cff064c44e0d823: function(arg0) {
					return getObject(arg0) === void 0;
				},
				__wbg___wbindgen_jsval_eq_0a18949a61670320: function(arg0, arg1) {
					return getObject(arg0) === getObject(arg1);
				},
				__wbg___wbindgen_jsval_loose_eq_acf2776254a8d832: function(arg0, arg1) {
					return getObject(arg0) == getObject(arg1);
				},
				__wbg___wbindgen_number_get_136b9679cab35cfb: function(arg0, arg1) {
					const obj = getObject(arg1);
					const ret = typeof obj === "number" ? obj : void 0;
					getDataViewMemory0().setFloat64(arg0 + 8, isLikeNone(ret) ? 0 : ret, true);
					getDataViewMemory0().setInt32(arg0 + 0, !isLikeNone(ret), true);
				},
				__wbg___wbindgen_string_get_d154f1e671052120: function(arg0, arg1) {
					const obj = getObject(arg1);
					const ret = typeof obj === "string" ? obj : void 0;
					var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
					var len1 = WASM_VECTOR_LEN;
					getDataViewMemory0().setInt32(arg0 + 4, len1, true);
					getDataViewMemory0().setInt32(arg0 + 0, ptr1, true);
				},
				__wbg___wbindgen_throw_bb96b2010945f0bc: function(arg0, arg1) {
					throw new Error(getStringFromWasm0(arg0, arg1));
				},
				__wbg_call_1c5886ab9c57d1c7: function() {
					return handleError(function(arg0, arg1) {
						return addHeapObject(getObject(arg0).call(getObject(arg1)));
					}, arguments);
				},
				__wbg_done_669171204c3dcae2: function(arg0) {
					return getObject(arg0).done;
				},
				__wbg_get_d173c0308df22d37: function() {
					return handleError(function(arg0, arg1) {
						return addHeapObject(Reflect.get(getObject(arg0), getObject(arg1)));
					}, arguments);
				},
				__wbg_get_unchecked_e20b893aeafc3fca: function(arg0, arg1) {
					const ret = getObject(arg0)[arg1 >>> 0];
					return addHeapObject(ret);
				},
				__wbg_get_with_ref_key_6412cf3094599694: function(arg0, arg1) {
					const ret = getObject(arg0)[getObject(arg1)];
					return addHeapObject(ret);
				},
				__wbg_instanceof_ArrayBuffer_993d02d2d254cad1: function(arg0) {
					let result;
					try {
						result = getObject(arg0) instanceof ArrayBuffer;
					} catch (_) {
						result = false;
					}
					return result;
				},
				__wbg_instanceof_Uint8Array_f935dbb0aa7cdeed: function(arg0) {
					let result;
					try {
						result = getObject(arg0) instanceof Uint8Array;
					} catch (_) {
						result = false;
					}
					return result;
				},
				__wbg_isArray_6339f732981044bf: function(arg0) {
					return Array.isArray(getObject(arg0));
				},
				__wbg_isSafeInteger_f3d6cd19ccfe4512: function(arg0) {
					return Number.isSafeInteger(getObject(arg0));
				},
				__wbg_iterator_5cebbb86e33c6dd6: function() {
					const ret = Symbol.iterator;
					return addHeapObject(ret);
				},
				__wbg_length_36bd29c6848c2144: function(arg0) {
					return getObject(arg0).length;
				},
				__wbg_length_ecfa2c63d3d0d82c: function(arg0) {
					return getObject(arg0).length;
				},
				__wbg_new_116be93542d39019: function() {
					return addHeapObject(new Array());
				},
				__wbg_new_77cc4f4f472aeb81: function(arg0) {
					return addHeapObject(new Uint8Array(getObject(arg0)));
				},
				__wbg_new_ebe3e0f6837f0879: function() {
					return addHeapObject(/* @__PURE__ */ new Object());
				},
				__wbg_next_42cf16ee0dafc9e2: function() {
					return handleError(function(arg0) {
						return addHeapObject(getObject(arg0).next());
					}, arguments);
				},
				__wbg_next_8f26b64fa5e9f64b: function(arg0) {
					const ret = getObject(arg0).next;
					return addHeapObject(ret);
				},
				__wbg_prototypesetcall_de8e0d9553586985: function(arg0, arg1, arg2) {
					Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), getObject(arg2));
				},
				__wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
					getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
				},
				__wbg_set_a80955eb93b145c6: function(arg0, arg1, arg2) {
					getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
				},
				__wbg_value_1e2369fab29b420e: function(arg0) {
					const ret = getObject(arg0).value;
					return addHeapObject(ret);
				},
				__wbindgen_cast_0000000000000001: function(arg0) {
					return addHeapObject(arg0);
				},
				__wbindgen_cast_0000000000000002: function(arg0, arg1) {
					return addHeapObject(getStringFromWasm0(arg0, arg1));
				},
				__wbindgen_cast_0000000000000003: function(arg0) {
					return addHeapObject(BigInt.asUintN(64, arg0));
				},
				__wbindgen_object_clone_ref: function(arg0) {
					return addHeapObject(getObject(arg0));
				},
				__wbindgen_object_drop_ref: function(arg0) {
					takeObject(arg0);
				}
			}
		};
	}
	function addHeapObject(obj) {
		if (heap_next === heap.length) heap.push(heap.length + 1);
		const idx = heap_next;
		heap_next = heap[idx];
		heap[idx] = obj;
		return idx;
	}
	function debugString(val) {
		const type = typeof val;
		if (type == "number" || type == "boolean" || val == null) return `${val}`;
		if (type == "string") return `"${val}"`;
		if (type == "symbol") {
			const description = val.description;
			if (description == null) return "Symbol";
			else return `Symbol(${description})`;
		}
		if (type == "function") {
			const name = val.name;
			if (typeof name == "string" && name.length > 0) return `Function(${name})`;
			else return "Function";
		}
		if (Array.isArray(val)) {
			const length = val.length;
			let debug = "[";
			if (length > 0) debug += debugString(val[0]);
			for (let i = 1; i < length; i++) debug += ", " + debugString(val[i]);
			debug += "]";
			return debug;
		}
		const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
		let className;
		if (builtInMatches && builtInMatches.length > 1) className = builtInMatches[1];
		else return toString.call(val);
		if (className == "Object") try {
			return "Object(" + JSON.stringify(val) + ")";
		} catch (_) {
			return "Object";
		}
		if (val instanceof Error) return `${val.name}: ${val.message}\n${val.stack}`;
		return className;
	}
	function dropObject(idx) {
		if (idx < 1028) return;
		heap[idx] = heap_next;
		heap_next = idx;
	}
	function getArrayU8FromWasm0(ptr, len) {
		ptr = ptr >>> 0;
		return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
	}
	function getDataViewMemory0() {
		if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
		return cachedDataViewMemory0;
	}
	function getStringFromWasm0(ptr, len) {
		return decodeText(ptr >>> 0, len);
	}
	function getUint8ArrayMemory0() {
		if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
		return cachedUint8ArrayMemory0;
	}
	function getObject(idx) {
		return heap[idx];
	}
	function handleError(f, args) {
		try {
			return f.apply(this, args);
		} catch (e) {
			wasm.__wbindgen_export3(addHeapObject(e));
		}
	}
	function isLikeNone(x) {
		return x === void 0 || x === null;
	}
	function passArray8ToWasm0(arg, malloc) {
		const ptr = malloc(arg.length * 1, 1) >>> 0;
		getUint8ArrayMemory0().set(arg, ptr / 1);
		WASM_VECTOR_LEN = arg.length;
		return ptr;
	}
	function passStringToWasm0(arg, malloc, realloc) {
		if (realloc === void 0) {
			const buf = cachedTextEncoder.encode(arg);
			const ptr = malloc(buf.length, 1) >>> 0;
			getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
			WASM_VECTOR_LEN = buf.length;
			return ptr;
		}
		let len = arg.length;
		let ptr = malloc(len, 1) >>> 0;
		const mem = getUint8ArrayMemory0();
		let offset = 0;
		for (; offset < len; offset++) {
			const code = arg.charCodeAt(offset);
			if (code > 127) break;
			mem[ptr + offset] = code;
		}
		if (offset !== len) {
			if (offset !== 0) arg = arg.slice(offset);
			ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
			const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
			const ret = cachedTextEncoder.encodeInto(arg, view);
			offset += ret.written;
			ptr = realloc(ptr, len, offset, 1) >>> 0;
		}
		WASM_VECTOR_LEN = offset;
		return ptr;
	}
	function takeObject(idx) {
		const ret = getObject(idx);
		dropObject(idx);
		return ret;
	}
	function decodeText(ptr, len) {
		numBytesDecoded += len;
		if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
			cachedTextDecoder = new TextDecoder("utf-8", {
				ignoreBOM: true,
				fatal: true
			});
			cachedTextDecoder.decode();
			numBytesDecoded = len;
		}
		return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
	}
	function __wbg_finalize_init(instance, module) {
		wasm = instance.exports;
		cachedDataViewMemory0 = null;
		cachedUint8ArrayMemory0 = null;
		return wasm;
	}
	async function __wbg_load(module, imports) {
		if (typeof Response === "function" && module instanceof Response) {
			if (!module.ok) throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
			if (typeof WebAssembly.instantiateStreaming === "function") try {
				return await WebAssembly.instantiateStreaming(module, imports);
			} catch (e) {
				if (expectedResponseType(module.type) && module.headers.get("Content-Type") !== "application/wasm") console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
				else throw e;
			}
			const bytes = await module.arrayBuffer();
			return await WebAssembly.instantiate(bytes, imports);
		} else {
			const instance = await WebAssembly.instantiate(module, imports);
			if (instance instanceof WebAssembly.Instance) return {
				instance,
				module
			};
			else return instance;
		}
		function expectedResponseType(type) {
			switch (type) {
				case "basic":
				case "cors":
				case "default": return true;
			}
			return false;
		}
	}
	function initSync(module) {
		if (wasm !== void 0) return wasm;
		if (module !== void 0) if (Object.getPrototypeOf(module) === Object.prototype) ({module} = module);
		else console.warn("using deprecated parameters for `initSync()`; pass a single object instead");
		const imports = __wbg_get_imports();
		if (!(module instanceof WebAssembly.Module)) module = new WebAssembly.Module(module);
		return __wbg_finalize_init(new WebAssembly.Instance(module, imports), module);
	}
	async function __wbg_init(module_or_path) {
		if (wasm !== void 0) return wasm;
		if (module_or_path !== void 0) if (Object.getPrototypeOf(module_or_path) === Object.prototype) ({module_or_path} = module_or_path);
		else console.warn("using deprecated parameters for the initialization function; pass a single object instead");
		if (module_or_path === void 0) module_or_path = new URL("/assets/rpgp_wrapper_bg-BXm6iG2j.wasm", "" + self.location.href);
		const imports = __wbg_get_imports();
		if (typeof module_or_path === "string" || typeof Request === "function" && module_or_path instanceof Request || typeof URL === "function" && module_or_path instanceof URL) module_or_path = fetch(module_or_path);
		const { instance, module } = await __wbg_load(await module_or_path, imports);
		return __wbg_finalize_init(instance, module);
	}
	var cachedDataViewMemory0, cachedUint8ArrayMemory0, heap, heap_next, cachedTextDecoder, MAX_SAFARI_DECODE_BYTES, numBytesDecoded, cachedTextEncoder, WASM_VECTOR_LEN, wasm;
	var init_rpgp_wrapper = __esmMin((() => {
		cachedDataViewMemory0 = null;
		cachedUint8ArrayMemory0 = null;
		heap = new Array(1024).fill(void 0);
		heap.push(void 0, null, true, false);
		heap_next = heap.length;
		cachedTextDecoder = new TextDecoder("utf-8", {
			ignoreBOM: true,
			fatal: true
		});
		cachedTextDecoder.decode();
		MAX_SAFARI_DECODE_BYTES = 2146435072;
		numBytesDecoded = 0;
		cachedTextEncoder = new TextEncoder();
		if (!("encodeInto" in cachedTextEncoder)) cachedTextEncoder.encodeInto = function(arg, view) {
			const buf = cachedTextEncoder.encode(arg);
			view.set(buf);
			return {
				read: arg.length,
				written: buf.length
			};
		};
		WASM_VECTOR_LEN = 0;
	}));
	//#endregion
	//#region ../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/signature.worker.js
	const scope = self;
	let wasmPromise;
	const loadWasm = async () => {
		if (wasmPromise) return wasmPromise;
		wasmPromise = (async () => {
			try {
				const wasmUrl = new URL("/assets/rpgp_wrapper_bg-BXm6iG2j.wasm", "" + self.location.href);
				const module = await Promise.resolve().then(() => (init_rpgp_wrapper(), rpgp_wrapper_exports));
				await module.default({ module_or_path: wasmUrl });
				return module;
			} catch (error) {
				wasmPromise = void 0;
				throw Object.assign(new Error(error instanceof Error ? error.message : String(error)), { code: "wasm-initialization-failed" });
			}
		})();
		return wasmPromise;
	};
	const errorResponse = (id, error) => ({
		id,
		ok: false,
		error: {
			code: typeof error === "object" && error && "code" in error ? String(error.code) : "internal-parser-error",
			message: error instanceof Error ? error.message : String(error)
		}
	});
	const normalizeInspectionResult = (value) => {
		const result = value;
		if (result.literalData && !(result.literalData.data instanceof Uint8Array)) result.literalData.data = Uint8Array.from(result.literalData.data);
		return result;
	};
	scope.addEventListener("message", async (event) => {
		const request = event.data;
		if (!request || typeof request.id !== "string" || ![
			"classify",
			"inspect",
			"verify-detached"
		].includes(request.type)) {
			scope.postMessage(errorResponse(typeof (request === null || request === void 0 ? void 0 : request.id) === "string" ? request.id : "unknown", Object.assign(/* @__PURE__ */ new Error("Invalid signature Worker request."), { code: "invalid-input" })));
			return;
		}
		try {
			if ((request.type === "classify" || request.type === "inspect") && !(request.input instanceof ArrayBuffer)) throw Object.assign(/* @__PURE__ */ new Error("Signature Worker input must be an ArrayBuffer."), { code: "invalid-input" });
			if (request.type === "inspect" && (!Array.isArray(request.publicKeys) || !request.publicKeys.every((value) => value instanceof ArrayBuffer))) throw Object.assign(/* @__PURE__ */ new Error("OpenPGP inspection public keys are malformed."), { code: "invalid-input" });
			if (request.type === "verify-detached" && (!(request.content instanceof ArrayBuffer) || !(request.signature instanceof ArrayBuffer) || !Array.isArray(request.publicKeys) || !request.publicKeys.every((value) => value instanceof ArrayBuffer))) throw Object.assign(/* @__PURE__ */ new Error("Detached verification request is malformed."), { code: "invalid-input" });
			const wasm = await loadWasm();
			let response;
			switch (request.type) {
				case "classify":
					response = {
						id: request.id,
						ok: true,
						type: "classify",
						result: wasm.classify_openpgp(new Uint8Array(request.input), request.limits)
					};
					break;
				case "inspect":
					response = {
						id: request.id,
						ok: true,
						type: "inspect",
						result: normalizeInspectionResult(wasm.inspect_openpgp(new Uint8Array(request.input), request.publicKeys.map((value) => new Uint8Array(value)), request.limits))
					};
					break;
				case "verify-detached":
					response = {
						id: request.id,
						ok: true,
						type: "verify-detached",
						result: wasm.verify_detached_signature(new Uint8Array(request.content), new Uint8Array(request.signature), request.publicKeys.map((value) => new Uint8Array(value)), request.limits)
					};
					break;
				default: throw Object.assign(/* @__PURE__ */ new Error("Unknown signature Worker request."), { code: "invalid-input" });
			}
			scope.postMessage(response);
		} catch (error) {
			scope.postMessage(errorResponse(request.id, error));
		}
	});
	//#endregion
})();
