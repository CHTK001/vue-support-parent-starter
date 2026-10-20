(function() {
	//#region ../../node_modules/.pnpm/@file-viewer+renderer-binary@3.1.2/node_modules/@file-viewer/renderer-binary/dist/parser.js
	const hex = (value) => `0x${value.toString(16).toUpperCase()}`;
	const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
	const has = (bytes, offset, width) => offset >= 0 && width >= 0 && offset + width <= bytes.byteLength;
	const end = (bytes, offset, width) => clamp(offset + width, 0, bytes.byteLength);
	const starts = (bytes, signature, offset = 0) => has(bytes, offset, signature.length) && signature.every((value, index) => bytes[offset + index] === value);
	const checkBudget = (state) => {
		if (Date.now() - state.startedAt > state.limits.maxParseMilliseconds) throw new Error(`Binary structure parsing exceeded ${state.limits.maxParseMilliseconds}ms.`);
	};
	const add = (parent, bytes, state, depth, name, type, offset, width, value) => {
		checkBudget(state);
		if (depth > state.limits.maxStructureDepth || state.nodes >= state.limits.maxStructureNodes) return void 0;
		const child = {
			name,
			type,
			start: clamp(offset, 0, bytes.byteLength),
			end: end(bytes, offset, width),
			...value === void 0 ? {} : { value }
		};
		parent.children ??= [];
		parent.children.push(child);
		state.nodes += 1;
		return child;
	};
	const u16 = (view, bytes, offset, littleEndian) => has(bytes, offset, 2) ? view.getUint16(offset, littleEndian) : void 0;
	const u32 = (view, bytes, offset, littleEndian) => has(bytes, offset, 4) ? view.getUint32(offset, littleEndian) : void 0;
	const u64 = (view, bytes, offset, littleEndian) => has(bytes, offset, 8) ? view.getBigUint64(offset, littleEndian) : void 0;
	const field = (parent, bytes, state, name, type, offset, width, value) => add(parent, bytes, state, 1, name, type, offset, width, value);
	const inspectPng = (bytes, view, state, root) => {
		field(root, bytes, state, "PNG signature", "bytes", 0, 8, "89 50 4E 47 0D 0A 1A 0A");
		const length = u32(view, bytes, 8, false);
		if (length !== void 0) field(root, bytes, state, "Chunk length", "u32be", 8, 4, String(length));
		const kind = has(bytes, 12, 4) ? String.fromCharCode(...bytes.slice(12, 16)) : void 0;
		if (kind) field(root, bytes, state, "Chunk type", "ascii", 12, 4, kind);
		if (kind === "IHDR" && length !== void 0 && length >= 13 && has(bytes, 16, 13)) {
			const header = add(root, bytes, state, 1, "IHDR", "structure", 16, 13);
			if (!header) return;
			const width = u32(view, bytes, 16, false);
			const height = u32(view, bytes, 20, false);
			if (width !== void 0) field(header, bytes, state, "Width", "u32be", 16, 4, String(width));
			if (height !== void 0) field(header, bytes, state, "Height", "u32be", 20, 4, String(height));
			field(header, bytes, state, "Bit depth", "u8", 24, 1, String(bytes[24]));
			field(header, bytes, state, "Color type", "u8", 25, 1, String(bytes[25]));
		}
	};
	const inspectWasm = (bytes, view, state, root) => {
		field(root, bytes, state, "WASM magic", "bytes", 0, 4, "00 61 73 6D");
		const version = u32(view, bytes, 4, true);
		if (version !== void 0) field(root, bytes, state, "Version", "u32le", 4, 4, String(version));
	};
	const inspectElf = (bytes, view, state, root) => {
		field(root, bytes, state, "ELF magic", "bytes", 0, 4, "7F 45 4C 46");
		const elfClass = bytes[4] === 2 ? "ELF64" : bytes[4] === 1 ? "ELF32" : "unknown";
		const littleEndian = bytes[5] !== 2;
		field(root, bytes, state, "Class", "u8", 4, 1, elfClass);
		field(root, bytes, state, "Data encoding", "u8", 5, 1, littleEndian ? "little-endian" : "big-endian");
		const header = add(root, bytes, state, 1, "ELF header", "structure", 16, elfClass === "ELF64" ? 48 : 36);
		if (!header) return;
		const type = u16(view, bytes, 16, littleEndian);
		const machine = u16(view, bytes, 18, littleEndian);
		if (type !== void 0) field(header, bytes, state, "Type", littleEndian ? "u16le" : "u16be", 16, 2, hex(type));
		if (machine !== void 0) field(header, bytes, state, "Machine", littleEndian ? "u16le" : "u16be", 18, 2, hex(machine));
		const entry = elfClass === "ELF64" ? u64(view, bytes, 24, littleEndian) : u32(view, bytes, 24, littleEndian);
		if (entry !== void 0) field(header, bytes, state, "Entry point", elfClass === "ELF64" ? littleEndian ? "u64le" : "u64be" : littleEndian ? "u32le" : "u32be", 24, elfClass === "ELF64" ? 8 : 4, hex(entry));
	};
	const inspectPe = (bytes, view, state, root) => {
		field(root, bytes, state, "DOS magic", "bytes", 0, 2, "4D 5A");
		const peOffset = u32(view, bytes, 60, true);
		if (peOffset === void 0) return;
		field(root, bytes, state, "PE header offset", "u32le", 60, 4, hex(peOffset));
		if (!starts(bytes, [
			80,
			69,
			0,
			0
		], peOffset)) {
			field(root, bytes, state, "PE signature", "missing", peOffset, 4, "Not present");
			return;
		}
		field(root, bytes, state, "PE signature", "bytes", peOffset, 4, "50 45 00 00");
		const coff = add(root, bytes, state, 1, "COFF header", "structure", peOffset + 4, 20);
		if (!coff) return;
		const machine = u16(view, bytes, peOffset + 4, true);
		const sections = u16(view, bytes, peOffset + 6, true);
		const optionalSize = u16(view, bytes, peOffset + 20, true);
		if (machine !== void 0) field(coff, bytes, state, "Machine", "u16le", peOffset + 4, 2, hex(machine));
		if (sections !== void 0) field(coff, bytes, state, "Number of sections", "u16le", peOffset + 6, 2, String(sections));
		if (optionalSize !== void 0) field(coff, bytes, state, "Optional header size", "u16le", peOffset + 20, 2, String(optionalSize));
		const optionalMagic = u16(view, bytes, peOffset + 24, true);
		if (optionalMagic !== void 0) field(root, bytes, state, "Optional header magic", "u16le", peOffset + 24, 2, hex(optionalMagic));
	};
	const inspectMachO = (bytes, view, state, root) => {
		const magic = u32(view, bytes, 0, false);
		if (magic === void 0) return;
		const littleEndian = magic === 3472551422 || magic === 3489328638;
		const is64 = magic === 4277009103 || magic === 3489328638;
		field(root, bytes, state, "Mach-O magic", "u32", 0, 4, hex(magic));
		const header = add(root, bytes, state, 1, is64 ? "Mach-O 64 header" : "Mach-O 32 header", "structure", 4, is64 ? 28 : 24);
		if (!header) return;
		const cpu = u32(view, bytes, 4, littleEndian);
		const fileType = u32(view, bytes, 12, littleEndian);
		const commands = u32(view, bytes, 16, littleEndian);
		if (cpu !== void 0) field(header, bytes, state, "CPU type", littleEndian ? "u32le" : "u32be", 4, 4, hex(cpu));
		if (fileType !== void 0) field(header, bytes, state, "File type", littleEndian ? "u32le" : "u32be", 12, 4, hex(fileType));
		if (commands !== void 0) field(header, bytes, state, "Load commands", littleEndian ? "u32le" : "u32be", 16, 4, String(commands));
	};
	const inspectZip = (bytes, view, state, root) => {
		const local = starts(bytes, [
			80,
			75,
			3,
			4
		]);
		field(root, bytes, state, "ZIP signature", "bytes", 0, 4, local ? "local file header" : starts(bytes, [
			80,
			75,
			5,
			6
		]) ? "end of central directory" : "data descriptor");
		if (!local) return;
		const header = add(root, bytes, state, 1, "Local file header", "structure", 4, 26);
		if (!header) return;
		const version = u16(view, bytes, 4, true);
		const flags = u16(view, bytes, 6, true);
		const compression = u16(view, bytes, 8, true);
		const compressed = u32(view, bytes, 18, true);
		const filename = u16(view, bytes, 26, true);
		if (version !== void 0) field(header, bytes, state, "Version needed", "u16le", 4, 2, String(version));
		if (flags !== void 0) field(header, bytes, state, "Flags", "u16le", 6, 2, hex(flags));
		if (compression !== void 0) field(header, bytes, state, "Compression", "u16le", 8, 2, String(compression));
		if (compressed !== void 0) field(header, bytes, state, "Compressed size", "u32le", 18, 4, String(compressed));
		if (filename !== void 0) field(header, bytes, state, "Filename length", "u16le", 26, 2, String(filename));
	};
	const inspectJavaClass = (bytes, view, state, root) => {
		field(root, bytes, state, "Class magic", "bytes", 0, 4, "CA FE BA BE");
		const minor = u16(view, bytes, 4, false);
		const major = u16(view, bytes, 6, false);
		const constants = u16(view, bytes, 8, false);
		if (minor !== void 0) field(root, bytes, state, "Minor version", "u16be", 4, 2, String(minor));
		if (major !== void 0) field(root, bytes, state, "Major version", "u16be", 6, 2, String(major));
		if (constants !== void 0) field(root, bytes, state, "Constant pool count", "u16be", 8, 2, String(constants));
	};
	const analyzeBinary = (bytes, limits) => {
		if (bytes.byteLength > limits.maxFileBytes) throw new Error(`Binary input exceeds the configured ${limits.maxFileBytes} byte limit.`);
		const state = {
			limits,
			startedAt: Date.now(),
			nodes: 1
		};
		const root = {
			name: "Raw bytes",
			type: "binary",
			start: 0,
			end: bytes.byteLength,
			value: `${bytes.byteLength} bytes`
		};
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		let template = "raw";
		let label = "Raw bytes";
		if (starts(bytes, [
			137,
			80,
			78,
			71,
			13,
			10,
			26,
			10
		])) {
			template = "png";
			label = "PNG";
			root.name = "PNG structure";
			inspectPng(bytes, view, state, root);
		} else if (starts(bytes, [
			0,
			97,
			115,
			109
		])) {
			template = "wasm";
			label = "WebAssembly";
			root.name = "WebAssembly structure";
			inspectWasm(bytes, view, state, root);
		} else if (starts(bytes, [
			127,
			69,
			76,
			70
		])) {
			template = "elf";
			label = "ELF";
			root.name = "ELF structure";
			inspectElf(bytes, view, state, root);
		} else if (starts(bytes, [77, 90])) {
			template = "pe";
			label = "PE/COFF";
			root.name = "PE/COFF structure";
			inspectPe(bytes, view, state, root);
		} else if (starts(bytes, [
			254,
			237,
			250,
			206
		]) || starts(bytes, [
			206,
			250,
			237,
			254
		]) || starts(bytes, [
			254,
			237,
			250,
			207
		]) || starts(bytes, [
			207,
			250,
			237,
			254
		])) {
			template = "macho";
			label = "Mach-O";
			root.name = "Mach-O structure";
			inspectMachO(bytes, view, state, root);
		} else if (starts(bytes, [
			80,
			75,
			3,
			4
		]) || starts(bytes, [
			80,
			75,
			5,
			6
		]) || starts(bytes, [
			80,
			75,
			7,
			8
		])) {
			template = "zip";
			label = "ZIP";
			root.name = "ZIP structure";
			inspectZip(bytes, view, state, root);
		} else if (starts(bytes, [
			202,
			254,
			186,
			190
		])) {
			template = "java-class";
			label = "Java class";
			root.name = "Java class structure";
			inspectJavaClass(bytes, view, state, root);
		}
		checkBudget(state);
		return {
			template,
			label,
			byteLength: bytes.byteLength,
			root
		};
	};
	//#endregion
	//#region ../../node_modules/.pnpm/@file-viewer+renderer-binary@3.1.2/node_modules/@file-viewer/renderer-binary/dist/types.js
	const DEFAULT_BINARY_INSPECTOR_LIMITS = Object.freeze({
		maxFileBytes: 16777216,
		maxParseMilliseconds: 5e3,
		maxStructureNodes: 512,
		maxStructureDepth: 16,
		maxStringBytes: 4096
	});
	const boundedInteger = (value, fallback, minimum, maximum) => {
		if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
		return Math.min(maximum, Math.max(minimum, Math.floor(value)));
	};
	const normalizeBinaryInspectorLimits = (options) => ({
		maxFileBytes: boundedInteger(options?.maxFileBytes, DEFAULT_BINARY_INSPECTOR_LIMITS.maxFileBytes, 1, 67108864),
		maxParseMilliseconds: boundedInteger(options?.maxParseMilliseconds, DEFAULT_BINARY_INSPECTOR_LIMITS.maxParseMilliseconds, 50, 3e4),
		maxStructureNodes: boundedInteger(options?.maxStructureNodes, DEFAULT_BINARY_INSPECTOR_LIMITS.maxStructureNodes, 1, 4096),
		maxStructureDepth: boundedInteger(options?.maxStructureDepth, DEFAULT_BINARY_INSPECTOR_LIMITS.maxStructureDepth, 1, 64),
		maxStringBytes: boundedInteger(options?.maxStringBytes, DEFAULT_BINARY_INSPECTOR_LIMITS.maxStringBytes, 1, 65536)
	});
	//#endregion
	//#region ../../node_modules/.pnpm/@file-viewer+renderer-binary@3.1.2/node_modules/@file-viewer/renderer-binary/dist/binary.worker.js
	const scope = globalThis;
	scope.onmessage = ({ data }) => {
		const response = {
			id: data?.id ?? 0,
			ok: false
		};
		try {
			if (!data || !(data.buffer instanceof ArrayBuffer)) throw new Error("Binary inspector Worker received an invalid request.");
			response.analysis = analyzeBinary(new Uint8Array(data.buffer), normalizeBinaryInspectorLimits(data.options));
			response.ok = true;
		} catch (error) {
			response.error = error instanceof Error ? error.message : String(error);
		}
		scope.postMessage(response);
	};
	//#endregion
})();
