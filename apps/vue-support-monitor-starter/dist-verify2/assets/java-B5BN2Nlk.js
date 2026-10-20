//#region ../../node_modules/.pnpm/highlight.js@11.12.0/node_modules/highlight.js/es/languages/java.js
var decimalDigits = "[0-9](_*[0-9])*";
var frac = `\\.(${decimalDigits})`;
var hexDigits = "[0-9a-fA-F](_*[0-9a-fA-F])*";
var NUMERIC = {
	className: "number",
	variants: [
		{ begin: `(\\b(${decimalDigits})((${frac})|\\.)?|(${frac}))[eE][+-]?(${decimalDigits})[fFdD]?\\b` },
		{ begin: `\\b(${decimalDigits})((${frac})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
		{ begin: `(${frac})[fFdD]?\\b` },
		{ begin: `\\b(${decimalDigits})[fFdD]\\b` },
		{ begin: `\\b0[xX]((${hexDigits})\\.?|(${hexDigits})?\\.(${hexDigits}))[pP][+-]?(${decimalDigits})[fFdD]?\\b` },
		{ begin: "\\b(0|[1-9](_*[0-9])*)[lL]?\\b" },
		{ begin: `\\b0[xX](${hexDigits})[lL]?\\b` },
		{ begin: "\\b0(_*[0-7])*[lL]?\\b" },
		{ begin: "\\b0[bB][01](_*[01])*[lL]?\\b" }
	],
	relevance: 0
};
/**
* Allows recursive regex expressions to a given depth
*
* ie: recurRegex("(abc~~~)", /~~~/g, 2) becomes:
* (abc(abc(abc)))
*
* @param {string} re
* @param {RegExp} substitution (should be a g mode regex)
* @param {number} depth
* @returns {string}``
*/
function recurRegex(re, substitution, depth) {
	if (depth === -1) return "";
	return re.replace(substitution, (_) => {
		return recurRegex(re, substitution, depth - 1);
	});
}
/** @type LanguageFn */
function java(hljs) {
	const regex = hljs.regex;
	const JAVA_IDENT_RE = "[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*";
	const ARRAY_BRACKETS_OPTIONAL_RE = "(?:(?:\\s*\\[\\s*])+)?";
	const TYPE_ARGS_OPTIONAL_RE = recurRegex("(?:\\s*<\\s*(?:\\?(?:\\s+(?:extends|super)\\s+[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*<@@@>(?:(?:\\s*\\[\\s*])+)?)?|[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*<@@@>(?:(?:\\s*\\[\\s*])+)?)(?:\\s*,\\s*(?:\\?(?:\\s+(?:extends|super)\\s+[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*<@@@>(?:(?:\\s*\\[\\s*])+)?)?|[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*<@@@>(?:(?:\\s*\\[\\s*])+)?))*\\s*>)?", /<@@@>/g, 2);
	const KEYWORDS = {
		keyword: [
			"synchronized",
			"abstract",
			"private",
			"var",
			"static",
			"if",
			"const ",
			"for",
			"while",
			"strictfp",
			"finally",
			"protected",
			"import",
			"native",
			"final",
			"void",
			"enum",
			"else",
			"break",
			"transient",
			"catch",
			"instanceof",
			"volatile",
			"case",
			"assert",
			"package",
			"default",
			"public",
			"try",
			"switch",
			"continue",
			"throws",
			"protected",
			"public",
			"private",
			"module",
			"requires",
			"exports",
			"do",
			"sealed",
			"yield",
			"permits",
			"goto",
			"when"
		],
		literal: [
			"false",
			"true",
			"null"
		],
		type: [
			"char",
			"boolean",
			"long",
			"float",
			"int",
			"byte",
			"short",
			"double"
		],
		built_in: ["super", "this"]
	};
	const ANNOTATION = {
		className: "meta",
		begin: "@[À-ʸa-zA-Z_$][À-ʸa-zA-Z_$0-9]*",
		contains: [{
			begin: /\(/,
			end: /\)/,
			contains: ["self"]
		}]
	};
	const PARAMS = {
		className: "params",
		begin: /\(/,
		end: /\)/,
		keywords: KEYWORDS,
		relevance: 0,
		contains: [hljs.C_BLOCK_COMMENT_MODE],
		endsParent: true
	};
	return {
		name: "Java",
		aliases: ["jsp"],
		keywords: KEYWORDS,
		illegal: /<\/|#/,
		contains: [
			hljs.COMMENT("/\\*\\*", "\\*/", {
				relevance: 0,
				contains: [{
					begin: /\w+@/,
					relevance: 0
				}, {
					className: "doctag",
					begin: "@[A-Za-z]+"
				}]
			}),
			{
				begin: /import java\.[a-z]+\./,
				keywords: "import",
				relevance: 2
			},
			hljs.C_LINE_COMMENT_MODE,
			hljs.C_BLOCK_COMMENT_MODE,
			{
				begin: /"""/,
				end: /"""/,
				className: "string",
				contains: [hljs.BACKSLASH_ESCAPE]
			},
			hljs.APOS_STRING_MODE,
			hljs.QUOTE_STRING_MODE,
			{
				match: [
					/\b(?:class|interface|enum|extends|implements|new)/,
					/\s+/,
					JAVA_IDENT_RE
				],
				className: {
					1: "keyword",
					3: "title.class"
				}
			},
			{
				match: /non-sealed/,
				scope: "keyword"
			},
			{
				beginKeywords: "new throw return else yield assert",
				relevance: 0
			},
			{
				begin: [
					JAVA_IDENT_RE,
					regex.concat(TYPE_ARGS_OPTIONAL_RE, ARRAY_BRACKETS_OPTIONAL_RE, /\s+/),
					JAVA_IDENT_RE,
					ARRAY_BRACKETS_OPTIONAL_RE,
					/\s*/,
					/=(?!=)/
				],
				className: {
					1: "type",
					3: "variable",
					6: "operator"
				}
			},
			{
				begin: [
					/record/,
					/\s+/,
					JAVA_IDENT_RE
				],
				className: {
					1: "keyword",
					3: "title.class"
				},
				contains: [
					PARAMS,
					hljs.C_LINE_COMMENT_MODE,
					hljs.C_BLOCK_COMMENT_MODE
				]
			},
			{
				begin: [
					JAVA_IDENT_RE,
					regex.concat(TYPE_ARGS_OPTIONAL_RE, ARRAY_BRACKETS_OPTIONAL_RE, /\s+/),
					JAVA_IDENT_RE,
					/\s*(?=\()/
				],
				className: {
					1: "type",
					3: "title.function"
				},
				keywords: KEYWORDS,
				contains: [
					{
						className: "params",
						begin: /\(/,
						end: /\)/,
						keywords: KEYWORDS,
						relevance: 0,
						contains: [
							ANNOTATION,
							hljs.APOS_STRING_MODE,
							hljs.QUOTE_STRING_MODE,
							NUMERIC,
							hljs.C_BLOCK_COMMENT_MODE
						]
					},
					hljs.C_LINE_COMMENT_MODE,
					hljs.C_BLOCK_COMMENT_MODE
				]
			},
			NUMERIC,
			ANNOTATION
		]
	};
}
//#endregion
export { java as default };
