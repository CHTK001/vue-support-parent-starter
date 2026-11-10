//#region ../../node_modules/.pnpm/@file-viewer+renderer-epub@3.1.2/node_modules/@file-viewer/renderer-epub/dist/fb2/parser.js
var localName = (node) => (node.localName || node.nodeName).split(":").pop().toLowerCase();
var childElements = (node, name) => Array.from(node.childNodes).filter((child) => child.nodeType === 1).filter((child) => !name || localName(child) === name);
var descendants = (node, name) => {
	const result = [];
	const visit = (current) => {
		for (const child of childElements(current)) {
			if (localName(child) === name) result.push(child);
			visit(child);
		}
	};
	visit(node);
	return result;
};
var firstDescendant = (node, name) => descendants(node, name)[0];
var normalizedText = (node) => ((node === null || node === void 0 ? void 0 : node.textContent) || "").replace(/\s+/g, " ").trim();
var getHref = (element) => {
	var _a;
	if (!element) return "";
	return element.getAttribute("xlink:href") || element.getAttribute("href") || ((_a = Array.from(element.attributes).find((attribute) => attribute.localName === "href")) === null || _a === void 0 ? void 0 : _a.value) || "";
};
var decodeXml = (buffer) => {
	var _a, _b;
	const bytes = new Uint8Array(buffer);
	const probe = new TextDecoder("ascii").decode(bytes.slice(0, Math.min(bytes.length, 256)));
	const encoding = ((_b = (_a = /<\?xml[^>]+encoding=["']([^"']+)/i.exec(probe)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || "utf-8";
	try {
		return new TextDecoder(encoding).decode(bytes);
	} catch {
		return new TextDecoder("utf-8").decode(bytes);
	}
};
var decodeBase64 = (value) => {
	const normalized = value.replace(/\s+/g, "");
	if (!normalized) return /* @__PURE__ */ new Uint8Array();
	if (typeof atob === "function") {
		const binary = atob(normalized);
		return Uint8Array.from(binary, (character) => character.charCodeAt(0));
	}
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	const output = [];
	let bits = 0;
	let bitCount = 0;
	for (const character of normalized.replace(/=+$/, "")) {
		const index = alphabet.indexOf(character);
		if (index < 0) continue;
		bits = bits << 6 | index;
		bitCount += 6;
		if (bitCount >= 8) {
			bitCount -= 8;
			output.push(bits >> bitCount & 255);
		}
	}
	return Uint8Array.from(output);
};
var parseAuthor = (element) => {
	return [
		"first-name",
		"middle-name",
		"last-name",
		"nickname"
	].map((name) => normalizedText(firstDescendant(element, name))).filter(Boolean).join(" ");
};
var chapterTitle = (section, index) => {
	const title = childElements(section, "title")[0];
	return (title ? descendants(title, "p").map(normalizedText).filter(Boolean) : []).join(" — ") || section.getAttribute("id") || `Chapter ${index + 1}`;
};
var parseSection = (section, index, footnote = false) => {
	const nestedSections = childElements(section, "section");
	const contentElements = childElements(section).filter((child) => !["title", "section"].includes(localName(child)));
	const paragraphs = contentElements.flatMap((element) => localName(element) === "p" ? [normalizedText(element)] : descendants(element, "p").map(normalizedText)).filter(Boolean);
	const imageIds = contentElements.flatMap((element) => localName(element) === "image" ? [element] : descendants(element, "image")).map((image) => getHref(image).replace(/^#/, "")).filter(Boolean);
	return {
		id: section.getAttribute("id") || `section-${index + 1}`,
		title: chapterTitle(section, index),
		paragraphs,
		imageIds,
		children: nestedSections.map((child, childIndex) => parseSection(child, childIndex, footnote)),
		footnote
	};
};
var parseFb2Book = (buffer, createParser = () => new DOMParser()) => {
	const document = createParser().parseFromString(decodeXml(buffer), "application/xml");
	if (document.getElementsByTagName("parsererror").length) throw new Error("FB2 XML could not be parsed.");
	const root = document.documentElement;
	if (!root || localName(root) !== "fictionbook") throw new Error("The file is not a FictionBook 2 document.");
	const description = firstDescendant(root, "description");
	const titleInfo = description ? firstDescendant(description, "title-info") : void 0;
	const title = normalizedText(titleInfo ? firstDescendant(titleInfo, "book-title") : void 0) || "FictionBook";
	const authors = titleInfo ? childElements(titleInfo, "author").map(parseAuthor).filter(Boolean) : [];
	const genres = titleInfo ? childElements(titleInfo, "genre").map(normalizedText).filter(Boolean) : [];
	const language = normalizedText(titleInfo ? firstDescendant(titleInfo, "lang") : void 0) || void 0;
	const annotation = normalizedText(titleInfo ? firstDescendant(titleInfo, "annotation") : void 0) || void 0;
	const coverPage = titleInfo ? firstDescendant(titleInfo, "coverpage") : void 0;
	const coverImageId = getHref(coverPage ? firstDescendant(coverPage, "image") : void 0).replace(/^#/, "") || void 0;
	const images = /* @__PURE__ */ new Map();
	for (const binary of childElements(root, "binary")) {
		const id = binary.getAttribute("id") || "";
		if (!id) continue;
		images.set(id, {
			id,
			mimeType: binary.getAttribute("content-type") || "application/octet-stream",
			bytes: decodeBase64(binary.textContent || "")
		});
	}
	const chapters = [];
	const footnotes = [];
	for (const body of childElements(root, "body")) {
		const isFootnote = ["notes", "comments"].includes((body.getAttribute("name") || "").toLowerCase());
		const sections = childElements(body, "section").map((section, index) => parseSection(section, index, isFootnote));
		(isFootnote ? footnotes : chapters).push(...sections);
	}
	return {
		title,
		authors,
		language,
		genres,
		annotation,
		coverImageId,
		chapters,
		footnotes,
		images
	};
};
//#endregion
export { parseFb2Book as t };
