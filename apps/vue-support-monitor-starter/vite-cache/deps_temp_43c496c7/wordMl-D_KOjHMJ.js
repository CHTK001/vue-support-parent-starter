import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { t as require_jszip_min } from "./jszip.min-eM67_wVy.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-word@3.1.2/node_modules/@file-viewer/renderer-word/dist/wordMl.js
var import_jszip_min = /* @__PURE__ */ __toESM(require_jszip_min(), 1);
var WORDML = "http://schemas.microsoft.com/office/word/2003/wordml";
var WORD = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
var REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
var PACKAGE_REL = "http://schemas.openxmlformats.org/package/2006/relationships";
var CONTENT_TYPES = "http://schemas.openxmlformats.org/package/2006/content-types";
var AUX = "http://schemas.microsoft.com/office/word/2003/auxHint";
var VML = "urn:schemas-microsoft-com:vml";
var XMLNS = "http://www.w3.org/2000/xmlns/";
var aliases = {
	"h-ansi": "hAnsi",
	fareast: "eastAsia",
	"b-cs": "bCs",
	"i-cs": "iCs",
	"sz-cs": "szCs",
	"lang-cs": "lang",
	"panose-1": "panose1",
	"line-rule": "lineRule",
	"line-pitch": "linePitch",
	"char-space": "charSpace",
	"hanging-chars": "hangingChars",
	"first-line": "firstLine",
	"first-line-chars": "firstLineChars",
	"left-chars": "leftChars",
	"right-chars": "rightChars"
};
function decodeWordMlBytes(buffer) {
	const bytes = new Uint8Array(buffer);
	const utf16le = bytes[0] === 255 && bytes[1] === 254 || bytes[0] === 60 && bytes[1] === 0;
	const utf16be = bytes[0] === 254 && bytes[1] === 255 || bytes[0] === 0 && bytes[1] === 60;
	return new TextDecoder(utf16le ? "utf-16le" : utf16be ? "utf-16be" : "utf-8").decode(bytes);
}
/**
* Adapt the single-file Word 2003 XML container to the existing OOXML renderer.
* This is structural conversion, not HTML insertion or remote conversion. Body,
* styles, table properties, section geometry and VML remain renderer-owned.
* Inline headers/footers become package parts; only embedded image data is read.
*/
async function convertWordMlToDocx(buffer, target) {
	var _a, _b, _c, _d;
	const source = decodeWordMlBytes(buffer);
	if (/<!DOCTYPE\b|<!ENTITY\b/i.test(source)) throw new Error("Word 2003 XML must not contain a DTD or entity declarations.");
	const view = target.ownerDocument.defaultView;
	const Parser = (_a = view === null || view === void 0 ? void 0 : view.DOMParser) !== null && _a !== void 0 ? _a : globalThis.DOMParser;
	const Serializer = (_b = view === null || view === void 0 ? void 0 : view.XMLSerializer) !== null && _b !== void 0 ? _b : globalThis.XMLSerializer;
	const input = new Parser().parseFromString(source, "application/xml");
	if (input.getElementsByTagName("parsererror").length || input.documentElement.localName !== "wordDocument" || input.documentElement.namespaceURI !== WORDML) throw new Error("Invalid Word 2003 XML document.");
	const body = Array.from(input.documentElement.children).find((element) => element.namespaceURI === WORDML && element.localName === "body");
	if (!body) throw new Error("Word 2003 XML document has no body.");
	const zip = new import_jszip_min.default();
	const serializer = new Serializer();
	const overrides = [];
	const images = /* @__PURE__ */ new Map();
	for (const binary of Array.from(input.getElementsByTagNameNS(WORDML, "binData"))) {
		const name = binary.getAttributeNS(WORDML, "name") || "";
		if (images.has(name)) continue;
		const extension = (_c = /\.(png|jpe?g|gif|bmp|tiff?|emf|wmf)$/i.exec(name)) === null || _c === void 0 ? void 0 : _c[1].toLowerCase();
		const bytes = ((_d = binary.textContent) === null || _d === void 0 ? void 0 : _d.replace(/\s/g, "")) || "";
		if (name && extension && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(bytes) && bytes) {
			const path = `media/image${images.size + 1}.${extension}`;
			images.set(name, {
				path,
				bytes
			});
			zip.file(`word/${path}`, bytes, { base64: true });
		}
	}
	const createDocument = (name) => {
		const doc = input.implementation.createDocument(WORD, `w:${name}`, null);
		doc.documentElement.setAttributeNS(XMLNS, "xmlns:r", REL);
		return doc;
	};
	const serialize = (document) => `<?xml version="1.0" encoding="UTF-8"?>${serializer.serializeToString(document)}`;
	const relationships = /* @__PURE__ */ new Map();
	function relate(part, type, destination) {
		let doc = relationships.get(part);
		if (!doc) {
			doc = input.implementation.createDocument(PACKAGE_REL, "Relationships", null);
			relationships.set(part, doc);
		}
		const id = `rId${doc.documentElement.children.length + 1}`;
		const item = doc.createElementNS(PACKAGE_REL, "Relationship");
		item.setAttribute("Id", id);
		item.setAttribute("Type", `${REL}/${type}`);
		item.setAttribute("Target", destination);
		doc.documentElement.appendChild(item);
		return id;
	}
	let headerNumber = 0;
	let footerNumber = 0;
	function appendConverted(node, parent, part, depth = 0) {
		if (depth > 256) throw new Error("Word 2003 XML nesting is too deep.");
		const output = parent.ownerDocument;
		if (node.nodeType === 3 || node.nodeType === 4) {
			parent.appendChild(output.createTextNode(node.textContent || ""));
			return;
		}
		if (node.nodeType !== 1) return;
		const element = node;
		const isWord = element.namespaceURI === WORDML;
		if (isWord && element.localName === "binData") return;
		if (element.namespaceURI === AUX) {
			for (const child of Array.from(element.childNodes)) appendConverted(child, parent, part, depth + 1);
			return;
		}
		if (isWord && (element.localName === "hdr" || element.localName === "ftr") && parent.localName === "sectPr") {
			const header = element.localName === "hdr";
			const partName = `${header ? "header" : "footer"}${header ? ++headerNumber : ++footerNumber}.xml`;
			const document = createDocument(header ? "hdr" : "ftr");
			for (const child of Array.from(element.childNodes)) appendConverted(child, document.documentElement, partName, depth + 1);
			zip.file(`word/${partName}`, serialize(document));
			overrides.push([`/word/${partName}`, `application/vnd.openxmlformats-officedocument.wordprocessingml.${header ? "header" : "footer"}+xml`]);
			const reference = output.createElementNS(WORD, `w:${header ? "header" : "footer"}Reference`);
			const type = element.getAttributeNS(WORDML, "type");
			reference.setAttributeNS(WORD, "w:type", type === "first" || type === "even" ? type : "default");
			reference.setAttributeNS(REL, "r:id", relate(part, header ? "header" : "footer", partName));
			parent.appendChild(reference);
			return;
		}
		const namespace = isWord ? WORD : element.namespaceURI;
		const localName = isWord ? aliases[element.localName] || element.localName : element.localName;
		const name = isWord ? `w:${localName}` : element.nodeName;
		const converted = output.createElementNS(namespace, name);
		for (const attribute of Array.from(element.attributes)) {
			if (attribute.namespaceURI === XMLNS) continue;
			if (namespace === VML && (localName === "imagedata" || localName === "fill") && (attribute.localName === "src" || attribute.localName === "href")) continue;
			const wordAttribute = attribute.namespaceURI === WORDML;
			const key = wordAttribute ? aliases[attribute.localName] || attribute.localName : attribute.localName;
			let value = attribute.value;
			if (wordAttribute && key === "hint" && value === "fareast") value = "eastAsia";
			if (isWord && localName === "fldChar" && wordAttribute && key === "fldCharType" && value === "start") value = "begin";
			converted.setAttributeNS(wordAttribute ? WORD : attribute.namespaceURI, wordAttribute ? `w:${key}` : attribute.name, value);
		}
		if (namespace === VML && (localName === "imagedata" || localName === "fill")) {
			const image = images.get(element.getAttribute("src") || "");
			if (image) converted.setAttributeNS(REL, "r:id", relate(part, "image", image.path));
		}
		parent.appendChild(converted);
		for (const child of Array.from(element.childNodes)) appendConverted(child, converted, part, depth + 1);
	}
	const document = createDocument("document");
	const outputBody = document.createElementNS(WORD, "w:body");
	document.documentElement.appendChild(outputBody);
	for (const child of Array.from(body.childNodes)) appendConverted(child, outputBody, "document.xml");
	for (const section of Array.from(outputBody.children)) {
		if (section.localName !== "sectPr" || section === outputBody.lastElementChild) continue;
		let paragraph = section.previousElementSibling;
		if (!paragraph || paragraph.localName !== "p") {
			paragraph = document.createElementNS(WORD, "w:p");
			outputBody.insertBefore(paragraph, section);
		}
		let properties = Array.from(paragraph.children).find((child) => child.localName === "pPr");
		if (!properties) {
			properties = document.createElementNS(WORD, "w:pPr");
			paragraph.insertBefore(properties, paragraph.firstChild);
		}
		properties.appendChild(section);
	}
	zip.file("word/document.xml", serialize(document));
	overrides.push(["/word/document.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"]);
	for (const [sourceName, rootName, path, type] of [
		[
			"styles",
			"styles",
			"styles.xml",
			"styles"
		],
		[
			"fonts",
			"fonts",
			"fontTable.xml",
			"fontTable"
		],
		[
			"docPr",
			"settings",
			"settings.xml",
			"settings"
		]
	]) {
		const element = Array.from(input.documentElement.children).find((child) => child.namespaceURI === WORDML && child.localName === sourceName);
		if (!element) continue;
		const part = createDocument(rootName);
		for (const child of Array.from(element.childNodes)) appendConverted(child, part.documentElement, path);
		zip.file(`word/${path}`, serialize(part));
		relate("document.xml", type, path);
		overrides.push([`/word/${path}`, `application/vnd.openxmlformats-officedocument.wordprocessingml.${type}+xml`]);
	}
	for (const [part, relations] of relationships) zip.file(`word/_rels/${part}.rels`, serialize(relations));
	const rootRelations = input.implementation.createDocument(PACKAGE_REL, "Relationships", null);
	const office = rootRelations.createElementNS(PACKAGE_REL, "Relationship");
	for (const [name, value] of [
		["Id", "rId1"],
		["Type", `${REL}/officeDocument`],
		["Target", "word/document.xml"]
	]) office.setAttribute(name, value);
	rootRelations.documentElement.appendChild(office);
	zip.file("_rels/.rels", serialize(rootRelations));
	const types = input.implementation.createDocument(CONTENT_TYPES, "Types", null);
	for (const [extension, mime] of [
		["rels", "application/vnd.openxmlformats-package.relationships+xml"],
		["xml", "application/xml"],
		...Object.entries({
			png: "image/png",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			gif: "image/gif",
			bmp: "image/bmp",
			tif: "image/tiff",
			tiff: "image/tiff",
			emf: "image/x-emf",
			wmf: "image/x-wmf"
		})
	]) {
		const entry = types.createElementNS(CONTENT_TYPES, "Default");
		entry.setAttribute("Extension", extension);
		entry.setAttribute("ContentType", mime);
		types.documentElement.appendChild(entry);
	}
	for (const [path, mime] of overrides) {
		const entry = types.createElementNS(CONTENT_TYPES, "Override");
		entry.setAttribute("PartName", path);
		entry.setAttribute("ContentType", mime);
		types.documentElement.appendChild(entry);
	}
	zip.file("[Content_Types].xml", serialize(types));
	return zip.generateAsync({ type: "arraybuffer" });
}
//#endregion
export { convertWordMlToDocx, decodeWordMlBytes };
