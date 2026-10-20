(function() {
	//#region ../../node_modules/.pnpm/@file-viewer+renderer-media@3.1.2/node_modules/@file-viewer/renderer-media/dist/mp4.js
	const MAX_MP4_VIDEO_SAMPLES = 1e6;
	const MAX_MP4V_DIMENSION = 8192;
	const MAX_MP4V_PIXELS = 35e6;
	const MAX_MP4V_DECODER_CONFIG_BYTES = 65536;
	const MAX_MP4V_SAMPLE_BYTES = 67108864;
	const VIDEO_CODEC_LABELS = {
		av01: "AV1 (av01)",
		avc1: "H.264/AVC (avc1)",
		avc3: "H.264/AVC (avc3)",
		hev1: "HEVC (hev1)",
		hvc1: "HEVC (hvc1)",
		mp4v: "MPEG-4 Part 2 (mp4v)",
		vp09: "VP9 (vp09)"
	};
	const readFourCc = (view, offset) => {
		if (offset < 0 || offset + 4 > view.byteLength) return "";
		return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
	};
	const readBox = (view, offset, limit) => {
		if (offset < 0 || offset + 8 > limit || limit > view.byteLength) return void 0;
		const size32 = view.getUint32(offset);
		const type = readFourCc(view, offset + 4);
		let headerSize = 8;
		let size = size32;
		if (size32 === 1) {
			if (offset + 16 > limit) return void 0;
			const high = view.getUint32(offset + 8);
			const low = view.getUint32(offset + 12);
			size = high * 4294967296 + low;
			headerSize = 16;
		} else if (size32 === 0) size = limit - offset;
		if (!type || !Number.isSafeInteger(size) || size < headerSize || offset + size > limit) return;
		return {
			type,
			start: offset,
			payloadStart: offset + headerSize,
			end: offset + size
		};
	};
	const readChildren = (view, start, end) => {
		const boxes = [];
		let offset = start;
		while (offset + 8 <= end) {
			const box = readBox(view, offset, end);
			if (!box) break;
			boxes.push(box);
			if (box.end <= offset) break;
			offset = box.end;
		}
		return boxes;
	};
	const findChild = (view, parent, type) => readChildren(view, parent.payloadStart, parent.end).find((box) => box.type === type);
	const readUint64 = (view, offset) => {
		const high = view.getUint32(offset);
		const low = view.getUint32(offset + 4);
		const value = high * 4294967296 + low;
		return Number.isSafeInteger(value) ? value : 0;
	};
	const getHandlerType = (view, mediaBox) => {
		const handlerBox = findChild(view, mediaBox, "hdlr");
		if (!handlerBox || handlerBox.payloadStart + 12 > handlerBox.end) return "";
		return readFourCc(view, handlerBox.payloadStart + 8);
	};
	const getSampleDescription = (view, mediaBox) => {
		const mediaInformationBox = findChild(view, mediaBox, "minf");
		const sampleTableBox = mediaInformationBox ? findChild(view, mediaInformationBox, "stbl") : void 0;
		const sampleDescriptionBox = sampleTableBox ? findChild(view, sampleTableBox, "stsd") : void 0;
		if (!sampleDescriptionBox || sampleDescriptionBox.payloadStart + 16 > sampleDescriptionBox.end) return;
		return readBox(view, sampleDescriptionBox.payloadStart + 8, sampleDescriptionBox.end);
	};
	const readMpeg4Descriptor = (view, offset, limit) => {
		if (offset + 2 > limit) return void 0;
		const tag = view.getUint8(offset);
		let cursor = offset + 1;
		let length = 0;
		for (let index = 0; index < 4 && cursor < limit; index += 1) {
			const value = view.getUint8(cursor);
			cursor += 1;
			length = length << 7 | value & 127;
			if ((value & 128) === 0) {
				const end = cursor + length;
				if (end > limit) return void 0;
				return {
					tag,
					payloadStart: cursor,
					end
				};
			}
		}
	};
	const readDecoderSpecificInfo = (view, sampleEntry) => {
		const visualSampleEntryHeaderSize = 78;
		if (sampleEntry.payloadStart + visualSampleEntryHeaderSize > sampleEntry.end) return;
		const esdsBox = readChildren(view, sampleEntry.payloadStart + visualSampleEntryHeaderSize, sampleEntry.end).find((box) => box.type === "esds");
		if (!esdsBox || esdsBox.payloadStart + 4 >= esdsBox.end) return void 0;
		const esDescriptor = readMpeg4Descriptor(view, esdsBox.payloadStart + 4, esdsBox.end);
		if (!esDescriptor || esDescriptor.tag !== 3 || esDescriptor.payloadStart + 3 > esDescriptor.end) return;
		const flags = view.getUint8(esDescriptor.payloadStart + 2);
		let cursor = esDescriptor.payloadStart + 3;
		if (flags & 128) cursor += 2;
		if (flags & 64) {
			if (cursor >= esDescriptor.end) return void 0;
			cursor += 1 + view.getUint8(cursor);
		}
		if (flags & 32) cursor += 2;
		const decoderConfig = readMpeg4Descriptor(view, cursor, esDescriptor.end);
		if (!decoderConfig || decoderConfig.tag !== 4) return void 0;
		cursor = decoderConfig.payloadStart + 13;
		while (cursor < decoderConfig.end) {
			const descriptor = readMpeg4Descriptor(view, cursor, decoderConfig.end);
			if (!descriptor) return void 0;
			if (descriptor.tag === 5) {
				const configSize = descriptor.end - descriptor.payloadStart;
				if (configSize <= 0 || configSize > MAX_MP4V_DECODER_CONFIG_BYTES) return;
				return new Uint8Array(view.buffer.slice(descriptor.payloadStart, descriptor.end));
			}
			cursor = descriptor.end;
		}
	};
	const getMediaTimescaleAndDuration = (view, mediaBox) => {
		const mediaHeader = findChild(view, mediaBox, "mdhd");
		if (!mediaHeader || mediaHeader.payloadStart + 20 > mediaHeader.end) return void 0;
		if (view.getUint8(mediaHeader.payloadStart) === 1) {
			if (mediaHeader.payloadStart + 32 > mediaHeader.end) return void 0;
			return {
				timescale: view.getUint32(mediaHeader.payloadStart + 20),
				duration: readUint64(view, mediaHeader.payloadStart + 24)
			};
		}
		return {
			timescale: view.getUint32(mediaHeader.payloadStart + 12),
			duration: view.getUint32(mediaHeader.payloadStart + 16)
		};
	};
	const getSampleTable = (view, mediaBox) => {
		const mediaInformationBox = findChild(view, mediaBox, "minf");
		return mediaInformationBox ? findChild(view, mediaInformationBox, "stbl") : void 0;
	};
	const readTimeToSample = (view, box, expectedSamples) => {
		if (box.payloadStart + 8 > box.end) return [];
		const count = view.getUint32(box.payloadStart + 4);
		const durations = [];
		let cursor = box.payloadStart + 8;
		for (let index = 0; index < count && cursor + 8 <= box.end; index += 1) {
			const sampleCount = view.getUint32(cursor);
			const sampleDelta = view.getUint32(cursor + 4);
			if (sampleCount === 0 || sampleDelta === 0 || durations.length + sampleCount > expectedSamples) return [];
			for (let sample = 0; sample < sampleCount; sample += 1) durations.push(sampleDelta);
			cursor += 8;
		}
		return durations.length === expectedSamples ? durations : [];
	};
	const readCompositionOffsets = (view, box, expectedSamples) => {
		if (!box || box.payloadStart + 8 > box.end) return [];
		const version = view.getUint8(box.payloadStart);
		const count = view.getUint32(box.payloadStart + 4);
		const offsets = [];
		let cursor = box.payloadStart + 8;
		for (let index = 0; index < count && cursor + 8 <= box.end; index += 1) {
			const sampleCount = view.getUint32(cursor);
			const sampleOffset = version === 1 ? view.getInt32(cursor + 4) : view.getUint32(cursor + 4);
			if (sampleCount === 0 || offsets.length + sampleCount > expectedSamples) return [];
			for (let sample = 0; sample < sampleCount; sample += 1) offsets.push(sampleOffset);
			cursor += 8;
		}
		return offsets.length === expectedSamples ? offsets : [];
	};
	const readSampleSizes = (view, box) => {
		if (box.payloadStart + 12 > box.end) return [];
		const fixedSize = view.getUint32(box.payloadStart + 4);
		const count = view.getUint32(box.payloadStart + 8);
		if (count === 0 || count > MAX_MP4_VIDEO_SAMPLES) return [];
		if (fixedSize) {
			if (fixedSize > MAX_MP4V_SAMPLE_BYTES) return [];
			return Array.from({ length: count }, () => fixedSize);
		}
		const sizes = [];
		let cursor = box.payloadStart + 12;
		for (let index = 0; index < count && cursor + 4 <= box.end; index += 1) {
			const size = view.getUint32(cursor);
			if (size === 0 || size > MAX_MP4V_SAMPLE_BYTES) return [];
			sizes.push(size);
			cursor += 4;
		}
		return sizes.length === count ? sizes : [];
	};
	const readChunkOffsets = (view, box) => {
		if (box.payloadStart + 8 > box.end) return [];
		const count = view.getUint32(box.payloadStart + 4);
		const entrySize = box.type === "co64" ? 8 : 4;
		const offsets = [];
		let cursor = box.payloadStart + 8;
		for (let index = 0; index < count && cursor + entrySize <= box.end; index += 1) {
			offsets.push(entrySize === 8 ? readUint64(view, cursor) : view.getUint32(cursor));
			cursor += entrySize;
		}
		return offsets;
	};
	const readSampleToChunk = (view, box) => {
		if (box.payloadStart + 8 > box.end) return [];
		const count = view.getUint32(box.payloadStart + 4);
		const entries = [];
		let cursor = box.payloadStart + 8;
		for (let index = 0; index < count && cursor + 12 <= box.end; index += 1) {
			const firstChunk = view.getUint32(cursor);
			const samplesPerChunk = view.getUint32(cursor + 4);
			if (firstChunk === 0 || samplesPerChunk === 0 || entries.length === 0 && firstChunk !== 1 || entries.length > 0 && firstChunk <= entries[entries.length - 1].firstChunk) return [];
			entries.push({
				firstChunk,
				samplesPerChunk
			});
			cursor += 12;
		}
		return entries;
	};
	const readSyncSamples = (view, box, sampleCount) => {
		if (!box) return void 0;
		if (box.payloadStart + 8 > box.end) return null;
		const count = view.getUint32(box.payloadStart + 4);
		if (count > sampleCount) return null;
		const samples = /* @__PURE__ */ new Set();
		let cursor = box.payloadStart + 8;
		for (let index = 0; index < count && cursor + 4 <= box.end; index += 1) {
			const sample = view.getUint32(cursor);
			if (sample === 0 || sample > sampleCount) return null;
			samples.add(sample - 1);
			cursor += 4;
		}
		return samples;
	};
	const buildSamples = (view, sampleTable) => {
		const timeToSampleBox = findChild(view, sampleTable, "stts");
		const sampleSizeBox = findChild(view, sampleTable, "stsz");
		const sampleToChunkBox = findChild(view, sampleTable, "stsc");
		const chunkOffsetBox = findChild(view, sampleTable, "stco") || findChild(view, sampleTable, "co64");
		if (!timeToSampleBox || !sampleSizeBox || !sampleToChunkBox || !chunkOffsetBox) return [];
		const sizes = readSampleSizes(view, sampleSizeBox);
		if (!sizes.length) return [];
		const durations = readTimeToSample(view, timeToSampleBox, sizes.length);
		if (!durations.length) return [];
		const compositionOffsets = readCompositionOffsets(view, findChild(view, sampleTable, "ctts"), sizes.length);
		const sampleToChunk = readSampleToChunk(view, sampleToChunkBox);
		const chunkOffsets = readChunkOffsets(view, chunkOffsetBox);
		const syncSamples = readSyncSamples(view, findChild(view, sampleTable, "stss"), sizes.length);
		if (syncSamples === null) return [];
		if (!sampleToChunk.length || !chunkOffsets.length) return [];
		const offsets = [];
		let sampleIndex = 0;
		let tableIndex = 0;
		for (let chunkIndex = 1; chunkIndex <= chunkOffsets.length && sampleIndex < sizes.length; chunkIndex += 1) {
			while (tableIndex + 1 < sampleToChunk.length && sampleToChunk[tableIndex + 1].firstChunk <= chunkIndex) tableIndex += 1;
			let offset = chunkOffsets[chunkIndex - 1];
			for (let sampleInChunk = 0; sampleInChunk < sampleToChunk[tableIndex].samplesPerChunk && sampleIndex < sizes.length; sampleInChunk += 1) {
				offsets.push(offset);
				offset += sizes[sampleIndex];
				sampleIndex += 1;
			}
		}
		if (offsets.length !== sizes.length) return [];
		let dts = 0;
		return sizes.map((size, index) => {
			const duration = durations[index] || durations[durations.length - 1] || 0;
			const sample = {
				offset: offsets[index],
				size,
				dts,
				cts: dts + (compositionOffsets[index] || 0),
				duration,
				isSync: syncSamples ? syncSamples.has(index) : true
			};
			dts += duration;
			return sample;
		});
	};
	const getCodecContentType = (codec) => {
		return `video/mp4; codecs="${codec === "mp4v" ? "mp4v.20" : codec}"`;
	};
	/**
	* Extracts the minimal MP4V decode timeline needed by the Apache-2.0
	* PacketVideo software decoder. This intentionally avoids a general-purpose
	* media framework so the fallback stays small and offline-friendly.
	*/
	const extractMp4vSoftwareTrack = (buffer) => {
		const view = new DataView(buffer);
		const movieBox = readChildren(view, 0, view.byteLength).find((box) => box.type === "moov");
		if (!movieBox) return void 0;
		for (const trackBox of readChildren(view, movieBox.payloadStart, movieBox.end)) {
			if (trackBox.type !== "trak") continue;
			const mediaBox = findChild(view, trackBox, "mdia");
			if (!mediaBox || getHandlerType(view, mediaBox) !== "vide") continue;
			const sampleEntry = getSampleDescription(view, mediaBox);
			if (!sampleEntry || sampleEntry.type !== "mp4v") return void 0;
			const dimensionsOffset = sampleEntry.payloadStart + 24;
			if (dimensionsOffset + 4 > sampleEntry.end) return void 0;
			const decoderConfig = readDecoderSpecificInfo(view, sampleEntry);
			const timing = getMediaTimescaleAndDuration(view, mediaBox);
			const sampleTable = getSampleTable(view, mediaBox);
			const width = view.getUint16(dimensionsOffset);
			const height = view.getUint16(dimensionsOffset + 2);
			if (!width || !height || width > MAX_MP4V_DIMENSION || height > MAX_MP4V_DIMENSION || width * height > MAX_MP4V_PIXELS || !(decoderConfig === null || decoderConfig === void 0 ? void 0 : decoderConfig.length) || decoderConfig.length > MAX_MP4V_DECODER_CONFIG_BYTES || !(timing === null || timing === void 0 ? void 0 : timing.timescale) || !timing.duration || !sampleTable) return void 0;
			const samples = buildSamples(view, sampleTable);
			if (!samples.length || samples.some((sample) => sample.offset < 0 || sample.size <= 0 || !Number.isSafeInteger(sample.offset + sample.size) || sample.offset + sample.size > buffer.byteLength)) return void 0;
			return {
				codec: "mp4v",
				label: VIDEO_CODEC_LABELS.mp4v,
				contentType: getCodecContentType("mp4v"),
				width,
				height,
				timescale: timing.timescale,
				duration: timing.duration,
				decoderConfig,
				samples
			};
		}
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@file-viewer+renderer-media@3.1.2/node_modules/@file-viewer/renderer-media/dist/vendor/mp4v/mp4v-decoder.mjs
	async function Module(moduleArg = {}) {
		var Module = moduleArg;
		var ENVIRONMENT_IS_WEB = !!globalThis.window;
		var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
		globalThis.process?.versions?.node && globalThis.process?.type;
		var quit_ = (status, toThrow) => {
			throw toThrow;
		};
		var _scriptName = self.location.href;
		var scriptDirectory = "";
		function locateFile(path) {
			if (Module["locateFile"]) return Module["locateFile"](path, scriptDirectory);
			return scriptDirectory + path;
		}
		var readAsync, readBinary;
		if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
			try {
				scriptDirectory = new URL(".", _scriptName).href;
			} catch {}
			if (ENVIRONMENT_IS_WORKER) readBinary = (url) => {
				var xhr = new XMLHttpRequest();
				xhr.open("GET", url, false);
				xhr.responseType = "arraybuffer";
				xhr.send(null);
				return new Uint8Array(xhr.response);
			};
			readAsync = async (url) => {
				var response = await fetch(url, { credentials: "same-origin" });
				if (response.ok) return response.arrayBuffer();
				throw new Error(response.status + " : " + response.url);
			};
		}
		console.log.bind(console);
		var err = console.error.bind(console);
		var wasmBinary;
		var ABORT = false;
		var EXITSTATUS;
		function getMemoryBuffer() {
			return wasmMemory.buffer;
		}
		function updateMemoryViews() {
			if (HEAP8?.buffer?.resizable) return;
			var b = getMemoryBuffer();
			HEAP8 = new Int8Array(b);
			Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
		}
		function preRun() {
			var preRun = Module["preRun"];
			if (preRun) {
				if (typeof preRun == "function") preRun = [preRun];
				onPreRuns.push(...preRun);
			}
			callRuntimeCallbacks(onPreRuns);
		}
		function initRuntime() {
			wasmExports["g"]();
		}
		function postRun() {
			var postRun = Module["postRun"];
			if (postRun) {
				if (typeof postRun == "function") postRun = [postRun];
				onPostRuns.push(...postRun);
			}
			callRuntimeCallbacks(onPostRuns);
		}
		function abort(what) {
			Module["onAbort"]?.(what);
			what = `Aborted(${what})`;
			err(what);
			ABORT = true;
			what += ". Build with -sASSERTIONS for more info.";
			throw new WebAssembly.RuntimeError(what);
		}
		var wasmBinaryFile;
		function findWasmBinary() {
			if (Module["locateFile"]) return locateFile("mp4v-decoder.wasm");
			return new URL("/assets/mp4v-decoder-DvQUjfaZ.wasm", "" + self.location.href).href;
		}
		function getBinarySync(file) {
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
			if (!binary) try {
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
			function receiveInstance(instance) {
				wasmExports = instance.exports;
				assignWasmExports(wasmExports);
				updateMemoryViews();
				return wasmExports;
			}
			function receiveInstantiationResult(result) {
				return receiveInstance(result["instance"]);
			}
			var info = getWasmImports();
			var instantiateWasm = Module["instantiateWasm"];
			if (instantiateWasm) return new Promise((resolve) => {
				instantiateWasm(info, (inst) => resolve(receiveInstance(inst)));
			});
			wasmBinaryFile ??= findWasmBinary();
			return receiveInstantiationResult(await instantiateAsync(wasmBinary, wasmBinaryFile, info));
		}
		class ExitStatus {
			name = "ExitStatus";
			constructor(status) {
				this.message = `Program terminated with exit(${status})`;
				this.status = status;
			}
		}
		var HEAP8;
		var callRuntimeCallbacks = (callbacks) => {
			while (callbacks.length > 0) callbacks.shift()(Module);
		};
		var onPostRuns = [];
		var onPreRuns = [];
		var noExitRuntime = true;
		var __abort_js = () => abort("");
		var runtimeKeepaliveCounter = 0;
		var __emscripten_runtime_keepalive_clear = () => {
			noExitRuntime = false;
			runtimeKeepaliveCounter = 0;
		};
		var timers = {};
		var handleException = (e) => {
			if (e instanceof ExitStatus || e == "unwind") return EXITSTATUS;
			quit_(1, e);
		};
		var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
		var _proc_exit = (code) => {
			EXITSTATUS = code;
			if (!keepRuntimeAlive()) {
				Module["onExit"]?.(code);
				ABORT = true;
			}
			quit_(code, new ExitStatus(code));
		};
		var exitJS = (status, implicit) => {
			EXITSTATUS = status;
			_proc_exit(status);
		};
		var _exit = exitJS;
		var maybeExit = () => {
			if (!keepRuntimeAlive()) try {
				_exit(EXITSTATUS);
			} catch (e) {
				handleException(e);
			}
		};
		var callUserCallback = (func) => {
			if (ABORT) return;
			try {
				return func();
			} catch (e) {
				handleException(e);
			} finally {
				maybeExit();
			}
		};
		var _emscripten_get_now = () => performance.now();
		var __setitimer_js = (which, timeout_ms) => {
			if (timers[which]) {
				clearTimeout(timers[which].id);
				delete timers[which];
			}
			if (!timeout_ms) return 0;
			timers[which] = {
				id: setTimeout(() => {
					delete timers[which];
					callUserCallback(() => __emscripten_timeout(which, _emscripten_get_now()));
				}, timeout_ms),
				timeout_ms
			};
			return 0;
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
		var HEAPU8;
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
		if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
		if (Module["print"]) Module["print"];
		if (Module["printErr"]) err = Module["printErr"];
		if (Module["arguments"]) Module["arguments"];
		if (Module["thisProgram"]) Module["thisProgram"];
		var preInit = Module["preInit"];
		if (preInit) {
			if (typeof preInit == "function") Module["preInit"] = preInit = [preInit];
			while (preInit.length > 0) preInit.shift()();
		}
		var __emscripten_timeout, wasmMemory;
		function assignWasmExports(wasmExports) {
			Module["_mp4v_create"] = wasmExports["h"];
			Module["_free"] = wasmExports["i"];
			Module["_malloc"] = wasmExports["j"];
			Module["_mp4v_decode"] = wasmExports["k"];
			Module["_mp4v_reset"] = wasmExports["l"];
			Module["_mp4v_output"] = wasmExports["m"];
			Module["_mp4v_width"] = wasmExports["n"];
			Module["_mp4v_height"] = wasmExports["o"];
			Module["_mp4v_buffer_width"] = wasmExports["p"];
			Module["_mp4v_buffer_height"] = wasmExports["q"];
			Module["_mp4v_destroy"] = wasmExports["r"];
			__emscripten_timeout = wasmExports["s"];
			wasmMemory = wasmExports["f"];
			wasmExports["__indirect_function_table"];
		}
		var wasmImports = {
			d: __abort_js,
			c: __emscripten_runtime_keepalive_clear,
			a: __setitimer_js,
			e: _emscripten_resize_heap,
			b: _proc_exit
		};
		async function run() {
			preRun();
			var setStatus = Module["setStatus"];
			if (setStatus) {
				setStatus("Running...");
				await new Promise((resolve) => setTimeout(resolve, 1));
				setTimeout(setStatus, 1, "");
			}
			if (ABORT) return;
			initRuntime();
			Module["onRuntimeInitialized"]?.();
			postRun();
		}
		var wasmExports = await createWasm();
		await run();
		return Module;
	}
	//#endregion
	//#region ../../node_modules/.pnpm/@file-viewer+renderer-media@3.1.2/node_modules/@file-viewer/renderer-media/dist/mp4v.worker.js
	const scope = self;
	let sourceBuffer;
	let track;
	let canvasContext = null;
	let module;
	let decoder = 0;
	let packetPointer = 0;
	let packetCapacity = 0;
	let decodedIndex = -1;
	let playing = false;
	let clockMediaTime = 0;
	let clockStartedAt = 0;
	let scheduleId;
	let disposed = false;
	const getSampleTime = (sample) => track ? sample.cts / track.timescale : 0;
	const findTargetSample = (time) => {
		if (!(track === null || track === void 0 ? void 0 : track.samples.length)) return -1;
		const target = Math.max(0, time) * track.timescale;
		let low = 0;
		let high = track.samples.length - 1;
		let result = 0;
		while (low <= high) {
			const middle = low + high >> 1;
			if (track.samples[middle].cts <= target) {
				result = middle;
				low = middle + 1;
			} else high = middle - 1;
		}
		return result;
	};
	const findSyncSample = (target) => {
		if (!track) return 0;
		for (let index = Math.min(target, track.samples.length - 1); index > 0; index -= 1) if (track.samples[index].isSync) return index;
		return 0;
	};
	const resetDecoder = (target) => {
		if (!module || !decoder || !module._mp4v_reset(decoder)) throw new Error("Unable to reset the MP4V software decoder.");
		decodedIndex = findSyncSample(target) - 1;
	};
	const drawDecodedFrame = (sample) => {
		if (!module || !decoder || !canvasContext) return;
		const output = module._mp4v_output(decoder);
		const width = module._mp4v_width(decoder);
		const height = module._mp4v_height(decoder);
		const bufferWidth = module._mp4v_buffer_width(decoder);
		const bufferHeight = module._mp4v_buffer_height(decoder);
		if (!output || !width || !height || !bufferWidth || !bufferHeight) throw new Error("The MP4V decoder returned an empty video frame.");
		const ySize = bufferWidth * bufferHeight;
		const frameSize = ySize * 3 / 2;
		const frame = new VideoFrame(module.HEAPU8.subarray(output, output + frameSize), {
			format: "I420",
			codedWidth: bufferWidth,
			codedHeight: bufferHeight,
			visibleRect: {
				x: 0,
				y: 0,
				width,
				height
			},
			displayWidth: width,
			displayHeight: height,
			timestamp: Math.round(getSampleTime(sample) * 1e6),
			layout: [
				{
					offset: 0,
					stride: bufferWidth
				},
				{
					offset: ySize,
					stride: bufferWidth / 2
				},
				{
					offset: ySize * 5 / 4,
					stride: bufferWidth / 2
				}
			]
		});
		canvasContext.drawImage(frame, 0, 0, width, height);
		frame.close();
	};
	const decodeTo = (target) => {
		if (!track || !module || !decoder || !sourceBuffer || target < 0) return;
		if (target < decodedIndex || target - decodedIndex > 240) resetDecoder(target);
		const startedAt = performance.now();
		for (let index = decodedIndex + 1; index <= target; index += 1) {
			const sample = track.samples[index];
			module.HEAPU8.set(new Uint8Array(sourceBuffer, sample.offset, sample.size), packetPointer);
			if (!module._mp4v_decode(decoder, packetPointer, sample.size, sample.dts)) throw new Error(`MP4V frame ${index + 1} could not be decoded.`);
			decodedIndex = index;
		}
		const sample = track.samples[decodedIndex];
		drawDecodedFrame(sample);
		scope.postMessage({
			type: "frame",
			index: decodedIndex,
			time: getSampleTime(sample),
			decodeMs: Math.round((performance.now() - startedAt) * 10) / 10
		});
	};
	const stopScheduler = () => {
		if (scheduleId !== void 0) clearTimeout(scheduleId);
		scheduleId = void 0;
	};
	const getClockTime = () => playing ? clockMediaTime + (performance.now() - clockStartedAt) / 1e3 : clockMediaTime;
	const schedulePlayback = () => {
		stopScheduler();
		if (!playing || !track || disposed) return;
		const time = getClockTime();
		const target = findTargetSample(time);
		decodeTo(target);
		const next = track.samples[Math.min(target + 1, track.samples.length - 1)];
		const delay = Math.max(4, Math.min(50, (getSampleTime(next) - getClockTime()) * 1e3));
		scheduleId = setTimeout(schedulePlayback, delay);
	};
	const updateClock = (time, shouldPlay) => {
		clockMediaTime = Math.max(0, time);
		clockStartedAt = performance.now();
		playing = shouldPlay;
	};
	const initialize = async (message) => {
		if (typeof VideoFrame === "undefined") throw new Error("This browser does not expose raw VideoFrame rendering.");
		sourceBuffer = message.buffer;
		track = extractMp4vSoftwareTrack(sourceBuffer);
		if (!track) throw new Error("The MP4V track could not be extracted from this MP4 file.");
		message.canvas.width = track.width;
		message.canvas.height = track.height;
		canvasContext = message.canvas.getContext("2d", {
			alpha: false,
			desynchronized: true
		});
		if (!canvasContext) throw new Error("OffscreenCanvas 2D rendering is unavailable.");
		module = await Module();
		const configPointer = module._malloc(track.decoderConfig.length);
		if (!configPointer) throw new Error("The MP4V decoder could not allocate its configuration.");
		try {
			module.HEAPU8.set(track.decoderConfig, configPointer);
			decoder = module._mp4v_create(configPointer, track.decoderConfig.length, track.width, track.height);
		} finally {
			module._free(configPointer);
		}
		if (!decoder) throw new Error("The Apache-2.0 MP4V decoder rejected this stream.");
		packetCapacity = track.samples.reduce((maximum, sample) => Math.max(maximum, sample.size), 0);
		packetPointer = module._malloc(packetCapacity);
		if (!packetPointer) throw new Error("The MP4V decoder could not allocate its packet buffer.");
		decodeTo(0);
		scope.postMessage({
			type: "ready",
			width: track.width,
			height: track.height,
			duration: track.duration / track.timescale,
			frames: track.samples.length
		});
	};
	const dispose = () => {
		if (disposed) return;
		disposed = true;
		stopScheduler();
		if (module && packetPointer) module._free(packetPointer);
		if (module && decoder) module._mp4v_destroy(decoder);
		packetPointer = 0;
		decoder = 0;
		sourceBuffer = void 0;
		track = void 0;
		canvasContext = null;
	};
	scope.onmessage = (event) => {
		const message = event.data;
		Promise.resolve().then(async () => {
			if (message.type === "init") {
				await initialize(message);
				return;
			}
			if (message.type === "dispose") {
				dispose();
				scope.close();
				return;
			}
			if (!track) return;
			if (message.type === "play") {
				updateClock(message.time, true);
				schedulePlayback();
				return;
			}
			if (message.type === "pause") {
				updateClock(message.time, false);
				stopScheduler();
				decodeTo(findTargetSample(message.time));
				return;
			}
			if (message.type === "seek") {
				updateClock(message.time, playing);
				decodeTo(findTargetSample(message.time));
				if (playing) schedulePlayback();
				return;
			}
			if (message.type === "sync") {
				const drift = Math.abs(getClockTime() - message.time);
				updateClock(message.time, playing);
				if (!playing || drift > .08) decodeTo(findTargetSample(message.time));
				if (playing) schedulePlayback();
			}
		}).catch((error) => {
			scope.postMessage({
				type: "error",
				message: error instanceof Error ? error.message : String(error)
			});
			dispose();
		});
	};
	//#endregion
})();
