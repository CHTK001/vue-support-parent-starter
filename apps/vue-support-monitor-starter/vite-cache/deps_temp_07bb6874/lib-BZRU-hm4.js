import { t as __commonJSMin } from "./rolldown-runtime-CEgmsyvS.js";
//#region ../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/conventions.js
var require_conventions = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Ponyfill for `Array.prototype.find` which is only available in ES6 runtimes.
	*
	* Works with anything that has a `length` property and index access properties,
	* including NodeList.
	*
	* @param {T[] | { length: number; [number]: T }} list
	* @param {function (item: T, index: number, list:T[]):boolean} predicate
	* @param {Partial<Pick<ArrayConstructor['prototype'], 'find'>>?} ac
	* Allows injecting a custom implementation in tests (`Array.prototype` by default).
	* @returns {T | undefined}
	* @template {unknown} T
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
	* @see https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.find
	*/
	function find(list, predicate, ac) {
		if (ac === void 0) ac = Array.prototype;
		if (list && typeof ac.find === "function") return ac.find.call(list, predicate);
		for (var i = 0; i < list.length; i++) if (hasOwn(list, i)) {
			var item = list[i];
			if (predicate.call(void 0, item, i, list)) return item;
		}
	}
	/**
	* "Shallow freezes" an object to render it immutable.
	* Uses `Object.freeze` if available,
	* otherwise the immutability is only in the type.
	*
	* Is used to create "enum like" objects.
	*
	* If `Object.getOwnPropertyDescriptors` is available,
	* a new object with all properties of object but without any prototype is created and returned
	* after freezing it.
	*
	* @param {T} object
	* The object to freeze.
	* @param {Pick<ObjectConstructor, 'create' | 'freeze' | 'getOwnPropertyDescriptors'>} [oc=Object]
	* `Object` by default,
	* allows to inject custom object constructor for tests.
	* @returns {Readonly<T>}
	* @template {Object} T
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
	* @prettierignore
	*/
	function freeze(object, oc) {
		if (oc === void 0) oc = Object;
		if (oc && typeof oc.getOwnPropertyDescriptors === "function") object = oc.create(null, oc.getOwnPropertyDescriptors(object));
		return oc && typeof oc.freeze === "function" ? oc.freeze(object) : object;
	}
	/**
	* Implementation for `Object.hasOwn` but ES5 compatible.
	*
	* @param {any} object
	* @param {string | number} key
	* @returns {boolean}
	*/
	function hasOwn(object, key) {
		return Object.prototype.hasOwnProperty.call(object, key);
	}
	/**
	* Since xmldom can not rely on `Object.assign`,
	* it uses/provides a simplified version that is sufficient for its needs.
	*
	* @param {Object} target
	* @param {Object | null | undefined} source
	* @returns {Object}
	* The target with the merged/overridden properties.
	* @throws {TypeError}
	* If target is not an object.
	* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
	* @see https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-object.assign
	*/
	function assign(target, source) {
		if (target === null || typeof target !== "object") throw new TypeError("target is not an object");
		for (var key in source) if (hasOwn(source, key)) target[key] = source[key];
		return target;
	}
	/**
	* A number of attributes are boolean attributes.
	* The presence of a boolean attribute on an element represents the `true` value,
	* and the absence of the attribute represents the `false` value.
	*
	* If the attribute is present, its value must either be the empty string, or a value that is
	* an ASCII case-insensitive match for the attribute's canonical name,
	* with no leading or trailing whitespace.
	*
	* Note: The values `"true"` and `"false"` are not allowed on boolean attributes.
	* To represent a `false` value, the attribute has to be omitted altogether.
	*
	* @see https://html.spec.whatwg.org/#boolean-attributes
	* @see https://html.spec.whatwg.org/#attributes-3
	*/
	var HTML_BOOLEAN_ATTRIBUTES = freeze({
		allowfullscreen: true,
		async: true,
		autofocus: true,
		autoplay: true,
		checked: true,
		controls: true,
		default: true,
		defer: true,
		disabled: true,
		formnovalidate: true,
		hidden: true,
		ismap: true,
		itemscope: true,
		loop: true,
		multiple: true,
		muted: true,
		nomodule: true,
		novalidate: true,
		open: true,
		playsinline: true,
		readonly: true,
		required: true,
		reversed: true,
		selected: true
	});
	/**
	* Check if `name` is matching one of the HTML boolean attribute names.
	* This method doesn't check if such attributes are allowed in the context of the current
	* document/parsing.
	*
	* @param {string} name
	* @returns {boolean}
	* @see {@link HTML_BOOLEAN_ATTRIBUTES}
	* @see https://html.spec.whatwg.org/#boolean-attributes
	* @see https://html.spec.whatwg.org/#attributes-3
	*/
	function isHTMLBooleanAttribute(name) {
		return hasOwn(HTML_BOOLEAN_ATTRIBUTES, name.toLowerCase());
	}
	/**
	* Void elements only have a start tag; end tags must not be specified for void elements.
	* These elements should be written as self-closing like this: `<area />`.
	* This should not be confused with optional tags that HTML allows to omit the end tag for
	* (like `li`, `tr` and others), which can have content after them,
	* so they can not be written as self-closing.
	* xmldom does not have any logic for optional end tags cases,
	* and will report them as a warning.
	* Content that would go into the unopened element,
	* will instead be added as a sibling text node.
	*
	* @type {Readonly<{
	* 	area: boolean;
	* 	col: boolean;
	* 	img: boolean;
	* 	wbr: boolean;
	* 	link: boolean;
	* 	hr: boolean;
	* 	source: boolean;
	* 	br: boolean;
	* 	input: boolean;
	* 	param: boolean;
	* 	meta: boolean;
	* 	embed: boolean;
	* 	track: boolean;
	* 	base: boolean;
	* }>}
	* @see https://html.spec.whatwg.org/#void-elements
	* @see https://html.spec.whatwg.org/#optional-tags
	*/
	var HTML_VOID_ELEMENTS = freeze({
		area: true,
		base: true,
		br: true,
		col: true,
		embed: true,
		hr: true,
		img: true,
		input: true,
		link: true,
		meta: true,
		param: true,
		source: true,
		track: true,
		wbr: true
	});
	/**
	* Check if `tagName` is matching one of the HTML void element names.
	* This method doesn't check if such tags are allowed in the context of the current
	* document/parsing.
	*
	* @param {string} tagName
	* @returns {boolean}
	* @see {@link HTML_VOID_ELEMENTS}
	* @see https://html.spec.whatwg.org/#void-elements
	*/
	function isHTMLVoidElement(tagName) {
		return hasOwn(HTML_VOID_ELEMENTS, tagName.toLowerCase());
	}
	/**
	* Tag names that are raw text elements according to HTML spec.
	* The value denotes whether they are escapable or not.
	*
	* @see {@link isHTMLEscapableRawTextElement}
	* @see {@link isHTMLRawTextElement}
	* @see https://html.spec.whatwg.org/#raw-text-elements
	* @see https://html.spec.whatwg.org/#escapable-raw-text-elements
	*/
	var HTML_RAW_TEXT_ELEMENTS = freeze({
		script: false,
		style: false,
		textarea: true,
		title: true
	});
	/**
	* Check if `tagName` is matching one of the HTML raw text element names.
	* This method doesn't check if such tags are allowed in the context of the current
	* document/parsing.
	*
	* @param {string} tagName
	* @returns {boolean}
	* @see {@link isHTMLEscapableRawTextElement}
	* @see {@link HTML_RAW_TEXT_ELEMENTS}
	* @see https://html.spec.whatwg.org/#raw-text-elements
	* @see https://html.spec.whatwg.org/#escapable-raw-text-elements
	*/
	function isHTMLRawTextElement(tagName) {
		var key = tagName.toLowerCase();
		return hasOwn(HTML_RAW_TEXT_ELEMENTS, key) && !HTML_RAW_TEXT_ELEMENTS[key];
	}
	/**
	* Check if `tagName` is matching one of the HTML escapable raw text element names.
	* This method doesn't check if such tags are allowed in the context of the current
	* document/parsing.
	*
	* @param {string} tagName
	* @returns {boolean}
	* @see {@link isHTMLRawTextElement}
	* @see {@link HTML_RAW_TEXT_ELEMENTS}
	* @see https://html.spec.whatwg.org/#raw-text-elements
	* @see https://html.spec.whatwg.org/#escapable-raw-text-elements
	*/
	function isHTMLEscapableRawTextElement(tagName) {
		var key = tagName.toLowerCase();
		return hasOwn(HTML_RAW_TEXT_ELEMENTS, key) && HTML_RAW_TEXT_ELEMENTS[key];
	}
	/**
	* Only returns true if `value` matches MIME_TYPE.HTML, which indicates an HTML document.
	*
	* @param {string} mimeType
	* @returns {mimeType is 'text/html'}
	* @see https://www.iana.org/assignments/media-types/text/html
	* @see https://en.wikipedia.org/wiki/HTML
	* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString
	* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring
	*/
	function isHTMLMimeType(mimeType) {
		return mimeType === MIME_TYPE.HTML;
	}
	/**
	* For both the `text/html` and the `application/xhtml+xml` namespace the spec defines that the
	* HTML namespace is provided as the default.
	*
	* @param {string} mimeType
	* @returns {boolean}
	* @see https://dom.spec.whatwg.org/#dom-document-createelement
	* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument
	* @see https://dom.spec.whatwg.org/#dom-domimplementation-createhtmldocument
	*/
	function hasDefaultHTMLNamespace(mimeType) {
		return isHTMLMimeType(mimeType) || mimeType === MIME_TYPE.XML_XHTML_APPLICATION;
	}
	/**
	* All mime types that are allowed as input to `DOMParser.parseFromString`
	*
	* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString#Argument02
	*      MDN
	* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#domparsersupportedtype
	*      WHATWG HTML Spec
	* @see {@link DOMParser.prototype.parseFromString}
	*/
	var MIME_TYPE = freeze({
		/**
		* `text/html`, the only mime type that triggers treating an XML document as HTML.
		*
		* @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
		* @see https://en.wikipedia.org/wiki/HTML Wikipedia
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
		* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring
		*      WHATWG HTML Spec
		*/
		HTML: "text/html",
		/**
		* `application/xml`, the standard mime type for XML documents.
		*
		* @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType
		*      registration
		* @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
		* @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
		*/
		XML_APPLICATION: "application/xml",
		/**
		* `text/xml`, an alias for `application/xml`.
		*
		* @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
		* @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
		* @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
		*/
		XML_TEXT: "text/xml",
		/**
		* `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
		* but is parsed as an XML document.
		*
		* @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType
		*      registration
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
		* @see https://en.wikipedia.org/wiki/XHTML Wikipedia
		*/
		XML_XHTML_APPLICATION: "application/xhtml+xml",
		/**
		* `image/svg+xml`,
		*
		* @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
		* @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
		* @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
		*/
		XML_SVG_IMAGE: "image/svg+xml"
	});
	/**
	* @typedef {'application/xhtml+xml' | 'application/xml' | 'image/svg+xml' | 'text/html' | 'text/xml'}
	* MimeType
	*/
	/**
	* @type {MimeType[]}
	* @private
	* Basically `Object.values`, which is not available in ES5.
	*/
	var _MIME_TYPES = Object.keys(MIME_TYPE).map(function(key) {
		return MIME_TYPE[key];
	});
	/**
	* Only returns true if `mimeType` is one of the allowed values for
	* `DOMParser.parseFromString`.
	*
	* @param {string} mimeType
	* @returns {mimeType is 'application/xhtml+xml' | 'application/xml' | 'image/svg+xml' |  'text/html' | 'text/xml'}
	*
	*/
	function isValidMimeType(mimeType) {
		return _MIME_TYPES.indexOf(mimeType) > -1;
	}
	/**
	* Namespaces that are used in this code base.
	*
	* @see http://www.w3.org/TR/REC-xml-names
	*/
	var NAMESPACE = freeze({
		/**
		* The XHTML namespace.
		*
		* @see http://www.w3.org/1999/xhtml
		*/
		HTML: "http://www.w3.org/1999/xhtml",
		/**
		* The SVG namespace.
		*
		* @see http://www.w3.org/2000/svg
		*/
		SVG: "http://www.w3.org/2000/svg",
		/**
		* The `xml:` namespace.
		*
		* @see http://www.w3.org/XML/1998/namespace
		*/
		XML: "http://www.w3.org/XML/1998/namespace",
		/**
		* The `xmlns:` namespace.
		*
		* @see https://www.w3.org/2000/xmlns/
		*/
		XMLNS: "http://www.w3.org/2000/xmlns/"
	});
	exports.assign = assign;
	exports.find = find;
	exports.freeze = freeze;
	exports.HTML_BOOLEAN_ATTRIBUTES = HTML_BOOLEAN_ATTRIBUTES;
	exports.HTML_RAW_TEXT_ELEMENTS = HTML_RAW_TEXT_ELEMENTS;
	exports.HTML_VOID_ELEMENTS = HTML_VOID_ELEMENTS;
	exports.hasDefaultHTMLNamespace = hasDefaultHTMLNamespace;
	exports.hasOwn = hasOwn;
	exports.isHTMLBooleanAttribute = isHTMLBooleanAttribute;
	exports.isHTMLRawTextElement = isHTMLRawTextElement;
	exports.isHTMLEscapableRawTextElement = isHTMLEscapableRawTextElement;
	exports.isHTMLMimeType = isHTMLMimeType;
	exports.isHTMLVoidElement = isHTMLVoidElement;
	exports.isValidMimeType = isValidMimeType;
	exports.MIME_TYPE = MIME_TYPE;
	exports.NAMESPACE = NAMESPACE;
}));
//#endregion
//#region ../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/errors.js
var require_errors = /* @__PURE__ */ __commonJSMin(((exports) => {
	var conventions = require_conventions();
	function extendError(constructor, writableName) {
		constructor.prototype = Object.create(Error.prototype, {
			constructor: { value: constructor },
			name: {
				value: constructor.name,
				enumerable: true,
				writable: writableName
			}
		});
	}
	var DOMExceptionName = conventions.freeze({
		/**
		* the default value as defined by the spec
		*/
		Error: "Error",
		/**
		* @deprecated
		* Use RangeError instead.
		*/
		IndexSizeError: "IndexSizeError",
		/**
		* @deprecated
		* Just to match the related static code, not part of the spec.
		*/
		DomstringSizeError: "DomstringSizeError",
		HierarchyRequestError: "HierarchyRequestError",
		WrongDocumentError: "WrongDocumentError",
		InvalidCharacterError: "InvalidCharacterError",
		/**
		* @deprecated
		* Just to match the related static code, not part of the spec.
		*/
		NoDataAllowedError: "NoDataAllowedError",
		NoModificationAllowedError: "NoModificationAllowedError",
		NotFoundError: "NotFoundError",
		NotSupportedError: "NotSupportedError",
		InUseAttributeError: "InUseAttributeError",
		InvalidStateError: "InvalidStateError",
		SyntaxError: "SyntaxError",
		InvalidModificationError: "InvalidModificationError",
		NamespaceError: "NamespaceError",
		/**
		* @deprecated
		* Use TypeError for invalid arguments,
		* "NotSupportedError" DOMException for unsupported operations,
		* and "NotAllowedError" DOMException for denied requests instead.
		*/
		InvalidAccessError: "InvalidAccessError",
		/**
		* @deprecated
		* Just to match the related static code, not part of the spec.
		*/
		ValidationError: "ValidationError",
		/**
		* @deprecated
		* Use TypeError instead.
		*/
		TypeMismatchError: "TypeMismatchError",
		SecurityError: "SecurityError",
		NetworkError: "NetworkError",
		AbortError: "AbortError",
		/**
		* @deprecated
		* Just to match the related static code, not part of the spec.
		*/
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
	});
	var DOMExceptionNames = Object.keys(DOMExceptionName);
	function isValidDomExceptionCode(value) {
		return typeof value === "number" && value >= 1 && value <= 25;
	}
	function endsWithError(value) {
		return typeof value === "string" && value.substring(value.length - DOMExceptionName.Error.length) === DOMExceptionName.Error;
	}
	/**
	* DOM operations only raise exceptions in "exceptional" circumstances, i.e., when an operation
	* is impossible to perform (either for logical reasons, because data is lost, or because the
	* implementation has become unstable). In general, DOM methods return specific error values in
	* ordinary processing situations, such as out-of-bound errors when using NodeList.
	*
	* Implementations should raise other exceptions under other circumstances. For example,
	* implementations should raise an implementation-dependent exception if a null argument is
	* passed when null was not expected.
	*
	* This implementation supports the following usages:
	* 1. according to the living standard (both arguments are optional):
	* ```
	* new DOMException("message (can be empty)", DOMExceptionNames.HierarchyRequestError)
	* ```
	* 2. according to previous xmldom implementation (only the first argument is required):
	* ```
	* new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "optional message")
	* ```
	* both result in the proper name being set.
	*
	* @class DOMException
	* @param {number | string} messageOrCode
	* The reason why an operation is not acceptable.
	* If it is a number, it is used to determine the `name`, see
	* {@link https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-258A00AF ExceptionCode}
	* @param {string | keyof typeof DOMExceptionName | Error} [nameOrMessage]
	* The `name` to use for the error.
	* If `messageOrCode` is a number, this arguments is used as the `message` instead.
	* @augments Error
	* @see https://webidl.spec.whatwg.org/#idl-DOMException
	* @see https://webidl.spec.whatwg.org/#dfn-error-names-table
	* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-17189187
	* @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
	* @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
	*/
	function DOMException(messageOrCode, nameOrMessage) {
		if (isValidDomExceptionCode(messageOrCode)) {
			this.name = DOMExceptionNames[messageOrCode];
			this.message = nameOrMessage || "";
		} else {
			this.message = messageOrCode;
			this.name = endsWithError(nameOrMessage) ? nameOrMessage : DOMExceptionName.Error;
		}
		if (Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
	}
	extendError(DOMException, true);
	Object.defineProperties(DOMException.prototype, { code: {
		enumerable: true,
		get: function() {
			var code = DOMExceptionNames.indexOf(this.name);
			if (isValidDomExceptionCode(code)) return code;
			return 0;
		}
	} });
	var ExceptionCode = {
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
	};
	var entries = Object.entries(ExceptionCode);
	for (var i = 0; i < entries.length; i++) {
		var key = entries[i][0];
		DOMException[key] = entries[i][1];
	}
	/**
	* Creates an error that will not be caught by XMLReader aka the SAX parser.
	*
	* @class
	* @param {string} message
	* @param {any} [locator]
	* @param {Error} [cause]
	* The error that caused this one, e.g. a `DOMException` thrown while building the DOM.
	*/
	function ParseError(message, locator, cause) {
		this.message = message;
		this.locator = locator;
		this.cause = cause;
		if (Error.captureStackTrace) Error.captureStackTrace(this, ParseError);
	}
	extendError(ParseError);
	exports.DOMException = DOMException;
	exports.DOMExceptionName = DOMExceptionName;
	exports.ExceptionCode = ExceptionCode;
	exports.ParseError = ParseError;
}));
//#endregion
//#region ../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/grammar.js
var require_grammar = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Detects relevant unicode support for regular expressions in the runtime.
	* Should the runtime not accepts the flag `u` or unicode ranges,
	* character classes without unicode handling will be used.
	*
	* @param {typeof RegExp} [RegExpImpl=RegExp]
	* For testing: the RegExp class.
	* @returns {boolean}
	* @see https://node.green/#ES2015-syntax-RegExp--y--and--u--flags
	*/
	function detectUnicodeSupport(RegExpImpl) {
		try {
			if (typeof RegExpImpl !== "function") RegExpImpl = RegExp;
			var match = new RegExpImpl("𝌆", "u").exec("𝌆");
			return !!match && match[0].length === 2;
		} catch (error) {}
		return false;
	}
	var UNICODE_SUPPORT = detectUnicodeSupport();
	/**
	* Removes `[`, `]` and any trailing quantifiers from the source of a RegExp.
	*
	* @param {RegExp} regexp
	*/
	function chars(regexp) {
		if (regexp.source[0] !== "[") throw new Error(regexp + " can not be used with chars");
		return regexp.source.slice(1, regexp.source.lastIndexOf("]"));
	}
	/**
	* Creates a new character list regular expression,
	* by removing `search` from the source of `regexp`.
	*
	* @param {RegExp} regexp
	* @param {string} search
	* The character(s) to remove.
	* @returns {RegExp}
	*/
	function chars_without(regexp, search) {
		if (regexp.source[0] !== "[") throw new Error("/" + regexp.source + "/ can not be used with chars_without");
		if (!search || typeof search !== "string") throw new Error(JSON.stringify(search) + " is not a valid search");
		if (regexp.source.indexOf(search) === -1) throw new Error("\"" + search + "\" is not is /" + regexp.source + "/");
		if (search === "-" && regexp.source.indexOf(search) !== 1) throw new Error("\"" + search + "\" is not at the first postion of /" + regexp.source + "/");
		return new RegExp(regexp.source.replace(search, ""), UNICODE_SUPPORT ? "u" : "");
	}
	/**
	* Combines and Regular expressions correctly by using `RegExp.source`.
	*
	* @param {...(RegExp | string)[]} args
	* @returns {RegExp}
	*/
	function reg(args) {
		var self = this;
		return new RegExp(Array.prototype.slice.call(arguments).map(function(part) {
			var isStr = typeof part === "string";
			if (isStr && self === void 0 && part === "|") throw new Error("use regg instead of reg to wrap expressions with `|`!");
			return isStr ? part : part.source;
		}).join(""), UNICODE_SUPPORT ? "u" : "");
	}
	/**
	* Like `reg` but wraps the expression in `(?:`,`)` to create a non tracking group.
	*
	* @param {...(RegExp | string)[]} args
	* @returns {RegExp}
	*/
	function regg(args) {
		if (arguments.length === 0) throw new Error("no parameters provided");
		return reg.apply(regg, ["(?:"].concat(Array.prototype.slice.call(arguments), [")"]));
	}
	/**
	* A character usually appearing in wrongly converted strings.
	*
	* @type {string}
	* @see https://en.wikipedia.org/wiki/Specials_(Unicode_block)#Replacement_character
	* @see https://nodejs.dev/en/api/v18/buffer/#buffers-and-character-encodings
	* @see https://www.unicode.org/faq/utf_bom.html#BOM
	* @readonly
	*/
	var UNICODE_REPLACEMENT_CHARACTER = "�";
	var Char = /[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;
	if (UNICODE_SUPPORT) Char = reg("[", chars(Char), "\\u{10000}-\\u{10FFFF}", "]");
	var InvalidChar = new RegExp("[^" + chars(Char) + "]", UNICODE_SUPPORT ? "u" : "");
	var _SChar = /[\x20\x09\x0D\x0A]/;
	var SChar_s = chars(_SChar);
	var S = reg(_SChar, "+");
	var S_OPT = reg(_SChar, "*");
	var NameStartChar = /[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
	if (UNICODE_SUPPORT) NameStartChar = reg("[", chars(NameStartChar), "\\u{10000}-\\u{10FFFF}", "]");
	var NameChar = reg("[", chars(NameStartChar), chars(/[-.0-9\xB7]/), chars(/[\u0300-\u036F\u203F-\u2040]/), "]");
	var Name = reg(NameStartChar, NameChar, "*");
	var Name_exact = reg("^", Name, "$");
	var Nmtoken = reg(NameChar, "+");
	var Reference = regg(reg("&", Name, ";"), "|", regg(/&#[0-9]+;|&#x[0-9a-fA-F]+;/));
	var PEReference = reg("%", Name, ";");
	var EntityValue = regg(reg("\"", regg(/[^%&"]/, "|", PEReference, "|", Reference), "*", "\""), "|", reg("'", regg(/[^%&']/, "|", PEReference, "|", Reference), "*", "'"));
	var AttValue = regg("\"", regg(/[^<&"]/, "|", Reference), "*", "\"", "|", "'", regg(/[^<&']/, "|", Reference), "*", "'");
	var NCName = reg(chars_without(NameStartChar, ":"), chars_without(NameChar, ":"), "*");
	var NCName_exact = reg("^", NCName, "$");
	/**
	https://www.w3.org/TR/xml-names/#ns-qualnames
	
	```
	[7] QName ::= PrefixedName | UnprefixedName
	=== (NCName ':' NCName) | NCName
	=== NCName (':' NCName)?
	[8] PrefixedName ::= Prefix ':' LocalPart
	=== NCName ':' NCName
	[9] UnprefixedName ::= LocalPart
	=== NCName
	[10] Prefix ::= NCName
	[11] LocalPart ::= NCName
	```
	*/
	var QName = reg(NCName, regg(":", NCName), "?");
	var QName_exact = reg("^", QName, "$");
	var QName_group = reg("(", QName, ")");
	var SystemLiteral = regg(/"[^"]*"|'[^']*'/);
	var PI = reg(/^<\?/, "(", Name, ")", regg(S, "(?!", _SChar, ")(", Char, "*?)"), "?", /\?>/);
	var PubidChar = /[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/;
	var PubidLiteral = regg("\"", PubidChar, "*\"", "|", "'", chars_without(PubidChar, "'"), "*'");
	var COMMENT_START = "<!--";
	var COMMENT_END = "-->";
	var Comment = reg(COMMENT_START, regg(chars_without(Char, "-"), "|", reg("-", chars_without(Char, "-"))), "*", COMMENT_END);
	var PCDATA = "#PCDATA";
	var contentspec = regg("EMPTY", "|", "ANY", "|", regg(reg(/\(/, S_OPT, PCDATA, regg(S_OPT, /\|/, S_OPT, QName), "*", S_OPT, /\)\*/), "|", reg(/\(/, S_OPT, PCDATA, S_OPT, /\)/)), "|", reg(/\([^>]+\)/, /[?*+]?/));
	var elementdecl = reg("<!ELEMENT", S, regg(QName, "|", PEReference), S, regg(contentspec, "|", PEReference), S_OPT, ">");
	var AttlistDecl = reg("<!ATTLIST", S, Name, regg(S, Name, S, regg(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/, "|", regg(reg("NOTATION", S, /\(/, S_OPT, Name, regg(S_OPT, /\|/, S_OPT, Name), "*", S_OPT, /\)/), "|", reg(/\(/, S_OPT, Nmtoken, regg(S_OPT, /\|/, S_OPT, Nmtoken), "*", S_OPT, /\)/))), S, regg(/#REQUIRED|#IMPLIED/, "|", regg(regg("#FIXED", S), "?", AttValue))), "*", S_OPT, ">");
	var ABOUT_LEGACY_COMPAT = "about:legacy-compat";
	var ABOUT_LEGACY_COMPAT_SystemLiteral = regg("\"" + ABOUT_LEGACY_COMPAT + "\"", "|", "'" + ABOUT_LEGACY_COMPAT + "'");
	var SYSTEM = "SYSTEM";
	var PUBLIC = "PUBLIC";
	var ExternalID = regg(regg(SYSTEM, S, SystemLiteral), "|", regg(PUBLIC, S, PubidLiteral, S, SystemLiteral));
	var ExternalID_match = reg("^", regg(regg(SYSTEM, S, "(?<SystemLiteralOnly>", SystemLiteral, ")"), "|", regg(PUBLIC, S, "(?<PubidLiteral>", PubidLiteral, ")", S, "(?<SystemLiteral>", SystemLiteral, ")")));
	var PubidLiteral_match = reg("^", PubidLiteral, "$");
	var SystemLiteral_match = reg("^", SystemLiteral, "$");
	var EntityDef = regg(EntityValue, "|", regg(ExternalID, regg(S, "NDATA", S, Name), "?"));
	var ENTITY_DECL_START = "<!ENTITY";
	var EntityDecl = regg(reg(ENTITY_DECL_START, S, Name, S, EntityDef, S_OPT, ">"), "|", reg(ENTITY_DECL_START, S, "%", S, Name, S, regg(EntityValue, "|", ExternalID), S_OPT, ">"));
	var NotationDecl = reg("<!NOTATION", S, Name, S, regg(ExternalID, "|", reg(PUBLIC, S, PubidLiteral)), S_OPT, ">");
	var Eq = reg(S_OPT, "=", S_OPT);
	var VersionNum = /1[.]\d+/;
	var VersionInfo = reg(S, "version", Eq, regg("'", VersionNum, "'", "|", "\"", VersionNum, "\""));
	var EncName = /[A-Za-z][-A-Za-z0-9._]*/;
	var XMLDecl = reg(/^<\?xml/, VersionInfo, regg(S, "encoding", Eq, regg("\"", EncName, "\"", "|", "'", EncName, "'")), "?", regg(S, "standalone", Eq, regg("'", regg("yes", "|", "no"), "'", "|", "\"", regg("yes", "|", "no"), "\"")), "?", S_OPT, /\?>/);
	var DOCTYPE_DECL_START = "<!DOCTYPE";
	var CDATA_START = "<![CDATA[";
	var CDATA_END = "]]>";
	var CDSect = reg(/<!\[CDATA\[/, reg(Char, "*?", /\]\]>/));
	exports.chars = chars;
	exports.chars_without = chars_without;
	exports.detectUnicodeSupport = detectUnicodeSupport;
	exports.reg = reg;
	exports.regg = regg;
	exports.ABOUT_LEGACY_COMPAT = ABOUT_LEGACY_COMPAT;
	exports.ABOUT_LEGACY_COMPAT_SystemLiteral = ABOUT_LEGACY_COMPAT_SystemLiteral;
	exports.AttlistDecl = AttlistDecl;
	exports.CDATA_START = CDATA_START;
	exports.CDATA_END = CDATA_END;
	exports.CDSect = CDSect;
	exports.Char = Char;
	exports.Comment = Comment;
	exports.COMMENT_START = COMMENT_START;
	exports.COMMENT_END = COMMENT_END;
	exports.DOCTYPE_DECL_START = DOCTYPE_DECL_START;
	exports.elementdecl = elementdecl;
	exports.EntityDecl = EntityDecl;
	exports.EntityValue = EntityValue;
	exports.ExternalID = ExternalID;
	exports.ExternalID_match = ExternalID_match;
	exports.Name = Name;
	exports.Name_exact = Name_exact;
	exports.NCName_exact = NCName_exact;
	exports.NotationDecl = NotationDecl;
	exports.Reference = Reference;
	exports.PEReference = PEReference;
	exports.PI = PI;
	exports.PUBLIC = PUBLIC;
	exports.PubidLiteral = PubidLiteral;
	exports.PubidLiteral_match = PubidLiteral_match;
	exports.QName = QName;
	exports.QName_exact = QName_exact;
	exports.QName_group = QName_group;
	exports.S = S;
	exports.SChar_s = SChar_s;
	exports.S_OPT = S_OPT;
	exports.SYSTEM = SYSTEM;
	exports.SystemLiteral = SystemLiteral;
	exports.SystemLiteral_match = SystemLiteral_match;
	exports.InvalidChar = InvalidChar;
	exports.UNICODE_REPLACEMENT_CHARACTER = UNICODE_REPLACEMENT_CHARACTER;
	exports.UNICODE_SUPPORT = UNICODE_SUPPORT;
	exports.XMLDecl = XMLDecl;
}));
//#endregion
//#region ../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/dom.js
var require_dom = /* @__PURE__ */ __commonJSMin(((exports) => {
	var conventions = require_conventions();
	var find = conventions.find;
	var hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
	var hasOwn = conventions.hasOwn;
	var isHTMLMimeType = conventions.isHTMLMimeType;
	var isHTMLRawTextElement = conventions.isHTMLRawTextElement;
	var isHTMLVoidElement = conventions.isHTMLVoidElement;
	var MIME_TYPE = conventions.MIME_TYPE;
	var NAMESPACE = conventions.NAMESPACE;
	/**
	* Private DOM Constructor symbol
	*
	* Internal symbol used for construction of all classes whose constructors should be private.
	* Currently used for checks in `Node`, `Document`, `Element`, `Attr`, `CharacterData`, `Text`, `Comment`,
	* `CDATASection`, `DocumentType`, `Notation`, `Entity`, `EntityReference`, `DocumentFragment`, `ProcessingInstruction`
	* so the constructor can't be used from outside the module.
	*/
	var PDC = Symbol();
	var errors = require_errors();
	var DOMException = errors.DOMException;
	var DOMExceptionName = errors.DOMExceptionName;
	var g = require_grammar();
	/**
	* Checks if the given symbol equals the Private DOM Constructor symbol (PDC)
	* and throws an Illegal constructor exception when the symbols don't match.
	* This ensures that the constructor remains private and can't be used outside this module.
	*/
	function checkSymbol(symbol) {
		if (symbol !== PDC) throw new TypeError("Illegal constructor");
	}
	/**
	* A prerequisite for `[].filter`, to drop elements that are empty.
	*
	* @param {string} input
	* The string to be checked.
	* @returns {boolean}
	* Returns `true` if the input string is not empty, `false` otherwise.
	*/
	function notEmptyString(input) {
		return input !== "";
	}
	/**
	* Splits a string on ASCII whitespace characters (U+0009 TAB, U+000A LF, U+000C FF, U+000D CR,
	* U+0020 SPACE).
	* It follows the definition from the infra specification from WHATWG.
	*
	* @param {string} input
	* The string to be split.
	* @returns {string[]}
	* An array of the split strings. The array can be empty if the input string is empty or only
	* contains whitespace characters.
	* @see {@link https://infra.spec.whatwg.org/#split-on-ascii-whitespace}
	* @see {@link https://infra.spec.whatwg.org/#ascii-whitespace}
	*/
	function splitOnASCIIWhitespace(input) {
		return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
	}
	/**
	* Adds element as a key to current if it is not already present.
	*
	* @param {Record<string, boolean | undefined>} current
	* The current record object to which the element will be added as a key.
	* The object's keys are string types and values are either boolean or undefined.
	* @param {string} element
	* The string to be added as a key to the current record.
	* @returns {Record<string, boolean | undefined>}
	* The updated record object after the addition of the new element.
	*/
	function orderedSetReducer(current, element) {
		if (!hasOwn(current, element)) current[element] = true;
		return current;
	}
	/**
	* Converts a string into an ordered set by splitting the input on ASCII whitespace and
	* ensuring uniqueness of elements.
	* This follows the definition of an ordered set from the infra specification by WHATWG.
	*
	* @param {string} input
	* The input string to be transformed into an ordered set.
	* @returns {string[]}
	* An array of unique strings obtained from the input, preserving the original order.
	* The array can be empty if the input string is empty or only contains whitespace characters.
	* @see {@link https://infra.spec.whatwg.org/#ordered-set}
	*/
	function toOrderedSet(input) {
		if (!input) return [];
		var list = splitOnASCIIWhitespace(input);
		return Object.keys(list.reduce(orderedSetReducer, {}));
	}
	/**
	* Uses `list.indexOf` to implement a function that behaves like `Array.prototype.includes`.
	* This function is used in environments where `Array.prototype.includes` may not be available.
	*
	* @param {any[]} list
	* The array in which to search for the element.
	* @returns {function(any): boolean}
	* A function that accepts an element and returns a boolean indicating whether the element is
	* included in the provided list.
	*/
	function arrayIncludes(list) {
		return function(element) {
			return list && list.indexOf(element) !== -1;
		};
	}
	/**
	* Validates a qualified name based on the criteria provided in the DOM specification by
	* WHATWG.
	*
	* @param {string} qualifiedName
	* The qualified name to be validated.
	* @throws {DOMException}
	* With code {@link DOMException.INVALID_CHARACTER_ERR} if the qualified name contains an
	* invalid character.
	* @see {@link https://dom.spec.whatwg.org/#validate}
	*/
	function validateQualifiedName(qualifiedName) {
		if (!g.QName_exact.test(qualifiedName)) throw new DOMException(DOMException.INVALID_CHARACTER_ERR, "invalid character in qualified name \"" + qualifiedName + "\"");
	}
	/**
	* Validates a qualified name and the namespace associated with it,
	* based on the criteria provided in the DOM specification by WHATWG.
	*
	* @param {string | null} namespace
	* The namespace to be validated. It can be a string or null.
	* @param {string} qualifiedName
	* The qualified name to be validated.
	* @returns {[namespace: string | null, prefix: string | null, localName: string]}
	* Returns a tuple with the namespace,
	* prefix and local name of the qualified name.
	* @throws {DOMException}
	* Throws a DOMException if the qualified name or the namespace is not valid.
	* @see {@link https://dom.spec.whatwg.org/#validate-and-extract}
	*/
	function validateAndExtract(namespace, qualifiedName) {
		validateQualifiedName(qualifiedName);
		namespace = namespace || null;
		/**
		* @type {string | null}
		*/
		var prefix = null;
		var localName = qualifiedName;
		if (qualifiedName.indexOf(":") >= 0) {
			var splitResult = qualifiedName.split(":");
			prefix = splitResult[0];
			localName = splitResult[1];
		}
		if (prefix !== null && namespace === null) throw new DOMException(DOMException.NAMESPACE_ERR, "prefix is non-null and namespace is null");
		if (prefix === "xml" && namespace !== conventions.NAMESPACE.XML) throw new DOMException(DOMException.NAMESPACE_ERR, "prefix is \"xml\" and namespace is not the XML namespace");
		if ((prefix === "xmlns" || qualifiedName === "xmlns") && namespace !== conventions.NAMESPACE.XMLNS) throw new DOMException(DOMException.NAMESPACE_ERR, "either qualifiedName or prefix is \"xmlns\" and namespace is not the XMLNS namespace");
		if (namespace === conventions.NAMESPACE.XMLNS && prefix !== "xmlns" && qualifiedName !== "xmlns") throw new DOMException(DOMException.NAMESPACE_ERR, "namespace is the XMLNS namespace and neither qualifiedName nor prefix is \"xmlns\"");
		return [
			namespace,
			prefix,
			localName
		];
	}
	/**
	* Copies properties from one object to another.
	* It only copies the object's own (not inherited) properties.
	*
	* @param {Object} src
	* The source object from which properties are copied.
	* @param {Object} dest
	* The destination object to which properties are copied.
	*/
	function copy(src, dest) {
		for (var p in src) if (hasOwn(src, p)) dest[p] = src[p];
	}
	/**
	* Extends a class with the properties and methods of a super class.
	* It uses a form of prototypal inheritance, and establishes the `constructor` property
	* correctly(?).
	*
	* It is not clear to the current maintainers if this implementation is making sense,
	* since it creates an intermediate prototype function,
	* which all properties of `Super` are copied onto using `_copy`.
	*
	* @param {Object} Class
	* The class that is to be extended.
	* @param {Object} Super
	* The super class from which properties and methods are inherited.
	* @private
	*/
	function _extends(Class, Super) {
		var pt = Class.prototype;
		if (!(pt instanceof Super)) {
			function t() {}
			t.prototype = Super.prototype;
			t = new t();
			copy(pt, t);
			Class.prototype = pt = t;
		}
		if (pt.constructor != Class) {
			if (typeof Class != "function") console.error("unknown Class:" + Class);
			pt.constructor = Class;
		}
	}
	var NodeType = {};
	var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
	var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
	var TEXT_NODE = NodeType.TEXT_NODE = 3;
	var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
	var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
	var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
	var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
	var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
	var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
	var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
	var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
	var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
	var DocumentPosition = conventions.freeze({
		DOCUMENT_POSITION_DISCONNECTED: 1,
		DOCUMENT_POSITION_PRECEDING: 2,
		DOCUMENT_POSITION_FOLLOWING: 4,
		DOCUMENT_POSITION_CONTAINS: 8,
		DOCUMENT_POSITION_CONTAINED_BY: 16,
		DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32
	});
	/**
	* Finds the common ancestor in two parent chains.
	*
	* @param {Node[]} a
	* The first parent chain.
	* @param {Node[]} b
	* The second parent chain.
	* @returns {Node}
	* The common ancestor node if it exists. If there is no common ancestor, the function will
	* return `null`.
	*/
	function commonAncestor(a, b) {
		if (b.length < a.length) return commonAncestor(b, a);
		var c = null;
		for (var n in a) {
			if (a[n] !== b[n]) return c;
			c = a[n];
		}
		return c;
	}
	/**
	* Assigns a unique identifier to a document to ensure consistency while comparing unrelated
	* nodes.
	*
	* @param {Document} doc
	* The document to which a unique identifier is to be assigned.
	* @returns {string}
	* The unique identifier of the document. If the document already had a unique identifier, the
	* function will return the existing one.
	*/
	function docGUID(doc) {
		if (!doc.guid) doc.guid = Math.random();
		return doc.guid;
	}
	/**
	* The NodeList interface provides the abstraction of an ordered collection of nodes,
	* without defining or constraining how this collection is implemented.
	* NodeList objects in the DOM are live.
	* The items in the NodeList are accessible via an integral index, starting from 0.
	* You can also access the items of the NodeList with a `for...of` loop.
	*
	* @class NodeList
	* @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
	* @constructs NodeList
	*/
	function NodeList() {}
	NodeList.prototype = {
		/**
		* The number of nodes in the list. The range of valid child node indices is 0 to length-1
		* inclusive.
		*
		* @type {number}
		*/
		length: 0,
		/**
		* Returns the item at `index`. If index is greater than or equal to the number of nodes in
		* the list, this returns null.
		*
		* @param index
		* Unsigned long Index into the collection.
		* @returns {Node | null}
		* The node at position `index` in the NodeList,
		* or null if that is not a valid index.
		*/
		item: function(index) {
			return index >= 0 && index < this.length ? this[index] : null;
		},
		/**
		* Returns a string representation of the NodeList.
		*
		* Accepts the same `options` object as `XMLSerializer.prototype.serializeToString`
		* (`requireWellFormed`, `splitCDATASections`, `nodeFilter`). Passing a function is treated as
		* a legacy `nodeFilter` for backward compatibility.
		*
		* @param {Object | function} [options]
		* @param {boolean} [options.requireWellFormed=false]
		* @param {boolean} [options.splitCDATASections=true]
		* @param {function} [options.nodeFilter]
		* @returns {string}
		*/
		toString: function(options) {
			var opts;
			if (typeof options === "function") opts = {
				requireWellFormed: false,
				splitCDATASections: true,
				nodeFilter: options
			};
			else if (!!options) opts = {
				requireWellFormed: !!options.requireWellFormed,
				splitCDATASections: options.splitCDATASections !== false,
				nodeFilter: options.nodeFilter || null
			};
			else opts = {
				requireWellFormed: false,
				splitCDATASections: true,
				nodeFilter: null
			};
			for (var buf = [], i = 0; i < this.length; i++) serializeToString(this[i], buf, null, opts);
			return buf.join("");
		},
		/**
		* Filters the NodeList based on a predicate.
		*
		* @param {function(Node): boolean} predicate
		* - A predicate function to filter the NodeList.
		* @returns {Node[]}
		* An array of nodes that satisfy the predicate.
		* @private
		*/
		filter: function(predicate) {
			return Array.prototype.filter.call(this, predicate);
		},
		/**
		* Returns the first index at which a given node can be found in the NodeList, or -1 if it is
		* not present.
		*
		* @param {Node} item
		* - The Node item to locate in the NodeList.
		* @returns {number}
		* The first index of the node in the NodeList; -1 if not found.
		* @private
		*/
		indexOf: function(item) {
			return Array.prototype.indexOf.call(this, item);
		}
	};
	NodeList.prototype[Symbol.iterator] = function() {
		var me = this;
		var index = 0;
		return {
			next: function() {
				if (index < me.length) return {
					value: me[index++],
					done: false
				};
				else return { done: true };
			},
			return: function() {
				return { done: true };
			}
		};
	};
	/**
	* Represents a live collection of nodes that is automatically updated when its associated
	* document changes.
	*
	* @class LiveNodeList
	* @param {Node} node
	* The associated node.
	* @param {function} refresh
	* The function to refresh the live node list.
	* @augments NodeList
	* @constructs LiveNodeList
	*/
	function LiveNodeList(node, refresh) {
		this._node = node;
		this._refresh = refresh;
		_updateLiveList(this);
	}
	/**
	* Updates the live node list.
	*
	* @param {LiveNodeList} list
	* The live node list to update.
	* @private
	*/
	function _updateLiveList(list) {
		var inc = list._node._inc || list._node.ownerDocument._inc;
		if (list._inc !== inc) {
			var ls = list._refresh(list._node);
			__set__(list, "length", ls.length);
			if (!list.$$length || ls.length < list.$$length) {
				for (var i = ls.length; i in list; i++) if (hasOwn(list, i)) delete list[i];
			}
			copy(ls, list);
			list._inc = inc;
		}
	}
	/**
	* Returns the node at position `index` in the LiveNodeList, or null if that is not a valid
	* index.
	*
	* @param {number} i
	* Index into the collection.
	* @returns {Node | null}
	* The node at position `index` in the LiveNodeList, or null if that is not a valid index.
	*/
	LiveNodeList.prototype.item = function(i) {
		_updateLiveList(this);
		return this[i] || null;
	};
	_extends(LiveNodeList, NodeList);
	/**
	* Objects implementing the NamedNodeMap interface are used to represent collections of nodes
	* that can be accessed by name.
	* Note that NamedNodeMap does not inherit from NodeList;
	* NamedNodeMaps are not maintained in any particular order.
	* Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal
	* index,
	* but this is simply to allow convenient enumeration of the contents of a NamedNodeMap,
	* and does not imply that the DOM specifies an order to these Nodes.
	* NamedNodeMap objects in the DOM are live.
	* used for attributes or DocumentType entities
	*
	* This implementation only supports property indices, but does not support named properties,
	* as specified in the living standard.
	*
	* @class NamedNodeMap
	* @see https://dom.spec.whatwg.org/#interface-namednodemap
	* @see https://webidl.spec.whatwg.org/#dfn-supported-property-names
	* @constructs NamedNodeMap
	*/
	/**
	* A live collection of an element's attributes, keyed by name.
	*
	* The numbered entries and `length` are the sole authority for attribute order.
	* A separate two-level null-prototype membership index (`namespaceURI` ->
	* `localName` -> `Attr`, with the null/empty namespace held in its own bucket)
	* lets the parse-time de-duplication in `setNamedItem` resolve an existing
	* attribute in O(1) instead of scanning the list, so building an element with M
	* attributes costs O(M) rather than O(M^2). The index never reorders attributes.
	*/
	function NamedNodeMap() {
		this._nsIndex = Object.create(null);
		this._noNsIndex = Object.create(null);
	}
	/**
	* Returns the index of a node within the list.
	*
	* @param {Array} list
	* The list of nodes.
	* @param {Node} node
	* The node to find.
	* @returns {number}
	* The index of the node within the list, or -1 if not found.
	* @private
	*/
	function _findNodeIndex(list, node) {
		var i = 0;
		while (i < list.length) {
			if (list[i] === node) return i;
			i++;
		}
	}
	/**
	* Returns the second-level index bucket (`localName` -> `Attr`) for a namespace,
	* replicating `getNamedItemNS`'s falsy-namespace normalization: `null`,
	* `undefined` and `''` all resolve to the dedicated null-namespace bucket, kept separate from
	* any real URI (so a namespace URI equal to the string `"null"`
	* cannot collide with the null namespace). Both levels are null-prototype objects, so an
	* attribute named `__proto__` or `constructor` is an ordinary key.
	*
	* @param {NamedNodeMap} map
	* @param {string | null | undefined} namespaceURI
	* @param {boolean} create
	* Create the bucket if it does not exist yet.
	* @returns {Object | undefined}
	* @private
	*/
	function _nnmBucket(map, namespaceURI, create) {
		if (!namespaceURI) return map._noNsIndex;
		var bucket = map._nsIndex[namespaceURI];
		if (!bucket && create) bucket = map._nsIndex[namespaceURI] = Object.create(null);
		return bucket;
	}
	/**
	* Looks up an attribute by namespace and local name through the membership index.
	*
	* @param {NamedNodeMap} map
	* @param {string | null | undefined} namespaceURI
	* @param {string} localName
	* @returns {Attr | null}
	* The matching attribute, or `null` when absent.
	* @private
	*/
	function _nnmIndexFind(map, namespaceURI, localName) {
		var bucket = _nnmBucket(map, namespaceURI, false);
		var found = bucket && bucket[localName];
		return found ? found : null;
	}
	/**
	* Records `attr` in the membership index under its namespace and local name,
	* replacing any previous attribute with the same key.
	*
	* @param {NamedNodeMap} map
	* @param {Attr} attr
	* @private
	*/
	function _nnmIndexAdd(map, attr) {
		_nnmBucket(map, attr.namespaceURI, true)[attr.localName] = attr;
	}
	/**
	* Removes `attr` from the membership index.
	*
	* @param {NamedNodeMap} map
	* @param {Attr} attr
	* @private
	*/
	function _nnmIndexRemove(map, attr) {
		var bucket = _nnmBucket(map, attr.namespaceURI, false);
		if (bucket) delete bucket[attr.localName];
	}
	/**
	* Adds a new attribute to the list and updates the owner element of the attribute.
	*
	* @param {Element} el
	* The element which will become the owner of the new attribute.
	* @param {NamedNodeMap} list
	* The list to which the new attribute will be added.
	* @param {Attr} newAttr
	* The new attribute to be added.
	* @param {Attr} oldAttr
	* The old attribute to be replaced, or null if no attribute is to be replaced.
	* @returns {void}
	* @private
	*/
	function _addNamedNode(el, list, newAttr, oldAttr) {
		if (oldAttr) list[_findNodeIndex(list, oldAttr)] = newAttr;
		else {
			list[list.length] = newAttr;
			list.length++;
		}
		_nnmIndexAdd(list, newAttr);
		if (el) {
			newAttr.ownerElement = el;
			var doc = el.ownerDocument;
			if (doc) {
				oldAttr && _onRemoveAttribute(doc, el, oldAttr);
				_onAddAttribute(doc, el, newAttr);
			}
		}
	}
	/**
	* Removes an attribute from the list and updates the owner element of the attribute.
	*
	* @param {Element} el
	* The element which is the current owner of the attribute.
	* @param {NamedNodeMap} list
	* The list from which the attribute will be removed.
	* @param {Attr} attr
	* The attribute to be removed.
	* @returns {void}
	* @private
	*/
	function _removeNamedNode(el, list, attr) {
		var i = _findNodeIndex(list, attr);
		if (i >= 0) {
			var lastIndex = list.length - 1;
			while (i <= lastIndex) list[i] = list[++i];
			list.length = lastIndex;
			_nnmIndexRemove(list, attr);
			if (el) {
				var doc = el.ownerDocument;
				if (doc) _onRemoveAttribute(doc, el, attr);
				attr.ownerElement = null;
			}
		}
	}
	NamedNodeMap.prototype = {
		length: 0,
		item: NodeList.prototype.item,
		/**
		* Get an attribute by name. Note: Name is in lower case in case of HTML namespace and
		* document.
		*
		* @param {string} localName
		* The local name of the attribute.
		* @returns {Attr | null}
		* The attribute with the given local name, or null if no such attribute exists.
		* @see https://dom.spec.whatwg.org/#concept-element-attributes-get-by-name
		*/
		getNamedItem: function(localName) {
			if (this._ownerElement && this._ownerElement._isInHTMLDocumentAndNamespace()) localName = localName.toLowerCase();
			var i = 0;
			while (i < this.length) {
				var attr = this[i];
				if (attr.nodeName === localName) return attr;
				i++;
			}
			return null;
		},
		/**
		* Set an attribute.
		*
		* @param {Attr} attr
		* The attribute to set.
		* @returns {Attr | null}
		* The old attribute with the same local name and namespace URI as the new one, or null if no
		* such attribute exists.
		* @throws {DOMException}
		* With code:
		* - {@link INUSE_ATTRIBUTE_ERR} - If the attribute is already an attribute of another
		* element.
		* @see https://dom.spec.whatwg.org/#concept-element-attributes-set
		*/
		setNamedItem: function(attr) {
			var el = attr.ownerElement;
			if (el && el !== this._ownerElement) throw new DOMException(DOMException.INUSE_ATTRIBUTE_ERR);
			var oldAttr = _nnmIndexFind(this, attr.namespaceURI, attr.localName);
			if (oldAttr === attr) return attr;
			_addNamedNode(this._ownerElement, this, attr, oldAttr);
			return oldAttr;
		},
		/**
		* Set an attribute, replacing an existing attribute with the same local name and namespace
		* URI if one exists.
		*
		* @param {Attr} attr
		* The attribute to set.
		* @returns {Attr | null}
		* The old attribute with the same local name and namespace URI as the new one, or null if no
		* such attribute exists.
		* @throws {DOMException}
		* Throws a DOMException with the name "InUseAttributeError" if the attribute is already an
		* attribute of another element.
		* @see https://dom.spec.whatwg.org/#concept-element-attributes-set
		*/
		setNamedItemNS: function(attr) {
			return this.setNamedItem(attr);
		},
		/**
		* Removes an attribute specified by the local name.
		*
		* @param {string} localName
		* The local name of the attribute to be removed.
		* @returns {Attr}
		* The attribute node that was removed.
		* @throws {DOMException}
		* With code:
		* - {@link DOMException.NOT_FOUND_ERR} if no attribute with the given name is found.
		* @see https://dom.spec.whatwg.org/#dom-namednodemap-removenameditem
		* @see https://dom.spec.whatwg.org/#concept-element-attributes-remove-by-name
		*/
		removeNamedItem: function(localName) {
			var attr = this.getNamedItem(localName);
			if (!attr) throw new DOMException(DOMException.NOT_FOUND_ERR, localName);
			_removeNamedNode(this._ownerElement, this, attr);
			return attr;
		},
		/**
		* Removes an attribute specified by the namespace and local name.
		*
		* @param {string | null} namespaceURI
		* The namespace URI of the attribute to be removed.
		* @param {string} localName
		* The local name of the attribute to be removed.
		* @returns {Attr}
		* The attribute node that was removed.
		* @throws {DOMException}
		* With code:
		* - {@link DOMException.NOT_FOUND_ERR} if no attribute with the given namespace URI and local
		* name is found.
		* @see https://dom.spec.whatwg.org/#dom-namednodemap-removenameditemns
		* @see https://dom.spec.whatwg.org/#concept-element-attributes-remove-by-namespace
		*/
		removeNamedItemNS: function(namespaceURI, localName) {
			var attr = this.getNamedItemNS(namespaceURI, localName);
			if (!attr) throw new DOMException(DOMException.NOT_FOUND_ERR, namespaceURI ? namespaceURI + " : " + localName : localName);
			_removeNamedNode(this._ownerElement, this, attr);
			return attr;
		},
		/**
		* Get an attribute by namespace and local name.
		*
		* @param {string | null} namespaceURI
		* The namespace URI of the attribute.
		* @param {string} localName
		* The local name of the attribute.
		* @returns {Attr | null}
		* The attribute with the given namespace URI and local name, or null if no such attribute
		* exists.
		* @see https://dom.spec.whatwg.org/#concept-element-attributes-get-by-namespace
		*/
		getNamedItemNS: function(namespaceURI, localName) {
			if (!namespaceURI) namespaceURI = null;
			var i = 0;
			while (i < this.length) {
				var node = this[i];
				if (node.localName === localName && node.namespaceURI === namespaceURI) return node;
				i++;
			}
			return null;
		}
	};
	NamedNodeMap.prototype[Symbol.iterator] = function() {
		var me = this;
		var index = 0;
		return {
			next: function() {
				if (index < me.length) return {
					value: me[index++],
					done: false
				};
				else return { done: true };
			},
			return: function() {
				return { done: true };
			}
		};
	};
	/**
	* The DOMImplementation interface provides a number of methods for performing operations that
	* are independent of any particular instance of the document object model.
	*
	* The DOMImplementation interface represents an object providing methods which are not
	* dependent on any particular document.
	* Such an object is returned by the `Document.implementation` property.
	*
	* **The individual methods describe the differences compared to the specs**.
	*
	* @class DOMImplementation
	* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation MDN
	* @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490 DOM Level 1 Core
	*      (Initial)
	* @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-102161490 DOM Level 2 Core
	* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-102161490 DOM Level 3 Core
	* @see https://dom.spec.whatwg.org/#domimplementation DOM Living Standard
	* @constructs DOMImplementation
	*/
	function DOMImplementation() {}
	DOMImplementation.prototype = {
		/**
		* Test if the DOM implementation implements a specific feature and version, as specified in
		* {@link https://www.w3.org/TR/DOM-Level-3-Core/core.html#DOMFeatures DOM Features}.
		*
		* The DOMImplementation.hasFeature() method returns a Boolean flag indicating if a given
		* feature is supported. The different implementations fairly diverged in what kind of
		* features were reported. The latest version of the spec settled to force this method to
		* always return true, where the functionality was accurate and in use.
		*
		* @deprecated
		* It is deprecated and modern browsers return true in all cases.
		* @function DOMImplementation#hasFeature
		* @param {string} feature
		* The name of the feature to test.
		* @param {string} [version]
		* This is the version number of the feature to test.
		* @returns {boolean}
		* Always returns true.
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/hasFeature MDN
		* @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-5CED94D7 DOM Level 1 Core
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-hasfeature DOM Living Standard
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-5CED94D7 DOM Level 3 Core
		*/
		hasFeature: function(feature, version) {
			return true;
		},
		/**
		* Creates a DOM Document object of the specified type with its document element. Note that
		* based on the {@link DocumentType}
		* given to create the document, the implementation may instantiate specialized
		* {@link Document} objects that support additional features than the "Core", such as "HTML"
		* {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#DOM2HTML DOM Level 2 HTML}.
		* On the other hand, setting the {@link DocumentType} after the document was created makes
		* this very unlikely to happen. Alternatively, specialized {@link Document} creation methods,
		* such as createHTMLDocument
		* {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#DOM2HTML DOM Level 2 HTML},
		* can be used to obtain specific types of {@link Document} objects.
		*
		* __It behaves slightly different from the description in the living standard__:
		* - There is no interface/class `XMLDocument`, it returns a `Document`
		* instance (with it's `type` set to `'xml'`).
		* - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
		*
		* @function DOMImplementation.createDocument
		* @param {string | null} namespaceURI
		* The
		* {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-namespaceURI namespace URI}
		* of the document element to create or null.
		* @param {string | null} qualifiedName
		* The
		* {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-qualifiedname qualified name}
		* of the document element to be created or null.
		* @param {DocumentType | null} [doctype=null]
		* The type of document to be created or null. When doctype is not null, its
		* {@link Node#ownerDocument} attribute is set to the document being created. Default is
		* `null`
		* @returns {Document}
		* A new {@link Document} object with its document element. If the NamespaceURI,
		* qualifiedName, and doctype are null, the returned {@link Document} is empty with no
		* document element.
		* @throws {DOMException}
		* With code:
		*
		* - `INVALID_CHARACTER_ERR`: Raised if the specified qualified name is not an XML name
		* according to {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#XML XML 1.0}.
		* - `NAMESPACE_ERR`: Raised if the qualifiedName is malformed, if the qualifiedName has a
		* prefix and the namespaceURI is null, or if the qualifiedName is null and the namespaceURI
		* is different from null, or if the qualifiedName has a prefix that is "xml" and the
		* namespaceURI is different from "{@link http://www.w3.org/XML/1998/namespace}"
		* {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#Namespaces XML Namespaces},
		* or if the DOM implementation does not support the "XML" feature but a non-null namespace
		* URI was provided, since namespaces were defined by XML.
		* - `WRONG_DOCUMENT_ERR`: Raised if doctype has already been used with a different document
		* or was created from a different implementation.
		* - `NOT_SUPPORTED_ERR`: May be raised if the implementation does not support the feature
		* "XML" and the language exposed through the Document does not support XML Namespaces (such
		* as {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#HTML40 HTML 4.01}).
		* @since DOM Level 2.
		* @see {@link #createHTMLDocument}
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocument MDN
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument DOM Living Standard
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Level-2-Core-DOM-createDocument DOM
		*      Level 3 Core
		* @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocument DOM
		*      Level 2 Core (initial)
		*/
		createDocument: function(namespaceURI, qualifiedName, doctype) {
			var contentType = MIME_TYPE.XML_APPLICATION;
			if (namespaceURI === NAMESPACE.HTML) contentType = MIME_TYPE.XML_XHTML_APPLICATION;
			else if (namespaceURI === NAMESPACE.SVG) contentType = MIME_TYPE.XML_SVG_IMAGE;
			var doc = new Document(PDC, { contentType });
			doc.implementation = this;
			doc.childNodes = new NodeList();
			doc.doctype = doctype || null;
			if (doctype) doc.appendChild(doctype);
			if (qualifiedName) {
				var root = doc.createElementNS(namespaceURI, qualifiedName);
				doc.appendChild(root);
			}
			return doc;
		},
		/**
		* Creates an empty DocumentType node. Entity declarations and notations are not made
		* available. Entity reference expansions and default attribute additions do not occur.
		*
		* **This behavior is slightly different from the one in the specs**:
		* - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
		* - `publicId` and `systemId` contain the raw data including any possible quotes,
		*   so they can always be serialized back to the original value
		* - `internalSubset` contains the raw string between `[` and `]` if present,
		*   but is not parsed or validated in any form.
		*
		* @function DOMImplementation#createDocumentType
		* @param {string} qualifiedName
		* The {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-qualifiedname qualified
		* name} of the document type to be created.
		* @param {string} [publicId]
		* The external subset public identifier. Stored verbatim including surrounding quotes.
		* When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
		* if the value is non-empty and does not match the XML `PubidLiteral` production
		* (W3C DOM Parsing §3.2.1.3; XML 1.0 production [12]). Creation-time validation is not
		* enforced — deferred to a future breaking release.
		* @param {string} [systemId]
		* The external subset system identifier. Stored verbatim including surrounding quotes.
		* When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
		* if the value is non-empty and does not match the XML `SystemLiteral` production
		* (W3C DOM Parsing §3.2.1.3; XML 1.0 production [11]). Creation-time validation is not
		* enforced — deferred to a future breaking release.
		* @param {string} [internalSubset]
		* The internal subset or an empty string if it is not present. Stored verbatim.
		* When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
		* if the value contains `"]>"`. Creation-time validation is not enforced.
		* @returns {DocumentType}
		* A new {@link DocumentType} node with {@link Node#ownerDocument} set to null.
		* @throws {DOMException}
		* With code:
		*
		* - `INVALID_CHARACTER_ERR`: Raised if the specified qualified name is not an XML name
		* according to {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#XML XML 1.0}.
		* - `NAMESPACE_ERR`: Raised if the qualifiedName is malformed.
		* - `NOT_SUPPORTED_ERR`: May be raised if the implementation does not support the feature
		* "XML" and the language exposed through the Document does not support XML Namespaces (such
		* as {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#HTML40 HTML 4.01}).
		* @since DOM Level 2.
		* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocumentType
		*      MDN
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocumenttype DOM Living
		*      Standard
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Level-3-Core-DOM-createDocType DOM
		*      Level 3 Core
		* @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocType DOM
		*      Level 2 Core
		* @see https://github.com/xmldom/xmldom/blob/master/CHANGELOG.md#050
		* @see https://www.w3.org/TR/DOM-Level-2-Core/#core-ID-Core-DocType-internalSubset
		* @prettierignore
		*/
		createDocumentType: function(qualifiedName, publicId, systemId, internalSubset) {
			validateQualifiedName(qualifiedName);
			var node = new DocumentType(PDC);
			node.name = qualifiedName;
			node.nodeName = qualifiedName;
			node.publicId = publicId || "";
			node.systemId = systemId || "";
			node.internalSubset = internalSubset || "";
			node.childNodes = new NodeList();
			return node;
		},
		/**
		* Returns an HTML document, that might already have a basic DOM structure.
		*
		* __It behaves slightly different from the description in the living standard__:
		* - If the first argument is `false` no initial nodes are added (steps 3-7 in the specs are
		* omitted)
		* - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
		*
		* @param {string | false} [title]
		* A string containing the title to give the new HTML document.
		* @returns {Document}
		* The HTML document.
		* @since WHATWG Living Standard.
		* @see {@link #createDocument}
		* @see https://dom.spec.whatwg.org/#dom-domimplementation-createhtmldocument
		* @see https://dom.spec.whatwg.org/#html-document
		*/
		createHTMLDocument: function(title) {
			var doc = new Document(PDC, { contentType: MIME_TYPE.HTML });
			doc.implementation = this;
			doc.childNodes = new NodeList();
			if (title !== false) {
				doc.doctype = this.createDocumentType("html");
				doc.doctype.ownerDocument = doc;
				doc.appendChild(doc.doctype);
				var htmlNode = doc.createElement("html");
				doc.appendChild(htmlNode);
				var headNode = doc.createElement("head");
				htmlNode.appendChild(headNode);
				if (typeof title === "string") {
					var titleNode = doc.createElement("title");
					titleNode.appendChild(doc.createTextNode(title));
					headNode.appendChild(titleNode);
				}
				htmlNode.appendChild(doc.createElement("body"));
			}
			return doc;
		}
	};
	/**
	* The DOM Node interface is an abstract base class upon which many other DOM API objects are
	* based, thus letting those object types to be used similarly and often interchangeably. As an
	* abstract class, there is no such thing as a plain Node object. All objects that implement
	* Node functionality are based on one of its subclasses. Most notable are Document, Element,
	* and DocumentFragment.
	*
	* In addition, every kind of DOM node is represented by an interface based on Node. These
	* include Attr, CharacterData (which Text, Comment, CDATASection and ProcessingInstruction are
	* all based on), and DocumentType.
	*
	* In some cases, a particular feature of the base Node interface may not apply to one of its
	* child interfaces; in that case, the inheriting node may return null or throw an exception,
	* depending on circumstances. For example, attempting to add children to a node type that
	* cannot have children will throw an exception.
	*
	* **This behavior is slightly different from the in the specs**:
	* - unimplemented interfaces: `EventTarget`
	*
	* @class
	* @abstract
	* @param {Symbol} symbol
	* @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
	* @see https://dom.spec.whatwg.org/#node
	* @prettierignore
	*/
	function Node(symbol) {
		checkSymbol(symbol);
	}
	Node.prototype = {
		/**
		* The first child of this node.
		*
		* @type {Node | null}
		*/
		firstChild: null,
		/**
		* The last child of this node.
		*
		* @type {Node | null}
		*/
		lastChild: null,
		/**
		* The previous sibling of this node.
		*
		* @type {Node | null}
		*/
		previousSibling: null,
		/**
		* The next sibling of this node.
		*
		* @type {Node | null}
		*/
		nextSibling: null,
		/**
		* The parent node of this node.
		*
		* @type {Node | null}
		*/
		parentNode: null,
		/**
		* The parent element of this node.
		*
		* @type {Element | null}
		*/
		get parentElement() {
			return this.parentNode && this.parentNode.nodeType === this.ELEMENT_NODE ? this.parentNode : null;
		},
		/**
		* The child nodes of this node.
		*
		* @type {NodeList}
		*/
		childNodes: null,
		/**
		* The document object associated with this node.
		*
		* @type {Document | null}
		*/
		ownerDocument: null,
		/**
		* The value of this node.
		*
		* @type {string | null}
		*/
		nodeValue: null,
		/**
		* The namespace URI of this node.
		*
		* @type {string | null}
		*/
		namespaceURI: null,
		/**
		* The prefix of the namespace for this node.
		*
		* @type {string | null}
		*/
		prefix: null,
		/**
		* The local part of the qualified name of this node.
		*
		* @type {string | null}
		*/
		localName: null,
		/**
		* The baseURI is currently always `about:blank`,
		* since that's what happens when you create a document from scratch.
		*
		* @type {'about:blank'}
		*/
		baseURI: "about:blank",
		/**
		* Is true if this node is part of a document.
		*
		* @type {boolean}
		*/
		get isConnected() {
			var rootNode = this.getRootNode();
			return rootNode && rootNode.nodeType === rootNode.DOCUMENT_NODE;
		},
		/**
		* Checks whether `other` is an inclusive descendant of this node.
		*
		* @param {Node | null | undefined} other
		* The node to check.
		* @returns {boolean}
		* True if `other` is an inclusive descendant of this node; false otherwise.
		* @see https://dom.spec.whatwg.org/#dom-node-contains
		*/
		contains: function(other) {
			if (!other) return false;
			var parent = other;
			do {
				if (this === parent) return true;
				parent = parent.parentNode;
			} while (parent);
			return false;
		},
		/**
		* @typedef GetRootNodeOptions
		* @property {boolean} [composed=false]
		*/
		/**
		* Searches for the root node of this node.
		*
		* **This behavior is slightly different from the in the specs**:
		* - ignores `options.composed`, since `ShadowRoot`s are unsupported, always returns root.
		*
		* @param {GetRootNodeOptions} [options]
		* @returns {Node}
		* Root node.
		* @see https://dom.spec.whatwg.org/#dom-node-getrootnode
		* @see https://dom.spec.whatwg.org/#concept-shadow-including-root
		*/
		getRootNode: function(options) {
			var parent = this;
			do {
				if (!parent.parentNode) return parent;
				parent = parent.parentNode;
			} while (parent);
		},
		/**
		* Checks whether the given node is equal to this node.
		*
		* Two nodes are equal when they have the same type, defining characteristics (for the type),
		* and the same childNodes. The comparison is iterative to avoid stack overflows on
		* deeply-nested trees. Attribute nodes of each Element pair are also pushed onto the stack
		* and compared the same way.
		*
		* @param {Node} [otherNode]
		* @returns {boolean}
		* @see https://dom.spec.whatwg.org/#concept-node-equals
		* @see ../docs/walk-dom.md.
		*/
		isEqualNode: function(otherNode) {
			if (!otherNode) return false;
			var stack = [{
				node: this,
				other: otherNode
			}];
			while (stack.length > 0) {
				var pair = stack.pop();
				var node = pair.node;
				var other = pair.other;
				if (node.nodeType !== other.nodeType) return false;
				switch (node.nodeType) {
					case node.DOCUMENT_TYPE_NODE:
						if (node.name !== other.name) return false;
						if (node.publicId !== other.publicId) return false;
						if (node.systemId !== other.systemId) return false;
						break;
					case node.ELEMENT_NODE:
						if (node.namespaceURI !== other.namespaceURI) return false;
						if (node.prefix !== other.prefix) return false;
						if (node.localName !== other.localName) return false;
						if (node.attributes.length !== other.attributes.length) return false;
						for (var i = 0; i < node.attributes.length; i++) {
							var attr = node.attributes.item(i);
							var otherAttr = other.getAttributeNodeNS(attr.namespaceURI, attr.localName);
							if (!otherAttr) return false;
							stack.push({
								node: attr,
								other: otherAttr
							});
						}
						break;
					case node.ATTRIBUTE_NODE:
						if (node.namespaceURI !== other.namespaceURI) return false;
						if (node.localName !== other.localName) return false;
						if (node.value !== other.value) return false;
						break;
					case node.PROCESSING_INSTRUCTION_NODE:
						if (node.target !== other.target || node.data !== other.data) return false;
						break;
					case node.TEXT_NODE:
					case node.CDATA_SECTION_NODE:
					case node.COMMENT_NODE: if (node.data !== other.data) return false;
				}
				if (node.childNodes.length !== other.childNodes.length) return false;
				for (var i = node.childNodes.length - 1; i >= 0; i--) stack.push({
					node: node.childNodes[i],
					other: other.childNodes[i]
				});
			}
			return true;
		},
		/**
		* Checks whether or not the given node is this node.
		*
		* @param {Node} [otherNode]
		*/
		isSameNode: function(otherNode) {
			return this === otherNode;
		},
		/**
		* Inserts a node before a reference node as a child of this node.
		*
		* @param {Node} newChild
		* The new child node to be inserted.
		* @param {Node | null} refChild
		* The reference node before which newChild will be inserted.
		* @returns {Node}
		* The new child node successfully inserted.
		* @throws {DOMException}
		* Throws a DOMException if inserting the node would result in a DOM tree that is not
		* well-formed, or if `child` is provided but is not a child of `parent`.
		* See {@link _insertBefore} for more details.
		* @since Modified in DOM L2
		*/
		insertBefore: function(newChild, refChild) {
			return _insertBefore(this, newChild, refChild);
		},
		/**
		* Replaces an old child node with a new child node within this node.
		*
		* @param {Node} newChild
		* The new node that is to replace the old node.
		* If it already exists in the DOM, it is removed from its original position.
		* @param {Node} oldChild
		* The existing child node to be replaced.
		* @returns {Node}
		* Returns the replaced child node.
		* @throws {DOMException}
		* Throws a DOMException if replacing the node would result in a DOM tree that is not
		* well-formed, or if `oldChild` is not a child of `this`.
		* This can also occur if the pre-replacement validity assertion fails.
		* See {@link _insertBefore}, {@link Node.removeChild}, and
		* {@link assertPreReplacementValidityInDocument} for more details.
		* @see https://dom.spec.whatwg.org/#concept-node-replace
		*/
		replaceChild: function(newChild, oldChild) {
			_insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
			if (oldChild) this.removeChild(oldChild);
		},
		/**
		* Removes an existing child node from this node.
		*
		* @param {Node} oldChild
		* The child node to be removed.
		* @returns {Node}
		* Returns the removed child node.
		* @throws {DOMException}
		* Throws a DOMException if `oldChild` is not a child of `this`.
		* See {@link _removeChild} for more details.
		*/
		removeChild: function(oldChild) {
			return _removeChild(this, oldChild);
		},
		/**
		* Appends a child node to this node.
		*
		* @param {Node} newChild
		* The child node to be appended to this node.
		* If it already exists in the DOM, it is removed from its original position.
		* @returns {Node}
		* Returns the appended child node.
		* @throws {DOMException}
		* Throws a DOMException if appending the node would result in a DOM tree that is not
		* well-formed, or if `newChild` is not a valid Node.
		* See {@link insertBefore} for more details.
		*/
		appendChild: function(newChild) {
			return this.insertBefore(newChild, null);
		},
		/**
		* Determines whether this node has any child nodes.
		*
		* @returns {boolean}
		* Returns true if this node has any child nodes, and false otherwise.
		*/
		hasChildNodes: function() {
			return this.firstChild != null;
		},
		/**
		* Creates a copy of the calling node.
		*
		* @param {boolean} deep
		* If true, the contents of the node are recursively copied.
		* If false, only the node itself (and its attributes, if it is an element) are copied.
		* @returns {Node}
		* Returns the newly created copy of the node.
		* @throws {DOMException}
		* May throw a DOMException if operations within {@link Element#setAttributeNode} or
		* {@link Node#appendChild} (which are potentially invoked in this method) do not meet their
		* specific constraints.
		* @see {@link cloneNode}
		*/
		cloneNode: function(deep) {
			return cloneNode(this.ownerDocument || this, this, deep);
		},
		/**
		* Puts the specified node and all of its subtree into a "normalized" form. In a normalized
		* subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
		*
		* Specifically, this method merges any adjacent text nodes (i.e., nodes for which `nodeType`
		* is `TEXT_NODE`) into a single node with the combined data. It also removes any empty text
		* nodes.
		*
		* This method iterativly traverses all child nodes to normalize all descendent nodes within
		* the subtree.
		*
		* @throws {DOMException}
		* May throw a DOMException if operations within removeChild or appendData (which are
		* potentially invoked in this method) do not meet their specific constraints.
		* @since Modified in DOM Level 2
		* @see {@link Node.removeChild}
		* @see {@link CharacterData.appendData}
		* @see ../docs/walk-dom.md.
		*/
		normalize: function() {
			walkDOM(this, null, { enter: function(node) {
				var child = node.firstChild;
				while (child) {
					var next = child.nextSibling;
					if (next !== null && next.nodeType === TEXT_NODE && child.nodeType === TEXT_NODE) {
						var tail = [];
						var sibling = next;
						while (sibling !== null && sibling.nodeType === TEXT_NODE) {
							tail.push(sibling.data);
							sibling = sibling.nextSibling;
						}
						var removed = child.nextSibling;
						while (removed !== sibling) {
							var following = removed.nextSibling;
							removed.parentNode = null;
							removed.previousSibling = null;
							removed.nextSibling = null;
							removed = following;
						}
						child.nextSibling = sibling;
						if (sibling !== null) sibling.previousSibling = child;
						else node.lastChild = child;
						child.appendData(tail.join(""));
						_onUpdateChild(node.ownerDocument, node);
						child = sibling;
					} else child = next;
				}
				return true;
			} });
		},
		/**
		* Checks whether the DOM implementation implements a specific feature and its version.
		*
		* @deprecated
		* Since `DOMImplementation.hasFeature` is deprecated and always returns true.
		* @param {string} feature
		* The package name of the feature to test. This is the same name that can be passed to the
		* method `hasFeature` on `DOMImplementation`.
		* @param {string} version
		* This is the version number of the package name to test.
		* @returns {boolean}
		* Returns true in all cases in the current implementation.
		* @since Introduced in DOM Level 2
		* @see {@link DOMImplementation.hasFeature}
		*/
		isSupported: function(feature, version) {
			return this.ownerDocument.implementation.hasFeature(feature, version);
		},
		/**
		* Look up the prefix associated to the given namespace URI, starting from this node.
		* **The default namespace declarations are ignored by this method.**
		* See Namespace Prefix Lookup for details on the algorithm used by this method.
		*
		* **This behavior is different from the in the specs**:
		* - no node type specific handling
		* - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
		*
		* @param {string | null} namespaceURI
		* The namespace URI for which to find the associated prefix.
		* @returns {string | null}
		* The associated prefix, if found; otherwise, null.
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
		* @see https://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
		* @see https://dom.spec.whatwg.org/#dom-node-lookupprefix
		* @see https://github.com/xmldom/xmldom/issues/322
		* @prettierignore
		*/
		lookupPrefix: function(namespaceURI) {
			var el = this;
			while (el) {
				var map = el._nsMap;
				if (map) {
					for (var n in map) if (hasOwn(map, n) && map[n] === namespaceURI) return n;
				}
				el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
			}
			return null;
		},
		/**
		* This function is used to look up the namespace URI associated with the given prefix,
		* starting from this node.
		*
		* **This behavior is different from the in the specs**:
		* - no node type specific handling
		* - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
		*
		* @param {string | null} prefix
		* The prefix for which to find the associated namespace URI.
		* @returns {string | null}
		* The associated namespace URI, if found; otherwise, null.
		* @since DOM Level 3
		* @see https://dom.spec.whatwg.org/#dom-node-lookupnamespaceuri
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespaceURI
		* @prettierignore
		*/
		lookupNamespaceURI: function(prefix) {
			var el = this;
			while (el) {
				var map = el._nsMap;
				if (map) {
					if (hasOwn(map, prefix)) return map[prefix];
				}
				el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
			}
			return null;
		},
		/**
		* Determines whether the given namespace URI is the default namespace.
		*
		* The function works by looking up the prefix associated with the given namespace URI. If no
		* prefix is found (i.e., the namespace URI is not registered in the namespace map of this
		* node or any of its ancestors), it returns `true`, implying the namespace URI is considered
		* the default.
		*
		* **This behavior is different from the in the specs**:
		* - no node type specific handling
		* - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
		*
		* @param {string | null} namespaceURI
		* The namespace URI to be checked.
		* @returns {boolean}
		* Returns true if the given namespace URI is the default namespace, false otherwise.
		* @since DOM Level 3
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-isDefaultNamespace
		* @see https://dom.spec.whatwg.org/#dom-node-isdefaultnamespace
		* @prettierignore
		*/
		isDefaultNamespace: function(namespaceURI) {
			return this.lookupPrefix(namespaceURI) == null;
		},
		/**
		* Compares the reference node with a node with regard to their position in the document and
		* according to the document order.
		*
		* @param {Node} other
		* The node to compare the reference node to.
		* @returns {number}
		* Returns how the node is positioned relatively to the reference node according to the
		* bitmask. 0 if reference node and given node are the same.
		* @since DOM Level 3
		* @see https://www.w3.org/TR/2004/REC-DOM-Level-3-Core-20040407/core.html#Node3-compare
		* @see https://dom.spec.whatwg.org/#dom-node-comparedocumentposition
		*/
		compareDocumentPosition: function(other) {
			if (this === other) return 0;
			var node1 = other;
			var node2 = this;
			var attr1 = null;
			var attr2 = null;
			if (node1 instanceof Attr) {
				attr1 = node1;
				node1 = attr1.ownerElement;
			}
			if (node2 instanceof Attr) {
				attr2 = node2;
				node2 = attr2.ownerElement;
				if (attr1 && node1 && node2 === node1) for (var i = 0, attr; attr = node2.attributes[i]; i++) {
					if (attr === attr1) return DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
					if (attr === attr2) return DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
				}
			}
			if (!node1 || !node2 || node2.ownerDocument !== node1.ownerDocument) return DocumentPosition.DOCUMENT_POSITION_DISCONNECTED + DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + (docGUID(node2.ownerDocument) > docGUID(node1.ownerDocument) ? DocumentPosition.DOCUMENT_POSITION_FOLLOWING : DocumentPosition.DOCUMENT_POSITION_PRECEDING);
			if (attr2 && node1 === node2) return DocumentPosition.DOCUMENT_POSITION_CONTAINS + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
			if (attr1 && node1 === node2) return DocumentPosition.DOCUMENT_POSITION_CONTAINED_BY + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
			var chain1 = [];
			var ancestor1 = node1.parentNode;
			while (ancestor1) {
				if (!attr2 && ancestor1 === node2) return DocumentPosition.DOCUMENT_POSITION_CONTAINED_BY + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
				chain1.push(ancestor1);
				ancestor1 = ancestor1.parentNode;
			}
			chain1.reverse();
			var chain2 = [];
			var ancestor2 = node2.parentNode;
			while (ancestor2) {
				if (!attr1 && ancestor2 === node1) return DocumentPosition.DOCUMENT_POSITION_CONTAINS + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
				chain2.push(ancestor2);
				ancestor2 = ancestor2.parentNode;
			}
			chain2.reverse();
			var ca = commonAncestor(chain1, chain2);
			for (var n in ca.childNodes) {
				var child = ca.childNodes[n];
				if (child === node2) return DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
				if (child === node1) return DocumentPosition.DOCUMENT_POSITION_PRECEDING;
				if (chain2.indexOf(child) >= 0) return DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
				if (chain1.indexOf(child) >= 0) return DocumentPosition.DOCUMENT_POSITION_PRECEDING;
			}
			return 0;
		}
	};
	/**
	* Encodes special XML characters to their corresponding entities.
	*
	* @param {string} c
	* The character to be encoded.
	* @returns {string}
	* The encoded character.
	* @private
	*/
	function _xmlEncoder(c) {
		return c == "<" && "&lt;" || c == ">" && "&gt;" || c == "&" && "&amp;" || c == "\"" && "&quot;" || "&#" + c.charCodeAt() + ";";
	}
	copy(NodeType, Node);
	copy(NodeType, Node.prototype);
	copy(DocumentPosition, Node);
	copy(DocumentPosition, Node.prototype);
	/**
	* Visits every node in the subtree rooted at `node` in depth-first pre-order.
	*
	* Delegates to {@link walkDOM} for traversal. The `callback` is called on each node;
	* if it returns a truthy value, traversal stops immediately.
	*
	* @param {Node} node
	* Root of the subtree to visit.
	* @param {function(Node): *} callback
	* Called for each node. A truthy return value stops traversal early.
	*/
	function _visitNode(node, callback) {
		walkDOM(node, null, { enter: function(n) {
			return callback(n) ? walkDOM.STOP : true;
		} });
	}
	/**
	* Depth-first pre/post-order DOM tree walker.
	*
	* Visits every node in the subtree rooted at `node`. For each node:
	*
	* 1. Calls `callbacks.enter(node, context)` before descending into the node's children. The
	* return value becomes the `context` passed to each child's `enter` call and to the matching
	* `exit` call.
	* 2. If `enter` returns `null` or `undefined`, the node's children are skipped;
	* sibling traversal continues normally.
	* 3. If `enter` returns `walkDOM.STOP`, the entire traversal is aborted immediately — no
	* further `enter` or `exit` calls are made.
	* 4. `lastChild` and `previousSibling` are read **after** `enter` returns, so `enter` may
	* safely modify the node's own child list before the walker descends. Modifying siblings of
	* the current node or any other part of the tree produces unpredictable results: nodes already
	* queued on the stack are visited regardless of DOM changes, and newly inserted nodes outside
	* the current child list are never visited.
	* 5. Calls `callbacks.exit(node, context)` (if provided) after all of a node's children have
	* been visited, passing the same `context` that `enter`
	* returned for that node.
	*
	* This implementation uses an explicit stack and does not recurse — it is safe on arbitrarily
	* deep trees.
	*
	* @param {Node} node
	* Root of the subtree to walk.
	* @param {*} context
	* Initial context value passed to the root node's `enter`.
	* @param {{ enter: function(Node, *): *, exit?: function(Node, *): void }} callbacks
	* @returns {void | walkDOM.STOP}
	* @see ../docs/walk-dom.md.
	*/
	function walkDOM(node, context, callbacks) {
		var stack = [{
			node,
			context,
			phase: walkDOM.ENTER
		}];
		while (stack.length > 0) {
			var frame = stack.pop();
			if (frame.phase === walkDOM.ENTER) {
				var childContext = callbacks.enter(frame.node, frame.context);
				if (childContext === walkDOM.STOP) return walkDOM.STOP;
				stack.push({
					node: frame.node,
					context: childContext,
					phase: walkDOM.EXIT
				});
				if (childContext === null || childContext === void 0) continue;
				var child = frame.node.lastChild;
				while (child) {
					stack.push({
						node: child,
						context: childContext,
						phase: walkDOM.ENTER
					});
					child = child.previousSibling;
				}
			} else if (callbacks.exit) callbacks.exit(frame.node, frame.context);
		}
	}
	/**
	* Sentinel value returned from a `walkDOM` `enter` callback to abort the entire traversal
	* immediately.
	*
	* @type {symbol}
	*/
	walkDOM.STOP = Symbol("walkDOM.STOP");
	/**
	* Phase constant for a stack frame that has not yet been visited.
	* The `enter` callback is called and children are scheduled.
	*
	* @type {number}
	*/
	walkDOM.ENTER = 0;
	/**
	* Phase constant for a stack frame whose subtree has been fully visited.
	* The `exit` callback is called.
	*
	* @type {number}
	*/
	walkDOM.EXIT = 1;
	/**
	* @typedef DocumentOptions
	* @property {string} [contentType=MIME_TYPE.XML_APPLICATION]
	*/
	/**
	* The Document interface describes the common properties and methods for any kind of document.
	*
	* It should usually be created using `new DOMImplementation().createDocument(...)`
	* or `new DOMImplementation().createHTMLDocument(...)`.
	*
	* The constructor is considered a private API and offers to initially set the `contentType`
	* property via it's options parameter.
	*
	* @class
	* @param {Symbol} symbol
	* @param {DocumentOptions} [options]
	* @augments Node
	* @private
	* @see https://developer.mozilla.org/en-US/docs/Web/API/Document
	* @see https://dom.spec.whatwg.org/#interface-document
	*/
	function Document(symbol, options) {
		checkSymbol(symbol);
		var opt = options || {};
		this.ownerDocument = this;
		/**
		* The mime type of the document is determined at creation time and can not be modified.
		*
		* @type {string}
		* @see https://dom.spec.whatwg.org/#concept-document-content-type
		* @see {@link DOMImplementation}
		* @see {@link MIME_TYPE}
		* @readonly
		*/
		this.contentType = opt.contentType || MIME_TYPE.XML_APPLICATION;
		/**
		* @type {'html' | 'xml'}
		* @see https://dom.spec.whatwg.org/#concept-document-type
		* @see {@link DOMImplementation}
		* @readonly
		*/
		this.type = isHTMLMimeType(this.contentType) ? "html" : "xml";
	}
	/**
	* Updates the namespace mapping of an element when a new attribute is added.
	*
	* @param {Document} doc
	* The document that the element belongs to.
	* @param {Element} el
	* The element to which the attribute is being added.
	* @param {Attr} newAttr
	* The new attribute being added.
	* @private
	*/
	function _onAddAttribute(doc, el, newAttr) {
		doc && doc._inc++;
		if (newAttr.namespaceURI === NAMESPACE.XMLNS) el._nsMap[newAttr.prefix ? newAttr.localName : ""] = newAttr.value;
	}
	/**
	* Updates the namespace mapping of an element when an attribute is removed.
	*
	* @param {Document} doc
	* The document that the element belongs to.
	* @param {Element} el
	* The element from which the attribute is being removed.
	* @param {Attr} newAttr
	* The attribute being removed.
	* @param {boolean} remove
	* Indicates whether the attribute is to be removed.
	* @private
	*/
	function _onRemoveAttribute(doc, el, newAttr, remove) {
		doc && doc._inc++;
		if (newAttr.namespaceURI === NAMESPACE.XMLNS) delete el._nsMap[newAttr.prefix ? newAttr.localName : ""];
	}
	/**
	* Updates `parent.childNodes`, adjusting the indexed items and its `length`.
	* If `newChild` is provided and has no nextSibling, it will be appended.
	* Otherwise, it's assumed that an item has been removed or inserted,
	* and `parent.firstNode` and its `.nextSibling` to re-indexing all child nodes of `parent`.
	*
	* @param {Document} doc
	* The parent document of `el`.
	* @param {Node} parent
	* The parent node whose childNodes list needs to be updated.
	* @param {Node} [newChild]
	* The new child node to be appended. If not provided, the function assumes a node has been
	* removed.
	* @private
	*/
	function _onUpdateChild(doc, parent, newChild) {
		if (doc && doc._inc) {
			doc._inc++;
			var childNodes = parent.childNodes;
			if (newChild && !newChild.nextSibling) childNodes[childNodes.length++] = newChild;
			else {
				var child = parent.firstChild;
				var i = 0;
				while (child) {
					childNodes[i++] = child;
					child = child.nextSibling;
				}
				childNodes.length = i;
				delete childNodes[childNodes.length];
			}
		}
	}
	/**
	* Removes the connections between `parentNode` and `child`
	* and any existing `child.previousSibling` or `child.nextSibling`.
	*
	* @param {Node} parentNode
	* The parent node from which the child node is to be removed.
	* @param {Node} child
	* The child node to be removed from the parentNode.
	* @returns {Node}
	* Returns the child node that was removed.
	* @throws {DOMException}
	* With code:
	* - {@link DOMException.NOT_FOUND_ERR} If the parentNode is not the parent of the child node.
	* @private
	* @see https://github.com/xmldom/xmldom/issues/135
	* @see https://github.com/xmldom/xmldom/issues/145
	*/
	function _removeChild(parentNode, child) {
		if (parentNode !== child.parentNode) throw new DOMException(DOMException.NOT_FOUND_ERR, "child's parent is not parent");
		var oldPreviousSibling = child.previousSibling;
		var oldNextSibling = child.nextSibling;
		if (oldPreviousSibling) oldPreviousSibling.nextSibling = oldNextSibling;
		else parentNode.firstChild = oldNextSibling;
		if (oldNextSibling) oldNextSibling.previousSibling = oldPreviousSibling;
		else parentNode.lastChild = oldPreviousSibling;
		_onUpdateChild(parentNode.ownerDocument, parentNode);
		child.parentNode = null;
		child.previousSibling = null;
		child.nextSibling = null;
		return child;
	}
	/**
	* Returns `true` if `node` can be a parent for insertion.
	*
	* @param {Node} node
	* @returns {boolean}
	*/
	function hasValidParentNodeType(node) {
		return node && (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE);
	}
	/**
	* Returns `true` if `node` can be inserted according to it's `nodeType`.
	*
	* @param {Node} node
	* @returns {boolean}
	*/
	function hasInsertableNodeType(node) {
		return node && (node.nodeType === Node.CDATA_SECTION_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.DOCUMENT_TYPE_NODE || node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE || node.nodeType === Node.TEXT_NODE);
	}
	/**
	* Returns true if `node` is a DOCTYPE node.
	*
	* @param {Node} node
	* @returns {boolean}
	*/
	function isDocTypeNode(node) {
		return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
	}
	/**
	* Returns true if the node is an element.
	*
	* @param {Node} node
	* @returns {boolean}
	*/
	function isElementNode(node) {
		return node && node.nodeType === Node.ELEMENT_NODE;
	}
	/**
	* Returns true if `node` is a text node.
	*
	* @param {Node} node
	* @returns {boolean}
	*/
	function isTextNode(node) {
		return node && node.nodeType === Node.TEXT_NODE;
	}
	/**
	* Check if en element node can be inserted before `child`, or at the end if child is falsy,
	* according to the presence and position of a doctype node on the same level.
	*
	* @param {Document} doc
	* The document node.
	* @param {Node} child
	* The node that would become the nextSibling if the element would be inserted.
	* @returns {boolean}
	* `true` if an element can be inserted before child.
	* @private
	*/
	function isElementInsertionPossible(doc, child) {
		var parentChildNodes = doc.childNodes || [];
		if (find(parentChildNodes, isElementNode) || isDocTypeNode(child)) return false;
		var docTypeNode = find(parentChildNodes, isDocTypeNode);
		return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
	}
	/**
	* Check if en element node can be inserted before `child`, or at the end if child is falsy,
	* according to the presence and position of a doctype node on the same level.
	*
	* @param {Node} doc
	* The document node.
	* @param {Node} child
	* The node that would become the nextSibling if the element would be inserted.
	* @returns {boolean}
	* `true` if an element can be inserted before child.
	* @private
	*/
	function isElementReplacementPossible(doc, child) {
		var parentChildNodes = doc.childNodes || [];
		function hasElementChildThatIsNotChild(node) {
			return isElementNode(node) && node !== child;
		}
		if (find(parentChildNodes, hasElementChildThatIsNotChild)) return false;
		var docTypeNode = find(parentChildNodes, isDocTypeNode);
		return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
	}
	/**
	* Asserts pre-insertion validity of a node into a parent before a child.
	* Throws errors for invalid node combinations that would result in an ill-formed DOM.
	*
	* @param {Node} parent
	* The parent node to insert `node` into.
	* @param {Node} node
	* The node to insert.
	* @param {Node | null} child
	* The node that should become the `nextSibling` of `node`. If null, no sibling is considered.
	* @throws {DOMException}
	* With code:
	* - {@link DOMException.HIERARCHY_REQUEST_ERR} If `parent` is not a Document,
	* DocumentFragment, or Element node.
	* - {@link DOMException.HIERARCHY_REQUEST_ERR} If `node` is a host-including inclusive
	* ancestor of `parent`. (Currently not implemented)
	* - {@link DOMException.NOT_FOUND_ERR} If `child` is non-null and its `parent` is not
	* `parent`.
	* - {@link DOMException.HIERARCHY_REQUEST_ERR} If `node` is not a DocumentFragment,
	* DocumentType, Element, or CharacterData node.
	* - {@link DOMException.HIERARCHY_REQUEST_ERR} If either `node` is a Text node and `parent` is
	* a document, or if `node` is a doctype and `parent` is not a document.
	* @private
	* @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	* @see https://dom.spec.whatwg.org/#concept-node-replace
	*/
	function assertPreInsertionValidity1to5(parent, node, child) {
		if (!hasValidParentNodeType(parent)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + parent.nodeType);
		if (child && child.parentNode !== parent) throw new DOMException(DOMException.NOT_FOUND_ERR, "child not in parent");
		if (!hasInsertableNodeType(node) || isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Unexpected node type " + node.nodeType + " for parent node type " + parent.nodeType);
	}
	/**
	* Asserts pre-insertion validity of a node into a document before a child.
	* Throws errors for invalid node combinations that would result in an ill-formed DOM.
	*
	* @param {Document} parent
	* The parent node to insert `node` into.
	* @param {Node} node
	* The node to insert.
	* @param {Node | undefined} child
	* The node that should become the `nextSibling` of `node`. If undefined, no sibling is
	* considered.
	* @returns {Node}
	* @throws {DOMException}
	* With code:
	* - {@link DOMException.HIERARCHY_REQUEST_ERR} If `node` is a DocumentFragment with more than
	* one element child or has a Text node child.
	* - {@link DOMException.HIERARCHY_REQUEST_ERR} If `node` is a DocumentFragment with one
	* element child and either `parent` has an element child, `child` is a doctype, or `child` is
	* non-null and a doctype is following `child`.
	* - {@link DOMException.HIERARCHY_REQUEST_ERR} If `node` is an Element and `parent` has an
	* element child, `child` is a doctype, or `child` is non-null and a doctype is following
	* `child`.
	* - {@link DOMException.HIERARCHY_REQUEST_ERR} If `node` is a DocumentType and `parent` has a
	* doctype child, `child` is non-null and an element is preceding `child`, or `child` is null
	* and `parent` has an element child.
	* @private
	* @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	* @see https://dom.spec.whatwg.org/#concept-node-replace
	*/
	function assertPreInsertionValidityInDocument(parent, node, child) {
		var parentChildNodes = parent.childNodes || [];
		var nodeChildNodes = node.childNodes || [];
		if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
			var nodeChildElements = nodeChildNodes.filter(isElementNode);
			if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
			if (nodeChildElements.length === 1 && !isElementInsertionPossible(parent, child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
		}
		if (isElementNode(node)) {
			if (!isElementInsertionPossible(parent, child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
		}
		if (isDocTypeNode(node)) {
			if (find(parentChildNodes, isDocTypeNode)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
			var parentElementChild = find(parentChildNodes, isElementNode);
			if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
			if (!child && parentElementChild) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
		}
	}
	/**
	* @param {Document} parent
	* The parent node to insert `node` into.
	* @param {Node} node
	* The node to insert.
	* @param {Node | undefined} child
	* the node that should become the `nextSibling` of `node`
	* @returns {Node}
	* @throws {DOMException}
	* For several node combinations that would create a DOM that is not well-formed.
	* @throws {DOMException}
	* If `child` is provided but is not a child of `parent`.
	* @private
	* @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	* @see https://dom.spec.whatwg.org/#concept-node-replace
	*/
	function assertPreReplacementValidityInDocument(parent, node, child) {
		var parentChildNodes = parent.childNodes || [];
		var nodeChildNodes = node.childNodes || [];
		if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
			var nodeChildElements = nodeChildNodes.filter(isElementNode);
			if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
			if (nodeChildElements.length === 1 && !isElementReplacementPossible(parent, child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
		}
		if (isElementNode(node)) {
			if (!isElementReplacementPossible(parent, child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
		}
		if (isDocTypeNode(node)) {
			function hasDoctypeChildThatIsNotChild(node) {
				return isDocTypeNode(node) && node !== child;
			}
			if (find(parentChildNodes, hasDoctypeChildThatIsNotChild)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
			var parentElementChild = find(parentChildNodes, isElementNode);
			if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
		}
	}
	/**
	* Inserts a node into a parent node before a child node.
	*
	* @param {Node} parent
	* The parent node to insert the node into.
	* @param {Node} node
	* The node to insert into the parent.
	* @param {Node | null} child
	* The node that should become the next sibling of the node.
	* If null, the function inserts the node at the end of the children of the parent node.
	* @param {Function} [_inDocumentAssertion]
	* An optional function to check pre-insertion validity if parent is a document node.
	* Defaults to {@link assertPreInsertionValidityInDocument}
	* @returns {Node}
	* Returns the inserted node.
	* @throws {DOMException}
	* Throws a DOMException if inserting the node would result in a DOM tree that is not
	* well-formed. See {@link assertPreInsertionValidity1to5},
	* {@link assertPreInsertionValidityInDocument}.
	* @throws {DOMException}
	* Throws a DOMException if child is provided but is not a child of the parent. See
	* {@link Node.removeChild}
	* @private
	* @see https://dom.spec.whatwg.org/#concept-node-ensure-pre-insertion-validity
	*/
	function _insertBefore(parent, node, child, _inDocumentAssertion) {
		assertPreInsertionValidity1to5(parent, node, child);
		if (parent.nodeType === Node.DOCUMENT_NODE) (_inDocumentAssertion || assertPreInsertionValidityInDocument)(parent, node, child);
		var cp = node.parentNode;
		if (cp) cp.removeChild(node);
		if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
			var newFirst = node.firstChild;
			if (newFirst == null) return node;
			var newLast = node.lastChild;
		} else newFirst = newLast = node;
		var pre = child ? child.previousSibling : parent.lastChild;
		newFirst.previousSibling = pre;
		newLast.nextSibling = child;
		if (pre) pre.nextSibling = newFirst;
		else parent.firstChild = newFirst;
		if (child == null) parent.lastChild = newLast;
		else child.previousSibling = newLast;
		do
			newFirst.parentNode = parent;
		while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
		_onUpdateChild(parent.ownerDocument || parent, parent, node);
		if (node.nodeType == DOCUMENT_FRAGMENT_NODE) node.firstChild = node.lastChild = null;
		return node;
	}
	Document.prototype = {
		/**
		* The implementation that created this document.
		*
		* @type DOMImplementation
		* @readonly
		*/
		implementation: null,
		nodeName: "#document",
		nodeType: DOCUMENT_NODE,
		/**
		* The DocumentType node of the document.
		*
		* @type DocumentType
		* @readonly
		*/
		doctype: null,
		documentElement: null,
		_inc: 1,
		insertBefore: function(newChild, refChild) {
			if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
				var child = newChild.firstChild;
				while (child) {
					var next = child.nextSibling;
					this.insertBefore(child, refChild);
					child = next;
				}
				return newChild;
			}
			_insertBefore(this, newChild, refChild);
			newChild.ownerDocument = this;
			if (this.documentElement === null && newChild.nodeType === ELEMENT_NODE) this.documentElement = newChild;
			return newChild;
		},
		removeChild: function(oldChild) {
			var removed = _removeChild(this, oldChild);
			if (removed === this.documentElement) this.documentElement = null;
			return removed;
		},
		replaceChild: function(newChild, oldChild) {
			_insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
			newChild.ownerDocument = this;
			if (oldChild) this.removeChild(oldChild);
			if (isElementNode(newChild)) this.documentElement = newChild;
		},
		/**
		* Imports a node from another document into this document, creating a new copy owned by this
		* document. The source node and its subtree are not modified.
		*
		* @param {Node} importedNode
		* The node to import.
		* @param {boolean} deep
		* If true, the contents of the node are recursively imported.
		* If false, only the node itself (and its attributes, if it is an element) are imported.
		* @returns {Node}
		* Returns the newly created import of the node.
		* @see {@link importNode}
		* @see {@link https://dom.spec.whatwg.org/#dom-document-importnode}
		*/
		importNode: function(importedNode, deep) {
			return importNode(this, importedNode, deep);
		},
		getElementById: function(id) {
			var rtv = null;
			_visitNode(this.documentElement, function(node) {
				if (node.nodeType == ELEMENT_NODE) {
					if (node.getAttribute("id") == id) {
						rtv = node;
						return true;
					}
				}
			});
			return rtv;
		},
		/**
		* Creates a new `Element` that is owned by this `Document`.
		* In HTML Documents `localName` is the lower cased `tagName`,
		* otherwise no transformation is being applied.
		* When `contentType` implies the HTML namespace, it will be set as `namespaceURI`.
		*
		* __This implementation differs from the specification:__ - The provided name is not checked
		* against the `Name` production,
		* so no related error will be thrown.
		* - There is no interface `HTMLElement`, it is always an `Element`.
		* - There is no support for a second argument to indicate using custom elements.
		*
		* @param {string} tagName
		* @returns {Element}
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
		* @see https://dom.spec.whatwg.org/#dom-document-createelement
		* @see https://dom.spec.whatwg.org/#concept-create-element
		*/
		createElement: function(tagName) {
			var node = new Element(PDC);
			node.ownerDocument = this;
			if (this.type === "html") tagName = tagName.toLowerCase();
			if (hasDefaultHTMLNamespace(this.contentType)) node.namespaceURI = NAMESPACE.HTML;
			node.nodeName = tagName;
			node.tagName = tagName;
			node.localName = tagName;
			node.childNodes = new NodeList();
			var attrs = node.attributes = new NamedNodeMap();
			attrs._ownerElement = node;
			return node;
		},
		/**
		* @returns {DocumentFragment}
		*/
		createDocumentFragment: function() {
			var node = new DocumentFragment(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			return node;
		},
		/**
		* @param {string} data
		* @returns {Text}
		*/
		createTextNode: function(data) {
			var node = new Text(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.appendData(data);
			return node;
		},
		/**
		* @param {string} data
		* @returns {Comment}
		* @see https://dom.spec.whatwg.org/#dom-document-createcomment
		* @see https://www.w3.org/TR/xml/#NT-Comment XML 1.0 production [15]
		* @see https://www.w3.org/TR/DOM-Parsing/#dfn-concept-serialize-xml §3.2.1.3
		*
		*      Note: no validation is performed at creation time. When the resulting document is
		*      serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
		*      if the comment data contains `--` anywhere, ends with `-`, or contains characters
		*      outside the XML Char production (W3C DOM Parsing §3.2.1.3). Without that option the
		*      data is emitted verbatim.
		*/
		createComment: function(data) {
			var node = new Comment(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.appendData(data);
			return node;
		},
		/**
		* Returns a new CDATASection node whose data is `data`.
		*
		* __This implementation differs from the specification:__ - calling this method on an HTML
		* document does not throw `NotSupportedError`.
		*
		* @param {string} data
		* @returns {CDATASection}
		* @throws {DOMException}
		* With code `INVALID_CHARACTER_ERR` if `data` contains `"]]>"`.
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createCDATASection
		* @see https://dom.spec.whatwg.org/#dom-document-createcdatasection
		*/
		createCDATASection: function(data) {
			if (data.indexOf("]]>") !== -1) throw new DOMException(DOMException.INVALID_CHARACTER_ERR, "data contains \"]]>\"");
			var node = new CDATASection(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.appendData(data);
			return node;
		},
		/**
		* Returns a ProcessingInstruction node whose target is target and data is data.
		*
		* __This behavior is slightly different from the in the specs__:
		* - it does not do any input validation on the arguments and doesn't throw
		* "InvalidCharacterError".
		*
		* Note: When the resulting document is serialized with `requireWellFormed: true`, the
		* serializer throws `InvalidStateError` if `.target` is not a valid XML `NCName` (a `Name`
		* with no colon) or is an ASCII case-insensitive match for `"xml"`, or if `.data` contains
		* `?>` or characters outside the XML Char production (W3C DOM Parsing §3.2.1.7). Without that
		* option the target and data are emitted verbatim.
		*
		* @param {string} target
		* @param {string} data
		* @returns {ProcessingInstruction}
		* @see https://developer.mozilla.org/docs/Web/API/Document/createProcessingInstruction
		* @see https://dom.spec.whatwg.org/#dom-document-createprocessinginstruction
		* @see https://www.w3.org/TR/DOM-Parsing/#dfn-concept-serialize-xml §3.2.1.7
		*/
		createProcessingInstruction: function(target, data) {
			var node = new ProcessingInstruction(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.nodeName = node.target = target;
			node.nodeValue = node.data = data;
			return node;
		},
		/**
		* Creates an `Attr` node that is owned by this document.
		* In HTML Documents `localName` is the lower cased `name`,
		* otherwise no transformation is being applied.
		*
		* __This implementation differs from the specification:__ - The provided name is not checked
		* against the `Name` production,
		* so no related error will be thrown.
		*
		* @param {string} name
		* @returns {Attr}
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createAttribute
		* @see https://dom.spec.whatwg.org/#dom-document-createattribute
		*/
		createAttribute: function(name) {
			if (!g.QName_exact.test(name)) throw new DOMException(DOMException.INVALID_CHARACTER_ERR, "invalid character in name \"" + name + "\"");
			if (this.type === "html") name = name.toLowerCase();
			return this._createAttribute(name);
		},
		_createAttribute: function(name) {
			var node = new Attr(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.name = name;
			node.nodeName = name;
			node.localName = name;
			node.specified = true;
			return node;
		},
		/**
		* Creates an EntityReference object.
		* The current implementation does not fill the `childNodes` with those of the corresponding
		* `Entity`
		*
		* The `name` is validated against the XML `Name` production at creation time; an invalid name
		* throws `InvalidCharacterError`. When the resulting node is serialized with
		* `requireWellFormed: true`, the serializer re-validates `nodeName` against the XML `Name`
		* production and throws `InvalidStateError` if a later `nodeName` mutation made it invalid;
		* without that option the name is emitted verbatim.
		*
		* __This implementation differs from the specification:__ xmldom does not expand entities —
		* the parser resolves entity references inline and never constructs `EntityReference` nodes,
		* so this method is the only producer.
		*
		* @deprecated
		* In DOM Level 4.
		* @param {string} name
		* The name of the entity to reference. No namespace well-formedness checks are performed.
		* @returns {EntityReference}
		* @throws {DOMException}
		* With code `INVALID_CHARACTER_ERR` when `name` is not a valid XML `Name`.
		* @throws {DOMException}
		* with code `NOT_SUPPORTED_ERR` when the document is of type `html`
		* @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-392B75AE
		*/
		createEntityReference: function(name) {
			if (!g.Name_exact.test(name)) throw new DOMException(DOMException.INVALID_CHARACTER_ERR, "not a valid xml name \"" + name + "\"");
			if (this.type === "html") throw new DOMException("document is an html document", DOMExceptionName.NotSupportedError);
			var node = new EntityReference(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.nodeName = name;
			return node;
		},
		/**
		* @param {string} namespaceURI
		* @param {string} qualifiedName
		* @returns {Element}
		*/
		createElementNS: function(namespaceURI, qualifiedName) {
			var validated = validateAndExtract(namespaceURI, qualifiedName);
			var node = new Element(PDC);
			var attrs = node.attributes = new NamedNodeMap();
			node.childNodes = new NodeList();
			node.ownerDocument = this;
			node.nodeName = qualifiedName;
			node.tagName = qualifiedName;
			node.namespaceURI = validated[0];
			node.prefix = validated[1];
			node.localName = validated[2];
			attrs._ownerElement = node;
			return node;
		},
		/**
		* @param {string} namespaceURI
		* @param {string} qualifiedName
		* @returns {Attr}
		*/
		createAttributeNS: function(namespaceURI, qualifiedName) {
			var validated = validateAndExtract(namespaceURI, qualifiedName);
			var node = new Attr(PDC);
			node.ownerDocument = this;
			node.childNodes = new NodeList();
			node.nodeName = qualifiedName;
			node.name = qualifiedName;
			node.specified = true;
			node.namespaceURI = validated[0];
			node.prefix = validated[1];
			node.localName = validated[2];
			return node;
		}
	};
	_extends(Document, Node);
	function Element(symbol) {
		checkSymbol(symbol);
		this._nsMap = Object.create(null);
	}
	Element.prototype = {
		nodeType: ELEMENT_NODE,
		/**
		* The attributes of this element.
		*
		* @type {NamedNodeMap | null}
		*/
		attributes: null,
		getQualifiedName: function() {
			return this.prefix ? this.prefix + ":" + this.localName : this.localName;
		},
		_isInHTMLDocumentAndNamespace: function() {
			return this.ownerDocument.type === "html" && this.namespaceURI === NAMESPACE.HTML;
		},
		/**
		* Implementaton of Level2 Core function hasAttributes.
		*
		* @returns {boolean}
		* True if attribute list is not empty.
		* @see https://www.w3.org/TR/DOM-Level-2-Core/#core-ID-NodeHasAttrs
		*/
		hasAttributes: function() {
			return !!(this.attributes && this.attributes.length);
		},
		hasAttribute: function(name) {
			return !!this.getAttributeNode(name);
		},
		/**
		* Returns element’s first attribute whose qualified name is `name`, and `null`
		* if there is no such attribute.
		*
		* @param {string} name
		* @returns {string | null}
		*/
		getAttribute: function(name) {
			var attr = this.getAttributeNode(name);
			return attr ? attr.value : null;
		},
		getAttributeNode: function(name) {
			if (this._isInHTMLDocumentAndNamespace()) name = name.toLowerCase();
			return this.attributes.getNamedItem(name);
		},
		/**
		* Sets the value of element’s first attribute whose qualified name is qualifiedName to value.
		*
		* @param {string} name
		* @param {string} value
		*/
		setAttribute: function(name, value) {
			if (this._isInHTMLDocumentAndNamespace()) name = name.toLowerCase();
			var attr = this.getAttributeNode(name);
			if (attr) attr.value = attr.nodeValue = "" + value;
			else {
				attr = this.ownerDocument._createAttribute(name);
				attr.value = attr.nodeValue = "" + value;
				this.setAttributeNode(attr);
			}
		},
		removeAttribute: function(name) {
			var attr = this.getAttributeNode(name);
			attr && this.removeAttributeNode(attr);
		},
		setAttributeNode: function(newAttr) {
			return this.attributes.setNamedItem(newAttr);
		},
		setAttributeNodeNS: function(newAttr) {
			return this.attributes.setNamedItemNS(newAttr);
		},
		removeAttributeNode: function(oldAttr) {
			return this.attributes.removeNamedItem(oldAttr.nodeName);
		},
		removeAttributeNS: function(namespaceURI, localName) {
			var old = this.getAttributeNodeNS(namespaceURI, localName);
			old && this.removeAttributeNode(old);
		},
		hasAttributeNS: function(namespaceURI, localName) {
			return this.getAttributeNodeNS(namespaceURI, localName) != null;
		},
		/**
		* Returns element’s attribute whose namespace is `namespaceURI` and local name is
		* `localName`,
		* or `null` if there is no such attribute.
		*
		* @param {string} namespaceURI
		* @param {string} localName
		* @returns {string | null}
		*/
		getAttributeNS: function(namespaceURI, localName) {
			var attr = this.getAttributeNodeNS(namespaceURI, localName);
			return attr ? attr.value : null;
		},
		/**
		* Sets the value of element’s attribute whose namespace is `namespaceURI` and local name is
		* `localName` to value.
		*
		* @param {string} namespaceURI
		* @param {string} qualifiedName
		* @param {string} value
		* @see https://dom.spec.whatwg.org/#dom-element-setattributens
		*/
		setAttributeNS: function(namespaceURI, qualifiedName, value) {
			var localName = validateAndExtract(namespaceURI, qualifiedName)[2];
			var attr = this.getAttributeNodeNS(namespaceURI, localName);
			if (attr) attr.value = attr.nodeValue = "" + value;
			else {
				attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
				attr.value = attr.nodeValue = "" + value;
				this.setAttributeNode(attr);
			}
		},
		getAttributeNodeNS: function(namespaceURI, localName) {
			return this.attributes.getNamedItemNS(namespaceURI, localName);
		},
		/**
		* Returns a LiveNodeList of all child elements which have **all** of the given class name(s).
		*
		* Returns an empty list if `classNames` is an empty string or only contains HTML white space
		* characters.
		*
		* Warning: This returns a live LiveNodeList.
		* Changes in the DOM will reflect in the array as the changes occur.
		* If an element selected by this array no longer qualifies for the selector,
		* it will automatically be removed. Be aware of this for iteration purposes.
		*
		* @param {string} classNames
		* Is a string representing the class name(s) to match; multiple class names are separated by
		* (ASCII-)whitespace.
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByClassName
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
		* @see https://dom.spec.whatwg.org/#concept-getelementsbyclassname
		*/
		getElementsByClassName: function(classNames) {
			var classNamesSet = toOrderedSet(classNames);
			return new LiveNodeList(this, function(base) {
				var ls = [];
				if (classNamesSet.length > 0) _visitNode(base, function(node) {
					if (node !== base && node.nodeType === ELEMENT_NODE) {
						var nodeClassNames = node.getAttribute("class");
						if (nodeClassNames) {
							var matches = classNames === nodeClassNames;
							if (!matches) {
								var nodeClassNamesSet = toOrderedSet(nodeClassNames);
								matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
							}
							if (matches) ls.push(node);
						}
					}
				});
				return ls;
			});
		},
		/**
		* Returns a LiveNodeList of elements with the given qualifiedName.
		* Searching for all descendants can be done by passing `*` as `qualifiedName`.
		*
		* All descendants of the specified element are searched, but not the element itself.
		* The returned list is live, which means it updates itself with the DOM tree automatically.
		* Therefore, there is no need to call `Element.getElementsByTagName()`
		* with the same element and arguments repeatedly if the DOM changes in between calls.
		*
		* When called on an HTML element in an HTML document,
		* `getElementsByTagName` lower-cases the argument before searching for it.
		* This is undesirable when trying to match camel-cased SVG elements (such as
		* `<linearGradient>`) in an HTML document.
		* Instead, use `Element.getElementsByTagNameNS()`,
		* which preserves the capitalization of the tag name.
		*
		* `Element.getElementsByTagName` is similar to `Document.getElementsByTagName()`,
		* except that it only searches for elements that are descendants of the specified element.
		*
		* @param {string} qualifiedName
		* @returns {LiveNodeList}
		* @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagName
		* @see https://dom.spec.whatwg.org/#concept-getelementsbytagname
		*/
		getElementsByTagName: function(qualifiedName) {
			var isHTMLDocument = (this.nodeType === DOCUMENT_NODE ? this : this.ownerDocument).type === "html";
			var lowerQualifiedName = qualifiedName.toLowerCase();
			return new LiveNodeList(this, function(base) {
				var ls = [];
				_visitNode(base, function(node) {
					if (node === base || node.nodeType !== ELEMENT_NODE) return;
					if (qualifiedName === "*") ls.push(node);
					else if (node.getQualifiedName() === (isHTMLDocument && node.namespaceURI === NAMESPACE.HTML ? lowerQualifiedName : qualifiedName)) ls.push(node);
				});
				return ls;
			});
		},
		getElementsByTagNameNS: function(namespaceURI, localName) {
			return new LiveNodeList(this, function(base) {
				var ls = [];
				_visitNode(base, function(node) {
					if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === "*" || node.namespaceURI === namespaceURI) && (localName === "*" || node.localName == localName)) ls.push(node);
				});
				return ls;
			});
		}
	};
	Document.prototype.getElementsByClassName = Element.prototype.getElementsByClassName;
	Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
	Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
	_extends(Element, Node);
	function Attr(symbol) {
		checkSymbol(symbol);
		this.namespaceURI = null;
		this.prefix = null;
		this.ownerElement = null;
	}
	Attr.prototype.nodeType = ATTRIBUTE_NODE;
	_extends(Attr, Node);
	function CharacterData(symbol) {
		checkSymbol(symbol);
	}
	CharacterData.prototype = {
		data: "",
		substringData: function(offset, count) {
			return this.data.substring(offset, offset + count);
		},
		appendData: function(text) {
			text = this.data + text;
			this.nodeValue = this.data = text;
			this.length = text.length;
		},
		insertData: function(offset, text) {
			this.replaceData(offset, 0, text);
		},
		deleteData: function(offset, count) {
			this.replaceData(offset, count, "");
		},
		replaceData: function(offset, count, text) {
			var start = this.data.substring(0, offset);
			var end = this.data.substring(offset + count);
			text = start + text + end;
			this.nodeValue = this.data = text;
			this.length = text.length;
		}
	};
	_extends(CharacterData, Node);
	function Text(symbol) {
		checkSymbol(symbol);
	}
	Text.prototype = {
		nodeName: "#text",
		nodeType: TEXT_NODE,
		splitText: function(offset) {
			var text = this.data;
			var newText = text.substring(offset);
			text = text.substring(0, offset);
			this.data = this.nodeValue = text;
			this.length = text.length;
			var newNode = this.ownerDocument.createTextNode(newText);
			if (this.parentNode) this.parentNode.insertBefore(newNode, this.nextSibling);
			return newNode;
		}
	};
	_extends(Text, CharacterData);
	function Comment(symbol) {
		checkSymbol(symbol);
	}
	Comment.prototype = {
		nodeName: "#comment",
		nodeType: COMMENT_NODE
	};
	_extends(Comment, CharacterData);
	function CDATASection(symbol) {
		checkSymbol(symbol);
	}
	CDATASection.prototype = {
		nodeName: "#cdata-section",
		nodeType: CDATA_SECTION_NODE
	};
	_extends(CDATASection, Text);
	/**
	* @class DocumentType
	* @augments Node
	* @property {string} name
	* The doctype name, stored verbatim. Declared `readonly` by the WHATWG DOM spec; xmldom does
	* not enforce this constraint — direct property writes succeed and the written value is
	* serialized verbatim. When serialized with `requireWellFormed: true`, the serializer
	* validates the value against the XML `Name` production and throws `InvalidStateError` if it
	* does not match.
	* @property {string} publicId
	* The external subset public identifier, stored verbatim (including surrounding quotes).
	* Declared `readonly` by the WHATWG DOM spec; xmldom does not enforce this constraint —
	* direct property writes succeed and the written value is serialized verbatim.
	* When serialized with `requireWellFormed: true`, the serializer validates the value against
	* the XML `PubidLiteral` production and throws `InvalidStateError` if it does not match.
	* @property {string} systemId
	* The external subset system identifier, stored verbatim (including surrounding quotes).
	* Declared `readonly` by the WHATWG DOM spec; xmldom does not enforce this constraint —
	* direct property writes succeed and the written value is serialized verbatim.
	* When serialized with `requireWellFormed: true`, the serializer validates the value against
	* the XML `SystemLiteral` production and throws `InvalidStateError` if it does not match.
	* @property {string} internalSubset
	* The internal subset string (the raw content between `[` and `]`), or an empty string.
	* Declared `readonly` by the WHATWG DOM spec; xmldom does not enforce this constraint —
	* direct property writes succeed and the written value is serialized verbatim.
	* When serialized with `requireWellFormed: true`, the serializer throws `InvalidStateError`
	* if the value contains `"]>"`.
	* @see https://developer.mozilla.org/docs/Web/API/DocumentType MDN
	* @see https://dom.spec.whatwg.org/#interface-documenttype WHATWG DOM
	* @prettierignore
	*/
	function DocumentType(symbol) {
		checkSymbol(symbol);
	}
	DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
	_extends(DocumentType, Node);
	function Notation(symbol) {
		checkSymbol(symbol);
	}
	Notation.prototype.nodeType = NOTATION_NODE;
	_extends(Notation, Node);
	function Entity(symbol) {
		checkSymbol(symbol);
	}
	Entity.prototype.nodeType = ENTITY_NODE;
	_extends(Entity, Node);
	/**
	* Represents an EntityReference node, serialized as `&nodeName;`.
	*
	* `nodeName` is the referenced entity's name, stored verbatim. When serialized with
	* `requireWellFormed: true`, the serializer validates `nodeName` against the XML `Name`
	* production and throws `InvalidStateError` if it does not match; without that option the name
	* is emitted verbatim between `&` and `;`.
	*
	* __This implementation differs from the specification:__ xmldom does not expand entities —
	* the parser resolves entity references inline and never constructs `EntityReference` nodes,
	* so the only producer is {@link Document#createEntityReference}.
	*
	* @class
	* @see https://www.w3.org/TR/xml/#NT-Name
	*/
	function EntityReference(symbol) {
		checkSymbol(symbol);
	}
	EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
	_extends(EntityReference, Node);
	function DocumentFragment(symbol) {
		checkSymbol(symbol);
	}
	DocumentFragment.prototype.nodeName = "#document-fragment";
	DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
	_extends(DocumentFragment, Node);
	function ProcessingInstruction(symbol) {
		checkSymbol(symbol);
	}
	ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
	_extends(ProcessingInstruction, CharacterData);
	function XMLSerializer() {}
	/**
	* Returns the result of serializing `node` to XML.
	*
	* When `options.requireWellFormed` is `true`, the serializer throws `InvalidStateError` for
	* content that would produce ill-formed XML (e.g. CDATASection data containing `"]]>"`, Text
	* data containing characters outside the XML Char production, or a Document with no
	* `documentElement`).
	*
	* When `options.splitCDATASections` is `false`, CDATASection data is emitted verbatim even
	* when it contains `"]]>"`. When `true` (the default), `"]]>"` sequences are split across
	* concatenated CDATA sections — this behavior is **deprecated** and will be removed in the
	* next breaking release. Callers should migrate to `{ requireWellFormed: true }`, which throws
	* `InvalidStateError` instead of transforming.
	*
	* __This implementation differs from the specification:__ - CDATASection serialization is not
	* specified by W3C DOM Parsing or WHATWG DOM Parsing (see
	* {@link https://github.com/w3c/DOM-Parsing/issues/38 w3c/DOM-Parsing#38}).
	* When `splitCDATASections` is `true` (the default), `"]]>"` sequences in CDATASection data
	* are split across concatenated CDATA sections — this mechanism is derived from DOM Level 3
	* Core and is **deprecated**. The split mechanics will be removed in the next breaking
	* release. Callers that rely on this behavior should migrate to `{ requireWellFormed: true }`.
	* - W3C DOM Parsing §3.2.1.1 requires well-formedness checks on Element `localName`s,
	* prefixes,
	* and attribute serialization (duplicate attributes, namespace declarations, attribute value
	* characters) when `requireWellFormed` is `true`. Element and attribute qualified names (which
	* cover the namespace prefix) are validated against the XML `QName` production; the remaining
	* §3.2.1.1 checks (duplicate attributes, namespace-declaration consistency) and creation-time
	* name validation are **not implemented** in this release — see the tracking issue filed
	* against the next breaking milestone.
	*
	* @param {Node} node
	* @param {Object | function} [options]
	* Options object, or a legacy nodeFilter function (backward compatible).
	* @param {boolean} [options.requireWellFormed=false]
	* When `true`, throws `InvalidStateError` for content that would produce ill-formed XML.
	* @param {boolean} [options.splitCDATASections=true]
	* When `true` (default), splits `"]]>"` sequences in CDATASection data across concatenated
	* CDATA sections. **Deprecated** — will be removed in the next breaking release.
	* @param {function} [options.nodeFilter]
	* A filter function applied to each node before serialization.
	* @returns {string}
	* @throws {DOMException}
	* With name `InvalidStateError` when `requireWellFormed` is `true` and any of the following
	* conditions hold:
	* - an Element's qualified name (including any namespace prefix) is not a valid XML QName
	* - an attribute's qualified name (including a synthesized `xmlns:` namespace declaration) is
	* not a valid XML QName
	* - CDATASection data contains `"]]>"`
	* - Text data contains characters outside the XML Char production
	* - a Comment node's data contains `--` anywhere or ends with `-`
	* - a ProcessingInstruction's target is not a valid XML `NCName` (a `Name` with no colon) or is
	* an ASCII case-insensitive match for `"xml"`, or its data contains `?>` or characters outside
	* the XML Char production
	* - a DocumentType's `name` is not a valid XML `Name` (XML 1.0 production [5])
	* - a DocumentType's `publicId` is non-empty and does not match the XML `PubidLiteral`
	* production (W3C DOM Parsing §3.2.1.3; XML 1.0 production [12])
	* - a DocumentType's `systemId` is non-empty and does not match the XML `SystemLiteral`
	* production (W3C DOM Parsing §3.2.1.3; XML 1.0 production [11])
	* - a DocumentType's `internalSubset` contains `"]>"`
	* - an EntityReference's `nodeName` is not a valid XML `Name` (XML 1.0 production [5])
	* - the Document has no `documentElement`
	* @see https://developer.mozilla.org/docs/Web/API/XMLSerializer/serializeToString
	* @see https://html.spec.whatwg.org/#dom-xmlserializer-serializetostring
	* @see https://github.com/w3c/DOM-Parsing/issues/84
	* @prettierignore
	*/
	XMLSerializer.prototype.serializeToString = function(node, options) {
		return nodeSerializeToString.call(node, options);
	};
	Node.prototype.toString = nodeSerializeToString;
	function nodeSerializeToString(options) {
		var opts;
		if (typeof options === "function") opts = {
			requireWellFormed: false,
			splitCDATASections: true,
			nodeFilter: options
		};
		else if (options != null) opts = {
			requireWellFormed: !!options.requireWellFormed,
			splitCDATASections: options.splitCDATASections !== false,
			nodeFilter: options.nodeFilter || null
		};
		else opts = {
			requireWellFormed: false,
			splitCDATASections: true,
			nodeFilter: null
		};
		var buf = [];
		var refNode = this.nodeType === DOCUMENT_NODE && this.documentElement || this;
		var prefix = refNode.prefix;
		var uri = refNode.namespaceURI;
		if (uri && prefix == null) {
			var prefix = refNode.lookupPrefix(uri);
			if (prefix == null) var visibleNamespaces = [{
				namespace: uri,
				prefix: null
			}];
		}
		serializeToString(this, buf, visibleNamespaces, opts);
		return buf.join("");
	}
	function needNamespaceDefine(node, isHTML, visibleNamespaces) {
		var prefix = node.prefix || "";
		var uri = node.namespaceURI;
		if (!uri) return false;
		if (prefix === "xml" && uri === NAMESPACE.XML || uri === NAMESPACE.XMLNS) return false;
		var i = visibleNamespaces.length;
		while (i--) {
			var ns = visibleNamespaces[i];
			if (ns.prefix === prefix) return ns.namespace !== uri;
		}
		return true;
	}
	/**
	* Literal whitespace other than space that appear in attribute values are serialized as
	* their entity references, so they will be preserved.
	* (In contrast to whitespace literals in the input which are normalized to spaces).
	*
	* Well-formed constraint: No < in Attribute Values:
	* > The replacement text of any entity referred to directly or indirectly
	* > in an attribute value must not contain a <.
	*
	* @see https://www.w3.org/TR/xml11/#CleanAttrVals
	* @see https://www.w3.org/TR/xml11/#NT-AttValue
	* @see https://www.w3.org/TR/xml11/#AVNormalize
	* @see https://w3c.github.io/DOM-Parsing/#serializing-an-element-s-attributes
	* @prettierignore
	*/
	function addSerializedAttribute(buf, qualifiedName, value, requireWellFormed) {
		if (requireWellFormed && !g.QName_exact.test(qualifiedName)) throw new DOMException("The attribute name \"" + qualifiedName + "\" is not a valid XML QName", DOMExceptionName.InvalidStateError);
		buf.push(" ", qualifiedName, "=\"", value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), "\"");
	}
	function serializeToString(node, buf, visibleNamespaces, opts) {
		if (!visibleNamespaces) visibleNamespaces = [];
		var nodeFilter = opts.nodeFilter;
		var requireWellFormed = opts.requireWellFormed;
		var splitCDATASections = opts.splitCDATASections;
		var isHTML = (node.nodeType === DOCUMENT_NODE ? node : node.ownerDocument).type === "html";
		walkDOM(node, { ns: visibleNamespaces }, {
			enter: function(n, ctx) {
				var namespaces = ctx.ns;
				if (nodeFilter) {
					n = nodeFilter(n);
					if (n) {
						if (typeof n == "string") {
							buf.push(n);
							return null;
						}
					} else return null;
				}
				switch (n.nodeType) {
					case ELEMENT_NODE:
						var attrs = n.attributes;
						var len = attrs.length;
						var nodeName = n.tagName;
						var prefixedNodeName = nodeName;
						if (!isHTML && !n.prefix && n.namespaceURI) {
							var defaultNS;
							for (var ai = 0; ai < attrs.length; ai++) if (attrs.item(ai).name === "xmlns") {
								defaultNS = attrs.item(ai).value;
								break;
							}
							if (!defaultNS) for (var nsi = namespaces.length - 1; nsi >= 0; nsi--) {
								var nsEntry = namespaces[nsi];
								if (nsEntry.prefix === "" && nsEntry.namespace === n.namespaceURI) {
									defaultNS = nsEntry.namespace;
									break;
								}
							}
							if (defaultNS !== n.namespaceURI) for (var nsi = namespaces.length - 1; nsi >= 0; nsi--) {
								var nsEntry = namespaces[nsi];
								if (nsEntry.namespace === n.namespaceURI) {
									if (nsEntry.prefix) prefixedNodeName = nsEntry.prefix + ":" + nodeName;
									break;
								}
							}
						}
						if (requireWellFormed && !g.QName_exact.test(prefixedNodeName)) throw new DOMException("The element name \"" + prefixedNodeName + "\" is not a valid XML QName", DOMExceptionName.InvalidStateError);
						buf.push("<", prefixedNodeName);
						var childNamespaces = namespaces.slice();
						for (var i = 0; i < len; i++) {
							var attr = attrs.item(i);
							if (attr.prefix == "xmlns") childNamespaces.push({
								prefix: attr.localName,
								namespace: attr.value
							});
							else if (attr.nodeName == "xmlns") childNamespaces.push({
								prefix: "",
								namespace: attr.value
							});
						}
						for (var i = 0; i < len; i++) {
							var attr = attrs.item(i);
							if (needNamespaceDefine(attr, isHTML, childNamespaces)) {
								var attrPrefix = attr.prefix || "";
								var uri = attr.namespaceURI;
								addSerializedAttribute(buf, attrPrefix ? "xmlns:" + attrPrefix : "xmlns", uri, requireWellFormed);
								childNamespaces.push({
									prefix: attrPrefix,
									namespace: uri
								});
							}
							var filteredAttr = nodeFilter ? nodeFilter(attr) : attr;
							if (filteredAttr) if (typeof filteredAttr === "string") buf.push(filteredAttr);
							else addSerializedAttribute(buf, filteredAttr.name, filteredAttr.value, requireWellFormed);
						}
						if (nodeName === prefixedNodeName && needNamespaceDefine(n, isHTML, childNamespaces)) {
							var nodePrefix = n.prefix || "";
							var uri = n.namespaceURI;
							addSerializedAttribute(buf, nodePrefix ? "xmlns:" + nodePrefix : "xmlns", uri, requireWellFormed);
							childNamespaces.push({
								prefix: nodePrefix,
								namespace: uri
							});
						}
						var canCloseTag = !n.firstChild;
						if (canCloseTag && (isHTML || n.namespaceURI === NAMESPACE.HTML)) canCloseTag = isHTMLVoidElement(nodeName);
						if (canCloseTag) {
							buf.push("/>");
							return null;
						}
						buf.push(">");
						if (isHTML && isHTMLRawTextElement(nodeName)) {
							var child = n.firstChild;
							while (child) {
								if (child.data) buf.push(child.data);
								else serializeToString(child, buf, childNamespaces.slice(), opts);
								child = child.nextSibling;
							}
							buf.push("</", prefixedNodeName, ">");
							return null;
						}
						return {
							ns: childNamespaces,
							tag: prefixedNodeName
						};
					case DOCUMENT_NODE:
					case DOCUMENT_FRAGMENT_NODE:
						if (requireWellFormed && n.nodeType === DOCUMENT_NODE && n.documentElement == null) throw new DOMException("The Document has no documentElement", DOMExceptionName.InvalidStateError);
						return { ns: namespaces };
					case ATTRIBUTE_NODE:
						addSerializedAttribute(buf, n.name, n.value, requireWellFormed);
						return null;
					case TEXT_NODE:
						if (requireWellFormed && g.InvalidChar.test(n.data)) throw new DOMException("The Text node data contains characters outside the XML Char production", DOMExceptionName.InvalidStateError);
						buf.push(n.data.replace(/[<&>]/g, _xmlEncoder));
						return null;
					case CDATA_SECTION_NODE:
						if (requireWellFormed && n.data.indexOf("]]>") !== -1) throw new DOMException("The CDATASection data contains \"]]>\"", DOMExceptionName.InvalidStateError);
						if (splitCDATASections) buf.push(g.CDATA_START, n.data.replace(/]]>/g, "]]]]><![CDATA[>"), g.CDATA_END);
						else buf.push(g.CDATA_START, n.data, g.CDATA_END);
						return null;
					case COMMENT_NODE:
						if (requireWellFormed) {
							if (g.InvalidChar.test(n.data)) throw new DOMException("The comment node data contains characters outside the XML Char production", DOMExceptionName.InvalidStateError);
							if (n.data.indexOf("--") !== -1 || n.data[n.data.length - 1] === "-") throw new DOMException("The comment node data contains \"--\" or ends with \"-\"", DOMExceptionName.InvalidStateError);
						}
						buf.push(g.COMMENT_START, n.data, g.COMMENT_END);
						return null;
					case DOCUMENT_TYPE_NODE:
						var pubid = n.publicId;
						var sysid = n.systemId;
						if (requireWellFormed) {
							if (!g.Name_exact.test(n.name)) throw new DOMException("The doctype name \"" + n.name + "\" is not a valid XML Name", DOMExceptionName.InvalidStateError);
							if (pubid && !g.PubidLiteral_match.test(pubid)) throw new DOMException("DocumentType publicId is not a valid PubidLiteral", DOMExceptionName.InvalidStateError);
							if (sysid && sysid !== "." && !g.SystemLiteral_match.test(sysid)) throw new DOMException("DocumentType systemId is not a valid SystemLiteral", DOMExceptionName.InvalidStateError);
							if (n.internalSubset && n.internalSubset.indexOf("]>") !== -1) throw new DOMException("DocumentType internalSubset contains \"]>\"", DOMExceptionName.InvalidStateError);
						}
						buf.push(g.DOCTYPE_DECL_START, " ", n.name);
						if (pubid) {
							buf.push(" ", g.PUBLIC, " ", pubid);
							if (sysid && sysid !== ".") buf.push(" ", sysid);
						} else if (sysid && sysid !== ".") buf.push(" ", g.SYSTEM, " ", sysid);
						if (n.internalSubset) buf.push(" [", n.internalSubset, "]");
						buf.push(">");
						return null;
					case PROCESSING_INSTRUCTION_NODE:
						if (requireWellFormed) {
							if (!g.NCName_exact.test(n.target) || n.target.toLowerCase() === "xml") throw new DOMException("The processing instruction target \"" + n.target + "\" is not a valid XML NCName or is reserved", DOMExceptionName.InvalidStateError);
							if (g.InvalidChar.test(n.data)) throw new DOMException("The ProcessingInstruction data contains characters outside the XML Char production", DOMExceptionName.InvalidStateError);
							if (n.data.indexOf("?>") !== -1) throw new DOMException("The ProcessingInstruction data contains \"?>\"", DOMExceptionName.InvalidStateError);
						}
						buf.push("<?", n.target, " ", n.data, "?>");
						return null;
					case ENTITY_REFERENCE_NODE:
						if (requireWellFormed && !g.Name_exact.test(n.nodeName)) throw new DOMException("The entity reference name \"" + n.nodeName + "\" is not a valid XML Name", DOMExceptionName.InvalidStateError);
						buf.push("&", n.nodeName, ";");
						return null;
					default:
						buf.push("??", n.nodeName);
						return null;
				}
			},
			exit: function(n, childCtx) {
				if (childCtx && childCtx.tag) buf.push("</", childCtx.tag, ">");
			}
		});
	}
	/**
	* Imports a node from a different document into `doc`, creating a new copy.
	* Delegates to {@link walkDOM} for traversal. Each node in the subtree is shallow-cloned,
	* stamped with `doc` as its `ownerDocument`, and detached (`parentNode` set to `null`).
	* Children are imported recursively when `deep` is `true`; for {@link Attr} nodes `deep` is
	* always forced to `true`
	* because an attribute's value lives in a child text node.
	*
	* @param {Document} doc
	* The document that will own the imported node.
	* @param {Node} node
	* The node to import.
	* @param {boolean} deep
	* If `true`, descendants are imported recursively.
	* @returns {Node}
	* The newly imported node, now owned by `doc`.
	*/
	function importNode(doc, node, deep) {
		var destRoot;
		walkDOM(node, null, { enter: function(srcNode, destParent) {
			var destNode = srcNode.cloneNode(false);
			destNode.ownerDocument = doc;
			destNode.parentNode = null;
			if (destParent === null) destRoot = destNode;
			else destParent.appendChild(destNode);
			return srcNode.nodeType === ATTRIBUTE_NODE || deep ? destNode : null;
		} });
		return destRoot;
	}
	/**
	* Creates a copy of a node from an existing one.
	*
	* @param {Document} doc
	* The Document object representing the document that the new node will belong to.
	* @param {Node} node
	* The node to clone.
	* @param {boolean} deep
	* If true, the contents of the node are recursively copied.
	* If false, only the node itself (and its attributes, if it is an element) are copied.
	* @returns {Node}
	* Returns the newly created copy of the node.
	* @throws {DOMException}
	* May throw a DOMException if operations within setAttributeNode or appendChild (which are
	* potentially invoked in this function) do not meet their specific constraints.
	*/
	function cloneNode(doc, node, deep) {
		var destRoot;
		walkDOM(node, null, { enter: function(srcNode, destParent) {
			var destNode = new srcNode.constructor(PDC);
			for (var n in srcNode) if (hasOwn(srcNode, n)) {
				var v = srcNode[n];
				if (typeof v != "object") {
					if (v != destNode[n]) destNode[n] = v;
				}
			}
			if (srcNode.childNodes) destNode.childNodes = new NodeList();
			destNode.ownerDocument = doc;
			var shouldDeep = deep;
			switch (destNode.nodeType) {
				case ELEMENT_NODE:
					var attrs = srcNode.attributes;
					var attrs2 = destNode.attributes = new NamedNodeMap();
					var len = attrs.length;
					attrs2._ownerElement = destNode;
					for (var i = 0; i < len; i++) destNode.setAttributeNode(cloneNode(doc, attrs.item(i), true));
					break;
				case ATTRIBUTE_NODE: shouldDeep = true;
			}
			if (destParent !== null) destParent.appendChild(destNode);
			else destRoot = destNode;
			return shouldDeep ? destNode : null;
		} });
		return destRoot;
	}
	function __set__(object, key, value) {
		object[key] = value;
	}
	function childrenRefresh(node) {
		var ls = [];
		var child = node.firstChild;
		while (child) {
			if (child.nodeType === ELEMENT_NODE) ls.push(child);
			child = child.nextSibling;
		}
		return ls;
	}
	try {
		if (Object.defineProperty) {
			Object.defineProperty(LiveNodeList.prototype, "length", { get: function() {
				_updateLiveList(this);
				return this.$$length;
			} });
			/**
			* The text content of this node and its descendants.
			*
			* For {@link Element} and {@link DocumentFragment} nodes, returns the concatenation of the
			* `nodeValue` of every descendant text node, excluding processing instruction and comment
			* nodes. For all other node types, returns `nodeValue`.
			*
			* Setting `textContent` on an element or document fragment replaces all child nodes with a
			* single text node; on other nodes it sets `data`, `value`, and `nodeValue` directly.
			*
			* @type {string | null}
			* @see {@link https://dom.spec.whatwg.org/#dom-node-textcontent}
			*/
			Object.defineProperty(Node.prototype, "textContent", {
				get: function() {
					if (this.nodeType === ELEMENT_NODE || this.nodeType === DOCUMENT_FRAGMENT_NODE) {
						var buf = [];
						walkDOM(this, null, { enter: function(n) {
							if (n.nodeType === ELEMENT_NODE || n.nodeType === DOCUMENT_FRAGMENT_NODE) return true;
							if (n.nodeType === PROCESSING_INSTRUCTION_NODE || n.nodeType === COMMENT_NODE) return null;
							buf.push(n.nodeValue);
						} });
						return buf.join("");
					}
					return this.nodeValue;
				},
				set: function(data) {
					switch (this.nodeType) {
						case ELEMENT_NODE:
						case DOCUMENT_FRAGMENT_NODE:
							while (this.firstChild) this.removeChild(this.firstChild);
							if (data || String(data)) this.appendChild(this.ownerDocument.createTextNode(data));
							break;
						default:
							this.data = data;
							this.value = data;
							this.nodeValue = data;
					}
				}
			});
			Object.defineProperty(CharacterData.prototype, "data", {
				get: function() {
					return this._data != null ? this._data : "";
				},
				set: function(v) {
					this._data = v;
					this.length = typeof v === "string" ? v.length : 0;
				}
			});
			Object.defineProperty(CharacterData.prototype, "nodeValue", {
				get: function() {
					return this.data;
				},
				set: function(v) {
					this.data = v;
				},
				enumerable: true,
				configurable: true
			});
			Object.defineProperty(Element.prototype, "children", { get: function() {
				return new LiveNodeList(this, childrenRefresh);
			} });
			Object.defineProperty(Document.prototype, "children", { get: function() {
				return new LiveNodeList(this, childrenRefresh);
			} });
			Object.defineProperty(DocumentFragment.prototype, "children", { get: function() {
				return new LiveNodeList(this, childrenRefresh);
			} });
			__set__ = function(object, key, value) {
				object["$$" + key] = value;
			};
		}
	} catch (e) {}
	exports._updateLiveList = _updateLiveList;
	exports.Attr = Attr;
	exports.CDATASection = CDATASection;
	exports.CharacterData = CharacterData;
	exports.Comment = Comment;
	exports.Document = Document;
	exports.DocumentFragment = DocumentFragment;
	exports.DocumentType = DocumentType;
	exports.DOMImplementation = DOMImplementation;
	exports.Element = Element;
	exports.Entity = Entity;
	exports.EntityReference = EntityReference;
	exports.LiveNodeList = LiveNodeList;
	exports.NamedNodeMap = NamedNodeMap;
	exports.Node = Node;
	exports.NodeList = NodeList;
	exports.Notation = Notation;
	exports.Text = Text;
	exports.ProcessingInstruction = ProcessingInstruction;
	exports.walkDOM = walkDOM;
	exports.XMLSerializer = XMLSerializer;
}));
//#endregion
//#region ../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/entities.js
var require_entities = /* @__PURE__ */ __commonJSMin(((exports) => {
	var freeze = require_conventions().freeze;
	/**
	* The entities that are predefined in every XML document.
	*
	* @see https://www.w3.org/TR/2006/REC-xml11-20060816/#sec-predefined-ent W3C XML 1.1
	* @see https://www.w3.org/TR/2008/REC-xml-20081126/#sec-predefined-ent W3C XML 1.0
	* @see https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references#Predefined_entities_in_XML
	*      Wikipedia
	*/
	exports.XML_ENTITIES = freeze({
		amp: "&",
		apos: "'",
		gt: ">",
		lt: "<",
		quot: "\""
	});
	/**
	* A map of all entities that are detected in an HTML document.
	* They contain all entries from `XML_ENTITIES`.
	*
	* @see {@link XML_ENTITIES}
	* @see {@link DOMParser.parseFromString}
	* @see {@link DOMImplementation.prototype.createHTMLDocument}
	* @see https://html.spec.whatwg.org/#named-character-references WHATWG HTML(5)
	*      Spec
	* @see https://html.spec.whatwg.org/entities.json JSON
	* @see https://www.w3.org/TR/xml-entity-names/ W3C XML Entity Names
	* @see https://www.w3.org/TR/html4/sgml/entities.html W3C HTML4/SGML
	* @see https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references#Character_entity_references_in_HTML
	*      Wikipedia (HTML)
	* @see https://en.wikipedia.org/wiki/List_of_XML_and_HTML_character_entity_references#Entities_representing_special_characters_in_XHTML
	*      Wikpedia (XHTML)
	*/
	exports.HTML_ENTITIES = freeze({
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
		NewLine: "\n",
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
	/**
	* @deprecated
	* Use `HTML_ENTITIES` instead.
	* @see {@link HTML_ENTITIES}
	*/
	exports.entityMap = exports.HTML_ENTITIES;
}));
//#endregion
//#region ../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/sax.js
var require_sax = /* @__PURE__ */ __commonJSMin(((exports) => {
	var conventions = require_conventions();
	var g = require_grammar();
	var errors = require_errors();
	var isHTMLEscapableRawTextElement = conventions.isHTMLEscapableRawTextElement;
	var isHTMLMimeType = conventions.isHTMLMimeType;
	var isHTMLRawTextElement = conventions.isHTMLRawTextElement;
	var hasOwn = conventions.hasOwn;
	var NAMESPACE = conventions.NAMESPACE;
	var ParseError = errors.ParseError;
	var DOMException = errors.DOMException;
	var S_TAG = 0;
	var S_ATTR = 1;
	var S_ATTR_SPACE = 2;
	var S_EQ = 3;
	var S_ATTR_NOQUOT_VALUE = 4;
	var S_ATTR_END = 5;
	var S_TAG_SPACE = 6;
	var S_TAG_CLOSE = 7;
	function XMLReader() {}
	XMLReader.prototype = { parse: function(source, defaultNSMap, entityMap) {
		var domBuilder = this.domBuilder;
		domBuilder.startDocument();
		_copy(defaultNSMap, defaultNSMap = Object.create(null));
		parse(source, defaultNSMap, entityMap, domBuilder, this.errorHandler);
		domBuilder.endDocument();
	} };
	/**
	* Detecting everything that might be a reference,
	* including those without ending `;`, since those are allowed in HTML.
	* The entityReplacer takes care of verifying and transforming each occurrence,
	* and reports to the errorHandler on those that are not OK,
	* depending on the context.
	*/
	var ENTITY_REG = /&#?\w+;?/g;
	function parse(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
		var isHTML = isHTMLMimeType(domBuilder.mimeType);
		if (source.indexOf(g.UNICODE_REPLACEMENT_CHARACTER) >= 0) errorHandler.warning("Unicode replacement character detected, source encoding issues?");
		function fixedFromCharCode(code) {
			if (code > 65535) {
				code -= 65536;
				var surrogate1 = 55296 + (code >> 10), surrogate2 = 56320 + (code & 1023);
				return String.fromCharCode(surrogate1, surrogate2);
			} else return String.fromCharCode(code);
		}
		function entityReplacer(a) {
			var complete = a[a.length - 1] === ";" ? a : a + ";";
			if (!isHTML && complete !== a) {
				errorHandler.error("EntityRef: expecting ;");
				return a;
			}
			var match = g.Reference.exec(complete);
			if (!match || match[0].length !== complete.length) {
				errorHandler.error("entity not matching Reference production: " + a);
				return a;
			}
			var k = complete.slice(1, -1);
			if (hasOwn(entityMap, k)) return entityMap[k];
			else if (k.charAt(0) === "#") return fixedFromCharCode(parseInt(k.substring(1).replace("x", "0x")));
			else {
				errorHandler.error("entity not found:" + a);
				return a;
			}
		}
		function appendText(end) {
			if (end > start) {
				var xt = source.substring(start, end).replace(ENTITY_REG, entityReplacer);
				locator && position(start);
				domBuilder.characters(xt, 0, end - start);
				start = end;
			}
		}
		var lineStart = 0;
		var lineEnd = 0;
		var linePattern = /\r\n?|\n|$/g;
		var locator = domBuilder.locator;
		function position(p, m) {
			while (p >= lineEnd && (m = linePattern.exec(source))) {
				lineStart = lineEnd;
				lineEnd = m.index + m[0].length;
				locator.lineNumber++;
			}
			locator.columnNumber = p - lineStart + 1;
		}
		var parseStack = [{ currentNSMap: defaultNSMapCopy }];
		var unclosedTags = [];
		var start = 0;
		while (true) {
			try {
				var tagStart = source.indexOf("<", start);
				if (tagStart < 0) {
					if (!isHTML && unclosedTags.length > 0) return errorHandler.fatalError("unclosed xml tag(s): " + unclosedTags.join(", "));
					if (!source.substring(start).match(/^\s*$/)) {
						var doc = domBuilder.doc;
						var text = doc.createTextNode(source.substring(start));
						if (doc.documentElement) return errorHandler.error("Extra content at the end of the document");
						doc.appendChild(text);
						domBuilder.currentElement = text;
					}
					return;
				}
				if (tagStart > start) {
					var fromSource = source.substring(start, tagStart);
					if (!isHTML && unclosedTags.length === 0) {
						fromSource = fromSource.replace(new RegExp(g.S_OPT.source, "g"), "");
						fromSource && errorHandler.error("Unexpected content outside root element: '" + fromSource + "'");
					}
					appendText(tagStart);
				}
				switch (source.charAt(tagStart + 1)) {
					case "/":
						var end = source.indexOf(">", tagStart + 2);
						var tagNameRaw = source.substring(tagStart + 2, end > 0 ? end : void 0);
						if (!tagNameRaw) return errorHandler.fatalError("end tag name missing");
						var endTagNameStrict = g.reg("^", g.QName_group, g.S_OPT, "$");
						var tagNameMatch = end > 0 && endTagNameStrict.exec(tagNameRaw);
						if (!tagNameMatch) {
							var leadingTagNameMatch = end > 0 && g.reg("^", g.QName_group).exec(tagNameRaw);
							if (isHTML && leadingTagNameMatch) {
								errorHandler.warning("end tag name contains invalid trailing characters: \"" + tagNameRaw + "\"");
								tagNameMatch = leadingTagNameMatch;
							} else if (leadingTagNameMatch && new RegExp(endTagNameStrict.source, endTagNameStrict.flags + "m").test(tagNameRaw)) {
								errorHandler.error("end tag name is followed by a line break and trailing content: \"" + tagNameRaw + "\"");
								tagNameMatch = leadingTagNameMatch;
							} else return errorHandler.fatalError("end tag name contains invalid characters: \"" + tagNameRaw + "\"");
						}
						if (!domBuilder.currentElement && !domBuilder.doc.documentElement) return;
						var currentTagName = unclosedTags[unclosedTags.length - 1] || domBuilder.currentElement.tagName || domBuilder.doc.documentElement.tagName || "";
						if (currentTagName !== tagNameMatch[1]) {
							var tagNameLower = tagNameMatch[1].toLowerCase();
							if (!isHTML || currentTagName.toLowerCase() !== tagNameLower) return errorHandler.fatalError("Opening and ending tag mismatch: \"" + currentTagName + "\" != \"" + tagNameRaw + "\"");
						}
						var config = parseStack.pop();
						unclosedTags.pop();
						var localNSMap = config.localNSMap;
						domBuilder.endElement(config.uri, config.localName, currentTagName);
						if (localNSMap) {
							for (var prefix in localNSMap) if (hasOwn(localNSMap, prefix)) domBuilder.endPrefixMapping(prefix);
						}
						end++;
						break;
					case "?":
						locator && position(tagStart);
						end = parseProcessingInstruction(source, tagStart, domBuilder, errorHandler);
						break;
					case "!":
						locator && position(tagStart);
						end = parseDoctypeCommentOrCData(source, tagStart, domBuilder, errorHandler, isHTML);
						break;
					default:
						locator && position(tagStart);
						var el = new ElementAttributes();
						var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
						var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler, isHTML);
						var len = el.length;
						if (!el.closed) if (isHTML && conventions.isHTMLVoidElement(el.tagName)) el.closed = true;
						else unclosedTags.push(el.tagName);
						if (locator && len) {
							var locator2 = copyLocator(locator, {});
							for (var i = 0; i < len; i++) {
								var a = el[i];
								position(a.offset);
								a.locator = copyLocator(locator, {});
							}
							domBuilder.locator = locator2;
							if (appendElement(el, domBuilder, currentNSMap)) parseStack.push(el);
							domBuilder.locator = locator;
						} else if (appendElement(el, domBuilder, currentNSMap)) parseStack.push(el);
						if (isHTML && !el.closed) end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
						else end++;
				}
			} catch (e) {
				if (e instanceof ParseError) throw e;
				else if (e instanceof DOMException) return errorHandler.fatalError("Error constructing the DOM: " + e.name + ": " + e.message, e);
				errorHandler.error("element parse error: " + e);
				end = -1;
			}
			if (end > start) start = end;
			else appendText(Math.max(tagStart, start) + 1);
		}
	}
	function copyLocator(f, t) {
		t.lineNumber = f.lineNumber;
		t.columnNumber = f.columnNumber;
		return t;
	}
	/**
	* @returns
	* end of the elementStartPart(end of elementEndPart for selfClosed el)
	* @see {@link #appendElement}
	*/
	function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler, isHTML) {
		/**
		* @param {string} qname
		* @param {string} value
		* @param {number} startIndex
		*/
		function addAttribute(qname, value, startIndex) {
			if (hasOwn(el.attributeNames, qname)) return errorHandler.fatalError("Attribute " + qname + " redefined");
			if (!isHTML && value.indexOf("<") >= 0) return errorHandler.fatalError("Unescaped '<' not allowed in attributes values");
			el.addValue(qname, value.replace(/[\t\n\r]/g, " ").replace(ENTITY_REG, entityReplacer), startIndex);
		}
		var attrName;
		var value;
		var p = ++start;
		var s = S_TAG;
		while (true) {
			var c = source.charAt(p);
			if (s === S_TAG && c === "<") throw new Error("unexpected < in tag name: " + source.slice(start, p));
			switch (c) {
				case "=":
					if (s === S_ATTR) {
						attrName = source.slice(start, p);
						s = S_EQ;
					} else if (s === S_ATTR_SPACE) s = S_EQ;
					else throw new Error("attribute equal must after attrName");
					break;
				case "'":
				case "\"":
					if (s === S_EQ || s === S_ATTR) {
						if (s === S_ATTR) {
							errorHandler.warning("attribute value must after \"=\"");
							attrName = source.slice(start, p);
						}
						start = p + 1;
						p = source.indexOf(c, start);
						if (p > 0) {
							value = source.slice(start, p);
							addAttribute(attrName, value, start - 1);
							s = S_ATTR_END;
						} else throw new Error("attribute value no end '" + c + "' match");
					} else if (s == S_ATTR_NOQUOT_VALUE) {
						value = source.slice(start, p);
						addAttribute(attrName, value, start);
						errorHandler.warning("attribute \"" + attrName + "\" missed start quot(" + c + ")!!");
						start = p + 1;
						s = S_ATTR_END;
					} else throw new Error("attribute value must after \"=\"");
					break;
				case "/":
					switch (s) {
						case S_TAG: el.setTagName(source.slice(start, p));
						case S_ATTR_END:
						case S_TAG_SPACE:
						case S_TAG_CLOSE:
							s = S_TAG_CLOSE;
							el.closed = true;
						case S_ATTR_NOQUOT_VALUE:
						case S_ATTR: break;
						case S_ATTR_SPACE:
							el.closed = true;
							break;
						default: throw new Error("attribute invalid close char('/')");
					}
					break;
				case "":
					errorHandler.error("unexpected end of input");
					if (s == S_TAG) el.setTagName(source.slice(start, p));
					return p;
				case ">":
					switch (s) {
						case S_TAG: el.setTagName(source.slice(start, p));
						case S_ATTR_END:
						case S_TAG_SPACE:
						case S_TAG_CLOSE: break;
						case S_ATTR_NOQUOT_VALUE:
						case S_ATTR:
							value = source.slice(start, p);
							if (value.slice(-1) === "/") {
								el.closed = true;
								value = value.slice(0, -1);
							}
						case S_ATTR_SPACE:
							if (s === S_ATTR_SPACE) value = attrName;
							if (s == S_ATTR_NOQUOT_VALUE) {
								errorHandler.warning("attribute \"" + value + "\" missed quot(\")!");
								addAttribute(attrName, value, start);
							} else {
								if (!isHTML) errorHandler.warning("attribute \"" + value + "\" missed value!! \"" + value + "\" instead!!");
								addAttribute(value, value, start);
							}
							break;
						case S_EQ: if (!isHTML) return errorHandler.fatalError("AttValue: ' or \" expected");
					}
					return p;
				case "": c = " ";
				default: if (c <= " ") switch (s) {
					case S_TAG:
						el.setTagName(source.slice(start, p));
						s = S_TAG_SPACE;
						break;
					case S_ATTR:
						attrName = source.slice(start, p);
						s = S_ATTR_SPACE;
						break;
					case S_ATTR_NOQUOT_VALUE:
						var value = source.slice(start, p);
						errorHandler.warning("attribute \"" + value + "\" missed quot(\")!!");
						addAttribute(attrName, value, start);
					case S_ATTR_END: s = S_TAG_SPACE;
				}
				else switch (s) {
					case S_ATTR_SPACE:
						if (!isHTML) errorHandler.warning("attribute \"" + attrName + "\" missed value!! \"" + attrName + "\" instead2!!");
						addAttribute(attrName, attrName, start);
						start = p;
						s = S_ATTR;
						break;
					case S_ATTR_END: errorHandler.warning("attribute space is required\"" + attrName + "\"!!");
					case S_TAG_SPACE:
						s = S_ATTR;
						start = p;
						break;
					case S_EQ:
						s = S_ATTR_NOQUOT_VALUE;
						start = p;
						break;
					case S_TAG_CLOSE: throw new Error("elements closed character '/' and '>' must be connected to");
				}
			}
			p++;
		}
	}
	/**
	* @returns
	* `true` if a new namespace has been defined.
	*/
	function appendElement(el, domBuilder, currentNSMap) {
		var tagName = el.tagName;
		var localNSMap = null;
		var i = el.length;
		while (i--) {
			var a = el[i];
			var qName = a.qName;
			var value = a.value;
			var nsp = qName.indexOf(":");
			if (nsp > 0) {
				var prefix = a.prefix = qName.slice(0, nsp);
				var localName = qName.slice(nsp + 1);
				var nsPrefix = prefix === "xmlns" && localName;
			} else {
				localName = qName;
				prefix = null;
				nsPrefix = qName === "xmlns" && "";
			}
			a.localName = localName;
			if (nsPrefix !== false) {
				if (localNSMap == null) {
					localNSMap = Object.create(null);
					currentNSMap = Object.create(currentNSMap);
				}
				currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
				a.uri = NAMESPACE.XMLNS;
				domBuilder.startPrefixMapping(nsPrefix, value);
			}
		}
		var i = el.length;
		while (i--) {
			a = el[i];
			if (a.prefix) {
				if (a.prefix === "xml") a.uri = NAMESPACE.XML;
				if (a.prefix !== "xmlns") a.uri = currentNSMap[a.prefix];
			}
		}
		var nsp = tagName.indexOf(":");
		if (nsp > 0) {
			prefix = el.prefix = tagName.slice(0, nsp);
			localName = el.localName = tagName.slice(nsp + 1);
		} else {
			prefix = null;
			localName = el.localName = tagName;
		}
		var ns = el.uri = currentNSMap[prefix || ""];
		domBuilder.startElement(ns, localName, tagName, el);
		if (el.closed) {
			domBuilder.endElement(ns, localName, tagName);
			if (localNSMap) {
				for (prefix in localNSMap) if (hasOwn(localNSMap, prefix)) domBuilder.endPrefixMapping(prefix);
			}
		} else {
			el.currentNSMap = currentNSMap;
			el.localNSMap = localNSMap;
			return true;
		}
	}
	function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
		var isEscapableRaw = isHTMLEscapableRawTextElement(tagName);
		if (isEscapableRaw || isHTMLRawTextElement(tagName)) {
			var closeTag = new RegExp("</" + tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ">", "ig");
			closeTag.lastIndex = elStartEnd;
			var match = closeTag.exec(source);
			var elEndStart = match ? match.index : -1;
			if (elEndStart < 0) return elStartEnd + 1;
			var text = source.substring(elStartEnd + 1, elEndStart);
			if (isEscapableRaw) text = text.replace(ENTITY_REG, entityReplacer);
			domBuilder.characters(text, 0, text.length);
			return elEndStart;
		}
		return elStartEnd + 1;
	}
	function _copy(source, target) {
		for (var n in source) if (hasOwn(source, n)) target[n] = source[n];
	}
	/**
	* @typedef ParseUtils
	* @property {function(relativeIndex: number?): string | undefined} char
	* Provides look ahead access to a singe character relative to the current index.
	* @property {function(): number} getIndex
	* Provides read-only access to the current index.
	* @property {function(reg: RegExp): string | null} getMatch
	* Applies the provided regular expression enforcing that it starts at the current index and
	* returns the complete matching string,
	* and moves the current index by the length of the matching string.
	* @property {function(): string} getSource
	* Provides read-only access to the complete source.
	* @property {function(places: number?): void} skip
	* moves the current index by places (defaults to 1)
	* @property {function(): number} skipBlanks
	* Moves the current index by the amount of white space that directly follows the current index
	* and returns the amount of whitespace chars skipped (0..n),
	* or -1 if the end of the source was reached.
	* @property {function(): string} substringFromIndex
	* creates a substring from the current index to the end of `source`
	* @property {function(compareWith: string): boolean} substringStartsWith
	* Checks if `source` contains `compareWith`, starting from the current index.
	* @property {function(compareWith: string): boolean} substringStartsWithCaseInsensitive
	* Checks if `source` contains `compareWith`, starting from the current index,
	* comparing the upper case of both sides.
	* @see {@link parseUtils}
	*/
	/**
	* A temporary scope for parsing and look ahead operations in `source`,
	* starting from index `start`.
	*
	* Some operations move the current index by a number of positions,
	* after which `getIndex` returns the new index.
	*
	* @param {string} source
	* @param {number} start
	* @returns {ParseUtils}
	*/
	function parseUtils(source, start) {
		var index = start;
		function char(n) {
			n = n || 0;
			return source.charAt(index + n);
		}
		function skip(n) {
			n = n || 1;
			index += n;
		}
		function skipBlanks() {
			var blanks = 0;
			while (index < source.length) {
				var c = char();
				if (c !== " " && c !== "\n" && c !== "	" && c !== "\r") return blanks;
				blanks++;
				skip();
			}
			return -1;
		}
		function substringFromIndex() {
			return source.substring(index);
		}
		function substringStartsWith(text) {
			return source.substring(index, index + text.length) === text;
		}
		function substringStartsWithCaseInsensitive(text) {
			return source.substring(index, index + text.length).toUpperCase() === text.toUpperCase();
		}
		function getMatch(args) {
			var match = g.reg("^", args).exec(substringFromIndex());
			if (match) {
				skip(match[0].length);
				return match[0];
			}
			return null;
		}
		return {
			char,
			getIndex: function() {
				return index;
			},
			getMatch,
			getSource: function() {
				return source;
			},
			skip,
			skipBlanks,
			substringFromIndex,
			substringStartsWith,
			substringStartsWithCaseInsensitive
		};
	}
	/**
	* @param {ParseUtils} p
	* @param {DOMHandler} errorHandler
	* @returns {string}
	*/
	function parseDoctypeInternalSubset(p, errorHandler) {
		/**
		* @param {ParseUtils} p
		* @param {DOMHandler} errorHandler
		* @returns {string}
		*/
		function parsePI(p, errorHandler) {
			var match = g.PI.exec(p.substringFromIndex());
			if (!match) return errorHandler.fatalError("processing instruction is not well-formed at position " + p.getIndex());
			if (match[1].toLowerCase() === "xml") return errorHandler.fatalError("xml declaration is only allowed at the start of the document, but found at position " + p.getIndex());
			p.skip(match[0].length);
			return match[0];
		}
		var source = p.getSource();
		if (p.char() === "[") {
			p.skip(1);
			var intSubsetStart = p.getIndex();
			while (p.getIndex() < source.length) {
				p.skipBlanks();
				if (p.char() === "]") {
					var internalSubset = source.substring(intSubsetStart, p.getIndex());
					p.skip(1);
					return internalSubset;
				}
				var current = null;
				if (p.char() === "<" && p.char(1) === "!") switch (p.char(2)) {
					case "E":
						if (p.char(3) === "L") current = p.getMatch(g.elementdecl);
						else if (p.char(3) === "N") current = p.getMatch(g.EntityDecl);
						break;
					case "A":
						current = p.getMatch(g.AttlistDecl);
						break;
					case "N":
						current = p.getMatch(g.NotationDecl);
						break;
					case "-": current = p.getMatch(g.Comment);
				}
				else if (p.char() === "<" && p.char(1) === "?") current = parsePI(p, errorHandler);
				else if (p.char() === "%") current = p.getMatch(g.PEReference);
				else return errorHandler.fatalError("Error detected in Markup declaration");
				if (!current) return errorHandler.fatalError("Error in internal subset at position " + p.getIndex());
			}
			return errorHandler.fatalError("doctype internal subset is not well-formed, missing ]");
		}
	}
	/**
	* Called when the parser encounters an element starting with '<!'.
	*
	* @param {string} source
	* The xml.
	* @param {number} start
	* the start index of the '<!'
	* @param {DOMHandler} domBuilder
	* @param {DOMHandler} errorHandler
	* @param {boolean} isHTML
	* @returns {number | never}
	* The end index of the element.
	* @throws {ParseError}
	* In case the element is not well-formed.
	*/
	function parseDoctypeCommentOrCData(source, start, domBuilder, errorHandler, isHTML) {
		var p = parseUtils(source, start);
		switch (isHTML ? p.char(2).toUpperCase() : p.char(2)) {
			case "-":
				var comment = p.getMatch(g.Comment);
				if (comment) {
					domBuilder.comment(comment, g.COMMENT_START.length, comment.length - g.COMMENT_START.length - g.COMMENT_END.length);
					return p.getIndex();
				} else return errorHandler.fatalError("comment is not well-formed at position " + p.getIndex());
			case "[":
				var cdata = p.getMatch(g.CDSect);
				if (cdata) {
					if (!isHTML && !domBuilder.currentElement) return errorHandler.fatalError("CDATA outside of element");
					domBuilder.startCDATA();
					domBuilder.characters(cdata, g.CDATA_START.length, cdata.length - g.CDATA_START.length - g.CDATA_END.length);
					domBuilder.endCDATA();
					return p.getIndex();
				} else return errorHandler.fatalError("Invalid CDATA starting at position " + start);
			case "D":
				if (domBuilder.doc && domBuilder.doc.documentElement) return errorHandler.fatalError("Doctype not allowed inside or after documentElement at position " + p.getIndex());
				if (isHTML ? !p.substringStartsWithCaseInsensitive(g.DOCTYPE_DECL_START) : !p.substringStartsWith(g.DOCTYPE_DECL_START)) return errorHandler.fatalError("Expected " + g.DOCTYPE_DECL_START + " at position " + p.getIndex());
				p.skip(g.DOCTYPE_DECL_START.length);
				if (p.skipBlanks() < 1) return errorHandler.fatalError("Expected whitespace after " + g.DOCTYPE_DECL_START + " at position " + p.getIndex());
				var doctype = {
					name: void 0,
					publicId: void 0,
					systemId: void 0,
					internalSubset: void 0
				};
				doctype.name = p.getMatch(g.Name);
				if (!doctype.name) return errorHandler.fatalError("doctype name missing or contains unexpected characters at position " + p.getIndex());
				if (isHTML && doctype.name.toLowerCase() !== "html") errorHandler.warning("Unexpected DOCTYPE in HTML document at position " + p.getIndex());
				p.skipBlanks();
				if (p.substringStartsWith(g.PUBLIC) || p.substringStartsWith(g.SYSTEM)) {
					var match = g.ExternalID_match.exec(p.substringFromIndex());
					if (!match) return errorHandler.fatalError("doctype external id is not well-formed at position " + p.getIndex());
					if (match.groups.SystemLiteralOnly !== void 0) doctype.systemId = match.groups.SystemLiteralOnly;
					else {
						doctype.systemId = match.groups.SystemLiteral;
						doctype.publicId = match.groups.PubidLiteral;
					}
					p.skip(match[0].length);
				} else if (isHTML && p.substringStartsWithCaseInsensitive(g.SYSTEM)) {
					p.skip(g.SYSTEM.length);
					if (p.skipBlanks() < 1) return errorHandler.fatalError("Expected whitespace after " + g.SYSTEM + " at position " + p.getIndex());
					doctype.systemId = p.getMatch(g.ABOUT_LEGACY_COMPAT_SystemLiteral);
					if (!doctype.systemId) return errorHandler.fatalError("Expected " + g.ABOUT_LEGACY_COMPAT + " in single or double quotes after " + g.SYSTEM + " at position " + p.getIndex());
				}
				if (isHTML && doctype.systemId && !g.ABOUT_LEGACY_COMPAT_SystemLiteral.test(doctype.systemId)) errorHandler.warning("Unexpected doctype.systemId in HTML document at position " + p.getIndex());
				if (!isHTML) {
					p.skipBlanks();
					doctype.internalSubset = parseDoctypeInternalSubset(p, errorHandler);
				}
				p.skipBlanks();
				if (p.char() !== ">") return errorHandler.fatalError("doctype not terminated with > at position " + p.getIndex());
				p.skip(1);
				domBuilder.startDTD(doctype.name, doctype.publicId, doctype.systemId, doctype.internalSubset);
				domBuilder.endDTD();
				return p.getIndex();
			default: return errorHandler.fatalError("Not well-formed XML starting with \"<!\" at position " + start);
		}
	}
	function parseProcessingInstruction(source, start, domBuilder, errorHandler) {
		var match = source.substring(start).match(g.PI);
		if (!match) return errorHandler.fatalError("Invalid processing instruction starting at position " + start);
		if (match[1].toLowerCase() === "xml") {
			if (start > 0) return errorHandler.fatalError("processing instruction at position " + start + " is an xml declaration which is only at the start of the document");
			if (!g.XMLDecl.test(source.substring(start))) return errorHandler.fatalError("xml declaration is not well-formed");
		}
		domBuilder.processingInstruction(match[1], match[2]);
		return start + match[0].length;
	}
	function ElementAttributes() {
		this.attributeNames = Object.create(null);
	}
	ElementAttributes.prototype = {
		setTagName: function(tagName) {
			if (!g.QName_exact.test(tagName)) throw new Error("invalid tagName:" + tagName);
			this.tagName = tagName;
		},
		addValue: function(qName, value, offset) {
			if (!g.QName_exact.test(qName)) throw new Error("invalid attribute:" + qName);
			this.attributeNames[qName] = this.length;
			this[this.length++] = {
				qName,
				value,
				offset
			};
		},
		length: 0,
		getLocalName: function(i) {
			return this[i].localName;
		},
		getLocator: function(i) {
			return this[i].locator;
		},
		getQName: function(i) {
			return this[i].qName;
		},
		getURI: function(i) {
			return this[i].uri;
		},
		getValue: function(i) {
			return this[i].value;
		}
	};
	exports.XMLReader = XMLReader;
	exports.parseUtils = parseUtils;
	exports.parseDoctypeCommentOrCData = parseDoctypeCommentOrCData;
}));
//#endregion
//#region ../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/dom-parser.js
var require_dom_parser = /* @__PURE__ */ __commonJSMin(((exports) => {
	var conventions = require_conventions();
	var dom = require_dom();
	var errors = require_errors();
	var entities = require_entities();
	var sax = require_sax();
	var DOMImplementation = dom.DOMImplementation;
	var hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
	var isHTMLMimeType = conventions.isHTMLMimeType;
	var isValidMimeType = conventions.isValidMimeType;
	var MIME_TYPE = conventions.MIME_TYPE;
	var NAMESPACE = conventions.NAMESPACE;
	var ParseError = errors.ParseError;
	var XMLReader = sax.XMLReader;
	/**
	* Normalizes line ending according to <https://www.w3.org/TR/xml11/#sec-line-ends>,
	* including some Unicode "newline" characters:
	*
	* > XML parsed entities are often stored in computer files which,
	* > for editing convenience, are organized into lines.
	* > These lines are typically separated by some combination
	* > of the characters CARRIAGE RETURN (#xD) and LINE FEED (#xA).
	* >
	* > To simplify the tasks of applications, the XML processor must behave
	* > as if it normalized all line breaks in external parsed entities (including the document entity)
	* > on input, before parsing, by translating the following to a single #xA character:
	* >
	* > 1. the two-character sequence #xD #xA,
	* > 2. the two-character sequence #xD #x85,
	* > 3. the single character #x85,
	* > 4. the single character #x2028,
	* > 5. the single character #x2029,
	* > 6. any #xD character that is not immediately followed by #xA or #x85.
	*
	* @param {string} input
	* @returns {string}
	* @prettierignore
	*/
	function normalizeLineEndings(input) {
		return input.replace(/\r[\n\u0085]/g, "\n").replace(/[\r\u0085\u2028\u2029]/g, "\n");
	}
	/**
	* @typedef Locator
	* @property {number} [columnNumber]
	* @property {number} [lineNumber]
	*/
	/**
	* @typedef DOMParserOptions
	* @property {typeof assign} [assign]
	* The method to use instead of `conventions.assign`, which is used to copy values from
	* `options` before they are used for parsing.
	* @property {typeof DOMHandler} [domHandler]
	* For internal testing: The class for creating an instance for handling events from the SAX
	* parser.
	* *****Warning: By configuring a faulty implementation, the specified behavior can completely
	* be broken.*****.
	* @property {Function} [errorHandler]
	* DEPRECATED! use `onError` instead.
	* @property {function(level:ErrorLevel, message:string, context: DOMHandler):void}
	* [onError]
	* A function invoked for every error that occurs during parsing.
	*
	* If it is not provided, all errors are reported to `console.error`
	* and only `fatalError`s are thrown as a `ParseError`,
	* which prevents any further processing.
	* If the provided method throws, a `ParserError` is thrown,
	* which prevents any further processing.
	*
	* Be aware that many `warning`s are considered an error that prevents further processing in
	* most implementations.
	* @property {boolean} [locator=true]
	* Configures if the nodes created during parsing will have a `lineNumber` and a `columnNumber`
	* attribute describing their location in the XML string.
	* Default is true.
	* @property {(string) => string} [normalizeLineEndings]
	* used to replace line endings before parsing, defaults to exported `normalizeLineEndings`,
	* which normalizes line endings according to <https://www.w3.org/TR/xml11/#sec-line-ends>,
	* including some Unicode "newline" characters.
	* @property {Object} [xmlns]
	* The XML namespaces that should be assumed when parsing.
	* The default namespace can be provided by the key that is the empty string.
	* When the `mimeType` for HTML, XHTML or SVG are passed to `parseFromString`,
	* the default namespace that will be used,
	* will be overridden according to the specification.
	* @see {@link normalizeLineEndings}
	*/
	/**
	* The DOMParser interface provides the ability to parse XML or HTML source code from a string
	* into a DOM `Document`.
	*
	* ***xmldom is different from the spec in that it allows an `options` parameter,
	* to control the behavior***.
	*
	* @class
	* @param {DOMParserOptions} [options]
	* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
	* @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-parsing-and-serialization
	*/
	function DOMParser(options) {
		options = options || {};
		if (options.locator === void 0) options.locator = true;
		/**
		* The method to use instead of `conventions.assign`, which is used to copy values from
		* `options`
		* before they are used for parsing.
		*
		* @type {conventions.assign}
		* @private
		* @see {@link conventions.assign}
		* @readonly
		*/
		this.assign = options.assign || conventions.assign;
		/**
		* For internal testing: The class for creating an instance for handling events from the SAX
		* parser.
		* *****Warning: By configuring a faulty implementation, the specified behavior can completely
		* be broken*****.
		*
		* @type {typeof DOMHandler}
		* @private
		* @readonly
		*/
		this.domHandler = options.domHandler || DOMHandler;
		/**
		* A function that is invoked for every error that occurs during parsing.
		*
		* If it is not provided, all errors are reported to `console.error`
		* and only `fatalError`s are thrown as a `ParseError`,
		* which prevents any further processing.
		* If the provided method throws, a `ParserError` is thrown,
		* which prevents any further processing.
		*
		* Be aware that many `warning`s are considered an error that prevents further processing in
		* most implementations.
		*
		* @type {function(level:ErrorLevel, message:string, context: DOMHandler):void}
		* @see {@link onErrorStopParsing}
		* @see {@link onWarningStopParsing}
		*/
		this.onError = options.onError || options.errorHandler;
		if (options.errorHandler && typeof options.errorHandler !== "function") throw new TypeError("errorHandler object is no longer supported, switch to onError!");
		else if (options.errorHandler) options.errorHandler("warning", "The `errorHandler` option has been deprecated, use `onError` instead!", this);
		/**
		* used to replace line endings before parsing, defaults to `normalizeLineEndings`
		*
		* @type {(string) => string}
		* @readonly
		*/
		this.normalizeLineEndings = options.normalizeLineEndings || normalizeLineEndings;
		/**
		* Configures if the nodes created during parsing will have a `lineNumber` and a
		* `columnNumber`
		* attribute describing their location in the XML string.
		* Default is true.
		*
		* @type {boolean}
		* @readonly
		*/
		this.locator = !!options.locator;
		/**
		* The default namespace can be provided by the key that is the empty string.
		* When the `mimeType` for HTML, XHTML or SVG are passed to `parseFromString`,
		* the default namespace that will be used,
		* will be overridden according to the specification.
		*
		* @type {Readonly<Object>}
		* @readonly
		*/
		this.xmlns = this.assign(Object.create(null), options.xmlns);
	}
	/**
	* Parses `source` using the options in the way configured by the `DOMParserOptions` of `this`
	* `DOMParser`. If `mimeType` is `text/html` an HTML `Document` is created,
	* otherwise an XML `Document` is created.
	*
	* __It behaves different from the description in the living standard__:
	* - Uses the `options` passed to the `DOMParser` constructor to modify the behavior.
	* - Any unexpected input is reported to `onError` with either a `warning`,
	* `error` or `fatalError` level.
	* - Any `fatalError` throws a `ParseError` which prevents further processing.
	* - Any error thrown by `onError` is converted to a `ParseError` which prevents further
	* processing - If no `Document` was created during parsing it is reported as a `fatalError`.
	* - A `DOMException` raised while building the DOM (e.g. an unbound namespace prefix) is
	* reported as a `fatalError` and rethrown as a `ParseError` with the `DOMException` as its
	* `cause`.
	* *****Warning: By configuring a faulty DOMHandler implementation,
	* the specified behavior can completely be broken*****.
	*
	* @param {string} source
	* The XML mime type only allows string input!
	* @param {string} [mimeType='application/xml']
	* the mimeType or contentType of the document to be created determines the `type` of document
	* created (XML or HTML)
	* @returns {Document}
	* The `Document` node.
	* @throws {ParseError}
	* for any `fatalError` or anything that is thrown by `onError`
	* @throws {TypeError}
	* for any invalid `mimeType`
	* @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString
	* @see https://html.spec.whatwg.org/#dom-domparser-parsefromstring-dev
	*/
	DOMParser.prototype.parseFromString = function(source, mimeType) {
		if (!isValidMimeType(mimeType)) throw new TypeError("DOMParser.parseFromString: the provided mimeType \"" + mimeType + "\" is not valid.");
		var defaultNSMap = this.assign(Object.create(null), this.xmlns);
		var entityMap = entities.XML_ENTITIES;
		var defaultNamespace = defaultNSMap[""] || null;
		if (hasDefaultHTMLNamespace(mimeType)) {
			entityMap = entities.HTML_ENTITIES;
			defaultNamespace = NAMESPACE.HTML;
		} else if (mimeType === MIME_TYPE.XML_SVG_IMAGE) defaultNamespace = NAMESPACE.SVG;
		defaultNSMap[""] = defaultNamespace;
		defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
		var domBuilder = new this.domHandler({
			mimeType,
			defaultNamespace,
			onError: this.onError
		});
		var locator = this.locator ? {} : void 0;
		if (this.locator) domBuilder.setDocumentLocator(locator);
		var sax = new XMLReader();
		sax.errorHandler = domBuilder;
		sax.domBuilder = domBuilder;
		if (!conventions.isHTMLMimeType(mimeType) && typeof source !== "string") sax.errorHandler.fatalError("source is not a string");
		sax.parse(this.normalizeLineEndings(String(source)), defaultNSMap, entityMap);
		if (!domBuilder.doc.documentElement) sax.errorHandler.fatalError("missing root element");
		return domBuilder.doc;
	};
	/**
	* @typedef DOMHandlerOptions
	* @property {string} [mimeType=MIME_TYPE.XML_APPLICATION]
	* @property {string | null} [defaultNamespace=null]
	*/
	/**
	* The class that is used to handle events from the SAX parser to create the related DOM
	* elements.
	*
	* Some methods are only implemented as an empty function,
	* since they are (at least currently) not relevant for xmldom.
	*
	* @class
	* @param {DOMHandlerOptions} [options]
	* @see http://www.saxproject.org/apidoc/org/xml/sax/ext/DefaultHandler2.html
	*/
	function DOMHandler(options) {
		var opt = options || {};
		/**
		* The mime type is used to determine if the DOM handler will create an XML or HTML document.
		* Only if it is set to `text/html` it will create an HTML document.
		* It defaults to MIME_TYPE.XML_APPLICATION.
		*
		* @type {string}
		* @see {@link MIME_TYPE}
		* @readonly
		*/
		this.mimeType = opt.mimeType || MIME_TYPE.XML_APPLICATION;
		/**
		* The namespace to use to create an XML document.
		* For the following reasons this is required:
		* - The SAX API for `startDocument` doesn't offer any way to pass a namespace,
		* since at that point there is no way for the parser to know what the default namespace from
		* the document will be.
		* - When creating using `DOMImplementation.createDocument` it is required to pass a
		* namespace,
		* to determine the correct `Document.contentType`, which should match `this.mimeType`.
		* - When parsing an XML document with the `application/xhtml+xml` mimeType,
		* the HTML namespace needs to be the default namespace.
		*
		* @type {string | null}
		* @private
		* @readonly
		*/
		this.defaultNamespace = opt.defaultNamespace || null;
		/**
		* @type {boolean}
		* @private
		*/
		this.cdata = false;
		/**
		* The last `Element` that was created by `startElement`.
		* `endElement` sets it to the `currentElement.parentNode`.
		*
		* Note: The sax parser currently sets it to white space text nodes between tags.
		*
		* @type {Element | Node | undefined}
		* @private
		*/
		this.currentElement = void 0;
		/**
		* The Document that is created as part of `startDocument`,
		* and returned by `DOMParser.parseFromString`.
		*
		* @type {Document | undefined}
		* @readonly
		*/
		this.doc = void 0;
		/**
		* The locator is stored as part of setDocumentLocator.
		* It is controlled and mutated by the SAX parser to store the current parsing position.
		* It is used by DOMHandler to set `columnNumber` and `lineNumber`
		* on the DOM nodes.
		*
		* @type {Readonly<Locator> | undefined}
		* @private
		* @readonly (the
		* sax parser currently sometimes set's it)
		*/
		this.locator = void 0;
		/**
		* @type {function (level:ErrorLevel ,message:string, context:DOMHandler):void}
		* @readonly
		*/
		this.onError = opt.onError;
	}
	function position(locator, node) {
		node.lineNumber = locator.lineNumber;
		node.columnNumber = locator.columnNumber;
	}
	DOMHandler.prototype = {
		/**
		* Either creates an XML or an HTML document and stores it under `this.doc`.
		* If it is an XML document, `this.defaultNamespace` is used to create it,
		* and it will not contain any `childNodes`.
		* If it is an HTML document, it will be created without any `childNodes`.
		*
		* @see http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
		*/
		startDocument: function() {
			var impl = new DOMImplementation();
			this.doc = isHTMLMimeType(this.mimeType) ? impl.createHTMLDocument(false) : impl.createDocument(this.defaultNamespace, "");
		},
		startElement: function(namespaceURI, localName, qName, attrs) {
			var doc = this.doc;
			var el = doc.createElementNS(namespaceURI, qName || localName);
			var len = attrs.length;
			appendElement(this, el);
			this.currentElement = el;
			this.locator && position(this.locator, el);
			for (var i = 0; i < len; i++) {
				var namespaceURI = attrs.getURI(i);
				var value = attrs.getValue(i);
				var qName = attrs.getQName(i);
				var attr = doc.createAttributeNS(namespaceURI, qName);
				this.locator && position(attrs.getLocator(i), attr);
				attr.value = attr.nodeValue = value;
				el.setAttributeNode(attr);
			}
		},
		endElement: function(namespaceURI, localName, qName) {
			this.currentElement = this.currentElement.parentNode;
		},
		startPrefixMapping: function(prefix, uri) {},
		endPrefixMapping: function(prefix) {},
		processingInstruction: function(target, data) {
			var ins = this.doc.createProcessingInstruction(target, data);
			this.locator && position(this.locator, ins);
			appendElement(this, ins);
		},
		ignorableWhitespace: function(ch, start, length) {},
		characters: function(chars, start, length) {
			chars = _toString.apply(this, arguments);
			if (chars) {
				if (this.cdata) var charNode = this.doc.createCDATASection(chars);
				else var charNode = this.doc.createTextNode(chars);
				if (this.currentElement) this.currentElement.appendChild(charNode);
				else if (/^\s*$/.test(chars)) this.doc.appendChild(charNode);
				this.locator && position(this.locator, charNode);
			}
		},
		skippedEntity: function(name) {},
		endDocument: function() {
			this.doc.normalize();
		},
		/**
		* Stores the locator to be able to set the `columnNumber` and `lineNumber`
		* on the created DOM nodes.
		*
		* @param {Locator} locator
		*/
		setDocumentLocator: function(locator) {
			if (locator) locator.lineNumber = 0;
			this.locator = locator;
		},
		comment: function(chars, start, length) {
			chars = _toString.apply(this, arguments);
			var comm = this.doc.createComment(chars);
			this.locator && position(this.locator, comm);
			appendElement(this, comm);
		},
		startCDATA: function() {
			this.cdata = true;
		},
		endCDATA: function() {
			this.cdata = false;
		},
		startDTD: function(name, publicId, systemId, internalSubset) {
			var impl = this.doc.implementation;
			if (impl && impl.createDocumentType) {
				var dt = impl.createDocumentType(name, publicId, systemId, internalSubset);
				this.locator && position(this.locator, dt);
				appendElement(this, dt);
				this.doc.doctype = dt;
			}
		},
		reportError: function(level, message) {
			if (typeof this.onError === "function") try {
				this.onError(level, message, this);
			} catch (e) {
				throw new ParseError("Reporting " + level + " \"" + message + "\" caused " + e, this.locator);
			}
			else console.error("[xmldom " + level + "]	" + message, _locator(this.locator));
		},
		/**
		* @see http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
		*/
		warning: function(message) {
			this.reportError("warning", message);
		},
		error: function(message) {
			this.reportError("error", message);
		},
		/**
		* This function reports a fatal error and throws a ParseError.
		*
		* @param {string} message
		* - The message to be used for reporting and throwing the error.
		* @param {Error} [cause]
		* The error that caused this fatal error, preserved as the thrown `ParseError`'s `cause`.
		* @returns {never}
		* This function always throws an error and never returns a value.
		* @throws {ParseError}
		* Always throws a ParseError with the provided message.
		*/
		fatalError: function(message, cause) {
			this.reportError("fatalError", message);
			throw new ParseError(message, this.locator, cause);
		}
	};
	function _locator(l) {
		if (l) return "\n@#[line:" + l.lineNumber + ",col:" + l.columnNumber + "]";
	}
	function _toString(chars, start, length) {
		if (typeof chars == "string") return chars.substr(start, length);
		else {
			if (chars.length >= start + length || start) return new java.lang.String(chars, start, length) + "";
			return chars;
		}
	}
	"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(key) {
		DOMHandler.prototype[key] = function() {
			return null;
		};
	});
	function appendElement(handler, node) {
		if (!handler.currentElement) handler.doc.appendChild(node);
		else handler.currentElement.appendChild(node);
	}
	/**
	* A method that prevents any further parsing when an `error`
	* with level `error` is reported during parsing.
	*
	* @see {@link DOMParserOptions.onError}
	* @see {@link onWarningStopParsing}
	*/
	function onErrorStopParsing(level) {
		if (level === "error") throw "onErrorStopParsing";
	}
	/**
	* A method that prevents any further parsing when any `error` is reported during parsing.
	*
	* @see {@link DOMParserOptions.onError}
	* @see {@link onErrorStopParsing}
	*/
	function onWarningStopParsing() {
		throw "onWarningStopParsing";
	}
	exports.__DOMHandler = DOMHandler;
	exports.DOMParser = DOMParser;
	exports.normalizeLineEndings = normalizeLineEndings;
	exports.onErrorStopParsing = onErrorStopParsing;
	exports.onWarningStopParsing = onWarningStopParsing;
}));
//#endregion
//#region ../../node_modules/.pnpm/@xmldom+xmldom@0.9.12/node_modules/@xmldom/xmldom/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports) => {
	var conventions = require_conventions();
	exports.assign = conventions.assign;
	exports.hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
	exports.isHTMLMimeType = conventions.isHTMLMimeType;
	exports.isValidMimeType = conventions.isValidMimeType;
	exports.MIME_TYPE = conventions.MIME_TYPE;
	exports.NAMESPACE = conventions.NAMESPACE;
	var errors = require_errors();
	exports.DOMException = errors.DOMException;
	exports.DOMExceptionName = errors.DOMExceptionName;
	exports.ExceptionCode = errors.ExceptionCode;
	exports.ParseError = errors.ParseError;
	var dom = require_dom();
	exports.Attr = dom.Attr;
	exports.CDATASection = dom.CDATASection;
	exports.CharacterData = dom.CharacterData;
	exports.Comment = dom.Comment;
	exports.Document = dom.Document;
	exports.DocumentFragment = dom.DocumentFragment;
	exports.DocumentType = dom.DocumentType;
	exports.DOMImplementation = dom.DOMImplementation;
	exports.Element = dom.Element;
	exports.Entity = dom.Entity;
	exports.EntityReference = dom.EntityReference;
	exports.LiveNodeList = dom.LiveNodeList;
	exports.NamedNodeMap = dom.NamedNodeMap;
	exports.Node = dom.Node;
	exports.NodeList = dom.NodeList;
	exports.Notation = dom.Notation;
	exports.ProcessingInstruction = dom.ProcessingInstruction;
	exports.Text = dom.Text;
	exports.XMLSerializer = dom.XMLSerializer;
	var domParser = require_dom_parser();
	exports.DOMParser = domParser.DOMParser;
	exports.normalizeLineEndings = domParser.normalizeLineEndings;
	exports.onErrorStopParsing = domParser.onErrorStopParsing;
	exports.onWarningStopParsing = domParser.onWarningStopParsing;
}));
//#endregion
export { require_lib as t };
