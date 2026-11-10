import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { a as DEFAULT_SIGNATURE_CONTAINER_LIMITS, c as inspectEvidenceRecord, i as isProbablyJws, l as inspectSignatureContainer, n as isProbablyOpenPgp, o as normalizeSignatureContainerLimits, r as inspectJws, s as DEFAULT_SIGNATURE_ASN1_LIMITS, t as detectOpenPgpArmorType, u as signatureOidLabels } from "./formatDetection-kdRUGOvz.js";
import { t as require_jszip_min } from "./jszip.min-eM67_wVy.js";
import { n as OpenPgpWorkerClient, r as normalizeSignatureParseLimits, t as DEFAULT_SIGNATURE_PARSE_LIMITS } from "./client-INiRTBcl.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/structured/zipPreflight.js
var CENTRAL_DIRECTORY_SIGNATURE = 33639248;
var END_OF_CENTRAL_DIRECTORY_SIGNATURE = 101010256;
var LOCAL_FILE_HEADER_SIGNATURE = 67324752;
var DATA_DESCRIPTOR_SIGNATURE = 134695760;
var DATA_DESCRIPTOR_FLAG = 8;
var ZIP64_SENTINEL_16 = 65535;
var ZIP64_SENTINEL_32 = 4294967295;
var assertZip = (condition, message) => {
	if (!condition) throw new Error(`Unsafe ASiC ZIP: ${message}`);
};
var decodeName = (bytes, utf8) => {
	const name = new TextDecoder(utf8 ? "utf-8" : "windows-1252", { fatal: true }).decode(bytes).normalize("NFC");
	assertZip(!Array.from(name).some((character) => {
		const codePoint = character.codePointAt(0);
		return codePoint === 127 || codePoint < 32;
	}), "entry name contains control characters.");
	assertZip(!name.includes("\\"), "backslash paths are rejected.");
	assertZip(!name.startsWith("/") && !/^[A-Za-z]:/u.test(name), "absolute entry paths are rejected.");
	const segments = name.split("/").filter(Boolean);
	assertZip(segments.length > 0, "empty entry name.");
	assertZip(segments.every((segment) => segment !== "." && segment !== ".."), "entry path traversal is rejected.");
	return name;
};
var locateEndRecord = (view) => {
	const minimum = Math.max(0, view.byteLength - 65557);
	for (let offset = view.byteLength - 22; offset >= minimum; offset -= 1) if (view.getUint32(offset, true) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) return offset;
	throw new Error("Unsafe ASiC ZIP: end-of-central-directory record is missing.");
};
var equalBytes = (left, right) => {
	if (left.byteLength !== right.byteLength) return false;
	let mismatch = 0;
	for (let index = 0; index < left.byteLength; index += 1) mismatch |= left[index] ^ right[index];
	return mismatch === 0;
};
var inspectZipCentralDirectory = (input, limits) => {
	const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
	assertZip(bytes.byteLength > 0 && bytes.byteLength <= limits.maxContainerBytes, `container exceeds ${limits.maxContainerBytes} bytes.`);
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const eocd = locateEndRecord(view);
	const diskNumber = view.getUint16(eocd + 4, true);
	const centralDisk = view.getUint16(eocd + 6, true);
	const diskEntries = view.getUint16(eocd + 8, true);
	const totalEntries = view.getUint16(eocd + 10, true);
	const centralSize = view.getUint32(eocd + 12, true);
	const centralOffset = view.getUint32(eocd + 16, true);
	const commentLength = view.getUint16(eocd + 20, true);
	assertZip(eocd + 22 + commentLength === bytes.byteLength, "trailing bytes after the ZIP end record are rejected.");
	assertZip(diskNumber === 0 && centralDisk === 0 && diskEntries === totalEntries, "multi-disk ZIP archives are rejected.");
	assertZip(totalEntries !== ZIP64_SENTINEL_16 && centralSize !== ZIP64_SENTINEL_32 && centralOffset !== ZIP64_SENTINEL_32, "ZIP64 archives are not accepted by this bounded preview path.");
	assertZip(totalEntries > 0 && totalEntries <= limits.maxEntries, `entry count exceeds ${limits.maxEntries}.`);
	assertZip(centralOffset + centralSize === eocd, "central-directory bounds are inconsistent.");
	const entries = [];
	const physicalRanges = [];
	const normalizedNames = /* @__PURE__ */ new Set();
	let totalUncompressedBytes = 0;
	let cursor = centralOffset;
	for (let index = 0; index < totalEntries; index += 1) {
		assertZip(cursor + 46 <= eocd && view.getUint32(cursor, true) === CENTRAL_DIRECTORY_SIGNATURE, "central-directory entry is malformed.");
		const flags = view.getUint16(cursor + 8, true);
		const compressionMethod = view.getUint16(cursor + 10, true);
		const crc32 = view.getUint32(cursor + 16, true);
		const compressedSize = view.getUint32(cursor + 20, true);
		const uncompressedSize = view.getUint32(cursor + 24, true);
		const nameLength = view.getUint16(cursor + 28, true);
		const extraLength = view.getUint16(cursor + 30, true);
		const entryCommentLength = view.getUint16(cursor + 32, true);
		const diskStart = view.getUint16(cursor + 34, true);
		const externalAttributes = view.getUint32(cursor + 38, true);
		const localHeaderOffset = view.getUint32(cursor + 42, true);
		const next = cursor + 46 + nameLength + extraLength + entryCommentLength;
		assertZip(next <= eocd, "central-directory entry exceeds its boundary.");
		assertZip((flags & 1) === 0, "encrypted entries are rejected.");
		assertZip(compressionMethod === 0 || compressionMethod === 8, `compression method ${compressionMethod} is unsupported.`);
		assertZip(compressedSize !== ZIP64_SENTINEL_32 && uncompressedSize !== ZIP64_SENTINEL_32 && localHeaderOffset !== ZIP64_SENTINEL_32 && diskStart !== ZIP64_SENTINEL_16, "ZIP64 entry fields are rejected.");
		assertZip(diskStart === 0, "multi-disk entries are rejected.");
		const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
		assertZip(nameBytes.byteLength <= limits.maxPathBytes, `entry path exceeds ${limits.maxPathBytes} bytes.`);
		const name = decodeName(nameBytes, (flags & 2048) !== 0);
		const collisionKey = name.toLocaleLowerCase("en-US");
		assertZip(!normalizedNames.has(collisionKey), `duplicate or case-colliding entry ${name}.`);
		normalizedNames.add(collisionKey);
		assertZip((externalAttributes >>> 16 & 61440) !== 40960, `symbolic link ${name} is rejected.`);
		const directory = name.endsWith("/") || (externalAttributes & 16) !== 0;
		if (!directory) {
			assertZip(uncompressedSize <= limits.maxEntryBytes, `entry ${name} exceeds ${limits.maxEntryBytes} bytes.`);
			assertZip(compressedSize > 0 || uncompressedSize === 0, `entry ${name} has an impossible compressed size.`);
			if (compressedSize > 0) assertZip(uncompressedSize / compressedSize <= limits.maxCompressionRatio, `entry ${name} exceeds compression ratio ${limits.maxCompressionRatio}.`);
			totalUncompressedBytes += uncompressedSize;
			assertZip(Number.isSafeInteger(totalUncompressedBytes) && totalUncompressedBytes <= limits.maxTotalUncompressedBytes, `uncompressed total exceeds ${limits.maxTotalUncompressedBytes} bytes.`);
		}
		assertZip(localHeaderOffset + 30 <= centralOffset && view.getUint32(localHeaderOffset, true) === LOCAL_FILE_HEADER_SIGNATURE, `local header for ${name} is invalid.`);
		const localFlags = view.getUint16(localHeaderOffset + 6, true);
		const localCompressionMethod = view.getUint16(localHeaderOffset + 8, true);
		const localCrc32 = view.getUint32(localHeaderOffset + 14, true);
		const localCompressedSize = view.getUint32(localHeaderOffset + 18, true);
		const localUncompressedSize = view.getUint32(localHeaderOffset + 22, true);
		const localNameLength = view.getUint16(localHeaderOffset + 26, true);
		const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
		assertZip(localFlags === flags, `local and central flags differ for ${name}.`);
		assertZip(localCompressionMethod === compressionMethod, `local and central compression methods differ for ${name}.`);
		assertZip(localCompressedSize !== ZIP64_SENTINEL_32 && localUncompressedSize !== ZIP64_SENTINEL_32, `local ZIP64 size fields are rejected for ${name}.`);
		const localNameStart = localHeaderOffset + 30;
		const localNameEnd = localNameStart + localNameLength;
		const dataStart = localNameEnd + localExtraLength;
		assertZip(localNameEnd <= centralOffset && dataStart <= centralOffset, `local header fields for ${name} escape the data section.`);
		assertZip(localNameLength <= limits.maxPathBytes, `local entry path for ${name} exceeds ${limits.maxPathBytes} bytes.`);
		assertZip(equalBytes(bytes.subarray(localNameStart, localNameEnd), nameBytes), `local and central entry names differ for ${name}.`);
		const usesDataDescriptor = (flags & DATA_DESCRIPTOR_FLAG) !== 0;
		if (usesDataDescriptor) assertZip((localCrc32 === 0 || localCrc32 === crc32) && (localCompressedSize === 0 || localCompressedSize === compressedSize) && (localUncompressedSize === 0 || localUncompressedSize === uncompressedSize), `local placeholder fields conflict with the central directory for ${name}.`);
		else assertZip(localCrc32 === crc32 && localCompressedSize === compressedSize && localUncompressedSize === uncompressedSize, `local CRC or size fields differ from the central directory for ${name}.`);
		const dataEnd = dataStart + compressedSize;
		assertZip(dataEnd <= centralOffset, `compressed data for ${name} escapes the data section.`);
		let recordEnd = dataEnd;
		if (usesDataDescriptor) {
			let descriptorStart = dataEnd;
			assertZip(descriptorStart + 12 <= centralOffset, `data descriptor for ${name} is truncated.`);
			if (view.getUint32(descriptorStart, true) === DATA_DESCRIPTOR_SIGNATURE) {
				descriptorStart += 4;
				assertZip(descriptorStart + 12 <= centralOffset, `signed data descriptor for ${name} is truncated.`);
			}
			assertZip(view.getUint32(descriptorStart, true) === crc32 && view.getUint32(descriptorStart + 4, true) === compressedSize && view.getUint32(descriptorStart + 8, true) === uncompressedSize, `data descriptor differs from the central directory for ${name}.`);
			recordEnd = descriptorStart + 12;
		}
		physicalRanges.push({
			name,
			start: localHeaderOffset,
			end: recordEnd
		});
		entries.push({
			name,
			compressedSize,
			uncompressedSize,
			compressionMethod,
			localHeaderOffset,
			directory
		});
		cursor = next;
	}
	assertZip(cursor === eocd, "central-directory size does not match parsed entries.");
	physicalRanges.sort((left, right) => left.start - right.start || left.end - right.end);
	for (let index = 1; index < physicalRanges.length; index += 1) {
		const previous = physicalRanges[index - 1];
		const current = physicalRanges[index];
		assertZip(previous.end <= current.start, `local record ranges overlap between ${previous.name} and ${current.name}.`);
	}
	return {
		entries,
		totalUncompressedBytes
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/structured/asic.js
var import_jszip_min = /* @__PURE__ */ __toESM(require_jszip_min(), 1);
var ASICS_MIME = "application/vnd.etsi.asic-s+zip";
var ASICE_MIME = "application/vnd.etsi.asic-e+zip";
var METADATA_PREFIX = "META-INF/";
var getExtension = (name) => {
	const basename = name.split("/").pop() || "";
	const dot = basename.lastIndexOf(".");
	return dot > 0 ? basename.slice(dot + 1).toLowerCase() : "";
};
var signatureKind = (name) => {
	const extension = getExtension(name);
	if ([
		"p7s",
		"p7m",
		"p7b",
		"p7c",
		"pkcs7",
		"cms",
		"cmsc"
	].includes(extension)) return "cades";
	if ([
		"tst",
		"tsr",
		"tsq",
		"tsd"
	].includes(extension)) return "timestamp";
	if (extension === "ers") return "evidence-record";
	if (extension === "jws") return "jws";
	if (extension === "xml") return "xades-or-xml";
	return "unknown";
};
var contentTypeForName = (name) => {
	return {
		pdf: "application/pdf",
		xml: "application/xml",
		json: "application/json",
		txt: "text/plain",
		html: "text/html",
		htm: "text/html",
		png: "image/png",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		gif: "image/gif",
		docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	}[getExtension(name)];
};
var safeArchiveReference = (value) => {
	if (!value || value.startsWith("#") || value.includes("\0") || /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(value)) return void 0;
	let decoded;
	try {
		decoded = decodeURIComponent(value);
	} catch {
		return;
	}
	if (decoded.startsWith("/") || decoded.includes("\\")) return void 0;
	if (decoded.split("/").some((part) => part === ".." || part === ".")) return void 0;
	return decoded.normalize("NFC");
};
/** Linear, non-validating extraction of same-container URI metadata only. */
var collectXmlReferences = (data, maxXmlBytes) => {
	if (data.byteLength > maxXmlBytes) return [];
	const text = new TextDecoder("utf-8", { fatal: false }).decode(data);
	const references = [];
	let cursor = 0;
	while (cursor < text.length && references.length < 256) {
		const uri = text.indexOf("URI", cursor);
		if (uri < 0) break;
		cursor = uri + 3;
		while (cursor < text.length && /\s/u.test(text[cursor])) cursor += 1;
		if (text[cursor] !== "=") continue;
		cursor += 1;
		while (cursor < text.length && /\s/u.test(text[cursor])) cursor += 1;
		const quote = text[cursor];
		if (quote !== "\"" && quote !== "'") continue;
		const end = text.indexOf(quote, cursor + 1);
		if (end < 0 || end - cursor > 4096) break;
		const safe = safeArchiveReference(text.slice(cursor + 1, end));
		if (safe && !references.includes(safe)) references.push(safe);
		cursor = end + 1;
	}
	return references;
};
var extractChecked = async (zip, entry) => {
	const file = zip.file(entry.name);
	if (!file) throw new Error(`ASiC entry ${entry.name} disappeared after ZIP validation.`);
	const data = await file.async("uint8array");
	if (data.byteLength !== entry.uncompressedSize) throw new Error(`ASiC entry ${entry.name} inflated to an unexpected size.`);
	return data;
};
var inspectAsicContainer = async (input, requestedLimits) => {
	const limits = normalizeSignatureContainerLimits(requestedLimits);
	const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
	const directory = inspectZipCentralDirectory(bytes, limits);
	const fileEntries = directory.entries.filter((entry) => !entry.directory);
	const mimetypeEntry = fileEntries.find((entry) => entry.name === "mimetype");
	if (!mimetypeEntry || mimetypeEntry.localHeaderOffset !== 0 || mimetypeEntry.compressionMethod !== 0) throw new Error("ASiC requires an uncompressed first-entry mimetype file.");
	const zip = await import_jszip_min.default.loadAsync(bytes, {
		checkCRC32: true,
		createFolders: false
	});
	const mimetypeBytes = await extractChecked(zip, mimetypeEntry);
	const mediaType = new TextDecoder("ascii", { fatal: true }).decode(mimetypeBytes);
	if (mediaType !== ASICS_MIME && mediaType !== ASICE_MIME) throw new Error(`Unsupported ASiC mimetype ${JSON.stringify(mediaType)}.`);
	const documentEntries = fileEntries.filter((entry) => entry.name !== "mimetype" && !entry.name.startsWith(METADATA_PREFIX));
	const metadataEntries = fileEntries.filter((entry) => entry.name.startsWith(METADATA_PREFIX));
	if (documentEntries.length > limits.maxDocuments) throw new Error(`ASiC document count exceeds ${limits.maxDocuments}.`);
	const signatureEntries = metadataEntries.filter((entry) => {
		const basename = entry.name.slice(9).toLowerCase();
		return basename.includes("signature") || basename.includes("timestamp") || [
			"p7s",
			"p7m",
			"xml",
			"tst",
			"tsr",
			"ers",
			"jws"
		].includes(getExtension(entry.name));
	});
	if (signatureEntries.length > limits.maxSignatureMembers) throw new Error(`ASiC signature-member count exceeds ${limits.maxSignatureMembers}.`);
	const documents = [];
	for (const entry of documentEntries) documents.push({
		name: entry.name,
		compressedSize: entry.compressedSize,
		uncompressedSize: entry.uncompressedSize,
		mediaType: contentTypeForName(entry.name),
		data: await extractChecked(zip, entry)
	});
	const signatures = [];
	for (const entry of signatureEntries) {
		const data = await extractChecked(zip, entry);
		signatures.push({
			name: entry.name,
			compressedSize: entry.compressedSize,
			uncompressedSize: entry.uncompressedSize,
			data,
			kind: signatureKind(entry.name),
			referencedDocuments: getExtension(entry.name) === "xml" ? collectXmlReferences(data, limits.maxXmlBytes).filter((reference) => documents.some((document) => document.name === reference)) : []
		});
	}
	const signatureNames = new Set(signatureEntries.map((entry) => entry.name));
	const metadata = metadataEntries.filter((entry) => !signatureNames.has(entry.name)).map((entry) => ({
		name: entry.name,
		compressedSize: entry.compressedSize,
		uncompressedSize: entry.uncompressedSize,
		mediaType: contentTypeForName(entry.name)
	}));
	const kind = mediaType === ASICS_MIME ? "ASiC-S" : "ASiC-E";
	const warnings = [
		"ZIP paths, entry sizes, compression ratios, CRCs and aggregate inflation were checked before extracted content was exposed.",
		"No URI, certificate URL, revocation endpoint or package reference is fetched automatically.",
		"Package parsing and member mapping do not establish certificate trust, policy compliance or legal validity."
	];
	if (kind === "ASiC-S" && documents.length !== 1) warnings.push(`ASiC-S normally carries one document; this package contains ${documents.length}.`);
	if (!signatures.length) warnings.push("No signature or timestamp member was detected under META-INF.");
	return {
		kind,
		mediaType,
		sourceSize: bytes.byteLength,
		entryCount: fileEntries.length,
		totalUncompressedBytes: directory.totalUncompressedBytes,
		documents,
		signatures,
		metadata,
		warnings
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/index.js
var signatureRendererDefinition = {
	id: "signature",
	label: "Digital signature, timestamp and evidence container",
	category: "document",
	extensions: [
		"p7m",
		"p7s",
		"p7b",
		"p7c",
		"pkcs7",
		"cms",
		"cmsc",
		"tsq",
		"tsr",
		"tst",
		"tsd",
		"asics",
		"scs",
		"asice",
		"sce",
		"ers",
		"asc",
		"sig",
		"pgp",
		"gpg",
		"jws"
	],
	async: true,
	supportLevel: "experimental",
	status: "experimental",
	packageName: "@file-viewer/renderer-signature",
	presets: [],
	knownLimits: [
		"Supports bounded CMS/PKCS#7, selected CAdES attributes, RFC 3161, RFC 5544, ASiC, RFC 4998, JWS and OpenPGP inspection.",
		"Certificate trust, policy compliance, qualified status, and legal validity are not established.",
		"ASiC XML signature references and RFC 4998 renewal chains are structurally inspected; full XAdES and archival-policy validation are not claimed.",
		"OpenPGP inspection plus detached, cleartext and embedded signature verification use a lazy rPGP WebAssembly Worker; private-key operations and automatic decryption are intentionally excluded.",
		"JAdES properties are reported as metadata only. PAdES, full XMLDSig/XAdES/JAdES validation, S/MIME and PGP/MIME remain outside this renderer because they require host integration with their existing document and message renderers."
	],
	capabilities: { download: true }
};
var renderFileViewerSignature = (buffer, target, type, context) => import("./signature-_wwikJDV.js").then(({ default: renderSignature }) => renderSignature(buffer, target, type, context));
var signatureRenderer = {
	id: "file-viewer-renderer-signature",
	label: "Flyfish File Viewer signature renderer",
	definitions: [signatureRendererDefinition],
	handlers: [{
		rendererId: signatureRendererDefinition.id,
		handler: renderFileViewerSignature
	}]
};
//#endregion
export { DEFAULT_SIGNATURE_ASN1_LIMITS, DEFAULT_SIGNATURE_CONTAINER_LIMITS, DEFAULT_SIGNATURE_PARSE_LIMITS, OpenPgpWorkerClient, signatureRenderer as default, signatureRenderer, detectOpenPgpArmorType, inspectAsicContainer, inspectEvidenceRecord, inspectJws, inspectSignatureContainer, isProbablyJws, isProbablyOpenPgp, normalizeSignatureContainerLimits, normalizeSignatureParseLimits, renderFileViewerSignature, signatureOidLabels, signatureRendererDefinition };
