//#region ../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/signatureAsn1.js
var UNIVERSAL = 0;
var CONTEXT = 2;
var TAG = {
	boolean: 1,
	integer: 2,
	bitString: 3,
	octetString: 4,
	null: 5,
	oid: 6,
	utf8String: 12,
	sequence: 16,
	set: 17,
	printableString: 19,
	teletexString: 20,
	ia5String: 22,
	utcTime: 23,
	generalizedTime: 24,
	universalString: 28,
	bmpString: 30
};
var OID = {
	data: "1.2.840.113549.1.7.1",
	signedData: "1.2.840.113549.1.7.2",
	envelopedData: "1.2.840.113549.1.7.3",
	digestedData: "1.2.840.113549.1.7.5",
	encryptedData: "1.2.840.113549.1.7.6",
	tstInfo: "1.2.840.113549.1.9.16.1.4",
	timestampedData: "1.2.840.113549.1.9.16.1.31",
	contentTypeAttribute: "1.2.840.113549.1.9.3",
	messageDigestAttribute: "1.2.840.113549.1.9.4",
	signingTimeAttribute: "1.2.840.113549.1.9.5",
	signatureTimestampTokenAttribute: "1.2.840.113549.1.9.16.2.14",
	signingCertificateV2Attribute: "1.2.840.113549.1.9.16.2.47",
	subjectKeyIdentifier: "2.5.29.14",
	sha1: "1.3.14.3.2.26",
	sha256: "2.16.840.1.101.3.4.2.1",
	sha384: "2.16.840.1.101.3.4.2.2",
	sha512: "2.16.840.1.101.3.4.2.3",
	rsaEncryption: "1.2.840.113549.1.1.1",
	sha1WithRsa: "1.2.840.113549.1.1.5",
	sha256WithRsa: "1.2.840.113549.1.1.11",
	sha384WithRsa: "1.2.840.113549.1.1.12",
	sha512WithRsa: "1.2.840.113549.1.1.13",
	rsaPss: "1.2.840.113549.1.1.10",
	ecPublicKey: "1.2.840.10045.2.1",
	ecdsaSha256: "1.2.840.10045.4.3.2",
	ecdsaSha384: "1.2.840.10045.4.3.3",
	ecdsaSha512: "1.2.840.10045.4.3.4",
	ed25519: "1.3.101.112",
	prime256v1: "1.2.840.10045.3.1.7",
	secp384r1: "1.3.132.0.34",
	secp521r1: "1.3.132.0.35"
};
var OID_LABELS = {
	[OID.data]: "CMS data",
	[OID.signedData]: "CMS SignedData",
	[OID.envelopedData]: "CMS EnvelopedData",
	[OID.digestedData]: "CMS DigestedData",
	[OID.encryptedData]: "CMS EncryptedData",
	[OID.tstInfo]: "RFC 3161 TSTInfo",
	[OID.timestampedData]: "RFC 5544 TimeStampedData",
	[OID.sha1]: "SHA-1",
	[OID.sha256]: "SHA-256",
	[OID.sha384]: "SHA-384",
	[OID.sha512]: "SHA-512",
	[OID.rsaEncryption]: "RSA",
	[OID.sha1WithRsa]: "SHA-1 with RSA",
	[OID.sha256WithRsa]: "SHA-256 with RSA",
	[OID.sha384WithRsa]: "SHA-384 with RSA",
	[OID.sha512WithRsa]: "SHA-512 with RSA",
	[OID.rsaPss]: "RSA-PSS",
	[OID.ecPublicKey]: "EC public key",
	[OID.ecdsaSha256]: "ECDSA with SHA-256",
	[OID.ecdsaSha384]: "ECDSA with SHA-384",
	[OID.ecdsaSha512]: "ECDSA with SHA-512",
	[OID.ed25519]: "Ed25519"
};
var NAME_LABELS = {
	"2.5.4.3": "CN",
	"2.5.4.4": "SN",
	"2.5.4.5": "serialNumber",
	"2.5.4.6": "C",
	"2.5.4.7": "L",
	"2.5.4.8": "ST",
	"2.5.4.10": "O",
	"2.5.4.11": "OU",
	"2.5.4.12": "title",
	"2.5.4.42": "GN",
	"1.2.840.113549.1.9.1": "emailAddress"
};
var DEFAULT_SIGNATURE_ASN1_LIMITS = Object.freeze({
	maxInputBytes: 67108864,
	maxOriginalContentBytes: 67108864,
	maxAsn1Nodes: 25e3,
	maxAsn1NestingDepth: 96,
	maxDigestAlgorithms: 64,
	maxCertificates: 512,
	maxCrls: 256,
	maxSigners: 256,
	maxAttributesPerSigner: 256,
	maxEmbeddedContentBytes: 33554432,
	maxTimestampEvidenceEntries: 256,
	maxEvidenceChains: 128,
	maxEvidenceTimestampsPerChain: 256,
	maxEvidenceTimestamps: 1024,
	maxReducedHashTreeNodes: 4096
});
var normalizeSignatureAsn1Limits = (supplied) => {
	var _a;
	const normalized = { ...DEFAULT_SIGNATURE_ASN1_LIMITS };
	for (const key of Object.keys(normalized)) {
		const value = (_a = supplied === null || supplied === void 0 ? void 0 : supplied[key]) !== null && _a !== void 0 ? _a : normalized[key];
		assertBounds(Number.isSafeInteger(value) && value >= 1 && value <= DEFAULT_SIGNATURE_ASN1_LIMITS[key], `${key} must be an integer between 1 and ${DEFAULT_SIGNATURE_ASN1_LIMITS[key]}.`);
		normalized[key] = value;
	}
	return normalized;
};
var toUint8Array = (value) => value instanceof Uint8Array ? value : new Uint8Array(value);
var bytesToHex = (bytes, separator = "") => Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(separator).toUpperCase();
var equalBytes = (left, right) => {
	if (left.byteLength !== right.byteLength) return false;
	let mismatch = 0;
	for (let index = 0; index < left.byteLength; index += 1) mismatch |= left[index] ^ right[index];
	return mismatch === 0;
};
var formatOid = (oid) => oid ? OID_LABELS[oid] || oid : "Unknown";
var assertBounds = (condition, message) => {
	if (!condition) throw new Error(message);
};
var parseNode = (state, offset, limit, depth) => {
	assertBounds(depth <= state.maxDepth, `ASN.1 nesting exceeds ${state.maxDepth}.`);
	assertBounds(offset < limit, "Unexpected end of ASN.1 input.");
	state.nodes += 1;
	assertBounds(state.nodes <= state.maxNodes, `ASN.1 node count exceeds ${state.maxNodes}.`);
	const bytes = state.bytes;
	const start = offset;
	const identifier = bytes[offset++];
	const tagClass = identifier >> 6;
	const constructed = (identifier & 32) !== 0;
	let tagNumber = identifier & 31;
	if (tagNumber === 31) {
		tagNumber = 0;
		let octets = 0;
		for (;;) {
			assertBounds(offset < limit, "Truncated ASN.1 high-tag identifier.");
			const octet = bytes[offset++];
			octets += 1;
			assertBounds(octets <= 6, "ASN.1 high-tag identifier is too large.");
			tagNumber = tagNumber * 128 + (octet & 127);
			if ((octet & 128) === 0) break;
		}
	}
	assertBounds(offset < limit, "Missing ASN.1 length.");
	const lengthOctet = bytes[offset++];
	let length = 0;
	let indefinite = false;
	if (lengthOctet === 128) {
		indefinite = true;
		assertBounds(constructed, "Primitive ASN.1 values cannot use indefinite length.");
	} else if ((lengthOctet & 128) === 0) length = lengthOctet;
	else {
		const lengthOctets = lengthOctet & 127;
		assertBounds(lengthOctets > 0 && lengthOctets <= 6, "Unsupported ASN.1 length width.");
		assertBounds(offset + lengthOctets <= limit, "Truncated ASN.1 length.");
		for (let index = 0; index < lengthOctets; index += 1) length = length * 256 + bytes[offset++];
	}
	const contentStart = offset;
	const children = [];
	let contentEnd;
	let end;
	if (indefinite) for (;;) {
		assertBounds(offset + 1 < limit, "Unterminated indefinite-length ASN.1 value.");
		if (bytes[offset] === 0 && bytes[offset + 1] === 0) {
			contentEnd = offset;
			end = offset + 2;
			break;
		}
		const parsed = parseNode(state, offset, limit, depth + 1);
		children.push(parsed.node);
		offset = parsed.next;
	}
	else {
		contentEnd = contentStart + length;
		assertBounds(contentEnd <= limit, "ASN.1 length extends beyond its parent.");
		end = contentEnd;
		if (constructed) {
			while (offset < contentEnd) {
				const parsed = parseNode(state, offset, contentEnd, depth + 1);
				children.push(parsed.node);
				offset = parsed.next;
			}
			assertBounds(offset === contentEnd, "ASN.1 child does not end at its parent boundary.");
		}
	}
	return {
		node: {
			tagClass,
			tagNumber,
			constructed,
			start,
			headerEnd: contentStart,
			contentStart,
			contentEnd,
			end,
			indefinite,
			children
		},
		next: end
	};
};
var parseRoot = (bytes, limits = DEFAULT_SIGNATURE_ASN1_LIMITS) => {
	const { node, next } = parseNode({
		bytes,
		nodes: 0,
		maxNodes: limits.maxAsn1Nodes,
		maxDepth: limits.maxAsn1NestingDepth
	}, 0, bytes.byteLength, 0);
	for (let offset = next; offset < bytes.byteLength; offset += 1) assertBounds(bytes[offset] === 0, "Unexpected bytes after the ASN.1 root value.");
	return node;
};
var isTag = (node, tagClass, tagNumber) => Boolean(node && node.tagClass === tagClass && node.tagNumber === tagNumber);
var contentBytes = (bytes, node) => bytes.subarray(node.contentStart, node.contentEnd);
var fullBytes = (bytes, node) => bytes.subarray(node.start, node.end);
var decodeOid = (bytes, node) => {
	assertBounds(isTag(node, UNIVERSAL, TAG.oid), "Expected ASN.1 OBJECT IDENTIFIER.");
	const value = contentBytes(bytes, node);
	assertBounds(value.byteLength > 0, "Empty ASN.1 OBJECT IDENTIFIER.");
	const subIdentifiers = [];
	let current = 0;
	let continued = false;
	for (const octet of value) {
		current = current * 128 + (octet & 127);
		assertBounds(Number.isSafeInteger(current), "ASN.1 OBJECT IDENTIFIER arc is too large.");
		continued = (octet & 128) !== 0;
		if (!continued) {
			subIdentifiers.push(current);
			current = 0;
		}
	}
	assertBounds(!continued, "Truncated ASN.1 OBJECT IDENTIFIER.");
	const first = subIdentifiers.shift() || 0;
	const firstArc = first < 40 ? 0 : first < 80 ? 1 : 2;
	return [
		firstArc,
		first - firstArc * 40,
		...subIdentifiers
	].map(String).join(".");
};
var integerBytes = (bytes, node) => {
	assertBounds(isTag(node, UNIVERSAL, TAG.integer), "Expected ASN.1 INTEGER.");
	return contentBytes(bytes, node);
};
var positiveIntegerBytes = (bytes, node) => {
	let value = integerBytes(bytes, node);
	while (value.byteLength > 1 && value[0] === 0) value = value.subarray(1);
	return value;
};
var integerHex = (bytes, node) => bytesToHex(positiveIntegerBytes(bytes, node));
var integerNumber = (bytes, node) => {
	const value = positiveIntegerBytes(bytes, node);
	let result = 0;
	for (const octet of value) {
		result = result * 256 + octet;
		if (!Number.isSafeInteger(result)) return;
	}
	return result;
};
var decodeBoolean = (bytes, node) => {
	assertBounds(isTag(node, UNIVERSAL, TAG.boolean), "Expected ASN.1 BOOLEAN.");
	return contentBytes(bytes, node).some((octet) => octet !== 0);
};
var decodeAscii = (value) => String.fromCharCode(...value);
var decodeBmpString = (value) => {
	let result = "";
	for (let index = 0; index + 1 < value.byteLength; index += 2) result += String.fromCharCode(value[index] << 8 | value[index + 1]);
	return result;
};
var decodeUniversalString = (value) => {
	let result = "";
	for (let index = 0; index + 3 < value.byteLength; index += 4) {
		const codePoint = value[index] * 16777216 + (value[index + 1] << 16) + (value[index + 2] << 8) + value[index + 3];
		result += String.fromCodePoint(codePoint);
	}
	return result;
};
var decodeString = (bytes, node) => {
	const value = contentBytes(bytes, node);
	switch (node.tagNumber) {
		case TAG.utf8String: return new TextDecoder("utf-8", { fatal: false }).decode(value);
		case TAG.bmpString: return decodeBmpString(value);
		case TAG.universalString: return decodeUniversalString(value);
		case TAG.printableString:
		case TAG.teletexString:
		case TAG.ia5String: return decodeAscii(value);
		default: return decodeAscii(value);
	}
};
var parseTimeString = (value, generalized) => {
	const match = generalized ? /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\.(\d+))?(Z|[+-]\d{4})$/.exec(value) : /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(Z|[+-]\d{4})$/.exec(value);
	if (!match) return value;
	const year = generalized ? Number(match[1]) : (Number(match[1]) >= 50 ? 1900 : 2e3) + Number(match[1]);
	const baseIndex = generalized ? 2 : 2;
	const month = Number(match[baseIndex]);
	const day = Number(match[baseIndex + 1]);
	const hour = Number(match[baseIndex + 2]);
	const minute = Number(match[baseIndex + 3]);
	const second = Number(match[baseIndex + 4]);
	const fraction = generalized ? match[7] : void 0;
	const zone = generalized ? match[8] : match[7];
	const millis = fraction ? Number(`0.${fraction}`) * 1e3 : 0;
	let timestamp = Date.UTC(year, month - 1, day, hour, minute, second, millis);
	if (zone !== "Z") {
		const sign = zone[0] === "+" ? 1 : -1;
		const offsetMinutes = Number(zone.slice(1, 3)) * 60 + Number(zone.slice(3, 5));
		timestamp -= sign * offsetMinutes * 6e4;
	}
	const date = new Date(timestamp);
	return Number.isNaN(date.getTime()) ? value : date.toISOString();
};
var decodeTime = (bytes, node) => {
	const raw = decodeAscii(contentBytes(bytes, node));
	if (isTag(node, UNIVERSAL, TAG.utcTime)) return parseTimeString(raw, false);
	if (isTag(node, UNIVERSAL, TAG.generalizedTime)) return parseTimeString(raw, true);
	return raw;
};
var decodeName = (bytes, node) => {
	const rdns = [];
	for (const set of node.children) for (const attribute of set.children) {
		const [oidNode, valueNode] = attribute.children;
		if (!oidNode || !valueNode || !isTag(oidNode, UNIVERSAL, TAG.oid)) continue;
		const oid = decodeOid(bytes, oidNode);
		const label = NAME_LABELS[oid] || oid;
		rdns.push(`${label}=${decodeString(bytes, valueNode)}`);
	}
	return rdns.join(", ");
};
var algorithmOid = (bytes, node) => {
	const oidNode = node === null || node === void 0 ? void 0 : node.children.find((child) => isTag(child, UNIVERSAL, TAG.oid));
	return oidNode ? decodeOid(bytes, oidNode) : void 0;
};
var curveNameForOid = (oid) => {
	if (oid === OID.prime256v1) return "P-256";
	if (oid === OID.secp384r1) return "P-384";
	if (oid === OID.secp521r1) return "P-521";
};
var collectOctetString = (bytes, node, maxBytes = DEFAULT_SIGNATURE_ASN1_LIMITS.maxEmbeddedContentBytes) => {
	if (isTag(node, UNIVERSAL, TAG.octetString) && !node.constructed) {
		const value = contentBytes(bytes, node);
		assertBounds(value.byteLength <= maxBytes, `Embedded content exceeds the ${maxBytes}-byte boundary.`);
		return value;
	}
	const parts = node.children.filter((child) => isTag(child, UNIVERSAL, TAG.octetString) || child.tagClass === CONTEXT).map((child) => collectOctetString(bytes, child, maxBytes));
	if (!parts.length) return /* @__PURE__ */ new Uint8Array();
	const size = parts.reduce((sum, part) => sum + part.byteLength, 0);
	assertBounds(size <= maxBytes, `Embedded content exceeds the ${maxBytes}-byte boundary.`);
	const output = new Uint8Array(size);
	let offset = 0;
	for (const part of parts) {
		output.set(part, offset);
		offset += part.byteLength;
	}
	return output;
};
var parseExtensions = (bytes, tbsChildren) => {
	var _a;
	const extensionsContainer = tbsChildren.find((child) => isTag(child, CONTEXT, 3));
	const extensions = ((_a = extensionsContainer === null || extensionsContainer === void 0 ? void 0 : extensionsContainer.children[0]) === null || _a === void 0 ? void 0 : _a.children) || [];
	let subjectKeyIdentifier;
	for (const extension of extensions) {
		const oidNode = extension.children.find((child) => isTag(child, UNIVERSAL, TAG.oid));
		const valueNode = [...extension.children].reverse().find((child) => isTag(child, UNIVERSAL, TAG.octetString));
		if (!oidNode || !valueNode) continue;
		if (decodeOid(bytes, oidNode) === OID.subjectKeyIdentifier) try {
			const innerBytes = contentBytes(bytes, valueNode);
			const innerNode = parseRoot(innerBytes);
			if (isTag(innerNode, UNIVERSAL, TAG.octetString)) subjectKeyIdentifier = bytesToHex(contentBytes(innerBytes, innerNode));
		} catch {
			subjectKeyIdentifier = bytesToHex(contentBytes(bytes, valueNode));
		}
	}
	return { subjectKeyIdentifier };
};
var parseCertificate = (bytes, node, index) => {
	var _a;
	if (!isTag(node, UNIVERSAL, TAG.sequence) || node.children.length < 3) return;
	const [tbs, outerSignatureAlgorithm] = node.children;
	if (!tbs || !isTag(tbs, UNIVERSAL, TAG.sequence)) return;
	const children = tbs.children;
	let cursor = 0;
	let version = 1;
	if (isTag(children[cursor], CONTEXT, 0)) {
		const versionNode = (_a = children[cursor]) === null || _a === void 0 ? void 0 : _a.children[0];
		if (versionNode && isTag(versionNode, UNIVERSAL, TAG.integer)) version = (integerNumber(bytes, versionNode) || 0) + 1;
		cursor += 1;
	}
	const serialNode = children[cursor++];
	const tbsSignatureAlgorithm = children[cursor++];
	const issuerNode = children[cursor++];
	const validityNode = children[cursor++];
	const subjectNode = children[cursor++];
	const spkiNode = children[cursor];
	if (!serialNode || !issuerNode || !validityNode || !subjectNode || !spkiNode) return;
	const publicKeyAlgorithmNode = spkiNode.children[0];
	const publicKeyAlgorithmOid = algorithmOid(bytes, publicKeyAlgorithmNode);
	const curveOidNode = publicKeyAlgorithmNode === null || publicKeyAlgorithmNode === void 0 ? void 0 : publicKeyAlgorithmNode.children[1];
	const publicKeyCurveOid = curveOidNode && isTag(curveOidNode, UNIVERSAL, TAG.oid) ? decodeOid(bytes, curveOidNode) : void 0;
	const signatureAlgorithmOid = algorithmOid(bytes, outerSignatureAlgorithm) || algorithmOid(bytes, tbsSignatureAlgorithm);
	const { subjectKeyIdentifier } = parseExtensions(bytes, children);
	const issuerDer = bytesToHex(fullBytes(bytes, issuerNode));
	const serialDer = bytesToHex(positiveIntegerBytes(bytes, serialNode));
	const validity = validityNode.children.filter((child) => isTag(child, UNIVERSAL, TAG.utcTime) || isTag(child, UNIVERSAL, TAG.generalizedTime));
	return {
		node,
		summary: {
			index,
			version,
			serialNumber: serialDer,
			subject: decodeName(bytes, subjectNode),
			issuer: decodeName(bytes, issuerNode),
			notBefore: validity[0] ? decodeTime(bytes, validity[0]) : void 0,
			notAfter: validity[1] ? decodeTime(bytes, validity[1]) : void 0,
			signatureAlgorithmOid,
			signatureAlgorithm: formatOid(signatureAlgorithmOid),
			publicKeyAlgorithmOid,
			publicKeyAlgorithm: formatOid(publicKeyAlgorithmOid),
			publicKeyCurveOid,
			subjectKeyIdentifier
		},
		issuerDer,
		serialDer,
		subjectKeyIdentifier,
		spki: fullBytes(bytes, spkiNode),
		publicKeyAlgorithmOid,
		publicKeyCurveName: curveNameForOid(publicKeyCurveOid)
	};
};
var parseAttribute = (bytes, node) => {
	const [oidNode, valuesNode] = node.children;
	if (!oidNode || !valuesNode || !isTag(oidNode, UNIVERSAL, TAG.oid)) return;
	return {
		oid: decodeOid(bytes, oidNode),
		values: valuesNode.children
	};
};
var parseSigner = (bytes, node, index, limits) => {
	if (!isTag(node, UNIVERSAL, TAG.sequence)) return;
	const children = node.children;
	let cursor = 0;
	const versionNode = children[cursor++];
	const sidNode = children[cursor++];
	const digestAlgorithmNode = children[cursor++];
	if (!versionNode || !sidNode || !digestAlgorithmNode) return;
	const signedAttributesNode = isTag(children[cursor], CONTEXT, 0) ? children[cursor++] : void 0;
	const signatureAlgorithmNode = children[cursor++];
	const signatureNode = children[cursor++];
	const unsignedAttributesNode = isTag(children[cursor], CONTEXT, 1) ? children[cursor] : void 0;
	assertBounds(((signedAttributesNode === null || signedAttributesNode === void 0 ? void 0 : signedAttributesNode.children.length) || 0) <= limits.maxAttributesPerSigner, `CMS signed attribute count exceeds ${limits.maxAttributesPerSigner}.`);
	assertBounds(((unsignedAttributesNode === null || unsignedAttributesNode === void 0 ? void 0 : unsignedAttributesNode.children.length) || 0) <= limits.maxAttributesPerSigner, `CMS unsigned attribute count exceeds ${limits.maxAttributesPerSigner}.`);
	let issuerDer;
	let serialDer;
	let subjectKeyIdentifier;
	let sid = "Unknown signer identifier";
	if (isTag(sidNode, UNIVERSAL, TAG.sequence)) {
		const issuerNode = sidNode.children[0];
		const serialNode = sidNode.children[1];
		if (issuerNode && serialNode) {
			issuerDer = bytesToHex(fullBytes(bytes, issuerNode));
			serialDer = bytesToHex(positiveIntegerBytes(bytes, serialNode));
			sid = `${decodeName(bytes, issuerNode)} · ${serialDer}`;
		}
	} else if (isTag(sidNode, CONTEXT, 0)) {
		subjectKeyIdentifier = bytesToHex(contentBytes(bytes, sidNode));
		sid = `Subject key identifier ${subjectKeyIdentifier}`;
	}
	let signingTime;
	let messageDigest;
	let contentTypeOid;
	let signingCertificateV2 = false;
	for (const child of (signedAttributesNode === null || signedAttributesNode === void 0 ? void 0 : signedAttributesNode.children) || []) {
		const attribute = parseAttribute(bytes, child);
		const value = attribute === null || attribute === void 0 ? void 0 : attribute.values[0];
		if (!attribute || !value) continue;
		if (attribute.oid === OID.signingTimeAttribute && (isTag(value, UNIVERSAL, TAG.utcTime) || isTag(value, UNIVERSAL, TAG.generalizedTime))) signingTime = decodeTime(bytes, value);
		else if (attribute.oid === OID.messageDigestAttribute && isTag(value, UNIVERSAL, TAG.octetString)) messageDigest = bytesToHex(contentBytes(bytes, value));
		else if (attribute.oid === OID.contentTypeAttribute && isTag(value, UNIVERSAL, TAG.oid)) contentTypeOid = decodeOid(bytes, value);
		else if (attribute.oid === OID.signingCertificateV2Attribute) signingCertificateV2 = true;
	}
	let signatureTimestampTokens = 0;
	for (const child of (unsignedAttributesNode === null || unsignedAttributesNode === void 0 ? void 0 : unsignedAttributesNode.children) || []) {
		const attribute = parseAttribute(bytes, child);
		if ((attribute === null || attribute === void 0 ? void 0 : attribute.oid) === OID.signatureTimestampTokenAttribute) signatureTimestampTokens += attribute.values.length;
	}
	const digestAlgorithmOid = algorithmOid(bytes, digestAlgorithmNode);
	const signatureAlgorithmOid = algorithmOid(bytes, signatureAlgorithmNode);
	return {
		summary: {
			index,
			sid,
			digestAlgorithmOid,
			digestAlgorithm: formatOid(digestAlgorithmOid),
			signatureAlgorithmOid,
			signatureAlgorithm: formatOid(signatureAlgorithmOid),
			signingTime,
			messageDigest,
			contentTypeOid,
			signatureTimestampTokens,
			signingCertificateV2
		},
		issuerDer,
		serialDer,
		subjectKeyIdentifier,
		digestAlgorithmNode,
		signatureAlgorithmNode,
		signedAttributesNode,
		signature: signatureNode && isTag(signatureNode, UNIVERSAL, TAG.octetString) ? contentBytes(bytes, signatureNode) : void 0
	};
};
var parseCmsContentInfo = (bytes, root, limits) => {
	assertBounds(isTag(root, UNIVERSAL, TAG.sequence), "CMS ContentInfo must be an ASN.1 SEQUENCE.");
	const oidNode = root.children[0];
	assertBounds(oidNode && isTag(oidNode, UNIVERSAL, TAG.oid), "CMS ContentInfo is missing contentType.");
	const contentTypeOid = decodeOid(bytes, oidNode);
	if (contentTypeOid !== OID.signedData) return {
		contentTypeOid,
		digestAlgorithmOids: [],
		certificates: [],
		crlCount: 0,
		signers: []
	};
	const explicitContent = root.children.find((child) => isTag(child, CONTEXT, 0));
	const signedData = explicitContent === null || explicitContent === void 0 ? void 0 : explicitContent.children[0];
	assertBounds(signedData && isTag(signedData, UNIVERSAL, TAG.sequence), "CMS SignedData payload is missing.");
	const children = signedData.children;
	const digestAlgorithmsNode = children[1];
	const encapContentInfo = children[2];
	assertBounds(digestAlgorithmsNode && encapContentInfo, "CMS SignedData is truncated.");
	assertBounds(digestAlgorithmsNode.children.length <= limits.maxDigestAlgorithms, `CMS digest algorithm count exceeds ${limits.maxDigestAlgorithms}.`);
	const digestAlgorithmOids = digestAlgorithmsNode.children.map((child) => algorithmOid(bytes, child)).filter((value) => Boolean(value));
	const signedContentTypeNode = encapContentInfo.children[0];
	const signedContentTypeOid = signedContentTypeNode && isTag(signedContentTypeNode, UNIVERSAL, TAG.oid) ? decodeOid(bytes, signedContentTypeNode) : void 0;
	const eContentNode = encapContentInfo.children.find((child) => isTag(child, CONTEXT, 0));
	const embeddedContent = eContentNode ? collectOctetString(bytes, eContentNode, limits.maxEmbeddedContentBytes) : void 0;
	const certificatesNode = children.find((child) => isTag(child, CONTEXT, 0));
	const crlsNode = children.find((child) => isTag(child, CONTEXT, 1));
	const signerInfosNode = [...children].reverse().find((child) => isTag(child, UNIVERSAL, TAG.set));
	assertBounds(((certificatesNode === null || certificatesNode === void 0 ? void 0 : certificatesNode.children.length) || 0) <= limits.maxCertificates, `CMS certificate count exceeds ${limits.maxCertificates}.`);
	assertBounds(((crlsNode === null || crlsNode === void 0 ? void 0 : crlsNode.children.length) || 0) <= limits.maxCrls, `CMS CRL count exceeds ${limits.maxCrls}.`);
	assertBounds(((signerInfosNode === null || signerInfosNode === void 0 ? void 0 : signerInfosNode.children.length) || 0) <= limits.maxSigners, `CMS signer count exceeds ${limits.maxSigners}.`);
	const certificates = ((certificatesNode === null || certificatesNode === void 0 ? void 0 : certificatesNode.children) || []).map((child, index) => parseCertificate(bytes, child, index)).filter((value) => Boolean(value));
	const signers = ((signerInfosNode === null || signerInfosNode === void 0 ? void 0 : signerInfosNode.children) || []).map((child, index) => parseSigner(bytes, child, index, limits)).filter((value) => Boolean(value));
	return {
		contentTypeOid,
		signedContentTypeOid,
		digestAlgorithmOids,
		embeddedContent,
		certificates,
		crlCount: (crlsNode === null || crlsNode === void 0 ? void 0 : crlsNode.children.length) || 0,
		signers
	};
};
var subtleCrypto = () => {
	var _a;
	return (_a = globalThis.crypto) === null || _a === void 0 ? void 0 : _a.subtle;
};
var cryptoBytes = (bytes) => new Uint8Array(bytes);
var digestNameForOid = (oid) => {
	if (oid === OID.sha1) return "SHA-1";
	if (oid === OID.sha256) return "SHA-256";
	if (oid === OID.sha384) return "SHA-384";
	if (oid === OID.sha512) return "SHA-512";
};
var digestBytes = async (oid, bytes) => {
	const subtle = subtleCrypto();
	const algorithm = digestNameForOid(oid);
	if (!subtle || !algorithm) return;
	return new Uint8Array(await subtle.digest(algorithm, cryptoBytes(bytes)));
};
var pssSaltLength = (bytes, algorithmNode, hashOid) => {
	const defaultLength = hashOid === OID.sha512 ? 64 : hashOid === OID.sha384 ? 48 : hashOid === OID.sha1 ? 20 : 32;
	const params = algorithmNode === null || algorithmNode === void 0 ? void 0 : algorithmNode.children[1];
	const saltContainer = params === null || params === void 0 ? void 0 : params.children.find((child) => isTag(child, CONTEXT, 2));
	const saltNode = saltContainer === null || saltContainer === void 0 ? void 0 : saltContainer.children[0];
	return saltNode && isTag(saltNode, UNIVERSAL, TAG.integer) ? integerNumber(bytes, saltNode) || defaultLength : defaultLength;
};
var signatureHashOid = (signatureOid, digestOid) => {
	if (signatureOid === OID.sha1WithRsa) return OID.sha1;
	if (signatureOid === OID.sha256WithRsa || signatureOid === OID.ecdsaSha256) return OID.sha256;
	if (signatureOid === OID.sha384WithRsa || signatureOid === OID.ecdsaSha384) return OID.sha384;
	if (signatureOid === OID.sha512WithRsa || signatureOid === OID.ecdsaSha512) return OID.sha512;
	return digestOid;
};
var signedAttributesBytes = (bytes, node) => {
	const raw = new Uint8Array(fullBytes(bytes, node));
	if (raw.byteLength && raw[0] === 160) raw[0] = 49;
	return raw;
};
var ecdsaDerToRaw = (signature, coordinateLength) => {
	try {
		const root = parseRoot(signature);
		if (!isTag(root, UNIVERSAL, TAG.sequence) || root.children.length < 2) return signature;
		const normalize = (node) => {
			let value = positiveIntegerBytes(signature, node);
			if (value.byteLength > coordinateLength) value = value.subarray(value.byteLength - coordinateLength);
			const output = new Uint8Array(coordinateLength);
			output.set(value, coordinateLength - value.byteLength);
			return output;
		};
		const raw = new Uint8Array(coordinateLength * 2);
		raw.set(normalize(root.children[0]), 0);
		raw.set(normalize(root.children[1]), coordinateLength);
		return raw;
	} catch {
		return signature;
	}
};
var findSignerCertificate = (signer, certificates) => {
	if (signer.subjectKeyIdentifier) return certificates.find((certificate) => certificate.subjectKeyIdentifier === signer.subjectKeyIdentifier);
	if (signer.issuerDer && signer.serialDer) return certificates.find((certificate) => certificate.issuerDer === signer.issuerDer && certificate.serialDer === signer.serialDer);
};
var verifySigner = async (bytes, signer, certificates, content) => {
	var _a;
	const summary = signer.summary;
	const digestOid = summary.digestAlgorithmOid;
	if (content && summary.messageDigest) {
		const digest = await digestBytes(digestOid, content);
		if (digest) summary.digestMatches = equalBytes(digest, Uint8Array.from(((_a = summary.messageDigest.match(/.{2}/g)) === null || _a === void 0 ? void 0 : _a.map((value) => Number.parseInt(value, 16))) || []));
	}
	const certificate = findSignerCertificate(signer, certificates);
	if (!certificate) {
		summary.verificationError = "Matching signer certificate is not included.";
		return;
	}
	summary.certificateIndex = certificate.summary.index;
	if (!signer.signature) {
		summary.verificationError = "Signature value is missing.";
		return;
	}
	const signedInput = signer.signedAttributesNode ? signedAttributesBytes(bytes, signer.signedAttributesNode) : content;
	if (!signedInput) {
		summary.verificationError = "Original content is required to verify this signature.";
		return;
	}
	const subtle = subtleCrypto();
	if (!subtle) {
		summary.verificationError = "Web Crypto is unavailable.";
		return;
	}
	const signatureOid = summary.signatureAlgorithmOid;
	const hashOid = signatureHashOid(signatureOid, digestOid);
	const hash = digestNameForOid(hashOid);
	try {
		if (certificate.publicKeyAlgorithmOid === OID.rsaEncryption || signatureOid === OID.rsaEncryption || signatureOid === OID.sha1WithRsa || signatureOid === OID.sha256WithRsa || signatureOid === OID.sha384WithRsa || signatureOid === OID.sha512WithRsa) {
			assertBounds(hash, `Unsupported RSA digest algorithm ${hashOid || "unknown"}.`);
			const algorithm = {
				name: "RSASSA-PKCS1-v1_5",
				hash
			};
			const key = await subtle.importKey("spki", cryptoBytes(certificate.spki), algorithm, false, ["verify"]);
			summary.cryptographicSignatureValid = await subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, key, cryptoBytes(signer.signature), cryptoBytes(signedInput));
			return;
		}
		if (signatureOid === OID.rsaPss) {
			assertBounds(hash, `Unsupported RSA-PSS digest algorithm ${hashOid || "unknown"}.`);
			const algorithm = {
				name: "RSA-PSS",
				hash
			};
			const key = await subtle.importKey("spki", cryptoBytes(certificate.spki), algorithm, false, ["verify"]);
			summary.cryptographicSignatureValid = await subtle.verify({
				name: "RSA-PSS",
				saltLength: pssSaltLength(bytes, signer.signatureAlgorithmNode, hashOid)
			}, key, cryptoBytes(signer.signature), cryptoBytes(signedInput));
			return;
		}
		if (certificate.publicKeyAlgorithmOid === OID.ecPublicKey || signatureOid === OID.ecdsaSha256 || signatureOid === OID.ecdsaSha384 || signatureOid === OID.ecdsaSha512) {
			assertBounds(hash, `Unsupported ECDSA digest algorithm ${hashOid || "unknown"}.`);
			assertBounds(certificate.publicKeyCurveName, "Unsupported or missing EC named curve.");
			const key = await subtle.importKey("spki", cryptoBytes(certificate.spki), {
				name: "ECDSA",
				namedCurve: certificate.publicKeyCurveName
			}, false, ["verify"]);
			const coordinateLength = certificate.publicKeyCurveName === "P-521" ? 66 : certificate.publicKeyCurveName === "P-384" ? 48 : 32;
			summary.cryptographicSignatureValid = await subtle.verify({
				name: "ECDSA",
				hash
			}, key, cryptoBytes(ecdsaDerToRaw(signer.signature, coordinateLength)), cryptoBytes(signedInput));
			return;
		}
		if (certificate.publicKeyAlgorithmOid === OID.ed25519 || signatureOid === OID.ed25519) {
			const key = await subtle.importKey("spki", cryptoBytes(certificate.spki), { name: "Ed25519" }, false, ["verify"]);
			summary.cryptographicSignatureValid = await subtle.verify("Ed25519", key, cryptoBytes(signer.signature), cryptoBytes(signedInput));
			return;
		}
		summary.verificationError = `Unsupported signature algorithm ${signatureOid || "unknown"}.`;
	} catch (error) {
		summary.verificationError = error instanceof Error ? error.message : String(error);
	}
};
var enrichCertificateFingerprints = async (certificates, bytes) => {
	const subtle = subtleCrypto();
	if (!subtle) return;
	await Promise.all(certificates.map(async (certificate) => {
		try {
			const digest = new Uint8Array(await subtle.digest("SHA-256", cryptoBytes(fullBytes(bytes, certificate.node))));
			certificate.summary.fingerprintSha256 = bytesToHex(digest, ":");
		} catch {}
	}));
};
var parseMessageImprint = (bytes, node) => {
	if (!node || !isTag(node, UNIVERSAL, TAG.sequence)) return {};
	const algorithm = node.children[0];
	const digest = node.children[1];
	const algorithmOidValue = algorithmOid(bytes, algorithm);
	return {
		algorithmOid: algorithmOidValue,
		algorithm: formatOid(algorithmOidValue),
		digest: digest && isTag(digest, UNIVERSAL, TAG.octetString) ? bytesToHex(contentBytes(bytes, digest)) : void 0
	};
};
var parseAccuracy = (bytes, node) => {
	const accuracy = {};
	for (const child of node.children) if (isTag(child, UNIVERSAL, TAG.integer)) accuracy.seconds = integerNumber(bytes, child);
	else if (isTag(child, CONTEXT, 0)) {
		const value = child.children[0];
		accuracy.millis = value ? integerNumber(bytes, value) : Number.parseInt(bytesToHex(contentBytes(bytes, child)), 16);
	} else if (isTag(child, CONTEXT, 1)) {
		const value = child.children[0];
		accuracy.micros = value ? integerNumber(bytes, value) : Number.parseInt(bytesToHex(contentBytes(bytes, child)), 16);
	}
	return accuracy;
};
var decodeGeneralName = (bytes, node) => {
	if (node.tagClass !== CONTEXT) return bytesToHex(contentBytes(bytes, node));
	if (node.tagNumber === 4 && node.children[0]) return decodeName(bytes, node.children[0]);
	if ([
		1,
		2,
		6
	].includes(node.tagNumber)) return decodeAscii(contentBytes(bytes, node));
	if (node.tagNumber === 8) try {
		return decodeOid(bytes, {
			...node,
			tagClass: UNIVERSAL,
			tagNumber: TAG.oid
		});
	} catch {
		return bytesToHex(contentBytes(bytes, node));
	}
	return bytesToHex(contentBytes(bytes, node));
};
var parseTstInfo = async (bytes, originalContent, limits) => {
	const root = parseRoot(bytes, limits);
	assertBounds(isTag(root, UNIVERSAL, TAG.sequence), "RFC 3161 TSTInfo must be a SEQUENCE.");
	const children = root.children;
	const versionNode = children[0];
	const policyNode = children[1];
	const imprintNode = children[2];
	const serialNode = children[3];
	const generationTimeNode = children[4];
	const imprint = parseMessageImprint(bytes, imprintNode);
	const summary = {
		version: versionNode ? integerNumber(bytes, versionNode) : void 0,
		policyOid: policyNode && isTag(policyNode, UNIVERSAL, TAG.oid) ? decodeOid(bytes, policyNode) : void 0,
		serialNumber: serialNode ? integerHex(bytes, serialNode) : void 0,
		generationTime: generationTimeNode ? decodeTime(bytes, generationTimeNode) : void 0,
		messageImprintAlgorithmOid: imprint.algorithmOid,
		messageImprintAlgorithm: imprint.algorithm,
		messageImprint: imprint.digest
	};
	for (const child of children.slice(5)) if (isTag(child, UNIVERSAL, TAG.sequence) && summary.accuracy === void 0) summary.accuracy = parseAccuracy(bytes, child);
	else if (isTag(child, UNIVERSAL, TAG.boolean)) summary.ordering = decodeBoolean(bytes, child);
	else if (isTag(child, UNIVERSAL, TAG.integer) && !summary.nonce) summary.nonce = integerHex(bytes, child);
	else if (isTag(child, CONTEXT, 0)) summary.tsa = decodeGeneralName(bytes, child.children[0] || child);
	if (originalContent && imprint.algorithmOid && imprint.digest) {
		const digest = await digestBytes(imprint.algorithmOid, originalContent);
		if (digest) summary.messageImprintMatchesOriginal = bytesToHex(digest) === imprint.digest;
	}
	return summary;
};
var parseTimestampRequest = async (bytes, root, originalContent) => {
	const children = root.children;
	const versionNode = children[0];
	const imprint = parseMessageImprint(bytes, children[1]);
	const summary = {
		version: versionNode ? integerNumber(bytes, versionNode) : void 0,
		messageImprintAlgorithmOid: imprint.algorithmOid,
		messageImprintAlgorithm: imprint.algorithm,
		messageImprint: imprint.digest
	};
	for (const child of children.slice(2)) if (isTag(child, UNIVERSAL, TAG.oid) && !summary.policyOid) summary.policyOid = decodeOid(bytes, child);
	else if (isTag(child, UNIVERSAL, TAG.integer) && !summary.nonce) summary.nonce = integerHex(bytes, child);
	else if (isTag(child, UNIVERSAL, TAG.boolean)) summary.certReq = decodeBoolean(bytes, child);
	if (originalContent && imprint.algorithmOid && imprint.digest) {
		const digest = await digestBytes(imprint.algorithmOid, originalContent);
		if (digest) summary.messageImprintMatchesOriginal = bytesToHex(digest) === imprint.digest;
	}
	return summary;
};
var timestampStatusLabel = (status) => {
	return status === void 0 ? void 0 : {
		0: "granted",
		1: "grantedWithMods",
		2: "rejection",
		3: "waiting",
		4: "revocationWarning",
		5: "revocationNotification"
	}[status] || `status-${status}`;
};
var decodeTimestampFailureInfo = (bytes, node) => {
	if (!node || !isTag(node, UNIVERSAL, TAG.bitString)) return void 0;
	const value = contentBytes(bytes, node);
	if (value.byteLength < 2) return bytesToHex(value);
	const unused = value[0] || 0;
	const payload = value.subarray(1);
	const names = [
		[0, "badAlg"],
		[2, "badRequest"],
		[5, "badDataFormat"],
		[14, "timeNotAvailable"],
		[15, "unacceptedPolicy"],
		[16, "unacceptedExtension"],
		[17, "addInfoNotAvailable"],
		[25, "systemFailure"]
	];
	const set = [];
	for (const [bit, name] of names) {
		const byteIndex = Math.floor(bit / 8);
		const bitIndex = 7 - bit % 8;
		if (byteIndex < payload.byteLength && payload[byteIndex] & 1 << bitIndex) set.push(name);
	}
	return set.length ? set.join(", ") : `0x${bytesToHex(payload)} (unused bits ${unused})`;
};
var parseTimestampResponse = (bytes, root) => {
	const statusInfoNode = root.children[0];
	const tokenNode = root.children[1];
	assertBounds(statusInfoNode && isTag(statusInfoNode, UNIVERSAL, TAG.sequence), "RFC 3161 response is missing PKIStatusInfo.");
	const statusNode = statusInfoNode.children[0];
	const status = statusNode ? integerNumber(bytes, statusNode) : void 0;
	const stringsNode = statusInfoNode.children.find((child) => isTag(child, UNIVERSAL, TAG.sequence));
	const failureNode = statusInfoNode.children.find((child) => isTag(child, UNIVERSAL, TAG.bitString));
	return {
		response: {
			status,
			statusLabel: timestampStatusLabel(status),
			statusText: ((stringsNode === null || stringsNode === void 0 ? void 0 : stringsNode.children) || []).map((child) => decodeString(bytes, child)),
			failureInfo: decodeTimestampFailureInfo(bytes, failureNode)
		},
		tokenNode
	};
};
var looksLikeTimestampRequest = (root) => {
	const [version, imprint] = root.children;
	return Boolean(isTag(version, UNIVERSAL, TAG.integer) && isTag(imprint, UNIVERSAL, TAG.sequence) && isTag(imprint === null || imprint === void 0 ? void 0 : imprint.children[0], UNIVERSAL, TAG.sequence) && isTag(imprint === null || imprint === void 0 ? void 0 : imprint.children[1], UNIVERSAL, TAG.octetString));
};
var looksLikeTimestampResponse = (root) => {
	const statusInfo = root.children[0];
	return Boolean(isTag(statusInfo, UNIVERSAL, TAG.sequence) && isTag(statusInfo === null || statusInfo === void 0 ? void 0 : statusInfo.children[0], UNIVERSAL, TAG.integer));
};
var cmsKind = (cms) => {
	if (cms.contentTypeOid !== OID.signedData) return "cms-content";
	if (cms.signedContentTypeOid === OID.tstInfo) return "timestamp-token";
	if (!cms.signers.length && cms.certificates.length) return "cms-certificates";
	return "cms-signed-data";
};
var detectedFormatForKind = (kind) => {
	return {
		"cms-signed-data": "CMS / PKCS#7 SignedData",
		"cms-certificates": "CMS / PKCS#7 certificate container",
		"cms-content": "CMS / PKCS#7 content container",
		"timestamp-request": "RFC 3161 TimeStampReq",
		"timestamp-response": "RFC 3161 TimeStampResp",
		"timestamp-token": "RFC 3161 TimeStampToken",
		"timestamped-data": "RFC 5544 TimeStampedData",
		unknown: "Unknown cryptographic container"
	}[kind];
};
var baseWarnings = () => [
	"Cryptographic verification does not establish certificate trust, policy compliance, qualified status, or legal validity.",
	"This ASN.1 path covers bounded CMS/PKCS#7, selected CAdES attributes, RFC 3161, and RFC 5544 TimeStampedData; ASiC, RFC 4998, JWS/JAdES metadata, and OpenPGP use separate bounded paths in this renderer.",
	"PAdES, full XMLDSig/XAdES/JAdES profile validation, S/MIME, and PGP/MIME host integration are not performed by this ASN.1 path.",
	"No private-key operations, passphrases, trust stores, network lookups, or LGPL OpenPGP source are used or bundled."
];
var inspectCmsNode = async (bytes, root, originalContent, limits) => {
	const cms = parseCmsContentInfo(bytes, root, limits);
	await enrichCertificateFingerprints(cms.certificates, bytes);
	const verificationContent = cms.embeddedContent || originalContent;
	await Promise.all(cms.signers.map((signer) => verifySigner(bytes, signer, cms.certificates, verificationContent)));
	const kind = cmsKind(cms);
	const timestamp = cms.signedContentTypeOid === OID.tstInfo && cms.embeddedContent ? await parseTstInfo(cms.embeddedContent, originalContent, limits) : void 0;
	return {
		kind,
		detectedFormat: detectedFormatForKind(kind),
		sourceSize: bytes.byteLength,
		contentTypeOid: cms.contentTypeOid,
		contentType: formatOid(cms.contentTypeOid),
		signedContentTypeOid: cms.signedContentTypeOid,
		signedContentType: formatOid(cms.signedContentTypeOid),
		digestAlgorithms: cms.digestAlgorithmOids.map(formatOid),
		embeddedContent: cms.embeddedContent,
		detached: cms.contentTypeOid === OID.signedData && !cms.embeddedContent && cms.signers.length > 0,
		requiresOriginalContent: cms.contentTypeOid === OID.signedData && !cms.embeddedContent && cms.signers.length > 0 || Boolean((timestamp === null || timestamp === void 0 ? void 0 : timestamp.messageImprint) && originalContent === void 0),
		originalContentSupplied: Boolean(originalContent),
		certificates: cms.certificates.map((certificate) => certificate.summary),
		signers: cms.signers.map((signer) => signer.summary),
		timestamp,
		crlCount: cms.crlCount,
		warnings: baseWarnings()
	};
};
var PEM_ENVELOPES = [{
	begin: "-----BEGIN PKCS7-----",
	end: "-----END PKCS7-----"
}, {
	begin: "-----BEGIN CMS-----",
	end: "-----END CMS-----"
}];
var isPemWhitespaceCode = (code) => code === 9 || code === 10 || code === 12 || code === 13 || code === 32;
var isBase64Code = (code) => code >= 65 && code <= 90 || code >= 97 && code <= 122 || code >= 48 && code <= 57 || code === 43 || code === 47 || code === 61;
var decodePemIfNeeded = (input) => {
	if (!new TextDecoder("ascii", { fatal: false }).decode(input.subarray(0, Math.min(input.byteLength, 128))).includes("-----BEGIN ")) return input;
	const text = new TextDecoder("ascii", { fatal: false }).decode(input);
	let envelope;
	let beginIndex = -1;
	for (const candidate of PEM_ENVELOPES) {
		const candidateIndex = text.indexOf(candidate.begin);
		if (candidateIndex >= 0 && (beginIndex < 0 || candidateIndex < beginIndex)) {
			envelope = candidate;
			beginIndex = candidateIndex;
		}
	}
	assertBounds(envelope && beginIndex >= 0, "Unsupported PEM cryptographic container. Expected PKCS7 or CMS armor.");
	const payloadStart = beginIndex + envelope.begin.length;
	const payloadEnd = text.indexOf(envelope.end, payloadStart);
	assertBounds(payloadEnd >= 0, "PEM cryptographic container is missing its matching footer.");
	const chunks = [];
	let chunk = "";
	let compactLength = 0;
	let paddingStart = -1;
	for (let index = payloadStart; index < payloadEnd; index += 1) {
		const code = text.charCodeAt(index);
		if (isPemWhitespaceCode(code)) continue;
		assertBounds(isBase64Code(code), "Malformed PEM base64 payload.");
		if (code === 61) {
			if (paddingStart < 0) paddingStart = compactLength;
		} else assertBounds(paddingStart < 0, "Malformed PEM base64 padding.");
		chunk += String.fromCharCode(code);
		compactLength += 1;
		if (chunk.length === 8192) {
			chunks.push(chunk);
			chunk = "";
		}
	}
	if (chunk) chunks.push(chunk);
	assertBounds(compactLength > 0 && compactLength % 4 === 0, "Malformed PEM base64 payload.");
	assertBounds(paddingStart < 0 || compactLength - paddingStart <= 2, "Malformed PEM base64 padding.");
	assertBounds(typeof atob === "function", "PEM decoding requires a browser with atob support.");
	let binary;
	try {
		binary = atob(chunks.join(""));
	} catch {
		throw new Error("Malformed PEM base64 payload.");
	}
	const output = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) output[index] = binary.charCodeAt(index);
	return output;
};
var findCmsContentInfoNode = (bytes, node, depth = 0) => {
	if (depth > 12) return void 0;
	if (isTag(node, UNIVERSAL, TAG.sequence)) {
		const first = node.children[0];
		if (first && isTag(first, UNIVERSAL, TAG.oid) && decodeOid(bytes, first) === OID.signedData) return node;
	}
	for (const child of node.children) {
		const found = findCmsContentInfoNode(bytes, child, depth + 1);
		if (found) return found;
	}
};
var parseTimestampedData = async (bytes, root, originalContent, limits) => {
	var _a;
	const content = (_a = root.children.find((child) => isTag(child, CONTEXT, 0))) === null || _a === void 0 ? void 0 : _a.children[0];
	assertBounds(content && isTag(content, UNIVERSAL, TAG.sequence), "RFC 5544 TimeStampedData payload is missing.");
	const fields = content.children;
	let cursor = 0;
	const versionNode = fields[cursor++];
	assertBounds(versionNode && isTag(versionNode, UNIVERSAL, TAG.integer), "RFC 5544 TimeStampedData version is missing.");
	let dataUri;
	if (isTag(fields[cursor], UNIVERSAL, TAG.ia5String)) dataUri = decodeString(bytes, fields[cursor++]);
	let filename;
	let mediaType;
	let hashProtected;
	const metadataNode = fields[cursor] && isTag(fields[cursor], UNIVERSAL, TAG.sequence) ? fields[cursor++] : void 0;
	if (metadataNode) {
		const metadata = metadataNode.children;
		if (metadata[0] && isTag(metadata[0], UNIVERSAL, TAG.boolean)) hashProtected = decodeBoolean(bytes, metadata[0]);
		for (const child of metadata.slice(1)) if (!filename && (isTag(child, UNIVERSAL, TAG.utf8String) || isTag(child, UNIVERSAL, TAG.printableString))) filename = decodeString(bytes, child);
		else if (!mediaType && isTag(child, UNIVERSAL, TAG.ia5String)) mediaType = decodeString(bytes, child);
	}
	const embeddedNode = fields[cursor] && isTag(fields[cursor], UNIVERSAL, TAG.octetString) ? fields[cursor++] : void 0;
	const embeddedContent = embeddedNode ? collectOctetString(bytes, embeddedNode, limits.maxEmbeddedContentBytes) : void 0;
	const evidenceNode = fields[cursor];
	const cmsNode = evidenceNode ? findCmsContentInfoNode(bytes, evidenceNode) : void 0;
	const evidenceInspection = cmsNode ? await inspectCmsNode(bytes, cmsNode, embeddedContent || originalContent, limits) : void 0;
	const evidenceEntries = (evidenceNode === null || evidenceNode === void 0 ? void 0 : evidenceNode.children.length) || 0;
	assertBounds(evidenceEntries <= limits.maxTimestampEvidenceEntries, `RFC 5544 temporal evidence count exceeds ${limits.maxTimestampEvidenceEntries}.`);
	return {
		kind: "timestamped-data",
		detectedFormat: detectedFormatForKind("timestamped-data"),
		sourceSize: bytes.byteLength,
		contentTypeOid: OID.timestampedData,
		contentType: formatOid(OID.timestampedData),
		digestAlgorithms: (evidenceInspection === null || evidenceInspection === void 0 ? void 0 : evidenceInspection.digestAlgorithms) || [],
		embeddedContent,
		detached: !embeddedContent,
		requiresOriginalContent: !embeddedContent && Boolean(dataUri),
		originalContentSupplied: Boolean(originalContent),
		certificates: (evidenceInspection === null || evidenceInspection === void 0 ? void 0 : evidenceInspection.certificates) || [],
		signers: (evidenceInspection === null || evidenceInspection === void 0 ? void 0 : evidenceInspection.signers) || [],
		timestamp: evidenceInspection === null || evidenceInspection === void 0 ? void 0 : evidenceInspection.timestamp,
		crlCount: (evidenceInspection === null || evidenceInspection === void 0 ? void 0 : evidenceInspection.crlCount) || 0,
		timestampedData: {
			dataUri,
			filename,
			mediaType,
			hashProtected,
			temporalEvidenceEntries: evidenceEntries
		},
		warnings: [...baseWarnings(), ...dataUri ? ["External RFC 5544 dataUri values are displayed as untrusted metadata and are never fetched automatically."] : []]
	};
};
var inspectSignatureContainer = async (input, options = {}) => {
	const limits = normalizeSignatureAsn1Limits(options.limits);
	const rawBytes = toUint8Array(input);
	assertBounds(rawBytes.byteLength <= limits.maxInputBytes, `Cryptographic container exceeds the ${limits.maxInputBytes}-byte boundary.`);
	const bytes = decodePemIfNeeded(rawBytes);
	assertBounds(bytes.byteLength > 0, "The cryptographic container is empty.");
	assertBounds(bytes.byteLength <= limits.maxInputBytes, `Decoded cryptographic container exceeds the ${limits.maxInputBytes}-byte boundary.`);
	const originalContent = options.originalContent ? toUint8Array(options.originalContent) : void 0;
	assertBounds(((originalContent === null || originalContent === void 0 ? void 0 : originalContent.byteLength) || 0) <= limits.maxOriginalContentBytes, `Original content exceeds the ${limits.maxOriginalContentBytes}-byte boundary.`);
	const root = parseRoot(bytes, limits);
	assertBounds(isTag(root, UNIVERSAL, TAG.sequence), "Unsupported cryptographic container: ASN.1 root is not a SEQUENCE.");
	const first = root.children[0];
	if (first && isTag(first, UNIVERSAL, TAG.oid)) {
		if (decodeOid(bytes, first) === OID.timestampedData) return parseTimestampedData(bytes, root, originalContent, limits);
		return inspectCmsNode(bytes, root, originalContent, limits);
	}
	if (looksLikeTimestampRequest(root)) {
		const timestamp = await parseTimestampRequest(bytes, root, originalContent);
		return {
			kind: "timestamp-request",
			detectedFormat: detectedFormatForKind("timestamp-request"),
			sourceSize: bytes.byteLength,
			digestAlgorithms: timestamp.messageImprintAlgorithm ? [timestamp.messageImprintAlgorithm] : [],
			detached: true,
			requiresOriginalContent: Boolean(timestamp.messageImprint && !originalContent),
			originalContentSupplied: Boolean(originalContent),
			certificates: [],
			signers: [],
			timestamp,
			crlCount: 0,
			warnings: baseWarnings()
		};
	}
	if (looksLikeTimestampResponse(root)) {
		const { response, tokenNode } = parseTimestampResponse(bytes, root);
		if (tokenNode) return {
			...await inspectCmsNode(bytes, tokenNode, originalContent, limits),
			kind: "timestamp-response",
			detectedFormat: detectedFormatForKind("timestamp-response"),
			timestampResponse: response
		};
		return {
			kind: "timestamp-response",
			detectedFormat: detectedFormatForKind("timestamp-response"),
			sourceSize: bytes.byteLength,
			digestAlgorithms: [],
			detached: true,
			requiresOriginalContent: false,
			originalContentSupplied: Boolean(originalContent),
			certificates: [],
			signers: [],
			timestampResponse: response,
			crlCount: 0,
			warnings: baseWarnings()
		};
	}
	return {
		kind: "unknown",
		detectedFormat: detectedFormatForKind("unknown"),
		sourceSize: bytes.byteLength,
		digestAlgorithms: [],
		detached: false,
		requiresOriginalContent: false,
		originalContentSupplied: Boolean(originalContent),
		certificates: [],
		signers: [],
		crlCount: 0,
		warnings: baseWarnings()
	};
};
var countReducedHashTreeNodes = (node, maximum) => {
	if (!node) return 0;
	let count = 0;
	const pending = [node];
	while (pending.length) {
		const current = pending.pop();
		if (isTag(current, UNIVERSAL, TAG.octetString)) {
			count += 1;
			assertBounds(count <= maximum, `EvidenceRecord reduced hash tree exceeds ${maximum} nodes.`);
		}
		for (const child of current.children) pending.push(child);
	}
	return count;
};
var findEvidenceTimestampContentInfo = (bytes, node) => [...node.children].reverse().find((child) => {
	if (!isTag(child, UNIVERSAL, TAG.sequence)) return false;
	const oidNode = child.children[0];
	if (!oidNode || !isTag(oidNode, UNIVERSAL, TAG.oid)) return false;
	try {
		return decodeOid(bytes, oidNode) === OID.signedData;
	} catch {
		return false;
	}
});
/**
* Bounded RFC 4998 structural inspection. Only the first archive timestamp can
* be compared directly with supplied original bytes when no reduced hash tree
* is present. Renewal chains are reported but never over-claimed as validated.
*/
var inspectEvidenceRecord = async (input, options = {}) => {
	var _a;
	const limits = normalizeSignatureAsn1Limits(options.limits);
	const bytes = toUint8Array(input);
	assertBounds(bytes.byteLength > 0, "EvidenceRecord input is empty.");
	assertBounds(bytes.byteLength <= limits.maxInputBytes, `EvidenceRecord input exceeds the ${limits.maxInputBytes}-byte boundary.`);
	const root = parseRoot(bytes, limits);
	assertBounds(isTag(root, UNIVERSAL, TAG.sequence), "RFC 4998 EvidenceRecord must be an ASN.1 SEQUENCE.");
	const versionNode = root.children[0];
	const algorithmsNode = root.children[1];
	assertBounds(versionNode && isTag(versionNode, UNIVERSAL, TAG.integer), "EvidenceRecord version is missing.");
	assertBounds(algorithmsNode && isTag(algorithmsNode, UNIVERSAL, TAG.sequence), "EvidenceRecord digestAlgorithms are missing.");
	const version = integerNumber(bytes, versionNode);
	assertBounds(version === 1, `Unsupported EvidenceRecord version ${version !== null && version !== void 0 ? version : "unknown"}.`);
	assertBounds(algorithmsNode.children.length > 0 && algorithmsNode.children.length <= limits.maxDigestAlgorithms, `EvidenceRecord digest algorithm count must be between 1 and ${limits.maxDigestAlgorithms}.`);
	const digestAlgorithmOids = algorithmsNode.children.map((node) => algorithmOid(bytes, node));
	assertBounds(digestAlgorithmOids.every(Boolean), "EvidenceRecord contains a malformed digest algorithm.");
	const digestAlgorithms = digestAlgorithmOids.map((oid) => formatOid(oid));
	const sequenceNode = [...root.children].reverse().find((node) => isTag(node, UNIVERSAL, TAG.sequence) && node !== algorithmsNode);
	assertBounds(sequenceNode, "EvidenceRecord archiveTimeStampSequence is missing.");
	assertBounds(sequenceNode.children.length > 0 && sequenceNode.children.length <= limits.maxEvidenceChains, `EvidenceRecord archive timestamp chain count exceeds ${limits.maxEvidenceChains}.`);
	const originalContent = options.originalContent ? toUint8Array(options.originalContent) : void 0;
	assertBounds(((originalContent === null || originalContent === void 0 ? void 0 : originalContent.byteLength) || 0) <= limits.maxOriginalContentBytes, `Original content exceeds the ${limits.maxOriginalContentBytes}-byte boundary.`);
	const archiveTimestamps = [];
	let totalTimestamps = 0;
	for (let chainIndex = 0; chainIndex < sequenceNode.children.length; chainIndex += 1) {
		const chain = sequenceNode.children[chainIndex];
		assertBounds(isTag(chain, UNIVERSAL, TAG.sequence), "EvidenceRecord archive timestamp chain is malformed.");
		assertBounds(chain.children.length > 0 && chain.children.length <= limits.maxEvidenceTimestampsPerChain, `EvidenceRecord archive timestamp chain exceeds ${limits.maxEvidenceTimestampsPerChain} entries.`);
		for (let index = 0; index < chain.children.length; index += 1) {
			totalTimestamps += 1;
			assertBounds(totalTimestamps <= limits.maxEvidenceTimestamps, `EvidenceRecord archive timestamp total exceeds ${limits.maxEvidenceTimestamps}.`);
			const archiveTimestamp = chain.children[index];
			assertBounds(isTag(archiveTimestamp, UNIVERSAL, TAG.sequence), "EvidenceRecord archive timestamp is malformed.");
			const explicitDigest = archiveTimestamp.children.find((child) => isTag(child, CONTEXT, 0));
			const explicitAlgorithmNode = explicitDigest === null || explicitDigest === void 0 ? void 0 : explicitDigest.children.find((child) => isTag(child, UNIVERSAL, TAG.sequence));
			const digestAlgorithmOid = explicitAlgorithmNode ? algorithmOid(bytes, explicitAlgorithmNode) : digestAlgorithmOids[0];
			const reducedHashTreeNodes = countReducedHashTreeNodes(archiveTimestamp.children.find((child) => isTag(child, CONTEXT, 2)), limits.maxReducedHashTreeNodes);
			const contentInfo = findEvidenceTimestampContentInfo(bytes, archiveTimestamp);
			assertBounds(contentInfo, "EvidenceRecord archive timestamp is missing its RFC 3161 ContentInfo.");
			const mayCompareOriginal = chainIndex === 0 && index === 0 && reducedHashTreeNodes === 0;
			const token = await inspectCmsNode(bytes, contentInfo, mayCompareOriginal ? originalContent : void 0, limits);
			const timestampSignaturesValid = token.signers.length > 0 && token.signers.every((signer) => signer.cryptographicSignatureValid !== void 0) ? token.signers.every((signer) => signer.cryptographicSignatureValid === true) : void 0;
			archiveTimestamps.push({
				chainIndex,
				index,
				digestAlgorithmOid,
				digestAlgorithm: formatOid(digestAlgorithmOid),
				reducedHashTreeNodes,
				timestamp: token.timestamp,
				timestampSignerCount: token.signers.length,
				timestampSignaturesValid,
				evidenceDigestMatchesOriginal: mayCompareOriginal ? (_a = token.timestamp) === null || _a === void 0 ? void 0 : _a.messageImprintMatchesOriginal : void 0,
				warnings: [...mayCompareOriginal ? [] : ["This archive timestamp is part of a renewal/hash-tree chain and was structurally inspected, not fully replayed."], ...token.warnings || []]
			});
		}
	}
	const first = archiveTimestamps[0];
	return {
		kind: "evidence-record",
		detectedFormat: "RFC 4998 EvidenceRecord",
		sourceSize: bytes.byteLength,
		version,
		digestAlgorithms,
		archiveTimestampChains: sequenceNode.children.length,
		archiveTimestamps,
		originalContentSupplied: Boolean(originalContent),
		originalEvidenceMatches: first === null || first === void 0 ? void 0 : first.evidenceDigestMatchesOriginal,
		fullyValidated: false,
		warnings: [
			"EvidenceRecord parsing is separate from complete archival-evidence validation.",
			"The first timestamp can be compared directly only when it has no reduced hash tree; renewal chains are not over-claimed as validated.",
			"No TSA, OCSP, CRL, AIA, trust-list or other network endpoint is contacted automatically.",
			"Certificate trust, retention-policy compliance and legal validity are not established."
		]
	};
};
var signatureOidLabels = OID_LABELS;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/structured/limits.js
var DEFAULT_SIGNATURE_CONTAINER_LIMITS = Object.freeze({
	maxContainerBytes: 67108864,
	maxEntries: 1024,
	maxEntryBytes: 33554432,
	maxTotalUncompressedBytes: 134217728,
	maxCompressionRatio: 200,
	maxPathBytes: 1024,
	maxDocuments: 512,
	maxSignatureMembers: 128,
	maxXmlBytes: 4194304,
	maxJsonBytes: 8388608,
	maxJwsSignatures: 64,
	maxWorkerMs: 2e4
});
var ABSOLUTE_SIGNATURE_CONTAINER_LIMITS = Object.freeze({
	maxContainerBytes: 134217728,
	maxEntries: 4096,
	maxEntryBytes: 67108864,
	maxTotalUncompressedBytes: 268435456,
	maxCompressionRatio: 500,
	maxPathBytes: 4096,
	maxDocuments: 2048,
	maxSignatureMembers: 512,
	maxXmlBytes: 16777216,
	maxJsonBytes: 33554432,
	maxJwsSignatures: 256,
	maxWorkerMs: 6e4
});
var boundedInteger = (value, fallback, ceiling) => {
	if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) return fallback;
	return Math.min(value, ceiling);
};
/**
* Host overrides may lower or moderately raise operational limits, but they can
* never disable the package's absolute hostile-input boundary.
*/
var normalizeSignatureContainerLimits = (requested) => Object.fromEntries(Object.entries(DEFAULT_SIGNATURE_CONTAINER_LIMITS).map(([key, fallback]) => [key, boundedInteger(requested === null || requested === void 0 ? void 0 : requested[key], fallback, ABSOLUTE_SIGNATURE_CONTAINER_LIMITS[key])]));
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/structured/jws.js
var textEncoder = new TextEncoder();
var strictUtf8 = new TextDecoder("utf-8", { fatal: true });
var JADES_HEADER_NAMES = /* @__PURE__ */ new Set([
	"sigT",
	"x5t#S256",
	"x5c",
	"etsiU",
	"etsiQcs",
	"etsiP",
	"srCms",
	"rSig",
	"sigD",
	"adoTst"
]);
var assertJws = (condition, message) => {
	if (!condition) throw new Error(`Invalid JWS: ${message}`);
};
var ownRecord = (value, label) => {
	assertJws(Boolean(value) && typeof value === "object" && !Array.isArray(value), `${label} must be a JSON object.`);
	const input = value;
	const output = Object.create(null);
	for (const key of Object.keys(input)) {
		assertJws(key !== "__proto__" && key !== "prototype" && key !== "constructor", `${label} contains a forbidden property.`);
		output[key] = input[key];
	}
	return output;
};
var decodeBase64Url = (value, label, maxBytes) => {
	assertJws(/^[A-Za-z0-9_-]*$/u.test(value), `${label} is not base64url.`);
	assertJws(value.length <= Math.ceil(maxBytes * 4 / 3) + 4, `${label} exceeds ${maxBytes} decoded bytes.`);
	const remainder = value.length % 4;
	assertJws(remainder !== 1, `${label} has invalid base64url length.`);
	const padded = value.replace(/-/gu, "+").replace(/_/gu, "/") + "=".repeat((4 - remainder) % 4);
	let binary;
	try {
		binary = globalThis.atob(padded);
	} catch {
		throw new Error(`Invalid JWS: ${label} cannot be decoded.`);
	}
	assertJws(binary.length <= maxBytes, `${label} exceeds ${maxBytes} decoded bytes.`);
	const output = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) output[index] = binary.charCodeAt(index);
	return output;
};
var encodeBase64Url = (bytes) => {
	let binary = "";
	const chunkSize = 32768;
	for (let offset = 0; offset < bytes.length; offset += chunkSize) binary += String.fromCharCode(...bytes.subarray(offset, Math.min(bytes.length, offset + chunkSize)));
	return globalThis.btoa(binary).replace(/=/gu, "").replace(/\+/gu, "-").replace(/\//gu, "_");
};
var parseProtectedHeader = (segment, maxHeaderBytes) => {
	const bytes = decodeBase64Url(segment, "protected header", maxHeaderBytes);
	let parsed;
	try {
		parsed = JSON.parse(strictUtf8.decode(bytes));
	} catch {
		throw new Error("Invalid JWS: protected header is not strict UTF-8 JSON.");
	}
	return ownRecord(parsed, "protected header");
};
var parseJsonInput = (bytes, maxJsonBytes) => {
	assertJws(bytes.byteLength <= maxJsonBytes, `JSON serialization exceeds ${maxJsonBytes} bytes.`);
	try {
		return ownRecord(JSON.parse(strictUtf8.decode(bytes)), "JWS JSON serialization");
	} catch (error) {
		if (error instanceof Error && error.message.startsWith("Invalid JWS:")) throw error;
		const symptom = /* @__PURE__ */ new Error("Invalid JWS: JSON serialization is malformed or not strict UTF-8.");
		symptom.cause = error;
		throw symptom;
	}
};
var parseSignatures = (input, bytes, maxJsonBytes, maxHeaderBytes, maxSignatures) => {
	const trimmed = input.trim();
	if (!trimmed.startsWith("{")) {
		const segments = trimmed.split(".");
		assertJws(segments.length === 3, "compact serialization must contain exactly three segments.");
		return {
			serialization: "compact",
			payloadField: segments[1],
			signatures: [{
				protectedSegment: segments[0],
				protectedHeader: parseProtectedHeader(segments[0], maxHeaderBytes),
				unprotectedHeader: Object.create(null),
				signatureSegment: segments[2]
			}]
		};
	}
	const json = parseJsonInput(bytes, maxJsonBytes);
	const payloadField = json.payload;
	assertJws(payloadField === void 0 || typeof payloadField === "string", "payload must be a string when present.");
	const rawSignatures = Array.isArray(json.signatures) ? json.signatures : [{
		protected: json.protected,
		header: json.header,
		signature: json.signature
	}];
	assertJws(rawSignatures.length > 0 && rawSignatures.length <= maxSignatures, `signature count must be between 1 and ${maxSignatures}.`);
	const signatures = rawSignatures.map((raw, index) => {
		const value = ownRecord(raw, `signature ${index + 1}`);
		assertJws(typeof value.signature === "string", `signature ${index + 1} is missing its signature value.`);
		const protectedSegment = value.protected === void 0 ? "" : value.protected;
		assertJws(typeof protectedSegment === "string", `signature ${index + 1} protected header must be a string.`);
		return {
			protectedSegment,
			protectedHeader: protectedSegment ? parseProtectedHeader(protectedSegment, maxHeaderBytes) : Object.create(null),
			unprotectedHeader: value.header === void 0 ? Object.create(null) : ownRecord(value.header, `signature ${index + 1} unprotected header`),
			signatureSegment: value.signature
		};
	});
	return {
		serialization: Array.isArray(json.signatures) ? "json-general" : "json-flattened",
		payloadField,
		signatures
	};
};
var concatBytes = (...parts) => {
	const size = parts.reduce((sum, part) => sum + part.byteLength, 0);
	const result = new Uint8Array(size);
	let offset = 0;
	for (const part of parts) {
		result.set(part, offset);
		offset += part.byteLength;
	}
	return result;
};
var algorithmParameters = (algorithm) => {
	const hash = algorithm.endsWith("256") ? "SHA-256" : algorithm.endsWith("384") ? "SHA-384" : algorithm.endsWith("512") ? "SHA-512" : void 0;
	if (/^RS(?:256|384|512)$/u.test(algorithm)) return {
		importAlgorithm: {
			name: "RSASSA-PKCS1-v1_5",
			hash
		},
		verifyAlgorithm: { name: "RSASSA-PKCS1-v1_5" },
		keyType: "RSA"
	};
	if (/^PS(?:256|384|512)$/u.test(algorithm)) return {
		importAlgorithm: {
			name: "RSA-PSS",
			hash
		},
		verifyAlgorithm: {
			name: "RSA-PSS",
			saltLength: Number(algorithm.slice(2)) / 8
		},
		keyType: "RSA"
	};
	if (/^ES(?:256|384|512)$/u.test(algorithm)) {
		const namedCurve = algorithm === "ES256" ? "P-256" : algorithm === "ES384" ? "P-384" : "P-521";
		return {
			importAlgorithm: {
				name: "ECDSA",
				namedCurve
			},
			verifyAlgorithm: {
				name: "ECDSA",
				hash
			},
			keyType: "EC",
			namedCurve
		};
	}
	if (algorithm === "EdDSA") return {
		importAlgorithm: { name: "Ed25519" },
		verifyAlgorithm: { name: "Ed25519" },
		keyType: "OKP"
	};
};
var isCryptoKey = (value) => typeof value === "object" && value !== null && "algorithm" in value && "usages" in value && "type" in value;
var importVerificationKey = async (candidate, algorithm) => {
	const parameters = algorithmParameters(algorithm);
	if (!parameters) throw new Error(`Unsupported or unsafe JWS algorithm ${algorithm}.`);
	if (isCryptoKey(candidate.key)) {
		if (candidate.key.type !== "public" || !candidate.key.usages.includes("verify")) throw new Error("JWS verification requires a public CryptoKey with verify usage.");
		return candidate.key;
	}
	const jwk = candidate.key;
	if ("d" in jwk || "k" in jwk) throw new Error("Private or symmetric JWK material is not accepted by the preview verifier.");
	if (jwk.kty !== parameters.keyType) throw new Error(`JWK type ${jwk.kty || "unknown"} does not match ${algorithm}.`);
	if (parameters.namedCurve && jwk.crv !== parameters.namedCurve) throw new Error(`JWK curve ${jwk.crv || "unknown"} does not match ${algorithm}.`);
	return globalThis.crypto.subtle.importKey("jwk", jwk, parameters.importAlgorithm, false, ["verify"]);
};
var verifyOne = async (signature, signatureBytes, signingInput, keys) => {
	const algorithm = signature.protectedHeader.alg;
	assertJws(typeof algorithm === "string" && algorithm.length > 0, "alg must be present in the protected header.");
	assertJws(algorithm !== "none" && !algorithm.startsWith("HS"), `algorithm ${algorithm} is not accepted by this public-key verifier.`);
	const parameters = algorithmParameters(algorithm);
	assertJws(parameters, `algorithm ${algorithm} is unsupported.`);
	const keyId = typeof signature.protectedHeader.kid === "string" ? signature.protectedHeader.kid : typeof signature.unprotectedHeader.kid === "string" ? signature.unprotectedHeader.kid : void 0;
	const candidates = keyId ? keys.filter((candidate) => !candidate.kid || candidate.kid === keyId) : keys;
	if (!candidates.length) return {
		valid: void 0,
		error: keyId ? `No verification key matched kid ${keyId}.` : "A public verification key is required."
	};
	let lastError;
	for (const candidate of candidates.slice(0, 64)) try {
		const key = await importVerificationKey(candidate, algorithm);
		if (await globalThis.crypto.subtle.verify(parameters.verifyAlgorithm, key, signatureBytes, signingInput)) return { valid: true };
	} catch (error) {
		lastError = error;
	}
	return {
		valid: false,
		error: lastError instanceof Error ? lastError.message : "No supplied public key verified the signature."
	};
};
var checkHeaderBoundary = (signature) => {
	const protectedKeys = new Set(Object.keys(signature.protectedHeader));
	for (const key of Object.keys(signature.unprotectedHeader)) assertJws(!protectedKeys.has(key), `header parameter ${key} appears in both protected and unprotected headers.`);
	assertJws(typeof signature.protectedHeader.alg === "string", "alg must be integrity protected.");
	const critical = signature.protectedHeader.crit;
	if (critical !== void 0) {
		assertJws(Array.isArray(critical) && critical.every((value) => typeof value === "string"), "crit must be an array of header names.");
		const unique = new Set(critical);
		assertJws(unique.size === critical.length, "crit contains duplicate names.");
		for (const name of unique) assertJws(name === "b64", `unsupported critical header ${name}.`);
	}
	const b64 = signature.protectedHeader.b64;
	assertJws(b64 === void 0 || typeof b64 === "boolean", "b64 must be boolean.");
	if (b64 === false) assertJws(Array.isArray(critical) && critical.includes("b64"), "b64=false must be declared critical.");
};
var isProbablyJws = (bytes, filename) => {
	if (filename === null || filename === void 0 ? void 0 : filename.toLowerCase().endsWith(".jws")) return true;
	if (bytes.byteLength > 67108864) return false;
	const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, Math.min(bytes.byteLength, 4096))).trim();
	if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+$/u.test(head) && bytes.byteLength <= 4096) return true;
	return head.startsWith("{") && (head.includes("\"signature\"") || head.includes("\"signatures\""));
};
var inspectJws = async (input, options = {}) => {
	const limits = normalizeSignatureContainerLimits(options.limits);
	const bytes = typeof input === "string" ? textEncoder.encode(input) : input instanceof Uint8Array ? input : new Uint8Array(input);
	assertJws(bytes.byteLength > 0 && bytes.byteLength <= limits.maxContainerBytes, `input exceeds ${limits.maxContainerBytes} bytes.`);
	let source;
	try {
		source = strictUtf8.decode(bytes);
	} catch {
		throw new Error("Invalid JWS: serialization must be strict UTF-8.");
	}
	const parsed = parseSignatures(source, bytes, limits.maxJsonBytes, Math.min(limits.maxJsonBytes, 65536), limits.maxJwsSignatures);
	const detachedPayload = options.detachedPayload ? options.detachedPayload instanceof Uint8Array ? options.detachedPayload : new Uint8Array(options.detachedPayload) : void 0;
	assertJws(!detachedPayload || detachedPayload.byteLength <= limits.maxEntryBytes, `detached payload exceeds ${limits.maxEntryBytes} bytes.`);
	const warnings = ["JWS parsing and public-key signature verification do not establish key trust, signer identity, policy compliance or legal validity.", "jku, x5u and other remote key or certificate locations are displayed as metadata and are never fetched automatically."];
	let sharedPayload;
	const detached = parsed.payloadField === void 0 || parsed.payloadField === "";
	let payloadEncoded = true;
	const inspections = [];
	for (let index = 0; index < parsed.signatures.length; index += 1) {
		const signature = parsed.signatures[index];
		checkHeaderBoundary(signature);
		const encoded = signature.protectedHeader.b64 !== false;
		if (index === 0) payloadEncoded = encoded;
		else assertJws(payloadEncoded === encoded, "all signatures must use the same b64 payload mode.");
		let payload;
		let payloadSegment;
		if (detached) {
			payload = detachedPayload;
			payloadSegment = payload ? encoded ? textEncoder.encode(encodeBase64Url(payload)) : payload : void 0;
		} else if (encoded) {
			payload = decodeBase64Url(parsed.payloadField, "payload", limits.maxEntryBytes);
			payloadSegment = textEncoder.encode(parsed.payloadField);
		} else {
			payload = textEncoder.encode(parsed.payloadField);
			assertJws(payload.byteLength <= limits.maxEntryBytes, `payload exceeds ${limits.maxEntryBytes} bytes.`);
			payloadSegment = payload;
		}
		if (payload) {
			sharedPayload || (sharedPayload = payload);
			assertJws(sharedPayload.byteLength === payload.byteLength && sharedPayload.every((value, offset) => value === payload[offset]), "signatures resolved to inconsistent payload bytes.");
		}
		const signatureBytes = decodeBase64Url(signature.signatureSegment, `signature ${index + 1}`, 65536);
		const signingInput = payloadSegment ? concatBytes(textEncoder.encode(`${signature.protectedSegment}.`), payloadSegment) : void 0;
		let cryptographicValid;
		let verificationError;
		try {
			if (!signingInput) verificationError = "Detached payload is required before the cryptographic signature can be checked.";
			else {
				const result = await verifyOne(signature, signatureBytes, signingInput, options.verificationKeys || []);
				cryptographicValid = result.valid;
				verificationError = result.error;
			}
		} catch (error) {
			cryptographicValid = false;
			verificationError = error instanceof Error ? error.message : String(error);
		}
		const algorithm = signature.protectedHeader.alg;
		const keyId = signature.protectedHeader.kid || signature.unprotectedHeader.kid;
		inspections.push({
			index,
			algorithm,
			keyId,
			protectedHeader: signature.protectedHeader,
			unprotectedHeader: signature.unprotectedHeader,
			signatureBytes: signatureBytes.byteLength,
			cryptographicValid,
			verificationError,
			jadesProperties: [...new Set([...Object.keys(signature.protectedHeader), ...Object.keys(signature.unprotectedHeader)].filter((name) => JADES_HEADER_NAMES.has(name)))]
		});
	}
	return {
		serialization: parsed.serialization,
		sourceSize: bytes.byteLength,
		detached,
		payloadEncoded,
		payload: sharedPayload,
		signatures: inspections,
		warnings
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-signature@3.1.2/node_modules/@file-viewer/renderer-signature/dist/openpgp/formatDetection.js
var ARMOR_MARKERS = [
	["-----BEGIN PGP MESSAGE-----", "message"],
	["-----BEGIN PGP SIGNATURE-----", "signature"],
	["-----BEGIN PGP SIGNED MESSAGE-----", "cleartext-signed-message"],
	["-----BEGIN PGP PUBLIC KEY BLOCK-----", "public-key"],
	["-----BEGIN PGP PRIVATE KEY BLOCK-----", "private-key"]
];
var OPENPGP_EXTENSIONS = /* @__PURE__ */ new Set([
	"asc",
	"sig",
	"pgp",
	"gpg"
]);
var extensionOf = (filename) => {
	if (!filename) return "";
	const base = filename.split(/[\\/]/).pop() || filename;
	const dot = base.lastIndexOf(".");
	return dot >= 0 ? base.slice(dot + 1).toLowerCase() : "";
};
var detectOpenPgpArmorType = (bytes) => {
	var _a;
	const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, Math.min(bytes.byteLength, 512))).trimStart();
	return (_a = ARMOR_MARKERS.find(([marker]) => head.startsWith(marker))) === null || _a === void 0 ? void 0 : _a[1];
};
var hasPlausibleOpenPgpPacketHeader = (bytes) => {
	var _a;
	if (!bytes.byteLength) return false;
	const first = (_a = bytes[0]) !== null && _a !== void 0 ? _a : 0;
	if ((first & 128) === 0) return false;
	if ((first & 64) !== 0) {
		const tag = first & 63;
		return tag > 0 && tag < 64;
	}
	const tag = first >> 2 & 15;
	return tag > 0 && tag < 16;
};
var isProbablyOpenPgp = (bytes, filename, typeHint) => {
	if (detectOpenPgpArmorType(bytes)) return true;
	const type = (typeHint || "").replace(/^\./, "").toLowerCase();
	if (OPENPGP_EXTENSIONS.has(type) || OPENPGP_EXTENSIONS.has(extensionOf(filename))) return true;
	return hasPlausibleOpenPgpPacketHeader(bytes);
};
//#endregion
export { DEFAULT_SIGNATURE_CONTAINER_LIMITS as a, inspectEvidenceRecord as c, isProbablyJws as i, inspectSignatureContainer as l, isProbablyOpenPgp as n, normalizeSignatureContainerLimits as o, inspectJws as r, DEFAULT_SIGNATURE_ASN1_LIMITS as s, detectOpenPgpArmorType as t, signatureOidLabels as u };
